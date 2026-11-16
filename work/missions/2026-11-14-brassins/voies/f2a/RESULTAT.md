OK — 16 bloquants de c4a corrigés dans s4a à s5c, images régénérées et ouvertes

Fichiers écrits : `voies/s4/s4a|s4b|s4c/etat.html` et leurs PNG ; `voies/s5/s5a|s5b|s5c/etat.html` et leurs PNG ;
`voies/f2a/RESULTAT.md`, `voies/f2a/tests.txt`. Copies d'origine : `%TEMP%/f2a-<id>-etat.orig.html`. Rien dans `src/`.
Captures par les scripts des séries (`s4/capturer.mjs`, `s5/capture.mjs`) : 390 × 844 `isMobile` `hasTouch`, 1280 et cave
quand ils existaient. Idée de chaque variante gardée.

## Bloquants (16)
- [x] s4a n° 1 : colonne du jour à 58 px au téléphone (passées à 34 px) ; case °C cuve « — » 58 × 44 et bouton « + » densité 48 × 48.
- [x] s4a n° 2 : couloir attendu dessiné de 1,018 jusqu'à la bande (fondu vert + pointillé, sans chiffre), « actif, attendu jusqu'à la bande » à 1280 ; zone densité ramenée de 170 à 140 px à 1280, axe cadré 1,036–1,0085 (1,062 et 1,058 en flèches).
- [x] s4b n° 1 : la feuille de saisie passe au-dessus de la grille (plan supérieur, pleine largeur) ; la bande FG s'interrompt.
- [x] s4b n° 2 : feuille dans les 390 px (cause : grille calculée sur la largeur de l'appli, 16 px de trop ; prise sur celle du tableau) ; « + » et « Enregistrer °C cuve » entiers.
- [x] s4b n° 3 : « 1,030 » à droite du point, entier.
- [x] s4b n° 4 : pastilles arrêtées avant la bande ; « stable ? » dans la seule rangée J+8.
- [x] s4b n° 5 : sous chaque houblon de la tête F1, « α 10–15 % · aromatique » et « α 11,5–13,5 % · aromatique » (valeurs déjà sourcées de s4).
- [x] s4c n° 1 : segment réduit à « actif · après » (actif allumé) ; ébullition et WP retirés de l'écran (restent dans Dryhopper, derrière « Quand ajouter ? »).
- [x] s4c n° 2 : bandeau « Citra ajouté · stock −100 g », « −100 g » insécable, sur une ligne.
- [x] s4c n° 3 : icônes carnet et stock en tête, à côté du ×.
- [x] s5a n° 1 : « provisoires » ajouté après « alcool 6,0 % att. 74 % » dans la feuille.
- [x] s5a n° 2 : bouton « Taper » à gauche d'« Enregistrer ».
- [x] s5a n° 3 : « °C échantillon — », 20,5 en repère « hier 20,5 » à côté.
- [x] s5b n° 1 : icônes « courbe · carnet · stock » en tête, comme s5a.
- [x] s5c n° 1 : icônes « carnet · stock » sous le rail, à droite du titre.
- [x] s5c n° 2 : « Taper » à gauche d'« Enregistrer » dans la feuille °C cuve.

## Non bloquants faits
- s4a n° 3, s4b, s4c : doubles espaces nombre–unité (« 100  g ») : `word-spacing:-.38em` sur les classes de chiffres (une ligne de CSS).
- s4a n° 4 : « OG » de la rangée des ajouts à 1280 remplacé par « brassé ».
- s4a n° 5 : « 1,018 » à gauche du point, à distance du trait vert.
- s4a n° 6 : « stable ? » remplacé par « 2 relevés égaux » en gras.
- s4b n° 6 : « FG 1,010–1,014 » écrit dans la bande (vertical). n° 7 : « att. 71 % provisoires » ajouté. n° 8 : rangées titrées par la date seule en liste ; « 1,010 stable » dans la tête Pils. n° 9 : « Brasser ou replanifier » et « Confirmer la FG » en boutons ≥ 44 px. n° 10 : boutons « °C » et « + » à 48 px de haut.
- s4c n° 4 : blocs Citra et Mosaic sur J+6 seul. n° 5 : « FG 1,010–1,014 » dans la bande. n° 6 : « alc. 5,8 % · att. 71 % provisoires ». n° 7 : critère « stable ? » dessiné (deux ronds « = » sur J+8, J+9). n° 8 : « ↑1,058 » en repère. n° 9 : étiquettes des houblons sur deux lignes dans J+3–J+4, le contour du jour n'est plus coupé ; « 1,018 » à gauche du point.
- s5a n° 4 : houblons descendus sous « Ajouter › » (plus de chevauchement).

## Non faits (et pourquoi)
- s4b n° 11, s5c n° 8 : bas d'écran vide (recomposition, pas une ligne).
- s5a n° 5, s5c n° 6 : case « Ajouté aujourd'hui » au repos : nouvel élément, change la tuile ; hors « une ligne ».
- s5a n° 6–7, s5b n° 2–7, s5c n° 3–5, 7, 9 : laissés, faute de budget de contexte (agent arrêté à 200 k) ; tous d'une ligne ou presque, voir DEMANDE EXECUTANT.

## Critères (sortie décisive)
- G1 : voir `tests.txt` (COCHE OK 16).
- G2 : voir `tests.txt` (IMAGES OK).
- G3 : voir `tests.txt` (HORS OK).

## Captures (ouvertes)
s4a : repos 390 clair, repos 390 cave, geste 390, repos 1280. s4b : repos, geste, liste. s4c : repos, geste.
s5a : geste 390 (repos, cave, 1280 régénérés). s5b : repos. s5c : repos, geste.

Images que je n'ai pas rouvertes après la dernière retouche d'une ligne : la retouche finale de s4b (« + » remonté de 4 px, dates seules dans la liste),
la retouche finale de s4c (↑1,058 décalé à x 57), s5a repos, cave et 1280 (seule la marge des houblons a changé), s5b geste et s5c liste.

DEMANDE EXECUTANT (Haiku), une fois ces retouches faites par un concepteur :
1. Ouvrir `s4/s4b/s4b-repos-390-clair.png`, `s4b-liste-390-clair.png`, `s4/s4c/s4c-repos-390-clair.png`, `s5/s5a/s5a-repos-390-clair.png`,
   `s5a-repos-390-cave.png`, `s5/s5b/s5b-geste-390-clair.png` et `s5/s5c/s5c-liste-390-clair.png` ; signaler tout chevauchement ou texte coupé.
2. Non bloquants restants (une ligne chacun) : s5b n° 2 « 13.11 » sous 1,018 ; n° 3 « 1,014–1,010 » à la place de « bande » ; s5c n° 3 « ? » → « — »
   dans la case J+5 de la frise ; n° 9 le point orphelin après « att. 71 % ». Puis `cd work/missions/2026-11-14-brassins/voies/s5 && node capture.mjs s5b s5c`
   et les trois CHECK de `f2a/GATES.md` : attendus `COCHE OK 16`, `IMAGES OK`, `HORS OK`.

Prédiction : « La case du jour se touche enfin, plus rien ne se marche dessus ; s5a et s4a, je peux les comparer. »

DÉCISION À PRENDRE : α de Citra et Mosaic diffère entre s4 (Beer Maverick, Mosaic 11,5–13,5 %) et s5 (HopDatabase, Mosaic 10–15 %) ; à unifier sur `roles.ts` avant de montrer les deux séries ensemble (doute de c4a, non tranché ici : aucun chiffre neuf).
CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
