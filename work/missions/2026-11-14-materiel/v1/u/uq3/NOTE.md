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

## Passe 2
- Défauts corrigés : D1 aucun nom tronqué (nom sur sa ligne, jauge et signal dessous ; 0 tronqué mesuré) ; D2 le frigo dans
  une étape « Stocker » en tête, avant « Moudre » (on en sort levures et houblons le jour du brassin) ; D3 même colonne de
  droite pour tous (échéance, ✓ ou pastille Neuf/Bon, Atelier compris ; le prix du moulin passe au parc et à la fiche) ;
  D4 le blanc du bas porte la légende, « 30 prochains jours » (4 à traiter aujourd'hui, puis le pH-mètre au 14.12 s'il est
  étalonné ce jour) et « Parc 1 739 CHF · 2 prix connus » ; le rail cassé dit « bloqué » sous Brasser ; D5 plus de
  « champ neuf » ; fil d'Ariane « Matériel › Mesure » ; D6 ✓ de 44 × 44 px (mesuré).
- Retouches communes : « retard 6 j », « panne 9 j » écrits ; le réfractomètre jamais étalonné compte dans « À traiter 4 »
  (panne 1, étalonner 2, entretenir 1) ; légende de chaque couleur et tiret (urgent, à faire, jamais fait, écoulé, dû ;
  bande verte de la dérive nommée) ; coque de la série u gardée (36 px + 1 px de bord, logo de l'app, soleil en cave) ;
  Acheter, Déjà possédé et Projets dans la barre d'outils.
- Greffes : dérive de la sonde gardée ; « Ajouter » par étape (uq2/zq2) : feuille « Déjà possédé · à quelle étape ? »,
  Mesurer choisi préremplit la catégorie Mesure ; et l'état vide montre un « + » sur chaque étape ; jauge fine (uq2) sous
  chaque appareil qui a un rythme (cuve 70 %, refroidisseur au trait, pH dépassé, densimètre 68 %) ; compteurs en puces
  (rq1) ; Gestion « Vendu · Réformé · Supprimer » (uq1) dans la fiche, avec le rythme (jauge, « Changer »).
- États : repos, geste (fiche pH), traiter (après « Réparée » : rail ressoudé, nœud vert, « Payer » la réparation, toast
  Annuler, À traiter 3), ajout (feuille : Enregistrer un achat → Dépense, Déjà possédé par étape, Projets d'équipement),
  vide (les étapes avec « + » et ce qu'on y met, deux boutons, Projets), 1280 (chaîne à l'horizontale, Mesurer et Atelier
  dessous, 30 jours, derniers mouvements, fiche de dérive à droite).
- Contrôles (`voies/p2-u2/verif.mjs uq3`) : repos 60 mots (plafond juste tenu) ; texte < 12 px : 0 ; tronqué : 0 ; hors
  cadre : 0 ; ✓ 44 × 44. Captures : `node socle/capt.mjs v1/u repos,geste,traiter,ajout,vide,repos-1280 uq3` → CAPTURES OK.
- Reste : le tri par urgence de l'app cède à l'ordre du brassage (acquis écarté, déjà dit en v0 ; le filtre À traiter
  le rend). « Derniers mouvements » (1280) : montants marqués Démo sauf l'achat du moulin. Données du 14.11 inchangées.
