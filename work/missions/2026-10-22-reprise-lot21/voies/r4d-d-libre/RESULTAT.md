OK — planche série D : 8 épices réelles (cannelle, clou, badiane, vanille, muscade, réglisse, mélange, pain d'épices) sur vraies cartes

| Id | Nom | data-epice | Genre | Ce qu'il dit à un brasseur | Risque de confusion |
| --- | --- | --- | --- | --- | --- |
| d1-cannelle | Cannelle, le rouleau | cannelle | entier | l'écorce roulée de côté, sa spire : douceur boisée des nobles | « pilule » à 12 px ; spire lisible à 24 |
| d2-girofle | Clou de girofle | clou de girofle | entier | le clou debout, bouton et calice ; « clou » à 12 px | « épingle » |
| d3-badiane | Badiane | badiane | entier | anis étoilé à huit lobes arrondis : anis-réglisse de Saaz | « astérisque » à 12 px |
| d4-vanille | Gousse de vanille | vanille | entier | la gousse fendue, graines, pointe recourbée | « haricot » |
| d5-muscade | Muscade coupée | muscade | coupe | la noix ouverte, ses veines : chaleur douce | « ballon » à 12 px |
| d6-reglisse | Roue de réglisse | réglisse | gourmandise | la réglisse en roue, brin qui dépasse | « escargot, spirale » |
| d7-melange | Épices de Noël | mélange | composé | cannelle, badiane et clou ensemble : bière d'hiver | mush à 12 px, lisible à 16/24 |
| d8-pain-epices | Pain d'épices | mélange | gourmandise | le bonhomme pétri de ces épices ; « bonhomme » à 12 px | « personne » ; l'épice par son produit |

## Parole du brasseur prise en compte (22.10, nuit)
« Je veux un forme qui représente vraiment ce que c'est, genre canellle vanille, ou clou de girofle ect... ». La première
passe de la série (métaphores : fût, pain d'épices, sachet, tajine, vin chaud, lys, théière, gland ; PLANCHE OK) a été
écartée entière, sauf le pain d'épices, requalifié en mélange d'épices réelles. `data-epice` posé sur les 8 blocs.

## Fichiers écrits
- `work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-d/v0/generer.mjs`, `etat.html`, `capturer.mjs`, `NOTE.md`
- `…/serie-d/v0/captures/planche-390.png`, `tailles-390.png`, `cartes-390.png` ; travail : `captures/travail/loupe.png`,
  `essais.mjs`, `essais2.mjs`, `essais3.mjs` et leurs `.png` (idées écartées)
- ce RESULTAT.md. Rien hors de « Possède » (`git status --short` : seuls `fils22-picto-epice-3/` et ce dossier de voie
  sont nouveaux ; `pistes-l5f.png` à la racine est antérieur à la voie).

## Sorties décisives
- G1 : `PLANCHE OK (8 variantes)` (--ter --genres=2 --nombre=8-8 --voisins=herbal,green) ; 4 genres, 12/16/24 px partout,
  17 voisins par bloc, aucune signature refusée ni commune. Avec `--epices=8` : `PLANCHE OK (8 variantes) · 8 épices réelles, 7 différentes`.
- G2 : `TRAIT OK` (200 pictos de famille, 0 faute) ; objectifs cerclés par une bordure, pas une ombre.
- G3 : `PAGE OK (0 images chargées, 390 px, sans erreur)`.
- G4 : `EXISTENT OK 5` ; G5 : `NOTE OK` ; G6 : `NOTE OK`.

## Captures ouvertes
`captures/planche-390.png` (la planche entière), `captures/tailles-390.png` (12, 16, 24 px et l'épreuve feuille/brins),
`captures/cartes-390.png` (Saaz, Hallertau Mittelfrüh, Cascade), `captures/travail/loupe.png` (vrais pixels ×4, nommés
à voix haute), `captures/travail/essais.png`, `essais2.png`, `essais3.png` (dix-huit dessins écartés : cannelle en bâton
« trombone », croisée « X », double spire « bretzel » ; gingembre « nuage » ; cardamome et anis « grain de café » ;
coriandre « sucette » ; muscade et râpe « téléphone » ; et les métaphores de la première passe).

## Prédiction de la réaction du brasseur
Il nommera le clou, la badiane et le bonhomme sans lire, dira « enfin des vraies épices » puis « la cannelle on dirait une
pilule » et « la vanille c'est un haricot » ; il gardera sans doute le clou ou la badiane, en demandant la cannelle mieux
dessinée (passe 2).

DÉCISION À PRENDRE : aucune (le brasseur choisit parmi les 32 ; la passe 2 reprendra la spire de la cannelle, la
vanille et le mélange).

CONNAISSANCE : à 12 px au trait 2.571, parmi les épices réelles seuls le clou (silhouette d'épingle) et la badiane
(étoile à huit) se nomment sans hésiter ; cannelle, vanille, muscade, gingembre, cardamome, anis et coriandre sont des
pilules, courbes, ballons ou grains de café. La cannelle n'a pas encore de dessin au trait qui se nomme sous 24 px :
le bâton diagonal avec spire se lit « trombone », le rouleau de côté « pilule ».

LEÇON PROPOSÉE : nommer chaque picto à voix haute sur une loupe de vrais pixels (densité 1, ×4) AVANT de le poser sur
la planche : ici, 18 dessins sur 26 sont tombés à cette étape, alors que le contrôle D101 ter les acceptait tous (il
mesure tailles et signatures, pas la lisibilité).
