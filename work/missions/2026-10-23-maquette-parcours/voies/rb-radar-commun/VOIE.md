# Voie rb-radar-commun — le radar de cmc2h partout où il y a un radar (maquette jouable)

Agent : concepteur (Opus). Mission : `work/missions/2026-10-23-maquette-parcours/MISSION.md`.

## Sa demande, mot pour mot
« Ensuite utiliser ce radar graph comme Baseline et l'utiliser partout dans les vue où il y en a ». La règle de normalisation
vaut pour toutes les vues (D68) : « Attention à la normalisation, elle est en terme de style et de timing toujours de style
mais dynamique en terme de timing. SI choisi absolu, plus de normalisation, pour le radar et pour les barre et le reste !! »

## La baseline
Le radar de **cmc2h**, son choix (« C'est quasiment parfait », sur cmc2g). Source :
`work/refonte-frontend/v4/ecran-1/fils25-comparer/cmc2h/source/Radar.tsx`. Captures : `fils25-comparer/captures/cmc2h*.png`.
- Grammaire Beer Maverick : anneaux, zéro sur un petit anneau, segments droits et points, remplissage translucide jamais au
  centre, houblons superposés, le retenu en avant.
- 12 axes et leurs pictos. Les inconnus de tous sont regroupés en un secteur hachuré « sans donnée ». Un inconnu d'un houblon
  est une pastille « ? » à sa couleur au bord, et un tireté là où le trait l'enjambe.
- Chaque axe à son échelle au moment (maximum écrit près du picto), en « Au style » seulement. En « Absolu » : échelle fixe
  commune, valeurs brutes (D68).
- Point orangé du hors style. Pas de légende écrite : les couleurs se lisent sur les têtes.

## À faire
1. **Un composant commun** `prototypes/houblons-v4/parcours/src/commun/RadarBase.tsx` (et son CSS préfixé `rb-`), porté de
   cmc2h. Il prend des séries (couleur, rôle retenu ou autre, valeurs par famille, inconnus), un mode (« style » ou « absolu »),
   le moment, la zone du style et les familles. Il ne calcule rien du moteur : chaque écran lui donne ses valeurs. Une seule
   implémentation (L26 : classes préfixées, pas de remplacement de chaîne).
2. **Le poser dans chaque vue qui a un radar**, sans toucher au reste de l'écran, et en gardant les repères (`data-element`,
   `data-acquis`, `data-etat`) que lisent les contrôles :
   - Comparer : l'écran de la maquette devient **cmc2h** tout entier (son choix) ;
   - la fiche : `ecrans/fiche/RadarFiche.tsx` (le houblon seul face à ta demande) ;
   - Suggérer : `ecrans/suggerer/radar.tsx` et `vue-radar.tsx` ;
   - Substituer : `ecrans/substituer/Radar.tsx` (RadarU4).

   Dans chaque vue, on garde ses valeurs actuelles (ce qu'elle compare) et on applique D68 si elle a une bascule Au style /
   Absolu.
3. **Hors voie** : Ma bière, dont le radar est `src/ui/hopIndex/maBiere/RadarBiere.tsx`, code de l'app possédé par la voie
   t12b-finitions en cours. Il viendra après elle. Dryhopper a un graphe en courbes, pas un radar.
4. **Un contrôle** `work/refonte-frontend/v4/tournoi/outils/controle-radar-base.mjs <dossier construit>`. Sur chaque vue à radar,
   il vérifie :
   - le radar porte `data-radar="base"` ;
   - aucun point n'est sur un axe inconnu ;
   - le remplissage ne touche pas le centre ;
   - les anneaux sont chiffrés.

   Une ligne par vue, puis `RADAR-BASE OK` ou `RADAR-BASE ECHEC (n)`, le jeton assemblé en fin de script. Il doit échouer sur la
   maquette construite depuis HEAD.

## Règles transversales
Règle n° 1 (`work/refonte-frontend/v4/choix/ecrans.json`, `controle-choix.mjs`) : chaque écran reste sa maquette choisie ; seul
son radar change, par sa demande. Si un contrôle de choix ou d'états casse parce qu'il lisait l'ancien radar, ne l'affaiblis pas :
garde ses repères sur le nouveau radar ou, si c'est impossible, écris-le en DÉCISION À PRENDRE. Thème clair. Pas de données
réelles.

## Possède
`prototypes/houblons-v4/parcours/src/commun/`, `prototypes/houblons-v4/parcours/src/ecrans/comparer/`,
`prototypes/houblons-v4/parcours/src/ecrans/fiche/`, `prototypes/houblons-v4/parcours/src/ecrans/suggerer/`,
`prototypes/houblons-v4/parcours/src/ecrans/substituer/`, `prototypes/houblons-v4/maquettes/parcours/`,
`work/refonte-frontend/v4/tournoi/outils/controle-radar-base.mjs`, `work/missions/2026-10-23-maquette-parcours/voies/rb-radar-commun/`.
Pas `src/` (l'app, voie t12b). Fichiers de travail dans `os.tmpdir()`. `git status --short` à la fin.

## Preuves
Construire la maquette (`node prototypes/houblons-v4/parcours/outils/construire.mjs`), puis capturer chaque vue à radar en
390 × 844, Au style et Absolu, à 60′ et après si la vue a le moment, et ouvrir les captures. Retour en une ligne ; RESULTAT.md.
