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

## Passe 2 (v1, 14.11.2026) — candidate A, chaleur tiède
Fichier : `v1/u/uq2/etat.html` (v0 intacte). États : repos, geste, traiter, ajout, vide, rayon (en plus), repos à 1280 ; cave.
- Défauts corrigés : D1 (Réparée, Étalonné, Détartré à 44 px, mesuré : 0 cible < 44) ; D2 (frigo dégivrage 6 mois, déshumidificateur filtre 3 mois, hotte filtre 6 mois : 9 lignes sur 13 ont une jauge) ; D3 (plus de chiffre rouge hors panne et retard) ; D4 (écoulé en encre à 42 %, lisible en cave) ; D5 (plus de « champ neuf », « Payer un entretien », « Avant » devenu Régularité et cycles).
- Retouches communes : « retard 6 j », « panne 9 j » écrits ; réfractomètre jamais étalonné compté dans « à traiter 4 » ; légende : échelle « dernier fait · dû » en tête, chaque teinte nommée sur sa ligne (panne, retard, 5/5 brassins, jamais étalonné), légende de la grille 12 mois ; Achat, Déjà possédé et Projets visibles dans chaque état de liste.
- Greffes faites : nom dans la barre et puce « à traiter 4 » posée sur le trait dû, qui filtre (zq3) ; trait dû commun en pointillé sur toute la liste ; cycles en barres contre le rythme d'un mois et règle de tolérance avec le repère du lu (zq3) ; date sous les jours (zq1) ; segment Échéance / Rayon (rq3) et rayons repliés avec leur prochaine échéance et une mini-jauge (rq1, état `rayon`) ; verbe exact sur le bouton (rq2) ; grille des 12 mois (rq4).
- Nouveau : retour du geste (`traiter`) : la ligne du pH-mètre passe au vert, jauge remise à zéro, « 30 j / 14.12 », compteur 4 → 3, toast « Étalonné · prochain 14.12 · Annuler » ; « Ensuite » montre les échéances suivantes. `ajout` : le nouveau (Déjà possédé) avec Acheter et Projets en tête, rappel « 3 mois, fait le 14.11 » et l'aperçu de sa ligne (dû 14.02, 92 j). `vide` : échelle seule, ligne fantôme, deux boutons, rayons pour préremplir, parc « — » (pas 0).
- Écart voulu : la bande de couleur de rayon est retirée en vue Échéance (sans légende possible, D259) ; elle reste en vue Rayon, nommée par l'en-tête.
- Données (vérifiées) : 14.11 → 20.12 = 36 j, → 01.01 = 48 j, → 15.01 = 62 j, → 02.03 = 108 j, → 12.03 = 118 j, → 14.12 = 30 j, → 14.02 = 92 j ; parc 1 739 = 1 450 + 289 sur 2 prix connus. Rythmes du frigo, du déshumidificateur, de la hotte et du thermomètre : démo.
- Mesures (script puppeteer, scratchpad `mesure.mjs`) : texte < 12 px 0, nom tronqué 0, débordement 0, cible « fait » < 44 px 0, « champ neuf » / « −n j » / « séance » / « EQ- » 0, dans les 7 états. Mots du premier écran (repos, hors noms) : 67 en comptant chiffres et dates, environ 45 en mots seuls ; les dates sous les jours (greffe zq1) en font 9.
- Reste : le panel n'est pas rejoué (contrôle de série) ; captures cave des autres états non faites (seul repos-cave est demandé).
