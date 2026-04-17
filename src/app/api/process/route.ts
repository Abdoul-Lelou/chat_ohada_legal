import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const maxDuration = 300; // Chunking + embeddings can be slow

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  // Parse body ONCE — req.json() can only be read once
  let documentId: string | null = null;
  let storagePath: string | null = null;
  try {
    const body = await req.json();
    documentId = body.documentId;
    storagePath = body.storagePath;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400 });
  }

  if (!documentId || !storagePath) {
    return new Response(JSON.stringify({ error: 'documentId and storagePath are required' }), { status: 400 });
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
        if (!user) throw new Error('Unauthorized');

        const adminSupabase = createAdminClient();

        // --- Fetch document metadata (title, source_type) ---
        const { data: doc, error: docErr } = await adminSupabase
          .from('documents')
          .select('title, source_type')
          .eq('id', documentId)
          .single();

        if (docErr || !doc) throw new Error('Document introuvable dans la base');

        const { title, source_type } = doc;

        // =====================================================================
        // STEP 1 — Extract text from PDF stored in Supabase Storage
        // =====================================================================
        send('progress', { step: 'EXTRACTION', message: 'Téléchargement et extraction du texte PDF...' });

        const { data: fileData, error: downloadError } = await adminSupabase.storage
          .from('documents')
          .download(storagePath);

        if (downloadError || !fileData) throw new Error('Impossible de télécharger le fichier depuis le Storage');

        // Dynamically import pdf-parse (v2.4.5 is ESM-only)
        const pdfModule = await import('pdf-parse');
        const PDFParser = pdfModule.PDFParse;

        if (!PDFParser) throw new Error('Le module PDFParse (classe) est introuvable.');

        // Configure worker for Node.js environment to avoid "Cannot find module 'pdf.worker.mjs'"
        const path = await import('path');
        const { pathToFileURL } = await import('url');
        const workerPath = path.join(process.cwd(), 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.mjs');
        
        // On Windows, absolute paths must be valid file:// URLs for the ESM loader
        const workerUrl = pathToFileURL(workerPath).toString();
        PDFParser.setWorker(workerUrl);

        const buffer  = Buffer.from(await fileData.arrayBuffer());
        
        const parser = new PDFParser({ data: buffer });
        const pdfData = await parser.getText();
        const rawText = pdfData.text?.trim();
        
        await parser.destroy();
        
        if (!rawText) throw new Error('Aucun texte extrait du PDF. Le fichier est peut-être scanné.');

        // =====================================================================
        // STEP 2 — Chunking
        // =====================================================================
        send('progress', { step: 'CHUNKING', message: 'Découpage du texte en paragraphes...' });

        const splitter = new RecursiveCharacterTextSplitter({
          chunkSize:    1000,
          chunkOverlap: 200,
        });
        const chunks = await splitter.createDocuments([rawText]);

        send('progress', {
          step:    'CHUNKING_DONE',
          message: `${chunks.length} paragraphes extraits.`,
          total:   chunks.length,
        });

        // =====================================================================
        // STEP 3 — Embedding generation (batched, with title enrichment)
        //
        // Key RAG improvement: prepend document title to every chunk so the
        // vector space naturally clusters chunks by document/topic.
        // =====================================================================
        send('progress', {
          step:    'EMBEDDING',
          message: `Génération des vecteurs pour ${chunks.length} paragraphes...`,
        });

        const BATCH_SIZE = 50; // stay well within Gemini rate limits
        let processed = 0;

        for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
          const batch = chunks.slice(i, i + BATCH_SIZE);

          // Enrich content: title prefix improves semantic clustering
          const enrichedTexts = batch.map((c) =>
            `Titre: ${title}\nSource: ${source_type}\n\n${c.pageContent}`
          );

          const response = await ai.models.embedContent({
            model:  'gemini-embedding-001',
            contents:             enrichedTexts,
            outputDimensionality: 768,
          });

          const embeddingsArray = Array.isArray(response.embeddings)
            ? response.embeddings
            : [response.embedding];

          const dbChunks = batch.map((chunk, idx) => ({
            document_id: documentId,
            content:     enrichedTexts[idx],    // store enriched content
            embedding:   embeddingsArray[idx]?.values || [],
            metadata: {
              title,
              source_type,
              chunkIndex: i + idx,
              // page detection is heuristic — can be improved with pdf.js
              page: chunk.metadata?.loc?.pageNumber ?? null,
            },
          }));

          const { error: chunkError } = await adminSupabase
            .from('document_chunks')
            .insert(dbChunks);

          if (chunkError) throw new Error(`Erreur base de données : ${chunkError.message}`);

          processed += batch.length;
          send('progress', {
            step:    'EMBEDDING_PROGRESS',
            message: `Vecteurs générés : ${processed}/${chunks.length}`,
            percent: Math.round((processed / chunks.length) * 100),
          });
        }

        // =====================================================================
        // STEP 4 — Mark document as ready
        // =====================================================================
        await adminSupabase
          .from('documents')
          .update({ status: 'ready' })
          .eq('id', documentId);

        send('done', { message: `Document "${title}" indexé avec succès. ${chunks.length} paragraphes vectorisés.` });
        controller.close();

      } catch (error: any) {
        console.error('Process Stream Error:', error);

        // Mark document as errored (best-effort, documentId is captured in outer scope)
        try {
          const adminSupabase = createAdminClient();
          if (documentId) {
            await adminSupabase.from('documents').update({ status: 'error' }).eq('id', documentId);
          }
        } catch (_) {}

        send('error', { message: error.message || 'Une erreur interne est survenue' });
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
