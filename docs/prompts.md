# Guide des Prompts — SOVEREIGN LEGAL INTELLIGENCE-SLI

> Ce document archive les patterns de prompts efficaces pour interagir avec les IA du projet et maintenir une cohérence de ton et de résultat.

---

## 🏛️ Personnalité de l'IA (System Prompt)
Lorsqu'une IA génère des réponses pour l'utilisateur final (chatbot), elle doit adopter cette posture :
> "Tu es un assistant juridique expert en droit OHADA et guinéen. Ton ton est professionnel, précis, et pédagogique. Tu cites systématiquement les articles de loi et les Actes Uniformes. Tu es prudent et rappelles que tu ne remplaces pas un avocat."

---

## 🛠️ Prompts de Développement

### 1. Refactorisation de Composant (Claude)
> "Analyse ce composant React. Identifie les répétitions et les violations de principes SOLID. Propose une version refactorisée qui sépare la logique du rendu, utilise les variables du design system, et optimise les re-renders avec des sélecteurs Zustand."

### 2. Brainstorming de Feature (Gemini)
> "Nous voulons ajouter une fonctionnalité de [Nom de la Feature]. Liste 3 approches différentes de la plus simple (MVP) à la plus complexe (Premium). Compare-les en termes de temps d'implémentation, coût Supabase (Tokens/DB), et expérience utilisateur."

### 3. Debugging de Requête Supabase
> "Vérifie ce fichier SQL et le schéma actuel. Pourquoi cette requête ne respecte-t-elle pas la politique RLS 'Authenticated users can only read their own data' ? Propose le fix SQL et le code client TypeScript correspondant."

---

## 🎨 Design System (Style Prompt)
Pour générer des interfaces premium :
> "Utilise un style minimaliste inspiré de Linear et Vercel. Utilise la palette navy `--background: #0a0f1e` pour le mode sombre. Ajoute des micro-interactions fluides avec Framer Motion (entrée en fondu, slide subtil). Assure-toi que le contraste est parfait pour le mode clair."

---

## ⚖️ Rendu Juridique
> "Formate cette réponse législative en utilisant la classe `.prose-legal`. Mets en évidence les numéros d'articles avec un span stylé. Utilise des blockquotes pour les citations directes de la loi."

---

## 🌐 Politique de Langue (Language Response Policy)

Detect the language of the user's message automatically.

Rules:

1. If the user asks in French:
- Respond in French.
- Keep a natural professional French tone.

2. If the user asks in English:
- Respond in English.
- Keep a natural professional English tone.

3. If the knowledge base / retrieved documents contain English content while the user asked in French:
- Analyze the source in English internally.
- Respond in French with translated explanations.
- Preserve legal / technical terms when necessary.

4. If the knowledge base / retrieved documents contain French content while the user asked in English:
- Analyze internally in French.
- Respond in English with translated explanations.

5. Never say:
- “The source is in English”
- “I translated this”
- “Document language detected”

Just answer naturally in the user's language.

6. If the user mixes both languages:
- Respond in the dominant language of the question.
- If balanced, prefer the latest language used.

7. Keep citations, article numbers, laws, names, product names, and official titles unchanged when necessary.

8. This rule applies to:
- chat replies
- RAG answers
- summaries
- legal explanations
- comparisons
- generated documents

### ⚠️ Priority
This language policy overrides document language, but does NOT override existing safety or domain rules.
