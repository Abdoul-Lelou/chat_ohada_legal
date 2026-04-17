import { createClient } from '@/lib/supabase/server';
import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    // 0. Environment Validation
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("Missing GEMINI_API_KEY");
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("Missing ANTHROPIC_API_KEY");
    }

    const { messages, conversationId } = await req.json();

    const latestMessage = messages[messages.length - 1]?.content;
    if (!latestMessage) {
      return new Response(JSON.stringify({ error: 'Missing message' }), { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // =========================================================================
    // STEP 1 — Embed logic (Forced 768 dim to match DB)
    // =========================================================================
    const embedResponse = await ai.models.embedContent({
      model:                'gemini-embedding-001',
      contents:             latestMessage,
      outputDimensionality: 768,
    });

    const queryEmbedding = Array.isArray(embedResponse.embeddings)
      ? embedResponse.embeddings[0]?.values ?? []
      : embedResponse.embedding?.values ?? [];

    // 🧪 DEBUG OBLIGATOIRE
    console.log("--- DEBUG RAG ---");
    console.log("Embedding length:", queryEmbedding.length);

    // =========================================================================
    // STEP 2 — RAG Match Logic with Fallback
    // =========================================================================
    const { data: candidates, error: matchError } = await supabase.rpc(
      'match_document_chunks',
      {
        query_embedding:  queryEmbedding,
        match_threshold:  0.30,
        match_count:      10,
      }
    );

    if (matchError) console.error('Vector search error:', matchError);

    let filtered = (candidates ?? []).filter((c: any) => c.similarity > 0.5);
    if (filtered.length === 0) {
      console.log("⚠️ Fallback RAG activé");
      filtered = (candidates ?? []).slice(0, 3);
    }

    const topChunks = filtered.slice(0, 3);
    console.log("Top scores:", (candidates ?? []).map((c: any) => c.similarity.toFixed(4)));

    // =========================================================================
    // STEP 3 — Structured Context & Prompt
    // =========================================================================
    const context = topChunks.map((c: any) => `
Source: ${c.metadata?.title || "Document juridique OHADA"}

Contenu:
${c.content.trim()}
`).join("\n\n---\n\n");

    const systemPrompt = `Tu es un assistant juridique spécialisé en droit OHADA.

### 🔒 RÈGLES STRICTES — RÉPONSES JURIDIQUES (OHADA)

### 1. INTERDICTION ABSOLUE D’INVENTER
* Tu ne dois **JAMAIS inventer** un article, une jurisprudence ou une règle juridique.
* Si l’information n’est pas dans ta base → tu dis clairement :
  > "Cette information n’est pas disponible dans la base fournie."

---

### 2. FIDÉLITÉ STRICTE AUX DOCUMENTS
* Tu dois te limiter **UNIQUEMENT** aux documents fournis.
* Tu ne dois **PAS compléter**, **reconstituer** ou **deviner** un texte incomplet.
* Si un article est partiel → tu l’indiques et tu t’arrêtes.

---

### 3. CITATIONS
* Tu ne dois citer un texte que s’il est **réellement présent** dans la base.
* Interdiction de :
  * reformuler en le présentant comme "mot pour mot"
  * compléter une citation manquante
* Si la citation est partielle → mentionne : "extrait incomplet".

---

### 4. SIMPLICITÉ ET CLARTÉ
* Réponses **courtes, claires et précises**
* Évite :
  * les longs tableaux inutiles
  * les schémas excessifs
  * les répétitions
* Va directement à l’essentiel

---

### 5. PAS DE SURCHARGE
* Ne donne **QUE** ce qui répond à la question
* N’ajoute pas :
  * d’analyses non demandées
  * de propositions inutiles
  * de développements hors sujet

---

### 6. TRANSPARENCE
* Si tu n’es pas sûr → dis-le
* Si l’information est absente → dis-le
* Si le texte est incomplet → dis-le

---

### ✅ OBJECTIF
Fournir des réponses :
* fiables
* vérifiables
* sans hallucination
* sans surcharge`;

    const augmentedMessages = [...messages.slice(0, -1), {
      role: "user",
      content: `CONTEXTE :\n${context || "Aucun document trouvé."}\n\nQUESTION :\n${latestMessage}`
    }];

    // =========================================================================
    // STEP 4 — Stream with Anthropic Claude (Single Provider)
    // =========================================================================
    // Prepare sources metadata to send via header
    const sourcesHeader = Buffer.from(JSON.stringify(
      topChunks.map((c: any) => ({
        title: c.metadata?.title || "Document juridique",
        id: c.id
      }))
    )).toString('base64');

    const result = streamText({
      model:  anthropic('claude-sonnet-4-6'), // Stable model
      system: systemPrompt,
      messages: augmentedMessages,
      async onFinish({ text }) {
        if (conversationId && user) {
          // 1. Save messages
          await supabase.from('messages').insert([
            { conversation_id: conversationId, role: 'user', content: latestMessage },
            { conversation_id: conversationId, role: 'assistant', content: text, 
              cited_sources: topChunks.map(m => ({ id: m.id, metadata: m.metadata })) 
            },
          ]);

          // 2. 🔥 Auto-name: update title if default
          const { data: conv } = await supabase
            .from('conversations')
            .select('title')
            .eq('id', conversationId)
            .single();

          if (conv?.title === 'Nouvelle conversation' || !conv?.title) {
            const newTitle = latestMessage.length > 40 ? latestMessage.substring(0, 40) + '...' : latestMessage;
            await supabase
              .from('conversations')
              .update({ title: newTitle })
              .eq('id', conversationId);
          }
        }
      },
    });

    return result.toTextStreamResponse({
      headers: {
        'X-Sources': sourcesHeader,
        'Access-Control-Expose-Headers': 'X-Sources'
      }
    });

  } catch (error: any) {
    console.error('Chat API Error:', error);
    return new Response(JSON.stringify({ error: "Erreur lors de la génération IA" }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
