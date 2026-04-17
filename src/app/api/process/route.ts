import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const maxDuration = 300; 

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  let documentId: string | null = null;
  let storagePath: string | null = null;

  try {
    const body = await req.json();
    documentId = body.documentId;
    storagePath = body.storagePath;
  } catch {
    return new Response(JSON.stringify({ 
      error: true, 
      message: "Format de requête invalide.", 
      code: 'ERR_INVALID_REQUEST' 
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  if (!documentId || !storagePath) {
    return new Response(JSON.stringify({ 
      error: true, 
      message: "Identifiants de document manquants.", 
      code: 'ERR_INVALID_REQUEST' 
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: object) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('ERR_UNAUTHORIZED');

        const adminSupabase = createAdminClient();

        const { data: doc, error: docErr } = await adminSupabase
          .from('documents')
          .select('title, source_type')
          .eq('id', documentId)
          .single();

        if (docErr || !doc) throw new Error('ERR_RAG_NO_DATA');

        const { title, source_type } = doc;

        // STEP 1 — Extraction
        send('progress', { step: 'EXTRACTION', message: 'Extraction du texte juridique...' });

        const { data: fileData, error: downloadError } = await adminSupabase.storage
          .from('documents')
          .download(storagePath);

        if (downloadError || !fileData) throw new Error('Impossible de charger le fichier source.');

        const pdfModule = await import('pdf-parse');
        const PDFParser = pdfModule.PDFParse;

        const path = await import('path');
        const { pathToFileURL } = await import('url');
        const workerPath = path.join(process.cwd(), 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.mjs');
        const workerUrl = pathToFileURL(workerPath).toString();
        PDFParser.setWorker(workerUrl);

        const buffer  = Buffer.from(await fileData.arrayBuffer());
        const parser = new PDFParser({ data: buffer });
        const pdfData = await parser.getText();
        const rawText = pdfData.text?.trim();
        await parser.destroy();
        
        if (!rawText) throw new Error('Aucun texte exploitable n\'a été trouvé dans le document.');

        // STEP 2 — Chunking
        send('progress', { step: 'CHUNKING', message: 'Analyse de la structure...' });

        const splitter = new RecursiveCharacterTextSplitter({
          chunkSize:    1000,
          chunkOverlap: 200,
        });
        const chunks = await splitter.createDocuments([rawText]);

        // STEP 3 — Embedding
        send('progress', {
          step:    'EMBEDDING',
          message: `Indexation de ${chunks.length} segments...`,
        });

        const BATCH_SIZE = 50; 
        let processed = 0;

        for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
          const batch = chunks.slice(i, i + BATCH_SIZE);
          const enrichedTexts = batch.map((c) =>
            `Titre: ${title}\nSource: ${source_type}\n\n${c.pageContent}`
          );

          const response = await ai.models.embedContent({
            model:  'gemini-embedding-001',
            contents:             enrichedTexts,
            // @ts-ignore
            outputDimensionality: 3072,
          });

          const embeddingsArray = (response.embeddings && Array.isArray(response.embeddings)) 
            ? response.embeddings 
            : (response.embeddings ? [response.embeddings] : []);

          const dbChunks = batch.map((chunk: any, idx: number) => ({
            document_id: documentId,
            content:     enrichedTexts[idx],
            embedding:   (embeddingsArray[idx] as any)?.values || [],
            metadata: { title, source_type, chunkIndex: i + idx },
          }));

          const { error: chunkError } = await adminSupabase.from('document_chunks').insert(dbChunks);
          if (chunkError) throw new Error('Erreur lors de l\'enregistrement des vecteurs.');

          processed += batch.length;
          send('progress', {
            step:    'EMBEDDING_PROGRESS',
            message: `Traitement en cours : ${processed}/${chunks.length}`,
            percent: Math.round((processed / chunks.length) * 100),
          });
        }

        // STEP 4 — Ready
        await adminSupabase.from('documents').update({ status: 'ready' }).eq('id', documentId);

        send('done', { message: `Le document est maintenant indexé et prêt.` });
        controller.close();

      } catch (error: any) {
        console.error('[PROCESS_STREAM_ERROR]', error);
        
        // Final status update
        try {
          const adminSupabase = createAdminClient();
          if (documentId) await adminSupabase.from('documents').update({ status: 'error' }).eq('id', documentId);
        } catch (_) {}

        // Professional message transform
        let professionalMessage = "Une erreur technique est survenue durant l'indexation.";
        if (error.message === 'ERR_UNAUTHORIZED') professionalMessage = "Session expirée.";
        if (error.message === 'ERR_RAG_NO_DATA') professionalMessage = "Le document est introuvable.";
        if (error.message.includes('texte exploitable')) professionalMessage = error.message;

        send('error', { message: professionalMessage, code: 'ERR_PROCESS_FAILED' });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
    },
  });
}
