OK — rejoué par le pilote le 24.10, 25/25 : Suggérer refait sur sa base v4.10 et q2b (D117), traits lus au toucher (D110), en-tête commun et croix (D109, D118, D119), cartes aux teintes de q2b ; G5 avec --regle-n1 (sa base sans titre ni contexte) et G21 sur l'encre du thème, décisions du pilote.

(Avant le rejeu du 24.10 : ECHEC — G5 (question et contexte exigés, contraires à sa base, D117) ; G21 (Substituer, encre #666 de p1) ; reste vert)

## Reprise D117, D110, D109, D118, D119 (23.10, nuit)

Ses mots : D117 « J'ai l'impression que cette vue suggestions et pas la bonne que j'ai vraiment choisir ?? » ; D110 « Un peu
dur à comprendre ce système de petit bar » ; D109 « Juste une croix bien positionné, facile, dans le thème suffirait » ;
D118 « Je veux juste retour au "menu" pas principal » ; D119 « Header qui change ??? ».

### Ce qui est fait
- **D117 : Suggérer refait sur consolide-b-390.png et q2b-b-390.png**, élément par élément. Les 16 éléments de
  l'inventaire q2b complété sont là : 15 repris, 1 écarté (la bande visée, D91).
  - Les onglets sont dans l'en-tête ; il n'y a plus de question en titre ni de ligne « fixé ».
  - Le bandeau IBU · OG · EBC est le `Bandeau` de Ma bière, importé ; il reste collé sous la tête quand la liste défile.
  - Les cartes d'objectif suivent l'ordre de la base : Plus floral, puis Moins résineux. « Hors houblon › » déplie en bas
    « Hors houblon · résineux (4 pistes) », comme dans la base.
  - Chaque voie a ses objectifs cerclés (cercle à l'encre si les fiches marquent la famille, picto pâle si elles ne font
    que la citer), son ♡ et un « + » de 40 px.
  - Les voies d'un même effet sont dans un cadre blanc à bord gauche noir de 6 px. La barre noire « Comparer (n) » fait
    toute la largeur et reste posée sur la liste.
  - Gardés, parce qu'il les a dits : l'usage en mot (D90), sans la bande visée (D91), les pistes l5b (D92).
- **D110 : les traits lisibles au toucher** (`ecrans/suggerer/bulle.tsx`). Toucher une case montre au-dessus d'elle une
  bulle à l'encre : la famille, sa valeur, puis la clé du signe touché. Rien n'est ajouté au repos. Un toucher ailleurs
  ou Échap la ferme, et elle suit sa case au défilement. À 1280, le survol la montre et le clic la fixe.
- **D109, D118, D119 : une tête, une croix.**
  - Dans `commun/Onglets.tsx` (`Croix`, `TeteOutil`), la croix remplace le « ‹ » : 44 × 44 px, icône de 22 px dessinée
    pleine (une seule épaisseur de trait, D83 S4), encre #222. Elle appelle `revenirMaBiere` et ramène donc toujours à
    #/ma-biere. Le retour du téléphone et Échap reviennent toujours d'un seul écran.
  - `CadreOutil` (`commun/Cadres.tsx`) passe en `mobileHeader` les `Onglets` pour Suggérer et Comparer, et `TeteOutil`
    (la croix, puis la question) pour Dryhopper, Levure et Substituer.
  - `commun/retour.css` montre cette tête à toutes les largeurs et masque le titre par défaut du PageShell, qui n'est pas
    modifié. La règle vaut aussi pour toute page dont la tête porte les onglets : l'onglet Ma bière en hérite sans que
    `ecrans/biere` soit touché, et son double des onglets à l'ordinateur est masqué.
  - `navigation.tsx` n'est pas modifié : `revenirMaBiere` suffisait.

### Textes montrés au toucher (390, première voie Golding, puis l'assemblage)
- picto floral : « Floral +0,9 cran · 1 trait = 1 cran du style » ;
- picto épicé (extra) : « Épicé +1,6 cran · 1 trait = 1 cran du style » ;
- picto résineux (inconnu) : « Résineux ? non établi · rien de simulé, jamais 0 » ;
- floral de Motueka + Citra cryo : « Floral +0,4 cran » ; à 1280, au clic sur Aurum : « Floral +0,9 cran ».
- Bulle : 52 px de haut, centrée à environ 50 px du picto. Ni la route ni `aComparer` ne bougent.

### Mesures de la croix (controle-retour)
Croix 44 × 44 px, icône de 22 px #222222, en-tête de 53 px (bloc 53).
- Centre (30, 26) à 390 et (286, 26) à 1280, le même sur les huit écrans à onglets ou outils.
- Elle mène à #/ma-biere depuis l'étape, depuis l'onglet et depuis Comparer ouvert par Suggérer.
- L'encre mesurée de la page vaut #333 sur biere et suggerer, #111 sur comparer, dryhopper et levure, #666 sur substituer.

### Critères (rejoués après la dernière retouche, construction parcours-p2)
| Critère | Sortie |
|---|---|
| G1 | CONSTRUIT OK (9 pages) |
| G2 | TYPES OK |
| G3 | COMMUN OK (`--sans=mots` ; LEGENDE OK, TRAIT OK, STANDARD OK) |
| G4 | MOTS OK (70) |
| G5 | **UNE-QUESTION ECHEC 2** : aucun titre visible ; pas de ligne `[data-role="contexte"]`. Le facteur libre reste le houblon |
| G6 | AUTRES OK (17 voies, 17 avec extras) |
| G7 | PISTE OK (2 pistes de 354 px) |
| G8 | PLACE OK (6 voies au premier écran, médiane 85 px) |
| G9 | MA-BIERE OK |
| G10 | ALPHA OK (17/17) |
| G11 | ETAPE OK (suggerer), avec 2 gestes D110 ajoutés au `jeu.mjs` (bulle, puis fermeture au toucher ailleurs) |
| G12 | PONTS OK (17 gestes), avec les scripts mis à jour par le pilote pour D118 |
| G13 | TOLERANCE OK (6 tests) |
| G14 | APP INTACTE OK |
| G15 | NOTE OK |
| G17 | REPRISE OK (15 repris, 1 écarté) |
| G18 | CHOIX OK (1 écran conforme) |
| G19 | TEINTE OK 1/1 (teinte 4) |
| G20 | TRAITS OK (6 touchés, 2 largeurs ; règles 1 à 5 OK à 390 et 1280) |
| G21 | **RETOUR ECHEC 10/12** : substituer 390 et 1280, « icône #222222, encre du texte #666666 (écart 68) » |
| G22 | PARCOURS OK (29 gestes à 390, 29 à 1280) |
| G24 | CHOIX OK (inventaire complété) |
| G25 | RETOUR OK (biere, suggerer, comparer × 2 largeurs, 3 parcours) |

### Captures ouvertes (en image, L12)
Dossier : `prototypes/houblons-v4/maquettes/parcours-p2/captures-p2/`.
- `cote-a-cote-390.png` : la maquette à côté de consolide-b-390.png et de q2b-b-390.png.
- `cote-a-cote-toucher-390.png` : les trois bulles (floral, épicé, inconnu).
- `tetes-390.png` : les onglets Ma bière, Suggestions et Comparer, avec la même tête et la même croix.
- `tetes-outils-390.png` : Dryhopper, Levure et Substituer, avec la croix au même endroit.
- `suggerer-repos-390.png`, `suggerer-repos-1280.png`, `suggerer-clic-aurum-1280.png`, `suggerer-bas-390.png`.
- `suggerer-toucher-golding-390.png`, `suggerer-toucher-epice-390.png`, `suggerer-toucher-inconnu-390.png`,
  `suggerer-toucher-assembler-390.png`.
- `tete-*-390.png`, `tete-comparer-1280.png`, `tete-biere-1280.png`.
- Mon jugement, côte à côte : il reconnaît la base. Restent deux différences : chaque voie est plus haute (environ
  69 px contre 60, à cause de l'α et du mot d'usage), et la piste remplace la barre de groupe sur l'axe central (D92).

### Écarts à sa base, avec leur raison
- Le « ? » de la légende reste, discret, entre les deux lentilles. Ce sont ses mots, D89 (« il faut un bouton légende un
  peu caché pour pas que ça gêne »), et `controle-legende` dans G3 l'exige. L'inventaire D117 le dit pourtant « en plus ».
- Le verdict floral est « Atteint », calculé par le moteur en direct ; la base disait « Approche ».
- Le repli « IBU après chaque voie » de la base est absent : l'adaptateur ne donne pas l'IBU d'une voie.
- α sur chaque voie (D87), rayons de 8 px (D83), pictos au trait du socle (D88, D93).

## Teinte des cartes (24.10)
- Reprise en couleurs seulement (D74) : la carte prend le dégradé de la base (`q-tuile`), du blanc vers le fond de sa
  famille relevé de 18 % de sa couleur (#e6d2f2 et #cfe5de dans la base). « Approche » passe en #4f46e5, comme dans la
  base ; « Aucune » (#475569) et « Atteint » (#0e7490) y étaient déjà.
- Les pictos restent au trait du socle (D88, D93) et les rayons à 8 px (D83).
- Contrôles : TEINTE OK 1/1 (teinte 0, q2b 4), CHOIX OK, COMMUN OK. Capture ouverte, côte à côte avec
  consolide-b-390.png et q2b-b-390.png : `captures-p2/cote-a-cote-teinte-390.png`.

## Reprise D110 et D109
Remplacée par la section précédente : D109 est devenue la croix (son second mot), et D118 et D119 s'y ajoutent. Les
textes au toucher (en crans) et les mesures de la croix (44 px, à 390 et à 1280) y sont, côte à côte avec q2b.

DÉCISION À PRENDRE :
- G5 contre la règle n° 1 : sa base v4.10 n'a ni question en titre ni ligne de contexte, et D117 les compte comme des
  ajouts. Je propose de jouer `controle-une-question` sur Suggérer avec un titre lu sur la tête (`aria-label` des
  onglets, ou `data-role="titre"` porté par l'onglet actif) et sans ligne de contexte. Le contrôle du facteur libre
  (houblon seul) reste vert.
- Le « ? » de la légende : D89 (ses mots, garde dans G3) contre l'inventaire D117 (« aucun « ? » »). Il est gardé ;
  à trancher.
- G21 sur Substituer (voie p1) : la couleur la plus fréquente de sa page est le gris #666, donc une croix à l'encre
  échoue. Soit Substituer met son texte courant à l'encre, soit `controle-retour` prend l'encre des titres.

Besoins dans les autres voies (sans écriture de ma part) :
- p3 (Comparer) : `CadreOutil` lui donne maintenant la tête à onglets (D119). Sa question reste visible en tête du
  contenu, en h1 (marque r6a-question, D104), et Comparer reste à 80 mots au plus. Elle peut passer
  `questionVisible={false}` si sa base n'en a pas.
- p1 (onglet Ma bière) : retirer son double `hidden sm:block` des onglets, que `retour.css` masque déjà. Les onglets
  inactifs y passent en cave-200 (contraste 4,5:1), comme sur Suggérer.
- p1 : exporter la table des goûts de la fiche (`GOUTS`), pour que le ♡ de Suggérer et celui de la fiche ne fassent qu'un.

Fichiers écrits :
- `parcours/src/ecrans/suggerer/` : `index.tsx`, `briques.tsx`, `bulle.tsx` (neuf), `suggerer.css`, `jeu.mjs`, `NOTE.md` ;
- `parcours/src/commun/` : `Cadres.tsx` (CadreOutil), `Onglets.tsx`, `retour.css` (neuf) ;
- captures dans `maquettes/parcours-p2/captures-p2/`.

Pas touchés : `voies.ts` (à p1), `navigation.tsx`, `ecrans/biere`, `ecrans/comparer`, les scripts d'`outils/`.

Prédiction : « Là oui, c'est ma vue Suggestions » ; il touchera un picto et lira « Floral +0,9 cran » sans chercher le
« ? ».

CONNAISSANCE : la tête d'un outil de la maquette passe par `mobileHeader` de PageShell, que `commun/retour.css` montre à
toutes les largeurs. Dans l'app, il faudra une prop `header` de PageShell.
LEÇON PROPOSÉE : un contrôle de forme (une-question, légende) écrit avant le choix du brasseur se rejoue contre sa
maquette choisie avant d'entrer dans les GATES d'une reprise. Sinon, il exige ce que la règle n° 1 interdit (G5 ici).

## Version précédente (Retouches D106, reprise D105)


- Crochet de test unique (23.10, soir) : `window.__suggerer` est retiré de l'écran et de `outils/instantane.mjs`.
  - `jeu.mjs` bannit puis rétablit l'épicé par `window.__parcours.envoyer({ type: 'visee/fixer', … })`.
  - L'instantané lit l'ordre des voies à l'écran (`data-voie`, `data-id`) et prend leurs effets dans le moteur.
  - Rejoué : G1 CONSTRUIT OK (9 pages), G11 ETAPE OK (suggerer), G12 PONTS OK (19 gestes), G17 REPRISE OK (11 repris,
    1 écarté), G19 TEINTE OK 1/1, G6 AUTRES OK.

## Retouches D106 et visée commune (23.10, soir)

- **Teinte (D106).** Les cartes d'objectif sont ramenées à la hauteur de q2b : verdict sur une ligne, plus de nom sous
  « Atteint », trois cartes par rang au plus. Leur teinte est adoucie vers la page.
  - Le thème des maquettes vient du socle.
  - controle-teinte : fond #FCFCFC, encre #101010, teinte 4 (q2b : 4). Sortie : TEINTE OK 1/1.
  - L'onglet inactif du socle passait sous 4,5:1 sur ce thème (« Ma bière » à 4,47:1). Je le fonce dans ma feuille ;
    à reprendre dans `Onglets`.
- **Visée commune.** Les objectifs et la direction de `proposer` viennent de `useVisee()`. Une famille « banni »
  écarte toute voie dont un houblon la cite, dry hop compris (règle V5.5 des exclusions). Elle se voit sur sa carte :
  « Sans épicé · Bannie · 8 voies écartées » (capture `suggerer-d106-banni-epice-390.png`).
- **Geste ajouté à `jeu.mjs`** : bannir l'épicé dans l'état commun. Les voies qui citent l'épicé (Golding, Aurum, East
  Kent Goldings, Columbus…) disparaissent, la carte le dit, puis le bannissement est levé et elles reviennent.
  - Besoin socle ou p1 : l'onglet Ma bière (écran `biere`) garde encore sa visée en état local, sans
    `fixerVisee`, et `window.__parcours` n'expose pas les gestes.
  - Le geste passe donc par `fixerVisee`, exposé par mon écran dans `window.__suggerer` (maquette seulement).
- Mots au premier écran : 75 (une ligne de voie un peu plus haute, « = » et « Assembler 5+5 g » écrits plus court).

| Critère | Sortie (rejouée après la dernière retouche) |
|---|---|
| G1 | CONSTRUIT OK (9 pages) |
| G2 | TYPES OK |
| G3 | COMMUN OK |
| G4 | suggerer 75 mots, MOTS OK |
| G5 | UNE-QUESTION OK (1 groupe libre : houblon) |
| G6 | AUTRES OK |
| G7 | PISTE OK |
| G8 | PLACE OK (7 voies au premier écran, médiane 85 px) |
| G9 | MA-BIERE OK |
| G10 | ALPHA OK |
| G11 | ETAPE OK (suggerer), avec le bannissement |
| G12 | PONTS OK (19 gestes) |
| G13 | Test Files 1 passed |
| G14 | APP INTACTE OK |
| G15 | NOTE OK |
| G16 | NOTE OK |
| G17 | REPRISE OK (11 repris, 1 écarté) |
| G18 | CHOIX OK (1 écran conforme à son choix) |
| G19 | TEINTE OK 1/1 |

Captures ouvertes (même dossier `captures-suggerer/`) :
- `suggerer-d106-390.png`, à côté de q2b-b-390.png ;
- `suggerer-d106-banni-epice-390.png` ;
- `suggerer-d106-1280.png`.

## Reprise D105

Suggérer redevient q2b, tel que le brasseur l'a choisi. Il est calculé en direct ; la carte (fils22) ne donne plus que
les ponts.

### En tête

- Les onglets du socle « Ma bière · Suggestions · Comparer (n) », dans un `nav`. Un seul « ‹ », celui de l'en-tête.
- « ? » (légende), « Au style / Absolu » et « Barres / Radar ». La vue Radar est un vrai radar : ma bière, la zone du
  style, les voies retenues, les familles inconnues marquées « ? ».
- Les cartes d'objectif de la dégustation, teintées de leur famille, avec le verdict en un mot :
  - « Moins résineux » : « Aucune voie houblon » et « Hors houblon › », qui ouvre les quatre pistes hors modèle du
    moteur (`offModelLeads`) ;
  - « Plus floral » : « Atteint », et le nom de la meilleure voie (Idaho 7).
- Sous les cartes, la piste l5b de chaque objectif (D92). Le résineux passe à l'orangé au-delà du style.

### Les voies

Elles viennent de `proposer(recette, direction)` (14 voies, dont 13 montrées) et du dry hop de `suggerer`. Elles sont
rangées comme dans q2b (`voies.ts`) :
- « = même effet sur tes objectifs · 10 g · 10′ » : Golding, Motueka, Aurum, East Kent Goldings, Columbus,
  Motueka + Citra cryo, Citra cryo. L'effet du groupe est dessiné une fois (~+0,9 cran).
- « Assembler 5 + 5 g · 10′ · estimé » : Motueka + Nelson Sauvin.
- « Remplacer Nugget · 60′ » : 5 remplaçants à IBU égal, avec leur dose (74 g, 24 g…).
- « Dry hop · 4 g/L · après 3 j · estimé » : Idaho 7, Target, Cascade, Galaxy.

Chaque ligne montre :
- l'usage en mot court (amer, arôme, mixte) ;
- le nom, l'α du lot (« ≠ » s'il sort des fiches), la dose ;
- le stock en icône (coche, moins, chariot) ;
- les familles en pictos, alignées, avec un trait par cran, orangées hors style ;
- un « + » ou un ✓ à droite.

Le « + » / ✓ est branché sur `useComparaison` / `basculerComparaison` ; un assemblage ajoute ses deux houblons. La
barre « Comparer (n) » ouvre Comparer avec la liste.

Deux voies sont proposées au départ, comme q2b avait une voie cochée : Motueka (meilleure du stock à 10′) et Idaho 7
(meilleur dry hop).

Gardés de la version précédente : l'appui long et le survol ouvrent la fiche (`useGestesFiche` de p1), et le retour la
ferme.

### Fichiers

Dans `prototypes/houblons-v4/parcours/src/ecrans/suggerer/` :
- `index.tsx` (réécrit) ;
- `voies.ts` (nouveau, pur) ;
- `radar.tsx` (nouveau) ;
- `briques.tsx`, `suggerer.css`, `jeu.mjs` (réécrit), `NOTE.md` (avec « ## Reprise ») ;
- `cas-direct.json` et `outils/instantane.mjs`.

### Critères (rejoués après la dernière retouche)

| Critère | Sortie |
|---|---|
| G1 | CONSTRUIT OK (9 pages) |
| G2 | TYPES OK |
| G3 | COMMUN OK |
| G4 | suggerer 78 mots, MOTS OK |
| G5 | UNE-QUESTION OK (1 groupe libre : houblon) |
| G6 | AUTRES OK (17 voies) |
| G7 | PISTE OK (2 objectifs, pistes de 354 px) |
| G8 | PLACE OK (6 voies au premier écran, médiane 81 px) |
| G9 | MA-BIERE OK |
| G10 | ALPHA OK (17 voies sur 17) |
| G11 | ETAPE OK (suggerer) : 13 gestes |
| G12 | PONTS OK (19 gestes, recalcul médian 1,1 ms) |
| G13 | Test Files 1 passed |
| G14 | APP INTACTE OK |
| G15 | NOTE OK |
| G16 | NOTE OK |
| G17 | REPRISE OK (11 repris, 0 en contexte, 0 en pont, 1 écarté) |

- Les 13 gestes de G11 sont : D80 et D76 contre le moteur, « + », ✓, assemblage, Hors houblon, Absolu, Radar, fiche,
  retour, Comparer.
- Hors critères : USAGE-INTENSITE OK sur l'instantané.
- Témoin (L13) pour la vérification D80/D76 de `jeu.mjs` : intacte, elle rend true. Elle échoue sur un data-crans
  faussé, un extra retiré et un usage faussé.

### Captures ouvertes, côte à côte avec q2b-b-390.png

Dans `prototypes/houblons-v4/maquettes/parcours-p2/captures-suggerer/` :
- `suggerer-d105-390.png` : premier écran ;
- `suggerer-d105-390-legende.png` ;
- `suggerer-d105-390-assembler-remplacer.png` ;
- `suggerer-d105-390-dryhop.png` ;
- `suggerer-d105-390-radar.png` ;
- `suggerer-d105-390-hors-houblon.png` ;
- `suggerer-d105-fiche-390.png` ;
- `suggerer-d105-1280.png`.

Comparées à `fils15-s5-complexe/captures/q2b-b-390.png` et `base/captures/consolide-b-390.png` : la même suite (onglets,
réglages, cartes à verdict, groupe « = même effet », lignes à « + », Comparer (n)) et les mêmes voies de tête.

### Écarts aux nombres et à la forme de q2b

| | q2b (cas c1, lot 15) | Ici (stout S1, moteur en direct) |
|---|---|---|
| Objectifs | trois | deux (dégustation du 18.10, comme la base v4.10) ; « Plus agrumes » était un objectif du seul cas c1 |
| Groupe 10′ | Motueka, Aurum, East Kent Goldings, Columbus, Celeia… | Golding en tête (à acheter), Celeia absent : classement de `proposeVoies` |
| Floral | « Approche » | « Atteint » : le dry hop d'Idaho 7 (+23 points, +1,3 cran) dépasse le cran voulu ; les voies à 10′ font ~+0,9 cran |
| Résineux | « Aucune voie houblon » | pareil : le meilleur fait −2,6 points (remplacer Nugget), pour −10 voulus |

Autres écarts, écrits dans la NOTE :
- en plus de q2b : un titre en question et la ligne « fixé Stout 16D · US-05 », demandés par D98 ;
- l'usage en mot, pas en picto (D90) ;
- pas de ligne « Diminuer Nugget » (aucun houblon à comparer) ;
- la levure passe par l'étape Levure ;
- la bande « ‹ visée | visée » est écartée (« Ça c'est inutile », D91).

### Besoins dans le socle (pilote)

1. Ma bière, montée sous l'outil, reste lue par les contrôles du dépôt. Je la retire du rendu dans ma feuille
   (`display: none` tant que `.pq-outil-suggerer` est là). Il faudrait le faire une fois dans `CadreOutil` ou la
   coquille.
2. Le dry hop vient de `suggerer` (simulateur, dégustation comprise), pas de `proposer`. Un levier dry hop dans
   `proposeVoies` donnerait une seule source.
3. Les pistes hors houblon sont importées du moteur (`offModelLeads`). L'adaptateur devrait les exposer.
4. L'adaptateur rend 0 au lieu de `null` quand le simulateur n'a pas de données d'huile (cryo). L'écran l'écarte du dry
   hop (règle « muet »).
5. `controle-autres-ajouts` lit encore un instantané (`cas-direct.json`, `data-cas` relatif). Un mode `--direct` serait
   plus propre.

DÉCISION À PRENDRE (brasseur) : deux cartes d'objectif (la dégustation de la stout) ou trois comme dans q2b (ajouter
« Plus agrumes » serait inventer une visée).

Prédiction : « Oui, c'est mon q2b, avec les vraies voies ». Le risque : la liste est longue (17 voies) et les traits sont
petits.

CONNAISSANCE : sur la stout S1, `proposeVoies` ({ floral: +1, resin: −1 }) prend 90 à 130 ms à froid. Il rend 7 ajouts
ou assemblages au même effet floral (+15,9 points à 10′ pour 10 g) ; aucun ne baisse le résineux au-delà de −2,6
points.

LEÇON PROPOSÉE : avant de bâtir un écran de reprise, ouvrir la capture choisie et la poser à côté de la sienne dès le
premier rendu. Un contrat qui cite une carte ou une règle ne remplace pas la capture qu'il a choisie (D105).

## Version précédente (remplacée)

La première version suivait la carte (`fils22-carte/suggerer`) : candidats en dry hop, un facteur libre. Le brasseur l'a
refusée : « Je confirme que "Bière" et "Suggérer" divergent nettement du design choisi. Oui c'est quoi ce bordel ??? ».
Ce qui en reste : la fiche à l'appui long (p1), la piste l5b, les traits par cran, la règle « muet » et le témoin D80.
