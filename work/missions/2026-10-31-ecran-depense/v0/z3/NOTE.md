# z3 — trois cartes à régler, une à la fois (v0, série z, 31.10)

**Chaleur : chaude.** Une seule idée : les points à régler sont une **pile de cartes**, une devant, les suivantes derrière ; on règle
la carte de devant d'un toucher (deux valeurs lues ou le vide proposé), elle part, la suivante vient. En haut, la somme en grand,
« 23 lignes recoupées », trois pastilles qui passent au vert, et la **barre par famille** (Malts 35,35 · mouture 1,50 · Houblons
20,05 · Levures 29,60 = 86,50). Sous la pile, la **frise** : 23 tuiles, une par ligne dans l'ordre de la facture, à la couleur de sa
famille, le lien au stock dessiné dedans (0 mot) ; l'ambre est un point, le vert un point réglé ; une tuile ouvre sa ligne.

**Axes** : A1 (un fil trié par risque : argent, stock, stock ; chaque carte est un point), A2 (23 lignes repliées, la frise les
montre sans mots), A3 (lien en icône dans la tuile et dans la grille), A5 (somme + barre + pastilles). La carte 1 porte le bloc TVA
imprimé (N 8,1 % 26,20 / 1,95 ; R 2,6 % 84,20 / 2,20) et le calcul ; la carte 2 liste les cinq moutures avec leur malt (+ 0,60…) et
propose « rattacher au malt · 2,40/kg » ou « laisser en service » ; la carte 3 met Target lu (α 11,3) contre Target au stock
(α 11,8, 120 g simulés) : « article bis » ou « même lot ». Tout réglé : une carte verte « Tout est réglé ».

## Baseline cochée
- [x] justificatif : nom, Voir, Changer (dans « plus ») ; Drive prêt en chip · [x] Total TTC (tapable, en grand) · [x] Pour quoi ?
  (proposé, dans plus) · [x] Achat du (chip) · [x] Déjà payé / À payer (chip bascule) · [x] Payé le (supposée) + moyen · [x] Échéance
  · [x] Fournisseur et catégorie (chips) · [x] Lier à une dépense prévue · [x] lignes (grille repliée : famille, article, quantité,
  unité, montant, lien) · [x] + ligne · [x] regrouper · [x] Détail 86,50 / 86,50 · [x] n° facture, commande, TVA, taux · [x] Confirmer
  et enregistrer · [x] ×
- matériel : non montré ; retirer une ligne : non dessiné.

## Boosters UX (boosters-ux)
- Boosters : `cartes-a-regler` — choisir / suivre ; pile ; la carte part (translateX, 0,25 s), pastille verte, « 2 à régler ».
  `barre-familles` — lire ; barre segmentée. `frise-lignes` — lire / déclencher ; 23 tuiles ; tuile ambre → verte. `deux-valeurs`,
  `chips-depense`, `bascule-reglement`, `lignes-repliables`, `edition-sur-place`, `action-unique`.
- B1 OK (haut / regle : carte TVA partie, carte mouture devant, pastille 1 verte) · B2 OK (le 86,50 et la carte de devant) · B3 OK :
  88 mots (≤ 98) · B4 OK · B5 OK · B6 OK (12 / 14 / 18-44) · B7 OK (CONTRASTE OK, pire 5,19:1) · B8 OK (9 états) · B9 OK (0,25 s,
  scale .97) · B10 OK · B11 : « 86,50, 23 lignes recoupées, 3 à régler, d'abord la TVA imprimée » · B12 OK · B13 OK (tuiles 26 px
  avec 3 px d'écart : exception d'espacement ; boutons 36–48 px).
- Écarts voulus : la pile a une hauteur fixe (222 px) pour que rien ne saute quand une carte part ; le bas du premier écran reste
  clair (remplissage 0,41), c'est le prix d'« une carte à la fois ».

## Contrôles (sorties)
PAGE OK · COMMUN OK · mots 88 · CONTRASTE OK · panel (4 z) : remplissage 0,41 (le plus clair des quatre) ; ressemblance 0,90.

## Ce qui tient, ce qui casse
Tient : zéro hésitation sur quoi faire maintenant ; le geste est gros, sous le pouce ; la frise dit l'état du stock sans un mot.
Casse : on ne voit pas tous les points d'un coup (les cartes 2 et 3 ne montrent que leur titre) ; une facture à 12 points fait une
longue pile ; la frise ne nomme pas les lignes (il faut toucher).
