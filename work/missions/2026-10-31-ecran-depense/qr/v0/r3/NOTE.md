# r3 — le talon détachable et son sceau (chaude)

**Idée** : le QR est la section paiement du bulletin suisse qu'il connaît ; sous le bandeau, une perforation (ciseaux) détache un
talon : un sceau (le picto du QR entouré de quatre arcs, montant, devise, n°, date), et ce que le QR permet de faire : copier l'IBAN et
la référence pour payer.

- **Chaleur** : chaude (forme libre : le ticket et son talon, le sceau à arcs).
- **Axes** : où = un sceau ; désaccord = la valeur du QR proposée, la lue barrée (« Montant ~~110,04~~ 110,40 [Prendre] [Garder
  110,04] ») ; signe = la coche avec sa source (« ✓ montant ✓ devise ✓ n° ✓ date » sous « Section paiement ») ; enrichir = IBAN et
  référence prêts à copier (bouton à 28 px, coche verte une fois copié).
- **Les six états** : confirme (quatre arcs verts, 4/4) ; contredit (arc du montant en attention, ≠ montant, proposition, total du
  bandeau en pointillé, chip en alerte) ; partiel (un bulletin : arc de la devise seul, « montant, n°, date » barrés, IBAN et référence
  quand même là, utiles pour payer) ; illisible (sceau gris barré, « la lecture fait foi ») ; sans (pas de talon) ; lecture (le sceau
  tourne, « QR lu · 0,4 s », 110,40 CHF · F-1001 « à comparer », le bandeau encore en squelette).
- **Honnêteté** : le barré est une proposition, le champ (bandeau) garde 110,04 jusqu'au toucher ; après « Prendre », le talon dit
  « montant pris du QR », pas « confirmé ». Données fictives : l'IBAN et la référence sont ceux de l'exemple public de SIX.
- **Base reprise** : en-tête, justificatif, bandeau complet (le talon s'y accroche), tuiles, lignes, pied ; lecture de l'app.

## Boosters UX (boosters-ux)
- Boosters : `sceau` — lire ; quatre arcs ; l'arc qui diffère change de couleur (captures confirme / contredit / partiel) ; `prendre` —
  choisir ; proposition barrée ; le total change (`r3-geste-prendre-qr.png`, `r3-geste-garde-lu.png`) ; `copier` — déclencher ; copie
  au presse-papiers ; coche verte (`r3-geste-iban-copie.png`).
- B1 OK. B2 OK — total, puis sceau ; un `primary` d'écran. B3 OK — 45 mots hors lignes (106 lignes comprises). B4 OK — le talon est
  un groupe nommé. B5 s.o. B6 OK. B7 OK — pire 6,21:1. B8 OK. B9 s.o. B10 s.o. B11 « La facture et son QR disent la même chose, et je
  peux payer. » B12 OK — STANDARD OK (le sceau, 44 px, hors règle des icônes ≤ 32 px). B13 OK.
- Écarts voulus : le bandeau perd son bord bas au profit du talon (une carte, pas une carte dans une carte).
