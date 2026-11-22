# Paliers de compactage de sources2 (16.11, retouche, pas création)

Base : `c85/sources2/proto.html` figé au repos (390 × 844, sans script) = `p0.html` ; chaque palier = le précédent + une seule
réduction d'une zone qu'il a entourée. Greffes sur p4 : `g-a3.html`, `g-d1.html`. Outils : `snap.mjs` (fige p0), `build.mjs`
(paliers), `cap.mjs` (captures 390 × 844 DPR 2 + mesures, `cap/mesures.json`), `verif.mjs` (`cap/verif.txt`).

| fichier | réduction | tête (haut de la 1re rangée) | rangées visibles (titre / entières, sur 7) | + (haut) |
|---|---|---|---|---|
| p0 | sources2 tel quel | 354 px, 41,9 % | 5 / 5 | 554 |
| p1 | en-tête sur une ligne : « 113 CHF ● S24 ⌄ … ⏲ 2 en retard ⛶ » (plein écran en icône sans cadre) | 318 px, 37,7 % | 6 / 5 | 722 |
| p2 | segmenté 6 sem./3 mois/6 mois/An → puce « 6 sem. ⌄ » sur la ligne d'en-tête | 276 px, 32,7 % | 7 / 6 | 682 |
| p3 | bande des semaines sur 2 lignes : « nov. S47 … déc. S50 💡 » + montants ; « manque 2 j » → silhouette rouge après 5 120 ; ligne « libre en fin de semaine » et ligne des mois retirées | 206 px, 24,4 % | 7 / 6 | 610 |
| p4 | titre de rangée sur la ligne de sa 1re barre, dans l'espace libre (Ventes à gauche ; Brassins, Fêtes à droite) | 206 px, 24,4 % | 7 / 7 | 530 |
| g-a3 | p4 ; 113 retiré de l'en-tête, couché au-dessus du creux, à gauche du pointillé S24, « CHF au plus bas · S24 » à droite ; en tête : 6 sem. ⌄, tri, 2 en retard, plein écran | 206 px, 24,4 % | 7 / 7 | 530 |
| g-d1 | p4 ; ligne de tête de d1 (113 CHF sans passer sous 0 · S24 ⌄, ⏲ 2, ⛶) ; « 6 sem. ⌄ » posé sur le cadre de la courbe comme d1 | 202 px, 23,9 % | 7 / 7 | 730 |

Gain : p0 → p4, tête −148 px (41,9 % → 24,4 %) ; rangées entières 5 → 7. Texte min 14 px partout, aucun débordement horizontal.

## Rien d'autre ne change (verif.mjs)
- Géométrie de chaque barre, étiquette, pied et lien, relative au haut de sa rangée, au 1/100 px : IDENTIQUE à chaque palier
  (p0→p1→p2→p3→p4, p4→g-a3, p4→g-d1). Seuls les hauts de rangée remontent.
- Courbe (svg) : pixels identiques p0 → p4 ; change seulement dans les greffes (113 couché ; puce 6 sem.).
- Écart de pixels sur certains recadrages de rangée (vente, brassage, activité, charge) alors que la géométrie est identique :
  non élucidé (recadrage d'élément hors écran et voisinage : ombre de la bande, colonnes) ; à regarder sur les captures.

## Écarts et choix faits (à valider)
- Le + suit la règle k18 de sources2 rejouée à chaque palier (part de 70 px au-dessus des onglets, à droite, monte de 8 px
  tant qu'il couvre une barre) : sa hauteur change donc d'un palier à l'autre ; figé tel quel, il couvrait le fût « 3 » dès p2.
- Tri des rangées : son bouton vivait dans le bloc « libre en fin de semaine » ; sans place sur la ligne d'en-tête de p3/p4
  (113, S24, 6 sem., 2 en retard, plein écran remplissent les 366 px), il passe dans le menu de la puce « 6 sem. ⌄ ».
  Visible en g-a3 (tête sans le 113). En g-d1, comme dans d1, il n'est pas au premier plan.
- p4 : Achats, Activités, Papiers n'ont pas de place libre sur la ligne de leur 1re barre (étiquette ou barre dès la gauche) :
  leur titre garde sa ligne. Travaux est vide : titre seul. Brassins et Fêtes se posent à droite de leur barre.
- p1 : la phrase « à dépenser sans passer sous 0 » quitte l'écran (gardée en aria-label) ; g-d1 la remet en « sans passer sous 0 ».

- 16.11, règle du brasseur « En bas à droite un peu au dessus des Tab » : le + est fixe, identique sur les 7 fichiers (44 px, bas à 772, onglets à 788 : écart 16 px CSS, x = 295) ; la règle k18 (colonne « + (haut) » ci-dessus, périmée) n'est plus rejouée. Marge basse de la frise 88 → 128 px. Captures et webp de page6 refaits. Sur p0, le + couvre « 540 » de la commande de malt au repos : à voir.

Captures : `cap/p0.png`, `cap/p1.png`, `cap/p2.png`, `cap/p3.png`, `cap/p4.png`, `cap/g-a3.png`, `cap/g-d1.png` (ouvertes).
