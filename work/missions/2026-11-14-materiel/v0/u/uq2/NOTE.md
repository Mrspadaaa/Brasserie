# uq2 — Chaque appareil a sa jauge (tiède)
Idée : chaque ligne porte la barre de son intervalle, du dernier « fait » au trait de l'échéance, comme la barre de stock contre le seuil d'Articles ; ce qui dépasse le trait rougit.
- Chaleur : tiède (forme de ma série : la jauge partout, appareils sans rappel tassés à part).
- Problèmes résolus : P1, P2 (la jauge montre où en est chaque appareil), P3 (« Fait » / « Réparée » sur la ligne), P4, P5, P7, P8, P9 (langue de la barre et du seuil), P11, P12, P15, P17, P20, P21, P22 (valeur du parc sur 2 prix connus), P23 (refroidisseur compté en brassins 5/5), P28. M1, M2, M4 (tampons lu contre attendu, geste dédié), M5, M6 (parc), M8 (compteur de brassins), M10.
- Champs neufs : intervalle, dernier fait, échéance, compteur de brassins depuis l'entretien (de BrewhouseProfile.equipmentRefs), étalonnage, tolérance.
- Acquis écartés : la recherche passe en bouton loupe (le champ s'ouvre au toucher) pour laisser la place aux jauges.
- Boosters : segment-a-traiter, jauge-intervalle, fait, valeur-parc, etalonnage-lu-attendu (feuille), enregistrer-etalonnage, payer-entretien.

## Contrôles (série u, recopiés)
- Captures : `node socle/capt.mjs v0/u repos,geste uq1 uq2 uq3 uq4` → CAPTURES OK ; ouvertes en planche (clair, cave, geste).
- Mots du premier écran (script `mots.mjs`, hors `data-mots="lignes"`) : uq1 38 (27 hors en-tête et barres) ; uq2 43 (32) ; uq3 37 (26) ; uq4 28 (17). Texte < 12 px : 0 ; cible < 24 px : 0 ; `type="number"` : 0.
- `controle-panel.mjs` (8 captures repos+geste) : PANEL ECHEC — remplissage médian 0,42 (< 0,55), ressemblance 0,91 (≥ 0,90), paires proches uq1~uq3 repos, uq3~uq4 geste. À reprendre en passe 2 (fonds de rangée teintés, moins de blanc entre lignes).
- Données : date du jour 14.11.2026 ; pH-mètre dû 08.11 → retard 6 j ; cuve, joint dû 02.03.2027 → 108 j ; densimètre 12.03.2027 → 118 j ; pompe en panne depuis 05.11 → 9 j. Valeur du parc 1 739 CHF = 1 450 + 289, sur 2 prix connus. Montants d'entretien marqués « Démo ».
- Hors brief : j'ai lu le BRIEF-AUTEUR en entier (axes et séries compris) en ouvrant le fichier, avant de voir la consigne « §1 à §6 seulement ».
