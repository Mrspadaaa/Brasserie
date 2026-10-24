# État des lieux mesuré — intégration de l'outil houblons dans l'app

Voie i0-etat, mission 2026-10-25-integration-houblons, écrit le 24.10.2026 (nuit). Ce document informe le conseil : il ne tranche rien.
Machine des mesures : Intel Core i5-14600KF, Node v24.19.0, Windows 11, PC rapide (un téléphone sera plus lent : non mesuré ici).
Scripts et journaux de travail : `%TEMP%\i0\` (`mesure-moteur.ts` regroupé par esbuild en `mesure-moteur.mjs`, `construire-tmp.mjs`, `volumes.mjs`).
Le dépôt `src/` et `functions/` n'a pas été touché (`git status --short src functions` vide).

Mot de lecture. « Fini » = fini dans son périmètre actuel. Rien de la maquette n'est encore branché dans l'app : à ce jour, aucune pièce
n'est « utilisable dans l'app » ; « fini (maquette) » veut dire : typé, testé ou joué dans la maquette, prêt à être porté.

## Classement

Maquette (`prototypes/houblons-v4/parcours/`). Preuves : `verifier-types.mjs` → TYPES OK ; `app-intacte.mjs` → APP INTACTE OK ;
`portabilite.mjs --process|--alias|--work` → trois OK ; `jouer-parcours.mjs --routes` → ROUTES OK (8/8) et `--ponts` → PONTS OK
(18 gestes, recalcul médian 0,3 ms) sur ma construction dans `%TEMP%` ; captures 01 et 07 ouvertes et regardées. Les lots « BATTERIE 45/45,
ETATS 141/141 » du commit 011ce4c8 sont déclarés : non rejoués ici (ils lisent `maquettes/parcours/`, reconstruit en ce moment par une autre voie).

- fini (maquette) — moteur v4 : `prototypes/houblons-v4/src/engine/` (22 fichiers) et `src/style/`. Sans `process.env`, imports relatifs.
  Réserve : données en singleton (voir B2) ; tests du prototype hors du Vitest de la racine (voir Risques R2).
- inachevé récupérable — adaptateur du moteur : `parcours/src/moteur/index.ts`, `donnees.ts`, `mesure.ts`, `prechauffage.ts`. Manque : `houblon()` lève
  une exception pour un houblon hors catalogue (`inconnu:<nom>`) et `lireBiere` l'appelle sur chaque ajout depuis 65155419 (24.10) ; 2 tests rouges
  sur 127 (`tests/conversion-recette.test.ts`, voir R1). Manque aussi : exécution sur le fil principal, sans worker.
- fini (maquette) — état : `parcours/src/etat/` (`reducteur.ts`, `operations.ts`, `quand.ts`, `visee.ts`, `EtatParcours.tsx`). Brouillon en mémoire seulement, perdu au
  rechargement (écrit dans ARCHITECTURE.md). `etapes.ts` : propre à la maquette (états de départ de pages).
- inachevé récupérable — coquille et navigation : `parcours/src/coquille/useFullScreenRoute.ts` (pile, même API que `src/pages/useFullScreenRoute.ts`), `navigation.tsx`,
  `routes.ts`, `ouvrir.tsx`, `Coquille.tsx`. Manque : aucune route d'outil dans le type `Route` de l'app ; le hash et `pages.ts` restent propres à la maquette ;
  la pile n'a aucun test automatique (seul `controle-retour.mjs`, Chrome, sur la maquette) ; jamais jouée avec les retours existants (recette, brassage, assistant, `hopV55`).
- inachevé récupérable — conversion de recette : `parcours/src/integration/conversion.ts`. 11 tests verts sur 13 ; les 2 rouges viennent de l'adaptateur (voir R1). Manque : un houblon hors catalogue (`inconnu:<nom>`) doit passer sans exception (relecture D2 : un test rouge exclut « fini », L11).
- inachevé récupérable — crochet de test : `parcours/src/integration/crochetTest.ts`. Manque : le test `MAQUETTE = true` à retirer au portage ; aucun contrôle n'a de mode `--url`
  (0 sur 71 `controle-*.mjs` ; 53 lisent `<dossier>/<route>/etat.html`) : tant que ce mode manque, `controle-choix.mjs` ne vérifie pas l'app.
- fini (maquette) — composants communs : `parcours/src/commun/` (BarreStyle, JetonHoublon, Pictos, Marques, Onglets, Legende, Pont, gestes, nombres, familles, Cadres).
- fini (maquette) — écrans choisis, un par un (registre `choix/ecrans.json`, maj 24.10) : `ecrans/ma-biere/` (base v4.10, étape Houblons, choisi), `ecrans/biere/` (onglet Ma bière, choisi),
  `ecrans/suggerer/` (q2b, choisi), `ecrans/comparer/` (r6a + D107, choisi), `ecrans/fiche/` (g1 + matrice flb5b, choisi), `ecrans/dryhopper/` (p4b2f, choisi),
  `ecrans/substituer/` (u4, choisi). Chacun a un `jeu.mjs` (8 en tout) et une NOTE.md. Réserve (relecture D2) : `ecrans/ma-biere` plante sur tout ajout d'un houblon hors
  catalogue (R1) : inachevé récupérable tant que R1 n'est pas corrigé. Écart de lecture : MISSION.md dit Dryhopper, Comparer et Substituer « ouverts » ;
  le registre commité (d27c1387) dit « choisi » pour les trois : MISSION.md est en retard sur le registre.
- inachevé récupérable — `ecrans/levure/` : écran écrit et joué, mais son choix est « ouvert » au registre (étape de Dryhopper ou outil a2b) ; provisoire : l'étape de Dryhopper.
- inutilisable pour l'app (maquette seulement) — `parcours/src/main.tsx`, `coquille/pages.ts`, `index.html`, `vite.config.ts`, `src/donnees/cas.ts` (la stout S1 fixée) : propres à la maquette, ne se portent pas.
  `ecrans/ma-biere/variantes-d121/` : variantes de travail, non classées ici.

App.

- fini — atelier V5.5 : `src/ui/hopV55/` (33 612 lignes, `Page.tsx` 5 303), `src/services/hopV55/`, `src/domain/hopDecision/`. Branché (route `hopV55`, `HopV55RecipeStep` dans l'étape Houblons de `BrewWizard.tsx`,
  lignes 2705-2720 ; ses applications sont écrites dans la recette : `hopV55Applications`, `hopV55ColdEvidenceAssociations`) ; 262 fichiers de tests le citent. Poids : chunk `Host` 1 888 kB (479 kB gzip) ; lent (#121). Fini mais à remplacer ou garder : décision B6.
- fini — `src/ui/hopIndex/` (34 fichiers) et `src/domain/hopIndex/` (17) : `HopRecipePanel` (section « Potentiel aromatique » de `RecipePage.tsx`, ligne 477), `HopRecipeGuide`, `HopRecipeSnapshot`, `HopIngredientPicker` (étape Houblons du wizard), `recipeBindings.ts` (`patchIndexedHop`).
  Branchés. Le worker `hopSolver.worker.ts` (+ `hopSolverMessages.ts`, `hopSolverTransport.ts`) est le précédent d'un calcul hors fil principal ; 223 fichiers de tests le citent.
- inachevé récupérable — données embarquées `src/data/*Bootstrap.json` : `hopBeerMaverickBootstrap` 1 986 ko (318 variétés), `hopDatabaseBootstrap` 1 134 ko (220), `hopLegacyBootstrap` 521 ko (119),
  `hopManufacturerBootstrap` 509 ko (102). Chargées à la demande (import dynamique) mais en gros blocs bruts ; deux catalogues distincts (Beer Maverick pour le moteur v4, Hopsteiner + guide ≈ 130 variétés pour `useHopCatalogue`).
  Manque : un seul catalogue réduit au nécessaire (#121) ; le catalogue de production n'a que 12 variétés (#120, 17.10, non revérifié).
- inutilisable pour l'outil — `yeastCatalogueBootstrap.json` (8 350 ko, 1 733 entrées) : lu par des scripts seulement, pas par le bundle (aucun chunk) ; hors sujet pour l'intégration.
- inachevé récupérable — écoutes Firestore : `src/services/firestoreRepo.ts:520` ouvre 27 `onSnapshot` au démarrage (`LIVE_COLLECTIONS`, 30 collections moins `financeDocuments`, `transactions` et `financialPayments`),
  dont les 6 collections houblons/levures, quel que soit l'écran. Fonctionne et garde le hors ligne (cache IndexedDB `persistentLocalCache`). Manque : écoutes par écran (#121).
- fini — navigation actuelle : `src/pages/useFullScreenRoute.ts` (73 lignes). Fonctionne pour ses 4 vues ; incapable d'une chaîne d'outils (B1).

## Écarts de #143

Relu dans le code le 24.10 (aucun fichier de `src/` modifié). Cases de #143 : les 6 cases « Architecture de base, dans le prototype » sont cochées ; « Thème en jetons » et « Mesure de performance et budgets » ne le sont pas.

- B1 — navigation : fermé dans la maquette, ouvert dans l'app. Preuve : `src/pages/useFullScreenRoute.ts:63-70` pose encore `tabs` à tout `popstate` ; la pile est dans `parcours/src/coquille/useFullScreenRoute.ts` (139 lignes). Non testé automatiquement.
- B2 — données du moteur en singleton : partiel. Preuve : `src/engine/data.ts` exporte `CATALOGUE`, `STOCK`, `ENGINE_DATA`, `VARIETY_BY_ID`, `hopRef` figés sur `proto-data.json` ; `configurerDonnees()` (adaptateur) filtre et indexe mais ne change pas ces singletons ;
  mon script de ×5 et ×10 a dû les muter en place pour y mettre un autre catalogue. Les voies de `proposeVoies` et `substitutes` lisent `STOCK` et `CATALOGUE` en dur.
- B3 — `process.env` dans le moteur : fermé. Preuve : `portabilite.mjs --process` → SANS PROCESS OK ; `grep process.env` ne trouve que des commentaires ; le témoin négatif est une variable de module (`temoin.ts`).
- B4 — alias `@app/` et `@functions/` : fermé pour le moteur. Preuve : `portabilite.mjs --alias` → IMPORTS RELATIFS OK ; restent les alias de `parcours/vite.config.ts` et `prototypes/houblons-v4/tsconfig.json` (maquette seule). `tsconfig.json` de l'app et celui du prototype sont tous deux `strict: false`.
- B5 — conversion de recette : fermé en conception, rouge en test. Preuve : `conversion.ts` existe, 13 tests, 11 verts, 2 rouges (monSuperStout et Weissbier, IBU) par l'exception `Houblon inconnu du moteur : inconnu:hallertau` (voir R1). Non branché dans l'app.
- B6 — dossiers cibles de ARCHITECTURE.md : fermé pour les dossiers (`src/domain/hopIndex/v4/`, `src/ui/hopIndex/` existent ou sont nouveaux et nommés) ; ouvert pour la décision (atelier V5.5 remplacé ou gardé à côté). Et un écart de lecture neuf : voir R6 (hôte = étape 3 du `BrewWizard`, pas seulement `RecipePage`).
- B7 — thème (clair des maquettes pour toute l'app, #144, ou cave) : ouvert, décision du brasseur ; `theme-maquettes.css` est propre à la maquette. Hors liste B1-B9 de #143 mais cité par ARCHITECTURE.md.
- B8 — données lues dans `work/` : fermé. Preuve : `portabilite.mjs --work` → SANS WORK OK ; les copies sont dans `prototypes/houblons-v4/data/` (`copies-de-work.mjs`), `src/data/` à alimenter.
- B9 — poids et chargement : ouvert. Preuve : `npm run build` : démarrage (index + App + firebase) 918 ko gzip contre 350 ko de budget B1 ; étape Houblons +772 ko gzip contre 150 ko (B2), `node scripts/check-hop-budget.mjs --dist dist --boot index,App,firebase --step Host`
  → « BUDGET FAIL … DÉPASSÉ ». Mêmes chiffres qu'au 18.10 : aucun progrès. La maquette seule : 1 749 510 octets de JS en un fichier, sans découpage.

## Mesures

Chaque chiffre a sa commande ; les temps sont des médianes sauf mention, en millisecondes (ms), un seul PC. Unités (relecture D5) : les poids du build sont en ko de 1 000 octets
(sortie de vite) ; ceux des JSON de `src/data` en Kio de 1 024 octets. Le « complet froid » de 4,41 ms dépend de l'ordre des appels (la série `COMPLET=1` donne 0,77 ms) : ce n'est pas un premier appel isolé.
Comptes corrigés par la relecture (D4) : 34 contrôles citent `etat.html` (55 citent `etat`), et 178 à 192 fichiers de `tests/` citent `hopV55` (au lieu de 53 et 262) ; la conclusion « 0 contrôle en `--url` » tient.

Poids de l'app, `npm run build` (tsc + vite build + check-private-research : sortie 0, build vert, 18,6 s). Commande des tailles : script Node sur `dist/assets/*.js` (gzip niveau 6 de Node) et lignes de vite.

- Total JS : 149 fichiers, 15,11 Mo bruts, 3,39 Mo gzip. (17.10 : 149 fichiers, 15,1 Mo, 3,4 Mo : inchangé.)
- `App-ptehQ_0f.js` : 2 869,48 ko bruts, 709,36 ko gzip (chargé au démarrage).
- `Host-DvNIgjAt.js` (atelier V5.5) : 1 888,04 ko bruts, 478,96 ko gzip.
- `hopBeerMaverickBootstrap-Bsxkgp9Z.js` : 1 441,37 ko bruts, 44,74 ko gzip ; `hopDatabaseBootstrap` : 894,13 ko, 29,00 ko gzip.
- `firebase-hNDs3T63.js` : 637,19 ko bruts, 152,09 ko gzip (démarrage) ; `BrewWizardEntry` : 530,84 ko, 159,00 ko gzip ; `readings` : 506,39 ko, 148,62 ko gzip.
- Entrée `index-D1fQTl2k.js` : 198 ko bruts, 62 ko gzip. Démarrage = index + App + firebase = 918 ko gzip (`check-hop-budget.mjs`, budget 350 ko) ; ouverture de l'étape Houblons = 772 ko gzip de plus (budget 150 ko).
- Dossier `dist/` : 16 Mo sur disque, 192 fichiers dans `assets/`. Pas de service worker d'application (seulement `brew-alerts-sw.js`) : le hors ligne vient du cache Firestore, pas d'un cache de code.

Poids de la maquette : `node %TEMP%\i0\construire-tmp.mjs` (vite build avec `PARCOURS_SORTIE` dans le dossier temporaire ; `construire.mjs` refuse hors de `maquettes/`) : CONSTRUIT en 6,3 s.

- `assets/parcours.js` : 1 749 510 octets (1 709 ko), 403 ko gzip (niveau 9), 327 ko brotli. `assets/style.css` : 174 087 octets, 29 ko gzip. (t2, 23.10 : 1 554 182 octets : +12,6 % depuis.)
- Attribution (esbuild, métafichier, minifié, 1 717 ko) : 15 fichiers JSON = 764 ko (45 %), dont `proto-data.json` 406 ko ; react-dom 177 ko ; moteur v4 109 ko ; `functions/src` 101 ko ; écrans : comparer 95, ma-biere 68, substituer 53, suggerer 52, fiche 34, dryhopper 22.

Temps du moteur : `ECHELLE=1|5|10 COMPLET=0|1 node %TEMP%\i0\mesure-moteur.mjs`, un processus par échelle ; cas S1 (stout 16D, 20 L, US-05, dégustation du 18.10) ; deux séries rejouées à ×5 et ×10, résultats stables à ±5 %.

| Mesure (échelle ×1, 318 houblons) | Valeur | Unité |
|---|---|---|
| `simulerCas` léger, un ajout, cache chaud (30 appels) | 0,05 (p95 0,09) | ms |
| `simulerCas` léger, dose changée à chaque appel | 0,30 (p95 0,44) | ms |
| `simulerCas` complet, un ajout, premier appel (froid) | 4,41 | ms |
| `simulerCas` complet, chaud / dose changée | 0,91 / 0,88 | ms |
| Classement de tout le catalogue, léger : 318 × 5 moments = 1 590 cas, froid / chaud | 478 / 85 | ms |
| Classement de tout le catalogue, complet : 1 590 cas, froid / chaud | 1 188 / 720 | ms |
| `substitutes` (Nugget, 334 candidats) froid / chaud | 91,9 / 2,1 | ms |
| `lireBiere` froid / entrée différente (16 recettes) | 3,57 / 0,27 (p95 0,65) | ms |
| `suggerer` (9 candidats du stock) froid / chaud / dose changée | 17,3 / 0,06 / 3,9 | ms |
| `proposer` (`proposeVoies`, 230 voies évaluées) froid / chaud | 108,6 / 0,02 | ms |
| `remplacants` (adaptateur) froid / chaud | 6,05 / 0,03 | ms |
| `comparer` 3 / 6 / 12 houblons | 5,6 / 4,2 / 9,1 | ms |
| `houblon()` pour tout le catalogue (318 fiches) | 218 | ms |

Contrôle de cohérence : `node bench.mjs` (le banc du 22.10, `work/missions/2026-10-22-reprise-lot21/voies/r2-cout-calcul/bench.ts`, regroupé par esbuild, 3 répétitions) rendu aujourd'hui : léger 464 ms froid / 81 ms chaud, complet 804 ms froid / 883 ms chaud pour 1 590 cas ; mes chiffres concordent.
Écart avec `cerveau/metier/cout-calcul-moteur.md` (22.10 : léger 1 239 ms froid / 165 ms chaud ; complet 8 346 ms froid / 7 961 ms chaud) : le complet est environ 9 fois plus rapide aujourd'hui. Cause non établie (le cache de formateurs `Intl` de p8, le 23.10, est une piste ; non vérifié). La note du cerveau est périmée sur ce point.
Maquette en navigateur, ×1, cache de la page : `jouer-parcours.mjs --ponts` : 58 recalculs, médiane 1,9 ms par geste qui recalcule, max 7,9 ms. Budgets t2 (23.10, ×4, `mesure-performance.mjs`) : non rejoués ; au 23.10 : toucher froid Ma bière → Suggérer 782 ms, → Substituer 743 ms (budget 100 ms), chargement 565 à 1 348 ms.

## Beaucoup de données

Volumes d'aujourd'hui (comptés : `%TEMP%\i0\volumes.mjs`, `tests/fixtures/production/houblons-2026-10-17.json`, `proto-data.json`).

- Houblons au catalogue du moteur v4 : 318 (Beer Maverick). Catalogue de l'index de l'app (`useHopCatalogue`) : Hopsteiner 102 + guide 4 + styles 28 + étude 1 + essai 1 ≈ 136, plus les fiches enregistrées. Catalogue de production : 12 variétés (#120, 17.10).
- Stock houblons : 16 entrées dans `proto-data.json`, dont 9 avec des grammes ; fixture de production du 17.10 : 18 articles, 9 avec quantité > 0.
- Recettes : 23 en production (6 stouts) selon #120 (17.10, lecture seule, non revérifié) ; recettes de fixtures : quelques fichiers `tests/fixtures/*.ts`. Brassins : non mesuré (aucune fixture de production ; `initialProduction` vide).
- Levures : 4 simulées par le moteur (US-05, Pomona, Verdant, Diamond) ; 6 fiches `hopYeastBootstrap` ; 24 références de recettes ; catalogue de 1 733 entrées (8 350 ko) hors bundle.
- Écoutes Firestore au démarrage : 27, pour toutes les collections, tous écrans.

Ce qui grandira : le stock et les recettes avec l'usage (un par brassin), les brassins, les dégustations (`hopTastings`) ; le catalogue de production quand #120 sera corrigé (de 12 vers 318 au moins). Le brasseur ne dit pas de chiffre : l'échelle ×5 et ×10 ci-dessous est un cadre de mesure, pas une prévision.

Coût mesuré à ×5 et ×10 : mêmes commandes, catalogue et stock clonés (α décalé de ±5 %, mêmes fiches) dans les singletons du moteur avant tout calcul. ×5 = 1 590 houblons, 80 entrées de stock (45 avec grammes) ; ×10 = 3 180 houblons, 160 entrées (90 avec grammes).

| Mesure | ×1 | ×5 | ×10 | Unité |
|---|---|---|---|---|
| Classement de tout le catalogue, léger, froid | 478 | 1 887 | 4 533 | ms |
| même, chaud | 85 | 399 | 1 567 | ms |
| Classement de tout le catalogue, complet, froid | 1 188 | 7 683 | 19 506 | ms |
| même, chaud | 720 | 8 150 | 15 513 | ms |
| `substitutes` froid | 91,9 | 560 | 1 522 | ms |
| `substitutes` chaud | 2,1 | 22,1 | 45,5 | ms |
| `remplacants` (adaptateur) froid | 6,05 | 23,5 | 42,9 | ms |
| `proposer` froid | 108,6 | 282,9 | 374,7 | ms |
| `suggerer` froid (candidats = stock en grammes) | 17,3 (9) | 153 (45) | 334 (90) | ms |
| `suggerer`, dose changée (un cran du curseur) | 3,9 | 57,5 | 132 | ms |
| `comparer` 3 houblons | 5,6 | 10,9 | 14,8 | ms |
| `houblon()` sur tout le catalogue | 218 | 2 162 | 4 499 | ms |
| `lireBiere` froid | 3,57 | 7,0 | 6,4 | ms |
| Tas JS du processus Node après les mesures | 198 | 537 | 1 137 | Mo |

Lecture, sans conclure :
- Un geste sur une recette (`lireBiere`, `simulerCas` d'un ajout, `comparer` de 3 houblons) reste sous 15 ms de ×1 à ×10, mais croît un peu (relecture D6 : `simulerCas` complet chaud 0,9 → 2,2 ms, léger dose changée 0,30 → 0,71 ms).
- Croissance plus que linéaire. `substitutes` : froid ×6,1 pour ×5 les candidats, ×16,6 pour ×10 ; chaud ×10,5 puis ×21. Cause lue dans `substitution.ts:248-290` : à chaque appel, `rows = pool.map(...)` calcule dose, état de stock, `reasonOf` et `moves` pour chaque candidat avant de ne rendre que 8 ; le `pool` retire les doublons par `STOCK.map(...).filter(k => !CATALOGUE.some(...))`, soit stock × catalogue ; le tri appelle `localeCompare('fr')` dans le comparateur. Seul le recouvrement stock × catalogue est un O(n²) strict ; le reste est O(n log n) avec une grosse constante : non séparé par mesure.
- Classement du catalogue léger chaud : ×4,7 puis ×18 pour ×5 puis ×10 les cas ; le coût par cas passe de 0,05 à 0,10 ms entre ×5 et ×10. Cause non établie (cache non borné et ramasse-miettes : hypothèse, non mesurée).
- Se recalcule à chaque geste : `suggerer` à chaque cran de dose (1,3 à 1,5 ms par candidat du stock : 132 ms à ×10, soit environ 530 ms sous processeur ×4 : au-dessus du budget de 100 ms) ; la frise de Dryhopper (30 `lireBiere` à l'ouverture, t2 : 40 ms) ; `lireBiere` à chaque rendu via `useMemo` sur la recette (`EtatParcours.tsx`).
- Mémoire : `cacheBase` (`profil-simule.ts:195`) est un `Map` sans éviction, clé = houblon, moment, dose, jours, levure, style, volume. Chaque cran de dose en crée une. Le tas de mon processus Node (clones, caches des 4 balayages) monte à 1,1 Go à ×10 ; ce n'est pas la mémoire d'un onglet de téléphone (non mesurée ; le budget B4 est 120 Mo, 74 Mo mesurés le 18.10 sur l'ancienne étape).
- `houblon()` pour tout le catalogue : 4,5 s à ×10 : à ne jamais appeler en bloc au rendu d'une liste.

## Risques

- R1 — Ma bière plante sur un houblon que le moteur ne connaît pas. Preuve : `cd prototypes/houblons-v4 && npx vitest run` → 2 échecs sur 127 (`Houblon inconnu du moteur : inconnu:hallertau`, `parcours/src/moteur/index.ts:214`, appelé par `lireBiere` ligne 184). `conversion.ts` produit `inconnu:<nom>` pour tout houblon hors catalogue (#120 : Hallertau, Nuget, mélanges « Citra + Galaxy », Lactose dans la liste). Données : une recette réelle ferait tomber l'écran. Fluidité : non.
- R2 — les tests du moteur et de la conversion ne tournent pas dans `npm test`. Preuve : `vitest.config.ts` n'inclut que `tests/unit`, `tests/integration`, `tests/fuzz` ; les 10 fichiers de `prototypes/houblons-v4/tests/` sont hors de la porte, et la branche est rouge sans que rien l'annonce (R1).
- R3 — navigation. Preuve : `src/pages/useFullScreenRoute.ts:63-70`. Un outil ouvert depuis le wizard ou la recette renverrait à `tabs` au premier retour ; le retour `hopV55` a son cas particulier (`returnFromHopV55`). Risque pour les écrans existants si la pile les remplace sans rejouer leurs retours (`tests/integration/AppQuickActionReturn.behavior.test.tsx`, `fix114.test.tsx`).
- R4 — hors ligne. L'app repose sur le cache IndexedDB de Firestore (`persistentLocalCache`) et sur des chunks chargés à la demande (import dynamique) ; il n'y a pas de service worker d'application. Un outil dont les JSON se chargent à la demande (`proto-data` 406 ko, `composes-houblon` 68 ko…) échouerait hors ligne au premier appel si le chunk n'a pas déjà été chargé en ligne. Non testé hors ligne ; à jouer en Chrome avec réseau coupé.
- R5 — fluidité. (a) Calcul sur le fil principal : `lireBiere` dans `useMemo` pendant le rendu, `suggerer` au montage de Suggérer (t2 : 1 348 ms à l'ouverture directe). (b) `suggerer` à chaque cran de dose : 132 ms à ×10 sur ce PC. (c) Caches sans borne (`cacheBase`). (d) 27 écoutes Firestore au démarrage ; le bruit d'un snapshot de `hopKnowledge` (plus de 200 documents) recréerait les données injectées (`configurerDonnees` vide tous les caches de l'adaptateur) : chaque snapshot ferait repartir à froid les calculs de 90 à 380 ms. (e) Poids : 918 ko gzip au démarrage, 772 ko gzip ajoutés à l'étape Houblons ; la maquette y ajoute 403 ko gzip si elle est intégrée en un seul fichier.
- R6 — l'hôte de l'étape Houblons. Correction de la relecture (D1) : le wizard écrit déjà son brouillon en local (`writeRecipeDraft(draftKey, …)`, `BrewWizard.tsx`
  lignes 1421, 1467, 1939, 1951 ; relu par `readRecipeDraftState(props.draftKey)` ligne 462 ; `src/services/recipeDraft.ts:544`) : il survit à un démontage du wizard.
  Reste à vérifier : la clé de brouillon gardée à la sortie de l'outil, le retour à la bonne étape, et l'écriture des changements de l'outil dans ce brouillon. Preuve d'origine : la capture 01 de `ma-biere` montre le fil « Identité · Malts/sucres · Houblons · Levure · Paliers · Eau · Récap. » ; dans l'app, cette étape est l'étape 3 de `BrewWizard.tsx` (3 287 lignes, STEPS lignes 398-406) qui travaille sur un brouillon non enregistré (`build()`, `setHops`, `setYeast`, `applyHopV55Change`, lignes 1410-1420), alors que ARCHITECTURE.md vise `RecipePage` et `saveRecipeConfirmed`. Si l'outil s'ouvre en plein écran par-dessus le wizard, le brouillon doit survivre à l'ouverture (la route `wizard` reste-t-elle montée ? non vérifié : `App.tsx` rend une vue à la fois ; `RecipePage` « reste montée » selon ARCHITECTURE.md, non joué, B10). Données : une perte de brouillon est une perte de données.
- R7 — données de recette. Un houblon remplacé « perd `stockItemRef`, `hopLotId` et l'α de l'ancien lot » (conversion) et `hopV55Applications` / `hopV55ColdEvidenceAssociations` sont portés par la recette : un patch qui ne les préserve pas, ou qui les efface en retirant V5.5, perdrait l'historique de V5.5. Non vérifié sur une recette réelle. Aucune écriture de données réelles n'est permise ici.
- R8 — ses choix (règle n° 1). 0 contrôle sur 71 ne sait lire l'app (aucun `--url`) ; sans lui, `controle-choix.mjs` ne couvre plus rien une fois l'écran porté. `controle-choix.mjs` lit `<dossier>/<route>/etat.html`.
- R9 — deux catalogues (Beer Maverick 318 pour le moteur, ≈ 136 Hopsteiner pour l'index) et un catalogue de production de 12 variétés : le filtre `proposable()` rendrait presque tout « non proposable » avec les données réelles d'aujourd'hui (#120). Non mesuré sur la production (accès interdit).
- R10 — états de départ : le brouillon d'outil est en mémoire ; un rechargement de page sur une route d'outil le perd (écrit dans ARCHITECTURE.md). Un retour arrière du navigateur sur une entrée sans brouillon retombe sur la recette.

## Découpage proposé

Propositions pour le conseil, dans l'ordre (fondations d'abord). Budgets de fluidité de la mission : toucher ≤ 100 ms ; image d'un glisser ≤ 16 ms en médiane, 33 ms au 95e centile ; écran ≤ 2,5 s à froid ; ×4 ; sortie du rail ≤ 50 ms.

### T1 — Remettre la branche au vert et mettre les tests du moteur dans la porte
But : corriger R1 (un houblon inconnu rend « arôme non simulé », jamais une exception) ; faire tourner `prototypes/houblons-v4/tests/` ou leur copie dans `tests/unit/hopIndexV4/` avec `npm test`.
Fichiers : `parcours/src/moteur/index.ts`, `vitest.config.ts` (inclusion), tests déplacés.
Dépend de : rien. Critère : `npx vitest run` du prototype → 127 verts ; puis `npm test -- tests/unit/hopIndexV4` vert ; un test d'un ajout `inconnu:x` dans `lireBiere`. Budget : aucun.

### T2 — Décider l'hôte et la persistance (conseil)
But : trancher R6 : étape 3 du `BrewWizard` (brouillon), `RecipePage` (recette enregistrée), ou les deux ; comment le brouillon survit à l'ouverture d'un outil plein écran.
Fichiers : aucun (décision). Dépend de : T1 non nécessaire. Critère : une note signée dans `work/refonte-frontend/decisions.md` et un parcours Chrome « wizard → Suggérer → retour » gardant le brouillon. Budget : aucun.

### T3 — Pile de navigation dans l'app
But : remplacer `src/pages/useFullScreenRoute.ts` par la pile (B1), type `Route` étendu (`hopBeer`, `hopSuggest`, `hopCompare`, `hopTiming`, `hopSubstitute`), sans changer les retours existants.
Fichiers : `src/pages/useFullScreenRoute.ts`, `src/App.tsx` (switch des vues), test d'intégration neuf.
Dépend de : T2. Critère : `npm test -- tests/integration/AppQuickActionReturn.behavior.test.tsx tests/integration/fix114.test.tsx` verts + un test de pile à quatre niveaux ; parcours Chrome retour par niveau. Budget : ouverture d'une route ≤ 100 ms.

### T4 — Moteur v4 dans `src/domain/hopIndex/v4/`
But : déplacer `src/engine` et `src/style` (22 fichiers), imports relatifs corrigés, données `data/*.json` vers `src/data/` avec leur source ; chargement paresseux.
Fichiers : `src/domain/hopIndex/v4/**`, `src/data/`. Dépend de : T1. Critère : `npm run build` vert ; `node scripts/check-private-research.mjs` ; les tests de T1 sur le nouvel emplacement ; poids du chunk du moteur chiffré (gzip). Budget : aucun JS ajouté au démarrage (B1 ne bouge pas).

### T5 — Moteur sans singleton (B2) et caches bornés
But : une fabrique `creerMoteur(donnees)` ; `cacheBase` à éviction ; stock et catalogue injectés réellement ; supprimer le recouvrement stock × catalogue de `substitutes` et ne calculer dose, raison et mouvements que pour les 8 rendus.
Fichiers : `src/domain/hopIndex/v4/*` (data, voies, cases, substitution, profil-simule…). Dépend de : T4.
Critère : le script de mesure `%TEMP%\i0\mesure-moteur.mjs` adapté ; `substitutes` chaud ≤ 10 ms à ×10 ; tests du moteur sur la fixture ET sur une forme injectée. Budget : `substitutes` froid ≤ 100 ms à ×10 (sur ce PC).

### T6 — Conversion de recette et lecture/écriture
But : `recipeConversion.ts`, `useHopRecipe`, écriture par le chemin choisi en T2 (brouillon du wizard ou `saveRecipeConfirmed`), état « en attente », erreur d'écriture à l'écran, préservation de `hopV55Applications`.
Fichiers : `src/domain/hopIndex/v4/recipeConversion.ts`, `src/ui/hopIndex/useHopDraft.ts`. Dépend de : T2, T4.
Critère : tests de conversion sur les 4 recettes de fixture ; un test « aller-retour garde `hopV55Applications` et `hopV55ColdEvidenceAssociations` » ; aucune donnée réelle. Budget : conversion ≤ 5 ms.

### T7 — Calcul hors du fil principal
But : worker pour `proposer`, `suggerer`, `remplacants` et le préchauffage (précédent : `hopSolver.worker.ts`) ; `lireBiere` reste sur le fil principal.
Fichiers : `src/ui/hopIndex/hopTools.worker.ts`, adaptateur `src/domain/hopIndex/v4/adapter.ts`. Dépend de : T5.
Critère : `mesure-performance.mjs` rejoué sur l'app, ×4 ; `suggerer` avec dose changée ≤ 100 ms à ×10 ; l'annulation d'une recherche est testée. Budget : toucher ≤ 100 ms, aucune tâche longue > 50 ms pendant un glisser.

### T8 — Données injectées depuis les vraies sources
But : `configurerDonnees` alimenté par le stock réel (`StockItem` « Houblon » reliés à une variété), le catalogue (un seul, réduit au nécessaire), la dégustation ; sans effacer les caches à chaque snapshot qui ne change pas ces données.
Fichiers : `src/ui/hopIndex/useHopData.ts` (neuf), `src/hooks/useLiveData.ts` (lecture). Dépend de : T5, T6.
Critère : test d'un snapshot identique → aucun recalcul (journal `mesures()`) ; fixture de production du 17.10 (lecture seule) lue sans exception. Budget : un snapshot inchangé = 0 recalcul.

### T9 — Chargement paresseux et poids
But : les outils en chunks à la demande ; `proto-data`, `composes-houblon`, `style-bands` en import dynamique ; ni V5.5 ni les outils au démarrage ; contrôler les budgets B1 et B2 de 350 et 150 ko gzip.
Fichiers : `vite.config.ts` (découpage, sans changer ses alias), points d'entrée. Dépend de : T4.
Critère : `node scripts/check-hop-budget.mjs --dist dist --boot index,App,firebase --step <chunk des outils>` ; l'outil seul ≤ 150 ko gzip ajoutés ; gzip du démarrage mesuré avant et après. Budget : écran des outils ≤ 2,5 s à froid ×4.

### T10 — Écoutes Firestore par écran
But : n'ouvrir au démarrage que les collections de l'écran affiché, et celles des outils à leur ouverture ; garder le hors ligne (cache persistant).
Fichiers : `src/services/firestoreRepo.ts`, `src/App.tsx`. Dépend de : T3.
Critère : parcours Chrome, réseau coupé puis rétabli, aucune donnée perdue ; nombre d'`onSnapshot` au démarrage mesuré (27 aujourd'hui) ; tests `tests/unit` de `firestoreRepo`. Budget : premier écran ≤ 2,5 s à froid ×4.

### T11 — Composants communs et jetons
But : porter `commun/*` dans `src/ui/hopIndex/` (`familles.ts` → `familyTokens.ts`), les symboles SVG et JSON copiés dans `src/data/` ; contraste du thème (B7 si décidé).
Fichiers : `src/ui/hopIndex/*`, `src/data/*`. Dépend de : T4. Critère : `npm run build` vert, typecheck, test des jetons ; captures ouvertes en image. Budget : glisser ≤ 16 ms en médiane.

### T12 — Écran Ma bière (étape Houblons) et onglet Ma bière
But : porter `ecrans/ma-biere` et `ecrans/biere` à l'hôte décidé, derrière un drapeau ; rail, légende, ajouts rapides.
Fichiers : `src/ui/hopIndex/MaBiere*.tsx`, hôte (T2). Dépend de : T3, T6, T7, T8, T11.
Critère : `controle-choix.mjs` et `controle-rail.mjs` en mode `--url` (T14) sur l'app ; captures côte à côte avec sa base v4.10 (règle n° 1) ; parcours Chrome. Budget : image de glisser ≤ 16 ms (médiane), sortie du rail ≤ 50 ms.

### T13 — Fiche et Suggérer
But : porter `ecrans/fiche` (g1 + matrice) et `ecrans/suggerer` (q2b), moteur dans le worker.
Fichiers : `src/ui/hopIndex/Fiche*.tsx`, `Suggerer*.tsx`. Dépend de : T12. Critère : `jeu.mjs` joués dans l'app, `controle-etats.mjs` de ces écrans ; Suggérer sur le jeu ×10. Budget : toucher ≤ 100 ms ; Suggérer ≤ 2,5 s à froid ×4.

### T14 — Contrôles de ses choix qui lisent l'app
But : un mode `--url` pour `controle-choix.mjs`, `controle-rail.mjs`, `controle-etats.mjs`, `controle-usage-intensite.mjs`, les `jeu.mjs` ; une adresse du serveur Vite par état de départ ; le crochet `window.__parcours` derrière `import.meta.env.DEV`.
Fichiers : `work/refonte-frontend/v4/tournoi/outils/*.mjs`, `src/ui/hopIndex/devHook.ts`. Dépend de : T3 (états de départ). Critère : `controle-choix.mjs --url=http://127.0.0.1:<port>` rend CHOIX OK sur la maquette servie ET sur l'app ; un témoin négatif échoue. Budget : aucun.

### T15 — Comparer, Dryhopper, Substituer, Levure
But : porter les quatre écrans suivant le registre (Comparer r6a+D107, Dryhopper p4b2f, Substituer u4 ; Levure : étape de Dryhopper tant que le choix est ouvert).
Fichiers : `src/ui/hopIndex/Comparer*.tsx`, `Dryhopper*.tsx`, `Substituer*.tsx`, `Levure*.tsx`. Dépend de : T13, T14.
Critère : `controle-etats.mjs --ecran=<écran>` sur l'app ; `controle-comparer*.mjs` ; Dryhopper : 24 états de p4b2f. Budget : glisser de la frise ≤ 16 ms (médiane), 33 ms (95e) ; ×4.

### T16 — Coexistence avec V5.5 et retrait
But : selon la décision B6, retirer l'atelier V5.5 de l'étape Houblons (ou le garder derrière un bouton), sans supprimer sans accord, sans perdre les enregistrements existants.
Fichiers : `src/pages/BrewWizard.tsx`, `src/pages/RecipePage.tsx`, `src/App.tsx`. Dépend de : T12 et l'accord du brasseur. Critère : `npm test` complet vert ; recette réelle de fixture ouverte avec `hopV55Applications` intacts ; budgets B1 et B2 rejoués. Budget : démarrage ≤ 350 ko gzip et étape Houblons ≤ 150 ko gzip, ou dérogation écrite.

### T17 — Jeu « beaucoup de données » et budgets bloquants
But : un jeu de données ×5 et ×10 en fixture, et un contrôle (`scripts/check-*.mjs`) qui échoue au-delà des budgets, ×4, branché dans la suite de contrôles.
Fichiers : `scripts/check-hop-tools-perf.mjs`, `tests/fixtures/`. Dépend de : T7, T13. Critère : le contrôle rend OK sur l'app, et échoue sur un témoin lent. Budget : ceux de la mission.

### T18 — Parcours complet dans Chrome, puis émulateurs Firebase
But : jouer le parcours Ma bière → fiche → Suggérer → Comparer → Dryhopper → Levure → Substituer → retour, sur fixtures puis émulateurs, hors ligne compris.
Fichiers : `scripts/` (parcours), captures dans le dossier de la voie. Dépend de : T15, T17. Critère : parcours joué, captures ouvertes en image, build vert, aucune donnée réelle. Budget : tous.
