# flc6 · où vont les mots

- Lot D125, la liste de la fiche ; série c : les vraies valeurs d’abord (d’où vient chaque mot : fiche, année, nombre de fiches).
- **Chaleur : chaude.**
- Houblon montré au premier écran : Nelson Sauvin. Les cinq houblons de référence (Nugget, Nelson Sauvin, Citra cryo, Motueka, Cascade) à un toucher sur leur nom ; l’appui long sur un nom ouvre sa fiche g1.

## L’idée
Un flux de gauche à droite : les fiches (BM 2023, HS 2025, en blocs noirs) → les mots qu’elles disent (une pastille par mot, avec 2/2) → la famille qui les range, ou « Hors des 12 », hors du radar. Un flux = une citation ; un rangement est pâle. En tête, en gros : « 2 mots sur 7 dans le radar · 5 restent dehors, dont 4 que ses 2 fiches disent ». Au style, les trois familles de la 16D en tête des destinations (même vides : « personne »).

## Ce qui tient
C’est la réponse chiffrée à « Nelson Sauvin paraît ordinaire » : on voit les quatre mots les plus sûrs partir hors du radar, et les deux seules couleurs venir de rangements. Fonctionne aussi pour Motueka (tout coule vers Agrumes).

## Ce qui casse
Forme inhabituelle pour une fiche : il faut un temps pour lire le sens du flux. La colonne de droite est étroite (« Hors des 12 » sur deux lignes).

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
- Indicatif, `mots-premier-ecran.mjs --sans-donnees --max=80` : 65 mots (série : MOTS ECHEC 3/8 au-dessus de 80 : flc1 105, flc3 87, flc5 89).
- Indicatif, `controle-une-question.mjs` : UNE-QUESTION ECHEC (aucun titre-question, aucun sélecteur libre reconnu, pas de ligne `data-role="contexte"`) : la fiche n’est pas un écran d’outil au sens de D98 ; son facteur libre est la façon de dire les arômes, pas un réglage.
- Indicatif, `controle-sans-famille.mjs` : SANS-FAMILLE ECHEC pour Nelson Sauvin (83 %) : pas de part « autres » neutre balisée `data-role="autres"` ; ses mots hors familles sont ici des éléments à part entière (ligne, colonne, tuile ou flux), pas une barre. D100 est conditionnel (option B).

## Fichiers
- `flc6/etat.html`, généré par `flc6/generer.mjs` sur le commun `flc1/commun-c.mjs`.
- Captures : `captures/flc6-premier-ecran.png`, `captures/flc6-page.png` ; états : `-absolu`, `-nelson`, `-motueka`, `-legende`, `-fiche-g1` (appui long réel).
