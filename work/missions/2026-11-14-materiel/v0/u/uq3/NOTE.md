# uq3 — La chaîne du brassin (chaude)
Idée : le matériel rangé comme un plan de ligne, dans l'ordre du jour de brassage (moudre, brasser, refroidir, fermenter, capsuler, garder) ; un appareil en panne casse le rail ; les mesures courent sur une ligne à part.
- Chaleur : chaude (autre genre : un plan, pas une liste ; on voit où la chaîne casse avant le prochain brassin).
- Problèmes résolus : P1, P2, P3, P4 (rail cassé + « panne 9 j »), P5, P7, P8, P9, P11, P12, P15, P17, P21, P23 (le lien au brassage devient la forme même). M1, M2, M3 (en partie), M4, M5, M8, M10 (dérive des étalonnages).
- Champs neufs : étape du brassage par appareil (déduite en partie de BrewhouseProfile.equipmentRefs, sinon choisie), intervalle, échéance, étalonnage, tolérance.
- Acquis écartés : les rayons par catégorie cèdent à l'étape (la catégorie reste dans la fiche) : la question « puis-je brasser ? » vaut ce déplacement.
- Fiche : la dérive de la sonde sur 4 étalonnages (pH 4 monte de 0 à +0,03), bande de tolérance, place du prochain (« ? »).
- Boosters : chaine-brassage, filtre-a-traiter, fait, derive, etalonnage-lu-attendu, payer-entretien.

## Contrôles (série u, recopiés)
- Captures : `node socle/capt.mjs v0/u repos,geste uq1 uq2 uq3 uq4` → CAPTURES OK ; ouvertes en planche (clair, cave, geste).
- Mots du premier écran (script `mots.mjs`, hors `data-mots="lignes"`) : uq1 38 (27 hors en-tête et barres) ; uq2 43 (32) ; uq3 37 (26) ; uq4 28 (17). Texte < 12 px : 0 ; cible < 24 px : 0 ; `type="number"` : 0.
- `controle-panel.mjs` (8 captures repos+geste) : PANEL ECHEC — remplissage médian 0,42 (< 0,55), ressemblance 0,91 (≥ 0,90), paires proches uq1~uq3 repos, uq3~uq4 geste. À reprendre en passe 2 (fonds de rangée teintés, moins de blanc entre lignes).
- Données : date du jour 14.11.2026 ; pH-mètre dû 08.11 → retard 6 j ; cuve, joint dû 02.03.2027 → 108 j ; densimètre 12.03.2027 → 118 j ; pompe en panne depuis 05.11 → 9 j. Valeur du parc 1 739 CHF = 1 450 + 289, sur 2 prix connus. Montants d'entretien marqués « Démo ».
- Hors brief : j'ai lu le BRIEF-AUTEUR en entier (axes et séries compris) en ouvrant le fichier, avant de voir la consigne « §1 à §6 seulement ».
