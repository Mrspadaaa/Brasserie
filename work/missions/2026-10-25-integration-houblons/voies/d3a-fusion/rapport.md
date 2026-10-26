# Fusion des données houblons collectées (#180, voie d3a-fusion)

Généré par `node scripts/collecte-hop/fusion.mjs` (hors ligne, déterministe). Sources : `src/data/hopSources/*.json` (18). Catalogue : `src/data/hopV4/proto-data.json` (318 variétés).

## Résumé

- Fiches lues : 2790 (dont Brewer's Friend : 1112 lignes d'index sans valeur chimique). Rattachées et fusionnées : 2610. Écartées à la fusion : 1. Non rattachées (liste à part) : 61.
- Variétés du catalogue touchées : 371 sur 317.
- Valeurs fusionnées : 11263. Dans une enveloppe : 8700. Hors enveloppe (unité ou base inconnue ou différente) : 2264. Suspectes : 299. Enveloppes calculées : 4097 (variété × champ).
- Règles : une liste de valeurs par source et par champ, avec URL et année publiée ; enveloppe = du plus bas au plus haut des valeurs valides, jamais une moyenne ; un inconnu est absent, jamais 0.
- Les composés de l'huile dont la base « % de l'huile » a été déduite par la voie de collecte (BarthHaas, Charles Faram, BHA : `baseLue: false`) entrent dans l'enveloppe : le libellé du composé suffit. Les champs d'une source sans base (Crosby, Indie, USA Hops : `baseImplicite`) entrent aussi quand la collecte a posé la base ; un pourcentage sans aucune base reste hors enveloppe.
- Rendement : les lb/acre sont converties en kg/ha (× 1,12085), arrondies à 0,1.
- Statu quo : les valeurs Hopsteiner déjà dans le catalogue (α, β, huile, linalol, 79 variétés) restent telles quelles dans `proto-data.json` ; `complements.json` porte en plus la liste de Hopsteiner avec son URL.

## Diffusion de chaque source

Décision de l'utilisateur (26.10) : « accord écrit pour la reproduction/affichage public — C'est pas plublic donc pas de problème » (utilisateur, 26.10) : toutes les sources entrent dans complements.json, `diffusion` garde la trace.

| Source | Diffusion | Ce qui a été lu |
|---|---|---|
| BarthHaas (`barthhaas`) | **inconnue** | « © BarthHaas » ; aucune page de conditions consultée ; robots.txt sans Disallow sur /hops-and-products/. |
| Brewer’s Friend (index des houblons) (`brewersfriend`) | **inconnue** | « Contenu © Brewer's Friend » ; robots.txt n'interdit pas /hops/. Index d'usage seulement : aucune valeur chimique, donc rien à fusionner. |
| British Hop Association (`britishhops`) | **inconnue** | Page https://www.britishhops.org.uk/terms-conditions/ lue (cache) : texte de remplissage « Lorem ipsum », aucune condition ; « © British Hop Association ». |
| BSG / RahrBSG Hops (`bsg`) | **inconnue** | robots.txt lu (Disallow /account/, /checkout/… sans rapport) ; aucune licence trouvée. |
| Charles Faram — Hop Oracle (`charlesfaram`) | **inconnue** | « © Charles Faram 2026 » ; « Legal terms » non consultées ; robots.txt limité à /wp-admin/. |
| Crosby Hops (`crosbyhops`) | **inconnue** | robots.txt lu (tout permis sauf /email/, /gated-downloads/, /blog/*, /hs/*) ; aucune licence trouvée. |
| HopDatabase (kasperg3) (`hopdatabase`) | **libre** | LICENSE du dépôt (cache) : « MIT License Copyright (c) 2024 Kasper Andreas Rømer Grøntved » ; notice à conserver. Agrégat des catalogues Barth Haas, Crosby, Hopsteiner, Yakima Chief, sans unité écrite. |
| Hops Direct (`hopsdirect`) | **inconnue** | robots.txt Shopify lu (/products/ permis) ; aucune licence trouvée. |
| hops-json (stuartraetaylor) (`hopsjson`) | **libre** | LICENSE du dépôt (cache) : « MIT License Copyright (c) 2019 Stuart Taylor » ; notice à conserver. Export de BrewDB, sans unité écrite. |
| Hopslist (`hopslist`) | **inconnue** | « © Julian Healey, All Rights Reserved » (simple mention, aucune clause de réutilisation) ; robots.txt : Disallow /wp-admin/ seulement. |
| Hopsteiner — Simon H. Steiner, Hopfen, GmbH (fiches variétales) (`hopsteiner`) | **restreinte** | https://www.hopsteiner.de/en/imprint § 3 (cache) : le contenu demande « the prior written consent of the provider » pour « duplication, editing, translation, storage, processing or reproduction of content in databases » ; copies et téléchargements « only permitted for personal, private and non-commercial use ». |
| Hop Products Australia (HPA) (`hpa`) | **inconnue** | robots.txt lu (tout permis sauf /wp-admin/) ; aucune licence trouvée. Les fiches PDF d'import sont des fiches John I. Haas (voir cette source). |
| Indie Hops (`indiehops`) | **inconnue** | robots.txt lu (Disallow /wp-admin/ seulement) ; aucune licence trouvée. |
| John I. Haas (`johnihaas`) | **restreinte** | https://www.johnihaas.com/terms-and-conditions-of-website-usage/ (cache) : « You may not reproduce, modify, distribute, create derivative works of, or publicly display any part of the Site without Haas's prior written consent » ; usage personnel ou interne seulement. |
| NZ Hops Ltd (`nzhops`) | **inconnue** | robots.txt Shopify lu (/products/ permis) ; aucune licence trouvée. Fiches PDF en image, non lues. |
| USA Hops / Hop Growers of America (`usahops`) | **inconnue** | robots.txt lu (tout permis) ; aucune licence trouvée. |
| USDA ARS, collection mondiale de cultivars de houblon (Corvallis) (`usda`) | **libre** | Institut public américain (ARS) : travail d'un organisme fédéral. Fiche Cascade : « commercial cultivar, no restrictions ». Aucune licence de réutilisation affirmée sur le site. |
| Yakima Valley Hops (`yakimavalleyhops`) | **inconnue** | robots.txt Shopify lu (/products/ permis) ; aucune licence trouvée. |

À vérifier : les conditions de BarthHaas, de Charles Faram et de la BHA n'ont pas de clause lue (BHA : page de conditions vide). Ces trois sources restent `inconnue`.

## Couverture des 318 variétés, champ par champ

« Avant » : le catalogue seul. « Après » : catalogue + enveloppes de `complements.json` (toutes sources). « Sans Hopsteiner ni Haas » : ce que l'on aurait sans les deux sources `restreinte`. « Hors enveloppe seul » : variétés où la seule valeur disponible est hors enveloppe (unité ou base inconnue, suspect) : gardée, non comptée.

| Champ | Avant | Après | Gain | Sans Hopsteiner ni Haas | Hors enveloppe seul |
|---|---:|---:|---:|---:|---:|
| **linalol** (`linalol`, % de l'huile) | 64 (20,2 %) | 132 (41,6 %) | +68 | 128 (40,4 %) | 7 |
| **géraniol** (`geraniol`, % de l'huile) | 0 (0,0 %) | 73 (23,0 %) | +73 | 73 (23,0 %) | 6 |
| **farnésène** (`farnesene`, % de l'huile) | 249 (78,5 %) | 268 (84,5 %) | +19 | 264 (83,3 %) | 0 |
| **β-pinène** (`betaPinene`, % de l'huile) | 0 (0,0 %) | 10 (3,2 %) | +10 | 10 (3,2 %) | 9 |
| **sélinène** (`selinene`, % de l'huile) | 0 (0,0 %) | 9 (2,8 %) | +9 | 9 (2,8 %) | 2 |
| **cohumulone** (`cohumulone`, % des α) | 286 (90,2 %) | 287 (90,5 %) | +1 | 287 (90,5 %) | 0 |
| **thiols** (`thiols`, µg/kg) | 0 (0,0 %) | 21 (6,6 %) | +21 | 21 (6,6 %) | 0 |
| **polyphénols** (`polyphenols`, % de la masse) | 0 (0,0 %) | 49 (15,5 %) | +49 | 32 (10,1 %) | 3 |
| **intensité d'arôme** (`intensite_arome`, sur 10) | 0 (0,0 %) | 30 (9,5 %) | +30 | 30 (9,5 %) | 111 |
| α (`alpha`, % de la masse) | 317 (100,0 %) | 317 (100,0 %) | +0 | 317 (100,0 %) | 0 |
| β (`beta`, % de la masse) | 310 (97,8 %) | 311 (98,1 %) | +1 | 311 (98,1 %) | 0 |
| huile totale (`huile`, mL/100 g) | 300 (94,6 %) | 300 (94,6 %) | +0 | 300 (94,6 %) | 1 |
| colupulone (`colupulone`, % des β) | 0 (0,0 %) | 7 (2,2 %) | +7 | 2 (0,6 %) | 1 |
| myrcène (`myrcene`, % de l'huile) | 257 (81,1 %) | 271 (85,5 %) | +14 | 271 (85,5 %) | 1 |
| humulène (`humulene`, % de l'huile) | 251 (79,2 %) | 267 (84,2 %) | +16 | 267 (84,2 %) | 6 |
| caryophyllène (`caryophyllene`, % de l'huile) | 238 (75,1 %) | 255 (80,4 %) | +17 | 254 (80,1 %) | 1 |
| 2-undécanone (`undecanone2`, % de l'huile) | 0 (0,0 %) | 0 (0,0 %) | +0 | 0 (0,0 %) | 1 |
| esters et alcools terpéniques (`esters_alcools_terpeniques`, % de l'huile) | 0 (0,0 %) | 11 (3,5 %) | +11 | 11 (3,5 %) | 0 |
| cétones (`cetones`, % de l'huile) | 0 (0,0 %) | 32 (10,1 %) | +32 | 32 (10,1 %) | 0 |
| isobutyrates (`isobutyrates`, % de l'huile) | 0 (0,0 %) | 29 (9,1 %) | +29 | 29 (9,1 %) | 0 |
| monoterpènes (`monoterpenes`, % de l'huile) | 0 (0,0 %) | 0 (0,0 %) | +0 | 0 (0,0 %) | 2 |
| sesquiterpènes (`sesquiterpenes`, % de l'huile) | 0 (0,0 %) | 0 (0,0 %) | +0 | 0 (0,0 %) | 2 |
| xanthohumol (`xanthohumol`, % de la masse) | 0 (0,0 %) | 80 (25,2 %) | +80 | 3 (0,9 %) | 3 |
| conservation (α restants après 6 mois à 20 °C) (`conservation`, % des α restants) | 0 (0,0 %) | 112 (35,3 %) | +112 | 112 (35,3 %) | 4 |
| indice de stockage (HSI) (`hsi`, indice sans unité) | 71 (22,4 %) | 71 (22,4 %) | +0 | 71 (22,4 %) | 1 |
| rendement (`rendement`, kg/ha) | 0 (0,0 %) | 147 (46,4 %) | +147 | 128 (40,4 %) | 3 |
| rapport humulène/caryophyllène (`rapportHC`, rapport sans unité) | 0 (0,0 %) | 8 (2,5 %) | +8 | 1 (0,3 %) | 0 |
| linalol « acide » (HopDatabase) (`linalolAcide`, sens non établi) | 0 (0,0 %) | 0 (0,0 %) | +0 | 0 (0,0 %) | 55 |
| résines dures (HopDatabase) (`resinesDures`, sens non établi) | 0 (0,0 %) | 0 (0,0 %) | +0 | 0 (0,0 %) | 61 |
| arôme noté : agrumes (`arome_citrusy`, odeur du houblon brut (Hopsteiner)) | 0 (0,0 %) | 89 (28,1 %) | +89 | 0 (0,0 %) | 1 |
| arôme noté : fruité (`arome_fruity`, odeur du houblon brut (Hopsteiner)) | 0 (0,0 %) | 89 (28,1 %) | +89 | 0 (0,0 %) | 1 |
| arôme noté : floral (`arome_floral`, odeur du houblon brut (Hopsteiner)) | 0 (0,0 %) | 89 (28,1 %) | +89 | 0 (0,0 %) | 1 |
| arôme noté : herbacé (`arome_herbal`, odeur du houblon brut (Hopsteiner)) | 0 (0,0 %) | 89 (28,1 %) | +89 | 0 (0,0 %) | 1 |
| arôme noté : épicé (`arome_spicy`, odeur du houblon brut (Hopsteiner)) | 0 (0,0 %) | 89 (28,1 %) | +89 | 0 (0,0 %) | 1 |
| arôme noté : résineux (`arome_resinous`, odeur du houblon brut (Hopsteiner)) | 0 (0,0 %) | 89 (28,1 %) | +89 | 0 (0,0 %) | 1 |
| arôme noté : sucré (`arome_sugarlike`, odeur du houblon brut (Hopsteiner)) | 0 (0,0 %) | 89 (28,1 %) | +89 | 0 (0,0 %) | 1 |
| arôme noté : divers (`arome_divers`, odeur du houblon brut (Hopsteiner)) | 0 (0,0 %) | 89 (28,1 %) | +89 | 0 (0,0 %) | 1 |

Notes : « avant » du linalol = `hsLinalool` (Hopsteiner, 64 variétés dans le catalogue) ; thiols, β-pinène, sélinène, géraniol, polyphénols, xanthohumol, colupulone : absents du catalogue (0). Le catalogue porte la classe « Thiol impact » de Hopsteiner (qualitative, non comptée ici) ; les thiols chiffrés viennent de BarthHaas seule. `hsi` avant = `bm.hsi` de Beer Maverick.

## Désaccords entre sources au-delà d'un facteur 2 (les 20 plus forts)

Rapport entre le milieu de plage le plus haut et le plus bas, entre deux sources différentes, sur les valeurs valides (dans l'enveloppe). Milieux ≥ 0,1 seulement (les traces font des rapports sans sens). Aucune réconciliation : l'enveloppe garde les deux.

112 désaccords au total.

| Variété | Champ | Rapport | Plus haut | Plus bas |
|---|---|---:|---|---|
| Eureka | caryophyllène | ×72,5 | Crosby Hops 14–15 | Hopslist 0,2 |
| Diamant | farnésène | ×58,6 | Hopsteiner 20–21 | BarthHaas 0,1–0,6 |
| Tettnanger | myrcène | ×45,1 | Hopslist 40,6 | BarthHaas ·–0,9 |
| Galena | farnésène | ×40,0 | BarthHaas ·–4 | Hopsteiner ·–0,1 |
| Spalt | farnésène | ×27,7 | BarthHaas ·–18 | Yakima Valley Hops 0,5–0,8 |
| Krush | farnésène | ×20,0 | BarthHaas ·–2 | Hop Products Australia 0–0,2 |
| Krush | géraniol | ×20,0 | BarthHaas ·–3 | Hop Products Australia 0–0,3 |
| Mandarina Bavaria | farnésène | ×15,0 | BarthHaas ·–1,5 | Hopsteiner ·–0,1 |
| Spalter Select | farnésène | ×14,8 | John I. Haas 15–22 | Hopsteiner 1–1,5 |
| Hersbrucker | farnésène | ×13,8 | BarthHaas ·–6,9 | Hopslist 0–1 |
| Jester | farnésène | ×13,3 | Yakima Valley Hops 2–· | British Hop Association 0,1–0,2 |
| Chinook | farnésène | ×12,4 | BarthHaas ·–6,2 | Hopslist 0–1 |
| Columbus | farnésène | ×10,4 | BarthHaas ·–5,2 | Hopslist 0–1 |
| Comet | farnésène | ×10,0 | Charles Faram ·–1 | Hopslist 0,1 |
| El Dorado | farnésène | ×10,0 | Crosby Hops ·–1 | Hopslist 0,1 |
| Hallertau Tradition | farnésène | ×10,0 | Charles Faram ·–1 | BarthHaas ·–0,1 |
| Zeus | farnésène | ×10,0 | BarthHaas ·–1 | Hopsteiner ·–0,1 |
| Huell Melon | farnésène | ×9,9 | Hopsteiner 0–19,8 | Charles Faram ·–1 |
| Pilot | humulène | ×8,7 | Charles Faram 30,5 | British Hop Association 3,5 |
| Galena | linalol | ×8,0 | BarthHaas ·–1,6 | Hopsteiner 0,1–0,3 |

## Valeurs suspectes (gardées, hors enveloppe)

α au-delà de 25 % : 3 ; hors du consensus de 3 sources : 23 ; hors du consensus de 4 sources : 11 ; hors du consensus de 5 sources : 5 ; hors du consensus de 6 sources : 11 ; hors du consensus de 7 sources : 9 ; hors du consensus de 9 sources : 3 ; même valeur que caryophyllène : 8 ; même valeur que farnésène : 12 ; même valeur que humulène : 4 ; même valeur que linalol : 5 ; même valeur que myrcène : 11 ; écart aux autres sources : 17 ; composé écrit sans signe % et ≤ 1 (0,42 = 42 % ? fraction probable, non convertie) : 33 ; huile totale au-delà de 6 mL/100 g : 85 ; plage inversée (min > max) : 15 ; fiche PDF appariée par l'ordre du flux, non recoupée par une autre source : 23 ; les minimums des composés de la fiche somment au-delà de 100 : 13 ; pourcentage au-dessus de 100 : 8

| Source | Variété (fiche) | Champ | Valeur | Raison |
|---|---|---|---|---|
| barthhaas | Galena → Galena | caryophyllene | 6,4–9,4 | hors du consensus de 4 sources |
| barthhaas | Herkules → Herkules | humulene | ·–17,2 | hors du consensus de 3 sources |
| barthhaas | Huell Melon → Huell Melon | humulene | ·–0,9 | écart aux autres sources |
| barthhaas | Hallertauer Magnum → Magnum (GR) | caryophyllene | ·–7,6 | hors du consensus de 3 sources |
| barthhaas | Marynka → Marynka | beta | 2–2,7 | écart aux autres sources |
| barthhaas | Spalter Select → Spalter Select | humulene | ·–5,3 | écart aux autres sources |
| barthhaas | Tango → Tango | geraniol | 0,5–0,6 | même valeur que caryophyllène |
| britishhops | Boadicea → Boadicea | selinene | 5 | même valeur que farnésène |
| britishhops | Mystic → Mystic | humulene | 35 | même valeur que myrcène |
| bsg | Amarillo → Amarillo | alpha | 11,3 | hors du consensus de 7 sources |
| bsg | Ariana → Ariana | alpha | 22 | hors du consensus de 6 sources |
| bsg | Ariana → Ariana | huile | 2,75 | hors du consensus de 5 sources |
| bsg | Callista → Callista | alpha | 7,5 | hors du consensus de 6 sources |
| bsg | Callista → Callista | huile | 2,8 | hors du consensus de 6 sources |
| bsg | Cascade → Cascade | alpha | 11–18 | hors du consensus de 9 sources |
| bsg | Cascade → Cascade | beta | 11–17 | hors du consensus de 9 sources |
| bsg | Citra → Citra | alpha | 21–28 | α au-delà de 25 % |
| bsg | Citra → Citra | beta | 5–9 | hors du consensus de 6 sources |
| bsg | Columbus → Columbus | alpha | 23,4 | hors du consensus de 7 sources |
| bsg | Columbus → Columbus | beta | 8,9 | hors du consensus de 6 sources |
| bsg | Columbus → Columbus | cohumulone | 27,5 | hors du consensus de 5 sources |
| bsg | Hallertau Blanc → Hallertau Blanc | alpha | 19 | hors du consensus de 7 sources |
| bsg | Hallertau Blanc → Hallertau Blanc | cohumulone | 28–35 | hors du consensus de 6 sources |
| bsg | Hallertau Blanc → Hallertau Blanc | huile | 2,05 | hors du consensus de 7 sources |
| bsg | Huell Melon → Huell Melon | alpha | 13 | hors du consensus de 7 sources |
| bsg | Mosaic → Mosaic | alpha | 18–26 | α au-delà de 25 % |
| bsg | Mosaic → Mosaic | beta | 5–8 | hors du consensus de 6 sources |
| bsg | Simcoe → Simcoe | alpha | 21–28 | α au-delà de 25 % |
| bsg | Simcoe → Simcoe | beta | 6–9 | hors du consensus de 4 sources |
| bsg | Krush → Krush | alpha | 18–22 | hors du consensus de 4 sources |
| bsg | Krush → Krush | beta | 10–14 | hors du consensus de 4 sources |
| charlesfaram | Admiral → Admiral | huile | 0,7–10,3 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Agnus → Agnus | huile | 20–30 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Aramis → Aramis | huile | 10,2–10,6 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Ariana → Ariana | myrcene | 0,47 | composé écrit sans signe % et ≤ 1 (0,42 = 42 % ? fraction probable, non convertie) |
| charlesfaram | Aurora → Aurora | huile | 0,9–10,6 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Aurora → Aurora | humulene | 20–25 | même valeur que myrcène |
| charlesfaram | Boadicea → Boadicea | huile | 10,4–20 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Boadicea → Boadicea | myrcene | 0,33 | composé écrit sans signe % et ≤ 1 (0,42 = 42 % ? fraction probable, non convertie) |
| charlesfaram | Bobek → Bobek | huile | 0,7–40 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Bouclier → Bouclier | huile | 10,1–10,6 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Bouclier → Bouclier | myrcene | 0,38 | composé écrit sans signe % et ≤ 1 (0,42 = 42 % ? fraction probable, non convertie) |
| charlesfaram | Bramling Cross → Bramling Cross | cohumulone | 26–31 | hors du consensus de 3 sources |
| charlesfaram | Bramling Cross → Bramling Cross | huile | 0,7–10 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Bramling Cross → Bramling Cross | myrcene | 0,36 | composé écrit sans signe % et ≤ 1 (0,42 = 42 % ? fraction probable, non convertie) |
| charlesfaram | Callista → Callista | cohumulone | 54–64 | écart aux autres sources |
| charlesfaram | Styrian Cardinal → Styrian Cardinal | huile | 30–40 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Cascade UK → Cascade | huile | 0,7–10,2 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Cascade → Cascade | myrcene | 0,53 | composé écrit sans signe % et ≤ 1 (0,42 = 42 % ? fraction probable, non convertie) |
| charlesfaram | Celeia → Celeia | huile | 0,6–20,5 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Challenger → Challenger | huile | 10–10,5 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Crystal → Crystal | myrcene | 0,47 | composé écrit sans signe % et ≤ 1 (0,42 = 42 % ? fraction probable, non convertie) |
| charlesfaram | Dana → Dana | huile | 20,4–30,9 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Delta → Delta | huile | 0,5–10,1 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Sultana → Sultana (Denali) | beta | 45050 | pourcentage au-dessus de 100 |
| charlesfaram | Sultana → Sultana (Denali) | huile | 20,5–4 | plage inversée (min > max) |
| charlesfaram | Sultana → Sultana (Denali) | myrcene | 0,55 | composé écrit sans signe % et ≤ 1 (0,42 = 42 % ? fraction probable, non convertie) |
| charlesfaram | Dr. Rudi → Dr. Rudi | huile | 10,3 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | East Kent Goldings → East Kent Goldings | myrcene | 0,25 | composé écrit sans signe % et ≤ 1 (0,42 = 42 % ? fraction probable, non convertie) |
| charlesfaram | Eclipse → Eclipse | huile | 10,7–10,9 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Eclipse → Eclipse | humulene | 10,4 | écart aux autres sources |
| charlesfaram | Eclipse → Eclipse | myrcene | 0,42 | composé écrit sans signe % et ≤ 1 (0,42 = 42 % ? fraction probable, non convertie) |
| charlesfaram | Ekuanot → Ekuanot | huile | 20,5–40 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | El Dorado → El Dorado | huile | 20,5–30,3 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Ella → Ella | huile | 20,4–30,4 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Endeavour → Endeavour | huile | 10,1–10,7 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Epic → Epic | myrcene | 0,12 | composé écrit sans signe % et ≤ 1 (0,42 = 42 % ? fraction probable, non convertie) |
| charlesfaram | Ernest → Ernest | huile | 0,7–10,1 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Ernest → Ernest | myrcene | 0,55 | composé écrit sans signe % et ≤ 1 (0,42 = 42 % ? fraction probable, non convertie) |
| charlesfaram | Eureka! → Eureka | huile | 20,5–40,4 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Eureka! → Eureka | myrcene | 0,43 | composé écrit sans signe % et ≤ 1 (0,42 = 42 % ? fraction probable, non convertie) |
| charlesfaram | First Gold → First Gold | farnesene | 10,5–4 | plage inversée (min > max) |
| charlesfaram | First Gold → First Gold | huile | 0,7–10,3 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Fuggle → Fuggle | huile | 0,7–10,1 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Galaxy → Galaxy | huile | 20,4–5 | plage inversée (min > max) |
| charlesfaram | Galena → Galena | huile | 0,9–10,2 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Glacier → Glacier | cohumulone | 41579 | pourcentage au-dessus de 100 |
| charlesfaram | Glacier → Glacier | huile | 0,7–10,6 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Godiva → Godiva | myrcene | 0,45 | composé écrit sans signe % et ≤ 1 (0,42 = 42 % ? fraction probable, non convertie) |
| charlesfaram | Golding → Golding | huile | 0,4–10,3 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Green Bullet → Green Bullet | huile | 10–10,2 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Harlequin → Harlequin | myrcene | 0,6 | composé écrit sans signe % et ≤ 1 (0,42 = 42 % ? fraction probable, non convertie) |
| charlesfaram | Huell Melon → Huell Melon | myrcene | 0,36 | composé écrit sans signe % et ≤ 1 (0,42 = 42 % ? fraction probable, non convertie) |
| charlesfaram | Idaho 7 → Idaho 7 | huile | 10–10,6 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Idaho Gem → Idaho Gem | beta | 45112 | pourcentage au-dessus de 100 |
| charlesfaram | Idaho Gem → Idaho Gem | huile | 44986 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Jarrylo → Jarrylo | huile | 30,6–40,3 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Kohatu → Kohatu | huile | 10 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Lemondrop → Lemondrop | huile | 10,5–20 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Lemondrop → Lemondrop | myrcene | 0,46 | composé écrit sans signe % et ≤ 1 (0,42 = 42 % ? fraction probable, non convertie) |
| charlesfaram | Liberty → Liberty | huile | 0,7–10,9 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Lotus → Lotus | huile | 10,5–20,5 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Mandarina Bavaria → Mandarina Bavaria | myrcene | 0,7 | composé écrit sans signe % et ≤ 1 (0,42 = 42 % ? fraction probable, non convertie) |
| charlesfaram | Mosaic → Mosaic | huile | 0,8–10,5 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Mount Hood → Mount Hood | huile | 10–10,3 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Moutere → Moutere | huile | 10,7 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Moutere → Moutere | humulene | 150,2 | pourcentage au-dessus de 100 |
| charlesfaram | Moutere → Moutere | myrcene | 2,2 | écart aux autres sources |
| charlesfaram | Mystic → Mystic | myrcene | 0,35 | composé écrit sans signe % et ≤ 1 (0,42 = 42 % ? fraction probable, non convertie) |
| charlesfaram | Nelson Sauvin → Nelson Sauvin | huile | 10,1 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Northdown → Northdown | huile | 10,2–20,2 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Northdown → Northdown | myrcene | 0,25 | composé écrit sans signe % et ≤ 1 (0,42 = 42 % ? fraction probable, non convertie) |
| charlesfaram | Nugget → Nugget | huile | 10–30 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Pacific Gem → Pacific Gem | huile | 10,1–10,4 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | NZ Pacific Jade → Pacific Jade | huile | 10,4 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Pacifica → Pacifica | huile | 10 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Pahto → Pahto | huile | 1–20,5 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Pekko → Pekko | huile | 20,1–20,7 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Phoenix → Phoenix | farnesene | 10,5 | écart aux autres sources |
| charlesfaram | Phoenix → Phoenix | huile | 10,2–20,5 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Phoenix → Phoenix | myrcene | 0,24 | composé écrit sans signe % et ≤ 1 (0,42 = 42 % ? fraction probable, non convertie) |
| charlesfaram | Pilgrim → Pilgrim | huile | 10–10,8 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Pilot → Pilot | huile | 0,8–10,4 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Polaris → Polaris | myrcene | 0,5 | composé écrit sans signe % et ≤ 1 (0,42 = 42 % ? fraction probable, non convertie) |
| charlesfaram | Premiant → Premiant | huile | 10,1–10,8 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Pride Of Ringwood → Pride of Ringwood | huile | 10–20 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Progress → Progress | huile | 0,5–10,2 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Rakau → Rakau | huile | 20,2 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Riwaka → Riwaka | huile | 10,2–10,8 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Sabro → Sabro | beta | 20–24 | écart aux autres sources |
| … | 179 autres suspectes dans `complements.json` (raison commençant par « s- »). | | | |

Charles Faram : sa page porte des artefacts de tableur — huile « 10.3 » ou « 20.4-30.9 » pour 1,3 ou 2,4–3,9 ; β « 45050 » et cohumulone « 41579 » (numéros de date Excel) ; myrcène « 0.42 » pour 42 %. Les valeurs qui dépassent les seuils sont suspectes ; celles qui restent dans les seuils (« 0.7-1.3 » lisible) n'ont aucun moyen d'être distinguées : à relire avant d'afficher une huile de Charles Faram.
BSG : le rendement « 2,200 – 2,400 lbs/acre » avait été lu 2.2–2.4 par la collecte (séparateur de milliers perdu) ; corrigé à la fusion d’après le texte brut (× 1000), puis converti en kg/ha.

Bornes négatives illisibles (valeur nulle côté collecte, brut gardé : non fusionnées, listées ici) :

- barthhaas : TerraFlux HBC 682 (Terraflux), beta « -1 - 7% »
- barthhaas : TerraFlux HBC 682 (Terraflux), farnesene « -1 - 0.6% »
- barthhaas : TerraFlux HBC 682 (Terraflux), geraniol « -1 - 0.4% »

## Aberrances entre sources (règles ajoutées après d3b)

- Règle d'écart (≥ 3 sources, intervalle sans recoupement, facteur > 3 de la médiane des autres) : **17 valeurs** écartées de l'enveloppe, sur 17 couples variété × champ, sur 4097 enveloppes.
- Règle de copie de colonne (bornes égales à celles d'un composé précédent de la même fiche) : **40 valeurs**.
- Règle des fiches PDF appariées par l'ordre du flux (fiches HPA « fiche-pdf » et fiches John I. Haas portant `appariement`) : **23 valeurs** sur 337 lues de ces fiches ; les autres sont recoupées par une source qui n'est pas elle-même une fiche appariée.
- Un composé n'est comparé qu'aux valeurs encore valides après la copie de colonne et la règle PDF (pas d'effet en cascade). Une valeur d'un champ à une seule ou deux sources n'est jamais écartée par la règle d'écart.

Les plus fortes de la règle d'écart (30 au plus ; il y en a 17 au total) :

| Variété | Champ | Source | Valeur | Médiane des autres | Rapport | Sources |
|---|---|---|---|---:|---:|---:|
| Green Bullet | farnésène | hopslist | 9,2–20 | 0,8 | ×18,3 | 3 |
| Riwaka | linalol | hopsteiner | 0–0,1 | 0,85 | ×17,0 | 3 |
| Huell Melon | humulène | barthhaas | ·–0,9 | 15 | ×16,7 | 6 |
| Moutere | myrcène | charlesfaram | 2,2 | 25 | ×11,4 | 3 |
| Taiheke | myrcène | charlesfaram | 5,31 | 53,75 | ×10,1 | 3 |
| Apollo | farnésène | hopsteiner | ·–0,1 | 1 | ×10,0 | 3 |
| Wai-iti | myrcène | crosbyhops | 3–4 | 26,25 | ×7,5 | 3 |
| Eclipse | humulène | charlesfaram | 10,4 | 1,4 | ×7,4 | 5 |
| Phoenix | farnésène | charlesfaram | 10,5 | 1,5 | ×7,0 | 5 |
| Moutere | farnésène | crosbyhops | 1–3 | 0,3 | ×6,7 | 3 |
| Marynka | β | barthhaas | 2–2,7 | 11,5 | ×4,9 | 4 |
| First Gold | farnésène | hopsteiner | 0–1 | 2,25 | ×4,5 | 4 |
| Comet | linalol | hopsteiner | 0,6–1 | 0,2 | ×4,0 | 3 |
| Sabro | β | charlesfaram | 20–24 | 5,5 | ×4,0 | 4 |
| Talus | β | charlesfaram | 34–39 | 9,25 | ×3,9 | 4 |
| Callista | cohumulone | charlesfaram | 54–64 | 18,5 | ×3,2 | 6 |
| Spalter Select | humulène | barthhaas | ·–5,3 | 16,75 | ×3,2 | 5 |

Copies de colonne (40) : barthhaas Tango géraniol 0,5–0,6 (même valeur que caryophyllène) ; britishhops Boadicea sélinène 5 (même valeur que farnésène) ; britishhops Mystic humulène 35 (même valeur que myrcène) ; charlesfaram Aurora humulène 20–25 (même valeur que myrcène) ; crosbyhops Cascade farnésène 3–9 (même valeur que caryophyllène) ; crosbyhops Magnum (GR) humulène 30–45 (même valeur que myrcène) ; crosbyhops Elani caryophyllène 5–10 (même valeur que humulène) ; hopslist Amarillo farnésène 2–4 (même valeur que caryophyllène) ; hopslist Canadian Redvine caryophyllène 2 (même valeur que humulène) ; hopslist Eroica farnésène 0–1 (même valeur que humulène) ; hopslist Nelson Sauvin farnésène 10,7 (même valeur que caryophyllène) ; hopslist Target farnésène 0–1 (même valeur que caryophyllène) ; hopslist Dunav humulène 19 (même valeur que myrcène) ; hopslist Eastern Green humulène 25 (même valeur que myrcène) ; hopslist Orbit humulène 33 (même valeur que myrcène) ; hopsteiner Horizon linalol 2–3 (même valeur que farnésène) ; hopsteiner Spalter Select linalol 1–1,5 (même valeur que farnésène) ; hpa Amarillo farnésène 2–4 (même valeur que caryophyllène) ; hpa Bru géraniol 0–1 (même valeur que farnésène) ; hpa Bru linalol 0–1 (même valeur que farnésène) ; johnihaas Amarillo farnésène 2–4 (même valeur que caryophyllène) ; johnihaas Amarillo farnésène 2–4 (même valeur que caryophyllène) ; johnihaas BRU-1 géraniol 0–1 (même valeur que farnésène) ; johnihaas BRU-1 linalol 0–1 (même valeur que farnésène) ; johnihaas Magnum (GR) humulène 30–45 (même valeur que myrcène) ; johnihaas Talus linalol 0–1 (même valeur que farnésène) ; nzhops Kohatu linalol 0,5–1 (même valeur que farnésène) ; nzhops Motueka β-pinène 0,7–1 (même valeur que linalol) ; nzhops Moutere β-pinène 0,1–0,5 (même valeur que farnésène) ; nzhops Pacific Jade β-pinène 0,4–0,6 (même valeur que linalol) ; nzhops Pacifica géraniol 0,1–1 (même valeur que farnésène) ; nzhops Pacifica humulène 30–40 (même valeur que myrcène) ; nzhops Riwaka β-pinène 0,5–1 (même valeur que farnésène) ; nzhops Southern Cross β-pinène 0,5–1 (même valeur que linalol) ; nzhops Southern Cross géraniol 0,5–1 (même valeur que linalol) ; nzhops Wai-iti β-pinène 0,3–0,5 (même valeur que linalol) ; yakimavalleyhops African Queen humulène 20–30 (même valeur que myrcène) ; yakimavalleyhops Mystic humulène 30–40 (même valeur que myrcène) ; yakimavalleyhops Pacific Jade humulène 31–35 (même valeur que myrcène) ; yakimavalleyhops Styrian Wolf farnésène 5–10 (même valeur que humulène).

### Règle de consensus (ajoutée après s1)

Une valeur dont l'intervalle ne recoupe celui d'aucune autre source, alors qu'au moins 3 autres sources se recoupent en un même point, devient suspecte : « hors du consensus de n sources ». Ne comptent pas dans le consensus : HopDatabase et hops-json (copies d'autres sources, de toute façon hors enveloppe faute d'unité) ; les fiches HPA PDF et John I. Haas comptent pour une seule voix (mêmes fiches) ; une source qui a plusieurs fiches (Crosby) compte une fois.

- Valeurs écartées par le consensus : **69**, dont **62 de plus** que la règle d'écart (7 l'étaient déjà), sur 67 couples variété × champ.
- Témoin : si les copies comptaient comme des sources distinctes, **3 valeurs de plus** seraient écartées à tort ; elles restent valides. Exemples : Idaho 7 myrcène charlesfaram 25 ; Mandarina Bavaria polyphénols hopsteiner 5,7 ; Tettnanger myrcène hopslist 40,6.

Les plus fortes (30 au plus, par rapport au milieu de la valeur à la médiane des autres ; il y en a 69) :

| Variété | Champ | Source | Valeur | Médiane des autres | Rapport | Consensus | Déjà écartée par l'écart |
|---|---|---|---|---:|---:|---:|---|
| Huell Melon | humulène | barthhaas | ·–0,9 | 15 | ×16,7 | 5 sources | oui |
| Eclipse | humulène | charlesfaram | 10,4 | 1,4 | ×7,4 | 4 sources | oui |
| Phoenix | farnésène | charlesfaram | 10,5 | 1,5 | ×7,0 | 3 sources | oui |
| Marynka | β | barthhaas | 2–2,7 | 11,5 | ×4,9 | 3 sources | oui |
| First Gold | farnésène | hopsteiner | 0–1 | 2,25 | ×4,5 | 3 sources | oui |
| Callista | cohumulone | charlesfaram | 54–64 | 18,5 | ×3,2 | 5 sources | oui |
| Spalter Select | humulène | barthhaas | ·–5,3 | 16,75 | ×3,2 | 4 sources | oui |
| Sorachi Ace | farnésène | hopsteiner | 0,7–1,8 | 3,5 | ×2,8 | 4 sources | non |
| Liberty | humulène | indiehops | 10–18 | 37,5 | ×2,7 | 4 sources | non |
| Golding | humulène | crosbyhops | 10–20 | 40 | ×2,7 | 3 sources | non |
| Cascade | β | bsg | 11–17 | 5,55 | ×2,5 | 9 sources | non |
| Target | myrcène | hopslist | 17–22 | 45 | ×2,3 | 3 sources | non |
| Perle (GR) | β | hopslist | 8 | 3,5 | ×2,3 | 3 sources | non |
| Cascade | α | bsg | 11–18 | 6,35 | ×2,3 | 9 sources | non |
| Callista | α | bsg | 7,5 | 3,5 | ×2,1 | 6 sources | non |
| Triskel | α | hopslist | 8–9 | 4 | ×2,1 | 5 sources | non |
| Herkules | humulène | barthhaas | ·–17,2 | 36,5 | ×2,1 | 3 sources | non |
| Bravo | humulène | crosbyhops | 8–11 | 19 | ×2,0 | 3 sources | non |
| Huell Melon | linalol | hopsteiner | 0,4–0,7 | 0,28 | ×2,0 | 3 sources | non |
| Callista | huile totale | bsg | 2,8 | 1,41 | ×2,0 | 6 sources | non |
| Aramis | cohumulone | hopslist | 42 | 21,5 | ×2,0 | 3 sources | non |
| Ariana | α | bsg | 22 | 11,5 | ×1,9 | 6 sources | non |
| Citra | β | bsg | 5–9 | 3,75 | ×1,9 | 6 sources | non |
| Galena | caryophyllène | barthhaas | 6,4–9,4 | 4,25 | ×1,9 | 4 sources | non |
| Golding | myrcène | crosbyhops | 45–65 | 30 | ×1,8 | 3 sources | non |
| Mosaic | β | bsg | 5–8 | 3,55 | ×1,8 | 6 sources | non |
| Columbus | β | bsg | 8,9 | 4,88 | ×1,8 | 6 sources | non |
| Hallertau Blanc | α | bsg | 19 | 10,5 | ×1,8 | 7 sources | non |
| Huell Melon | α | bsg | 13 | 7,2 | ×1,8 | 7 sources | non |
| Waimea | farnésène | crosbyhops | 7–11 | 5 | ×1,8 | 3 sources | non |

Cas cités par d3b (doivent être hors enveloppe) :
- Citra, β, bsg : 3,5–4,5 → dans l'enveloppe ; 5–9 → hors du consensus de 6 sources. Enveloppe : 2,7–4,5.
- Nelson Sauvin, farnésène, hopslist : 10,7 → même valeur que caryophyllène. Enveloppe : 0,1–1.
- Citra, farnésène, hpa : ·–1 → dans l'enveloppe. Enveloppe : 1.
- Mosaic, farnésène, hpa : aucune valeur. Enveloppe : 0–1.
- Mosaic, myrcène, hpa : 47–53 → dans l'enveloppe. Enveloppe : 24,5–65.

## Valeurs hors enveloppe (unité ou base inconnue ou différente)

| Source | Raison | Valeurs |
|---|---|---:|
| britishhops | huile écrite en %, pas en mL/100 g (base inconnue) | 33 |
| britishhops | origine non répertoriée : fiche d'une origine que la variété n'a pas au catalogue (astérisque) | 7 |
| bsg | unité et base se contredisent | 1 |
| bsg | origine non répertoriée : fiche d'une origine que la variété n'a pas au catalogue (astérisque) | 4 |
| bsg | unité non écrite par la source | 1 |
| charlesfaram | unité et base se contredisent | 1 |
| charlesfaram | échelle non publiée | 150 |
| charlesfaram | origine non répertoriée : fiche d'une origine que la variété n'a pas au catalogue (astérisque) | 6 |
| crosbyhops | huile écrite en %, pas en mL/100 g (base inconnue) | 4 |
| crosbyhops | origine non répertoriée : fiche d'une origine que la variété n'a pas au catalogue (astérisque) | 13 |
| crosbyhops | unité non écrite par la source | 5 |
| hopdatabase | sens du champ non établi | 116 |
| hopdatabase | unité non écrite par la source | 1217 |
| hopsjson | unité non écrite par la source | 474 |
| hopslist | base non publiée (sur quoi porte le pourcentage ?) | 19 |
| hopslist | huile écrite en %, pas en mL/100 g (base inconnue) | 2 |
| hopslist | origine non répertoriée : fiche d'une origine que la variété n'a pas au catalogue (astérisque) | 96 |
| hopsteiner | origine non répertoriée : fiche d'une origine que la variété n'a pas au catalogue (astérisque) | 15 |
| hpa | unité non écrite par la source | 14 |
| indiehops | origine non répertoriée : fiche d'une origine que la variété n'a pas au catalogue (astérisque) | 8 |
| johnihaas | unité non écrite par la source | 4 |
| johnihaas | unité différente de celle du champ | 13 |
| nzhops | huile écrite en %, pas en mL/100 g (base inconnue) | 4 |
| nzhops | origine non répertoriée : fiche d'une origine que la variété n'a pas au catalogue (astérisque) | 22 |
| usda | base non publiée (sur quoi porte le pourcentage ?) | 2 |
| yakimavalleyhops | unité et base se contredisent | 3 |
| yakimavalleyhops | huile écrite en %, pas en mL/100 g (base inconnue) | 5 |
| yakimavalleyhops | origine non répertoriée : fiche d'une origine que la variété n'a pas au catalogue (astérisque) | 12 |
| yakimavalleyhops | unité non écrite par la source | 12 |
| yakimavalleyhops | unité différente de celle du champ | 1 |

HopDatabase et hops-json n'écrivent aucune unité : tout est gardé, rien n'entre dans une enveloppe. Les chiffres de leur README suggèrent α, β, cohumulone en % et huile en mL/100 g ; HopDatabase est un agrégat de catalogues de fournisseurs déjà fusionnés ici (doublon probable). À trancher si l'on veut les compter : une règle « unité du README » les ferait entrer.
Charles Faram : « Flavour Intensity » sans échelle écrite (hors enveloppe) ; seule la BHA (sur 10) entre dans l'enveloppe d'intensité d'arôme.

## Fiches non rattachées et rattachements vérifiés

c6 (26.10, D98) : les variétés que les sources citent et que Beer Maverick n'a pas entrent dans ce fichier sous un identifiant `sources-<nom>` (188 variétés, 120 avec au moins une valeur). Les fiches sans variété (à confirmer, produits de forme, écartées par la vérification) sont dans `src/data/hopV4/complements-non-rattachees.json` avec leurs candidats ; leurs valeurs restent dans `src/data/hopSources/`.

| Source | Fiches | Rattachées | Écartées à la fusion | Non rattachées (total) |
|---|---:|---:|---:|---:|
| barthhaas | 97 | 96 | 0 | 1 |
| brewersfriend | 1112 | 993 | 0 | 0 |
| britishhops | 34 | 33 | 0 | 1 |
| bsg | 77 | 77 | 0 | 0 |
| charlesfaram | 157 | 152 | 0 | 5 |
| crosbyhops | 139 | 133 | 0 | 6 |
| hopdatabase | 220 | 209 | 1 | 11 |
| hopsdirect | 49 | 49 | 0 | 0 |
| hopsjson | 119 | 119 | 0 | 0 |
| hopslist | 268 | 258 | 0 | 10 |
| hopsteiner | 102 | 97 | 0 | 5 |
| hpa | 48 | 46 | 0 | 2 |
| indiehops | 19 | 17 | 0 | 2 |
| johnihaas | 81 | 76 | 0 | 5 |
| nzhops | 40 | 40 | 0 | 0 |
| usahops | 80 | 75 | 0 | 5 |
| usda | 2 | 2 | 0 | 0 |
| yakimavalleyhops | 146 | 138 | 0 | 8 |

Brewer's Friend : index sans valeur chimique ; ses lignes non rattachées ne sont pas listées.

### Rattachements écartés à la fusion (dans le doute : non rattaché)

Règle : l'origine annoncée par le nom (« (UK) », « NZ », « GR »…) ou par la page Hopslist doit être celle de la variété du catalogue ; sinon la fiche est écartée.

- hopdatabase : « Wai » → Waimea : abréviation : l'URL est celle de NZ Wai-iti, pas de Waimea

### Rattachées par la table d'alias ou par le nom (c6), pas par la collecte

Table : `src/data/hopV4/alias-noms.json`. Une fiche dont l'origine (nom ou page) n'est pas celle de la variété du catalogue se rattache à la variété la plus proche, marquée « * origine non répertoriée » : ses valeurs sont gardées hors de l'enveloppe (raison `h-origine`) et la fiche porte l'origine lue en 4e élément de `f`. Equinox est Ekuanot (un seul identifiant).

- **barthhaas** (11) : Dolcita → Dolcita ; Hallertauer Magnum → Magnum (GR) ; Hallertauer Mittelfrüh → Hallertau Mittelfrüh ; Huell Classic → Huell Classic ; Krush → Krush ; Luna → Luna ; Perle → Perle (GR) ; Saaz → Saaz (CZ) ; TerraFlux HBC 682 → Terraflux ; Tettnang Tettnanger → Tettnanger ; Titan → Titan
- **britishhops** (3) : Cascade (UK) → Cascade * Royaume-Uni ; Keyworths Early → Keyworths Early ; Keyworths Midseason → Keyworths Midseason
- **bsg** (8) : Amira → Amira ; Krush → Krush ; Magnum → Magnum (GR) ; Northern Brewer → Northern Brewer (GR) ; Perle → Perle (GR) ; Saaz → Saaz (CZ) ; Styrian Golding Celeia → Styrian Golding ; Tettnang → Tettnang (US) * Allemagne
- **charlesfaram** (20) : Cascade UK → Cascade * Royaume-Uni ; Elani → Elani ; Emperor → Emperor ; KARMA → KARMA ; Keyworth’s Early → Keyworth’s Early ; Keyworth’s Mid-season → Keyworth’s Mid-season ; Krpan → Krpan ; Lubelski → Lubelska ; Mittelfruh → Hallertau Mittelfrüh ; Most → Most ; NZ Pacific Jade → Pacific Jade ; NZ Southern Cross → Southern Cross ; Opus → Opus ; Pink (ID-158) → Pink ; Savinjski Golding → Styrian Golding ; Styrian Eureka → Styrian Eureka ; Superdelic → Superdelic ; Tolar → Tolar ; Tradition → Hallertau Tradition ; Vera → Vera
- **crosbyhops** (19) : Deep Cut Cascade → Deep Cut Cascade ; Dolcita HBC 1019 c.v. → Dolcita ; Elani YQH-1320 → Elani ; Elani → Elani ; GR Hüll Melon → Huell Melon ; GR Tradition → Hallertau Tradition ; Hop Revolution Turkey's Pick → Turkey's Pick ; Hüll Melon → Huell Melon ; Krush HBC 586 → Krush ; Krush → Krush ; NZ Cascade → Cascade * Nouvelle-Zélande ; SI Styrian Golding Celeia → Styrian Golding ; Spalt Select → Spalter Select ; Strata, an Indie Hops variety → Strata ; Thora → Thora ; Turkey's Pick → Turkey's Pick ; UK Golding → Golding * Royaume-Uni ; USDA 074 → USDA 074 ; Vera → Vera
- **hopdatabase** (49) : Alora → Alora ; Cluster fugget → Cluster fugget ; Columbus / tomahawk → Columbus ; East kent golding → East Kent Goldings ; Elani → Elani ; Erebus → Erebus ; Extra styrian dana → Extra styrian dana ; Hallertauer magnum → Magnum (GR) ; Hallertauer merkur → Merkur ; Hallertauer mittelfrüh → Hallertau Mittelfrüh ; Hallertauer taurus → Hallertau Taurus ; Hallertauer tradition → Hallertau Tradition ; Hbc 1019 c.v. → Dolcita ; Hbc 638 → Hbc 638 ; Hbc 682 c.v. → Terraflux ; Hersbrucker spät → Hersbrucker ; Hqg3 → Hqg3 ; Huell classic → Huell Classic ; Hüll melon → Huell Melon ; Krush → Krush ; Lubelski → Lubelska ; Lublin → Lubelska ; Magnum → Magnum (GR) ; Motueka - machops → machops ; Mt. hood → Mount Hood ; Mt. rainier → Mount Rainier ; Nelson sauvin - machops → machops ; Northern brewer → Northern Brewer (GR) ; Pacifica - machops → machops ; Perle → Perle (GR) ; Rakau - machops → machops ; Saaz → Saaz (CZ) ; Saazer → Saaz (CZ) ; Savinjski golding → Styrian Golding ; Spalt spalter → Spalt ; Spalter → Spalt ; Strisselspalter → Strisselspalt ; Styrian savinjski golding → Styrian Golding ; Sultana → Sultana (Denali) ; Superdelic , hops → Superdelic ; Tettnang tettnanger → Tettnanger ; Titan → Titan ; Tradition → Hallertau Tradition ; Turkeys pick → Turkeys pick ; Us saaz → Saaz (US) ; Wakatu - machops → machops ; Whitbread golding → Whitbread Golding Variety (WGV) ; Whitbread goldings variety → Whitbread Golding Variety (WGV) ; Ycr 1 → Ycr 1
- **hopsdirect** (6) : Fuggles Us → Fuggle ; Golding Us → Golding ; Hallertau Mittelfruh Us → Hallertau Mittelfrüh ; Hallertau Tradition Gr → Hallertau Tradition ; Pink (Id-158) → Pink ; Tettnanger Us → Tettnanger
- **hopsjson** (13) : Cascade (NZ) → Cascade * Nouvelle-Zélande ; East Kent Golding (UK) → East Kent Goldings ; Fuggle (US) → Fuggle * États-Unis ; Gimmli (DE) → Gimmli ; Golding (SI) → Golding * Slovénie ; Lublin (PL) → Lubelska ; Mapuche (AR) → Mapuche ; Mt. Hood → Mount Hood ; Mt. Rainier → Mount Rainier ; Taurus (DE) → Hallertau Taurus ; Tettnang (DE) → Tettnang (US) * Allemagne ; Tradition (DE) → Hallertau Tradition ; Whitbread Golding Variety (UK) → Whitbread Golding Variety (WGV)
- **hopslist** (94) : Ahil → Ahil ; Alliance → Alliance ; Amallia → Amallia ; Amarillo VGXP01 → Amarillo ; BOR → Bor * États-Unis ; Backa → Backa ; Bate’s Brewer → Bate’s Brewer ; Blato → Blato ; Blisk → Blisk ; Blue Northern Brewer → Blue Northern Brewer ; Bramling → Bramling ; Buket → Buket ; Bullion 10A → Bullion 10A ; Bullion → Bullion * Royaume-Uni ; Calicross → Calicross ; California Cluster → California Cluster ; Canterbury Whitebine → Canterbury Whitebine ; Cascade (Argentina) → Cascade * Argentine ; Cascade (Australia) → Cascade * Australie ; Cascade (New Zealand) → Cascade * Nouvelle-Zélande ; Cicero → Cicero ; Cluster (AUS) → Cluster * Australie ; Cobb → Cobb ; Coigneau → Coigneau ; Density → Density ; Dunav → Dunav ; Early Bird → Early Bird ; Early Green → Early Green ; Early Prolific → Early Prolific ; Early Promise → Early Promise ; Eastern Gold → Eastern Gold ; Eastern Green → Eastern Green ; Eastwell Golding → Eastwell Golding ; Elsaesser → Elsaesser ; Fantasia → Fantasia ; First Choice → First Choice ; Fuggle (US) → Fuggle * États-Unis ; Fuggle Tetraploid → Fuggle Tetraploid ; Furano Ace → Furano Ace ; Gargoyle → Gargoyle ; Golding (BC) → Golding * Canada ; Greensburg → Greensburg ; Groene Bel → Groene Bel ; Hallertau (NZ) → Hallertau (US) * Nouvelle-Zélande ; Hallertau → Hallertau (US) * Allemagne ; Hallertauer Taurus → Hallertau Taurus ; Hallertauer Tradition → Hallertau Tradition ; Hersbrucker Pure → Hersbrucker Pure ; Hersbrucker Red-Stem → Hersbrucker Red-Stem ; Hybrid-2 → Hybrid-2 ; Hüll Melon → Huell Melon ; Ivanhoe → Ivanhoe ; Janus → Janus ; Keyworth’s Early → Keyworth’s Early ; Keyworth’s Midseason → Keyworth’s Midseason ; Kirin II → Kirin II ; Kitamidori → Kitamidori ; Landhopfen → Landhopfen ; Legacy → Legacy ; Lubelska-Pulawy → Lubelska-Pulawy ; Lucan → Lucan ; Magnum → Magnum (GR) ; Mathon → Mathon ; Nadwislanska → Nadwislanska ; Neo1 → Neo1 ; Neoplanta → Neoplanta ; Nordgaard → Nordgaard ; Orbit → Orbit ; Outeniqua → Outeniqua ; Perle → Perle (GR) ; Petham Golding → Petham Golding ; Pocket Talisman → Pocket Talisman ; Precoce de Bourgogne → Precoce de Bourgogne ; Pride of Kent → Pride of Kent ; Record → Record ; Red Earth → Red Earth ; Saaz → Saaz (CZ) ; Saxon → Saxon ; Serebrianka → Serebrianka ; Shinshuwase → Shinshuwase ; Southern Promise → Southern Promise * Slovénie ; Star → Star ; Sunshine → Sunshine ; Symphony → Symphony ; Tettnanger (Swiss) → Tettnanger * Suisse ; Tettnanger (US) → Tettnang (US) ; Tolhurst → Tolhurst ; Universal → Universal ; Viking → Viking ; Vojvodina → Vojvodina ; Willamette (AUS) → Willamette * Australie ; Willow Creek → Willow Creek ; Wuerttemberger → Wuerttemberger ; Zlatan → Zlatan
- **hopsteiner** (8) : Alora → Alora ; Columbus/ Tomahawk → Columbus ; Erebus → Erebus ; Golding (UK) → Golding * Royaume-Uni ; Hallertauer Magnum → Magnum (GR) ; Nobella → Nobella ; Styrian Golding (Celeia) → Styrian Golding ; Titan → Titan
- **hpa** (13) : Bru → Bru ; Dolcita → Dolcita ; East Kent Golding → East Kent Goldings ; Fuggles → Fuggle ; HBC 1134 → Hbc 1134 ; Hallertauer Mittelfruher → Hallertau Mittelfrüh ; Hallertauer Tradition → Hallertau Tradition ; Huell Classic → Huell Classic ; Krush → Krush ; Luna → Luna ; Saazer → Saaz (CZ) ; Spalt Spalter → Spalt ; Tettnang Tettnanger → Tettnanger
- **indiehops** (6) : Audacia → Audacia ; Luminosa → Luminosa ; Lórien → Lorien ; Strata CGX → Strata CGX ; US Fuggle → Fuggle * États-Unis ; US Tettnanger → Tettnang (US)
- **johnihaas** (10) : Dolcita → Dolcita ; HBC 1134 c.v. EXPERIMENTAL HOP → HBC 1134 c.v. EXPERIMENTAL HOP ; HBC 638 c.v. → Hbc 638 ; Hallertauer Magnum → Magnum (GR) ; Hallertauer Tradition → Hallertau Tradition ; Hüll Melon → Huell Melon ; Krush HBC 586 c.v. → Krush ; Luna → Luna ; TerraFlux HBC 682 c.v. → Terraflux ; TerraSurge HBC 1325 c.v. → Terrasurge
- **nzhops** (3) : NZ Chinook → Chinook * Nouvelle-Zélande ; NZ Fuggle → Fuggle * Nouvelle-Zélande ; Superdelic → Superdelic
- **usahops** (7) : AlphAroma → AlphAroma ; Denali → Sultana (Denali) ; Ekuanot Brand HBC 366 → Ekuanot ; Serebrianka → Serebrianka ; Spalter → Spalt ; Thora → Thora ; Vera → Vera
- **yakimavalleyhops** (33) : Anchovy → Anchovy ; Calista → Callista ; Dolcita → Dolcita ; East Kent Golding → East Kent Goldings ; Elani → Elani ; Experimental Cls X14 → Experimental Cls X14 ; Experimental D5 055 → Experimental D5 055 ; French Fuggle → Fuggle * France ; Hbc 1134 → Hbc 1134 ; Hbc 431 → Hbc 431 ; Hbc 638 → Hbc 638 ; Hpa 065 → Hpa 065 ; Hpa 4029 → Hpa 4029 ; Hull Melon → Huell Melon ; Id 158 → Id 158 ; Krush → Krush ; Lorien → Lorien ; Lubelski → Lubelska ; Luna → Luna ; Most → Most ; Spalt Select → Spalter Select ; Spalter → Spalt ; Styrian Golding Celeia → Styrian Golding ; Superdelic → Superdelic ; Tangier → Tangier ; Terraflux → Terraflux ; Terrasurge → Terrasurge ; Tettnang → Tettnang (US) ; Thora → Thora ; Uk Golding → Golding * Royaume-Uni ; Usda 200010 008 → Usda 200010 008 ; Vera → Vera ; Zumo → Zumo

### À confirmer (rien n'est rattaché)

- Brewer's Gold | Brewer’s Gold | Hopsteiner - Brewer's Gold | Yakima Chief Hops - Brewer’s Gold | Yakima Valley Hops - FR Brewer's Gold | homebrewstuff - Brewer's Gold (brewersfriend, hopslist, usahops) : plusieurs variétés du catalogue portent ce nom (Brewer's Gold (GR), Brewer's Gold (US)) et la fiche ne dit pas laquelle
- Barth-Haas - Brewers Gold | Brewers Gold | Brewers gold | Charles Faram - Brewers Gold | Lupin Mart - Brewers Gold | Michigan Hop Alliance - Brewers Gold (barthhaas, brewersfriend, charlesfaram, hopdatabase, hopsteiner, yakimavalleyhops) : Brewer's Gold existe en deux versions au catalogue (GR et US) et la fiche ne dit pas laquelle
- Cerera (hopslist, ihps) : Cerera → Celeia (distance 2) : probablement faux ; décision du pilote
- Fuggle H (hopslist) : variante de Hopslist (suffixe H, sens non publié) ; décision du pilote
- Fuggle N (hopslist) : variante de Hopslist (suffixe N, sens non publié) ; décision du pilote
- Artisan - Goldings | Charles Faram - Goldings | Goldings | Goldings (NZ) | Northern Brewer - Goldings (US) | Northern Brewer - US Goldings | Us Goldings (brewersfriend, britishhops, hopslist, yakimavalleyhops) : « Goldings » seul : East Kent Goldings ou Golding ? ; décision du pilote
- Hallertauer (usahops) : « Hallertauer » seul : Hallertau (US) ou Hallertau Mittelfrüh ? ; décision du pilote
- HBC 522 | HBC 522 c.v. | Hbc 522 | Yakima Valley Hops - HBC 522 (brewersfriend, hpa, johnihaas, yakimavalleyhops) : code de sélection HBC 522 : une variété sans nom, à ne pas rapprocher d'un nom par la distance ; décision du pilote
- Hersbrucker E (hopslist) : variante de Hopslist (suffixe E, sens non publié) ; décision du pilote
- HS09326 | Hopsteiner - HS09326 | Hs09326 (brewersfriend, hopdatabase, hopsteiner) : code de sélection HS09326 : une variété sans nom ; décision du pilote
- Artisan - Magnum | BSG - Magnum | Brewferm - Magnum | Charles Faram - Magnum | Four Star Farms - Magnum | Hops Direct - Magnum US | Magnum | Simply Hops - Magnum | Yakima Chief Hops - Magnum | Yakima Valley Hops - Magnum | backroads hops - Magnum (brewersfriend, charlesfaram, crosbyhops, usahops, yakimavalleyhops) : plusieurs variétés du catalogue portent ce nom (Magnum (GR), Magnum (US)) et la fiche ne dit pas laquelle
- Brewferm - Northern Brew (brewersfriend) : « Northern Brew » : Northern Brewer (GR ou US) ? ; décision du pilote
- Artisan - Northern Brewer | Barth-Haas - Northern Brewer | Brewmaster - Northern Brewer | Charles Faram - Northern Brewer | Hops Direct - Northern Brewer | Hopsteiner - Northern Brewer | Northern Brewer | Northern Brewer (UK) | Yakima Valley Hops - Northern Brewer (brewersfriend, charlesfaram, hopslist, hopsteiner, johnihaas, usahops, yakimavalleyhops) : plusieurs variétés du catalogue portent ce nom (Northern Brewer (GR), Northern Brewer (US)) et la fiche ne dit pas laquelle
- Artisan - Perle | BSG - Perle | Barth-Haas - Perle | Charles Faram - Perle | Hopsteiner - Perle | Perle | Yakima Valley Hops - Perle (brewersfriend, charlesfaram, crosbyhops, hopsteiner, hpa, johnihaas, yakimavalleyhops) : plusieurs variétés du catalogue portent ce nom (Perle (GR), Perle (US)) et la fiche ne dit pas laquelle
- 47 Hops - Saaz | BSG - Saaz | Charles Faram - Saaz | German Saaz | Hops Direct - Saaz | Saaz | Yakima Chief Hops - Saaz | Yakima Valley Hops - DE Saaz | Yakima Valley Hops - Saaz | bay wa ag - saaz | bohemia hop - Saaz | brelex - Saaz | ølbrygging.no - Saaz (brewersfriend, charlesfaram, johnihaas, usahops, yakimavalleyhops) : plusieurs variétés du catalogue portent ce nom (Saaz (CZ), Saaz (US)) et la fiche ne dit pas laquelle
- Barth-Haas - Styrian Gold | Charles Faram - Styrian Gold | Styrian Gold | Styrian gold (brewersfriend, hopdatabase, hopslist, hopsteiner, ihps) : Styrian Gold → Styrian Wolf (distance 2) : probablement faux, deux variétés slovènes différentes ; décision du pilote
- Tettnanger A (hopslist) : variante de Hopslist (suffixe A, sens non publié) ; décision du pilote
- Tettnanger B (hopslist) : variante de Hopslist (suffixe B, sens non publié) ; décision du pilote

### Variétés ajoutées (c6)

188 variétés citées par au moins une source (hors produits de forme) : 25 par 2 sources ou plus (sans Brewer's Friend, index sans valeur), 52 par Brewer's Friend seul.

### Rattachements à relire (nom différent du catalogue, acceptés)

- **barthhaas** (15) : Extra Styrian Dana → Dana ; Hallertauer Magnum → Magnum (GR) ; Hallertauer Mittelfrüh → Hallertau Mittelfrüh ; Hallertauer Taurus → Hallertau Taurus ; Hallertauer Tradition → Hallertau Tradition ; Hersbrucker Spät → Hersbrucker ; Lublin → Lubelska ; Mt. Hood → Mount Hood ; Perle → Perle (GR) ; Saaz → Saaz (CZ) ; Spalt Spalter → Spalt ; Styrian Savinjski Golding → Styrian Golding ; TerraFlux HBC 682 → Terraflux ; Tettnang Tettnanger → Tettnanger ; Whitbread Goldings Variety → Whitbread Golding Variety (WGV)
- **brewersfriend** (866) : 47 Hops - Amarillo → Amarillo ; 47 Hops - Crystal → Crystal ; 47 Hops - Galaxy → Galaxy ; 47 Hops - HCB 586 → Krush ; 47 Hops - Huell Melon → Huell Melon ; 47 Hops - Mandarina Bavaria → Mandarina Bavaria ; 47 Hops - Super Styrian → Super Styrian ; Artisan - Amarillo → Amarillo ; Artisan - Apollo → Apollo ; Artisan - Cascade → Cascade ; Artisan - Cashmere → Cashmere ; Artisan - Centennial → Centennial ; Artisan - Chinook → Chinook ; Artisan - Citra → Citra ; Artisan - Columbus (CTZ) → Columbus ; Artisan - Crystal → Crystal ; Artisan - Dr. Rudi → Dr. Rudi ; Artisan - Ekuanot → Ekuanot ; Artisan - Fuggle (UK) → Fuggle ; Artisan - Fuggle (US) → Fuggle ; Artisan - Galaxy → Galaxy ; Artisan - Galena → Galena ; Artisan - German Herkules → Herkules ; Artisan - German Select → German select ; Artisan - Hallertau Blanc → Hallertau Blanc ; Artisan - Hallertau Mittelfruh → Hallertau Mittelfrüh ; Artisan - Hersbrucker → Hersbrucker ; Artisan - Horizon → Horizon ; Artisan - Hull Melon → Huell Melon ; Artisan - Idaho #7 → Idaho 7 ; Artisan - Idaho Gem → Idaho Gem ; Artisan - Jarrylo → Jarrylo ; Artisan - Kent Goldings → East Kent Goldings ; Artisan - Lemondrop → Lemondrop ; Artisan - Liberty → Liberty ; Artisan - Mandarina Bavaria → Mandarina Bavaria ; Artisan - Medusa → Medusa ; Artisan - Mosaic → Mosaic ; Artisan - Motueka → Motueka ; Artisan - Saaz (Czech) → Saaz (CZ) ; Artisan - Saaz (US) → Saaz (US) ; Artisan - Saphir → Saphir ; Artisan - Simcoe → Simcoe ; Artisan - Southern Passion → Southern Passion ; Artisan - Spalt → Spalt ; Artisan - Strisselspalt → Strisselspalt ; Artisan - Styrian Goldings → Styrian Golding ; Artisan - Summit → Summit ; Artisan - Tettnanger → Tettnanger ; Artisan - Trident → Trident ; Artisan - UK Archer → Archer ; Artisan - US Eureka → Eureka ; Artisan - Warrior → Warrior ; Artisan - Willamette → Willamette ; Artisan - Zappa → Zappa ; Australien - VIC SECRET → Vic Secret ; BSG - Ahtanum → Ahtanum ; BSG - Azacca → Azacca ; BSG - CTZ → CTZ ; BSG - Cascade → Cascade ; BSG - Centennial → Centennial ; BSG - Challenger → Challenger ; BSG - Chinook → Chinook ; BSG - Citra → Citra ; BSG - East Kent Goldings → East Kent Goldings ; BSG - Falconer's Flight → Falconer's Flight ; BSG - First Gold Uk → First Gold ; BSG - Fuggle → Fuggle ; BSG - Galaxy → Galaxy ; BSG - German Hallertau Mittelfrüh → Hallertau Mittelfrüh ; BSG - German Northern Brewer → Northern Brewer (GR) ; BSG - German Spalter Select → Spalter Select ; BSG - HS-Sitiva → HS-Sitiva ; BSG - Hallertau Mittelfruh → Hallertau Mittelfrüh ; BSG - Hallertauer Blanc → Hallertau Blanc ; BSG - Hersbrucker → Hersbrucker ; BSG - Idaho 7 → Idaho 7 ; BSG - Kazbek → Kazbek ; BSG - Mandarina Bavaria → Mandarina Bavaria ; BSG - Mosaic → Mosaic ; BSG - Motueka → Motueka ; BSG - Mount Hood → Mount Hood ; BSG - Nelson Sauvin → Nelson Sauvin ; BSG - Nugget → Nugget ; BSG - Pacifica → Pacifica ; BSG - Rakau → Rakau ; BSG - Sabro → Sabro ; BSG - Styrian Golding → Styrian Golding ; BSG - Styrian Goldings → Styrian Golding ; BSG - Tettnang → Tettnang (US) ; BSG - Tettnanger → Tettnanger ; BSG - Tradition → Hallertau Tradition ; BSG - UK Target → Target ; BSG - Wai-iti → Wai-iti ; BSG - Warrior → Warrior ; BSG - Willamette → Willamette ; Bakke Brygg - Chinook → Chinook ; Barth-Haas - Admiral → Admiral ; Barth-Haas - Agnus → Agnus ; Barth-Haas - Ahtanum → Ahtanum ; Barth-Haas - Amarillo BBC → Amarillo BBC ; Barth-Haas - Amarillo → Amarillo ; Barth-Haas - Aramis → Aramis ; Barth-Haas - Ariana → Ariana ; Barth-Haas - Aurora → Aurora ; Barth-Haas - Azacca → Azacca ; Barth-Haas - Boadicea → Boadicea ; Barth-Haas - Bobek → Bobek ; Barth-Haas - Bramling Cross → Bramling Cross ; Barth-Haas - Bru-1 → BRU-1 ; Barth-Haas - Callista → Callista ; Barth-Haas - Cascade → Cascade ; Barth-Haas - Cashmere → Cashmere ; Barth-Haas - Celeia → Celeia ; Barth-Haas - Centennial → Centennial ; Barth-Haas - Chelan → Chelan ; Barth-Haas - Chinook → Chinook ; Barth-Haas - Citra BBC → Citra BBC ; Barth-Haas - Citra → Citra ; Barth-Haas - Cluster → Cluster ; Barth-Haas - Columbus → Columbus ; Barth-Haas - Comet → Comet ; Barth-Haas - Crystal → Crystal ; Barth-Haas - East Kent Golding → East Kent Goldings ; Barth-Haas - Ekuanot → Ekuanot ; Barth-Haas - Ella → Ella ; Barth-Haas - Endeavour → Endeavour ; Barth-Haas - Enigma → Enigma ; Barth-Haas - Extra Styrian Dana → Extra styrian dana ; Barth-Haas - First Gold → First Gold ; Barth-Haas - Fuggles → Fuggle ; Barth-Haas - Galaxy → Galaxy ; Barth-Haas - Galena → Galena ; Barth-Haas - Glacier → Glacier ; Barth-Haas - Hallertau Blanc → Hallertau Blanc ; Barth-Haas - Hallertauer Magnum → Magnum (GR) ; Barth-Haas - Hallertauer Mittelfrüher → Hallertau Mittelfrüh ; Barth-Haas - Hallertauer Taurus → Hallertau Taurus ; Barth-Haas - Hallertauer Tradition → Hallertau Tradition ; Barth-Haas - Harmonie → Harmonie ; Barth-Haas - Herkules → Herkules ; Barth-Haas - Hersbrucker Spät → Hersbrucker ; Barth-Haas - Huell Melon → Huell Melon ; Barth-Haas - Kazbek → Kazbek ; Barth-Haas - Krush → Krush ; Barth-Haas - Loral → Loral ; Barth-Haas - Lublin → Lubelska ; Barth-Haas - Magnat → Magnat ; Barth-Haas - Mandarina Bavaria → Mandarina Bavaria ; Barth-Haas - Marynka → Marynka ; Barth-Haas - Millennium → Millennium ; Barth-Haas - Monroe → Monroe ; Barth-Haas - Mosaic → Mosaic ; Barth-Haas - Mt. Hood → Mount Hood ; Barth-Haas - National → National ; Barth-Haas - Nugget → Nugget ; Barth-Haas - Opal → Opal ; Barth-Haas - Pahto → Pahto ; Barth-Haas - Palisade → Palisade ; Barth-Haas - Pilgrim → Pilgrim ; Barth-Haas - Polaris → Polaris ; Barth-Haas - Premiant → Premiant ; Barth-Haas - Progress → Progress ; Barth-Haas - Relax → Relax ; Barth-Haas - Saaz Late → Saaz Late ; Barth-Haas - Saazer → Saaz (CZ) ; Barth-Haas - Sabro → Sabro ; Barth-Haas - Saphir → Saphir ; Barth-Haas - Simcoe → Simcoe ; Barth-Haas - Sladek → Sládek ; Barth-Haas - Smaragd → Smaragd ; Barth-Haas - Sorachi Ace → Sorachi Ace ; Barth-Haas - Sovereign → Sovereign ; Barth-Haas - Spalt Spalter → Spalt ; Barth-Haas - Spalter Select → Spalter Select ; Barth-Haas - Strisselspalt → Strisselspalt ; Barth-Haas - Styrian Savinjski Golding → Styrian Golding ; Barth-Haas - Summit → Summit ; Barth-Haas - Super Galena → Super Galena ; Barth-Haas - Super Pride → Super Pride ; Barth-Haas - Sybilla → Sybilla ; Barth-Haas - Tahoma → Tahoma ; Barth-Haas - Tettnang Tettnanger → Tettnanger ; Barth-Haas - Topaz → Topaz ; Barth-Haas - Triple Pearl → Triple Pearl ; Barth-Haas - Triskel → Triskel ; Barth-Haas - Vic Secret → Vic Secret ; Barth-Haas - Vital → Vital ; Barth-Haas - Warrior → Warrior ; Barth-Haas - Whitbread Golding Variety → Whitbread Golding Variety (WGV) ; Barth-Haas - Willamette → Willamette ; Barth-Haas - Wye Challenger → Wye Challenger ; Barth-Haas - Wye Target → Wye Target ; Barth-Haas - Zeus → Zeus ; Brewer’s Best - Amarillo → Amarillo ; Brewferm - African Queen → African Queen ; Brewferm - Amarillo → Amarillo ; Brewferm - Aramis → Aramis ; Brewferm - Barbe Rouge → Barbe Rouge ; Brewferm - Columbus → Columbus ; Brewferm - Fuggles → Fuggle ; Brewferm - Hallertau Hersbrucker → Hersbrucker ; Brewferm - Hallertau Mittelfrüh → Hallertau Mittelfrüh ; Brewferm - Polaris → Polaris ; Brewferm - Smaragd → Smaragd ; Brewferm - Southern Dawn → Southern Dawn ; Brewferm - Southern Star → Southern Star ; Brewferm - Target → Target ; Brewferm - Tettnanger → Tettnanger ; Brewland Japan - Mosaic → Mosaic ; Brewland Japan - Motueka → Motueka ; Brewmaster - Amarillo → Amarillo ; Brewmaster - Czech Saaz → Saaz (CZ) ; Brewmaster - First Gold → First Gold ; Brewmaster - Mandarina Bavaria → Mandarina Bavaria ; Brewshop - Huell Melon → Huell Melon ; Brewshop - Jester → Jester ; Brewshpo - Ahtanum → Ahtanum ; Charles Faram - Admiral → Admiral ; Charles Faram - Agnus → Agnus ; Charles Faram - Ahtanum → Ahtanum ; Charles Faram - Amarillo → Amarillo ; Charles Faram - Amethyst → Amethyst ; Charles Faram - Apollo → Apollo ; Charles Faram - Aramis → Aramis ; Charles Faram - Archer → Archer ; Charles Faram - Atlas → Atlas ; Charles Faram - Aurora → Aurora ; Charles Faram - Azacca → Azacca ; Charles Faram - Barbe Rouge → Barbe Rouge ; Charles Faram - Beata → Beata ; Charles Faram - Belma → Belma ; Charles Faram - Boadicea → Boadicea ; Charles Faram - Bobek → Bobek ; Charles Faram - Bouclier → Bouclier ; Charles Faram - Brambling Cross → Bramling Cross ; Charles Faram - Bravo → Bravo ; Charles Faram - Bullion UK → Bullion ; Charles Faram - Bullion → Bullion ; Charles Faram - Calypso → Calypso ; Charles Faram - Cascade UK → Cascade ; Charles Faram - Cascade US → Cascade ; Charles Faram - Cashmere → Cashmere ; Charles Faram - Celeia → Celeia ; Charles Faram - Centennial → Centennial ; Charles Faram - Challenger → Challenger ; Charles Faram - Chelan → Chelan ; Charles Faram - Chinook → Chinook ; Charles Faram - Citra → Citra ; Charles Faram - Cluster → Cluster ; Charles Faram - Columbus → Columbus ; Charles Faram - Comet → Comet ; Charles Faram - Crystal → Crystal ; Charles Faram - Dana → Dana ; Charles Faram - Dr. Rudi → Dr. Rudi ; Charles Faram - East Kent Goldings → East Kent Goldings ; Charles Faram - Ekuanot → Ekuanot ; Charles Faram - El Dorado → El Dorado ; Charles Faram - Ella → Ella ; Charles Faram - Endeavour → Endeavour ; Charles Faram - Epic → Epic ; Charles Faram - Ernest → Ernest ; Charles Faram - Eureka! → Eureka ; Charles Faram - First Gold → First Gold ; Charles Faram - Flyer → Flyer ; Charles Faram - Fuggles → Fuggle ; Charles Faram - Fusion → Fusion ; Charles Faram - Galaxy → Galaxy ; Charles Faram - Galena → Galena ; Charles Faram - Glacier → Glacier ; Charles Faram - Godiva → Godiva ; Charles Faram - Green Bullet → Green Bullet ; Charles Faram - Hallertau Blanc → Hallertau Blanc ; Charles Faram - Harlequin → Harlequin ; Charles Faram - Harmonie → Harmonie ; Charles Faram - Herkules → Herkules ; Charles Faram - Hersbrucker → Hersbrucker ; Charles Faram - Huell Melon → Huell Melon ; Charles Faram - Idaho 7 → Idaho 7 ; Charles Faram - Jarrylo → Jarrylo ; Charles Faram - Jester → Jester ; Charles Faram - Junga → Junga ; Charles Faram - Kazbek → Kazbek ; Charles Faram - Kohatu → Kohatu ; Charles Faram - Krpan → Krpan ; Charles Faram - Lemondrop → Lemondrop ; Charles Faram - Liberty → Liberty ; Charles Faram - Lubelski → Lubelska ; Charles Faram - Mandarina Bavaria → Mandarina Bavaria ; Charles Faram - Marynka → Marynka ; Charles Faram - Millennium → Millennium ; Charles Faram - Minstrel → Minstrel ; Charles Faram - Mistral → Mistral ; Charles Faram - Mittelfruh → Hallertau Mittelfrüh ; Charles Faram - Mosaic → Mosaic ; Charles Faram - Most → Most ; Charles Faram - Motueka → Motueka ; Charles Faram - Mount Hood → Mount Hood ; Charles Faram - Moutere → Moutere ; Charles Faram - Mystic → Mystic ; Charles Faram - NZ Pacific Jade → Pacific Jade ; Charles Faram - NZ Southern Cross → Southern Cross ; Charles Faram - Nelson Sauvin → Nelson Sauvin ; Charles Faram - Newport → Newport ; Charles Faram - Northdown → Northdown ; Charles Faram - Nugget → Nugget ; Charles Faram - Olicana → Olicana ; Charles Faram - Opal → Opal ; Charles Faram - Pacific Gem → Pacific Gem ; Charles Faram - Pacifica → Pacifica ; Charles Faram - Palisade → Palisade ; Charles Faram - Pekko → Pekko ; Charles Faram - Phoenix → Phoenix ; Charles Faram - Pilgrim → Pilgrim ; Charles Faram - Pilot → Pilot ; Charles Faram - Pioneer → Pioneer ; Charles Faram - Polaris → Polaris ; Charles Faram - Premiant → Premiant ; Charles Faram - Pride of Ringwood → Pride of Ringwood ; Charles Faram - Progress → Progress ; Charles Faram - Pulawski → Pulawski ; Charles Faram - Rakau → Rakau ; Charles Faram - Santiam → Santiam ; Charles Faram - Saphir → Saphir ; Charles Faram - Savinjski Golding → Styrian Golding ; Charles Faram - Simcoe → Simcoe ; Charles Faram - Sladek → Sládek ; Charles Faram - Sonnet → Sonnet ; Charles Faram - Sorachi Ace → Sorachi Ace ; Charles Faram - Sovereign → Sovereign ; Charles Faram - Spalter Select → Spalter Select ; Charles Faram - Sterling → Sterling ; Charles Faram - Sticklebract → Sticklebract ; Charles Faram - Styrian Cardinal → Styrian Cardinal ; Charles Faram - Styrian Dragon → Styrian Dragon ; Charles Faram - Styrian Fox → Styrian Fox ; Charles Faram - Styrian Kolibri → Styrian Kolibri ; Charles Faram - Styrian Wolf → Styrian Wolf ; Charles Faram - Summit → Summit ; Charles Faram - Sybilla → Sybilla ; Charles Faram - Taiheke → Taiheke ; Charles Faram - Target → Target ; Charles Faram - Tettnang → Tettnang (US) ; Charles Faram - Topaz → Topaz ; Charles Faram - Tradition → Hallertau Tradition ; Charles Faram - Triskel → Triskel ; Charles Faram - Ultra → Ultra ; Charles Faram - Vanguard → Vanguard ; Charles Faram - Vital → Vital ; Charles Faram - WGV → Whitbread Golding Variety (WGV) ; Charles Faram - Wai-iti → Wai-iti ; Charles Faram - Waimea → Waimea ; Charles Faram - Wakatu → Wakatu ; Charles Faram - Warrior → Warrior ; Charles Faram - Willamette → Willamette ; Charles Faram - Zappa → Zappa ; Clearvalley Hops - Wild Turkey → Wild Turkey ; Crosby Hop Farm - Amarillo → Amarillo ; Crosby Hop Farm - Callista → Callista ; Crosby Hop Farm - Columbus → Columbus ; Crosby Hop Farm - Denali → Sultana (Denali) ; Crosby Hop Farm - El Dorado → El Dorado ; Crosby Hop Farm - Hallertau Blanc → Hallertau Blanc ; Crosby Hop Farm - Huell Melon → Huell Melon ; Crosby Hop Farm - Mandarina Bavaria → Mandarina Bavaria ; Crosby Hop Farm - Uk fuggle → Fuggle ; Crossmyloof - Amarillo → Amarillo ; Crossmyloof - Centennial → Centennial ; Crossmyloof - Citra → Citra ; Crossmyloof - Gamma Ray Twist → Gamma Ray Twist ; Crossmyloof - Mosaic → Mosaic ; Crossmyloof - Simcoe → Simcoe ; Crossmyloof - US Chinook → Chinook ; Fermentap - Cascade → Cascade ; Finest - Azacca → Azacca ; Finest - Bramling Cross → Bramling Cross ; Finest - Cascade → Cascade ; Finest - Hersbrucker → Hersbrucker ; Finest Co - Huli Melon → Huli Melon ; Finest Co. Brewing Suppliers - Hallertau Blanc → Hallertau Blanc ; Four Star Farms - Cascade → Cascade ; Four Star Farms - Centennial → Centennial ; Four Star Farms - Pepite → Pepite ; Fuggles → Fuggle ; Great Lakes Hops - Bergamot → Bergamot ; Great Lakes Hops - Emerald Spire → Emerald Spire ; Great Lakes Hops - Gemini → Gemini ; Great Lakes Hops - Hydra → Hydra ; Great Lakes Hops - Kirin II → Kirin II ; Great Lakes Hops - Mackinac → Mackinac ; Great Lakes Hops - Michigan Copper → Michigan Copper ; Great Lakes Hops - Paradigm → Paradigm ; HPA (Australia) - Enigma → Enigma ; Hallertau Hersbrucker → Hersbrucker ; Hallertau Tradition (Germany) → Hallertau Tradition ; Hallertauer - Hüll Melon → Huell Melon ; Hallowed Hops - Chinook → Chinook ; Hang'em High Hops - Bergamot → Bergamot ; Hang'em High Hops - Emerald Spire → Emerald Spire ; Hang'em High Hops - Gemini → Gemini ; Hang'em High Hops - Hydra → Hydra ; Hang'em High Hops - Mackinac → Mackinac ; Hang'em High Hops - Michigan Copper → Michigan Copper ; Hang'em High Hops - Paradigm → Paradigm ; Hill Top Hops - Cascade → Cascade ; Hill Top Hops - Newport → Newport ; HomebrewSupply.com - Warrior → Warrior ; Hop Head Farms - Zuper saazer → Zuper saazer ; Hop Products Australia - Cascade → Cascade ; Hop Products Australia - El Doredo → El Doredo ; Hop Union - Ahtanum → Ahtanum ; Hop Union - Amarillo → Amarillo ; Hop Union - Centennial → Centennial ; Hop Union - French Strisselspalt → Strisselspalt ; Hop Union - Fuggle → Fuggle ; Hop Union - German Opal → Opal ; Hop Union - German Saphir → Saphir ; Hop Union - German Spalt → Spalt ; Hop Union - German hallertau → Hallertau (US) ; Hop Union - German select → German select ; Hop Union - Liberty → Liberty ; Hop Union - Nugget → Nugget ; Hop Union - Palisade → Palisade ; Hop Union - Quebec Golding → Quebec Golding ; Hop Union - Simcoe → Simcoe ; Hop Union - Sorachi Ace → Sorachi Ace ; Hop Union - Stella → Stella ; Hop Union - Topaz → Topaz ; Hop Union - UK Fuggle → Fuggle ; Hop Union - US Hallertau → Hallertau (US) ; Hop Union - US Saaz → Saaz (US) ; Hop Union - US fuggle → Fuggle ; Hops Direct - AMARILLO® VGXP01 C.V. → Amarillo ; Hops Direct - Amarillo → Amarillo ; Hops Direct - Belma → Belma ; Hops Direct - Cascade → Cascade ; Hops Direct - Cashmere → Cashmere ; Hops Direct - Centennial → Centennial ; Hops Direct - Chinook → Chinook ; Hops Direct - Citra → Citra ; Hops Direct - Cluster → Cluster ; Hops Direct - Columbus → Columbus ; Hops Direct - Crystal → Crystal ; Hops Direct - Czech haaz → Czech haaz ; Hops Direct - El Dorado → El Dorado ; Hops Direct - Fuggles US → Fuggle ; Hops Direct - Galena → Galena ; Hops Direct - Golding US → Golding ; Hops Direct - Idaho 7 → Idaho 7 ; Hops Direct - Idaho Gem → Idaho Gem ; Hops Direct - Legacy → Legacy ; Hops Direct - LemonDrop → Lemondrop ; Hops Direct - Mandarina Bavaria → Mandarina Bavaria ; Hops Direct - Mosaic → Mosaic ; Hops Direct - Pekko → Pekko ; Hops Direct - Simcoe → Simcoe ; Hops Direct - Sorachi Ace → Sorachi Ace ; Hops Direct - Sultana → Sultana (Denali) ; Hops Direct - Tettnanger US → Tettnanger ; Hops Direct - UK FUGGLE → Fuggle ; Hops Direct - US Magnum → Magnum (US) ; Hops Direct - Willamette → Willamette ; Hopsi - Ahtanum USA - Hopsi 2018 → Hopsi 2018 ; Hopsi - Amarillo USA - Hopsi 2018 → Hopsi 2018 ; Hopsi - Centennial USA - Hopsi 2018 → Hopsi 2018 ; Hopsi - Citra USA - Hopsi 2018 → Hopsi 2018 ; Hopsi - Hallertau Blanc D - Hopsi 2018 → Hopsi 2018 ; Hopsi - Styrian Aurora Slo - Hopsi 2018 → Hopsi 2018 ; Hopsi - Styrian Bobek Slo - Hopsi 2018 → Hopsi 2018 ; Hopsi - Styrian Dana Slo - Hopsi 2018 → Hopsi 2018 ; Hopsi - Styrian Wolf Slo - Hopsi 2018 → Hopsi 2018 ; Hopsi - Styrian Wolf → Styrian Wolf ; Hopsteiner - Admiral → Admiral ; Hopsteiner - Akoya → Akoya ; Hopsteiner - Altus → Altus ; Hopsteiner - Amarillo → Amarillo ; Hopsteiner - Apollo → Apollo ; Hopsteiner - Aramis → Aramis ; Hopsteiner - Ariana → Ariana ; Hopsteiner - Aurora → Aurora ; Hopsteiner - BOADICEA → Boadicea ; Hopsteiner - Bitter Gold → Bitter Gold ; Hopsteiner - Bobek → Bobek ; Hopsteiner - Brambling Cross → Bramling Cross ; Hopsteiner - Bravo → Bravo ; Hopsteiner - CALYPSO → Calypso ; Hopsteiner - Callista → Callista ; Hopsteiner - Cascade → Cascade ; Hopsteiner - Cashmere → Cashmere ; Hopsteiner - Centennial → Centennial ; Hopsteiner - Challenger → Challenger ; Hopsteiner - Chinook → Chinook ; Hopsteiner - Cluster → Cluster ; Hopsteiner - Columbus/Tomahawk → Columbus ; Hopsteiner - Comet → Comet ; Hopsteiner - Contessa → Contessa ; Hopsteiner - Crystal → Crystal ; Hopsteiner - Delta → Delta ; Hopsteiner - Diamant → Diamant ; Hopsteiner - El Dorado → El Dorado ; Hopsteiner - Eureka → Eureka ; Hopsteiner - First Gold → First Gold ; Hopsteiner - Fuggle → Fuggle ; Hopsteiner - Galena → Galena ; Hopsteiner - Golding (UK) → Golding ; Hopsteiner - HERSBRUCKER → Hersbrucker ; Hopsteiner - HS17701 → HS17701 ; Hopsteiner - Hallertau Herkules → Herkules ; Hopsteiner - Hallertauer Blanc → Hallertau Blanc ; Hopsteiner - Hallertauer Magnum → Magnum (GR) ; Hopsteiner - Hallertauer Merkur → Merkur ; Hopsteiner - Hallertauer Mittelfrueh → Hallertau Mittelfrüh ; Hopsteiner - Hallertauer Taurus → Hallertau Taurus ; Hopsteiner - Hallertauer Tradition → Hallertau Tradition ; Hopsteiner - Helios → Helios ; Hopsteiner - Horizon → Horizon ; Hopsteiner - Huell Melon → Huell Melon ; Hopsteiner - LUBELSKI (LUBLIN) → Lubelska ; Hopsteiner - Lemondrop → Lemondrop ; Hopsteiner - Liberty → Liberty ; Hopsteiner - Lotus → Lotus ; Hopsteiner - MARYNKA → Marynka ; Hopsteiner - MOTUEKA → Motueka ; Hopsteiner - Mandarina Bavaria → Mandarina Bavaria ; Hopsteiner - Melba → Melba ; Hopsteiner - Mt Hood → Mount Hood ; Hopsteiner - Mt Ranier → Mount Rainier ; Hopsteiner - NELSON SAUVIN → Nelson Sauvin ; Hopsteiner - Northdown → Northdown ; Hopsteiner - Nugget → Nugget ; Hopsteiner - Opal → Opal ; Hopsteiner - PREMIANT → Premiant ; Hopsteiner - Pilgrim → Pilgrim ; Hopsteiner - Polaris → Polaris ; Hopsteiner - Pride of Ringwood → Pride of Ringwood ; Hopsteiner - Progress → Progress ; Hopsteiner - Riwaka → Riwaka ; Hopsteiner - SLÁDEK → Sládek ; Hopsteiner - SMARAGD → Smaragd ; Hopsteiner - Saazer → Saaz (CZ) ; Hopsteiner - Salvo → Salvo ; Hopsteiner - Saphir → Saphir ; Hopsteiner - Solero → Solero ; Hopsteiner - Sorachi Ace → Sorachi Ace ; Hopsteiner - Spalter Select → Spalter Select ; Hopsteiner - Spalter → Spalt ; Hopsteiner - Sterling → Sterling ; Hopsteiner - Strisselspalter → Strisselspalt ; Hopsteiner - Styrian Golding → Styrian Golding ; Hopsteiner - Sultana → Sultana (Denali) ; Hopsteiner - Summit → Summit ; Hopsteiner - Super Galena → Super Galena ; Hopsteiner - Tahoma → Tahoma ; Hopsteiner - Target → Target ; Hopsteiner - Tettnanger → Tettnanger ; Hopsteiner - Titan → Titan ; Hopsteiner - Trident → Trident ; Hopsteiner - Triskel → Triskel ; Hopsteiner - Vanguard → Vanguard ; Hopsteiner - Whitbread Golding → Whitbread Golding Variety (WGV) ; Hopsteiner - Willamette → Willamette ; Hopsteiner - X06297 → X06297 ; Hopsteiner - X07270 → X07270 ; Hopsteiner - X10416 → X10416 ; Hopsteiner - Zeus → Zeus ; Hoptimus Rex - German Hersbrucker → Hersbrucker ; Hoptimus Rex - Herkules (DE) → Herkules ; Hoptimus Rex - Progress UK → Progress ; Kent Goldings → East Kent Goldings ; LD Carlson - Amarillo → Amarillo ; LD Carlson - Centennial → Centennial ; LD Carlson - Challenger → Challenger ; LD Carlson - Crystal → Crystal ; LD Carlson - El Dorado → El Dorado ; LD Carlson - Fuggle → Fuggle ; LD Carlson - GERMAN HALLERTAU MITTELFRUH → Hallertau Mittelfrüh ; LD Carlson - Galaxy → Galaxy ; LD Carlson - German Hallertau Blanc → Hallertau Blanc ; LD Carlson - German Magnum → Magnum (GR) ; LD Carlson - German Mandarina Bavaria → Mandarina Bavaria ; LD Carlson - Lemondrop → Lemondrop ; LD Carlson - Loral → Loral ; LD Carlson - Nugget → Nugget ; LD Carlson - Warrior → Warrior ; LD Carlson - Willamette → Willamette ; LD Carlson - galena → Galena ; Lone Mountain Farms - Mount Hood → Mount Hood ; Lublin → Lubelska ; Malt Miller - Celeia → Celeia ; Malt Miller - Citra → Citra ; Malt Miller - Fusion → Fusion ; Malt Miller - Lemondrop → Lemondrop ; Malt Miller - Minstrel → Minstrel ; Malt Miller - Willamette → Willamette ; Michigan Hop Alliance - Enigma → Enigma ; Michigan Hop Alliance - Kazbek → Kazbek ; Michigan Hop Alliance - Kohatu → Kohatu ; Michigan Hop Alliance - Motueka → Motueka ; Michigan Hop Alliance - Nelson Sauvin → Nelson Sauvin ; Michigan Hop Alliance - Rakau → Rakau ; Michigan Hop Alliance - Riwaka → Riwaka ; Michigan Hop Alliance - Sultana → Sultana (Denali) ; Michigan Hop Alliance - Wakatu → Wakatu ; Mighty Axe - Julius → Julius ; Mighty Axe - Tropica → Tropica ; Morebeer - Idaho 7 → Idaho 7 ; Mr Malt - Spalt Spalter → Spalt ; NZ Hops - Nectaron → Nectaron ; NZ Hops - Superdelic → Superdelic ; Northern Brewer - Amarillo → Amarillo ; Northern Brewer - Australian Galaxy → Galaxy ; Northern Brewer - Azacca → Azacca ; Northern Brewer - Cascade → Cascade ; Northern Brewer - Centennial → Centennial ; Northern Brewer - Chinook → Chinook ; Northern Brewer - Citra → Citra ; Northern Brewer - Cluster → Cluster ; Northern Brewer - Crystal → Crystal ; Northern Brewer - Czech Saaz → Saaz (CZ) ; Northern Brewer - Denali → Sultana (Denali) ; Northern Brewer - El Dorado → El Dorado ; Northern Brewer - Fuggle → Fuggle ; Northern Brewer - Galaxy (AU) → Galaxy ; Northern Brewer - German Hallertau → Hallertau (US) ; Northern Brewer - German Magnum → Magnum (GR) ; Northern Brewer - German Mandarina → German Mandarina ; Northern Brewer - German Northern Brewer → Northern Brewer (GR) ; Northern Brewer - German Tettnang → Tettnang (US) ; Northern Brewer - Glacier → Glacier ; Northern Brewer - Hallertau (DE) → Hallertau (US) ; Northern Brewer - Hallertau → Hallertau (US) ; Northern Brewer - Hersbrucker → Hersbrucker ; Northern Brewer - Horizon → Horizon ; Northern Brewer - Idaho 7 → Idaho 7 ; Northern Brewer - Idaho Gem → Idaho Gem ; Northern Brewer - Kent Goldings (UK) → East Kent Goldings ; Northern Brewer - Magnum (DE) → Magnum (GR) ; Northern Brewer - Mighty Axe Julius → Mighty Axe Julius ; Northern Brewer - Mighty Axe Tropica → Mighty Axe Tropica ; Northern Brewer - Mosaic → Mosaic ; Northern Brewer - Northern Brewer (US) → Northern Brewer (US) ; Northern Brewer - Nugget → Nugget ; Northern Brewer - Saaz (CZ) → Saaz (CZ) ; Northern Brewer - Southern Promise → Southern Promise ; Northern Brewer - Strisselspalt → Strisselspalt ; Northern Brewer - Styrian Golding → Styrian Golding ; Northern Brewer - Target → Target ; Northern Brewer - Tettnanger (DE) → Tettnanger ; Northern Brewer - UK Fuggle → Fuggle ; Northern Brewer - UK Kent Goldings → East Kent Goldings ; Northern Brewer - US Brewer Gold → Brewer's Gold (US) ; Northern Brewer - Williamette → Willamette ; Northern Brewer - Zappa → Zappa ; Northern Brewer Premium - Simcoe → Simcoe ; Simply Hops - Chinook → Chinook ; Simply Hops - Citra → Citra ; Simply Hops - Geterbrewed → Geterbrewed ; Simply Hops - Mosaic → Mosaic ; Simply Hops - Summit → Summit ; Simply Hops - Vic Secret → Vic Secret ; Spalter Select (Germany) → Spalter Select ; Styrian Goldings → Styrian Golding ; Tavistock - Heritage → Heritage ; Tenacious Badger - Cascade → Cascade ; Tenacious Badger - Mackinac → Mackinac ; Tenacious Badger - Mt. Hood → Mount Hood ; Tenacious Badger - Willamette → Willamette ; The Homebrew Company - Challenger → Challenger ; The Homebrew Company - Fuggles → Fuggle ; The Homebrew Company - Styrian Goldings → Styrian Golding ; The Homebrew Company - Williamette → Willamette ; Tyskland - Polaris → Polaris ; Virgil Gamache Farms Inc - Amarillo → Amarillo ; Whitbread Golding → Whitbread Golding Variety (WGV) ; YCR - Pahto → Pahto ; Yakima Chief Hops - Amarillo → Amarillo ; Yakima Chief Hops - Cascade → Cascade ; Yakima Chief Hops - Celeia → Celeia ; Yakima Chief Hops - Centennial → Centennial ; Yakima Chief Hops - Chinook → Chinook ; Yakima Chief Hops - Citra → Citra ; Yakima Chief Hops - Cluster Fugget → Cluster fugget ; Yakima Chief Hops - Cluster → Cluster ; Yakima Chief Hops - Columbus → Columbus ; Yakima Chief Hops - Comet → Comet ; Yakima Chief Hops - Crystal → Crystal ; Yakima Chief Hops - East Kent Golding → East Kent Goldings ; Yakima Chief Hops - East Kent Goldings → East Kent Goldings ; Yakima Chief Hops - Ekuanot → Ekuanot ; Yakima Chief Hops - El Dorado → El Dorado ; Yakima Chief Hops - Falconer's Flight → Falconer's Flight ; Yakima Chief Hops - Fuggle UK → Fuggle ; Yakima Chief Hops - German Blanc → German Blanc ; Yakima Chief Hops - German Hallertau → Hallertau (US) ; Yakima Chief Hops - German Magnum → Magnum (GR) ; Yakima Chief Hops - German Northern Brewer → Northern Brewer (GR) ; Yakima Chief Hops - German Tettnang → Tettnang (US) ; Yakima Chief Hops - Hallertau → Hallertau (US) ; Yakima Chief Hops - Hallertauer Magnum → Magnum (GR) ; Yakima Chief Hops - Hersbrucker → Hersbrucker ; Yakima Chief Hops - Idaho 7 → Idaho 7 ; Yakima Chief Hops - Loral → Loral ; Yakima Chief Hops - MT Hood → Mount Hood ; Yakima Chief Hops - Mosaic → Mosaic ; Yakima Chief Hops - NZ Southern Cross → Southern Cross ; Yakima Chief Hops - NZ Tahieke → NZ Tahieke ; Yakima Chief Hops - Nectaron → Nectaron ; Yakima Chief Hops - Nugget → Nugget ; Yakima Chief Hops - Palisade → Palisade ; Yakima Chief Hops - Saaz CZ → Saaz (CZ) ; Yakima Chief Hops - Simcoe → Simcoe ; Yakima Chief Hops - Sorachi Ace → Sorachi Ace ; Yakima Chief Hops - Summer → Summer ; Yakima Chief Hops - Topaz → Topaz ; Yakima Chief Hops - Tradition → Hallertau Tradition ; Yakima Chief Hops - UK East Kent Golding → East Kent Goldings ; Yakima Chief Hops - UK Fuggle → Fuggle ; Yakima Chief Hops - US Golding → Golding ; Yakima Chief Hops - Willamette → Willamette ; Yakima Valley Hops - AU Ella → Ella ; Yakima Valley Hops - AU Enigma → Enigma ; Yakima Valley Hops - AU Galaxy → Galaxy ; Yakima Valley Hops - AU Vic Secret → Vic Secret ; Yakima Valley Hops - Adeena → Adeena ; Yakima Valley Hops - African Queen → African Queen ; Yakima Valley Hops - Amarillo → Amarillo ; Yakima Valley Hops - Azacca → Azacca ; Yakima Valley Hops - BRU-1 → BRU-1 ; Yakima Valley Hops - Barbe Rouge → Barbe Rouge ; Yakima Valley Hops - Bravo → Bravo ; Yakima Valley Hops - CTZ → CTZ ; Yakima Valley Hops - CZ Kazbek → Kazbek ; Yakima Valley Hops - CZ Saaz → Saaz (CZ) ; Yakima Valley Hops - Callista → Callista ; Yakima Valley Hops - Cascade → Cascade ; Yakima Valley Hops - Cashmere → Cashmere ; Yakima Valley Hops - Centennial → Centennial ; Yakima Valley Hops - Chinook → Chinook ; Yakima Valley Hops - Citra → Citra ; Yakima Valley Hops - Columbus → Columbus ; Yakima Valley Hops - Comet → Comet ; Yakima Valley Hops - Crystal → Crystal ; Yakima Valley Hops - DE Hersbrucker → Hersbrucker ; Yakima Valley Hops - Denali → Sultana (Denali) ; Yakima Valley Hops - Dolcita → Dolcita ; Yakima Valley Hops - East Kent Golding → East Kent Goldings ; Yakima Valley Hops - Eclipse → Eclipse ; Yakima Valley Hops - Ekuanot → Ekuanot ; Yakima Valley Hops - El Dorado → El Dorado ; Yakima Valley Hops - Elani → Elani ; Yakima Valley Hops - Ella → Ella ; Yakima Valley Hops - Experimental Grapefruit → Experimental Grapefruit ; Yakima Valley Hops - Experimental Lemonaughty → Experimental Lemonaughty ; Yakima Valley Hops - Experimental Tangerine → Experimental Tangerine ; Yakima Valley Hops - FR Fuggle → Fuggle ; Yakima Valley Hops - FR Minstral → FR Minstral ; Yakima Valley Hops - FR Strisselspalt → Strisselspalt ; Yakima Valley Hops - Fuggle → Fuggle ; Yakima Valley Hops - Fuggles → Fuggle ; Yakima Valley Hops - GR Calista → Callista ; Yakima Valley Hops - GR Hersbrucker → Hersbrucker ; Yakima Valley Hops - GR Magnum → Magnum (GR) ; Yakima Valley Hops - GR Mandarina Bavaria → Mandarina Bavaria ; Yakima Valley Hops - GR Monroe → Monroe ; Yakima Valley Hops - GR Perle → Perle (GR) ; Yakima Valley Hops - GR Saphir → Saphir ; Yakima Valley Hops - GR Tettnanger → Tettnanger ; Yakima Valley Hops - Galaxy → Galaxy ; Yakima Valley Hops - Glacier → Glacier ; Yakima Valley Hops - HBC 1019 → Dolcita ; Yakima Valley Hops - HBC 472 → HBC 472 ; Yakima Valley Hops - HBC 586 → Krush ; Yakima Valley Hops - HBC 630 → HBC 630 ; Yakima Valley Hops - HBC-630 → HBC 630 ; Yakima Valley Hops - Hallertau (Mittelfruh) → Hallertau (US) ; Yakima Valley Hops - Hallertau Blanc → Hallertau Blanc ; Yakima Valley Hops - Hüll Melon → Huell Melon ; Yakima Valley Hops - Idaho 7 → Idaho 7 ; Yakima Valley Hops - Idaho Gem → Idaho Gem ; Yakima Valley Hops - Jarrylo → Jarrylo ; Yakima Valley Hops - Liberty → Liberty ; Yakima Valley Hops - Loral → Loral ; Yakima Valley Hops - Mandarina Bavaria → Mandarina Bavaria ; Yakima Valley Hops - Medusa → Medusa ; Yakima Valley Hops - Mosaic → Mosaic ; Yakima Valley Hops - Mt Hood → Mount Hood ; Yakima Valley Hops - NZ Kohatu → Kohatu ; Yakima Valley Hops - NZ Motueka → Motueka ; Yakima Valley Hops - NZ Moutere → Moutere ; Yakima Valley Hops - NZ Nectaron → Nectaron ; Yakima Valley Hops - NZ Nelson Sauvin → Nelson Sauvin ; Yakima Valley Hops - NZ Rakau → Rakau ; Yakima Valley Hops - NZ Waimea → Waimea ; Yakima Valley Hops - Nectaron → Nectaron ; Yakima Valley Hops - Nugget → Nugget ; Yakima Valley Hops - Pekko → Pekko ; Yakima Valley Hops - Riwaka → Riwaka ; Yakima Valley Hops - SL Styrian Goldings → SL Styrian Goldings ; Yakima Valley Hops - Sabro → Sabro ; Yakima Valley Hops - Simcoe → Simcoe ; Yakima Valley Hops - Sonnet → Sonnet ; Yakima Valley Hops - Sorachi Ace → Sorachi Ace ; Yakima Valley Hops - Southern Aroma → Southern Aroma ; Yakima Valley Hops - Southern Cross → Southern Cross ; Yakima Valley Hops - Southern Passion → Southern Passion ; Yakima Valley Hops - Southern Promise → Southern Promise ; Yakima Valley Hops - Southern Star → Southern Star ; Yakima Valley Hops - Spalt Select → Spalter Select ; Yakima Valley Hops - Sterling → Sterling ; Yakima Valley Hops - Strata → Strata ; Yakima Valley Hops - Strisselspalt → Strisselspalt ; Yakima Valley Hops - Summit → Summit ; Yakima Valley Hops - Tahoma → Tahoma ; Yakima Valley Hops - Talus → Talus ; Yakima Valley Hops - UK Challenger → Challenger ; Yakima Valley Hops - US Golding → Golding ; Yakima Valley Hops - Vic Secret → Vic Secret ; Yakima Valley Hops - Wakatu → Wakatu ; Yakima Valley Hops - Warrior → Warrior ; Yakima Valley Hops - Willamette → Willamette ; Yakima Valley Hops - Zappa → Zappa ; Yakima Valley Hops - simco → simco ; abstrax - Quantum Nectaron → Quantum Nectaron ; abstrax quantum hops - Nelson → Nelson Sauvin ; bay wa ag - tettnanger → Tettnanger ; beer secret - East Kent Golding → East Kent Goldings ; beerex - Citra → Citra ; beerex - Idaho 7 → Idaho 7 ; beerex - Mosaic → Mosaic ; brelex - Citra → Citra ; brelex - Eureka → Eureka ; brelex - Riwaka → Riwaka ; brewmart - Fuggles → Fuggle ; central valley hops - Cashmere → Cashmere ; champlain valley hops - Willamette → Willamette ; charles farm - El Dorado → El Dorado ; duke25hops - Bergamot → Bergamot ; duke25hops - Mackinac → Mackinac ; eggers hops - Nelson → Nelson Sauvin ; glacier hops ranch - Ahhhroma → Ahhhroma ; homebrewstuff - El Dorado → El Dorado ; hop alliance - Lotus → Lotus ; hop alliance - NewZilla → NewZilla ; hop alliance - Sticky Fingers → Sticky Fingers ; hop store - Cascade → Cascade ; houblon des jarrets noirs - HJN IPA22 → HJN IPA22 ; houblons des jarrets noirs - Rakau → Rakau ; hpa - Enigma → Enigma ; kegland - Citra → Citra ; laguilhoat - Amarillo → Amarillo ; laguilhoat - Cascade → Cascade ; laguilhoat - Citra → Citra ; laguilhoat - Fuggles → Fuggle ; laguilhoat - Nugget → Nugget ; morgan's - hallertau → Hallertau (US) ; morgan's - tettnanger → Tettnanger ; northwest hop farms - BC Cascade → Cascade ; nz hops - Nelson Sauvin → Nelson Sauvin ; nzhops - Motueka → Motueka ; nzhops - NZ Pacific Jade → Pacific Jade ; nzhops - NZ Southern Cross → Southern Cross ; nzhops - Nelson Sauvin → Nelson Sauvin ; nzhops - Taiheke → Taiheke ; sabro - HBC-438 → HBC-438 ; schweddy bohemian - Cluster → Cluster ; the malt miller - Aged Hops → Aged Hops
- **britishhops** (2) : Cascade (UK) → Cascade ; WGV → Whitbread Golding Variety (WGV)
- **bsg** (6) : Magnum → Magnum (GR) ; Northern Brewer → Northern Brewer (GR) ; Perle → Perle (GR) ; Saaz → Saaz (CZ) ; Styrian Golding Celeia → Styrian Golding ; Tettnang → Tettnang (US)
- **charlesfaram** (12) : Cascade UK → Cascade ; Fox → Styrian Fox ; Lubelski → Lubelska ; Mittelfruh → Hallertau Mittelfrüh ; NZ Pacific Jade → Pacific Jade ; NZ Southern Cross → Southern Cross ; Pink (ID-158) → Pink ; Savinjski Golding → Styrian Golding ; Sultana → Sultana (Denali) ; Tettnang → Tettnang (US) ; Tradition → Hallertau Tradition ; WGV → Whitbread Golding Variety (WGV)
- **crosbyhops** (48) : AU Enigma → Enigma ; Amarillo VGXP01 c.v. → Amarillo ; Azacca (ADHA-483) → Azacca ; CZ Saaz → Saaz (CZ) ; Citra HBC 394 → Citra ; Comet - Estate Grown → Comet ; Czech Saaz → Saaz (CZ) ; Dolcita HBC 1019 c.v. → Dolcita ; Elani YQH-1320 → Elani ; FR Barbe Rouge → Barbe Rouge ; GR Ariana → Ariana ; GR Callista → Callista ; GR Hallertau Blanc → Hallertau Blanc ; GR Hallertau Mittelfrüh → Hallertau Mittelfrüh ; GR Hersbrucker → Hersbrucker ; GR Hüll Melon → Huell Melon ; GR Magnum → Magnum (GR) ; GR Mandarina Bavaria → Mandarina Bavaria ; GR Northern Brewer → Northern Brewer (GR) ; GR Perle → Perle (GR) ; GR Saphir → Saphir ; GR Tettnanger → Tettnanger ; GR Tradition → Hallertau Tradition ; Hop Revolution Kohatu → Kohatu ; Hop Revolution Motueka → Motueka ; Hop Revolution Moutere → Moutere ; Hop Revolution Nelson Sauvin → Nelson Sauvin ; Hop Revolution Pacific Sunrise → Pacific Sunrise ; Hop Revolution Riwaka → Riwaka ; Hop Revolution Turkey's Pick → Turkey's Pick ; Hop Revolution Wai-Iti → Wai-iti ; Hüll Melon → Huell Melon ; Krush HBC 586 → Krush ; Mosaic HBC 369 → Mosaic ; Mt. Hood → Mount Hood ; NZ Cascade → Cascade ; NZ Pacific Jade → Pacific Jade ; NZ Rakau → Rakau ; NZ Southern Cross → Southern Cross ; NZ Waimea → Waimea ; NZ Wakatu → Wakatu ; Organic El Dorado → El Dorado ; SI Styrian Golding Celeia → Styrian Golding ; Simcoe YCR 14 → Simcoe ; Spalt Select → Spalter Select ; Strata, an Indie Hops variety → Strata ; UK Golding → Golding ; US Saaz → Saaz (US)
- **hopdatabase** (41) : Columbus / tomahawk → Columbus ; East kent golding → East Kent Goldings ; Falconers flight 7cs → Falconer's Flight 7CS ; Falconers flight → Falconer's Flight ; Hallertauer magnum → Magnum (GR) ; Hallertauer merkur → Merkur ; Hallertauer mittelfrüh → Hallertau Mittelfrüh ; Hallertauer taurus → Hallertau Taurus ; Hallertauer tradition → Hallertau Tradition ; Hbc 1019 c.v. → Dolcita ; Hbc 682 c.v. → Terraflux ; Hbc 682 → Pahto ; Hersbrucker spät → Hersbrucker ; Hüll melon → Huell Melon ; Lubelski → Lubelska ; Lublin → Lubelska ; Magnum → Magnum (GR) ; Motueka - machops → machops ; Mt. hood → Mount Hood ; Mt. rainier → Mount Rainier ; Nelson sauvin - machops → machops ; Northern brewer → Northern Brewer (GR) ; Pacifica - machops → machops ; Perle → Perle (GR) ; Rakau - machops → machops ; Saaz → Saaz (CZ) ; Saazer → Saaz (CZ) ; Savinjski golding → Styrian Golding ; Spalt spalter → Spalt ; Spalter → Spalt ; Strisselspalter → Strisselspalt ; Styrian savinjski golding → Styrian Golding ; Sultana → Sultana (Denali) ; Superdelic , hops → Superdelic ; Sussex hop → Sussex ; Tettnang tettnanger → Tettnanger ; Tradition → Hallertau Tradition ; Us saaz → Saaz (US) ; Wakatu - machops → machops ; Whitbread golding → Whitbread Golding Variety (WGV) ; Whitbread goldings variety → Whitbread Golding Variety (WGV)
- **hopsdirect** (8) : Citra Hbc 394 → Citra ; Fuggles Us → Fuggle ; Golding Us → Golding ; Hallertau Mittelfruh Us → Hallertau Mittelfrüh ; Hallertau Tradition Gr → Hallertau Tradition ; Mt. Hood → Mount Hood ; Pink (Id-158) → Pink ; Tettnanger Us → Tettnanger
- **hopsjson** (65) : Admiral (UK) → Admiral ; African Queen (RSA) → African Queen ; Aurora (SI) → Aurora ; BOR (CZ) → Bor ; Bobek (SI) → Bobek ; Bramling Cross (UK) → Bramling Cross ; Brewer's Gold (DE) → Brewer's Gold (GR) ; Cascade (NZ) → Cascade ; Celeia (SI) → Celeia ; Challenger (UK) → Challenger ; Dr. Rudi (NZ) → Dr. Rudi ; East Kent Golding (UK) → East Kent Goldings ; Ella (AU) → Ella ; Enigma (AU) → Enigma ; First Gold (UK) → First Gold ; Fuggle (UK) → Fuggle ; Fuggle (US) → Fuggle ; Galaxy (AU) → Galaxy ; Gimmli (DE) → Gimmli ; Golding (SI) → Golding ; Golding (US) → Golding ; Green Bullet (NZ) → Green Bullet ; HBC 291 → Loral ; Hallertau Mittelfrüh (DE) → Hallertau Mittelfrüh ; Herkules (DE) → Herkules ; Hersbrucker (DE) → Hersbrucker ; Lublin (PL) → Lubelska ; Magnum (DE) → Magnum (GR) ; Mandarina Bavaria (DE) → Mandarina Bavaria ; Mapuche (AR) → Mapuche ; Melba (AU) → Melba ; Merkur (DE) → Merkur ; Motueka (NZ) → Motueka ; Mt. Hood → Mount Hood ; Mt. Rainier → Mount Rainier ; Nelson Sauvin (NZ) → Nelson Sauvin ; Northdown (UK) → Northdown ; Northern Brewer (DE) → Northern Brewer (GR) ; Opal (DE) → Opal ; Pacific Gem (NZ) → Pacific Gem ; Pacifica (NZ) → Pacifica ; Perle (DE) → Perle (GR) ; Phoenix (UK) → Phoenix ; Pilgrim (UK) → Pilgrim ; Pioneer (UK) → Pioneer ; Premiant (CZ) → Premiant ; Pride of Ringwood (AU) → Pride of Ringwood ; Progress (UK) → Progress ; Rakau (NZ) → Rakau ; Riwaka (NZ) → Riwaka ; Saphir (DE) → Saphir ; Sladek (CZ) → Sládek ; Smaragd (DE) → Smaragd ; Spalt (DE) → Spalt ; Spalter Select (DE) → Spalter Select ; Strisselspalt (FR) → Strisselspalt ; Target (UK) → Target ; Taurus (DE) → Hallertau Taurus ; Tettnang (DE) → Tettnang (US) ; Topaz (AU) → Topaz ; Tradition (DE) → Hallertau Tradition ; Vic Secret (AU) → Vic Secret ; Waimea (NZ) → Waimea ; Wakatu (NZ) → Wakatu ; Whitbread Golding Variety (UK) → Whitbread Golding Variety (WGV)
- **hopslist** (26) : Amarillo VGXP01 → Amarillo ; Cascade (Argentina) → Cascade ; Cascade (Australia) → Cascade ; Cascade (New Zealand) → Cascade ; Cascade (US) → Cascade ; Cluster (AUS) → Cluster ; Cluster (US) → Cluster ; East Kent Golding → East Kent Goldings ; Equinox → Ekuanot ; Feux-Coeur → Feux-Coeur Francais ; Fuggle (US) → Fuggle ; Golding (BC) → Golding ; Golding (US) → Golding ; Hallertau (NZ) → Hallertau (US) ; Hallertau → Hallertau (US) ; Hallertauer Gold → Hallertau Gold ; Hallertauer Taurus → Hallertau Taurus ; Hallertauer Tradition → Hallertau Tradition ; Hüll Melon → Huell Melon ; Magnum → Magnum (GR) ; Perle → Perle (GR) ; Saaz → Saaz (CZ) ; Tettnanger (Swiss) → Tettnanger ; Tettnanger (US) → Tettnang (US) ; Whitbread Golding → Whitbread Golding Variety (WGV) ; Willamette (AUS) → Willamette
- **hopsteiner** (18) : Columbus/ Tomahawk → Columbus ; Golding (UK) → Golding ; Hallertauer Magnum → Magnum (GR) ; Hallertauer Merkur → Merkur ; Hallertauer Mittelfrüh → Hallertau Mittelfrüh ; Hallertauer Taurus → Hallertau Taurus ; Hallertauer Tradition → Hallertau Tradition ; Hersbrucker Spät → Hersbrucker ; Hüll Melon → Huell Melon ; Lubelski (Lublin) → Lubelska ; MT. Rainier → Mount Rainier ; Saazer → Saaz (CZ) ; Spalter → Spalt ; Strisselspalter → Strisselspalt ; Styrian Golding (Celeia) → Styrian Golding ; Styrian Savinjski Golding → Styrian Golding ; Sultana → Sultana (Denali) ; Whitbread Golding → Whitbread Golding Variety (WGV)
- **hpa** (9) : East Kent Golding → East Kent Goldings ; Fuggles → Fuggle ; Hallertauer Magnum → Magnum (GR) ; Hallertauer Mittelfruher → Hallertau Mittelfrüh ; Hallertauer Tradition → Hallertau Tradition ; Idaho7 → Idaho 7 ; Saazer → Saaz (CZ) ; Spalt Spalter → Spalt ; Tettnang Tettnanger → Tettnanger
- **indiehops** (3) : Mt. Hood → Mount Hood ; US Fuggle → Fuggle ; US Tettnanger → Tettnang (US)
- **johnihaas** (9) : Columbus (CTZ) → Columbus ; HBC 638 c.v. → Hbc 638 ; Hallertauer Magnum → Magnum (GR) ; Hallertauer Tradition → Hallertau Tradition ; Hüll Melon → Huell Melon ; Krush HBC 586 c.v. → Krush ; TerraFlux HBC 682 c.v. → Terraflux ; TerraSurge HBC 1325 c.v. → Terrasurge ; Zeus (CTZ) → Zeus
- **nzhops** (4) : NZ Chinook → Chinook ; NZ Fuggle → Fuggle ; NZ Pacific Jade → Pacific Jade ; NZ Southern Cross → Southern Cross
- **usahops** (10) : Azacca, ADHA-483 → Azacca ; Denali → Sultana (Denali) ; Ekuanot Brand HBC 366 → Ekuanot ; Mt. Hood → Mount Hood ; Mt. Rainier → Mount Rainier ; Pekko, ADHA-871 → Pekko ; Spalter → Spalt ; Strissel Spalt → Strisselspalt ; Talus HBC 692 → Talus ; Triple Pearl → TriplePearl
- **yakimavalleyhops** (16) : Calista → Callista ; East Kent Golding → East Kent Goldings ; French Fuggle → Fuggle ; Hort 9909 → HORT9909 ; Hull Melon → Huell Melon ; Lubelski → Lubelska ; Mt Hood → Mount Hood ; Spalt Select → Spalter Select ; Spalter → Spalt ; Strissel Spalt → Strisselspalt ; Styrian Golding Celeia → Styrian Golding ; Tettnang → Tettnang (US) ; Uk Fuggle → Fuggle ; Uk Golding → Golding ; Us Saaz → Saaz (US) ; Us Tettnang → Tettnang (US)

Relus à la main (26.10) : `heb` Hersbrucker Spät → Hersbrucker (même variété) ; `ssg` Styrian Savinjski Golding → Styrian Golding (Savinjski Golding est le nom slovène de Styrian Golding) ; `sul` Sultana → Sultana (Denali) (Denali s'est appelée Sultana chez Hopsteiner) ; East Kent Golding → East Kent Goldings (singulier/pluriel) ; Hallertauer Gold → Hallertau Gold ; Whitbread Golding → WGV. Écartés : Cascade (NZ/UK), Fuggle (US/NZ), Golding (SI/BC/UK), Willamette (AUS), Cluster (AUS), Hallertau de Hopslist (Allemagne, catalogue : version US), Tettnanger (US) de Hopslist (catalogue : version allemande), Wai de HopDatabase (= NZ Wai-iti). Acceptés avec doute : Feux-Coeur → Feux-Coeur Francais (seul de sa famille) ; Extra Styrian Dana → Dana.

### Fiches sans variété du catalogue : par source, avec candidats

- **barthhaas** : 1 (1 avec candidats, 0 absentes du catalogue). Candidats : Brewers Gold [brewers-gold, brewers-gold-us].
- **britishhops** : 1 (0 avec candidats, 1 absentes du catalogue).
- **charlesfaram** : 5 (5 avec candidats, 0 absentes du catalogue). Candidats : Brewers Gold [brewers-gold, brewers-gold-us] ; Magnum [magnum-gr, magnum-us] ; Northern Brewer [northern-brewer-gr, northern-brewer-us] ; Perle [perle-gr, perle-us] ; Saaz [saaz-cz, saaz-us].
- **crosbyhops** : 6 (0 avec candidats, 6 absentes du catalogue).
- **hopdatabase** : 11 (1 avec candidats, 10 absentes du catalogue). Candidats : Wai [waimea].
- **hopslist** : 10 (0 avec candidats, 10 absentes du catalogue).
- **hopsteiner** : 5 (3 avec candidats, 2 absentes du catalogue). Candidats : Brewers Gold [brewers-gold, brewers-gold-us] ; Northern Brewer [northern-brewer-gr, northern-brewer-us] ; Perle [perle-gr, perle-us].
- **hpa** : 2 (0 avec candidats, 2 absentes du catalogue).
- **indiehops** : 2 (0 avec candidats, 2 absentes du catalogue).
- **johnihaas** : 5 (3 avec candidats, 2 absentes du catalogue). Candidats : Northern Brewer [northern-brewer-gr, northern-brewer-us] ; Perle [perle-gr, perle-us] ; Saaz [saaz-cz, saaz-us].
- **usahops** : 5 (0 avec candidats, 5 absentes du catalogue).
- **yakimavalleyhops** : 8 (0 avec candidats, 8 absentes du catalogue).

## Champs numériques non repris

hopsteiner.premiere_mise_sur_le_marche (17), hopsteiner.surface (43), nzhops.autresComposes (2), nzhops.autresComposesConnus (1), nzhops.composesInconnus (1), nzhops.limonene (1), nzhops.produitsAgrumesResineux (5), nzhops.produitsFloralEsters (5), nzhops.produitsOxydation (1), nzhops.rapportAlpha (1), nzhops.rapportHumuleneCaryophyllene (1), yakimavalleyhops.cohomulone (1), yakimavalleyhops.rapportAlphaBeta (5).
Non repris aussi (listes et textes, hors enveloppe) : descripteurs, substituts, styles, accords, roses aromatiques de BarthHaas (12 axes), classe « Thiol impact » de Hopsteiner, maturité, résistances, origine, lignée, formes. Ils restent dans `src/data/hopSources/` pour l'étape de l'interface.

## Poids

- `complements.json` : 438554 octets bruts (438.6 ko), 74009 octets gzip (74.0 ko). 371 variétés.
- `complements-non-rattachees.json` : 15400 octets (jamais importé par l'app).
- Chargé à la demande par `chargerComplements()` (import dynamique, `src/domain/hopIndex/v4/complements.ts`) : hors du démarrage et des outils. Mesure B5 : voir RESULTAT.md.
