# u4 — le sceau du QR-facture, tamponné sur le total (01.11)

- **Chaleur** : chaude (la plus libre).
- **Axes** : place du QR = à côté du total, dans le bandeau ; forme = un tampon rond de 100 px (anneau « QR-FACTURE », croix suisse
  au centre, verdict sur l'arc du bas), penché comme un coup de tampon ; contradiction = encre ambre et tampon fendu « ≠ MONTANT ».
- **L'idée** : le QR est un sceau officiel imprimé sur la facture ; l'écran le tamponne sur le total, à l'encre de ce qu'il dit.

## Ce qui vient de la base
- Écran en ligne au repos à 390 : preuve fermée, ouverte par « 23 lignes » ; tuiles, chips, lignes, pied identiques. À 1280, preuve ouverte.
- Changé dans le bandeau : la date passe sous le fournisseur, avec le n° (« 27.04.2026 · n° 372765 ») ; « 23 lignes » passe sous le
  total ; la colonne de droite est au tampon.

## États
- confirme : tampon vert « = LECTURE ». Un toucher le redresse et déplie ses quatre champs (`sceau`).
- contredit : tampon ambre fendu « ≠ MONTANT » ; point ① « Total · le sceau dit 86,50 · lu 85,60 » [Prendre 86,50].
- partiel : tampon vert à l'anneau entrecoupé, « MONTANT SEUL » ; au toucher : n° et date « pas dans le QR ».
- illisible : tampon ambre brouillé, anneau tireté, « ? », « ILLISIBLE » ; tuile « pas déchiffré : rien n'est confirmé » + [Photographier le QR].
- sans : un cercle vide en pointillé « sans QR ».
- lecture : tampon vert « LU EN 0,6 S » dès l'ouverture, avec 86,50 CHF, la date et le n° ; fournisseur et lignes en squelette.

## Boosters UX (boosters-ux)
- Boosters : `sceau` — lire ; le tampon est un bouton ; il se redresse et déplie montant, devise, n°, date (`u4-partiel` →
  `u4-geste-toucher`). `prendre-qr` — choisir ; total changé, tampon guéri en vert (`u4-contredit` → `u4-geste-apres`).
- B1 OK · B2 : deux masses (total et tampon), voulu · B3 : voir RESULTAT · B6 : 12 px mono sur l'arc · B7 : encre verte et ambre
  mesurées · B8 OK (illisible n'est pas vert, sans n'est pas vide de sens) · B9 OK (rotation 250 ms, coupée en mouvement réduit) ·
  B11 « le QR tamponne le total : bon » · B13 cible de 100 px.
- Écarts voulus : la date quitte le coin droit du bandeau (place du tampon) ; texte en courbe (le contrôle de mots le compte).
