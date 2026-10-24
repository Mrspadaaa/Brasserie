# Écran 1 — Guide de priorité (méthode v2, étape 2)

Pour chaque élément : son plan, le récit qu'il sert (CADRAGE.md), et le nom de son
déclencheur. Données : `prototypes/houblons-v4/data/pack-mini-protos.json` (S1 par défaut).

## Deux états de l'écran

- **État A, à l'ouverture** : la lecture au style, avant toute demande.
- **État B, après la demande** « + floral, − résineux » : la même lecture, et la réponse
  du moteur en voies.

## Plan 1 — visible sans geste (7 éléments au plus, 60 mots au plus au premier écran)

| # | Élément | Récit | Contenu exact |
|---|---|---|---|
| 1 | En-tête | 1 | « Stout export » · pastille « 16D » avec badge « hypothèse » · « 60 IBU » avec une mini-jauge contre 50–70. |
| 2 | Réponse d'une ligne | 1, 5 | État A : « 3 au style · 9 non situées ». État B : « Plus floral : 14 voies › · Moins résineux : aucune voie › » (chaque moitié est le déclencheur de son détail). |
| 3 | Les familles qui comptent | 1 | État A : celles que le style attend (floral, herbacé, terreux). État B : plus celles visées par une demande (résineux). Chacune : piste au style (bande nette, plage de la bière floue), marquée seulement si elle sort de la bande. Pas de chiffre. |
| 4 | Groupe des autres familles | 1, 5 | Une ligne repliée : « 9 autres » en A, « 8 autres » en B (le mot « non situées » est déjà dans la réponse : ne pas le répéter). |
| 5 | Direction | 2 | Puces : « + floral », « − résineux », « + … » ; l'action principale de l'état A. |
| 6 | Voies (état B) | 3 | Les 3 premières, dans l'ordre du moteur : houblon, moment et dose (« 10′ · 10 g »), stock (« en stock », « manque », « à acheter »), et l'effet de bord en tag (« + épicé », « + agrumes ») : c'est ce qui distingue les voies, leur gain floral étant le même. |
| 7 | Marquer pour comparer (état B) | 3 | Case par voie ; bouton « Comparer (2) » qui n'apparaît qu'avec 2 voies marquées. |

## Plan 2 — à un geste, sur place

| Déclencheur | Ce qui s'ouvre | Récit |
|---|---|---|
| Toucher une famille | La rangée se déplie : bande du style en chiffres (0–55), plage de la bière (0–48), repère (7), cran (18 points), verdict | 4 |
| « 8 autres » | Les 8 rangées, en pistes compactes | 1 |
| « Plus floral : 14 voies › » | La liste complète, stock et à acheter séparés | 3 |
| Pastille du style | Choix de la bière (stout export 16D, lager tchèque 3B) et mention « hypothèse BJCP, à valider » | 1 |
| Toucher une voie | Son effet en fantôme sur toutes les pistes ; IBU après ; débordements hors du style | 3, 4 |
| « Moins résineux : aucune voie › » | Deux lignes : « Aucune fiche ne cite Nugget comme résineux. » ; « Cause possible hors houblon : malt torréfié, levure, oxydation. » | 2, 5 |

## Plan 3 — à deux gestes au plus (feuille de détail)

- Pourquoi le modèle ne situe pas une famille.
- Source de la bande du style : citation BJCP, table des mots, mention « hypothèse BJCP,
  à valider » (un badge « hypothèse » sur la pastille du style suffit au plan 1).
- Détail du calcul IBU, fiches des houblons (Beer Maverick, Hopsteiner).
- La lager tchèque 3B : la comparaison des trois houblons (« ≈ partout ») et la
  démonstration « même écart, deux styles ».

## Phrases canoniques des états (aucune autre formulation)

| État | Au plan 1 | Explication (plan 2 ou 3) |
|---|---|---|
| Au style | rien (neutre) | — |
| Au-dessus / au-dessous de la bande | « trop » / « peu » + marque | chiffres au plan 2 |
| Plage trop large pour trancher | « non situé » | plan 3 |
| Aucune voie possible | « aucune voie » | plan 2 (une ligne), plan 3 |
| Écart plus petit que l'incertitude | « ≈ » | plan 2 |
| Échelles hypothétiques | badge « hypothèse » | plan 3 |

## Ordre de l'écran, corrigé par le brasseur (18.10, prime sur tout ce qui suit)

« Comme pour les Malts j'ai besoin d'avoir des le premier coup d'œil, quel matière
première j'ai, et et je peux ajouter en un click ultra facilement. Ensuite seulement je
peux ouvrir mon panel de comparatif ect .. » (capture de l'étape Malts de l'app :
résumé Grain / OG / IBU / EBC en tête ; « Ajouter [Grain ⟳] » et un champ « Ajouter —
grain… » ; une carte par ingrédient avec tag tournant « Empâtage ⟳ », pas-à-pas − 0,4 kg +,
corbeille, « Base · 4 EBC · modifier »).

L'écran houblons devient **l'étape Houblons de la recette**, au même modèle que Malts :

1. **En-tête de recette** : résumé IBU (jauge contre la bande du style), et les autres
   chiffres de la recette comme l'étape Malts.
2. **Les houblons de la recette, d'abord** (`data-role="houblons-recette"`, une ligne
   `data-role="ligne-houblon"` par ajout) : nom, tag de moment qui tourne (60′ ⟳), pas-à-pas
   de dose en g, IBU apportés, citations utiles (« résine 2/4 fiches »).
3. **Ajouter en un toucher** : des puces d'ajout rapide (`data-role="ajout-rapide"`) tirées
   du stock et adaptées au style (« + Golding », « + Motueka »…), plus le champ « Ajouter —
   houblon… ». Un toucher ajoute la ligne.
4. **Puis le panneau d'analyse** (`data-role="panneau"`), annoncé par une ligne : « Boisé
   et résineux trop marqué · 6 au style · 5 non situées › ». Il contient la lecture au style
   (Barres / Radar), la direction (« + floral », « − résineux », cible à glisser), les voies
   et le comparatif. État B = ce panneau ouvert après la demande.

La densité (remplissage ≥ 0,80, 80 mots) et les boosters (4 au moins, dont la bascule
radar, dans le panneau) restent exigés.

## Lot 2 : plus dense, lentilles, boosters (après le coup d'œil du brasseur, 18.10)

Ses mots sur les 3 fils de fer retenus : « C'est mieux et tu as bien évaluer les problème,
pas assez dense. » ; « on peut aussi basculer d'un affichage à un autre, type bare graph à
radar graph. » ; « D'autres type de UX booster du genre doivent être mis en avant. »

**Densité.** L'état A ne laisse plus la moitié basse vide. Mesure : la part de la hauteur
du premier écran couverte par du contenu (`fill` dans `captures/pNN.json`) est de 0,80 au
moins en A et en B (lot 1 : 0,41 à 0,79 en A). Budget de mots porté à **80** au premier
écran, parce que la densité vient en plus du dessin, pas du texte.

Plan 1 de l'état A, complété :

| # | Élément | Contenu |
|---|---|---|
| 1 | En-tête | inchangé ; jauge IBU lisible au coup d'œil |
| 2 | Réponse d'une ligne | inchangée ; en B, « Moins résineux : aucune voie » a le même poids que l'autre moitié |
| 3 | Lecture au style des 12 familles | les 3 attendues en grand ; les 9 autres **visibles en compact** (petits multiples, rangée serrée, brouillard), pas seulement repliées |
| 4 | **Bascule de lentille** | contrôle segmenté **Barres / Radar** sur la **comparaison de 2 à 4 houblons** (niveaux de citation 0, 1, 2) ; **corrigé le 18.10** : le radar appliqué à la lecture de la bière était « une catastrophe » (D18) ; la lecture de la bière reste en barres |
| 5 | Houblons de la recette | « Nugget · 60′ · 46 g » ; moment et dose en tags qui tournent au toucher (C095) |
| 6 | Direction | puces « + floral », « − résineux » **et** glisser la cible sur une piste |
| 7 | Mes houblons adaptés au style (A) / voies (B) | A : 3 à 5 houblons du stock, quantité et mini-profil au style ; B : les voies, effet en fantôme sur la lecture au toucher prolongé |

**Données mises à jour (moteur `dabbeb27`, D25).** Elles remplacent les textes du lot 1 :

- **Les phrases et les verdicts par famille viennent du pack**, jamais de l'auteur :
  `scenarios.S1.reading` (verdict, source dégustation / modèle / non situé, par famille) et
  `S1.readingSummary` (phrases canoniques A et B). Les phrases ci-dessous sont indicatives.
- **Réponse A** : « Résineux trop marqué · N au style · 5 non situées ». La résine vient de
  la dégustation du brasseur (`S1.tasting` : « trop résineuses » → marqué, face à la bande
  neutre 0–30) : c'est **l'exception à montrer en premier**, avec l'accent. 7 familles ont
  maintenant un repère du modèle ; 5 restent « non situées » (fruits à noyau, à pépins,
  petits fruits, melon, végétal).
- **Réponse B** : « Plus floral : 8 voies · Moins résineux : 6 voies, faibles ». Voies 1 à 8
  pour le floral (Golding, Motueka, Aurum…, ajout à 10′) ; voies 9 à 14 pour la résine
  (remplacer ou diminuer Nugget à 60′), dont l'effet est faible (−3 points au plus, pour un
  cran de 10) : le mot « faibles » le dit, le dessin le montre.
- Le Nugget de la recette porte maintenant ses citations (« résine : 2 fiches sur 4 ») : un
  tag sur la rangée de la recette peut l'afficher.
- Pistes hors modèle pour la résine (amertume, torréfié, oxydation, forte dose à
  l'ébullition) : plan 2, sous « 6 voies, faibles ».
- Les libellés du pack peuvent contenir un point décimal (« 38.5 g ») : l'affichage met
  une virgule ou arrondit à l'entier.

**Boosters.** Chaque fil de fer en montre **au moins quatre qui fonctionnent** (pas
seulement dessinés), dont la bascule Barres / Radar, choisis dans `docs/ux-boosters.md`.
Chacun nommé dans `NOTE.md` avec le récit qu'il sert.

## Contrôle de l'étape 2

Juge Opus neuf, 18.10 : corrections appliquées (réponse A « 3 au style · 9 non situées », effet de bord en tag sur chaque voie, bascule de bière sortie du plan 1, causes hors houblon montées au plan 2, redondances retirées). Estimation du juge : environ 28 mots en A, 52 en B.

## Interdits au premier plan

Paragraphe, légende, note du moteur, source, citation du brasseur, chiffre que le dessin
dit déjà, texte anglais, « (s) », point décimal.
