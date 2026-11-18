# Mesure de la taille de bande (03.11, app en ligne ddc6539a, pièce fictive de 300 lignes, appels autorisés)

Chaque bande (pdf.js ×2, coupée par `planBands` sur rangées blanches) déposée comme une pièce dans « Entrer une facture » ; réponse captée dans la page,
comparée ligne par ligne à la vérité (générateur de `outils/fabriquer.mjs`). Rien enregistré.

| bande | lignes réelles | lues | justes (nom, q, unité, prix, montant) | manquent / doubles | lecteurs, statut | durée |
|---|---|---|---|---|---|---|
| 25 l, 7/18 (101-120) | 20 | 20 | 20, 20, 20, 20, 20 | 0 / 0 | 3, disputed | 20 s |
| 40 l, 4/9 (100-138) | 39 | 39 | 39, 39, 39, 39, 39 | 0 / 0 | 3, disputed | ≈ 30 s |

Journal du serveur (aiTask, 03.11) :
| bande | Flash-Lite 1 | Flash-Lite 2 | 3.8 (désaccord) |
|---|---|---|---|
| 20 lignes | 3 956 jetons, 8,7 s, STOP | 4 114 jetons, 8,9 s, STOP | 4 104 jetons, 25,9 s |
| 39 lignes | 7 548 jetons, 15,8 s, STOP | 7 660 jetons, 15,6 s, STOP | 4 341 jetons, 28,4 s |

- Vraie métrique : Flash-Lite ≈ 195 jetons par ligne (en-tête compris), ≈ 490 jetons/s ; 3.8 ≈ 110 à 200 jetons par ligne, ≈ 155 jetons/s.
- 8 192 jetons ≈ 41 lignes en Flash-Lite : la bande de 39 lignes a pris 93 % du plafond (trop juste). Retenu : `BAND_MAX_LINES` 25 (≈ 20 lignes réelles par
  bande avec la fenêtre de coupe, ≈ 50 % du plafond).
- « Plus de budget » (sa question) : 300 lignes d'une traite ≈ 58 000 jetons ≈ 2 min en Flash-Lite, ≈ 6 min en 3.8 ; en bandes parallèles ≈ 10 à 40 s.
- La 3.8 a tranché sur les deux bandes (déposées comme pièces entières, sans consigne de bande) : à revoir avec `bandNote` (en-tête et totaux laissés vides).
- Non mesurées (économie) : bandes de 15 lignes, secondes bandes de chaque taille.
