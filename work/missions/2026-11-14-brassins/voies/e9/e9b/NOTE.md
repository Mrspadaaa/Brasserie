# e9b — Le chemin des idées

- Chaleur : **tiède** (forme de l'approche : un chemin qui va de l'idée à la cuve).
- Idée : **Le chemin des idées** — de l'idée à la cuve, par bandes colorées.

## L'écran
- Quatre bandes empilées, reliées par des chevrons : Idées (gris), Recherche · devis (ocre), Validée (vert), **En cuve** (bleu), qui
  montre ses vrais brassins (NEIPA J+5 · F1, Pale Ale planifiée 08.11 en rouge, Pils en garde 2 °C). L'idée finit dans la cuve.
- Chaque idée est une pastille ; le bouton ↓ la pousse dans la bande suivante (`data-booster="pousser"`) ; « En recette › » sur la validée.
- Phrase-réponse : « La bière d'hiver attend sa recette ».
- Sections en barre basse (Bières, Tarifs, Contacts 3, À faire 2, Matériel ↗), bouton + flottant pour noter, « Réfléchir » (Gemini) en tête.
- Tarifs : **la marge au litre**, une barre par format (33 cl, carton 24, fût 20 L), coût ocre + marge verte, poignée = prix.
  Phrase (g3, k3 n° 2) : « La 33 cl rapporte le plus au litre : 10,30 ». Geste : la poignée du fût glissée de 150 à 170 → « Fût à 170 : 4,75 au litre »,
  bulle « +20,00 », « avant : 150,00 ».

## Fonctions gardées ou déplacées
- Gardées : idées, avancement (devenu « pousser »), passer en recette, essai de prix (étendu aux trois formats), garder un tarif, Gemini.
- Gardées aussi (g3, bloquant k3 n° 1) : **modifier, supprimer, reculer une idée**. Un toucher sur la pastille (crayon visible) ouvre sa fiche, comme `CreativeItemSheet` : nom, style, étape en segment (Idée · Recherche · Validée, pour avancer ou reculer), note, Supprimer et Enregistrer. Capture `e9b-fiche-390-clair.png`.
- Déplacées : Matériel en lien ; Contacts et À faire dans la barre basse (non dessinés).
- Ajout : la bande « En cuve » relie l'atelier aux brassins (lecture seule, un toucher ouvre la fiche).

## Causes c3 évitées
- Composition propre (bandes pleines + barre basse). Couleur pleine sur toute la largeur. Phrase-réponse. Boosters : pousser,
  poignées de prix, barres empilées, bulle d'écart. Pas de phrase grise au repos.

## Écarts assumés
- Le statut « devis » est fondu avec « recherche » (une bière n'a pas de devis) ; à confirmer.
- Prix au litre : un calcul neuf (prix ÷ litres du format) ; l'écran actuel ne compare pas les formats.

## Données fictives
- Idées, prix (5,50 ; 120,00 ; 150,00 ; 170,00) et coûts (6,36 CHF/L en bouteille, 3,75 CHF/L en fût) **fictifs**. Les brassins
  (NEIPA LOT-019 J+5 F1, Pale Ale LOT-020 planifiée 08.11, Pils garde 2 °C) viennent du brief. Sans TVA supposé.

## Captures
- `e9b-repos-390-clair.png`, `e9b-geste-390-clair.png` (tarif du fût posé au curseur), `e9b-tarifs-390-clair.png`, `e9b-fiche-390-clair.png`, `e9b-repos-390-cave.png`, `e9b-repos-1280-clair.png`.

## Rhabillage à l’identité de l’app (re9, 15.11)
- Trousse chargée (`identite.css`, `chrome.js`) : en-tête, sous-onglets (Atelier actif), barre du bas et + de l’app ; jetons des deux thèmes, Source Sans 3 / IBM Plex Mono, échelle ≤ 28 px, graisse ≤ 700, rayons 10 / 16 / 24.
- Idée, composition, textes et chiffres inchangés. Couleurs de données : sémantique (hop, attention, alert, water), rubriques `--area-*`, bière EBC (pastilles et bouteille, indicatives selon le style), pastilles de style `id-style`.

## Corrections g3 (15.11, verdict k3)
- n° 1 (bloquant) : fiche de l'idée dessinée (modifier, reculer, supprimer). n° 2 : titre-réponse sur la 33 cl. n° 3 : En cuve en Source Sans. n° 4 : pastilles pleine largeur avec la puce de style de l'app. n° 5 : cave et 1280 capturés.
