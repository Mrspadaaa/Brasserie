OK — reprise D105 : étape Houblons et onglet Ma bière de la base v4.10, G1 à G20 verts

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
