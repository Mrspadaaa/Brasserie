# u1 — le QR, une rangée de plus dans la vérification (01.11)

- **Chaleur** : froide (la plus sage : l'écran en ligne tel quel, une rangée ajoutée).
- **Axes** : place du QR = dans la preuve « Vérification » ; forme = quatre cases (montant, CHF, n°, date) ; contradiction = un point
  numéroté de plus, en tête (risque d'abord), avec son geste « Prendre 86,50 ».
- **L'idée** : le QR-facture est un contrôle de plus, au même rang que « Somme des lignes = imprimé » ; ses quatre cases disent d'un coup
  d'œil ce qu'il confirme (vert ✓), contredit (ambre ≠) ou ne porte pas (pointillé —).

## Ce qui vient de la base (l'écran en ligne, r2b portée, `souris390-02-preuve`, `pc1280-01-repos`)
- En-tête, « Voir le justificatif », bandeau (fournisseur, date, 86,50 CHF, « 23 lignes », barre colorée), preuve ouverte
  (« Lecture à confirmer », trois rangées chiffrées, compte des liens en pictos), tuiles 1 TVA et 2 Règlement « supposée », chips 3 à 5,
  lignes de la facture (moutures sous leur malt, pastilles), pied « Drive prêt » / Confirmer. À 1280 : deux colonnes comme en ligne.
- Données : la fixture B&R des captures en ligne (n° 372765 lu dans « Référence et TVA » de la base). Contredit : lecture 85,60
  (chiffres permutés), QR et somme des lignes 86,50 — fixture.

## États (`?etat=`)
- confirme : 4 cases vertes ; la rangée se déplie au toucher (`detail-qr`).
- contredit : case « montant ≠ » ambre, détail ouvert d'office (« lu 85,60 »), point 1 « Total · le QR dit 86,50 · lu 85,60 »
  [Prendre 86,50] ; « Somme des lignes = imprimé » devient « 86,50 ≠ 85,60 ». Après le geste : total 86,50, point barré vert.
- partiel : montant et CHF verts, « n° — » et « date — » en pointillé ; détail « absent du QR ».
- illisible : « QR-facture vu, pas déchiffré » + [Photographier le QR] ; « rien n'est confirmé par le QR ».
- sans : « Pas de QR-facture sur la pièce » en rangée grise ; le reste inchangé.
- lecture : le QR, lu en 0,6 s, remplit montant, devise, n° et date (« lecture en attente ») ; lignes et fournisseur en squelette,
  « 23 lignes » caché (rien n'est encore compté), Confirmer désactivé.

## Boosters UX (boosters-ux)
- Boosters : `detail-qr` — besoin lire ; bouton de toute la rangée ; quatre cases → détail champ par champ ; effet vu (`u1-partiel` →
  `u1-geste-toucher`). `prendre-qr` — besoin choisir ; bouton du point 1 ; duel « 86,50 · lu 85,60 » ; total changé, point barré
  (`u1-contredit` → `u1-geste-apres`).
- B1 OK (deux boosters, captures avant/après) · B2 OK (le total domine, un seul primaire noir par état, « Prendre » est secondaire
  noir mais petit — à surveiller) · B3 : 95 mots hors lignes (`--sans-lignes`), 130 avec · B4 OK · B5 non mesuré · B6 : 12/14/16/32
  (quatre tailles, comme en ligne) · B7 OK (CONTRASTE OK) · B8 OK (inconnu = « — », illisible ≠ zéro, lecture en squelette) ·
  B9 OK (éclair vert 0,6 s sur le total, mouvement réduit respecté) · B10 s.o. · B11 « le QR confirme les quatre champs » · B12 OK ·
  B13 cases de 20 px dans un bouton de rangée de 28 px (la rangée est la cible).
- Écarts voulus : aucun sur la base.
