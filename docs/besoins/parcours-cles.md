# Parcours clés houblons — gestes quotidiens

Les quatre gestes que le brasseur fait chaque jour avec ses houblons : choisir,
comparer, simuler, remplacer. Pour chacun : le besoin dans ses mots
([corpus](corpus-demandes.md)), le parcours visé, les contraintes chiffrées à
390 × 844 et l'état mesuré de l'app actuelle. Phase 1 de la mission #119,
17.10.2026.

> « Et je veux que sur mobile en un click, sans scroll je puisse choisir mon
> houblon et voir ce que j'ai. » (C002)

Les parcours visés décrivent le résultat attendu, pas un écran. La conception
reste ouverte jusqu'aux phases 7 et 8 ; ces contraintes servent à la juger.

## Exigence n° 0 — Utilisable avant tout

> « UX UI doit être UTILISABLE Pratique facile avec les info uniquement que
> l'on a besoin et que l'on veut... » (C165)

Cette exigence passe avant la couverture des questions. Un écran qui répond à
tout mais qui n'est pas pratique échoue. Les règles ci-dessous la rendent
vérifiable ; la phase 4 les transforme en contrôles automatiques qui échouent
sur l'app actuelle (témoin négatif). Les seuils sont des propositions, à
valider à la porte A.

| Règle | Énoncé vérifiable | Mots du brasseur | État mesuré de l'étape Houblons |
|---|---|---|---|
| U1 — Premier regard | À l'ouverture d'un geste, la première chose visible est la réponse ou l'action. Aucun paragraphe de plus d'une ligne ne la précède. | C080, C081, C076 | Échoue : paragraphe de 4 lignes sur le « dossier local » et explication de 2 lignes avant toute action. |
| U2 — Seulement l'utile par défaut | Chaque donnée visible par défaut sert le geste en cours et une question de la banque (colonne « visible par défaut »). Tout le reste s'ouvre en 1 toucher, au même endroit. | C165, C082, C083, C062 | Échoue : IBU d'une recette vide, version de l'atelier, champ de question libre, aucun houblon. |
| U3 — Une entrée par geste | Un geste a un seul point d'entrée évident depuis l'étape. | C005, C062 | Échoue : 4 entrées concurrentes (Ma bière, Décider, Explorer, Chercher une matière), aucune vers mes houblons. |
| U4 — Mots du brasseur | Aucun terme interne à l'écran. Liste initiale : V5.5, V6, dossier local, programme transmis, hypothèse comparative, canonique, provenance, creuset, adoption, reçu, ID exact. | C137, C142 | Échoue : « Atelier Houblons V5.5 », « Dossiers locaux », « Créer un dossier local », « Panorama documentaire et creuset ». |
| U5 — Un seul système visuel | Fond sombre et jetons de DESIGN.md partout ; ni panneau clair, ni police étrangère au système. | C084, C110 | Échoue : panneau clair et police à empattements dans l'atelier. |
| U6 — Rien ne couvre une commande | Bouton flottant, feuille ou clavier ne masquent aucune commande ni la valeur lue. | C106, C109 | Échoue : le + flottant couvre « Chercher ». |
| U7 — Tâche réussie sans aide | Un relecteur qui n'a pas conçu l'écran termine chaque geste courant (choisir, comparer 2, remplacer) sans aide, dans un temps fixé en phase 4. Il décrit ce qu'il a cherché sans le trouver. | C114, C128 | Non mesuré ; le geste « choisir » est impossible sans 2 touchers cachés. |

## Conditions de mesure

- Banc QA local `tests/qa/hop-recipe` : la vraie interface de production, avec
  des données isolées et le réseau externe bloqué. Construction par
  `scripts/build-hop-recipe-qa.mjs`, mesure par
  `work/refonte-frontend/outils/measure-hop-paths.mjs` (dossier local non
  versionné ; puppeteer, Chrome sans
  interface).
- Fenêtre 390 × 844 px CSS, densité 2, écran tactile, mobile.
- Recette neuve, style « American Stout » (premier choix proposé pour « Stout »).
- Stock d'exemple : 8 houblons (Nugget 250 g, East Kent Golding 500 g,
  Fuggle 300 g, Magnum 100 g, Saaz 400 g, Citra 200 g, Cascade 1 000 g, Styrian
  Golding 150 g).
- Chaque entrée est jouée depuis un état neuf. « Visible » veut dire : dans la
  zone utile et au premier plan à son centre (`elementFromPoint`), donc ni
  rogné ni caché sous un autre élément.
- Résultats bruts : [mesure-actuel-390x844-stout.json](mesure-actuel-390x844-stout.json)
  et [mesure-actuel-390x844-stout-blocs.json](mesure-actuel-390x844-stout-blocs.json).

**Limite** : le banc QA charge tout le catalogue de référence, alors que la
production n'a que 12 variétés et un stock non normalisé (#120). Les mesures
ci-dessous sont donc **favorables** à l'app actuelle.

## Mesure de l'existant : étape Houblons, 17.10.2026

Zone utile du créateur de recette à 390 × 844 :
- haut de la zone utile, sous l'en-tête et le rail des étapes : `topEdgePx` = 65 px ;
- bas de la zone utile (aucune barre basse dans le créateur) : `bottomEdgePx` = 844 px ;
- hauteur utile : `usefulHeightPx` = 779 px ;
- le bouton + flottant (environ 48 px de diamètre, lu sur la capture) couvre le
  coin bas droit, de 780 à 828 px environ.

Pour atteindre l'étape depuis le tableau de bord avec une recette neuve :
3 touchers (Actions rapides, Créer une recette, Houblons), plus la saisie du style.

| Entrée jouée depuis l'étape Houblons | Touchers | Mes houblons visibles sans défiler | Ce qui s'affiche | Capture |
|---|---|---|---|---|
| aucun toucher | 0 | 0 sur 8 | Barre « IBU à chaud · Tinseth » (0 IBU, repère 35–75), puis l'atelier V5.5 : paragraphe sur le « dossier local », onglets Ma bière / Décider / Explorer / Historique, champ « Ta question » | [capture](captures/actuel-390-stout-0-etape-houblons.png) |
| Ouvrir la liste (lignes de houblon) | 2 | 6 sur 8 | Après « Corriger les lignes de houblon · 0 » puis la liste « Ajouter un houblon en ébullition… » : « Mes articles » dans l'ordre de saisie, sans classement, avec identifiants internes et quantités tronquées | [capture](captures/actuel-390-stout-2-liste-lignes.png) |
| Chercher une matière | 1 | 0 sur 8 | « Catalogues du brasseur — Recherche serveur · écriture contrôlée par le service », champ de recherche ; le + flottant couvre le bouton « Chercher » | [capture](captures/actuel-390-stout-1-chercher-matiere.png) |
| Explorer | 1 | 0 sur 8 | « Explorer et composer », « Configurer les observations et leurs comparaisons », « Créer un dossier local pour cette exploration », police à empattements « Panorama documentaire et creuset » | [capture](captures/actuel-390-stout-1-explorer.png) |
| Décider | 1 | 0 sur 8 | Même champ « Ta question », puis « Répondre, puis arbitrer » | [capture](captures/actuel-390-stout-1-decider.png) |

Position des blocs sans toucher (premier passage, haut de l'élément) :
« Amertume et répartition » à 148 px, « Corriger les lignes de houblon » à
298 px, « Atelier Houblons V5.5 » à 347 px, onglets à 528 px, « Ta question » à
586 px, « Lire ma question » à 704 px. Les 779 px utiles sont occupés avant le
moindre houblon.

Réaction du brasseur à la capture de l'étape (C150) : « Ça ne respecte rien de
mes critères UX UI, c'est une catastrophe » ([capture annotée](captures/2026-10-17-humain-atelier-v55-annote.jpg)).

Écarts constatés avec ses règles :
- panneau clair dans une app sombre (C084 : « visuel sombre mais compact ») ;
- explication technique avant l'action (C080, C081) ;
- version interne affichée (« V5.5 », « dossier local ») ;
- aucun houblon du stock au premier écran (C002) ;
- quatre entrées concurrentes (Ma bière, Décider, Explorer, Chercher), dont
  aucune ne mène à mes houblons ;
- le + flottant couvre une commande (« Chercher »).

## Budget vertical à 390 × 844

Dimensions de [DESIGN.md](../../DESIGN.md) (section « Dimensions compactes ») :
ligne de données sur deux lignes 40–48 px ; onglets, filtres ou barre d'outils
28–32 px ; en-tête de feuille 36 px ; marge latérale 8–12 px ; cible tactile
24 px au moins.

Contraintes qui en découlent pour « les 5 premiers houblons visibles sans
défilement, avec la quantité en stock » (critère du brief, § 6) :
- 5 lignes de 48 px = 240 px ; avec un en-tête de 36 px et une rangée de filtre
  de 32 px, la liste prend 308 px ;
- dans la zone utile de 779 px, la liste peut donc commencer jusqu'à 471 px
  sous le rail (y ≤ 536 px). En dessous, elle passe sous le pli ;
- la quantité en stock ne doit pas se trouver sous le bouton + flottant : la
  dernière ligne visible se termine au-dessus de 780 px, ou la quantité reste à
  gauche de 326 px ;
- une feuille montante répond aussi au critère si elle s'ouvre en un toucher et
  montre ses 5 lignes sans défiler (308 px plus la zone de sécurité).

## Geste 1 — Choisir un houblon (le cas 80 %)

**Besoin** : choisir mon houblon et voir ce que j'ai, en un toucher, sans défiler
(C002) ; tous mes houblons classés du + au − pour le style de ma recette (C001) ;
classement par style et pas par goût (C011) ; pratique, pas surchargé, hyper
lisible (C062).

**Parcours visé** :
1. Étape Houblons : la liste classée est là, ou s'ouvre en 1 toucher.
2. Ligne : nom, quantité en stock, alpha, forme, raison courte du rang.
3. 1 toucher sur la ligne : l'ajout est créé ; moment et dose se règlent sur place.

**Contraintes mesurables** :
- 1 toucher au plus depuis l'étape Houblons ;
- les 5 premiers houblons visibles sans défiler à 390 × 844, avec la quantité ;
- stock d'abord, catalogue à la demande ;
- tout style, stout comprise ; « non documenté » explicite ;
- délai d'affichage du classement : budget fixé en phase 4 (#121) ;
- même résultat en production qu'en fixture (#120).

**État mesuré** : aucun toucher : 0 sur 8 ; meilleur chemin : 2 touchers pour
6 sur 8, sans classement. Questions : Q01, Q03, Q21, Q23, Q24.

## Geste 2 — Comparer 2 à 4 houblons

**Besoin** : « pouvoir en comparé 2,3,4 facilement avec des infos ou des
simulations » (C001) ; faire mieux que l'outil de comparaison de Beer Maverick
(C068 à C070) ; comparaison alignée, écarts discriminants, inconnues visibles,
comme pour la levure (C077).

**Parcours visé** :
1. Dans la liste classée, sélection des houblons à comparer.
2. Vue côte à côte : mêmes axes, mêmes unités, écarts mis en avant.
3. Simulation de chaque houblon dans ma recette (geste 3).

**Contraintes mesurables** :
- critère du brief : 3 touchers au plus pour comparer 2 à 4 houblons (D10). Une
  sélection un par un suivie de « Comparer » prend 3 touchers pour 2 houblons
  mais 5 pour 4 : la conception doit offrir une sélection groupée ou une
  comparaison proposée d'emblée pour tenir le critère jusqu'à 4 ;
- lecture côte à côte nette à 390 px : avec 8 px de marge de chaque côté et une
  colonne de libellés de 88 px, il reste 286 px, soit environ 71 px par houblon
  pour 4 houblons. Les valeurs (« 13,5 % », « 250 g ») tiennent en 13 px mono ;
  les noms longs demandent deux lignes ou une pastille ;
- aucune ligne horizontale à faire défiler pour 4 houblons.

**État mesuré** : « Explorer » s'ouvre en 1 toucher mais ne montre aucun
houblon du stock (0 sur 8). L'ancien panneau de comparaison a été retiré
(corpus A13). Questions : Q02, Q05, Q16.

## Geste 3 — Simuler

**Besoin** : « avec des infos ou des simulations » (C001) ; simuler toutes les
courbes de saveur et de chimie et l'addition de tous les ajouts (C015) ; savoir
ce que donne tel ajout, à tel moment, avec telle levure (C016) ; aujourd'hui
« aucune simulation semble fonctionner » (C006).

**Parcours visé** :
1. Je règle une dose ou un moment sur une ligne, ou dans la comparaison.
2. L'IBU, le profil aromatique et leurs plages se mettent à jour sur place.
3. Le total du programme se lit sans changer d'écran.

**Contraintes mesurables** :
- résultat affiché en moins d'1 s après le choix, par calcul local (critère du
  brief) ;
- unités jamais mélangées (C049) ; estimations en plage avec leur base ;
- mémoire de l'onglet sous un budget fixé en phase 4 (aujourd'hui 3,5 Go en
  comparant, #107) ;
- calcul du catalogue complet hors du geste courant (Q09 : environ 54 s, #27).

**État mesuré** : seule la barre « IBU à chaud · Tinseth » est visible sans
toucher ; aucune simulation aromatique n'est atteinte depuis l'étape.
Questions : Q12, Q15, Q17, Q19, Q20, Q25.

## Geste 4 — Remplacer un houblon

**Besoin** : houblon indisponible, « avec quoi le mettre. Quesque je gagne
perds » (C055) ; « Donner des alternatives » (C031) ; des substituts « pas
forcément en stock » mais disponibles en Suisse (C032) ; Saaz remplacé par
Styrian Golding (C050).

**Parcours visé** :
1. Sur une ligne de houblon : « Remplacer » (1 toucher).
2. Remplaçants classés, stock d'abord, chacun avec gagné / perdu et la dose pour
   garder l'IBU.
3. 1 toucher pour appliquer ; retour possible.

**Contraintes mesurables** :
- 2 touchers du houblon à remplacer au remplacement appliqué ;
- les 5 premiers remplaçants visibles sans défiler, avec leur dose ;
- dose à IBU égal calculée localement en moins d'1 s ;
- remplaçants hors stock marqués « à acheter », avec la source de l'offre.

**État mesuré** : non joué en rendu (phase 2). Le code calcule une dose et des
blocages (`findHopSubstitutions`), sans similarité aromatique. Questions : Q05,
Q06, Q18, Q30.

## Contraintes communes aux quatre gestes

- Mobile d'abord ; vérifier aussi 1280 px (PRODUCT.md). Cette phase n'a mesuré
  que 390 × 844 ; le bureau est mesuré en phase 2.
- Fond sombre et densité de DESIGN.md ; actions visibles, explications repliées
  (C080, C084).
- Jamais de `type="number"` ; cibles de 24 px au moins sans chevauchement ;
  contraste et zoom conservés (DESIGN.md).
- Hors ligne : le classement et les simulations restent utilisables sans réseau,
  à partir des données locales.
- Données réelles : les contrôles se jouent aussi sur un instantané en lecture
  seule de la production (#120), puis sur l'app déployée.
