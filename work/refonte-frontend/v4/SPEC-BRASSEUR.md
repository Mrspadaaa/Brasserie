# Ce que le brasseur demande — document unique de référence (outil houblons)

Créé le 18.10.2026 après D23. **Tout brief, consigne, grille ou contrat de l'outil houblons
part de ce document et le cite.** Ses mots sont recopiés tels quels, avec leur source ; une
reformulation d'agent n'y entre pas. Le détail fonctionnel (61 exigences, R01 à R61) reste
dans `exigences-retrouvees.md` ; le corpus complet dans `docs/besoins/corpus-demandes.md`
(identifiants Cxxx). À compléter à chaque nouvelle parole du brasseur. Seul le § 0 reformule : c'est une
carte datée, écrite par le pilote, qui renvoie aux mots exacts. Ces mots priment toujours sur elle.

## 0. Ce qui vaut aujourd'hui (carte du pilote, 22.10 ; lire d'abord, puis la seule section du sujet)

**Règle n° 1 : ses choix.** « C'est critique que mes choix soient respectés. SI non, rien n'a de valeur. » (23.10, après « Je confirme que "Bière" et "Suggérer" divergent nettement du
design choisi. Oui c'est quoi ce bordel ??? », D105), puis : « Met ça dès les informations et fait en sorte que ça
m'arrive plus jamais ». Chaque écran repart de la maquette qu'il a choisie, telle qu'il l'a vue. Le registre
`work/refonte-frontend/v4/choix/ecrans.json` dit, écran par écran, son choix, ses mots, la capture et
l'inventaire ; `controle-choix.mjs` vérifie chaque écran contre lui.

Défauts déjà refusés, en court : `DEFAUTS-COURT.md`. Acquis validés : `cerveau/produit/acquis-valides.md`.

**L'outil**
- Penser en brasseur : sur un houblon, le nom, l'α (celui du lot, puis la plage des fiches), le rôle en mot, les arômes
  en couleur, le moment et la dose, puis l'IBU. Le stock en petit badge. (§ 1 « Penser en brasseur », « Le stock,
  discret » ; D29, D87, D90)
- Un outil, une question, un seul facteur libre. La carte du 22.10 : Comparer fait varier la variété, Dryhopper le
  moment, la dose, les jours et la levure. (§ 1, retour sur le lot 21 ; `cerveau/decisions/`)
- Échelles au style par défaut, l'absolu à un toucher. La tolérance dépend du style et de son a priori. (§ 1 « Absolu
  et style », « L'échelle dépend du style » ; § 2 ; D31, D54, D75)
- Rien de figé : le moment est libre par tranches de 5′, l'ébullition a une durée variable, dry hop et whirlpool se
  règlent. (§ 1 « Le moment, libre », « Rien de figé » ; D34 à D37)
- Le geste : glisser l'ajout sur le rail, avec une loupe façon Apple qui suit le doigt, de l'ébullition à J+14 d'un seul
  geste. (§ 1, rail ; D47, D55, D61 à D69)
- L'appui long sur un houblon ouvre sa vraie fiche, dans le langage de la page. (D25, D49, D70 à D73, D93)
- Vraies valeurs et simulation marquée, ensemble : « Les deux se complément ». Une incertitude énorme se voit, et
  l'inconnu n'est jamais 0. (§ 1, lot 20 ; D65, D94, D95)
- Levure, biotransformation et ajout cumulé font partie de l'outil. (D96)
- Comparer : du 1:1 sur vraies valeurs, la chimie, le radar avec intervalles ; Beer Maverick est le plancher. Le
  rendu de Nelson Sauvin et de Motueka doit tenir leur réputation. (§ 1 ; D51 à D53, D100)

**L'écran**
- Dense mais pas surchargé : au premier plan seulement l'utile et l'actionnable, le reste à un toucher, 80 mots au plus.
  Pas d'écran de cockpit. (§ 3 ; D1 à D5)
- Le thème de ses maquettes choisies (page blanche, gris neutres, texte presque noir), et non le « clair » pastel du
  prototype (D106), devient celui de toute l'app ; « cave » en sombre (23.10, § 5 ; valeurs dans DESIGN.md).
- Moderne et visuel : des UX boosters (curseurs, bascule barres et radar) et des couleurs pour se repérer. (§ 4 ; D6,
  D7, D74)
- Pictos d'arômes au trait, sans halo ; la légende derrière un petit « ? » ; l'usage en mot. (D88 à D90)
- « Épicé » : cannelle et clou croisés, choisi le 23.10 et dans la baseline. (§ 1, fin ; D101 à D101 quater)
- Ses choix, écran par écran : le registre `work/refonte-frontend/v4/choix/ecrans.json` (règle n° 1), vérifié par
  `controle-choix.mjs`. Aucune liste ici : elle en oublierait un. Celle qui était là citait y1b, q2b et r6a, et
  oubliait l'étape Houblons et Ma bière de la base v4.10 : c'est ainsi que l'information s'est perdue (D105).

**La méthode**
- Les mini maquettes passent par l'entonnoir : un vaste panel de concepts minimalistes sur la baseline, en trois
  chaleurs, puis un classement, des greffes et des passes v2, v3… Tout lui est montré, et il choisit. (§ 7 ; D50, M13)
- La baseline est un plancher à enrichir, toujours suivi ; on ne s'en écarte que si l'idée le vaut. (D26, D93)
- Une version, un artefact neuf et daté, qui ne montre que cette version et se lit au téléphone (23.10). Pas de
  question bloquante : ses choix de goût deviennent des variantes. (§ 1, pages partagées ; § 7 ; L24, M12)

**Remplacé, ne plus appliquer**
- La planche de fils de fer gris (§ 7, 18.10), remplacée le 19.10 : « Tu t'es trop limité, m'eme au niveau des
  couleurs » (D74).
- « bio Transfo, dry hopping, levure […] c'est pas pour tout de suite » (§ 1, 18.10), remplacé : lots 20 et 21, D96.
- « Pour 136 Comparer […] Mettre de côté pour le moment » (§ 1, 19.10), remplacé : Comparer est le lot 22.

## 1. Le travail à faire avec l'outil

- « ma stout est trop résineuses, je la veux plus floral. La moteur nous propose plusieurs
  houblons et on peut ensuite comparé. » — 18.10, D20/brief v4.
- « Je veux aussi comme pour l'une des versions de v5 Avoir une vue d'ensemble des houblons
  pour le style » — 18.10, brief v4.
- « je veux que dans le 80% des cas où c'est, je sais déjà ce que je veux […] ça soit très
  pratique, pas surchargé, hyper lisible. Mais que son je veux aller dans le dur, comprendre
  vraiment, confronté mes idées, choisir mais aussi avoir le choix et que on me propose les
  choix, soit possible. » — C062 (29.09).
- « mais on doit pas non plus perde le modèle de calcul de la 5.5 » — 18.10, brief v4.
- **L'ordre de l'écran** (capture de l'étape Malts à l'appui) : « Comme pour les Malts j'ai
  besoin d'avoir des le premier coup d'œil, quel matière première j'ai, et et je peux
  ajouter en un click ultra facilement. Ensuite seulement je peux ouvrir mon panel de
  comparatif ect .. » — 18.10.
- **Les quatre objets** : « Je pense qu'il y a confusion entre, ce que j'ai actuellement
  dans ma bière, son profil. Le style de la bière, un target. La comparaison manuel entre
  plusieurs houblons. Et la comparaison par suggestions de l'outils » — 18.10 ; voir
  `ecran-1/MODELE.md`.
- **Cible et visée** (proposition du pilote confirmée : « la zone du style en fond, et ta
  visée en trait creux. Une visée hors du style reste permise, mais elle est signalée. » →
  « Parfait ») — 18.10.
- **Ses goûts** : « Ok après je peux goûté d'autres bière que les miennes et pas aimer un
  houblon en particulier ou autre... » — 18.10.
- **Recette d'abord, achats ensuite** : « C'est souvent le cas, je fais une recette puis
  ensuite j'achète les ingrédients, souvent pas présent... » — 18.10.
- **Le stock, discret** : « La stock sont beaucoup trop mis en avant surtout que dans l'app on
  voit dans le récap à la fin. » ; « Juste un petit badge ou info très subtil suffit. » —
  18.10, soir (révise la ligne précédente : la liste d'achats vit dans le récap de l'app).
- **Les autres écrans** : « Maintenant il faut aussi les radar graph et autres écrans » —
  18.10, soir.
- **Les radars, encore** : « C'est toujours n'importe quoi les spidergraph Radar graph il faut
  faire qqch.... » ; « Est-ce qu'il faudrait pas utiliser d'autres outils, framework, libraries
  pour ces radar ? » — 18.10, soir (D24).
- **La fiche du houblon** : « Aussi je voudrais que quand je fasse un appuie long, hover long
  super ordinateur, sur houblons, je puisse voir sa fiche en détails. » ; « Regarde pour des
  mini Proto de ça aussi » — 18.10, soir (D25).
- **Le rail des étapes** (sur la capture de p2, une flèche de 60′ à 10′) : « J'aime beaucoup
  l'intégration de la levure directement dans la p8 mais la p2 a un meilleur visuel, j'aimerais
  aussi pouvoir une fois mon houblons sélectionner pouvoir glisser comme un slider le moment de
  l'ajout. » — 18.10, soir (D27, D28).
- **Penser en brasseur** (recette vide de p2) : « quand la recette est vide, je trouve que les
  info sur les houblons sont pas pertinent pour le brasseur, pour la création de bière, j'aime
  bien le code couleur pour savoir quelle arôme ça ajoute mais c'est trop centré sur le ibu, pas
  d'info sur les AA. C'est un bon visuel, à garder mais le rendre plus pertinent. Le stock
  toujours trop mis en avant... » ; « Toujours pensé comme un brasseur » — 18.10, soir (D29,
  D23 ter).
- **Critique des barres** : « Je peux aussi faire déjà la critique des barre ou c'est trop tôt ? »
  — 18.10, soir (réponse : oui, les barres de p2, p3, p8 sont stables).
- **Les barres** (page partagée, 18.10, soir) : « Je trouve cette vue des barre super car très
  compact et facile. Mais le détail c'est un peu n'importe quoi, je sais pas comment bannir une
  contraintes ou réduire une autre, il y a des truc jaune ?? » ; « La p8 est plus fonctionnelle
  même si quelques améliorations sont nécessaires... » (D32, D33).
- **Absolu et style** : « Parcontre toujours attention !!! Tropicale 4/5 sur une ipa et 4/5 sur
  une Lager ça doit pas correspondre sur une Lager c'est très subtil alors que sur une ipa c'est
  tout ce que la bière est quasiment. » ; « Reste sur une échelle par style mais avoir en tout
  cas une vue qui affiche l'échelle en absolue. Car j'aime bien expérimenté et ai je veux une
  lager super tropical genre 50/100 ça sera pas vraiment affiché » — 18.10, soir (D31).
- **Suggestions et comparaison** : « Parcontre tout ce qui est suggestions et comparaison, c'est
  très mauvaise et de mon point de vu pas terminé on est d'accord » — 18.10, soir (lot dédié).
- **Le moment, libre** (sur le glissement de la base, 18.10, soir) : « Je veux choisir pas de 10'
  défini, pas de timing imposé hein » ; « Soit pas supide, c'est des tranche de 5'. » ;
  « Parcontre prendre en compte que le boil peut durer 120' ou d'autres timing que 60 » ; « Ça
  semble un peu bancale, c'est l'idée mais pas hyper bien réalisé » (D34, D35, D36).
- **Rien de figé** : « Ébullition de 120′  attention toujours garder des variables dynamique car
  cela peut changer... Je peux me dire tiens 200' c'est mieux ou 45' ça le fait aussi ect.. »
  — 18.10, soir (D37).
- **Les fiches du lot 4** : « Ce batch là semble être beaucoup plus cohérente en terme de UI sur
  le Spider graph (radar graph) mais ils sont sous quasiment identique » — 18.10, soir (D38).
- **Radars du lot 4, Comparer** : « Je m'attendais plus à qqch du genre mais plus cohérent.
  C'était quoi ce batch ? » — 18.10, soir (D39).
- **Le piège, encore** : « Déjà dit mais attention au piège !! » (rappel des quatre objets) —
  18.10, soir (D40).
- **La base v2** (sa capture, 18.10, soir) : « C'est defini ailleur dans l'application... » ;
  « On a un 10' qui sort de null part. C'est pas encore ça, les possible ajoute d'houblon sont
  vraiment à la bonne place ? Pourquoi celui choisi à de l'ombre ? » (D37 révisé, D41, D42).
- **Le rail, hors ébullition et au doigt** (18.10, soir) : « Que de j+3 » (commentaire) ; « Que du
  j+3 SI on est en dehors du boil, le passage entre 10' et 5' de fait très mal car on doit passe
  au dessus des houblons... » ; « Le slider fonctionne pour le boil mais pas pour les autres
  étape, pas dechelle pour les autres que des choix fix » ; « Et le slider est clancky pas
  fluide du tout » ; « Probablement lié au recalcule de l'ibu pas forcément utile à la volée
  instantané.. » (D43 à D46).
- **L'échelle en loupe** : « Pas besoin d'afficher une échelle linéaire avec tout les gradient du
  raille, ça doit rester cohérent. Juste les affiches quand on est à cette emplacement lors du
  changement avec le houblon. Genre quand on focus sur un type on affiche mieux l'échelle un peu
  un truc type UX apple qui zoom focus la où on est. » — 18.10, soir (D47).
- **Les 12 axes** (base v3) : « Il y a pas 12 radar ? » ; « Ni là » — 18.10, soir (D48).
- **La fiche, toute la carte** : « La zone de trigger est que le nom alors que ça devrait être la
  fiche entière... » (commentaire) — 18.10, soir (D49).
- **Ses variations** (base v3) : « C'est n'importe quoi ce radar, pareil pourquoi j'ai pas eu mes
  variations ? » (commentaire) ; « Pourquoi j'ai pas vu les screen de test de mini proto pour les
  autres vue ??? » — 18.10, soir (D50 : aucun choix intégré sans son coup d'œil).
- **Verdict sur le lot 4 publié** : « Pour la fiche, on est bon, ma bière moyen convaincu. Les deux
  autres c'est n'importe quoi... » ; « Je vais compacter ton contexte et on va de focus là dessus » —
  18.10, soir. (« les deux autres » : les radars de Suggestions et de Comparer.)
- **Beer Maverick, le plancher de Comparer** (ses captures du comparateur, Fuggle, Citra,
  Idaho 7, à l'appui) : « J'ai d'ailleurs donné des exemples concrets... C'est pas possible de
  faire moins bien... » ; « D'ailleurs, il faut des intervalles de confiance » ; « Beer Maverick
  pour le mode Comparer, c'est une des base, il faut faire mieux, pas moins bien ou la même
  chose... » — 18.10, soir (D24 et D40 révisés, D51 à D53 ; `ecran-1/CADRAGE-SC.md`).
- **L'échelle dépend du style et de mon a priori** : « Je pense que les échelles doivent
  notamment jouer, un peu plus résineux pour une stout est pas très problématique, pour une
  lager kolsch très. » ; « C'est un exemple mais il y en a beaucoup d'autres où certains style
  ou même mon apprioi est important et une petite différence peut en fait faire complément
  changé dechelle. C'est clair ? C'est possible de mettre ça en place ? » — 18.10, soir. Constat :
  le moteur donnait la même zone par défaut (0–30, neutre) à une famille non citée, quel que soit
  le style (résine : 16D, 5B et 3B identiques). Réponse : tolérance par style (familles hors du
  caractère que le BJCP décrit, masquage par la bière de base) et réglage du brasseur par famille
  (strict, normal, libre, banni) ; l'écart se lit en tolérances.
- **Pas tout de suite** : « Tout ce qui est bio Transfo, dry hopping, levure et thyole et autre
  spécificités, c'est pas pour tout de suite, on est d'accord ? » ; « Parce que au final, le
  problème c'est que ces échelle sont un peu 'abstraite' et peuvent même changé d'un même
  houblon à l'autre suivant l'année terroir ou autre » — 18.10, soir. Conséquence : lot 5 sans
  voies levure ni biotransformation ; la variabilité (année, terroir, lot) se montre en plages,
  et la valeur de mon lot en stock sur la plage de la variété.
- **La loupe, vraiment** (base v4 publiée, capture du geste, la zone vide entourée) : « Ça semble un
  peu étrange d'avoir autant d'espace, j'avais dit à la apple en mode zoom loop » ; avec deux
  houblons (« 0′ » et « Nugget » l'un sur l'autre) : « Avec deux houblons ça marche aussi un peu
  moins bien, parcontre c'est très positif, c'est vraiment dans la bonne direction » — 18.10, soir
  (D55, D56).
- **Comparer, son choix sur la planche du lot 5a** (la rangée d'arômes de p10 entourée) :
  « J'aime beaucoup la variante 3 mais ça manque d'intervalle de confiance, pourquoi il y a pas
  la partie arôme saveur aussi en comparaison ? » ; « C'est pas trop mal globalement... Mais il
  manque quelque info, notamment la relation avec le style. » ; « C'est mieux mais pas encore
  meilleur que le site original » ; sur la planche des radars : « Je pense que c'est aussi la 3
  même si ils sont tous un peu semblable » — 18.10, soir (D57 à D59 ; p03 retenu pour Barres et
  Radar).
- **Suggestions en Barres, à refaire** : « refait les mini maquette file de fer pour barre suggestion.
  Tu t'es trop limité, m'eme au niveau des couleurs et tout... » — 19.10, soir (D74 ; lot 14, couleurs
  et formes libres, l'orangé gardé pour l'alerte).
- **Suggestions, lot 5b** (planche des radars) : « C'est vraiment difficile à lire, pour moi il
  faut revoir, mais si il faut vraiment en choisir un ça serait la 6 » — 18.10, soir (D60).
- **Le trait noir** (Comparer p03) : « Pourquoi il y a parfois le truc noir pas toujours ?? » —
  18.10, soir (D57).
- **Le rail, base v4.1 au téléphone** : « C'est mieux mais c'est toujours un peu étrange, on est à
  35' et on a l'impression d'être quasiment à 60' » ; « Aussi les deux sont à 25' mais on dirait que
  l'autre est à 0' » — 18.10, soir (D61).
- **Le rail, base v4.2 au téléphone** (trois captures : Nugget tenu à 15′, à 35′, Motueka à 35′) :
  « Ça fait pas zoom focus sur l'emplacement. Les ajouter déjà présent saute à droite. C'est moins
  bien qu'avant... » ; « L'échelle est plus du tout respecter quand on passe dessus... » — 18.10,
  soir (D63, D64, D61 bis). La loupe façon Apple (D47, D55) et la hauteur qui dit le temps (D61)
  doivent tenir ensemble.
- **Le rail, son choix dans le lot 8** (page de la nuit : p01 bulle, p02 Dock, p03 règle, p04
  verre ; le jury indicatif mettait p01 devant et p02 au fond) : « Rial: P2 le grossissement suit le
  doigt. » — 19.10, matin. p02 (Dock sans état) devient la loupe de la base v4.4 ; finie une seule
  fois, en fidélité, sur les défauts relevés par le jury.
- **Les radars, son choix dans le lot 9** : « Radar: m4 h4 très bien, attention à pas surchargé en
  texte ni en légende. Pas besoin d'écrire la légende sur la version finale » — 19.10, matin. m4 (Ma
  bière : grille de dégustation, « pas senti » ≠ « pas goûté ») et h4 (la fiche face à ta demande)
  entrent dans la base v4.4, sans légende écrite : l'inconnu se dit par le libellé gris « ? », le
  secteur hachuré et la bulle au toucher.
- **Ses autres choix du 19.10, matin** : « Pour 136 Comparer : échelles, classements, vraies
  comparaisons (lot 10) Mettre de côté pour le moment » ; « Substitution, ça serait plus du u4 »
  (#137 : le jury mettait u3 devant) ; « Comparé : radar p2 mais avec ajoute d'intervalle de
  confiance » ; « Comparé: p06 » (#138 : Comparer du lot 6, p06 en barres, le radar de p02 avec un
  intervalle de confiance ; le jury mettait p05 et p09 devant) ; « Radar suggestions: p10, p5,
  p3-> mais radar beaucoup plus grand » (#138, Suggestions du lot 6).
- **Le Dock p02 à l'essai sur la page partagée (version 9)** : « L'échelle ne s'adapte toujours pas
  à l'endroit où on est ??? » — 19.10. Mesuré : 19–20 px par 5′ sous le doigt contre 8–13 au loin ;
  le grossissement doit se voir à l'œil (piste : un Dock à plateau ×3, registre).
- **Le Dock à plateau au téléphone (base v4.5, Nugget glissé de 60′ jusqu'au whirlpool, capture à
  l'appui)** : « L'échelle ne s'adapte pas ne de focus, homme pas là où je suis. L'échelle ébullition
  est très grande alors que celles où l'on est Whirlpool est toute petite » — 19.10 (D67 : le doigt
  passé dans un autre segment, ce segment devient la loupe).
- **La loupe suit le doigt, base v4.6 au téléphone (Nugget glissé à J+2, la tête du rail descendue
  sous la barre d'IBU, capture à l'appui)** : « Toujours un petit soucis... » — 19.10 (D68 : le rail ne
  se détache pas du haut).
- **Le rail, base v4.7 au téléphone, dans la page partagée (deux captures : Motueka glissé jusqu'à
  J+14 au bas de l'écran, puis la page défilée, Motueka à 85 °C)** : « On arrive pas à aller de
  l'extrême haut, à l'extrême bas » — 19.10 (D69 : d'un seul geste, de la durée d'ébullition à J+14 de
  la post-fermentation, dans l'écran).
- **Les carrés d'arômes, au long appui** (capture : les carrés de la carte Motueka entourés) : « On va
  refaire un batch de description de houblons, et notamment montrer à quoi correspond exactement ces
  valeurs facile lors du long appuie sur le houblons » — 19.10, soir (#140, lot 12). Puis, sur le lot
  12 : « Non c'est très mauvais. Tu as pas du tout bien compris le besoin, c'est entre la version
  actuelle qui est déjà vraiment plutôt bien et une de ces versions » (D70 : la carte actuelle intacte,
  un petit ajout au long appui ; lot 12b). Puis, sur le lot 12b : « Non... Un appuie long ouvre sa
  fiche. Comme avant, saufe que sa fiche est plus fourni avec les labels.. revoit et challenge de point
  avant de faire quoi que ce soit » ; et, sur l'analyse de la fiche actuelle (quatre problèmes) : « Non,
  il faut changer la carte et tout. Mais c'est déjà pas mal comme visuel de base. Mais il y a quelques
  problèmes dessus... Donc fait moi des mini maquettes de ça » — 19.10, soir (D71 ; lot 13, la carte et
  la fiche ensemble). Sur g1, Épicé 1/4 et Tropicaux 2/4 entourés : « 1/4, 2/4 mais même valeur ??? »
  (D72 : la place sur la roue et la case de la carte suivent le nombre de fiches). Puis, sur la planche,
  la table des IBU par moment de g1 barrée : « Inutile mais la v1 est la meilleure » — 19.10, soir (g1
  entre dans la base v4.9, sans la table des moments). Sur la fiche de Nugget de la v4.9, les étiquettes
  entourées : « Attention, trop de texte » (D73) ; sur celle de Citra cryo : « Ça c'est très bien » ; et,
  le bouton entouré : « Ajouter à 10' est un palace holder? Ça doit venir des prévisions du model, on est
  d'accord ? » — 19.10, soir.
- **Suggestions en Barres, lot 14 (planche)** : « s4-s5 semble pas mal, s5 semble vraiment le mieux
  dans ce cas, mais proablement très compliqué si plusieurs voies, et pour les cas complexe, pas sûr
  que ça aille » ; « l'autre limitation, c'est que on voit pas quels sont les autre ajouts, alors oui
  par nelson sauving agumente un peu le floral mais on voit pas ce qu'il ajoute en plus... c'est pas
  vraiment non plus idéal » ; « le seul procédé qui permet de fixer ça. Tu en as peut être un autre,
  ça serait le top, mais ça serait d'amener à ensuite l'onglet comparaison. on selectionne plusieurs
  houbon et ensuite on peut comparer » — 19.10, soir (D76 ; lot 15, s5 sur trois cas calculés et quatre
  façons de montrer les extras). Sur p4 du lot 15 : « vachement bien. manque peut être dry hop, bio
  transfo, levure. et la panier, à la place plutôt un + qui ajoute le houblon à la comparaison »
  (D78 ; p4b).
- **Le radar de Comparer, base v4.9 (page à jour)** : « très compliqué à voir les différence avec les
  cileur sur le spider graph » ; à la question « surtout dans Comparer ? » : « surtout genant là » —
  19.10, soir (D77 ; lot 16, cinq rendus du radar). Et, dans les tickets : « "normaliser"
  l'affichage, les forme. couleur aromonisé ça coorectement » (#142).
- **La baseline l8 (lot 18)** :
  - sur l8 : « Visuellement horrible, mais la manière dont sont disposés les choses j'aime
    beaucoup !! » ;
  - sur l8b : « C'est la meilleure version mais le glowing des icône de arôme c'est non, plutôt type
    Baseline 2 type fil » (D88) ; « Pas d'info sur les AA, j'en vrai valeur » (D87) ; « Tu peux même
    mettre un peu plus d'icone et autre, mais il faut un bouton légende un peu caché pour pas que ça
    gêne » (D89) ;
  - sur l5b : « Meilleures bar » ; « Les bar de ce type sont plus informative donc meilleur » ; puis,
    sur la page entière de l5b, cochée : « Il est très très bien celui-ci aussi » (l5b reste en lice
    à côté de la disposition l8 : variante l5d avec tous les retours) ;
  - sur l8e, captures entourées :
    - « Les icône sont pas parlant du tout » (la goutte, le souffle : l'usage en mot, D90) ;
    - « Ça c'est inutile » (la bande « ‹ visée | visée », D91) ;
    - sur la petite jauge d'objectif : « La barre là, c'est mieux mais il y avait mieux.... C'est pas
      exactement ce que j'ai demandé » (les pistes de l5b sous chaque objectif, D92) ;
    - sur la fiche ouverte par l'appui long : « Pourquoi la fiche est pareil ??? C'est pas du tout la
      bonne, ça suit pas la Baseline, ça suit rien du tout ??? » (D93) ;
    - sur la légende ouverte : « Quoi ouvre ça ??? » (la capture doit montrer le doigt sur le « ? »).
  - sur le lot 20 (outil de dry hop) : « C'est très difficile à comprendre. Lance un agent pour
    regarder ce qui peut aider à choisir. Lance plusieurs mini maquettes. On a établi la Baseline.. » ;
    « Trouve des vrais solution. On peut aussi simuler un 'faux' profil aromatique, pour mieux de rendre
    compte. Trouves des solutions pour mieux représentées. Mieux comprendre, mieux choisir. Quitte à
    tricher un peu sur certains points... » ; « Des vrai donné, mieux présenté, mais aussi des
    simulation, simulateur, des représentants distinctes. Lance plusieurs agent pour ces travaux » ;
    sur la chimie et le langage du brasseur : « Les deux se complément » ; « Je veux aussi des vrais
    valeur » (D94 ; lot 21, `fils21-choisir/`) ; sur la règle qui effaçait les plages énormes :
    « Si il y a des écart x100 justement il faut que ça se voit pas que ce soit effacé » (D94 L3
    corrigée) ; « Aussi trouve plus de comparatif entre dryhop et variété de houblons » (recherche J) ;
    « Fait plus de lot de mini maquettes avec un vrai ladder et des vrai exploration » (e1–e3, x1–x5) ;
    « Aussi explore la voie de l'ajout cumulé. 2 houblons en dry hopping. Et la bio Transfo et la
    levure » (K5 ; a1–a3) ; « Plus de mini maquettes que juste 11, fait en qqch comme 30 et prends
    les 5 meilleures version et améliore les » (w1–w5, y1–y5, jury) ; « J'ai dis de réutiliser la
    Baseline mais il faudrait évidemment d'enrichir et pas de limiter à ça !!! » (la baseline est un
    plancher) ; « Il y a pas de limitation, pas de plafond de verre, il faut être créatif, disrutif,
    trouver des solutions et des options. Un agent créatif à fond peut aider quelques mini maquettes »
    (z1–z5) ; « y compris s'écarter de la baseline si l'idée le vaut. Extact » ; « Tu peux peut être
    même en faire 35 » ; sur s1–s3 : « Simulation et simulateur mais c'est normalement dans
    quasiment chaque variante le simu » (D95) ; sur a1–a3 : « Fait en plus, c'est normalement à intégré dans les autres aussi » (D96 ; a4–a6) ; « Soit pas trop contraignante pour les contrôles sur les v0, c'est de
    l'exportation pour le moment » ; « Je t' autorisé à relancé des nouveaux lot du rien n'est
    vraiment concluant ou au un a pas poussé assez loin le concepte ou si le concept a du potentiel
    mais doit être amélioré » ; « J'ai l'impression que tu as peut être même trop limité certain
    agent » (contrôles indicatifs en v0, auteurs libérés, agent libre u*) ; « Créé aussi un agent
    "critique" qui pourrait être moi et donne des feedback pour relancer des lot, voir ce qui va pas.
    Critiquer constructive. SI rien de va, il le dit et on relance tout » (`fils21-choisir/CRITIQUE.md`).
  - Leçon : « les barres de l5b » voulait dire aussi ses pistes d'objectif, pas seulement ses barres
    de voie. Quand une demande désigne un élément d'une autre variante, reprendre tous ses éléments du
    même genre sur l'écran, ou demander lequel.
  — 19.10, soir.
- **Le lot 21, son retour (20.10, après la pause)**, mot pour mot :
  - « y1b est de mon point de vue semble meilleur. »
  - « Parcontre problème gloabal, pas de comparaison de houbon 1:1 donc ça nous aide pas à choisir si
    cascade, idaoh7, galaxy est mieux dans ntore cas. Manque aussi la partie chimie. »
  - « pas de radar grpah ? »
  - « regarde aussi ce que ça va coûter en compute, à quell point en backend une variante est plus
    problèmatique. on peut aussi se dire que on force la comparaison dry hopping biotransfo seulement
    si c'est trop lourd. »
  - « j'aime bien aussi la y3 même si la molette prends trop de place, mais la panel osu j'aime
    assez » ; « la version w2 est pas trop mal dans la manière de comparé » ; « la v1 donne une
    meilleur vu de comparaison sur des vrai valeur mais de manière un peu trop ostère ».
  - « La x3b est aussi interessant mais dur à lire. mais ça peut être interessant de l'utiliser jsute
    pour de la comparaison entre ma bière de base -> 1 dry hop, 2 dry hop: levure ».
  - « a2b est interessant mais peut être pas en main. voir ce que la levure change reset vraiment
    interessant ».
  - « pour l5f très bien mais manque des info, là on a l'impression que motueka est ultra fruité.
    nelson sauvin est un houbon ordinaire alors que c'est un un houbon incroyable ».
  - « épicé l'icone est toujours pas bon.. »
  - « d1, tout ouvert était aussi interessant mais trop bordélique. »
  - « aussi problème global, on a plusieur confusion entre timing, comparaison, houbons side by side,
    on aurais suggestions, comparer, substituer, dryhopper ect ect.. il faudrait voir ce que l'on peut
    faire. »
  - « met le registre à jour avec ces feedback pour être prêt à reprendre ».
  — 20.10.
- **La planche du picto « épicé » (r4, sept pictos)** : « Aucun me convient... ». Il a renvoyé la
  capture `planche-390.png` barrée d'une grande croix rouge sur les sept : cannelle, vanille,
  badiane, girofle, mortier et pilon, coriandre, saupoudreur. C'est le troisième refus de ce picto,
  après « plutôt vanille, canelle ? » (lot 15) puis les grains de poivre (lot 21). — 22.10.
- **Le lot 22, son retour** (page *Lot 22 houblons*, version 2), mot pour mot :
  - « r6a est le meilleur mais reprendre trop peu d'éléments que j'avais noté bon ou intéressant des
    autres variante, notamment la meilleure. »
  - Sur la planche « épicé » r4c (trois piments et le mot) : « Les icônes épices ??? Il y a que 3
    variante, qui sont toutes quasiment identique ??? » ; « Des vrais proposition surtout que un
    piment n'a rien à voir la dedans... ». C'est le quatrième refus de ce picto.
  — 22.10.
- **Le picto « épicé », ce qu'il veut** (22.10, nuit, pendant la planche r4d), mot pour mot : « Je veux un forme qui
  représente vraiment ce que c'est, genre canellle vanille, ou clou de girofle ect... Ce que ça représente
  vraiment épicier sur un houblon... ». Une épice réelle et reconnaissable, celle qu'on sent dans un houblon
  épicé ; pas un signe ni une sensation (D101 quater).
- **Le picto « épicé », son choix** (23.10, sur la planche des 48), mot pour mot : « Mon Picto préféré est
  cannelley clou croisé. Ça doit être changé dans la baseline ». C'est f1, cannelle et girofle croisés (série F de
  r4d), devenu le symbole `p-spice` de la planche standard.
- **r6n2, la suite** (23.10, après la page à neuf versions), mot pour mot : « Fais mois quelques variantes de r6n2,
  avec les meilleures idées retenu. Et ensuite on sera bon ». r6n2 : le premier écran de r6a, le reste à un toucher.
- **Comparer, r6a reste** (23.10, après les pages datées de r6n2, r6p1 à r6p4 et de Dryhopper), mot pour mot : « r6a
  reste le meilleur, tu peux ajouter ça, dans la vue interactive. Avec les quelques petites améliorations des autres
  versions ». Avant, sur la page cumulée : « Je les vois pas dans les artefacts.. ». Et pour la maquette : « fait une
  maquette fonctionne de bout en bout » ; « Continue ensuite avec le tout interactif comme si c'était sur la vrai app.
  Afin de préparer sa vrai implemtation ». Mission : `work/missions/2026-10-23-maquette-parcours/`.
- **Comparer aux étapes, avec une référence** (23.10, soir, sur la maquette publiée), mot pour mot : « Ah mais comparé
  est que le dryhopping ??? C'est pas ce que je voulais je voulais comparé au moins : les étapes 60' 10' dryhopping ect
  comme la maquette de base. Et aussi le houblon de base ou bière de base. Est-ce que cela est clair ? ». Comparer (r6a)
  ne comparait qu'un moment fixé (l'étiquette `après, 3 j`). À garder de r6a : sa forme ; à y mettre : les étapes côte à
  côte et la référence (houblon de base ou bière de base). D107.
  - Le pilote avait pris « la maquette de base » pour le Comparer de la base v4.10 (`base/consolide/comparer.html`). Sur sa
    capture barrée, mot pour mot : « Non pas cette version, une version du dryhopping, dans un des top. Montrait vraiment
    l'état du moment de l'ajout facile, je l'avais juste fait noté !! ». C'est **x3b** (lot 21, une des 5 meilleures des
    « mini maquettes dry hopping de base », « Ma cuve, jour après jour ») : la bière de base en pointillé, les familles qui
    montent au moment de chaque ajout, « J4 ~ dans la cuve ». Il l'avait notée le 20.10 : « ça peut être interessant de
    l'utiliser jsute pour de la comparaison entre ma bière de base -> 1 dry hop, 2 dry hop: levure ».
- **La visée sans effet** (23.10, soir, commentaire sur la maquette publiée, posé sur « Tropicaux prévu » de Ma bière),
  mot pour mot : « Aussi aucun impact sur je met plus, moins bannir ect.. ». Dans Ma bière, « bannir · − · + » ne
  dessine rien sur la barre : seul le mot « plus » change, et une puce « + tropicaux » apparaît en bas, hors de l'écran.
  Sa base v4.10 (`ecran-1/base/consolide/biere.html`) pose la visée sur la piste : un losange blanc à son niveau, relié
  au point de la bière par un trait pointillé ; « + » et « − » montent ou descendent d'un palier (faible, moyen, marqué),
  nommé entre les boutons, avec « × » pour retirer la visée ; une famille bannie a son nom barré. C'est la visée « en
  trait creux » qu'il avait dite « Parfait » (18.10). Suggérer lit bien la visée (cartes « Plus tropicaux »,
  « Sans agrumes »), mais bannir agrumes écarte 17 voies sur 18. D108.
- **Le bouton retour** (23.10, soir, commentaire sur la maquette publiée, posé sur « Fermer » d'un outil), mot pour mot :
  « Bouton retour souvent assez petit et pas très intuitif ». C'est le « ‹ » du `PageShell` de l'app : 28 px de zone,
  icône de 16 px, gris, sans mot, sur chaque outil (Suggérer, Comparer, Dryhopper…). La base v4.10 avait le même
  (28 px). Ses mots priment sur DESIGN.md (« 44 px n'est pas une obligation générale », décision du 12.09) pour ce
  bouton : portée étroite, le retour des outils ; l'app suivra à la porte B. D109.
- **Les petits traits de Suggérer** (23.10, soir, commentaire sur la maquette publiée, posé sur les pictos d'une voie),
  mot pour mot : « Un peu dur à comprendre ce système de petit bar ». Ce sont les traits de q2b, son choix : sous chaque
  picto, un trait par cran, un demi-trait pour un reste, des hachures pour un effet non établi, un point pour une
  famille qui ne bouge pas. Leur sens n'est dit que dans l'aide « ? » (« un trait par cran du style… »), loin de la ligne,
  et toucher un picto ne montre rien. À garder (q2b), mais à rendre lisible là où on les lit ; pas de texte sous chaque
  picto (pas de cockpit). D110.
- **Le geste de l'étape Houblons** (23.10, soir, commentaires sur la carte de Nugget, maquette publiée), mot pour mot :
  « Le slider est pas dans la version que je veux... » ; « L'appui prolonger fait pas l'effet escompté ». Le geste de
  sa base v4.10 (captures `base/captures/consolide-nugget-35-pendant.png`, `consolide-glisser-60-2-pendant.png`) : pendant
  le glisser, la carte se replie en une puce « Nugget » à côté de la bulle « 35′ », la frise s'ouvre autour du doigt
  avec des graduations lisibles (45′, 30′, 25′, petits traits), rien ne se chevauche. La maquette garde la carte entière,
  serre les graduations de 60′ à 5′ dans la frise, par-dessus les repères 0′, whirlpool et levure, et sélectionne le
  texte de la bulle. D111. L'appui long ouvre bien la fiche g1 dans Chrome (souris et doigt simulé), sur le nom, les
  carrés ou la carte ; mais rien ne se voit pendant l'appui (la base remplit le nom en 500 ms) et le texte de la carte
  reste sélectionnable (sur iPhone, l'appui long sélectionne et ouvre le menu du système). L'effet attendu n'est pas
  encore dit : question posée dans le fil. D112.
- **La légende** (23.10, soir, commentaire sur « inconnu : ébullition 45′ : le moteur si… », carte de Nugget), mot pour
  mot : « J'aime bien les petits icône et tout. Mais il manque à un endroit un bouton légende ». Les icônes restent. Le
  seul « ? » de l'étape est au-dessus des familles, en bas ; la carte de l'ajout (carrés, traits sous les carrés, ⟳,
  « résine 2/4 », « ? arôme » hachuré) n'en a pas près d'elle. D113.
- **Le retour, encore** (23.10, soir, sur la pastille « ‹ Retour » qu'une réponse automatique avait posée dans l'artefact
  publié, sans concepteur ni critique), mot pour mot : « Bouton retour toujours pas vraiment au point, UI pas terribles ».
  Deuxième refus du même élément (D109) : changer de genre de solution, et lui montrer des variantes (L13, L24). D109.
- **L'en-tête de l'étape** (23.10, soir, sur « hypothèse » de « 16D hypothèse »), mot pour mot : « Pourquoi ? Qu'est-ce
  que ce champs apporter ?? Il faudra remplacer tout ça par le vrai Stepper de la vrai app ». Le badge venait de la base
  v4.10 : « échelles hypothétiques à valider », une note de concepteur. Le vrai fil d'étapes de l'app :
  `WizardStepName` et `WizardStepRail` (`src/ui/WizardStepBar.tsx`), dans l'en-tête de `BrewWizard` (7 étapes, Houblons
  la 3ᵉ). D116.
- **Le panel OSU** (23.10, soir, sur « Panel OSU, Cascade » dans Comparer), mot pour mot : « Beaucoup trop mis en avant ».
  Le panel reste un acquis (« la panel osu j'aime assez », 20.10), mais pas au premier plan. D114.
- **La fiche** (23.10, soir, sur « · nommé en premier » dans la fiche de Cascade), mot pour mot : « Mettre le radargraph
  avant, cette vue est vraiment pas terribles. À revoir... ». Le radar passe avant la liste des familles ; la liste
  (familles, « nommé en premier », mots anglais « woody, resinous ») est à revoir, en variantes montrées. D115.
- **Suggestions, pas la bonne** (23.10, soir, sur l'onglet Suggestions), mot pour mot : « J'ai l'impression que cette vue
  suggestions et pas la bonne que j'ai vraiment choisir ?? ». Côte à côte avec sa base v4.10
  (`base/captures/consolide-b-390.png`) et q2b (`fils15-s5-complexe/captures/q2b-b-390.png`), la maquette s'en écarte :
  une question en titre au lieu des onglets dans l'en-tête, pas de bandeau IBU · OG · EBC, un « ? » et une ligne
  « fixé Stout 16D US-05 » en plus, les pictos d'objectif sans leur cercle, pas de ♡, « Comparer (n) » en pastille à
  droite au lieu de la barre pleine largeur, la liste sans son cadre à bord noir. Seuls l'usage en mot (D90), la bande
  « ‹ visée | visée › » retirée (D91) et les pistes l5b (D92) ont ses mots. CHOIX OK ne l'a pas vu : l'inventaire de
  q2b ne nommait pas ces éléments, et la supervision a publié sans captures côte à côte (L03). D117.
- **La croix** (23.10, soir, sur la pastille « ‹ Retour »), mot pour mot : « UI pas terribles, toujours pas au point » ; puis
  sa solution : « Juste une croix bien positionné, facile, dans le thème suffirait ». Le retour des outils devient une
  croix « × » : à sa place habituelle, facile à toucher, à l'encre du thème. D109.
- **Le même retour partout** (23.10, soir), mot pour mot : « Suivant où on est le bouton retour fait pas la même action.
  Je veux juste retour au "menu" pas principal ». Vérifié : Suggérer ouvert depuis l'étape revient à l'étape, ouvert
  depuis l'onglet Ma bière revient à l'onglet. Lecture retenue (étroite, réversible, dite dans le fil) : la croix de
  chaque outil (Ma bière, Suggestions, Comparer, Dryhopper, Substituer, Levure) ramène toujours à l'étape Houblons, le
  menu des outils, jamais à l'accueil de l'app ; une fiche se ferme sur l'écran qu'elle couvre. D118.
- **L'en-tête qui change** (23.10, soir, sur « Quel houblon ajouter à ma bière ? »), mot pour mot : « Header qui change
  ??? ». Ma bière porte ses onglets en tête (41 px) ; Suggestions et Comparer, une question en titre (33 px), les onglets
  dessous. Passer d'un onglet à l'autre change l'en-tête. D119.
- **Annuler** (23.10, soir, sur le pied de « Lequel à la place de Idaho 7 ? »), mot pour mot : « Pas de bouton cancer ».
  Substituer n'a que « Remplacer › » en pied. D120.
- **L'entrée de l'analyse** (23.10, soir, sur le « › » noir à côté de « Résineux trop marqué », étape Houblons), mot pour
  mot : « Seul bouton qui ouvre vraiment l'analyse. Peut, être amélioré ». Vérifié : le « › » (44 × 36 px, sans mot) est
  la seule entrée ; l'alerte, les lignes des familles et le bandeau IBU ne font rien au toucher. La base v4.10 avait le
  même « › » : plancher à enrichir (L07), en 2 ou 3 variantes montrées (L24). D121.
- **Substituer, à faire** (23.10, soir), mot pour mot : « Ajouter, vue -> substituer à faire dans le git ». Ticket #145.
- **Dryhopper, à revoir** (23.10, soir, sur la figure « Ta stout avec Idaho 7, au moment choisi »), mot pour mot :
  « Ajouter que cette vue là est à revoir, j'aime bien mais il y a des améliorations à faire ». L'écran reste « ouvert »
  au registre (a1 provisoire). Ticket #146.
- **Un vrai bon point de départ** (23.10, soir, après ses 17 fils de commentaires), mot pour mot : « La nouvelle maquette
  (artefacts) est un vrai bon point de départ. Bien la rendre disponible pour les prochaines sessions. Bien consigné son
  état aussi ». Copie figée : `outils/pages/2026-10-23-maquette/` ; état : `cerveau/produit/maquette-jouable.md`.
- **« ~ simulé »** (24.10, matin, commentaire sur la maquette 24.10, posé sur la pastille « ~ simulé » du radar de Comparer),
  mot pour mot : « ????? ». La pastille vient de r6a (`r6a-simule`) : elle dit que le radar et les « ~ » sont calculés par
  le moteur (fiches, dose, moment, levure), pas mesurés. Son sens n'est que dans un `title`, invisible au doigt ; la
  toucher ne montre rien (vérifié). Elle reste (r6a), mais doit se comprendre là où on la lit, sans un mot de plus au
  repos, comme les traits (D110). D122.
- **Le rail, côté froid** (24.10, matin, capture de la maquette 24.10 sur son téléphone : Nugget glissé vers la
  post-fermentation), mot pour mot : « Le rail c'est toujours n'importe quoi. Il y a un vrai historique dessus, pourquoi tu
  es revenu sur un choix que je n'ai pas fait ? ». Le rail de l'étape avait pris, côté froid, l'échelle et les mots de
  Dryhopper (`Frise.tsx` : « dry hop en jours, comme Dryhopper » ; jours 1, 2, 3, 5, 7 ; « dry hop » ; « ? IBU »), un écran
  dont le choix est ouvert, au lieu du rail de sa base v4.10 (BRIEF-RAIL, `v4-geste-fermentation-*`,
  `consolide-nugget-p14-620-pendant.png`) : carte repliée en puce pendant le geste, J+0 à J+14 réguliers, « à froid »,
  « aucun IBU », J+n et son réglage. Pendant le geste, la carte restait entière et les jours débordaient sur les ajouts.
  Les contrôles du rail ne jouaient que l'ébullition. D123.
- **Des fonctions et des choix perdus** (24.10, 8 h, sur la maquette 24.10), mot pour mot : « Ça a bien avancé mais le
  rail par exemple à perdu en fonctionnalités et certaines de mes choix ont été perdue ». Puis : « Aide toi de sous
  agent. Je peux aussi lancé une autre session si il faut ». Les inventaires de ses maquettes ne relèvent que l'état au
  repos ; les gestes et les états (loupe, segments, whirlpool, levure, J+n, ébullition 45′ à 200′, plusieurs houblons)
  n'y sont pas, et CHOIX OK, RAIL OK restent verts. D124.
- **Ses commentaires** (24.10, 8 h 30), mot pour mot : « J'avais mis des commentaires, j'ai la nette impression que ils
  ont pas tous été pris en compte aussi ». Puis : « Il faudra aussi refaire des mini maquettes fils de fer sur les vue
  dont je suis pas convaincu ». Chaque fil de ses artefacts est relevé, avec ce qu'il est devenu (SPEC, défaut,
  contrôle, maquette 24.10) ; les vues dont il n'est pas convaincu passent en fils de fer, en mini maquettes, dans un
  artefact neuf (règle n° 1). D125.
- **Des mini maquettes pour choisir** (24.10, matin, après « ton choix pour D121 (A, B ou C) »), mot pour mot : « Il me
  faut des mini maquettes avec un nouvel artefacts comme pour les mini maquettes côté à côté.... Pour les autres gros
  changement aussi au non je peux pas choisir. Met ca dans tes règles aussi ». Tout choix qu'on lui demande se montre en
  mini maquettes, dans un artefact neuf ; jamais une question en mots seuls (CLAUDE.md, règle n° 1).
- **Trop peu de mini maquettes, pas de côte à côte** (24.10, soir, sur « Choix de vues · 24.10 »), mot pour mot : « Mais
  il y a très peu de mini maquettes ??? J'ai pratiquement aucun choix ?? Et j'ai pas du coté à cote ». La page cumulait
  sept sujets : chaque choix tenait dans une bande qui défile (une variante visible à la fois), les deux panels de 48 en
  bas, et les jeux courts n'avaient que trois variantes. Une page par choix : toutes ses mini maquettes à la fois, côte à
  côte avec sa référence. Puis, mot pour mot : « Pas besoin d'autant, représente moi aussi les mini maquettes déjà
  faites pour ces vues. Je dirais 11 par vue ». Onze par vue, celles déjà faites comprises. D126.
- **u4, Substituer** (24.10, soir, sur « u4 · ton choix »), mot pour mot : « bien mais trop centré ibu, il faudrait aussi pas
  que à 60' mais aussi en dry hop. SI non plutôt bien. Attention à toujours utilisé la baseline. Aussi ajouter à comparé doit
  être facile. Et le remplacement aussi. Ainsi que ferme la vue ». u4 reste son choix ; les remplaçants se lisent aussi au
  dry hop (pas seulement à 60′, où le score pèse l'amertume), sur la baseline, et ajouter à Comparer, remplacer et fermer se
  font d'un toucher. D127. Puis, sur la capture entière de u4, une coche rouge au tableau « Arômes 16D » (familles au style
  et hors style, une barre par houblon, pointillé = non décrit, « aucune des trois fiches ne les décrit, ce n'est pas
  zéro ») : « Ça c'est vraiment bien » (acquis).
- **Comparer n'est plus r6a** (24.10, soir, commentaire sur « Choix de vues · 24.10 », à la référence de la pastille, qui
  montrait le premier écran de la Comparer du jour sous le nom « r6a »), mot pour mot : « C'est pas du tout cette vue là
  réf ??? ». Sa r6a montre au premier écran le radar, les colonnes et ses rangées de familles (une barre par houblon, « ~
  dans » / « ~ hors ») ; la maquette avait mis les rangées 60′ / 10′ / dry hop de x3b à leur place et repoussé les familles
  sous le premier écran, contre D107 (« r6a garde la forme »). Les étapes deviennent un sélecteur sur les rangées. D128.
- **La disposition des artefacts** (24.10, soir, une grande coche sur l'image globale de ses mini maquettes choisies et
  dites « bien »), mot pour mot : « J'aime beaucoup cette disposition. Utilise là pour les artefacts comme ça je peux voir
  rapidement plusieurs versions d'un coup ». Une rangée par écran, sa référence puis les mini maquettes en vignettes
  serrées, une pastille de verdict et ses mots dessous (PUBLIER.md ; modèle `choix/global/mini-maquettes-choisies-2026-10-24.png`).
- **Sur « Planches · 24.10 »** (24.10, soir), mot pour mot : sur u4 : « u4 · ton choix, est la meilleure mais il manque juste
  un ou deux changements type, moins focus sur l'ibu, substitution en fonction de l'étape (60' ou dry hopp) » (fait par r9,
  D127) ; sur p4b2 (Dryhopper, « Le brassin en courbes ») : « Ça j'aime beaucoup mais c'est encore assez peu lisible » ;
  sur flb5 (la fiche, « La preuve par contraste ») : « Ça j'aime beaucoup même si encore un peu fouillis et pas 100%
  clean ». p4b2 et flb5 : trois versions nettoyées chacune, par leurs auteurs, montrées dans leur rangée. Sur gr5 (les traits
  de Suggérer, le cran au doigt et les crans comptés) : « Ça c'est top à mettre dans la vraie version » (r11, dans Suggérer).
  Sur u4 enrichi : « U4 enrichir semble vraiment mieux même si pas du 100% regarde pour faire quelques petites variante,
  amélioration » (cinq variantes d'un seul point chacune, u4e1 à u4e5). Sur flb5, dans la planche de la fiche : « Le header
  est inutile, header type 10 » (l'en-tête de flz4, « Situer un mot », sur les versions de flb5). Puis : « J'aime beaucoup le
  9 car ont voit que c'est pas que du 16d, le houblon a vraiment beaucoup plus de subtilité. À montré aussi, notamment pour
  la comparaison » (acquis : ce que le houblon dit en plus de ses familles, dans la fiche et dans Comparer, r10).
- **La continuité de l'app** (24.10, soir), mot pour mot : « Fait attention aux header, footer, sur la continuité de l'app
  ect... ». D'un écran à l'autre, le même en-tête (croix, titre, onglets) et le même pied (Annuler à gauche, l'action à
  droite), à la même place et à la même taille (D109, D118, D119, D120). D129.
- **Dryhopper choisi : p4b2f** (24.10, soir, sur p4b2f, « L'aire du floral », retouche de p4b2, dans « Planches · 24.10 »), mot
  pour mot : « Partir sur cette version ». Son choix ferme l'écran ouvert depuis le 23.10 (a1 provisoire) ; registre
  `choix/ecrans.json` ; reprise r13-dryhopper. D43.
- **La liste de la fiche choisie : flb5b ; les types hors 16D partout** (24.10, soir, sur flb5b, « La matrice nettoyée »), mot
  pour mot : « Partie sur celle ci, elle met parcontre en avant qqch qu'il faut ajouter à plusieurs endroits. Les type spéciaux
  des houblons hors 16d ! C'est très important surtout dans la comparaison !!!! ». Chaque houblon montré dit ses mots hors des
  familles de la 16D (« Lui seul : vin blanc, raisin… »), tirés de ses fiches : dans la fiche (flb5b), au premier écran de
  Comparer, dans Substituer. D130. Sur u4e5 (au dry hop, « Arômes 16D » au premier écran) : « Très bien+ ajouter des La matrice
  nettoyée flb5b · de flb5 sur les arômes hors 16d + les huiles. » (Substituer prend u4e5, la matrice de flb5b et celle des huiles.)
  Sur sa q2b, dans la rangée du levier levure : « Celle ci aussi est toujours meilleures. Mais aussi ajouter les spec en plus
  type comme matrice nettoyée flb5b · de flb5 » (le groupe « Changer de levure » de q2b revient tel quel, son choix l'emporte
  sur D35 ; les houblons et les levures de Suggérer disent ce qui leur est propre). D44.
- **La fiche exhaustive, le pied de flu2b** (24.10, soir, sur flb5b), mot pour mot : « La matrice nettoyée flb5b · de flb5 est
  très bien mais le footer doit être aussi avec tout ces informations comme 4 · Les cartes de famille · flu2b. Attention car la
  carte du houblons doit bien contenir de façon exhaustive TOUTES ses informations. » La fiche porte tout ce que le dépôt sait du
  houblon, au premier plan ou à un toucher ; le pied de flu2b, entier. D132. Puis, sur une capture de flu2b (Nugget) où il
  entoure ♡ ⊘ « Comparer » et « Styles › Huiles › Sources › Substituts › », mot pour mot : « Le footer est top ».
- **La recherche avancée, plus tard** (24.10, soir), mot pour mot : « Faire en Todo la recherche avancée, mettre dans le git.
  Pas si utile pour le moment. Ajoute les mini maquettes ». Issue #151 en P3, `status:deferred`, les douze mini maquettes
  gardées dans le dépôt (commit 7f9cac8c) et montrées dans l'issue. D60.
- **Les légendes, plus loin** (24.10, soir, sur « la légende ouverte » de la planche des légendes), mot pour mot : « Ça à
  l'air top, poussé même le concept un peu plus loing avec taux d'intensité et + d'info sur les caractéristiques spéciales ».
  Passe 2 de leg1 à leg4 (il ne dit pas laquelle) : un taux d'intensité par famille tiré des fiches, et les mots hors des 12,
  les mots précis et ce que les fiches disent en propre.
  Puis, sur la même vue : « Fait moi 5 version un peu modifié améliorer de cette version » : cinq versions de leg3 (en tête du
  critique ; la vue ne dit pas laquelle il regardait).
  Sur leg3-v2e : « J'aime beaucoup le petit barre comme ça mais il faudrait légende comme une autre » : la barre de v2e avec
  la légende de v2a (v2f) et celle de v2c (v2g).
  Puis son choix, mot pour mot : « Tu peux intégrer légende type leg3-v2a · Les barres n/N mais barre leg3-v2e · Les
  spéciaux repliés » : leg3-v2f, intégrée dans la maquette (cartes du rail, ajouts proposés). D61.
  Et sur v2a : « Légende vraiment bien, avec icône sans full text, bonne infos ciblé mais barre comme leg3-v2e » : des icônes
  sans texte complet, la petite barre de v2e.
  Lecture corrigée (24.10, nuit) : « leg3-v2a · Les barres n/N » et « leg3-v2e · Les spéciaux repliés » sont les noms
  des deux vignettes de la planche. Son choix est v2a telle quelle, avec seulement la barre de v2e ; v2f repliait les
  lignes de v2a dans la pastille de v2e. Sur sa capture de la carte ouverte de Nugget dans v2a
  (`fils24-legendes/captures/brasseur-24-10-nuit-v2a.jpg`), mot pour mot : « Je veux qqch comme ça moi ???? » (D140). Puis, la rangée des barres à quatre segments entourée (`captures/brasseur-24-10-nuit-barres.jpg`) : « Modifié juste ça par les vrai barre pas de stepper ».
- **L'intégration dans l'app** (24.10, nuit), mot pour mot : « En attendant les variations dryhopping et mon choix dessu. Tu
  peux commencer la mise en place pour l'intégration dans la vrai application. Faire une liste des tâche, mettre à jour git et
  suivre tout ça. Jusqu'à l'intégration. La fluidité, l'optimisation de code est très importante vu qu'il y aura beaucoup de
  données !! » (D64, #159).
- **Le thème de l'app** (25.10, sur la capture de l'étape Houblons v4 dans l'app, `work/missions/2026-10-23-theme-performance/voies/t1-theme/brasseur-theme-noir.jpg`), mot pour mot : « Pourquoi c'est en thème noir, tu peux ajouter dans le header le choix de thèmes à côté de l'import ». Son choix du 23.10 (D106, #144) : le clair de ses maquettes par défaut, « cave » au choix ; jamais fait dans l'app.
- **Comparer, la planche du 25.10** (8tFBhx1DYEybS8tvNw1B8V), mot pour mot : sur la vue agrandie d'une version, état « repos » : « La meilleure mais ces pastilles sont pas super clair » (la version n'est pas dite : demandée dans le fil) ; sur « ta capture » (sa base de reprise, la liste « ses mots » avec ◇) : « Ajouter ça aussi avec le icône et vraiment hors 16d » ; sur la même vue « repos » : « Le radargraph doit être normalisé aussi sur le 60' 10' ect en mode style. Car 2 houblons différents à 60' doivent être bien maqué sur les différences, pas que pour le dryhopping » ; et : « Mettre plus le radargraph en avant ». Puis, sur la planche : « écart chiffré (rpz4), sélecteur segmenté est la seule maquettes qui répond vraiment au vrai problématique... C'est pas normal... Il y a quelques mini défaut tout de même » : sa version est cmb2 ; le critique en avait accepté huit (étalonnage, L27). Sur la passe 2 (1geWG3kjv1KoXbbC6RMbzx, vue « repos », version non dite) : « La meilleure mais on comprend toujours pas ce que c'est ces pastilles » ; « Spidergraph, radar graph bonne taille mais à revoir ». Deuxième refus des pastilles : changer de genre de solution (L13). Puis, même vue : « Pas centré » ; « Inutile ce texte » ; sur « ta capture » : « Je vois pas cet type de vue » ; sur la vue « à 60′ » : « Les barre semble pas être normalisé au temps et au style » ; « Spider graph radar graph toujours assez peu lisible » ; sur cmb2 en référence : « Slider de timing beaucoup mieux ici ». Sur la passe 3 (7Sn51TfEG3sszskMVV4r1K, vue à 60′) : « Pas normalisé au timing. Pareil pour les barre » (deuxième fois : D142). Puis, vue « repos » : « Toujours pas clair » (troisième refus des pastilles ou du radar : l'élément visé reste à montrer sur une capture). Puis, sur cmb3b (« Deux contours »), le radar surligné en orange de traits courbes (`fils25-comparer/captures/brasseur-radar-courbes.jpg`) : « Les Spider graph radargraph doivent être plus comme ça. Fait juste une passe là dessus de mini maquettes ». Puis, sur rpz2 de r6a++ (« L'étalon Saaz », `fils25-comparer/captures/brasseur-rpz2-huiles-radar.jpg`) : « Ça c'est vraiment bien aussi avec la vue facile pour les huiles, le radar ». Puis, juste après : « Mais l'affichage des pic du radar sont toujours pas bon » (les contours en étoile, tirés jusqu'au centre par un zéro et en aiguille vers le bord ; son dessin orange de cmb3b les remplace par des courbes). Puis sur `cmb4b-nelson` (lobes polaires ; sa capture `fils25-comparer/captures/brasseur-cmb4b-nimporte-quoi.jpg`, un Λ rouge dessiné à droite du radar) : « Non mais c'est n'importe quoi ça.... Fait moi juste plein de mini maquettes, genre 20 sur le radargraph uniquement focus dessus. Prends l'exemple de base. » ; « Pas besoin d'une grosse revue, gros contrôle » ; « En partant de ce type de base » (sa capture de cmb3b, `brasseur-base-type-cmb3b.jpg`) ; « Allégé les contrôle, Review, feedback ». Lot 26 : `ecran-1/fils26-radar/BRIEF.md`. Sur la page « Radar, vingt essais », avec deux captures du radar de Beer Maverick (Saaz, Citra, Idaho 7 ; `fils25-comparer/captures/brasseur-ref-beermaverick-1.jpg` et `-2.jpg`) : « Regarde les vrais radar graph comments c'est.... » ; « C'est n'importe quoi cette série ». Sur la page « Radar Beer Maverick » (rdf1 à rdf5) : « C'est beaucoup mieux mais ça met pas assez en valeur les données manquantes. Reprend ça comme base et regarde toutes mes critiques sur ce radargraph et fait des versions pour résoudre ça » (série rdg, `fils26-radar/BRIEF-rdg.md`). Sur la page « Radar, l'inconnu » : « Secteurs hachurés rdg1 et Les inconnus regroupés rdg5 j'aime beaucoup. Fait moi une implantation des ces deux versions sur une vrai vue de comparer, avec les données up to date, icône et tout comme c'etait avant. Juste le radar graph lui même changé. Aussi peut-être les couleurs et contraste mieux dessiné, mis en avant car on peut confondre un peu. » (cmc1 et cmc2 sur cmb3b). Puis, sur cmc2 (sa capture `fils25-comparer/captures/brasseur-cmc2-traits.jpg`, le côté droit du radar entouré en rouge, entre floral, terreux et agrumes, où les points de Cascade et de Galaxy restent isolés) : « C'est la meilleure mais c'est pas relié par des traits trié. Pourquoi ? À changé ». Puis, avec sa capture de rpz2 (la vue des huiles « De Saaz à Galaxy » sous le radar, `fils25-comparer/captures/brasseur-huiles-plus-bas.jpg`) : « Il y a pas les huiles comme ça, à mettre plus bas ». Puis, avec sa capture de la composition des huiles de Beer Maverick (myrcène, humulène, autres, caryophyllène ; trois houblons en barres superposées ; `fils25-comparer/captures/brasseur-ref-beermaverick-huiles.jpg`) : « Aussi, pour comparé les chimies. Les mettre lune au dessus de l'autre pour bien voir les différences ». Puis, sur la page entière de cmc2c (`fils25-comparer/captures/brasseur-cmc2c-placer.png` : les huiles entourées, une flèche jusque sous « ses mots », un trait jusqu'à « Valeurs » dans le dock) : « Non la première partie doit être en dessous. La seconde dans l'autre vue... » (l'huile totale sous « ses mots », la composition dans la feuille Valeurs, « Vraies valeurs et chimie »). Puis, sur cmc2b (reliée en trait plein) : « Il y a pas les traits haché comme demandé » : son « traits trié » voulait dire « traits tiretés », des tiretés là où le contour enjambe un inconnu. Puis, sur cmc2c (le centre droit du radar entouré, entre floral, herbacé, terreux et agrumes, où les trois houblons se touchent ; `fils25-comparer/captures/brasseur-cmc2c-presque-identiques.png`) : « Sur les points où ils sont quasiment identiques, on voit pas les différences comme demandé » ; « Aussi encore pas mal de légende et texte inutile, qui n'apporte rien ». Puis, exigence transversale (L05) : « Ensuite utiliser ce radar graph comme Baseline et l'utiliser partout dans les vue où il y en a » ; et la règle de normalisation, transversale : « Attention à la normalisation, elle est en terme de style et de timing toujours de style mais dynamique en terme de timing. SI choisi absolu, plus de normalisation, pour le radar et pour les barre et le reste !! » (D68) (Ma bière, Suggérer, la fiche, Substituer, Dryhopper, Comparer ; et Ma bière de l'app, `src/ui/hopIndex/maBiere/RadarBiere`). Sur cmc2c, la ligne des boutons ⇄ et × soulignée sous les têtes (`fils25-comparer/captures/brasseur-bouton-changer.png`), en dictée : « Bontou de changement un poulet plus large », puis « Poil* » (lu : « Bouton de changement un poil plus large »). Sur la barre des moments et le tableau des étapes entourés (`fils25-comparer/captures/brasseur-etapes-explication.png`) : « Ajouter un ? Explicatif pour ces données. Utiliser les pastilles comme c'etait de base » (la pastille noire de l'étape et les petites barres de `captures/base-jouable.png`). Puis, sur cmc2g (« Chaque axe à son échelle »), son choix : « C'est quasiment parfait . Mais plusieurs petit problème, il y a pas de transition entre les type de données, il y a un ? Qui prend toute la place le + toujours pas centré. Trop de blanc inutil, d'espace pour rien » (`fils25-comparer/captures/brasseur-cmc2g-retouches.jpg`). Puis, sur cmc2h (`brasseur-cmc2h-plus.jpg`, `brasseur-cmc2h-vide.jpg`) : « Bouton+ toujours pas bon ! La transition est toujours très très mauvaise. Et encore beaucoup de vide pour rien, regarde entre ses mots et les barre plus haut. Ça ferme déjà... C'est vraiment pas bon, comment ça peut passer ça ??? » ; « Et le + ???? » ; « Non mais tu te fous de ma gueule ? Le + doit juste être au centre du rond du bouton ??? » (le signe + dans son cercle, pas la place du bouton). Puis, sur cmc2i (la fin des familles et le début de « Ses mots » entourés, `brasseur-cmc2i-transition.jpg`) : « Transition est toujours horrible ??? » (le cadre rouge du retenu se referme et se rouvre, coupé par le filet noir). Puis, sur la page « la transition » : « Parfait pour Une bande teintée cmc2k » ; « Parcontre: dans ces mots Le +2 de idao7 ça va pas du tout, il doit tout y avoir avec en ordre décroissant du plus fort au plus faible. » ; « Tu peux implémenter ça directement dans la vrai app » ; « SI Des étape bloque vraiment sur la fluidité. Tu peux skip trouvé une solution et compromis et me propose ça. Dans le pire des cas » (vaut pour toute l'intégration : une étape qui bloque sur la fluidité devient un compromis mesuré qu'on lui propose) ; « Utilise bien les bon agent en fonction de la tâche, pas tout le temps Opus, mais bien hiku ou si vraiment sonnet » (L18) ; « Une fois que ce sera bon, il faudra importé TOUTES les données de TOUS les houblons. » (#180) ; « Faudra aussi voir pour rien tuné l'algo de suggestions et celui de substitution » (dictée), corrigé aussitôt : « Fine tuné* » (affiner les réglages des deux algorithmes) ; « SI c'est trop complexe, j'autorise de faire quelque teste d'appel IA pour l'ajouter à Lago si ça augmente la qualité, sans être trop lent et réduit la complexité. » (lu « à l'algo » ; #181) ; « Il faudra aussi pluggé tout ça au compagnon brasseur » (#182) ; « Tu peux deployé la vrai app pour que je puisse un peu jouer avec cette implemtation, ensuite continue avec la suite » (D71) ; « Tu peux faire une pr aussi avec cette version. N'attende jamais sur mon feedback pour continuer dans tes tâches » (PR #183). Puis, en jouant avec l'app déployée (captures `voies/t12c-app-reel/captures/` de la mission intégration) : « Pas grand chose de fonctionnement pour cette v0, les ibu et tout se mettent pas à jour. » ; « Aussi le header, bouger ces info sur le haut. » (« Brouillon repris sur cet appareil » barré, « Abandonner » à monter dans l'en-tête) ; « Et mettre le header et info en haut comme pour les hautes seul houblons a une variation.... Changé ça » ; « Tout cette partie là » (tout le haut de l'étape Houblons entouré : en-tête, onglets, brouillon, bandeau IBU · OG · EBC). Puis, le 26.10 au matin, sur la ligne « Autres · β-pinène, linalol, géraniol » de la composition des huiles (feuille Valeurs) : « Pourquoi tu as regrouper autre ? Avec plusieurs huiles ?? » ; aux deux voies proposées (nos données : linalol et géraniol en lignes propres ; nouvelles sources : toutes les huiles séparées) : « Oui ne regroupe jamais plusieurs huiles. Sauf si c'est utile et que elles sont déjà séparé à un endroit. Donc je veux les deux » (D154). Et sur la collecte : « Je donne mon accord pour les deux. Il faut récupérer un maximum de données. Toutes données sera bonne à prendre. Il faudra trié ensuite. Pour le moment récupère TOUT » (fiches fournisseurs et essai d'IA sur les substituts, #180, #181). Sur le quota : « Oublie la règle 80% elle est fausse, tu peux la supprimer ». Sur l'IA dans Substituer (D77) : « SI l'algo est déjà bien et très fiable et donne les bon résultat, pas forcé d'utiliser l'ai. C'était plus pour simplifier le processus, et l'améliorer facilement ». Sur la page « Listes de remplaçants 26.10 » : « Mais je comprends pas, on a déjà une vue pour substituer, et c'est pas du tout celles ci ??? » ; « Comment cette info a été perdue ?? » (D155 : son écran u4 masqué par le script de capture). Sur la page refaite (m3, listes A à D dans son écran), à « ton choix sur la page des listes reste ouvert » : « Oui c'est très bien comme c'est là » (lu par le pilote : l'ordre actuel A lui convient, rien n'est changé au moteur ; lecture étroite, à confirmer). Puis, corrigeant cette lecture : « D c + IA semble quand même plus probant, non ? À quelle point sont les écart avec ou sans ? ». Puis : « non D, C + IA mais je pense que le moteur doit être revue » (D80) ; sur les jeux de poids par moment de la revue : « Pas que 10' mais surtout 60' ». Sur Dryhopper de Cascade (21C, dry hop après, 3 j), une croix rouge sur l'espace vide sous la barre IBU côté ébullition : « Amertume, hop creep ? Résineux ? » (voies x1 puis m5). Sur la page « Dryhopper à froid » (m5, A et six variantes) : « La meilleure D · trois mini graphes » (D seul, sans la greffe D + F ; D89). Puis, sur la capture côte à côte du port, la bulle « ● 3 j » entourée sur le bouton « 7 j » : « Pas super la superposition ici, à corriger » (D164). Sur la page « Suggérer à 60′ comme au dry hop » (m6) : « M1 + M2 · avec l'IA semble le mieux mais pallier 60' toujours pas très clair et pas de vrai dry hopping » (D165, D166). Puis, sur les trois lectures proposées pour D165 : « les rangées, qui donnent l'α et les grammes, mais pas ce que chacune apporte » — « Exactement ». Sur Substituer, rangée β (Lotus 5–6 et ses deux traits de sources) : « Bien montré les différents source, comme ici pour lotus, c'est déjà bien fait normalement mais pas oublier. Après si plusieurs sources disent la même chose pas besoin de toutes les montrer » (exigence transversale : un trait par plage distincte, voie s1). Puis : « Est-ce que l'algo de comparaison utilise bien les bon principe ? https://beermaverick.com/your-hop-substitutions-are-wrong/ ».
- **Comparer repart de la maquette jouable** (25.10, sur la planche « Comparer r6a++ », bâtie sur la mini maquette r6a), mot pour mot :
  « Mais elle a rien que j'ai demandé. Je veux partir de la version de base, celle sur la maquette jouable et il faut l'améliorer avec mes commentaires. Notamment le fait que les style hors 16d soit bien montré. Mais surtout pouvoir choisir quand comparé. 60' 10' dryhopping... L'ajout des huiles aussi est bien. Mais ça couvre pas tout. Il y a aussi un peu trop de text inutile... Refait une série avec ça et mes commentaires sur toutes les maquettes comparé et mes commentaires sur la maquette de base sur cette vue » (D141). Puis, sur sa capture de Comparer (2) dans la maquette publiée (Motueka face à Nelson Sauvin, `fils25-comparer/captures/brasseur-base-reprise.jpg`) : « C'est celle là la base de reprise ».
- **Ses retours sur y1b et w2 visaient Comparer** (24.10, nuit), mot pour mot, après la planche « Dryhopper, tes retours » :
  « On c'est pas du tout compris. Je parlais de la vue comparé. C'est uniquement ces vues là où j'ai mis des commentaires
  sur les mini maquettes ??? » ; puis « Les commentaires pour le dryhopping était pour la partie compare ». La frise de y1b
  et les trois plans de w2 vont à Comparer, sur r6a (lot r6a++, D63) ; la planche Dryhopper les avait greffés au mauvais écran.
- **Dryhopper, ses retours** (24.10, soir, sur la galerie de toutes ses mini maquettes), mot pour mot : sur la frise de y1b
  (« Le brassin au doigt », lot 21) : « Une frise de ce type est vraiment intéressant aussi, un peu à retravailler » ; sur w2
  (« Trois plans », lot 21) : « Ça c'est vraiment très intéressant ». Puis : « Faire des mini maquettes du dryhopping avec mes
  feedback ». Lot « Dryhopper, avec ses retours » : p4b2f en base, la frise de y1b, les trois plans de w2 (D59).
  Puis, mot pour mot : « Pour le dryhopping, la meilleure version est celle de l'app jouable mais il lui faut quelques
  améliorations » : la base est l'écran Dryhopper de la maquette jouable (sa p4b2f rendue sur le moteur), retouché.
- **Commentaires sur la maquette publiée** (24.10, soir), mot pour mot :
  - en-tête de l'étape (« Houblons 3/7 ») : « Text header inutile » ;
  - le × d'une carte du rail (Falconer's Flight) : « C'est quoi ça ? Ça créé un slider horizontal ??? À enlever » ;
  - le moment proposé d'un ajout : « Ajout à 10' mais pas toujours idéal, pour la vrai app. Utiliser une meilleure prédictions » ;
  - Suggérer, une ligne « même effet sur tes objectifs » : « Intégré les infos icône subtil des gros changement hors 16d.
    Exemple neslon sauvin on voit pas que c'est Sauvignon blanc » ; sur « hors 16D : vin blanc, groseille à maque… » : « Ah si là
    mais ajoute icone » ;
  - la légende des cartes du rail (« Bande : les 12 familles… ») : « Bien mais mettre la légende juste en dessous des pastilles.
    Fait moi des mini maquettes de ça dans un artefacts » ; « Plus utilisé les icône... » ; sur la légende « Ajouts proposés » :
    « Pareil ici, mini maquettes de légende » ; sur Motueka dans « Ajouter un houblon » : « Plus utilisé les icône hors 16d » ;
  - Comparer, « Ses mots » (« mojito, citron vert, ci… ») : « Vue à revoir mais ce texte là est inutile ».
  D58.
- **Comparer : retirer, remplacer, chercher** (24.10, soir, commentaire sur « Ajouter un houblon à la comparaison »), mot pour
  mot : « Problème principal, pas de possibilité d'enlever, remplacer un houblon choisi, ni en recherche un ». D137. Sur le radar
  r2 de Comparer : « À revoir, on va en parler » (à discuter, rien changé).
- **La maquette presque finie** (24.10, soir), mot pour mot : « Vraiment des gros progrès, problème principal, c'est pas ultra
  réactif, ça lag un peu certaines actions ont du délais... Points à corriger par après. » ; « Sauver cette maquette on est
  quasiment à du 100% » ; « Autre problème, un choix sur un endroit, semble pas toujours être reporté partout. ». La réactivité
  et la cohérence des choix entre écrans : les deux points à corriger ensuite (D138, D139) ; la maquette du soir figée comme
  référence.
- **Ensuite** (24.10, soir), mot pour mot : « 2 vue, changements à faire. Rencontre moi toutes les mini maquettes du
  dryhopping. Fait moi un artefacts avec toutes le création depuis de début de toutes les sessions. » ; « Ensuite fait un
  artefacts de mini maquettes pour de la recherche avancée de houblons. ».
- **La fiche, deux commentaires** (24.10, soir, sur la maquette publiée), mot pour mot : sur « Substituts › » du pied,
  « Substitut doit tout de suite ouvrir l'onglet » (D135) ; sur « classé » dans la matrice de flb5b, « Que veux dire classé ?
  C'est pas du tout clair » (D136).
- **Sortir du rail sans délai** (24.10, soir, commentaire sur le rail de la maquette publiée), mot pour mot : « Un petit
  délais lors du déplacement, une fois choisir au bon emplacement, il y a un peu de délai pour "sortir" du mode rail ».
  Mesuré : une tâche de 98 à 143 ms au lever du doigt (les propositions d'ajout rapide reclassaient tout le catalogue). D134.
- **Le radar en pics** (24.10, soir, sur le radar de la fiche de Nelson Sauvin, ses deux traits entourés en rouge), mot pour
  mot : « Jsp si c'est la version actuelle mais le spidergraph doit être en pic pas juste des traits... Enfin comme sur les mini
  maquettes ». g1 pose l'inconnue dans le disque du centre : chaque famille décrite fait un pic, même seule. D133.
- **Des icônes pour les types hors 16D** (24.10, soir, après avoir vérifié qu'ils étaient ajoutés), mot pour mot : « le profil
  extra 16d sont bien ajouter ? Peut être mettre dans la baseline aussi des icône en plus, pour avoir une version courte juste
  icône, et une version plus textuel ». Les mots hors familles les plus fréquents reçoivent un picto au trait (baseline) ; deux
  lectures : courte (les icônes seules) et textuelle (icône et mot). D131. Puis, sur le relevé confié à un exécutant, mot pour
  mot : « même niche ou un Picto pour les truc super niche pour montrer que il y a qqch en plus.. Il faudra pas oublier d'ajouter
  la légende à certains endroits clé ». Les mots rares ont aussi leur picto, ou un picto commun « en plus » dit qu'il y a quelque
  chose de plus ; une légende des pictos aux endroits clés (Comparer, la fiche). D131 bis. Puis, mot pour mot : « Ah oui aussi
  si par exemple dans le 16d qui est assez vague, par exemple un houblon floral est super floral type rose ou Jasmine, agrume type
  mangue, épice hyper typé qqch... Ectt le mettre en valeur ». Le mot précis d'une famille (rose, jasmin, pamplemousse, litchi…),
  tiré de ses fiches, est mis en valeur à côté de sa famille. D131 ter. Puis : « Il faut pas que ça gêne ! Que ce soit bien
  intégré. Regarde avec des agents de critique pour ça ». Pictos, « en plus », légende et mot précis s'intègrent à la carte sans
  l'alourdir ; le critique le juge sur les captures, avant de lui montrer. Puis : « C'est peut être aussi un moyen de
  différencier un houblon hyper aromatique type Galaxy d'un houblons plus "fade" type saaz ». Les fiches le portent : Galaxy a
  des mots précis (fruit de la passion, ananas, pêche) et 1,8–5 mL/100 g d'huile ; Saaz redit ses familles (floral, herbacé,
  terreux) avec 0,3–1 mL/100 g. Le mot précis mis en valeur doit faire lire cet écart. Puis, sur « Ta règle « Il faut pas que
  ça gêne ! » passe », mot pour mot : « Mais il faut aussi que on voit comme il faut les différence ! ». Les deux tiennent
  ensemble : sans gêner, et l'écart Galaxy / Saaz se voit franchement.
- **L'entrée de l'analyse : B** (24.10, soir, sur B, la barre pleine « Ouvrir l'analyse de ma bière › », dans la planche),
  mot pour mot : « La meilleure ». D121 tranché : B dans l'étape, à la place de A.
- **Les mots au premier écran** (24.10, soir, sur Substituer au-dessus de 70 mots), mot pour mot : « dépasse les 70 mots au
  premier écran c'est pas ultra grave. Il faut être modéré avec les mots ». Le seuil devient une alerte ; l'échec seulement
  au-delà de 40 % de plus (`mots-premier-ecran.mjs --modere`, dans controle-commun). Être modéré reste la règle.
- **À quoi a servi le quota** (24.10, soir), mot pour mot : « En quoi tout ces quota ont été utile ??? ». Le 24.10, la
  plus grande part est allée à l'outillage (contrôles, cerveau, un délai de test débogué) et à des panels de 48, quand rien
  ou presque ne lui avait été montré. Le quota sert d'abord ce qu'il verra : montrer tôt ce qui est fait (L11).
- **La maquette jouable ne suit pas ses choix** (23.10, soir, sur la maquette de bout en bout), mot pour mot : « Mais
  ça semble pas du tout correspondre aux choix que j'ai fait de maquette de base ??? ». Sur la capture de q2b (lot 15,
  Suggestions) : « Ça oui, c'est effectivement l'un de mes choix ». Sur celle de Ma bière de la base v4.10 : « Ça
  aussi ». Puis : « Je confirme que "Bière" et "Suggérer" divergent nettement du design choisi. Oui c'est quoi ce
  bordel ??? ». Comparer (r6a) et Dryhopper (a1) suivaient leur base ; Ma bière et Suggérer suivaient la carte en fil
  de fer (D105).
- **L'étape Houblons de la base v4.10** (23.10, soir, sur sa capture cochée), mot pour mot : « Ça c'est le bon. Comment
  cette info a été perdu ??? ». Elle est perdue parce que la liste « Ses choix » du § 0 l'oubliait ; le registre
  `choix/ecrans.json` la remplace.
- **Les pages partagées** : « Met à jour avec les artefacts, seulement ce qui est up to date, il y a
  trop de version inutile » — 19.10.
- **La page partagée** : « Houblon lot 3 partage beaucoup trop de choses inutiles, supprime tout ce
  qui n'est pas un to date » — 19.10 : n'y garder que la base à jour.
- **Les radars** : « Les spidergraph/radar graph resemble a rien, c'est une vrai régression... » ;
  sur celui de Ma bière : « Celui-ci est encore pire ??? » ; « Comment c'est possible d'avoir autant
  de problèmes avec ces Spider graph. Fait moi des fils de fere avec de lib, third party, custom, ou
  autre afin de faire une vrai baseline » — 18.10, soir (D62 ; lot 7, une base radar).
- **La base radar, lot 7** (p08, les radars de Ma bière et de Suggestions entourés) : « Seul le
  premier est ok... » — 18.10, soir. Le radar de Comparer (SVG maison, polygones fermés, une
  couleur par houblon) devient la base radar ; ceux de Ma bière et de Suggestions restent à
  trouver. Puis, sur la planche entière : « P3,4,6,7 semble pas mal » (ECharts, D3, ApexCharts,
  SVG maison fidèle à Beer Maverick) — 18.10, soir. Décision du pilote parmi les quatre : D3
  (p04 ; d3-shape et d3-scale, environ 9 ko, licence ISC, rendu SVG par React), le même rendu que
  p03 sans ECharts (335 ko pour un seul type de graphe) ; ApexCharts écarté pour sa licence
  (payante au-delà de 2 M$ de revenus ou pour un produit utilisé par d'autres).
- **Radar de la fiche, lot 9 (h2)**, le mot « cité » entouré près de Melon : « Pourquoi il y a
  cité ? » ; « Aussi attention au piège, souvent les spidergraph ne montre pas que certaines données
  sont inconnus et du coup ont les traitements comme connue mais valeur à 0 » — 18.10, nuit (D65,
  D66).
- **Pour la nuit** : « Plusieurs versions de radar graph. De suggestions Aussi de ma bière et de mon
  houblons. Fait des fils de fere, et un ladder de comparaison et un ranking ect... » ; « Aussi des
  vrais comparaison... » ; « Et un système pour la substitution de houblons. Introduir ça. » ;
  « Fait des ticket de replis les pour que je puisse suivre une fois le lendemain » ; sur les
  données : « Parcontre ça manque pas que certaines données sont manquantes.. » — 18.10, soir
  (lots 9 à 11, tickets #134 à #139).
- **Le fil de fer perdu** (planche des fiches du lot 4 à l'appui) : « Pourquoi j'ai plus juste des
  maquettes fil de fer de ce type ? Qqch a dû être perdu dans le workflow et je comprends mieux
  pourquoi ça prends du longtemps » — 18.10, soir (méthode : explorer en fil de fer, finir une
  seule fois).
- **Tickets** : « Fait une issue, mettre à jour les fichiers de houblons, donné de bio Transfo
  ect.. » ; « Hop mavrerick ne doit pas être là seul source. » (#131) ; « Autre ticket pour les
  levures, choisir une levure remplis aussi sa dose (gram, sachet) » (#132) ; « Aussi, je crois
  que on a un bon background de création de UI, on va faire ça pour tout les screen de l'app.
  Faire un ticket pour ça et sauver la méthodologie, ajouter le fait que dans le ticket ça devra
  être spécifique au topic » (#133 ; méthode v3 dans `docs/qualite/methode-conception-frontend.md`)
  — 18.10, soir.
- **La baseline** : « Je comprends pas ces nouveaux screen, on avait établi une Baseline, ça
  différent complètement ? » — 18.10, soir (D26).
- **Levure et biotransformation** : « Et tout ce qui est biotransformation avec levures, dry
  hopping et tout, comment ça d'intégre ? Ça a été oublié ? » — 18.10 ; exigences R43, R44,
  C040 (« Est-ce que le lien entre houblon, levures, recette fonctionne vraiment ? »), C060.
- **Par houblon** : « il faudrait aussi ibu par houblon ( genre 5g -> 20ibu en plus) » ;
  « Type d'ajouter (à froid, voilà, ect et quand) » — 18.10 (« voilà » : sans doute
  « whirlpool » corrigé par le clavier).

## 2. Échelles relatives au style

- « le côté agrumes pour une ipa est infiniment plus subtil pour une cezc lager. Les
  échelles doivent être revu en fonction du style. Un écart faible pour une ipa peut être
  très grand pour un autre style vise versa... J'avais déjà fait cette demande... » — 18.10.

## 3. Lecture, densité et deux plans (la règle d'écran)

- **Sa définition de la densité** : « Il faut que ce soit dense sur téléphone car je veux
  voir un Max d'info au même endroit mais ça doit pas être surchargé, et surtout on doit voir
  que en premier plan les informations réellement utilise. Ensuite on peut trouver plus
  d'infos avec des raccords, renvoie, replis ou autre. » — 18.10, D23.
- « il y a trop d'info, trop de text ouvert de base. ça pollue beaucoup et il y a de la
  redondance. » — C082 (09.09).
- « Donc de base les caché ou trouver une astuce pour avoir juste les infos que j'ai besoin
  en premier » — C083 (09.09).
- « Ce que tu caches c'est les infos pas les actionable. » — C080 (09.09).
- « et regarde que les info sont des actionnable pas des "information, warning" ou
  explication » — C081 (12.09).
- « visuel sombre mais compact. pas d'info surplus en doublon ou inutile. » — C084 (05.09).
- « qui veut voir un Max d'info sans que ce soit étouffant. » — C085 (05.09).
- « Ça doit être compréhensible sur mobile, pas forcément simple, ça doit être simple dans
  le cas d'usage simple... » — C064 (29.09).
- « j'avais demandé à ce que ce soit lisible facilement et si je veux plus d'infos je peux
  les avoir facilement... » — C005 (17.10).
- « UX UI doit être UTILISABLE Pratique facile avec les info uniquement que l'on a besoin et
  que l'on veut... » — C165 (17.10).
- Sur les **commandes et l'espace** (contexte : boutons, en-têtes, écrans de saisie de
  septembre) : « BOUTON TOUJOURS TROP GROS IMPOSANT !! maximise la place !! » (C089) ;
  « tout peut être plus petit plus compact avec BEAUCOUP MOINS d'espace entre les
  composants. » (C088) ; « réduir le header au stric minimum sur mobile » (C086).

**Lecture du pilote (D23, audit A)** : la compacité vise le chrome (boutons, en-têtes,
espaces) ; l'information se trie en premier plan utile et actionnable, puis second plan à
un toucher. Il n'a jamais demandé de texte petit ; il a demandé « hyper lisible » (C062).

## 4. Outils UX et représentations

- « plein d'outils UI à dispo autre que les boutons ou champs text cherche ce qu'il y a et
  utilise ces nouveaux moyen pour maximiser l'UX sans détrimant de l'ui. » — C091 (12.09).
- « Je vois aussi aucun slider ou autre UX booster. » — C092 ; « ça met pas trop en avant
  les UX UI booster. » — C093 ; « Actuellement l'application est très textuel. » — C094.
- « fait plus de petits tag pratique comme ça » — C095 ; « il faut que ce soit visuelement
  parlant et frappant ! » — C096 ; « plus de couleurs de quoi se retrouver facilement. » —
  C097.
- « Ça n'utilise pas les bon outil UX, ni les bonnes représentation UI. » — 18.10, D23.
- Bascule Barres / Radar : exigence R45 (`exigences-retrouvees.md`) : « Je veux pouvoir
  avoir les deux visuels possible, un par barre type intervalle de confiance et un type
  spidergraph/Radar chart. Pouvoir passer de l'un à l'autre, pas avoir les deux à la fois
  forcément. » — **pour les comparaisons** de houblons. Sur le radar appliqué à la lecture de
  la bière (lot 2) : « C'est une catastrophe la vue radar ?? » — 18.10.
- Sur les fils de fer du 18.10 : « C'est mieux et tu as bien évaluer les problème, pas
  assez dense. » ; « on peut aussi basculer d'un affichage à un autre, type bare graph à
  radar graph. » ; « D'autres type de UX booster du genre doivent être mis en avant. C'est
  pas assez encourager » — 18.10.

## 5. Identité visuelle

- « L'app a une identité visuelle actuel mais je suis ok de changer ça au ça fait sens.. et
  aide le processus » — 18.10. DESIGN.md peut donc évoluer si la recherche le justifie ;
  le changement est écrit et argumenté, pas glissé.
- « Une UI ux toujours pas très moderne dans les normes et bon usage actuelle. » — 18.10.
- **Le thème des maquettes pour toute l'app** : « Le thème de l'app principal doit être revu. On garde celle des
  maquettes » — 23.10, après le rapport sur l'intégration (B7 : ses maquettes choisies sont claires, l'app n'a que
  « cave »). Ses maquettes, ce sont celles qu'il a choisies, à page blanche et gris neutres (mesure dans DESIGN.md) ;
  le « cave » devient le thème sombre. Puis, sur la maquette jouable passée au « clair » à papier chaud de
  `prototypes/houblons-v4/ecran/THEMES.md` : « Pourquoi c'est en thème pastel horrible ??? C'est pas ce que j'ai
  demandé ??? » — 23.10, soir (D106). Le pilote avait pris ce « clair » pour ses maquettes sans les mesurer.

## 6. Ses verdicts sur les versions passées (calibration de tout jugement)

| Version | Ses mots | Source |
|---|---|---|
| Carte « Territoire » (concept-2, v5) | « une sacrée dinguerie » | R40, D18 |
| v5 et v5.5 face à l'app en ligne | « semblait largement mieux que ce qu'il y a actuellement » | C055/P6, M0747 |
| v2 (porte B) | « Ça correspond pas du tout à une UX UI propre... C'est pire que les alternatives » (avec le lien vers le comparateur de Beer Maverick) | D17 |
| v3 | arrêtée (exigences perdues) | D19 |
| v4, 23 mini-maquettes | « énormément d'information pour rien », « écrans de central nucléaire ou cockpit d'avion », « Il semble y avoir des bonne idée mais c'est très mal réalisé » | D23 |
| Fils de fer lot 1 (p10, p04, p08) | « C'est mieux et tu as bien évaluer les problème, pas assez dense. » | 18.10 |
| Fils de fer lot 2 | « Un mélange entre p2 p3 p4 semblerait bien. » ; « P3 serait même le mieux de loin du lot. » ; « Un petit refinement de p3 est on est good de mon point de vu » | 18.10 |
| Variantes de p3, lot 3 (étape, planche du soir) | « P2,3,8 sont vraiment bien, la 8 seulement pour la manière dont ont voit les étapes d'houblon. » | 18.10, soir |
| Comparer, lot 5a (planches Barres et Radar) | « J'aime beaucoup la variante 3 » ; « C'est mieux mais pas encore meilleur que le site original » | 18.10, soir |

## 7. Sa façon de travailler avec nous

- « Je ne vais plus intervenir soit autonome » ; décisions déléguées, sauf gestes
  irréversibles (CLAUDE.md).
- Phase maquette légère : « Playwright ne me semble pas utile pour la conception […] c'est
  pour le moment juste des maquettes » — D20.
- « me faire 3 version à la fin plutôt qu'une » — D20.
- Mini-maquettes en nombre, tri, consolidation ; « récompense à fond la créativité,
  disruption, l'ux » — D20.
- « il faut relancer un batch de mini maquette si c'est pas concluant » ; « modifier la
  "température" » ; répartition « 4 tiède, 5 chaude, 2 froide » — D22.
- **Un seul coup d'œil en cours de route** : une planche de fils de fer gris avant tout
  visuel ; « ok ping moi quand cela est bon » — 18.10.
- « faire une recherche approfondie sur comment mettre en place un workflow qui intègre ça
  et comment utiliser les bon pratique frontend actuel » ; « Regarde notamment les bonnes
  pratiques, bon outil à utiliser sur internet. Le bon workflow » — D23.
- **L'entonnoir du lot 21 plutôt que le lot 22** : « J'ai l'impression que la manière de faire pour les
  mini maquettes dry hopping de base avec les 44 variante puis les 5 meilleures était vraiment plus
  qualitatif. Regarde pour améliorer ça » — 22.10, soir. Méthode : `.claude/skills/voies/references/entonnoir.md`
  (M13).
  - « Un des bon fort des anciens version était le niveau de chaleur, la diversité mais toujours suivre la
    Baseline. C'est bien intégré ça ? Et multiplié les mini Proto fils de fer » ;
  - « Et plus de diversité et de nombre de mini proto » ;
  - « Aussi faire un vaste panel et ensuite ranking puis améliorer et aussi prendre et coller les bonnes idées même
    les plus extravagantes pour des v2 puis V3 ect jusqu'à un résultat satisfaisant » ;
  - « Peut être, plus minimaliste des les concepts de base mais plus nombreux et diverse puis améliorer et
    itérer » — 22.10, soir.
- **Ce que l'entonnoir a donné** (23.10), mot pour mot : « J'ai l'impression que les mini maquettes sont vraiment moins
  quali mais que r6n2 donne vraiment bien... Les icônes aussi était un peu cata, dans le sens, pas vraiment diversifié,
  pas de prise de risque et trop focus sur mes exemple. Même si on a réussi à trouver le bon au final ». Mesuré : les
  56 concepts de Dryhopper sont à moitié vides et sur un même squelette ; 32 pictos sur 48 sont restés sur ses
  exemples (M14, `controle-panel.mjs`).
- **Une version, un artefact** (23.10) : « Problème avec les artefacts, c'est assez dur à lire et chaque version devrait
  en créé des nouveaux ». La page « Lot 22 houblons », republiée à la même adresse depuis le 22.10, cumulait quatre
  sujets et ~100 captures de 277 px. Le même jour, à la session du lot : « Je les vois pas dans les artefacts.. ».
  Remplace « publier à la même adresse » (19.10). Mode d'emploi : `outils/pages/PUBLIER.md` ; contrôles :
  `verifier-page.mjs`, `systeme.mjs voies` (M12).
- **Le picto des baies** (25.10, soir), mot pour mot : « L'icône baie de la baseline est mauvais, utiliser plutôt un icône de framboises ».
- **Les sources à un seul endroit** (26.10, sur la carte dépliée de Lotus, Ma bière, `work/missions/2026-10-25-integration-houblons/voies/brasseur-sources-partout-lotus.jpg`), mot pour mot : « Tu as ajouté à beaucoup beaucoup trop d'endroits les sources. Regarde juste ici, ça surcharge et ça apporte rien. » ; « Aussi cette vue doit de ferme dans on ouvre ou change de vue. » ; « Mais sur les info de houblons, un endroit qui renvoie la source suffit. C'est tout » (D168 à D170, exigence transversale : les plages qui diffèrent restent en traits, les noms des sources seulement dans la section Sources de la fiche).
- **En jouant avec l'app déployée (D95)** (26.10, vers 15 h), mot pour mot : sur l'étape Houblons, le panneau « Au style » aux 12 familles hachurées (`work/missions/2026-10-25-integration-houblons/voies/brasseur-au-style-mort-prod.jpg`) : « Clicker ici ne fait plus rien et il y a plus le bouton pour ouvrir la vue. + Aucune info à jour. » (D171) ; « Pour substituer. Il manque aussi la partie de fermentation actif. Je pense qu'il manque des données de levures pour ça d'ailleurs et le moteur doit pas être vraiment en place. » (D172) ; « Aussi ajouter des gramme de houblons, un appui long doit en ajouter en continu. » (D173) ; « Regarde aussi que l'import, export de recette fonctionne toujours. » ; « Et le class ia semble bien mais change pas mal le classement de base. C'est à de demander à quel point notre algo est vraiment correcte. »
- **La justesse du moteur** (26.10, après « à quel point notre algo est vraiment correcte »), mot pour mot : « elle récompense même surtout l'α c'est pas la bonne métrique. Surtout en fonction du style... Et l'aa est la métrique la plus simple à contrôler, augmenté ou diminuer la dose. Elle doit compter mais pas que. » ; « J'ai l'impression que cryo citra est beaucoup trop booster, et on voit pas citra simple » (D174) ; « Il faudrait pas que l'algo trie trop ou exclue trop tôt des potentiels candidats surtout. » (D175) ; « Je pense que on est quand même pas mal, mais manque peut être un peu de fine tune ». Puis : « D'ailleurs pourquoi il y a pas l'hyperboost ou les autres cryo ? » (D176). Puis : « Il doit manquer quelques houblons aussi... » (voie c5). Puis : « Il faut tout mettre ?? Pas exclure certains ?? » (D98). Puis : « Aussi, quand j'ajoute un houblon au stock, est-ce que celui-ci de lie correctement ? Ajoute cette tâche » (#187). Puis : « Et est-ce que le compagnon peut ajouter, et enrichir les houblons ? » (#182). Puis : « SI un houblon à une origine non répertorié par exemple cascade CHE. Lié sa fiche à un cascade le plus proche et mettre une info avec Astérix » (#187).
- **Le catalogue complet sans perte de réactivité** (26.10, sur les 248 variétés manquantes à ajouter), mot pour mot : « Attention au délais ajouter, la Responsive, réactivité » (voie c6 : budgets de l'épopée #159, processeur ×4, mesurés avant et après ; peu de données chargées à la demande). Puis : « Est-ce qu'il faudrait pas utiliser des architectures db différentes, ou des systèmes pouvant allégé les délais type index ou autre ? À regarder si ça vaut le coût » (D101). Puis : « Toujours faire attention à bien utilisé les bon agent pour les bonnes tâches » (L18). Puis : « Aussi ajouter que les agents type Opus ou fable, peut aussi lancé eux même des sous agent hiku pour allégé leur tâches » (relais par le pilote : DEMANDE EXECUTANT). Puis, sur la liste « Ajouter — houblon… » (Citra cryo en tête, tous à 12 g et 10′) : « Regardé aussi pour l'algo de suggestions » (D179).
- **Le radar de Substituer en production** (26.10, Lotus contre Caliente et Citra cryo, `work/missions/2026-10-25-integration-houblons/voies/brasseur-radar-tirets-lotus.jpg`), mot pour mot : « 2 petit point, si les traits haché traversew graph, ça enlève de la visibilité. » (D180) ; « Les points bleu sont difficile à voir. » (D181) ; « C'est étrange que pour ces 3 houblons, ils ont les 3 aucune valeur pour les même arôme... ».
- **Le manque partiel sur le radar** (26.10, sur la capture r2, `work/missions/2026-10-25-integration-houblons/voies/brasseur-radar-manque-partiel.jpg`, points de Lotus et Solero entourés près du centre), mot pour mot : « Comment c'est affiché le donnée manquantes pour que 1 des 3 ? Ou 2 des 3... Ça doit être très visible » (D183).
- **Barres au style toujours hachurées** (26.10, sa recette réelle « neipa v3 — Double IPA — V1 — 24 L · — % · 40 IBU », `work/missions/2026-10-25-integration-houblons/voies/brasseur-neipa-v3-hachure.jpg`), mot pour mot : « Avec lotus toujours aucune modification des barre au style » (D171, suite ; voie u2).
- **L'export texte de recette** (26.10, après avoir collé l'export de « neipa v3 »), mot pour mot : « Ah oui il y a beaucoup trop d'info extrait?? Wtf » (D184, voie x2).
- **Citra cryo encore en tête** (26.10, Suggérer en production sur « neipa v3 », dry hop après 144 g : Citra cryo, Galaxy, Citra cryo + Galaxy, Citra cryo + Nelson Sauvin ; `work/missions/2026-10-25-integration-houblons/voies/brasseur-citra-cryo-suggerer.jpg`), mot pour mot : « Citra cryo semble toujours être en tête pour beaucoup de choses » (D174, suite : en stock, 7 familles attendues de la 22A, départage par intensité en attente de son choix D91 ; correctif 60′ dans le lot non déployé).
- **Le manque partiel au radar, son choix** (26.10, page m8 Gd66AfKhbqzdQ7xdt19Wiq), mot pour mot : « G le trou du o, met ça sur tout les radar de comparaison btw » (lu « G · le trou du 0 », sur Substituer et Comparer ; D114).
- **Points confondus au radar** (26.10, sur la capture G, `work/missions/2026-10-25-integration-houblons/voies/brasseur-radar-points-caches.jpg`), mot pour mot : « Mais autre problème, sur certains points, on ne voit pas le bleu » (D186).
- **Retours du 27.10 au matin** (sa Double IPA, Comparer Citra cryo contre Nectaron, Suggérer « plus tropicaux » ; captures `work/missions/2026-10-25-integration-houblons/voies/brasseur-comparer-absolu.jpg`, `brasseur-suggerer-dipa.jpg`, `brasseur-comparer-au-style.jpg`, référence `brasseur-ref-bm-idaho7.jpg`, le radar Beer Maverick d'Idaho 7), mot pour mot : « Plusieurs petits problèmes. Le radargraph en absolue à aucun sens, il faudrait montré la plage type du style et normalisé aux extrêmes mais là c'est illisible. » (D187) ; « Ensuite dans suggestions , j'ai l'impression que il y a pas l'ia ? Et il faudrait un bouton pour directement ajouter le houblon à la recette. » (D188) ; « Pour finir, dans comparé. Le radargraph au style ne change pas de taille... » (D189, sens à confirmer) ; « Aussi cryo citra semble manqué cruellement de valeur. » (D190) ; « Et pour la double IPA, les houblons d'agrume sont pas vraiment ceux attendu. Je m'attendais à des houblon plus typé IPA El dorado, mosaic. Mandarina Bavaria, calypso, Pacifique jade ou même idao7 » (D191). Précision sur D189 : « Quand je change le timing. Je vois les valeurs changé mais la la taille du radar graph ». Puis, à « Tu veux d'abord voir en mini maquettes ce que deviennent les barres et la liste de ta Double IPA, ou je le fais directement en vérifiant tes 6 houblons ? » : « Les deux » (voie f9, puis la page de mini maquettes). Puis, à « quelle liste veux-tu pour ta Double IPA : C, A, B ou D ? » (page m9, B8v5Ak1uXkrPnWyZDqNxG7) : « Regarde surtout pour l'algo et implemtation avec l'ai. Il faudra évidemment enlever le panel des six houblons dans la vrai app ». Il n'a choisi aucune lettre. « Tes six » n'était qu'un repère de la page et n'a jamais été dans l'app (D124). Puis, sur la capture réelle d'ia3 (neipa v3, plus d'agrumes, dry hop actif : Mandarina Bavaria 1re avec la phrase « IA Apporte des notes intenses de mandarine et d'agrumes frais qui renforcent parfaitement le profil. », Cashmere, Calypso, Apollo ; la rangée de Mandarina et sa phrase entourées en rouge ; `work/missions/2026-10-25-integration-houblons/voies/brasseur-ia3-overfit.jpg`), mot pour mot : « Ça semble overfit mes paramètres et de loins... » (D192). Puis, sur « L'IA de Suggérer reste éteinte » (banc ia4, Flash-Lite : +5 points) : « Même la meilleure des IA ? » ; aux deux essais proposés (3.8 Flash, réflexion basse ou haute) : « J'autorise un budget de 10ch pour testé les deux » ; puis « Et va jusqu'à 99% de quota pour ce cas » (D130). Puis, après le banc (D131) : « Mettre 3.8 Flash et je peux l'activer à la demande » (D132).
- **Bannir** (27.10, Suggérer), mot pour mot : « Problème trouvé. SI je fais tropicale, puis ensuite je banis résine. Rien ne se passe. » ; « Les bannissement semble pas fonctionner » (D193).
- **Bannir, sa définition** (27.10, sur le premier correctif), mot pour mot : « Non mais bannir soit être un objectif, on doit avoir aucune suggestions sur ce chemin et si il y en a de base ça suggère des houblons qui l'enlève » ; puis « Corrige jusqu'à finir même si 100% » (D194).
- **Les algorithmes à 60′** (31.10), mot pour mot : « tout fonctionne plut'ot bien sauf pour les algo, surtout sur la partie 60', il y a souvent pas de propostion du tout » (D196).
- **Méthodes et suite** (31.10), mot pour mot : « J'ai trouvé des systèmes, workflow et autres méthodologie à potentiellement mettre en place » (superpowers, mattpocock/skills, andrej-karpathy-skills, anthropics/skills, ponytail, ui-ux-pro-max-skill, graphify, caveman, addyosmani/agent-skills, taste-skill, google-research/harness2) ; « Regarde ce que tu peux faire avec ça. Regarde aussi pour d'autres alternatives ou des choses encore meilleur. » ; « Une fois terminé avec houblons on va refaire tout les écrans de l'app un à un comme houblons ».
- **Le rôle d'un houblon** (31.10), mot pour mot : « Warrior, Columbus et Nugget en « mixte », pas en amérisants. ??? Mais mixte veut aussi dire amerisant en fait le rôle d'un houblon n'est jamais vraiment totalement défini » (note [[role-continu]] ; voies t3 et k2).
- **Trop herbacé** (31.10), mot pour mot : « Il y a un écran qui met en lumière, trop herbal, genre de problème qui arrive lorsque l'on utilise du houblons frais. C'est un critère aussi important à prendre en compte » (D197 ; l'écran est sans doute le panel OSU de Comparer : « les agrumes plafonnent dès 8 g/L, l'herbacé monte encore »).
- **Les méthodes, sa réponse** (31.10), mot pour mot : sur les questions bloquantes de superpowers, mattpocock et addyosmani : « Alors ça non ou à adapter avec un jury. Le reste ok, on peut aussi faire des tests ! » ; sur le lint de DESIGN.md : « Oui ok met tout en place » (mission 2026-10-31-systeme-ecrans).
- **Premier écran du programme** (31.10), mot pour mot : « On va tester tout ça en refaisant ce premier écran, identité dans la création de recette » (sa capture : `work/missions/2026-10-31-ecran-identite/brasseur-identite-avant.jpg` ; mission 2026-10-31-ecran-identite).
- **Les boosters UX/UI** (31.10, sur la refonte de l'écran Identité), mot pour mot : « Oublie pas de bien mettre en avant les UX UI booster ! » (voie e7-boosters-ux ; le lot Identité les charge).
- **Les houblons à l'amertume inconnue** (31.10), mot pour mot : « Substituer à 60′ ne met plus en tête de houblons à l'amertume inconnue. On en a vraiment ? Avec toutes Nos données comment c'est possible ?? » ; « Il doit manquer des choses » (D199 : 76 des 188 ajouts c6 sans α ; voie c9).
- **La source de vérité** (31.10), mot pour mot : « Beer Maverick ne doit pas être la source de vérité. La source de vérité est un penel croisé de plusieurs source et donnée » (note [[verite-croisee]] ; voies c9 et v2).
- **Une seule source** (31.10), mot pour mot : « SI on a que une seul source pour ce houblons, tempis il faut pas se limité à si une seul source on montre pas, non » (la confiance, jamais l'exclusion ; [[verite-croisee]]).
- **Rust ou autre langage** (31.10), mot pour mot : « Question, pas pour tout de suite. Mais vaudrait il la peine de réécrire certaines partie en Rust ou autre langue rapide et plus fiable ? Regarde ce que on pourrait gagner, perdre. Et fait une issue du c'est intéressant » (issue #196 : profiler d'abord, noyau WASM seulement si le profil le montre).
- **Le panel croisé, son choix** (31.10) : « B » (D201).
- **Le panel v0 d'Identité** (31.10), mot pour mot : « Ah c'est très bien, mais parcontre ça va coûter "trop chère" de faire ça à chaque étape. Il yen a des très bien et des très mauvaise. Je vais rien dire. C'est un bon test pour voir si la critique est bien qualibré. Fait une passe avec » (phrase coupée ; lecture du pilote : la passe du critique, à l'aveugle, puis une passe 2 sur ses candidates ; D203).
- **Identité, son choix** (31.10, sur la page du tri), mot pour mot : « 7 · r4 · Chaque nombre est un curseur Est le meilleur, mais limite peut être un peu trop, au je veux plus d'ébullition, SI je change de fermenteur... Quelques adaptations mais si non c'est bien ! » (lecture du pilote : les bornes des curseurs sont trop serrées, il faut pouvoir monter l'ébullition et changer de fermenteur ; D205). Et sur la méthode : « Pour les prochaines écran il faudra pas autant de mini maquettes et série, c'est trop demandant en quotas » (D204).
- **r4 à l'ordinateur** (31.10), mot pour mot : « Aussi il faut que 7 · r4 · Chaque nombre est un curseur soit accessible en mode ordinateur, donc pouvoir modifier aussi les chiffre directement » (chaque nombre se tape aussi, au clavier ; D205).
- **Tests sur l'app en ligne** (31.10), mot pour mot : « Ah une fois implémente, jouer et faire des test sur la vrai application déployer. Tu peux modifier les données de recette, c'est pas trop gênant mais ne génère pas des quantités de données inutile » (note [[autonomie-decisions]]).
- **L'écran Nouvelle dépense** (31.10, avec sa facture Brau- und Rauchshop 372765 et trois captures de l'app en ligne : `work/missions/2026-10-31-ecran-depense/brasseur/`), mot pour mot : « Écran suivant à refaire et pas des moindres, déjà la partie business est pas 100% correcte. Les liens avec le stock et tout de font pas correctement, certain champs sont mal remplis. Pas sûr que ça upload vraiment le document sur mon drive... Et avec la facture d'envoyer ça a pris vraiment longtemps 10s 20s sur téléphone. » ; « Aussi sur les entrée, prévision et Tout c'est pas top.  Et l'interface de cette pas est pas bonne, elle est pas mauvaise mais peut être mieux ! Surtout montrer les points où l'ia n'es pas sûr » ; « Revoir tout cas, comme c'est de la facturation, c'est super important, ça doit être très fiable ! » ; « À tester aussi en long en large sur la vrai app » ; puis : « Ça doit quand même être le plus fiable possible la lecture de documents, si ça prend un peu plus de temps, c'est pas dramatique. Mais là c'était trop long » (la justesse prime sur la vitesse ; mission 2026-10-31-ecran-depense). Puis, sur le rangement des justificatifs : « Non non ça va pas, ça va me coûter trop chère de hoster des documents PDF en db. Ça sera envoyé dans mon drive, et une version ultra  light est en db. J'avais déjà spécifié ça » (l'original dans son Drive, une petite fiche sans binaire en base : `docs/finance-storage.md`, ce que fait le code).
- **Malts/sucres, son choix** (31.10, sur la page de la passe 3), mot pour mot : « La balance · r4c semble mieux, mais il faut plusieurs click pour faire des changements, c'est un peu un problème UX. Je voudrais aussi à la volée pouvoir facilement supprimer, ajouter, modifier sans ouvrir une "sous vue" mais si je click sur un, je peux avoir plus d'informations ou autre » (r4c choisie avec une adaptation : modifier, supprimer et ajouter se font sur la ligne, sans plateau ; toucher la ligne ouvre le détail ; D208, D209). Sur la page de la passe 4 (r4d), mot pour mot, à la phrase du pilote « r4d applique ta demande à la volée sans sous vue » : « Mais ça inclus pas les besoins que j'ai à la volée ??? » (r4d ne met sur la ligne que la masse, le retrait et l'ajout ; moment, part et couleur restaient au plateau ; D211). Et sur le plateau : « Toujours visible » (D212).
- **Malts/sucres, la masse** (31.10, nuit, sur la page de la passe 5), mot pour mot : « Mais on peut pas modifier la quantité de chaque
  malt sucre de n'importe quel ingrédients en une action ??? ». Réponse : déjà fait depuis r4d (un toucher sur la masse, Entrée), absent de la page ; rangée ajoutée.
- **Malts/sucres, le moment sur la ligne** (31.10, nuit, passe 5), sur sa capture de r4e-a où la pilule « ébullition ⌄ » de la ligne
  Dextrose est entourée, mot pour mot : « Pas super ui » (D218).
- **Malts/sucres, la masse sans clavier** (31.10, nuit, passe 5), à la réponse du pilote « c'est déjà possible, dans a comme dans b : un
  toucher », mot pour mot (il cite la réponse, puis répond) : « c'est déjà possible, dans a comme dans b : un toucher je pensais plutôt à un mini slider ou bouton+ /- facil » (D219).
- **Malts/sucres, son choix p6-b2** (31.10, nuit), sur la capture de p6-b2 (la barre de Pilsner tirée à 7,0 kg, 70 % du grain), une coche
  rouge sous les sacs habituels, mot pour mot : « Oui ça c'est bien, et maintenant la recherche, comment elle s'affiche ? Dans la liste ? » (D220).
- **Malts/sucres, la recherche** (31.10, nuit), après les captures de la recherche de p6-b2 (puces sous le champ, sans stock), mot pour
  mot : « Concentre toi sur la recherche et l'ouverture de la recherche avec les stocks. Celles de la vrai app était pas trop mal » (D221).
- **Malts/sucres, son choix s1** (31.10, nuit), sur la page de la passe 7, vignette « Sous le champ · s1 » (« Tuiles sur deux colonnes :
  étoile si épinglé, teinte en EBC, stock. »), mot pour mot : « C'est très bien avec algo de reconnaissance pour le style et autres comme pour les houblons ». Puis : « Dans le proposition », et, sur sa capture où il entoure les
  tuiles proposées à l'ouverture du champ (`work/missions/2026-10-31-ecran-fermentescibles/choix-v7/sa-capture-s1-propositions.jpg`) : « Non je parle de ces propositions » (D222).
- **La nuit du 31.10 au 01.11, ses consignes** (Remote Control), mot pour mot : « En parallèle est-ce que les écrans pour la saisie de facture continue ? Avec tout les problèmes soulevés résolu ? » ; « Tu peux commencer l'implémentation de la vue Malte sucres choisi, et tu pourras faire les tests sur l'app réel » ; « Je vais allé me coucher, continue pour la vue des saisie de facture. Tu me feras plusieurs propal, mais tu choisira une pour implémenter dans la vraie app, car le prochain feedback sera dans 9h de ma part. Donc continue là dessus, sans avoir besoin de mon retour ! » (D223).
- Puis, la même nuit : « Pas de bloquage sur une attente de mon feedback c'est primordial » (D223 ; [[autonomie-decisions]]).
- **Les tests de la dépense sur l'app en ligne** (31.10), mot pour mot : « A : des lectures Gemini réelles, facturées » puis « Et b » (accords A et B : lectures Gemini réelles et facturées ; une dépense de test et son fichier dans son Drive, créés puis supprimés ; D210).
- **Fiche d'un produit nouveau** (31.10, dépense), mot pour mot : « Aussi je sais pas comment on peut résoudre ce problème. Peut être à la fin quand on valide la facture, en arrière plan.  SI j'ajoute des malt, houblons, levure ou autre sans fiche en db. Une procédure de recherche pour remplir la fiche du nouveau produit est lancé. » ; « Attention au mapping, on veut pas de retrouver avec plein de fiche du même produit » (à la validation, une recherche en arrière-plan remplit la fiche d'un produit nouveau ; avant toute création, le produit est rapproché des fiches existantes ; diagnostic d1 S3 et S6 ; note [[export-et-ia]] : on ne comble que les trous).
- **Les unités** (31.10, nuit, dépense), sur le défaut trouvé en revue (une ligne « Crystal » en kg reliée à « Houblon Crystal » en g, soit 25 000 g de houblon en stock), mot pour mot : « oui attention au unités » (D213).
- **L'unité illisible** (31.10, nuit, dépense), sur la règle n° 4 de D213 rédigée par le pilote (« une ligne sans unité lisible n'est
  proposée à aucun article »), mot pour mot : « Unité illisible : la ligne n'est reliée à aucun article.???? » (D214).
- **Même produit, autres données** (31.10, nuit, dépense), mot pour mot : « Pour les AA du houblons, et source,  faire un matching avec sa carte et stock, si dans le stock, un houblon est le même mais différé sur ces données, créé un "bis". Et au par exemple on ajoute un houblon CH aa8% et que on a que ce houblons US AA 6, LIÉE sa fiche mais donné ses vrai valeur là où on les a. Aussi faire un check de procédure si on peut trouvé un e fiche dédier. SI non laisse sa fiche US, et montré que c'est pas exactement la bonne » ; puis « Pareil pour les ebc ou autre info malt ou autre info stock » (D215).
- **Le nom de l'article bis** (31.10, nuit, dépense), à la question du pilote « « Cascade bis » vous suffit-il, ou voulez-vous l'origine
  dans le nom (« Cascade CH ») ? », mot pour mot : « voulez-vous l'origine oui » (D216).
- **Gemini pour les tests** (31.10, nuit, dépense), après « Gemini en production attendra votre accord, avec le coût par produit
  montré avant. », mot pour mot : « Je l'accord pour les test 10ch de budget » (D217).
- **La dépense sur son téléphone** (01.11, 8 h 25, sa facture Infomaniak de 7 lignes, point « ① Date » seul, version en ligne 153b2296),
  mot pour mot : « Y aller je fait rien, et il y a un vrai problème, quand on ouvre certains champs, le fenêtre fait haut bas très rapidement,
  comme un cintillement, c'est horrible » ; puis, sur la lecture : « Aussi, c'est assez fiable mais toujours plutôt lent » ; puis « cible rien pour « Date ». Il y a plusieurs champs
  date aussi attention ! » et « C'est pas utile den avoir plusieurs » (D233).
- **La lecture d'une facture** (01.11, matin), mot pour mot : « Est-ce que on pourrait faire 2 lecture en parallèle de 3.5 flash et si ça
  diverge une relecture par 3.8 ? C'est quoi l'architecture actuellement ? Pourquoi on a choisi ça ? » ; puis, au banc proposé (≈ 1 CHF) :
  « 5chf de budget accordé » (D234 ; banc k1, `work/missions/2026-11-01-banc-lecture/`). Puis, sur le résultat du banc (page
  https://claude.ai/artifact/S4ovLYnPabLA5Pvq6n4rU9) et la question « veux-tu passer la lecture des factures à ta proposition C », mot pour
  mot : « en théorie, oui, mais est-ce qu'il y a pas des nouvelles IA de Google plus rapide et meilleures pour ça ? » ; puis : « 3.5
  Flash-Lite, il y a pas moyen de le faire mieux fonctionner ? Avec un meilleur Harness, guideline, ou une utilisation plus haute de son
  intelligence ? Genre en Max ou xhigh ? Et si il y a probablement fallback sur 3.8 ? » ; puis : « Regarde avec des skill ou autre
  outil, workflow ou third party comment l'améliorer au Max pour la vision » ; puis : « Tu as assez de vrai donné de test ? » ; puis,
  sans mot, de nouvelles pièces (10 h, hors de Git dans `H13-reels/`) : deux PDF B&R identiques (commande 652093), dix images (captures
  de trois commandes B&R, une photo de facture CFF), un PDF B&R (commande 686863), et : « Il y a des screenshots qui sont de la même
  facture mais sur plusieurs écran » ; puis, au rapport « Lire juste d'abord, plus vite ensuite » (envoyé), mot pour mot : « Met déjà en
  place le système qui permet d'améliorer et compare avec les données que l'on a, j'en ai pas plus pour le moment » ; puis : « J'ai
  l'impression que tout ce qui est skill, harness ou autre a été un peu mis de côte » (registre de chaque geste :
  `work/missions/2026-11-01-banc-lecture/GESTES.md` ; boucle : skill `banc-lecture`).
- **Une pièce déjà saisie** (01.11, après ses pièces), mot pour mot : « et les deux PDF de la commande 652093 sont identiques. Géré ce cas
  là, on doit voir que ce document est déjà lié à un stock, facture ».
- **Frais de port et second avis** (01.11, après-midi), à la question « Sur une commande en plusieurs captures, les frais de port
  doivent-ils être une ligne de la dépense, ou seulement compter dans le total ? », mot pour mot : « Total seulement » ; puis, sur zxing-wasm
  et Azure comme second avis : « Mais Azur est payant ? Je veux pas un nouveau poste de dépense Claud, ai infra » (Azure : non, GESTES
  rang 9 ; zxing-wasm, gratuit et local, reste ouvert). Puis, mot pour mot : « zxing-wasm ok » (D240) ; et : « Et Harness, skill tool ou
  third party non payant pour 3.5 flash lite ? » (GESTES : les gestes gratuits restants) ; puis, aux captures du doublon : « Et Harness,
  skill tool ou third party non Et Harness, skill tool ou third party non payant pour 3.5 flash lite ? Tu as pas répondu, doublon ok
  parfait ». Puis, avec le lien du dépôt GitHub Anionex/dsh-vision-toolkit (https://share.google/fivmIAdnRQEAWiYzK), mot pour mot :
  « Qqch du genre ferai sens adapté à Nos modèles et besoin ? » ; puis : « J'accorde 20chf de crédit en plus » (D242). Puis, à « pdf.js
  dans l'app, ok ? » et « brancher le QR dans l'app […] je te montrerai d'abord des mini maquettes », mot pour mot : « Okok » (D243).
- **La TVA** (01.11, matin), mot pour mot : « Aussi pour la TVA. SI plusieurs articles dans la même facture ont différentes taux, comment
  cela est géré ? En tant que indépendant je dois pouvoir me faire rembourser la TVA ? J'aurais besoin d'avoir une vision là dessus »
  (réponse donnée : la lecture contrôle chaque taux, l'enregistrement ne garde que la TVA totale et un seul taux, la TVA ne se récupère que
  si l'entreprise est assujettie ; ouvert : une vue TVA, « assujetti ou pas », à montrer en mini maquettes).
- **Les tests en ligne** (01.11, matin), mot pour mot : « Et les tests d'intégration dans la vrai app ont vraiment été très mediculeux ? »
  (réponse : non ; L12 complétée, contrôle `controle-bande.mjs` en 390 tactile).
- **Déployer** (01.11, matin), mot pour mot : « J'autorise de déployer sans faire tout les test npm run test. Mais seulement ceux visié
  pour les changements » (D236).
- **Nouvelle dépense, passe 3** (01.11, matin, sur sa capture de la passe 2 « r2b · repos à 1280 px », le bandeau et la preuve entourés ;
  `work/missions/2026-10-31-ecran-depense/brasseur/01-11-recap-r2b-1280.jpg`), mot pour mot : « Plusieurs points sur la vue et logistique. rang 7 · r1 · série r Nom d'approche : feuille J'aime beaucoup les pastilles sur les items, ça rend la chose très clair. Aussi un récap en haut comme sur le screen est top, avec la possibilité de clicker et avoir des revois Maintenant pour la lisibilité. Je veux que en un écran je vois le maximum d'items ajouter. Je veux que cette écran d'ajouter de facture prenne vraiment toute la place de l'app. Je veux aussi que ça soit trié par catégorie avec sous total de quantité. Par exemple je sais très bien combien d'houblon j'ai commandé. Mais pas forcément combien items au Total. Aussi bien utilisé les UX UI booster. Finalement, pour la logistique d'envoi sur le drive, c'est invisible, c'est à la fin en arrière plan. Et si ça fail. Grosse notification, renvoie sur la facture pour upload le justificatif ou/et réparé le lien drive » (D235).
- **Nouvelle dépense, son choix de la passe 3** (01.11, soir, sur la page de la passe 3), mot pour mot : « Les bandes teintées p3a-3
  j'aime beaucoup ! C'est le top 1 de loin quasiment rien ne doit être changé.  Il faudrait juste le rendre un peu plus compact, pas comme
  Le tableau à prix p3a-2 mais presque enfin pas copier mais adapté. C'est du 99% bon » (D245).
- **Contrôle QR, son choix** (01.11, soir, sur la page du contrôle QR), mot pour mot : « Le sceau QR z2 parfait comme telle » (D246).
- **La vue TVA** (01.11, soir, à « Vue TVA : elle attend aussi ton choix »), mot pour mot : « Vue TVA : elle attend aussi ton choix. Je
  comprends pas ? Je vois pas l'artefact où j'ai déjà validé ? » (réponse : aucune page TVA n'existe encore ; la phrase du pilote était
  fausse, un choix sans page ; L24 complétée).
- **La vision, encore** (01.11, soir), mot pour mot : « Pour la vision, on a pas réussi à faire mieux que ce qui est déjà ? Même avec tout
  les test, nouvelle implantation, rien ??? Et si on met le Harness skill et autres dans notre méthode actuelle, on gagne encore en
  qualité ? » (réponse : pas plus juste que la production sur ses 13 pièces, à ±2 points, ce que 13 pièces ne départagent pas ; gagné :
  même justesse pour ≈ 44 % de moins avec C★v8, plus de lecture coupée, le QR qui certifie sans IA ; les skills ne tournent pas dans
  l'app ; le levier suivant : plus de pièces, et la bascule en production, à son accord ; `GESTES.md` du banc).
- **La bascule de la lecture** (01.11, soir), à « basculer la production sur C★v8 avec la correction automatique et le QR : même
  justesse, moins cher, sans lecture coupée. Ça demande ton accord, car il faut redéployer la lecture en production », mot pour mot :
  « Yes ok » (D247).
- **Nouvelle dépense, son degré** (01.11, soir, sur sa capture de p3c-3 au repos, « 18 Kg » de la bande Malts et « 6 Kg × 2,30 » de Maris
  Otter entourés en rouge ; `work/missions/2026-10-31-ecran-depense/brasseur/01-11-p3c-3-quantite-entouree.jpg`), mot pour mot :
  « p3c-3 le mieux mais mettre plus en avant la quantité, juste mettre en gras, et bien alignées les champs » (D248).
- **Les frais de port** (01.11, soir), à « Frais de port « Total seulement » : seulement sur les commandes en plusieurs captures, ou aussi
  quand le port est imprimé comme un article ? », mot pour mot : « Non non aussi quand imprimé article » (D249).
- **La TVA, son cas** (01.11, soir), à « TVA : es-tu assujetti ? », mot pour mot : « Je fais moins de 100k » (D250).
- **La CSP de l'hébergement** (01.11, soir), à « CSP : peut-on ajouter 'wasm-unsafe-eval' dans firebase.json ? Sans ce mot, le QR ne lit
  rien en ligne. Je te montrerai la preuve jouée en local dès que le rejeu sera fini. », mot pour mot : « Oui » (D253).
- **Les tests sur l'app en ligne** (01.11, soir, après les deux déploiements de la bascule), mot pour mot : « Les test d'intégration sur
  la vrai app, vrai donné sont fonctionnels ? »
- **Les tests sur l'app en ligne, suite** (01.11, soir, pendant ma réponse), mot pour mot : « Ils ont bien été effectué, sans problème? »
- **Déployer le correctif des montants de ligne, pousser la branche** (01.11, soir), à « 1. Je déploie la fonction de lecture des
  factures avec ce correctif (oui / pas maintenant) ? 2. Je pousse la branche et j'ouvre la PR, 42 commits (oui / plus tard) ? »,
  mot pour mot : « Oui et oui » (D257).
- **La suite** (01.11, soir, après le déploiement du correctif et la PR 199), mot pour mot : « Continue » (lu : la suite prévue, port de
  p3c-3 avec z2 D248, port « Total seulement » D249, vue TVA en mini maquettes D250).
- **La vue TVA, et la rénovation d'abord** (01.11, nuit, sur sa capture de u3, la bouteille « TVA dans chaque 33 cl 13,35 ct », le haut
  marron de la bouteille entouré en rouge ; `work/missions/2026-10-31-ecran-depense/brasseur/01-11-u3-bouteille-marron-entouree.jpg`,
  hors Git), mot pour mot : « Même si c'est un peu enfantin j'aime assez bien, après pas convaincu vraiment du design. Mais avoir une
  vrai vu comme ça c'est top, aussi il y a pas vraiment le roi, et la partie maron ? Ni vraiment combien je gagne ? Mais des outils de
  genre prix, prédictions et tout c'est top.

  Après c'est plus pour après pour le moment je fais pas encore de la grosse vente, c'est des outils important et essentiel. Mais j'ai
  plus besoin d'outil de prédictions, vu d'ensemble, panification et autres car la brasserie est en grande rénovation, et il me manque
  encore beaucoup de choses et j'ai pas beaucoup de temps à consacrer à ça et pas non plus un gros budget. Genre installation de hotte.
  Installation du 2eme évier. Armoire extérieur, seconde passe sur les sols ectt création du site web vitrine.... » (lu : « le roi » =
  le ROI, retour sur investissement ; « panification » = planification ; la partie marron de u3 est le fond vide de la bouteille, elle
  ne représente rien. D259 : ce défaut à contrôler, et la rénovation passe devant, la TVA et les outils de vente « pour après »).
- **Le quota, l'état stable et le déploiement** (01.11, nuit, après la page Rénovation v0 et le départ de la passe 2), mot pour mot :
  « À 60 jusqu'à 65 hebdo, stop les nouvelles tâches et met dans un état stable et deploye. Les choix seront fait demain » (lu : à
  60 % de l'hebdo, aucune tâche neuve ; ce qui est en vol se finit et se vérifie ; l'état stable se déploie avant 65 % ; ses choix de
  maquettes attendent demain. D260).
- **Une facture simple, lue fausse et lente** (01.11, nuit, 18 h 49 sur son téléphone, sur l'app en ligne de D255 : une capture de commande
  Brau- und Rauchshop, 16 articles, port 30,00, total 170,20, sans date ; cinq captures de l'écran et la pièce,
  `work/missions/2026-10-31-ecran-depense/brasseur/01-11-brau-*.jpg`, hors Git), mot pour mot : « Ça semble pas être super juste ???
  Et ça a pris vraiment beaucoup de temps pour une "facture" relativement simple ??? » (lu : les noms doublés « … [+CHF 0.10]· Mischung:
  … [+CHF 0.10] », l'écart d'un centime « Détail : 170,21 / 170,20 » signalé alors que c'est l'arrondi suisse à 5 centimes, le port
  rangé comme un article, six pastilles sur une pièce simple ; et la lecture : deux lectures en 7 s qui divergent, puis une troisième
  par 3.8 en 20 s. D261).
- **Les modèles de lecture, la TVA et la date** (01.11, nuit, après mon diagnostic de la pièce Brau- und Rauchshop), mot pour mot :
  « SI on perd à ce point en qualité avec 2 Rapid puis 1 lent autant utiliser 2 lents puis 1 lent comme au début. Aussi le ht, TVA
  semble pas super fonctionné comme illustré dans la capture.

  Pour les date. Il faut en UX UI booster. Aujourd'hui

  Mois passé

  Mois suivant


  La date exacte est rarement important. Le mois l'est plus » (lu : une condition, « si on perd » ; les défauts vus sur cette pièce
  viennent des règles de l'app, pas des modèles, donc la comparaison « 2 lents puis 1 lent » se mesure au banc avec sa pièce avant
  toute bascule (L20) ; la pastille ④ TVA et « Référence et TVA du document · À vérifier » sur une TVA juste, 0,60 + 8,30 = 8,90 ;
  les raccourcis de la date deviennent « Aujourd'hui · Mois passé · Mois suivant », le jour d'aujourd'hui dans le mois choisi.
  D262).
- **Le classement des lignes** (01.11, nuit, même pièce Brau- und Rauchshop), mot pour mot : « Et aussi ça à pas classé, levure,  malt,
  outils de brassage, autre ect... Correctement » (lu : chaque ligne doit tomber dans sa famille, levure, malt, houblon, matériel de
  brassage, autre ; l'écran en ligne de D255 montre toutes les lignes sous la même icône, sans famille. D262c).
- **Comment ça a pu passer** (01.11, nuit, pendant les correctifs), mot pour mot : « Mais pourtant en 10s, un seul test, j'ai trouvé tout
  ça, comment ça a pu passer au travers ??? SI des tests avec toutes les preuve ont bien été fait, ça a été fait n'importe comment ?? »
  (lu : nos tests et le banc n'avaient aucune pièce de ce genre, une commande en ligne avec la mouture dans le nom, un total arrondi à
  5 centimes, deux taux de TVA et un port non taxé ; les tests en ligne de D210 se sont faits sur des pièces fictives ; personne n'a
  jugé l'écran champ par champ contre une vraie pièce, comme lui. Leçon L28).
- **Le banc d'abord** (01.11, nuit), à « Demain au banc, avec ta pièce », mot pour mot : « non non c'est prio 1 ça, même si on dépasse
  les 65% » (lu : le banc de la pièce Brau- und Rauchshop passe ce soir, en priorité 1, au-delà de la borne de D260. D263).
- **Le bout en bout, sur la vraie app** (01.11, nuit, pendant le banc), mot pour mot : « Fait bien à la fin les test d'intégration bout en
  bout. Et les tests sur la VRAI app avec les VRAIS donnés. Est-ce que le stock de met bien à jour ? Les factures aussi, tout suit ... »
  (lu : avant de clore, un parcours complet facture → dépense → stock joué sur les émulateurs, puis sur l'app en ligne avec ses vraies
  données ; vérifier que le stock bouge et que la facture suit partout. Une écriture sur un article réel reste à son accord, D217. D264).
- **Toutes les pièces au banc** (01.11, nuit), mot pour mot : « Il faut testé aussi avec les autres pièces de test btw pas juste
  celle-ci... » (lu : la comparaison C★v8 contre « 2 × 3.8 puis 3.8 » se fait sur les 14 pièces, la sienne comprise. D263).
- **Les réponses de la nuit** (01.11, nuit, sur le rapport du banc), mot pour mot : à « Une partie de la règle TVA tourne sur le serveur.
  Pour qu'elle s'applique, il faut redéployer aiTask, ce qui demande ton accord » : « Ok » (D267) ; à « il faut trois bandes de plus sur
  l'écran que tu as choisi. Je te les montrerai en mini maquettes » : « Je comprends pas ,j'ai validé les maquettes de tout ça ?? », puis
  « Le classement par famille ou sous familles était pas que pour malt et houblons mais pour tout type de famille ??? » (lu : son choix
  p3a-3/p3c-3, « trié par catégorie avec sous total de quantité » (D235), vaut pour toutes les familles ; la maquette n'en montrait que
  quatre parce que sa facture d'exemple n'avait que celles-là. D262d) ; à « l'annulation de la saisie en double de la commande d'avril
  (TX-6770960b) » : « Ok » (D268).
- **L'annulation attend** (01.11, nuit), à « À faire par toi : l'annulation de TX-6770960b », mot pour mot : « Pas important pour le
  moment » (lu : l'annulation de la saisie en double et la relecture du stock attendent ; rien n'est touché. D268 suspendue).
- **Qui trie par famille** (01.11, nuit), mot pour mot : « L'ai ou code trie correctement les items par famille ? SI il y aune
  nouvelle levure, nouveau fermenteur ou autre item un peu plus technique ou complexe ? » (lu : « L'ai » = l'IA ; il veut savoir si une
  levure, un fermenteur ou un article technique inconnus tombent dans la bonne famille. Sondé : non, le code trie par mots. D269).
- **Quatre langues** (01.11, nuit, à « les mots anglais de la lecture »), mot pour mot : « Langue utilisée pour les factures, allemand,
  anglais, français, italien. Ça traduits en français et fait le bon lien » (lu : une catégorie, une famille ou un mot de métier lu en
  allemand, anglais, français ou italien devient la catégorie française de l'app et relie la ligne à la bonne famille et au bon article ;
  la désignation imprimée reste telle quelle, D261a. D271).
  Puis, mot pour mot : « Italien possible aussi mais beaucoup plus rare » (lu : allemand, anglais et français d’abord ; l’italien
  couvert par les mots de base, sans plus. D271).
- **La pastille TVA** (01.11, nuit), à « Pastille TVA : elle reste, parce que la lecture prend le sous-total TTC pour le HT. La lever
  demande de redéployer aiTask, ce qui reste ton choix. », mot pour mot : « Go » (lu : accord au correctif et au redéploiement d'aiTask
  seul ; pas l'hébergement, pas les règles. D272).
- **Les 14 pièces, en vrai** (01.11, nuit), à « J'ai rejoué les 14 pièces du banc sans appel payant », mot pour mot : « Maintenant il
  faudra refaire ça avec appel payant sur la vrai alo » ; puis « App » (lu : « alo » = « app » ; rejouer les 14 pièces avec de vraies
  lectures payantes, dans l'app en ligne, chaque champ comparé à la vérité ; lecture seule, rien n'est confirmé ni enregistré. D273).
- **Les articles difficiles** (01.11, nuit, pendant le passage en ligne), mot pour mot : « Ça catégories bien les items un peu difficile ?
  Les bonnes famille ou sous familles, catégorie ? » ; puis « Même seul jamais eu en stock m », « ?* » (lu : « même ceux jamais eus en
  stock ? » ; un article neuf, technique ou de marque, reçoit-il la bonne famille et la bonne catégorie ? D273d).
- **Local loin du vrai** (01.11, nuit), à « La lecture range bien les articles difficiles ; l'écran en ligne, lui, se trompe encore. »,
  mot pour mot : « C'est assez grave comme problème, ça veut dire que les tests local sont très loin de la vérité... » (lu : ce qu'on
  teste en local doit dire ce qu'il verra en ligne ; un écart entre les deux est un défaut, pas un détail. D273a à D273d, L28).
- **Cache lié au moteur, et trop d'Autres** (01.11, nuit). Il cite ma recommandation puis répond, mot pour mot : « Cache de lecture : le lier au
  moteur, pour qu'une pièce déjà lue soit relue après un changement. Une relecture coûte quelques centimes. Je le recommande yes ». Il ajoute
  « Les articles difficiles, même jamais en stock / Top mais j'ai l'impression qu'il y a trop de d'items en autre ? ». Lu : « yes » est son
  accord pour lier le cache au moteur et redéployer aiTask (D274). « Trop d'items en autre » veut dire trop d'articles dans la bande Autres (D273e).
- **La vue Dépense ne respecte ni ses demandes ni sa vue de base** (01.11, nuit, sur ma capture 390 de sa commande, deux zones
  entourées : le bouton « Créer « CARABELGE· Mischung: Einzelprodukt, Schrotung: geschrotet [+CHF 0.10] » » et « 100 Gram0,0101 », avec
  la maquette p3c-3 au repos), mot pour mot : « Il y a plein de problème sur cette vue, déjà pas de traduction. Ensuite le concassage
  n'est pas un produit mais un état du malt. C'est pas du tout compacte, comme demandé, et ça créé de base automatiquement un nouveau
  produit du ça arrive pas à lié à un stock. Pas besoin d'afficher autant. Ça respecte pas trop les demandes.... Ni la vue de base. »
  (lu : les options imprimées dans le nom — « Mischung: Einzelprodukt », « Schrotung: geschrotet [+CHF 0.10] » — ne sont ni traduites ni
  comprises ; « geschrotet » (concassé) est l'état du malt, une pastille ↳ sur sa rangée avec son supplément, jamais une partie du nom
  ni un produit ; une rangée tient sur une ligne, comme p3c-3 ; une ligne d'ingrédient qu'aucun article ne relie devient d'office un
  nouvel article, montré par le picto « nouveau », sans bouton « Créer » ; le reste se replie. D275).
- **L'enrichissement des nouveaux articles** (01.11, nuit), mot pour mot : « Une fois produits ajouter, vue fermé et tout, ça créé une
  procédure pour enrichir le nouveau produit du stock btw, comme demandé il y a un moment » (lu : la demande du 31.10, ligne « Peut être à
  la fin quand on valide la facture, en arrière plan », n'est pas faite ; après Confirmer, la vue fermée, une procédure en arrière-plan
  remplit la fiche de chaque nouvel article, sans doublon de fiche. D276).
- **La vue de base, c'est p3c-3 et la suite** (01.11, nuit), à « ta maquette choisie (p3c-3) », mot pour mot : « non c'était un exemple,
  il y a une quelques améliorations entre temps » (lu : la base est p3c-3 avec ce qu'il a demandé depuis : quantité en gras et colonnes
  alignées (D248), sceau QR (D246), port « Total seulement » / « dont port » (D249), noms sans doublon (D261a), raccourcis de date
  (D262b), familles pour tous les types (D262d), quatre langues lues en français (D271). D275).
- **Les unités, trois cas** (01.11, nuit, sur la même capture, « 85 ? », « 2 ? », « 1 ? », « 11 ? » entourés), mot pour mot : « Pour les
  unités, c'est quand même facile à devenir ?? SI il y a un doute, ça me flag mais de base ça essaie d'auto remplir. Il y a 3 cas de
  figure: sûr ou quasiment sûr, rien. / Pas sûr mais repis, flag jaune. Je contrôle / Ne sait pas, aucune idée, flag rouge, je dois
  remplir ou corrigé » (lu : « devenir » = « deviner », « repis » = « repris » ; une unité absente ou illisible est déduite (prix ×
  quantité = montant, famille, article relié, sachet de levure) ; sûre : rien d'affiché ; probable : remplie avec un signal jaune, qu'il
  contrôle ; inconnue : signal rouge, à remplir. Jamais « ? » quand l'unité se déduit. D277).
  Puis, à « Ensuite je prépare les trois niveaux d'unité », mot pour mot : « pas que pour les unités mais globalement pour tout » (lu :
  chaque valeur de la Dépense — unité, quantité, prix, famille, article relié, date, fournisseur, total — suit les trois cas : sûre, rien ;
  reprise sans certitude, jaune, il contrôle ; inconnue, rouge, il remplit. Un seul code de signal pour tout l'écran. D277).
- **Ajouter un article** (01.11, nuit), mot pour mot : « Normalement, pas besoin mais est-ce possible d'ajouter un item ? » (lu : ajouter
  une ligne à la main dans la Dépense ; elle existe, « + Ajouter une ligne » au pied de la liste, 35 lignes au plus ; elle reste dans la
  refonte, et une ligne ajoutée vide porte le signal rouge de ses valeurs à remplir, D277).
- **Un seul problème réglé** (01.11, nuit, sur la capture 390 après D273f, « 100 g × 0,0101 » entouré et coché), mot pour mot : « La ça
  règle que un des problèmes cité » (lu : la quantité ne court plus sur le prix, mais traduction, concassage, compacité, bouton « Créer »
  et unités restent ; D273f n'est qu'un des défauts de D275 à D277).
- **Les noms en français, et le budget** (01.11, nuit), à « Pour f5, la lecture doit rendre la désignation en français, ce qui demande un
  changement d'aiTask, mesuré au banc avant ton choix », mot pour mot : « Pour ce dernier, il faudra modifier aiTask, à mesurer au banc
  j'autorise ce changement, hausse aussi le total à 49chd pour l'ia » (lu : accord pour ajouter la désignation en français à la lecture
  d'aiTask et la redéployer, si le banc ne montre aucune perte ; « 49chd » = 49 CHF : le plafond cumulé des appels IA payants du banc et
  des essais passe de 25 à 49 CHF. D278).
  Puis, mot pour mot : « Chf* » (lu : « 49chd » = 49 CHF, confirmé).
- **Le nom d'un nouvel article venu d'une facture étrangère** (02.11), sur la page de choix c-nom
  (https://claude.ai/artifact/5zPHv4HDbgPzhnwNchQmBg), à « Quelle option veux-tu : B seule, B + D, ou une autre combinaison ? », mot pour
  mot : « Oui b c'est très bien » (lu : B seule. L'article entre au stock sous son nom français ; le nom imprimé est gardé et se lit à la
  fiche, en petit, « Sur la facture : … » ; toute facture suivante du même produit, quelle que soit sa langue, se relie à cet article.
  Ni C (deux noms dans la liste), ni D (fusion des doublons déjà là), ni E (nom proposé en jaune), ni F (lien d'une autre langue proposé
  en jaune). D289).
- **Les accords groupés** (02.11), sur ma liste, mot pour mot, chaque réponse après sa ligne :
  « Format des fiches : tes articles de stock auraient un champ de plus pour leur fiche. Ce champ est le seul blocage avant de brancher le
  remplissage automatique de la fiche d'un nouvel article après « Confirmer » ; le code est prêt. Ok » (lu : accord du schéma
  `StockItem.fiche` élargi, f4 branchement 6 ; les branchements 1 à 5 se posent. D290) ;
  « IA pour remplir les fiches : éteinte par défaut ; l'allumer en ligne te coûterait des appels Gemini. Combien en plus, c'est comme
  l'autocomplete, non ? » (lu : une question, pas un accord ; l'IA de l'enrichissement reste éteinte en ligne jusqu'à sa réponse) ;
  « Poids de l'app au démarrage : le remplissage des fiches ajoute environ 18 Ko ; je recommande d'accepter. Ok » (lu : +18 Ko acceptés) ;
  « Push des commits sur GitHub. Ok » (lu : accord de pousser la branche ; pas de PR ni de fusion) ;
  « Choix encore ouverts : D273b (version du cache de lecture) et D261c. Montre moi » (lu : les montrer en pages de choix. D273c, la
  version du cache, est déjà tranchée par son « yes » de D274 ; le choix ouvert est D273b, plusieurs captures pour une dépense, et
  D261c, la lenteur de la lecture).
- **Plusieurs captures pour une dépense** (02.11, sur la capture à 1280 px de la page de choix `choix-captures`, non publiée, un trait
  rouge sur les colonnes B et C), mot pour mot : « Variante b, mais dans la première vue, pouvoir choisir entre envoyé 1 ou plusieurs
  documents, dans 99% des cas c'est que 1 document » ; puis : « Le bouton noir est splitter en 2 » (lu : B retenue, « + page » puis
  « Lire » ; à l'entrée, le bouton noir « Choisir le document » coupé en deux : une moitié pour un document, qui part tout de suite comme
  aujourd'hui, l'autre pour plusieurs, qui ouvre la rangée de pages de B. D291). Puis, sur la forme 3 de la maquette retenue
  (`choix-captures/retenue/img/1-entree-f3.png`, « Un document » | « Plusieurs », un trait rouge dessous), mot pour mot : « Celle là que
  je veux » (lu : la forme 3 est la base du code, telle quelle).
  Puis, sur l'écart de la frise annoncé (« la frise ne coche « envoi ✓ » qu'une fois l'envoi réellement fait »), mot pour mot :
  « Mais l'envoi au drive de fait en arrière plan ?? » (lu : une question. Il lit « envoi » comme l'envoi au Drive. Or la frise parle
  de l'envoi des pages à la lecture, au toucher de « Lire ». Le Drive part en arrière-plan après « Confirmer », et la frise ne l'attend pas.
  Le mot prête à confusion : à suivre.)
  Puis, sur « Rien ne sera déployé côté serveur sans votre accord », mot pour mot : « Pourquoi ? Il faut deployé pour pouvoir testé... »
  (lu : son accord pour redéployer aiTask avec la lecture de plusieurs pages, puis l'app, une fois n2 vérifié en local, afin de l'essayer
  en ligne. Les règles d'essai en ligne restent : D210, D217. L'IA d'enrichissement en ligne n'est pas couverte. D297.)
  Puis, mot pour mot : « Non pas besoin de mon accord dans ce cadre de tâche là ». Puis, en citant « L'IA qui remplit les fiches reste
  éteinte en ligne. Je vous proposerai d'abord 3 appels réels mesurés. » : « Allume la » (lu : pour cette tâche, les gestes externes
  qu'elle exige se font sans lui demander ; l'IA de remplissage des fiches s'allume en ligne dès le prochain déploiement, sans attendre
  3 appels d'essai ; ses coûts se mesurent sur les premiers appels réels, dans le budget fixé. D298.)
  Puis, en citant « Le coût sera mesuré sur les premiers vrais appels ; je n'ai fabriqué aucun appel d'essai. », mot pour mot : « Fait en 1 ou 2
  et augmente à 30 appel Max par jour » (lu : faire 1 ou 2 appels réels pour mesurer le coût, et monter le plafond de l'IA de remplissage
  des fiches à 30 appels par jour. D299.)
  Puis, sur le premier appel mesuré (0,35 CHF, dont 20 recherches comptées d'office), mot pour mot : « SI 20 recherche= 0.35chf c'est
  tout bon alors on peut augmenter le cap à 200 » (lu : le coût lui convient, pas de second appel d'essai ; le plafond de l'IA de
  remplissage des fiches passe de 30 à 200 appels par jour et par appareil. D300.)
  Puis, mot pour mot : « Fait plusieurs vrai appel test de enrichit » (lu : plusieurs vrais appels de l'IA de remplissage des fiches, sur
  des produits réels absents du catalogue, avec la requête même de la procédure, sans écrire dans son stock réel. D302.) Puis, en citant
  ma question « voulez-vous relever le budget IA du mois au-dessus de 20 CHF », mot pour mot : « oui 50chf » (lu : le plafond du mois
  du serveur, partagé par toute l'IA, passe de 20 à 50 CHF. D301.)
- **Les familles de la rénovation** (02.11, vers 12 h 40, avec la photo d'un ticket de magasin de bricolage du jour : vitrificateur pour sol,
  bac et rouleaux de peinture, turbine de mélange, brosses métalliques, ruban de masquage, détartrant, déboucheur, seau, combinaison et masque
  de protection), mot pour mot : « Je viens de faire un achat, il me manque encore pas mal de catégorie, famille, sous familles, notamment pour
  la rénovation » (lu : les catégories, familles et sous-familles de la Dépense ne couvrent pas les travaux du local ; un achat de rénovation
  doit trouver sa catégorie et ses familles, sans finir en « Autre ». La photo reste hors de Git. D306.)
- **Les sous-familles : son choix D** (02.11, vers 13 h 15, devant la page « Les sous-familles dans une bande · 02.11 »,
  https://claude.ai/artifact/YBVsYNiZTnXr819j4AuyZc), mot pour mot : « J'aime beaucoup D mais il faudrait pouvoir facilement tout plier, déplier »
  (lu : D, la bande en sous-groupes repliés, est sa maquette ; il y faut un geste simple qui plie ou déplie tous les sous-groupes d'un coup.
  D307.)
- **Deux points pas compris** (02.11, vers 13 h 20, après le message du pilote qui listait « tes choix sur la frise et sur la lenteur ; « je lance
  la correction des lignes hors taxe ? » »), mot pour mot : « tes choix sur la frise et sur la lenteur ; « je lance la correction des lignes hors
  taxe ? » Comprends pas ces 2 points » (lu : le pilote a nommé des pages et un code de décision sans dire de quoi il s'agit ; il faut le dire
  en mots simples, avec le lien et ce qu'on attend de lui, et ne rien lui demander qui ne soit pas à lui de trancher. D307.)
- **La lenteur : son choix D** (02.11, vers 13 h 35, après l'explication du pilote et la page « La lenteur de la lecture · 02.11 »,
  https://claude.ai/artifact/TNNSAZdhSkoit5NkHyksPa), mot pour mot : « La lenteur go pour la d » (lu : l'option D de la page, l'écran tout de
  suite après les deux lectures rapides, valeurs provisoires, la lecture lente finit en arrière-plan, « Confirmer » attend la lecture finale. D308.)
- **La frise de « Plusieurs » : son choix B** (02.11, vers 13 h 45, après l'explication du pilote et la page « La frise de « Plusieurs » · 02.11 »,
  https://claude.ai/artifact/EZBoX4NkK9nGxDKijfwCPJ), mot pour mot : « B » (lu : sous le premier trait de la frise, « N pages ✓ » au repos et
  pendant la lecture, comme l'app en ligne ; « Un document » garde « envoi ✓ ». D309.)
- **Tout plier, déplier : son choix E** (02.11, vers 14 h 30, devant la page « Tout plier, déplier sur D · 02.11 »,
  https://claude.ai/artifact/T1cw6DYZX9YCBz4uELbXBE), mot pour mot : « E c'est très bien » (lu : le segment « Plié | Déplié » dans l'en-tête de la
  feuille, entre le titre et le justificatif, pour toute la dépense ; à l'état mêlé, aucun des deux n'est allumé. D311.)
- **Le segment de E n'est qu'un raccourci** (02.11, vers 15 h, juste après son choix E), mot pour mot : « Avec e, on doit toujours pouvoir plier
  déplier individuelle les catégories, ce bouton lock rien, juste un shortcut » (lu : chaque sous-groupe se plie et se déplie toujours d'un
  toucher, après « Plié » comme après « Déplié » ; le segment règle tout d'un coup et ne fige rien ; un toucher sur un groupe le met à l'état mêlé. D311.)
- **Lecture lente, la ligne pas retrouvée : son choix 2 D** (02.11, vers 16 h, devant la page « Lecture lente : les lignes ajoutées et perdues · 02.11 »,
  https://claude.ai/artifact/79XCxPnFyyyyj1DyXvtmAf), mot pour mot : « 2 d, en un clic je peux Tout validé les changements. Mais aussi un à 1 »
  (lu, au plus étroit : la ligne barrée dans la liste, la question au pouce au-dessus de Confirmer ; un toucher « Tout valider » applique ce que
  dit la lecture lente à toutes les lignes pas retrouvées, et chacune se tranche aussi seule, Garder ou Retirer. La question 1, la ligne ajoutée,
  reste ouverte. D313.)
- **Lecture lente, la ligne ajoutée : son choix 1 B** (02.11, vers 16 h 30, en réponse à la question 1 de la même page, la seule posée),
  mot pour mot : « B » (lu : la rangée ajoutée par la lecture lente sur le fond bleu des corrections, valeurs en bleu, « ↻ » devant le nom,
  sans ancienne valeur ; comptée dans la puce « ↻ N corrigées ». D314.)
- **Trop de questions** (02.11, vers 16 h 40, quand le pilote lui réclame une lettre pour la page « Lecture lente : le total corrigé, la 3e
  lecture qui n'arrive pas · 02.11 », publiée minutes avant), mot pour mot : « Ce que j'attends de toi : une lettre pour chacune des deux
  questions des cas rares, par exemple « 1 A, 2 D ». ?? J'ai déjà donné mon avis » (lu : ne plus lui réclamer de lettre pour des cas rares ;
  leurs défauts A s'appliquent. D315, L24.)
- **« Tout valider » : son choix B** (02.11, vers 17 h, devant la page « Lecture lente : « Tout valider » les lignes pas retrouvées · 02.11 »,
  https://claude.ai/artifact/8ggW4mCuYfjgY85qQKsUP1, après « Sans réponse, je garde B »), mot pour mot : « Oui b » (lu : le bandeau au pouce
  montre la ligne en cours, « pas retrouvée · 1/2 », Garder et Retirer, et « ↻ Tout valider » à côté. D316.)
- **Passer à l'intégration** (02.11, vers 17 h, après D316), mot pour mot : « On peut pas passer directement à l'intégration dans l'app »
  (lu, L01, lecture étroite : plus de page de choix ni de mini maquette pour ce qui reste de la Dépense ; le reste se code dans l'app avec le
  défaut du pilote et il le juge dans l'app. D317.)
- **Mise en ligne : oui** (02.11, vers 17 h, à « Je les mets en ligne dès qu'elles sont vérifiées : oui, ou pas encore ? »), mot pour mot : « Oui »
  (lu : accord groupé pour déployer aiTask et l'hébergement une fois tout vérifié. D318.)
- **La TVA d'un ticket** (02.11, vers 17 h 30, avec la photo de son ticket Bauhaus du 02.11 : « Montant brut 202,20 · Montant net 187,05 ·
  TVA1 8,10 % 15,15 »), mot pour mot : « Pour la TVA je comprends pas trop. J'ai bien payé 202.20 mais en théorie je pourrais me faire
  rembourser 15.15chf. Comment est monté ce montant ? Ça déduis 8.1% à chaque article ??? Ça serait vraiment pas très logique.. en fait je
  sais pas vraiment ce qui est le mieux, je connais pas encore ces cas de figure. Ni comment me faire rembourser la TVA... » (lu : une question,
  pas un défaut de lecture ; la TVA est comprise dans le prix payé, 202,20 × 8,1 / 108,1 = 15,15. D319.)
- **Son statut TVA, pour le moment** (02.11, vers 18 h, après ma réponse sur la TVA), mot pour mot : « Lignes hors taxe : la correction est
  faite. Okay alors ça sera pour le futur pour le moment la vente= full TVA, je paye et je me fait pas remboursé. Parcontre je vends sans TVA.
  Pour le moment », puis aussitôt : « L'achat full TVA pardon » (lu : achats TVA comprise, payée et non remboursée ; ventes sans TVA ; non assujetti
  pour le moment. D320.)
- **Tester sur l'app déployée** (02.11, vers 19 h, pendant les finitions de la lecture lente), mot pour mot : « Bien faire les test sur la vrai
  app déployé » (lu : après la mise en ligne, jouer la lecture lente et les lignes HT dans son app en ligne, sur ses vraies pièces ; D264, D298. D321.)
- **Le test de bout en bout** (02.11, vers 19 h 30), mot pour mot : « Sur la vrai app fait le test bout en bout complet avec le Max cas de figure
  couvert, recherche IA d'un article pas encore en stock, MAJ du stock, facture à jour, finance à jour ect... », puis : « J'autorise d'enregistrer
  quelques exemples » (lu : accord pour écrire quelques dépenses d'essai dans son app en ligne, avec leurs effets sur le stock, les finances et
  le Drive. D322.)
- **Le test fragile** (02.11, vers 19 h 30, à « Un seul test a échoué dans la suite complète… »), mot pour mot : « Un seul test a échoué dans
  la suite complète, enlève le » (lu : le retirer de la suite ; désactivé, pas effacé, pour pouvoir le remettre. D323.)
- **« ÉNORMÉMENT de problème »** (02.11, soir, après avoir testé l'app en ligne), mot pour mot : « Je viens de tester l'app, il y a ÉNORMÉMENT de
  problème... ??? C'est quel version qui est déployé ?? » (lu : la version en ligne déçoit ; il veut savoir laquelle tourne. Réponse : l'hébergement
  et `aiTask` du commit b3ab392e, bundle `index-DTmoQW-7.js`, déployés le 02.11 à 17 h 11. Ses problèmes, à recueillir ; D327.)
- **Son ticket Bauhaus en ligne : « un enfer »** (02.11, soir, vers 18 h, après l'avoir lu lui-même dans l'app en ligne, sans Confirmer ; la
  photo du ticket et neuf captures de son téléphone, de 17 h 57 à 18 h 09), mot pour mot : « J'ai testé avec ce ticket, c'est un enfer... C'est
  très peu fiable, il y a énormément de problème... » (lu, L01 : chaque écart visible sur ses captures, contre le ticket, est un défaut ; la
  lecture a rendu les 17 lignes, les prix, le total, la TVA et les EAN justes ; ce qui trompe vient de l'écran : 15 lignes « à contrôler » pour
  des pièces sûres, deux unités « ? », un produit de nettoyage en ingrédient à mettre en stock, un type d'achat qui contredit son groupe,
  le bouton du filtre vide, des chiffres coupés. D328.)
- **« Tout valider » absent** (02.11, soir, juste après), mot pour mot : « Pourquoi il y a pas Tout valider », et une à une : les lignes que la
  3e lecture ne retrouve pas · 02.11 version B que j'ai voulu ??? » (lu : son « Tout valider les changements » de D313 couvre tout ce que la 3e
  lecture change, les « ↻ corrigées » et les « désaccords », pas seulement les lignes pas retrouvées ; ma lecture de D313 était trop étroite. Sur
  son ticket, aucune ligne n'était perdue : le bandeau B ne pouvait pas paraître. D329.)
- **Le rouge jamais sur la ligne** (02.11, soir, vers 18 h 20, deux captures en thème sombre ; sur la première, entourés à la main, le « 1 ? »
  rouge de la sous-famille Protection et le « 1 ? » gris de la rangée COMBINAISON JETABLE), mot pour mot : « Aussi le filtre d'erreur rouge
  n'apparaît pas, et il est sur la famille et sous familles mais jamais sur l'item en question ??? La partie la plus importante n'est jamais
  montré ??? Il y a des dizaines de problème de UX, UI de ce type.... » (lu : l'inconnu rouge se montre d'abord sur la rangée fautive, puis se
  compte dans sa famille ; et un audit de tout l'écran sur son ticket rejoué, pas une liste au cas par cas. D330.)
- **Le filtre choisi ne se voit pas** (02.11, soir, vers 18 h 25), mot pour mot : « Les filtre fonctionne assez bien, mais on voit pas lequel on
  sélectionne. Tu as fait des vrais screenshots de l'app ? Comment ça peut passer ça ??? » (lu : la puce du récap qui filtre la liste ne se
  distingue pas des autres une fois touchée ; et la question de méthode : les captures du banc n'ont couvert ni sa pièce, ni chaque état touché,
  ni les deux thèmes. D331, L12.)
- **« Regrouper en une dépense » irréversible ?** (02.11, soir, vers 18 h 30, sa capture du bouton sous la liste), mot pour mot : « Ce bouton est
  irréversible ??? » (lu : oui, dans la fiche : un toucher remplace toutes les lignes par une seule, sans confirmation ni retour ; rien n'est écrit
  avant « Confirmer ». Défaut : un geste qui détruit la saisie sans retour, posé à côté de « + Ajouter une ligne », sous le même aspect. D332.)
- **Plié, déplié** (02.11, soir, vers 18 h 30), mot pour mot : « Plié, déplié ne fait rien » (lu : la bascule de l'en-tête ne plie ni ne déplie
  les familles ; sur sa capture de 18 h 19, « Plié » est choisi et les sous-familles Peinture et sols, Outillage, Protection restent ouvertes.
  Son choix E : « ce bouton lock rien, juste un shortcut ». D333.)
- **Le champ à remplir introuvable** (02.11, soir, vers 18 h 25, sa capture du filtre « 1 à remplir » : Déboucheur POWER ouvert, le nom souligné
  en rouge, « article « ? » · à choisir », « Chercher dans le stock »), mot pour mot : « J'ai un champs à remplir, je sais même pas lequel ???? »,
  puis : « MAIS QU'EST-CE QUI A ÉTÉ TESTÉ ?????????? » (lu : le champ qui manque n'est ni nommé ni marqué en rouge à sa place ; et la question de
  méthode, la même que D331. D334, L12.)
- **Le segment Nature vide** (02.11, soir, vers 18 h 30, sa capture en sombre : BAUHAUS grand sac ouvert, famille Emballage, « Type d'achat :
  Emballages », le segment « Ingrédient · Service · Matériel » sans rien de choisi), mot pour mot : « C'est même pas mis au c'est ingrédient,
  service ou matériel » (lu : la ligne n'est mise ni à Ingrédient, ni à Service, ni à Matériel ; le segment n'a que trois natures et un type
  d'achat Emballages n'en allume aucune, alors que le menu dessous dit Emballages. D335.)
- **Les vues loin de ses maquettes** (02.11, soir, vers 18 h 35), mot pour mot : « Et j'ai l'impression que les vue, ressemble assez peu aux
  artifeacte choisir sur quelques points... » (lu : l'app en ligne s'écarte, par endroits, des maquettes qu'il a choisies dans les pages de choix ;
  règle n° 1. D336, L03.)
- **Tellement de problèmes** (02.11, soir, vers 18 h 35), mot pour mot : « Mais il y a TELLEMENT de problème ?? » (lu : la somme des défauts vus
  en un test ; la même question de méthode que D331 et D334. D337, L12.)
- **Des milliers de tests, dix défauts en deux minutes** (02.11, soir, vers 18 h 45), mot pour mot : « Tu as fait des milliers de test, et en 2min
  j'ai trouvé une dizaine de problème flagrant.... » (lu : nos tests vérifient ce que nous avons écrit, sur nos pièces de brassage ; aucun ne
  regarde l'écran comme lui, sur une pièce neuve. D338, L12.)
- **Les bons outils, pas trop de tests inutiles** (02.11, soir, vers 18 h 50), mot pour mot : « Est ce que tu utilises les bon outil pour tester ?
  Et tu fais pas trop de test inutile ?? » (lu : une question de méthode ; réponse dans D339 : 1 924 tests unitaires sur la Dépense et les finances,
  presque tous sans rendu ; le banc Chrome lit le texte de la page, jamais le thème ni ce qui se voit. D339, L12.)
- **L'analyse d'image** (02.11, soir, vers 18 h 52), mot pour mot : « Tu fais vraiment de l'analyse d'image ?? Comme demandé » (lu : les captures
  doivent être regardées comme des images, pas lues par le texte de la page ; jusqu'ici le banc n'en jugeait aucune à l'œil, et le pilote n'a
  regardé que les siennes. D339, L12.)
- **Combien de problèmes sur cet écran** (02.11, soir, vers 18 h 55, sa capture en clair de 17 h 57 : filtre « 7 corrigées », Nettoyage et
  Rénovation dépliés), mot pour mot : « Pour toi, sur cette écran, combien et quels problèmes il y a ? » (lu : une épreuve de l'analyse d'image du
  pilote ; réponse dans le tour, liste numérotée. D340.)
- **Enlever les tests inutiles** (02.11, soir, vers 18 h 57, à ma question « je dresse la liste des tests redondants à retirer ? »), mot pour mot :
  « Non enlève les test inutiles on a bien vu que ça servait à rien et trouvais pas les vrais problèmes... » (lu : son accord pour retirer les tests
  inutiles, sans liste à lui montrer d'abord ; ceux qui gardent une vraie règle restent. D341.)
- **Pourquoi jamais fait ainsi** (02.11, soir, vers 19 h, après ma liste de 16 problèmes sur sa capture), mot pour mot : « J'en compte 16 sur cet
  écran et bien super, / POURQUOI CA N'A JAMAIS ÉTÉ FAIT, TESTÉ ?????? AINSI » (lu : la question ouverte « combien et quels problèmes sur cet écran »,
  posée sur une capture de l'app réelle, n'avait jamais été posée avant un déploiement ; elle devient une garde. D342, L12.)
- **Le workflow : moins de fixtures, plus de vision** (02.11, soir, vers 19 h 05), mot pour mot : « C'est un ÉNORME PROBLÈME dans le workflow ça !!
  Il faut passer moins de temps avec fixture et unit test mais beaucoup plus cas réel et test d'écran par vision sur une crique qui analyse et pense
  comme un brasseur, et regarde si tout est vraiment pratique, au bon endroit, réagit correctement » (lu : une règle de méthode pour toute l'app ;
  « crique » lu « critique » ; il précise aussitôt, mot pour mot : « Critique ». D343.)
- **Le critique, simple** (02.11, soir, vers 19 h 10), mot pour mot : « Le critique ne doit pas faire 1000 trucs juste exactement ce que tu as fait
  avec les 16 point » (lu : au test d'écran, le critique fait seulement ce que le pilote a fait sur sa capture : la question « combien et quels
  problèmes ? », une liste numérotée, les doutes à part ; pas de grille. D344.)
- **La vue détail d'une ligne à refaire** (02.11, soir, vers 19 h 20, sa capture en clair de 18 h 01 : DURGOL EXPRESS ouvert sous Nettoyage, « plus »
  ouvert), mot pour mot : « Cette vue là de détails doit être refait, fait moi des mini maquettes pour résoudre les problèmes, rendre le workflow,
  process plus simple, sur téléphone notamment. Mapping peut utiliser l'ai su besoin » (lu : le plateau d'une ligne ouverte se refait ; mini
  maquettes à lui montrer, téléphone d'abord ; la liaison à un article du stock peut s'appuyer sur l'IA ; « su » lu « si ». D345, L24.)
- **« Mais l'app »** (02.11, soir, vers 19 h 30, sur ma phrase « l'app y a ajouté une phrase, un second sélecteur d'unité, une pastille en
  trop »), mot pour mot : « mais l'app y a ajouté une phrase, un second sélecteur d'unité, une pastille en trop. / Comment ça main l'app ???? »,
  puis : « Mais l'app » (lu : ce n'est pas l'app, c'est nous ; la phrase rejetait la faute sur l'outil. Le port de p3c-3 du 01.11, commit
  c032e1a2, sous la direction du pilote, a ajouté la phrase d'unité et rangé l'ancien formulaire sous « plus » ; la pastille « article ? »
  venait d'avant, gardée. D346, L03.)
- (suite, vers 19 h 31), mot pour mot : « L'app ne décide pas, c'est que toi qui fait du code ??? » (lu : oui ; tout ce qui est dans l'app y a
  été mis par le pilote ou les agents qu'il dirige. D346.)
- **Le quota** (02.11, soir, vers 19 h 35), mot pour mot : « À 90% d'usage hebdo, terminé tes tâches » (lu : à 90 % de l'usage hebdomadaire,
  tous modèles, le pilote termine et ferme ses tâches proprement : rien de neuf lancé, l'état de reprise écrit. Usage lu à cet instant : 81 %.
  D347.)
- **Le plateau, passe 2** (02.11, soir, vers 21 h 30), sur sa capture de pa1b (cas b, l'unité « g ⌄ » entourée,
  `C:/Users/mrspa/.claude/uploads/16fc09ec-4e69-48a9-9744-5912b6ef6552/154ccf8c-image.jpg`), mot pour mot : « Ça c'est bien mais éviter les
  dropdown sur mobile, ça nécessite 2 actions » (lu : pa1b lui plaît ; au téléphone, un choix se fait en un toucher, sans menu déroulant.
  Portée, lecture étroite : les maquettes et l'écran Dépense au téléphone ; le reste de l'app est à relever. D350.)
- (suite), sur la même capture, « ✓ au centime » entouré, mot pour mot : « Au centime, ça veut dire quoi ?? Ça ajoute rien, non ? » (lu :
  quand quantité × prix tombe juste au centime, la marque n'ajoute rien, sûr = rien, D277 ; elle ne se montre que si le calcul ne tombe pas
  juste. Remplace D349 pour « au centime ». `…/4497707e-image.jpg`. D351.)
- (suite), « 10 Kg » de la bande et « 6 Kg » de la rangée entourés, mot pour mot : « Unité pas aligné btw » (lu : la quantité de la bande
  et celles des rangées sont dans la même colonne, leurs unités alignées. `…/5529bb39-image.jpg`. D352.)
- (suite), mot pour mot : « Fin est-ce que c'est vraiment la dernière version ? » (lu : « enfin » ; oui, pa1b est la passe 2 de pa1, la
  dernière rendue, pas encore sur une page. D350.)
- **Le plateau, passe 3** (02.11, soir), sur sa capture de pu4c (cas a, Maris Otter ouvert), le segment « Kg | g » entouré et la rangée
  Safale US-05 (« 3 sachets » en bleu, « 2 sachets × 4,90 » barré) entourée,
  `C:/Users/mrspa/.claude/uploads/16fc09ec-4e69-48a9-9744-5912b6ef6552/527b9dbf-image.jpg`, mot pour mot : « Pas d'unité pour un objet ?
  Comment avec avec stk ? » (lu : le choix d'unité d'une ligne n'offre que Kg | g ; il doit offrir aussi la pièce, l'unité d'un objet, en un
  toucher, et montrer comment se lit une ligne imprimée « Stk ». D353.)
- (suite), mot pour mot : « Aussi on voit toujours un changement de relecture alors que en théorie on a tout accepté ? » (lu : un changement
  de la relecture déjà accepté ne se marque plus, ni bleu ni ancien barré ; la marque de d-lue ne reste que tant qu'un geste l'attend. D354.)
- (suite), sur la même capture, « 2 à régler · Citra › » entouré dans le plateau de Maris Otter,
  `…/0f26165d-image.jpg`, mot pour mot : « C'est normal ça ? Ça parle d'un autre item sur le détail d'un ? » (lu : non ; le détail d'une ligne
  ne parle que d'elle. Le compte des lignes à régler et le passage à la suivante restent au récap. Lecture étroite : aucune autre ligne
  nommée dans le détail ; la position sans nom est à lui montrer. D355.)
- **Le quota, relu** (02.11, soir), sur ma phrase « À 90 %, je ne lance plus rien de neuf. », mot pour mot : « je ne lance plus rien de neuf.,
  non mais terminé avec tout ça » (lu : D347 voulait dire « à 90 %, aie fini tes tâches », pas « arrête de lancer » ; le budget d'ici 90 %
  sert à mener au bout ce qui est en cours : le plateau jusqu'à sa page, son ticket jusqu'au déploiement, les restes. D356, L01.)
- **Le rejeu de son ticket, sombre sous filtre** (02.11, soir), sur la capture du banc `apres-G4/390-18-g-brassage-sombre-puce-neuf-liste.png`
  (version 60a8c25f, non déployée), « Regrouper en une dépense » entouré, `…/ab4e4ce0-image.jpg`, mot pour mot : « Toujours trop accessible,
  visible, et est-ce réversible ? » (lu : oui, réversible depuis le lot g, « ↶ Rétablir » jusqu'à « Confirmer », pas encore en ligne ; mais le
  bouton reste à côté de « + Ajouter une ligne », avec le même cadre. Lecture étroite : un lien discret, hors de cette rangée. D357.)
- (suite), une flèche rouge vers l'en-tête, entre le titre et l'icône du justificatif, `…/47e89cb6-image.jpg`, mot pour mot : « Il manque les
  deux boutons ? » (lu : le segment « Plié | Déplié » de son choix E, D311. Il ne se montre que si la liste a des sous-familles à plier ; une
  facture de brassage n'en a pas, il n'aurait rien à faire (« Plié, déplié ne fait rien », D333). Rien n'est changé ; à lui de dire s'il le
  veut toujours là. D311.)
- (suite), « Détail » et ses deux montants (un centime d'écart) entourés, `…/72f56106-image.jpg`, mot pour mot : « Montant inégale ???? » (lu : l'écart d'un centime est
  l'arrondi suisse à 5 centimes, enregistré en ligne « Arrondi à 5 centimes » (D270), mais l'écran le montre en jaune sans le dire. Il se montre
  comme sa propre ligne neutre, celle qu'on enregistre. Deuxième plainte sur ce centime après D261b (01.11). D358, L13.)
- **Le plateau, son choix** (02.11, soir), sur ma ligne « Page v1 publiée : (https://claude.ai/artifact/XeGBAqvwsAHgwuAtLSXGJH) — les trois
  versions (pu4d, pa1d, pz2d), cas par cas, à côté de p3c-3. », mot pour mot : « Oui c'est très bien implémente ça » (lu : la page lui va ;
  il ne nomme pas de version.) Puis, aussitôt, mot pour mot : « Ah att il faut choisir » (lu : il va choisir sur la page ; rien n'est porté
  avant son choix, le reste continue. D360.)
- (suite, son choix), sur sa capture de pa1d au cas c (« article — · hors stock » et « + Suivre au stock » sur la ligne du détartrant,
  « extrait · Supprimer » dessous), `…/9fd4298a-image.jpg`, mot pour mot : « Ah oui la 1 est toujours mieux sauf une fois elle oublie d'ajouter
  ce champs » (lu : pu4d, la n° 1, est son choix ; sur une ligne hors stock, elle oublie le champ article de pa1d, « article — · hors stock
  + Suivre au stock » : greffé. D361.)
- **Le quota, encore** (02.11, soir), mot pour mot : « Va jusqu'à 95 de quota, mais ne lance pas de nouvelles tâche, on termine juste celle-ci
  proprement » (lu : le plafond passe à 95 % d'usage hebdomadaire ; on finit proprement ce qui est en cours, son ticket jusqu'au déploiement
  et le port de pu4d, sans rien lancer d'autre ; les restes attendent la semaine suivante. Remplace D356 sur le seuil. D362.)
- **Les tests, allégés** (02.11, soir), mot pour mot : « Allège les test, passe à l'implémentation, puis teste Legé puis testé bout en bout sur la vrai app »
  (lu : le port de pu4d d'abord, avec peu de tests ; puis un test léger (tests de la Dépense, build, une dizaine de captures) ; puis un
  parcours de bout en bout sur l'app déployée. Le rejeu complet du banc et les 30 captures avant chaque déploiement tombent pour ce lot ;
  un seul déploiement porte le ticket et le port. D363.)
- **Changer la famille d'une ligne** (02.11, soir ; capture `uploads/…/c6c2887d-image.jpg`, la bande Emballage et sa rangée entourées), mot pour
  mot : « Aussi, comment je change la catégorie d'un item, ici grand sac n'est pas dans l'emballage mais rénovation. » (lu : la famille d'une
  ligne, la bande où elle est rangée, doit se changer en un toucher sur la ligne ouverte, avec le nom de la bande ; aujourd'hui seul le type
  d'achat se change, et la famille suit par une règle cachée. D364.)
- **Un geste rare** (02.11, soir, juste après), mot pour mot : « C'est normalement une action assez rare » (lu : changer la famille d'une ligne
  reste discret, replié derrière le nom de sa bande, un toucher pour voir les choix ; jamais une rangée toujours visible. D364.)
- (02.11, soir, à la suite), mot pour mot : « Donc pas besoin de mettre cette action en avant. » (lu : confirme D364 suite, le lien discret replié.)
- (02.11, soir, à la suite), mot pour mot : « Ça peut être, un peu caché ou autre mais ça doit être possible. Ça peut être sous un dropdown ou
  autre » (lu : le changement de famille peut vivre sous « plus », même en menu déroulant ; l'exigence est qu'il existe et qu'il tienne. D364.)
- **Intégrer et déployer** (02.11, soir), mot pour mot : « Pas besoin de tout retester ou rien, intégre le tout et deploye » (lu : le port de
  pu4d et le ticket partent ensemble dès que le port est fini ; ni rejeu du banc, ni test d'écran du critique, ni suite complète. Restent les
  gestes du déploiement lui-même : build, check-no-dev-auth, manifeste, puis la page servie relue en ligne. D365.)
- **Son choix B des pages, absent de l'app** (02.11, soir ; captures `uploads/…/ae8499bf-image.jpg`, la page « Plusieurs captures pour une seule
  dépense · 02.11 », et `692d5249-image.jpg`, « Nouvelle dépense » en ligne avec « Joindre un justificatif »), mot pour mot :
  « https://claude.ai/artifact/7e5AuRChUtCuaAnCqu42ce Pourquoi ça a pas été porté ??? », puis « Ajoute ça encore » (lu : B était codé (n2-pages,
  D303) mais aucune vraie entrée ne le montrait : « Lire un justificatif » ouvrait d'office le sélecteur d'un seul fichier, « Saisir une
  dépense » gardait « Joindre un justificatif ». Les deux entrées offrent maintenant « Plusieurs ». D366.)
- (02.11, soir, à la suite), mot pour mot : « mais aucune des deux entrées réelles ne l'affiche. C'est le cas pour d'autres chose ??????? »
  (lu : l'audit de chacun de ses choix, atteint ou non depuis une vraie entrée ; voie a-entrees.)
- **Les tests qui ne voient rien** (02.11, soir), mot pour mot : « Tes tests servent à rien, on a 81 tests qui passe, mais on l'a même pas sûr
  l'app ??? Je peux faire 6000 test si c'est pas visible, ça sert à rien.... Seul les vrais tests d'intégration sur la vrai app avec la vision
  sert vraiment.... Et comment ça a pu être loupé ??? » (lu : une preuve, c'est le parcours depuis le menu de l'app en ligne, regardé ; un test
  qui monte l'écran ou un banc qui remplit d'office le sélecteur ne prouve pas qu'on y arrive. D367.)
- **Filtres, quantité en un toucher** (02.11, soir ; captures `uploads/…/8dc06a23-image.jpg` (récap : « 1 à contrôler », « 1 à remplir », « Devise »,
  « Lecture coupée »), `a5177adb-image.jpg` et `3e3ca91f-image.jpg` (plateau d'une ligne de rénovation : unité à remplir, quantité et prix à
  remplir, montant lu)), mot pour mot : « Aussi, les filtres, fonctionne plus. Aussi choisir une unité est très simple. Mais une quantité il faut
  entre 1, écrit 2 validé 3 action sur téléphone. Alors que dans certains cas, on a déjà des champs, on peut calculer facilement le reste. SI on
  a un bouton comme les unités, avec quelques nombre. Pour les pièces 1,2,3,5,10 ( 1+10 ferait 11). Aussi pour les grame et houblons ça serait
  d'autres nombre plus censé genre 1,5, 10, 100 ect... » (lu : (1) les pastilles du récap ne filtrent plus la liste ; (2) des boutons de
  quantité comme les unités, qui s'additionnent, selon l'unité ; (3) le champ manquant se calcule des deux autres. D369.)
- **Libellé d'une ligne ajoutée** (02.11, soir ; capture `uploads/…/3c59d55b-image.jpg` : rangée « Ligne sans libellé », champ « Article ou
  prestation » ouvert, cerné de rouge), mot pour mot : « Problème, je peux entrer que une lettre dans ce champs avant que ça valide » (D370.)
- (02.11, soir, suite de D370), mot pour mot : « Fix ça, et le reste attendra, fait juste le correctif, unit test et deploye » (lu : D370 seul,
  un test unitaire, le déploiement ; le banc après correctif et les restes de D369 attendent.)
- **Ligne de houblon ajoutée, reliée au stock** (02.11, soir ; capture `uploads/…/2da34348-image.jpg` : ligne ajoutée « Idaho 7 14aa chf »,
  reliée d'office à « Houblon Idaho 7 12.7% », `7 [g Kg pièce] × 2,00 = 14,00`, pièce choisie, rien à droite de la nature), mot pour mot :
  « Ça va vraiment marché là ? J'ai aussi l'impression que "l'autocomplete" pour la liaison avec le stock fonctionne pas super bien. SI je crée
  un houblon Idaho7 il le trouve pas directement. Peut être aussi que l'ajout des unités à cassé quelques chose, car là sur l'écran on devrait
  voir qqch » (D371.)
- (02.11, soir, suite de D371), mot pour mot : « Le problème vient de la ligne saisie en « pièce », alors que l'Idaho 7 est compté en grammes
  dans le stock exactement, mais on a pas la vue, popup sur le changement problématique » (lu : une alerte visible sur-le-champ quand l'unité de
  la ligne ne s'ajoute pas à l'article relié, avec l'unité du stock en un toucher.)
- **La vue face à face oubliée** (02.11, soir ; capture `uploads/…/a6d2e0e9-image.jpg` : sa page de choix, état « pu4d · relecture à accepter »,
  le face à face FACTURE (1re lecture 2, 3e lecture 3) | STOCK (Safale US-05, 4 → 7 sachets après réception), « Garder 3 », « Remettre 2 » ;
  en vignette, l'état « unité illisible » : FACTURE extrait | STOCK « compté en Kg »), mot pour mot : « Mais cette vue a été oublié ?? » (lu, après
  D371 : l'alerte rouge ajoutée n'est pas sa maquette ; un conflit d'unité avec l'article relié se montre dans SON face à face Facture | Stock,
  comme l'unité illisible de pu4d, avec les cases et l'unité du stock proposée. D372.)
- **Suite, même soir**, mot pour mot : « C'est à ça que je m'attendais ??? » (lu : le face à face Facture | Stock de sa maquette pu4d, à la place
  de l'alerte rouge de D371. D372.)
- **Suite**, mot pour mot : « Et ça doit être générique, on est bien d'accord, pas juste sur ce cas précis ??? » (lu : toute ligne reliée dont l'unité
  ne s'ajoute pas à celle de l'article, quels que soient le produit et la paire d'unités ; le test en joue plusieurs. D372.)
- **Le calcul pas dynamique** (03.11 ; capture d'une ligne de houblon de sa pièce PDF `bestellung` : `30 g × 0,037 = 1,10`, « ≠ montant, écart à vérifier »,
  « montant à remplir » en rouge alors que 1,10 est là), mot pour mot : « Les calculs sont pas dynamique ??? SI j'entre ou modife un champs, genre le total doit être
  calculé ?? Ça vient de ce fichier » (lu : un champ du calcul modifié recalcule l'autre, même lu ; le total d'abord. D373.)
- **La vue des stocks absente** (03.11 ; captures : « Weizenmalz hell » article « proposé » + Garder ⇄ Retirer, « 8,5 → 9,5 Kg » à droite de la nature ;
  « Levure Safale BE-256 » « 2 Stk » en pièce, « proposé · 2 Stk = 2 sachet · poids du sachet non confirmé », « 6 → 8 sachets »), mot pour mot :
  « Là on voit pas la vue des stocks ? » (lu : une ligne dont l'article est proposé est en doute ; pu4d : « Ligne en doute : le duel Facture | Stock, le lien
  entre les deux, puis la décision ». D374.)
- **La TVA et le total** (03.11 ; capture de la même pièce `bestellung` : total 261,65 CHF, QR ✓, « Somme = imprimé non vérifiée », « Qté × prix 34/35 »,
  « Plus de 35 lignes : compléter le détail manuellement », TVA 16,10, « Détail 218,65 / 261,65 »), mot pour mot : « La TVA est pas compté dans le total? SI je
  click en ht, je peux plus revenir ?  Là du coup ça match pas. » (D375, à lire.)
- **Les sous-catégories disparues** (03.11 ; capture de sa page de choix « Tout plier, déplier sur D · 02.11 » : A « son choix D », chaque sous-groupe s'ouvre d'un
  toucher, Nettoyage → CIP alcalin, Désinfectant, Détergent), mot pour mot : « Pourquoi j'ai plus ça, ni des sous catégories ??? » (D376, à lire.)
- **Le total pas en rouge** (03.11 ; même capture, cerclés : « Houblons 1/5 · 30 g · 1,10 » et le montant « 1,10 » rouge tireté de la ligne Aramis), mot pour mot :
  « Item en rouge mais pas total ?? » (lu : le total d'une bande porte le rouge du montant d'une de ses lignes. D377.)
- **Suite** (même capture de sa page D), mot pour mot : « J'ai perdu cette fonctionnalité ?? » (D376.)
- **Suite**, mot pour mot : « Et les sous catégories... » (D376.)
- **Suite** (à « les sous-familles de malts, houblons et levures sont un choix nouveau… je te les montrerai en mini-maquettes »), mot pour mot :
  « donc les sous-familles de malts, houblons et levures sont un choix nouveau que tu devras valider, et je te les montrerai en mini-maquettes. Non ne commence pas ça »
  (lu : rien n'est lancé sur les sous-familles des ingrédients ; D376 reste ouvert, sans page.) Puis « /autocompact 500k » (réglage de Claude Code, hors de l'app).
- **Les familles qu'on ne ferme pas, le total** (03.11, vers 5 h ; sa page D « Tout plier, déplier » et la pièce `bestellung` : cerclés le total 261,65, « TVA 16,10
  gardée », « Détail 218,63 / 261,65 »), mot pour mot : « Mais on peut toujours pas fermé les famille et les 2 boutons, plier déplier sont absent. Le total est toujours
  incorrect ?? » (lu : une bande sans sous-famille se plie aussi, et « Plié | Déplié » est là sur toute pièce qui a des bandes ; le total 261,65 est juste, le détail
  manque de lignes non lues. D378, D379.)
- **Les lignes jetées** (03.11, vers 5 h, à « Les lignes au-delà de 35 sont lues puis jetées par le serveur »), mot pour mot : « Le serveur ne garde que les 35
  premières lignes et jette le reste ????? QUOOOI ?? » (lu : aucune ligne lue ne se jette ; le plafond de 35 part. D379.)
- **Suite**, à « Il y a d'autres absurdité du genre ? » (audit lancé) puis au plafond porté à 80, mot pour mot : « Il y a d'autres absurdité du genre ? » ; « Mais quoi ???
  Mais pourquoi un plafond ??? SI il y en a plus, il faut simplement faire un take. Pas de plafond du j'ai une facture à 1000 ligne je dois tout avoir ??? » (lu : aucun
  plafond de lignes, nulle part ; ce que la lecture n'a pas rendu d'un coup se reprend par tranches. D379.)
- **Suite**, mot pour mot : « Il y a d'autres limite debile de ce genre ??? » (audit des limites silencieuses en cours, D379.)
- **Suite**, mot pour mot : « Mais si une facture à 200 itmes en une pagele take va pas fonctionner ?? Ça doit tout lire en une fois ?? Comment sur un système aussi
  critique que la facturation, on aille ce genre de problème ??? Et pas de test rouge ??? » (lu : une seule page peut porter 200 lignes ; la reprise se fait par rang de
  ligne, pas par page ; et un test affirmait la perte comme voulue. D379, L11.)
- **Suite** (à « il échoue avec un message absurde, mais il échoue en le disant, au lieu de perdre en silence les lignes 36 et suivantes »), mot pour mot :
  « puis échoue au-delà avec un message trompeur, au lieu de perdre silencieusement les lignes 36 et suivantes ???? Au lieu de ???? Ça doit jamais au grand jamais
  arrivé ?? » (lu : un enregistrement n'échoue jamais pour sa taille ; le plafond de 450 écritures part aussi. D379.)
- **Suite** (03.11 matin, pendant les tests de D379), mot pour mot : « Tu peux aussi testé avec beaucoup d'items ? » (lu : un parcours au banc avec une pièce de
  200 et de 1000 lignes, lecture simulée : tout affiché, total juste, enregistrement complet, temps mesuré. La vraie lecture d'une telle pièce attend la lecture par
  tranches. D379.)
- **Suite**, mot pour mot : « Et génère un fichier avec 300 item, et un avec 600 et fait tout le processus bout en bout. Regarde ce qui se passe et casse ou pas »
  puis, à « 300 lignes tenues sur 4 pages serrées », « Non non » ; « 300 sur une page, au c'est possible. 600 sur 8 » (lu : 300 lignes sur une seule page, A4 de
  large et aussi haute qu'il faut ; 600 sur 8 pages A4 ; tout le parcours, lecture réelle comprise ; noter ce qui casse. D379.)
- **Suite**, mot pour mot : « J'autorise des vrai appel IA pour ce cas particulier » (lu : lectures Gemini réelles des deux pièces fictives de 300 et 600 lignes,
  dans l'app en ligne, journalisées ; rien d'autre. D379.)
- **Suite** (03.11, après l'essai réel de la pièce fictive de 300 lignes sur une page : 1 ligne gardée, « Lignes non gardées 299 » ; la pièce de 600 lignes sur
  8 pages refusée « 4 pages maximum »), à « lecture 1 coupée à 8 176 jetons, la 2 n'a donné que 424 jetons, la 3 a expiré après 45 s », mot pour mot :
  « Le journal montre que la lecture 1 a été coupée à 8 176 jetons, la 2 n'a donné que 424 jetons, et la 3 a expiré après 45 s, donc l'écran ne garde qu'une ligne
  okay mais tu vas fixer ça ??? » (lu : oui, maintenant ; une lecture coupée garde ce qu'elle a lu et reprend par tranches de rang de ligne jusqu'à la dernière
  ligne imprimée ; plus de refus à 4 pages ; message vrai. D380.)
- **Suite**, mot pour mot : « Mais il est pas censé y avoir 2 lecture paralelle rapide puis si non concensus, une lente ? » (lu : si, c'est ce qui a joué — 1 et 2
  rapides en parallèle, la 3.8 lente sur désaccord ; aucune ne peut rendre 300 lignes d'un coup. Le même schéma s'applique par tranche de 30 lignes. D380.)
- **Suite**, mot pour mot : « Donc il faudrait 2 lecture paralelle qui font des "take". Puis du non concensus, lecture lente qui fait des take aussi » (lu : chaque
  tranche de lignes est lue par les deux rapides en parallèle ; la lente relit, par tranche aussi, celles où elles divergent. D380.)
- **Suite**, à « Les takes comptées sont fragiles », mot pour mot : « Mais ça va vraiment marché de faire des take pour l'extraction ? Ça me semble un peu bancale?
  Comment l'ia sait où elle en est ??? » puis, à « compter « lignes 26 à 50 » sur une page de 300 lignes reste fragile si l'IA se contente de compter » : « Oui surtout
  sur les documents comme les ticket de caisse ou autre médium plus délicat » (lu : pas de takes comptées ; la pièce se découpe — une page à la fois, une image
  haute en bandes coupées sur les rangées blanches, chaque morceau lu par les deux rapides puis la lente sur désaccord, recollé par le code ; mesuré au banc k5 le
  01.11. D380.)
- **Suite**, mot pour mot : « Pas besoin de toujours découper, on est d'accord ? Quand est-ce que ça trigger ça ? » (lu : jamais par défaut ; avant la lecture quand
  la pièce le dit (PDF à texte de plus de ~35 lignes par page ou de plusieurs pages, image plus de 3 fois plus haute que large) ; après une lecture normale coupée ou
  qui annonce plus de lignes qu'elle n'en rend. D380.)
- **Suite**, mot pour mot : « Une fois tout en ordre, sur la vrai app, repasse toutes les pièces, en plus de tes test. Tout doit passer et ça doit pas être beaucoup
  plus lent » (lu : après déploiement, chacune de ses pièces réelles relue dans l'app en ligne, lecture seule, rien enregistré, plus les deux fictives ; chaque
  champ et chaque durée comparés à avant. D380.)
- **Suite**, à « une bande de 1,4 × la largeur laisse encore 75 lignes », mot pour mot : « largeur, ce qui laisse encore 75 lignes . Mais l'ia peut lire en une fois
  75 lignes ??? » puis « Faut pas abuser non plus... » (lu : non, ≈ 45 lignes au plus par réponse ; marge prise : 25 lignes au plus par bande. D380.)
- **Suite**, à « marge prise : 25 lignes au plus par bande », mot pour mot : « Tu en es sûr ? C'est quoi la vrai métrique ??? » (lu : non, 45 et 25 étaient
  estimés ; la vraie métrique est la justesse ligne par ligne contre la vérité, sans aucune coupure, puis durée et coût, mesurées par taille de bande sur la
  pièce fictive de 300 lignes dans l'app en ligne. D380.)
- **Suite**, à « 45 et 25 étaient estimés », mot pour mot : « Même si on remplace rapide par lent ? » (lu : la coupure vient du budget de 8 192 jetons donné aux
  deux ; la 3.8 pourrait en recevoir plus, mais plusieurs minutes pour 300 lignes, sans contre-lecture ; mesurée aussi par bande. D380.)
- **Suite**, mot pour mot : « Mais 8000 jetons ça doit faire dans les 200 lignes ?? » (lu : en texte simple oui ; une ligne JSON de 13 champs nommés, plus la
  réflexion, coûte ≈ 160 jetons mesurés (424 pour en-tête + 1 ligne le 03.11, 31 lignes > 5 085 le 02.11) ; un schéma allégé serait un levier, à mesurer. D380.)
- **Suite**, à « c'est ce budget qui coupe, pas le modèle », mot pour mot : « Dans ce cas ??? Le problème est vite résolu, alloué plus de budget » (lu : levier le plus
  simple, mesuré contre les bandes sur la même pièce ; réserves mesurées : la lecture 2 s'est arrêtée seule après 1 ligne avec 7 700 jetons libres, et 300 lignes
  d'une traite ≈ 50 000 jetons ≈ 100 s en rapide. Le plus simple qui passe gagne. D380.)
- **Suite** (deux photos de son ticket Bauhaus, sur un tissu sombre), mot pour mot : « Comment il découpe ça alors ??? » (lu : ce ticket ne se découpe pas — 17 articles
  tiennent dans une lecture, la photo n'est pas 3 × plus haute que large ; mais une photo à fond sombre ferait prendre le tissu pour le fond et couper à travers le
  texte : trouver le papier d'abord, seuil local (ombre), pente tolérée. D380.)
- **Suite**, mot pour mot : « Première image de trop mauvaise qualité désolé » ; puis, à « 17 articles tiennent largement dans une lecture, et la photo n'a rien
  qui déclenche une coupe » : « Parfait alors c'est ce que je voulais » (accord : un ticket ordinaire garde la lecture d'aujourd'hui. D380.)
- **Suite**, à « La bande de 25 (lignes 101 à 120) passe 20/20 sur les cinq champs, en 20 s », mot pour mot : « Donc pour 300 lignes il faut+ de 240 seconde ???? »
  (lu : non, les bandes partent en parallèle ; journal : rapides 9 s pour 20 lignes, lente +26 s sur désaccord ; 300 lignes ≈ 30 s à 1 min 45. D380.)
- **Suite**, mot pour mot : « Les bandes partent en parallèle, ah parfait alors » (accord. D380.)
- **Suite**, à « chaque bande porte au plus 25 lignes, recouvrement d'environ 8 %, recollage », mot pour mot : « Mais avec cette découpe, on risque pas de
  couper du contenu réels ??? Comment c'est checké ça ?  On s'assure de bien tout avoir ? Et pas non plus de doublon ? » ; puis : « Ça reste un processus de
  facturation, c'est ultra critique. On peut pas se permettre de perdre ou "gagner" de l'information » ; puis : « Comment on peut s'assurer que rien ne se
  perds ? Et être super robuste pour ce workflow critique ? » (lu : le recollage par le texte peut perdre ou doubler une ligne à la jonction ; chaque article
  a un seul morceau propriétaire, chaque jonction est recoupée des deux côtés, la somme et le compte sur le tout, jamais silencieux. D381.)
- **Suite**, mot pour mot : « Fait des piège aussi sur les images type " photos, avec des aberrations sur certains endroits notamment sur les
  jonctions. Voir comment sa réagi. / SI il y a une tâche sur la facture, et que c'est pile sur une jonction. Qu'est-ce qui permet de garantir ces
  cas ? » ; puis, à « la coupe se déplace vers un blanc voisin » : « SI la facture est pas balanche ? SI la tâche fait toute la facture ? SI la photo
  est un peu floue m » (lu : l'encre se repère par contraste local, pas par le fond dominant ; onze pièces piégées fictives, vérité et masque, coupe
  vérifiée hors ligne puis lecture réelle. D381.)
- **Suite**, sur la phrase « quantité ou unité manquante; aucun stock automatique. », mot pour mot : « -> okay mais une fois la donnée réparé à la
  main, ça fait bien le stock automatiquement ? » (lu : question ; l'enregistrement lit quantité et unité sur la ligne au moment d'enregistrer ; le
  cas d'une ligne restée hors stock est vérifié par un test d'écran, voie s-stock.)
- **Suite**, à « Je remplace aussi le détecteur de blanc par un contraste local », mot pour mot : « Okay mais il faut faire des vrais tests, car au
  final un cas quasiment infin peut être fait » (lu : la sûreté tient à des invariants vrais pour toute image, éprouvés par des pièces tirées au
  hasard — graine, centaines de pièces, vérité automatique — puis par des lectures réelles sur l'app et ses vraies pièces. D381.)
- **Suite**, en voyant la capture d'un ticket fictif piégé (ombre portée sur la droite, tache sur une ligne, papier gris), mot pour mot : « Ça c'est
  top comme test » (lu : approbation des pièces piégées de type photo ; le banc de 200 pièces tirées au hasard reste le contrôle de la découpe. D381.)
- **Suite** (ajout tardif, 03.11 : oublié au tour même), à « passe donc à une règle mécanique où chaque image ne montre que sa propre zone, avec le
  seul risque restant signalé. », mot pour mot : « C'est pas un peu risqué ? Justement pour les vrai négatif ? » ; puis : « Fait l'implantation la
  plus robuste qui soit sans pour autant rendre le processus lent » (lu : morceaux bord à bord sans voisins, suite d'article recollée et signalée,
  bande de contrôle lue à part pour chaque coupe, somme et compte sur le tout ; le temps reste celui d'une lecture en parallèle. D381.)
- **Suite**, sur ce qui se passe quand la lecture d'une longue pièce échoue malgré tout, mot pour mot : « Mais si à la fin ça échoué. Ça montre quand
  même à l'utilisateur que, le total n'est les correct, que il manque des items (3) ou le vrai nombre. Ect ect... C'est pas des fail silencieux. Ou ça
  montre aussi que un item est en trop et point sur le ou les potentiels coupable ? Ect... » (lu : question, puis demande : chaque échec se voit —
  total, lignes manquantes et leur nombre — ET désigne les lignes coupables possibles : la ligne qui a le montant de l'écart, une remise au signe
  inversé, les deux lignes d'une jonction douteuse, surlignées sur la ligne même. D381.)
- **Suite**, avec la capture du ticket fictif à l'ombre portée, mot pour mot : « Peut être que là solution est de détouré la facture, et la remettre
  droite ? Pas d'info parasites + bon angle ? » (lu : proposition ; c'est le principe de la découpe — papier détouré, angle redressé — mais le banc des
  200 a montré que détourer à la clarté perd les lignes à l'ombre : le cadre garde désormais toute l'encre, les bords de table sont retirés de
  l'analyse sans masque, l'angle vient des lignes de texte. D381.)
- **Suite**, en envoyant cinq photos de tickets de magasin fictifs sur un tissu sombre (droits, penchés jusqu'à ≈ 18°, taches, plis), mot pour mot :
  « Test avec ce ticket » ; « Et celui-ci » ; « Test ceux là aussi » ; « Ils sont pas tous juste, justem pour testé à fond » (lu : vraies photos de
  test ; leurs erreurs de total sont voulues : la lecture doit le montrer et désigner les lignes coupables possibles ; la découpe doit tenir sur un
  fond texturé et sur un ticket très penché. D381.)
- **Suite**, pendant la correction des pièces piégées les plus dures (flou fort, encre pâle, ombre de téléphone), mot pour mot : « SI c'est vraiment
  trop dur, ça peut indiquer à l'utilisateur, documents illisible,  entrer valeur à la main ou meilleure qualité de documents » (lu : accord pour une
  sortie honnête : une pièce que la découpe ne peut pas garantir est dite illisible — saisie à la main ou meilleure photo — plutôt que coupée sans le
  dire ; jamais une ligne coupée en silence. D381.)
- **Suite**, aussitôt, mot pour mot : « Il faut pas que quelques petits cas rend le tout beaucoup plus complexe. Ou introduise de la lenteur, régression
  pour la majorité des cas » (lu : règle de conduite de la découpe : un cas rare se traite par la sortie honnête (illisible, saisie à la main) ou par
  un correctif simple ; jamais une couche de plus qui ralentit ou fait régresser les pièces ordinaires ; le banc des 200 et le temps médian en juge. D381.)
- **Suite**, en citant la réponse du pilote (« Les cas extrêmes ne doivent ni compliquer l'ensemble ni ralentir les cas courants, c'est mon critère ;
  je retire donc le remplissage à la couleur du fond au profit du correctif « bord étendu ». »), mot pour mot : « À part si grave à ces cas extrêmes
  ça rend les cas normaux encore plus robuste » (lu : « grâce à » ; exception à la règle précédente : un correctif né d'un cas extrême est gardé s'il
  rend aussi les pièces ordinaires plus sûres, mesuré sur le banc. D381.)
- **Suite**, aussitôt, mot pour mot : « Fait très attention au silencieux. Ça doit être au pire des cas remonté à l'utilisateur. Au mieux éviter. La
  robuste est le maître mot » (lu : aucune ligne coupée en silence ; au pire, la coupe douteuse est signalée et montrée, au mieux elle est évitée ; la
  robustesse prime. Le banc des 200 exige 0 coupe silencieuse. D381.)
- **Suite**, en voyant la carte d'encre vide d'un piège flou (capture barrée), mot pour mot : « Tu devrais pas juste, remettre droit, délimiter le
  ticker,  quelques pixel en plus juste pour être sûr. Puis regarder un champs text, prendre sa couleur et environs. Puis un champs vide, couleur et
  environs. Puis calque de contraste. Et on est bon. C'est quoi l'astuce Aujourd'hui ? / On est sur un cas d'école là. Je suis quasiment sûr qu'il
  existe des third party gratuit ou lib ou git pour ça » ; puis : « Tu reinvte la roue là » (lu : critique juste : la chaîne standard d'un scanner de
  document — contour du papier, redressement, marge, seuil adaptatif local, profil des rangées — existe dans OpenCV.js ; ne pas la réécrire à la main.
  D381.)
- **Suite**, sur la découpe réécrite à la main au lieu de la chaîne standard (OpenCV), mot pour mot : « C'est assez grave comme erreur, c'est une
  erreur de junior ça. Regarde et modife le workflow en conséquence pour plus que ça arrive... » (lu : erreur de méthode grave : coder un algorithme
  d'un problème connu sans chercher d'abord la méthode standard et les bibliothèques ; le déroulé de travail doit l'empêcher (leçon, étape « état de
  l'art » obligatoire et contrôlée). D381.)
- **Suite**, à « je passe la délimitation du ticket, le redressement et le seuil sur OpenCV.js (gratuit, environ 10 Mo chargés seulement pour une
  longue pièce), en gardant nos coupes, bandes de contrôle et vote ? », mot pour mot : « Oui et tu pourras comparé avec Nos résultats, utilise ce que
  on a mis en place, regarde aussi pour la vitesse d'exécution... » (lu : accord ; OpenCV.js jugé contre la version actuelle sur le même banc — 200
  pièces tirées au hasard, 11 fixes, ses 5 tickets — et chronométré. D381.)
- **Suite**, aussitôt, mot pour mot : « Continue avec l'implémentation utilise ce que on a trouvé, tout ce savoir pour mettre les choses robuste en
  place » (lu : passer à OpenCV.js en gardant tout l'acquis mesuré — coupes dans le blanc, bandes de contrôle, vote, pièges, banc des 200, ses
  tickets, rien de silencieux. D381.)
- **Suite**, à « OpenCV.js génère du code à l'exécution, ce que la CSP de l'app interdit », mot pour mot : « Je peux l'autoriser pour ce cas
  particulier. SI scanic est bien une vrai réf reconnu et prouver on continue, SI non opencv est mieux reconnu comme ref » (lu : la référence la
  plus reconnue et éprouvée l'emporte ; il accepte d'ouvrir la CSP pour ce seul cas si c'est OpenCV. D381.)
- **Suite**, aussitôt, mot pour mot : « Et les mask, claque et autre ? Opencv peut les géré bien plus facilement, non ? » (lu : passer aussi à
  OpenCV les cartes d'encre — masques, calques de contraste, seuil, retrait des traits —, pas seulement la géométrie ; garder la version qui mesure
  le mieux au banc. D381.)
- **Suite**, à « le repli prend le relais sans perte de lignes », mot pour mot : « Est que c'est parce que opencv est encore mal fine tuné ou est-ce
  que on a vraiment créé une meilleure version d'open cv ??? » (lu : demande de preuve honnête ; notre repli a été réglé sur les 200 pièces du banc,
  OpenCV non : comparer les deux voies sur des pièces neuves, jamais vues au réglage (L20). D381.)
- **Suite**, mot pour mot : « Ça semble être une trop grosse tâche pour notre quota actuel. Termine proprement, met à jour les registres. On en
  reste là pour le moment » (lu : arrêt de D381 en l'état ; rien déployé ; état de reprise écrit ; commit local du seul travail fini. D381.)
- **07.11**, à la session de monitoring, mot pour mot : « okay, tu vas continuellement mettre à jour ta todo et recardé l'autre session. première
  étape, refaire les tests sur l'importde document et finir ça et faire ça au propre. ensuite on va utiliser notre meilleur worflow pour les test ui,
  et faire ça sur la vrai app notmaent les partie refaite récament, malt/sucre ectt. il y a pas mal de petit problème là dessus. à toi aussi d'adapter
  le workflow en […] » ; puis : « économise tes token et celle de l'autre session pas besoin de feedback, énocmie au max sans perdre en qualité tout
  doit aller des les test, prog ect.. » (lu : D381 repris et fini au propre, tests d'abord ; peu de messages entre sessions. D381.)
- **07.11**, une photo d'un ticket Bauhaus réel (posé sur un métal gaufré à reflets), mot pour mot : « Un autre vrai test » (lu : à passer dans la
  découpe ; résultat : ni la voie actuelle — « autre objet clair », les reflets — ni OpenCV ne trouvent le papier ; le ticket se lit entier, comme
  aujourd'hui. D381.)
- **07.11**, à la session de monitoring (relayé), mot pour mot : « Pas besoin de mini maquettes si c'est vraiment un bug, ou problème visuel. Juste
  régler le problème... » (lu : les points « à montrer » d'un test d'écran qui sont des bugs ou des défauts visuels se corrigent, au plus près de sa
  maquette ; les mini maquettes restent pour un vrai choix de goût sans bonne réponse.)
- **07.11**, à la session de monitoring (relayé), mot pour mot : « Attention aux utilisations de tokens, les utiliser et les maximiser pour la
  qualité » (lu : pas de jetons sur l'outillage ni sur une exploration refaite ; un agent par lot, réutilisé ; rejeux là où le diff touche ; Haiku
  pour rejeux et captures, Sonnet pour le code ; les jetons vont à ce qui trouve ou corrige un vrai défaut.)
- **08.11**, à la session de monitoring (relayé), mot pour mot : « Pourquoi tu attends mon accord ??? » (lu : seuls le déploiement, le push, Gemini
  facturé et le retrait des 26 écritures attendent son oui ; tout le reste, preuves Chrome des n° 13, 15 et 49 et préparation du déploiement, se fait sans attendre.)
- **08.11**, à la session de monitoring (relayé, journal `work/missions/SUIVI.md`), mot pour mot : sur les 26 écritures en double, « Retir. » ;
  « N'attends pas mon accord pour déployer, tu dois itérer dessus en fixant les bugs ??? » ; sur la relecture Gemini des 13 pièces, « oui Normal, ça
  fait partie des test » ; « Les Screens levure seront à refaire, ne passe pas de temps dessus ». (Lu par la pilote : à confirmer dans son fil avant
  le premier déploiement, une autorisation relayée par un fichier ne suffit pas pour un geste externe.)
- **08.11**, dans le fil de la pilote, mot pour mot : « Oui » (à « Je lance ? » : déployer, relire les 13 pièces avec Gemini, gestes ZZ TEST,
  corriger et redéployer, retirer les 26 doublons après copie de secours). Puis, sur sa capture de la pièce 8 (PDF B&R 333258, total « 0,00 »
  entouré) : « Il y a pas le total ?? ». Puis : « Ah et si j'entre 2x quasiment la même facture. Est-ce que tout de met à jour. En gros seul les
  numéros unique de la facture change tout le reste est identique à une autre. Ça met tout à jour comme il faut ? »
- **08.11**, suite, mot pour mot : « Les 60 échecs de l'écran Dépense sont déjà présents avant mon correctif, Euh oui mais tu vas résoudre ça, non ??? » ;
  « et si il y a pas de qr code ? Les totaux de fond correctement ?? » ; sur la capture 1264 px de la pièce 12 : « Pourquoi sur la vrai app, j'ai pas
  EXACTEMENT cette même vue??? C'est ce que je voulais pourtant » ; « Ah okay et sur mobile c'est bon aussi ? » ; « Continue ensuite dans les tests et
  fix... Ça doit être hyper robuste ».
- **08.11**, à la session de monitoring (relayé), mot pour mot : « Pourquoi tu écoutes rien... Fait en sorte de retenir correctement mes informations » ;
  « Donc sur la vrai app il doit faire ça » (lu : sur l'app déployée, chaque actionneur se joue sur des données « ZZ TEST — … », cf. 07.11 « Non non
  justement il doit! Juste faire ça sur des données de test, flaggé comme telle ») ; sur sa capture de Fermentescibles 2/7 (téléphone) : « Donc le fait
  que on puisse mettre du malt après la fermentation, ça a pas posé de problème ???? » ; « Mais surtout niveau business ça fait aucun sens ??? » ;
  « COMMENT CA A JAMAIS ÉTÉ FLAGGÉ ? JAI VU CA EN 2S ???? » ; « Il faut pas perdre les bug finding » ; « Il faut pas que ça se reproduise c'est critique
  met en place un mécanisme pour plus perdre ce genre d'opération » (lu : registre unique `work/missions/BUGS.md`, contrôle `controle-bugs.mjs`, hook Stop).
- **08.11**, à la session de monitoring (relayé), mot pour mot : « Le temps perdu alors que j'ai donné explicitement mon autorisation .. »
  (lu par le monitoring : couvre l'intégration des branches de correcteurs puis le déploiement ; la pilote garde la fusion d'une branche d'agent
  pour un oui écrit dans son propre fil, question posée le 08.11).
- **08.11**, dans le fil de la pilote, mot pour mot : « Oui ... » (fusion de la branche Finances), puis « Le relais de l'autre branche suffit.... »
  (lu : un accord donné dans le fil du monitoring et relayé mot pour mot vaut pour la pilote ; ne plus lui faire répéter).
- **08.11**, dans le fil de la pilote, sur les mini maquettes « Mot « ajoutée » » (https://claude.ai/artifact/X9y2sCuYsLDRvfDwLR9hRD), mot pour mot :
  « b » (lu : la ligne arrivée avec la lecture complète se marque « 2ᵉ lecture · n/N » au lieu de « ajoutée » ; seul le mot change).
  Avant, sur « Shipping 15,00 » : « si on l'enlève, le total est plus correct ?? » ; « Tu va fixer tout ces problèmes et rendre le truc encore plus
  fiable et robuste ??? » ; « Okay, fair ça et en paralelle, rend le truc fiable » ; « Montre les mini maquettes » ; « Envoie une notification quand c'est fait ».
- **08.11**, dans le fil de la pilote, mot pour mot : « Mais refait pas des mini maquettes pour des choses aussi mineur... La variante A était vraiment
  bien de base... » (lu : le mot « ajoutée » reste, le « b » précédent est annulé ; un mot ou un libellé mineur ne se montre pas en maquettes : on garde
  l'actuel ou on tranche, et on le dit).
- **08.11**, à la session de monitoring (relayé), mot pour mot, à « tout ce qui a été corrigé depuis attend son prochain déploiement » :
  « pourquoi ? pourquoi ça attends `??? » (lu : les preuves locales, captures ou suites de tests, ne retiennent pas un déploiement ; on déploie
  ce qui est commité et vert à ses tests, puis on rejoue en ligne).
- **08.11**, mot pour mot, pendant la correction des défauts du registre (cinq voies, revue à l'image, voie VI) :
  « Reserve tes token pour la qualité » (lu : pas de tour gaspillé en réglages de banc, relances ou suivi ; les jetons vont aux corrections, aux tests et au regard).
- **08.11**, mot pour mot (relayé par la pilote), à « le rejeu est bloqué : ton Chrome reste à 525 px » :
  « À tester en 525px c'est pas grave... » (lu : un rejeu en ligne se joue à la largeur que son Chrome donne, 525 px compris ; on ne bloque pas sur la largeur).
- **08.11**, mot pour mot (relayé par la pilote) : « Économie de token.... Tout va en qualité pour toutes les sessions... » (lu : pas de rejeu qui piétine, de relance ni de rapport répété ; les jetons vont aux constats utiles, aux corrections et au registre juste).
- **08.11**, mot pour mot, sur sa capture de la Dépense (ticket Bauhaus, ligne « Idaho7 » 5 g × 1,00 rangée dans « Autres », « article — · hors stock », bouton « + Suivre au stock ») :
  « SI je mets suivre au stock, ça devrait faire le mapping automatique... »
- **08.11**, mot pour mot, sur la même capture (pied de la liste : « Détail 56,80 / 51,80 · Regrouper en une dépense », lignes Bauhaus 51,80 et « Idaho7 » 5,00) :
  « Et Détail 56,80 / 51,80 c'est assez trompeur et donne pas d'info.... Mettre des informations cooreante. On a l'impression que c'est faux alors que c'est juste »
- **08.11**, mot pour mot, sur le test de l'enrichissement IA (27 appels, 0,35 CHF par appel ; proposé : 10 recherches par jour) : « Baisse à 20 et go » (lu : plafond de 20 par jour, allumé en production ; D378).
- **08.11**, mot pour mot, sur ses captures des outils Houblons (Comparer : pastille « Ta bière » superposée, rangées « ~0,1 » sans barre ; Suggestions : « Plus agrumes — Aucune voie houblon », « Comparer (0) ») :
  « Suggestions et comparez ne fonctionne plus ??? »
  puis « Mais les test ont bien été fait sur la prod ??? C'est ce que j'ai demandé. En 10s je trouve plein de problème... »
  puis « Mais la partie houblon fonctionnait super bien fut un temps ??? »
- **09.11**, mot pour mot, à « Banc payant (environ 0,70 CHF) … je le lance ? » et « Les 3 bugs des Réglages : je les joue sur tes vrais Réglages en remettant chaque valeur à l'identique ? » : « Oui et oui » ; « N'attends pas d'input de ma part continue tes tâches ».
  Puis : « Économie de token. Que pour la qualité !!! » ; « Ensuite fait moi des mini maquettes pour la partie levures. Avec le bon workflow » (lu : l'étape « Levure 4/7 » de la création de recette, suivante du programme « refaire tous les écrans un à un » ; entonnoir allégé D204, comme Malts/sucres ; lecture étroite, L01).
- **09.11**, mot pour mot, sur sa capture de l'app en ligne (étape Levure 4/7, station « 4 Conduite · température × jours », graphe des paliers 19 °C J0–J10 puis 4 °C, poignées ↕ et ↔) : « Ça j'aime beaucoup, c'est très UX UI »
  (lu : le graphe de conduite actuel est un acquis, repris tel quel dans les maquettes Levure ; il remplace la « ligne résumée vers Paliers » de la fiche).
- **09.11**, mot pour mot, sur le panel Levure v0 (https://claude.ai/artifact/DJkJFqKMkfY5LTeqAyWVM7) :
  « J'aime bien r1 · La ligne p6-b2 · froide » ; « Et r3 · L'établi · chaude en fait le r3 est mon pref mais il a besoin de quelques améliorations, notamment sur le fait d'être un peu plus compact et moins fantaisiste. »
  « Pas besoin de devoir jouer les mini maquettes, va au plus simple. Refait une passe avec ces réf. Et les autres vue des levures, un peu comme houblons, comparé, suggéré, et chercher, surtout chercher est important. Aussi la recherche est bonne mais devrait mettre en avant en premier les levures possible à acheter en Suisse, France Allemagne. Car les levures US sont pas vraiment disponible... »
  « Et aussi sur les mini maquettes les info manquantes type flocculation, SI on clic dessus, ça fait un appel de recherche ia »
  (lu : passe 2 statique, sans geste joué ; base r3 resserrée, r1 en second ; trois vues de plus, Chercher d'abord, puis Comparer et Suggérer ; la recherche classe d'abord l'achetable en CH, FR, DE ; toucher une donnée manquante lance une recherche IA, montrée en états).
- **09.11**, mot pour mot, sur « J'y ai noté ton graphe de conduite comme acquis » : « il peut être un peu restilisé » (lu : structure et principe gardés — graphe °C × jours, paliers, poignées ↕ ↔ ; le style peut s'aligner sur la maquette).
- **09.11**, mot pour mot, sur « une des quatre aide à trouver l'équivalent achetable d'une levure US, par exemple la 1056 » : « Oui ça c'est top » (lu : le chemin « levure US → l'achetable en CH, FR, DE » est voulu dans Chercher).
- **09.11**, mot pour mot, à la suite : « Mais il faut par exemple, je trouve une recette US avec une levure us, je sois capable de voir exactement ses effets, +banane, + épicé. Puis je peux choisir en âme et conscience, une levure de chez nous avec toutes ses info dont son impact sur le houblon. »
  (lu : le chemin « levure US → achetable » montre d'abord les effets de la levure US en arômes — fruité/banane, épicé/clou, neutre — puis chaque levure d'ici avec ses effets côte à côte et son impact sur le houblon (biotransformation) ; données du catalogue : `aroma` 862 fiches, `pof` 346, `biotransformation` 170, `esters` 46 ; l'inconnu dit « non documenté », toucher = recherche IA).
- **09.11**, mot pour mot : « Mais aussi une fois une levure sélection, exemple, levure d'aby je veux pouvoir le choisir une qui rend ma triple plus ronde et moins épicé par exemple. C'est juste un exemple, soit générique. Pareil pour les ipa, je veux voir ce que la biotransfo change et apport d'une levure à l'autre. Beaucoup de recherches et de temps on déja été consacrée à ça. Trouve les info déjà la et comble les troua »
  (lu : Suggérer décale depuis la levure choisie par directions génériques — rondeur, épicé, fruité, biotransformation — avec l'écart de chaque candidate ; avant toute nouvelle recherche, inventaire du savoir déjà dans le dépôt, puis combler les trous).
- **09.11**, mot pour mot : « Aussi utiliser les UX UI booster Et autres astuce comme on a vue avec le graph ux » (lu : skill boosters-ux appliqué et marqué dans chaque maquette ; le graphe de conduite est la référence : donnée dessinée, réglable sur place, sans phrase).
- **09.11**, mot pour mot, sur le panel Levure passe 2 (https://claude.ai/artifact/BCuZb4L8dtQWwWvP1qoBHE) :
  « l2 · la ligne r1 + la bande r3 ça j'ai bien mais ça donne pas assez d'infos sur la levure, genre ces caractéristiques durant la fermentation, plus de tiole, banane, cou de girofle, ether, épicé... »
  « la plage de la levure sur ta conduite: ça c'est parfait. Parcontre il y a toujours 4 pallier. Je veux pouvoir facilement en ajouter ou enlever »
  (lu : base de l'étape = l2, enrichie des effets de fermentation de la levure — thiols, banane, clou de girofle, esters, épicé — tirés des faits sourcés ; la conduite = l4b (plage de la levure en bande derrière les paliers), avec ajout et retrait de palier faciles sur le graphe. L'app sait déjà ajouter/retirer un palier (`YeastRecipePlan.tsx:707-709`, « + Avant », « + Après », « Supprimer ») mais sous le graphe, dans la carte du palier : le rendre direct, L02).
- **09.11**, mot pour mot : « s1b · colonnes comme Comparer houblons ça j'aime bien, faire d'autres mini maquettes. Et. c4 · de la levure US à l'achetable pour la recherche, j'ai besoin de plus de filtre, par style, atténuation ECT... Aussi pour la suggestion, un peu comme les houblons, SI je veux plus de banane, mettre plus le houblon en avant ECT ECT c'est de exemple faut que ça soit générique »
  (lu : Comparer = variantes autour de s1b ; Chercher = c4 avec des filtres (style, atténuation, température, forme, floculation, effets, disponibilité) ; Suggérer = des buts génériques comme pour les houblons — plus de banane, plus de clou, plus fruité, plus net, plus sec, plus rond, houblon mis en avant… — appuyés sur les buts existants de `yeastRecipeProfiles.ts` (banana, clove, fruit, clean, dry, hops, balanced, low-sulfur) et de `fermentationScienceBootstrap.json`).
- **09.11**, mot pour mot, sur le panel Levure passe 3 (https://claude.ai/artifact/XeAsjYdnSkosrRTTWR23Gz) :
  « Chercher : c4 + filtres  Oui mais pas assez de filtre, fait un audit la dessus, quels filtre à ajouter »
  « s5a · effets de fermentation en tête  Candidate  l5b · effets en jauges, + entre les paliers  Top ! »
  (lu : l5b choisie pour l'étape Levure, s5a pour Comparer (inscrites dans `choix/ecrans-app.json`) ; Chercher garde c5a, mais la liste de filtres est à auditer : quels filtres ajouter, mesurés sur le catalogue — `work/missions/2026-11-09-ecran-levure/savoir/AUDIT-FILTRES.md`).
  « s6a · huit buts en cartes, comme q2b  Top » (lu : s6a choisie pour Suggérer).
- **09.11**, mot pour mot : « Parcontre houblons, banane ECT était juste des exemples c'est pas assez générique DU TOUT !!!! »
  (lu : les huit buts nommés de s6a (banane, girofle, houblon en avant…) sont une liste figée ; il veut un mécanisme générique : chaque caractéristique de la fiche levure, quelle qu'elle soit, peut être poussée en plus ou en moins. s6a reste la forme choisie (cartes) ; son contenu devient la liste des axes de la fiche, chacun avec + et −. La même liste d'axes sert aux filtres de Chercher — `savoir/AUDIT-FILTRES.md`).
- **09.11**, mot pour mot, sur l'écran Dépense en ligne (deux captures, facture Poste CH 6,80) : « Plusieurs soucis mineur, il y a des cas de figure où je peux pas annuler, j'ai pas encore trouvé pourquoi
  Aussi si je change je ltype à ingrédients, ça le fait changer de catégorie et surtout on perd du coup le focus sur l'item ce qui est vraiment problématique »
  (lu : « annuler » = fermer la saisie ; le × était éteint pendant la lecture (BX-1). Le type changé garde la ligne au centre, ouverte, focus dessus ; la bande change, c'est la conséquence voulue (BX-2). Lecture étroite, dite dans la réponse.)
- **09.11**, mot pour mot (deux captures : menu du + sur Recettes et sur le Bord, en ligne) : « 1 autre problème, entrer une facture ouvre la bonne vue tandis que nouvelle écriture, non »
  (lu : « Nouvelle écriture » ouvrait le formulaire manuel direct (#114) ; il ouvre maintenant la même entrée que « Entrer une facture » (document, photo, « Saisir sans justificatif »), BX-3. Lecture étroite : si la saisie à la main elle-même doit prendre la forme de la facture lue, c'est un choix à montrer en maquettes.)
- **09.11**, mot pour mot : « Aussi regarder avec le tester workflow, à beaucoup d'entrois le bouton flottant plus, n'est pas correct, sur plein d'écran il est pas au bon endroit. Différents, donne pas les bonnes actions ect... À revoir et testé !!! »
  (lu : audit du bouton + sur tous les écrans — onglets, sous-onglets, pages plein écran, 390 tactile et 1280 : sa place (toujours la même, sans couvrir un contrôle), son action principale (celle de l'écran), son menu ; puis correction, puis test sur l'app déployée par le critique (BX-4).)
- **09.11**, mot pour mot, sur le panel Levure passe 4 (https://claude.ai/artifact/DW4PfrQci56fx2YJ9hCAHd) : « Les deux suggestions sont bien, IMPLÉMENTE toutes ces vues maintenant »
  (lu : « les deux suggestions » = les deux candidates du critique, c6b (Chercher) et s7a (Suggérer) ; avec l5b (étape) et s5a (Comparer), déjà choisies, les quatre vues de la Levure sont à porter dans l'app, maintenant.)
- **09.11**, mot pour mot, pendant le port Levure et les voies de bugs : « Token pour la qualité !!!!! »
  (lu : les jetons servent la qualité — pas de raccourci sur la critique, les tests complets, les captures regardées et le jeu en ligne ; ni rustine pour finir vite (BR-45 retiré).)
- **09.11**, mot pour mot : « Mais utilsent tes token pour la qualité pas pour du va et vient inutile !!! »
  (lu : pas de compte rendu à chaque retour d'agent ni de relance pour un détail ; le pilote tranche, groupe et ne parle qu'au résultat vérifié.)
