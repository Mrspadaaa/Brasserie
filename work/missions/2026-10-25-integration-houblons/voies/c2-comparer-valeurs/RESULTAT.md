OK — feuille Valeurs de Comparer : mot entier, « inconnu » levé (Mosaic), « Autres » publié, farnésène branché

## Fichiers écrits
- `tests/integration/comparerValeurs.chrome.mjs` (le contrôle, puppeteer-core)
- `tests/unit/hopIndexV4/comparerValeursCatalogue.test.ts` (6 tests)
- `src/ui/hopIndex/comparer/valeurs.ts`, `Huiles.tsx`, `Feuilles.tsx`, `comparer.css` ; `src/domain/hopIndex/v4/fiches.ts`
- `captures/` de cette voie (8 images, 390 et 1280)

## Ce qui a changé, point par point
1. **Ligne IBU** : le correctif du pilote est gardé (`overflow-wrap`, « ? » seul, raison au survol). Une amélioration : l'espace entre le nom d'étape et « ? » est insécable (` `), pour que « après » et « ? » restent ensemble. Avant : « dry hop après » puis « ? » seul sur une ligne.
2. **Mot coupé** : la cause était la colonne des noms à 76 px (`.pq-comparer-grille-tab`) avec `overflow-wrap: anywhere` sur `.pq-comparer-vn b`. Mesuré dans Chrome : « humulène » demande 56,4 px pour 56 px disponibles ; « caryo­phyllène » (avec césure douce) demande 79 px + picto 16 + écart 4. Règle ajoutée : `.pq-comparer-vh, .pq-comparer-vg { grid-template-columns: 102px repeat(var(--pq-n,3), minmax(0,1fr)) }`. Elle ne touche que l'en-tête et les lignes de la feuille Valeurs : « Ce que disent les fiches » et « 20 bières tirées » gardent 76 px. Le mode 4 colonnes (noms masqués) garde sa règle plus spécifique. Les trois colonnes passent de 90 à ~81 px à 390 px ; rien n'y déborde (contrôle).
3. **« inconnu »** : `compose()` ajoute `oils.myrcene/humulene/caryophyllene` (BM) et `hsLinalool.range` (HS) du catalogue aux fiches de composés, puis prend l'enveloppe. Mosaic affiche maintenant myrcène 47–55, humulène 10–16, caryophyllène 3–8 (BM). Aucune ligne ajoutée.
4. **« Autres »** : `oils.others` d'abord (Mosaic 20–40 %, Nelson 6–49 %, Citra 8–28 %). Repli : 100 − (myrcène + humulène + caryophyllène + farnésène s'il est publié) ; « ? » seulement si l'un des trois premiers manque.
5. **Fiche du moteur** : `huiles.composants.farnesene` lit `oils.farnesene` (Beer Maverick, année, url) ; `farneseneRaison` n'existe plus que s'il manque.

## Critères
- **Contrôle** : rouge sur 79ca35f5 (arbre propre en worktree tmp, dépôt `.env`/`seedData.ts` copiés, supprimé ensuite), 6 échecs :
  - cellules qui débordent (IBU : « dry hop actif à froid : ? » 118 px pour 86) ;
  - texte hors cellule et chevauchement entre colonnes 2 et 3 ;
  - mots coupés : `humulène, caryo­phyllène` ;
  - « inconnu » alors que le catalogue a la valeur : myrcène, humulène, caryophyllène de Mosaic.
  - Vert sur l'arbre final, en 390 × 844 et en 1280 × 800 (`COMPARER VALEURS OK`).
  - Commande : `node scripts/with_server.mjs --server "npm run dev -- --port 5203 --strictPort" --port 5203 --env VITE_HOP_V4=on -- node tests/integration/comparerValeurs.chrome.mjs [--large] [--captures <dossier>]`.
  - Il lit le catalogue dans `proto-data.json` pour décider de « le catalogue a la valeur ».
- `npx vitest run tests/unit/hopIndexV4 tests/unit/designTokens.test.ts` : 24 fichiers, 227 tests verts, `moteurInchange` compris (3/3, empreintes inchangées : le farnésène ajouté dans `hopSheet` n'entre pas dans le moteur).
- `npm run build` vert (20,6 s) ; `INPUT PROTECTION AUDIT PASSED: 647 protected usages in 335 files`.
- **Captures ouvertes et regardées** (`captures/`) : composition, chimie, ibu, bas, en 390 et en 1280. Comparées aux captures 6 de d2 : la composition est identique, sauf les trois valeurs « Autres » voulues (Nelson 7–49 → 6–49, Citra 9–28 → 8–28, Mosaic 21–40 → 20–40 : la valeur publiée remplace le calcul). Le tableau de chimie n'a bougé que par la colonne des noms et les valeurs de Mosaic. À 1280, la feuille est une fenêtre centrée de ~660 px : mêmes lignes, rien ne déborde.
- **Essais** : un par critère ; aucun échec à corriger après le premier passage du contrôle (le mot coupé et l'« inconnu » étaient les deux rouges attendus). Un détour : le banc de base démarrait sur un écran d'erreur faute de `.env` et `seedData.ts` (ignorés par git), copiés dans le worktree jetable.

## Doutes et limites
- Mosaic reste « inconnu » au linalol et au géraniol : le catalogue n'a ni `hsLinalool` ni géraniol pour lui (`others` n'est pas du linalol). C'est l'honnêteté voulue ; la consigne du pilote citait le linalol de Mosaic, qu'aucune source du dépôt ne donne.
- La cohumulone du catalogue n'est pas affichée dans Comparer : il n'y a pas de ligne, et la consigne interdit d'en ajouter. Le farnésène non plus (décision du pilote).
- Le hook du contrôle n'est pas branché dans `npm test` (script Chrome manuel, comme les autres bancs).
- Le fichier `src/ui/hopIndex/comparer/valeurs.ts` a un en-tête qui cite encore seulement `composes-houblon.json` (ma mise à jour du commentaire d'en-tête ne s'est pas appliquée ; le commentaire de la fonction `compose` est exact).
- L'IBU à 390 px prend une ligne par étape (5 lignes) au lieu d'une ligne qui débordait : c'est le prix du « ne déborde pas » ; si le brasseur préfère deux étapes par ligne, c'est un autre choix à lui montrer.

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : la colonne des noms de la feuille Valeurs (76 px) ne tient pas « picto + caryophyllène » (99 px) ; 102 px la fait tenir. Un banc d'arbre propre dans `os.tmpdir()` exige `.env`, `.env.local`, `src/data/seedData.ts` et `prototypes/houblons/data.json` copiés (ignorés par git), sinon « Impossible de charger la brasserie ».
LEÇON PROPOSÉE : aucune

---
## Suite (message du coordinateur, trois défauts de plus) — ARRÊT PROPRE demandé à 79 % du quota

Fait et prouvé :
1. **Huile totale** : `huile()` (valeurs.ts) prend l'enveloppe des fiches de composés, de `oil` (BM) et de `hs.totalOil` (HS). Mosaic affiche « 1–1,5 » (BM), capture `captures/haut-390.png` ouverte. `huileDe` (calcul.ts, non possédé) lisait déjà `huile()` : les têtes et l'outil Huiles prennent donc la même enveloppe (Nelson Sauvin garde HS + BM).
2. **Encadré ⇄** : il lisait déjà `compose()`/`huile()` (une seule source) ; après le correctif, ses lignes concordent avec le tableau. Seul défaut restant : « ? borne seule » s'affichait aussi quand la donnée manque. Maintenant : « ? inconnu » si une valeur manque, « ? borne seule » seulement si les deux existent et que l'une n'a qu'une borne (Feuilles.tsx, 1 ligne).
3. **En-tête** : `.pq-comparer-vh > span + span { padding: 0 4px 0 2px }` donne 10 px d'écart au plus étroit ; « Nelson Sauvin » passe à la ligne entre deux mots (« Nelson / Sauvin »), police inchangée (12 px). Mesure : 5,1 px avant, 46,1 px après (texte de la première ligne la plus large vs le nom suivant).

Contrôle (`tests/integration/comparerValeurs.chrome.mjs`) : trois cas ajoutés (huile dans les lignes attendues, encadré ⇄ comparé au tableau avant et après ⇄, écart d'en-tête ≥ 8 px).
- Rouge sur 1ea6ddd1 (arbre jetable, supprimé) : 10 échecs : écart 5,1 px ; huile Mosaic « inconnu » ; « borne seule » à tort sur linalol, géraniol, 4MMP, huile totale (encadré 1 et 2).
- Vert sur l'arbre final, 390 × 844 (`COMPARER VALEURS OK`).
- `npx vitest run tests/unit/hopIndexV4 tests/unit/designTokens.test.ts` : 25 fichiers, 236 tests verts, moteurInchange compris (3 tests de plus pour l'huile).
- `npm run build` vert ; `INPUT PROTECTION AUDIT PASSED`.
- Capture ouverte : `captures/haut-390.png` (en-tête, encadré ⇄ après échange, α, β, huile).

Fichiers modifiés, NON commités : `src/ui/hopIndex/comparer/valeurs.ts`, `Feuilles.tsx`, `comparer.css`, `tests/integration/comparerValeurs.chrome.mjs`, `tests/unit/hopIndexV4/comparerValeursCatalogue.test.ts`, `captures/` de la voie. (`index.tsx`, PageShell et les autres CSS modifiés dans l'arbre ne sont pas à moi.)

Reste à faire :
- Contrôle et captures en **1280 × 800** du haut de la feuille : non rejoués après ces trois correctifs (`node tests/integration/comparerValeurs.chrome.mjs --large --captures <dossier>`) ; les captures 1280 du dossier datent de la première passe.
- Commit des fichiers ci-dessus, par chemins.
- Le commentaire d'en-tête de valeurs.ts cite encore seulement composes-houblon.json (cosmétique).
