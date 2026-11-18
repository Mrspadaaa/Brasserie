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

## Passe 2 (p2-z2, 14.11.2026)
- Défauts corrigés : D1 tri par jours restants (17, 36, 44, 108 j), la barre garde sa part ; D2 l'écoulé porte une strie basse de 5 px (cave 160·146·134 sur 18·16·14, environ 5:1 ; clair 150·140·130 sur blanc, environ 3,4:1), le fond de barre reste discret pour que le nom se lise ; D3 densimètre « jamais étalonné » en barre pointillée, compté (« À traiter · 4 »), bouton Étalonner ; D4 Déjà possédé et Projets en pied, Achat en bouton noir ; D5 fiche : la durée partout (en cours 34 j, 29, 33, 35 j), le dépassement en teinte ocre, légende ; D6 valeur du parc en pied (1 739 CHF, 2 prix connus), fiche remplie : état (segment de l'app), rythme, « utilisé 6 brassins depuis le 11.10 », dépenses, notes.
- Retouches communes : « panne 9 j », « retard 3 j » écrits ; légende de chaque teinte et hachure (échéance, écoulé, dépassé, panne, jamais fait ; fiche : rythme, durée, dépassement, tolérance, lu, tampon) ; gestes de ligne à 44 px ; coque : en-tête 36 px, soleil en cave, point du ⋮, logo jaune en cave ; « À traiter » reprend le nom du filtre de l'app sur la puce posée sur la ligne.
- Règle d'étalonnage corrigée : la tolérance ±0,05 couvre 31 à 69 % de la règle (v0 : ±0,033).
- États : `traiter` (après « Réparée » : la pompe repart de zéro, bord vert, « réparée 14.11 », compte 4 → 3, toast Annuler, puis « ensuite » Déshumidificateur 17 j) ; `ajout` (feuille Nouveau matériel : Achat · Déjà possédé · Projets ; rythme en puces et aperçu de la barre neuve, échéance 14.05.2027 à 181 j) ; `vide` (la ligne rouge seule, pistes fantômes, une phrase, Enregistrer un achat, Déjà possédé, Projets) ; `repos-1280` (barres de 560 px, la même ligne, fiche du pH-mètre à droite avec cycles et règle, sans rythme en une rangée).
- Champs neufs (inchangés) : rythme, dernier fait, compteur de brassins, valeurs lues, panne depuis, utilisé dans N brassins.
- Reste : le geste « Étalonner » de ligne ouvre la fiche (valeurs à saisir), il ne valide pas d'un toucher ; la fiche 1280 n'a pas les dépenses (panneau court) ; recherche sans résultat non dessinée.
