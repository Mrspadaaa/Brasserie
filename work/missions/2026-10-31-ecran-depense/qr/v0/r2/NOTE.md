# r2 — une pastille QR sur chaque champ (tiède)

**Idée** : ses mots du 01.11 (« J'aime beaucoup les pastilles sur les items ») appliqués au récap : chaque champ que le QR confirme
porte sa pastille « ✓ QR » à côté de lui, dans le bandeau ; toucher une pastille ouvre le QR et la lecture champ par champ.

- **Chaleur** : tiède (la forme de l'approche : le récap de l'app, enrichi d'une ligne « Facture F-1001 » et des pastilles).
- **Axes** : où = une pastille sur chaque champ confirmé (créancier, date, total et devise, n°) ; désaccord = côte à côte avec un geste
  (le total devient un segment « lu 110,04 | QR 110,40 = lignes », un toucher garde l'un) ; signe = le mot « QR » (pleine = confirmé,
  creuse = lu dans le QR mais pas encore comparé, pointillée = absent du QR). Enrichir : non.
- **Les six états** : confirme (quatre pastilles vertes) ; contredit (segment ; après « QR » : 110,40, le lu 110,04 barré à côté ;
  après « lu » : 110,04 et une pastille pointillée « QR 110,40 », le détail le garde en attention) ; partiel (pastille sur le créancier,
  « QR sans montant » sur le total, aucune sur le n° ni la date) ; illisible (une pastille pointillée « QR illisible ») ; sans
  (« sans QR », discret) ; lecture (le récap arrive déjà rempli par le QR, pastilles creuses, pendant que les lignes se lisent).
- **Honnêteté** : rien n'est dit confirmé que le QR ne porte pas ; pendant la lecture, la source des valeurs est dite (pastille creuse) ;
  le total ne change qu'au toucher.
- **Base reprise** : en-tête, « Voir le justificatif », bandeau (fournisseur, date, total, chip « 9 lignes », barre), tuiles, lignes,
  pied ; lecture : tuiles verrouillées et squelette de l'app. Enrichi : la ligne « Facture F-1001 » dans le récap (le n° vit en ligne
  dans « Référence et TVA », plus bas).

## Boosters UX (boosters-ux)
- Boosters : `pastille-qr` — lire ; pastille par champ ; tableau QR | lu (`r2-geste-pastille-ouverte.png`) ; `garder` — choisir ;
  segment à deux valeurs ; le total change, le lu se barre (`r2-geste-garde-qr.png`, `r2-geste-garde-lu-detail.png`).
- B1 OK. B2 OK — total dominant, un `primary`. B3 OK — 30 mots hors lignes (100 lignes comprises). B4 OK — la source colle au champ.
- B5 s.o. B6 OK. B7 OK — pire 6:1. B8 OK — six états, trois genres de pastille. B9 s.o. B10 s.o. B11 « Chaque champ du haut est
  confirmé par le QR. » B12 OK — STANDARD OK. B13 OK — pastilles de 24 px.
- Écarts voulus : la ligne « Facture F-1001 » ajoutée au bandeau (le QR confirme le n° ; sans elle, sa pastille n'a pas de place).
