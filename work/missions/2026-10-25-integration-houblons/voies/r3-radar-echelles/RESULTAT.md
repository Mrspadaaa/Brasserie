OK — Radar de Comparer : échelle au style fixe d'un moment à l'autre ; Absolu : bande du style, échelle 0 au plus fort

## Ce qui change
- **D189, au style** : le bord de chaque axe (le chiffre écrit près du picto) est le plus fort apport de la famille sur les cinq moments (60′, 10′, WP, dry hop actif, après) et sur tous les houblons comparés. Il ne bouge plus quand on change le moment ; la forme grandit vers le dry hop et rétrécit à 60′ (aire de la retenue : 4 104 à 60′, 37 104 au dry hop après ; avant : 37 414 et 37 104, soit la même taille). Les bords sont écrits dans la capture : 2,5 · 4 · 4,8 · 3,9 · 4,5 · 2,7 · 3,9 · 0,8 · 3 à tous les moments.
- **D187, Absolu** : la plage type du style est dessinée en bande (bas et haut de la bande de chaque famille, en crans de la famille, vert pâle sous la grille, comme la zone au style). L'échelle commune va du 0 au plus fort de ce qui est montré (houblons, ta bière, haut de la bande) : 0 à 5 sur le cas de fixtures, au lieu de 0 à 12,5. Les séries s'étalent : point le plus loin de Citra à 97 % du rayon utile, Nectaron à 80 %.
- **Substituer** : pas de défaut D189. Son radar est en Absolu à échelle fixe (0, cité, marqué), indépendante du moment ; la puce de moment change les valeurs, pas l'échelle. Rien modifié.
- Choix gardés, contrôlés verts : trou du 0 (D114), points écartés (D186), tiretés le long du bord (D180), contour de l'original au-dessus (D156), bloc « sans donnée » (rdg5), cmc2k (aucune ligne touchée hors du radar).

## Fichiers écrits
- `src/ui/hopIndex/commun/RadarBase.tsx` : props `echellesAxe` (bord par axe donné par l'écran) et `bande` (plage du style en Absolu) ; `echelle()` exportée ; en-tête mis à jour (D187, D189).
- `src/ui/hopIndex/comparer/Radar.tsx` : lit les cinq moments (`lireColonnes` mémoïsé sur recette et houblons, seulement au style), `bordsAuStyle()` ; en Absolu, bande lue dans `style(recette.styleCode)` et échelle 0 → max.
- `tests/integration/controle-radar-echelles.mjs` (Chrome, D189 + D187) ; `tests/unit/hopIndexV4/radarEchelles.test.tsx` (5 tests).
- `voies/r3-radar-echelles/img/` : captures avant (HEAD) et après, pages et radars seuls.

## Critères
- **D189 + D187, rouge sur HEAD** : `ECHELLES ECHEC 14` (échelle qui change entre 60′ et dry hop sur 9 axes ; surface de la retenue à −1 % à 0 % quand les valeurs montent de 301 à 460 % ; pas de bande ; ta bière à 2 % du rayon utile). Puis, sur mes fichiers : `ECHELLES OK` (8 paires de moments jugées, bande à 24 sommets).
- `npx vitest run tests/unit/hopIndexV4/radarEchelles.test.tsx` : 5 tests verts (dont le vrai écran en jsdom aux cinq moments, et Absolu avec bande).
- `npx vitest run tests/unit/hopIndexV4` : 800 verts, 7 rouges, hors de ma voie : `departage.test.ts` (4), `palierDryhop.test.ts` (1), `suggererRemplacementsDifferes.test.tsx` (1) et un « Timeout calling onTaskUpdate » du worker. Aucun n'importe le radar ; ils portent sur `src/domain/hopIndex/v4/` (departage.ts, voies.ts, pouvoir.ts, profil-simule.ts : fichiers modifiés par f8 en vol). Non rejoués sur HEAD (pas de stash).
- `npm run build` : vert.
- `controle-radar-lisible.mjs` : `LISIBLE OK` (une première exécution a planté dans puppeteer, `Frame.$`, au démarrage ; la deuxième est verte, sans changement de code). `controle-trou-du-0.mjs` : `TROU OK`. `controle-points-confondus.mjs` : `CONFONDUS OK` (pire part cachée 30 %, seuil 50 %).
- Captures ouvertes en image : `img/absolu-page-avant.png`, `img/absolu-page-apres.png`, `img/absolu-apres.png`, `img/style-60-avant.png`, `img/style-60-page-apres.png`, `img/style-dryhop-apres-page-apres.png` (390 × 844, fixtures `?dev-local`, Citra cryo contre Nectaron, recette de fixtures en 16D). Au style, la forme à 60′ est petite et celle du dry hop grande, bords chiffrés identiques ; en Absolu les séries sont lisibles, la bande verte tient du petit anneau à son plafond.

Essais : un par critère après le correctif ; un faux départ en cours de route (voir doutes), corrigé avant le contrôle final.

## DEMANDE EXECUTANT :
Rejeu de contrôle et captures d'état à ouvrir (le pilote juge ensuite). Depuis la racine :
1. `node scripts/with_server.mjs --server "npm run dev -- --port 5281 --strictPort" --port 5281 --env VITE_HOP_V4=on -- node tests/integration/controle-radar-echelles.mjs --etat=apres --rendre=work/missions/2026-10-25-integration-houblons/voies/r3-radar-echelles/img` → `ECHELLES OK`.
2. `node scripts/with_server.mjs --server "npm run dev -- --port 5251 --strictPort" --port 5251 --env VITE_HOP_V4=on -- node tests/integration/controle-radar-lisible.mjs` → `LISIBLE OK`.
3. `node scripts/with_server.mjs --server "npm run dev -- --port 5271 --strictPort" --port 5271 --env VITE_HOP_V4=on -- node tests/integration/controle-trou-du-0.mjs` → `TROU OK`.
4. `node scripts/with_server.mjs --server "npm run dev -- --port 5274 --strictPort" --port 5274 --env VITE_HOP_V4=on -- node tests/integration/controle-points-confondus.mjs` → `CONFONDUS OK`.
5. Si on veut le cas du brasseur (22A) : poser le style 22A dans le brouillon de fixtures, puis `--houblons=beermaverick-citra:cryo,beermaverick-nectaron` ; non fait ici (le brouillon de fixtures est en 16D).
Fichiers à produire : `img/style-60-page-apres.png`, `img/style-dryhop-apres-page-apres.png`, `img/absolu-page-apres.png`, `img/bilan-apres.json`.
À ouvrir : ces trois captures, et dire si, à 60′ puis au dry hop, la forme change de taille et si les bords chiffrés restent identiques ; si, en Absolu, la bande verte se voit et si aucune série n'est écrasée au centre.

## Doutes et limites
- **Cas du brasseur non reproduit** : ses captures sont en 22A ; les fixtures sont en 16D (Citra contre Nectaron, mêmes houblons). La bande et l'échelle de 22A viennent des mêmes lignes de `style-bands.json`, mais je n'ai pas vu sa recette. Si le haut de la bande de 22A est loin au-dessus des apports de 4 g/L, l'échelle prendra la bande et les séries resteront plus courtes : c'est le prix de « montrer la plage type » avec une échelle commune. À regarder sur son cas.
- **« Du minimum au maximum »** : j'ai gardé le 0 comme bas de l'échelle (le petit anneau du zéro, D114). Un bas au-dessus de 0 ôterait son sens au trou du 0 ; sur ces cas, le minimum des valeurs est de toute façon près de 0. Si le brasseur veut vraiment un bas relevé, c'est une autre décision.
- **Ta bière en Absolu** reste près du centre (0,04 du rayon utile) : sans houblon elle est honnêtement presque nulle sur ces familles ; je ne l'étire pas. Le contrôle la laisse hors de la règle des 15 %, et le dit.
- **Au style, le bord est le plus fort apport sur tous les moments**, pas le haut de la plage du style : la zone verte (ce que la 16D laisse au-dessus de ta stout) reste dessinée, rognée au bord si elle le dépasse. Un bord pris sur la zone rétrécirait les formes. Choix à confirmer si « l'échelle du style » voulait dire la zone.
- Surcoût : cinq simulations par houblon (5 × `comparer`) au style, mémoïsées ; mesure en jsdom : cinq changements de moment en 0,4 s au total. `index.tsx` calcule déjà `etapes` et `cols` ; il pourrait passer ses colonnes par moment pour éviter le doublon (voir décision).
- Faux départ : j'avais d'abord tiré les bords de `lireEtapes` ; ses crans sont nuls là où ta bière est inconnue sur la famille (melon), alors que le radar lit `dCran` depuis 0 : l'échelle de melon changeait encore. Corrigé en lisant `lireColonnes` à chaque moment, comme le radar.

DÉCISION À PRENDRE : Suggérer (`src/ui/hopIndex/suggerer/radar.tsx`) lit un `moment` et dessine au style avec le bord de chaque axe pris sur les séries du moment : même défaut D189 probable. Il est hors de ma voie. Options : (a) lui donner `echellesAxe` par la même méthode (un autre écran, une voie courte) ; (b) laisser. Recommandation : (a), et profiter de la même voie pour que `index.tsx` de Comparer passe ses colonnes par moment à `Radar` (supprime le doublon de calcul).

CONNAISSANCE : l'écart `lu.ecart[f]` de `lireEtapes` est null quand ta bière est inconnue sur la famille, alors que `dCran` (lireColonnes) lit alors depuis 0 : les deux ne sont pas interchangeables pour une échelle.

LEÇON PROPOSÉE : aucune
