# Moteur houblons v4 — « Ta bière, lue au style »

Tranche A du prototype #119 (18.10.2026). Moteur pur et typé, sans réseau, stockage ni
Gemini. Il **importe** le moteur V5.5 de l'app (aucune copie, aucun fichier de l'app
modifié) et ajoute : échelles au style, direction relative, stock, voies et classement.
Sortie principale : `data/pack-mini-protos.json`, le jeu de données commun des maquettes.

## Commandes (depuis `prototypes/houblons-v4`)

| Commande | Effet |
|---|---|
| `npm run pack` | reconstruit `data/proto-data.json`, `data/style-bands.json` et le pack |
| `npm run check:engine` | reconstruit les données, lance Vitest, imprime `ENGINE-V4 OK (n tests)` |
| `npm run typecheck` | `tsc --noEmit` (mode non strict, comme l'app) |

Témoin négatif : `V4_TEMOIN_NEGATIF=bande npm run check:engine` élargit la bande floral de
3A à 0–100 et doit imprimer `ENGINE-V4 FAIL`.

## Ce qui vient de V5.5 et ce que la v4 ajoute

| Importé de l'app | Usage |
|---|---|
| `functions/src/hopRecipePrediction.ts` (`predictHopRecipe`) | profil de la recette entière, en plages par famille |
| `functions/src/hopPredictionCore.ts` (`createHopPredictor`) | profil d'un ajout seul, repère central |
| `functions/src/hopExtrapolationCore.ts` (`hopDescriptorEvidence`) | famille citée ou non dans une fiche |
| `src/domain/hopIndex/solver.ts` (`checkHopExclusions`) | exclusions des familles « moins » |
| `src/domain/hopIndex/styleSelection.ts` (`suggestedHopVarieties`) | usage attesté par style |
| `src/services/brewingMath.ts` (`BrewingMath.hopIbu`) | IBU, et dose pour un IBU visé |
| bootstraps `hopKnowledge`, `hopExtrapolation`, `hopYeast`, `hopSolver` | axes, modèle, levures, doses du solveur |

Graphe d'exécution vérifié (esbuild) : 76 modules de l'app, aucun Firebase, Firestore,
Dexie, stockage, UI, React ni Gemini. `src/ui/hopIndex/guideData.ts` n'est pas importé.

## API (`src/engine/index.ts`)

```ts
getStyleScale(code: string): StyleScale          // '16D', '3A', 'foreign-extra-stout'… ; absolue si non documenté
valueVerdict(e, familyScale)  -> { verdict: 'au style'|'peu'|'trop'|'hors style'|'incertain'|'inconnu'|'sans bande', byCentral }
gapVerdict(a, b, familyScale) -> { verdict: '≈'|'écart'|'inconnu', why, gap, gapInBands, share, overlap, higher, threshold }
trackPosition(value, familyScale) -> { x: 0..1, clipped } ; trackShare(gap, familyScale)
recipeProfile(recipe)  -> { profile: Record<FamilyId, FamilyEstimate>, warnings, yeast, interactions }
hopProfile(key, ref?)  -> profil d'un houblon à la référence (whirlpool 3 g/L, US-05), avec citations
proposeVoies(recipe, direction, options?) -> VoieResult   // direction = { floral: +1, resin: -1 } (crans)
applyVoie(recipe, voie) -> Recipe                          // la recette d'origine reste intacte (Annuler)
styleFit(keys, scale)  -> classement documentaire du stock pour un style, sans score chiffré
recipeIbu / additionIbu / gramsForIbu / ibuPerGram         // BrewingMath, IBU en valeur et plage d'alpha
yeastInfo(id) -> 'caractérisée' | 'inconnue' | 'absente' ; matrixContext(recipe) -> facteur V5.5 + inconnues
```

`Recipe = { name, styleCode, volumeL, og, boilMin, yeastId, ebc?, fg?, abv?, ph?, additions }` ;
`Addition = { id, hopKey, moment, grams }`. Clés de houblon : id Beer Maverick
(`beermaverick-nugget`), suffixe `:cryo` pour l'article Cryo du stock. Moments : `fwh`,
`b60`, `b30`, `b15` (amertume), `b10`, `b5`, `wp`, `dryActive`, `dryPost` (arôme).

`FamilyEstimate = { status: 'estimé'|'inconnu', range: {min,max}|null, central?, confidence, completeDomain, extrapolated }`.

## Règles du moteur v4

- **Échelle au style** : bande [bas, haut] par style ET par famille, tirée des mots BJCP
  (`data/style-bands.json`, table `mots-bjcp-v1`, 31 styles). Statut attendue, neutre ou
  indésirable. Jamais un multiplicateur par style.
- **Piste** : largeur effective `w = max(15, haut − bas)` ; domaine = bande ± `w/2`, borné
  à 0–100. **Cran** = `w/3`. **Seuil d'écart** = `w/4`. **Recouvrement** ≥ 50 % de la plus
  étroite des deux plages : « ≈ », quel que soit le zoom.
- **Direction** : variation visée = crans × cran du style, relative à la recette (le
  niveau absolu peut rester inconnu). « moins X » baisse la cible **et** exclut les
  houblons dont une fiche cite X (règle V5.5).
- **Effet d'une voie** : somme signée des apports V5.5 des ajouts changés, apport =
  repère central de l'ajout à sa dose moins celui à dose nulle (fond de levure). Seules
  les familles citées par le houblon comptent (« établi ») ; sinon « non établi ».
  Assemblage : apport pris à la dose totale du moment et pondéré par la part de chaque
  houblon (convention de cumul V5.5).
- **Voies** : ajouter (b10, wp, dry hop actif, dry hop après), augmenter (×1,5, ×2),
  diminuer (×0,5), retirer, remplacer à IBU égal (amertume, à 0,5 IBU près) ou à masse
  égale (arôme), assemblage de 2 houblons du stock. Doses : `searchDosesGL` du solveur
  V5.5, plus « tout mon stock libre ». Une voie sans mouvement établi vers la cible
  n'est pas proposée.
- **Classement** (stock et à acheter classés ensemble, les deux groupes restent visibles) :
  1. conflits ;
  2. débordement de style (`styleOverflow`, `overflowTotal`) : crans hors bande imputables
     à la voie, au-dessus d'une famille neutre ou indésirable, ou hors d'une famille attendue ;
     base = repère central de la recette, ou « aucune présence établie » ;
  3. distance (Σ |variation prévue − visée| / largeur de bande) ;
  4. effets de bord dans la bande (`sideEffects`, `sideTotal`) : crans des familles neutres
     ou indésirables non visées poussées vers le haut ;
  5. stock (suffisant, manque, à acheter) ; 6. dérive d'IBU.
  Égalité de toutes les clés : même rang et `tieWith`.
- **Estimé** (`estimated: true`) : assemblage, dry hop en fermentation active
  (biotransformation non quantifiée).

## Données citées et dégustation (D25)

- **Faits cités** : `data/faits-cites.json`, un fait à la fois, avec URL et date de relevé,
  fusionnés aux descriptions de la variété par `build-data.mjs`. Aucun import en masse.
  Nugget : boutique Hopsteiner US (« woody and resiny ») et Yakima Chief (« woody », relayé).
- **Niveaux de citation** (`describeFamilies`) : non décrit, cité (une fiche), marqué (au
  moins deux fiches ou premier descripteur), avec « N fiches sur M ». Jamais une intensité.
- **Non situé** : `FamilyEstimate.situated` faux pour une plage pleine ou une plage partant
  de 0 sans repère central ; le pack porte `display: "non situé"`.
- **Dégustation** (`tastingFrom`, `situateBeer`) : niveaux faible, moyen, marqué sur les
  classes des axes (0–33, 33–66, 66–100), comme `HopTasting.axes[].perceived`. La perception
  du brasseur situe la bière d'abord ; le repère central du modèle en appui ; sinon non situé.
- **Pistes hors modèle** (`offModelLeads`) : amertume, torréfié, oxydation, forte dose à
  l'ébullition ; sourcées, sans chiffres.
- **Voie d'amertume** : diminuer jusqu'au bas de la bande d'IBU du style, en plus des
  facteurs fixes.

## Hypothèses [H] et limites

- Table mots → bandes, cran, seuil, plancher de 15 points, recouvrement de 50 % :
  **à valider par le brasseur**. « fruity » est rangé dans fruits à noyau, à pépins et
  baies.
- Les plages V5.5 de la recette sont presque toujours 0–100 après un ajout d'arôme
  (`completeDomain`) : le cumul ne situe pas la bière. La variation prévue repose alors
  sur les repères centraux de l'ajout seul (sans cumul ni saturation commune) et sur les
  fiches. Ce n'est pas une mesure.
- Saaz, Styrian Golding et Hallertau Mittelfrüh ont des profils V5.5 identiques en
  floral : « ≈ ». Le modèle ne distingue que cité / non cité.
- Nugget est cité « boisé et résineux » par deux fiches relevées à la main (D25), pas par
  Beer Maverick ni la fiche variété Hopsteiner. Son apport résineux à 60′ reste faible dans
  le modèle (repère central) : les voies Nugget baissent peu la résine.
- Facteur de matrice V5.5 : une plage commune (0,85–1,15) sans lien au torréfié, à la
  douceur, à l'alcool ou à l'acidité ; rendu comme hypothèse, aucun coefficient ajouté.
- Levure : 3 souches caractérisées dans V5.5 (US-05, Verdant IPA, Pomona) ; les autres
  gardent l'enveloppe inconnue.
- Cryo : le modèle ne distingue pas la puissance du produit ; dose en masse de produit.
- IBU : volume de la recette pris comme volume d'ébullition (comme la v3) ; amertume du
  dry hop non calculée.
- Stock relié aux variétés par le nom de l'article (#120) ; forme inconnue sauf Cryo.
- Les 30 questions de la v3 ne sont pas portées dans cette tranche.
