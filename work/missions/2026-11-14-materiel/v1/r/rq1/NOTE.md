# rq1 — froide : Articles, mot pour mot, pour le matériel

Idée : la liste d'Articles (rayons pliables à picto teinté, barre de couleur, barre dans la ligne, puces à compteur) où la barre de la
ligne devient le temps écoulé sur l'intervalle d'entretien, avec un trait « échéance » et le retard hachuré ; « fait » en un toucher.

- Problèmes résolus (ANALYSE) : P1 (à traiter 4 : panne, dû, retard, jamais étalonné), P2 (échéance en jours, date), P3 (✓ sur la
  ligne), P4 (cause « fuit au raccord » écrite), P7 (39 px par ligne, 9 lignes et 3 rayons repliés au premier écran, leur prochaine
  échéance en mono), P8 (plus d'EQ-xxx), P9 (langue d'Articles), P11 (fiche à lire, sur le modèle de la fiche article), P12 (dépenses
  reliées), P15 (achat visible, 44 px), P16 (Projets en lien souligné), P20/P28 (tri par échéance dans le rayon), P21 (inconnu en badge).
  M1, M2, M4 (étalonnage tampons 4,00 et 7,00, lu, écart, tolérance), M5, M10 (« Ce qui a bougé »).
- Champs neufs : dernier entretien (date), intervalle (mois ou brassins), échéance calculée, étalonnage (lu, tolérance ±0,10), panne
  et sa date, compteur de brassins (5/5).
- Données : 14.11.2026 ; pH-mètre étalonné 08.10 → échéance 08.11 → retard 6 j ; cuve 02.03.2027 → 108 j ; réfractomètre 80 j ;
  aucun total ; achat du pH-mètre « prix inconnu » ; dépense « Démo » 24,50 CHF.
- Acquis écartés : aucun. L'état saisi (Bon) reste à côté de l'échéance calculée.
- Boosters : barre d'intervalle dans la ligne (lire), ✓ fait (déclencher), puces filtres, jauge d'intervalle de la fiche, mini
  jauges d'écart d'étalonnage. Contrôles : COMMUN OK (`--sans=mots --profil=sans-houblons`), MOTS 54 (≤ 60, lignes exclues).
- « En panne » depuis la liste : appui long sur la ligne (passe 2, non dessiné).

## Passe 2
Source : `src.mjs` (fragment), assemblé par `voies/p2-r1/build.mjs` (coque de l'app : en-tête 36 px, logo de l'app, soleil en cave,
sous-navigation, barre du bas et « + » ; version 1280 avec onglets à picto). États : repos, geste, traiter, ajout, vide, repos-1280.
- D1 « retard 6 j » écrit (ligne, fiche, pastille) ; D2 « panne 9 j » ; aucun « −6 j ».
- D3 sous-titre toujours « geste · échéance » (« étalonner eau 0 °Bx · 02.02.2027 ») ; sans rythme : « sans rythme ».
- D4 barre pleine de 4 px sous le nom, teinte du rayon, trait « dû » à 75 %, retard en tirets ocre, panne en tirets rouges ;
  légende « écoulé · dû · retard · panne » sous le premier rayon (D259).
- D5 ✓ de ligne : cible 44 × 44 (cercle visible de 36). D6 coque de la série u. D7 « Historique », « Stocks · Matériel · Mesure ».
- Retouches communes : densimètre jamais étalonné compté dans « à traiter 4 » (colonne « à faire ») ; aucun « champ neuf » à
  l'écran ; Achat, Déjà possédé, Projets visibles au repos.
- Fiche remplie : « Utilisé dans 8 brassins depuis 07.07.2026 », Gestion « vendu, réformé, supprimer », bande de tolérance légendée.
- traiter : puce « à traiter 3 » ; la pompe passe sous « fait le 14.11 », grisée, barrée, avec Annuler (44 px) et un toast ;
  « dans les 30 j » (déshumidificateur 6 j, frigo 17 j) en dessous.
- ajout : feuille « Nouveau matériel », segment Enregistrer un achat / Déjà possédé, rayon choisi par les cinq pictos, état Bon
  par défaut (P27), rythme d'étalonnage, dernier étalonnage « jamais », Achat « date inconnue · prix inconnu ».
- vide : un rayon fantôme (cinq pictos, légende, trois lignes en pointillé) et ses deux boutons ; aucune phrase.
- repos-1280 : tableau Articles (Matériel, Entretien · rythme, Échéance, barre, Reste, ✓), les 13 lignes, fiche du pH-mètre en panneau.
- Reste : tuile « Bouteilles » à remettre en « Embouteillage » (nom de l'app) ; feuille d'ajout à descendre (100 px de blanc) ;
  pied « Valeur du parc 1 739 CHF · sur 2 prix connus » coupé en 1280.
