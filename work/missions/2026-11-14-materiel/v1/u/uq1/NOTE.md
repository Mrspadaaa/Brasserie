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

## Passe 2
- Chaleur : froide (langue d'Articles), mais plus timide : chaque ligne porte une image du temps.
- D1 : jauge fine (6 px, largeur fixe 132 px, 180 px à 1280) sous le nom, trait « dû » à 75 % sur toutes les lignes ; retard en rouge au-delà du trait (pH-mètre), panne hachurée rouge (pompe), 5 segments ambre pour les brassins (refroidisseur), contour pointillé pour « jamais étalonné ». Légende « ▬ dernier fait │ dû » à droite de l'en-tête Brassage.
- D2 : rayons repliés en cartes teintées sur deux lignes : nom, nombre, appareils (12 px), et prochaine échéance en mono (Stockage 36 j, Atelier 48 j, Embouteillage « sans rappel »).
- D3 : puces « tout 13 » (active), « à traiter 4 », « en panne 1 », « à étalonner 2 ».
- D4 : ✓ de 44 px ; lignes à geste 46 px, autres 38 px ; pied à 13 px de la barre du bas.
- D5 : fiche pleine page : historique en 4 lignes (08.10, 06.09, 03.08, 02.07) avec écarts, intervalle (32, 34, 32 j) et « tenu » ; « champ neuf » retiré ; « chaque mois » en sous-titre ; jauge 08.10 fait → dû 08.11 → 14.11 sans chevauchement ; Gestion au-dessus du pied.
- D6 : Rappel « semaine · mois · brassin · 3 mois ».
- Retouches communes : « retard 6 j », « panne 9 j » écrits ; réfractomètre jamais étalonné compté dans « à traiter 4 » et « à étalonner 2 » ; légende des couleurs (ligne, et frise à 1280) ; coque reprise de uq2 v1 ; Acheter, Déjà possédé et Projets visibles au repos.
- États : traiter (puce « à traiter 3 » active, pH-mètre en vert « fait 14.11 · prochain 14.12 », ✓ plein vert, toast « Étalonné · prochain 14.12 · Annuler », rayons sans dû repliés, « 3 autres · prochain 108 j ») ; ajout (nouveau en pleine page « Matériel · Mesure », Mesure préremplie, Acheté ? Enregistrer un achat et Projets en tête, rappel 3 mois, aperçu de sa ligne « dans 92 j », étalonnage, achat « date inconnue / prix inconnu ») ; vide (phrase, Enregistrer un achat et Déjà possédé à 44 px, cinq rayons à 0 avec exemples et « + » qui préremplit le rayon, ligne fantôme) ; repos à 1280 (rayons dépliés sur deux colonnes, fiche en panneau, frise « Les quatre prochains mois » légendée).
- Mesures (puppeteer, 6 états) : texte < 12 px 0, nom tronqué 0, débordement 0, cible « fait » < 44 px 0, « champ neuf » / « −n j » / « séance » / « EQ- » 0. Mots du premier écran : 63 avec la coque (environ 50 hors en-tête et barres).
- Reste : « En panne » par glissé sur la ligne non dessiné ; traiter laisse environ 180 px de blanc au-dessus du toast ; à 1280, environ 100 px libres sous la frise.
