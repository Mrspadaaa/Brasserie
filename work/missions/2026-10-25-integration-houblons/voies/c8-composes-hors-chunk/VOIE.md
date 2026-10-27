# Voie c8-composes-hors-chunk — ramener B5 sous 164 ko sans relever le budget

Agent : auteur (Sonnet). Le chargement des données, pas l'écran. La voie s'arrête au code, aux tests, au build et aux mesures. Pour la
suite mécanique, écris une `DEMANDE EXECUTANT :`.

## Le problème
Le budget B5 mesure ce qu'ajoute l'ouverture d'un outil v4. Il est à **164,9 ko gzip pour un plafond de 164 ko** : `profil-simule`,
`hopExtrapolationBootstrap` et `styleSelection` (rejeu de 53306aae, `C:/Users/mrspa/AppData/Local/Temp/rejeu-5330/05c-hop-budget.log`).
f8, r3 et r4 l'ont fait monter de 163,5 ko à 164,9 ko.
- Ce plafond a déjà été relevé deux fois, avec l'accord du brasseur. On ne le relève pas une troisième fois.
- Le brasseur : « Attention au délais ajouter, la Responsive, réactivité ».
- f9 a mesuré que le gros du chunk est `src/data/hopV4/composes-houblon.json` : 811 ko bruts, lus en synchrone. Il est importé par
  `src/domain/hopIndex/v4/pouvoir.ts`, `froid.ts`, `src/ui/hopIndex/comparer/valeurs.ts`, `dryhopper/mesures.ts` et
  `substituer/donnees.ts`.

## Ce qui est demandé
1. Sors `composes-houblon.json` du chunk de B5, par un chargement à part. Vise B5 ≤ 160 ko, pour garder de la marge.
   - Le chargement part avec la préchauffe (`src/ui/hopIndex/precharge.ts`), au montage de l'étape Houblons, bien avant l'ouverture d'un
     outil.
   - L'ouverture d'un outil n'attend pas de façon visible. Mesure, avant et après, le temps entre le toucher et l'outil rendu, ainsi que
     les longues tâches : premier passage à froid et à chaud (L20).
   - Si un outil s'ouvre avant l'arrivée des données, il ne montre jamais un faux zéro ; prends le modèle de `siCataloguePleinArrive`.
2. Le worker (`src/ui/hopIndex/parcours/calcul.worker.ts`) garde ses composés, par le moyen le plus simple : l'import statique reste
   possible dans son propre bundle.
3. Hors ligne : le précache de la PWA inclut le nouveau morceau (vérifie la configuration de Vite PWA et le `dist` construit).
4. Lis d'abord comment B5 est mesuré (`scripts/check-hop-budget.mjs`). Ne change pas ce script ni ses plafonds.

## Critères
- Avec `VITE_HOP_V4=on` : `npm run build`, puis `node scripts/check-hop-budget.mjs --dist dist --chunk-outils profil-simule`. Attendu :
  B5 ≤ 164 ko, mieux ≤ 160 ko. B1 et B2 ne montent pas.
- `npx tsc --noEmit` : sans sortie.
- `npx vitest run tests/unit/hopIndexV4 prototypes/houblons-v4/tests` : vert, avec un test neuf qui couvre le chargement à part : avant
  l'arrivée, pendant, après.
- `node work/missions/2026-10-25-integration-houblons/voies/w1-worker-app/fumee-worker-prod.mjs` : `WORKER PROD OK`.
- `npm run check:hop-perf` et `npx vite-node scripts/eval-hop/f2-perf.ts` : pas de dépassement nouveau (les 6 de la référence restent
  tolérés). Tableau au ms près.
- Contrôle Chrome de l'ouverture d'un outil, rejoué par l'exécutant (`DEMANDE EXECUTANT :`). Pour chacun :
  `node scripts/with_server.mjs --server "npm run dev -- --port P --strictPort" --port P --env VITE_HOP_V4=on -- node <contrôle>`.
  Les contrôles : `tests/integration/controle-ma-biere-app.mjs`, `comparerValeurs.chrome.mjs`, `controle-froid-dryhopper.mjs`,
  `controle-radar-echelles.mjs`.

## Possède
- `src/domain/hopIndex/v4/pouvoir.ts`, `froid.ts`, `profil-simule.ts`, et un module neuf de chargement.
- `src/ui/hopIndex/precharge.ts`, `src/ui/hopIndex/parcours/calcul.worker.ts`.
- Dans `src/ui/hopIndex/comparer/valeurs.ts`, `dryhopper/mesures.ts` et `substituer/donnees.ts` : seulement les lignes qui lisent
  `composes-houblon.json`.
- La configuration PWA de `vite.config.ts`, seulement si le précache l'exige.
- Tes tests neufs, et les tests qu'un chargement asynchrone oblige à adapter.
- `work/missions/2026-10-25-integration-houblons/voies/c8-composes-hors-chunk/`.

**La voie t2 travaille en même temps.** Elle possède `voies.ts`, `departage.ts`, `typicite*.ts`, `intensite.ts`, `donneesWorker.ts`,
`clientWorker.ts`, les états de la maquette. N'y touche pas. Si tu en as besoin, écris-le dans RESULTAT.md (`BESOIN T2 : …`). Avant ton
build final, relis `git status` et `git diff` : les fichiers de t2 bougent.

Ne touche ni à `.codex/`, ni à `source4-portable-bundle-manifest-01.json`, ni à `functions/.env`. Aucun appel Gemini. N'écris aucun code
par heredoc ni par `node -e`. Pas de `git stash`, aucun commit. Écris RESULTAT.md tôt et tiens-le à jour. Rends une ligne.

## Build à part (deux voies en même temps)
Les deux voies construisent dans le même arbre. Construis donc dans ton propre dossier, hors du dépôt :
`VITE_HOP_V4=on npx vite build --outDir C:/Users/mrspa/AppData/Local/Temp/dist-c8`.
Passe-le aux contrôles : `check-hop-budget.mjs --dist <dossier>` et `fumee-worker-prod.mjs --dist=<dossier>`. Garde `npm run build` (avec `tsc`)
pour ton dernier passage, et relance aussitôt le budget sur `dist`. Lance vitest avec `--maxWorkers=2`.
