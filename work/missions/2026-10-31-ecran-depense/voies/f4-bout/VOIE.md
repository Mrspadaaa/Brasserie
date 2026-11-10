# Voie f4-bout — le remplissage des fiches branché, au bout en bout : ENRICHIR KO à corriger (D293)

Agent : `auteur` (Sonnet). Plafond : 80 tours. Relis `../COMMUN.md` (il vaut ici ; l'écran n'est pas touché). Aucun commit, aucun
déploiement, aucun appel réseau hors localhost, Gemini toujours simulé. Tests, tsc, build : copie isolée
`node work/missions/2026-10-31-ecran-depense/voies/p3c-port/copie.mjs "<commande simple>"`. Le bout en bout se joue depuis le dépôt ;
aucune autre voie n'écrit dans `src/` pendant la tienne (le pilote les tient en attente).

## L'état (pilote, 02.11)
- Les branchements 1 à 6 de f4 sont posés (D290, `voies/f4-enrichir/RESULTAT.md` § P5) et commités : `planifierEnrichissement` après
  `savePurchase` (`purchaseEntry.ts`), `tenirEnrichissement` (`ExpenseSheet.tsx`), `startEnrichissement` (`App.tsx`),
  `apprendreSurFicheRetenue` (`storage.ts`, `learnIngredient`), `valeurLueDe` (`stockLineMatching.ts`), le type `fiche` (`types/index.ts`).
  Tests ciblés 269/269, suite complète verte hors échecs d'environnement de la copie, tsc 0, build vert.
- Bout en bout : `bash work/missions/2026-10-31-ecran-depense/voies/e-bout/lancer.sh <sortie> enrichir 390,1280
  work/finalisation-tickets-2026-10-08/H13-reels/jus0/rejeu-d272b.json work/finalisation-tickets-2026-10-08/H13-reels/banc-f5c-prod-paires/results.json`
  (le cas `enrichir` se lance seul). Le pilote a corrigé la donnée du cas : « Target 11.3% » était déjà semé par doc5 (refus S6 « nom
  déjà pris », juste) ; le cas prend maintenant une variété absente des semis (Challenger 7,5 %). Résultat
  (`voies/f4-enrichir/bout-branche-seul/`) : `ENRICHIR KO 390 · 5/8 · appels 2`, `ENRICHIR KO 1280 · 4/8 · appels 2`.
  - Challenger : `fiche` = `{"id":"beermaverick-challenger","approchee":false}`, α 7,5 juste, **sans `cle` ni `par`** : la fiche posée
    à la création (`articleNeufDe`, `articleNeuf.ts:52`) semble empêcher la procédure de compléter la sienne.
  - L'ambre (« Malterie du Banc Ambre 60 », réf. MB-A60) : ni `fiche` ni `potentialPpg` au contrôle, alors que 2 appels
    `lookupIngredient` sont partis (ambre et levure du Banc) : la réponse rejouée n'est pas écrite, ou pas encore.
  - Windsor à 1280 : ni `fiche` ni `yeastLab` (juste à 390) : ordre ou attente (`f4Repos`, l. 1832).
  - Console : `net::ERR_INTERNET_DISCONNECTED` et `net::ERR_FAILED` pendant la partie hors ligne : dire lesquels viennent de l'app
    (une requête qu'elle ne devrait pas faire hors ligne) et lesquels du réseau coupé par le banc (polices, etc.).
  - Le contrôle du « bis » passe **à vide** : `bis?.fiche?.cle === ambre?.fiche?.cle` vaut `undefined === undefined`.

## Ce que tu fais
1. Diagnostiquer chaque KO à sa cause, preuve à l'appui (journal du banc, `report.json`, sonde dans la copie), avant de corriger.
2. Corriger l'app là où est la cause ; le cas du banc seulement s'il se trompe (jamais un contrôle relâché pour passer). Le contrôle du
   « bis » exige une clé définie. Un contrôle de console peut ignorer les échecs réseau que le banc provoque lui-même, nommés un par un.
3. Un test unitaire rouge puis vert par défaut de l'app trouvé (`tests/unit/depense/enrichir/`), sortie sous « TEMOIN AVANT : ».

## Possède
`src/services/enrichissement.ts`, `src/services/enrichissementTravail.ts`, `src/services/enrichissementStore.ts`,
`src/services/enrichissementCatalogues.ts`, `src/services/enrichissementRecette.ts`, `src/services/enrichissementReglages.ts`,
`src/domain/stock/ficheCle.ts`, `src/domain/stock/ficheValeurs.ts`, `tests/unit/depense/enrichir/**`, dans
`scripts/check-invoice-journey-emulator.mjs` seulement `caseEnrichir`, `f4Repos`, `f4Article`, `enrichirAnswer` et leurs aides f4,
`work/missions/2026-10-31-ecran-depense/voies/f4-bout/**`. Si la cause est dans `articleNeuf.ts`, `purchaseEntry.ts`,
`stockLineMatching.ts` ou `ExpenseSheet.tsx`, écris la correction dans RESULTAT (`DEMANDE PILOTE : …`) sans la poser : la voie n1
possède ces fichiers.

## Critères (le pilote les rejoue)
1. `npx vitest run tests/unit/depense --maxWorkers=2` (copie isolée) : tout vert.
2. `npx tsc --noEmit -p tsconfig.json` et `npm run build` (copie isolée) : 0 erreur.
3. Bout en bout ci-dessus : `ENRICHIR OK 390 · 8/8 · appels 2` et `ENRICHIR OK 1280 · 8/8 · appels 2` ; aucun « hmr update » ni
   « page reload » dans vite.log. Ouvre `*-enrichir-stock-1.png` et `*-enrichir-stock-2.png` (L12).
4. Rien ne se perd : `lancer.sh <sortie> doc14 …` (mêmes manifestes) : 0 KO.

## Rendre
`RESULTAT.md` (format de `../COMMUN.md` § « Rendre »), puis une ligne `F4-BOUT OK — …` ou `F4-BOUT ECHEC — …`.
