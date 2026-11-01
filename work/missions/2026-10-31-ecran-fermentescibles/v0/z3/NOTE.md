# z3 — la facture en pavés : chaque malt occupe sa part de l'écran (chaude)

- **Chaleur** : chaude, forme libre.
- **Axes** : A1 **une carte par ingrédient, à l'aire de sa part** (pavés) · A2 masse tapable dans le pavé, en grand (20 px), ↑↓ · A3 champ toujours ouvert sous la surface, famille qui tourne · A4 le pavé prend la teinte du malt ; hachuré « ? » tant qu'elle manque.
- **Idée** : la surface est la recette. On coupe l'écran en deux groupes de masse proche, le long du grand côté, et on recommence ; Pilsner prend 63 % de la surface. Toucher un pavé, c'est taper sa masse ; une ligne à 0 kg n'a pas de surface : elle attend sous les pavés.

## Baseline (J12, J5), cochée
- [x] en-tête, fil, bandeau, pied, + flottant, tels quels.
- [x] ligne (pavé) : nom, moment, part, masse · [x] 5 familles · [x] famille figée · [x] masse à zéro à l'ajout : la ligne naît sans surface, sous les pavés, le curseur dessus (joué, `z3-sucre.png` : dextrose 0,4 kg, 5 % ferm.) · [x] jour en fermentation, lactose, densité (annexe) · [x] clavier : nom, Entrée, masse (joué).
- Honnêteté : pavé hachuré + « ? » ; EBC « — » puis « ~7,6 » ; OG « — » ; « 75 % repère » ; stock 0 mot. Les sucres n'ont pas de pavé : la part d'un sucre n'est pas une part du grain.

## Boosters UX (boosters-ux)
- Boosters : `pavés-a-la-part` — lire et ajuster ; la surface se recoupe à chaque masse tapée, la teinte paraît avec la couleur (`z3-haut.png` → `z3-couleurs.png`) · `champ-toujours-pret` · `famille-qui-tourne` · `couleurs-a-renseigner`.
- B1 OK · B2 OK (la surface domine) · B3 OK (59 mots) · B4 OK · B5 OK · B6 : 4 tailles au premier écran (12/14/16 + 20 pour la masse dans le pavé) — écart voulu, la masse est la grande lecture · B7 OK (CONTRASTE OK ; 15 textes sur fond hachuré « non mesurables », tous en #111 sur blanc rayé) · B8 OK (vide, 0 kg, lactose, mangue, densité en annexe) · B9 partiel (le pavé touché se cerne de noir) · B10 OK · B11 OK (« un gros pavé Pilsner, deux petits ; rien n'a sa couleur ») · B12 OK (STANDARD OK) · B13 OK (chaque pavé est une cible).
- Écarts voulus : B6 (20 px).

## Tient / casse
- Tient : PAGE OK ; MOTS OK ; CONTRASTE OK ; STANDARD OK ; COMMUN : tout OK sauf COULEURS (1 teinte au repos, voulu) ; remplissage 0,7+ ; 1,0 écran.
- Casse : à 8 grains, les petits pavés passent en mode « mini » (nom et masse seulement, moment caché) ; un nom long se coupe à 2 lignes ; un pavé sous 70 px perd le moment. À 1280 px, la surface s'étire (560 px de large) sans changer d'idée.

## Captures (ouvertes)
`z3-haut.png`, `z3-page.png`, `z3-couleurs.png`, `z3-saisie.png`, `z3-sucre.png`, `z3-1280.png`.
