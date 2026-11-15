# État de reprise — écrans transversaux (15.11)

- Objectif : porter 1:1 ses choix (d3p2, m3 avec la période en plage comme Finances, b1 avec un + selon l'écran, r3p2), tester, déployer, jouer en ligne.
- Worktree du port : `C:/Users/mrspa/AppData/Local/Temp/transversaux-port`, branche `claude/ecrans-transversaux`, base `en-ligne/2026-11-14-atelier-uv4`
  (node_modules et functions/node_modules installés ; `.env` et `seedData.ts` copiés).
- Fait (commits dans le worktree) : port-reglages (dba2857f, 84e4f5ff, fb19c76a), port-feuilles (7fedee50 ; la vente n'est pas portée : la caisse v3a
  reste), port-b1 (fbdaa4d4, b4a125e3, ffe868e8 ; ET-PLUS OK), port-m3 (8b17e2e7, reprise en cours : plage de Finances, tests d'en-tête, captures,
  commit de la ligne BrewerActivity), port-r3 (f2760dff ; reste build, captures, planches : DEMANDE EXECUTANT de port-r3/RESULTAT.md).
- 15.11 : b1r refusée (« certaines actions doivent toujours être possible… Et le bouton doit toujours être flottant ») → voie-r2-b1 faite (b1s-a conseillée, b1s-c avec retouches, b1s-b REJET), page https://claude.ai/artifact/E3MHXvErduH8FKH2NtzBpf → retouche de port-b1 vers b1s-a (+ flottant aux deux largeurs, commun toujours là, écran en tête).
  port-m3 : plage de Finances écrite, tsc vert, NON COMMITÉ ; reste build, suite, captures (DEMANDE EXECUTANT de port-m3/RESULTAT.md), commit.
- Décisions du pilote : vente d3p2 non portée (caisse v3a, choix déployé d'une autre mission) ; dates libres arrondies aux mois dans Finances et dit à l'écran.
- Rouges connus de la suite, déjà rouges sur la base : designTokens, virgule-transversale.
- Reste : fin de port-m3 et port-r3 → critique Opus en test d'écran (vraies pièces, chaque état, 390 tactile et 1280, deux thèmes) → corrections →
  déploiement (copie neuve du dernier tag `en-ligne/*`, cherry-pick des commits, `.env` et `seedData.ts`, tsc, tests, `VITE_HOP_V4=on npm run build`,
  check-no-dev-auth, check-build-flags, check-firebase-config, `firebase deploy --only hosting`, page servie dans Chrome, tag `en-ligne/<date>-transversaux`)
  → jeu en ligne de chaque entrée sur des données « ZZ TEST ».
- Leçon à écrire à la signature : l'inventaire et la base d'un port se prennent sur le dernier tag déployé, pas sur la branche (la vente de d3p2
  était dessinée sur un écran déjà remplacé par la caisse v3a).
