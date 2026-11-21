# Chasse Stock : regard « étagère et gestes » (STG), 21.11

Banc : build du tag `en-ligne/2026-11-21-tour8`, fixture « ZZ TEST » chaines (rayons, manques) complétée : 19 malts, 22 houblons, 11 levures, Additifs, Nettoyage, Emballage, fûts. 390 tactile (DSF 2). Le 1280 n'a pas été lu (voir « Non couvert »). Captures dans `%TEMP%/stg/caps` (`mur-390-clair.png`, `mur-390-cave.png`, `t3-tap1.png`, `t4-390-clair-01-legende.png`, `-04-filtre-houblons.png`, `-08-autres.png`, `t5-*.png`), ouvertes et regardées. Les gris des malts viennent de la fixture (noms hors catalogue), pas du produit.

## Étagère : les « un ou deux soucis »

**STG-1 · gênant (le plus probable : c'est sa capture)** Colonne « Autres » des Levures coupée à droite.
- Geste : Stocks › Articles › Étagère, 390, 10 à 11 levures. Attendu : toutes les colonnes visibles ou défilables. Constaté : titre « Autr », nom « BE-2 », marques S, K, T, B rognées ; sa capture montre « BE-256 · Sa » et « S S U » coupés au même endroit.
- Mesure : `[data-mur]` scrollWidth 517 pour clientWidth 354, `overflow: clip`. Rangée Levures : marques jusqu'à x = 440 pour un bord à 372, plateau tactile de 279 px de large (contenu 444). Les marques au-delà de x ≈ 372 sont donc aussi hors de portée du doigt. Aucun indice de défilement. Même défaut en thème cave.

**STG-2 · gênant** La bulle d'une marque touchée recouvre la rangée voisine.
- Geste : toucher un houblon de la rangée Hazy. Constaté : bulle noire « Galaxy · 60 g · α 14 % … toucher ici : la fiche › » (194 × 41 px, y 352) posée sur le bas de Malts et le haut de Houblons ; elle cache « Houblons 22 », « W. Coast » et les marques voisines au moment où l'on vérifie sa visée. `t3-tap1.png`.

**STG-3 · gênant** Marques de 8 px de large, pas de 10 px, pour du doigt.
- Mesure : 52 marques, largeur 8 px (levures 16 px) ; 22 houblons sur 280 px. Le toucher prend la marque la plus proche en x, sur toute la hauteur du plateau : un doigt de 40 px couvre 3 à 4 marques. Le second toucher ne vaut que sur la même marque : si la visée est fausse, il faut recommencer.

**STG-4 · gênant** « Légende » : bouton sous Levures, effet bien plus haut, 636 px d'un coup.
- Geste : toucher Légende. Constaté : le mur passe de 192 à 828 px, trois légendes (une par rangée) s'ouvrent au-dessus du bouton, la liste descend de 636 px. Phrases coupées sous le bouton + (« vin blanc, gros… », « épicé, h… »). Le bouton lui-même : 58 × 28 px. `t4-…-01-legende.png`.

**STG-5 · mineur (connu WX2-2, à ne pas recompter)** La ligne « Recherche « Citra » : 2 articles · Tout voir » ou « Filtre Houblons : 22 articles » s'insère au-dessus des onglets : le mur descend de 34 px (304 → 338) à chaque filtre, pastille, recherche. CLS lu 0 car l'observateur écarte les décalages suivant un geste, mais la vue saute bien.

**STG-6 · mineur** Libellés ambigus sous les colonnes : « ZZ · US-05 +1 10 » se lit « +110 » ; « BE-256 · Saccharomyces +36 · 1 » (texte DOM) est illisible. Le « +1 » et le nombre de sachets sont collés sans séparateur.

**STG-7 · mineur** Le tri n'agit pas sur l'étagère, mais la ligne « Trié par couleur (malts), amertume (houblons), date (levures) ▾ » est collée sous elle : on croit trier l'étagère. Ligne de 346 × 39 qui passe sur 2 lignes à 390. Feuille : couleur/amertume/date, nom A → Z, quantité, manque. À dire « Liste triée par … » ou à placer en tête de liste.

**STG-8 · mineur** Pastilles à zéro : « bas 0 », « à compter 0 », « DDM 0 » occupent 3 des 5 places (168 px) sans rien filtrer. Son rond à droite de « DDM 0 » (capture 01) : espace libre de la rangée, ou élément coupé à droite sur son téléphone. Non reproduit ici (les pastilles finissent à x ≈ 342), à revérifier sur sa capture.

**STG-9 · mineur** Recompter avec recherche active : la liste filtre (« Houblons 2 sur 22 ») mais les tuiles de famille gardent tous les comptes (Malts 19, Houblons 22… 0/19 comptés). La bascule Étagère ↔ Recompter ne saute pas (CLS 0,002).

## Cibles tactiles sous 44 px (écran Stocks, 390)
Étagère / Recompter 178 × **32** ; Articles, Courses, Fûts, Matériel, Houblons 70 × **28** ; pastilles 42 à 78 × **34** ; Ingrédients / Autres stocks 173 × 40 ; Légende 58 × **28** ; Épingler (étoile) **28 × 28** ; Lire l'échelle / Replier **32 × 32** ; Effacer la recherche **16 × 16** (pire cas) ; Période ‹ › 34 × 34 ; loupe 28 × 28. Gênant pour l'étoile et la croix (gestes répétés), mineur pour le reste.

## Autres stocks : ce qui y est, ce que l'étagère devrait montrer

**Constaté (`t4-…-08-autres.png`)** Deux onglets, puis 5 cartes texte en grille de 2 colonnes : Additifs 6 (1 manque · 1 épuisé), Emballage 4 (1 épuisé), Nettoyage 2 (1 manque), Fûts 10 › (3 pleins), Matériel 1 › (rien à signaler). La dernière carte reste seule, moitié de rangée vide. Toucher Additifs, Emballage, Nettoyage filtre la liste « Sels et additifs » dessous (plus de malts : déjà corrigé). Fûts et Matériel changent d'onglet. Aucune quantité, aucune unité, aucune barre, aucun rayon : seulement des comptes d'alertes. Le bloc de cartes prend ~370 px (y 608 à 980 à 390).

**Attendu (STG-10 · gênant, = STOCK-ETAGERE-AUTRES)** Le même objet que pour Ingrédients : un rayon par famille, une marque par article, hauteur selon la quantité dans l'unité du rayon, comme Malts (kg / g) ou Houblons (g).
- Rayon Additifs (g, ml) : une colonne par unité, car les échelles ne se comparent pas ; marques pour gypse, chlorure, acide lactique, Irish moss ; seuil en tirets (minStock) ; cadre rouge pour épuisé (Acide lactique 0 ml), pointillé pour « à compter ».
- Rayon Emballage (pièce) : bouteilles, capsules, étiquettes, cartons ; une unité, échelle en pièces (200 à 1000), seuil par exemple 100 bouteilles.
- Rayon Nettoyage (L, kg) : désinfectant, détergent, un sous-groupe par unité.
- Fûts (pleins / vides / à laver) et Matériel (nombre, état, « à réparer » en rouge) : une rangée de plus avec leurs icônes, le toucher ouvrant l'onglet, à la place de cartes séparées.
- Mêmes gestes : bulle au premier toucher, fiche au second, nom du rayon = filtre, légende commune réduite à « tirets = seuil, cadre rouge = épuisé, pointillé = à compter ».
- Le choix de présentation (rayons, ou colonnes d'unité) se montre en mini maquettes (règle n° 1), jamais en mots seuls.

## Non couvert (arrêt à 150 k)
Étagère à 1280 souris, thème cave au-delà de la capture du mur, fiche de l'article, onglets Courses / Fûts / Matériel / Houblons : non regardés par ce regard. Deux tours de gestes joués (bulle, filtres, pastilles, Légende, tri, recherche, Recompter, Autres stocks) : le second n'a pas ajouté de défaut, mais un tour 1280 reste à jouer.

Bilan : 10 défauts. Gênants : STG-1, 2, 3, 4, 10. Mineurs : STG-5, 6, 7, 8, 9. Bloquants : 0. Étoile et croix de recherche sous 44 px : à classer gênants.
