OK — Courses « N manquent · K au seuil », « Rien à commander » une fois, défilement par EntityList ; captures : DEMANDE EXECUTANT

Lot stock, tour 3 (T2-6a, T2-6b, T2-7). Arbre : `port-carnet` (branche claude/port-carnet-1711), sans commit.

## Fichiers écrits (port-carnet)
- `src/ui/EntityList.tsx` : `scrollParent` remplacé par `defileFenetre?: boolean` (faux par défaut) → `useWindowScroll` de react-virtuoso, sur les deux listes (groupée ou non) ; sans l'option, la classe `flex-1 min-h-0` et la zone défilante restent comme avant. Seul appelant de `scrollParent` : StocksTab.
- `src/components/tabs/StocksTab.tsx` : relais et import supprimés ; `defileFenetre` passé à EntityList ; les deux effets qui lisaient le parent (remonter au champ de recherche, redire la hauteur à la liste) parlent à la fenêtre (`window.scrollY/scrollTo`, `window.dispatchEvent('scroll')`) ; `CommandeRepliee` reçoit `manquent={comptesEtats.manque + comptesEtats.manquePlus}` (le compte même de la pastille).
- `src/ui/stock/defileFenetre.ts` : **supprimé** (relais ; plus aucun appel, `grep` : 0).
- `src/ui/stock/ChiffreACommander.tsx` : `phraseRepliee(vue, r, manquent?)` ; en-tête du bloc déplié sans « rien à commander » quand rien ne manque ; ligne repliée « À commander » quand rien et déplié.
- Tests : `tests/integration/stocksTour3.test.tsx` (neuf, 6 tests) ; `tests/integration/stocksVision1911.test.tsx` (relais retiré, test « défile par la fenêtre », attentes « 3 manquent »).
- Banc : `banc.mjs` (rejoue celui du tour 2 : vite `createServer` port 5613, HMR coupé), `banc-sortie.txt`, `tests.txt`.

## n° → fait → preuve
**T2-6a — « Rien à commander » une fois.** Replié : la ligne seule le dit. Déplié : la ligne devient « À commander », le gros chiffre « 0 à commander » n'a que son étiquette, et l'encadré dit « Rien à commander » une fois (le composant seul garde son encadré : `stockHorizon.test` « état vide » vert).
- Avant (vitest) : `expected [ 'Rien à commander', …(1) ] to have a length of 1 but got 2`. Après : vert, replié (1) et déplié (1).

**T2-6b — Courses dit les mots et le compte d'Étagère.** « 22 manquent · 2 au seuil » ; sans article au seuil, « 22 manquent » ; singulier « 1 manque ». Quand l'horizon ne retient pas tout : « 0 à commander avant S48 · 22 manquent · 2 au seuil ». `manquent` = compte de la pastille « manque » (états `infoLigne`, plancher « au moins » compris) ; « au seuil » = articles retenus par « à commander » qui n'ont pas cet état (stock pile au seuil).
- Avant (vitest) : `Unable to find role="button" and name /manque|seuil/` (la ligne disait « … · N en tout »). Après : vert ; le test lit N sur la pastille d'Étagère et exige `N manquent · 2 au seuil` (jeu : 2 articles pile au seuil), puis `N manquent` sans article au seuil, jamais « en tout ».

**T2-7 — défilement par la fenêtre.** Option d'EntityList.
- Avant (vitest) : `defileFenetre` ignoré → la zone défilante de Virtuoso restait (`overflow-y: auto`) et `stock-fenetre` existait : 2 des 3 tests en échec (le 3e, « par défaut », vert avant comme après : les autres écrans ne changent pas). Après : 3 sur 3 verts.
- `stocksVision1911` (en-tête qui part, aucun conteneur interne, Recompter collé) : vert.

## Contrôles
- G1 `npx vitest run tests/integration/stocksTour3.test.tsx` : 6 verts.
- G2 `npx tsc --noEmit -p .` : TSC OK.
- Voisins (26 fichiers qui importent StocksTab, `ui/stock/`, EntityList) : `tests.txt`. Rouge restant, hors de mon périmètre d'écriture (voir DEMANDE PILOTE) : 3 attentes de texte qui disaient « en tout ».
  Les échecs « Autres stocks » / `.l1e-n` (stockCompteursOnglet, stocksPaquetG n° 6) sont des délais dépassés sous charge (machine occupée par d'autres voies) : `stockCompteursOnglet` rejoué seul : 8 verts.
- Essais : 1 par critère ; banc : 4 essais, voir DEMANDE EXECUTANT.

## À corriger hors de mon périmètre (DEMANDE PILOTE)
Ces trois attentes lisent l'ancien texte ; à remplacer par le nouveau :
- `tests/integration/stockHorizonOnglet.test.tsx:82` : `/^2 à commander avant S\d+ · 4 en tout$/` → `/^2 à commander avant S\d+ · \d+ manquent? · \d+ au seuil$/` (à lire sur la pastille : 4 articles retenus, dont Gypse au seuil si pile ; sinon `· 4 manquent`). À regarder au rejeu.
- `tests/integration/stocksPaquetG.test.tsx:91` et `:96` : après « Tout », la ligne ne dit plus « 4 à commander » mais « N manquent[ · K au seuil] ».

## À regarder en vision (pilote)
Route `?dev-local`, onglet Stocks. Tailles : 390 tactile, 844×340, 1280 ; clair et cave.
1. Articles : faire défiler, l'en-tête de l'app part, la liste suit, rien ne défile à l'intérieur ; rayons et lignes alignés comme avant ; retour en haut après un filtre (le champ de recherche remonte).
2. Courses : la ligne repliée dit « N manquent · K au seuil » (ou « 0 à commander avant Sxx · … » quand l'horizon ne retient pas tout), sur une ligne, coupée en « … » à 390 plutôt que débordante.
3. Courses, rien à commander (stock qui couvre tout) : une seule fois « Rien à commander » ; déplié : « À commander », « 0 », l'encadré — pas trois fois.
4. Recompter : outils collés en haut pendant le défilement.

DEMANDE EXECUTANT : captures et mesures au navigateur (non faites : 3 essais de banc épuisés, la machine est saturée et le banc ne charge pas l'app).
- Essais : (1) vite `createServer` dans le script, cwd faux → Tailwind sans contenu ; (2) cwd corrigé → « Impossible de charger cet écran » (HMR coupé, ré-optimisation des dépendances) ; (3) createServer encore → « Cannot read properties of null (reading 'useContext') » (deux React) ; (4) banc du tour 2 repris tel quel (vite lancé en processus) → « Navigation timeout » (machine saturée). Les PNG des essais sont supprimés : aucune capture n'est donnée ici pour cette voie.
- Commandes, dans l'ordre (depuis la racine Brasserie, machine au repos : aucune autre voie ne lance de vitest ni de vite) :
  1. `netstat -ano | grep :5613` doit être vide.
  2. `cd work/missions/2026-11-19-tour3-correctifs/voies/stock && node banc.mjs > banc-sortie.txt 2>&1` (le banc lance `npx vite --port 5613 --strictPort` dans port-carnet, `?dev-local`, 34 articles « ZZ TEST » en mémoire ; premier chargement ~30 s).
  3. `netstat -ano | grep :5613` doit être vide à la fin (sinon `taskkill /PID <pid> /T /F`).
- Fichiers à produire : `mesures.json`, `banc-sortie.txt`, 6 PNG : `390-clair-art-400`, `390-clair-courses`, `390-cave-art-bas`, `844-cave-art-400`, `844-clair-recompter-300`, `1280-cave-courses`.
- Sorties attendues, ligne par page : Articles à y=400 : `enteteTop` négatif (≈ −400), `defileInterne` vide, `lignesVisibles` > 0 ; Recompter à 300 : outils `colle` à top 0 ; Courses : `rien` = 0 quand des articles manquent, `coupe` = false, et le texte replié `replie` de la forme « 0 à commander avant Sxx · N manquent[ · K au seuil] » (jamais « en tout »), N égal à `manque` lu sur la pastille d'Étagère ; `erreurs` = 0.
- Captures à ouvrir (Read) : les 6 PNG ; juger : en-tête parti, liste lisible, ligne repliée de Courses sur une ligne.
- Ne pas modifier le banc ni le code ; en cas d'échec, rendre la sortie brute.

## Doutes et limites
- La ligne longue « 0 à commander avant S48 · 22 manquent · 2 au seuil » se coupe à 390 (ellipsis, CSS du tour 2) : à juger en vision.
- « au seuil » compte aussi un article de quantité inconnue retenu par « à commander » : rare, noté.
- Aucune capture ouverte par moi : voir DEMANDE EXECUTANT. La preuve visuelle manque (L12) ; le critère G1 à G3 est tenu sur le code et les tests.

CONNAISSANCE : `react-virtuoso` `useWindowScroll` remplace le parent défilant : la liste n'a plus de classe `flex-1 min-h-0`, et ses mesures se redisent par un événement `scroll` sur `window`.

LEÇON PROPOSÉE : aucune
