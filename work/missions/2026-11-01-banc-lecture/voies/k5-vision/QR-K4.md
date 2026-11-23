# +Q — le QR-facture comme garde-fou (hors ligne, aucun appel)

Sorties rejouées : banc-k4-20261101-092139, banc-k4-20261101-092352, banc-k4-20261101-092559, banc-k4-20261101-093815. Aucune valeur des documents ici : des comptes et des noms de champs.
Règle : un champ porté par le QR (montant, devise, n° de facture, date) qui diffère du résultat interdit `checked` (il devient `disputed`) et le QR propose sa valeur. Plusieurs QR sur une pièce : un champ n’est contredit que si aucun ne le confirme. Un QR absent ou invalide ne change rien.

## Les QR par pièce (lus par zxing ; PDF rendus à 3×)

| document | genre | textes QR lus | QR-facture suisses | valides | montant | devise | n° facture | date |
|---|---|---|---|---|---|---|---|---|
| doc1 | capture | 0 | 0 | 0 | absent | absent | absent | absent |
| doc2 | photo | 0 | 0 | 0 | absent | absent | absent | absent |
| doc3 | photo | 2 | 2 | 2 | juste | juste | absent | absent |
| doc4 | photo | 1 | 0 | 0 | absent | absent | absent | absent |
| doc5 | photo | 0 | 0 | 0 | absent | absent | absent | absent |
| doc6 | capture | 0 | 0 | 0 | absent | absent | absent | absent |
| doc7 | capture | 0 | 0 | 0 | absent | absent | absent | absent |
| doc8 | PDF | 1 | 1 | 1 | juste | juste | juste | juste |
| doc9 | PDF | 1 | 1 | 1 | juste | juste | juste | juste |
| doc10 | plusieurs captures | 0 | 0 | 0 | absent | absent | absent | absent |
| doc11 | plusieurs captures | 0 | 0 | 0 | absent | absent | absent | absent |
| doc12 | plusieurs captures | 0 | 0 | 0 | absent | absent | absent | absent |

## Avant et après — banc-k4-20261101-092139

| variante | parcours (avec QR) | champs justes avant → après | faux verts avant → après | alertes ajoutées (justes / inutiles) | champs corrigés / gâtés |
|---|---|---|---|---|---|

## Avant et après — banc-k4-20261101-092352

| variante | parcours (avec QR) | champs justes avant → après | faux verts avant → après | alertes ajoutées (justes / inutiles) | champs corrigés / gâtés |
|---|---|---|---|---|---|
| Sv Hv + schéma du banc | 1 (0) | 0 / 0 → 0 / 0 | 0 → 0 | 0 (0 / 0) | 0 / 0 |

## Avant et après — banc-k4-20261101-092559

| variante | parcours (avec QR) | champs justes avant → après | faux verts avant → après | alertes ajoutées (justes / inutiles) | champs corrigés / gâtés |
|---|---|---|---|---|---|
| A production | 7 (1) | 72 / 81 → 73 / 81 | 0 → 0 | 0 (0 / 0) | 1 / 0 |
| C Flash-Lite ×2 puis 3.8 | 7 (1) | 73 / 81 → 73 / 81 | 0 → 0 | 0 (0 / 0) | 0 / 0 |
| C★v valeurs de la 3.8, statut du vote | 7 (1) | 73 / 81 → 73 / 81 | 0 → 0 | 0 (0 / 0) | 0 / 0 |
| Lm C★v réflexion medium | 7 (1) | 71 / 81 → 71 / 81 | 0 → 0 | 0 (0 / 0) | 0 / 0 |
| Lh C★v réflexion high | 7 (1) | 49 / 57 → 49 / 57 | 0 → 0 | 0 (0 / 0) | 0 / 0 |
| Lp C★v consigne Flash-Lite | 7 (1) | 71 / 81 → 71 / 81 | 0 → 0 | 0 (0 / 0) | 0 / 0 |
| Hv C★v consigne après les images, sans température | 7 (1) | 70 / 81 → 70 / 81 | 1 → 1 | 0 (0 / 0) | 0 / 0 |
| Sv Hv + schéma du banc | 7 (1) | 71 / 81 → 71 / 81 | 0 → 0 | 0 (0 / 0) | 0 / 0 |
| Uv Sv + images ULTRA_HIGH | 7 (1) | 74 / 81 → 74 / 81 | 0 → 0 | 0 (0 / 0) | 0 / 0 |
| Av C★v + 3.8 avec exécution de code | 7 (1) | 75 / 81 → 75 / 81 | 0 → 0 | 0 (0 / 0) | 0 / 0 |
| Tv Hv + tuiles | 7 (1) | 71 / 81 → 71 / 81 | 0 → 0 | 0 (0 / 0) | 0 / 0 |

## Avant et après — banc-k4-20261101-093815

| variante | parcours (avec QR) | champs justes avant → après | faux verts avant → après | alertes ajoutées (justes / inutiles) | champs corrigés / gâtés |
|---|---|---|---|---|---|
| A production | 5 (2) | 53 / 60 → 53 / 60 | 0 → 0 | 0 (0 / 0) | 0 / 0 |
| C★v valeurs de la 3.8, statut du vote | 5 (1) | 44 / 48 → 44 / 48 | 0 → 0 | 0 (0 / 0) | 0 / 0 |
| Av C★v + 3.8 avec exécution de code | 5 (1) | 43 / 48 → 43 / 48 | 0 → 0 | 0 (0 / 0) | 0 / 0 |

## Lecture honnête

- « Faux verts après » garde les valeurs du résultat et ne change que le statut : c’est ce que le QR interdit. « Champs justes après » adopte la valeur proposée par le QR, pour dire ce qu’elle vaudrait ; la production ne la remplace pas sans l’accord de l’utilisateur.
- Un QR ne couvre que les pièces qui en portent un (factures suisses avec bulletin) ; une alerte « inutile » est un QR qui diffère d’un résultat juste (un montant de bulletin autre que le total, par exemple) : elle se lit dans la colonne des alertes.
- Peu de pièces : un compte de 0 ou de 1 est un indice, pas une mesure.
