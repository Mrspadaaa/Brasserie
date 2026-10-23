ECHEC — G4 : 96 mots pour 80, fil d'étapes de l'app (D116) ; D111, D112, D113, D116, D121 verts

## Fichiers écrits (dans « Possède » seulement)
- `prototypes/houblons-v4/parcours/src/ecrans/ma-biere/` : `index.tsx`, `Rail.tsx` (moment par 5′, loupe),
  `RadarBiere.tsx` (m4), `Lentille.tsx` (SegmentedControl balisé), `repere.ts` (ce qui vient de changer),
  `ma-biere.css`, `jeu.mjs` (18 gestes), `NOTE.md`.
- `…/ecrans/fiche/` : `index.tsx` (route), `FicheHoublon.tsx` (composant et `useFiche`), `briques.tsx` (AlphaLu,
  Usage, StockIcone, Intensite, Autres), `gestes.ts` (appui long, survol), `Silhouette.tsx`, `fiche.css`,
  `jeu.mjs` (10 gestes), `NOTE.md`.
- `…/ecrans/substituer/` : `index.tsx`, `substituer.css`, `jeu.mjs` (7 gestes), `NOTE.md`.
- Sortie de construction : `prototypes/houblons-v4/maquettes/parcours-p1/`. `git status` : rien d'autre à moi.

## Sortie décisive de chaque critère (dernier rejeu, sur le socle corrigé)
- G1 `CONSTRUIT OK (8 pages)` · G2 `TYPES OK` · G3 `COMMUN OK` (ma-biere) · G4 `ma-biere 65 mots` / `MOTS OK`
- G5 `MA-BIERE OK` · G6 `ALPHA OK` · G7 `FICHE OK 1/1` · G8 `FICHE-BASELINE OK` (7 familles, 7 pictos, 0 faute)
- G9 `SANS-FAMILLE OK` (Nugget à 14 % : rien à montrer au repos). En plus, sur Substituer au seuil 0,25 :
  `SANS-FAMILLE OK (2 houblon(s) au-dessus de 25 %, part « autres » visible)` (Nelson Sauvin 83 %, Galaxy 29 %).
- G10 `COMMUN OK` (substituer) · G11 `ETAPE OK (substituer)` · G12 `PONTS OK (19 gestes, recalcul médian 1,1 ms)`
- G13 `Test Files 1 passed` · G14 `APP INTACTE OK` · G15 `NOTE OK`
- Demande du pilote (1) : `UNE-QUESTION OK (1 groupe libre : houblon)`. `data-libre="houblon"` est sur le groupe des
  remplaçants, `data-lecture` sur les lentilles. « Remplacer › » ne porte plus le nom, que D98 lisait comme un
  second choix : le nom est dans le dock, à gauche.
- Demande du pilote (2), corrigée chez moi :
  - `data-role="fiche"` est reposé à chaque image jusqu'à l'attache de la feuille (portail), 30 images au plus ;
  - le click qui suit l'appui long est avalé en capture pendant 350 ms (`avalerClic`, `fiche/gestes.ts`) ;
  - le pont provisoire de Comparer peut tomber.
- Mon contournement « Ma bière cachée sous un outil » est retiré. Le repère de changement survit au démontage :
  un instantané au niveau du module, et `noterAvant` appelé par Substituer.

## Captures ouvertes et regardées (scratchpad, dossier `p1/`)
- 390 px :
  - `p1/cap/ma-biere-390.png` et `p1/cap/ma-biere-radar-390.png` ;
  - le geste, doigt posé (loupe 10′ 5′ **0′** WP actif 1 j) : `p1/cap/ma-biere-glisser-pendant-390.png` ;
  - `p1/cap/fiche-390.png` et `p1/cap/substituer-390.png` ;
  - parcours entier : `p1/ponts/11-ajouter-a-ma-biere.png` (ligne Idaho 7 ajoutée, barres « ~+27 » floral) et
    `p1/ponts/13-remplacer.png` (« à la place de Nugget », IBU 60).
- 1280 px : `p1/cap/ma-biere-1280.png`, `p1/cap/ma-biere-survol-1280.png` (le survol de 900 ms ouvre la fiche) et
  `p1/cap/substituer-1280.png`.
- Chemin complet du dossier : `C:\Users\mrspa\AppData\Local\Temp\claude\C--Users-mrspa--codex-worktrees-openai-clean-start-Brasserie\6bed03f4-a8d6-468f-8115-deafa40df0cf\scratchpad\p1\`.

## Écarts et raisons (détail dans les NOTE)
- Rail du moment horizontal, sur la ligne du houblon, au lieu du rail vertical de l8 : un geste par ligne, le même
  modèle que la frise de Dryhopper, et un geste que le script peut jouer. Il demande 14 px de doigt au moins par
  cran (D46).
- Dose de Substituer au demi-gramme : le gramme du moteur laissait jusqu'à 0,65 IBU d'écart, et le contrat demande
  0,5.
- `data-houblon` porte le nom (et non la clé) dans Substituer et sur la part « autres » : D100 les cherche par nom.

## Besoins dans le socle (au pilote)
- `SegmentedControl` (app) n'accepte pas d'attribut par option : `data-e` et `data-vue` sont posés après le rendu.
- `Sheet` n'accepte pas de `data-*` : `data-role="fiche"` est posé par le DOM.
- Le cadre paille autour de `main` paraît encore sur mes captures à 1280 px de Substituer, prises après le
  correctif annoncé : à vérifier sur le dernier socle (D33, « des truc jaune »).
- Convention de `data-houblon` à trancher pour tout le parcours : la clé, que demande le contrat (`--ponts`), ou le
  nom, que lit D100.

Prédiction : « Ma bière, vachement bien, je vois enfin l'α, le rôle et ce que chaque houblon apporte. Mais le rail
est petit, et Substituer est dense : il faut défiler pour voir les autres. »

DÉCISION À PRENDRE : la convention de `data-houblon` (clé ou nom). D100 et `controle-alpha` lisent le nom, les
ponts lisent la clé.
CONNAISSANCE : à 60′ dans la stout 16D, aucun remplaçant en stock de Nugget ne baisse le résineux de plus de
~1 point simulé. La part dégustée domine : Substituer ne répond pas à « moins résineuse ».
LEÇON PROPOSÉE : un contrôle qui cherche le premier `[data-houblon]` visible lit aussi l'écran du dessous. Un écran
recouvert doit être démonté, pas seulement rendu inerte (fait par le socle le 23.10).

## Reprise D105 (23.10, soir)

Les deux écrans reprennent ses maquettes de la base v4.10, et non plus la carte en fil de fer. Fiche et Substituer
n'ont changé que pour deux demandes : la forme courte de data-source sur l'usage (D80), et un appui long qui couvre
toute la carte. Le reste est dans les NOTE (section « ## Reprise »).

- **Étape Houblons** (route ma-biere, base/consolide/index.html) :
  - « Houblons 3/7 » et « 16D hypothèse » ; le bandeau en pilule ;
  - la frise verticale : ébullition 60′, 0′, whirlpool, la levure posée dedans, fermentation, post-fermentation ;
  - chaque ajout à son moment, avec sa carte : nom, « ébullition ⟳ », − dose +, ×, α, rôle, « résine 2/4 », IBU, bande
    des familles et traits D80 ;
  - le repère « 60′ » glissé de haut en bas par 5′, jusqu'au dry hop en jours, avec une loupe ; l'ébullition est à
    l'échelle du temps ;
  - « Ajouter — houblon… » (filtre du stock) et 2 ajouts rapides à 10 g et 10′ ;
  - « Résineux trop marqué », « + floral », et « › » vers l'onglet ; les 12 familles en deux colonnes.
  - Fichiers : ma-biere/index.tsx, Frise.tsx, Carte.tsx, Ajouter.tsx, Base.tsx, repere.ts, Lentille.tsx,
    RadarBiere.tsx, ma-biere.css. Rail.tsx (le rail horizontal, rejeté) est supprimé.
- **Onglet Ma bière** (route biere, base/consolide/biere.html, src/ecrans/biere/) :
  - les onglets (Onglets du socle), le bandeau, « Résineux trop marqué », Barres / Radar et Au style / Absolu ;
  - « 7 au style · 4 non situées » (compté sur le moteur ; la base disait 6 et 5 sur ses données de l'époque) ;
  - la légende « dégusté 18.10 · prévu · non situé », « zone du style · au-dessus », la barre de la base, et
    « ×2,8 » en rouge ;
  - « bannir · − · sans visée · + » sous la famille touchée (résineux ouvert au repos) ;
  - les objectifs « + floral · − résineux · + … » vers Suggérer, et « Prévu avec SafAle US-05, caractérisée ».
  - Ajout : « surtout Nugget, 46 g à 60′ » sous l'alerte. C'est le houblon qui porte la famille trop marquée, et le
    nom d'un houblon que l'appui long ouvre (D25 sur cette page).

### Sorties décisives (dernier rejeu, construction à jour)
- G1 : CONSTRUIT OK (9 pages). G2 : TYPES OK. G3 : COMMUN OK.
- G4 : MOTS OK (80 mots, au plafond : un mot de plus au premier écran le fait échouer).
- G5 : MA-BIERE OK. G6 : ALPHA OK. G7 : FICHE OK 1/1. G8 : FICHE-BASELINE OK. G9 : SANS-FAMILLE OK.
- G10 : COMMUN OK. G11 : ETAPE OK (substituer). G12 : PONTS OK (19 gestes, recalcul médian 1,1 ms).
- G13 : Test Files 1 passed. G14 : APP INTACTE OK. G15 : NOTE OK.
- G17 : REPRISE OK (7 repris, 0 en contexte, 0 en pont, 0 écartés).
- G18 : REPRISE OK (10 repris, 0 en contexte, 1 en pont, 0 écartés).
- G19 : COMMUN OK. G20 : ETAPE OK (biere). D98 (Substituer) : UNE-QUESTION OK (1 groupe libre : houblon).

### Captures ouvertes, côte à côte avec la base (scratchpad, dossier p1/)
- 390 px :
  - p1/cap/plein/ma-biere-390.png et p1/cap/ma-biere-390.png, face à base/captures/consolide-390.png ;
  - p1/cap/biere-390.png, face à base/captures/consolide-biere-390.png ;
  - après le parcours : p1/ponts/13-remplacer.png (« à la place de Nugget », Idaho 7 en fermentation, Pomona dans la
    frise).
- 1280 px : p1/cap/biere-1280.png. La fiche et Substituer sont celles de la première passe, inchangées.

### Écarts (raisons dans les NOTE)
- « + floral » et « Je n'ai pas Nugget › » sur l'étape : ce sont des ponts du parcours que la base n'avait pas.
- Le « ? » de légende et Au style / Absolu sur l'étape : D75 et D89.
- Un picto devant chaque famille de l'onglet, qui passe ainsi COULEURS (D74).
- Deux ajouts rapides au lieu de trois : MOTS ≤ 80.
- Pas de sous-titre sous « Houblons 3/7 ».

### Besoins dans le socle
- jouer-parcours.mjs ne glisse qu'à l'horizontale. Le repère de la frise est vertical : son geste est joué dans la page,
  par des événements de pointeur (ma-biere/jeu.mjs). Une option axe: 'y' le jouerait au vrai doigt.
- Les visées de l'onglet (bannir, −, +) ne passent pas encore à Suggérer, dont la route n'a pas de paramètre. Tous les
  objectifs ouvrent Suggérer.
- window.__parcours est un objet neuf à chaque rendu : un verifier asynchrone doit le relire, et non garder p.

Prédiction : « Là je reconnais mes écrans, la frise et Ma bière comme je les ai choisis. Mais la carte de Nelson
Sauvin est un peu haute. »
LEÇON PROPOSÉE : une entrée « carte » ou « fil de fer » n'est jamais une base d'écran. Un brief de reprise cite la
capture de la maquette qu'il a choisie et son inventaire, et le concepteur pose les deux captures côte à côte avant
le premier contrôle.

## Rail (D27 à D69, controle-rail --parcours)

Sortie : `RAIL OK 1/1` (16 règles jouées). Non joués, faute de cas d'essai :
- D44 (whirlpool) : un seul cran au whirlpool ;
- D45, D56, D61 bis, D64 : une seule poignée de houblon sur la page (cas-k3.html à demander).

Ce qui a changé dans l'étape Houblons (la forme de la base v4.10 est gardée) :
- la frise porte `data-role="frise"`, `aria-orientation="vertical"` et `data-acquis="frise"` (zone du rail : le champ
  « Ajouter — houblon… » reste dehors, D37) ;
- une poignée par ajout : `[data-role="glisser-moment"][role="slider"]`, avec `aria-orientation="vertical"`,
  `data-houblon` (clé du moteur), `aria-valuenow` et `aria-valuetext` (« 60′ », « whirlpool », « actif · 3 j »,
  « après · 3 j »). C'est une piste verticale transparente sur la ligne du temps, posée pour qu'au repos le repère « 60′ »
  soit à côté de sa carte ;
- la ligne `[data-role="ligne-houblon"]` contient le nom balisé `data-houblon` : le contrôle l'accepte par descendant.
  Sur la ligne elle-même, l'attribut casserait D49 (controle-fiche exclut toute zone sous un `[data-houblon]`, donc
  toute la carte) ;
- D46 : le repère suit le doigt en continu ; seule la valeur s'accroche au cran ;
- D69 : un cran = min(14 px, place à l'écran ÷ crans), réglé au repos (montage, défilement, taille) ;
- D68 : la frise garde sa place pendant le geste. L'ajout change de segment au lâcher, et les valeurs (IBU, barres)
  restent en direct ;
- D47 et D63 : doigt posé, seules les graduations `[data-cran]` du segment sous le doigt s'ouvrent, à 48 px du cran
  visé puis 14 px plus loin (×3,4) ; rien au repos ;
- D61 : l'ébullition est à l'échelle du temps, 14 px par 5′ : le repère se pose où le doigt l'a lâché ;
- D36 et D37 : les pages cas-ebu45 et cas-ebu120 sont lues. Un ajout plus long que l'ébullition se lit au cran le plus
  proche (Nugget à 60′ dans une ébullition de 45′).
- La liste de la frise a des clés stables : un ajout qui change de segment est déplacé sans être remonté, et le geste
  continue.

Rejeu après le rail :
- G2 TYPES OK, G3 COMMUN OK, G4 MOTS OK (64 mots), G5 MA-BIERE OK, G6 ALPHA OK, G7 FICHE OK 1/1,
  G8 FICHE-BASELINE OK, G9 SANS-FAMILLE OK ;
- G10 COMMUN OK, G11 ETAPE OK (substituer), G12 PONTS OK (19 gestes), G13 1 passed, G14 APP INTACTE OK, G15 NOTE OK ;
- G17 REPRISE OK (7 repris), G18 REPRISE OK (10 repris, 1 en pont), G19 COMMUN OK, G20 ETAPE OK (biere) ;
- G21 et G22 CHOIX OK ; G23 RAIL OK 1/1 ; D98 UNE-QUESTION OK.

Captures regardées (390 px) :
- p1/cap/ma-biere-390.png (repos, face à base/captures/consolide-390.png) ;
- p1/cap/frise-pendant-390.png : doigt posé, « 35′ » sous le doigt, graduations 60′ à 5′ du seul segment
  d'ébullition, IBU 49 en direct ;
- p1/cap/frise-apres-390.png : la carte se pose à 35′, à l'échelle du temps ;
- p1/ponts/13-remplacer.png.

Besoins dans le socle :
- `main.tsx`, `avecEbullition` : un ajout sans champ `minutes` (Nugget, `b60`) n'est pas ramené à l'ébullition de 45′.
  La frise le lit au cran le plus proche ; la recette d'essai garde 60′.
- Les multi-houblons (D45, D56, D61 bis, D64) demandent une page cas-k3.html. La piste de chaque houblon couvre la
  colonne de la frise : avec plusieurs houblons, c'est la piste du dessus qui prend le doigt hors des repères.

Prédiction : « Là le curseur glisse vraiment comme avant, avec le zoom sous le doigt. »

## D55 (frise compacte au repos)

- Au repos, la frise s'enchaîne comme consolide-390.png : 0′ suit la carte de Nugget aussitôt, puis whirlpool, la
  levure, fermentation et post-fermentation, sans le vide de ~190 px.
- Il reste un léger retrait de 1 px par minute au-dessus d'une carte d'ébullition. Il garde la place du repère fidèle à
  son moment (D61, tolérance 0,12) : à 60′ il vaut 0.
- L'échelle du temps et la loupe ne s'ouvrent que sous le doigt. Le repère suit le doigt, avec 14 px par cran au plus
  et la course réglée jusqu'au bord de l'écran (D69). Les graduations du seul segment touché s'écartent en loupe
  (×3,4, D63), et la frise garde sa place pendant le geste (D68) puis se referme au lâcher.
- Pour passer RAIL OK, le repère est redevenu la poignée de l'ajout : [data-role="glisser-moment"][role="slider"],
  aria-orientation="vertical", data-houblon. Le contrôle lit maintenant les poignées : une seule par houblon, cas-k3
  compris (D56, D61 bis, D64 joués), et la poignée est relue chaque fois. La recherche de place d'une piste fixe ne
  passait pas D64.
- Plus d'ancrage du défilement : overflow-anchor: none. Quand un ajout change de segment au lâcher, la page ne saute
  plus.
- Captures côte à côte : p1/cap/ma-biere-390.png (repos), face à base/captures/consolide-390.png ; p1/cap/frise-pendant-390.png
  et p1/cap/frise-apres-390.png (le geste).

## D32 (bannir, −, + agissent)

- L'onglet Ma bière lit et règle la visée de l'état commun du socle. Il lit useVisee() et pose fixerVisee(famille,
  1 | -1 | 'banni' | null). Le départ est sa dégustation : plus florale, moins résineuse.
- « bannir · − · sans visée · + » changent l'état. Les objectifs suivent : « bannir floral » remplace « + floral »,
  puis « + floral » revient (pont-floral). La fiche lit la même visée pour « + Floral 2/4 − Résineux 2/4 » et ses
  flèches, et Suggérer la lira (p2).
- biere/jeu.mjs vérifie l'état (window.__parcours.etat.visee.floral === 'banni', puis 1) et l'écran : ETAPE OK (biere).
- Contraste sur le thème des maquettes (D106) :
  - Substituer : la colonne choisie est blanche et cerclée de noir, l'épinglée est grise. CONTRASTE OK.
  - L'onglet Ma bière : les onglets non actifs du socle passent à l'encre cave-200. C'est fait dans ma CSS, sous
    .pq-outil-biere, car 4,47:1 ne suffisait pas sur le fond des onglets.
- MOTS (≤ 80) : « Je n'ai pas Nugget › » devient « Sans Nugget › » (80 mots au premier écran, au plafond).

## Fiche g1

- La fiche reprend g1, élément par élément : controle-choix --ecran=fiche rend CHOIX OK. L'inventaire inventaire-fiche
  est joué (12 repris), et la NOTE de la fiche a sa section « ## Reprise ».
- Ce qu'elle reprend :
  - la feuille presque pleine, « Nugget ⊙ » et « × » ;
  - « α 9,5–16 % » en gros, « lot 13 % » et sa jauge, « double usage » ;
  - le bloc gris : la bande des 12 familles, chaque famille avec son picto au trait (D93), « 2/4 », ses mots et
    « nommé en premier » ;
  - « sans famille : gingembre, resiny », avec sa part dessinée, et « 5 non décrites : … » ;
  - le grand radar légendé (« Résineux 2/4 », « Melon? » hachuré), avec les flèches de la demande ;
  - « + Floral 2/4 − Résineux 2/4 » ; en pied, ♡ ⊘ et « Comparer » (ajoute à la comparaison et l'ouvre).
- D10 à 1280 : la feuille est bornée au cadre de 768 px de la page (p1/cap/fiche-1280.png). Le focus va sur la fiche,
  pas sur « × » : plus d'anneau sans clavier à 390 (p1/cap/fiche-390.png). À 1280, un fin cercle paraît encore
  autour de « × » sur la capture : à revoir si la supervision le relève.
- D93 B3 : le premier α de la fiche est celui du lot (data-source="lot") ; la plage en gros est data-role="fiche-alpha".
- L'API ne change pas pour Comparer, Dryhopper et Suggérer : export par défaut <Fiche houblon={cle} />, et useFiche().

### Sorties (dernier rejeu)
- G2 TYPES OK ; G3 COMMUN OK ; G4 MOTS OK (80) ; G5 MA-BIERE OK ; G6 ALPHA OK ; G7 FICHE OK 1/1 ;
  G8 FICHE-BASELINE OK ; G9 SANS-FAMILLE OK ;
- G10 COMMUN OK ; G11 ETAPE OK (substituer, après ma-biere et fiche) ; G12 PONTS OK (19 gestes) ;
  G13 1 passed ; G14 APP INTACTE OK ; G15 NOTE OK ;
- G17 REPRISE OK (7 repris) ; G18 REPRISE OK (10 repris, 1 en pont) ; G19 COMMUN OK ; G20 ETAPE OK (biere) ;
- G21 et G22 CHOIX OK ; G23 RAIL OK 1/1 (20 règles ; non joués : D44 au whirlpool, D45 sans bulle) ;
  G24 CHOIX OK (fiche) ; G25 TEINTE OK 1/1 ; D98 UNE-QUESTION OK.

Prédiction : « La fiche, on est bon, c'est la v1 ; et la frise ressemble enfin à la base. »

## Reprise D108 (23.10, nuit) : la visée de sa base, telle quelle

Ses mots, posés sur « Tropicaux prévu » : « Aussi aucun impact sur je met plus, moins bannir ect.. ». J'ai d'abord joué
sa base v4.10 (`base/consolide/biere.html`) dans Chrome, sur Tropicaux. « + » donne faible (losange relié au point), « + »
encore donne moyen ; « − » deux fois donne bannie, puis la ligne refermée montre le nom barré. Son code (`viserAbs`,
`ligneFamille`, `.visee-f`, `.lien-visee`, `.fam.bannie`) est repris tel quel.

### Fait
- **Le type, en une seule étape, avec ses lecteurs** (TYPES OK pendant que p2 et p3 construisaient) :
  - `etat/visee.ts` (nouveau, pur) : `Visee` = un palier par famille sur 0 à 3 (0 bannie, 0,5 faible, 1,5 moyen,
    2,5 marqué) ; on y trouve aussi `monter`, `descendre`, `nomPalier`, `enPoints` (× 33,33), `DEMANDE_DEGUSTEE`
    (+1 floral, −1 résineux) et `sensDe` ;
  - `etat/types.ts` (`visee: Visee` ; action `visee/fixer` avec `valeur: number | null`) ;
  - `reducteur.ts` : 0 est désormais une visée, seul null la retire. Au départ, aucune visée, comme sa base (`data-dirs`
    vide), ce qui retire `VISEE_DEPART` ;
  - `EtatParcours.tsx` (`fixerVisee(f, palier | null)`).
- **Lecteurs** :
  - `suggerer/voies.ts`, `objectifsDe` : l'écart entre ma bière et le palier, en crans entiers du style (un au
    moins). Sans visée, c'est la demande dégustée. `Objectif` gagne `palier` et `bannie` ;
  - `bannisDe` rend toujours `[]` : bannir n'exclut plus aucun houblon et devient un objectif « faire baisser »
    (visée 0) ;
  - la fiche lit `sensDe` (sa demande effective) ;
  - `Coquille.tsx` est inchangé : ses appels gardent la même signature.
- **Onglet Ma bière** (`biere/index.tsx`, `ma-biere/Base.tsx`, `ma-biere.css`) :
  - sur la piste : un losange blanc cerné d'encre `[data-visee-marque][data-niveau]`, et un trait pointillé
    `[data-visee-lien]` jusqu'au point `[data-biere-point]` ;
  - « bannir · − · [palier] · + · × » : le mot entre les boutons est `[data-palier]`, et « × » n'apparaît que
    lorsqu'une visée est posée ;
  - une famille bannie porte `[data-bannie]`, son nom est barré et grisé, ligne refermée comprise ;
  - les puces suivent les visées : pleine pour une visée posée, au trait pour la demande dégustée ;
  - `pont-floral` et `data-element` sont gardés.
- `biere/jeu.mjs` : 5 gestes de plus sur Tropicaux (repos sans losange, « + » faible relié, « + » moyen, puce
  « + tropicaux », « × »), et bannir et « + » sur Floral au nouveau format (0, puis 0,5). `biere/NOTE.md` reçoit la
  section « Reprise D108 » et ses écarts.

### Critères (rejoués après la dernière construction, avec les fichiers de p2 et p3 en l'état)
- G26 : `VISEE OK (6/6, tropical)`, avec `controle-visee.mjs` de p10. Avant qu'il n'existe, ma vérification locale
  sur le même contrat donnait 6/6 à 390 et à 1280.
- G28 et G2 : `TYPES OK`. G1 : `CONSTRUIT OK (9 pages)`.
- G20 : `ETAPE OK (biere)`. G11 : `ETAPE OK (substituer)`.
- G3, G19 et G10 : `COMMUN OK`. G10 a d'abord échoué sur S4 (une icône à 2,2 px : la croix `pq-croix-icone` de p2),
  puis il est passé au rejeu.
- G4 `MOTS OK` · G5 `MA-BIERE OK` · G6 `ALPHA OK` · G7 `FICHE OK 1/1` · G8 `FICHE-BASELINE OK` · G9 `SANS-FAMILLE OK`.
- G13 `TOLERANCE OK` · G14 `APP INTACTE OK`.
- G17 `REPRISE OK (7 repris)` · G18 `REPRISE OK (10 repris, 1 en pont)`.
- G21, G22 et G24 : `CHOIX OK`. G23 `RAIL OK 1/1` · G25 `TEINTE OK 1/1`.
- **G12 `PONTS ECHEC`** et **G27 `PARCOURS ECHEC (2)`**, au même geste : `abandon-fermer` / `abandon-retour`
  (« cible introuvable : [data-ecran="comparer"] (route #/ma-biere) »). La fermeture de Dryhopper mène à
  `#/ma-biere`, alors que les scripts attendent Comparer : c'est la croix de p2 (D118, `commun/Onglets.tsx` : « elle
  ramène toujours à l'étape Houblons »).
  - Hors de la visée : en instrumentant le geste, Comparer s'ouvre bien et Suggérer donne les mêmes proposés
    qu'avant (Motueka, Idaho 7).
  - Tous les gestes de la visée passent dans `parcours-complet` : bannir floral, « + » floral et le pont vers
    Suggérer, avec les voies du moteur pour {floral : 1, résineux : −1}.
  - À trancher entre p2 et p5 (scripts), voir plus bas.

### Suggérer, avec « + » sur Tropicaux et les agrumes bannis
- **Avant** (construction d332792c : exclusion V5.5, « + tropicaux » à 1 cran) : **1 voie sur 18** (Styrian Kolibri
  seul), comme le constat de la supervision.
- **Après** : **16 voies**, lues dans Chrome sur la page construite ; aucune carte « Bannie », aucune voie écartée.
  - Les objectifs sont : Plus tropicaux (2 crans, de 0,5 point au palier faible), Plus floral (+1, demande
    dégustée), Moins résineux (−1), Moins agrumes (−1, visée 0).
  - Les voies : Ajouter à 10′ (Petoskey, Relax, Southern Passion, Styrian Kolibri, Motueka, Citra cryo, Galaxy,
    Hallertau Blanc) ; Remplacer Nugget (Motueka, Citra cryo, Galaxy, Hallertau Blanc) ; Dry hop (Galaxy,
    Hallertau Blanc, Sabro, Cascade).

### Captures ouvertes et regardées (`prototypes/houblons-v4/maquettes/parcours-p1/captures-d108/`, hors git)
- Sa base v4.10, jouée dans Chrome : `base-tropical-ouvert.png`, `base-tropical-plus.png`, `base-tropical-plus2.png`,
  `base-tropical-moins.png`, `base-tropical-bannir.png`, `base-tropical-bannie-fermee.png`.
- La maquette à 390 : `biere-repos-390.png`, `biere-plus-390.png`, `biere-plus2-390.png`, `biere-moins-390.png`,
  `biere-bannir-ouverte-390.png`, `biere-bannir-390.png` (ligne refermée), `biere-tropical-plus-agrumes-bannis-390.png`
  et `suggerer-tropical-plus-agrumes-bannis-390.png`.
- La maquette à 1280 : `biere-repos-1280.png`, `biere-plus-1280.png`, `biere-plus2-1280.png`, `biere-moins-1280.png`,
  `biere-bannir-1280.png`.
- Côte à côte avec sa base v4.10 (`base-tropical-plus` contre `biere-plus-390` ; `base-tropical-bannie-fermee` contre
  `biere-bannir-390`), on retrouve la même grammaire : losange blanc, trait pointillé, « faible » entre « − » et « + »,
  « × », nom barré, puce pleine en bas. Deux différences, propres au moteur en direct :
  - Tropicaux vaut ici 0,5 point (0,19 sur 3 dans sa base) : le losange à 0 de la famille bannie est caché sous le
    point, et seuls le nom barré et la puce le disent ;
  - « moyen » sur Tropicaux dépasse le haut du style (30 points) : le losange va dans la zone « au-dessus », ce qui est
    exact.
- Sa réaction prévue : « Là oui, je vois ma visée » ; il pourrait ajouter qu'« − » sur Tropicaux bannit d'un coup, ce
  que sa base faisait déjà.

### Écarts (déclarés dans `biere/NOTE.md`)
- Le bouton du sens posé (+, − ou bannir) a l'encre pleine (`aria-pressed`), alors que la base n'en marquait aucun.
- La puce suit le sens réel : la base écrivait « − tropicaux » après « + » (crans arrondis vers le bas), et ce défaut
  n'est pas repris.
- Sans visée, Suggérer emploie la demande dégustée (+1 floral, −1 résineux) : ce sont les puces « + floral · −
  résineux » de sa base, au repos.

DÉCISION À PRENDRE :
- G12 et G27 : la croix D118 (p2) ferme Dryhopper vers l'étape Houblons, alors que `jouer-parcours.mjs --ponts` et
  `parcours-complet.mjs` (geste 28, `abandon-fermer`) attendent un retour à Comparer. Il faut adapter les scripts
  (p5/p0) ou le retour (p2/p11). Hors de mon contrat.
- p2 doit reprendre `suggerer/jeu.mjs` : ses gestes lisent encore `etat.visee` en crans et `'banni'`.
  - La direction de `proposer` se lit ainsi : pour chaque famille de `{floral: 1, resin: -1}` sans visée, ±1 ; pour une
    visée `v`, `d = v × 33,33 − profil[f].valeur.centre`, puis `sign(d) × max(1, round(|d| / cran))`.
  - Le geste « bannir l'épicé » doit poser `valeur: 0` et attendre un objectif « Moins épicé », plus de `[data-banni]`.
  - La carte d'une visée 0 pourrait s'intituler « Sans agrumes » (`Objectif.bannie`) ; aujourd'hui elle dit « Moins
    agrumes », et son bouton « Hors houblon » dit « pour le résineux ».
  - Mêmes lectures dans `suggerer/outils/instantane.mjs` et dans la ligne `départ { floral: 1, …}` de sa NOTE.

CONNAISSANCE : avec la visée en palier absolu, l'ensemble des voies de `proposeVoies` dépend de l'ampleur demandée.
Pour {floral : 0,57 ; résineux : −1}, il manque 5 des 13 voies de {floral : 1 ; résineux : −1}. Lire la visée en
crans entiers garde le parcours stable et rejoint l'unité de la base.

LEÇON PROPOSÉE : aucune.

## Reprise de l'étape (D111 à D113, D116, D121)

J'ai d'abord ouvert sa base v4.10 (`consolide-390.png`, `consolide-nugget-35-pendant.png`), puis lu le geste de la base
dans `consolide/index.html` (`ouvrirLoupe`, `disposerDock`, `.appui`, `@keyframes remplit`). Je n'ai touché ni
`src/commun`, ni la fiche, ni Substituer (p17).

### Fait (tout dans `prototypes/houblons-v4/parcours/src/ecrans/ma-biere/`)
- **D111, le geste de sa base** (`Frise.tsx`, `ma-biere.css`) :
  - doigt posé, la ligne tenue s'ouvre à 14 px par 5′ jusqu'à 0′, et les étapes d'après descendent d'autant ;
  - la carte se replie en puce « Nugget » à côté de la bulle « 35′ » ;
  - chaque cran est un trait sur la ligne du temps. Les minutes s'écrivent à droite du trait, à 22 px du doigt au
    moins et 24 px entre deux, comme la base (« 50′ 40′ » au-dessus, « 30′ 20′ » au-dessous) ;
  - aucune graduation ne sort de la tranche ouverte, ni ne s'écrit sur le repère d'un autre houblon ;
  - rien ne se sélectionne (`user-select` et `-webkit-touch-callout` à `none`) ;
  - hors du segment de départ (dry hop), la ligne se referme au pas du doigt et la carte revient : aucun houblon ne
    saute (D61 bis), et la frise n'a pas de vide (D55).
- **D112** (`Carte.tsx`) :
  - le nom se remplit dès le doigt posé (500 ms, comme la base), puis la fiche g1 s'ouvre (gestes de la fiche
    inchangés) ;
  - **toute la carte** est non sélectionnable, selon la décision du pilote ; c'est noté en écart dans la NOTE.
- **D113** (`LegendeGroupe.tsx`, neuf ; `Carte.tsx`, `Ajouter.tsx`) :
  - un petit « ? » au coin de la carte, et un autre à côté de « Ajouter — houblon… » ; les familles gardent la
    légende du socle ;
  - chaque légende s'ouvre sous son groupe, dans le flux, et se referme par Échap ;
  - elle nomme les 12 couleurs de la bande (dans son ordre), les traits sous les carrés, ⟳, − g +, ×,
    « résine 2/4 », α et ≠, l'usage, le cube et l'inconnu hachuré ;
  - les icônes restent.
- **D116** (`index.tsx`) :
  - `WizardStepName` et `WizardStepRail` sont importés tels quels de `src/ui/WizardStepBar.tsx` (alias `@app/`), et
    posés comme BrewWizard ;
  - au téléphone : le nom et « 3/7 » dans la rangée du titre, avec le thème et « Recommencer », puis le fil sur son
    rang (`showLabels`, `compactLabels`, 7 étapes, Houblons la 3ᵉ) ;
  - à l'ordinateur : le fil en `progress`, le titre « Modifier « Stout export » » ;
  - le badge « 16D hypothèse » est retiré, et `src/` n'est pas modifié.
- **D121** (`index.tsx`) : tout le bloc du profil (l'alerte, chaque famille) ouvre `#/biere` d'un toucher. Ses
  commandes (« ? », « + floral », Au style / Absolu) gardent leur geste.
  - **Variante retenue dans la version : A.** Le « › » noir de sa base garde sa place et dit où il mène :
    « analyse › ». C'est la plus proche de sa base (même place, même pastille noire), enrichie d'un mot (L07), et
    elle ne coûte aucune ligne.
  - Les autres variantes, sur la planche `variantes-d121/planche.html` (captures à 390 et 1280) :
    - **B** : une barre pleine sous les familles, « Ouvrir l'analyse de ma bière › » ;
    - **C** : l'alerte elle-même est l'entrée, « Résineux trop marqué · détail › ».
  - Le drapeau `?d121=b|c` sur `ma-biere/etat.html` les rejoue ; les trois ouvrent `#/biere` (vérifié dans Chrome à
    390 et 1280).

### Critères (dernière construction, avec les fichiers de p2, p3 et p17 en l'état ; G12 et G27 hors de la suite, à la demande du pilote)
- G30 `GESTE-ETAPE OK` (carte de 36 px, 7 graduations, 0 chevauchement à 45′ et à 35′) · G31 `STEPPER OK 2/2 largeurs`.
- G33 `APPUI-ETAPE OK` (retour à 3 ms, fiche à 504 ms ; `user-select` à none, touch-callout à none) ·
  G34 `LEGENDE OK` (carte : 143 mots, 12/12 ; ajouts rapides : 98 mots, 12/12) · G35 `PROFIL OK`.
- G23 `RAIL OK 1/1`. En plus, avec `--parcours` sur `cas-k3`, `cas-ebu45` et `cas-ebu120` : `RAIL OK` ×3 ; la
  construction publiée d332792c échouait sur `cas-k3`.
- G1 `CONSTRUIT OK` · G2 `TYPES OK` · G3, G10 et G19 `COMMUN OK` · G5 `MA-BIERE OK` · G6 `ALPHA OK` ·
  G7 `FICHE OK 1/1` · G8 `FICHE-BASELINE OK` · G9 `SANS-FAMILLE OK` · G11 `ETAPE OK (substituer)` ·
  G13 `TOLERANCE OK` · G14 `APP INTACTE OK` · G15 `NOTE OK` · G17 `REPRISE OK (7 repris)` · G18 `REPRISE OK` ·
  G20 `ETAPE OK (biere)` · G21, G22 et G24 `CHOIX OK` · G25 `TEINTE OK 1/1` · G26 `VISEE OK (6/6, tropical)`.
- **G4 `MOTS ECHEC` : 96 mots pour 80** ; la construction publiée en avait 80.
  - L'écart vient du fil de l'app : ses 7 étiquettes, « 3/7 », et les 5 mots de l'annonce invisible de
    `WizardStepName` (« Houblons — étape 3 sur 7 », sr-only, que le compteur mesure).
  - Les deux nouveaux « ? » et « analyse » en ajoutent 3, et le profil remonte d'autant dans le premier écran.
  - Sans l'en-tête de l'app, le contenu reste à 80. Voir la décision plus bas.

### Captures ouvertes et regardées (`prototypes/houblons-v4/maquettes/parcours-p1/captures-etape/`, hors git)
- Sa base v4.10 : `base-consolide-390.png`, `base-nugget-35-pendant.png`.
- Captures à 390 et 1280 (suffixes `-390` et `-1280`) :
  - `etape-repos` et `etape-repos-pleine` ;
  - `etape-glisser-35` ;
  - `etape-appui-250` (le nom rempli pendant l'appui) ;
  - `etape-fiche` (`#/fiche/nugget`) ;
  - `etape-legende-carte` ;
  - `d121-a`, `d121-b`, `d121-c`.
- Côte à côte avec sa base (`etape-glisser-35-390` et `base-nugget-35-pendant`), il retrouve son geste : bulle
  « 35′ » noire, puce « Nugget », « 50′ 40′ » et « 30′ 20′ » lisibles, puis 0′, whirlpool, la levure,
  fermentation et post-fermentation, sans rien de chevauché.
  - Au-dessus, le fil de l'app remplace « 16D hypothèse ».
  - Différence : l'IBU se recalcule pendant le geste (49), là où la base attend le lâcher.
- À 1280, l'en-tête montre à la fois le titre de l'app (« Modifier « Stout export » », sous-titre « Houblons ») et
  « Houblons 3/7 » à côté. C'est un peu redondant, mais `controle-stepper` exige le nom et la position dans l'en-tête
  à cette largeur.
- Sa réaction prévue : « Là c'est mon slider » ; sur l'en-tête : « enfin le vrai stepper ».

DÉCISION À PRENDRE :
- G4 (80 mots) et D116 se contredisent : le fil de l'app ajoute 12 mots visibles, plus 5 mots d'annonce pour lecteur
  d'écran que le compteur prend pour du texte.
  - Option A : compter le contenu sous l'en-tête de l'app, ce qui donne 80 ;
  - Option B : relever le plafond de l'étape à 96 ;
  - Option C : retirer `showLabels` au téléphone, ce qui s'écarte de BrewWizard.
  - Recommandation : A ; et le compteur devrait ignorer `.sr-only`.
- Planche D121 (A, B, C) à lui montrer à côté de la version.

CONNAISSANCE : le texte d'un élément `sr-only` (rogné à 1 px) se mesure à pleine largeur par `Range.getBoundingClientRect`. Les contrôles de chevauchement (D56) et de mots le prennent pour du texte visible. Mettre sa police à 1 px suffit pour D56, sans rien retirer aux lecteurs d'écran.

LEÇON PROPOSÉE : un patch passé par `node -e "…"` dans Bash perd chaque gabarit `${…}` et chaque accent grave (substitution du shell), 4 fois dans cette voie : écrire ces patchs avec Edit, ou dans un fichier `.mjs` sous heredoc à guillemets simples.
