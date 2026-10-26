# Couverture c3d — bases ouvertes et communautaires (#180, relevé du 26.10.2026)

Rien n'est fusionné dans le catalogue : les JSON de `src/data/hopSources/` ne sont importés par aucun code de l'app.
Nombres de fiches ayant une valeur chiffrée (min, max ou valeur ; un « Unknown », « 0-0 » ou « Trace » ne compte pas).

## Hôtes tentés
| Hôte | robots.txt | Réponse | Lu |
|---|---|---|---|
| raw.githubusercontent.com (HopDatabase, hops-json) | pas de page web : fichiers de dépôt | déjà en cache (relevé du 08.09) | données + LICENSE (MIT) + README |
| www.hopslist.com | `*` : Disallow /wp-admin/ seulement ; `hopslist.com` renvoie 301 vers `www` | 200 partout, 0 refus | plan du site (post-sitemap.xml) + 268 fiches `/hops/<catégorie>-hops/<nom>/` |
| www.ars.usda.gov | `*` : /bin/ /config/ /css/ /Jquery/ /views/ /scripts/ /umbraco/ …, pas de délai | 200 sur 21092 et 56013, 404 sur 19124 | 2 fiches d'accession (`/ARSUserFiles/2450/hopcultivars/`) |
| npgsweb.ars-grin.gov (GRIN) | `*` : /search/ et ses requêtes interdits, Crawl-delay 10 ; texte « décourager le scraping » | robots.txt seul lu | aucune page : les accessions ne s'atteignent que par la recherche dynamique |
| www.brewersfriend.com | `*` : /hops/ non interdit | index 200 ; une page de détail met 13 s (délai de 25 s dépassé une fois) | index `/hops/` (1112 lignes) |

Aucun 401, 403 ou 429, aucune page de défi. 1 requête par seconde au plus par hôte. Le plan du site de l'ARS (`/umbraco/…`) est interdit par robots.txt : non lu.
Quelques essais d'adresses de l'ARS (une dizaine de requêtes, 404 ou pages sans lien utile) ont été faits avant le script, hors cache.

## Pages lues et variétés
| Source | Pages | Fiches | Rattachées au catalogue (318) | Ambiguës | Nouvelles |
|---|---|---|---|---|---|
| HopDatabase | 1 fichier | 220 | 161 (159 ids) | 5 | 54 |
| hops-json | 1 fichier | 119 | 109 (106 ids) | 0 | 10 |
| Hopslist | 268 fiches + plan | 268 | 173 (167 ids) | 4 (+2 douteuses) | 91 |
| USDA ARS | 2 fiches (+1 en 404) | 2 | 2 (Cascade) | 0 | 0 |
| Brewer's Friend | 1 index | 1112 | 117 | 5 | 990 (marques, mélanges, « Artisan - … ») |

HopDatabase, hops-json, Hopslist et USDA rattachent ensemble 224 des 318 variétés du catalogue (union des ids, Brewer's Friend non comptée).
Une « ambiguë » est un nom qui désigne deux variantes par pays du catalogue (Magnum GR et US, Perle, Saaz, Northern Brewer, Brewer's Gold) : `varietyId` reste `null` et `rattachementAmbigu` liste les ids.

## Champ par champ (nombre de fiches avec une valeur)
Les composés demandés en avant :

| Composé | HopDatabase (220) | hops-json (119) | Hopslist (268) | USDA (2) |
|---|---|---|---|---|
| **linalol** | 70 (huile) + 56 (acide) ; 28 + 42 en 0–0 ou vide : `null` | — | 3 | — |
| **géraniol** | — | — | 2 | — |
| **farnésène** | 79 (19 en 0–0 : `null`) | — | 200 (+ 20 « Trace » ou « None » : `qualitatif`) | 1 (« about 4% ») |
| **β-pinène** | — | — | 1 | — |
| **sélinène** | — | — | 1 | — |

Les autres champs :

| Champ | HopDatabase | hops-json | Hopslist | USDA |
|---|---|---|---|---|
| α | 218 | 119 | 262 | 2 |
| β | 218 | 119 | 255 | 2 |
| cohumulone | 178 | 119 | 247 | 2 |
| huile totale | 218 (+ 98 du bloc Hopsteiner) | 117 | 241 | 2 |
| myrcène | — | — | 229 | — |
| humulène | 82 | — | 226 | 1 |
| caryophyllène | — | — | 222 | — |
| xanthohumol | 73 | — | 3 | — |
| polyphénols | 30 | — | 1 | — |
| résines dures (« acid_hardresins ») | 61 | — | — | — |
| colupulone, 2-undécanone, HSI | — | — | 1 chacun | — |
| rendement | — | — | 191 | 2 |
| conservation (% des α après 6 mois) | — | — | 178 | 1 |
| rapport H/C | — | — | — | 1 |

Listes : HopDatabase (descripteurs 220, fournisseurs 220, usage 220, origine 184, profil d'arôme à 9 axes quand il n'est pas tout à zéro) ; hops-json (descripteurs 116, styles 111, lignée 116, origine 70) ; Hopslist (styles 196, substituts 173, origine 246, usage 266, alias, lignée 2) ; USDA (lignée, origine, références bibliographiques).
Brewer's Friend : alpha moyen des recettes d'utilisateurs, emploi et nombre de recettes par houblon et par forme : des statistiques de recettes, pas des analyses.

## Doutes
- **Unités.** HopDatabase et hops-json n'écrivent aucune unité : `unite` et `base` restent `null`. Les composés « additional_properties » (humulen, farnesen, linalool_oil, linalool_acid, polyphenoles, xantholhumol, acid_hardresins) n'ont pas de base connue ; un `humulen` de 0,32 pour Cascade ne se lit pas comme les 10 % de l'ARS. À trancher au tri.
- **Zéros.** Les 0–0 de HopDatabase (cohumulone, polyphénols, linalol) sont des défauts d'agrégat : `null` avec `zeroParDefaut`. Chez Hopslist, un « 0% » écrit (géraniol d'Admiral) est gardé comme valeur ; « None » et « Trace » ne le sont pas (`qualitatif`).
- **Hopslist.** Une valeur « 11.20 mL/100g » et une huile en « 0.8%-1.3% » sont recopiées telles que publiées. Page de Satus : variété sans usage commercial depuis 2016 (déjà signalé en 2019).
- **Rattachements incertains.** Par alias : East Kent Golding, Hallertauer Gold, Whitbread Golding, Feux-Coeur (Hopslist). Refusées : Cicero → Citra (le code HBC 394 est celui de Citra), Hüll Melon → Huell Melon (candidat probablement bon, refusé par la règle des quatre premières lettres). Le catalogue écrit GR pour l'Allemagne : « (DE) » est lu GR.
- **USDA.** Pas d'index public lisible ; seules 2 accessions atteintes (Cascade 21092 et son clone 56013). Le PDF `hoppedigree.pdf` n'est pas lu (le lecteur du cache ne garde que du texte). L'ARS ne publie pas de licence ; la fiche Cascade dit « commercial cultivar, no restrictions ».
- **GRIN non collectée** : la recherche d'accessions est dynamique et décourage explicitement le scraping ; les fiches GRIN du houblon sont surtout des données de passeport. À décider par le brasseur si on y tient.
- **Prose écartée** (restée dans le cache) : « Info » et « Trade » de hops-json, « OTHER INFORMATION » et « MAJOR TRAITS » de l'ARS, texte des pages Hopslist.
- **Brewer's Friend** : pages de détail non lues (13 s par page, contenu = usage par style).
- **Licences.** HopDatabase et hops-json : MIT. Hopslist : © Julian Healey, tous droits réservés (seules valeurs, noms et listes sont gardés). Brewer's Friend : droits du site.
