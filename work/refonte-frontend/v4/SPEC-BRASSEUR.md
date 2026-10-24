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
