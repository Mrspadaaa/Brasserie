# u3 — le ruban des 86,50 : la facture à l'échelle (v0, 31.10)

- **Chaleur** : chaude (forme libre).
- **Axes** : A5 la preuve, vue et non dite ; A2 groupées par famille ; A1 des épingles numérotées par risque, posées sur la ligne.
- **L'idée** : les 23 lignes forment un ruban à l'échelle, dans le cadre du total imprimé : s'il remplit le cadre, la somme tombe
  juste. Dessous, les bases TVA imprimées, à la même échelle, débordent de 23,90 : l'incohérence se voit avant de se lire.

## Sa facture, et ce qui est simulé
Ruban : Malts 35,35, Moutures 1,50, Houblons 20,05, Levures 29,60 (= 86,50) ; un trait blanc par ligne. TVA : bases 110,40.
Simulé, et dit : stock d'essai, Target α 11,8 et Hallertauer Blanc DE au stock, unité illisible de Sabro (sa facture : « g »),
prévision 90,00, doublon 380001 ; moyen « déduit », échéance « déduite ».

## Baseline, cochée
- [x] justificatif (vignette) · [x] Total TTC (se tape ; le cadre suit et le ruban dit l'écart) · [x] Pour quoi ? (Fiche)
- [x] Déjà payé, le « 27.04.2026 supposée » (au premier écran) ; Règlement Déjà payé / À payer, moyen, échéance (Fiche)
- [x] date de l'achat, fournisseur, catégorie, lier à une dépense prévue (« Fiche complète ⌄ »)
- [x] lignes : une famille s'ouvre (toucher sa rangée ou sa part du ruban), une ligne s'ouvre : calcul, type d'achat, réception
  en stock (article, nouvel article, aucun mouvement), retirer ; ajouter, regrouper, « Détail » (Fiche)
- [x] n° de facture, de commande, document, taux lus, HT « non imprimé », TVA retenue (Fiche) · [x] pied · [x] ×

## Honnêteté
- Le ruban est la somme des montants lus, à l'échelle ; le cadre est le total imprimé ; aucune donnée ajoutée.
- TVA : « bases 26,20 + 84,20 = 110,40 > 86,50 · TVA 1,95 + 2,20 = 4,15 ≠ 2,80 » ; « Laisser vide » proposé, 2,80 et 4,15 à côté.
- Ligne ouverte : « 2 Stk × 4,50 = 9,00 ✓ au centime · 2 Stk = 2 sachets » ; un montant tapé faux donne l'écart au centime.
- Écart : « Pour quoi ? » proposé par le code, sans marque ; à faire en passe 2.

## États (annexe, dans le ruban)
1 lecture (le ruban se remplit des trois étapes) · 2 ruban plein sans épingle (illustration) · 3 premier écran · 4 épingles qui
passent au vert · 5 erreur (cadre vide tireté, fichier gardé) · 6 Drive à connecter · 7 envoi puis reçu · 8 doublon : deux rubans
identiques l'un sous l'autre · 9 hors ligne.

## Boosters UX
- `ruban-a-l-echelle` — lire et comparer ; ruban dans son cadre ; toucher une famille l'ouvre (`u3-segment-levures.png`)
- `tva-a-l-echelle` — lire ; second ruban qui déborde du cadre · épingles (`data-u3-pin`) — choisir ; une épingle ouvre son point
  (`u3-point-tva.png`, `u3-tva-reglee.png`) · `familles` · `fiche-repliee` · `drive-pret`
- B1 OK · B2 OK — le ruban domine · B3 OK — 85 mots · B4 OK · B5 non mesuré · B6 OK — 28/14/12 · B7 OK — CONTRASTE OK
  (étiquettes du ruban sur leur propre fond : Malts en noir, Levures en blanc) · B8 OK · B9 partiel · B10 OK
- B11 « 23 lignes font bien 86,50 ; la TVA imprimée dépasse ; 6 épingles » · B12 OK · B13 partiel — les parts de 0,10 CHF du ruban
  ne se touchent pas seules : on passe par la rangée de famille (cible 32 px)

## Contrôles (sorties)
- PAGE OK · COMMUN OK (série ; un premier passage avait CONTRASTE ECHEC sur « Malts » et « Levures », corrigé) · MOTS OK (85) ·
  CONTRASTE OK · PANEL OK (série)

## Ce qui tient, ce qui casse
- Tient : « rien ne manque » se voit d'un coup ; la TVA incohérente est un dessin, pas une phrase ; la répartition de l'achat
  (levures 34 %) est une information neuve.
- Casse : une ligne de 0,10 CHF est trop fine pour son doigt ; les épingles des houblons se tassent (leader de 8 px).

Captures : `u3-haut.png`, `u3-page.png`, `u3-repos.png`, `u3-segment-levures.png`, `u3-point-tva.png`, `u3-tva-reglee.png`,
`u3-enregistre.png`, `u3-1280.png`.
