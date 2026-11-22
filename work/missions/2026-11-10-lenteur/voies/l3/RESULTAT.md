ECHEC partiel — V5.5 au niveau du tag après repos (+9 ms), mais +1,9 s si touché aussitôt (octets déplacés de l'accueil, qui gagne −1,9 s) ; suite complète et captures à jouer

# Voie l3 — l'atelier Houblons V5.5 n'attend plus la bibliothèque de levures

## 1. Ce qui est fait (commit df8f6bb5, sur 1cd9336b)
Méthode standard : chargement paresseux (`import()` dynamique) + promesse mémorisée ; l'appelant attend avant d'utiliser, aucun résultat de calcul ne change.
- `src/domain/yeastLibraryPorte.ts` (neuf, sans dépendance) : la « porte ». `yeastReferences.ts` (seul importeur du JSON de 1,4 Mo) s'y enregistre en s'évaluant.
- `src/domain/yeastLibraryLoader.ts` (neuf) : `chargerBibliothequeLevures()` = `import('./yeastReferences')` mémorisé, remis à zéro si le réseau échoue.
- `yeastReferencesCore.ts` : `yeastReferencesChargees()` lit la porte ; elle LÈVE (« Bibliothèque de levures non chargée ») si la bibliothèque n'est pas là : jamais de résultat réduit en silence.
- `predictionReferences.ts` : n'importe plus `yeastReferences` ; la liste « proposée » prend `yeastReferencesNoyau()` (identique : elle appelait déjà `includeCatalogue:false`) ; la qualification lit la porte. `nolo.ts` (`noloInput`) idem.
- `App.tsx` : `HopV55Host = lazy(() => Promise.all([import(Host), chargerBibliothequeLevures()]))` : le chunk du Host et la bibliothèque partent EN PARALLÈLE ; le Host ne se monte qu'une fois les deux là, donc tout calcul synchrone (`prepareBrewingScenarioContext`, ~100 appels) trouve la bibliothèque. Pas de `async` propagé dans les outils houblons ni le moteur de scénario.
- Tests : `tests/setup.yeast-library.ts` (+ une ligne `vitest.config.ts`) met la même bibliothèque dans la porte (sans importer le noyau : les `vi.mock` des tests restent valides) ; `tests/unit/yeastLibraryLoader.test.ts` (3 verts : lève avant, même référence après, promesse partagée, fiche documentaire retrouvée) ; deux QA (`tests/qa/hop-*/main.tsx`) importent `yeastReferences`. **Aucun test du moteur modifié.**
- Tests de la fiche brassin (suite de l2, `BatchDetailSheet` en `lazy`) : `dashboardNavigation` (2) et `liveDataViews` (1) rougissaient sur le commit de l2 (la fiche apparaît après un tour de Suspense) ; passés en `async` + `findByRole` (timeout 10 s pour le 1er import). Le comportement visible est celui de l2.

## 2. Preuve par le paquet (build, `graphe-chunks.mjs`, `racines.mjs`)
- Avant (`l2-dist-apres2`) : le chunk `Host` importait en statique `predictionReferences` et `nolo`, donc `yeastReferences` (1 358 Ko) ; fermeture statique du Host = 25 chunks dont la bibliothèque.
- Après : Host = 24 chunks, **sans** la bibliothèque ; ses importeurs statiques ne sont plus `Host`, `nolo`, `predictionReferences` mais seulement les écrans de recette/jour de brassage/wizard, qui la portaient déjà. `App` et `index` n'ont ni consommateur ni bibliothèque (accueil inchangé).
- 22 racines de chunk atteignent un consommateur synchrone sans la bibliothèque : toutes sont soit dans le Host (monté après la porte), soit importées par un chunk qui a la bibliothèque (liste : `node graphe-chunks.mjs <dist>`, lignes `sûr` ; aucune `RISQUE`).

## 3. Contrôles
- `npx tsc --noEmit -p .` : 0 erreur hors `firebase-admin/*` (module absent du worktree, connu).
- Suite complète lancée AVANT les derniers correctifs (`tests.txt`) : 61 fichiers rouges à la collecte, tous `Cannot find package 'firebase-admin/…'`, `firebase-functions`, `cheerio` (environnement, connus, identiques au tag) ; 15 tests rouges dont les connus (fuzzSaisie, recipeAiWorkflow ×2, recipeEditing ×6, designTokens, virgule-transversale) et 4 nouveaux, tous traités : `yeastRecipeReferences` (mon 1er setup importait le noyau avant le `vi.mock` ; corrigé, vert), `dashboardNavigation` ×2 et `liveDataViews` ×1 (lazy de l2 ; corrigés, verts). **Suite complète à rejouer sur df8f6bb5** (DEMANDE EXECUTANT 2).
- `VITE_HOP_V4=on` build : exit 0 (`l3-dist-apres`, patch de banc retiré : `git status` propre).
- Pas encore rejoués sur df8f6bb5 : `check-build-flags`, `check-no-dev-auth`, la série, les captures.

## 4. Mesure finale (série `mesure/serie3.sh`, faite par moi sur df8f6bb5 : avant = tag `curseur` = `l2-dist-avant`, après = `l3-dist-apres`, banc local Slow 4G + CPU ×4, accueil vide, médiane de 3 ± écart type ; « PLUS LENTE » = écart > max(50 ms, 2 σ) ; fichier `mesure/tableaux-serie3.md`, sorties `mesure/sorties/s3-*.json`)

### froid-immediat
| Vue | avant ms (médiane ± σ) | après ms (médiane ± σ) | écart | verdict | avant Ko | après Ko | passes ok (a/p) |
|---|---|---|---|---|---|---|---|
| accueil | — | — | — | — | — | — | 0/0 |
| brassins | — | — | — | — | — | — | 0/0 |
| stocks | — | — | — | — | — | — | 0/0 |
| finances | — | — | — | — | — | — | 0/0 |
| clients | — | — | — | — | — | — | 0/0 |
| houblons-v55 | — | — | — | — | — | — | 0/0 |

### froid-repose
| Vue | avant ms (médiane ± σ) | après ms (médiane ± σ) | écart | verdict | avant Ko | après Ko | passes ok (a/p) |
|---|---|---|---|---|---|---|---|
| accueil | — | — | — | — | — | — | 0/0 |
| brassins | — | — | — | — | — | — | 0/0 |
| stocks | — | — | — | — | — | — | 0/0 |
| finances | — | — | — | — | — | — | 0/0 |
| clients | — | — | — | — | — | — | 0/0 |
| houblons-v55 | — | — | — | — | — | — | 0/0 |

### chaud-repose
| Vue | avant ms (médiane ± σ) | après ms (médiane ± σ) | écart | verdict | avant Ko | après Ko | passes ok (a/p) |
|---|---|---|---|---|---|---|---|
| accueil | — | — | — | — | — | — | 0/0 |
| brassins | — | — | — | — | — | — | 0/0 |
| stocks | — | — | — | — | — | — | 0/0 |
| finances | — | — | — | — | — | — | 0/0 |
| clients | — | — | — | — | — | — | 0/0 |
| houblons-v55 | — | — | — | — | — | — | 0/0 |


Lecture honnête :
- **Atelier V5.5 après repos (l'usage normal : l'accueil est resté ouvert) : 3 379 → 3 388 ms à froid (+9 ms, σ 48 / 70)** = niveau du tag ; l2 donnait 5 183 ms. Critère 1 tenu dans ce cas.
- **V5.5 touché aussitôt, à froid : 3 293 → 5 225 ms (+1 932 ms), 564 → 973 Ko.** Pas de gain de l3 sur ce cas (l2 : 5 183). Cause : 409 Ko (la bibliothèque, 347 Ko, et sa suite) ont quitté l'accueil et arrivent avec le Host ; à 200 Ko/s c'est ≈ 2 s de réseau. C'est un déplacement, pas une perte : accueil à froid 6 284 → 4 376 ms (−1 908 ms), donc « accueil puis V5.5 tout de suite » = 9,6 s avant, 9,6 s après. Je ne vois pas de levier sans réduire la bibliothèque elle-même (hors voie).
- **V5.5 à chaud : 3 199 → 3 488 ms (+289 ms, σ 91 / 30), classé PLUS LENTE** : l'évaluation de la bibliothèque (JSON 1,4 Mo, décodage) se fait à l'ouverture du Host au lieu du démarrage ; accueil chaud 733 → 524 ms (−209 ms) : somme +80 ms, dans le bruit de l'accueil (σ 117).
- Toutes les autres vues : plus rapides ou égales au bruit près (Stocks et Clients « touchées aussitôt » : +88 ms et +36 ms, « égal (bruit) » ; après repos −77 % et −17 %).
- Pas mesurées ici (hors banc l2) : Dépense, Conduite d'un brassin (l1 n/d), première ouverture de l'assistant de recette / de la page recette / du jour de brassage (la bibliothèque y est une dépendance statique : inchangé depuis l2).

## 5. Contrôles rejoués sur df8f6bb5
- `VITE_HOP_V4=on npx vite build` (sans patch) : exit 0 ; `check-build-flags` : DRAPEAUX OK ×2 ; `check-no-dev-auth` : exit 0. Graphe du build : Host 24 chunks sans la bibliothèque ; `App` et `index` sans consommateur ni bibliothèque ; aucune racine `RISQUE`.
- Suite complète : PAS rejouée sur df8f6bb5 (voir ci-dessous) ; les 4 rouges nouveaux de la passe précédente sont corrigés et verts isolément.

DEMANDE EXECUTANT :
1. (Fait par moi, voir § 4.)
2. Dans `%TEMP%/l2-wt` (HEAD df8f6bb5, arbre propre) : `npx vitest run tests/unit tests/integration --reporter=dot > work/missions/2026-11-10-lenteur/voies/l3/tests.txt` (en arrière-plan, ≈ 20 min, rien d'autre en parallèle) ; zéro nouveau rouge par rapport à : fuzzSaisie, recipeAiWorkflow, recipeEditing, designTokens, virgule-transversale + collectes `firebase-admin`/`firebase-functions`/`cheerio`.
3. (Fait par moi, voir § 5.)
4. Captures : `node mesure/banc-local.mjs 4175 froid 1 x.json sonde` avec `node mesure/serveur.mjs C:/Users/mrspa/AppData/Local/Temp/l3-dist-apres 4175` lancé avant (depuis `voies/l3/mesure`) ; ouvrir `%TEMP%/l2-accueil-4175.png` et `l2-vue-<brassins|stocks|finances|clients|houblons-v55>-4175.png` : contenu chargé, ni « Chargement de l'écran… », ni cassure, atelier V5.5 avec ses onglets.
5. À la main (données de test) : ouvrir l'atelier V5.5 depuis une recette (bibliothèque chargée avec le Host) ; ouvrir une fiche de brassin, la fermer, la rouvrir (lazy de l2).

DÉCISION À PRENDRE : (a) accepter le déplacement de 409 Ko de l'accueil vers V5.5 (accueil −1,9 s à froid, V5.5 +1,9 s si ouvert aussitôt, égal après repos, total identique) et déployer après les points 2 et 4 ; ou (b) une voie « bibliothèque plus légère » (filtrer les ~1,4 Mo aux champs lus par V5.5, ou la scinder par fabricant) pour gagner aussi le cas « aussitôt ». Je recommande (a) : le brasseur ouvre l'accueil, puis l'atelier, et le préchargement au repos (l2) couvre ce parcours. Tant que 2 et 4 ne sont pas verts, ne pas déployer.

CONNAISSANCE : (1) un test qui `vi.mock` un module ne doit pas être précédé d'un fichier de setup qui importe ce module (ou un module qui l'importe) : le mock ne s'applique plus ; un setup ne doit importer que des modules sans dépendance mockée. (2) `esbuild` retire les imports TS inutilisés : l'analyse AST d'imports (racines.mjs) SURESTIME la fermeture statique d'un chunk ; seul le graphe du build (`graphe-chunks.mjs`) fait foi. (3) `React.lazy` rend toujours après un tour de Suspense, même module en cache : les tests qui ouvrent un écran lazy utilisent `findBy*`.

LEÇON PROPOSÉE : un changement de sync vers async n'a pas besoin de propager `async` : une « porte » (promesse mémorisée + lecture synchrone qui lève si non chargée) attendue à l'entrée de l'écran suffit ; elle se prouve par le graphe du build, pas par l'analyse des sources.
