# Couverture des données houblons (#180, voie d1-couverture)

Généré le 2026-10-25 par `couverture.mjs`. Catalogue : `src/data/hopV4/proto-data.json` (318 variétés). Composés : `src/data/hopV4/composes-houblon.json` (8 fiches, dont une variante `:cryo` hors catalogue).

## Règles de lecture

- « Présent » : une borne publiée au moins (une valeur `null` seule compte absente). `oil`, `oils.*`, `linalol`, `géraniol`, `farnesene` : repli sur `composes-houblon.json` quand le catalogue n’a rien ; la colonne « via composes » le dit.
- `linalol` : `hsLinalool.range` (Hopsteiner, % de l’huile) ; `composes` donne la même grandeur en autre unité : présence seulement, aucune valeur croisée.
- `familles` : même règle que le moteur (termes de `hopExtrapolationBootstrap.json`, fiches hors contexte « bière », négations no/not/non/sans/pas de). « Présent » = au moins une famille citée ; sinon « inconnue ».
- `sources` : provenances valides (auteur, titre, référence, nature) distinctes ; `substituts` : aucun champ de stockage (les substituts sont calculés à l’exécution, `substitution.ts`).
- Les valeurs `composes` sont des relevés H, S ou P selon leur source (`niveaux`) : une présence n’est pas une mesure vérifiée.

## Couverture par champ

| Champ | Présent | Absent | % présent | dont via composes |
|---|---:|---:|---:|---:|
| alpha (`alpha`) | 318 | 0 | 100,0 % | 0 |
| bêta (`beta`) | 311 | 7 | 97,8 % | 0 |
| cohumulone (`cohumulone`) | 0 | 318 | 0,0 % | 0 |
| huile totale (`oil`) | 301 | 17 | 94,7 % | 0 |
| oils.myrcene (`oils.myrcene`) | 257 | 61 | 80,8 % | 0 |
| oils.humulene (`oils.humulene`) | 251 | 67 | 78,9 % | 0 |
| oils.caryophyllene (`oils.caryophyllene`) | 238 | 80 | 74,8 % | 0 |
| oils.farnesene (`oils.farnesene`) | 4 | 314 | 1,3 % | 4 |
| linalol (`linalol`) | 67 | 251 | 21,1 % | 3 |
| géraniol (`geraniol`) | 3 | 315 | 0,9 % | 3 |
| tags (descripteurs) (`tags`) | 300 | 18 | 94,3 % | 0 |
| tagsFr (descripteurs FR) (`tagsFr`) | 300 | 18 | 94,3 % | 0 |
| familles du moteur (12) (`familles`) | 297 | 21 | 93,4 % | 0 |
| origine (`origin`) | 318 | 0 | 100,0 % | 0 |
| usage (styles, rôles) (`usage`) | 64 | 254 | 20,1 % | 0 |
| substituts (`substituts`) | 0 | 318 | 0,0 % | 0 |
| url (`url`) | 318 | 0 | 100,0 % | 0 |
| sources (≥ 1) (`sources`) | 301 | 17 | 94,7 % | 0 |

## Familles d’arômes du moteur

| Famille | Houblons qui la citent | % |
|---|---:|---:|
| Agrumes (`citrus`) | 211 | 66,4 % |
| Fruits tropicaux (`tropical`) | 102 | 32,1 % |
| Fruits à noyau (`stoneFruit`) | 64 | 20,1 % |
| Pomme et poire (`pomeFruit`) | 19 | 6,0 % |
| Petits fruits (`berries`) | 50 | 15,7 % |
| Melon (`melon`) | 32 | 10,1 % |
| Floral (`floral`) | 136 | 42,8 % |
| Herbacé aromatique (`herbal`) | 120 | 37,7 % |
| Boisé et résineux (`resin`) | 102 | 32,1 % |
| Épicé (`spice`) | 138 | 43,4 % |
| Végétal vert (`green`) | 56 | 17,6 % |
| Terreux (`earthy`) | 48 | 15,1 % |
| inconnue (aucune famille citée) | 21 | 6,6 % |

## Nombre de sources par variété

| Sources distinctes | Houblons | % |
|---:|---:|---:|
| 0 | 17 | 5,3 % |
| 1 | 216 | 67,9 % |
| 2 | 84 | 26,4 % |
| 3 ou plus | 1 | 0,3 % |

## Les 20 houblons les plus incomplets

Score : nombre de champs manquants sur 18. `cohumulone` et `substituts` manquent partout et ajoutent 2 à chacun.

| Rang | Houblon | Manquants | Champs manquants |
|---:|---|---:|---|
| 1 | Feux-Coeur Francais | 14 | cohumulone, huile totale, oils.myrcene, oils.humulene, oils.caryophyllene, oils.farnesene, linalol, géraniol, tags (descripteurs), tagsFr (descripteurs FR), familles du moteur (12), usage (styles, rôles), substituts, sources (≥ 1) |
| 2 | Saugatuck | 14 | cohumulone, huile totale, oils.myrcene, oils.humulene, oils.caryophyllene, oils.farnesene, linalol, géraniol, tags (descripteurs), tagsFr (descripteurs FR), familles du moteur (12), usage (styles, rôles), substituts, sources (≥ 1) |
| 3 | Banner | 13 | cohumulone, oils.myrcene, oils.humulene, oils.caryophyllene, oils.farnesene, linalol, géraniol, tags (descripteurs), tagsFr (descripteurs FR), familles du moteur (12), usage (styles, rôles), substituts, sources (≥ 1) |
| 4 | Bianca | 13 | cohumulone, oils.myrcene, oils.humulene, oils.caryophyllene, oils.farnesene, linalol, géraniol, tags (descripteurs), tagsFr (descripteurs FR), familles du moteur (12), usage (styles, rôles), substituts, sources (≥ 1) |
| 5 | Equinox | 13 | cohumulone, oils.myrcene, oils.humulene, oils.caryophyllene, oils.farnesene, linalol, géraniol, tags (descripteurs), tagsFr (descripteurs FR), familles du moteur (12), usage (styles, rôles), substituts, sources (≥ 1) |
| 6 | Golden Star | 13 | cohumulone, oils.myrcene, oils.humulene, oils.caryophyllene, oils.farnesene, linalol, géraniol, tags (descripteurs), tagsFr (descripteurs FR), familles du moteur (12), usage (styles, rôles), substituts, sources (≥ 1) |
| 7 | Limbus | 13 | cohumulone, oils.myrcene, oils.humulene, oils.caryophyllene, oils.farnesene, linalol, géraniol, tags (descripteurs), tagsFr (descripteurs FR), familles du moteur (12), usage (styles, rôles), substituts, sources (≥ 1) |
| 8 | Jester | 12 | cohumulone, oils.myrcene, oils.humulene, oils.caryophyllene, oils.farnesene, linalol, géraniol, tags (descripteurs), tagsFr (descripteurs FR), familles du moteur (12), substituts, sources (≥ 1) |
| 9 | Lumberjack | 11 | bêta, cohumulone, huile totale, oils.myrcene, oils.humulene, oils.caryophyllene, oils.farnesene, linalol, géraniol, usage (styles, rôles), substituts |
| 10 | Vienna Gold | 11 | bêta, cohumulone, huile totale, oils.myrcene, oils.humulene, oils.caryophyllene, oils.farnesene, linalol, géraniol, usage (styles, rôles), substituts |
| 11 | Aloha Blend | 10 | bêta, cohumulone, oils.myrcene, oils.humulene, oils.caryophyllene, oils.farnesene, linalol, géraniol, usage (styles, rôles), substituts |
| 12 | Apolon | 10 | cohumulone, oils.farnesene, linalol, géraniol, tags (descripteurs), tagsFr (descripteurs FR), familles du moteur (12), usage (styles, rôles), substituts, sources (≥ 1) |
| 13 | Aquila | 10 | cohumulone, oils.farnesene, linalol, géraniol, tags (descripteurs), tagsFr (descripteurs FR), familles du moteur (12), usage (styles, rôles), substituts, sources (≥ 1) |
| 14 | Arcadian | 10 | cohumulone, huile totale, oils.myrcene, oils.humulene, oils.caryophyllene, oils.farnesene, linalol, géraniol, usage (styles, rôles), substituts |
| 15 | Buzz Bullets | 10 | cohumulone, huile totale, oils.myrcene, oils.humulene, oils.caryophyllene, oils.farnesene, linalol, géraniol, usage (styles, rôles), substituts |
| 16 | Diamond Springs | 10 | cohumulone, huile totale, oils.myrcene, oils.humulene, oils.caryophyllene, oils.farnesene, linalol, géraniol, usage (styles, rôles), substituts |
| 17 | Eroica | 10 | cohumulone, oils.farnesene, linalol, géraniol, tags (descripteurs), tagsFr (descripteurs FR), familles du moteur (12), usage (styles, rôles), substituts, sources (≥ 1) |
| 18 | Fantasia Blend | 10 | bêta, cohumulone, oils.myrcene, oils.humulene, oils.caryophyllene, oils.farnesene, linalol, géraniol, usage (styles, rôles), substituts |
| 19 | Hallertau Gold | 10 | cohumulone, oils.farnesene, linalol, géraniol, tags (descripteurs), tagsFr (descripteurs FR), familles du moteur (12), usage (styles, rôles), substituts, sources (≥ 1) |
| 20 | Hartwick | 10 | cohumulone, huile totale, oils.myrcene, oils.humulene, oils.caryophyllene, oils.farnesene, linalol, géraniol, usage (styles, rôles), substituts |

## Houblons phares : champs manquants

- **Citra** (`beermaverick-citra`) : 2 manquant(s) — cohumulone, substituts
- **Mosaic** (`beermaverick-mosaic`) : 5 manquant(s) — cohumulone, oils.farnesene, linalol, géraniol, substituts
- **Nelson Sauvin** (`beermaverick-nelson-sauvin`) : 4 manquant(s) — cohumulone, oils.farnesene, géraniol, substituts
- **Galaxy** (`beermaverick-galaxy`) : 3 manquant(s) — cohumulone, géraniol, substituts
- **Motueka** (`beermaverick-motueka`) : 4 manquant(s) — cohumulone, oils.farnesene, géraniol, substituts
- **Idaho 7** (`beermaverick-idaho-7`) : 2 manquant(s) — cohumulone, substituts
- **Cascade** (`beermaverick-cascade`) : 2 manquant(s) — cohumulone, substituts
- **Saaz (CZ)** (`beermaverick-saaz-cz`) : 5 manquant(s) — cohumulone, oils.farnesene, géraniol, usage (styles, rôles), substituts
- **Saaz Late** (`beermaverick-saaz-late`) : 6 manquant(s) — cohumulone, oils.farnesene, linalol, géraniol, usage (styles, rôles), substituts
- **Saaz (US)** (`beermaverick-saaz-us`) : 6 manquant(s) — cohumulone, oils.farnesene, linalol, géraniol, usage (styles, rôles), substituts
- **Nugget** (`beermaverick-nugget`) : 4 manquant(s) — cohumulone, oils.farnesene, géraniol, substituts
- **Lotus** (`beermaverick-lotus`) : 5 manquant(s) — cohumulone, oils.caryophyllene, oils.farnesene, géraniol, substituts

## Contrôles

- OK : chaque champ couvre exactement 318 variétés (présent + absent = 318).
- Note : composes : beermaverick-citra:cryo hors catalogue (variante, ignorée)
