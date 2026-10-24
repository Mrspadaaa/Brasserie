# Prototype de l'étape Houblons — v3

Mission #119, 18.10.2026. Page autonome, **hors de l'app** : rien n'est intégré
avant l'accord du brasseur (porte B). Refaite après le refus de la v2 (« pire que
les alternatives ») : la v3 part de la référence Beer Maverick
([docs/qualite/reference-beer-maverick.md](../../docs/qualite/reference-beer-maverick.md))
et des 30 questions de [la banque](../../docs/besoins/banque-de-questions.md).

Page privée : https://claude.ai/artifact/UrdkDumB4m95s1iHr4ye27

## Ce que fait la page

| Geste | Où | Ce qu'on voit |
|---|---|---|
| Choisir | Liste « Mes houblons », sans toucher | mes houblons classés du + au − pour le style (typique, compatible, hors style), arômes en mots, stock, et la dose que « + » ajoute (« assez » ou « manque N g ») ; la rangée « + ajoute » choisit l'ajout (amertume 60′, whirlpool, dry hop) |
| Comparer | Cases de la liste, « 4 premiers », ou « ses 3 plus proches » ; volet en bas dès 2 houblons | radar superposé et IBU à dose égale ; « Tout comparer » : arômes côte à côte, IBU, dose face au stock, plages α, β, huiles, descripteurs |
| Simuler | « Mon houblonnage » | IBU de chaque ajout ; jauge : IBU à chaud dans la plage du style, après dry hop (estimé), arôme dominant ; moment changé : écart et dose à ajouter maintenant |
| Remplacer | Icône ⇄ sur un ajout | 5 remplaçants du stock (stock libre), 3 à acheter ; même IBU pour l'amertume, même masse pour l'arôme ; gagné et perdu |
| Questions | Bouton « Questions » | les 30 questions, chacune avec sa réponse calculée sur la recette et le stock, ou « non documenté » et ce qui manque |

## Construire

```text
node prototypes/houblons-v3/build-data.mjs
```

Le script lit les données du dépôt, écrit `data.json`, puis assemble `index.html` à
partir de `app.html` (données intégrées, une seule page).

| Donnée | Source |
|---|---|
| 318 variétés : plages alpha, bêta, huiles ; descripteurs rangés en 8 arômes | `src/data/hopBeerMaverickBootstrap.json` |
| Familles d'arômes, linalol, classe thiol (84 variétés reliées) | `src/data/hopManufacturerBootstrap.json` (Hopsteiner 2025) |
| Usages attestés par style (IPA seulement) | `src/data/hopStyleUsageBootstrap.json` |
| 123 styles, plages d'IBU et de densité | `src/data/brewingStylesBootstrap.json` (BJCP 2021) ; direction houblon résumée par catégorie dans `build-data.mjs` |
| Stock | `tests/fixtures/production/houblons-2026-10-17.json` (lecture seule, relié par le nom) |
| Amertume à cru | `src/data/hopBitternessBootstrap.json` (Maye 2016), même calcul que `functions/src/hopBitternessCore.ts` |
| Doses d'arôme de départ | préréglages du solveur, `src/data/hopSolverBootstrap.json` |
| IBU | formule de `BrewingMath.hopIbu` (`src/services/brewingMath.ts`) |

Couleurs des houblons comparés : bleu `#3987e5`, orange `#d95926`, vert d'eau
`#199e70`, or `#c9a227`, avec une forme chacun (rond, triangle, carré, losange).
Validées sur `cave-900` par le script du skill dataviz (toutes paires : ΔE ≥ 15
en vision normale, ≥ 8 en daltonisme). Proposées pour DESIGN.md après la porte B.

## Contrôles

| Contrôle | Commande |
|---|---|
| Un toucher, sans défiler | `node scripts/check-hop-one-tap.mjs --adapter scripts/hop-one-tap/prototype-v3.mjs` |
| Règles U, 390 et 1280 | `node scripts/check-hop-ux-rules.mjs --adapter scripts/hop-one-tap/prototype-v3.mjs [--width 1280 --height 800]` ; `V3_STATE=compare3` ou `questions` pour ces états |
| Budgets B3 et B4 | `node scripts/check-hop-budget.mjs --adapter scripts/hop-one-tap/prototype-v3.mjs` |
| Gestes complets | `node scripts/check-hop-v3.mjs` |

## Limites

- Profils d'arôme : nombre de descripteurs Beer Maverick par arôme, plafonné à 3.
  Ce n'est pas une intensité sensorielle mesurée.
- Direction houblon des styles : résumé du guide BJCP par catégorie ; les bières
  de spécialité (catégories 28 à 34) n'en ont pas.
- Aucune source d'usage par style hors IPA : pas de rang chiffré pour la stout.
- Le stock n'est relié aux variétés que par le nom de l'article (#120).
