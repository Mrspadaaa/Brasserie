# Lot 22 · Comparer : « Lequel pour ma stout : Cascade, Idaho 7 ou Galaxy ? »

Brief commun des voies r6a à r6m (mission `work/missions/2026-10-22-reprise-lot21/`). Ta voie
(`voies/r6x-…/VOIE.md`) te donne ton angle et les choix que ta variante porte. Maquettes statiques
en français, fil de fer fidèle, hors de l'app. Chemins depuis la racine du dépôt
`C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie`.

## Pourquoi ce lot
Le brasseur, sur le lot 21 (20.10), mot pour mot :
- « pas de comparaison de houbon 1:1 donc ça nous aide pas à choisir si cascade, idaoh7, galaxy est
  mieux dans ntore cas. Manque aussi la partie chimie. » ;
- « pas de radar grpah ? » ;
- « plusieur confusion entre timing, comparaison, houbons side by side, on aurais suggestions,
  comparer, substituer, dryhopper ect ect.. ».

Ce qu'il garde, à reprendre ici :
- v1, « une meilleur vu de comparaison sur des vrai valeur mais de manière un peu trop ostère » ;
- w2, « pas trop mal dans la manière de comparé » ;
- y3, « la panel osu j'aime assez », mais « la molette prends trop de place ».

Le conseil du 22.10 (`cerveau/decisions/2026-10-22-carte-outils-houblons.md`) : Comparer ne fait
varier **que la variété**. Il porte α et rôle en tête, la base v4.9 (p06, radar avec intervalles),
la chimie rattachée aux familles, les vraies valeurs de v1 sous un toucher, la manière de w2 et le
panel OSU sans molette. Son pont : le gagnant ouvre Dryhopper.

## Obligatoire
1. **Un seul facteur libre : la variété** (D98, `controle-une-question.mjs`). Le titre pose la
   question. Un seul groupe de sélecteurs, `data-libre="houblon"` : retirer, échanger ou mettre en
   avant un houblon, deux options au moins. Tout le reste est fixé sur une ligne
   `data-role="contexte"`, avec un `data-contexte="<facteur>"` par facteur fixé (dose ou base,
   moment, jours, levure, bière). Cette ligne n'a ni bouton ni curseur. Au style / absolu, barres /
   radar : `data-lecture`. Le pont vers Dryhopper vit dans un `nav`.
2. **Les quatre acquis** (D99, `controle-acquis.mjs`), balisés `data-acquis` :
   - le radar avec intervalles, au rendu choisi pour ta variante (r2 ou r3) ;
   - la chimie : `data-compose` par ligne, avec le picto de sa famille ;
   - le panel OSU, mesuré (`data-nature="mesure"`, `data-source`) ;
   - au moins 3 vraies valeurs avec unité et source.

   Un acquis peut vivre derrière **un seul** toucher (bouton ou `summary` avec `aria-controls`, ou
   `data-ouvre-acquis`).
3. **L'honnêteté des données** : chaque vraie valeur porte sa source (`data-nature="mesure"`,
   `data-source`). Le simulé est marqué (« ~ », `data-nature="simule"`). Une grosse incertitude se
   voit. « Inconnu » n'est jamais 0. Un panel absent pour un houblon se dit.
4. **Penser en brasseur** (L04) : sur chaque houblon, dans l'ordre, le nom, l'α (D87, celui du lot ou
   la plage des fiches), le rôle en mot, les arômes en couleur, le moment et la dose, puis l'IBU. Le
   stock en icône seulement.
5. **Peu de texte** : 80 mots au plus au premier écran (consigne du 22.10 : 70 à 80), légende fermée
   non comptée. Les explications passent sous un toucher.
6. **Les exigences de toute l'app** (`controle-commun.mjs`, tout sauf MOTS, joué à part) :
   - couleurs, au style par défaut (D75), survol, pas de gros blocs, contraste 4,5:1 ;
   - l'appui long ouvre la vraie fiche (D25) ;
   - typographie standard, pictos au trait (D88), légende derrière un petit « ? » (D89) ;
   - l'usage en mot (D90), aucune valeur brute (D97).
7. **Les interdits** : rien sous `src/` ; jamais `.codex/hooks.json`,
   `source4-portable-bundle-manifest-01.json`, `functions/.env` ; pas de git ; jamais Gemini ;
   texte avec barres obliques inverses ou accents graves : outil Write ou Edit.

## Plancher à enrichir (L07) : ne recopie pas, fais mieux
- Base v4.9, Comparer : `work/refonte-frontend/v4/ecran-1/base/consolide/comparer.html` et
  `comparer-radar.html` (générateur `base/generateur/`, `comparer.js`, `radar.js`). Captures :
  `base/captures/consolide-comparer-390.png`, `consolide-comparer-radar-390.png`.
- Rendus du radar, lot 16 (`base/generateur/radar.js`, environ ligne 428) :
  - **r2** : un seul houblon plein (celui qu'on touche), les autres en contour, trait de 3 ;
  - **r3** : un petit radar par houblon, deux par rangée (`comparer.js`, environ ligne 313).

  Le brasseur trouvait les surfaces superposées « très compliqué à voir les différence avec les
  cileur sur le spider graph ».
- v1, w2 et y3 du lot 21 : `fils21-choisir/<v>/etat.html`, captures `fils21-choisir/captures/`
  (`v1-390.png`, `w2-390.png`, `y3-premier-ecran.png`).
- Acquis à garder (`cerveau/produit/acquis-valides.md`) :
  - le code couleur des arômes ;
  - les barres de l5b ;
  - Comparer variante 3 (barres et radar) ;
  - la fiche g1 ;
  - les radars m4 et h4 sans légende écrite ;
  - le panel OSU ;
  - la manière de w2 ;
  - les vraies valeurs de v1.

## Les données : un seul fichier, rien d'inventé
`work/refonte-frontend/v4/ecran-1/fils22-comparer/donnees/comparer-stout.json`, vérifié par la voie
r6e-entrees ; lis d'abord `donnees/ENTREES.md`. Il contient :
- `biere`, `style`, `echelle`, `familles` : la stout export 16D (Nugget 60′, 20 L, 4,75 % vol.) et
  l'échelle au style ;
- `houblons[]` (Cascade, Idaho 7, Galaxy, Nelson Sauvin) : α, β, rôle, usage, huiles, arômes, mots
  sans famille, composés (avec leurs sources), IBU par gramme, `grille` des profils simulés (moment
  × dose 1, 2, 4, 8 g/L × jours × levure), études de panel ;
- `panelOSU` : la courbe de dose mesurée de Cascade, échelle 0–15 ;
- `egalites` : dose égale (4 g/L, dry hop après fermentation, 3 j, US-05), effet égal (agrumes,
  référence Cascade 4 g/L ; tropical, référence Galaxy 4 g/L) et IBU égal (10 IBU à 10′ ; 5 IBU au
  whirlpool) ;
- `descripteurs.A` et `descripteurs.B` (voir plus bas).

Ta page lit ce fichier depuis son générateur. Elle ne fait que des sommes, des mises à l'échelle et
des interpolations, et dit lesquelles.

## Les choix ouverts : ta variante en porte certains, nommés dans ta VOIE
Le brasseur choisira en regardant les variantes (L24). Tes choix sont **fixes** dans ta page : ce ne
sont pas des réglages.
- **Radar** : r2 ou r3.
- **Base de comparaison** :
  - dose égale ;
  - effet égal sur l'arôme visé : chaque houblon à la dose qui donne le même gain que la référence ;
    la dose est un résultat montré, pas un réglage ;
  - IBU égal : chaque houblon à la dose qui donne 10 IBU à 10′.

  La base est écrite dans la ligne de contexte.
- **Porte « Je n'ai pas X »** : X = Nelson Sauvin, épinglé en colonne 1. Il est fixe, montré comme
  « pas en stock » et sert de cible. Les trois candidats se comparent à lui. Le facteur libre reste
  la variété des candidats.
- **Descripteurs, sur la fiche (appui long)** :
  - **A** : « groseille à maquereau » rangée dans Petits fruits. Seul Nelson Sauvin change ; ailleurs,
    A ne se voit pas, dis-le dans la NOTE ;
  - **B** : une part « autres » dessinée (`data-role="autres"`, `data-houblon`, neutre, ni hachurée
    ni aux couleurs d'arôme) à partir de `descripteurs.B` : mots génériques écartés, seuil 25 %,
    plafond 33 %. Ces trois réglages sont **proposés par le pilote et marqués « à corriger par le
    brasseur »** sur la page, par exemple dans la légende. Galaxy (cannabis, dank) la montre.

## Balisage commun
`data-houblon` sur chaque carte ou colonne ; `data-role="alpha"` avec `data-source` ;
`svg[data-famille]` au trait ; `data-nature` et `data-source` sur les valeurs ; `data-libre`,
`data-role="contexte"`, `data-contexte`, `data-lecture` (D98) ; `data-acquis`, `data-compose`
(D99) ; `data-role="autres"`, `data-part` (D100).

## Rendu, par variante (`<id>` = r6a…r6m)
- `fils22-comparer/<id>/generer.mjs`, qui écrit `fils22-comparer/<id>/etat.html` ;
- `fils22-comparer/<id>/NOTE.md`, au format de `fils18-baseline/l8e/NOTE.md` (ce qui tient, ce qui
  casse, contrôles, pire contraste). Elle contient une section **« Choix portés »**, avec les quatre
  lignes de ta VOIE recopiées mot pour mot ;
- les captures, dans `fils22-comparer/captures/`, prises avec
  `node work/refonte-frontend/v4/tournoi/outils/capture-page.mjs <page> <png> [hauteur]` ou puppeteer
  à 390 px :
  - `<id>-390.png` (page entière) ;
  - `<id>-premier-ecran.png` (390 × 844) ;
  - `<id>-fiche-390.png` (appui long sur un houblon) ;
  - `<id>-toucher-390.png` (l'acquis ouvert d'un toucher, ou un autre état utile).

  **Ouvre chaque capture en image** et juge-la avant de dire OK (L12).

## Contrôles
Ils sont dans le `GATES.md` de ta voie. Joue-les depuis la racine. Tu ne les modifies pas, et tu ne
contournes pas un contrôle par un balisage menteur : le relecteur ouvre tes captures.
