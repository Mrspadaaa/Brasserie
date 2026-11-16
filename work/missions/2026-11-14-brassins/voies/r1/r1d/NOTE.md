# r1d — Brasser en un toucher

Chaleur : tiède (la forme du genre 4 : la liste de recettes comme une liste de lecture).
Idée : la pastille de la recette prépare le brassin ; le lecteur le confirme
Ce qui change : chaque recette porte une pastille à sa couleur (anneau EBC, marmite noire sur fond clair) et son stock en icône à droite ; au repos, un seul étage fixe en bas (la barre et « + Recette ») ; la Pale Ale en retard est une ligne en tête de liste.
Geste : pastille de la Stout touchée : la rangée se marque « à confirmer en bas · rien n'est créé » ; le lecteur monte avec « Brasser la Stout ? », « Stout · Sam. 21 · F3 libre après la mise en bouteille de la Pils », les jours, « manque malt Chocolat 400 g : à commander avant le 21 », puis « Annuler » et « Créer LOT-021 ».
Problèmes résolus : n° 5 (brasser depuis la liste, en deux touchers et avec confirmation), n° 7 (stock sur chaque ligne), n° 1 (sections « Souvent brassées » et A–Z), n° 9 (« Comparer » écrit, dans la fiche et au glissement).

- Repos : Pale Ale en retard en ligne de tête (« Préparer ») ; rangées : pastille marmite à anneau EBC, nom, manquant ou « prête » puis dernier lot, stock en icône à droite ; une rangée entrouverte montre « Modifier » et « Comparer ».
- Recette : la Stout en pochette brun stout, « Modifier » et « Comparer » écrits en haut, « manque malt Chocolat 400 g · le reste est en stock », « Le brassin, dans l'ordre » (01 malts, 02 houblon, 03 levure, 04 dernier conditionnement), grand « Brasser la Stout » (ouvre la même confirmation).
- Vide : pastille fantôme en pointillés, la promesse en une phrase (« tu confirmes avant que le lot naisse »), « Nouvelle recette », reprise de l'idée de l'Atelier, deux rangées estompées.
- Données : réelles (DONNEES-COMMUNES) : NEIPA LOT-019 en F1 ; Pale Ale LOT-020 planifiée le 08.11 ; Stout LOT-015, conditionnée le 06.11, 30 × 33 cl + fût 20 L, 5,9 % ; Pils LOT-017 en garde. Fictives (exemple), dites sur l'écran : malts, houblon, levure et OG/FG de la Stout, LOT-021, les alcools autres que 5,9 % et 6,1 %, Brown Ale, Dunkel, Gose, Helles, Kölsch, Porter, filtre « Lager ».
- Écart : aucun lot n'est créé avant « Créer LOT-021 ». Malts, houblon, levure et OG/FG de la Stout : fictifs (dit ici, plus à l'écran) ; LOT-015, 5,9 %, 06.11 : réels.

## Passe de correction (15.11, revues artiste, brasseur, UX, critique)
- Le toucher ne crée plus le lot : confirmation pré-remplie dans le lecteur, « Créer LOT-021 » et « Annuler ».
- Triangle ▶ remplacé par une marmite : la pastille ne se lit plus « lecture ». Picto noir sur fond clair dans les deux thèmes, la bière en anneau : une règle, contraste fixe (au lieu de noir sur or, blanc sur cuivre).
- Un seul étage fixe : pas de lecteur au repos ; la Pale Ale en retard en ligne de tête avec « Préparer » ; « + Recette » dans la barre comme r1a ; au geste, le lecteur remplace « + Recette ».
- « ··· » remplacé par « Modifier » et « Comparer » écrits dans la fiche.
- « exemple (fictif) » retiré de l'écran et du vide.
- NEIPA 6,2 % → « 6,3 – 6,8 % » (OG 1,062, FG 1,010 – 1,014).
- « Cuve à choisir : F1, F2, F3 occupées » → « F3 libre après la mise en bouteille de la Pils ».
- Filtres : « Souvent » retiré des puces (c'est déjà une section) ; un seul filtre actif, « Toutes ».
- L'alcool à droite cède la place au stock : anneau cuivre « manque », plein vert « prête » ; le manquant écrit dans la ligne.
- Chiffres à virgule hors mono dans la fiche (« 80 % », « 5,9 % »).
- Capture 1280 ajoutée (`voies/rx/capture-1280.mjs`) et bas de page (`voies/rx/capture-fin.mjs`).
