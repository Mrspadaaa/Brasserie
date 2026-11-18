# Voie i1 — inventaire et captures de l'étape « Levure 4/7 » telle qu'elle est aujourd'hui

Agent : executant (Haiku), plafond 40 tours. Lecture du code et captures ; aucun changement de code. Écris RESULTAT.md tôt.

## 1. L'inventaire : `inventaire-levure.md`, dans ce dossier
Même structure que `work/missions/2026-10-31-ecran-fermentescibles/inventaire/inventaire-fermentescibles.md` :
- **L'écran en un coup d'œil** : accès, racine (`src/pages/BrewWizard.tsx`, étape `levure`, l. 466), fichiers propres (`src/ui/Yeast*.tsx`, `yeast-*.css`).
- **Blocs, du haut vers le bas** : tableau numéro | bloc | composant | `fichier:ligne`.
- **Fonctions** : choisir une levure (comment, quel catalogue), la dose (g, sachet, starter), la température, l'atténuation, la floculation,
  comparer deux levures, ce que le bandeau commun montre (OG, FG, ABV ?), le lien vers les houblons (biotransformation) s'il existe.
- **États** : recette sans levure, levure inconnue du catalogue, levure en stock ou non, hors ligne, erreur.
- **Données lues et écrites**, et les **tests** qui couvrent l'étape.
Cite les lignes exactes. Rien d'inventé : un doute s'écrit comme doute. 900 mots au plus.

## 2. Les captures : dans `captures/`
Outil : copie `work/missions/2026-10-31-ecran-fermentescibles/inventaire/capturer-fermentescibles.mjs` dans ce dossier sous le nom
`capturer-levure.mjs`, et adapte-la pour atteindre l'étape Levure (fil d'étapes). Sers l'app depuis `C:/Users/mrspa/AppData/Local/Temp/deploy-bc70`
(commit 48d16402, la version en ligne), avec `?dev-local` : aucun jeton, aucune donnée réelle. Lance le serveur de cette copie sans la modifier,
sur un port libre (pas 5173), et arrête-le à la fin.
- 390 × 844 : l'étape avec une levure choisie (recette de démonstration) ; l'étape sans levure ; le geste « choisir une levure » ouvert ;
  le détail ou la comparaison d'une levure, s'il existe.
- 1280 × 900 : l'étape, levure choisie.
- Une capture de référence de la langue choisie à l'étape 2 : l'étape « Malts/sucres » à 390, remplie (son choix porté, s1 sur p6-b2).
Ouvre chaque capture (L12) et décris-la en une ligne dans RESULTAT.md.

## Possède
`work/missions/2026-11-09-ecran-levure/inventaire/`. Rien dans `src/`, rien dans deploy-bc70 (lu et servi, jamais modifié).
N'écris aucun code par heredoc ni par `node -e`. Pas de `git stash`, aucun commit. Rends une ligne.
