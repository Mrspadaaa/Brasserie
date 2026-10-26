# Fusion des données houblons collectées (#180, voie d3a-fusion)

Généré par `node scripts/collecte-hop/fusion.mjs` (hors ligne, déterministe). Sources : `src/data/hopSources/*.json` (18). Catalogue : `src/data/hopV4/proto-data.json` (318 variétés).

## Résumé

- Fiches lues : 2790 (dont Brewer's Friend : 1112 lignes d'index sans valeur chimique). Rattachées et fusionnées : 1421. Écartées à la fusion : 23. Non rattachées (liste à part) : 374.
- Variétés du catalogue touchées : 251 sur 318.
- Valeurs fusionnées : 9156. Dans une enveloppe : 7259. Hors enveloppe (unité ou base inconnue ou différente) : 1693. Suspectes : 204. Enveloppes calculées : 3185 (variété × champ).
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
| **linalol** (`linalol`, % de l'huile) | 64 (20,1 %) | 130 (40,9 %) | +66 | 126 (39,6 %) | 7 |
| **géraniol** (`geraniol`, % de l'huile) | 0 (0,0 %) | 68 (21,4 %) | +68 | 68 (21,4 %) | 5 |
| **farnésène** (`farnesene`, % de l'huile) | 249 (78,3 %) | 268 (84,3 %) | +19 | 264 (83,0 %) | 0 |
| **β-pinène** (`betaPinene`, % de l'huile) | 0 (0,0 %) | 10 (3,1 %) | +10 | 10 (3,1 %) | 7 |
| **sélinène** (`selinene`, % de l'huile) | 0 (0,0 %) | 9 (2,8 %) | +9 | 9 (2,8 %) | 2 |
| **cohumulone** (`cohumulone`, % des α) | 287 (90,3 %) | 288 (90,6 %) | +1 | 288 (90,6 %) | 0 |
| **thiols** (`thiols`, µg/kg) | 0 (0,0 %) | 20 (6,3 %) | +20 | 20 (6,3 %) | 0 |
| **polyphénols** (`polyphenols`, % de la masse) | 0 (0,0 %) | 48 (15,1 %) | +48 | 28 (8,8 %) | 2 |
| **intensité d'arôme** (`intensite_arome`, sur 10) | 0 (0,0 %) | 30 (9,4 %) | +30 | 30 (9,4 %) | 105 |
| α (`alpha`, % de la masse) | 318 (100,0 %) | 318 (100,0 %) | +0 | 318 (100,0 %) | 0 |
| β (`beta`, % de la masse) | 311 (97,8 %) | 312 (98,1 %) | +1 | 312 (98,1 %) | 0 |
| huile totale (`huile`, mL/100 g) | 301 (94,7 %) | 301 (94,7 %) | +0 | 301 (94,7 %) | 1 |
| colupulone (`colupulone`, % des β) | 0 (0,0 %) | 7 (2,2 %) | +7 | 2 (0,6 %) | 1 |
| myrcène (`myrcene`, % de l'huile) | 257 (80,8 %) | 271 (85,2 %) | +14 | 271 (85,2 %) | 0 |
| humulène (`humulene`, % de l'huile) | 251 (78,9 %) | 267 (84,0 %) | +16 | 267 (84,0 %) | 6 |
| caryophyllène (`caryophyllene`, % de l'huile) | 238 (74,8 %) | 255 (80,2 %) | +17 | 254 (79,9 %) | 0 |
| 2-undécanone (`undecanone2`, % de l'huile) | 0 (0,0 %) | 0 (0,0 %) | +0 | 0 (0,0 %) | 1 |
| esters et alcools terpéniques (`esters_alcools_terpeniques`, % de l'huile) | 0 (0,0 %) | 11 (3,5 %) | +11 | 11 (3,5 %) | 0 |
| cétones (`cetones`, % de l'huile) | 0 (0,0 %) | 27 (8,5 %) | +27 | 27 (8,5 %) | 0 |
| isobutyrates (`isobutyrates`, % de l'huile) | 0 (0,0 %) | 26 (8,2 %) | +26 | 26 (8,2 %) | 0 |
| monoterpènes (`monoterpenes`, % de l'huile) | 0 (0,0 %) | 0 (0,0 %) | +0 | 0 (0,0 %) | 2 |
| sesquiterpènes (`sesquiterpenes`, % de l'huile) | 0 (0,0 %) | 0 (0,0 %) | +0 | 0 (0,0 %) | 2 |
| xanthohumol (`xanthohumol`, % de la masse) | 0 (0,0 %) | 77 (24,2 %) | +77 | 3 (0,9 %) | 2 |
| conservation (α restants après 6 mois à 20 °C) (`conservation`, % des α restants) | 0 (0,0 %) | 105 (33,0 %) | +105 | 105 (33,0 %) | 0 |
| indice de stockage (HSI) (`hsi`, indice sans unité) | 71 (22,3 %) | 71 (22,3 %) | +0 | 71 (22,3 %) | 1 |
| rendement (`rendement`, kg/ha) | 0 (0,0 %) | 144 (45,3 %) | +144 | 122 (38,4 %) | 1 |
| rapport humulène/caryophyllène (`rapportHC`, rapport sans unité) | 0 (0,0 %) | 8 (2,5 %) | +8 | 1 (0,3 %) | 0 |
| linalol « acide » (HopDatabase) (`linalolAcide`, sens non établi) | 0 (0,0 %) | 0 (0,0 %) | +0 | 0 (0,0 %) | 44 |
| résines dures (HopDatabase) (`resinesDures`, sens non établi) | 0 (0,0 %) | 0 (0,0 %) | +0 | 0 (0,0 %) | 49 |
| arôme noté : agrumes (`arome_citrusy`, odeur du houblon brut (Hopsteiner)) | 0 (0,0 %) | 87 (27,4 %) | +87 | 0 (0,0 %) | 0 |
| arôme noté : fruité (`arome_fruity`, odeur du houblon brut (Hopsteiner)) | 0 (0,0 %) | 87 (27,4 %) | +87 | 0 (0,0 %) | 0 |
| arôme noté : floral (`arome_floral`, odeur du houblon brut (Hopsteiner)) | 0 (0,0 %) | 87 (27,4 %) | +87 | 0 (0,0 %) | 0 |
| arôme noté : herbacé (`arome_herbal`, odeur du houblon brut (Hopsteiner)) | 0 (0,0 %) | 87 (27,4 %) | +87 | 0 (0,0 %) | 0 |
| arôme noté : épicé (`arome_spicy`, odeur du houblon brut (Hopsteiner)) | 0 (0,0 %) | 87 (27,4 %) | +87 | 0 (0,0 %) | 0 |
| arôme noté : résineux (`arome_resinous`, odeur du houblon brut (Hopsteiner)) | 0 (0,0 %) | 87 (27,4 %) | +87 | 0 (0,0 %) | 0 |
| arôme noté : sucré (`arome_sugarlike`, odeur du houblon brut (Hopsteiner)) | 0 (0,0 %) | 87 (27,4 %) | +87 | 0 (0,0 %) | 0 |
| arôme noté : divers (`arome_divers`, odeur du houblon brut (Hopsteiner)) | 0 (0,0 %) | 87 (27,4 %) | +87 | 0 (0,0 %) | 0 |

Notes : « avant » du linalol = `hsLinalool` (Hopsteiner, 64 variétés dans le catalogue) ; thiols, β-pinène, sélinène, géraniol, polyphénols, xanthohumol, colupulone : absents du catalogue (0). Le catalogue porte la classe « Thiol impact » de Hopsteiner (qualitative, non comptée ici) ; les thiols chiffrés viennent de BarthHaas seule. `hsi` avant = `bm.hsi` de Beer Maverick.

## Désaccords entre sources au-delà d'un facteur 2 (les 20 plus forts)

Rapport entre le milieu de plage le plus haut et le plus bas, entre deux sources différentes, sur les valeurs valides (dans l'enveloppe). Milieux ≥ 0,1 seulement (les traces font des rapports sans sens). Aucune réconciliation : l'enveloppe garde les deux.

103 désaccords au total.

| Variété | Champ | Rapport | Plus haut | Plus bas |
|---|---|---:|---|---|
| Eureka | caryophyllène | ×72,5 | Crosby Hops 14–15 | Hopslist 0,2 |
| Diamant | farnésène | ×58,6 | Hopsteiner 20–21 | BarthHaas 0,1–0,6 |
| Galena | farnésène | ×40,0 | BarthHaas ·–4 | Hopsteiner ·–0,1 |
| Huell Melon | humulène | ×16,7 | Charles Faram 10–20 | BarthHaas ·–0,9 |
| Mandarina Bavaria | farnésène | ×15,0 | BarthHaas ·–1,5 | Hopsteiner ·–0,1 |
| Spalter Select | farnésène | ×14,8 | John I. Haas 15–22 | Hopsteiner 1–1,5 |
| Hersbrucker | farnésène | ×13,8 | BarthHaas ·–6,9 | Hopslist 0–1 |
| Comet | farnésène | ×13,5 | Hopsteiner 1,2–1,5 | Hopslist 0,1 |
| Jester | farnésène | ×13,3 | Yakima Valley Hops 2–· | British Hop Association 0,1–0,2 |
| Chinook | farnésène | ×12,4 | BarthHaas ·–6,2 | Hopslist 0–1 |
| Columbus | farnésène | ×10,4 | BarthHaas ·–5,2 | Hopslist 0–1 |
| El Dorado | farnésène | ×10,0 | Crosby Hops ·–1 | Hopslist 0,1 |
| Hallertau Tradition | farnésène | ×10,0 | Yakima Valley Hops ·–1 | BarthHaas ·–0,1 |
| Zeus | farnésène | ×10,0 | BarthHaas ·–1 | Hopsteiner ·–0,1 |
| Huell Melon | farnésène | ×9,9 | Hopsteiner 0–19,8 | Charles Faram ·–1 |
| Pilot | humulène | ×8,7 | Charles Faram 30,5 | British Hop Association 3,5 |
| Galena | linalol | ×8,0 | BarthHaas ·–1,6 | Hopsteiner 0,1–0,3 |
| Bitter Gold | farnésène | ×8,0 | Hopslist 1,2 | Hopsteiner 0,1–0,2 |
| Epic | farnésène | ×7,0 | Charles Faram 10,5 | British Hop Association 1,5 |
| Hallertau Mittelfrüh | farnésène | ×6,2 | Crosby Hops ·–3,1 | Hopsteiner 0–1 |

## Valeurs suspectes (gardées, hors enveloppe)

α au-delà de 25 % : 3 ; même valeur que caryophyllène : 7 ; même valeur que farnésène : 10 ; même valeur que humulène : 3 ; même valeur que linalol : 5 ; même valeur que myrcène : 7 ; écart aux autres sources : 21 ; composé écrit sans signe % et ≤ 1 (0,42 = 42 % ? fraction probable, non convertie) : 29 ; huile totale au-delà de 6 mL/100 g : 78 ; plage inversée (min > max) : 12 ; fiche PDF appariée par l'ordre du flux, non recoupée par une autre source : 8 ; les minimums des composés de la fiche somment au-delà de 100 : 13 ; pourcentage au-dessus de 100 : 8

| Source | Variété (fiche) | Champ | Valeur | Raison |
|---|---|---|---|---|
| barthhaas | Marynka → Marynka | beta | 2–2,7 | écart aux autres sources |
| barthhaas | Spalter Select → Spalter Select | caryophyllene | ·–2,1 | écart aux autres sources |
| barthhaas | Spalter Select → Spalter Select | humulene | ·–5,3 | écart aux autres sources |
| barthhaas | Tango → Tango | geraniol | 0,5–0,6 | même valeur que caryophyllène |
| britishhops | Boadicea → Boadicea | selinene | 5 | même valeur que farnésène |
| britishhops | Mystic → Mystic | humulene | 35 | même valeur que myrcène |
| bsg | Citra → Citra | alpha | 21–28 | α au-delà de 25 % |
| bsg | Mosaic → Mosaic | alpha | 18–26 | α au-delà de 25 % |
| bsg | Simcoe → Simcoe | alpha | 21–28 | α au-delà de 25 % |
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
| charlesfaram | Bramling Cross → Bramling Cross | huile | 0,7–10 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Bramling Cross → Bramling Cross | myrcene | 0,36 | composé écrit sans signe % et ≤ 1 (0,42 = 42 % ? fraction probable, non convertie) |
| charlesfaram | Callista → Callista | cohumulone | 54–64 | écart aux autres sources |
| charlesfaram | Styrian Cardinal → Styrian Cardinal | huile | 30–40 | huile totale au-delà de 6 mL/100 g |
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
| charlesfaram | Sabro → Sabro | huile | 20,5–30,5 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Simcoe → Simcoe | huile | 0,8–30,2 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Smaragd → Smaragd | huile | 0,4–10,7 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Sorachi Ace → Sorachi Ace | huile | 10,5–30 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Sovereign → Sovereign | huile | 0,6–10 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Sterling → Sterling | huile | 0,6–20 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Sticklebract → Sticklebract | huile | 0,8–10,8 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Styrian Dragon → Styrian Dragon | huile | 10,5–20,1 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Styrian Eagle → Styrian Eagle | farnesene | 60,5–90,5 | les minimums des composés de la fiche somment au-delà de 100 |
| charlesfaram | Styrian Eagle → Styrian Eagle | huile | 20,5–40 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Styrian Eagle → Styrian Eagle | humulene | 0,9–20,5 | les minimums des composés de la fiche somment au-delà de 100 |
| charlesfaram | Styrian Eagle → Styrian Eagle | myrcene | 52–60 | les minimums des composés de la fiche somment au-delà de 100 |
| charlesfaram | Fox → Styrian Fox | huile | 0,7–10,7 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Styrian Kolibri → Styrian Kolibri | huile | 10–20 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Styrian Kolibri → Styrian Kolibri | myrcene | 0,32 | composé écrit sans signe % et ≤ 1 (0,42 = 42 % ? fraction probable, non convertie) |
| charlesfaram | Styrian Wolf → Styrian Wolf | huile | 30–40,5 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Summit → Summit | huile | 10,5–30 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Sussex → Sussex | myrcene | 0,42 | composé écrit sans signe % et ≤ 1 (0,42 = 42 % ? fraction probable, non convertie) |
| charlesfaram | Taiheke → Taiheke | huile | 10,1 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Taiheke → Taiheke | humulene | 140,5 | pourcentage au-dessus de 100 |
| charlesfaram | Taiheke → Taiheke | myrcene | 5,31 | écart aux autres sources |
| charlesfaram | Talus → Talus | beta | 34–39 | écart aux autres sources |
| charlesfaram | Talus → Talus | huile | 1–20,2 | huile totale au-delà de 6 mL/100 g |
| charlesfaram | Target → Target | myrcene | 0,45 | composé écrit sans signe % et ≤ 1 (0,42 = 42 % ? fraction probable, non convertie) |
| charlesfaram | Triskel → Triskel | huile | 10,5–20 | huile totale au-delà de 6 mL/100 g |
| … | 84 autres suspectes dans `complements.json` (raison commençant par « s- »). | | | |

Charles Faram : sa page porte des artefacts de tableur — huile « 10.3 » ou « 20.4-30.9 » pour 1,3 ou 2,4–3,9 ; β « 45050 » et cohumulone « 41579 » (numéros de date Excel) ; myrcène « 0.42 » pour 42 %. Les valeurs qui dépassent les seuils sont suspectes ; celles qui restent dans les seuils (« 0.7-1.3 » lisible) n'ont aucun moyen d'être distinguées : à relire avant d'afficher une huile de Charles Faram.
BSG : le rendement « 2,200 – 2,400 lbs/acre » avait été lu 2.2–2.4 par la collecte (séparateur de milliers perdu) ; corrigé à la fusion d’après le texte brut (× 1000), puis converti en kg/ha.

Bornes négatives illisibles (valeur nulle côté collecte, brut gardé : non fusionnées, listées ici) :

- aucune sur des fiches rattachées (TerraFlux HBC 682 de BarthHaas n'est pas rattachée au catalogue).

## Aberrances entre sources (règles ajoutées après d3b)

- Règle d'écart (≥ 3 sources, intervalle sans recoupement, facteur > 3 de la médiane des autres) : **21 valeurs** écartées de l'enveloppe, sur 21 couples variété × champ, sur 3185 enveloppes.
- Règle de copie de colonne (bornes égales à celles d'un composé précédent de la même fiche) : **32 valeurs**.
- Règle des fiches PDF appariées par l'ordre du flux (fiches HPA « fiche-pdf » et fiches John I. Haas portant `appariement`) : **8 valeurs** sur 252 lues de ces fiches ; les autres sont recoupées par une source qui n'est pas elle-même une fiche appariée.
- Un composé n'est comparé qu'aux valeurs encore valides après la copie de colonne et la règle PDF (pas d'effet en cascade). Une valeur d'un champ à une seule ou deux sources n'est jamais écartée par la règle d'écart.

Les plus fortes de la règle d'écart (30 au plus ; il y en a 21 au total) :

| Variété | Champ | Source | Valeur | Médiane des autres | Rapport | Sources |
|---|---|---|---|---:|---:|---:|
| Tettnanger | myrcène | crosbyhops | ·–0,9 | 34,05 | ×37,8 | 3 |
| Green Bullet | farnésène | hopslist | 9,2–20 | 0,8 | ×18,3 | 3 |
| Riwaka | linalol | hopsteiner | 0–0,1 | 0,85 | ×17,0 | 3 |
| Moutere | myrcène | charlesfaram | 2,2 | 25 | ×11,4 | 3 |
| Taiheke | myrcène | charlesfaram | 5,31 | 53,75 | ×10,1 | 3 |
| Apollo | farnésène | hopsteiner | ·–0,1 | 1 | ×10,0 | 3 |
| Wai-iti | myrcène | crosbyhops | 3–4 | 26,25 | ×7,5 | 3 |
| Eclipse | humulène | charlesfaram | 10,4 | 1,4 | ×7,4 | 5 |
| Phoenix | farnésène | charlesfaram | 10,5 | 1,5 | ×7,0 | 5 |
| Moutere | farnésène | crosbyhops | 1–3 | 0,3 | ×6,7 | 3 |
| Marynka | β | barthhaas | 2–2,7 | 11,5 | ×4,9 | 4 |
| Tettnanger | farnésène | crosbyhops | ·–4 | 19 | ×4,8 | 4 |
| First Gold | farnésène | hopsteiner | 0–1 | 2,25 | ×4,5 | 4 |
| Tettnanger | humulène | crosbyhops | ·–5,3 | 23,7 | ×4,5 | 3 |
| Tettnanger | caryophyllène | crosbyhops | ·–1,7 | 7,35 | ×4,3 | 3 |
| Comet | linalol | hopsteiner | 0,6–1 | 0,2 | ×4,0 | 3 |
| Sabro | β | charlesfaram | 20–24 | 5,5 | ×4,0 | 4 |
| Talus | β | charlesfaram | 34–39 | 9,25 | ×3,9 | 4 |
| Spalter Select | caryophyllène | barthhaas | ·–2,1 | 7 | ×3,3 | 3 |
| Spalter Select | humulène | barthhaas | ·–5,3 | 17,5 | ×3,3 | 4 |
| Callista | cohumulone | charlesfaram | 54–64 | 18,25 | ×3,2 | 5 |

Copies de colonne (32) : barthhaas Tango géraniol 0,5–0,6 (même valeur que caryophyllène) ; britishhops Boadicea sélinène 5 (même valeur que farnésène) ; britishhops Mystic humulène 35 (même valeur que myrcène) ; charlesfaram Aurora humulène 20–25 (même valeur que myrcène) ; crosbyhops Cascade farnésène 3–9 (même valeur que caryophyllène) ; crosbyhops Magnum (GR) humulène 30–45 (même valeur que myrcène) ; hopslist Canadian Redvine caryophyllène 2 (même valeur que humulène) ; hopslist Eroica farnésène 0–1 (même valeur que humulène) ; hopslist Nelson Sauvin farnésène 10,7 (même valeur que caryophyllène) ; hopslist Target farnésène 0–1 (même valeur que caryophyllène) ; hopsteiner Horizon linalol 2–3 (même valeur que farnésène) ; hopsteiner Spalter Select linalol 1–1,5 (même valeur que farnésène) ; hpa Amarillo farnésène 2–4 (même valeur que caryophyllène) ; johnihaas Amarillo farnésène 2–4 (même valeur que caryophyllène) ; johnihaas Amarillo farnésène 2–4 (même valeur que caryophyllène) ; johnihaas BRU-1 géraniol 0–1 (même valeur que farnésène) ; johnihaas BRU-1 linalol 0–1 (même valeur que farnésène) ; johnihaas Talus linalol 0–1 (même valeur que farnésène) ; nzhops Kohatu linalol 0,5–1 (même valeur que farnésène) ; nzhops Motueka β-pinène 0,7–1 (même valeur que linalol) ; nzhops Moutere β-pinène 0,1–0,5 (même valeur que farnésène) ; nzhops Pacific Jade β-pinène 0,4–0,6 (même valeur que linalol) ; nzhops Pacifica géraniol 0,1–1 (même valeur que farnésène) ; nzhops Pacifica humulène 30–40 (même valeur que myrcène) ; nzhops Riwaka β-pinène 0,5–1 (même valeur que farnésène) ; nzhops Southern Cross β-pinène 0,5–1 (même valeur que linalol) ; nzhops Southern Cross géraniol 0,5–1 (même valeur que linalol) ; nzhops Wai-iti β-pinène 0,3–0,5 (même valeur que linalol) ; yakimavalleyhops African Queen humulène 20–30 (même valeur que myrcène) ; yakimavalleyhops Mystic humulène 30–40 (même valeur que myrcène) ; yakimavalleyhops Pacific Jade humulène 31–35 (même valeur que myrcène) ; yakimavalleyhops Styrian Wolf farnésène 5–10 (même valeur que humulène).

Cas cités par d3b (doivent être hors enveloppe) :
- Nelson Sauvin, farnésène, hopslist : 10,7 → même valeur que caryophyllène. Enveloppe : 0,1–1.
- Citra, farnésène, hpa : ·–1 → dans l'enveloppe. Enveloppe : 1.
- Mosaic, farnésène, hpa : aucune valeur. Enveloppe : 0–1.
- Mosaic, myrcène, hpa : 47–53 → dans l'enveloppe. Enveloppe : 24,5–65.

## Valeurs hors enveloppe (unité ou base inconnue ou différente)

| Source | Raison | Valeurs |
|---|---|---:|
| britishhops | huile écrite en %, pas en mL/100 g (base inconnue) | 30 |
| charlesfaram | échelle non publiée | 131 |
| crosbyhops | huile écrite en %, pas en mL/100 g (base inconnue) | 4 |
| crosbyhops | unité non écrite par la source | 4 |
| hopdatabase | sens du champ non établi | 93 |
| hopdatabase | unité non écrite par la source | 949 |
| hopsjson | unité non écrite par la source | 423 |
| hopslist | base non publiée (sur quoi porte le pourcentage ?) | 19 |
| hopslist | huile écrite en %, pas en mL/100 g (base inconnue) | 1 |
| hpa | unité non écrite par la source | 6 |
| johnihaas | unité non écrite par la source | 4 |
| johnihaas | unité différente de celle du champ | 13 |
| nzhops | huile écrite en %, pas en mL/100 g (base inconnue) | 2 |
| usda | base non publiée (sur quoi porte le pourcentage ?) | 2 |
| yakimavalleyhops | unité et base se contredisent | 3 |
| yakimavalleyhops | huile écrite en %, pas en mL/100 g (base inconnue) | 1 |
| yakimavalleyhops | unité non écrite par la source | 8 |

HopDatabase et hops-json n'écrivent aucune unité : tout est gardé, rien n'entre dans une enveloppe. Les chiffres de leur README suggèrent α, β, cohumulone en % et huile en mL/100 g ; HopDatabase est un agrégat de catalogues de fournisseurs déjà fusionnés ici (doublon probable). À trancher si l'on veut les compter : une règle « unité du README » les ferait entrer.
Charles Faram : « Flavour Intensity » sans échelle écrite (hors enveloppe) ; seule la BHA (sur 10) entre dans l'enveloppe d'intensité d'arôme.

## Fiches non rattachées et rattachements vérifiés

Aucune variété n'est ajoutée au catalogue ici. Les fiches sans variété (ambiguës, absentes, ou écartées par la vérification) sont dans `src/data/hopV4/complements-non-rattachees.json` avec leurs candidats ; leurs valeurs restent dans `src/data/hopSources/`.

| Source | Fiches | Rattachées | Écartées à la fusion | Non rattachées (total) |
|---|---:|---:|---:|---:|
| barthhaas | 97 | 85 | 0 | 12 |
| brewersfriend | 1112 | 117 | 0 | 0 |
| britishhops | 34 | 30 | 1 | 4 |
| bsg | 77 | 69 | 0 | 8 |
| charlesfaram | 157 | 132 | 0 | 25 |
| crosbyhops | 139 | 114 | 2 | 25 |
| hopdatabase | 220 | 160 | 1 | 60 |
| hopsdirect | 49 | 38 | 0 | 11 |
| hopsjson | 119 | 106 | 3 | 13 |
| hopslist | 268 | 164 | 9 | 104 |
| hopsteiner | 102 | 89 | 0 | 13 |
| hpa | 48 | 33 | 0 | 15 |
| indiehops | 19 | 11 | 2 | 8 |
| johnihaas | 81 | 64 | 0 | 17 |
| nzhops | 40 | 34 | 4 | 6 |
| usahops | 80 | 68 | 0 | 12 |
| usda | 2 | 2 | 0 | 0 |
| yakimavalleyhops | 146 | 105 | 1 | 41 |

Brewer's Friend : index sans valeur chimique ; ses lignes non rattachées ne sont pas listées.

### Rattachements écartés à la fusion (dans le doute : non rattaché)

Règle : l'origine annoncée par le nom (« (UK) », « NZ », « GR »…) ou par la page Hopslist doit être celle de la variété du catalogue ; sinon la fiche est écartée.

- britishhops : « Cascade (UK) » → Cascade : origine annoncée (Royaume-Uni) différente de celle du catalogue (États-Unis)
- crosbyhops : « NZ Cascade » → Cascade : origine annoncée (Nouvelle-Zélande) différente de celle du catalogue (États-Unis)
- crosbyhops : « UK Golding » → Golding : origine annoncée (Royaume-Uni) différente de celle du catalogue (États-Unis)
- hopdatabase : « Wai » → Waimea : abréviation : l'URL est celle de NZ Wai-iti, pas de Waimea
- hopsjson : « Cascade (NZ) » → Cascade : origine annoncée (Nouvelle-Zélande) différente de celle du catalogue (États-Unis)
- hopsjson : « Fuggle (US) » → Fuggle : origine annoncée (États-Unis) différente de celle du catalogue (Royaume-Uni)
- hopsjson : « Golding (SI) » → Golding : origine annoncée (Slovénie) différente de celle du catalogue (États-Unis)
- hopslist : « BOR » → Bor : origine annoncée (États-Unis) différente de celle du catalogue (Tchéquie)
- hopslist : « Bullion » → Bullion : origine annoncée (Royaume-Uni) différente de celle du catalogue (États-Unis)
- hopslist : « Cluster (AUS) » → Cluster : origine annoncée (Australie) différente de celle du catalogue (États-Unis)
- hopslist : « Fuggle (US) » → Fuggle : origine annoncée (États-Unis) différente de celle du catalogue (Royaume-Uni)
- hopslist : « Golding (BC) » → Golding : origine annoncée (Canada) différente de celle du catalogue (États-Unis)
- hopslist : « Hallertau » → Hallertau (US) : origine annoncée (Allemagne) différente de celle du catalogue (États-Unis)
- hopslist : « Southern Promise » → Southern Promise : origine annoncée (Slovénie) différente de celle du catalogue (Afrique du Sud)
- hopslist : « Tettnanger (US) » → Tettnanger : origine annoncée (États-Unis) différente de celle du catalogue (Allemagne)
- hopslist : « Willamette (AUS) » → Willamette : origine annoncée (Australie) différente de celle du catalogue (États-Unis)
- indiehops : « US Fuggle » → Fuggle : origine annoncée (États-Unis) différente de celle du catalogue (Royaume-Uni)
- indiehops : « US Tettnanger » → Tettnanger : origine annoncée (États-Unis) différente de celle du catalogue (Allemagne)
- nzhops : « NZ Chinook » → Chinook : origine annoncée (Nouvelle-Zélande) différente de celle du catalogue (États-Unis)
- nzhops : « NZ Chinook » → Chinook : origine annoncée (Nouvelle-Zélande) différente de celle du catalogue (États-Unis)
- nzhops : « NZ Fuggle » → Fuggle : origine annoncée (Nouvelle-Zélande) différente de celle du catalogue (Royaume-Uni)
- nzhops : « NZ Fuggle » → Fuggle : origine annoncée (Nouvelle-Zélande) différente de celle du catalogue (Royaume-Uni)
- yakimavalleyhops : « Uk Golding » → Golding : origine annoncée (Royaume-Uni) différente de celle du catalogue (États-Unis)

### Rattachements à relire (nom différent du catalogue, acceptés)

- **barthhaas** (9) : Extra Styrian Dana → Dana ; Hallertauer Taurus → Hallertau Taurus ; Hallertauer Tradition → Hallertau Tradition ; Hersbrucker Spät → Hersbrucker ; Lublin → Lubelska ; Mt. Hood → Mount Hood ; Spalt Spalter → Spalt ; Styrian Savinjski Golding → Styrian Golding ; Whitbread Goldings Variety → Whitbread Golding Variety (WGV)
- **britishhops** (1) : WGV → Whitbread Golding Variety (WGV)
- **charlesfaram** (4) : Fox → Styrian Fox ; Sultana → Sultana (Denali) ; Tettnang → Tettnang (US) ; WGV → Whitbread Golding Variety (WGV)
- **crosbyhops** (36) : AU Enigma → Enigma ; Amarillo VGXP01 c.v. → Amarillo ; Azacca (ADHA-483) → Azacca ; CZ Saaz → Saaz (CZ) ; Citra HBC 394 → Citra ; Comet - Estate Grown → Comet ; Czech Saaz → Saaz (CZ) ; FR Barbe Rouge → Barbe Rouge ; GR Ariana → Ariana ; GR Callista → Callista ; GR Hallertau Blanc → Hallertau Blanc ; GR Hallertau Mittelfrüh → Hallertau Mittelfrüh ; GR Hersbrucker → Hersbrucker ; GR Magnum → Magnum (GR) ; GR Mandarina Bavaria → Mandarina Bavaria ; GR Northern Brewer → Northern Brewer (GR) ; GR Perle → Perle (GR) ; GR Saphir → Saphir ; GR Tettnanger → Tettnanger ; Hop Revolution Kohatu → Kohatu ; Hop Revolution Motueka → Motueka ; Hop Revolution Moutere → Moutere ; Hop Revolution Nelson Sauvin → Nelson Sauvin ; Hop Revolution Pacific Sunrise → Pacific Sunrise ; Hop Revolution Riwaka → Riwaka ; Hop Revolution Wai-Iti → Wai-iti ; Mosaic HBC 369 → Mosaic ; Mt. Hood → Mount Hood ; NZ Pacific Jade → Pacific Jade ; NZ Rakau → Rakau ; NZ Southern Cross → Southern Cross ; NZ Waimea → Waimea ; NZ Wakatu → Wakatu ; Organic El Dorado → El Dorado ; Simcoe YCR 14 → Simcoe ; US Saaz → Saaz (US)
- **hopdatabase** (4) : Falconers flight 7cs → Falconer's Flight 7CS ; Falconers flight → Falconer's Flight ; Hbc 682 → Pahto ; Sussex hop → Sussex
- **hopsdirect** (2) : Citra Hbc 394 → Citra ; Mt. Hood → Mount Hood
- **hopsjson** (52) : Admiral (UK) → Admiral ; African Queen (RSA) → African Queen ; Aurora (SI) → Aurora ; BOR (CZ) → Bor ; Bobek (SI) → Bobek ; Bramling Cross (UK) → Bramling Cross ; Brewer's Gold (DE) → Brewer's Gold (GR) ; Celeia (SI) → Celeia ; Challenger (UK) → Challenger ; Dr. Rudi (NZ) → Dr. Rudi ; Ella (AU) → Ella ; Enigma (AU) → Enigma ; First Gold (UK) → First Gold ; Fuggle (UK) → Fuggle ; Galaxy (AU) → Galaxy ; Golding (US) → Golding ; Green Bullet (NZ) → Green Bullet ; HBC 291 → Loral ; Hallertau Mittelfrüh (DE) → Hallertau Mittelfrüh ; Herkules (DE) → Herkules ; Hersbrucker (DE) → Hersbrucker ; Magnum (DE) → Magnum (GR) ; Mandarina Bavaria (DE) → Mandarina Bavaria ; Melba (AU) → Melba ; Merkur (DE) → Merkur ; Motueka (NZ) → Motueka ; Nelson Sauvin (NZ) → Nelson Sauvin ; Northdown (UK) → Northdown ; Northern Brewer (DE) → Northern Brewer (GR) ; Opal (DE) → Opal ; Pacific Gem (NZ) → Pacific Gem ; Pacifica (NZ) → Pacifica ; Perle (DE) → Perle (GR) ; Phoenix (UK) → Phoenix ; Pilgrim (UK) → Pilgrim ; Pioneer (UK) → Pioneer ; Premiant (CZ) → Premiant ; Pride of Ringwood (AU) → Pride of Ringwood ; Progress (UK) → Progress ; Rakau (NZ) → Rakau ; Riwaka (NZ) → Riwaka ; Saphir (DE) → Saphir ; Sladek (CZ) → Sládek ; Smaragd (DE) → Smaragd ; Spalt (DE) → Spalt ; Spalter Select (DE) → Spalter Select ; Strisselspalt (FR) → Strisselspalt ; Target (UK) → Target ; Topaz (AU) → Topaz ; Vic Secret (AU) → Vic Secret ; Waimea (NZ) → Waimea ; Wakatu (NZ) → Wakatu
- **hopslist** (7) : Cascade (US) → Cascade ; Cluster (US) → Cluster ; East Kent Golding → East Kent Goldings ; Feux-Coeur → Feux-Coeur Francais ; Golding (US) → Golding ; Hallertauer Gold → Hallertau Gold ; Whitbread Golding → Whitbread Golding Variety (WGV)
- **hopsteiner** (14) : Hallertauer Merkur → Merkur ; Hallertauer Mittelfrüh → Hallertau Mittelfrüh ; Hallertauer Taurus → Hallertau Taurus ; Hallertauer Tradition → Hallertau Tradition ; Hersbrucker Spät → Hersbrucker ; Hüll Melon → Huell Melon ; Lubelski (Lublin) → Lubelska ; MT. Rainier → Mount Rainier ; Saazer → Saaz (CZ) ; Spalter → Spalt ; Strisselspalter → Strisselspalt ; Styrian Savinjski Golding → Styrian Golding ; Sultana → Sultana (Denali) ; Whitbread Golding → Whitbread Golding Variety (WGV)
- **hpa** (2) : Hallertauer Magnum → Magnum (GR) ; Idaho7 → Idaho 7
- **indiehops** (1) : Mt. Hood → Mount Hood
- **johnihaas** (2) : Columbus (CTZ) → Columbus ; Zeus (CTZ) → Zeus
- **nzhops** (2) : NZ Pacific Jade → Pacific Jade ; NZ Southern Cross → Southern Cross
- **usahops** (7) : Azacca, ADHA-483 → Azacca ; Mt. Hood → Mount Hood ; Mt. Rainier → Mount Rainier ; Pekko, ADHA-871 → Pekko ; Strissel Spalt → Strisselspalt ; Talus HBC 692 → Talus ; Triple Pearl → TriplePearl
- **yakimavalleyhops** (6) : Hort 9909 → HORT9909 ; Mt Hood → Mount Hood ; Strissel Spalt → Strisselspalt ; Uk Fuggle → Fuggle ; Us Saaz → Saaz (US) ; Us Tettnang → Tettnang (US)

Relus à la main (26.10) : `heb` Hersbrucker Spät → Hersbrucker (même variété) ; `ssg` Styrian Savinjski Golding → Styrian Golding (Savinjski Golding est le nom slovène de Styrian Golding) ; `sul` Sultana → Sultana (Denali) (Denali s'est appelée Sultana chez Hopsteiner) ; East Kent Golding → East Kent Goldings (singulier/pluriel) ; Hallertauer Gold → Hallertau Gold ; Whitbread Golding → WGV. Écartés : Cascade (NZ/UK), Fuggle (US/NZ), Golding (SI/BC/UK), Willamette (AUS), Cluster (AUS), Hallertau de Hopslist (Allemagne, catalogue : version US), Tettnanger (US) de Hopslist (catalogue : version allemande), Wai de HopDatabase (= NZ Wai-iti). Acceptés avec doute : Feux-Coeur → Feux-Coeur Francais (seul de sa famille) ; Extra Styrian Dana → Dana.

### Fiches sans variété du catalogue : par source, avec candidats

- **barthhaas** : 12 (6 avec candidats, 6 absentes du catalogue). Candidats : Brewers Gold [brewers-gold, brewers-gold-us] ; Hallertauer Magnum [magnum-gr, magnum-us] ; Hallertauer Mittelfrüh [hallertau, hallertau-mittelfruh] ; Perle [perle-gr, perle-us] ; Saaz [saaz-cz, saaz-us] ; Tettnang Tettnanger [tettnang-us, tettnanger].
- **britishhops** : 4 (1 avec candidats, 3 absentes du catalogue). Candidats : Cascade (UK) [cascade].
- **bsg** : 8 (0 avec candidats, 8 absentes du catalogue).
- **charlesfaram** : 25 (5 avec candidats, 20 absentes du catalogue). Candidats : Brewers Gold [brewers-gold, brewers-gold-us] ; Magnum [magnum-gr, magnum-us] ; Northern Brewer [northern-brewer-gr, northern-brewer-us] ; Perle [perle-gr, perle-us] ; Saaz [saaz-cz, saaz-us].
- **crosbyhops** : 25 (2 avec candidats, 23 absentes du catalogue). Candidats : NZ Cascade [cascade] ; UK Golding [golding].
- **hopdatabase** : 60 (1 avec candidats, 59 absentes du catalogue). Candidats : Wai [waimea].
- **hopsdirect** : 11 (0 avec candidats, 11 absentes du catalogue).
- **hopsjson** : 13 (3 avec candidats, 10 absentes du catalogue). Candidats : Cascade (NZ) [cascade] ; Fuggle (US) [fuggle] ; Golding (SI) [golding].
- **hopslist** : 104 (9 avec candidats, 95 absentes du catalogue). Candidats : BOR [bor] ; Bullion [bullion] ; Cluster (AUS) [cluster, cluster-fugget] ; Fuggle (US) [fuggle] ; Golding (BC) [golding] ; Hallertau [hallertau, hallertau-blanc, hallertau-gold, hallertau-mittelfruh] ; Southern Promise [southern-promise] ; Tettnanger (US) [tettnanger] ; Willamette (AUS) [willamette].
- **hopsteiner** : 13 (7 avec candidats, 6 absentes du catalogue). Candidats : Brewers Gold [brewers-gold, brewers-gold-us] ; Columbus/ Tomahawk [columbus, ctz, tomahawk] ; Golding (UK) [east-kent-goldings, golding] ; Hallertauer Magnum [magnum-gr, magnum-us] ; Northern Brewer [northern-brewer-gr, northern-brewer-us] ; Perle [perle-gr, perle-us] ; Styrian Golding (Celeia) [celeia, styrian-golding].
- **hpa** : 15 (0 avec candidats, 15 absentes du catalogue).
- **indiehops** : 8 (2 avec candidats, 6 absentes du catalogue). Candidats : US Fuggle [fuggle] ; US Tettnanger [tettnanger].
- **johnihaas** : 17 (3 avec candidats, 14 absentes du catalogue). Candidats : Northern Brewer [northern-brewer-gr, northern-brewer-us] ; Perle [perle-gr, perle-us] ; Saaz [saaz-cz, saaz-us].
- **nzhops** : 6 (4 avec candidats, 2 absentes du catalogue). Candidats : NZ Chinook [chinook] ; NZ Chinook [chinook] ; NZ Fuggle [fuggle] ; NZ Fuggle [fuggle].
- **usahops** : 12 (0 avec candidats, 12 absentes du catalogue).
- **yakimavalleyhops** : 41 (1 avec candidats, 40 absentes du catalogue). Candidats : Uk Golding [golding].

## Champs numériques non repris

hopsteiner.premiere_mise_sur_le_marche (16), hopsteiner.surface (40), nzhops.autresComposes (2), nzhops.autresComposesConnus (1), nzhops.composesInconnus (1), nzhops.limonene (1), nzhops.produitsAgrumesResineux (3), nzhops.produitsFloralEsters (3), nzhops.produitsOxydation (1), nzhops.rapportAlpha (1), nzhops.rapportHumuleneCaryophyllene (1), yakimavalleyhops.rapportAlphaBeta (5).
Non repris aussi (listes et textes, hors enveloppe) : descripteurs, substituts, styles, accords, roses aromatiques de BarthHaas (12 axes), classe « Thiol impact » de Hopsteiner, maturité, résistances, origine, lignée, formes. Ils restent dans `src/data/hopSources/` pour l'étape de l'interface.

## Poids

- `complements.json` : 346757 octets bruts (346.8 ko), 58682 octets gzip (58.7 ko). 251 variétés.
- `complements-non-rattachees.json` : 65265 octets (jamais importé par l'app).
- Chargé à la demande par `chargerComplements()` (import dynamique, `src/domain/hopIndex/v4/complements.ts`) : hors du démarrage et des outils. Mesure B5 : voir RESULTAT.md.
