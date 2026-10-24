ECHEC — G2 seul : ETATS 113/117 (2 acquis expliqués, 2 doses en délai) ; BATTERIE OK 33/33

## Passe 2 : décisions du pilote (24.10)
1. RETOUR : le pilote a appliqué le chemin en deux pas à `controle-retour.mjs` (commit e73ce890) → `RETOUR OK`.
2. RAIL, option (b), appliquée par moi dans `outils/batterie.mjs` : `controle-rail … --parcours` ne joue plus que `dryhopper` ;
   deux lignes nouvelles gardent l'étape : `controle-fonctions-rail.mjs <construction>` (`FONCTIONS-RAIL OK`) et
   `controle-geste-etape.mjs <construction> --froid` (`GESTE-ETAPE OK (froid`). La batterie passe ainsi de 31 à 33 lignes.
   D61 bis et D56 sur `cas-k3.html`, le même geste joué sur sa base (`base/consolide/cas-k3.html`) et sur la maquette (sonde
   `%TEMP%\r7\k3e.mjs`, pas de 10 px, 24 ms ; jetons = top des autres houblons, chevauchements de textes visibles hors de la
   carte tenue) :
   - D61 bis, au passage de 0′ à 100 °C (le Dock se refait sur le segment du doigt, D67) : Citra cryo passe de 475 à 518 px
     sur sa base (+43 px), de 482 à 514 px sur la maquette (+32 px). Le bond est celui de sa base ; la maquette ne fait pas
     pire. Pas de correction.
   - D56, tenu à 75 °C : Cascade (80 °C) s'efface sous la carte tenue sur les deux pages (« fondu »), 0 chevauchement à
     250 ms. Le « 80 °C sur 80 °C » de controle-rail est lu pendant le fondu (120 ms, comme sa base). Tenu à 85 °C, avant
     ma correction de la mesure des hauteurs, Cascade disparaissait sur la maquette et pas sur sa base : corrigé (voir RAIL, suite).
3. ETATS : les 24 déclencheurs `etat-acquis-*` posés (`data-etat`, plusieurs jetons par élément quand un même élément
   porte plusieurs états) : Suggérer (objectifs, voies, « + » d'Aurum, « Radar », écran entier via `CadreOutil etat`),
   Comparer (contexte, dock, « Valeurs », ligne Panel OSU ; r5 les avait mis en `data-element`), étape (frise, Citra cryo),
   fiche, Dryhopper, grille de dégustation. `Moment : 60 minutes d'ébullition, Nugget` : le libellé de la poignée commence
   comme celui de sa base. Les `different` : barres l5b, suite s5 de q2b, dock r6n2, notes r6a, thème blanc gris noir,
   biotransformation (« creep ») passent désormais : les reprises r4 et r5 les rendent.
   Deux restent, écrits ici :
   - `etat-acquis-radars-m4-h4` : la grille m4 est rendue (Ma bière en Radar, `data-role="degustation"`, état
     `etat-biere-radar` OK avec « pas senti … marqué »), mais l'acquis se joue « au repos » sur `biere/etat.html`, que sa base
     ouvre en Barres (`etat-biere-repos`). Il faudrait `page_construite` ou un geste « Radar » dans `acquis.json` (pas à moi).
   - `etat-acquis-y1b-brassin-au-doigt` : « Quand ? », « Citra », « Tire 20 bières » sont les mots de y1b ; Dryhopper est un
     choix ouvert (a1 en attendant ; REPRISE § 5 : rien d'un écran au choix ouvert). Non rendu.

## Fichiers écrits
- `prototypes/houblons-v4/parcours/src/ecrans/fiche/FicheHoublon.tsx` (fiche-arome sur le bloc des familles)
- `prototypes/houblons-v4/parcours/src/ecrans/fiche/briques.tsx` (`Usage mot`) ; `…/ma-biere/Carte.tsx` (« double »)
- `prototypes/houblons-v4/parcours/src/ecrans/ma-biere/rail.ts`, `rail.css`, `Frise.tsx` (aria-valuenow, data-cran,
  `pq-mb-courte`, mesure sans transition)
- `prototypes/houblons-v4/parcours/src/ecrans/fiche/gestes.ts`, `…/dryhopper/fiche-sur-outil.tsx` (survol au mouvement)
- `prototypes/houblons-v4/parcours/src/ecrans/suggerer/reprise.css` (étiquette « +n crans » dans sa colonne)
- `prototypes/houblons-v4/parcours/outils/jouer-parcours.mjs`, `parcours-complet.mjs`
- `prototypes/houblons-v4/maquettes/parcours/**` (construction commune) ; ce RESULTAT.md
- `batterie.mjs` : le seuil de 30 mots est juste (voir MOTS) ; passe 2 : option (b) du pilote pour le rail.
- Passe 2 : `commun/Cadres.tsx` (prop `etat`), `suggerer/index.tsx`, `comparer/index.tsx`, `biere/Degustation.tsx`,
  `dryhopper/index.tsx`, `fiche/FicheHoublon.tsx`, `ma-biere/Frise.tsx`, `ma-biere/Ajouter.tsx` (déclencheurs des acquis).
- Scripts de travail : `%TEMP%\r7\` (sondes, captures, copie corrigée de controle-retour).

## Critères (rejoués sur la construction commune, passe 2)
- G1 `batterie.mjs` → **`BATTERIE OK 33/33`** (journal `%TEMP%7at-fin2.txt`).
- G2 `controle-etats.mjs prototypes/houblons-v4/maquettes/parcours` → `ETATS ECHEC (4/117) ; 11 voulu(s) non rejoué(s)`
  (trois rejeux complets, même résultat) :
  - `etat-acquis-radars-m4-h4` et `etat-acquis-y1b-brassin-au-doigt` : expliqués plus haut (Passe 2, point 3).
  - `etat-etape-dose-plus` et `etat-etape-dose-moins` : `erreur : Runtime.callFunctionOn timed out` (délai de 180 s de
    puppeteer), seulement dans le rejeu complet à quatre pages. Seuls (`--id=`) et avec leur écran (`--ecran=etape` →
    `ETATS OK (15/15)`, deux fois), ils passent ; ils passaient aussi dans le rejeu complet avant la passe 2. Cause non
    trouvée : à faire élucider (la page de l'étape se bloque-t-elle quand quatre pages tournent ensemble ?). Pendant ces rejeux,
    `controle-etats.mjs` a été modifié par un autre agent (options `--captures`, `--avec-voulus`, non commitées), et les
    voies r8a à r8c jouaient Chrome en parallèle : un rejeu à machine calme est à refaire avant de conclure.
- G3 `controle-fonctions-rail.mjs` → `FONCTIONS-RAIL OK (37/37)`.
- G4 `controle-geste-etape.mjs --froid` → `GESTE-ETAPE OK (froid, 3 segments)`.
- G5 `systeme.mjs note … --contient …` → `NOTE OK`.
- Aussi (dans la batterie) : `CHOIX OK`, `TEINTE OK 6/6`, `TYPES OK`, `RETOUR OK`, `RAIL OK` (dryhopper), `PONTS OK`,
  `PARCOURS OK`, `MOTS OK` (30), `COMMUN OK` sur les sept routes.

## Captures
- `%TEMP%\r7\etape-avant.png` (étape avant ; à côté de `work/refonte-frontend/v4/ecran-1/base/captures/consolide-390.png`)
- `%TEMP%\r7\k3-nous.png` et `%TEMP%\r7\k3-base.png` (rail à plusieurs houblons, tenu à 85 °C : même rail)
- `%TEMP%\r7\comparer-idaho.png` (Comparer après « + » Idaho 7, « Placer Idaho 7 › »)
- `%TEMP%\r7\pc\` (captures de parcours-complet, 390 et 1280)

Prédiction : il retrouvera son rail à plusieurs houblons (Cascade ne disparaît plus) et le « double » de sa base, sans
rien voir d'autre changer ; RETOUR et RAIL restent une affaire de contrôles.

## Départ
`node prototypes/houblons-v4/parcours/outils/batterie.mjs` → `BATTERIE ECHEC 23/31` (journal : `%TEMP%\r7-bat1.txt`).

## Échecs, cause, correction

### FICHE (controle-commun dryhopper et levure)
- Sortie : `D25 etat.html : fiche sans arômes sourcés visibles (data-role="fiche-arome", « 2/4 fiches »)`.
- Cause : ce n'était pas `gestes.ts`. Sur Dryhopper et Levure, le houblon appuyé est Idaho 7, décrit par une seule fiche :
  `compte()` n'écrit pas de « 1/1 », et sa source (« 1 seule fiche : Beer Maverick », reprise de g1 par r3) est dans la bande,
  hors du `<ul data-role="fiche-arome">`.
- Correction (`ecrans/fiche/FicheHoublon.tsx`) : `data-role="fiche-arome"` passe sur tout le bloc des familles (bande,
  « 1 seule fiche : … », liste). Rien ne change à l'écran. → `COMMUN OK` sur dryhopper, levure, ma-biere, substituer.

### MOTS (mots-premier-ecran ma-biere --max=30)
- Sortie : `ma-biere 31 mots (hors données) (> 30)`.
- Mesure de sa base, avec le même compteur : `mots-premier-ecran work/refonte-frontend/v4/ecran-1/base consolide --page=index.html --sans-donnees`
  → `consolide 24 mots (hors données)`. Règle de la mission : base + 6 = 30. Le seuil de 30 est juste : il n'est pas réécrit.
- Cause : la carte de Nugget disait « double usage » (pilule) là où sa base dit « α 13 double ⊙ » (capture
  `base/captures/consolide-390.png` ; l'écart est relevé dans `choix/etats/etape.json` : « rôle « mixte » au lieu de « double » »).
- Correction : `Usage` gagne une forme `mot` (le mot court en gris, sans pilule, `ecrans/fiche/briques.tsx`), employée par
  la carte de l'étape (`ecrans/ma-biere/Carte.tsx`). → `ma-biere 30 mots (hors données)`, `MOTS OK`.
- DÉCISION : la carte de l'étape dit « double », comme sa base ; la fiche et Substituer gardent « double usage » (g1, D90).
  La consigne de r1 (« double usage », pas « mixte ») visait « mixte » ; les mots de sa maquette font foi (REPRISE § 8).

### RAIL (controle-rail ma-biere dryhopper --parcours)
- Sortie : `D27 : ma-biere, un glissé complet ne prend que 1 valeur(s)`.
- Cause : pendant le geste, `rail.ts` (r1) récrit `aria-valuetext` (60′ … J+14) mais jamais `aria-valuenow`, que lit le contrôle.
- Correction (`ecrans/ma-biere/rail.ts`) : `ecrireMoment` pose aussi `aria-valuenow` (rang dans `toutesValeurs()`), rendu à la fin.
- Suite : voir plus bas (le contrôle joue maintenant les autres règles du rail).

### PONTS et Idaho 7 (jouer-parcours --ponts)
- Sortie : `PONTS ECHEC : Comparer sans Idaho 7 : #/comparer?h=motueka,nelson-sauvin`.
- DÉCISION : Suggérer reste q2b (Motueka, Nelson Sauvin proposés) et Comparer reste r6a : rien ne change aux écrans. Le parcours
  ajoute Idaho 7 par le « + » de Comparer (colonne +, `[data-role="ajouter-colonne"]` puis `[data-ajouter="beermaverick-idaho-7"]`) :
  Idaho 7 entre en colonne, est retenu, le dock dit « Placer Idaho 7 › ». Dans `parcours-complet.mjs`, Galaxy (un houblon de
  sa question « Lequel pour ma stout : Cascade, Idaho 7 ou Galaxy ? », 20.10) est coché dans Suggérer (« Comparer (3) »), puis
  Idaho 7 en 4ᵉ colonne. La lecture « Comparer (n) ajoute sa question » aurait changé q2b ou r6a : écartée.
- Correction : `outils/jouer-parcours.mjs` → `PONTS OK (18 gestes, recalcul médian 0,3 ms)`.

### PARCOURS (parcours-complet)
- Sortie : `l’onglet Ma bière n’arrive pas avec l’objectif « + floral »` (390 et 1280).
- Cause : r2 a rendu sa base : une puce d'objectif pose la visée sans quitter l'onglet (`etat-biere-objectif-floral`) ; c'est la
  ligne « Plus floral : n voies › » (`pont-floral`) qui ouvre Suggestions. Le script lisait « + floral » sur `pont-floral`.
- Corrections du script (`outils/parcours-complet.mjs`), chacune parce que ses choix ont changé l'écran :
  - l'onglet : la puce `pont-objectif-floral` arrive au trait (« + floral », non posée), pas de ligne ; bannir, puis « + » : la
    puce est pleine et la ligne « Plus floral › » apparaît ;
  - Suggérer (q2b) : la direction lue sur l'écran (`[data-libre="houblon"]` `data-direction`, comme `suggerer/jeu.mjs`), toutes
    les voies du moteur présentes, Motueka et Nelson Sauvin proposés, « + » sur Galaxy ; Comparer : « + » Idaho 7 ;
  - Substituer (u4, r6) : les remplaçants montrés (4 à 8) viennent tous du moteur et sont rangés par le pire cas
    (`data-min`), au lieu de l'ordre des 6 premiers du moteur ; le choix se lit sur la bande `[role="radio"][data-col]` ;
  - le message de défilement horizontal nomme l'élément qui déborde.
- Deux défauts réels trouvés par le parcours, corrigés dans les écrans :
  - Suggérer après le dry hop d'Idaho 7 : l'étiquette « +3 crans » d'une barre pleine débordait (main 419 > 390) ;
    `ecrans/suggerer/reprise.css` : l'étiquette reste dans sa colonne (`min(…, 100% - 4rem)`).
  - 1280 px : après un toucher sur un pont, l'écran qui s'ouvre sous la souris immobile ouvrait la fiche de Nelson Sauvin
    (survol armé à l'entrée seule). `ecrans/fiche/gestes.ts` et `ecrans/dryhopper/fiche-sur-outil.tsx` : le survol s'arme au
    mouvement de la souris (`onPointerMove`), jamais à l'entrée seule.
- → `PARCOURS OK (29 gestes à 390, 29 à 1280, recalcul médian 0,4 ms)`.

### RETOUR (controle-retour, routes et défaut)
- Sortie : `D118 parcours « Suggérer ouvert depuis l'onglet » : pont d'objectif (pont-objectif-autre (sans effet : [data-ecran="suggerer"] n'apparaît pas)), chemin non joué`.
- Cause : même changement que PARCOURS (r2 l'avait signalé : « BESOIN pilote (outils) »). Le chemin touche au repos le
  premier rôle présent parmi `pont-floral`, `pont-objectif-autre`, `pont-objectif-resin` et attend Suggestions. Dans sa base,
  aucune de ces commandes n'ouvre Suggestions au repos : « + … » ouvre la ligne de la famille suivante
  (`etat-biere-objectif-autre`), les puces posent la visée, la ligne `pont-floral` n'existe qu'après. L'écran ne peut pas
  passer ce chemin sans contredire sa maquette.
- Correction **non appliquée** : `controle-retour.mjs` n'est pas dans mon « Possède » (L17). Le correctif, éprouvé sur une
  copie dans `%TEMP%\r7\controle-retour-patch.mjs` (ligne 483 seule) : le chemin joue deux pas, la puce
  `pont-objectif-floral` (attendre `[data-role="pont-floral"]`), puis la ligne `pont-floral` (attendre Suggestions).
  Copie corrigée sur la construction commune : `RETOUR OK (6 routes × 2 largeurs, 3 parcours)` et, avec
  `--routes=biere,suggerer,comparer`, `RETOUR OK (3 routes × 2 largeurs, 3 parcours)`.
  Le script du dépôt rend toujours `RETOUR ECHEC (12/12 conformes, 1 manques)`.

### RAIL, suite (controle-rail ma-biere --parcours)
Une fois `aria-valuenow` posé, le contrôle joue les autres règles et en trouve 8. Corrigé à la source :
- D47 (« 8 graduation(s) d'autres segments restent visibles ») : faux signal. Les graduations courtes du Dock sont dans le
  segment du doigt (`tk.s === g.seg`, rail.ts), mais leur classe `pq-mb-loin` contenait « loin », lu par le contrôle comme
  « hors segment ». Classe renommée `pq-mb-courte` (même dessin).
- D63 : les graduations n'avaient pas `data-cran` ; posé (`Frise.tsx`, rang dans `toutesValeurs()`, celui de `aria-valuenow`).
- D56, défaut réel : à plusieurs houblons (`cas-k3.html`), tenu à 85 °C, Cascade (80 °C) disparaissait et la graduation
  « 80 °C » s'écrivait sur lui. Sa base montre « 80 °C Cascade ». Cause : `rail.ts` mesurait les hauteurs pendant les
  transitions de l'app (carte tenue lue à 41 px au lieu de 32), et la carte « couvrait » Cascade. Les hauteurs se lisent
  désormais sans transition (`.pq-mb-mesure`). Capture `%TEMP%\r7\k3-nous.png` à côté de `%TEMP%\r7\k3-base.png` : même rail.
Restent 7 problèmes (`RAIL ECHEC 7`). Ce sont des écarts entre le contrat `--parcours` (voie c1-rail, 23.10, écrit pour le rail
D111 de 5345f6ad) et le rail de sa base, qui passe le même script dans son propre mode (`controle-rail.mjs
work/refonte-frontend/v4/ecran-1/base consolide` → `RAIL OK 1/1`) et que le port de r1 rejoue (`FONCTIONS-RAIL OK`) :
- D44 (« la fermentation n'a pas deux crans de jours (0) ») : le contrôle lit les jours sur un texte « actif … 3 j » ;
  sa base écrit « J+3 » (ses mots, D44 : « Que du j+3 »), et `controle-fonctions-rail.mjs` exige `^J\+(\d+)$` sur le même
  `aria-valuetext`. Les deux contrôles se contredisent : je garde « J+3 ».
- D61 (« 25′ posé à NaN % ») : au repos, sa frise est compacte (D55) : la carte reste à sa place, quel que soit le moment
  lâché. La place dit le temps pendant le geste (Dock, 14 px par 5′), pas au repos.
- D69 (« cran 1 sur 52, 0 visé ») : le cran 0 est le premier moût, que sa base règle par le type (« premier moût ⟳ »),
  pas en glissant.
- D63 (×2,99 pour ×3 au moins) : le plateau du Dock de sa base est ×3 ; la mesure tombe sur le seuil.
- D61 bis et D56 restants, sur `cas-k3.html` tenu à 100 °C et 75 °C : non élucidés (budget de la voie).

## DÉCISION À PRENDRE
1. RETOUR : appliquer à `work/refonte-frontend/v4/tournoi/outils/controle-retour.mjs`, ligne 483, le chemin en deux pas
   éprouvé ci-dessus. Sinon la batterie ne peut pas passer sans casser l'onglet de sa base (r2).
2. RAIL : `controle-rail.mjs --parcours` sur `ma-biere` teste le rail D111, que sa base a remplacé (D124). Deux options :
   (a) adapter le contrat `--parcours` à sa base : jours lus sur « J+n » et le segment de la poignée (`data-graduation`),
   D61 joué pendant le geste, cran 0 = premier rang glissable, seuil ×3 à 0,05 près ; (b) retirer `ma-biere` de cette ligne
   de la batterie, et garder `controle-fonctions-rail` et `controle-geste-etape --froid` (déjà dans le registre de l'étape),
   avec `controle-rail … dryhopper --parcours`. Puis faire élucider D61 bis et D56 sur `cas-k3` (100 °C, 75 °C).
3. ETATS : confier les 24 états `etat-acquis-*` à une voie (déclencheurs `data-etat` et, pour les `different`, le rendu de
   sa maquette), ou les sortir de G2 tant qu'aucune reprise ne les porte.

## Batterie finale (passe 1)
`node prototypes/houblons-v4/parcours/outils/batterie.mjs` → **`BATTERIE ECHEC 28/31`** (départ : 23/31 ; journal `%TEMP%7at-fin.txt`).
Ratés : `controle-rail … ma-biere dryhopper --parcours` → `RAIL ECHEC 7 problème(s)` ; `controle-retour` → `RETOUR ECHEC (12/12 conformes, 1 manques)` ;
`controle-retour --routes=biere,suggerer,comparer` → `RETOUR ECHEC (6/6 conformes, 1 manques)`. Tenus, dont les autres échecs du départ :
COMMUN OK (dryhopper, levure), MOTS OK, PONTS OK (18 gestes), PARCOURS OK (29 gestes à 390, 29 à 1280), CHOIX OK, TEINTE OK 6/6.

CONNAISSANCE : deux contrôles lisent le même `aria-valuetext` du rail avec des formats opposés : `controle-fonctions-rail`
exige « J+3 » (sa base, D44), `controle-rail --parcours` « actif … 3 j ». De plus, une classe CSS contenant « loin », « autre »
ou « hors » est lue par `controle-rail` comme une graduation hors segment.
LEÇON PROPOSÉE : un contrôle qui s'arrête au premier échec (« les autres règles ne sont pas jouées ») cache les suivants.
Le 24.10, « RAIL ECHEC 1 » en cachait 8. Avant de chiffrer une voie, rejouer le contrôle après avoir levé ce premier
échec, ou demander au contrôle la liste complète.
