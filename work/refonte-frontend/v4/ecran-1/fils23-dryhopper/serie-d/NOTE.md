# Série D, « le simulateur » : Dryhopper v0 (voie r7d-dryhopper, lot 23)

Question : « Quand ajouter Idaho 7 ? ». Un seul facteur libre, le moment : ébullition de 60′ à 10′ par 5′,
whirlpool, dry hop actif, dry hop après, et les jours de contact (1, 2, 3, 5, 7 j), soit 22 crans.
Approche : la stout se déforme en direct sous le pouce. Elle montre ce que la cuve apporte, ce que la levure
ajoute (US-05 : ~0 au centre) et ce que la chaleur ou le CO₂ emporte.

Chaleurs : 4 tièdes, 4 chaudes, aucune froide (VOIE.md : « 4 tiède, 4 chaude »). Descripteurs : option B.
Pour Idaho 7, la part « autres » vaut 0 % (`descripteurs.B.parts["Idaho 7"]`) : la fiche affiche
« autres mots : aucun (0 %) », visible et plafonnée à rien.

Générés par `generer.mjs` (socle `socle.mjs`, un module par concept dans `concepts/`). Captures et preuve du
geste par `captures.mjs` (`captures/geste-dN.json`).

## Concepts

| id | chaleur | ce qu'il montre | geste | vraie valeur | levure |
|---|---|---|---|---|---|
| d1 | tiède | **Le radar respire.** Radar m4/h4 à 12 axes, au style. Gris : la stout avant. Violet : avec Idaho 7. Un trait violet pâle garde Idaho 7 « à froid » : l'écart est ce que le moment emporte (« le CO₂ emporte ~−6 résineux »). Réponse sur une ligne (Floral ~+22, Résineux ~+14, IBU), pastilles des 10 autres familles. | dock sous le pouce, par 5′, loupe ×3 ; le radar se transforme en 220 ms | la preuve change avec le moment : H13 (4MMP −91 % en 60′, −23 % à 90 °C), E03 (Idaho 7, linalol 38 ± 13 µg/L), E10 (1 h ≈ 96 h) | pont vers l'outil : « Levure › Pomona ~+13 agrumes » |
| d2 | tiède | **Ce que le moment mange.** Les barres l5b de la carte, en deux couches : le plein est ce qui reste dans ta stout, la queue hachurée à la couleur de la famille est ce que la chaleur ou le CO₂ emporte. Plus la jauge d'amertume de toute la stout (Nugget 60′ ≈ 60, 16D 50–70). | dock ; à 60′, le plein fond et la queue grandit | même preuve par moment | dernière étape : « 1 Quand · 2 Levure », « Puis la levure › » |
| d3 | tiède | **Le nez du verre.** Un verre de stout (EBC stout) ; au-dessus de la mousse, un filet ondulé par famille, haut comme son intensité, face à sa colonne du style. Le filet pâle montre ce qui est emporté ; bulles de CO₂ en dry hop actif, nuage de vapeur à l'ébullition. Le moment et l'IBU sont écrits dans la bière. | dock ; les filets montent ou tombent | même preuve | dernière étape |
| d4 | tiède | **Les aiguilles de ta demande.** Ta dégustation du 18.10 en trois cadrans : floral (plus), résineux (moins), amertume (tenue). Chaque cadran montre la zone du style, la stout avant (trait fin) et un arc hachuré pour ce qui est emporté. Les autres familles en pastilles ; « Le meilleur moment pour ta demande » est nommé (actif · 2 j ~). | dock ; les aiguilles tournent | même preuve | pont vers l'outil Levure |
| d5 | chaude | **Les fioles.** Ce qui reste d'Idaho 7 dans ta stout, composé par composé : linalol, géraniol, myrcène, 4MMP. La part retrouvée en bière est sur une échelle log de 0,1 à 100 %, avec la plage publiée en trait (bas non publié en hachuré). Sous chaque fiole, la teneur du lot (CoA ID7-2573 : 0,4 / 0,6 / 45,4 % de l'huile ; 4MMP « ? non dosé »). Dessous, l'effet sur floral, tropicaux et résineux en barres l5b. | dock ; les fioles se vident vers 60′ (linalol ~54 → ~6 %, myrcène ~1 → ~0,1 %) | bornes des parts retrouvées (H30, H13, H31, H33, H11), CoA du lot, E03 | pont vers l'outil : « Levure › Pomona : géraniol → citronellol ~50 % » |
| d6 | chaude | **La trajectoire.** Un point par moment sur deux axes de brasseur : l'amertume en IBU et le floral. La bande 16D 50–70 est visible ; le couloir « à cru, IBU ? » est hachuré, jour par jour. La courbe dit d'un coup que tôt, c'est amer et pauvre, et que tard, c'est floral. Un anneau violet marque ta demande. En dessous, toute la stout au moment choisi. | le pouce glisse le long de la courbe elle-même (role=slider, flèches au clavier) | même preuve | dernière étape |
| d7 | chaude | **Le bouton du brassin.** Un bouton rond comme celui d'un four : la couronne porte le moment (60′ → après 7 j, encoche violette = ta demande). Au centre, la roue de la stout : une barre radiale par famille, face à l'anneau du style, et en pâle ce qui est emporté. | rotation du pouce sur la couronne | même preuve | pont vers l'outil Levure |
| d8 | chaude | **Le ruban de ta stout.** La stout en ruban de couleurs, une longueur par famille, au style. En haut, la stout avant, presque toute résineuse. En bas, avec Idaho 7, le ruban qui s'allonge, avec en gris hachuré au bout ce qui est emporté. Le trait du style court sous le ruban : gris dedans, orangé au-delà. Quatre mini-rubans (60′, WP, actif, après) disent où la couleur arrive. | dock ; le ruban s'allonge ou fond | même preuve | dernière étape |

Levure : en dernière étape, d2, d3, d6 et d8 ; en pont vers un outil Levure, d1, d4, d5 et d7 (au moins deux de
chaque forme, comme demandé).

Le meilleur moment pour ta demande est calculé, pas choisi à la main. Parmi les moments où l'IBU tient dans la
16D (ou à cru), c'est celui qui maximise (floral − avant) − (résineux − avant), soit **actif · 2 j**
(floral ~+22,1, résineux ~+13,8), devant **après** (résineux ~+19,7). Le CO₂ du dry hop actif emporte la moitié
des hydrocarbures (convention du moteur, H33), donc moins de résineux pour presque autant de floral. C'est un
enseignement du simulateur, marqué « ~ ».

## Baseline

Plancher repris dans les huit concepts (socle commun) :
- **y1b** : le moment se glisse comme un curseur, par 5′, dans un dock sous le pouce, avec une loupe ×3
  (66 px par cran sous le doigt, contre ~14 px sur le rail à l’ébullition). « Face à ta stout » : chaque valeur se lit
  contre la stout avant. La jauge d'amertume de toute la stout est dans d2 ; ailleurs, l'IBU est sur une
  ligne. Les valeurs interpolées entre 60′ et 10′ sont marquées « ≈ ».
- **x3b réduit** : la comparaison « ma bière → +1 » devient le cœur de chaque concept (la stout avant
  contre la stout avec Idaho 7). d8 la montre en rubans superposés.
- **a2b** : la cuve apporte, la levure ajoute, le CO₂ emporte. C'est l'axe de la série : la part emportée
  (chaleur ou CO₂) se voit dans chaque concept. La levure n'est pas réglable ici : US-05 est fixé, donc
  ~0 au centre. Elle passe par l'étape 2 ou par le pont.
- **Acquis** :
  - code couleur des arômes (jetons de famille) ;
  - barres l5b avec zone du style (d2 ; d5 en petit) ;
  - radar m4/h4 sans légende écrite (d1) ;
  - pictos au trait ;
  - lecture au style par défaut, absolu à un toucher ;
  - α du lot puis plage des fiches (« α 12,7 % 9,5–14,9 »), rôle en mot (« mixte ») ;
  - légende derrière « ? » ;
  - appui long (survol long à l'ordinateur) qui ouvre la fiche courte g1 d'Idaho 7, avec ses arômes
    sourcés, sa silhouette, son geste de goût et « autres mots : aucun (0 %) ».
- **Stock en icône** : sans objet ici, puisqu'Idaho 7 est fixé dans le contexte et qu'aucun stock n'est connu.
- **Carte des outils** : titre en question, ligne de contexte sans contrôle (houblon, dose, levure, base) et
  un seul groupe libre, `data-libre="moment"`.
- **Honnêteté** :
  - « ~ » marque le simulé, « ≈ » l'interpolé ;
  - « ? » hachuré pour l'inconnu (Pépins, Melon ; avant inconnu de Noyau et Baies : pas de rond « avant »,
    valeur sans signe) ;
  - IBU à cru « + ? », jamais 0 ;
  - les axes inconnus du radar ne sont pas tracés à 0 (ligne brisée).

Écarts, un à la fois, avec leur raison :
- **d6 et d7 n'ont pas de dock** : le geste est la représentation elle-même (la courbe dans d6, la couronne
  dans d7). Le pouce reste au premier écran et pose toujours le moment par cran (`role=slider`).
- **Pas de « puis » (second dry hop) ni de second houblon** : la carte du conseil (« y1b sans sélecteur de
  houblon, sans second houblon et sans levure ») l'exclut de cet outil.
- **d5 parle en composés** : c'est le seul concept qui montre la chimie au premier plan, traduite en pictos
  de famille à côté, avec la vraie teneur du lot. Les familles restent dessous, en barres l5b.

## Contrôles joués une fois (sorties recopiées)

- **G1, baseline** : `controle-commun … d1…d8 --page=etat.html --sans=mots` → `COMMUN OK` (couleurs,
  au-style, survol, blocs, contraste, fiche, standard, trait, legende, parlant, brutes : OK). Sur la première
  passe, il y a eu deux échecs, corrigés :
  - d1 n'avait que 2 teintes franches : ajout des pastilles des 10 familles ;
  - d5 n'avait pas de zone du style : ajout des barres l5b sous les fioles.
- **D98** (`controle-une-question`) : les 8 pages ont pour titre « Quand ajouter Idaho 7 ? », un libre
  (moment) et le contexte houblon, dose, levure, base → `UNE-QUESTION OK (1 groupe libre : moment)`.
- **D99** (`controle-acquis`) → `ACQUIS ECHEC 32 problème(s)` (d1 à d8 : « 0/4 : aucun · 4 faute(s) »).
  D99 porte les quatre acquis de l'écran Comparer (radar, chimie, panel OSU, vraies valeurs balisés
  `data-acquis`). Ce n'est pas l'écran Dryhopper. d1 a un radar et d5 une chimie, mais aucun n'est balisé
  `data-acquis` : à baliser en passe 2 si le pilote veut que D99 s'applique ici.
- **MOTS** (`mots-premier-ecran --max=80`) :
  - d1 76, d2 100, d3 74, d4 94, d5 109, d6 77, d7 57, d8 82 → `MOTS ECHEC 4/8 au-dessus de 80` (d2, d4,
    d5, d8) ;
  - avec `--sans-donnees`, de 30 à 58 mots → `MOTS OK`.

  À resserrer en passe 2. Pistes : les étiquettes de d5, les pastilles de d4, la ligne IBU de d2.

## Ce qui tient, ce qui casse

- **Tient** :
  - le moment fait bouger toute la stout, et l'enseignement saute aux yeux à 60′ (« la chaleur emporte
    ~−21 floral », ≈ 162 IBU, trop amer) comme en dry hop actif (« le CO₂ emporte ~−6 résineux ») ;
  - 0 erreur de console sur les 8 pages ;
  - chaque geste est prouvé dans `captures/geste-dN.json` (actif · 3 j → 30′ à 40′ : floral ~+22 → ~+9,
    IBU à cru → ≈ 138).
- **Casse** :
  - au style, Idaho 7 à 4 g/L reste petit dans la stout, sauf le résineux. Les radars et roues sont donc
    serrés au centre (d1, d7). C'est honnête, mais peu spectaculaire ;
  - le simulé d'Idaho 7 sort probablement trop bas en thiols (PROFIL-SIMULE : 3MH et 3M4MP connus en somme
    seulement), ce qu'aucun concept ne dit encore ;
  - d3 dessine un verre trapèze, pas encore un vrai nonic ;
  - d6 superpose les jours d'actif (floral 22,1 de 2 à 7 j) : le couloir les étale par cran, pas par
    valeur ;
  - le meilleur moment (actif · 2 j) n'est que 0,01 devant 3 j.

## Captures

`captures/dN-390.png` (repos, actif · 3 j), `dN-60-390.png`, `dN-wp-390.png`, `dN-toucher-390.png` (doigt posé,
loupe), `dN-fiche-390.png` (appui long), `dN-page.png`, pour N de 1 à 8. Ouvertes et regardées : d1-390, d1-wp-390, d1-toucher-390, d2-390, d2-60-390, d2-fiche-390, d3-390, d3-60-390, d4-390, d4-60-390, d5-390, d5-60-390, d6-390, d6-toucher-390, d7-390, d7-toucher-390, d8-390, d8-60-390.
