# r4 — le total chiffre à chiffre (chaude)

**Idée** : sous le total lu, le total du QR s'imprime colonne par colonne, comme un double au carbone ; quand ils diffèrent, la colonne
fautive se voit d'un coup d'œil (110,**04** contre 110,**40** : une inversion) et un troisième témoin, la somme des lignes, tranche.

- **Chaleur** : chaude (forme libre : les chiffres en colonnes, trois témoins superposés).
- **Axes** : où = sur le bandeau, sous le total ; désaccord = chiffre à chiffre (forme neuve : les colonnes qui diffèrent en pointillé
  d'attention, « Garder » sur chaque rangée) ; signe = la coche avec sa source (« ✓ QR » en tête de rangée ; « ✓ CHF ✓ F-1001 ✓ date
  ✓ créancier » dessous) ; enrichir = conditions S1 et échéance (tuile « Règlement · 30 j net · À payer · 11.11 », jauge des 30 jours,
  reste 10 j ; ouverte : « 30 jours net · échéance 11.11.2026 »).
- **Les six états** : confirme (deux rangées identiques) ; contredit (lu, QR, lignes ; « Garder » plein sur le QR, deux contre un) ;
  partiel (rangée QR en points « ···,·· sans montant », ✓ CHF, ✓ créancier) ; illisible (« QR barré · illisible · la lecture fait foi ») ;
  sans (rien) ; lecture (le QR s'imprime d'abord, 0,4 s ; la rangée lue en points qui battent).
- **Honnêteté** : une valeur absente reste en points, jamais un zéro ; après « Garder » QR, la rangée lue reste visible, barrée,
  « remplacé » ; après « Garder » lu, la rangée du QR reste, « non pris », la colonne fautive marquée. L'échéance est la seule seconde
  date (D233 : « l'échéance d'À payer reste »).
- **Base reprise** : en-tête, justificatif, bandeau (fournisseur, date, total, chip, barre), tuiles, lignes, pied, lecture.

## Boosters UX (boosters-ux)
- Boosters : `chiffres` — comparer ; colonnes alignées (cases de 21 px) ; la colonne qui diffère en attention (confirme / contredit) ;
  `garder` — choisir ; un bouton par rangée ; la rangée choisie monte (`r4-geste-garde-qr.png`, `r4-geste-garde-lu.png`) ;
  `echeance` — suivre ; jauge 30 jours ; panneau des conditions (`r4-geste-echeance-ouverte.png`).
- B1 OK. B2 OK — le total domine (32 px) ; un `primary`. B3 OK — 48 mots hors lignes (115 lignes comprises). B4 OK. B5 s.o.
- B6 écart — quatre tailles (32, 24, 14, 12) : la rangée du QR à 24 px est la forme même de l'idée. B7 OK — pire 6,21:1. B8 OK.
  B9 s.o. B10 s.o. B11 « Le QR dit 110,40, la lecture 110,04 : les deux derniers chiffres sont inversés. » B12 OK. B13 OK.
- Écarts voulus : B6 (ci-dessus).
