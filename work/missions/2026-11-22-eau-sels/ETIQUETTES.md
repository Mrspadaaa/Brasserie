# EAU-RADAR-ETIQUETTES — état de l'art et décision (22.11)

1. Problème d'école : placement d'étiquettes de points (point-feature label placement, modèle à positions candidates d'Imhof / Christensen) sur un graphe polaire ; la boîte de chaque étiquette est mesurée (getBBox), jamais devinée.
2. Position : au bout de l'axe (polaire, rayon R + marge), ancre selon l'angle (start à droite, end à gauche, middle en haut et en bas) ; Cl et Mg sur une ligne (symbole, valeur, plage), les flancs sur deux.
3. Candidates : toutes les positions de la boîte à ≤ 24 px du bout d'axe, entières dans la toile, hors du disque, sans chevaucher une autre étiquette ni la légende (posée dans un coin libre de la toile) ; score = distance au bout + écart à la direction de l'axe ; placement glouton du plus contraint au moins contraint.
4. Taille : recherche dichotomique du plus grand rayon R pour lequel les six étiquettes, la légende et K⁺ trouvent une place ; boîtes mesurées sur un gabarit de valeur large (« 888 ▲ »), pour que la toile ne bouge pas pendant la pesée.
5. Graduations : sur la diagonale libre Cl–SO₄, tues si leur boîte touche une étiquette. Pas de bibliothèque (d3-labeler, recuit simulé) : 6 étiquettes et un espace fermé ; la recherche exhaustive sur grille de 2 px est exacte et coûte quelques ms.
