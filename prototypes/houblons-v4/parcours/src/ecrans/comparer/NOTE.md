# Comparer — « Cascade, Idaho 7 ou Galaxy pour ma stout ? »

Voie p3-comparer (mission 2026-10-23-maquette-parcours). r6a, son choix redit le 23.10 (« r6a reste le meilleur, tu
peux ajouter ça, dans la vue interactive. Avec les quelques petites améliorations des autres versions »), portée en
React dans le socle et calculée en direct. Fichiers : `index.tsx` (l'écran), `calcul.ts` (ce qu'il lit du moteur),
`Radar.tsx` (radar r2), `valeurs.ts` (vraies valeurs, chimie, panel OSU), `comparer.css` (classes `pq-comparer-…`),
`jeu.mjs` (gestes joués).

## Base

r6a (`work/refonte-frontend/v4/ecran-1/fils22-comparer/r6a/`). Son premier écran reste le sien : titre en question,
ligne de contexte, radar r2 au style (lentille Absolu), puis le tableau : la colonne « Ta stout » (trop ♣, plus ❀),
une colonne par houblon (nom, α, rôle en mot, familles de ses fiches, verdict face à la 16D, stock en icône), une
rangée par famille avec la barre l5b de chaque houblon face à la zone de ta 16D, son intervalle et le trait de ta
stout ; les écarts chiffrés sur Floral ↑ et Résineux ↓ ; les familles inconnues pour tous en une rangée hachurée.
Sous le tableau, « Chimie et vraies valeurs » à un toucher, puis le panel OSU au repos.

Un seul facteur libre : le houblon. Un toucher sur une colonne la retient (le radar la remplit, la réponse et le
pont la suivent) ; le « + » en ajoute une 4ᵉ de ton stock ; × la retire. Dose (4 g/L chacun), moment (après, 3 j) et
levure (celle de la recette, US-05) sont fixés sur la ligne de contexte. Départ : le plus floral qui reste dans ta
16D (règle de r6a), ici Idaho 7.

Calcul en direct : chaque colonne est `comparer(recette, houblons)` de l'adaptateur (simulerCas, 4 g/L, dry hop
après fermentation, 3 j), recalculée à chaque changement de houblons ou de recette. Aucune grille figée. Les α, β,
huiles et composés viennent des données du moteur v4 (`proto-data.json`, `composes-houblon.json`) ; le linalol en
bière et le panel OSU, des études E03 et E04 (`fils21-choisir/donnees/comparatifs-dryhop.json`), importées.

Ponts : « Placer <retenu> › » (dock sous le pouce) ouvre Dryhopper avec ce houblon en brouillon ; l'appui long
(ou le survol long à l'ordinateur) sur un nom ouvre la fiche de la voie p1 (`src/ecrans/fiche/`), par-dessus
Comparer, avec une entrée d'historique : le retour du téléphone la referme. Substituer arrive avec un houblon
épinglé : `#/comparer?h=…&pin=<houblon>` le met en colonne 1, marqué ⌖ (lu dans la route du socle, `route.pin`).

## Idées reprises

Prises (peu, et sans changer la forme de r6a) :
- **La réponse face à ta stout**, de r6n2 (y1b) : une ligne sous le contexte, « ★ Idaho 7 devant Cascade ~+0,4
  cran ❀ », recalculée par le moteur. ★ = la règle de départ de r6a.
- **« contre ★ » chiffré**, de r6p2 : retenir une autre colonne réécrit la ligne, « Cascade ~−0,4 cran ❀ contre
  ★ Idaho 7 » (et ~⚠ avec le picto de la famille qui sort, pour Galaxy). C'est le réglage qui fait bouger le
  simulé (D95).
- **Le radar qui ne sature plus**, de r6n1 et r6n2 (D103) : un centre au-delà du domaine s'arrête au bord et une
  flèche orangée sort au bout de l'axe (le résineux) ; l'intervalle du retenu est un trait fin par axe, coupé « // »
  au bord, au lieu de la grande étoile pâle ; moustache adoucie (35 %, 1 px) comme r6p1 l'a demandé au critique
  (« radar très rose »).
- **La flèche de ta demande au radar**, de r6n2 (h4) : verte vers l'extérieur sur Floral.
- **Le « + » pour une 4ᵉ colonne**, de r6n2 (p4) : sous « Ta stout » ; à quatre colonnes, les rangées passent au
  picto seul et les noms à 12 px (correction du critique sur r6n2, passe 2 : « Casca », « Galax » coupés).
- **Le verdict des têtes en signe**, de r6n2 : ~✓ dans ta 16D, ~⚠ et le picto qui sort ; le mot est dans la
  légende et l'aria-label. Il paie, avec « après, 3 j » (r6n2) et « inconnus » seul, les mots de la réponse.
- **Les « ? » écrits du radar retirés**, de r6p3 : le secteur hachuré et le picto pâle disent l'inconnu.
- **« Égaler »**, de r6n1 et r6n2 (y3), à un toucher sous le tableau : la dose de chaque autre houblon qui donne
  le floral du retenu à 4 g/L, cherchée par le moteur (0,5–16 g/L), ou « ~jamais, même à 16 g/L ».
- **La part « autres » d'un houblon aux mots hors familles** (D100), comme r6n2 : une barre grise nommée dans la
  tête, au-delà de 50 % (Nelson Sauvin, s'il est ajouté).
- **Le dock sous le pouce**, de r6n2 (y1b) : seulement le pont « Placer », pas les six feuilles.

Laissées de côté, et pourquoi :
- La pastille de critère « par [floral ⌄] » (r6n2, r6p2) : la visée est fixée par ta demande (floral) ; un
  critère de plus chargerait la tête de r6a.
- Le dock à six feuilles (Défi, Égaler, Valeurs, Preuve, Frise, Souche) de r6n2 et r6p1 : r6a l'a emporté sans lui ;
  seul Égaler est repris, en toucher.
- Les deux pistes du défi au premier écran (r6p3) : elles coûtent 10 mots et 28 px de radar ; les rangées Floral ↑
  et Résineux ↓ portent déjà la demande.
- « On gagne / on paie » (r6p4) : une rangée neuve sous les têtes change la forme de r6a.
- La fiche avec la teneur du lot publié (CoA, r6p1) : la fiche est celle de la voie p1 ; à lui proposer.
- Le titre « Lequel pour ma stout ? » (r6p2, r6p4) : le titre nomme les houblons dans l'ordre des colonnes,
  ce qui règle le reproche du critique sans perdre les noms.
- Les 20 bières tirées, la frise jour après jour, la souche (r6n1, r6n2) : hors de la question de Comparer.

## Écarts

Aux nombres de r6a (moteur en direct, 23.10, contre la grille `comparer-stout.json` du 22.10) :
- floral, en crans : Cascade ~+0,9, Idaho 7 ~+1,3 (1,25), Galaxy ~+0,9 (0,85) : identiques aux arrondis ;
- résineux : ~+1,9 / ~+2 / ~+2 : identiques ;
- tropicaux de Galaxy au-dessus de ta 16D (~⚠ 🍍) : identique ; Cascade et Idaho 7 restent dedans ;
- inconnus : pépins et melon pour les trois ; terreux et noyau pour Cascade, herbacé et terreux pour Galaxy :
  identiques. Baies de Galaxy : connu (18,9 sur 100), comme r6a, bien que ses fiches ne citent pas les baies ;
- un seul écart de dessin : là où ta stout est inconnue (baies, noyau), r6a posait son trait noir à 0 ; il n'est
  plus dessiné (inconnu ≠ 0). L'apport du houblon s'y lit depuis 0, comme r6a ;
- α et β des vraies valeurs : enveloppe Beer Maverick + Hopsteiner du catalogue du moteur (r6a : les sources de
  son JSON, les mêmes deux fiches) ; huile et composés : `composes-houblon.json`, la source que r6a citait.
- Le contexte dit « après, 3 j » (r6a : « après fermentation, 3 j ») et « 4 g/L chacun » (r6a : « dose égale
  4 g/L ») ; la légende dit le reste.
- Le fond de l'écran passe au papier le plus clair du thème (cave-850) : sur le papier de l'app, l'orangé et les
  couleurs de famille tombaient sous 4,5:1 (CONTRASTE).

## Pour l'app

- `index.tsx` → `src/ui/hops/HopCompare.tsx` ; `calcul.ts` → `src/domain/hopTools/compare.ts` (types `ColonneLue`,
  `CelluleLue`, `Reponse` à créer) ; `Radar.tsx` → `src/ui/hops/CompareRadar.tsx` ; `valeurs.ts` →
  `src/domain/hops/realValues.ts`, sur le catalogue de production (#120) au lieu de `composes-houblon.json`.
- Route : `{ view: 'hopCompare', recipeId, hops: string[], pin?: string }` (le `pin` de Substituer, déjà dans la route de la maquette).
- « Égaler » fait ~7 simulations par houblon (dichotomie) : sur le fil principal à 3 houblons (< 50 ms) ; au
  catalogue entier, dans le worker de Suggérer.
- La fiche s'ouvre par une entrée d'historique (comme une route `useFullScreenRoute`), pas par un état local :
  le retour du téléphone la ferme sans quitter Comparer.

## Reprise

- y1b-face-a-ta-stout : repris — la ligne de réponse sous le contexte, recalculée par le moteur à chaque colonne retenue ou ajoutée
- y1b-pastille-critere : écarté — la visée est fixée par ta demande, floral ; r6a gardée sobre, son choix du 23.10
- y1b-jauge-amertume : écarté — à cru l'IBU n'est pas modélisé ; la jauge vit dans Ma bière, pas dans Comparer
- y1b-dock-pouce : en pont — Dryhopper ; le dock sous le pouce porte « Placer <retenu> », qui ouvre Dryhopper
- y1b-plan-d-avant : repris — le trait noir de ta stout dans chaque barre, son polygone au radar, la colonne Ta stout
- y1b-bandes-style : repris — les rangées : zone de ta 16D pâle, orangé au-dessus, inconnu hachuré, trait de l'intervalle
- y1b-ligne-contexte : en contexte — Stout 16D, 4 g/L chacun, après 3 j, US-05
- y1b-defi : écarté — le défi derrière un toucher alourdit r6a ; la demande est dans les rangées ↑ ↓
- y1b-tirage-preuve : écarté — vingt bières tirées, une hypothèse de plus, hors de la question de Comparer
- y1b-levure-pastilles : en contexte — la levure est fixée dans la ligne de contexte (US-05) ; elle se règle dans Levure
- y1b-second-houblon-puis : en pont — Dryhopper ; « Placer » ouvre Dryhopper, où se règle la suite des ajouts
- y3-panel-osu : repris — le panel OSU au repos sous le tableau, sans molette, « pas de panel publié » pour les autres
- y3-pour-egaler : repris — « Égaler » à un toucher : la dose de chaque autre houblon qui donne le floral du retenu, par le moteur
- v1-vraies-valeurs : repris — « Chimie et vraies valeurs » : α, β, huile dans les colonnes des houblons, sourcés
- v1-en-a-plus : repris — dans les vraies valeurs, la plus haute de chaque rangée prend la couleur de son houblon
- v1-linalol-en-biere : repris — linalol mesuré en bière (H12, E03 à confirmer), « pas comparables entre eux »
- w2-piste-commune : écarté — r6a garde une barre par houblon ; la piste commune lettrée est r6p3, non retenue
- w2-cartes-verdict : repris — les têtes de colonne : verdict face à la 16D en signe, familles qui sortent
- x3b-cuve-jour-apres-jour : en pont — Dryhopper ; les jours de contact se règlent après « Placer »
- a2b-ce-que-la-levure-change : en contexte — la levure est fixée (US-05) dans la ligne de contexte
- d1-tout-ouvert : repris — la chimie rangée par famille, une ligne par composé avec son picto, rien d'ouvert d'office
- l5b-barres-voie : repris — les barres des rangées, face au trait de ta stout
- l5b-pistes-objectif : repris — les rangées Floral ↑ et Résineux ↓ de ta demande, avec l'écart chiffré par houblon
- l8-disposition : repris — tournée : familles communes en rangées, houblons en colonnes, la réponse en tête
- l8b-verdicts-pictos-trait : repris — verdicts en signe dans les têtes, pictos au trait partout
- l8b-legende-cachee : repris — le « ? » à droite du contexte, fermé au repos
- l5f-carte-role-alpha : repris — les têtes de colonne : nom, α du lot ou des fiches (≠), rôle en mot, familles, stock en icône
- m4-radar-degustation : repris — la colonne Ta stout : ta dégustation du 18.10 (trop ♣, plus ❀) et son trait noir
- h4-radar-demande : repris — au radar, flèche verte vers l'extérieur sur Floral, flèche orangée au bout du résineux
- p03-plages-sources : repris — vraies valeurs : α et β en enveloppe des sources (BM, HS), le trait de ton lot
- p03-radar-superpose : repris — le radar r2, un polygone par houblon à sa couleur
- p06-grille-familles : repris — les têtes : les familles de ses fiches, marquées grandes, citées petites
- p02-radar-intervalle : repris — l'intervalle du retenu en trait fin sur chaque axe, coupé « // » au bord (D103)
- s5-deux-objectifs : écarté — Suggérer précède Comparer dans la carte ; on en vient par « Comparer les 3 »
- p4-plus-comparaison : repris — le « + » sous Ta stout : un 4ᵉ houblon de ton stock, simulé en direct
- g1-fiche : en pont — fiche ; appui long sur un nom de houblon, survol long à l'ordinateur
- fiche-citra-cryo : en pont — fiche ; la même fiche courte, à l'appui long sur le nom
