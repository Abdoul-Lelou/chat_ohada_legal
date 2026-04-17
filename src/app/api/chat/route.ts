import { createClient } from '@/lib/supabase/server';
import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import { GoogleGenAI } from '@google/genai';
import { handleApiError } from '@/lib/utils/api-error';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    // 0. Environment Validation
    if (!process.env.GEMINI_API_KEY || !process.env.ANTHROPIC_API_KEY) {
      throw new Error("ERR_INVALID_REQUEST: Missing API keys in environment");
    }

    const { messages, conversationId } = await req.json();

    const latestMessage = messages[messages.length - 1]?.content;
    if (!latestMessage) {
      throw new Error("ERR_INVALID_REQUEST: Missing message content");
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("ERR_UNAUTHORIZED");

    // =========================================================================
    // STEP 1 — Embed logic (Forced 3072 dim to match USER latest change)
    // =========================================================================
    const embedResponse = await ai.models.embedContent({
      model:                'gemini-embedding-001',
      contents:             latestMessage,
      // @ts-ignore
      outputDimensionality: 3072,
    });

    // const queryEmbedding = Array.isArray(embedResponse.embeddings)
    //   ? embedResponse.embeddings[0]?.values ?? []
    //   : embedResponse.embedding?.values ?? [];
    const queryEmbedding = embedResponse.embeddings 
  ? (Array.isArray(embedResponse.embeddings) 
      ? embedResponse.embeddings[0]?.values 
      : (embedResponse.embeddings as any).values) 
  : [];

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
      filtered = (candidates ?? []).slice(0, 3);
    }

    const topChunks = filtered.slice(0, 3);

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

### 3. GÉNÉRATION DE MODÈLES ET TEMPLATES
À la demande de l'utilisateur, fournis des modèles d'actes (ex : contrat de bail, statuts, clause d'arbitrage) adaptés au droit guinéen et OHADA.

* **Source des données** : Utilise exclusivement les mentions obligatoires et les conditions de validité extraites des documents fournis (RAG) pour structurer le modèle. Si une mention obligatoire est absente des documents, indique-le clairement avec la balise : **[À COMPLÉTER]**.
* **Avertissement obligatoire** (à inclure dans chaque rédaction) :
  > « Ce modèle est fourni à titre informatif et indicatif. Il ne constitue pas un conseil juridique personnalisé et doit être validé par un professionnel du droit avant signature. »
* **Structure** : Les modèles doivent être complets, professionnels et inclure des espaces réservés pour les informations spécifiques (noms, montants, dates, etc.).
* **Consigne de sécurité** : Si les éléments constitutifs de l’acte ne sont pas présents dans la base de connaissance, ne les invente pas. Propose uniquement une structure générale basée sur la pratique OHADA courante, en précisant explicitement qu’il s’agit d’un cadre standard.

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
    const sourcesHeader = Buffer.from(JSON.stringify(
      topChunks.map((c: any) => ({
        title: c.metadata?.title || "Document juridique",
        id: c.id
      }))
    )).toString('base64');

    const result = streamText({
      model:  anthropic('claude-sonnet-4-6'),
      system: systemPrompt,
      messages: augmentedMessages,
      async onFinish({ text }) {
        if (conversationId && user) {
          await supabase.from('messages').insert([
            { conversation_id: conversationId, role: 'user', content: latestMessage },
            { conversation_id: conversationId, role: 'assistant', content: text, 
              cited_sources: topChunks.map((m: any) => ({ id: m.id, metadata: m.metadata })) 
            },
          ]);

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
    return handleApiError(error, 'CHAT_API');
  }
}
