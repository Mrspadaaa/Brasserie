OK — Stocks défile avec la fenêtre ; Courses dit le vrai compte, une fois ; pastille : banc seul

Lot stock, tour 2 (vision du 19.11 : APP-ENTETE-COLLE partiel côté Stocks, neufs n° 2, 3, 6). Arbre : `port-carnet` (branche claude/port-carnet-1711), sans commit.

## Fichiers écrits (port-carnet)
- `src/components/tabs/StocksTab.tsx` : hauteur d'écran fixe retirée sur Articles et Courses (classe `stocks-fenetre`) ; Étagère : plus de `overflow-y-auto`, la liste s'appuie sur un relais de la fenêtre ; Recompter : outils `sticky top-0` (ils restaient fixes avant, ils le restent) ; Courses : plus de conteneur défilant, plus de bloc « Rien à commander… / n articles viennent plus tard » ; le bandeau ne garde que « Tout voir » ; liste : `pb-10` à 1280.
- `src/ui/stock/defileFenetre.ts` (neuf) : `brancherSurFenetre(el)`, un élément fixe et invisible qui répond comme la fenêtre (`scrollTop` = `scrollY`, `scrollHeight`, `scrollTo`, événement `scroll` relayé) pour `customScrollParent` de react-virtuoso.
- `src/ui/stock/ChiffreACommander.tsx` : `phraseRepliee` et `horizonCourt` ; la ligne repliée dit « 0 à commander avant S48 · 24 en tout », « 2 à commander avant S48 · 4 en tout », « 4 à commander », ou « Rien à commander » seulement quand rien ne manque.
- `src/ui/stock/chiffreACommander.css` : la phrase repliée peut se couper en « … » au lieu de déborder.
- `src/ui/stock/outils.css` : en paysage bas (≤ 480 px), la hauteur imposée par `src/ui/stocks.css` ne s'applique plus à Articles et Courses.
- Tests : `tests/integration/stocksVision1911.test.tsx` (neuf, 4 tests) ; `tests/integration/stockHorizonOnglet.test.tsx` (attente du bandeau mise à jour).
- Banc : `tour2/stock/banc.mjs`, `mesures.json`, 6 captures.

## n° → fait → preuve
1. **APP-ENTETE-COLLE (Stocks)** → Articles (Étagère, Recompter) et Courses défilent avec la fenêtre.
   - Vitest, avant la correction : `expected 'stocks-screen flex flex-col h-[calc(1…' not to match` et `Unable to find [data-testid="stock-fenetre"]` (4 tests sur 4 en échec). Après : 4 sur 4 verts.
   - Mesures au DOM (port 5602, ?dev-local, 34 articles « ZZ TEST » injectés en mémoire) : en-tête à −400 après `scrollTo(0,400)`, à 390 et 1280, dans les deux thèmes ; à 844×340 : −328 (la page est plus courte). Aucun conteneur interne qui défile (`int: 0`). La liste virtualisée suit : 11 lignes rendues et visibles à 400, et encore 11 en bas de page (390). Recompter : outils collés à `top: 0` après 300 px (390, 844, 1280).
   - Captures ouvertes : `390-clair-art-400.png` (en-tête parti, rayon Malts, lignes), `844-cave-art-400.png`, `844-clair-recompter-300.png` (premier passage : outils partis à 844 ; corrigé par la règle `outils.css`, mesure à top 0).
2. **Courses, donnée trompeuse** → la ligne repliée dit le compte de l'horizon, puis le total de Tout : « 0 à commander cette semaine · 24 en tout ». Elle ne dit plus « Rien à commander » quand des articles manquent.
   - Vitest : avant, `expected <p …>Rien à commander…</p> to be null` ; après, vert. Le test compare aussi la pastille « manque 3 » d'Étagère au replié « 0 à commander avant S… · 3 en tout ».
   - Banc, 6 pages : `rep: "0 à commander cette semaine · 24 en tout"`, `rien: 0`, `coupe: false`. Captures ouvertes : `390-clair-courses.png` et `1280-cave-courses.png`.
3. **« Rien à commander » dit deux fois** → une seule phrase de compte. Le bandeau ne garde que « Tout voir ». Quand rien ne manque : « Rien à commander » une fois, puis la raison (« Le stock couvre… »).
   - Vitest : avant, `expected [ 'Rien à commander', …(1) ] to have a length of 1 but got 2` ; après, vert. Les mots « à commander » et « avant S.. » ne paraissent qu'une fois dans la zone.
   - Banc : `ac: 1`, `av: 0`.
6. **Pastille « Compagnon hors connexion · mode local »** → **banc seulement**, rien n'est changé.
   - `src/App.tsx:1154` : `localOnly={isDevLocal}`.
   - `src/App.tsx:425` : `isDevLocal = import.meta.env.DEV && currentUser?.email === 'dev-local@localhost'`. La pastille n'existe donc pas dans le paquet de production.
   - La pastille de bureau « Compagnon : … » ne paraît que hors mobile, et seulement quand une question est en cours (`BrewerActivity.tsx:173`).
   - Au banc, en bas de liste, la dernière ligne finit à 476 px et la pastille commence à 571 px (390) : rien n'est couvert en fin de liste. En cours de défilement, elle passe sur les lignes, comme tout élément fixe (`390-cave-art-bas.png`, `844-cave-art-400.png`).

## Contrôles
- `npx tsc --noEmit -p .` : 0 ligne, sortie 0.
- Vitest : 45 fichiers (tous les tests qui importent StocksTab ou `ui/stock/`, plus `tests/unit/stock`) : 519 verts, 1 sauté, 0 échec.
- Pas de `npm run build` (consigne). Le vite du port 5602 est arrêté (`netstat` : 0 écoute).
- Essais : n° 1, 3 passes de banc (injection ratée au 1er onglet, puis 844 Recompter) ; n° 2 et 3, 1 passe ; test Recompter corrigé une fois (rôle `tab`).

## Doutes et limites
- **Relais de fenêtre** : c'est un adaptateur qui imite un élément qui défile. Il dépend de ce que react-virtuoso lit (`scrollTop`, `scrollHeight`, `offsetHeight`, `getBoundingClientRect`, `scroll`). Il a été vérifié avec la version installée (`node_modules/react-virtuoso/dist/index.mjs`, fonctions `io` et `$e`). La version propre serait une option `useWindowScroll` dans `src/ui/EntityList.tsx`, hors de mon périmètre (voir DÉCISION).
- **« 24 en tout » contre « manque 22 »** : au banc, Étagère dit « manque 22 », et Courses « 24 en tout ». Les 2 de plus sont des articles exactement au seuil, que `articlesACommander` retient (« à définir ») et qu'Étagère classe « au seuil · bas ». Il n'y a pas de contradiction de mot (« en tout » ne dit pas « manquent »), mais l'écart se voit. Dans le jeu du critique, les deux comptes valaient 24.
- **Horizon par défaut** : sans brassin planifié, « cette semaine » ne compte que les besoins datés. Les épuisés au seuil n'entrent que dans Tout : c'est la règle de la Pastille C choisie, non touchée. Le bloc déplié garde sa phrase « Rien à commander dans ces semaines / n articles viennent plus tard » (maquette choisie, règle n° 1). Or « plus tard » est inexact pour des articles au seuil.
- **Courses avec 0 dans l'horizon** : la page est nue (ligne repliée, puis « Tout voir »). C'est honnête, mais vide.
- **Hauteur d'écran conservée** : Fûts, Matériel et Houblons gardent `h-[calc(100dvh-8.5rem)]` et leur défilement interne (Carnets a un champ en bas). Ils sont hors de la plainte, et non mesurés.
- **FAB** : à 844, le + couvre la quantité de la ligne qui passe dessous. C'était déjà le cas avant, hors lot.

DÉCISION À PRENDRE : remplacer le relais `defileFenetre.ts` par une option `useWindowScroll` dans `src/ui/EntityList.tsx` ? Options : (A) garder le relais, qui marche et ne touche que mon périmètre ; (B) ajouter `defileFenetre?: boolean` à EntityList, qui le passe à Virtuoso, puis supprimer le relais (environ 6 lignes). Recommandation : B, au prochain lot qui possède EntityList.

DÉCISION À PRENDRE : faut-il que le total de Courses s'aligne sur la pastille « manque » d'Étagère quand des articles sont pile au seuil ? Options : (A) laisser « 24 en tout », qui est le compte de Tout ; (B) dire « 22 manquent, 2 au seuil » ; (C) faire compter à Étagère ces articles en « manque ». Recommandation : A pour l'instant, B si le brasseur relève l'écart (pilote ou brasseur).

CONNAISSANCE : react-virtuoso `customScrollParent` n'accepte pas la fenêtre (il lit `getBoundingClientRect` et `scrollTop` de l'élément). Pour un défilement par la fenêtre, il faut `useWindowScroll`, ou un relais fixe qui imite la fenêtre. `src/ui/stocks.css` impose `.stocks-screen{height:…}` sous 480 px de haut : toute vue qui défile avec la fenêtre doit l'annuler.

LEÇON PROPOSÉE : aucune
