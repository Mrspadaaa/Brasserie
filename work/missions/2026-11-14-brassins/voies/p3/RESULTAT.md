OK — coque e11a et Adapter les volumes e10c portées ; 13 tests, tsc propre, 13 captures ouvertes ; 2 ACCORD, anciens tests à réviser

## Fichiers écrits
`src/ui/production/volumes/` (`AdapterVolumes.tsx`, `Coque.tsx`, `etapes.ts`, `familles.ts`, `phrase.ts`, `periode.ts`, `volumes.css`), `src/components/tabs/ProductionTab.tsx`, `tests/unit/port-p3-coque-volumes.test.tsx` (déplacé depuis `src/ui/production/__tests__/`), et dans la voie : `INVENTAIRE.md`, `banc.mjs`, `fixtures.json`, `journal.json` (0 geste sans effet, 0 erreur), `tests.txt`, `captures/` (13 PNG).
Pas touché : `productionCatalog.ts`, `App.tsx`, `FloatingActions.tsx`, `fabActions.ts`.

## Critères
- G1 : `TSC OK`. G2 : `TESTS OK` (13 tests). G3 : `CAPTURES OK`, INVENTAIRE écrit. G4 : `git status --short src tests` ne liste que des chemins de la voie (`HORS OK`).
- Filtre de période : le test « à l'écran : sous Ce mois » ÉCHOUE quand `ProductionTab` repasse `batches` et `globalTimeFilter` au catalogue (comportement d'origine), PASSE avec le correctif ; ProductionTab remis ensuite.

## Captures (toutes ouvertes à côté de la PNG de la maquette)
e11a : repos, recettes, geste (390 clair), repos cave 390, repos 1280. e10c : repos, repos-bas, geste (30 L, écarts), trop (36 L), refuse (2 500 L), vide (390 clair), repos cave 390, repos 1280. Le 1280 d'e10c est quasi identique à la maquette (panneau dans la tête, rail en deux colonnes).

## Écarts numérotés (combien : 6 ; 4 corrigés, 2 hors voie)
Corrigés dans la voie :
1. Eau « 0,0 L » alors que le calcul refusait (grain sans `use: empatage`) : inconnu devenu « — » (ligne et total), test écrit.
2. Quantités sans décimales fixes (« 5 kg » au lieu de « 5,00 kg », « 24 » au lieu de « 24,0 », « × 1 ») : décimales fixes comme la maquette.
3. Points du rail (Ébullition, Whirlpool) sans couleur (jeton inexistant) : jetons `--ebc-copper-texte` et `--ebc-amber-texte`.
4. Phrase des recettes toute rouge ; la maquette ne met en rouge que « depuis N j » : corrigé. Compteur Brassins (5) contredisait « 3 brassins » de la liste sous « Ce mois » : le compteur suit la liste. Liste déroulante : le nom seul, comme la maquette.
Restent, hors voie :
5. Le + flottant est « + », sans « Brassin » / « Recette » (e11a « plus-nomme »).
6. Le menu du + n'a pas « Outils houblons » ; « Atelier Houblons V5.5 » n'est plus atteint depuis l'onglet (encore depuis les fiches recette et brassin).
Limites visibles : la phrase du banc fait 4 lignes à 390 à cause des noms « ZZ … en fermentation » ; « 67 °C · 60′ » et « 19 °C » n'apparaissent que si la recette les porte (le banc les pose).

## ACCORD / DÉCISION À PRENDRE
- ACCORD : `filterCatalog` (`src/domain/productionCatalog.ts`, à côté de `pendingUndated`) est le bon endroit du filtre de période (un brassin planifié, en fermentation ou en garde ne dépend pas de la période). Contournement local gardé et réversible (`periode.ts`, liste Brassins reçoit `globalTimeFilter='all'`) ; à retirer quand la ligne est dans le domaine.
- ACCORD : porter `FloatingActions.tsx` / `fabActions.ts` (écarts 5 et 6) : libellé du + selon le sous-onglet, entrée « Outils houblons » → `route.open({ view: 'hopV55' })`. Un auteur dédié.
- DÉCISION À PRENDRE : tests existants hors Possède qui visent l'ancien écran Volumes et échouent maintenant : `tests/integration/productionVolumeBornes.test.tsx` (4), `compactProduction` (7 : « Volume cible » n'est plus un champ visible, il s'ouvre par le bouton ✎), `brewCreationBudgetContinuity` (1), ainsi que `productionCatalog` (3), `dashboardNavigation` (2) et `liveDataViews` (1) dont je n'ai PAS trié la cause (régression de mes changements, ou état des autres voies p1/p2 en cours, ou défaut déjà présent sur HEAD). Les mêmes assertions (99 999 L, 0 L, « 19,75 L ») sont reprises dans le test de p3. Recommandation : le pilote fait rejouer ces 6 fichiers sur HEAD (autre arbre) pour séparer l'ancien de ma part, puis un auteur réécrit ceux de Volumes sur le nouvel écran.
- CONNAISSANCE : `vitest.config.ts` n'inclut que `tests/**` et `prototypes/**` ; un test sous `src/**/__tests__/` ne tourne pas. Aussi : `scaleRecipe` calcule l'eau depuis les grains dont `use === 'empatage'` ; sans eux le plan d'eau est « invalid » et tout vaut 0.
- LEÇON PROPOSÉE : aucune.

## Essais
G1 à G4 : un essai chacun après correction ; le banc a été relancé 4 fois (saisie du curseur, eau, détails du moment).
