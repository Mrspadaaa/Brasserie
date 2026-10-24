OK — u4 enrichi (G1 à G5 verts) et cinq petites variantes u4e1 à u4e5, COMMUN OK

## Fichiers écrits (Possède seul)
- `prototypes/houblons-v4/parcours/src/ecrans/substituer/index.tsx` : puce de moment, crans d'arômes par ligne avec Nugget
  en tête, « + » et « Comparer (n) › » (Nugget épinglé), ordre des sections hors 60′, mots du moment (« au dry hop »…).
- `…/substituer/substituer.css` : classes `pq-substituer-` (L26) pour la puce, les crans, le « + », la légende à droite.
- `…/substituer/jeu.mjs` : 3 gestes ajoutés (puce dry hop, + Comparer, retour à 60′) avant « Remplacer ».
- `…/substituer/NOTE.md` : section « Reprise D127 », chaque choix de forme.
- Captures : `prototypes/houblons-v4/maquettes/parcours-substituer/captures-d127/` (dossier ignoré par git, comme toute la sortie).

## Critères (rejoués depuis la racine, construction finale)
- G1 `construire.mjs --sortie=…/parcours-substituer` : `CONSTRUIT OK (9 pages)`
- G2 `controle-substituer-gestes.mjs` : S1 dry hop OK, S2 ajouter à Comparer OK, S3 remplacer OK, S4 fermer OK → `SUBSTITUER-GESTES OK`
  (sur la version de départ : `SUBSTITUER-GESTES ECHEC (2/4)`, S1 et S2)
- G3 `controle-etats.mjs --ecran=substituer` : `ETATS OK (14/14) ; 1 voulu(s) non rejoué(s)` (la croix, D109)
- G4 `controle-commun.mjs … substituer --page=etat.html --sans=mots` : `COMMUN OK` (un premier passage avait échoué sur STANDARD
  S3, des rayons de 1,5 px ; corrigé à 2 px)
- G5 `controle-choix.mjs --ecran=substituer` : `CHOIX OK` ; `controle-teinte.mjs` : `TEINTE OK 6/6`
- En plus : `verifier-types.mjs` TYPES OK ; `jouer-parcours.mjs --etape=substituer` ETAPE OK (dont le dry hop : moment
  `dryActive` dans le brouillon, recette inscrite restée `b60`, remplaçants pris dans le moteur, « au dry hop » en tête et en pied ;
  « + » : la liste partagée et « Comparer (2) ») ; `--ponts` PONTS OK ; `--routes` ROUTES OK (8/8) ; `controle-annuler` ANNULER OK.
- Hors GATES, déjà en échec sur la version u4 de départ (construction du pilote `maquettes/parcours`) et non aggravés :
  `controle-sans-famille` (forme « autres » de Nelson Sauvin au tableau) ; `controle-une-question --edition` (titre « Nugget »
  sans question, contexte d'un seul facteur ; il compte maintenant la puce de moment comme facteur libre, voir DÉCISION).

## Captures (ouvertes en images, à côté de u4)
- `…/captures-d127/cote-u4-60-whirlpool-dryhop.png` : u4 | 60′ | whirlpool | dry hop (premiers écrans)
- `…/captures-d127/cote-u4-plus-comparer.png` : u4 | après « + » sur Magnat (✓, « Comparer (2) ») | Comparer ouvert (`#/comparer?h=magnat&pin=nugget`, Nugget ⌖)
- `…/captures-d127/d127-60.png`, `d127-whirlpool.png`, `d127-dryhop.png`, `d127-dryhop-aromes.png` (au dry hop, le tableau
  « Arômes 16D » juste sous les bandes), `d127-plus-comparer.png`, `d127-comparer.png`, `d127-legende.png` (« ? » ouvert)

## Ce que la capture montre
- À 60′ : la tête, la réponse et l'échelle de u4, avec la puce « 60′ · recette | whirlpool | dry hop » au-dessus, et sous
  chaque nom les crans floral, herbacé, terreux | résineux. Nugget est en tête comme référence : le brasseur voit d'un coup
  d'œil que Nelson Sauvin (86) ne décrit aucune des trois attendues, et que Magnat ne garde que le floral.
- Au dry hop (un toucher) : « Au dry hop, l'arôme fait le score. Nugget au dry hop : ta stout passerait de 59,7 à 0 IBU ;
  chaque remplaçant à masse égale. » ; « Target, 86 sans inconnue. Target garde floral, herbacé et résineux, perd terreux
  (fiches). » ; Target 86, Falconer's Flight 83, Idaho 7 82… (moteur) ; pied « 46 g de Nugget à 60′ → 46 g de Cascade au dry hop ».

## DÉCISION (prise, réversible)
- DÉCISION : la puce place l'ajout du brouillon au moment touché, donc « Remplacer » inscrit aussi ce moment ; c'est la seule
  lecture où la dose, le classement et « Ma bière avec chacun » restent justes au moment affiché. Le prix est dit avant
  (59,7 → 0 IBU au dry hop) et dans le pied (deux moments nommés). Annuler et la croix laissent la recette à 60′.
- DÉCISION : le « + » écrit dans la liste de comparaison partagée (celle de Suggérer et de la fiche, D78) ; « Comparer (n) »
  compte Nugget plus les remplaçants retenus (3 au plus : Comparer a 4 colonnes).
- DÉCISION À PRENDRE (pilote, moteur hors Possède) : au whirlpool et au dry hop, `substitutes()` a les mêmes poids (contexte
  « arôme ») : le classement est identique, seuls la dose et le stock changent. Le brasseur pourrait le lire comme une puce
  sans effet. Une différence propre au dry hop (biotransformation, levure) se trancherait dans le moteur.
- DÉCISION À PRENDRE : aller à Comparer quitte le brouillon (la Coquille l'abandonne hors d'une route d'outil), donc revenir
  rouvre Substituer à 60′. Garder le brouillon de Substituer sous Comparer demanderait de changer `etat/etapes.ts` ou `Coquille.tsx`.
- `controle-une-question --edition` attend l'édition du moment en `button[data-edite="moment"]` dans la ligne de contexte ;
  VOIE.md demande un toucher au premier écran : la puce est un groupe radio. À adapter si ce contrôle entre dans la portée.

## Variantes (suite du pilote : « U4 enrichir semble vraiment mieux même si pas du 100% regarde pour faire quelques petites variante, amélioration »)
Cinq pages figées, un seul point touché chacune, le reste identique à u4 enrichi :
`work/refonte-frontend/v4/ecran-1/fils24-u4-enrichi/<id>/etat.html` et `NOTE.md` (le point touché, ce qui tient, ce qui casse).
- **u4e1** la puce devient la frise du brassin : « ébullition 60′ » (ta recette), « whirlpool », puis un trait pointillé
  marqué « fermentation » jusqu'à « dry hop » ; un toucher par station.
- **u4e2** les arômes à côté du score en pictos cerclés à leur valeur : marqué = cercle épais à la couleur de la famille,
  cité = picto seul, non décrit = cercle pointillé vide ; sans en-tête de colonnes. Le premier essai, avec un disque pâle
  derrière le picto, avait échoué à TRAIT (D88, « glowing ») ; le cercle est maintenant blanc.
- **u4e3** l'IBU encore moins présent : la réponse a l'arôme en titre (« Idaho 7 garde le plus de ta 16D : floral, herbacé
  et terreux. »), puis le score en gris ; au face à face, la dose et l'IBU passent dans une ligne discrète (« 46 g · 59,7 IBU »)
  et les crans de sa stout prennent la droite ; « Face à face · doses à IBU égal ».
- **u4e4** « + Comparer » plus évident : une case à cocher par ligne (en-tête « comparer ») et un dock noir
  « Comparer Nugget et Magnat (2) › » au-dessus de « Annuler · Remplacer ».
- **u4e5** au dry hop, le tableau « Arômes 16D » couché à côté des scores : une ligne par remplaçant, une colonne par
  famille (attendues sur fond gris), 2 crans, pointillé ; le score au bout ; « Pépins, Melon, Végétal : aucune fiche ne les
  décrit, ce n'est pas zéro. » À 60′ et au whirlpool, rien ne change.

Méthode : les variantes sont rendues par la maquette jouable (`substituer/etat.html?u4e=<id>`, drapeau `VARIANTE` dans
`index.tsx`, inactif sans paramètre), puis `fils24-u4-enrichi/outils/figer.mjs` fige le DOM rendu de trois états (60′,
whirlpool, dry hop) et la fiche de chacun des 17 houblons montrés ; `assets/style.css` est copiée de la construction, avec
les classes `pq-substituer-` renommées `u4e-` et les ids de React renommés ; `assets/u4e.js` joue la puce, « ? », l'appui long
ou le survol (fiche figée) et « + » ou la case (« Comparer (n) »). Toucher un remplaçant, Comparer, Remplacer et la lentille y
sont inertes (écrit dans chaque NOTE).

Contrôle : `controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils24-u4-enrichi u4e1 u4e2 u4e3 u4e4 u4e5 --page=etat.html
--sans=mots` → `COMMUN OK` (couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, legende, parlant, brutes).
Il a échoué deux fois avant : TRAIT sur u4e2 (le disque), FICHE sur u4e3 (l'appui long de la page figée attendait 650 ms,
autant que le contrôle ; maintenant 450 ms, la `DUREE_APPUI_LONG` de la maquette).
La maquette jouable sans paramètre, rejouée après l'ajout du drapeau : SUBSTITUER-GESTES OK, ETATS OK (14/14), COMMUN OK,
CHOIX OK, TEINTE OK 6/6, TYPES OK, ETAPE OK, ANNULER OK. Un premier passage de CHOIX avait échoué (controle-annuler à
1280 px : le pied s'était retrouvé dans l'enveloppe du dock de u4e4) ; l'enveloppe ne sert plus qu'à u4e4.

Captures (390 × 844, ×2, ouvertes) : `fils24-u4-enrichi/captures/<id>-premier-ecran.png`, `<id>-dryhop.png`, `u4e4-coche.png` ;
côte à côte avec u4 enrichi : `captures/cote-premier-ecran.png`, `captures/cote-dryhop.png`.
Prédiction : il gardera u4e5 au dry hop et u4e4 pour Comparer ; u4e2 se lit tout de suite, mais il la trouvera chargée.

## Prédiction
« Là c'est bien : je vois l'arôme de chacun et je peux passer au dry hop ; par contre whirlpool et dry hop donnent la même liste ? »

CONNAISSANCE : au whirlpool et au dry hop, `substitutes()` donne le même classement (mêmes poids, contexte « arôme ») ;
seuls la dose (même IBU ou masse égale) et le stock suffisant changent ; Nugget est le seul amérisant de la stout S1 (au dry
hop, la recette passe de 59,7 à 0 IBU).
LEÇON PROPOSÉE : `jouer-parcours.mjs` touche la dernière cible visible (`cible()` → `.at(-1)`), pas la première : un
`verifier` de jeu.mjs qui relit « la » cible doit relire la dernière (perdu un essai ici).
