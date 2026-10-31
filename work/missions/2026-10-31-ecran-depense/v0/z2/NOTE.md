# z2 — la facture annotée au stylo (v0, série z, 31.10)

**Chaleur : tiède** (la forme de l'approche z : créative, mais la baseline et l'honnêteté suivies). Une seule idée : l'écran **est le
papier**. La Pro-Forma Rechnung est redessinée telle qu'imprimée (en-tête, Menge / Bezeichnung / Betrag, bloc MWST, total, « Betrag per
E-Finance erhalten ») et l'app l'annote comme un correcteur : un tampon vert « 86,50 · 23 lignes ✓ », le bloc TVA **cerclé** avec ses
chiffres lus tels quels, des accolades à l'encre qui rattachent la mouture au malt, les liens au stock en icône dans la marge. En haut,
le **stylo** : trois pastilles 1 2 3, le point courant en mots courts, « y aller » qui descend au bon endroit du papier.

**Axes** : A1 (le doute à sa place sur le document, et le fil 1-2-3 en tête), A2 (les familles repliées sur le papier, les lignes
dedans), A3 (icône par ligne, accolade de mouture, « article bis » sur Target), A5 (tampon). La dépense de la baseline vit dans un
tiroir sous le papier : chips (date, Déjà payé, payé le « supposée », Brassage, Drive), « détails » pour le reste.

Les trois points : TVA imprimée (2,80 · 4,15 · vide ; bases 110,40 ≠ 86,50, MWST 4,15 ≠ 2,80, HT vide) ; mouture ×5 (« ↑ mouture »
ligne par ligne, 2,40/kg écrit à l'encre après) ; Target α 11,3 ≠ stock 11,8 (article bis). Stock simulé (même jeu que z1).

## Baseline cochée
- [x] justificatif : nom, Voir, Changer (dans détails) ; Drive prêt en chip · [x] Total TTC (tapable, bas du papier) · [x] Pour quoi ?
  (proposé) · [x] Achat du · [x] Déjà payé / À payer · [x] Payé le (supposée) + moyen · [x] Échéance (avec À payer) · [x] Fournisseur
  (en-tête du papier, éditable dans détails) et catégorie · [x] Lier à une dépense prévue · [x] lignes (famille, article, quantité,
  unité imprimée gardée « Kg », montant, lien au stock) · [x] + ligne · [x] regrouper · [x] Détail 86,50 / 86,50 · [x] n° facture,
  commande, TVA et taux (bloc imprimé) · [x] Confirmer et enregistrer · [x] ×
- matériel : non montré (aucune ligne de matériel) ; retirer une ligne : non dessiné.

## Boosters UX (boosters-ux)
- Boosters : `stylo-point-courant` — suivre ; pastilles + « y aller » ; descend et fait clignoter la cible, coche en vert.
  `tampon-recoupe` — lire ; tampon. `deux-valeurs` — choisir. `chips-depense` — lire / ajuster. `bascule-reglement` — choisir.
  `action-unique` — déclencher.
- B1 OK (captures haut / regle : pastille 1 cochée, bloc TVA vert, stylo passe au point 2) · B2 OK (le papier domine, un primary) ·
  B3 alerte : 95 mots (≤ 98) · B4 OK (le papier, le tiroir, le pied) · B5 OK · B6 OK (12 / 14 / 16-22) · B7 OK (CONTRASTE OK) ·
  B8 OK (9 états) · B9 OK · B10 OK · B11 : « la facture 372765 de 86,50, 23 lignes recoupées, la TVA imprimée ne tombe pas »
  · B12 : rayon 10 partout, chevron · B13 OK (24 px pastilles, 26–28 px boutons).
- Écarts voulus : fond de page gris #E9E9E9 derrière le papier blanc (le papier doit se détacher) ; mono pour les colonnes imprimées
  (ce sont des mesures et des codes).

## Contrôles (sorties)
PAGE OK · COMMUN OK (mots 95 modéré) · mots 95 · CONTRASTE OK · panel (4 z) : remplissage 0,46 ; ressemblance 0,90.

## Ce qui tient, ce qui casse
Tient : il voit ce que l'IA a lu **sur** sa facture, et où elle doute ; le papier rassure (« c'est bien ma facture »). Casse : un
papier de 35 lignes est long ; un PDF à deux pages demande deux papiers ; le fournisseur se corrige dans « détails », pas sur l'en-tête.
