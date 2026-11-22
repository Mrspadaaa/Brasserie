# zq3 — La ligne d'échéance (chaude)

Idée : chaque appareil est une jauge, de « dernier fait » à une ligne rouge commune, « échéance » ; tout le parc court vers la même ligne, ce qui la dépasse déborde en hachures ; le nom vit dans la barre, comme Malt Pilsner dans Articles. Sans rythme : barre vide en pointillé.

- Problèmes résolus : P1 (« échéance · 3 » = filtre À traiter), P2, P3, P4, P5, P7, P8, P9 (barre nommée à la manière d'Articles), P11, P12, P15, P20, P21, P28 (tri par part d'intervalle écoulée). Parcours : M1, M2, M4, M5, M8 en partie (le détartrage se compte en brassins, 5 crans), M10 (cycles passés).
- Champs neufs : rythme, dernier fait, compteur de brassins, étalonnage lu, panne depuis.
- Données : part écoulée = jours depuis le dernier fait / intervalle (pH-mètre 34/31 = 110 % ; déshumidificateur 74/91 = 81 % ; frigo 147/183 = 80 % ; cuve 257/365 = 70 % ; réfractomètre 47/91 = 52 %) ; échelle 252 px = 100 %. Cycles du pH-mètre : 29, 33, 35 j entre étalonnages (fictifs) : il étalonne souvent en retard, et la fiche le montre.
- Acquis écartés : pastille d'état hors de la liste (P20) ; Déjà possédé et Projets dans le ⋯.
- Écart : une unité (brassins) et des jours sur la même ligne : chaque barre dit sa propre unité à droite.

## Boosters UX (boosters-ux)
- course-echeance : comparer et suivre ; barres alignées sur une ligne commune ; ce qui est dû se voit sans lire.
- filtre-a-traiter (sur la ligne), reparee, etalonner, fait, achat, fixer-rythme (barre vide).
- Fiche : cycles (dents de scie des étalonnages), regle-etalonnage (règle autour de 4,00 et 7,00, bande de tolérance, repère du lu), depenses-reliees, payer-entretien, enregistrer-etalonnage.
- Mesures v0 : 44 mots hors noms ; 0 texte < 12 px ; 0 `type="number"` ; 12 `data-booster`. B2 à B13 en passe 2.
