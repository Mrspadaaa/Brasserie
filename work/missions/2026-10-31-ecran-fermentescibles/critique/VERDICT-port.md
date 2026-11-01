ACCEPTÉ — le port de s1 est sa maquette : 17 défauts relevés, 17 tenus (reprise 3 du 01.11 : fiche ouverte sans phrase, pied au premier écran, + et − conformes au cran de s1)

# Port de s1 (p6-b2) dans l'app — critique calibrée (voie t8, 31.10, nuit)

Jugé sur les 42 planches côte à côte de `voies/p8-port/captures/` (14 scènes à 390 tactile, toutes ouvertes ; repos, barre tirée,
ouverture, munich, sucre, fruit J+3, huit grains à 390 souris ; repos, barre tirée, ouverture, mu, munich, Abbey Malt, cara 0,3,
sucre, fruit J+3, huit grains à 1280), contre `v7/s1/etat.html` et NOTE.md, et contre les écarts déclarés de `p8-port/RESULTAT.md`.

**Ce qui tient, et qu'il reconnaîtra en trois secondes** : le ticket, la barre qui porte la masse (3,7 kg · 55 % du grain, au pixel près),
le moment sans pilule avec « Annuler », le champ « Nom (et kg), Entrée » avec sa bascule Grain, les sacs, les tuiles de l'ouverture
(étoile, pastille de teinte avec l'EBC, « 12,5 kg en stock », « stock épuisé » en or foncé), « mu », « Munich » → Münchner, « pils » →
« déjà 5,0 kg · 18 kg en stock », « Abbey Malt » → « Créer « Abbey Malt » (stock à zéro) », « cara 0,3 » → « Carapils 0,30 kg », le
retrait barré avec « Annuler », les huit grains avec le lactose. Les nombres sont honnêtes (« — » là où la maquette écrivait « IBU 24 »
à la main, « 800 g en stock », la teinte prise du stock pour Pale Ale, Carapils, Münchner dans huit grains). Les sacs du retrait
redonnent le malt retiré, et 1280 montre cinq sacs : plus d'info utile, il prendra.

Sa phrase prédite : « C'est bien, c'est la maquette. Mais c'est quoi ce cadre noir ??? Et ce texte en bas ??? Et le Suivant il est où ? »
Verdict : mitigé, pas rejeté (portrait, erreur 1 : l'idée est là et se lit). Il refuse en revanche, et explicitement, ce qui suit.

## Défauts

| n | Gravité | Planche | Écart vu (l'app contre la maquette) | Correction attendue, vérifiable |
|---|---|---|---|---|
| 1 | bloquant | tactile390-01 à 10, 12, 13 ; souris390 idem ; pc1280-01, 02, 05, 06, 08, 10 (bas de l'écran) | Sous le plateau, un bloc de texte « Données de fiche à compléter : Pilsner Malz · APERCU-1 (couleur EBC, potentiel PPG) · Weizenmalz hell · APERCU-5 (…) · Haferflocken · APERCU-6 (…) » : 4 lignes, coupées par le « + » flottant, à la lisière du premier écran à 390 et à 1280. La maquette finit sur le plateau puis « Retour / Suivant — Houblons ». Ce bloc répète « 3 couleurs à renseigner » et les « ? » des lignes, et il pousse « Suivant — Houblons » hors de l'écran : aucune des 42 planches de l'app ne montre le pied, la maquette le montre dans chaque état de repos. Refus explicite D1 (« énormément d'information pour rien … en premier plan »), D3 (bloc ≤ 2 lignes), règle n° 1 (D105). | `RecipeAutoComplete` n'est plus un bloc sous le plateau à cette étape : il reste au récapitulatif (où il était), ou se réduit à une seule ligne d'action (≤ 1 ligne, ≤ 8 mots, pas de parenthèses) dans la zone « alertes » sous le ticket. Vérifiable : aucun bloc de texte > 2 lignes au premier écran (D3), et à 390×844 au repos, le pied « Suivant — Houblons » a son bas ≤ 844 px, comme la maquette (capture repos tactile 390 et 1280). |
| 2 | majeur | tactile390-02 (après la barre tirée), tactile390-14, souris390-14, pc1280-01, pc1280-14 ; absent sur souris390-02, pc1280-02, pc1280-04 | Un cadre noir de 2 px entoure tout l'écran, du bandeau au plateau. Il apparaît après un vrai geste (la barre tirée au doigt) et pas toujours : D57 « Pourquoi il y a parfois le truc noir pas toujours ?? », D33 « il y a des truc jaune ?? » (focus posé sur un conteneur). La maquette n'entoure que la ligne choisie. | Trouver le conteneur qui reçoit le focus (ce n'est ni `.fer-cur` ni les boutons `fer-` : leur contour fait 2 px sur l'élément seul ; chercher un `tabIndex={-1}` ou le conteneur de défilement du wizard) et lui retirer tout contour de focus. Vérifiable : rejouer barre-tirée (tactile) et huit-grains (3 modes) : aucun élément autre que la ligne choisie et le curseur touché n'a d'`outline` ; `getComputedStyle(document.activeElement).outlineStyle === 'none'` après le glissement. |
| 3 | majeur | tactile390-11, souris390-11, pc1280-11 (fruit J+3) ; pc1280-10 (sucre, à la limite) | Les repères restent ouverts ; le plateau de la purée de mangue descend sous l'écran : à 390, le curseur des jours touche le bord et « J14 » est sous le « + » ; à 1280 (800 px), la ligne « J+ 3 · J0 … J14 » est coupée. La maquette replie les repères (`ajuster()`, ligne 786 de etat.html) dès que le pied sort du premier écran : son plateau est entier, de « fermentation » à « J14 ». Écart déclaré 6, non permis : D212 « Toujours visible » ; son choix p6-b2 est « le plateau toujours visible ». | Porter `ajuster()` : après chaque rendu, si le bas du plateau (ou du pied) dépasse `innerHeight`, les repères se replient (sauf s'il vient de les ouvrir à la main). Vérifiable : dans fruit-j3 et sucre, aux trois modes, `plateau.getBoundingClientRect().bottom ≤ innerHeight` et « J14 » visible hors du « + » ; `controle-etats`/capture à ouvrir. |
| 4 | majeur | tactile390-10, 11 ; souris390-10 ; pc1280-10, 11 | Au bandeau, « EBC ● 7,3 » avec une pastille **noire** ; la maquette met la pastille à la teinte de la bière (paille), comme les lignes et le mot « Paille » des repères. Un brasseur lit ce point comme la couleur de la bière : un point noir pour une pilsner à 7,3 EBC est un chiffre faux en couleur (D14 : rien d'inventé ; L04 : la teinte parle avant le nombre). | La pastille du bandeau prend `teinte(ebc)` comme les pastilles des lignes (bandeau de l'Identité portée : corriger là). Vérifiable : dans sucre, la couleur du point du bandeau est celle de la pastille de Pilsner Malz (ΔE < 5) ; sans EBC, « — » sans point. |
| 5 | majeur | toutes les planches de repos (bas de l'écran), tactile390-01 | Une pilule « Couleur à renseigner · modifier ⌄ » sous le plateau (la fiche technique `MaltDetails`, repliée, D224). Elle n'est pas dans la maquette (règle n° 1) et son libellé dit « couleur », alors que la couleur se renseigne déjà par le « ? » de la ligne et par « 3 couleurs à renseigner » : troisième entrée pour la même chose, et la seule qui ne dit pas qu'elle porte le PPG. Avec le bloc 1, elle est la cause du pied hors écran. | Voir l'avis ci-dessous. Correction minimale pour le port : plus de bloc séparé sous le plateau ; le PPG devient une ligne discrète **dans** le plateau de la ligne (comme « J+ 3 » l'est pour le fruit) : « PPG — · fiche › », qui ouvre la fiche à un toucher. Vérifiable : rien entre le bas du plateau et le pied du wizard (hors alertes de la zone « alertes » de la maquette) ; le plateau grain ne dépasse pas d'une ligne la hauteur de la maquette. |
| 6 | détail | tactile390-10, 11 ; pc1280-10, 11 | Sur le plateau, la pilule du moment est grise (« ébullition ⌄ », « fermentation ⌄ ») ; la maquette la teinte (rouge pâle pour l'ébullition, vert pour la fermentation), seule trace de couleur du moment sur le plateau après D218. | La pilule du plateau reprend la teinte `data-m` de la maquette (fond et texte). Vérifiable : couleur du texte de la pilule ≠ gris de « empâtage » dans sucre et fruit. |
| 7 | détail | toutes les planches de repos | Le chevron des repères : « ^ » ouverts dans l'app, « ⌄ » ouverts dans la maquette (« repère » absent est déclaré 4, justifié par le profil). | Même glyphe que la maquette par état (ouvert ⌄, replié ›) ou, si l'on garde la convention de l'app, le dire au pilote. Vérifiable : glyphe identique sur repos et huit-grains. |
| 8 | détail | tactile390-10, 14 ; pc1280-10, 14 | Le picto des lignes sucre et lactose : un cube dans un carré dans l'app, un petit anneau dans la maquette. Changement de forme sur un écran choisi (règle n° 1), même si le cube « représente ce que c'est ». | Reprendre le glyphe de la maquette, ou garder le cube et le marquer comme écart à lui montrer. Vérifiable : comparaison du picto à 390 sur sucre. |
| 9 | détail | tactile390-14, souris390-14, pc1280-14 | L'avertissement du lactose est plus long : « … il remonte la densité finale **et reste en bouche**. » (maquette : « … la densité finale. »). Texte en plus (D1). | La phrase de la maquette, mot pour mot. Vérifiable : `controle-mots`/texte de la zone alertes identique. |
| 10 | détail | tactile390-04, souris390-04, pc1280-04 | À l'ouverture, « Münchner Malz · stock épuisé » est 3e, entre Carapils et Carahell disponibles. D222 (lecture du pilote) : « le stock (disponibles d'abord, épuisés à part) ». La règle est celle de la voie a1, pas du port, mais c'est ce qu'il verra. | a1 : un épuisé ne passe jamais devant un disponible de même rang, ou le pilote justifie (typicité > stock) et le note à D222. Vérifiable : dans ouverture, aucune tuile « stock épuisé » avant une tuile « … en stock ». |
| 11 | détail | tactile390-14, souris390-14, pc1280-14 | Après les huit grains, le plateau de l'app montre Pilsner Malz ; celui de la maquette montre le dernier ajouté (Münchner Malz 0,25). La fixture `malts=huit` charge l'état d'un coup, donc le geste réel (Entrée sur une tuile → le plateau suit-il la nouvelle ligne ?) n'est pas prouvé par ces planches. | Jouer un ajout réel (« Munich », Entrée) sur l'app et capturer : la ligne ajoutée est entourée et le plateau la montre, comme dans la maquette (D223 : le focus va sur sa masse). Vérifiable : `data-role="plateau"` porte le nom du malt ajouté après Entrée. |

Rien d'autre vu : pas de débordement horizontal, pas de valeur brute (« null », « low »), contrastes du texte conformes à la maquette,
cibles de la ligne de la même taille que la maquette, « 800 g en stock » plutôt que « 0,8 kg » lui va (c'est son mot, D221).
Le « + » flottant qui couvre « kg » et le bout du curseur dans ouverture et huit-grains est le même dans la maquette : pas un écart du port,
mais il gênera un jour (à noter, pas à corriger ici).

## Avis sur la fiche technique repliée sous le plateau (D224)

**Oui, elle gêne**, pour trois raisons visibles sur les planches, et aucune n'est le PPG lui-même :

1. **Elle dit « Couleur à renseigner »**, alors que la couleur a déjà deux entrées qu'il a choisies : le « ? » de la ligne (un toucher ouvre
   l'EBC) et « 3 couleurs à renseigner » des repères. Il lira une troisième porte pour la même chose, et pensera que le « ? » ne suffit
   pas ; il ne devinera pas que le PPG est derrière. Si elle reste, elle doit dire ce qu'elle porte (« fiche · PPG »).
2. **Avec le bloc « Données de fiche à compléter », elle pousse le pied hors du premier écran** à 390 comme à 1280. Sa maquette se termine
   par le plateau puis « Suivant » ; l'app se termine par deux blocs de plus, dont un de texte. C'est l'écart qu'il verra en premier,
   celui de D105 (« ça diverge du design choisi »).
3. **Elle est hors du plateau** qu'il a demandé « toujours visible » (D212). Tout ce qui concerne la ligne choisie vit dans le plateau
   (masse, moment, J+, croix). Une fiche de cette ligne, repliée sous le plateau, est un objet orphelin.

Ce qui ne gêne pas : garder le PPG et l'assistant de fiche dans l'app (sans lui, pas d'OG : il le veut, « des vrais valeur »), et le
replier. Donc : **(c) plutôt que (a)**, en lecture étroite : une ligne dans le plateau, « PPG — · fiche › », qui ouvre la fiche
technique à un toucher ; et le panneau « Données de fiche à compléter » hors de cette étape (il est au récapitulatif, là où il
« voit dans le récap à la fin », D23). (b) seule (fiche au stock) perdrait la saisie du PPG depuis la recette, ce qu'il a refusé pour
la couleur (« à la volée », D211). Le montrer en variantes (L24) reste juste, mais le port peut déjà appliquer la correction
minimale du n° 5 sans attendre : réversible, et elle ramène l'écran à sa maquette.

## Ce que le pilote relance

Un auteur Sonnet pour les n° 1 à 6 et 9 (CSS et composants du port, bandeau de l'Identité pour le n° 4), a1 pour le n° 10, et une
série Haiku de captures après coup : repos, barre tirée (tactile), sucre, fruit J+3, huit grains, un ajout réel (n° 11), aux trois
modes, à rouvrir une à une. Je reprends le verdict sur ces planches.

## Reprise (01.11)

Jugé sur la série du 01.11 (captures de 00:21 à 00:26) : repos, barre tirée, ouverture, sucre, fruit J+3, huit grains et l'ajout réel,
à 390 tactile, à 390 souris et à 1280, chaque planche ouverte en image, contre la maquette à droite et contre la section « Corrections du
verdict » de `voies/p8-port/RESULTAT.md`.

| n | Tenu ? | Planche |
|---|---|---|
| 1 | Oui. Plus aucun bloc « Données de fiche à compléter » ; « Retour / Suivant — Houblons » est sous le plateau, au premier écran, comme la maquette (390 : bas ~ 815 px ; 1280 : ~ 516 px). | tactile390-01, souris390-01, pc1280-01 ; aussi 02, 10, 11, 15 aux trois modes |
| 2 | Oui. Aucun cadre noir après la barre tirée ni à huit grains, aux trois modes ; seule la ligne choisie est entourée. | tactile390-02, souris390-02, pc1280-02, tactile390-14, souris390-14, pc1280-14, pc1280-01 |
| 3 | Oui. Repères repliés en fruit J+3 : le plateau est entier, de « fermentation » à « J14 », pied visible ; sucre à 1280 tient aussi. | tactile390-11, souris390-11, pc1280-11, pc1280-10 |
| 4 | Oui. « EBC ● 7,3 » avec la pastille paille, la même teinte que les lignes et que « Paille » des repères. | tactile390-10, souris390-10, pc1280-10, 11 |
| 5 | Oui. Plus de pilule sous le plateau ; une ligne « PPG — · fiche › » au bas du plateau du grain, rien entre le plateau et le pied. (Elle coûte ~ 22 px : voir le n° 13.) | tactile390-01, 02, 15 ; pc1280-01, 15 |
| 6 | Oui. « ébullition ⌄ » rouge pâle, « fermentation ⌄ » vert, comme la maquette. | tactile390-10, 11 ; souris390-10, 11 ; pc1280-10, 11 |
| 7 | Oui. « ⌄ » ouvert comme replié, identique à la maquette. | repos et huit grains, trois modes |
| 8 | Oui, par décision du pilote : le picto est celui que la maquette rend (petit anneau), règle n° 1. Les lignes sucre, fruit, lactose et le plateau du sucre le montrent comme la maquette. | tactile390-10, 11, 14 |
| 9 | Oui. « Lactose : non fermentescible, il remonte la densité finale. » mot pour mot. | tactile390-14, souris390-14, pc1280-14 |
| 10 | Oui (a1). « Münchner Malz · stock épuisé » est la dernière tuile, après Caramünch II ; au repos aussi, le sac épuisé vient en dernier à 1280. Vu à 390 souris et à 1280 ; **pas à 390 tactile** (voir le n° 14). | souris390-04, pc1280-04, pc1280-01 |
| 11 | Oui. Après « Munich », Entrée : la ligne « Münchner Malz » est entourée, avec sa pastille orange (15 EBC), « 0 kg », le plateau la montre, le pied reste visible ; même état que la maquette (où le curseur est dans la masse). | tactile390-15, souris390-15, pc1280-15 |

Sa phrase prédite sur la série : « Là c'est bon, c'est ma maquette. Juste le truc coupé à droite des sacs, c'est quoi ? »

### Nouveaux défauts vus

| n | Gravité | Planche | Écart vu (l'app contre la maquette) | Correction attendue, vérifiable |
|---|---|---|---|---|
| 12 | majeur | tactile390-01, 02, 10, 11, 15 ; souris390-01, 02, 04, 10, 11, 15 (toutes les planches à 390 où les sacs sont visibles) | La rangée des sacs du repos porte maintenant cinq sacs (Pale Ale Malz, Carapils, Carahell, Caramünch II, Münchner Malz) dans une rangée `overflow-x: auto` sans barre : à 390, le quatrième sac (Caramünch II) est **coupé en deux** au bord droit, sans rien qui dise qu'on peut faire défiler. La maquette montre trois sacs entiers qui tiennent dans la largeur ; la série du 31.10 en montrait trois aussi. Un élément tronché au premier écran : D10 (pas de débordement), et une plainte connue (« c'est quoi ce truc coupé ? »). À 1280, les cinq tiennent : rien à changer là. | Ne montrer à 390 que les sacs entiers (couper la liste au dernier qui tient, trois ici, comme la maquette), ou passer la rangée sur deux lignes (`flex-wrap`). Vérifiable : pour chaque sac de la rangée au repos, `getBoundingClientRect().right ≤ rangée.right` à 390 tactile et souris ; aucun sac partiellement visible ; capture repos à 390 rouverte. |
| 13 | détail | pc1280-01, 02, 04 (repos, barre tirée, ouverture) ; tactile390-15 et souris390-15 (ajout réel) | Les repères sont **repliés** (« Rendement ⌄ · 3 couleurs à renseigner · 75 % ») alors que la maquette les montre ouverts dans ces états : à 1280 × 800, son pied tient avec les repères ouverts (bas ~ 773 px) ; à 390 dans l'ajout réel aussi (~ 825 px). L'app plie parce que son écran est un peu plus haut (en-tête du wizard, ligne « PPG — · fiche › » de 22 px) : `ajuster()` fait son travail, mais le premier regard diverge de la maquette (plage d'OG et de teinte cachées, qu'il aime : « plus informative »). L'auteur le signale lui-même dans « Doutes ». | Regagner la hauteur perdue pour que `ajuster()` ne plie pas là où la maquette ne plie pas : la ligne « PPG — · fiche › » à la hauteur de « J+ 3 » (sans marge de plus), ou mesurer contre le conteneur de défilement et non contre la fenêtre. Vérifiable : repos à 1280 × 800 avec les repères ouverts et `pied.bottom ≤ 800` ; ajout réel à 390 × 844 avec les repères ouverts et `pied.bottom ≤ 844`. Si cela ne tient pas sans retirer la ligne PPG, le dire : c'est alors le prix de D226, et il reste acceptable. |
| 14 | détail (preuve) | tactile390-04-ouverture (00:22) | La planche d'ouverture à 390 tactile de la série du 01.11 ne montre **aucune tuile** : le champ n'a pas le focus, les sacs sont au repos, le plateau porte déjà « PPG — · fiche › » (c'est donc bien la nouvelle série, pas « la série précédente » comme l'écrit RESULTAT.md § « Les captures ouvertes », qui dit l'avoir ouverte « cinq tuiles… « stock épuisé » en dernier » : la capture ne le montre pas, L12). Le rechargement de Vite (doute de l'auteur) est la cause probable ; 390 souris et 1280 montrent les tuiles, épuisé en dernier. L'ouverture au doigt est pourtant la scène de son choix (D222) : elle doit être prouvée dans le mode où il l'utilisera. | Rejouer la scène « ouverture » à 390 tactile, sans écriture voisine, et l'ouvrir : cinq tuiles sur deux colonnes, étoile sur Pale Ale Malz, « Münchner Malz · stock épuisé » en dernier. Corriger la phrase de RESULTAT.md. Vérifiable : la planche montre les tuiles ; `document.activeElement` est le champ d'ajout. |

Rien d'autre : le n° 2 ne revient dans aucun des trois modes, les nombres restent honnêtes (« — », « 800 g en stock », « 0 kg » à l'ajout),
les teintes prises du stock (Münchner orange) et les « ? » des malts sans EBC sont ceux de la maquette, le pied est au premier écran
partout sauf à huit grains, où la maquette ne l'y a pas non plus.

**Fiche technique (D224 → D226)** : la ligne « PPG — · fiche › » dans le plateau est l'option (c) en lecture étroite, celle que je
recommandais ; elle ne gêne plus (plus de « Couleur à renseigner », plus rien sous le plateau). Son seul coût est le n° 13.

**Ce que le pilote relance** : un auteur Sonnet pour le n° 12 (et le n° 13 s'il tient en une ligne), puis une série Haiku : repos et
ajout réel aux trois modes, ouverture à 390 tactile rejouée (n° 14), à rouvrir une à une. Je reprends sur ces planches.

## Reprise 2 (01.11)

Jugé sur la série régénérée à 03:08–03:09 (42 planches), contre la maquette à droite, contre D226, D228 et D230 et contre les sections
« Reprise du verdict » et « L'ajout au toucher » de `voies/p8-port/RESULTAT.md`. Ouvertes en image : repos, ouverture, ajout réel à 390
tactile, 390 souris et 1280.

### Les défauts ouverts

| n | Tenu ? | Planche |
|---|---|---|
| 12 | Oui. Au repos, trois sacs entiers à 390 (Pale Ale Malz, Carapils, Carahell), cinq à 1280 avec l'épuisé en dernier ; plus rien de coupé au bord droit. Même rangée dans l'ajout réel (trois sacs à 390, quatre à 1280). | tactile390-01, pc1280-01 ; tactile390-15, souris390-15, pc1280-15 |
| 13 | Oui, sur le critère de la maquette. Repos à 1280 : repères ouverts (plages d'OG et de teinte), pied à ~ 793 px sur 800 ; ajout réel à 390 : repères ouverts, « Suivant — Houblons » dans l'écran. À 1280 dans l'ajout réel, l'app replie (pied projeté hors des 800 px) alors que la planche de la maquette les montre ouverts : la maquette y déborde elle-même (son pied est à ~ 824 px sur une page entière). L'app applique sa règle, la maquette ne l'a pas appliquée là : rien à corriger (règle n° 1 au sens du critère, D228). | pc1280-01, tactile390-15, souris390-15 ; pc1280-15 |
| 14 | Oui. L'ouverture à 390 tactile montre cinq tuiles sur deux colonnes, l'étoile sur Pale Ale Malz, « Münchner Malz · stock épuisé » en dernier ; idem à 390 souris et 1280. La phrase de RESULTAT.md est corrigée. | tactile390-04, souris390-04, pc1280-04 |

### Le geste d'ajout (`versMasse`, D230)

Après « Munich », Entrée : la ligne « Münchner Malz » est entourée, pastille orange (15 EBC du stock), « 0 kg » en teinte d'attention
avec le trait de focus sous la masse (`.fer-kgin:focus`, 2 px), le plateau la montre, le champ d'ajout est vide ; même état aux trois
modes. La maquette dessine la masse focalisée avec un cadre, l'app avec un soulignement : la même chose, lisible. Le focus lui-même
n'est pas une chose qu'une capture prouve : il l'est par `controle-gestes-ligne.mjs` AJOUT (« curseur dans sa masse, sur la ligne »,
aux deux modes, avec le témoin qui échoue) et par le test `dataEntry` réécrit. D230 lit bien sa maquette (`versMasse`) ; « cara 0,3 »
qui rend le focus au champ d'ajout est la scène 09, inchangée. Rien à redire.

### Les repères

Le critère est celui de la maquette (`ajuster()` : repli seulement si le pied sortirait de l'écran avec les repères ouverts, projeté,
indépendant de l'état courant). Vu : ouverts au repos (390 et 1280), ouverts dans l'ajout réel à 390, repliés dans fruit J+3 et huit
grains (le plateau reste entier). Conforme.

### Ce que je n'ai pas pu juger : deux preuves manquantes

| n | Gravité | Planche | Écart vu | Correction attendue, vérifiable |
|---|---|---|---|---|
| 15 | détail (preuve) | aucune | Il n'existe aucune capture de la fiche **ouverte** (« PPG — · fiche › » touché). C'est un élément neuf de son écran (D226) : deux champs `NumberInput` (Couleur EBC, Potentiel PPG) aux classes `bg-cave-950 text-cave-50`, une classe de malt, et le bloc `AiAssist`. Je ne sais ni sa hauteur, ni son contraste dans le plateau blanc, ni combien de mots il ajoute (D1, D3), ni s'il pousse le pied hors de l'écran. Les tests (`recipeEditing`) prouvent la fonction, pas ce qu'il verra (L12). | Capturer la fiche ouverte sur la ligne Pilsner Malz au repos, à 390 tactile et à 1280, côté app seul (la maquette n'a pas cet état), et l'ouvrir : ≤ 2 lignes de texte, champs lisibles sur le fond du plateau (contraste ≥ 4,5), aucun texte explicatif, pied toujours visible ou repères repliés par `ajuster()`. |
| 16 | détail (preuve) | aucune | Aucune capture d'une ligne réglée par le « + » et le « − » du plateau (D219 : la masse sans clavier). Les tests `brewWizardDraftFreshness` touchent le « + » trois fois, mais nul n'a regardé que la masse, la barre de la ligne, la part et le bandeau suivent au cran (50 g sous 1 kg, 100 g au-dessus). | Capturer, à 390 tactile et à 1280 : Pilsner Malz après trois « + » (5,0 → 5,3 kg ; bandeau 8,3 kg ; part recalculée ; barre de la ligne avancée) puis un « − » (5,2 kg), côté app et côté maquette, et ouvrir : les quatre nombres cohérents entre eux, identiques à la maquette au même geste. |

DEMANDE EXECUTANT :
1. Depuis la racine, serveur de dev déjà lancé comme pour G7 (`capturer-malts.mjs`, voir GATES.md de p8-port), ajouter à `SCENES` de
   `work/missions/2026-10-31-ecran-fermentescibles/voies/p8-port/capturer-malts.mjs` deux scènes, à la suite de `15-ajout-reel` :
   - `16-plus-moins` : `toucher` trois fois `[data-role="bal"] [aria-label="Ajouter un cran"]`, puis une fois le « − » du plateau
     (`[data-role="bal"] [aria-label^="Retirer"]`, sinon le bouton `−` voisin), `dormir(300)` ; app et maquette ;
   - `17-fiche-ouverte` : `toucher` `[data-role="fiche"]`, `dormir(300)` ; cible `app` seulement (la maquette n'a pas cet état : ne pas
     échouer sur l'absence, produire la planche côté app avec le repos de la maquette à droite).
2. Lancer la série pour les modes `tactile390` et `pc1280` (souris390 facultatif).
3. Fichiers à produire : `captures/tactile390-16-plus-moins-cote-a-cote.png`, `captures/pc1280-16-plus-moins-cote-a-cote.png`,
   `captures/tactile390-17-fiche-ouverte-cote-a-cote.png`, `captures/pc1280-17-fiche-ouverte-cote-a-cote.png`.
4. Sorties attendues : `MALTS OK` inchangé pour les 15 scènes ; pour les deux nouvelles, imprimer la masse du plateau, le bandeau et
   `document.body.innerText.split(/\s+/).length` de la zone `[data-role="fiche-zone"]` (mots de la fiche ouverte).
5. Captures à ouvrir : les quatre planches, puis me les renvoyer pour le verdict.

Sa phrase prédite sur cette série : « Là on y est, c'est ma maquette. » — sous réserve de la fiche ouverte, que je n'ai pas vue.

### Scènes 16 et 17 (01.11, 03 h) : les deux preuves demandées

Planches ouvertes : `tactile390-16-plus-moins`, `pc1280-16-plus-moins`, `tactile390-17-fiche-ouverte`, `pc1280-17-fiche-ouverte`
(sortie `voies/p8-port/g7-scenes-16-17.txt` : MALTS OK, 51 planches sur 51, fiche-zone 25 mots).

| n | Tenu ? | Planche |
|---|---|---|
| 16 | Oui. Trois « + » puis un « − » sur Pilsner Malz : 5,0 → 5,2 kg ; bandeau 8,2 kg ; part 63 % (5,2/8,2), les deux autres 18 % ; la barre de la ligne et le curseur du plateau avancent du même cran. Le cran est celui de la maquette (`cranPas` de s1 : 0,05 kg sous 1 kg, 0,1 kg au-dessus : 5,0 + 3 × 0,1 − 0,1 = 5,2). **La maquette de la planche n'est pas au même geste** (Pilsner « retiré · Annuler », Weizenmalz au plateau, bandeau 3,0 kg) : le sélecteur `[aria-label^="Retirer"]` du script a touché, dans la maquette, le retrait de la ligne au lieu du « − » du plateau. Défaut du script de capture, pas de l'app : la règle du cran est lue dans le code de la maquette, et l'app lui est conforme. À corriger dans `capturer-malts.mjs` (le « − » du plateau, `[data-role="bal"]` et son bouton « − », pas « Retirer ») pour que la planche serve de preuve côte à côte ; pas de relance de l'app pour cela. | tactile390-16, pc1280-16 |
| 15 | Vu, et c'est un défaut (n° 17 ci-dessous). | tactile390-17, pc1280-17 |

| n | Gravité | Planche | Écart vu | Correction attendue, vérifiable |
|---|---|---|---|---|
| 17 | majeur | tactile390-17, pc1280-17 | La fiche ouverte dans le plateau montre : la rangée « Couleur [ ] EBC · Potentiel [ ] PPG » (bien : deux champs, lisibles, dans la langue de l'écran), un bouton « Compléter avec l'IA » (bien : l'assistant à la demande), puis une phrase sur deux lignes « Manque : couleur EBC, potentiel PPG. Ces valeurs sont publiées par le fabricant. » (`AiAssist.tsx`, ligne 167). Trois défauts : (a) la phrase est une explication au premier plan, et elle répète les deux champs vides juste au-dessus (D1 « énormément d'information pour rien », D3 « les info sont des actionnable pas des explication ») ; (b) à 390, le pied « Retour / Suivant — Houblons » sort de l'écran, et le « + » flottant couvre la phrase (règle n° 1 : sa maquette garde le pied au premier écran ; D212) ; (c) à 1280 × 800, la rangée des champs est à la lisière et « Compléter avec l'IA » est coupé : les repères ne se sont pas repliés à l'ouverture de la fiche, alors que le critère de D228 (repli quand le pied sortirait de l'écran) s'y applique autant qu'à une recherche. | (a) Retirer la phrase « Manque : … par le fabricant » de la fiche du plateau (ne garder que les champs et le bouton de l'assistant : `AiAssist` sans son texte, ou la phrase dans l'infobulle du bouton) ; (b)(c) rejouer `ajuster()` à l'ouverture et à la fermeture de la fiche (la hauteur projetée inclut la fiche ouverte). Vérifiable, à 390 × 844 tactile et à 1280 × 800, fiche ouverte sur Pilsner Malz au repos : zone `fiche-zone` ≤ 12 mots ; aucun bloc de texte > 1 ligne dans le plateau ; `pied.bottom ≤ innerHeight` (repères repliés si besoin) ; « Compléter avec l'IA » entier dans l'écran et hors du « + » flottant. Deux planches à rouvrir (`tactile390-17`, `pc1280-17`). |

Sa phrase prédite : sur le + et le − : « ok ça c'est bon » ; sur la fiche ouverte : « c'est quoi ce texte ? et le Suivant a encore disparu ». Un défaut
d'un cran, pas un rejet : l'idée de la ligne « fiche » dans le plateau tient, et le reste de l'écran est sa maquette.

### Reprise 3 (01.11) : le n° 17 et la scène 16, rejugés

- **16** — Tenu. App et maquette au même geste (trois « + », un « − » : « Retirer un cran ») : Pilsner Malz 5,2 kg des deux côtés, bandeau
  8,2 kg, parts 63 / 18 / 18 %, curseur et barre au même point. Planches `tactile390-16`, `pc1280-16`.
- **17** — Tenu. Fiche ouverte : « PPG — · fiche ⌄ », « Couleur [ ] EBC · Potentiel [ ] PPG », « Compléter avec l'IA », rien d'autre
  (la phrase « Manque : … » n'est plus là). `ajuster()` à l'ouverture : les repères se replient (« 3 à renseigner » reste lisible), le pied
  « Retour / Suivant — Houblons » est au premier écran à 390 × 844 comme à 1280 × 800, le bouton de l'assistant est entier et hors du
  « + » flottant ; les champs sont lisibles sur le fond du plateau. Planches `tactile390-17`, `pc1280-17`.

Verdict : **ACCEPTÉ**. Sa phrase prédite : « Là on y est, c'est ma maquette. » Le pilote lui montre, à son retour, les deux choses
qui ne viennent pas de sa maquette et qu'il doit reconnaître : la ligne « PPG — · fiche › » dans le plateau (D226) et le petit anneau
des pictos sucre, fruit et lactose, rendu de la maquette gardé tel quel (n° 8).
