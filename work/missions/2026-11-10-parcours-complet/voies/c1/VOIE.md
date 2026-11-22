# Voie c1 — Mesurer n'écrit rien à l'ouverture (VB-2) ; liste des catégories à 2 lignes (PC-3) (mission 2026-11-10-parcours-complet)

- Agent : auteur · Modèle : sonnet · Plafond : 120 tours · Décideur : pilote
- Accord (10.11) : « Oui et oui et tous sauf 4 ».
- Lis : `CLAUDE.md`, `cerveau/LECONS.md` (L11, L13, L17, L29), `.claude/rules/affinee-frontend.md`, `DESIGN.md` ;
  `work/missions/2026-11-10-brassin-mesures/voies/e1/RESULTAT.md` (VB-2 : POST saveBrewSession 409 en ouvrant Mesurer depuis une case
  « ? » sur un brassin en cours) ; `work/missions/BUGS.md` (VB-2, PC-3) ; `../b2/RESULTAT.md` (PC-3 : Combobox de « Nouvel article » à 2
  lignes visibles à 390 en feuille courte).
- Base : tag `en-ligne/2026-11-10-mesures` (en ligne). `git worktree add <os.tmpdir()>/c1-wt -b c1/parcours en-ligne/2026-11-10-mesures`,
  `node_modules` par jonction vers `C:/Users/mrspa/AppData/Local/Temp/deploy-bc70/node_modules`.

## Objectif
Un test qui échoue sur le tag avant chaque correction (L13), à la cause :
1. **VB-2** : ouvrir Mesurer (case « ? », « relevé ? », pied « Mesurer »), toucher la piste, fermer par × ne doit déclencher aucune
   écriture de session (aucun appel `saveBrewSession`, aucun changement de l'état persistant) ; seul Enregistrer écrit. Trouve quel état
   persistant change à l'ouverture (piste : `openCapture` › `navigate` si consultation, `requestedReading`, aire, étape…). Test qui
   espionne l'envoi.
2. **PC-3** : le `Combobox` partagé montre au moins 5 options visibles à 390 dans une feuille courte (au-dessus du clavier si besoin),
   sans casser ses autres usages ; test de hauteur ou d'options visibles, capture Chrome tactile 390.

## Contrôles
- `npx tsc --noEmit -p .` ; `npx vitest run tests/unit tests/integration --reporter=dot > work/missions/2026-11-10-parcours-complet/voies/c1/tests.txt`
  (les 11 rouges déjà sur le tag : fuzzSaisie, recipeAiWorkflow, recipeEditing, designTokens, virgule-transversale ; zéro nouveau) ;
  `VITE_HOP_V4=on npx vite build` vert.
- Captures Chrome réel (banc local) 390 tactile : Combobox ouvert avant/après ; réseau espionné à l'ouverture de Mesurer. Toutes ouvertes.

## Possède
Le worktree `c1-wt`, branche `c1/parcours` ; `work/missions/2026-11-10-parcours-complet/voies/c1/**`. Pas de `src/services/enrichissement*`
(voie n1). Aucun déploiement, aucune donnée réelle, aucun appel Gemini. Fichiers de travail : OWNS ou os.tmpdir().

## Rendre
`RESULTAT.md` au fil (tous les 5 éléments). À 150 k : « REPRISE : <fichier> ». Réponse finale : une ligne avec le sha de `c1/parcours`.
