# Voie r0c-inventaire-controles — L'inventaire de ce qu'il a aimé, et les deux contrôles qui le gardent

- Mission : 2026-10-22-reprise-lot21
- Agent : auteur
- Modèle : opus
- Niveau : conception (l'inventaire fixe ce que les variantes suivantes reprendront)
- Plafond : 80 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : pilote

## Objectif
Trois livrables, chacun avec ses témoins :
1. `elements-notes.json`, l'inventaire de tout ce que le brasseur a noté bon ou intéressant ;
2. `controle-reprise.mjs` (D104), qui fait échouer une variante « de reprise » à qui il manque un élément
   de l'inventaire sans raison écrite ;
3. D101 ter dans `controle-planche-picto.mjs` (option `--ter`), qui fait échouer une planche « épicé »
   pauvre en vraies propositions.
r6a actuelle et la planche r4c doivent ÉCHOUER.

## Pourquoi (ses mots, 22.10, lot 22)
- « r6a est le meilleur mais reprendre trop peu d'éléments que j'avais noté bon ou intéressant des autres
  variante, notamment la meilleure. »
- Sur la planche r4c (trois piments et le mot) : « Les icônes épices ??? Il y a que 3 variante, qui sont toutes
  quasiment identique ??? » ; « Des vrais proposition surtout que un piment n'a rien à voir la dedans... ».
Lis les lignes D101 ter et D104 de `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md`, et la leçon L27.

## Entrées
- `work/refonte-frontend/v4/SPEC-BRASSEUR.md` — ses mots, la seule source des citations. Lis les retours des
  lots 5 à 22 (sections « Comparer », « Les radars, son choix dans le lot 9 », fiches du lot 13, « Suggestions en
  Barres, lot 14 », « La baseline l8 (lot 18) », « Le lot 21, son retour », « Le lot 22, son retour »), et le
  tableau récapitulatif en bas du fichier.
- `cerveau/produit/acquis-valides.md`, `work/refonte-frontend/registre.md` — ce qui est déjà acquis.
- `work/refonte-frontend/v4/ecran-1/fils21-choisir/critique/PORTRAIT.md` — comment il juge.
- Les variantes et leurs captures : `work/refonte-frontend/v4/ecran-1/fils21-choisir/` (y1b, y3, v1, w2, x3b,
  a2b, d1 si présent), `fils18-baseline/` (l8, l5b, l5f…), `fils9-radars/` (m4, h4), `fils5-comparer/`
  (variante 3, lot 5a), `fils14-suggestions-barres/` et `fils15-s5-complexe/` (s5), `fils13-carte-fiche/` et
  `fils4-fiche/` (g1, fiche Citra cryo). Retrouve chaque variante par Glob ; si elle vit ailleurs, dis où.
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6a/` (etat.html, NOTE.md) — r6a actuelle, le témoin
  négatif de D104.
- `work/refonte-frontend/v4/ecran-1/fils22-picto-epice-2/planche/etat.html` — la planche r4c, le témoin
  négatif de D101 ter.
- `work/refonte-frontend/v4/tournoi/outils/controle-acquis.mjs` — sa convention « à un toucher »
  (déclencheur `aria-controls` ou `data-ouvre-acquis`, un seul tap joué pour de vrai) : reprends-la.
- `work/refonte-frontend/v4/tournoi/outils/controle-planche-picto.mjs` et ses témoins
  `temoins/planche-poivre.html`, `temoins/planche-r4-refusee.html`.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/donnees/elements-notes.json` (versionné par une
  exception .gitignore posée par le pilote)
- `work/refonte-frontend/v4/tournoi/outils/controle-reprise.mjs`
- `work/refonte-frontend/v4/tournoi/outils/controle-planche-picto.mjs`
- `work/refonte-frontend/v4/tournoi/outils/temoins/reprise-*/**` (etat.html et NOTE.md)
- `work/refonte-frontend/v4/tournoi/outils/temoins/planche-r4c-refusee.html`,
  `work/refonte-frontend/v4/tournoi/outils/temoins/planche-ter-ok.html`
- `work/missions/2026-10-22-reprise-lot21/voies/r0c-inventaire-controles/RESULTAT.md`
Fichiers de travail : dans ces chemins ou dans `os.tmpdir()`, jamais à la racine (L17).

## Consignes

### 1. L'inventaire `elements-notes.json`
Forme : `{ "maj": "2026-10-22", "elements": [ … ] }`. Un élément = une chose qu'on peut reprendre sur un écran
(pas une variante entière). Champs, tous obligatoires :
- `id` : court, en kebab-case, unique. C'est aussi le marqueur `data-element` attendu sur une page ;
- `variante` (y1b, v1, w2, y3, l5b, l8, m4, h4, s5, a2b, x3b, l5f, g1…), `lot`, `date` (AAAA-MM-JJ) ;
- `mots` : sa phrase **mot pour mot**, telle qu'elle est écrite dans SPEC-BRASSEUR (même orthographe, mêmes
  fautes). Le contrôle la cherche dans SPEC, espaces et retours à la ligne normalisés ;
- `quoi` : ce qu'est l'élément, en une phrase concrète (où il est, à quoi il sert) ;
- `reserve` : ses réserves sur cet élément, mot pour mot (« la molette prends trop de place »,
  « un peu trop ostère », « dur à lire », « trop bordélique »…), ou `""` ;
- `capture` : le chemin d'une capture existante qui montre l'élément ;
- `facteur` : `variété` (il a sa place dans Comparer), `contexte` (un facteur fixé, à montrer sans contrôle),
  ou `outil : <Dryhopper | Levure | Suggérer | fiche>` (un autre outil : candidat au pont).

Commence par **y1b, sa « meilleure »** (« y1b est de mon point de vue semble meilleur », 20.10) : au moins
« face à ta stout » gardé au geste, la pastille de famille qui ouvre son choix, la jauge d'amertume de la stout,
le dock sous le pouce. Ouvre ses captures, et ajoute ce qu'elles montrent d'autre de notable. Puis v1, w2,
y3 (panel OSU), l5b (barres **et** pistes d'objectif, L03), l8 (la disposition), m4/h4, la variante 3 de
Comparer (lot 5a), s5, a2b (« voir ce que la levure change »), x3b, l5f, g1 et la fiche Citra cryo. Ajoute
tout autre élément noté bon ou intéressant depuis le lot 18 que tu trouves dans SPEC. Un élément qu'il a
refusé ensuite (par exemple le « glowing » de l8b) n'entre pas ; s'il a été noté puis corrigé, garde la
version corrigée et dis-le dans `quoi`.

### 2. `controle-reprise.mjs` (D104)
- `node controle-reprise.mjs --inventaire [chemin]` : chaque élément a tous ses champs ; ses `mots` se
  retrouvent dans SPEC-BRASSEUR ; sa capture existe ; les `id` sont uniques. Sortie
  `INVENTAIRE OK (n éléments, v variantes)` (code 0) ou `INVENTAIRE ECHEC` et la liste (code 1).
- `node controle-reprise.mjs <dossier> <id> [--page=etat.html] [--premier-ecran] [--inventaire=chemin]` : lit
  `<dossier>/<id>/NOTE.md` et la page, rendue à 390 × 844 tactile. La NOTE a une section `## Reprise`, une ligne
  par élément de l'inventaire : `- <id> : repris — <où>`, `en contexte — <où>`, `en pont — <vers quel outil>`,
  ou `écarté — <raison>`. Échec si :
  - un élément de l'inventaire n'a pas sa ligne, ou une ligne nomme un `id` inconnu ;
  - un élément repris, en contexte ou en pont n'a pas de `[data-element~="<id>"]` visible, au repos ou après
    UN toucher sur un déclencheur déclaré (convention de controle-acquis : `aria-controls`, ou
    `data-ouvre-element="<id> …"`) ;
  - « en contexte » hors de la ligne de contexte (`[data-role="contexte"]`) ; « en pont » sans lien ou bouton
    vers l'autre outil dans l'élément marqué ;
  - un écart sans raison d'au moins six mots ; plus d'un quart des éléments écartés ;
  - avec `--premier-ecran` : un élément repris, en contexte ou en pont qui n'est pas visible au repos dans les
    844 premiers pixels.
  Sortie `REPRISE OK (r repris, c en contexte, p en pont, e écartés)` ou `REPRISE ECHEC` et la liste.
- Témoins, dans `temoins/` (pages autonomes, sans dépendance hors du fichier) :
  - `reprise-r6a/` : copie de r6a actuelle (etat.html et NOTE.md) → ECHEC ;
  - `reprise-ok/` : une petite page synthétique qui porte chaque élément, dont un seul à un toucher → OK, et
    ECHEC avec `--premier-ecran` ;
  - `reprise-sans-raison/` : la même, avec un élément écarté sans raison → ECHEC.

### 3. D101 ter dans `controle-planche-picto.mjs` (option `--ter`)
Ne change rien au comportement sans `--ter` : les critères déjà rejoués (r4, r4c) doivent rester verts.
Avec `--ter` (décision du pilote, 22.10) :
- au moins 8 propositions `[data-variante]`, nommées, et au moins 6 genres `data-genre` différents ; deux
  propositions du même genre ne comptent qu'une fois ;
- idées refusées : piment (chili, jalapeño…) et poivre, plus badiane, girofle, mortier et pilon, coriandre et
  saupoudreur (refusés d'un bloc avec r4). **La cannelle et la vanille sont permises** : c'était sa propre piste
  (« plutôt vanille, canelle ? », lot 15), mal dessinée en r4. Leurs dessins de r4 restent refusés ;
- dessins refusés : toute signature de picto Épicé de `planche-poivre.html`, `planche-r4-refusee.html` et
  `planche-r4c-refusee.html` (la copie de r4c que tu crées) ;
- deux propositions n'ont jamais la même signature de dessin, même arrondie à l'unité (« quasiment
  identique ») ;
- chaque proposition dessinée se montre à 12, 16 et 24 px (largeurs rendues, à 1 px près) et sur une vraie
  carte : un `[data-carte]` du bloc qui porte le nom d'un houblon, le picto Épicé et au moins 3 pictos d'autres
  familles. Le mot seul (`data-nature="mot"`) est dispensé du dessin, pas de la carte ;
- les règles de toujours : trait au ton Épicé, rien sous 12 px, pas de défilement à 390 px.
Témoins : `planche-r4c-refusee.html` (copie autonome de la planche r4c) → ECHEC ; `planche-r4-refusee.html`
→ ECHEC (dessins de r4) ; `planche-ter-ok.html` (8 propositions synthétiques de 6 genres) → OK. Mets à jour
l'en-tête du fichier (D101 ter, ses mots, les témoins).

## Exigences transversales (recopiées, L05)
- Un seul facteur libre par écran d'outil (D98) : dans Comparer, c'est la variété. Un élément d'un autre
  facteur (levure, moment, dose) se montre en contexte ou en pont, jamais en sélecteur libre.
- Honnêteté : une citation fausse ou reformulée est une faute. Une capture citée existe et montre l'élément.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` au format de l'agent : ligne 1, puis le tableau de l'inventaire (id, variante, ses mots en
abrégé, facteur), les sorties décisives, `CONNAISSANCE : …` et `LEÇON PROPOSÉE : …`. Réponse finale au
pilote : une ligne.
