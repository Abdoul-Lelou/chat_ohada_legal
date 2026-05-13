# SOVEREIGN LEGAL INTELLIGENCE-SLI — Assistant Juridique Intelligent

> SaaS d'assistance juridique IA pour le droit OHADA et guinéen.  
> RAG pipeline sur textes officiels · Chat conversationnel · Multi-modèle IA.

---

## Stack Technique

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript (strict) |
| **Styling** | Tailwind CSS v4 |
| **Auth & DB** | Supabase (Auth, PostgreSQL, pgvector, Storage) |
| **IA Primaire** | Claude (Anthropic) via AI SDK |
| **IA Secondaire** | Gemini (Google) |
| **State** | Zustand + Immer + Persist |
| **UI** | Framer Motion, Lucide Icons, Sonner |
| **RAG** | pdf-parse → embeddings → pgvector → semantic search |

---

## Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # Route Handlers (REST)
│   │   ├── chat/           # POST — Streaming AI chat
│   │   ├── documents/      # CRUD — Document management
│   │   ├── messages/       # GET — Message history
│   │   ├── process/        # POST — PDF ingestion pipeline
│   │   ├── title/          # POST — Auto-generate title
│   │   └── upload/         # POST — File upload to Supabase Storage
│   ├── login/              # Auth page
│   ├── globals.css         # Design system (CSS variables)
│   ├── layout.tsx          # Root layout (fonts, theme, SEO)
│   └── page.tsx            # Main chat page
├── components/             # React components
│   ├── ChatZone.tsx        # Message list + empty state
│   ├── ChatInput.tsx       # Input area
│   ├── Sidebar.tsx         # Navigation + history
│   ├── ConfirmModal.tsx    # Reusable modal
│   ├── UploadModal.tsx     # Document upload UI
│   ├── DocumentIndexModal.tsx  # Document index viewer
│   └── ProcessingStepper.tsx   # Upload progress
├── context/
│   └── ThemeContext.tsx     # Dark/Light theme provider
├── lib/
│   ├── supabase/           # Supabase client (browser + server)
│   ├── chat-utils.ts       # ID generation, title generation
│   ├── error-parser.ts     # Standardized error handling
│   ├── storage-adapter.ts  # Supabase Storage adapter
│   └── utils/              # Shared utilities
├── services/
│   └── chatService.ts      # AI chat orchestration (streaming)
├── store/
│   └── useChatStore.ts     # Zustand global state
└── middleware.ts            # Auth middleware

supabase/
└── schema.sql               # Database schema (tables, RLS, indexes)
```

---

## Démarrage Rapide

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer les variables d'environnement
cp .env.example .env.local
# → Renseigner : SUPABASE_URL, SUPABASE_ANON_KEY, ANTHROPIC_API_KEY, etc.

# 3. Appliquer le schéma Supabase
# → Exécuter supabase/schema.sql dans le SQL Editor Supabase

# 4. Lancer le serveur de développement
npm run dev
```

---

## Configuration IA

Voir les fichiers de configuration dédiés :

| Fichier | Rôle |
|---------|------|
| `AGENTS.md` | Règles universelles pour **toute IA** travaillant sur ce projet |
| `CLAUDE.md` | Directives spécifiques à **Claude Code** (agent principal) |
| `GEMINI.md` | Directives spécifiques à **Gemini** (agent secondaire) |
| `docs/` | Documentation technique approfondie |

---

## Conventions

- **Langue du code** : Anglais (variables, fonctions, composants)
- **Langue de l'UI** : Français
- **Commits** : Conventional Commits (`feat:`, `fix:`, `refactor:`)
- **Branches** : `main` (production), `dev` (développement)

---

## Licence

Propriétaire — Tous droits réservés.
