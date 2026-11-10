# z2 — le sceau QR sur le bandeau (v0 QR, série z, 01.11)

**Chaleur : tiède.** À droite du bandeau, le QR de la facture lui-même, dessiné à 72 px avec la croix suisse au centre (la forme qu'il
voit sur chaque facture), et dessous un bandeau de verdict : « QR ✓ » vert, « QR 110,40 » ambre, « QR partiel » gris foncé, « illisible »
gris barré de rouge, « lecture… » qui pulse. Le sceau est un bouton : il ouvre « Ce que dit le QR », une feuille en bas au téléphone,
en place sur ordinateur.

**Axes** : où = un sceau ; le désaccord = le total lu reste 110,04 et le sceau annonce 110,40 (deux sources, côte à côte), sous le total
« lu 110,04 / QR 110,40 » à toucher, et un point numéroté 1 ; le signe = le QR suisse entier ; enrichir = la feuille (Montant, Facture,
Date, Créancier cochés « = lu » ; IBAN et Référence avec « Copier » ; Conditions 30 jours).

**Honnêteté** : la feuille ne liste que ce que le QR porte (`DIT` par état) : partiel = Montant « — non imprimé », Devise, Créancier,
IBAN, Référence ; illisible = « vu, illisible (barré par un tampon) », Montant / Facture / Date « lecture seule » ; sans = pas de sceau
du tout ; lecture = le QR déjà lu (0,5 s), « Lignes : lecture en cours… ».

## Ce qui vient de la base
Tout l'écran en ligne (voir z1) ; le bandeau passe en deux colonnes pour loger le sceau, « 7 lignes » et la barre partagent la
troisième ligne. Lignes `data-mots="lignes"`.

## Boosters UX (boosters-ux)
- Boosters : `sceau-qr` — lire et ouvrir ; le QR dessiné avec son verdict ; ouvre la feuille (capture confirme-ouvert). `deux-valeurs`
  — choisir ; lu / QR ; le total suit, le sceau repasse en « QR ✓ » si le QR est pris, « lu gardé » sinon (contredit-apres). `chip-qr`
  — suivre. `copier` — déclencher. `bascule-reglement`, `barre-lignes`, `action-unique` : la base.
- B1 OK (7) · B2 OK (110,40 ; le sceau est la seconde masse, voulue) · B3 OK (35 mots sans lignes ; 94 avec) · B4 OK · B5 OK · B6 OK
  (12 / 14 / 16 / 28) · B7 OK (pire 5,27:1 ; le bandeau de verdict blanc sur #3F6B2E ou #7F5B10 : > 4,5:1) · B8 OK (six états, le sans
  sans sceau) · B9 OK · B10 s.o. · B11 : « 110,40 CHF, et le QR de la facture dit oui » · B12 OK · B13 OK (sceau 72 × 70, tuiles 28 px).
- Écarts voulus : aucun.

## Contrôles (sorties)
CHOIX OK (0 écran) · COMMUN OK (--sans-lignes) · MOTS OK 35 (94 avec lignes) · CONTRASTE OK (55 textes, pire 5,27:1) · PAGE OK.
Captures : six états à 390, geste « prendre QR », sceau ouvert, 1280 confirme (feuille en place) et contredit.

## Ce qui tient, ce qui casse
Tient : on reconnaît la chose en une seconde (c'est son bulletin) ; un seul objet porte tout, verdict et détail ; l'illisible se voit
(QR pâle, barré). Casse : à 390, IBAN et référence sont rognés dans la feuille (« Copier » les sauve) ; le sceau prend 72 px de large au
bandeau, le fournisseur long sera coupé.
