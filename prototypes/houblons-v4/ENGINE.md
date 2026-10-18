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
  niveau absolu peut rester inconnu). Cible absolue (`targetAbsolute`, `targetFrom`) : si la
  dégustation juge la famille « trop » ou « peu » face au style, retour dans la bande (bord le
  plus proche, `targetFrom: "dégustation"`) ; sinon repère central du modèle ± crans. « moins X » baisse la cible **et** exclut les
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

## Ajout en un toucher (`quickAdds`, `S1.ajoutsRapides`, `S2.ajoutsRapides`)

Règle (`QUICK_ADD_RULE`, testée dans `tests/donnees.test.ts`) :

1. Candidats : les houblons du stock ; disponibles (stock libre > 0) d'abord, épuisés à part.
2. Classement lexicographique (décision du pilote, réversible ; `quickAddKey`) :
   1. catégorie d'usage, comme `styleFit` (S3) : usage attesté, cohérent, peu documenté,
      non documenté, hors style (famille indésirable citée) ;
   2. conflit avec la dégustation : un houblon qui cite une famille que la dégustation juge
      « trop » face au style passe derrière et porte son tag (« + boisé et résineux ») ;
   3. le moins de familles neutres ou indésirables citées, pondérées (marqué 2, cité 1) ;
   4. le plus de familles attendues citées ;
   5. stock libre, puis nom. Égalité de toutes les clés : même rang. Aucun score.
3. Moment et dose : si l'IBU de la recette est sous la bande du style, 60′ et la dose qui
   l'amène au milieu de la bande ; sinon 10′ et la plus petite dose de recherche du solveur
   V5.5 à 10′ (0,5 g/L, soit 10 g pour 20 L), plafonnée au stock libre.
4. IBU ajoutés : `BrewingMath.hopIbu`, alpha du lot sinon plage variétale.

Chaque entrée donne aussi le stock libre et les familles citées avec leur niveau.

## Les quatre objets de l'écran (`levels.ts`, `work/refonte-frontend/v4/ecran-1/MODELE.md`)

Règle (`LEVEL_RULE`, testée) :

- **Intensité dans la bière, 0 à 3** (objets 1, 2, 4) : 0 absent, 1 faible, 2 moyen,
  3 marqué, par les classes des axes V5.5 (0–33, 33–66, 66–100).
- **Profil de ma bière** (`S1.profilBiere`, `beerLevels`) : la dégustation prime (faible 1,
  moyen 2, marqué 3) ; sinon le repère central V5.5 de la recette, converti ; 0 seulement si
  toute la plage du modèle reste sous le seuil « absent » (5) ; sinon `null`, « non situé ».
- **Cible du style** (`S1.cibleStyle`, `targetLevels`) : bande convertie ; bas ≤ 5 → 0, sinon
  la classe juste au-dessus du bas ; haut ≤ 5 → 0, sinon la classe qui contient le haut.
  Hypothèse BJCP à valider.
- **Profil après une voie** (`profilApres`, `afterLevels`) : le profil de ma bière décalé par
  l'effet établi de la voie. Famille du modèle : niveau du repère décalé (jamais 0 sans preuve
  d'absence). Famille dégustée : la classe perçue décalée ne change de niveau que si elle tombe
  entière dans une autre classe. Sans effet établi : niveau inchangé, `effet: "non établi"`.
- **Fiches d'un houblon, 0 à 2** (objet 3, `profilFiches`, `ficheLevels`) : 0 non décrit,
  1 cité, 2 marqué, avec « N fiches sur M ». Ce n'est pas une intensité dans la bière.
- S2 (3B) : cible et fiches calculées ; profil de la bière tout « non situé » (recette sans
  houblon, levure sans profil V5.5, pas de dégustation) ; pas de voies, donc pas d'après.

## Penser comme un brasseur : alpha, rôle, recette vide (`roles.ts`, `buildFromEmpty`)

- **Alpha** (`hopAlpha`) sur chaque houblon de `recetteHoublons` (S1, S5) et des ajouts rapides :
  alpha du lot (fiche de stock ou article), sinon plage variétale Beer Maverick, avec la source.
- **Rôle** (`hopRole`, `ROLE_RULE`) : le rôle du fournisseur d'abord (hopStyleUsageBootstrap,
  champ `roles`) ; sinon la **règle rôle-α v1** (prototype, à valider) : α ≥ 10 % → double si
  une famille est « marquée » dans les fiches, sinon amérisant ; α ≤ 6 % → aromatique ; entre les
  deux → double. Aucune règle de rôle par variété n'existe dans le domaine de l'app
  (`hopBalance` classe les ajouts par moment, pas les variétés).
- **Recette vide (S4)** : `ajoutsRapides` devient une construction (`mode: "construction"`) :
  deux amérisants au choix (rôle amérisant ou double, α ≥ 10 %, adéquation au style, rôle
  amérisant d'abord, moins de familles neutres, α décroissant), chacun seul à 60′ pour le milieu
  de la bande d'IBU (BrewingMath) ; puis trois aromatiques (rôle aromatique ou double) au premier
  moment d'arôme du préréglage du style dans le solveur V5.5 (stout : ébullition → 10′), à la dose
  de départ du solveur pour ce moment (1 g/L à 10′, 3 g/L au whirlpool, 4 g/L à froid :
  hopSolverBootstrap `defaults`, « presets de formulation à adapter »), avec leur effet établi.

## Radars en intensité absolue (D24) et fiches houblons

- **`profilApresNiveaux`, `deltaNiveaux`** (voies de S1 ; `afterLevelsDelta`) : niveaux 0–3
  après la voie, même convention que `profilBiere` (la dégustation prime) ; écart de niveau par
  famille, « ≈ » si l'effet établi reste sous le seuil d'écart du style, `null` s'il n'est pas
  établi. S4 et S5 n'ont pas de voies.
- **Échelle continue 0–3** (`CONTINU_RULE` ; `profilBiereContinu`, `cibleStyleContinu` de S1, S4,
  S5 ; `profilApresContinu` des voies de S1) : valeur 0–100 / 33,33, à 2 décimales, cohérente avec
  les classes V5.5. La dégustation prime (faible 0,5, moyen 1,5, marqué 2,5) ; sinon le repère
  central ; `null` si non situé. Après une voie : `null` si l'effet n'est pas établi sur la famille,
  sinon la base plus l'effet / 33,33. Les niveaux entiers effaçaient l'effet d'une voie (Golding).
- **`roueAromes`** (pack) : ordre des familles pour les radars, adjacences de la roue de Beer
  Maverick (grammaire, pas critère), avec noms courts français.
- **Fiches houblons** (`hopSheet`, `buildAll`) : une fiche par houblon de S1, S4, S5 (recette,
  ajouts rapides, voies, profilFiches) et des comparés de S2 : origine, usages attestés, alpha
  et bêta (Beer Maverick, Hopsteiner, divergence, valeur retenue), huiles (totale ; myrcène,
  humulène, caryophyllène Beer Maverick ; linalol Hopsteiner ; farnésène `null`, non importé),
  arômes (citations 0–2, N fiches sur M, auteurs), descripteurs, substituts (`null` : aucune
  donnée dans le dépôt), stock (état, libre par scénario), présence dans les recettes (dose, IBU),
  IBU par gramme selon le moment (base S1), goût. Pack et fiches dépassent 500 ko ensemble : les
  fiches sont dans `data/pack-fiches.json`, pointé par `meta.fichesHoublons` du pack.

## La levure (`yeast.ts` ; MODELE.md « La levure », R43, R44, rapport E rec. 8)

- **Double impact** (`yeastDoubleImpact`, `yeast` de S1, S2, S4, S5) : `aromePropre` = repère
  V5.5 de la levure seule (ajout à dose nulle), par famille, `specifique` si la souche a un
  paramètre propre, sinon enveloppe commune ; `expression` = facteur latent sur l'apport du
  houblon (0,65–1,35, le même pour les trois souches caractérisées : le modèle ne les distingue
  pas). Souche non caractérisée : « inconnu ».
- **Leviers** (`leviersLevure`, voies de type `levure` dans S1) : « Changer de levure » vers
  chaque souche caractérisée (Verdant IPA, Pomona) : effet = différence des arômes propres,
  établi seulement là où une souche a un paramètre propre ; « Houblonner à froid en fermentation
  active » = meilleure voie à froid du stock sans conflit, avec ses `signauxLevure`. Classés avec
  les autres voies, montrés même sans progrès (leur débordement les place en fin de liste).
- **Signaux d'un ajout à froid** (`yeastSignals`, `S5.signauxLevure`) : géraniol → citronellol
  (Takoi 2010 ; « possible » si le linalol du houblon est documenté, sinon « non évaluable ») ;
  thiols (fait cité 4MSP, classe Hopsteiner, β-lyase de la levure, politique V5.5 des
  précurseurs) ; hop creep (politique de risque V5.5). Tous « non quantifié ».
- **Taille du pack** : `ibuParMoment` retiré des listes longues (épuisés, catalogue ; `ibuAdded`
  reste) et `voiesSansHoublon` réduit aux différences (`retirees`, `nouvelles`).

## Crans du style (`CRANS_RULE` ; `profilBiereCrans`, `cibleStyleCrans`, `profilApresCrans`)

Décision du pilote : les objets 1, 2 et 4 se disent en crans du style (les niveaux 0–3
absolus restent dans le pack, mais une voie de +15,9 en floral n'y change pas de classe).

- Position = (valeur − bas de la bande) / cran (largeur effective / 3), entier le plus proche :
  0 à 3 dans la bande, 4 au-dessus, −1 en dessous (bande qui ne part pas de 0), `null` non situé.
- Valeur : dégustation par le milieu de sa classe V5.5 (16,5 ; 49,5 ; 83), sinon repère central.
- Arrondi ambigu (partie décimale entre 0,4 et 0,6) : `display` « ≈ k ».
- Cible : bande 0 à 3 crans (moins pour une bande plus étroite que le plancher) ; `visee` =
  cible absolue de la direction (`targetAbsolute`) en crans.
- Après une voie : même règle sur la valeur décalée ; `deltaCrans` = effet / cran, entier
  signé, « ≈ » sous le seuil d'écart du style, « non établi » sans effet établi.

## Cas de figure (`work/refonte-frontend/v4/ecran-1/CAS.md`)

- **S4, recette sans houblon** (K2) : la stout S1 sans ajout ni dégustation. IBU 0 face à
  50–70 ; les ajouts rapides passent en mode amertume (60′, dose pour le milieu de la bande).
- **S5, recette chargée** (K3, `loadedRecipe`, `LOADED_RECIPE_RULE`) : Nugget à 60′, puis 10′,
  whirlpool et à froid J+3 (fermentation active) ; chaque ajout d'arôme prend le premier
  houblon des ajouts rapides du style, différent des précédents, dont le stock libre couvre la
  plus petite dose de recherche du solveur ; Nugget complète l'IBU jusqu'au milieu de la bande
  (à 0,5 IBU près). `recipeLines` donne type, moment, jour, dose, IBU à son moment, stock.
- **Mention d'un niveau dégusté** (`tastingMention`) : « brassin du jj.mm » si le brassin est
  connu, sinon « dégustation du brasseur, jj.mm : « sa phrase » ».

## Achats, catalogue à acheter, goûts (`ecran-1/MODELE.md`, C-g et C-h)

- **Le stock informe, il ne limite pas.** `ajoutsRapides.catalogue` : houblons hors stock,
  marqués « à acheter », classés par la même règle (les 10 premiers ; `catalogueTotal` donne
  le nombre). S5 n'en reprend pas, pour la taille du pack.
- **Liste d'achats** (`shoppingList`, `achats` de S1, S4, S5) : par ajout, besoin, stock libre
  restant, manque en g ; par variété, total et manque ; `totalManque`. Les voies portent
  déjà leur manque en g (`stock.missing[].grams`).
- **Goûts** (`gouts`, vides par défaut ; `GOUTS_RULE`) : variété exclue retirée du domaine de
  recherche (voies, ajouts rapides) ; famille exclue traitée comme l'exclusion V5.5 (fiche qui
  la cite = conflit ; `checkHopExclusions` sur la prédiction) sans bouger sa cible ; « aime »
  sans poids. `S1.voiesSansHoublon` : classement recalculé si on exclut chaque variété des
  voies. L'ordre relatif des voies restantes ne change pas, mais des voies auparavant
  écartées par les plafonds peuvent entrer : ce n'est pas la règle « on retire et rien ne
  bouge ».
- **Taille du pack** : plafond relevé de 400 à 500 ko (décision réversible, à confirmer).

## IBU par moment (`ibuByMoment`, `momentCatalogue`)

Pour le houblon de la recette (`S1.recetteHoublons`) et chaque ajout rapide (`ibuParMoment`) :
IBU à la dose proposée et IBU par gramme, par `BrewingMath.hopIbu`, aux moments premier
moût, 60′, 30′, 15′, 10′, 5′, 0′, whirlpool (80 °C, 20 min supposés, Tinseth atténué par la
température), dry hop actif et après fermentation. À 0′, Tinseth compte 0 IBU (le
refroidissement n'est pas modélisé). À froid : `null` avec `raison` (pas d'IBU Tinseth ;
humulinones dans un modèle séparé, non branché). `moments` du pack donne la liste canonique :
libellé, code V5.5, unité du « quand » (minutes d'ébullition, °C et minutes, jour à cru).

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
