# Voie h3 — Hydrogen (réflexion basse) pour l'analyse du compagnon (aide au brasseur), prêt à déployer (mission 2026-11-14-gemini4)

- Agent : auteur · Modèle : sonnet · Plafond : 150 tours · Décideur : pilote (brasseur, 14.11 : « surtout regarde pour l'aide au brasseur » ; banc g2 :
  Hydrogen@low tient sur 12 cas, juge 0,93 contre 0,87 pour 3.8, coût −26 % ; relecture et recherche restent en 3.8).
- Lis : `../g2/RESULTAT.md` (diff proposé), `../h2/RESULTAT.md` (méthode : partir de ce qui est EN LIGNE, pas de la branche courante),
  `functions/src/models.ts`, `functions/src/brewerHarness.ts`, `functions/src/brewerJobs.ts`, `functions/index` ou `functions/src/index.ts`. Jamais `functions/.env`.

## Objectif
1. Trouver les fonctions Firebase qui exécutent `runBrewerHarness` (analyse du compagnon) et la source en ligne de chacune (`npx firebase functions:list
   --project brasserie-l-affinee --json` : date de `source.storageSource.generation` en µs ; tags `aitask/*`, `en-ligne/*`, `drive/*` ; dernier tag
   `aitask/2026-11-14-hydrogen` = aiTask en ligne). JAMAIS `dispatchBrewerHopAdviceV1` ni `notifyBrewerHopAdviceAnswerV1` dans la liste à déployer.
2. Sur la branche courante : rôle `analysis` du compagnon → `gemini-4-hydrogen` LOW, repli une fois sur 3.8 ; relecture et recherche inchangées.
   Test L13 (rouge sur HEAD, vert après). Commit par chemins.
3. Branche `deploy/h3-compagnon` depuis la source en ligne la plus récente qui contient ces fonctions (de préférence `aitask/2026-11-14-hydrogen`,
   qui a déjà Hydrogen dans `models.ts`, si ces fonctions y sont identiques à leur source en ligne ; sinon dis pourquoi), même changement,
   tsc functions, tests ciblés sans rouge nouveau contre le socle nu, `npm --prefix functions run build`. Dossier neuf `<os.tmpdir()>/deploy-h3`.
   Ne pas commiter `source4-portable-bundle-manifest-01.json`.

## Contrôles
- Tests : `npx vitest run tests/unit/brewerHarness.test.ts tests/unit/brewerFlashLimits.test.ts tests/unit/models* --reporter=dot > work/missions/2026-11-14-gemini4/voies/h3/tests.txt` (sur la branche et sur deploy/h3 ; plus la suite complète contre le socle nu).
- Aucun déploiement, aucun appel Gemini réel, aucun push. Commits terminés par « Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> ».

## Possède
`functions/src/models.ts`, `functions/src/brewerHarness.ts` et leurs tests, le dossier `deploy-h3`, la branche `deploy/h3-compagnon`, `work/missions/2026-11-14-gemini4/voies/h3/**`.

## Rendre
`RESULTAT.md` tenu au fil (après chaque étape ; à 150 k : « REPRISE : <fichier> ») : la commande exacte `firebase deploy --only functions:<a>,functions:<b>` (liste vérifiée), SHA, tests. Une ligne.
