# Sources possibles de données houblons (#131)

Date : 2026-10-19. Note de recherche, aucun import, aucun téléchargement de fichier, aucune écriture hors de ce fichier.

Point de départ : `RAPPORT-SOURCES.md` (même dossier, pack du 2026-10-18, 32 houblons). 320 mesures lues, 146 à source unique dont 134 avec Beer Maverick seule. Absents : farnésène, géraniol, β-pinène (32/32), linalol (20/32), caryophyllène (5/32), humulène (4/32), myrcène (3/32).

## Résumé

- 17 pages ouvertes avec WebFetch et contenu lu (liste en fin de fichier). Échecs : 403 (Yakima Chief, Wiley, DOAJ, HopsConnect), 404 (fiches Hopsteiner, fiches HPA, PDF LfL), 429 (brewing.it.com). Plusieurs PDF sont binaires et illisibles.
- Une seule fiche de la liste des 32 est vérifiée sur un producteur : Ariana (BarthHaas) donne géraniol jusqu'à 0,2 %, linalol jusqu'à 0,4 %, caryophyllène jusqu'à 5,4 % et farnésène jusqu'à 0,1 %. Le constat « géraniol absent partout » est donc faux pour Ariana.
- Cascade (fiche cultivar USDA ARS, vérifiée) : α moyen 6,3 %, huile 1,24 mL/100 g, humulène environ 10 %, farnésène environ 4 %. Caryophyllène, linalol et géraniol ne sont pas donnés.
- Saaz et Saaz Late (étude tchèque 2021, CC BY 4.0, vérifiée) : huile au plus 1,1 % p/p pour le groupe Saaz le plus pauvre ; caryophyllène de Saaz Late entre 5,39 et 15,53 % rel. Ce sont des plages, le tableau par variété n'a pas été lu.
- Biotransformation : aucune donnée chiffrée par variété dans les revues ouvertes. Svedlund et al. 2022 (CC BY 4.0, vérifiée) est la revue la plus utile. Elle indique environ 6,5 mg/kg de précurseurs de 3MH pour Cascade.
- Couverture réelle des 32 : faible. Des fiches Hopsteiner (Nelson Sauvin, Motueka, Nugget) et Yakima (Citra, Simcoe) existent d'après les moteurs de recherche, mais je n'ai pas pu les ouvrir. Leurs valeurs sont donc marquées non vérifiées.
- Licences : aucune fiche variété de producteur n'a une licence ouverte confirmée. Seules les revues en CC BY et la fiche USDA (« commercial cultivar, no restrictions ») ont été lues. Le reste demande une décision du brasseur.

## Méthode et limites

- WebSearch, puis WebFetch sur chaque URL trouvée. « Ouvert » = contenu rendu par WebFetch. « Vérifié » = lu sur une page ouverte. « Non vérifié » = extrait de moteur de recherche, ou page non ouverte.
- Les valeurs de moteur de recherche peuvent être fausses ou mélanger des variétés. Elles ne doivent pas entrer dans les fiches sans relecture.
- Aucune URL n'a été devinée : seules celles renvoyées par WebSearch ou présentes dans une page ouverte ont été testées.
- Les chiffres relevés par un outil sur des PDF partiellement lisibles sont signalés « partiel ».

## Tableau récapitulatif

Couverture /32 : nombre de houblons de la liste pour lesquels une valeur est vérifiée sur une page ouverte, sauf mention contraire.

| Source | Type | α / β | Huiles complètes | Arômes notés | Récolte / variabilité | Biotransfo | Couverture /32 | Licence |
|---|---|---|---|---|---|---|---|---|
| Yakima Chief Hops | producteur (US) | non vérifié (extraits) | non vérifié (extraits : Citra, Simcoe, Motueka) | non | non vérifié : plusieurs années, méthode ASBC | non | 0 ouvert ; 3 à 4 extraits | non lue (403) ; conditions non trouvées |
| Hopsteiner | producteur (US / DE) | fiches 404 ; extraits Nelson Sauvin, Motueka, Nugget | extraits seulement | non | extraits | non | 0 ouvert ; 3 extraits | © 2023–2026 Hopsteiner ; pas de licence vue |
| BarthHaas (dont John I. Haas) | producteur (DE / distributeur US) | vérifié : Ariana, Aurora | vérifié : Ariana, Aurora | citations, sans intensité | moyenne des 4 dernières années (vérifié) | thiols Ariana 10,7 µg/kg (vérifié) | 1 (Ariana) | conditions non lues sur pages ouvertes |
| HVG Hopfenverwertungsgenossenschaft | producteur (coopérative DE) | non trouvé | non trouvé | non | non | non | 0 | non trouvée (page réduite au titre) |
| LfL Hüll (Bavière) / GfH Hüll | institut (DE) | Saphir α 3,4 % (vérifié, hors liste) ; tables LfL 404 | Saphir 1,1 mL/100 g (vérifié, hors liste) | profils en graphiques, non lus | liste IHGC 2025 : noms seulement | non | 0 | réserve expresse de droits sur les contenus (mentions légales) ; pas de licence ouverte |
| NZ Hops | producteur (NZ) | non trouvé | non trouvé | non | non | non | 0 | non trouvée |
| Hop Products Australia (HPA) | producteur (AU) | non vérifié (fiches expérimentales, extraits) | PDF illisible | non | non | non | 0 ouvert | © 2026 HPA ; pas de condition de reproduction vue |
| Charles Faram | distributeur (UK) | vérifié : Ahtanum (hors liste) | vérifié : Ahtanum | intensité 7 pour Ahtanum (vérifié) | non | qualitatif, 4MMP (vérifié) | 0 chiffré ; 5 variétés citées pour 4MMP | © 2026 ; conditions non lues |
| Hopslist | agrégateur | vérifié : Satus (hors liste) | vérifié : Satus | non | Satus retiré du site en 2016 (vérifié) | non | 0 | © 2021 Julian Healey, All Rights Reserved |
| Hop Growers of America (USA Hops) | association (US) | non | manuel non ouvert | non | statistiques (non lues) | non | 0 | page « Policies » non lue |
| Chmelařský institut (Žatec) | institut (CZ) | non | Saaz ≤ 1,1 % p/p ; Saaz Late caryophyllène (vérifié, plages) | non | 2011–2020, un site (vérifié) | non | 2, partiel | CC BY 4.0 (article 2021, vérifié) |
| Žatecký chmel (AOP UE) | cahier des charges | extrait : α 2,5–5,5 % (conflit) | extrait : myrcène 25–40 %, farnésène 14–20 % rel. | non | 2004–2008 (extraits) | non | non mesurée | registre UE non lu |
| USDA ARS (Corvallis) | institut public (US) | Cascade α 6,3 % moy. (vérifié) | Cascade 1,24 mL/100 g (vérifié) | description qualitative (vérifié) | 7 ans, α 5,1–8,9 % (vérifié) | non | 1 (Cascade) | « commercial cultivar, no restrictions » (fiche) ; domaine public non affirmé |
| OSU (Oregon State University) | université (US) | non | non | résumés de congrès | non | travaux thiols OSU (partiel) | 0 donnée par variété dans le guide | aucune licence de réutilisation vue |
| Purdy et al. 2021 (Foods) | science (NZ) | non | non (huile non mesurée) | non | récolte 2017 (vérifié) | non | 2, qualitatif (Motueka, Nelson Sauvin) | CC BY 4.0 (vérifié) ; données sur demande |
| Nesvadba et al. 2021 (Kvasny Prumysl) | science (CZ) | non | oui, plages (vérifié) | non | 2011–2020 (vérifié) | non | 2, partiel | CC BY 4.0 (vérifié) |
| Krofta 2003 (Plant Soil Environ.) | science (CZ) | non lu | non lu | non lu | non lu | non | non lu | CC BY-NC 4.0 (métadonnées) : usage commercial exclu |
| Svedlund et al. 2022 (Appl. Microbiol. Biotechnol.) | revue | non | non | non | non | oui, qualitatif + Cascade 6,5 mg/kg (vérifié) | 4, qualitatif | CC BY 4.0 (vérifié) |
| Buiatti et al. 2023 (Fermentation) | revue | non | non | non | non | oui (résumé, extrait) | 0 | CC BY (extrait ; page 403) |
| Molitor et al. 2022 (OSU, Fermentation) | science | non | non | non | non | Cascade (partiel) | 1, partiel | non lue |
| Beer Maverick | agrégateur (source actuelle) | base actuelle | base actuelle | base actuelle | — | — | — | non trouvée ; site non ouvert |
| HopDatabase (brewing.it.com) | agrégateur | — | — | — | — | — | — | MIT annoncé (extrait ; page 429) |
| Brevets de plantes USPTO | brevets | non lisible | non lisible | non | non | non | non mesurée | domaine public probable, à confirmer ; PDF illisible |

## Sources par source

### 1. Yakima Chief Hops (producteur, US)

1. URL ouvertes : aucune. Testées : https://www.yakimachief.com/commercial/hop-varieties.html (403), https://www.yakimachief.com/ahtanum.html (403).
2. Publie (non vérifié, extraits de moteur) : Ahtanum α 4–6 %, β 5–6,5 %, huile 0,5–2,0 mL/100 g, myrcène 50–65 %, humulène 12–20 %, caryophyllène 7–11 %, farnésène 0,1–1 %. Ces plages diffèrent de la fiche Charles Faram vérifiée (voir section 8). Citra (listing T90, revendeur, non Yakima officiel) : α 11–15 %, β 3–4,5 %, humulène 7–12 %, farnésène < 1 %. Chinook et Satus sont aussi listés (hors liste des 32).
3. Format : pages HTML par variété, bloquées.
4. Couverture : non mesurée. Extraits pour Citra et Simcoe (liste des 32), Motueka (page « brand NZ », non ouverte).
5. Licence : non lue (403). Conditions non trouvées.

### 2. Hopsteiner (producteur, US / DE)

1. URL ouvertes : https://www.hopsteiner.com/ (accueil, vérifié). Fiches testées sans succès : https://www.hopsteiner.com/variety-data-sheets/Nelson-Sauvin (404), https://hopsteiner.com/variety-data-sheets/Nelson-Sauvin (404), https://hopsteiner.com/variety-data-sheets/Motueka (404), https://hopsteiner.com/variety-data-sheets/Sterling (404).
2. Publie : d'après les extraits du moteur (non vérifié) : fiches par variété avec α, β, huile totale (mL/100 g), farnésène et linalol en % d'huile. Nelson Sauvin α 9,5–12,0 %, β 4,5–6,0 %, huile 1,0–1,5, farnésène 0,22–0,26 %, linalol 0,4–0,7 %, cohumulone 31–34 %. Motueka α 6,5–8,5 %, huile 1,0–1,8, farnésène 12,5–13,2 %. Nugget α 11–14 %, β 4–6 %, huile 1,5–3,0, farnésène 0–1 %, linalol 0,8–1,0 %. Les extraits indiquent qu'aucune fiche ne donne géraniol. Des fiches « Centennial », « Cluster », « Summit » et autres existent (hors liste).
3. Format : une page HTML par variété (vu dans les URL et les extraits ; pages 404 en lecture directe).
4. Couverture : 0 ouverte sur les 32 ; 3 d'après les extraits (Nelson Sauvin, Motueka, Nugget).
5. Licence : page d'accueil © 2023–2026 Hopsteiner, All rights reserved (vérifié). Aucune condition d'utilisation des fiches vue. Lien vers une politique de confidentialité seulement.

### 3. BarthHaas (producteur, DE) et John I. Haas (distributeur US)

1. URL ouvertes : https://www.barthhaas.com/en/hop-varieties/aurora (vérifié), https://barthhaas.com/en/hop-varieties/ariana (vérifié). Hors liste : Aurora (SSA, Slovénie).
2. Publie (vérifié) :
   - Ariana : α 8–14,5 % (titrage conductimétrique en Europe, spectrophotométrie aux États-Unis) ; β 3,7–6,6 % ; huile 1,1–2,1 mL/100 g ; myrcène jusqu'à 47 %, humulène jusqu'à 18 %, caryophyllène jusqu'à 5,4 %, farnésène jusqu'à 0,1 %, linalol jusqu'à 0,4 %, géraniol jusqu'à 0,2 % de l'huile ; β-pinène non mentionné ; polyphénols jusqu'à 4,5 % ; thiols jusqu'à 10,7 µg/kg ; arômes : fruits (passion, ananas, mandarine, lime, coing, fraise, mûre). Période : moyenne des 4 dernières années, la page précise que α et huile varient fortement selon la récolte. Issue de Herkules × mâle sauvage, Hüll, commercialisée en 2016.
   - Aurora : α 5,6–14,5 % ; β jusqu'à 5,5 % ; huile jusqu'à 2,6 mL/100 g ; myrcène jusqu'à 55 %, humulène jusqu'à 27 %, caryophyllène jusqu'à 8 %, farnésène jusqu'à 9 %, linalol jusqu'à 1 %, géraniol jusqu'à 0,1 %. Arômes : floraux, agrumes, résineux ; un « Aroma Profile 2023 » est cité sans chiffres.
   - Non vérifié (extrait d'un PDF John I. Haas illisible en WebFetch) : Simcoe α 12–14 %, β 4–5 %, huile 2,0–2,5 mL/100 g, myrcène 60–65 %, humulène 10–15 %, caryophyllène 5–8 %, farnésène < 1 % ; Nelson Sauvin α 12–13 %, β 6–8 %, cohumulone 22–26 %, huile 1,0–1,2, myrcène 21–23 %, humulène 35–37 %.
   - Non vérifié (extraits) : Harvest Guides 2019, 2021, 2022 (PDF, non ouverts) présentant la chimie des huiles et les thiols. Le « Hop Aroma Compendium » et le « Product Guide » n'ont pas été trouvés.
3. Format : pages HTML par variété (ouvertes) ; PDF « MiniSpecSheets » sur johnihaas.com (illisibles) ; PDF « Harvest Guide » (non ouverts).
4. Couverture : 1 ouverte sur les 32 (Ariana). Le catalogue est large, mais la couverture réelle n'a pas été mesurée.
5. Licence : aucune condition d'utilisation vue sur les pages ouvertes. Pages légales non lues.

### 4. HVG Hopfenverwertungsgenossenschaft (coopérative, DE)

1. URL ouverte : https://www.hvg-germany.de (titre « HVG Germany » seulement, aucun contenu lisible).
2. Publie : rien de lisible. Un extrait indique que HVG Mainburg est membre du groupe de laboratoires « Arbeitsgruppe Hopfenanalyse » qui publie des moyennes α pour les houblons frais (non vérifié).
3. Format : inconnu.
4. Couverture : 0.
5. Licence : non trouvée.

### 5. LfL Hüll (Bayerische Landesanstalt für Landwirtschaft) et GfH / Hopfenforschungszentrum Hüll

1. URL ouvertes : https://www.hopfenforschung.de/en/?p=4497 (fiche Saphir, vérifiée) ; https://www.hopfenforschung.de/en/variety-list-2025-of-the-international-hop-growers-convention-ihgc/ (vérifiée) ; https://www.hopfenforschung.de/en/imprint/ (vérifiée). Échecs : https://lfl.bayern.de/mam/cms07/ipz/dateien/hopfen_alpha_tabelle_2024.pdf (404), https://www.lfl.bayern.de/mam/cms07/ipz/dateien/hopfen_flavor_pocketguide.pdf (404), https://lfl.bayern.de/mam/cms07/ipz/dateien/hopfen_aroma_alpha_2025_t3.pdf (404).
2. Publie :
   - Saphir (hors liste ; page vérifiée) : obtention Hüll, lancement 2001 (la page donne 2001 ; un extrait donne 2002). α 3,4 %, β/α 1,7, cohumulone 15 % des α, huile totale 1,1 mL/100 g, farnésène < 0,5 mg/100 g, linalol 6 mg/100 g, caryophyllène/humulène 0,42, polyphénols 5,5 %, xanthohumol 0,36 %. Myrcène, humulène et géraniol non publiés. Profils aromatiques en graphiques téléchargeables (non lus).
   - Liste IHGC 2025 (vérifiée) : 342 variétés cultivées, dont 92 en bio ; établie par la commission scientifique et technique de l'IHGC, ratifiée le 24 novembre 2025. Noms, pays et codes seulement. Le PDF n'a pas été ouvert.
3. Format : pages HTML ; PDF des tables LfL (inaccessibles en lecture).
4. Couverture : 0 des 32 vérifié. Les tables LfL (moyennes α sur 5 et 10 ans, type A/B) auraient été utiles mais n'ont pas pu être lues.
5. Licence : les mentions légales GfH disent (citation de l'outil, à relire sur la page) : « expressly reserves the right to use the copyrighted content on this website ». Le texte vise la fouille de données, y compris pour l'IA, avec renvoi au § 44b UrhG. Pas de licence ouverte. Les images ont des conditions séparées, non lues.

### 6. NZ Hops (NZ)

1. URL ouvertes : aucune. Non trouvé de site officiel NZ Hops dans les résultats. Échec : https://hops.com.au/motueka (404, voir section 7). Extraits seulement : hopsconnect.com motueka.pdf (403).
2. Publie : rien de vérifié. Les extraits donnent des fiches de distributeurs pour Motueka (α 6,5–8,5 % selon Hopsteiner, 6,5–7,5 % selon Yakima ; date de sortie 1996 ou 1998 selon la source) et Nelson Sauvin (α 9–13 %, cohumulone 22–26 % ou 31–34 % selon la source). Ces extraits sont en conflit.
3. Format : fiches de distributeurs PDF et HTML.
4. Couverture : 0 vérifié. Voir Purdy 2021 (section 15) pour la chimie qualitative des cultivars NZ.
5. Licence : non trouvée.

### 7. Hop Products Australia (HPA) et HopsConnect (AU, distributeurs)

1. URL ouvertes : https://hops.com.au/ (accueil, vérifié). Échecs : https://hops.com.au/motueka (404), https://hops.com.au/downloads/data-sheet/australia/HPA-3029-Experimental-Data-Sheet.pdf (404), https://hopsconnect.com/wp-content/uploads/2022/09/motueka.pdf (403). Ouvert mais illisible : https://hops.com.au/downloads/data-sheet/europe/Hallertau-Blanc-Data-Sheet.pdf (PDF binaire).
2. Publie : rien de vérifié dans les fiches. Extraits (non vérifiés) : fiches « experimental » HPA 3029, 4029, 065, 050, 031, 035 ; Hallertau Blanc (huile 1,5–1,8 mL/100 g selon un extrait) ; Galaxy (α 13,0–18,5 %, β 6,1–11,6 %, cohumulone 32–43 %, huile 1,9–2,9 mL/100 g selon un extrait). Ces extraits de « Galaxy » et « Hallertau Blanc » ne sont pas confirmés. La page d'accueil renvoie à un « Hop Navigator » et à un « Hop sensory worksheets » non ouverts.
3. Format : PDF par variété, fiches « experimental », HTML.
4. Couverture : 0 ouvert sur les 32 ; extraits pour Hallertau Blanc et Galaxy.
5. Licence : accueil © 2026 Hop Products Australia (vérifié). Pas de condition de reproduction des fiches vue.

### 8. Charles Faram (distributeur, UK)

1. URL ouvertes : https://charlesfaram.com/?p=46757 (fiche Ahtanum, vérifiée) ; https://charlesfaram.com/news/technical-article-introduction-to-thiols-in-hop-oils/ (vérifiée).
2. Publie (vérifié) :
   - Ahtanum (hors liste) : α 5–8 %, β 4–6 %, cohumulone 30–35 %, huile 0,7–1,3 mL/100 g, intensité aromatique 7 ; myrcène 50–55 %, humulène 16–20 %, farnésène 0–1 %. Caryophyllène, linalol, géraniol et β-pinène ne sont pas indiqués. Arômes : citron, floral, épices ; agrumes, herbacé, boisé en bière. Valeurs différentes du listing Yakima (extrait non vérifié) pour la même variété.
   - Article thiols : 4MMP (note cassis), 3MH (pamplemousse, groseille à maquereau), 3MHA (fruit de la passion). 4MMP cité pour Nelson Sauvin, Citra, Chinook, Cascade, Centennial, Amarillo, Simcoe, Summit, Hallertau Blanc. Aucune valeur chiffrée ni méthode. Le glutathion et la cystéine ne sont pas mentionnés.
3. Format : fiches HTML par variété, article HTML.
4. Couverture : 0 chiffrée sur les 32. Qualitative : 4 variétés de la liste pour les thiols (Nelson Sauvin, Citra, Cascade, Simcoe, Hallertau Blanc : 5 au total).
5. Licence : © Copyright 2026 All rights reserved (vérifié). Conditions d'utilisation non lues.

### 9. Hopslist (agrégateur)

1. URL ouverte : https://hopslist.com/?p=214 (fiche Satus, vérifiée).
2. Publie (vérifié, hors liste) : Satus, α 12,5–14 %, β 8,5–9 %, cohumulone 32–35 %, huile 1,5–2,8 mL/100 g, myrcène 40–45 %, humulène 15–20 %, caryophyllène 7–10 %, farnésène 0–1 %. Substituts : Nugget, Galena. La page indique que Satus n'apparaissait plus chez Yakima Chief en 2016 : données possiblement anciennes.
3. Format : page HTML unique par variété ; le site a un menu « Hop Varieties » non ouvert.
4. Couverture : 0 des 32 vérifié.
5. Licence : « Copyright 2021 © Julian Healey, All Rights Reserved » (vérifié). Pas de licence ouverte. Lien « Terms & Privacy » non lu.

### 10. Hop Growers of America (HGA, USA Hops)

1. URL ouvertes : https://www.usahops.org/index.html (vérifiée). Extrait non ouvert : https://www.usahops.org/cabinet/data/2022 US variety codes.pdf (codes de variétés, avril 2022). Page « Policies » non ouverte.
2. Publie (vérifié) : association à Yakima, statistiques (« 2025 HGA Statistical Packet »), rapports annuels, « Variety Info » et « Sensory Finder » renvoyant vers « Hop Finder ». Aucune donnée de variété dans la page d'accueil. Un blog tiers (non vérifié) décrit un « Variety Manual » avec moyennes α, β, cohumulone, huile, myrcène, caryophyllène, humulène, farnésène par variété ; son PDF n'a pas été trouvé.
3. Format : site HTML, PDF éventuels.
4. Couverture : 0 vérifié.
5. Licence : © 2025 Hop Growers of America (vérifié). Page « Policies » non lue.

### 11. Chmelařský institut / Hop Research Institute Žatec (institut, CZ)

1. URL ouvertes : https://kvasnyprumysl.eu/index.php/kp/article/view/246 (vérifiée, article Nesvadba et al. 2021). https://pse.agriculturejournals.cz/pdfs/pse/2003/06/04.pdf (métadonnées lues, texte illisible).
2. Publie (vérifié) :
   - Nesvadba, Olšovská, Straková, Charvátová, Trnková, « Essential oils in Czech hop varieties », Kvasny Prumysl 67(3), p. 447–454, 2021, DOI 10.18832/kp2021.67.447. Teneur en huile 0,43–2,28 % p/p ; Saaz, Saaz Brilliant, Mimosa, Saaz Shine et Saaz Comfort les plus pauvres, maximum 1,1 %. Myrcène 23,42–45,14 % rel. ; humulène 2,23–35,79 % rel. ; caryophyllène 6,19–13,15 % rel. ; Saaz Late caryophyllène 5,39–15,53 % rel. ; farnésène 0,14–16,91 % rel. Linalol et géraniol non rapportés. Un seul site, 2011–2020, valeurs moyennes.
   - Krofta, « Comparison of quality parameters of Czech and foreign hop varieties », Plant Soil Environ. 49(6), p. 261–268, 2003, DOI 10.17221/4123-PSE. Métadonnées vérifiées ; le corps du PDF est illisible en WebFetch. Non lu.
   - Extrait non vérifié : la valeur de β-farnésène 15–20 % rel. pour le groupe « fine aroma » de 2003.
3. Format : article HTML avec PDF lien ; PDF scannés/compressés pour 2003.
4. Couverture : 2 des 32 (Saaz, Saaz Late), en plages.
5. Licence : article Kvasny 2021 : CC BY 4.0 (vérifié). Krofta 2003 : CC BY-NC 4.0 (métadonnées vérifiées) : usage non commercial seulement, donc incompatible sans accord pour une brasserie commerciale.

### 12. Žatecký chmel (appellation protégée UE, cahier des charges)

1. URL ouverte : https://mzv.gov.cz/file/1476506/zatecky_chmel_AJ.pdf (ouvert ; PDF illisible en WebFetch, métadonnées seulement). Le lien mzv.cz redirige (302) vers mzv.gov.cz.
2. Publie : extraits (non vérifiés, moteur) : myrcène 25–40 %, farnésène 14–20 % rel., β/α 0,60–0,80, α 2,5–5,5 % (UE) contre 3–5 % (fiche tchèque) : conflit. Le registre UE officiel n'a pas été lu.
3. Format : fiche PDF d'État tchèque ; registre UE.
4. Couverture : non mesurée, concerne Saaz (CZ).
5. Licence : non lue.

### 13. USDA ARS (Corvallis, Hop Breeding & Genetics ; GRIN-Global)

1. URL ouverte : https://www.ars.usda.gov/ARSUserFiles/2450/hopcultivars/21092.html (fiche Cascade, accession 21092, vérifiée). Extrait non ouvert : npgstest.ars-grin.gov (fiche GRIN, site de test d'après l'extrait) ; ne pas utiliser pour commander du matériel.
2. Publie (vérifié, Cascade) : α moyen 6,3 % (sur 7 ans : 5,1–8,9 %) ; β moyen 5,6 % (3,6–7,5 %) ; cohumulone 36–40 % ; huile 1,24 mL/100 g ; humulène environ 10 %, farnésène environ 4 %. Myrcène, caryophyllène, linalol, géraniol, β-pinène non mentionnés. Stabilité au stockage : environ 40 % des α conservés après six mois à température ambiante. Généalogie : [Fuggle × (Serebrianka-Fuggle Seedling)] × OP. Sortie : 1972 pour l'enregistrement (d'après les références de la fiche). Aromatique : description qualitative.
3. Format : page HTML par accession ; une fiche par cultivar.
4. Couverture : 1 vérifié (Cascade). Les cultivars d'origine USDA de la liste (non vérifiés, à contrôler) incluent probablement Nugget.
5. Licence : aucune mention de droits sur la fiche ; « commercial cultivar, no restrictions » (vérifié). Le statut de domaine public USDA n'est pas affirmé sur la fiche et n'a pas été vérifié ailleurs.

### 14. OSU, Oregon State University

1. URL ouverte : https://guides.library.oregonstate.edu/beer_research/hops (guide de bibliothèque, vérifié). Extraits de congrès ASBC 2015–2017 (Shellhammer, Qian, Vollmer) : non ouverts.
2. Publie (vérifié, guide) : aucune donnée chimique par variété ; pas de thiols. Renvoie vers les fiches USDA ARS, le programme de sélection OSU, des ouvrages et archives. Extraits (non vérifiés) : linalol et géraniol corrélés au dry-hop aroma sur Cascade (2015) ; linalol (R) 92–96 % dans trois variétés ; géraniol corrélé au caractère citrus de Cascade (R² 0,44 et 0,50, 2014–2015).
3. Format : guide HTML, résumés de congrès PDF.
4. Couverture : 0 chiffrée sur les 32. Cascade qualitatif.
5. Licence : aucune licence de réutilisation vue. Pied de page © 2026 Oregon State University.

### 15. Autres sources scientifiques ouvertes (qualitatif)

- Purdy et al. 2021, Foods 10(2) 414, DOI 10.3390/foods10020414 (vérifié via PMC). Neuf cultivars NZ de la récolte 2017 : Nelson Sauvin, Riwaka, Motueka, Wai-iti, Waimea, Kohatu, Rakau, Wakatu, Taiheke. Analyse de composés volatils HS-SPME-GC-MS (61 composés discriminants). Pas d'huile totale ; pas de concentrations par variété dans le texte ; données « not publicly available due to confidentiality ». Caryophyllène cité pour Motueka, humulène-époxyde pour Wai-iti, géranyl acétate pour Taiheke. Farnésène et géraniol absents. CC BY 4.0.
- Molitor et al. 2022 (OSU, Shellhammer), Fermentation, PDF partiel : levure modifiée libère des thiols à partir de précurseurs de malt et de houblon, variété Cascade à faible dose. Chiffres de l'outil (3MH jusqu'à environ 73× la souche parentale ; 3MHA jusqu'à 8×) non confirmés par une lecture complète. Licence non lue.

## Biotransformation : ce qui existe

Liste des publications trouvées. « Vérifié » = lu sur la page ouverte ; « extrait » = résultat de moteur ; « ouverte » = accès libre confirmé.

1. **Svedlund N., Evering S., Gibson B., Krogerus K. (2022)** « Fruits of their labour: biotransformation reactions of yeasts during brewery fermentation », Appl. Microbiol. Biotechnol. 106(13–16) 4929–4944, DOI 10.1007/s00253-022-12068-w, CC BY 4.0. URL ouverte : https://pmc.ncbi.nlm.nih.gov/articles/PMC9329171/ (vérifié). Mini-revue, sans données originales. Mesure : libération de 3MH et 4MMP par la β-lyase à partir des conjugués cystéine et glutathion (conversion 0,1–0,5 % dans le moût, selon la revue) ; β-glucosidase libère des terpénols ; géraniol → β-citronellol (OYE2). Variétés citées : Cascade (précurseurs 3MH environ 6,5 mg/kg, environ 1000× le 3MH libre ; acétate de géranyle élevé), Nelson Sauvin (3S4MP et 3MP), Hallertau Blanc et Polaris (acétate de géranyle), Saaz et Willamette (date de récolte, huile). Pas de tableau par variété.

2. **Buiatti et al. (2023)** « Biotransformations Performed by Yeasts on Aromatic Compounds Provided by Hop — A Review », Fermentation 9(4) art. 327, CC BY (extrait). URL testée : https://air.uniud.it/retrieve/9436ea40-b83f-484f-ad23-8a62f748c920/fermentation-09-00327.pdf (403) ; DOAJ https://doaj.org/article/473c960368444352895ea2d28bc460cd (403). Non ouverte. Résumé (extrait) : β-glucosidase libère un terpène de son glycoside ; géraniol transformé surtout en citronellol, avec du linalol et du nérol. À relire avant usage.

3. **Roland et al. (2016)** « First identification and quantification of glutathionylated and cysteinylated precursors of 3-mercaptohexan-1-ol and 4-methyl-4-mercaptopentan-2-one in hops (Humulus lupulus) », Flavour and Fragrance Journal, DOI 10.1002/ffj.3337 (extrait ; DOI résolu vers Wiley, article non lu). Extrait : précurseurs glutathionylés et cystéinylés de 3MH et 4MMP identifiés ; plus de 99 % du 3MH sous forme de précurseur. Un extrait donne environ 20 mg/kg de conjugués 3MH pour Cascade, valeur en conflit avec les 6,5 mg/kg de Svedlund (non vérifié).

4. **Kishimoto T., Hisatsune Y., Fujita A., Yamada O. (2022)** « Presence of Disulfide-Bonded Thiols in Malt and Hops as the Precursors of Thiols in Beer », J. Agric. Food Chem. 70, 13413–13418. DOI non confirmé. PDF complet trouvé sur researchmap (non ouvert). Extrait : réduction au TCEP multiplie le 3MH par 8,9–9,9 et le 4MMP par 2,1–5,1 ; 65–82 % des 3MH liés par pont disulfure sont libérés pendant la fermentation.

5. **Serra Colomer et al. (2020)**, J. Inst. Brew., DOI 10.1002/jib.610 (DOI résolu, Wiley 403 ; non ouvert). Source secondaire : wiki. Brettanomyces, β-glucosidase, β-citronellol. Titre complet non confirmé.

6. **Grant-Preece et al. (2010)**, J. Agric. Food Chem. (extrait) : la conversion du glutathionyl-3MH en 3MH libre par la levure n'atteint que ~3 %. **Winter et al. (2011)**, Aust. J. Grape Wine Res. (extrait) : la libération de 3MH depuis le glutathion est moins efficace que depuis la cystéine, avec plus d'estérification en 3MHA. DOI non vérifiés.

7. **Molitor et al. (2022)** (OSU), Fermentation 8, art. 370 : voir section 15.

8. **OSU, abstracts ASBC 2015–2017** (extraits, non ouverts) : linalol et géraniol de Cascade associés à l'arôme de dry hop ; (R)-linalol 92–96 % dans trois variétés.

9. **Charles Faram, article thiols** (vérifié, sans chiffres) : liste des variétés à 4MMP (voir section 8).

Point de désaccord : la valeur Cascade de 6,5 mg/kg (Svedlund, vérifiée) et celle d'environ 20 mg/kg (Roland, extrait) ne concordent pas. Svedlund signale aussi que le rôle des β-glucosidases de levure dans les terpénols reste discuté pour le moût de bière.

## Ce qui reste introuvable

- **Farnésène, géraniol, β-pinène** : absents de presque toutes les fiches ouvertes. Valeurs vérifiées pour 3 houblons de la liste seulement : Ariana (farnésène 0,1 %, géraniol 0,2 %), Cascade (farnésène environ 4 %). β-pinène : jamais trouvé chiffré.
- **Linalol** : vérifié pour Ariana (≤ 0,4 %). Extraits pour Nugget, Nelson Sauvin et Motueka (Hopsteiner, non vérifiés). Absent pour la plupart.
- **Caryophyllène, humulène** : vérifiés pour Ariana (caryophyllène ≤ 5,4 %, humulène ≤ 18 %) et Cascade (humulène ~10 %). Saaz Late donne une plage mais pas de valeur par variété.
- **Intensités aromatiques notées** : une seule (Ahtanum, Charles Faram, intensité 7). Les autres fiches donnent des citations. Les profils Hüll et Aurora sont en graphiques non lus.
- **Thiols chiffrés par variété** : Ariana (10,7 µg/kg), Cascade (précurseurs 6,5 mg/kg ; Molitor partiel). Rien d'autre de vérifié.
- **Biotransformation chiffrée par variété** : aucune revue ouverte ne donne de tableau par variété.
- **Fiches Hopsteiner, Yakima, HGA Variety Manual, PDF LfL, Hallertau Blanc HPA, PDF Simcoe John I. Haas** : bloquées ou illisibles. À ouvrir autrement (navigateur, accès direct, demande).
- **Beer Maverick** : licence non trouvée ; son site n'a pas été ouvert.
- **NZ Hops** : aucun site officiel trouvé. **Hop Aroma Compendium** et **Product Guide** de BarthHaas : non trouvés.
- **Žatec Hop Company** : aucune entité distincte trouvée dans les résultats ; la source tchèque utile est le Chmelařský institut.

## Proposition d'ordre

Le brasseur doit trancher les points marqués « décision ». Aucune donnée n'a été importée.

### Réutilisable a priori (à confirmer avant tout usage)

1. **Revues CC BY 4.0 vérifiées** : Nesvadba et al. 2021 (plages d'huile et composants pour Saaz et Saaz Late), Purdy et al. 2021 (composés NZ, qualitatif), Svedlund et al. 2022 (biotransformation, qualitatif). La réutilisation d'une donnée doit citer la source et l'année ; ces revues ne fournissent pas de chiffres par variété hors plages.
2. **Fiche USDA ARS (Cascade)** : « commercial cultivar, no restrictions » est lu sur la fiche. Vérifier les autres fiches USDA pour les variétés de la liste dont l'origine est américaine (Cascade vérifiée ; Nugget probable, à contrôler).
3. **Cahier des charges Žatecký chmel** (registre UE, public) : à relire sur le registre officiel, qui donne les plages par composant pour Saaz.
4. **Brevets USPTO de plantes** : documents fédéraux, domaine public probable. Les PDF sont des images, illisibles en WebFetch ; un OCR serait nécessaire. Statut à confirmer.

### Décision du brasseur (pas de licence ouverte)

5. **BarthHaas** (fiches Ariana, Aurora, et PDF John I. Haas) : données les plus complètes vérifiées sur la liste (Ariana). Pages légales à lire.
6. **Hopsteiner** : copyright seul, fiches inaccessibles. Données d'extrait pour Nelson Sauvin, Motueka, Nugget. Demander les conditions ou un accord écrit.
7. **Yakima Chief Hops** : pages bloquées ; conditions non trouvées. Citra et Simcoe sont concernées.
8. **Charles Faram, HPA, Hopslist** : copyright déclaré, pas de licence ouverte.
9. **Hüll (GfH)** : réserve expresse contre la fouille de données, IA incluse. Pas d'import automatique ; un accord écrit serait nécessaire.
10. **HGA** : manuel non trouvé ; page « Policies » à lire.
11. **Beer Maverick** (base actuelle) : licence à trouver avant tout décision de réutilisation ou d'arrêt.
12. **HopDatabase (brewing.it.com)** : licence MIT annoncée dans un extrait, page non ouverte (429). À vérifier : les données restent celles des producteurs.

### Ordre suggéré pour réduire la dépendance à Beer Maverick

1. Revues CC BY (Nesvadba 2021 pour Saaz et Saaz Late ; Purdy 2021 pour Motueka et Nelson Sauvin), qualitatives ou en plages, sans décision lourde.
2. Fiche USDA Cascade, avec vérification des autres fiches USDA de la liste.
3. Décision du brasseur sur BarthHaas (Ariana, Simcoe, Nelson Sauvin, Cascade via John I. Haas) : c'est le gain le plus fort pour géraniol, linalol et caryophyllène.
4. Décision du brasseur sur Hopsteiner et Yakima pour Citra, Simcoe, Nelson Sauvin, Motueka, Nugget : pages à ouvrir autrement.
5. Ne pas utiliser les sources à réserve TDM (Hüll) ou non commerciales (CC BY-NC, Krofta 2003) sans accord.

## URL testées

### Ouvertes avec contenu lu
- https://www.barthhaas.com/en/hop-varieties/aurora
- https://barthhaas.com/en/hop-varieties/ariana
- https://charlesfaram.com/?p=46757
- https://charlesfaram.com/news/technical-article-introduction-to-thiols-in-hop-oils/
- https://hopslist.com/?p=214
- https://www.ars.usda.gov/ARSUserFiles/2450/hopcultivars/21092.html
- https://kvasnyprumysl.eu/index.php/kp/article/view/246
- https://www.hopfenforschung.de/en/?p=4497
- https://www.hopfenforschung.de/en/variety-list-2025-of-the-international-hop-growers-convention-ihgc/
- https://www.hopfenforschung.de/en/imprint/
- https://www.hopsteiner.com/
- https://hops.com.au/
- https://www.usahops.org/index.html
- https://guides.library.oregonstate.edu/beer_research/hops
- https://pmc.ncbi.nlm.nih.gov/articles/PMC7917646/ (Purdy et al. 2021)
- https://pmc.ncbi.nlm.nih.gov/articles/PMC9329171/ (Svedlund et al. 2022)
- https://www.hvg-germany.de (titre seulement)

### Ouvertes, PDF illisible (métadonnées seulement)
- https://pse.agriculturejournals.cz/pdfs/pse/2003/06/04.pdf
- https://mzv.gov.cz/file/1476506/zatecky_chmel_AJ.pdf
- https://hops.com.au/downloads/data-sheet/europe/Hallertau-Blanc-Data-Sheet.pdf
- https://www.johnihaas.com/wp-content/uploads/2015/01/Simcoe.pdf
- https://cdn.brewersassociation.org/wp-content/uploads/2020/05/CBC-Online-Seminar-Presentation-Development-of-Thiols-and-Thiol-Precursors-in-Different-Hop-Varieties.pdf
- https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/PP14127
- https://mdpi-res.com/d_attachment/fermentation/fermentation-08-00370/article_deploy/fermentation-08-00370.pdf (partiel)

### Redirections non suivies ou échecs
- https://doi.org/10.1002/jib.610 : redirection vers Wiley, Wiley 403.
- https://doi.org/10.1002/ffj.3337 : redirection vers Wiley, non suivie.
- https://www.yakimachief.com/commercial/hop-varieties.html : 403.
- https://www.yakimachief.com/ahtanum.html : 403.
- https://www.hopsteiner.com/variety-data-sheets/Nelson-Sauvin : 404 ; https://hopsteiner.com/variety-data-sheets/Nelson-Sauvin : 404 ; https://hopsteiner.com/variety-data-sheets/Motueka : 404 ; https://hopsteiner.com/variety-data-sheets/Sterling : 404.
- https://hops.com.au/motueka : 404.
- https://hops.com.au/downloads/data-sheet/australia/HPA-3029-Experimental-Data-Sheet.pdf : 404.
- https://hopsconnect.com/wp-content/uploads/2022/09/motueka.pdf : 403.
- https://lfl.bayern.de/mam/cms07/ipz/dateien/hopfen_alpha_tabelle_2024.pdf : 404.
- https://www.lfl.bayern.de/mam/cms07/ipz/dateien/hopfen_flavor_pocketguide.pdf : 404.
- https://lfl.bayern.de/mam/cms07/ipz/dateien/hopfen_aroma_alpha_2025_t3.pdf : 404.
- https://air.uniud.it/retrieve/9436ea40-b83f-484f-ad23-8a62f748c920/fermentation-09-00327.pdf : 403.
- https://doaj.org/article/473c960368444352895ea2d28bc460cd : 403.
- https://brewing.it.com/credits : 429 (deux essais).
