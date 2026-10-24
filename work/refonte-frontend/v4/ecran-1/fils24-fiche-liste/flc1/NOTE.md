# flc1 · g1 affiné, chaque mot signé

- Lot D125, la liste de la fiche ; série c : les vraies valeurs d’abord (d’où vient chaque mot : fiche, année, nombre de fiches).
- **Chaleur : froide.**
- Houblon montré au premier écran : Nugget. Les cinq houblons de référence (Nugget, Nelson Sauvin, Citra cryo, Motueka, Cascade) à un toucher sur leur nom ; l’appui long sur un nom ouvre sa fiche g1.

## L’idée
La fiche g1 telle qu’il l’a vue (feuille sur l’étape Houblons 3/7, IBU, OG, EBC, « Nugget », α 11–14 % Hopsteiner 2025 et lot 13 %, double usage, ✕ rond, ♡ ⊘ Comparer, Styles › Huiles › Sources › Substituts ›), le radar avant la liste (D115). Seule la liste change : chaque mot porte la marque de chaque fiche qui le dit, avec son année (BM²³, HS²⁵, HS US ?, YCH ?). Une marque creuse = un rangement du fournisseur (« Familles déclarées »), pas un mot goûté. Les mots hors des 12 familles ont leur ligne « Hors des 12 », rangée à son nombre de fiches (Nelson Sauvin : en tête, 2/2). Le mot qui ne fait que redire la famille (« floral » sous Floral) passe en gris. Sous le radar : les fiches lues, avec année et nombre de mots.

## Ce qui tient
Tout ce que g1 avait, au même endroit. On lit d’où vient chaque mot sans toucher. Nelson Sauvin : « vin blanc, fruité, groseille à maquereau, raisin » 2/2 en tête, et Agrumes, Épicé « rangé sous » : on voit que son radar ne tient qu’à deux rangements.

## Ce qui casse
Les marques BM²³ se répètent sur chaque mot : dense, 105 mots hors données au premier écran. Les codes BM, HS demandent la légende la première fois.

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
- Indicatif, `mots-premier-ecran.mjs --sans-donnees --max=80` : 105 mots (> 80) (série : MOTS ECHEC 3/8 au-dessus de 80 : flc1 105, flc3 87, flc5 89).
- Indicatif, `controle-une-question.mjs` : UNE-QUESTION ECHEC (aucun titre-question, aucun sélecteur libre reconnu, pas de ligne `data-role="contexte"`) : la fiche n’est pas un écran d’outil au sens de D98 ; son facteur libre est la façon de dire les arômes, pas un réglage.
- Indicatif, `controle-sans-famille.mjs` : SANS-FAMILLE ECHEC pour Nelson Sauvin (83 %) : pas de part « autres » neutre balisée `data-role="autres"` ; ses mots hors familles sont ici des éléments à part entière (ligne, colonne, tuile ou flux), pas une barre. D100 est conditionnel (option B).

## Fichiers
- `flc1/etat.html`, généré par `flc1/generer.mjs` sur le commun `flc1/commun-c.mjs`.
- Captures : `captures/flc1-premier-ecran.png`, `captures/flc1-page.png` ; états : `-absolu`, `-nelson`, `-motueka`, `-legende`, `-fiche-g1` (appui long réel).
