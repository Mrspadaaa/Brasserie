OK — r6p4 : r6n2 plus « on gagne / on paie » chiffré sous chaque tête, avec loupe

## Fichiers écrits
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6p4/generer.mjs` : copie de r6n2, classes `r6p4-…` ; les nouvelles sont préfixées par composant (`r6p4-gp-…` pour la rangée, `r6p4-lp-…` pour la loupe). Code client dans une fonction immédiate, aucun `String.replace` avec `$`.
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6p4/etat.html`, `r6p4/captures.mjs`, `r6p4/NOTE.md`.
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6p4-*.png` : 21 captures.

## Ce qui change par rapport à r6n2
- **Une rangée neuve sous les têtes de colonne.** Le trait noir de ta stout traverse les trois colonnes. Au-dessus, une mini-barre par famille gagnée qui reste dans ta 16D. En dessous, ce qu'on paie : le résineux, le végétal, en orangé la part qui sort de ta 16D, et l'amertume à cru en hachuré « ? ». Deux chiffres par colonne : le gain sur le critère de la pastille, et le résineux payé.
- **La loupe à mini-barres chiffrées** (e5) s'ouvre au doigt : cinq familles voisines, barres ×4,6 en largeur (28 px contre 6,1 px, mesuré pendant le geste). En tête, le solde « contre ★ » (b4), par exemple « contre ★ Galaxy ~−1,2 ».
- **Idées reprises, avec leur origine et leur place** (détail dans la NOTE, `## Idées reprises`) :
  - pictos au bout des chiffres (g1) ;
  - hachure réservée à l'inconnu (r7) ;
  - pistes de r6n1 chiffrées au repos ;
  - les quatre restes du critique r6nc2 :
    - radar moins rose : moustache et « // » en gris ;
    - Frise : « enchaîner Idaho 7 puis Galaxy », construit depuis les données ;
    - Souche : plus de fausse puce ;
    - titre « Lequel pour ma stout ? », qui règle l'ordre titre/colonnes.
- **Non repris** : la teneur du lot (CoA), absente des données, et la table « trop amer », car l'IBU à cru n'est pas modélisée.
- **Pour rester sous 80 mots** : le titre perd 5 mots, et les 6 chiffres des rangées Floral et Résineux passent dans la rangée neuve. Total : 79 mots, comme r6n2.
- **Pour garder la hauteur** : le titre tient sur une ligne, les deux rangées de la demande reviennent à 22 px, et le rayon du radar passe de 84 à 77. Résultat : la rangée « inconnus » reste au-dessus du dock.

## Sorties décisives (rejouées après la dernière génération)
- G1 `controle-commun --sans=mots` : COMMUN OK
- G2 `mots-premier-ecran --max=80` : r6p4 79 mots, MOTS OK
- G3 `controle-une-question` : UNE-QUESTION OK (1 groupe libre : houblon)
- G4 `controle-acquis` : ACQUIS OK (4/4 : radar, chimie, osu, valeurs)
- G5 `controle-alpha` : ALPHA OK
- G6 `controle-reprise` : REPRISE OK (27 repris, 2 en contexte, 8 en pont, 0 écartés)
- G7 `verifier-page` : PAGE OK (0 images chargées, 390 px, sans erreur)
- G8 `systeme.mjs existent` : EXISTENT OK 7
- G9 `systeme.mjs note` (NOTE) : NOTE OK
- Le geste joué par `captures.mjs` sur Idaho 7, glissé du floral aux tropicaux, a rendu : loupe visible, « Idaho 7 tropicaux contre ★ Galaxy ~−1,2 ». Le script a fini sur « CAPTURES r6p4 OK », sans erreur de page.

## Captures ouvertes en image
- `r6p4-premier-ecran.png`, comparée à `r6n2-premier-ecran.png` : même suite de blocs, tableau entier, aucun vide nouveau.
- `r6p4-toucher-390.png` : la loupe au doigt.
- `r6p4-fiche-390.png` : « 1 seule fiche : Beer Maverick ».
- `r6p4-loupe-galaxy-390.png` : tropicaux ~+2,9 gagnés, ~+0,9 orangé payés.
- `r6p4-loupe-cascade-390.png` : « ★ paie le moins ».
- `r6p4-resineux-390.png` : pastille « moins résineux », le chiffre du haut passe au plus grand gain.
- `r6p4-quatre-loupe-390.png` : quatre colonnes ; « on gagne » passe sur deux lignes.
- `r6p4-frise-390.png` : « enchaîner Idaho 7 puis Galaxy ».

## Prédiction
« Pas mal du tout, c'est r6n2 et en plus je vois d'un coup ce que chaque houblon m'apporte et ce que je paie. Le résineux est le même pour les trois, mais les barres sont un peu petites sans la loupe. »

DÉCISION À PRENDRE : la frontière entre gain et coût est une règle de la variante. Le végétal et le résineux comptent comme des coûts ; l'épicé et les fruits comme des gains tant qu'ils restent dans la 16D. C'est au brasseur de la confirmer s'il retient r6p4.

CONNAISSANCE : à dose égale après fermentation (4 g/L, 3 j, US-05), les trois houblons paient le même résineux (~+1,9 à ~+2 crans). Ce qui les distingue, c'est ce qu'ils apportent. Seul Galaxy sort de la 16D (tropicaux ~+0,9 cran au-dessus).

LEÇON PROPOSÉE : une rangée ajoutée au premier écran se paie en hauteur autant qu'en mots. Le 23.10, la rangée « on gagne / on paie » (76 px) a d'abord poussé la rangée « inconnus » sous le dock, alors que tous les contrôles étaient verts ; seule la comparaison des captures avec `r6n2-premier-ecran.png` l'a montré. Faire : dans une variante d'une référence, comparer la position du dernier bloc visible avant le dock à celle de la référence, et compenser avant de rendre. Rôles : concepteur. Contrôle : aucun ; un contrôle pourrait comparer le dernier élément visible au premier écran entre la variante et sa référence.
