# zq2 — Le tableau d'ombres (chaude)

Idée : l'écran est le panneau perforé de l'atelier (tableau d'ombres) : chaque appareil a sa silhouette peinte ; une étiquette suspendue porte ce qui est dû, et se touche pour le noter fait ; la pompe en panne est « partie » : il ne reste que son ombre en pointillé rouge.

- Problèmes résolus : P1 (À traiter · 3), P2, P3 (l'étiquette = le geste fait / réparée / étalonner), P4, P5 (13 au premier écran), P7, P8, P9 (picto par appareil, rayons = zones peintes), P11, P12, P17 (case « Ajouter » visible dans chaque zone), P19, P20, P21, P25 en partie (la case « Ajouter » d'une zone pré-remplit la catégorie : plus de « Brassage » par défaut). Parcours : M1, M2, M3, M4, M5, M9 (ajout toujours visible), M10.
- Champs neufs : les mêmes que zq1 (rythme, dernier fait, échéance, étalonnage lu, panne depuis, brassins depuis).
- Données : échéances identiques à zq1, calculées au 14.11.2026 ; dépense Démo. Aucune valeur en liste (axe « argent : rien en liste »).
- Acquis écartés : « Enregistrer un achat » n'a plus son bouton : la case « Ajouter » d'une zone propose Achat ou Déjà possédé (un toucher de plus, mais catégorie juste). Les catégories Embouteillage, Stockage et Atelier partagent la zone « Cave · atelier » (trois rayons d'un ou deux appareils) ; la fiche garde la catégorie exacte. Projets d'équipement : dans le ⋯.
- Écart : étiquettes de 44 px de haut, mais posées en biais, sur le picto (la métaphore le veut).

## Boosters UX (boosters-ux)
- tableau-ombres : lire où en est chaque appareil d'un coup d'œil ; silhouette et étiquette.
- reparee, fait, etalonner : déclencher en touchant l'étiquette. ajouter-* : déclencher, catégorie pré-remplie.
- Fiche : etalonnage-flacons (tampons aux couleurs du commerce, rouge pH 4, jaune pH 7), etiquettes-passees, depenses-reliees, payer-entretien, enregistrer-etalonnage.
- Mesures v0 : 35 mots hors noms ; 0 texte < 12 px ; 0 `type="number"` ; 13 `data-booster`. B2 à B13 en passe 2.

## Passe 2
Source : `voies/p2-z1/zq2-parts.mjs` → `v1/z/zq2/parts.html` → `voies/p2-z1/build.mjs zq2` (coque commune, identique à l'app).
Captures : `zq2-{repos,geste,traiter,ajout,vide,repos-cave}-390.png`, `zq2-repos-1280.png`, toutes ouvertes.

Défauts du critique, corrigés :
- D1 : les appareils à traiter (pompe, refroidisseur, pH-mètre, densimètre) occupent 2 colonnes ; l'étiquette pend à côté
  du picto (x 52 px, picto 8 à 40 px), plus jamais dessus.
- D2 : les classes d'étiquette sont renommées (`tg-al`, `tg-att`) : la v0 héritait de la couleur « doux » d'une autre classe.
  Texte #141210 sur jaune #E3B55D, blanc sur rouge #C8382F, dans les deux thèmes (vu sur la capture cave).
- D3 : grande étiquette de la fiche à 176 px, « retard 3 j » insécable (`white-space:nowrap`), une ligne.
- D4 : cinq zones, les catégories de l'app : Brassage, Mesure, Embouteillage | Stockage (côte à côte), Atelier. Plus de « Cave ».
- D5 : Achat dans la barre, 44 px, seul bouton plein, à côté de « À traiter 4 ».
- D6 : noms à 8 px des bords, coupures à trait d'union doux (fermen-tation, Déshumidi-ficateur, Réfracto-mètre, d'ébul-lition) ;
  halo de texte au lieu du fond, plus de jambage coupé (« Frigo »). « Balance 0,1 g » insécable.

Retouches communes : « panne 9 j » et « retard 3 j » écrits ; densimètre « jamais étalonné » compté dans À traiter (4) ;
aucun mot de développeur ; chaque couleur porte son mot (rouge = « panne », jaune = « retard » / « 5/5 brassins » /
« jamais étalonné », ombre en pointillé rouge = la pompe partie, à côté de son étiquette « panne ») ; gestes 44 px
(étiquettes, Achat, tuiles, Annuler) ; coque commune (soleil en cave) ; Achat, Déjà possédé, Projets ↗ visibles au repos.

États :
- traiter : « À traiter 3 × » plein ; seules les étiquettes restent allumées, le reste à 35 % ; le pH-mètre touché devient
  étiquette blanche bordée de vert « ✓ étalonné · dans 30 j » dans une case verte ; barre « Étalonné · prochain 14.12 · Annuler ».
- ajout : « Ajouter » de la zone Mesure touché → feuille « Ajouter en MESURE » : Enregistrer un achat / Déjà possédé (choisi) /
  Projets d'équipement ↗ ; catégorie Mesure préremplie, État Bon, Étalonner « jamais » par défaut ; aperçu « Sa place sur le
  panneau » (après Réfractomètre et Balance).
- vide : « Aucun matériel », les cinq zones nues, une case Ajouter chacune ; Déjà possédé et Projets ; pas de valeur du parc.
- geste : fiche du pH-mètre : étiquette 176 px, flacons pH 7 / pH 4 (lu, écart), étiquettes passées en 2 × 2 (la v0
  débordait), Rythme et État, dépenses dépliées (37,40 CHF · 2 prix connus ; Achat « date et prix inconnus »),
  « utilisé dans 7 brassins » ; Payer un entretien / Étalonné.
- repos-1280 : panneau de 8 colonnes, une rangée par zone (Embouteillage, Stockage, Atelier côte à côte), cases de 148 px ;
  pH-mètre choisi (cadre noir) et sa fiche à droite (420 px) ; « Enregistrer un achat », « Matériel déjà possédé »,
  « Projets d'équipement » en toutes lettres.

Reste : la barre « Étalonné » couvre la rangée Atelier pendant 4 s (voulu : retour du geste) ; fiche 390 : ~240 px libres
sous les dépenses ; skill impeccable non rechargé (budget de reprise), boosters-ux suivi. Pas de greffe (zq2 non candidate).
