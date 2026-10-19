# Lot 13 · La carte et la fiche d'un houblon, ensemble (mini maquettes, #140)

Fils de fer statiques, 20 min par variante, puis tu livres ce que tu as. Écris en français.
Répertoire : C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie (chemins absolus).
Texte avec barres obliques inverses ou accents graves : outil Write, jamais Bash. Pas de git.
Ne touche à rien hors de `work/refonte-frontend/v4/ecran-1/fils13-carte-fiche/<ta variante>/` et
de `fils13-carte-fiche/captures/`.

## Ce que le brasseur a dit (19.10, soir), dans l'ordre

1. Sur les lots 12 et 12b, qui inventaient un autre geste : « Non... Un appuie long ouvre sa fiche.
   Comme avant, saufe que sa fiche est plus fourni avec les labels.. revoit et challenge de point avant
   de faire quoi que ce soit ».
2. Sur l'analyse qui a suivi : « Non, il faut changer la carte et tout. Mais c'est déjà pas mal comme
   visuel de base. Mais il y a quelques problèmes dessus... Donc fait moi des mini maquettes de ça ».

**Le point de départ, c'est la base** :
- **Le geste reste celui de la base** : un appui long de 500 ms, sur toute la carte (pas sur la
  pastille du moment, qui glisse), ouvre la fiche du houblon dans une feuille qui monte du bas.
- **La carte et la fiche peuvent changer**, mais leur visuel actuel est « déjà pas mal » : garde-le
  et corrige ses problèmes, sans tout redessiner.

## Ouvre et regarde d'abord la base

Les deux écrans sont dans `work/refonte-frontend/v4/ecran-1/base/` :
- `consolide/index.html` : l'écran, avec la ligne Nugget sur le rail (46 g à 60′, α 13 double,
  « résine 2/4 », 60 IBU, ses carrés) et les ajouts proposés Motueka, Citra cryo et Saaz Late ;
- `consolide/fiche.html` : la fiche de Nugget ouverte. Capture :
  `captures/consolide-fiche-390.png`.

La fiche contient, dans l'ordre :
- le nom ;
- l'α et sa réglette, et le rôle ;
- la table des moments (60′ 60, 10′ 22, whirlpool 9, à froid aucun) ;
- la roue des 12 familles, avec « Agrumes 1/4 » et « Melon? » ;
- la ligne de la demande (« + Floral marqué 2/4 − Résineux marqué 2/4 ») ;
- les actions (goût, Comparer) ;
- les replis Styles, Huiles, Sources et Substituts.

Le code : `ecran-1/base/generateur/fiche.js`, `commun.js` (`miniProfil`) et `radar.js` (`roue`).
Reprends leur allure en fil de fer gris. Les couleurs des familles restent : ce sont elles qu'il faut
relier.

## Les quatre problèmes à corriger (ils sont contrôlés)

- **P1 · Pas de lien** : sur la carte, les carrés sont en couleur ; dans la fiche, la roue est grise.
  Rien ne relie une case à sa famille.
- **P2 · Deux codes qui se contredisent** : la carte dit un niveau (plein marqué, clair cité, gris
  non décrit), la roue un compte (1/4).
  - Nugget : Agrumes et Épicé sont tous deux à 1 fiche sur 4. Agrumes a une case claire (cité),
    Épicé une case pleine, parce que Hopsteiner le nomme en premier.
  - Citra cryo : Agrumes est plein et Tropicaux clair, tous deux à 1 sur 1.
  - En tout, 26 niveaux « marqué » ne reposent que sur une fiche.
  - Deux façons d'en sortir : un seul code (le compte, partout), ou le niveau expliqué
    (« nommé en premier par Hopsteiner »).
- **P3 · Les mots cachés** : les mots des fiches font les couleurs, mais ils sont cachés dans
  « Sources ». Pour Nugget, chez Beer Maverick : herbacé, agrumes, gingembre, ananas, géranium,
  litchi, terreux, noix de coco. Chez Hopsteiner : « Pineapple, floral », familles déclarées Épicé,
  Floral, Herbacé. Hopsteiner (boutique US) : « woody and resiny ». Yakima Chief Hops : « woody ».
- **P4 · Une seule fiche** : « 1/1 » se lit comme un plein, alors que c'est une seule source (17
  houblons sur 32 ; Citra cryo n'a que Beer Maverick).

## Les données (rien d'autre, rien d'inventé)

`prototypes/houblons-v4/data/pack-fiches.json`, `fichesHoublons[]` : `aromes[]` (`family`, `name`,
`level`, `label`, `sources`, `of`, `authors`), `descripteurs`, `alpha`.

- **Nugget** (4 fiches) :
  - Agrumes cité 1/4 (Beer Maverick) ;
  - Tropicaux marqué 2/4 (Beer Maverick, Hopsteiner) ;
  - Floral marqué 2/4 (Beer Maverick, Hopsteiner) ;
  - Herbacé marqué 2/4 (Beer Maverick, Hopsteiner) ;
  - Résineux marqué 2/4 (Hopsteiner boutique US, Yakima Chief Hops) ;
  - Épicé marqué 1/4 (Hopsteiner, nommé en premier) ;
  - Terreux cité 1/4 (Beer Maverick) ;
  - les 5 autres non décrites.
- **Citra cryo** (1 fiche, Beer Maverick) :
  - Agrumes marqué (nommé en premier) ;
  - Tropicaux, Noyau, Melon et Floral cités ;
  - les 7 autres non décrites.
  - Mots : agrumes, pamplemousse, pêche, melon, citron vert, floral, groseille à maquereau, fruit de
    la passion, litchi.
  - α : 10–15 chez Beer Maverick ; 24,8 lu sur l'article. Défaut connu : la fiche porte les plages
    de Citra en pellets (#131), dis-le.

Relier un mot à sa famille : seulement par les listes de termes du moteur
(`src/data/hopExtrapolationBootstrap.json`, lues par `describeFamilies`). Un mot sans famille
(« mojito », « gingembre » ?) reste tel quel.

## Ta variante (ton message te donne tes numéros)

- **g1 · La fiche étiquetée** :
  - la carte change peu ;
  - dans la fiche, sous l'α, la même bande de 12 carrés que la carte, agrandie et étiquetée : une
    ligne par famille décrite (sa couleur, son nom, son niveau et pourquoi, ses fiches, ses mots) ;
  - les axes de la roue prennent la couleur de leur famille.
- **g2 · Un seul code, le compte** :
  - la carte et la fiche disent la même chose : le nombre de fiches qui citent la famille (par
    exemple une case remplie à 1/4, 2/4) ;
  - plus de « marqué » ;
  - une fiche unique se dit « 1 seule fiche ».
- **g3 · La roue en couleur** :
  - la roue garde sa place, mais chaque famille y prend sa couleur, et son étiquette dit son compte
    et un ou deux mots ;
  - les carrés de la carte suivent l'ordre de la roue, comme la roue déroulée.
- **g4 · Les mots sous la roue** :
  - la roue reste, en couleur ;
  - dessous, une ligne par famille décrite, avec ses mots de fiche en étiquettes colorées et ses
    sources ;
  - un bandeau « 1 seule fiche : Beer Maverick » quand il n'y en a qu'une.
- **g5 · La carte qui annonce sa fiche** :
  - sur la carte, chaque case dit son compte (par exemple un ou deux traits par fiche) et un petit
    signe « 1 fiche » pour un houblon à source unique ;
  - en tête des arômes de la fiche, la même bande agrandie, reliée à la roue.
- **g6 · Libre (chaud)** : ta meilleure correction des quatre problèmes, sur le visuel de base.

## Règles (contrôlées par `controle-carte-fiche.mjs`)

- **F1** : dans la fiche, chaque famille décrite a un élément de sa couleur, la même que sa case sur
  la carte. Couleurs : `.mini .c.f-*` de `etape-consolide.css` ; la teinte claire (cité) est la
  couleur mêlée de blanc.
- **F2** : deux familles au même compte qui ont des cases différentes sur la carte : la fiche dit
  pourquoi (« nommé en premier… »). Si tu choisis le compte seul, leurs cases seront pareilles.
- **F3** : dans la fiche, sans rien déplier, au moins 3 mots propres de Beer Maverick pour Nugget
  (parmi gingembre, ananas, géranium, litchi, noix de coco).
- **F4** : la fiche de Citra cryo n'écrit jamais « 1/1 », et dit « 1 seule fiche » (ou « une seule
  source »).
- **F5** : chaque famille décrite dit son nom et ses fiches (« 2 sur 4 », ou le nom des sources) ;
  « non décrit » est écrit.
- **F6** : la carte reste une carte. Au repos, elle garde le nom, l'α, la dose, l'IBU et le moment
  de la base. Elle a 14 mots au plus, un ajout proposé fait 72 px de haut au plus, et aucune légende
  n'est écrite au repos.
- **Le reste** : texte de 12 px au moins ; 90 mots au plus au repos ; la fiche garde la table des
  moments, les actions et les replis de la base, à leur place.

## Livrable et contrôles

Dans `fils13-carte-fiche/<numéro>/` :
- `vue.html` : l'écran au repos (barre, résumé IBU, la ligne Nugget sur le rail, les trois ajouts
  proposés) ;
- `fiche-nugget.html` : l'appui long sur Nugget, fiche ouverte ;
- `fiche-citra.html` : l'appui long sur Citra cryo, fiche ouverte ;
- `NOTE.md` : 3 lignes.

Convention :
- chaque carte porte `data-houblon` (`beermaverick-nugget`, `beermaverick-motueka`,
  `beermaverick-citra:cryo`, `beermaverick-saaz-late`) ;
- chaque case porte `data-famille`, `data-n` et `data-of` (le compte du pack) et `data-niveau` (ce
  que la case montre, de 0 à 2) ;
- la fiche porte `data-role="fiche"` ;
- chaque famille décrite y a un `data-explique="<family>"`.

Contrôles :
1. Capture des trois pages, la fiche en entier :
   - `node work/refonte-frontend/v4/tournoi/outils/capture-page.mjs <page> work/refonte-frontend/v4/ecran-1/fils13-carte-fiche/captures/<num>-<vue|fiche-nugget|fiche-citra>-390.png 1500`
   - pour `vue.html`, une hauteur de 844 suffit.

   **Regarde les trois captures.**
2. `node work/refonte-frontend/v4/tournoi/outils/controle-carte-fiche.mjs work/refonte-frontend/v4/ecran-1/fils13-carte-fiche <num>` : `CARTE-FICHE OK`. La base, en témoin, y échoue 23 fois.
3. `node work/refonte-frontend/v4/tournoi/outils/controle-fil6.mjs work/refonte-frontend/v4/ecran-1/fils13-carte-fiche <num> --objet=libre --pages=vue.html,fiche-nugget.html,fiche-citra.html` : `FIL6 OK`.
4. `node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs work/refonte-frontend/v4/ecran-1/fils13-carte-fiche <num> --max=90 --page=vue.html` : `MOTS OK`.

Réponse finale : une ligne par variante (le parti, ce qu'elle corrige, les contrôles).
