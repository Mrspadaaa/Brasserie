# u3 — lecture et QR face à face : la fermeture éclair (01.11)

- **Chaleur** : tiède à chaude.
- **Axes** : place du QR = un bloc à lui sous le bandeau ; forme = deux rubans (lu en haut, QR en bas), une colonne par champ, des
  dents entre eux ; contradiction = le ruban s'ouvre sur la colonne, et « Fermer sur 86,50 » la referme.
- **L'idée** : une fermeture éclair : fermée (dents vertes croisées) là où lecture et QR disent pareil, ouverte (≠ ambre) là où ils
  divergent ; une seule rangée de dents quand le QR ne porte pas le champ ; ruban du bas hachuré quand il est illisible.

## Ce qui vient de la base
- Écran en ligne au repos à 390 : preuve fermée, ouverte par « 23 lignes » ; bandeau, tuiles, chips, lignes, pied identiques.
  À 1280, preuve ouverte sous le bloc.
- La date du bloc est courte (27.04) ; la date entière reste au bandeau.

## États
- confirme : 4 colonnes fermées, pastille « 4/4 d'accord ».
- contredit : colonne Montant ouverte (85,60 / 86,50 en ambre), pastille « montant ≠ », point ① « Le QR dit 86,50, la lecture 85,60 »
  [Fermer sur 86,50] → dents fermées, « Total pris du QR · 85,60 » barré, pastille 4/4.
- partiel : Montant et Devise fermés ; N° et Date à une seule rangée de dents, « pas dans le QR » en pointillé ; « 2/4 d'accord ».
- illisible : ruban QR hachuré « ? » ; « QR vu sur la pièce, pas déchiffré : rien n'est confirmé » + [Photographier le QR].
- sans : le bloc se réduit à une ligne « Pas de QR-facture sur la pièce : la lecture reste seule ».
- lecture : ruban QR plein (86,50 · CHF · 372765 · 27.04), ruban lu en squelette, demi-dents en attente ; « lu en 0,6 s ».

## Boosters UX (boosters-ux)
- Boosters : `prendre-qr` — choisir ; bouton ; colonne ouverte → fermée (`u3-contredit` → `u3-geste-apres`) ; dents animées 250 ms,
  coupées en mouvement réduit. `preuve` — « 23 lignes » ouvre la preuve (`u3-geste-toucher`).
- B1 OK · B2 OK (total, puis le bloc) · B3 : 69 mots hors lignes, 118 avec · B4 OK · B6 12/14/16/32 · B7 OK · B8 OK (absent ≠ faux,
  illisible ≠ zéro) · B9 OK · B11 « lecture et QR fermés partout : d'accord » · B13 OK.
- Écarts voulus : un bloc de plus entre bandeau et tuiles (+90 px), au prix de deux lignes visibles de moins.
