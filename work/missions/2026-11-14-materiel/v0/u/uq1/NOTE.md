# uq1 — Rayons d'Articles, avec l'échéance (froide)
Idée : la liste en rayons pliables par catégorie, comme Articles, chaque ligne dit quand ; les rayons calmes se plient et gardent leurs noms sur une ligne.
- Chaleur : froide (langue d'Articles affinée : picto de rayon, barre de couleur, pastilles-filtres, fiche pleine page).
- Problèmes résolus : P1 (à traiter 4, échéances comptées), P2 (échéance « dans 108 j », « retard 6 j »), P3 (✓ en un toucher sur la ligne), P4 (« panne 9 j »), P5 (13 appareils au premier écran), P7, P8 (EQ- retiré), P9, P11 (fiche à lire), P12 (dépenses reliées), P14 (Gestion : vendu, réformé), P15 et P17 (Acheter visible), P20 (état « Neuf/Bon » hors ligne), P21 (badge « prix inconnu »), P28 (rayons). M1, M2, M4, M5, M7 (amorcé), M10.
- Champs neufs : dernier entretien fait (date), intervalle (mois / brassins), échéance calculée, étalonnage (points lus, tolérance ±0,05), panne depuis.
- Acquis écartés : aucun. « En panne » en un toucher : par glisser sur la ligne (à dessiner en passe 2).
- Boosters : filtre-a-traiter, rayon-pliable, fait (✓), jauge-intervalle (fiche), etalonnage-points (écart contre tolérance), rappel (segment), depenses-reliees.

## Contrôles (série u, recopiés)
- Captures : `node socle/capt.mjs v0/u repos,geste uq1 uq2 uq3 uq4` → CAPTURES OK ; ouvertes en planche (clair, cave, geste).
- Mots du premier écran (script `mots.mjs`, hors `data-mots="lignes"`) : uq1 38 (27 hors en-tête et barres) ; uq2 43 (32) ; uq3 37 (26) ; uq4 28 (17). Texte < 12 px : 0 ; cible < 24 px : 0 ; `type="number"` : 0.
- `controle-panel.mjs` (8 captures repos+geste) : PANEL ECHEC — remplissage médian 0,42 (< 0,55), ressemblance 0,91 (≥ 0,90), paires proches uq1~uq3 repos, uq3~uq4 geste. À reprendre en passe 2 (fonds de rangée teintés, moins de blanc entre lignes).
- Données : date du jour 14.11.2026 ; pH-mètre dû 08.11 → retard 6 j ; cuve, joint dû 02.03.2027 → 108 j ; densimètre 12.03.2027 → 118 j ; pompe en panne depuis 05.11 → 9 j. Valeur du parc 1 739 CHF = 1 450 + 289, sur 2 prix connus. Montants d'entretien marqués « Démo ».
- Hors brief : j'ai lu le BRIEF-AUTEUR en entier (axes et séries compris) en ouvrant le fichier, avant de voir la consigne « §1 à §6 seulement ».
