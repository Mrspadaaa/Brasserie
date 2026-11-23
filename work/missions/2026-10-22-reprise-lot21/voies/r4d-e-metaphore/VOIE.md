# Voie r4d-e-metaphore — « épicé », série E : L'épice entière

- Mission : 2026-10-22-reprise-lot21
- Agent : concepteur
- Modèle : opus
- Niveau : conception
- Étape : v0 ×8 (8 tiède) (entonnoir, M13)
- Plafond : 120 tours ; 3 essais par critère
- Dépend de : r0c-inventaire-controles
- Décideur en cas de doute : brasseur (il choisit le picto) ; pilote pour le contrat

## Objectif
Une planche, `work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-e/v0/etat.html`, de **8 propositions** pour le picto de la famille Épicé, sous l'angle de ta série :
huit épices réelles, chacune nommée, dessinée avec soin, à 12, 16 et 24 px et sur de vraies cartes.

## Ton angle
**E, l'épice entière, au trait.** Huit épices réelles qu'on sent dans un houblon épicé, chacune entière et
nommée, une par proposition, aucune de celles de la série A (cannelle, vanille, girofle, gingembre, cardamome) :
la badiane (l'étoile à huit branches et ses graines), la noix de muscade (entière, ou fendue sur son macis), l'anis
vert, le bâton de réglisse, la baie de genièvre, la graine de carvi, la graine de coriandre côtelée, la fève tonka…
Forme de l'approche (tiède) : l'épice vue entière, de profil ou de trois quarts, avec le détail qui la nomme.

Les autres séries : A, l'épice douce (faite : cannelle vue de bout, vanille fendue, girofle, gingembre, cardamome,
pain d'épices) ; B, la sensation ; C, le signe ; D, créatif à fond ; F, les épices réelles cadrées librement. Ne regarde
que la série A, comme modèle de mise en page. Le critique retiendra ensuite 8 candidates, et tu amélioreras les
tiennes en passe 2 (même agent, relancé).

## Ce qu'il veut (22.10, nuit), mot pour mot
« Je veux un forme qui représente vraiment ce que c'est, genre canellle vanille, ou clou de girofle ect... Ce que ça
représente vraiment épicier sur un houblon... » (D101 quater). Une **épice réelle**, reconnaissable, de celles qu'on
sent dans un houblon épicé (Saaz, Tettnang, Hallertau : clou, poivre doux, herbes sèches, bois). Pas un signe, pas une
sensation, pas une métaphore. Avant : quatre refus (lot 15 : « plutôt vanille, canelle ? » ; lot 21 : le poivre ; r4 :
sept épices-objets brunes, « Aucun me convient... » ; r4c : trois piments, « un piment n'a rien à voir la dedans... »).
Les dessins de r4 restent refusés : c'est leur dessin qui n'allait pas, pas l'idée d'épice.

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

## Entrées
- `work/refonte-frontend/v4/tournoi/outils/controle-planche-picto.mjs` — lis son en-tête (`--ter`, `--epices`, D101 ter et quater).
- `work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-a/v0/` (etat.html, generer.mjs, captures) — la série A, déjà faite : sa mise en page sur vraies cartes
  peut servir de modèle. Ne reprends ni ses épices ni ses dessins.
- `work/refonte-frontend/v4/ecran-1/fils17-standard/v3/planche.html` (symboles `p-<famille>`),
  `work/refonte-frontend/v4/ecran-1/fils17-standard/jetons-familles.json` (tons),
  `work/refonte-frontend/v4/ecran-1/fils18-baseline/l8g/noyau.mjs` (`picto(f, w)`, la vraie carte).
- `work/refonte-frontend/v4/ecran-1/fils21-choisir/critique/PORTRAIT.md` — comment il juge.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-e/v0/**` (page `etat.html`, `generer.mjs`, `NOTE.md`, `captures/`)
- `work/missions/2026-10-22-reprise-lot21/voies/r4d-e-metaphore/RESULTAT.md`
Fichiers de travail dans `work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-e/v0/captures/travail/` ou dans `os.tmpdir()`, jamais à la racine (L17).

## Captures (dans `work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-e/v0/captures/`)
`planche-390.png`, `tailles-390.png`, `cartes-390.png`. Ouvre chacune en image (L12).

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` au format de l'agent : ligne 1, le tableau des 8 propositions (id, épice, genre, ce qu'elle dit à un
brasseur, risque de confusion), les sorties décisives, les captures ouvertes par leur nom, `CONNAISSANCE : …` et
`LEÇON PROPOSÉE : …`. Dans `NOTE.md` : `## Propositions` et `## Refus précédents`. Réponse finale : une ligne.
