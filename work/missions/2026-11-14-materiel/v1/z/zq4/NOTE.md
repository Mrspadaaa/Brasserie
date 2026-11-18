# zq4 — Les bons de travail (chaude)

Idée : ce qui demande son attention devient des bons d'atelier pendus à une tringle (un verbe, un appareil, un chiffre, un bouton) ; dessous, « Bientôt » ; puis le reste. Ouvrir un bon, c'est la marche à suivre (l'étalonnage pas à pas), cochée et datée.

- Problèmes résolus : P1 (Bons · 3), P2, P3 (Réparée / Fait sur le bon), P4, P5 (13 au premier écran), P7, P8, P11 (la fiche est le bon), P12, P15, P20, P21, P22 (valeur du parc sur 2 prix connus), P28. Parcours : M1, M2, M3, M4 (étapes et valeurs lues), M5, M10 (talons des bons passés).
- Champs neufs : rythme, dernier fait, échéance, étapes d'étalonnage et valeurs lues, panne depuis, brassins depuis.
- Données : mêmes échéances que zq1 au 14.11.2026 ; dépense Démo ; parc 1 739 CHF sur 2 prix connus.
- Acquis écartés : la recherche passe en bouton (loupe) ; Déjà possédé et Projets dans le ⋯ ; pastille d'état hors liste.
- Écart : le bouton du bon pH-mètre dit « Ouvrir » (un étalonnage demande des valeurs) ; les bons ne sont pas des cartes génériques : verbe en tête, bord dentelé, tringle.

## Boosters UX (boosters-ux)
- rail-bons : déclencher ; verbe et chiffre, bouton de 44 px. bientot : suivre (jours en pastille, le plus proche en ocre).
- reparee, fait, etalonner, achat, valeur-parc.
- Fiche : bon-etalonnage (cases à cocher, valeur lue, écart), talons, depenses-reliees, payer-entretien, enregistrer-etalonnage (« Bon fait »).
- Mesures v0 : 46 mots hors noms ; 0 texte < 12 px ; 0 `type="number"` ; 12 `data-booster`. B2 à B13 en passe 2.

## Passe 2
Chaleur : chaude (forme libre), inchangée. Coque reprise de zq3 v1 (en-tête 36 px, lune au clair, soleil en cave, point du ⋮, gabarits injectés).

Défauts corrigés (SYNTHESE § zq4) :
- D1 : « Bons 3 » devient le filtre « À faire 4 » (le densimètre compte) ; « Sans bon 6 » devient « Sans échéance 5 ». Le bon reste la forme.
- D2 : quatre bons à 390 (≈ 88 px de large, ≈ 170 px de haut au lieu de 210) : le picto passe dans une pince ronde accrochée à la tringle, verbe 16 px, nom sur 2 lignes, puis libellé et valeur (« panne / 9 j », « retard / 3 j », « brassins / 5/5 », « étalonné / jamais »), bouton 44 px (Réparée, Ouvrir, Détartré, Étalonner). La cause va dans la fiche à 390, sur une ligne sous la valeur à 1280. Aucun nom tronqué ; « 9 j » sans espace large (unité à 0,18 em).
- D3 : bon « Étalonner · Densimètre + éprouvette » (à 1280 : « eau à 20 °C = 1,000 »).
- D4 : Déjà possédé et Projets ↗ en pied, à côté du parc « 1 739 CHF · 2 prix connus ». La loupe reste un bouton (écart v0 maintenu : la tringle a besoin de la largeur).
- D5 : fiche : « rythme chaque mois » et « tolérance ±0,05 » en tête du bon ; l'étape Ranger dit « KCl 3 mol/l ». Ajout de « Rythme et état » (segment Neuf/Bon/À entretenir/À réparer, rythme 31 j, utilisé 6 brassins depuis le 11.10), dépenses reliées et notes : plus de vide gris. Talons lisibles : « lu à pH 7 · pH 4 ». Bouton du pied « Étalonné » (au lieu de « Bon fait »).
- D6 : lune au clair, soleil en cave.
- Retouches communes : « retard 3 j » et « panne 9 j » toujours écrits ; jamais étalonné compté dans À faire ; légende (rouge en panne, ocre à faire, pastille ocre claire moins de 30 j ; vert fait à l'état traiter) ; boutons 44 px ; Achat, Déjà possédé, Projets visibles.

États dessinés : `repos`, `geste` (bon du pH-mètre ouvert), `traiter` (filtre À faire · 3 actif : le bon de la pompe s'est détaché de son crochet et tombe en talon vert « RÉPARÉE 14.11 », toast « Pompe réparée · état Bon · Annuler » ; ensuite les 4 échéances, Sans échéance replié), `ajout` (feuille Achat · Déjà possédé · Projets ; aperçu du futur bon « Entretenir · tous les 6 mois », premier bon 14.05.2027, dans 181 j), `vide` (tringle à 4 crochets vides, une phrase, Enregistrer un achat, Matériel déjà possédé, Projets d'équipement ; fantômes de Bientôt et Sans échéance), `repos-1280` (bons côte à côte avec leur cause, Bientôt et Sans échéance en deux colonnes, bon du pH-mètre ouvert en panneau à droite).

Données au 14.11.2026 : pompe en panne depuis le 05.11 (9 j) ; pH-mètre 11.10 + 31 j → 11.11 (retard 3 j) ; Déshumidificateur 01.12 (17 j), Frigo 20.12 (36 j), Réfractomètre 28.12 (44 j), Cuve d'ébullition 02.03.2027 (108 j) ; achat neuf 14.11.2026 + 6 mois = 14.05.2027 (181 j).

Ce qui reste : à 1280, environ 250 px libres sous le parc dans la colonne gauche ; à l'état traiter, environ 100 px libres au-dessus du toast. Les « tous les N brassins » n'ont pas d'aperçu de bon chiffré.
