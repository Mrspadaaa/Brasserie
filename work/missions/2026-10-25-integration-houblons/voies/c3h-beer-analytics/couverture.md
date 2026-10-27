# Couverture — Beer Analytics (voie c3h, #180)

Fichier produit par `node scripts/collecte-hop/beeranalytics.mjs --offline --rapport` à partir du cache et du journal.

## Hôtes tentés

- `www.beer-analytics.com` : robots.txt lu (200) ; pour `*` seul `Disallow: /wa/` ; `GPTBot` est exclu (non concerné). Aucune page de défi, aucun 401/403/429.
- Requêtes réseau faites par le script : 5042, une à la fois, 2,1 s d'écart au moins. Statuts : {"200":5020,"erreur":22}. Absents (404) : 0. Arrêts : aucun. Erreurs réseau : 22.
- Licence lue au pied de page : CC BY-SA 4.0 (« Except where otherwise noted, content on this site is licensed under… »). À citer si ces données sortent un jour de l'outil.

## Pages lues

- Pages de houblons du sitemap : 435. Lues depuis le cache : 435 ; absentes du cache : 0 ; 404 ou sans titre : 0.
- Fiches dont les graphiques ont tous été lus : 423 (97 %).
- Autres pages du cache : robots.txt, sitemap.xml, et les fichiers `charts/*.json` de chaque houblon. Non lues : `/hops/flavors/*` (liste de houblons par arôme : redite des badges d'arôme de chaque page), `/styles/*` (statistiques par style, hors voie), `recipes/random.inc` (échantillon aléatoire de recettes), les pages de tendances.

## Variétés

- Trouvées : 435. Rattachées au catalogue : 256 (256 variétés distinctes sur 317). Nouvelles (absentes du catalogue, gardées) : 174. Rattachement ambigu (varietyId null) : 5.
- Ambiguës : Brewer's Gold → beermaverick-brewers-gold / beermaverick-brewers-gold-us ; Magnum → beermaverick-magnum-gr / beermaverick-magnum-us ; Northern Brewer → beermaverick-northern-brewer-gr / beermaverick-northern-brewer-us ; Perle → beermaverick-perle-gr / beermaverick-perle-us ; Saaz → beermaverick-saaz-cz / beermaverick-saaz-us
- Nouvelles : ADHA-484, ADHA-527, ADHA-529, Ahil, Alliance, Aloha, Alora, Alta, Amallia, Amira, Anchovy, Backa, Bate's Brewer, Bertwell, Blato, Blisk, Blue Northern Brewer, Bramling, Buket, Bullion 10A, Calicross, California Cluster, Canterbury Whitebine, Cerera, CF184, CF185, Cicero, Citiva, Cleopatra, Cluster Fugget, Cobb, Coigneau, Density, Dolcita, Dunav, Early Bird, Early Green, Early Prolific, Early Promise, East Kent Golding, Eastern Gold, Eastern Green, Eastwell Golding, Edelweiss, Elani, Elsaesser, Evergreen, Excelsior, EXP 2/20, Fantasia, First Choice, Flinders, Fortnight, Fuggle Tetraploid, Furano Ace, Fusion, Gargoyle, GN37, GP75, Greensburg, Groene Bel, Hallertau (NZ), Hallertauer Bitter, Hallertauer Blanc, Hallertauer Diamant, Hallertauer Gold, Hallertauer Mittelfrüh, Hallertauer Rotrebiger, Hallertauer Taurus, Hallertauer Tradition, HBC 342, HBC 353, HBC 431, HBC 432, HBC 522, HBC 638, Hersbrucker Pure, Hersbrucker Red-Stem, Hersbrucker Spät, Hokitika, HPA 035, HS10416, Hulla Norrgård, Hüller Bitter, Hybrid-2, Ibuki, Iunga, Ivanhoe, Izabella, J-Lime, Janus, Julius, Keyworth's Early, Keyworth's Midseason, Kirin II, Kitamidori, Klon 18, Korsta, Kracanup, Krush, Książęcy, Legacy, Lemonaughty, Lilly, Limonadier, Lomik, Lórien, Lubelska-Pulawy, Lucan, Luminosa, Lunga, Malling, Mapuche, Mathon, Most, Nadwislanska, National, Neo1, Neoplanta, NewZilla, Nobility, Nordgaard, NZL-32, Oktawia, Opus, Orbit, Otto Supreme, Outeniqua, Patagonia Red, Peacharine, Petham Golding, Pink Boots, Pink, Pocket Talisman, Precoce de Bourgogne, Pride of Kent, ProvOAK, Record, Red Earth, Rubin, SAB Blend, San Juan Ruby Red, Saxon, Sequoia, Serebrianka, Shinshuwase, Slavyanka, Spalter, Sunshine, Superdelic, Svalöf Mauritz, Symphony, Tangerine, The Bruce, Titan, Tolhurst, Tomyski, Traful, U3/132, Universal, Vera, Vermelho, Veterans Blend, Viking, Vinnie Special, Vojvodina, Whitbread Golding, Willow Creek, Wuerttemberger, Zamba, Zibi, Zlatan, Zoso, Zumo.

## Champs lus (nombre de fiches)

| Champ de la page | Fiches |
|---|---|
| alphaClasse | 401 (92 %) |
| alphaDesRecettes | 401 (92 %) |
| betaDesRecettes | 297 (68 %) |
| origine | 432 (99 %) |
| partDuPoids | 399 (92 %) |
| recettes | 435 (100 %) |
| usage | 435 (100 %) |
| usageCarte | 401 (92 %) |

Listes : substituts, accords (ordre de la page), arômes avec leur famille de couleur du site.

| Graphique (JSON) | Fiches avec données | « no_data » ou 404 | Non lus |
|---|---|---|---|
| alpha-histogram | 398 (91 %) | 2 | 1 |
| amount-percent-range | 399 (92 %) | 0 | 0 |
| amount-used-per-style | 391 (90 %) | 7 | 3 |
| amount-used-per-use | 398 (91 %) | 0 | 3 |
| beta-histogram | 295 (68 %) | 2 | 0 |
| hop-pairings | 393 (90 %) | 1 | 7 |
| popular-yeasts | 289 (66 %) | 109 | 3 |
| popularity | 369 (85 %) | 31 | 1 |
| trending-yeasts | 20 (5 %) | 378 | 3 |
| typical-styles-absolute | 394 (91 %) | 7 | 0 |
| typical-styles-relative | 393 (90 %) | 7 | 1 |
| usage-types | 401 (92 %) | 0 | 0 |

### Les cinq composés demandés

| Composé | Fiches |
|---|---|
| linalol | 0 — le site publie des statistiques de recettes, aucune chimie de l'huile |
| géraniol | 0 — le site publie des statistiques de recettes, aucune chimie de l'huile |
| farnésène | 0 — le site publie des statistiques de recettes, aucune chimie de l'huile |
| β-pinène | 0 — le site publie des statistiques de recettes, aucune chimie de l'huile |
| sélinène | 0 — le site publie des statistiques de recettes, aucune chimie de l'huile |

## Les quatre houblons demandés

### Galaxy — beermaverick-galaxy

- Recettes : 37,065 ; usage Dual Purpose ; α « High » ; origine 🇦🇺 Australia.
- Accords (ordre de la page) : Citra, Mosaic, Amarillo, Cascade, Simcoe, Columbus. Substituts : Amarillo, Citra, Simcoe. Arômes : Citrus, Passion Fruit, Peach, Pineapple, Tropical Fruits.
- Moments d'ajout (recettes) : Mash 124, First Wort 1054, Boil 22924, Aroma 16740, Dry Hop 22101.
- Dosage par moment (médiane, fraction du poids de houblon) : Mash 0.10, First Wort 0.09, Boil 0.21, Aroma 0.17, Dry Hop 0.21.
- Styles en tête, part des recettes du style : Australian Sparkling Ale 35.7 %, Hazy IPA 18.8 %, Brut IPA 15.7 %, IPA 9.1 %.
- Houblons associés lus : 12 ; levures : 5 ; popularité mensuelle : 178 mois (dernier 2026-10).

### Citra — beermaverick-citra

- Recettes : 154,864 ; usage Dual Purpose ; α « High » ; origine 🇺🇸 United States.
- Accords (ordre de la page) : Mosaic, Amarillo, Cascade, Simcoe, Centennial, Columbus, Chinook, Magnum. Substituts : Cascade, Centennial, Mosaic, Simcoe. Arômes : Citrus, Floral, Gooseberry, Grapefruit, Lime, Lychee, Melon, Passion Fruit, Peach, Stone Fruit, Tropical Fruits, Woody.
- Moments d'ajout (recettes) : Mash 439, First Wort 5321, Boil 99088, Aroma 68023, Dry Hop 90258.
- Dosage par moment (médiane, fraction du poids de houblon) : Mash 0.14, First Wort 0.09, Boil 0.24, Aroma 0.18, Dry Hop 0.21.
- Styles en tête, part des recettes du style : Hazy IPA 55.4 %, IPA 37.1 %, White IPA 36.3 %, Double IPA 34.7 %.
- Houblons associés lus : 12 ; levures : 5 ; popularité mensuelle : 178 mois (dernier 2026-10).

### Nelson Sauvin — beermaverick-nelson-sauvin

- Recettes : 24,686 ; usage Dual Purpose ; α « High » ; origine 🇳🇿 New Zealand.
- Accords (ordre de la page) : Citra, Cascade, Simcoe, Amarillo, Mosaic, Motueka, Chinook, Galaxy. Substituts : Enigma, Hallertauer Blanc, Motueka, Riwaka. Arômes : Fruity, Gooseberry, Grapes, Passion Fruit, White Wine.
- Moments d'ajout (recettes) : Mash 94, First Wort 647, Boil 16288, Aroma 10369, Dry Hop 12526.
- Dosage par moment (médiane, fraction du poids de houblon) : Mash 0.11, First Wort 0.10, Boil 0.25, Aroma 0.19, Dry Hop 0.19.
- Styles en tête, part des recettes du style : Brut IPA 20.4 %, Grape Ale 15.4 %, Commercial Specialty Beer 15.0 %, Wheatwine 14.3 %.
- Houblons associés lus : 12 ; levures : 5 ; popularité mensuelle : 178 mois (dernier 2026-10).

### Motueka — beermaverick-motueka

- Recettes : 14,189 ; usage Aroma ; α « Moderate » ; origine 🇳🇿 New Zealand.
- Accords (ordre de la page) : Nelson Sauvin, Citra, Cascade. Substituts : Saaz, Sterling. Arômes : Citrus, Floral, Lemon, Lemon Zest, Lime, Mojito, Tropical Fruits.
- Moments d'ajout (recettes) : Mash 40, First Wort 393, Boil 9817, Aroma 5762, Dry Hop 5739.
- Dosage par moment (médiane, fraction du poids de houblon) : Mash 0.11, First Wort 0.13, Boil 0.27, Aroma 0.20, Dry Hop 0.19.
- Styles en tête, part des recettes du style : Wheatwine 7.0 %, International Pale Lager 6.2 %, Brut IPA 5.2 %, International Lager 5.0 %.
- Houblons associés lus : 12 ; levures : 5 ; popularité mensuelle : 178 mois (dernier 2026-10).

## Doutes

- « Amount » (carte) et le graphique « amount-percent-range » : la page écrit « min < milieu < max » sans dire si le milieu est une médiane ou une moyenne ; les six valeurs du graphique ne retrouvent pas le milieu de la carte. Les deux sont gardés tels quels, rien n'est recalculé.
- « Dosage par style / par moment » est une part du poids total de houblon de la recette (0 à 1), pas des grammes ni des g/L. Ce n'est donc pas une dose en g/10 L : à ne pas utiliser comme telle.
- Les histogrammes α et β comptent des valeurs déclarées par les recettes (pas la chimie du houblon) ; leurs comptes peuvent dépasser le nombre de recettes.
- Les moments d'ajout du site (Mash, First Wort, Boil, Aroma, Dry Hop) ne donnent ni minutes ni température de whirlpool : « Aroma » mêle flame-out et whirlpool.
- Le code de style BJCP n'est pas publié dans les graphiques : seul le nom du style, avec son adresse `categorie/style` quand elle se retrouve sans ambiguïté dans le sitemap (`styleSlug`, null sinon).
- Statistiques de communauté (Brewer's Friend, BeerSmith, Brewfather…) : biais de popularité ; un houblon rare a peu de recettes (champ `recettes`), ses parts sont fragiles.
- Le rattachement au catalogue se fait sur le nom (sans casse, accents ni ponctuation) et sur l'adresse ; un nom qui désigne deux variétés reste non rattaché.

