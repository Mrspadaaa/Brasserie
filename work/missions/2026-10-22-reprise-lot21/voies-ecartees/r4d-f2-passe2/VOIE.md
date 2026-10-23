# Voie r4d-f2-passe2 — « épicé », passe 2 de la série F

- Mission : 2026-10-22-reprise-lot21
- Agent : concepteur (l'agent de r4d-f-greffe, relancé par SendMessage)
- Modèle : opus
- Niveau : conception
- Étape : passe 2 (entonnoir, M13)
- Plafond : 40 tours ; 3 essais par critère
- Dépend de : r4d-tri
- Décideur en cas de doute : brasseur (il choisit le picto) ; pilote pour le contrat

## Lire d'abord (22.10, nuit)
Dans `work/refonte-frontend/v4/SPEC-BRASSEUR.md`, le § 0 « Ce qui vaut aujourd'hui », puis seulement la section du picto « épicé ». Au lieu de DEFAUTS-RECURRENTS.md en entier : `work/refonte-frontend/v4/DEFAUTS-COURT.md` (lignes D101 à D101 quater).

## Objectif
Une planche, `work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-f/passe2/etat.html`, de **tes candidates retenues au tri, améliorées** : les lignes de la section
« ## Candidates » de `work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/tri/SYNTHESE.md` dont l'id commence par `f`. Chacune garde son id, son nom, son épice
(`data-epice`) et son idée ; tu appliques ses greffes, ses retouches et celles de la section « ## Greffes ». Chacune à
12, 16 et 24 px, à côté de la feuille et des brins, et sur de vraies cartes. Le brasseur les verra en tête de la page,
avant les 48 v0. Après ta passe, le critique reclasse : une passe 3 peut suivre si ce n'est pas encore satisfaisant.

## Ce qu'il veut (22.10, nuit), mot pour mot
« Je veux un forme qui représente vraiment ce que c'est, genre canellle vanille, ou clou de girofle ect... Ce que ça
représente vraiment épicier sur un houblon... » (D101 quater). Une **épice réelle**, reconnaissable, de celles qu'on
sent dans un houblon épicé (Saaz, Tettnang, Hallertau : clou, poivre doux, herbes sèches, bois). Pas un signe, pas une
sensation, pas une métaphore. Avant : quatre refus (lot 15 : « plutôt vanille, canelle ? » ; lot 21 : le poivre ; r4 :
sept épices-objets brunes, « Aucun me convient... » ; r4c : trois piments, « un piment n'a rien à voir la dedans... »).
Les dessins de r4 restent refusés : c'est leur dessin qui n'allait pas, pas l'idée d'épice.

## Ce que tu fais
- Lis `work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/tri/SYNTHESE.md` et `work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/tri/serie-f.md`.
- Pars de ta planche v0 (`work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-f/v0/`), ne la modifie pas ; copie ce qu'il faut dans `work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-f/passe2/`.
- Améliore pour de bon : le dessin à 12 px d'abord (nomme l'épice à voix haute), puis la carte. Dis chaque greffe
  dans la NOTE.

## La grammaire des pictos (obligatoire, c'est la baseline)
- Au trait, viewBox 24, trait 2.571, bouts ronds, au ton Épicé `#7a4e3a`, sans halo ni disque (D88).
- Symboles déjà pris : feuille (Herbacé), brins (Végétal), sapin (Résineux), monticule (Terreux), roue à rayons
  (Agrumes), fleur (Floral), flamme (action « ébullition »).
- Refusés : piment, poivre, mortier et pilon, saupoudreur, et tout dessin des planches refusées
  (`temoins/planche-poivre.html`, `planche-r4-refusee.html`, `planche-r4c-refusee.html`).
- Chaque proposition : seule à 12, 16 et 24 px ; à côté de la feuille d'Herbacé et des brins de Végétal ; sur de
  vraies cartes de houblon de la base (Saaz, Cascade et un autre), `[data-carte]` sur chaque carte. Balisage :
  `[data-variante="<id>"]` (id préfixé par la lettre de ta série), `data-genre`, `data-epice="<épice>"` (le nom de
  l'épice réelle : cannelle, vanille, girofle, muscade, badiane, anis, réglisse, genièvre, carvi, coriandre…),
  `svg[data-famille="spice"]`.
- Nomme chaque picto à voix haute sur ta capture à 12 px : « clou de girofle », « badiane »… Si tu hésites, refais-le.
- Rien sous 12 px (D60), pas de défilement à 390 px, classes préfixées (L26). Un concept minimal coûte environ
  5 tours : un dessin juste et sa carte, pas de décor.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-f/passe2/**` (page `etat.html`, `generer.mjs`, `NOTE.md`, `captures/`)
- `work/missions/2026-10-22-reprise-lot21/voies/r4d-f2-passe2/RESULTAT.md`

## Captures (dans `work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-f/passe2/captures/`)
`tailles-390.png` et `cartes-390.png`. Ouvre chacune en image (L12).

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` : ligne 1, par candidate ce qui a changé (avant → après) et les greffes appliquées, les sorties
décisives, les captures ouvertes par leur nom, `CONNAISSANCE : …` et `LEÇON PROPOSÉE : …`. Dans `NOTE.md` : une
section `## Passe 2`. Réponse finale au pilote : une ligne.
