# Conventions de Développement — OHADA Legal AI

> Ce document détaille les standards de code pour maintenir une base saine et cohérente.

---

## 🛠️ TypeScript & JavaScript
- **Strict Mode** : Activé. `any` est proscrit. Préférer `unknown` ou des types génériques.
- **Interfaces vs Types** :
  - `interface` pour les objets et contrats publics (extensibles).
  - `type` pour les unions, tuples et alias simples.
- **Enums** : Éviter les `enum` natifs. Utiliser des `const` objects ou des literal types (`'user' | 'assistant'`).

---

## 🎨 React & Next.js
- **Composants** :
  - Un composant par fichier.
  - Utiliser l'extension `.tsx`.
  - Exportation nommée (`export function MyComponent()`).
- **Hooks** :
  - Extraire la logique complexe dans des hooks personnalisés (`useMyLogic`).
  - Respecter l'ordre des hooks (React hooks → Custom hooks).
- **Server Components** : Utiliser par défaut. N'ajouter `'use client'` que si nécessaire (interactivité, hooks client).

---

## 💅 Styling (Tailwind CSS v4)
- **Design System First** : Utiliser les variables CSS définies dans `globals.css` (ex: `text-[var(--primary)]`).
- **Utility-First** : Éviter le CSS arbitraire type `top-[123px]`. Préférer les échelles standard de Tailwind.
- **Organisation** : Trier les classes par : Layout → Spacing → Typography → Colors → Effects.

---

## 🗄️ Supabase & Database
- **Naming** : Tables et colonnes en `snake_case` (standard SQL).
- **Policies** : Chaque table doit avoir une politique RLS explicite.
- **Migrations** : Toutes les modifications de schéma doivent être tracées dans `supabase/schema.sql`.

---

## 📂 Organisation des Fichiers
- **Logic (Services)** : Dans `src/services/`. Contient la logique métier pure et les appels API complexes.
- **UI (Components)** : Dans `src/components/`. Composants réutilisables et atomiques.
- **State (Zustand)** : Dans `src/store/`. Un store par domaine métier.
- **Utils (Lib)** : Dans `src/lib/`. Fonctions pures, parseurs, et adaptateurs.

---

## 📝 Git & Commits
- **Format** : `type(scope): description`
- **Types** :
  - `feat` : Nouvelle fonctionnalité.
  - `fix` : Correction de bug.
  - `refactor` : Changement de code sans impact fonctionnel.
  - `docs` : Documentation.
  - `style` : Formatage, point-virgule, etc. (pas de changement de code).
