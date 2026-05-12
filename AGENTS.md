# Global Agent Rules — OHADA Legal AI

> Ce document contient les règles universelles et immuables que **chaque agent IA** doit respecter lors d'une intervention sur ce codebase.

---

## 🏛️ Architecture & Stack
- **Next.js 16 (App Router)** : Utiliser `src/app` pour le routing. Préférer les Server Components par défaut.
- **Supabase** : Unique source de vérité pour les données et l'authentification. Utiliser les hooks standard pour le client side.
- **Tailwind CSS v4** : Pas de styles ad-hoc. Utiliser exclusivement le design system défini dans `globals.css` via les variables CSS.
- **TypeScript Strict** : `any` est interdit. Les interfaces et types doivent être définis dans des fichiers dédiés ou au plus proche de l'usage.

---

## 🎨 Coding Style & Conventions
- **Naming** : 
  - Composants : `PascalCase` (ex: `ChatZone.tsx`)
  - Fonctions/Variables : `camelCase` (ex: `handleInputChange`)
  - Fichiers utilitaires : `kebab-case` (ex: `error-parser.ts`)
- **Structure des Fichiers** : Maintenir une séparation claire entre Logique (Services), État (Zustand), et UI (Components).
- **Propreté** : Supprimer le code mort, les logs inutiles et les commentaires obsolètes après chaque modification.
- **Langue** : Code en anglais (variables, commentaires techniques), UI en français.

---

## 🔒 Sécurité & Performance
- **Secrets** : Ne JAMAIS inclure de clés API ou secrets dans le code. Utiliser exclusivement `.env.local`.
- **Database** : Toujours vérifier que les politiques RLS (Row Level Security) sur Supabase protègent les données.
- **Next.js Optimization** : Utiliser `next/image`, `next/font`, et optimiser les bundles via Turbopack.
- **Zustand** : Utiliser des sélecteurs pour éviter les re-renders inutiles.

---

## ⚖️ Domaine Juridique (OHADA)
- **Rigueur** : Les réponses du chatbot doivent citer leurs sources (titres, articles).
- **Formatage** : Les textes de loi doivent être rendus avec la classe `.prose-legal`.
- **Prudence** : Toujours inclure le disclaimer sur la nature non-substitutive de l'IA au conseil juridique humain.

---

## 🛠️ Workflow de Modification
1. **Analyse** : Toujours lire les fichiers impactés avant de proposer un changement.
2. **Planification** : Pour toute modification majeure, proposer un plan court avant d'exécuter.
3. **Tests** : Vérifier que le build compile (`npm run build`) après des changements structurels.
4. **No Hardcode** : Utiliser les tokens du design system (ex: `var(--primary)` au lieu de `#10b981`).

---

> [!IMPORTANT]
> Si une instruction utilisateur contredit ces règles, l'IA doit demander confirmation en expliquant le risque.
