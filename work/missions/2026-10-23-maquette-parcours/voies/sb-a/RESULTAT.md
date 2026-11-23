OK — huit concepts v0 Substituer « le geste d'abord », baseline tenue, PANEL OK

Voie sb-a, lot D125 (Substituer), série a : le geste d'abord. Question : « Lequel à la place de Nugget ? ». Facteur libre : le
remplaçant. Le moment (60′), la dose au même IBU et la Stout 16D restent en contexte. Cas : Nugget 46 g à 60′, épuisé dans la
fixture. Chaque concept a aussi un état whirlpool : la réponse y change (Falconer's Flight et Target devant, l'IBU tombe à ~9).

## Concepts (une ligne par concept)
| id | chaleur | idée | ce qui tient | ce qui casse |
|---|---|---|---|---|
| sba1 | froide | u4 affinée : un classement rangé par le pire cas, et une ligne touchée s'ouvre sur place (dose, α, IBU, stock, 12 familles au style) | le plancher u4 se reconnaît ; plus d'« arôme 100 » ; à 60′, « l'arôme part » | reste une liste ; la ligne ouverte pousse le bas sous le pli |
| sba2 | froide | u4 en rail sous le pouce, avec une loupe (60 px contre 26) ; la réponse occupe l'écran | les chiffres qui décident sont en gros ; tout se fait d'un seul geste | noms longs tronqués dans le rail ; l'α sans lot est répété |
| sba3 | tiède | glisser un jeton de houblon sur la ligne 60′ de la fiche de brassage ; la fiche se réécrit | le geste est l'action même ; Annuler et Remplacer › dans la fiche | au repos, aucune réponse ; les jetons ne disent pas pourquoi |
| sba4 | tiède | une molette de remplaçants face à Nugget, qui reste fixe | geste familier ; un original face à un remplaçant, pas Comparer | seuls 5 crans visibles, ceux des bords pâles |
| sba5 | tiède | une pile de cartes : à droite je garde, à gauche la suivante ; « pourquoi ce score » sur la carte | une carte = une décision ; la liste des gardés reste courte | on ne voit pas d'un coup d'œil le meilleur |
| sba6 | chaude | un plan α × ressemblance où l'on promène un anneau ; Nugget au centre, en croix | l'incertitude (traits d'α, hachures de score) se voit avant les chiffres | étiquettes serrées dans le groupe 97–99 |
| sba7 | chaude | une balance des IBU : le tas montre les grammes ; le fléau tremble quand l'α n'est pas celui d'un lot | la règle « même IBU » et l'incertitude se voient sans un mot | une capture fixe ne montre pas le tremblement ; jetons sans score |
| sba8 | chaude | une main de cartes en éventail sur un tapis sombre, et un ticket de recette qui se réécrit | geste ludique ; le ticket répond en une ligne | cartes des bords coupées ; une carte levée au bout de l'éventail sort presque de l'écran |

Chaleurs : 2 froides (sba1, sba2), 3 tièdes (sba3 à sba5), 3 chaudes (sba6 à sba8). Aucune n'est un écart à la baseline.

## Fichiers écrits
- `work/refonte-frontend/v4/ecran-1/fils24-substituer/sba1/` contient le socle commun (`socle.mjs`, le vocabulaire de la baseline,
  préfixé `sb-`), le générateur (`generer.mjs`) et les données (`donnees/` : `calc.ts`, `calc2.ts`, `preparer.mjs`, `donnees.json`,
  tirés du moteur v4 par vite-node).
- `sba1` à `sba8` : `concept.mjs`, `etat.html`, `NOTE.md`. Les classes et le code de chaque concept sont préfixés par son id (L26).
- `fils24-substituer/captures/sba*` : `-premier-ecran`, `-page`, `-geste`, `-whirlpool`, et selon le concept `-fiche` ou `-legende`
  (390 × 844, ×2).
- Scripts de travail dans `os.tmpdir()/sba-travail` ; rien à la racine, ni dans `prototypes/`, ni dans `choix/`.

## Critères (rejoués)
- G1 : `SERIE-BIEN-8`.
- G2 : `controle-commun … --page=etat.html --sans=mots` → `COMMUN OK` (couleurs, au-style, survol, blocs, contraste, fiche,
  standard, trait, legende, parlant, brutes : tous OK).
- G3 : `NOTE OK`.
- `controle-panel` (8 premiers écrans) : `PANEL OK`. Remplissage médian 0,63, aucun sous 0,50, ressemblance 0,82, 0 paire presque
  identique. Premier essai à 0,45 : densifié (12 familles, surfaces), puis rejoué.
- Indicatifs, joués une fois, sorties recopiées dans chaque NOTE :
  - mots du premier écran : 95 à 156 (> 80), mais 43 à 74 hors données ;
  - `controle-une-question` : ECHEC. Le détecteur lit les scores et les grammes comme des moments, et ne voit pas les gestes au
    pointeur (rail, pile, plan) ;
  - `controle-sans-famille` : ECHEC. Les mots hors familles de Nelson Sauvin (vin blanc, groseille à maquereau, raisin) ne sont que
    dans sa fiche ; une part « autres » visible est à faire en passe 2.

## Captures
Dossier : `work/refonte-frontend/v4/ecran-1/fils24-substituer/captures/`, fichiers `sba1-premier-ecran.png` à `sba8-…`. J'ai ouvert
les premiers écrans et les états du geste, en planches, à côté de u4 et de p22.

## Honnêteté
- Les scores, composantes, doses, stocks et raisons viennent du moteur. Une plage apparaît là où une composante est inconnue, et
  l'IBU est une plage sans α de lot.
- Le « ~ » vient de la grille simulée (2 g/L), pour 4 houblons seulement. Les autres houblons sont hachurés « ? ».
- Le départ de Nugget n'est pas simulé : la légende le dit.

## Prédiction
« sba6 et sba7, une sacrée idée pour voir l'incertitude, mais sba1, c'est u4 en mieux ; manque la part "autres" de Nelson
Sauvin. »

DÉCISION À PRENDRE : aucune. Pour la passe 2, deux points relèvent du pilote :
- la grille simulée ne couvre que 4 remplaçants : faut-il simuler les autres (Magnat, Sabro…) ?
- `controle-une-question` ne reconnaît pas les gestes au pointeur : faut-il l'adapter ou baliser autrement ?

CONNAISSANCE : à 60′, le moteur classe Magnat, Yeoman, Altus et Trident devant (99, dont deux avec les huiles inconnues), et
Nelson Sauvin (86, 62,3 g) et Galaxy (85, 34,8 g) d'abord dans le stock. Au whirlpool, ce sont Falconer's Flight (85) et
Target (84, mais 5 g en stock). Nugget est épuisé (0 g) dans la fixture. La grille simulée du lot 21 couvre Nelson Sauvin,
Galaxy, Idaho 7, Cascade, Citra et Motueka, mais ni Nugget ni Magnat.

LEÇON PROPOSÉE : `controle-panel` mesure les rangées de pixels qui s'écartent de plus de 60 du fond. Sur le thème blanc (D106),
les fonds #f4f5f7 et les pistes claires ne comptent pas : une page dense mais aérée tombe à 0,45. Viser la densité dès la
conception (12 familles, lignes serrées) plutôt que d'ajouter des aplats après coup.
