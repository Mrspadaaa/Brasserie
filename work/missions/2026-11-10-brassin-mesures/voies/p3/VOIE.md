# Voie p3 — porter les cinq choix du jour de brassage (mission 2026-11-10-brassin-mesures)

- Agent : auteur · Modèle : sonnet · Plafond : 150 tours · Décideur : pilote (« continue », 11.11 : défauts réversibles, page ouverte)
- Choix portés : **1C** (sachet, son poids du catalogue avec sa source, et si la dose tient ; la pastille suit la quantité), **2B** à
  l'ébullition et **2C** à l'ensemencement (une ligne « À cru 171 g · 9 g/L · phase ? », aucun jour inventé), **3C** (curseurs densité et
  volume dans la fenêtre de clôture, avec crayon, étalonnage, aide et « Pourquoi maintenant »), **4C** (rappel levure dans « À anticiper »),
  **5C** (chiffres tabulaires de la police du texte, plus de chasse fixe).
- Lis : `CLAUDE.md`, `cerveau/LECONS.md` (L03, L11, L12, L13, L17), `.claude/rules/affinee-frontend.md`, `DESIGN.md` ; la page
  `../../page-v3/index.html` et ses images (ouvre celles des options choisies et des références) ; `../v3/RESULTAT.md` ;
  `../../critique/SYNTHESE-v3.md` ; `../c3/RESULTAT.md` (état du code).
- Base : tag `en-ligne/2026-11-10-rapide` (en ligne). `git worktree add <os.tmpdir()>/p3-wt -b p3/choix en-ligne/2026-11-10-rapide`,
  `node_modules` par jonction vers `C:/Users/mrspa/AppData/Local/Temp/deploy-bc70/node_modules`.

## Objectif
Chaque option portée telle que dessinée (règle n° 1), un test qui échoue sur le tag avant (L13), rien d'autre ne change. Inconnu ≠ 0,
jamais `type="number"`, aucun chiffre inventé (poids du sachet : seulement s'il vient du catalogue, sinon absent).

## Contrôles
- `npx tsc --noEmit -p .` ; `npx vitest run tests/unit tests/integration --reporter=dot > work/missions/2026-11-10-brassin-mesures/voies/p3/tests.txt`
  (rouges déjà sur le tag : fuzzSaisie, recipeAiWorkflow et recipeEditing (instables), designTokens, virgule-transversale ; zéro nouveau ;
  un test d'apparence qui encode l'ancien rendu se met à jour avec sa raison) ; `VITE_HOP_V4=on npx vite build` vert.
- Captures Chrome réel (banc local, `../vj/jour.mjs`) 390 tactile clair et cave, côte à côte avec l'option de la page v3, toutes ouvertes,
  dans `voies/p3/captures/`.

## Possède
Worktree `p3-wt`, branche `p3/choix` ; `work/missions/2026-11-10-brassin-mesures/voies/p3/**`. Aucun déploiement, aucune donnée réelle,
aucun appel Gemini. Fichiers de travail : OWNS ou os.tmpdir().

## Rendre
`RESULTAT.md` au fil (tous les 5 éléments). À 150 k : « REPRISE : <fichier> ». Réponse finale : une ligne avec le sha de `p3/choix`.
