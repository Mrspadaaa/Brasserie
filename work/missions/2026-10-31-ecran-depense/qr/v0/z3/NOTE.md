# z3 — la bande perforée du QR-facture, et la valeur proposée dans le champ (v0 QR, série z, 01.11)

**Chaleur : chaude.** Sous le bandeau, cousue à lui, la bande de découpe « ✂ - - - » de tout bulletin suisse : « QR-facture ✓ 110,40
CHF · F-1001 · 12.10.2026 », en mono, un chevron ; un toucher la déplie (IBAN, Référence, Conditions, Créancier, « Copier »). En
désaccord, c'est le champ lui-même qui propose : « 110,04 lu » barré en rouge, petit, puis « 110,40 QR » grand, en pointillé ambre ;
rien n'est appliqué tant qu'il n'a pas touché l'un des deux (Détail montre « 110,40 / 110,04 » : la somme des lignes contre le champ).

**Axes** : où = une bande sous le bandeau ; le désaccord = la valeur du QR proposée, la lue barrée, plus un point numéroté 1 « Total
110,40 proposé » ; le signe = les ciseaux et le mot « QR-facture » ; enrichir = le pli de la bande.

**Honnêteté** : la bande ne dit que ce que le QR porte : partiel = « ✓ CHF · Malterie Fictive SA · montant non imprimé » ; illisible =
« QR-facture » barré, « vu, illisible (tampon) · la lecture seule fait foi » ; sans = pas de bande (le bandeau reprend ses coins) ;
lecture = « ✓ 110,40 CHF · F-1001 · 12.10.2026 · lu en 0,5 s », lignes en squelette. Le champ ne change jamais sans lui : la lue barrée
est une proposition visible, le total enregistré reste 110,04 tant qu'il n'a pas touché (Détail le dit).

## Ce qui vient de la base
Tout l'écran en ligne (voir z1), le bandeau sans coins bas pour recevoir la bande. Lignes `data-mots="lignes"`.

## Boosters UX (boosters-ux)
- Boosters : `valeur-proposee` — choisir ; deux boutons dans le champ même (lu barré / QR proposé) ; celui touché devient la valeur
  à 28 px, l'autre rapetisse (captures contredit / contredit-apres ; la bande passe à « 110,40 CHF pris »). `bande-qr` — lire et
  ouvrir ; déplie le pli (confirme-ouvert). `chip-qr` — suivre. `copier` — déclencher. `bascule-reglement`, `barre-lignes`,
  `action-unique` : la base.
- B1 OK (7) · B2 OK (en désaccord, la proposition 110,40 domine, voulu) · B3 OK (41 mots sans lignes ; 92 avec) · B4 OK · B5 OK ·
  B6 : 12 / 14 / 16 / 20 / 28 en contredit (la lue barrée à 20 px : une taille de plus, voulue pour la hiérarchie lu / proposé) · B7 OK
  (pire 5,27:1) · B8 OK · B9 OK · B10 s.o. · B11 : « 110,40 CHF, F-1001, 12.10 : le QR-facture le confirme » · B12 OK · B13 OK
  (boutons de 36 px, bande 30 px pleine largeur).
- Écarts voulus : B6 (cinq tailles en contredit).

## Contrôles (sorties)
CHOIX OK (0 écran) · COMMUN OK (--sans-lignes) · MOTS OK 41 (92 avec lignes) · CONTRASTE OK (55 textes, pire 5,27:1) · PAGE OK.
Captures : six états à 390, geste « prendre QR », bande dépliée, 1280 confirme et contredit (bande dépliée d'office).

## Ce qui tient, ce qui casse
Tient : la forme est la sienne (la découpe du bulletin), la bande dit tout en une ligne, le désaccord est impossible à rater. Casse : la
ligne de la bande passe sur deux lignes à 390 (date rejetée) ; « la lue barrée » peut se lire comme déjà remplacée : le Détail
« 110,40 / 110,04 » et le pointillé ambre portent l'honnêteté, le critique dira si c'est assez.
