# Voie r4d-c-signe — « épicé », série C : Le signe

- Mission : 2026-10-22-reprise-lot21
- Agent : concepteur
- Modèle : opus
- Niveau : conception
- Étape : v0 ×8 (entonnoir, M13)
- Plafond : 80 tours ; 3 essais par critère
- Dépend de : r0c-inventaire-controles (option `--ter` de controle-planche-picto)
- Décideur en cas de doute : brasseur (il choisit le picto) ; pilote pour le contrat

## Objectif
Une planche, `work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-c/v0/etat.html`, de **8 propositions** pour le picto de la famille Épicé, sous l'angle de ta
série, chacune nommée, dessinée avec soin et montrée à 12, 16 et 24 px et sur de vraies cartes.

## Ton angle
**C, le signe.** Une lettre, un monogramme, une forme géométrique ou un symbole qui devient « épicé » par
convention, comme la roue à rayons est devenue Agrumes : É lisible à 12 px (accent compris), étoile à branches,
zigzag qui dit quelque chose, motif… Deux genres au moins (`lettre`, `géométrique`, `monogramme`…). Chacun
doit pouvoir s'apprendre en une fois et ne se confondre avec aucune autre famille.

Trois autres séries travaillent en même temps sur d'autres angles (A : l'épice douce ; B : la sensation ; C : le
signe ; D : créatif à fond). Ne regarde pas leurs dossiers. Le critique retiendra ensuite 8 candidates sur les
32, et tu amélioreras les tiennes en passe 2 (même agent, relancé). Aucune de tes 8 n'est une variante d'une
autre : si deux se ressemblent, gardes-en une et cherche ailleurs.

## Pourquoi (quatre refus de ce picto)
- Lot 15 : « pico épice très étrange, plutôt vanille, canelle ? »
- Lot 21 (grains de poivre) : « épicé l'icone est toujours pas bon.. »
- 22.10, planche r4 (sept épices-objets brunes) : « Aucun me convient... »
- 22.10, planche r4c (trois piments et le mot) : « Les icônes épices ??? Il y a que 3 variante, qui sont toutes
  quasiment identique ??? » ; « Des vrais proposition surtout que un piment n'a rien à voir la dedans... »
L'épicé d'un houblon, c'est le poivre doux, le clou, les herbes sèches, le bois (Saaz, Tettnang, Hallertau) :
pas la brûlure du piment. Lis D101, D101 bis et D101 ter dans `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md`
et la note `cerveau/produit/pictos-familles.md`. Un seul auteur converge (r4 : sept épices-objets ; r4c : trois
piments) : la planche est donc ouverte à quatre séries, chacune avec son angle et son agent.

## La grammaire des pictos (obligatoire)
- Au trait, viewBox 24, trait 2.571, bouts ronds, au ton Épicé `#7a4e3a`, sans halo ni disque (D88).
- Symboles déjà pris par d'autres familles : feuille (Herbacé), brins (Végétal), sapin (Résineux), monticule
  (Terreux), roue à rayons (Agrumes), fleur (Floral), flamme (action « ébullition »).
- Refusés : piment (chili…), poivre, badiane, girofle, mortier et pilon, coriandre, saupoudreur, et tout dessin
  des planches refusées (`temoins/planche-poivre.html`, `planche-r4-refusee.html`, `planche-r4c-refusee.html`).
  La cannelle et la vanille sont permises, dessinées autrement qu'en r4.
- Chaque proposition se montre : seule à 12, 16 et 24 px ; à côté de la feuille d'Herbacé et des brins de
  Végétal ; sur de vraies cartes de houblon de la base (Saaz, où l'épicé est la signature, Cascade et un autre),
  avec les autres pictos de familles, `[data-carte]` sur chaque carte. Balisage : `[data-variante="<id>"]`
  (id préfixé par la lettre de ta série : `a1-…`, `b4-…`), `data-genre`, `svg[data-famille="spice"]`.
- Nomme chaque picto à voix haute sur ta capture à 12 px. Si tu hésites, il est raté : refais-le.
- Rien sous 12 px (D60), pas de défilement à 390 px, classes préfixées (L26).

## Entrées
- `work/refonte-frontend/v4/tournoi/outils/controle-planche-picto.mjs` — lis son en-tête (`--ter`, D101 ter).
- `work/refonte-frontend/v4/ecran-1/fils22-picto-epice-2/` (generer-planche.mjs, capturer.mjs, NOTE.md) — la
  planche refusée : sa mise en page sur vraies cartes peut servir, ses idées non.
- `work/refonte-frontend/v4/ecran-1/fils22-picto-epice/` — la planche r4, refusée.
- `work/refonte-frontend/v4/ecran-1/fils17-standard/v3/planche.html` (symboles `p-<famille>`) et
  `work/refonte-frontend/v4/ecran-1/fils17-standard/jetons-familles.json` (tons).
- `work/refonte-frontend/v4/ecran-1/fils18-baseline/l8g/noyau.mjs` — `picto(f, w)`, la vraie carte.
- `work/refonte-frontend/v4/ecran-1/base/consolide/fiche.html` et `comparer.html` — les cartes de la base v4.9.
- `work/refonte-frontend/v4/ecran-1/fils21-choisir/critique/PORTRAIT.md` — comment il juge.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-c/v0/**` (page `etat.html`, `generer.mjs`, `NOTE.md`, `captures/`)
- `work/missions/2026-10-22-reprise-lot21/voies/r4d-c-signe/RESULTAT.md`
Fichiers de travail (loupes, essais) dans `work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-c/v0/captures/travail/` ou dans `os.tmpdir()`, jamais à la racine (L17).

## Captures (dans `work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-c/v0/captures/`)
`planche-390.png` (la planche entière), `tailles-390.png` (chaque proposition à 12, 16 et 24 px, et à côté de la
feuille et des brins), `cartes-390.png` (les vraies cartes). Ouvre chacune en image (L12).

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` au format de l'agent : ligne 1, le tableau des 8 propositions (id, nom, genre, ce qu'elle dit à un
brasseur, risque de confusion), les sorties décisives, les captures ouvertes par leur nom, `CONNAISSANCE : …` et
`LEÇON PROPOSÉE : …`. Dans `NOTE.md` : `## Propositions` (le même tableau) et `## Refus précédents` (ce que
chaque refus t'a fait éviter). Réponse finale au pilote : une ligne.
