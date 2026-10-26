# Voie c3g-capture : audit de capture des 20 sources (avant et après)

Script : `node scripts/collecte-hop/audit-capture.mjs [--source=id] [--detail=champ] [--avant=avant.json] [--md=…] [--json=…]`. Hors ligne, sur le cache, 6 s.
- « Pages qui le publient » : le mot clé d'analyse est dans la page (texte visible, ou texte du PDF), suivi d'un nombre à 50 caractères au plus. Un « 0 » ou « 0 - 0 » seul est un remplissage de page : non compté.
- « Fiches qui l'ont » : la fiche porte une valeur (valeur, min, max), un zéro publié seul (`zeroPublie`) ou une valeur qualitative écrite.
- « Avant » : les fichiers de `src/data/hopSources/` à HEAD (colonne « avant » : capturées/publiées). « Après » : ceux d'aujourd'hui.
- Les 7 fichiers `beeranalytics*` (autre voie : statistiques d'usage dans des recettes) sont hors audit.
- Limite : l'audit compte une présence, pas une exactitude. Il n'aurait pas vu le décalage des fiches PDF de HPA (ci-dessous) ; celui-là a été trouvé en lisant la fiche Mosaic.

## Ce qui a été corrigé

| lecteur | défaut | effet |
|---|---|---|
| `yakimavalleyhops.mjs` | cinq formats de page, un seul lu ; 13 pages de houblon sans titre « Hop Profile » écartées | 133 → 146 fiches ; huile 53 → 100 %, farnésène 39 → 100 %, linalol 41 → 100 %, sélinène 33 → 100 %, alpha 82 → 99 % ; lots et lignée gardés |
| `crosbyhops.mjs` (via `c3c-commun.mjs`) | « Up to », « Less than », « 31.3 % - 45.4 % », « %% », « B-Pinene », « Gernaniol » (faute de la page), thiols en µg/kg | huile 90 → 100 %, myrcène 84 → 100 %, caryophyllène 68 → 100 %, linalol 63 → 100 %, géraniol 40 → 100 % |
| `indiehops.mjs` (via `c3c-commun.mjs`) | « mls/100grams », « 8.% » | huile 84 → 100 %, caryophyllène 94 → 100 % |
| `hpa.mjs` (fiches PDF) | **valeurs décalées d'une ligne** : en mode colonnes, une cellule « — » faisait prendre à chaque libellé la valeur du suivant (Mosaic : myrcène = huile totale, humulène = myrcène…). 35 fiches sur 48 modifiées | lecture dans l'ordre du texte (`-raw`) ; fiches à blocs (Bru) lues ; huile 91 → 100 %, humulène 82 → 100 %, caryophyllène 59 → 97 %, myrcène 93 → 100 % |
| `johnihaas.mjs` (+ `europe-champs.mjs`) | unité nue après le libellé (fiches HopFrance : « TOTAL OILS ml/100g », « FARNESENE mg/100g ») | huile 90 → 100 %, linalol 79 → 95 %, farnésène 85 → 94 % (en mg/100 g, pas en % de l'huile) |

`c3c-commun.mjs` est partagé : les dix lecteurs qui l'utilisent ont été relancés. Seuls crosbyhops, indiehops, hpa, yakimavalleyhops (et johnihaas, par `europe-champs.mjs`) ont changé ; bsg, freestylehops, hopsdirect, ihps, nzhops, usahops sont identiques à HEAD (sha256 égal).
Un « 0 » publié seul est désormais lu `valeur: null` avec `zeroPublie: true` (Crosby, Yakima, HPA) : l'inconnu n'est jamais 0.

## Champs publiés restés sous 95 %, avec la raison

| source | champ | taux | raison |
|---|---|---|---|
| crosbyhops | cohumulone (80 pages, 96 %) | ok | « NA - NA % » : inconnu, lu null |
| freestylehops | thiols | 0/1 | phrase d'un texte (« 3SH precursors, bound 3… »), pas une valeur |
| hopslist | β-pinène | 1/2 | cellule vide (African Queen : « β-Pinene » sans valeur) |
| hopslist | xanthohumol | 3/4 | phrase (« Xanthohumol is a potent antioxidant, 200… ») |
| hopsteiner | sélinène | 0/1 | phrase (Alora : « Over 50% of total oils are Selinene ») |
| hpa | farnésène, linalol, géraniol, polyphénols | 89, 94, 50, 74 % | cellules « — » publiées vides (lues null) ; TALUS et HBC 472 : libellés en bloc mêlés à d'autres libellés (Cohum, HSI), non appariés |
| indiehops | farnésène | 7/9 | Chinook, Strata : cellule vide sur la page |
| johnihaas | caryophyllène | 57/62 | « HUMULENE / CARYOPHYLLENE » : le rapport, lu comme `rapport_humulene_caryophyllene` |
| johnihaas | farnésène, polyphénols | 94, 68 % | cellules « — » |
| nzhops | bêta, cohumulone, huile | 94, 50, 94 % | Superdelic : la page boutique donne des valeurs mais la fiche vient du PDF « Variety Sheet » qui les porte toutes |
| usahops | thiols | 0/1 | phrase (« thiols—compounds like 4MMP ») |
| usda | HSI / conservation | 0/1 | « Storage stability: Poor » qualitatif (nombre voisin = huile) |
| yakimavalleyhops | thiols | 0/1 | phrase (Thora : « thiols sets it apart with compounds like 4MMP ») |

## Sources hors audit page à page
- brewersfriend : un index de 1112 lignes (une page), pas des fiches d'analyse.
- hopdatabase, hopsjson : un fichier JSON communautaire, pas de page par fiche ; ihps : un PDF slovène de 23 variétés ; usahops : 4 pages pour 80 fiches. Leur capture se vérifie champ par champ dans leur lecteur, pas par cet audit.

## Tableaux par source (avant → après)

### barthhaas

97 fiches ; 97 pages auditées.

| champ | pages qui le publient | fiches qui l'ont | taux | avant |
|---|---:|---:|---:|---:|
| alpha | 97 | 97 | 100 % | 97/97 (100 %) |
| beta | 96 | 95 | 99 % | 95/96 (99 %) |
| huile totale | 97 | 97 | 100 % | 97/97 (100 %) |
| myrcène | 95 | 95 | 100 % | 95/95 (100 %) |
| humulène | 88 | 88 | 100 % | 88/88 (100 %) |
| caryophyllène | 84 | 84 | 100 % | 84/84 (100 %) |
| farnésène | 79 | 78 | 98.7 % | 78/79 (98.7 %) |
| linalol | 76 | 76 | 100 % | 76/76 (100 %) |
| géraniol | 60 | 59 | 98.3 % | 59/60 (98.3 %) |
| polyphénols | 28 | 28 | 100 % | 28/28 (100 %) |
| thiols | 22 | 22 | 100 % | 22/22 (100 %) |

### brewersfriend

1112 fiches ; 1 pages auditées, 1111 hors cache.

| champ | pages qui le publient | fiches qui l'ont | taux | avant |
|---|---:|---:|---:|---:|

### britishhops

34 fiches ; 34 pages auditées.

| champ | pages qui le publient | fiches qui l'ont | taux | avant |
|---|---:|---:|---:|---:|
| alpha | 34 | 34 | 100 % | 34/34 (100 %) |
| beta | 34 | 34 | 100 % | 34/34 (100 %) |
| cohumulone | 34 | 34 | 100 % | 34/34 (100 %) |
| huile totale | 34 | 34 | 100 % | 34/34 (100 %) |
| myrcène | 34 | 34 | 100 % | 34/34 (100 %) |
| humulène | 33 | 33 | 100 % | 33/33 (100 %) |
| farnésène | 20 | 20 | 100 % | 20/20 (100 %) |
| sélinène | 3 | 3 | 100 % | 3/3 (100 %) |

### bsg

77 fiches ; 77 pages auditées.

| champ | pages qui le publient | fiches qui l'ont | taux | avant |
|---|---:|---:|---:|---:|
| alpha | 2 | 2 | 100 % | 2/2 (100 %) |
| beta | 0 | 0 | — | 0/0 (—) |
| cohumulone | 0 | 0 | — | 0/0 (—) |
| huile totale | 0 | 0 | — | 0/0 (—) |

### charlesfaram

157 fiches ; 157 pages auditées.

| champ | pages qui le publient | fiches qui l'ont | taux | avant |
|---|---:|---:|---:|---:|
| alpha | 157 | 157 | 100 % | 157/157 (100 %) |
| beta | 157 | 156 | 99.4 % | 156/157 (99.4 %) |
| cohumulone | 157 | 157 | 100 % | 157/157 (100 %) |
| huile totale | 157 | 156 | 99.4 % | 156/157 (99.4 %) |
| myrcène | 155 | 155 | 100 % | 155/155 (100 %) |
| humulène | 153 | 149 | 97.4 % | 149/153 (97.4 %) |
| farnésène | 134 | 134 | 100 % | 134/134 (100 %) |

### crosbyhops

139 fiches ; 139 pages auditées.

| champ | pages qui le publient | fiches qui l'ont | taux | avant |
|---|---:|---:|---:|---:|
| alpha | 139 | 137 | 98.6 % | 136/139 (97.8 %) |
| beta | 139 | 139 | 100 % | 138/139 (99.3 %) |
| cohumulone | 80 | 77 | 96.3 % | 77/80 (96.3 %) |
| huile totale | 138 | 138 | 100 % | 124/138 (89.9 %) |
| myrcène | 121 | 121 | 100 % | 108/121 (89.3 %) |
| humulène | 114 | 114 | 100 % | 103/114 (90.4 %) |
| caryophyllène | 47 | 47 | 100 % | 32/47 (68.1 %) |
| farnésène | 110 | 110 | 100 % | 92/110 (83.6 %) |
| linalol | 38 | 38 | 100 % | 24/38 (63.2 %) |
| géraniol | 15 | 15 | 100 % | 6/15 (40 %) |
| β-pinène | 1 | 1 | 100 % | 0/1 (0 %) |
| thiols | 1 | 1 | 100 % | 0/1 (0 %) |

### freestylehops

19 fiches ; 19 pages auditées.

| champ | pages qui le publient | fiches qui l'ont | taux | avant |
|---|---:|---:|---:|---:|
| thiols | 1 | 0 | 0 % | 0/1 (0 %) |

### hopdatabase

220 fiches ; 0 pages auditées, 220 hors cache.

| champ | pages qui le publient | fiches qui l'ont | taux | avant |
|---|---:|---:|---:|---:|

### hopsdirect

49 fiches ; 49 pages auditées.

| champ | pages qui le publient | fiches qui l'ont | taux | avant |
|---|---:|---:|---:|---:|
| alpha | 49 | 49 | 100 % | 49/49 (100 %) |

### hopsjson

119 fiches ; 0 pages auditées, 119 fiches sur une page partagée (hors audit page à page).

| champ | pages qui le publient | fiches qui l'ont | taux | avant |
|---|---:|---:|---:|---:|

### hopslist

268 fiches ; 268 pages auditées.

| champ | pages qui le publient | fiches qui l'ont | taux | avant |
|---|---:|---:|---:|---:|
| alpha | 262 | 262 | 100 % | 262/262 (100 %) |
| beta | 255 | 255 | 100 % | 255/255 (100 %) |
| cohumulone | 247 | 247 | 100 % | 247/247 (100 %) |
| colupulone | 1 | 1 | 100 % | 1/1 (100 %) |
| huile totale | 242 | 241 | 99.6 % | 241/242 (99.6 %) |
| myrcène | 229 | 229 | 100 % | 229/229 (100 %) |
| humulène | 228 | 226 | 99.1 % | 226/228 (99.1 %) |
| caryophyllène | 225 | 222 | 98.7 % | 222/225 (98.7 %) |
| farnésène | 201 | 200 | 99.5 % | 200/201 (99.5 %) |
| linalol | 3 | 3 | 100 % | 3/3 (100 %) |
| géraniol | 1 | 1 | 100 % | 1/1 (100 %) |
| β-pinène | 2 | 1 | 50 % | 1/2 (50 %) |
| sélinène | 1 | 1 | 100 % | 1/1 (100 %) |
| xanthohumol | 4 | 3 | 75 % | 3/4 (75 %) |
| polyphénols | 1 | 1 | 100 % | 1/1 (100 %) |
| HSI / conservation | 1 | 1 | 100 % | 1/1 (100 %) |

### hopsteiner

102 fiches ; 102 pages auditées.

| champ | pages qui le publient | fiches qui l'ont | taux | avant |
|---|---:|---:|---:|---:|
| alpha | 102 | 102 | 100 % | 102/102 (100 %) |
| beta | 101 | 101 | 100 % | 101/101 (100 %) |
| cohumulone | 102 | 102 | 100 % | 102/102 (100 %) |
| huile totale | 102 | 102 | 100 % | 102/102 (100 %) |
| farnésène | 81 | 81 | 100 % | 81/81 (100 %) |
| linalol | 77 | 77 | 100 % | 77/77 (100 %) |
| sélinène | 1 | 0 | 0 % | 0/1 (0 %) |
| xanthohumol | 78 | 78 | 100 % | 78/78 (100 %) |
| polyphénols | 37 | 37 | 100 % | 37/37 (100 %) |
| thiols | 70 | 70 | 100 % | 70/70 (100 %) |

### hpa

48 fiches ; 46 pages auditées, 2 fiches sur une page partagée (hors audit page à page).

| champ | pages qui le publient | fiches qui l'ont | taux | avant |
|---|---:|---:|---:|---:|
| alpha | 46 | 45 | 97.8 % | 44/46 (95.7 %) |
| beta | 45 | 45 | 100 % | 43/45 (95.6 %) |
| cohumulone | 27 | 26 | 96.3 % | 26/27 (96.3 %) |
| huile totale | 45 | 45 | 100 % | 41/45 (91.1 %) |
| myrcène | 40 | 40 | 100 % | 37/40 (92.5 %) |
| humulène | 28 | 28 | 100 % | 23/28 (82.1 %) |
| caryophyllène | 29 | 28 | 96.6 % | 17/29 (58.6 %) |
| farnésène | 27 | 24 | 88.9 % | 22/27 (81.5 %) |
| linalol | 31 | 29 | 93.5 % | 28/31 (90.3 %) |
| géraniol | 4 | 2 | 50 % | 3/4 (75 %) |
| sélinène | 7 | 7 | 100 % | 7/7 (100 %) |
| polyphénols | 19 | 14 | 73.7 % | 16/19 (84.2 %) |

### ihps

23 fiches ; 0 pages auditées, 23 fiches sur une page partagée (hors audit page à page).

| champ | pages qui le publient | fiches qui l'ont | taux | avant |
|---|---:|---:|---:|---:|

### indiehops

19 fiches ; 19 pages auditées.

| champ | pages qui le publient | fiches qui l'ont | taux | avant |
|---|---:|---:|---:|---:|
| alpha | 19 | 19 | 100 % | 18/19 (94.7 %) |
| beta | 19 | 19 | 100 % | 18/19 (94.7 %) |
| cohumulone | 16 | 16 | 100 % | 16/16 (100 %) |
| huile totale | 19 | 19 | 100 % | 16/19 (84.2 %) |
| myrcène | 16 | 16 | 100 % | 16/16 (100 %) |
| humulène | 16 | 16 | 100 % | 16/16 (100 %) |
| caryophyllène | 16 | 16 | 100 % | 15/16 (93.8 %) |
| farnésène | 9 | 7 | 77.8 % | 7/9 (77.8 %) |

### johnihaas

81 fiches ; 81 pages auditées.

| champ | pages qui le publient | fiches qui l'ont | taux | avant |
|---|---:|---:|---:|---:|
| alpha | 74 | 74 | 100 % | 74/74 (100 %) |
| beta | 74 | 74 | 100 % | 74/74 (100 %) |
| cohumulone | 70 | 69 | 98.6 % | 69/70 (98.6 %) |
| colupulone | 7 | 7 | 100 % | 7/7 (100 %) |
| huile totale | 74 | 74 | 100 % | 67/74 (90.5 %) |
| myrcène | 65 | 65 | 100 % | 65/65 (100 %) |
| humulène | 64 | 64 | 100 % | 64/64 (100 %) |
| caryophyllène | 62 | 57 | 91.9 % | 57/62 (91.9 %) |
| farnésène | 64 | 60 | 93.8 % | 54/64 (84.4 %) |
| linalol | 42 | 40 | 95.2 % | 33/42 (78.6 %) |
| géraniol | 3 | 3 | 100 % | 3/3 (100 %) |
| sélinène | 3 | 3 | 100 % | 3/3 (100 %) |
| xanthohumol | 6 | 6 | 100 % | 6/6 (100 %) |
| polyphénols | 25 | 17 | 68 % | 17/25 (68 %) |
| HSI / conservation | 0 | 0 | — | 0/0 (—) |

### nzhops

40 fiches ; 40 pages auditées.

| champ | pages qui le publient | fiches qui l'ont | taux | avant |
|---|---:|---:|---:|---:|
| alpha | 20 | 20 | 100 % | 20/20 (100 %) |
| beta | 17 | 16 | 94.1 % | 16/17 (94.1 %) |
| cohumulone | 2 | 1 | 50 % | 1/2 (50 %) |
| huile totale | 17 | 16 | 94.1 % | 16/17 (94.1 %) |
| myrcène | 14 | 14 | 100 % | 14/14 (100 %) |
| humulène | 11 | 11 | 100 % | 11/11 (100 %) |
| caryophyllène | 16 | 16 | 100 % | 16/16 (100 %) |
| farnésène | 1 | 1 | 100 % | 1/1 (100 %) |
| linalol | 14 | 14 | 100 % | 14/14 (100 %) |
| géraniol | 14 | 14 | 100 % | 14/14 (100 %) |
| β-pinène | 11 | 11 | 100 % | 11/11 (100 %) |

### usahops

80 fiches ; 3 pages auditées, 77 fiches sur une page partagée (hors audit page à page).

| champ | pages qui le publient | fiches qui l'ont | taux | avant |
|---|---:|---:|---:|---:|
| alpha | 2 | 2 | 100 % | 2/2 (100 %) |
| beta | 1 | 1 | 100 % | 1/1 (100 %) |
| cohumulone | 1 | 1 | 100 % | 1/1 (100 %) |
| huile totale | 0 | 0 | — | 0/0 (—) |
| myrcène | 1 | 1 | 100 % | 1/1 (100 %) |
| humulène | 0 | 0 | — | 0/0 (—) |
| caryophyllène | 1 | 1 | 100 % | 1/1 (100 %) |
| farnésène | 1 | 1 | 100 % | 1/1 (100 %) |
| linalol | 1 | 1 | 100 % | 1/1 (100 %) |
| géraniol | 1 | 1 | 100 % | 1/1 (100 %) |
| β-pinène | 1 | 1 | 100 % | 1/1 (100 %) |
| thiols | 1 | 0 | 0 % | 0/1 (0 %) |

### usda

2 fiches ; 2 pages auditées.

| champ | pages qui le publient | fiches qui l'ont | taux | avant |
|---|---:|---:|---:|---:|
| alpha | 2 | 2 | 100 % | 2/2 (100 %) |
| beta | 2 | 2 | 100 % | 2/2 (100 %) |
| cohumulone | 2 | 2 | 100 % | 2/2 (100 %) |
| huile totale | 0 | 0 | — | 0/0 (—) |
| humulène | 1 | 1 | 100 % | 1/1 (100 %) |
| farnésène | 1 | 1 | 100 % | 1/1 (100 %) |
| HSI / conservation | 1 | 0 | 0 % | 0/1 (0 %) |

### yakimavalleyhops

146 fiches ; 146 pages auditées.

| champ | pages qui le publient | fiches qui l'ont | taux | avant |
|---|---:|---:|---:|---:|
| alpha | 129 | 128 | 99.2 % | 95/116 (81.9 %) |
| beta | 109 | 109 | 100 % | 90/97 (92.8 %) |
| cohumulone | 83 | 83 | 100 % | 63/74 (85.1 %) |
| colupulone | 2 | 2 | 100 % | 0/2 (0 %) |
| huile totale | 118 | 118 | 100 % | 57/106 (53.8 %) |
| myrcène | 94 | 94 | 100 % | 64/84 (76.2 %) |
| humulène | 87 | 87 | 100 % | 60/77 (77.9 %) |
| caryophyllène | 77 | 77 | 100 % | 52/70 (74.3 %) |
| farnésène | 81 | 81 | 100 % | 29/73 (39.7 %) |
| linalol | 30 | 30 | 100 % | 11/27 (40.7 %) |
| géraniol | 5 | 5 | 100 % | 4/5 (80 %) |
| β-pinène | 1 | 1 | 100 % | 0/1 (0 %) |
| sélinène | 9 | 9 | 100 % | 3/9 (33.3 %) |
| polyphénols | 3 | 3 | 100 % | 0/3 (0 %) |
| thiols | 1 | 0 | 0 % | 0/1 (0 %) |
| HSI / conservation | 4 | 4 | 100 % | 0/4 (0 %) |

