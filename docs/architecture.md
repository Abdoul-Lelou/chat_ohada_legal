# Architecture Technique — SOVEREIGN LEGAL INTELLIGENCE-SLI

## 🏗️ Vue d'ensemble
Le projet est une application web moderne (SaaS) construite sur **Next.js** et **Supabase**, conçue pour fournir une interface conversationnelle fluide avec une intelligence juridique.

## 🧱 Composants du Système

### 1. Frontend (Next.js)
- **Framework** : Next.js 16 (App Router) pour le rendu hybride (SSG/SSR).
- **Gestion d'état** : Zustand pour un état global performant et persistant (historique des chats).
- **UI System** : Tailwind CSS v4 avec un design system basé sur des variables CSS dans `globals.css`.
- **Interactions** : Framer Motion pour les transitions et animations premium.

### 2. Backend (Next.js API & Supabase)
- **API Routes** : Handlers standard pour le traitement des documents, la génération de titres et le chat.
- **Base de données** : PostgreSQL sur Supabase avec `pgvector` pour le RAG.
- **Authentification** : Supabase Auth intégré.
- **Storage** : Supabase Storage pour la gestion des PDF juridiques.

### 3. IA & RAG (Retrieval Augmented Generation)
- **Modèles** : Intégration multi-modèles (Claude, Gemini) via la librairie `ai` (Vercel AI SDK).
- **Pipeline RAG** : 
  1. Ingestion PDF.
  2. Extraction de texte.
  3. Chunking & Embeddings.
  4. Stockage vectoriel.
  5. Recherche sémantique lors de la requête utilisateur.

## 🔄 Flux de Données
1. L'utilisateur envoie un message.
2. Le système recherche des fragments juridiques pertinents dans `pgvector`.
3. Le contexte légal + l'historique sont envoyés à l'IA.
4. La réponse est streamée vers le client via les Server-Sent Events (SSE).

---

## 🚀 Scalabilité
- Utilisation intensive de la mise en cache Next.js.
- Séparation stricte entre les services de données et l'UI.
- Architecture basée sur les politiques RLS pour une sécurité native au niveau de la base de données.
