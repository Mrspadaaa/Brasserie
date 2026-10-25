# Comparer — cmc2h, son choix (« C'est quasiment parfait », sur cmc2g), dans la maquette jouable

Voie rb-radar-commun (mission 2026-10-23-maquette-parcours, 25.10) : l'écran est **cmc2h tout entier**, repris tel quel de
`work/refonte-frontend/v4/ecran-1/fils25-comparer/cmc2h/source/` (construit au miroir comme `var/cmc2h`). Un seul
changement : son radar vit dans `src/commun/RadarBase.tsx` (« utiliser ce radar graph comme Baseline et l'utiliser
partout dans les vue où il y en a »). `Radar.tsx` ne fait plus que lui donner les valeurs que cmc2h lisait (dCran au
style, centre / cran en Absolu, ta stout en trait noir en Absolu, la zone de ta 16D au style) ; les classes `cmc-` du
radar sont devenues `rb-` (commun/radar-base.css). `RadarOutils.ts` (passe 3, jamais importé par cmc2h) n'est pas repris.
Le balisage du radar est le même que celui de cmc2h, aux attributs de contrôle près (`data-radar="base"`, `data-mode`,
`data-moment`, `data-centre`, `data-valeurs`, `data-role`, `data-anneau`) et à l'id du motif hachuré (useId).

L'ancienne note de l'écran (r6a, D107 à D141 : ponts, appui long, épingle de Substituer) : `git show 28989963:prototypes/houblons-v4/parcours/src/ecrans/comparer/NOTE.md` ; ses ponts sont gardés par cmc2h. La note de cmc2h suit, telle quelle.

## cmc2h — cmc2g, son choix (« C'est quasiment parfait »), avec quatre retouches

cmc2g à l'identique (radar à une échelle par axe, au style), plus ses mots sur cmc2g : « il y a pas de transition entre les type de données, il y a un ? Qui prend toute la place le + toujours pas centré. Trop de blanc inutil, d'espace pour rien ».

- **Transitions** : un filet et un titre d'une ligne, « Par famille » au-dessus des rangées et « Ses mots » au-dessus des mots. L'huile garde son titre « De Saaz à … » avec son filet.
- **Le « ? » des étapes** : il ne prend plus de ligne. Il est au bout de la ligne de titre « Par famille », juste sous le tableau, et sa feuille explique aussi les rangées (zone 16D, trait noir de ta stout, orangé, écart chiffré).
- **Le + centré** : il est au centre de la colonne « Ta stout » et au milieu de la rangée des têtes (écart 0,0 px et 0,0 px). Contrôle neuf : `work/refonte-frontend/v4/tournoi/outils/controle-centre-plus.mjs`, qui échoue sur cmc2g (−16 px et −22 px) et passe sur cmc2h.
- **Moins de blanc** :
  - « ses mots » perd 62 px de marge morte (marge haute de 34 px et retrait haut de 28 px) ; le titre porte le filet ;
  - la ligne du « ? » (32 px) disparaît ;
  - marges entre blocs resserrées : huile 6 et 4 px, pied 2 px.
  - Rien d'utile n'est retiré.
- Contrôles : QUAND OK, NORMALISE OK, MOTS 100 (OK), CENTRE OK.

Base commune (cmc2d, reprise telle quelle dans cmc2e, cmc2f et cmc2g ; seul le radar diffère) :
- **Radar** : son rdg5 (secteur « sans donnée » en bas). Les points connus de chaque houblon sont reliés en trait plein entre deux axes voisins connus, et en tireté (5 4), de sa couleur et de son épaisseur, là où le segment enjambe un inconnu ou le secteur « sans donnée » (« Il y a pas les traits haché comme demandé »). Le remplissage ne suit que les tronçons pleins, du contour au petit anneau du zéro, jamais sous un tireté ni au centre. L'inconnu d'un seul houblon est une pastille « ? » à sa couleur, au bord, sans point.
- **Huiles** (« Non la première partie doit être en dessous. La seconde dans l'autre vue... ») : l'huile totale « De Saaz à … » est sous le bloc « ses mots », juste avant Biotransformation et Enchaîner. La composition des huiles (Beer Maverick, barres superposées) est dans la feuille « Valeurs », sous la ligne « huile ». Sous les étapes, on passe directement aux rangées des familles. Doublon gardé : la chimie de la feuille a déjà ses lignes myrcène, humulène et caryophyllène. Leurs plages viennent de `composes-houblon.json` (BM, HS…), alors que la composition vient de `oils` du catalogue (BM) : Cascade, myrcène 40–60 contre 45–60.
- **Étapes** (« Ajouter un ? Explicatif pour ces données. Utiliser les pastilles comme c'etait de base ») : le tableau de la base jouable. Le moment choisi est dans une pastille noire ; chaque valeur a sa petite barre, à la couleur de la famille de la pastille, et le trait gris de ton Nugget. Nos cinq moments, les nombres et les ★ sont gardés. Un « ? » rond au bout du tableau ouvre l'explication (le nombre, ★, ton Nugget en gris, « ~ », « ~0 », Au style ou Absolu, dry hop 3 j).
- **Normalisation** (« SI choisi absolu, plus de normalisation… ») :
  - « Au style » : les anneaux suivent le moment. Chaque rangée de famille est mise à l'échelle de son plus fort apport du moment, et son plancher passe de 0,3 à 0,05 cran (D67) : à 60′, la barre de l'épicé tombait à 30 %. Les petites barres des étapes, ligne par ligne ; un apport sous 0,05 cran s'écrit « ~0 ».
  - « Absolu » : le radar est sur une échelle fixe et commune, de 0 à 12,5 crans, à tous les moments. Les barres des rangées et des étapes sont brutes (sur 125, et 0 à 4 crans pour les étapes) ; rien ne se rechiffre.
- **Bouton ⇄** (« un poil plus large ») : 33 px au lieu de 24, sur un fond léger ; le × est tel quel.
- **Texte retiré** (« encore pas mal de légende et texte inutile ») ; son sens est passé dans la feuille « ? » d'en haut, en une ligne chacun :
  - la légende en carrés sous le radar (houblons, 16D) : couleurs des têtes, bascule « Au style » ;
  - « ~ dans la cuve, au moment comparé ; dry hop : 3 j de contact » (aussi dans le « ? » des étapes) ;
  - « Résineux déjà au-delà, ta dégustation : chaque gain s'y ajoute » ;
  - « ~ simulé, 4 g/L chacun ; trait fin : incertitude » ;
  - « inconnus, pas zéro » (garde ses pictos et la case hachurée) ;
  - « ses mots » (les deux étiquettes) ;
  - le « ~ » devant ✓ et ⚠ (le signe et le picto restent) ; « hors » reste à côté du ⚠ (« le fait que les style hors 16d soit bien montré ») ;
  - la ligne « Le radar » de la feuille « ? », réécrite pour ce radar ;
  - les arômes de « Autres » réduits à trois mots : « β-pinène, linalol, géraniol ».
- **Mots au premier écran** : cmc2d passe de 106 à 95.

Données : moteur en direct, dépôt au commit 2f1c0b01ac5941b4e4e9c278527c2ea3d5eb9b92. Huile totale : `huileDe` (enveloppe des sources de `valeurs.ts`, BM et HS, sinon `oil` du catalogue). Composition : `hopRef(cle).catalogue.oils` (Beer Maverick) ; Autres = 100 − la somme des trois.
