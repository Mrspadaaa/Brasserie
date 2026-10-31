# u4 — la recette en sacs (v0, série u, 31.10)

- **Chaleur** : chaude. Forme libre.
- **Axes** : A1 une figure isotype par ingrédient (un sac = 1 kg) ; A2 la masse pas à pas (− et +, l'actuel) et tapable ; A3 un
  champ toujours prêt et une étagère de sacs du stock ; A4 la couleur du malt dans le sac, hachure tiretée si inconnue.
- **L'idée** : il compte ses malts en sacs, comme au dépôt : cinq sacs de Pilsner, un et demi de Weizen ; la quantité se lit sans
  lire de chiffre, et l'ajout se fait en prenant un sac sur l'étagère.

## Ce qui se voit et se touche
- Une ligne : nom, moment en pastille, part (à droite) ; dessous, les sacs (le dernier rempli à la fraction, à la couleur du malt),
  puis − [5,0] kg +.
- Couleur inconnue : sacs au contour tireté, part pleine hachurée de gris, « ? ». Un toucher sur les sacs ouvre la couleur.
- Sous la liste : la marque « 3 couleurs à renseigner », puis l'étagère : le champ « Taper un nom, puis Entrée » et sa famille, et
  les sacs du stock posés sur leur planche, avec l'icône verte du stock ; un toucher prend le sac (0 kg, curseur sur la masse).

## Baseline (plancher à enrichir)
- [x] Éléments communs tels quels ; bandeau absent sur la recette vide.
- [x] La ligne : nom, moment, part, masse. [x] 5 familles (un sucre ou un fruit : sac crème, mot de la famille). [x] Famille figée.
- [x] Masse à zéro (« vide », aucun sac). [x] J+ en fermentation. [x] Lactose, densité (annexe). [x] Clavier : nom, Entrée, masse, Entrée.
- Pas : 0,05 kg sous 1 kg, 0,1 kg au-dessus (hypothèse 3) ; la saisie reste libre.

## Honnêteté
- Un sac inconnu n'a pas de couleur, seulement la hachure (« un secteur hachuré, c'est un inconnu », glossaire). EBC « — » ; Morey
  de l'app. Stock fictif dit. Un sac = 1 kg écrit dans l'annexe, jamais au premier plan.

## Boosters UX
- sacs — lire : le nombre de sacs suit la masse à chaque frappe et à chaque − + ; teinte des sacs après la couleur (`cap-couleurs`).
- masse-pas, masse — ajuster ; etagere-sacs, ajout-clavier, famille-ajout — déclencher ; moment ; a-renseigner.
- B1 OK · B2 OK (les sacs portent l'écran) · B3 OK (55 mots) · B4 OK · B5 OK (2/4/8 px) · B6 OK · B7 OK (pire 5,27:1) · B8 OK (vide,
  inconnu, 8 grains, lactose, fruit ; hors ligne non dessiné) · B9 partiel (− + changent les sacs aussitôt ; délai non mesuré) ·
  B10 OK · B11 « surtout du Pilsner, cinq sacs ; un et demi de froment et d'avoine ; couleurs inconnues » · B12 OK · B13 OK (− + 26 px).

## Contrôles (31.10)
- `controle-commun --profil=sans-houblons` : COMMUN OK. Au premier essai, COULEURS ECHEC (icône du stock ajoutée) et STANDARD ECHEC
  (trait de 0,9 px des petits sacs : épaisseur rapportée à la taille).
- `mots-premier-ecran --max=80` : 55, MOTS OK. `controle-contraste` : CONTRASTE OK. `verifier-page` : PAGE OK.
- Hauteur : 0,63 écran ; 8 grains : 1,01 écran (après deux compactages ; 1,21 au départ).

## Ce qui tient, ce qui casse
- Tient : le plus « brasseur » ; la proportion se voit au premier coup d'œil, même sans couleurs.
- Casse : au-delà de 12 kg d'un malt, les sacs passent à la ligne ; les petits malts (0,1 kg) ne sont qu'un fond de sac. Un sac de
  1 kg n'est pas son conditionnement réel (25 kg) : c'est une unité de lecture.

Captures : `cap-*.png`, `verif-haut.png`.
