# z2 — le verre : chaque malt est une couche, la bière prend sa teinte (tiède)

- **Chaleur** : tiède. La forme de l'approche « créative à fond » : la facture de grain se lit dans un verre.
- **Axes** : A1 une composition dessinée, avec ses lignes (le verre à gauche, les lignes reliées à leur couche) · A2 masse tapable sur place (↑↓ au clavier) · A3 champ toujours ouvert, famille qui tourne · A4 **la teinte de la bière qui se compose** : chaque couche prend la teinte du malt ; inconnue, elle est hachurée « ? » ; le verre entier devient paille quand les trois couleurs sont là.
- **Idée** : voir ce que la recette contient comme on regarde la bière dans le verre : la hauteur de chaque couche est sa part, sa teinte sa couleur.

## Baseline (J12, J5), cochée
- [x] en-tête, fil, bandeau, pied, + flottant, tels quels.
- [x] ligne : nom, moment, part, masse · [x] 5 familles (pastille qui tourne, comme le CycleTag de la base) · [x] famille figée · [x] masse à zéro à l'ajout (joué) · [x] jour d'ajout en fermentation (annexe) · [x] lactose et densité (annexe) · [x] clavier : nom, Entrée, masse (joué, focus sur « Masse de Dextrose »).
- Hors du grain (sucre, lactose, fruit, extrait) : pas de couche (la couleur se calcule sur les grains, `beerColor.ts`) ; une ligne à part, avec un cube, « 5 % ferm. ».
- Honnêteté : couche hachurée et « ? » par grain inconnu ; EBC « — » puis « ~7,6 » ; OG « — » ; « 75 % repère » ; stock : 0 mot.

## Boosters UX (boosters-ux)
- Boosters : `verre-en-couches` — lire ; figure liée aux lignes ; la couche grandit quand la masse change, la teinte paraît quand la couleur est saisie (`z2-haut.png` → `z2-couleurs.png`) · `champ-toujours-pret` — déclencher · `famille-qui-tourne` — choisir · `couleurs-a-renseigner` — déclencher.
- B1 OK · B2 OK (le verre domine) · B3 OK (55 mots) · B4 OK (couche ↔ ligne par un fil tireté) · B5 OK · B6 OK (12/14/16, mono pour les mesures) · B7 OK (CONTRASTE OK après le « ? » du verre passé en #333) · B8 OK (vide : le verre reste, vide ; lactose, mangue J3, densité en annexe) · B9 partiel · B10 OK · B11 OK (« trois couches, toutes inconnues ; 8 kg ; j'ajoute en haut ») · B12 OK · B13 OK.
- Écarts voulus : la mousse dessinée en haut du verre, sans chiffre : le signe que c'est une bière, pas une jauge.

## Tient / casse
- Tient : PAGE OK ; MOTS OK (55) ; CONTRASTE OK ; STANDARD OK ; COMMUN : tout OK sauf COULEURS (1 teinte au repos, voulu : les couleurs manquent) ; remplissage 0,7 au premier écran ; 0,9 écran avec 3 grains.
- Casse : avec 8 grains, les lignes dépassent la hauteur du verre (le panneau s'allonge, les fils s'étirent) ; une couche de moins de 18 px ne porte plus son « ? ». À régler en passe 2 (verre qui grandit avec la liste).

## Captures (ouvertes)
`z2-haut.png`, `z2-page.png`, `z2-couleurs.png` (verre paille, EBC ~7,6), `z2-saisie.png`, `z2-sucre.png` (dextrose hors du verre), `z2-1280.png`.
