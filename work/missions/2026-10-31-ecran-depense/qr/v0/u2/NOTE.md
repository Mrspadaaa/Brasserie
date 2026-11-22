# u2 — le QR signe chaque champ, sur place (01.11)

- **Chaleur** : tiède.
- **Axes** : place du QR = sur les champs du bandeau eux-mêmes (montant, date, n°) ; forme = un sceau de 24 px à droite du champ ;
  contradiction = le total devient un segment « lu sur la page | QR-facture » qu'un toucher tranche.
- **L'idée** : pas de liste à lire ; le brasseur voit le petit QR vert collé au chiffre que le QR confirme, et rien ailleurs.

## Ce qui vient de la base
- Écran en ligne au repos à 390 (`souris390-01-repos`) : preuve fermée, ouverte par « 23 lignes » (comme en ligne) ; tuiles, chips,
  lignes, pied identiques. À 1280, preuve ouverte (comme `lg:block`).
- Ajout au bandeau : une rangée « N° de facture 372765 » (le n° était au fond, dans « Référence et TVA ») parce que le QR le confirme.

## États
- confirme : trois sceaux verts (date, montant, n°). Un toucher sur un sceau : une phrase sous le bandeau (`sceau`).
- contredit : segment ① « lu sur la page 85,60 » (actif, noir) | « QR-facture 86,50 » ; un toucher sur 86,50 → total 86,50 + sceau,
  « total pris du QR · 85,60 » barré, chip ① barrée verte.
- partiel : sceau vert sur le montant, sceaux pointillés gris sur date et n° (« absent du QR » au toucher).
- illisible : sceaux « ? » ambre + [Photographier le QR].
- sans : aucun sceau ; l'écran en ligne tel quel.
- lecture : montant, date et n° déjà là avec leur sceau (« montant, n° et date lus dans le QR ») ; fournisseur et lignes en squelette.

## Boosters UX (boosters-ux)
- Boosters : `sceau` — lire ; bouton 24 px ; QR vert/pointillé/« ? » ; phrase sous le bandeau (`u2-partiel` → `u2-geste-toucher`).
  `prendre-qr` — choisir ; segment à deux valeurs ; total changé (`u2-contredit` → `u2-geste-apres`). `preuve` — « 23 lignes » ouvre la preuve.
- B1 OK · B2 OK (le total ; en contredit, le duel domine, voulu) · B3 : 55 mots hors lignes, 120 avec · B4 OK · B6 : 24 px en plus
  dans le segment (cinq tailles en contredit) · B7 OK · B8 OK · B9 OK · B11 « tout ce qui porte un sceau vert est confirmé » ·
  B13 sceaux de 24 × 24.
- Écarts voulus : la rangée n° dans le bandeau (le QR la confirme, elle doit se voir).
