# Un geste = une recette complète — état de l'art et briques (20.11)

Portée : « je choisis une IPA → suggestions des ingrédients, et au clic la bonne quantité au bon endroit » (mot du brasseur, 20.11). Lecture seule : aucun fichier de `src/` ni donnée touché, aucun Gemini. Écart au brief : `pb4` (« depuis ta dernière du style ») refusé, donc ici tout vient du style et du moteur, pas de l'historique.

## État de l'art

**Problème type** : formulation de recette « style → recette » (recipe formulation / style-driven recipe design), c'est-à-dire résoudre dans cet ordre : cible du style (OG, FG, IBU, SRM, ABV) → masse de grain pour l'OG au rendement du matériel → répartition du grain en pourcentages typiques → IBU réparti sur les moments (BU:GU) → levure et dose de cellules → eau (SO4:Cl, alcalinité). C'est la fonction « style template » de BeerSmith, Brewfather, Brewer's Friend.

**Examiné**
- **BJCP 2021** (Beer Style Guidelines) : plages OG/FG/IBU/SRM/ABV par style et descriptions des ingrédients ; pas de pourcentages de grain ni de doses de houblon. Déjà dans le dépôt (`brewingStylesBootstrap.json`, 123 styles BJCP 2021, 168 BA 2026).
- **Brewing Classic Styles** (Zainasheff, Palmer, 2007) : par style, grain bill en %, IBU par moment, souche de levure, température. Référence imprimée, droits réservés : pas de reprise des tables, seulement la méthode. Pas de jeu de données ouvert.
- **Palmer, *How to Brew*** (4e éd., 2017) : OG depuis l'extrait et le rendement, Tinseth/Rager pour l'IBU, cellules par °Plato. **Palmer & Kaminski, *Water*** (2013) : profils d'eau par style, SO4:Cl, alcalinité résiduelle. Le dépôt implémente déjà le calcul (`brewingMath.ts`, `water/`).
- **BU:GU** (IBU ÷ points de densité) : repère de balance par style, fourchette ~0,5 à 1,2 pour une IPA ; déjà dans `hopBalance.ts`.
- **BeerSmith, Brewfather, Brewer's Friend** : modèles de recette par style, mais ce sont des recettes d'exemple chargées à la main, sans moteur de déduction ; formats non ouverts (BeerXML 1.0 est ouvert comme format, pas comme données de style).
- **Données ouvertes** : Beer Analytics (CC BY-SA 4.0), déjà exploité par `fermentables/typicite-styles.json` — donne, par style, la part des recettes qui contiennent un ingrédient, pas le % de la facture de grain ni les grammes. Aucune bibliothèque npm maintenue ne fait « style → recette complète » avec moteur et licence compatible. À confirmer en ligne si une table de % de grain sous licence ouverte existe ; non vérifié ici (pas de réseau utilisé).

**Décision**
1. Un seul moteur de calcul : celui du dépôt (`BrewingMath`, solveur de sels, v4 `buildFromEmpty`). Aucune seconde formule.
2. Source de chaque quantité : cible du style = BJCP du dépôt ; masse de grain = OG milieu de plage inversée au rendement du matériel (calcul exact, pas de table) ; IBU = milieu de plage, converti en grammes par `hopIbu` ; arôme = dose de départ du solveur V5.5 ; eau = solveur de sels sur le profil du style ; levure = `YEAST_RECIPE_PROFILES` + `pitchRate`.
3. **Trou à combler, seul vrai manque de donnée** : la répartition du grain en pourcentages (base / caramel / spéciaux). Ni BJCP, ni le dépôt ne la portent. Trois options, à trancher par le brasseur (goût) : (a) table `style → %` écrite à la main depuis Brewing Classic Styles et ses propres recettes, relue par lui ; (b) % tirés de ses recettes de ce style (refusé : pb4) ; (c) ne proposer que le malt de base seul (juste, défaisable, rien d'inventé) et poser les spéciaux typiques en suggestion non cochée avec leur typicité (`proposerFermentables`). **Recommandation prudente : (c) par défaut, (a) en choix à montrer en mini maquettes.**
4. Réglé sur son volume et son matériel : `adaptRecipeEquipment` et `equipmentCheck` refusent ce qui ne tient pas ; le rendement vient du matériel (seed : 75 % sur 30 L).

## Briques du dépôt

| Brique | fichier:ligne | Ce qu'elle fait | Appelée par un écran ? | Manque pour « un geste = recette » |
|---|---|---|---|---|
| Styles BJCP 2021 / BA 2026 | `src/domain/brewingStyles.ts:15-35` ; `src/data/brewingStylesBootstrap.json` | Plages `stats.og/fg/abv/ibu/srm`, alias, `suggestions{mash,fermentation,hop,water}` (liens vers préréglages) | Oui : `BrewWizard.tsx`, `ui/BrewingStyleDetails.tsx:24-26` (bouton « appliquer » empâtage et fermentation seulement) | Rien pour grain, houblon, levure : `suggestions` ne donne que des identifiants de préréglage |
| Typicité des fermentescibles | `src/domain/fermentables/typicite.ts:63-79`, `proposition.ts:83-99` | Classe les articles du stock par part de recettes du style (Beer Analytics) ; jamais de quantité | Oui : `ui/fermentescibles/Ajout.tsx` | Pas de %, pas de kg ; les malts de base n'y figurent pas (ils sont dans trop de styles pour entrer dans le « top 16 ») |
| Échelle de style houblon | `src/domain/hopIndex/v4/style/scale.ts:69-97`, `src/data/hopV4/style-bands.json` | Bandes d'arômes par famille et plage IBU, 12 styles documentés | Oui : `ui/hopIndex/parcours/adaptateur.ts` | OK pour guider ; style non documenté = échelle absolue |
| Recette vide houblon | `src/domain/hopIndex/v4/cases.ts:52-98` (`buildFromEmpty`) | Amérisant à 60′ au milieu de la bande d'IBU (g exacts par `hopIbu`), 3 aromatiques à la dose de départ V5.5 au moment du préréglage du style | Oui : `ui/hopIndex/maBiere/Ajouter.tsx:100` | Un seul moment d'arôme (le 1er du préréglage) ; pas de dry hop daté ; pas de pose directe dans la recette (propose, ne pose pas) |
| Doses de départ houblon | `src/data/hopSolverBootstrap.json` (`defaults[moment].doseGL`), `hopStyleUsageBootstrap.json`, `hopRecipeGuideBootstrap.json` | g/L par moment (whirlpool, froid) ; usages attestés par style ; lexique d'arômes | Via `buildFromEmpty` | `hopRecipeAggregationBootstrap.json` = convention de cumul seulement |
| Rôles / usages de houblon par famille de style | `src/domain/hopRecipeDesign.ts:19-60` (`HOP_STYLE_ROLES`, `hopFitsStyle`) | Dit quel houblon convient à quelle famille de style | Oui : `ui/hopIndex/HopRecipeWorkbench.tsx` | Aucune dose |
| Moteur de simulation | `src/domain/hopIndex/v4/profil-simule.ts` (`simulerCas`) ; `cerveau/metier/cout-calcul-moteur.md` | Profil aromatique simulé : 0,1 à 1,4 ms léger, 4 à 6 ms complet | Oui : `ui/hopIndex/comparer`, `dryhopper` | Aucun problème de temps ; sert à vérifier l'arôme, pas à dimensionner |
| Calcul OG/FG/IBU/ABV | `src/services/brewingMath.ts:75` (ABV), `:119` (`hopIbu`), `:199` (`extractPoints`), `:256` (`calculateOg`), `:281` (`calculateFg`), `:388` (`pitchRate`), `:503` (`waterVolumes`) | Formules standard (Tinseth, Malowicki pour le whirlpool, ASBC) | Partout | Pas d'inverse OG → kg : à écrire (une ligne, voir plus bas) |
| Équilibre amer / BU:GU | `src/domain/hopBalance.ts:28` | Place SO4:Cl dans la fourchette du style d'après BU:GU et part amère | Oui : `ui/water/useWaterWorkshop.ts` | — |
| Matériel et redimensionnement | `src/domain/adaptRecipeEquipment.ts:12-111`, `src/domain/brewEquipment.ts:85` (`defaultBrewVolume`), `equipmentCheck` | Ramène une recette à un volume et un rendement, refuse ce qui ne tient pas (cuve, fermenteur, rinçage) | Oui : `BrewWizard.tsx`, `design/BrewPreview.tsx` | Partent d'une recette existante ; aucune recette « modèle de style » à adapter |
| Eau et sels | `src/domain/recipeWater.ts:118` (`replanRecipeWater`), `src/domain/water/solve.ts:7` (`solveSalts`), `src/domain/waterStyles.ts:42-594` (`STYLE_WATERS`, `styleWaterForReference`) | Profil par style (29 styles), sels en g, acide, pH | Oui : atelier de l'eau, `BrewWizard.tsx` | Besoin d'une analyse d'eau source : saisie à la main (aucune API suisse) |
| Levure | `src/data/yeastRecipeProfiles.ts:42-89`, `src/domain/yeastRecipeDesign.ts:257` (`yeastRecipeCandidates`), `brewingMath.ts:388` | Liste éditoriale par famille de style (`clean-ale` : US-05, BRY-97…) ; sachets par OG et volume | Oui : étape levure | Choix de la souche par défaut du style : à fixer |
| Empâtage et fermentation par style | `src/domain/brewPrograms.ts:208,219` | Paliers d'empâtage et de fermentation tirés de `suggestions` | Oui : `BrewingStyleDetails.tsx` | OK, c'est le seul « un geste » déjà branché |
| Stock houblon de départ | `src/domain/hopIndex/v4/data.ts:135-139`, `src/data/hopV4/proto-data.json` (`stock`, fixture `tests/fixtures/production/houblons-2026-10-17.json`) | 16 articles de houblon du brasseur au 17.10 | Oui (moteur v4) | `seedData.ts` est vide (gabarit) : aucun stock dans le seed |

**Verdict** : le moteur sait tout calculer ; aucun écran ne les enchaîne. Manque précis : (1) la répartition du grain en %, (2) un orchestrateur « style → brouillon de recette » (grain, houblons à plusieurs moments, levure, eau) qui appelle ces briques dans l'ordre et pose le brouillon d'un coup, défaisable ; (3) le choix par défaut de la souche. Le reste est du branchement.

## Exemple IPA calculé

Matériel (seed : `initialBrewhouses[0]` dans `src/data/seedData.ts` = « Système 30L ») : volume 30 L, rendement 75 %, évaporation 10 %/h, mash 4,2 L/kg ; cuve 45 L, fermenteur 30 L (`practicalEquipment`, `brewEquipment.ts`). Le seed ne porte **aucun stock** (gabarit vide) : les houblons viennent donc de la fixture de stock du moteur v4 (`proto-data.json`, extrait de production du 17.10, 16 articles) et, hors stock, du catalogue v4. Script jetable : `$TMPDIR/ipa.ts` (vite-node), importe `buildFromEmpty`, `BrewingMath`, `replanRecipeWater`, `recipeBeerColor`.

### American IPA (BJCP 21A), 30 L

Cible du style (BJCP 2021, `brewingStylesBootstrap.json`) : OG 1,056-1,070 ; FG 1,008-1,014 ; IBU 40-70 ; SRM 6-14 (soit ~12-28 EBC) ; ABV 5,5-7,5 %.

| Poste | Valeur | Origine |
|---|---|---|
| OG visée | 1,063 (milieu) | BJCP |
| Grain total pour cette OG | **8,16 kg** (7,25 kg à 1,056 ; 9,07 kg à 1,070), 100 % malt de base | moteur : `extractPoints` inversé à 75 % ; potentiel du malt de base **37 ppg = hypothèse**, non lu d'un catalogue (manque : ppg et EBC du malt réellement en stock ; `seedData` vide) |
| Répartition base / caramel / Carapils | **manque : table de % par style** (ni BJCP ni dépôt) | — |
| Illustration [H] 90 % pale / 5 % caramel 40L / 5 % Carapils (non sourcée, ppg 37/34/33, EBC 6/80/4 posés à la main) | OG 1,062 ; FG 1,0136 (atténuation 78 % hypothèse, souche non lue) ; ABV 6,5 % ; EBC 13,7 | `calculateOg`, `calculateFg`, `calculateABV`, `recipeBeerColor`. Typicité Beer Analytics pour 21A : Carapils dans 28 % des recettes, caramel 40L 15 %, caramel 20L 9 % (aide au choix, pas aux %) |
| IBU visé | 55 (milieu 40-70) | BJCP |
| Amérisant, 60′ | **Galaxy 46,7 g** (1,56 g/L), α 17,2 % → 54,9 IBU ; **en stock : 60 g** | `buildFromEmpty` (`hopIbu` Tinseth sur OG 1,063) ; stock fixture |
| Arôme, whirlpool (préréglage « westcoast » : whirlpool puis dry hop après fermentation) | 3 g/L = **90 g** pour UNE variété ; 3 propositions : Chinook (α 13,3, hors stock), Nugget (α 13, épuisé), Amarillo (α 9, hors stock) | dose de départ du solveur V5.5 ; catalogue, aucune en stock disponible |
| Dry hop (« après fermentation ») | **manque : dose et jour** : `buildFromEmpty` ne retient que le 1er moment du préréglage (whirlpool) ; le solveur a une dose g/L pour le froid mais l'orchestrateur ne la pose pas | `cases.ts:72-76` |
| IBU du whirlpool | non ajoutés au total : le moteur donne le IBU par ajout (`ibu` de la ligne), pas la somme du brouillon | manque : somme des IBU du brouillon |
| Levure | **2 sachets** de 150 Md (342 Md de cellules, 0,75 M/mL/°P, 15,2 °P) ; souche : fiche `clean-ale` → **SafAle US-05** ou BRY-97 ; **choix par défaut non fixé** | `pitchRate` ; `yeastRecipeProfiles.ts` ; le catalogue 1 733 entrées non lu |
| Eau | source : Fribourg (Ca 85, Mg 14, Na 8, SO4 28, Cl 22, HCO3 250 ppm ; valeurs du test `waterPractice.test.ts`, l'analyse réelle du brasseur n'est pas dans le dépôt), profil cible `21A`. Résultat moût : Ca 159,9 / Mg 14 / Na 22,4 / **SO4 207,5 / Cl 44,3 (SO4:Cl 4,7)** / HCO3 10,3 ppm ; acide lactique 14,2 mL empâtage + 4,3 mL rinçage ; alerte « charge lactique au-dessus du repère » | `replanRecipeWater`. **Limites** : mes volumes (empâtage 34,3 L, rinçage 12 L) étaient posés à la main, pas issus de `waterVolumes` : le Ca 160 ppm vient de là, pas du solveur seul ; doses de sels en g **non extraites** de `plan` par le script : manque : g de gypse / CaCl2 |
| Cibles résultantes | OG 1,062 ; FG ~1,014 ; IBU ~55 ; EBC ~13,7 ; ABV 6,5 % | voir ci-dessus, avec les hypothèses |

### Hazy / NEIPA (BJCP 21C, préréglage « hazy »)

IBU visé 42,5 (milieu de la bande du dépôt). Amérisant : **Galaxy 36,1 g** à 60′ (1,2 g/L, 42,5 IBU, en stock 60 g). Arôme au préréglage (whirlpool, puis à froid actif et après fermentation) : whirlpool 3 g/L = **90 g** par variété ; propositions : Belma (hors stock), **Citra cryo (α 24,8, en stock 65 g, 90 g demandés : manque 25 g)**, Citra (hors stock). Dry hops à froid : **manque** (même limite). Grain, levure (Verdant IPA / London Ale III du profil `hazy-ipa`) et eau (chlorure ≥ sulfate) : mêmes manques que pour la 21A ; pas recalculés ici (script limité, pas de table de % ni de profil d'eau 21C vérifié).

Constat sur le brouillon de 21A : si le brasseur coche les 3 aromatiques, la recette contient 270 g de houblon de whirlpool (9 g/L) ; `buildFromEmpty` les donne comme **alternatives**, pas comme une liste à cumuler. Un geste doit donc en poser **une** (la 1re, en stock si possible) et laisser les autres en remplacement.

### Sortie brute du script

```json
{"bh":"Système 30L V=30 L, rend. 75 %, cuve 45 L","hops_21A":{"ibuCible":55,"preset":{"id":"westcoast","name":"IPA agrumes et résine","timings":["whirlpool","postFermentation"],"source":"Points de départ et contraintes du solver aromatique"},"amer":[{"n":"Galaxy","alpha":17.2,"stock":{"etat":"en stock","grams":60,"libre":60},"m":"60′","dose":{"grams":46.7,"gramsPerLitre":1.56,"regle":"milieu de la bande d’IBU"},"ibu":{"value":54.9,"min":54.9,"max":54.9}}],"aro":[{"n":"Chinook","alpha":13.3,"stock":{"etat":"hors stock","grams":0,"libre":0},"m":"whirlpool","dose":{"grams":90,"gramsPerLitre":3,"regle":"dose de départ du solveur V5.5 (whirlpool)"}},{"n":"Nugget","alpha":13,"stock":{"etat":"épuisé","grams":0,"libre":0},"m":"whirlpool","dose":{"grams":90,"gramsPerLitre":3,"regle":"dose de départ du solveur V5.5 (whirlpool)"}},{"n":"Amarillo","alpha":9,"stock":{"etat":"hors stock","grams":0,"libre":0},"m":"whirlpool","dose":{"grams":90,"gramsPerLitre":3,"regle":"dose de départ du solveur V5.5 (whirlpool)"}}]},"hops_21C":{"ibuCible":42.5,"preset":{"id":"hazy","name":"IPA fruitée / Hazy","timings":["whirlpool","fermentation","postFermentation"],"source":"Points de départ et contraintes du solver aromatique"},"amer":[{"n":"Galaxy","alpha":17.2,"stock":{"etat":"en stock","grams":60,"libre":60},"m":"60′","dose":{"grams":36.1,"gramsPerLitre":1.2,"regle":"milieu de la bande d’IBU"},"ibu":{"value":42.5,"min":42.5,"max":42.5}}],"aro":[{"n":"Belma","alpha":10.3,"stock":{"etat":"hors stock","grams":0,"libre":0},"m":"whirlpool","dose":{"grams":90,"gramsPerLitre":3,"regle":"dose de départ du solveur V5.5 (whirlpool)"}},{"n":"Citra cryo","alpha":24.8,"stock":{"etat":"en stock","grams":65,"libre":65},"m":"whirlpool","dose":{"grams":90,"gramsPerLitre":3,"regle":"dose de départ du solveur V5.5 (whirlpool)"}},{"n":"Citra","alpha":12.5,"stock":{"etat":"hors stock","grams":0,"libre":0},"m":"whirlpool","dose":{"grams":90,"gramsPerLitre":3,"regle":"dose de départ du solveur V5.5 (whirlpool)"}}]},"kgBase_1.056":7.25,"kgBase_1.063":8.16,"kgBase_1.07":9.07,"OG_H":1.062,"FG_att78":1.01364,"ABV":6.5,"EBC":13.7,"pitch":{"degreesPlato":15.2,"rate":0.75,"cellsNeededB":342,"sachetsExact":2.3,"sachetsDry":2,"starterAdvised":false,"verdict":"2 sachets (2.3 en théorie)."},"eau":{"acid":{"id":"lactique","mash":14.2,"sparge":4.3},"wort":{"ca":159.9,"mg":14,"na":22.4,"so4":207.5,"cl":44.3,"hco3":10.3},"warnings":["Charge lactique au-dessus du repère gustatif : envisager un autre acide ou davantage d’osmosée, sans dépasser le stock déclaré."],"mashL":34.3}}

```

### Limites

- Hypothèses marquées [H] : ppg et EBC des malts, atténuation 78 

## Déductions par parcours

Hors périmètre déjà pris (pa1, pa2 ; pb1–pb3 ; pe1, pe3, pe4 ; pm1 ; pl1, pl2).

- **Rebrasser** : tout est dans `Batch.recipeSnapshot` (recette figée au lancement, `cerveau/metier/modele-brassage.md`) : refaire la même recette sans relire, volume = `defaultBrewVolume`, ratios recalculés par `adaptRecipeEquipment` si le matériel a changé. Pas d'invention : seul le α du lot de houblon peut avoir bougé (champ `StockItem.alphaPct`), à signaler.
- **Facture (hors pa1, pa2)** : unité et quantité déjà lues par `stock/articleNeuf.ts` ; l'article se relie par `StockItem.nomsFacture` et `fiche` ; α, origine, EBC lus du libellé (`stock/donnees.ts:27-74`). Déduction possible : prix par unité (`pricePerUnit`) = total ligne ÷ quantité, catégorie depuis la fiche de catalogue.
- **Rangement d'achat** : après une facture, `StockItem.currentStock` monte de la quantité lue ; emplacement non porté par `StockItem` (aucun champ de lieu : manque, à ne pas inventer) ; seuil `minStock`/`reorder` déjà dans l'article.
- **Brassin du jour J** : `Batch.plannedBrewDate`, `recipeSnapshot` et `brewDay.ts` donnent la liste de pesée, les volumes d'eau (`waterPlan`), l'acide par étape et l'ensemencement (`pitchingPlan.ts`) : tout se préremplit à l'ouverture du jour. Le pH et la densité mesurés restent des relevés de cuverie, jamais préremplis.
- **Vente** : `Client` + `PricingItem` (`priceHT`, `costTotal`) : prix proposé = tarif du produit ; client récurrent → dernier produit et conditionnement ; TVA et taxe (`swissBeerTax.ts`, `tvaThreshold.ts`) calculées. Quantité jamais devinée.
- **Fût** : `KegItem` (`capacityL`, `state`, `batchRef`, `beerName`, `style`, `fillDate`) : au remplissage, nom de bière, style et date se posent depuis le brassin lié ; volume = capacité ; CO₂ cible et pression par `calculateKegPressureBar` et `calculatePrimingSugarG` (`brewingMath.ts:844-862`) d'après le style.
- **Planification** : `batchSchedule.ts`, `fermenterPlanning.ts`, `batchFermenter.ts` (`fermenterConflict`) : durée de fermentation et de garde du style (`brewPrograms.ts:208`) → dates de fin et de mise en fût ; fermenteur libre proposé hors conflit. Le Planning est porté dans Carnet et Calendrier (SPEC 20.11) : rien à créer à part.

## Limites de ce document

- Non lu : `hopSolverBootstrap.json` en détail, `yeastCatalogueBootstrap.json` (1 733 entrées), `docs/water-style-audit.md`, `PRODUCT.md`.
- Aucune vérification en ligne de licences de jeux de données de recettes (non cherché).
