# flc5 · les fiches telles qu’écrites, surlignées

- Lot D125, la liste de la fiche ; série c : les vraies valeurs d’abord (d’où vient chaque mot : fiche, année, nombre de fiches).
- **Chaleur : tiède.**
- Houblon montré au premier écran : Nugget. Les cinq houblons de référence (Nugget, Nelson Sauvin, Citra cryo, Motueka, Cascade) à un toucher sur leur nom ; l’appui long sur un nom ouvre sa fiche g1.

## L’idée
Chaque fiche lue est un extrait (auteur, année en tampon noir, ou « année ? » cerclé, site) : ses mots dans son ordre, surlignés à la couleur de leur famille ; un mot hors des 12 souligné en gris ; « Familles déclarées » encadrées. L’anglais est traduit, l’original en petit au-dessus (« Pineapple » sur ananas). En tête : le radar en silhouette et la bande des 12 familles de g1, au style 16D (Floral, Herbacé, Terreux d’abord, sous « ta 16D »).

## Ce qui tient
Rien n’est réinterprété : on lit les quatre fiches de Nugget, dont deux sans année dans le dépôt, et l’on voit que « Épicé » n’est qu’un rangement de Hopsteiner.

## Ce qui casse
Le radar n’a pas d’étiquettes (la bande à côté les porte) : écart à vérifier face à m4/h4. 89 mots hors données. Les mots communs à deux fiches ne se relient pas : il faut comparer les extraits.

## Baseline (plancher à enrichir)
- Pictos de famille au trait (planche fils17-standard/v3, épicé = cannelle et clou croisés, `p-spice`), couleurs des familles (jetons-familles.json).
- Nom, α de la fiche la plus récente avec son auteur et son année, puis le lot (« hors de ses fiches » pour Nelson Sauvin : 9,6 % contre 10–14 %), usage en mot (« double usage », « aromatique » ; pâle quand il est déduit de l’α), stock en petit badge (pack-fiches : Nugget épuisé, Nelson Sauvin 100 g, Citra cryo 65 g, Motueka 20 g, Cascade 60 g).
- Radar avant la liste (D115), 12 axes, agrumes en haut ; rayon = fiches qui citent / fiches lues ; non décrit = point creux au centre et secteur hachuré, jamais zéro.
- Au style par défaut (familles que la 16D accueille d’abord : floral, herbacé, terreux ; `data-role="zone"`), l’absolu à un toucher ; thème blanc ; la croix pour sortir ; légende derrière « ? » ; appui long ou survol long : la vraie fiche g1.
- Aucun écart : `--sans=mots` seulement, comme le GATES.

## Honnêteté
- Chaque mot vient de `prototypes/houblons-v4/data/pack-fiches.json` (descripteurs Beer Maverick, Hopsteiner, citations) ; le générateur échoue si une forme écrite n’y est pas.
- Traductions (D97) : White wine → vin blanc, fruity → fruité, grape → raisin, gooseberry → groseille à maquereau, Pineapple → ananas, woody → boisé, resiny et Resinous → résineux, Fresh lime et Lime → citron vert, lemon zest → zeste de citron, citrus → agrumes, black currant → cassis ; l’original reste lisible.
- Dédoublonnage par la forme française seulement (« fruity » et « Fruité » de Hopsteiner = un mot) ; aucun rattachement nouveau aux familles (gooseberry reste hors des 12 : l’option A attend le brasseur). Seule exception, sans effet sur les familles : « resiny » (sans famille au pack) et « Resinous » (résineux) de la même fiche boutique US ne font qu’un mot, « résineux ».
- Années : celle de la plage α de la même fiche (Beer Maverick 2023, Hopsteiner 2025) ; boutique US de Hopsteiner et Yakima Chief Hops : « année ? » (absente du dépôt).
- Une « Famille déclarée » de Hopsteiner est montrée comme un rangement, pas comme un mot goûté.

## Contrôles (joués le 24.10)
- Baseline : `controle-commun.mjs … flc1 … flc8 --page=etat.html --sans=mots` → couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, legende, parlant, brutes OK → **COMMUN OK**.
- Panel (8 premiers écrans de la série) : remplissage médian 0,56, 0 sous 0,50 · ressemblance moyenne 0,89 · 0/28 paires presque identiques → **PANEL OK**.
- Indicatif, `mots-premier-ecran.mjs --sans-donnees --max=80` : 89 mots (> 80) (série : MOTS ECHEC 3/8 au-dessus de 80 : flc1 105, flc3 87, flc5 89).
- Indicatif, `controle-une-question.mjs` : UNE-QUESTION ECHEC (aucun titre-question, aucun sélecteur libre reconnu, pas de ligne `data-role="contexte"`) : la fiche n’est pas un écran d’outil au sens de D98 ; son facteur libre est la façon de dire les arômes, pas un réglage.
- Indicatif, `controle-sans-famille.mjs` : SANS-FAMILLE ECHEC pour Nelson Sauvin (83 %) : pas de part « autres » neutre balisée `data-role="autres"` ; ses mots hors familles sont ici des éléments à part entière (ligne, colonne, tuile ou flux), pas une barre. D100 est conditionnel (option B).

## Fichiers
- `flc5/etat.html`, généré par `flc5/generer.mjs` sur le commun `flc1/commun-c.mjs`.
- Captures : `captures/flc5-premier-ecran.png`, `captures/flc5-page.png` ; états : `-absolu`, `-nelson`, `-motueka`, `-legende`, `-fiche-g1` (appui long réel).
