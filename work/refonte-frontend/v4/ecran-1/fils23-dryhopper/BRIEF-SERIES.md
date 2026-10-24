# Brief commun : lot 23, Dryhopper, v0 en séries (r7a à r7g)

Écrit par le pilote le 22.10, nuit. Lis-le en entier avant ton VOIE.md. Méthode : l'entonnoir
(`.claude/skills/voies/references/entonnoir.md`) ; un vaste panel de concepts minimalistes, puis un classement, des
greffes et des passes jusqu'au satisfaisant.

## La question de l'outil (obligatoire)
**« Quand l'ajouter ? »** Dryhopper répond au moment d'ajout d'un houblon déjà choisi dans la stout. C'est
la carte des outils du conseil du 22.10 (`cerveau/decisions/2026-10-22-carte-outils-houblons.md`) : « y1b sans
sélecteur de houblon, sans second houblon et sans levure ».
- **Un seul facteur libre : le moment** (D98) : ébullition par 5′ (60′ … 10′), whirlpool, dry hop pendant la
  fermentation active, dry hop après, et les jours de contact. Tout le reste se fixe dans la ligne de contexte
  (`data-role="contexte"`), sans contrôle : la stout 16D, Idaho 7 (le houblon mis en avant dans r6a, que le brasseur
  a choisie), 4 g/L, US-05.
- Le titre de l'écran est une question qui finit par « ? ». L'écran Dryhopper de la carte
  (`fils22-carte/dryhopper/`, « Quand ajouter Idaho 7 ? ») passe déjà D98 : `UNE-QUESTION OK (1 groupe libre : moment)`.

## La baseline (obligatoire partout, chaleur et série libre comprises)
Un plancher à enrichir (L07), jamais un plafond. Un écart se fait acquis par acquis, avec sa raison dans ta NOTE.
- **y1b, « le brassin au doigt »** : « y1b est de mon point de vue semble meilleur » (20.10). Ouvre
  `fils21-choisir/y1b/etat.html`, `fils21-choisir/y1b/NOTE.md` et `fils21-choisir/captures/y1b-*.png`. Garde son
  geste : glisser le moment comme un curseur, par 5′ (« pouvoir glisser comme un slider le moment de l'ajout »,
  18.10) ; « face à ta stout » ; la pastille de famille ; la jauge d'amertume ; le dock sous le pouce.
- **x3b réduit** : « La x3b est aussi interessant mais dur à lire. mais ça peut être interessant de l'utiliser
  jsute pour de la comparaison entre ma bière de base -> 1 dry hop, 2 dry hop: levure » (20.10).
  `fils21-choisir/x3b/` et `fils21-choisir/captures/x3b-*.png`.
- **a2b, « voir ce que la levure change »** : « a2b est interessant mais peut être pas en main. voir ce que la
  levure change reset vraiment interessant » (20.10). `fils21-choisir/a2b/` et `fils21-choisir/captures/a2b-*.png`.
- **Les acquis** (`cerveau/produit/acquis-valides.md`) : code couleur des arômes, barres de l5b, disposition l8,
  radars m4 et h4 sans légende écrite, pictos au trait, au style par défaut, α en tête puis rôle en mot, stock en
  icône, légende derrière un « ? », appui long → la vraie fiche.
- **L'inventaire** (`fils22-comparer/donnees/elements-notes.json`) : les éléments notés pour Dryhopper et Levure
  (`y1b-dock-pouce`, `y1b-second-houblon-puis`, `x3b-cuve-jour-apres-jour`, `y1b-levure-pastilles`,
  `a2b-ce-que-la-levure-change`).
- **L'écran Dryhopper de la carte** (`fils22-carte/dryhopper/`, captures `fils22-carte/captures/dryhopper-*.png`) :
  le point de départ accepté par le critique.

## Les choix encore ouverts du brasseur (montrés en variantes, L24)
- **Levure** : dernière étape de Dryhopper, ou outil propre (un pont « Levure › »). Dans ta série, au moins deux
  concepts de chaque forme.
- **Descripteurs** : A (« groseille à maquereau » rangée dans Petits fruits) ou B (une part « autres » visible,
  plafonnée) : ton VOIE.md dit lequel ta série porte.

## Un concept minimal (environ 5 tours)
L'essentiel seulement : **la représentation qui répond** (où on voit le meilleur moment), **le geste** (le moment
au doigt), **une vraie valeur** sourcée (un comparatif de `comparatifs-dryhop.json`, E01 à E10, ou une mesure).
Fidélité, finitions et blocs secondaires viennent en passe 2. Huit concepts par série, aucun n'est une variante
d'un autre.

## Chaleur (D22)
- **froide** : une idée déjà retenue (y1b, x3b, a2b, l'écran de la carte), affinée ;
- **tiède** : la forme de l'approche de ta série ;
- **chaude** : forme libre.
Ton VOIE.md dit combien de chaque. Marque chaque concept dans ta NOTE.

## Données (vérifiées le 22.10 par D102, voie r6e ; ne pas les modifier)
- `fils21-choisir/donnees/profils-simules.json` : la grille de 624 entrées (6 houblons dont Idaho 7 ; moments b60,
  b10, wp, dryActive, dryPost ; doses 1, 2, 4, 8 g/L ; jours ; levures US-05 et Pomona), et `PROFIL-SIMULE.md`.
- `fils21-choisir/donnees/comparatifs-dryhop.json` : études E01 à E10. Dans une étude à plusieurs variétés, lis la
  ligne de la bonne variété (L14 : le linalol d'Azacca s'est déjà affiché pour Idaho 7).
- Honnêteté : simulé marqué « ~ », source citée, inconnu hachuré, jamais 0.

## Balisage et rendu
- Une page par concept : `serie-<x>/<x><n>/etat.html` (par exemple `serie-a/a3/etat.html`), autonome, à 390 px.
- Le groupe libre porte `data-libre="moment"` ; la ligne de contexte `data-role="contexte"` et `data-contexte`.
- Classes préfixées par l'id du concept (L26). Rien sous 12 px (D60). Pas de défilement horizontal.
- Captures dans `serie-<x>/captures/` : `<x><n>-390.png` (premier écran) pour chacun. Ouvre chacune (L12).

## Joués une fois en v0, recopiés dans la NOTE (obligatoires en passe 2)
D98 (`controle-une-question`), D99 (`controle-acquis`, s'il s'applique), MOTS (`mots-premier-ecran --max=80`).
