# s1 — Comparer dans la langue de cmc2k (froide, passe 2, 09.11)

Idée : trois colonnes de couleur (bleu, rouge, teal, comme Cascade · Idaho 7 · Galaxy) ; chaque mesure est une rangée à axe commun, la plage de chaque levure en bande ; la levure de la recette US (Wyeast 1056) est la référence teintée, les deux autres s'achètent en CH.

## Ce qui vient d'où
- cmc2k : onglets des vues en tête, question en titre, puces de contexte (30 L · 1,066 · 19 °C), colonnes à liseré de couleur, ⇄ et × sous chaque colonne, ⊕ pour une colonne libre, colonne de référence teintée (Idaho 7 en rose → 1056 en bleu pâle).
- r3 resserré / s1 Malts : en-tête « ‹ Levure 4/7 », fil des 7 étapes, bandeau 8,0 kg · 1,066 · 45 · 12, pied Retour · Suivant — Paliers, + flottant.
- Ses mots du 09.11 : « je trouve une recette US avec une levure us … une levure de chez nous avec toutes ses info dont son impact sur le houblon » → cadre 1 : 1056 réf. · US-05 · Verdant ; rangées « Arômes » (écart à la référence) et « Biotransfo. ».
- Disponibilité : offre vue (icône boutique + pays) ; fabricant européen (icône usine, tireté) ; nord-américaine « rare » (globe, tireté) — jamais « indisponible ». Aucun prix au repos.

## Cadres
1. Repos : 1056 réf. · US-05 · Verdant. 2. Toucher : floculation US-05 → « recherche… · 3/20 » sur place. 3. Résultat : « moyenne à haute · fiche Fermentis · 2026 · à confirmer · 0,35 CHF · Garder / Corriger » — **valeur fictive**, le reste de l'écran est vrai. 4. Cas limite : US-05 réf. · S-04 (température, floculation, dose inconnues → « chercher », « choisis le sachet pour la dose ») ; sucres résiduels 11 et 18 g/L (mesure fabricant, TDS 2018).

## Honnêteté (sources : yeastCatalogueBootstrap.json, yeastSupplyBootstrap.json, savoir/TROUS-COMBLES.md)
- 1056 : 73–77 %, 16–22 °C, 11 %, floculation faible à moyenne, « très net, esters légers », pas de dose en fiche → « paquet · à renseigner » ; FG 1,015–1,018, 6,3–6,7 % (calcul OG 1,066 × atténuation, ×131,25).
- US-05 : 78–82, 18–26, 9–11, esters faibles, floculation absente → chercher, biotransformation « non documentée » (la source le dit), 2–3 sachets (15–24 g) ; CH Brau- und Rauchshop, vu le 27.09.
- Verdant : 75–82, 18–25, 12, moyenne, abricot · tropical (aroma), β-lyase déclarée et thiols forts (TDS et tableau Lallemand, sans chiffre), 2–3 sachets ; CH.
- S-04 : 74–82, 9–11, esters faibles + alcools sup. moyens, phénols négatifs ; pas de température, floculation, dose → chercher. FG 1,012–1,017, 6,4–7,1 %.
- Inconnu = gris uni clair (son choix G), picto « chercher » nommé (loupe étoilée + mot). Visée 19 °C en trait tireté sur chaque bande de température.

## Boosters UX (boosters-ux)
- bandes-axe-commun — comparer ; bande par levure sur un axe gradué par rangée ; effet : la plage se lit sans chiffre.
- chercher-inconnu — déclencher ; cellule grise → « recherche… » → résultat à confirmer (cadres 1 → 2 → 3).
- B1 OK · B2 OK (la grille domine, un seul noir plein : Suivant) · B3 ~ (70 mots hors données ; 126 en défaut, cmc2k : 92–102) · B4 OK · B5 OK · B6 OK (13/14/17 px, mono pour les mesures) · B7 OK (gris uni = inconnu, toujours avec un mot) · B8 OK (inconnu, recherche, résultat, fiche incomplète) · B9 s.o. (statique) · B10 s.o. · B11 OK « 1056 et US-05 se valent, Verdant plus fruitée et documentée pour le houblon ; seule 1056 est rare » · B12 OK · B13 OK (⊕ 36 px, ⇄ × 28 px).
- Écart voulu : rangée « Biotransfo. » deux fois « non documentée » sur trois : c'est l'état réel des fiches, montré plutôt que caché.

## Contrôles
PAGE OK · MOTS 70 hors données (126 en défaut) · PANEL : voir RESULTAT · CHOIX : `levure` ouvert au registre (REGISTRE OK, 8 écrans) · aucune valeur brute anglaise.
