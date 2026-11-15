EN COURS — voie f2 (CP-1) : écrans revus un par un sur `?dev-local&finance-demo=reel` (serveur localhost:3001), 390 clair, captures ouvertes.

## Fixture
`src/dev/financeDemo.ts` : `financeDemoEntries(jeu?)` lit `?finance-demo=reel` (ou le paramètre) → `financeDemoReel()` : une vente unique 10 × « Bière · 75 cl » 5 695,00 TWINT (ligne libre), travaux 5 500,00 + divers 250,20 + deux petits achats (levure 2,40, malt 12,80) le même jour, AUCUN solde de départ ni volume annuel, un brassin conditionné nommé « Ssr » sans chiffrage (coût du litre inconnu), deux brassins planifiés, deux anciens tarifs sans format (« Amber Ale 50 cl (0 hl) », prix 0). IBAN d'exemple SIX, rien de réel. Sans paramètre : la démo complète inchangée.
Script de capture : `voies/f2/capturer.mjs <ecran> <etiquette> [reel|plein]` ; captures dans `voies/f2/captures/`.

## 1. Annuel (g6) — FAIT
Avant (`captures/annuel-avant-tete.png`) : perte de 70,40 = 3 px de trou à l'échelle ; le texte (−70,40, « CHF perdus », badge « Stock au 31 déc. ? ») débordait sur « Entré 5 695,00 » (illisible).
Après (`captures/annuel-apres-tete.png`, ouverte) : le trou garde sa vraie hauteur (liseré hachuré rouge, dashed) ; le résultat rouge, « CHF perdus » et le badge du stock se posent juste au-dessus ; la pile verte « Entré 5 695,00 » et sa légende sont entières. Seuil : écart < 96 px (perte) / 56 px (gain, même traitement). Au-dessus du seuil : le trou g6 tel quel (démo complète, test inchangé). Texte « Local et travaux » assombri (`#24100a`) sur l'orange.
Tests : `tests/integration/f2ReelAnnuel.test.tsx` (3) + `annuelEcran` (11) verts. Le test d'état échoue sur HEAD (pas de `.ann-trou-mince`).

## 2. Prévisions (p5b) — FAIT
Avant (`captures/previsions-avant2-haut.png`) : deux étiquettes « achats −2,40+, 10.11 » et « achats −64+, 10.11 » empilées sur la même marche ; « + » final incompris ; dessin de 500 px dont 80 % vides pour une seule marche.
Après (`captures/previsions-apres-haut.png`, ouverte) : une marche = UNE étiquette « achats ≥ 66,40 ×2, 10.11 » (pointillé = partiel ; toucher ouvre la liste « sorties », chaque achat y a sa ligne) ; « ≥ » (au moins) à la place du « + », le même signe que Prix et Argent ; hauteur du dessin 280 + 55 × marches, plafonnée à 500 (4 marches et plus : p5b inchangé) ; « aujourd'hui » entier.
Tests : `f2ReelPrevisions.test.tsx` (4) ; `previsionsCorrectifs` mis à jour (« emballage ≥ 24, 03.12 », ex-« −24+ »). Prévisions + Prix + Clients : 12 fichiers, 114 tests verts.
Limite : un lot mêle les sorties de même jour ; la légende « À payer / Prévu » ne compte pas les brassins (inchangé, hors CP-1).

## 3. Prix (c7c) — FAIT
Avant (`captures/prix-avant-haut.png`) : sans coût du litre, le graphe était remplacé par une carte de texte « coût ? Le coût du litre n'est pas encore complet… » ; puces « Amber Ale 50 cl (0 hl) · 0,00 » ; « ? L nets » seul ; tuiles sans reste.
Après (`captures/prix-apres-haut.png`, `prix-apres2-75cl.png`, ouvertes) : le graphe garde le cadre de c7c (nouveau `GrapheInconnu`) : colonnes et règle « à perte · mince · il te reste » hachurées, deux échelles « /an /bouteille » (0 franc, « ? » ailleurs), pente en pointillé, zéro, cran du prix ; avec un prix saisi (9,50) l'aiguille et le cran noir restent francs, le reste est « reste ? » hachuré ; « ? CHF/L · à compléter › » ouvre le coût du brassin ; bandeau « ? L nets ▒▒▒ ? paient le brassin ? pour toi » ; tuiles « ≤ ? » ; puces « Amber Ale 50 cl · ? » (« (0 hl) » retiré de l'affichage, prix 0 = « ? », nom entier en title).
Tests : `f2ReelPrix.test.tsx` (10).

## 4. Opérations (v6b) — FAIT sauf le client doublé (hors Possède, voir DÉCISION)
Avant (`captures/operations-avant-haut.png`) : titre « Vente 10 × Bière · 75 cl — Restaur… » coupé ; piles à la largeur de l'écran (une vente = une barre pleine largeur).
Après (`captures/operations-apres-haut.png`, ouverte) : titre sur deux lignes (clamp 2) au lieu de la coupe ; colonnes de pile plafonnées à 76 px (`space-evenly`, v6b a 5 colonnes de ~62 px, donc inchangé à 5) ; la pièce dit « ticket · 10 pièces » (ex-« Bière · 75 cl 10 pièce »), un kilo garde son libellé (« Pilsner 25 kg »).
Reste visible sur la capture : « Restaurant du Lac · Restaurant du… » (le client est dans la description ET en tiers). Helper prêt et testé : `tiersAAfficher(description, tiers)` dans `operations/calculs.ts`. L'appliquer demande 1 ligne dans `src/ui/finance/TransactionRow.tsx` (hors Possède).
Tests : `f2ReelOperations.test.tsx` (4) ; `operationsCalculs` (11) verts.

## 5. Caisse (v3a) — RIEN À CORRIGER
Captures `captures/caisse-avant-haut.png`, `caisse2-avant-panier.png`, `caisse2-avant-qr.png` (ouvertes), lot « Ssr » sans chiffrage, un tarif 75 cl à 9,50, 33 cl et fût sans prix. La forme de v3a tient : ligne clients (Restaurant du Lac, Comptoir, + client), carte bière (« 15 L nets » avec barre hachurée : le vendu est inconnu), tuiles de format (« prix ? » grisées, 75 cl à 9,50 + compteur), panier, Payé ici / Facture QR, échéance, « adresse ? » hachuré sous le total, annexe quittance. Panier de 2 × 75 cl = 19,00 CHF correct.

## 6. Argent du brassin (e3a) — FAIT
Avant (`captures/argent-avant-haut.png`) : marches 1, 3, 4, 6 réduites à une ligne de texte (« coût du litre à compléter », « coût du format à compléter », « prix ? », « prix ou coût à compléter »).
Après (`captures/argent-apres-haut.png`, ouverte) : chaque marche garde son dessin, hachuré : ① barre des trois notions + « payé ? · à payer ? · année ? » ; ③ barre bière/emballage/impôt + « bière ? · emballage à compléter · impôt 0,08 » (l'impôt connu reste franc) ; ④ règle « à perte · mince · il te reste » ; ⑥ barre des bouteilles + « ? paient ? · vendu ? ». Marche ② (impôt, °P ex.) inchangée.
Tests : `f2ReelArgent.test.tsx` (2) ; `prixEcran` + `prixCorrectionsFz` (18) verts.
