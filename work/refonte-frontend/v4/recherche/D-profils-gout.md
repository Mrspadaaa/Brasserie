# D — Profils de goût : comment les apps grand public montrent un profil, un écart, une reco, une comparaison

Recherche du 18.10.2026 (chercheur design, Sonnet 5.5). Sources web consultées le 18.10.2026.

**Preuve.** **[V]** = vu par moi : page rendue dans Chrome à 390 px, HTML ou données de la page, image publique, ou captures du dépôt.
**[R]** = relayé : résumé d'une recherche, d'une fiche App Store ou d'un article, page non relue.
**[N]** = non confirmé. Les pages protégées (Distiller, Untappd fiche bière, Beer Maverick en direct, roue Hop Union archivée) ont répondu 403 ou « Un instant… » : je ne les ai pas vues. Les numéros `[n]` renvoient à la section Sources.

---

## 1. Tableau des motifs

Mesure « 5 s » : ce qu'on lit sur un téléphone en cinq secondes, sans toucher.

| App (preuve) | Motif exact | Texte | Incertitude | Comparaison / reco | Lisible en 5 s |
|---|---|---|---|---|---|
| **Vivino, page vin** [V] [1] | 4 pistes à deux pôles (Light–Bold, Smooth–Tannic, Dry–Sweet, Soft–Acidic). Une **pastille de largeur fixe** posée sur la piste (position = (valeur − 1) / 4 sur une échelle continue 1–5). Dessous, **3 cartes** : icône, 3 mots, « 345 mentions of oaky notes », « Show all ». | ≈ 45 mots, dont 8 mots de pôles | Largeur de pastille fixe (vue sur un vin). Le compte existe dans la donnée (217 avis de structure) et dans une phrase « based on N user reviews », mais **n'est pas affiché** sur la page vin (390 et 1 280 px). Affiché sur la page style [2] : « Based on 152,636 reviews of 3,405 wines ». Seule trace visible : « N mentions ». | Aucune comparaison de vins. La page style reprend les 4 mêmes pistes : on compare à l'œil entre deux pages, sans superposition. | **Très bon** : 4 lignes + 3 cartes |
| **Vivino, Match for You** [R] [3] | Un pourcentage sur la page vin, 3 paliers nommés : 70–100 Great, 40–70 Average, 0–40 Low. | 1 nombre, 1 mot | Aucun score avant 5 vins notés. Défini comme « confiance que tu notes ≥ 4 étoiles ». | Classe les vins ; n'explique pas par axe. | Très bon, mais opaque |
| **Fragrantica, accords principaux** [V] [5] | **Pile de barres** pleine largeur, triées, **libellé dans la barre**, une couleur fixe par accord. Largeur **et** opacité portent le poids : sur l'exemple Aventus, 100 %, 69, 68, 64, 60, 57, 56, 52, 52, 47 % (10 barres). Aucun chiffre. | 10 mots | Rien dans le motif. Votes au survol [R] [6] ; sous 15–20 votes, la pile est peu fiable ; les nouveautés ont des barres égales [R] [7]. | Aucune. Échelle relative au 1er accord : ne se compare pas d'un parfum à l'autre. | **Très bon** : « fruité, sucré, boisé » |
| **Flaviar, Flavor Spiral** [V image, R texte] [8] [9] | **9 illustrations d'ingrédients** sur une spirale, étiquettes en capitales monospace. La taille semble porter le poids (maple syrup le plus grand) : non documenté par Flaviar. | 9 mots | Aucune. Synthèse d'avis de la communauté, poids plus fort aux experts. Pas de compte. | Article 2015 : 2 puis 3 spiritueux « côte à côte », sans repère commun. | Plaisant, **non quantitatif** |
| **Distiller** [R, N] [10] [11] | « Flavor profile » par bouteille, décrit par des utilisateurs comme une « vague », plus un graphe d'étiquettes ; remonté en tête de fiche depuis la v7.50. Catégories colorées. Aspect exact non vu. | peu | Non trouvée. Les étiquettes des utilisateurs mettent le profil à jour. | Recherche par saveur réservée au Pro. Un avis de 2018 demande des curseurs « plus fumé / moins sucré » : absents. | Non vérifié |
| **Untappd** [V partiel, R] [12] | Puces « Flavor Profile » cochées par check-in (Juicy, Citrusy, Hazy, Smooth). Pas d'intensité. | 4 mots | Aucune ; pas d'agrégat trouvé. | Aucune. | Bon, mais répond à autre chose |
| **Beer Maverick** [V captures du dépôt] [13] | Radar à 9 axes (0–5), 3 polygones superposés, plus barres de plage par mesure sur échelle commune. | Lourd : une phrase par houblon, une ligne d'explication par mesure, 7 écrans | Note « zéro = pas de donnée ». | 3 houblons max ; couleur seule (rouge/vert), pas de lecture de l'écart. | Moyen : radar rogné à 390 px |
| **Yakima Chief, page variété** [V rendu] [14] | **3 à 5 puces d'arôme** (Citrus, Stone fruit, Tropical, Woody), sans intensité. Valeurs en plage sur **échelle fixe du catalogue** (alpha 10,0–16,0 sur 0–70). « Variétés similaires » = tableau de 5 colonnes. Sur les lots, barres CATA par catégorie (15 : Sweet, Aromatic, Berry, Stonefruit, Pomme, Melon, Tropical, Citrus, Floral, Herbal, Vegetal, Grassy, Earthy, Woody, Spicy) [R]. La roue Hop Union (≈ 2013, 11 catégories) est retirée [R]. | modéré | CATA = **% d'évaluateurs** qui cochent la catégorie. Avertissement : l'analyse sensorielle d'un houblon n'indique pas forcément le goût en bière [R]. | « Similaires » choisis par l'équipe sensorielle. | Puces : bon. Comparer : faible |
| **Charles Faram, BarthHaas** [R] [15] | Puces à icônes séparées **« In the beer » / « In the rub »**, un seul nombre « Flavour Intensity: 8 ». Pas de graphique. | léger | Distingue houblon cru et bière. | Aucune. | Bon |
| **Roue des saveurs SCA/WCR** [R] [17] | Roue hiérarchique, centre vers bord, couleur par famille, 110 attributs. Sans intensité ; la SCA sépare « descriptif » et « affectif ». | ≈ 100 mots | — | — | **Non** : outil de vocabulaire |
| **Visualizer.coffee, Cupnote, Cuppy** [R] [18] | Toile d'araignée, 7 dimensions, 0–15 (fragrance, arôme, saveur, arrière-goût, acidité, douceur, texture). Page de comparaison de 2 tirages. | peu | — | 2 à la fois « d'un coup d'œil ». | Moyen. Beanconqueror : cupping SCA ou « arômes / saveurs », graphique non confirmé [N]. Fellow : profils d'infusion, aucun profil gustatif trouvé [N]. |
| **Étiquettes de torréfacteurs** (Rosso, Roastworks) [R] [19] | 3 à 4 jauges 0–5 : douceur, acidité, corps, torréfaction, plus puces de notes. | 4 mots + 4 chiffres | Aucune (note d'éditeur). | — | **Très bon** |
| **Spotify, audio features** [R] [20] | Valeurs 0–1 par attribut. L'app ne les montre pas ; les outils tiers tracent un radar à 5–7 axes (un projet descend à 4 pour la lisibilité). | — | Certains attributs sont des « mesures de confiance » 0–1. | L'API recommandation prend `target_*` (classe par proximité) et `min_*` / `max_*` (filtre dur). Fermée aux nouvelles apps depuis le 27.11.2024. | Radar tiers : moyen |
| **Pour Decisions, « Flavor EQ »** [R, app mineure] [21] | 4 curseurs (acide, corps, épice, douceur) ; les vins se recalent en temps réel. | 4 mots | — | Reco par poussée de curseur. | À tester |

**Hors goût, mais ce sont eux qui répondent à « face à ce que le style attend »** :

| Source (preuve) | Motif | Intérêt pour nous |
|---|---|---|
| **Brewfather, designer** [R] [22] | Pour chaque mesure (ABV, OG, FG, couleur, IBU) : barre horizontale avec **zone ombrée = plage du style**, repère de la valeur courante, vert si dans la plage, double coche si tout est dans le style. | Même grammaire que la jauge IBU à bande de style du brief. Aucune app trouvée ne le fait pour les arômes [N]. |
| **Apple Météo, 10 jours** [R] [23] | Barre de plage par jour sur une **échelle commune** aux 10 jours, point blanc = maintenant. | « Plage + repère » lisible en 2 s. Critique : les bornes basses zigzaguent. |
| **Bullet graph (Few)** [R] [24] | Une mesure, 2 à 5 plages qualitatives en intensités d'une teinte, un trait comparatif perpendiculaire. | Grammaire formelle de la piste « style ». |
| **Carte des malts Diageo** [R] [25] | Carte 2D (délicat–fumé × léger–riche) : position **relative** aux autres. | Vue d'ensemble « carte » ; aucune échelle absolue. |

---

## 2. Ce que ça dit

- **Les motifs qui passent les 5 s tiennent à 10 lignes et ≈ 50 mots** : Vivino (pastilles) et Fragrantica (barres triées). Aucun des deux ne montre l'incertitude ni une référence.
- **L'incertitude n'est presque jamais dans le motif.** Elle vit dans un nombre écrit (Vivino « N mentions »), un seuil (Vivino : 5 notes), un zéro qui veut dire « pas de donnée » (Beer Maverick) ou un avertissement (Yakima Chief ; Charles Faram sépare « rub » et « beer »).
- **Chez les fournisseurs de houblon, l'étiquette domine.** Les intensités viennent de radars 0–5 à 6–12 axes sur « dry rub » [16], de Beer Maverick, ou des lots Yakima (CATA). Les 15 catégories Yakima [R] recoupent nos 12 familles.
- **Aucune app grand public trouvée ne place un profil aromatique face à ce qu'un style attend**, ni ne propose « plus de X » depuis un profil existant [N]. Brewfather le fait pour les chiffres brassicoles seulement.
- **Radar** : dès 3 ou 4 séries, les polygones se recouvrent [26]. La position sur une échelle commune est l'encodage le plus précis ; angle et aire, les moins précis [27].

---

## 3. Les 5 motifs les plus transposables à notre écran

### 1. Piste à bande de référence + repère (Brewfather, bullet graph, Météo, pastille Vivino)

- **Où** : la feuille « Au style », une rangée par famille.
- **Garder** : la zone du style ombrée, un repère « ma bière » posé dessus, un mot d'état (Brewfather : vert si dans la plage ; Few : les plages « déclarent l'état »). Vivino pose une pastille sur une piste, sans barre partant de zéro.
- **Adapter aux échelles relatives au style** :
  - La piste est zoomée sur la bande du style plus une marge. Yakima Chief (échelle fixe 0–70) et Fragrantica (relatif au 1er) font l'inverse et écrasent ou effacent l'écart.
  - La pastille de Vivino a une largeur fixe ; **chez nous, la largeur est la plage prédite**.
  - L'écart se dit en **largeurs de bande**, avec « ≈ » quand les plages se recouvrent ; pas en points.
  - Le zoom casse la comparaison de longueur entre rangées : écrire les bornes de piste et laisser le mot d'état porter la comparaison.
  - Hors style : hachures, pas rouge/vert seuls (daltonisme). Style sans bande documentée : échelle absolue, annoncée.

### 2. Mini-profil trié, libellé dans la barre, 3 puces dominantes (Fragrantica, cartes Vivino, Yakima Chief)

- **Où** : la liste « Mes houblons » et la fiche d'un houblon.
- **Garder** : au plus 10 barres, ou 3 puces + « Show all » (Vivino : 3 cartes d'abord, tout ensuite) ; libellé dans la barre ; tri ; aucune valeur écrite.
- **Adapter** :
  - **Ne pas normaliser au plus fort du houblon** (Fragrantica) : deux houblons très différents auraient la même barre pleine. Largeur = position dans la bande du style.
  - Trier par pertinence au style (familles attendues, puis indésirables), pas seulement par intensité.
  - Pas de couleur par famille (Fragrantica en utilise ≈ 10) : chez nous l'EBC et les 4 couleurs de comparaison sont prises. Libellé + une seule teinte.
  - Remplacer « N mentions » par « n sources » + « estimé » (voir 5).

### 3. Comparer 2 à 4 en barres à échelle commune ; radar en bascule (Beer Maverick, Visualizer, Flaviar)

- **Garder** : une grammaire répétée par famille, un repère par houblon **sur la même piste** (constat du dépôt sur Beer Maverick : « on voit d'un coup d'œil » qui a le plus d'alpha).
- **Adapter** :
  - Échelle du style commune aux 2 à 4 repères ; **nom sur chaque repère** (défaut de Beer Maverick : couleur seule) ; 4 couleurs et 4 formes (acquis v3).
  - D'abord les 3–4 familles que la direction poussée concerne, puis « toutes » ; une ligne **écart signé vs ma bière** plutôt que 12 pistes.
  - Radar en bascule, comme l'exige le brasseur (Barres / Radar, acquis). Recommandation : prévenir dès 4 séries que le radar se lit mal.
  - Beer Maverick rogne le radar à 390 px : prévoir les libellés avant de dessiner.

### 4. Direction, puis re-classement en direct (Spotify `target`/`min`/`max`, Pour Decisions, Vivino à 3 paliers)

- **Garder** : une cible classe par proximité, un min/max filtre dur ; peu de curseurs (4 chez Pour Decisions) ; des **paliers nommés** plutôt qu'un pourcentage (Vivino : 70 / 40).
- **Adapter** :
  - « Plus floral » = monter d'un cran de bande, pas viser une valeur absolue.
  - Résultat en 3 mots sur l'écart restant, en largeurs de bande (« comble », « rapproche », « à peine ») : PRODUCT.md refuse d'inventer un chiffre.
  - Seuil minimal comme Vivino (≥ 5 vins) : pas de voie tant que le houblon n'a pas de descripteur (« inconnu », jamais 0).
  - Aucun précédent grand public trouvé : à valider en test d'usage.

### 5. Incertitude lisible sans quitter la rangée (Vivino, Fragrantica, Beer Maverick, Yakima Chief, Charles Faram)

- **Garder** : le nombre de sources écrit près du motif, « pas de donnée » au lieu de 0, la séparation « cru / en bière » (Faram) et l'avertissement de Yakima Chief.
- **Adapter** :
  - Plage prédite = largeur du repère ; « ≈ » au recouvrement.
  - Trois états de trait : **mesuré** (plein), **estimé** (pointillé), **inconnu** (vide).
  - Les apps de masse taisent l'incertitude ; chez nous le verdict d'écart en dépend, donc c'est un différenciateur.
  - Les quantile dotplots améliorent la décision [28] mais 20 points ne tiennent pas dans 24 px : les réserver à la fiche détail.

---

## 4. À écarter

- **Roue SCA, spirale Flaviar** : vocabulaire et plaisir, pas de lecture quantitative.
- **Couleur par famille** (Fragrantica) : conflit avec les couleurs déjà prises.
- **Normalisation au plus fort** (Fragrantica) et **échelle fixe de catalogue** (Yakima Chief) : les deux contredisent « les échelles relatives au style ».
- **Une ligne d'explication par mesure** (Beer Maverick) : utile en lecture longue, trop de texte pour la feuille ; à garder à la demande.
- **Radar à 4 séries ou plus.**

## 5. Limites

- Non vus : Distiller, Untappd (fiche bière), Beer Maverick en direct, roue Hop Union. Les barres CATA des lots Yakima reposent sur un relais.
- Vivino : un seul vin vu ; la formule de position est déduite de 3 valeurs de la donnée, pas documentée.
- Le sens de la taille (Flaviar) et de la largeur (Fragrantica) vient de l'observation, pas des éditeurs. Fragrantica : lu dans le HTML, pas de capture regardée (bannière de consentement).
- Aucune capture tierce n'est copiée dans le dépôt : les liens ci-dessous sont des pages vivantes ou des images publiques.

## 6. Sources

1. Vivino, page vin (section « What does this wine taste like? », rendue côté client) : https://www.vivino.com/US/en/vieux-chateau-des-combes-saint-emilion-grand-cru/w/1165047
2. Vivino, page style (4 pistes + « Based on 152,636 reviews ») : https://www.vivino.com/en/wine-styles/italian-nebbiolo
3. Vivino, Match for You : https://www.vivino.com/wine-news/introducing-match-for-you
4. Vivino, galerie de captures de flux (7 écrans, accès partiel) : https://screensdesign.com/showcase/vivino-buy-the-right-wine
5. Fragrantica, Aventus (bloc « main accords ») : https://www.fragrantica.com/perfume/Creed/Aventus-9828.html
6. Osmetheca, lecture d'une fiche Fragrantica : https://osmetheca.be/en/guides/how-to-read-a-fragrantica-entry
7. Forum Fragrantica, calcul des accords : https://www.fragrantica.com/board/viewtopic.php?id=203769 (réponse 403 pour mes outils, relayé)
8. Flaviar, article Flavor Spiral (2015) : https://flaviar.com/blogs/flaviar-times/flavour-spiral
9. Image publique de l'article : https://flaviar.com/cdn/shop/articles/img-1743774509968_0649c593-4376-4e66-aedc-fb88049699cf.jpg?v=1743774630&width=1680
10. Distiller, App Store : https://apps.apple.com/app/distiller/id784925833
11. The Spirits Business, Distiller 2.0 : https://www.thespiritsbusiness.com/?p=61350
12. Untappd, notes 4.0.6 : https://updates.untappd.com/post/663212272980721665/406-update ; exemple de check-in : https://untappd.com/user/lukeschull/checkin/1569917027
13. Beer Maverick : captures du brasseur dans `work/refonte-frontend/v3/reference/beer-maverick/` (`telephone/t3-radar-3-houblons.jpg`) et `constats.md` ; direct : https://beermaverick.com/hop/citra/
14. Yakima Chief, variété : https://www.yakimachief.com/citra.html ; lots : https://tools.yakimachief.com/lookup?lots%5B%5D=23-WA346-027 ; roue Hop Union archivée : https://homebrewfinds.com/hops-aroma-wheel
15. Charles Faram : https://charlesfaram.com/hop-oracle/vic-secret/ ; BarthHaas : https://www.barthhaas.com/hops-and-products/hops/vic-secret
16. BeerSmith, données sensorielles du houblon : https://beersmith.com/blog/?p=14787
17. SCA, mode d'emploi de la roue : https://sca.coffee/sca-news/how-to-use-the-flavor-wheel-in-eight-steps-ab2hy ; CVA : https://sca.coffee/value-assessment
18. Visualizer.coffee : https://visualizer.coffee/updates/tasting-assessments ; Cuppy : https://mwm.ai/apps/cuppy-cupping-caf/6749718516 ; Cupnote : https://mwm.ai/apps/cupnote/6480165506 ; Beanconqueror : https://github.com/graphefruit/Beanconqueror ; Fellow : https://apps.apple.com/us/app/fellow-brew-with-aiden/id6612024910
19. Rosso : https://rossocoffeeroasters.com/blogs/rosso-journal/sweetness-acidity-and-body ; Roastworks (Ocado) : https://www.ocado.com/products/roastworks-colombia-whole-bean-coffee/428624011
20. Spotify, recommandations : https://developer.spotify.com/documentation/web-api/reference/get-recommendations ; changements du 27.11.2024 : https://developer.spotify.com/blog/2024-11-27-changes-to-the-web-api ; audio features (miroir de la doc) : https://spotify.js.org/interfaces/AudioFeatures.html ; radar tiers : https://github.com/Sarsoo/Selector
21. Pour Decisions : https://apps.apple.com/us/app/-/id6760296783
22. Brewfather, designer : https://docs.brewfather.app/recipes/designer
23. Apple Météo : https://macmost.com/getting-the-most-from-the-iphone-weather-app.html ; https://leancrew.com/all-this/2024/06/the-unbearable-sorrow-of-apple-weather/
24. Bullet graph (résumé de la spécification de Few) : https://betterevaluation.org/node/1784
25. Carte des malts Diageo : https://www.aiai.ed.ac.uk/project/i-room/resources/vwow/tutorial/Malts-Flavour-Map.pdf ; https://scotchaddict.com/classic-malts-flavour-map.html
26. Critiques du radar : https://observablehq.com/blog/avoid-radar-charts ; https://blog.scottlogic.com/2011/09/23/a-critique-of-radar-charts ; https://significancemagazine.com/off-the-radar-here-are-some-alternatives/
27. Cleveland et McGill, hiérarchie des tâches perceptives (cours, secondaire) : https://courses.cs.washington.edu/courses/cse442/25au/lectures/CSE442-Perception.pdf
28. Kay et al., quantile dotplots : https://idl.uw.edu/papers/when-ish-is-my-bus ; https://mucollective.northwestern.edu/project/uncertainty-bus
