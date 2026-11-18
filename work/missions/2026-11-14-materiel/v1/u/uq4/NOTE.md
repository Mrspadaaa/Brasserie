# uq4 — Grille à anneaux (chaude)
Idée : une tuile par appareil, son picto au centre d'un anneau qui se remplit avec le temps depuis le dernier entretien ; plein = dû, rouge = dépassé, tirets = jamais fait, sans anneau = sans rappel.
- Chaleur : chaude (grille de tuiles à picto, tout le parc d'un coup d'œil, 13 appareils + 2 tuiles d'ajout).
- Problèmes résolus : P1, P2, P3 (✓ au coin de la tuile), P4, P5, P7, P8, P11, P12, P15, P17 (tuiles « Déjà possédé », « Projets »), P20, P21. M1, M2, M4, M5, M10 (frise de vie : étalonnages et dépenses sur un même fil, montants à droite).
- Champs neufs : intervalle, dernier fait, échéance, étalonnage.
- Acquis écartés : rayons par catégorie (le picto porte la catégorie) ; P9 en partie seulement (langue d'Articles moins reprise).
- Pictos : pompe, refroidisseur à plaques, sonde pH, réfractomètre, densimètre, cuve, fermenteur conique, moulin, balance, capsuleuse, frigo, déshumidificateur, hotte. À éprouver à 12 px en passe 2.
- Boosters : anneaux-intervalle, fait, acheter, etalonnage-lu-attendu, frise-vie, enregistrer-etalonnage.

## Contrôles (série u, recopiés)
- Captures : `node socle/capt.mjs v0/u repos,geste uq1 uq2 uq3 uq4` → CAPTURES OK ; ouvertes en planche (clair, cave, geste).
- Mots du premier écran (script `mots.mjs`, hors `data-mots="lignes"`) : uq1 38 (27 hors en-tête et barres) ; uq2 43 (32) ; uq3 37 (26) ; uq4 28 (17). Texte < 12 px : 0 ; cible < 24 px : 0 ; `type="number"` : 0.
- `controle-panel.mjs` (8 captures repos+geste) : PANEL ECHEC — remplissage médian 0,42 (< 0,55), ressemblance 0,91 (≥ 0,90), paires proches uq1~uq3 repos, uq3~uq4 geste. À reprendre en passe 2 (fonds de rangée teintés, moins de blanc entre lignes).
- Données : date du jour 14.11.2026 ; pH-mètre dû 08.11 → retard 6 j ; cuve, joint dû 02.03.2027 → 108 j ; densimètre 12.03.2027 → 118 j ; pompe en panne depuis 05.11 → 9 j. Valeur du parc 1 739 CHF = 1 450 + 289, sur 2 prix connus. Montants d'entretien marqués « Démo ».
- Hors brief : j'ai lu le BRIEF-AUTEUR en entier (axes et séries compris) en ouvrant le fichier, avant de voir la consigne « §1 à §6 seulement ».

## Passe 2
- Défauts corrigés : D1 une seule teinte d'écoulé (encre), ocre quand c'est dû, rouge pour retard ou panne, tirets pour
  « jamais fait », légende sous la grille ; la pompe en panne n'a plus d'anneau en tirets (tuile rouge, « panne 9 j ») ;
  D2 pictos redessinés : fermenteur conique à pieds écartés, échangeur à plaques à ports, balance de poche à écran, pompe
  à volute, densimètre dans l'éprouvette, capsuleuse à leviers ; D3 tuiles basses (2 colonnes, 44 px, pastille Neuf/Bon)
  pour les 7 sans rappel ; D4 « retard 6 j » sous l'anneau de la fiche ; D5 fiche : rythme (« tous les − 1 mois + »,
  dû 08.11), état (Neuf, Bon, À entretenir, À réparer), notes, gestion (Vendu, Réformé, Supprimer).
- Retouches communes : « retard 6 j », « panne 9 j » ; filtre « À traiter 4 » (pompe, pH-mètre, refroidisseur,
  réfractomètre jamais étalonné) ; légende de chaque couleur et tiret ; ✓ 44 × 44 px (mesuré) ; coque de l'app ; Acheter
  dans la barre, Déjà possédé et Projets en tuiles ; aucun « champ neuf » à l'écran.
- États : traiter (4 tuiles ; après ✓, le pH-mètre passe au vert, anneau reparti presque vide, « dans 30 j », toast
  Annuler, À traiter 3) ; ajout (feuille « Nouveau matériel » : segment Enregistrer un achat / Déjà possédé, choix du
  picto qui préremplit la catégorie, rappel avec aperçu de l'anneau, Projets d'équipement) ; vide (tuiles Déjà possédé
  et Projets d'équipement, Enregistrer un achat, anneaux fantômes) ; 1280 (grille de 6 colonnes, tuiles basses en 4,
  prochaines échéances sur 4 mois, fiche à droite, notes masquées pour garder le pied visible).
- Contrôles (`voies/p2-u2/verif.mjs uq4`) : repos 49 mots ; texte < 12 px : 0 ; tronqué : 0 ; hors cadre : 0 ; captures
  `node socle/capt.mjs v1/u repos,geste,traiter,ajout,vide,repos-1280 uq4` → CAPTURES OK.
- Reste : le nom de la cuve d'ébullition tient sur 3 lignes dans sa tuile (lisible, serré) ; pictos à éprouver à 12 px par
  le critique ; la capture 1280 finale (frise des échéances) n'a pas été rouverte après la dernière retouche.
