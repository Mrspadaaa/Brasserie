# Voie c3 — les problèmes 5 à 23 de la passe de vision (VB-4 et suivants) (mission 2026-11-10-brassin-mesures)

- Agent : auteur · Modèle : sonnet · Plafond : 150 tours · Décideur : pilote
- Ses mots (10.11) : « C'est toujours assez mauvaise le jour de brassage, c'est quoi ça ??? » ; plus tôt : « utilise les ux, ui booster »,
  « Ça invite pas au mesures… ». Règle n° 1 : z1 puis m2 sont la base ; un cas neuf se range dans un état de z1/m2 (L03), jamais un
  composant neuf ; peu de texte, pas de jargon, rien de coupé, couleur de réussite seulement pour une réussite.
- Lis : `CLAUDE.md`, `cerveau/LECONS.md` (L02, L03, L11, L12, L13, L17), `.claude/rules/affinee-frontend.md`, `DESIGN.md` ;
  `../vj/RESULTAT.md` (23 problèmes, captures `../vj/captures/`, ouvre celles de chaque problème avant d'y toucher) ; `../c2/RESULTAT.md`
  (1 à 4 et le champ coupé déjà réglés sur `c2/curseur`) ; m2 `../../page-v2/img/m2-*`, z1
  `C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/distracted-dewdney-b8bc6e/work/missions/2026-11-10-vue-brassin/page-v0/img/z1-*` et
  `…/port/inventaire-z1.md`.
- Base : branche `c2/curseur` (sha 10f5fd33). `git worktree add <os.tmpdir()>/c3-wt -b c3/jour 10f5fd33`, `node_modules` par jonction vers
  `C:/Users/mrspa/AppData/Local/Temp/deploy-bc70/node_modules`.

## Objectif
Pour chaque problème 5 à 23 de `../vj/RESULTAT.md` : un test qui échoue sur 10f5fd33 avant la correction (L13), corriger à la cause, la
capture après côte à côte avec z1/m2 quand l'écart y est dit. Priorité aux bloquants (5, et tout autre marqué bloquant), puis 7, 8, 9,
14, 15, 16, 17 (levure et clôture : une seule alerte, qui dit le geste en peu de mots et l'ouvre, et s'éteint quand la cause est réglée),
puis le reste. Aussi : la ligne « Température : 96 °C / Relevé rattaché à cette étape. » sous le curseur répète la valeur (m2 : la valeur
une fois, le verdict seul). Un point qui demande un vrai choix de goût (pas un défaut, pas un écart à z1/m2) : ne le tranche pas, écris-le
dans RESULTAT.md sous « À montrer » (le pilote en fera des mini maquettes).

## Contrôles
- `npx tsc --noEmit -p .` ; `npx vitest run tests/unit tests/integration --reporter=dot > work/missions/2026-11-10-brassin-mesures/voies/c3/tests.txt`
  (11 rouges déjà sur le tag : fuzzSaisie, recipeAiWorkflow, recipeEditing, designTokens, virgule-transversale ; zéro nouveau ; en
  arrière-plan si long, attends la fin) ; `VITE_HOP_V4=on npx vite build` vert.
- Captures Chrome réel (banc local ; le script `../vj/jour.mjs` joue la journée) 390 tactile clair et cave, chaque problème avant / après,
  toutes ouvertes, dans `voies/c3/captures/`.

## Possède
Worktree `c3-wt`, branche `c3/jour` ; `work/missions/2026-11-10-brassin-mesures/voies/c3/**`. Aucun déploiement, aucune donnée réelle,
aucun appel Gemini. Fichiers de travail : OWNS ou os.tmpdir().

## Rendre
`RESULTAT.md` au fil (tous les 5 problèmes) : par numéro, cause, correction, test, capture ; « À montrer ». À 150 k : « REPRISE : <fichier> ».
Réponse finale : une ligne avec le sha de `c3/jour`.
