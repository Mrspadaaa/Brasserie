# +Q — le QR-facture comme garde-fou (hors ligne, aucun appel)

Sorties rejouées : banc-k5-A, banc-k5-B1, banc-k5-B2. Aucune valeur des documents ici : des comptes et des noms de champs.
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
| doc13 | photo | 0 | 0 | 0 | absent | absent | absent | absent |

## Avant et après — banc-k5-A

| variante | parcours (avec QR) | champs justes avant → après | faux verts avant → après | alertes ajoutées (justes / inutiles) | champs corrigés / gâtés |
|---|---|---|---|---|---|
| C Flash-Lite ×2 puis 3.8 | 6 (2) | 61 / 72 → 61 / 72 | 0 → 0 | 0 (0 / 0) | 0 / 0 |
| C★v valeurs de la 3.8, statut du vote | 6 (2) | 67 / 72 → 67 / 72 | 0 → 0 | 0 (0 / 0) | 0 / 0 |
| C★v8 C★v, sortie Flash-Lite 8 192 | 6 (2) | 64 / 72 → 64 / 72 | 0 → 0 | 0 (0 / 0) | 0 / 0 |
| Pv PDF lu page par page | 2 (2) | 23 / 24 → 23 / 24 | 0 → 0 | 0 (0 / 0) | 0 / 0 |
| Bv image haute lue par bandes | 4 (0) | 44 / 48 → 44 / 48 | 0 → 0 | 0 (0 / 0) | 0 / 0 |

## Avant et après — banc-k5-B1

| variante | parcours (avec QR) | champs justes avant → après | faux verts avant → après | alertes ajoutées (justes / inutiles) | champs corrigés / gâtés |
|---|---|---|---|---|---|
| C Flash-Lite ×2 puis 3.8 | 9 (3) | 96 / 105 → 96 / 105 | 0 → 0 | 0 (0 / 0) | 0 / 0 |
| C★v valeurs de la 3.8, statut du vote | 9 (3) | 96 / 105 → 96 / 105 | 0 → 0 | 0 (0 / 0) | 0 / 0 |
| Avl C★v, Flash-Lite avec exécution de code | 9 (3) | 96 / 105 → 96 / 105 | 0 → 0 | 0 (0 / 0) | 0 / 0 |

## Avant et après — banc-k5-B2

| variante | parcours (avec QR) | champs justes avant → après | faux verts avant → après | alertes ajoutées (justes / inutiles) | champs corrigés / gâtés |
|---|---|---|---|---|---|
| C Flash-Lite ×2 puis 3.8 | 13 (3) | 135 / 153 → 135 / 153 | 0 → 0 | 0 (0 / 0) | 0 / 0 |
| C★v valeurs de la 3.8, statut du vote | 13 (3) | 140 / 153 → 140 / 153 | 0 → 0 | 0 (0 / 0) | 0 / 0 |
| Zv C★v, la 3.8 ne relit que la zone en cause | 13 (3) | 140 / 153 → 140 / 153 | 0 → 0 | 0 (0 / 0) | 0 / 0 |

## Lecture honnête

- « Faux verts après » garde les valeurs du résultat et ne change que le statut : c’est ce que le QR interdit. « Champs justes après » adopte la valeur proposée par le QR, pour dire ce qu’elle vaudrait ; la production ne la remplace pas sans l’accord de l’utilisateur.
- Un QR ne couvre que les pièces qui en portent un (factures suisses avec bulletin) ; une alerte « inutile » est un QR qui diffère d’un résultat juste (un montant de bulletin autre que le total, par exemple) : elle se lit dans la colonne des alertes.
- Peu de pièces : un compte de 0 ou de 1 est un indice, pas une mesure.
