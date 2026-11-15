# PLAN d1 — une seule chaîne litre → format, et l'impôt bière juste

Étape 1 (plan seul, aucun code). Lu au 09.11 dans le worktree. `dom/` = `src/domain/finance/`. Aucun IBAN, aucune donnée réelle.
Références : PLAN-METIER § 3.1, § 3.4, § 3.6 ; INVENTAIRE-CODE problèmes 3, 4, 12, 13, 14 ; décisions P2/P3 de COMMUN.md (non concernées ici).

## 0. Constats qui changent le plan écrit en amont (à relire en revue)

1. **Problème 14 est déjà à moitié réglé.** `storage.ts:245-247` vaut déjà 25,32 (CF-NOTE-2, 08.11) et `tests/unit/contreCalculTauxImpotBiere.test.ts:11`
   l'impose (`defaultConfig.fiscal.beerTaxFullRatePerHl === beerTaxBracket(12)`). Il reste : le barème est une fonction à seuils codés, 25,32 est
   répété en repli (`swissBeerTax.ts:39-40`), et le réglage est stocké sans être lu. Ce plan ne touche pas `storage.ts` (hors Possède) ni le test.
2. **7,51 CHF/L est le coût complet** (emballage et impôt compris) : 202,77 ÷ 27, et « 33 cl : 7,51 × 0,33 = 2,48 » dans la fixture. Or PLAN-METIER § 3.1
   écrit « coût du litre liquide = (déjà payé + à payer **hors emballage** + année) ÷ litres nets » puis « coût d'un format = litre × volume +
   emballage + impôt » : appliquée à la lettre avec 7,51 elle compte deux fois l'emballage et l'impôt. La chaîne ci-dessous porte **deux** litres,
   le complet (7,51, le chiffre de c3a) et le liquide (6,37), et le format part du liquide. Les deux se recoupent : 6,3678 × 0,33 + 24,00 ÷ 81,82
   + 0,0836 = 2,478 → 2,48 (brassin entièrement en 33 cl).
3. **Ordre des litres nets inversé par rapport à l'app.** `BrewBudgetSheet.tsx:47,50` prend aujourd'hui *estimation enregistrée > conditionné réel > recette* ;
   PLAN-METIER veut *conditionné réel > enregistré > attendu*. Le nouvel ordre est le bon (le réel prime), il change un comportement visible : à signaler à `uc`.
4. **`recipe.volumeL` est le volume à brasser**, pas un net (`brewBudget.ts:264`, « Volume à brasser invalide ») : le repli « net attendu de la recette » n'a
   aujourd'hui aucune source de pertes. La fonction accepte le net attendu en entrée et ne l'invente pas ; sans lui, `null`.
5. `volumePackagedL` est dérivé de `packaging` (`types/index.ts:675-678`) ; les fûts n'y ont pas de volume (`kegIds`). Aucun litre de fût n'est supposé.
6. `tests/integration/financeAssistantContext.test.ts` **échoue déjà sur HEAD** (`firebase-admin/firestore` introuvable, `functions/src/brewerFinanceContext.ts:1`) :
   problème d'environnement, sans rapport avec la voie. Les 23 autres fichiers de HEAD sont verts (273 tests) : voir § 4.

## 1. Défauts visés

| Id | Défaut (preuve) | Cause traitée |
|---|---|---|
| 3 | trois coûts d'un même litre ; `ingredientsCost` mêle stock consommé et achat (`brewBudget.ts:331-337`, `:366`) | trois notions `dejaPaye` / `aPayer` / `annee` qui somment à `totalCost` |
| 4 | aucun passage du litre au format (`TarifSheet.tsx:147`, `C:73`) | `chaineLitre.ts` : litres nets → coût du litre → coût d'un format |
| 12 (calcul) | impôt = montant manuel (`brewBudget.ts:369-379`, `BrewBudgetSheet.tsx:175`) | `beerTaxForVolume` appelé par `estimateBrewBudget` quand le °P est connu |
| 13 (assiette) | « conditionné » pris pour l'assiette (`swissBeerTax.ts:18-19`, `:43`) | l'assiette devient un paramètre nommé (litres sortis) ; le conditionné reste un repli étiqueté « indicateur » |
| 14 | barème en fonction à seuils + 25,32 répété (`swissBeerTax.ts:6,39,40`) ; réglage stocké non lu | un barème en donnée, une seule lecture ; repli nommé, plus de littéral |
| °Plato | trois copies (`alcohol.ts:14`, `brewingMath.ts:85`, `swissBeerTax.ts:32`) | une fonction exportée d'`alcohol.ts` |

## 2. Changements, fichier par fichier

### 2.1 `src/domain/alcohol.ts` (24 lignes, module sans import — le rester)
- `export const platoFromSg = (sg) => -616.868 + 1111.14 * sg - 630.272 * sg ** 2 + 135.997 * sg ** 3` (valeur brute, non arrondie, sans garde : les gardes
  restent chez les appelants, car `sgToPlato` renvoie 0 sous 1,000 et `swissBeerTax` filtre par `gravityProblem`).
- `alcoholByVolume` l'utilise (le `const plato` local disparaît). Même résultat, testé par `contreCalculAbv.test.ts` (inchangé).
- **Dépendance hors Possède** : `src/services/brewingMath.ts:85` garde sa copie tant que ce fichier n'est pas à d1. Voir DÉCISION D1.

### 2.2 `dom/swissBeerTax.ts`
- `export const BAREME_IMPOT_BIERE = [{ jusquaPlato: 10, chfParHl: 16.88 }, { jusquaPlato: 14, chfParHl: 25.32 }, { jusquaPlato: Infinity, chfParHl: 33.76 }] as const`
  (source : LIB art. 14, `BEER_TAX_SOURCE`). `beerTaxBracket(plato)` reste exportée, même signature, lit ce tableau (tests existants verts sans changement).
  `TAUX_NORMAL_PAR_HL = BAREME_IMPOT_BIERE[1].chfParHl` pour l'affichage sans brassin ; plus aucun `25.32` ni `16.88` ailleurs dans le fichier.
- **`beerTaxForVolume({ og?, plato?, litres, reductionPct? })`** → `{ plato: number|null, chfParHl: number|null, montant: number|null, montantMin: number, montantMax: number, exonere: boolean, reductionPct }`.
  - `plato` donné > `platoFromSg(og)` arrondi à 0,1 (comme aujourd'hui, `swissBeerTax.ts:32`) ; OG hors 1,020–1,130 (`gravityProblem`) ou absente → `plato` null, `montant` null,
    fourchette `montantMin` (16,88) / `montantMax` (33,76) : l'inconnu n'est jamais 0 ni 25,32.
  - `litres` ≤ 0, NaN, négatif → `montant` null.
  - Les montants sont **exacts** (litres ÷ 100 × taux × (1 − réduction)), arrondis au centime seulement à l'affichage par l'appelant (`montantCHF = round2(montant)`).
- **`beerTaxPerFormat({ plato, volumeL, reductionPct? })`** → CHF par unité, non arrondi (33 cl 0,0836 ; 75 cl 0,1899 ; fût 20 L 5,064 à 12 °P, affichés 0,08 / 0,19 / 5,06). Jamais sommé après arrondi pour retrouver l'impôt du brassin (81 × 0,08 ≠ 6,84).
- `estimateSwissBeerTax` : la boucle (`:24-36`) appelle `beerTaxForVolume` ; mêmes sommes non arrondies, mêmes arrondis finaux, mêmes champs de retour (`ratePerHl`, `fullRatePerHl`, `taxDueCHF`, `estimateLowCHF`, `estimateHighCHF`, `missingPlatoCount`, `batchesCount`, `isSmallBrewerRate`, `estimateOnly`, `warning`) : `ClientsTab.tsx:121` et 6 tests le lisent.
- Assiette (13) : nouvelle option `litresSortis?: Record<batchId, number>` ; fournie → elle remplace `volumePackagedL` pour ce brassin, et le `warning` change (« litres sortis »). Absente → comportement actuel, `warning` inchangé. `v3a` (voie uv, phase 3) la fournira ; d1 n'écrit que le paramètre.
- La réduction petit brasseur (`:14`) ne change pas : confirmée pour l'année seulement.

### 2.3 `dom/chaineLitre.ts` (neuf, fonctions pures, aucune dépendance React ni stockage)
Montants en CHF à 2 décimales en entrée et en sortie, sommés en centimes entiers (pas de dérive 0,1 + 0,2).
- `litresNets({ conditionneL?, netEnregistreL?, netAttenduL? })` → `{ litres, source: 'conditionne' | 'enregistre' | 'attendu' } | null` : premier fini et > 0 dans cet ordre.
- `troisNotions(snapshot)` → `{ dejaPaye, aPayer, annee, total } | null` (voir § 2.4) ; `total === snapshot.totalCost`.
- `coutLitre({ notions, litres })` → `{ complet: round2(total ÷ litres), liquide: round2((total − emballage − impôt) ÷ litres) } | null` ; `null` si un morceau manque (jamais 0).
- `FormatVente { id, label, volumeL, prixHT? }` (PLAN-METIER § 3.1 ; `PricingItem` n'a pas de volume, `types/index.ts:756-765`).
- `coutFormat({ litreLiquide, format, emballageUnite: number | null, impotUnite: number | null })` → `{ liquide, emballage, impot, total } | null` ; un morceau inconnu → `null` pour le total et le morceau reste `null` (affichable « à compléter »).
  `emballageUnite` est **une entrée** : aucun lien article de stock → format n'existe dans les types (`StockItem` n'a ni volume ni format). Voir DÉCISION D4.
- Rôles de tarif/marge (prix − coût) : hors voie (problème 18, uc/uv).

### 2.4 `dom/brewBudget.ts` (ajouts, rien de retiré)
- Ligne (`BrewBudgetLine`) : deux champs facultatifs `stockCost: number | null` et `purchaseCost: number | null`. Dans `estimateBrewBudget` (`:331-338`),
  `purchaseCost = money(missingInPriceUnit × perUnitCost)` et `stockCost = money(consumedCost − purchaseCost)` : leur somme est `consumedCost` au centime (testé).
- Instantané (`BrewBudgetSnapshot`) : `dejaPaye`, `aPayer`, `annee`, `resteEnStock` **facultatifs dans le type** (les snapshots déjà écrits dans Firestore, `plan.brewEstimate`, n'en ont pas ; `troisNotions` renvoie `null` plutôt que 0 pour eux).
  - `dejaPaye = Σ stockCost` ; `aPayer = Σ purchaseCost + operatingCost` ; `annee = fixedAllocation + depreciationAllocation` ; somme = `totalCost` (`:391`).
  - **Argent ≠ coût** : `aPayer` est du côté coût (HT si assujetti, frais « inclus dans le récurrent » comptés, achat non arrondi au sac). L'argent à sortir reste `cashRequiredTTC` (`:398`, inchangé). `resteEnStock = Σ purchaseTTC − Σ(purchaseCost TTC-équivalent)` n'existe que si l'écart est ≥ 0,01 et que ni TVA ni frais récurrents ne le brouillent ; sinon `null`. Dans la fixture (sans sac, TTC) l'écart est 0.
  - `ingredientsCost`, `totalCost`, `costPerL`, `purchasesTTC`, `cashRequiredTTC` gardent leur sens : `assistantContext.ts:160`, `BrewBudgetSheet.tsx:120-181`, `financeDemo.ts:32` les lisent.
- Impôt (12) : `EstimateBrewBudgetInput` reçoit `og?: string | number` (densité du brassin ou de la recette). Si `settings.costs.beerTax.enabled !== false` **et** `og` exploitable **et** litres nets > 0, l'impôt = `beerTaxForVolume` (jamais lu de `amountTTC`), TVA 0 (`:375`), `cashTreatment` 'additional'. Sinon : chemin actuel (montant manuel) **inchangé**, avec un champ `beerTaxSource: 'calcule' | 'manuel' | 'inconnu'` ajouté à l'instantané. But : `uc` retire la saisie manuelle de la feuille sans que d1 ne la casse avant (`tests/integration/brewBudgetSheet.test.tsx:166-182` attend encore « Impôt sur la bière en CHF » = 6,84).
- Litres nets : `netVolumeL = input.netVolumeL ?? recipe.volumeL` (`:380`) reste ; la fonction `litresNets` est exportée pour que `uc` l'appelle (problème 27). d1 ne change pas la signature d'`estimateBrewBudget`.
- `allocation` (`:382-388`) : inchangée.

## 3. Tests qui échouent d'abord (écrits avant le code, rouges sur HEAD)

Fixture commune (PLAN-METIER, brief passe 3) : 27 L nets ; déjà payé 22,41 ; à payer 64,26 = ingrédients 22,42 + énergie 8,00 + nettoyage 3,00 + emballage 24,00 + impôt 6,84 ; année 116,10 = 108,00 + 8,10 ; total 202,77 ; OG 1,048 (12 °P).

`tests/unit/chaineLitre.test.ts` (neuf)
| Règle | Données | Attendu |
|---|---|---|
| coût complet | 202,77 ÷ 27 | 7,51 |
| trois notions = total | 22,41 + 64,26 + 116,10 | 202,77 exact (centimes) |
| litre liquide | (202,77 − 24,00 − 6,84) ÷ 27 | 6,37 |
| litres nets, ordre | conditionné 26,6 / enregistré 27 / attendu 28 ; puis sans conditionné ; puis sans enregistré | 26,6 `conditionne` ; 27 `enregistre` ; 28 `attendu` |
| litres invalides | 0, NaN, −3, absents | `null` |
| format 33 cl tout 33 cl | liquide 6,3678, emballage 24 ÷ (27 ÷ 0,33), impôt 12 °P | 2,48 (= 7,51 × 0,33 à 0,01) |
| format 75 cl, fût 20 L | mêmes entrées | 75 cl : emballage donné ; fût : emballage `null` → total `null`, pas 0 |
| prix inconnu | `dejaPaye` ou `aPayer` `null` | coût du litre `null` |
| °Plato unique | `platoFromSg` vs `BrewingMath.sgToPlato` sur 1,030…1,100 pas 0,005, arrondi 0,1 | égaux (garde-fou tant que D1 n'est pas tranchée) |
| snapshot ancien | snapshot sans `dejaPaye` | `troisNotions` = `null` |

`tests/unit/swissBeerTax.test.ts` (existant, étendu ; les 4 tests actuels restent)
| Règle | Données | Attendu |
|---|---|---|
| 12 °P × 26,6 L | og 1,048 | 6,74 |
| 12 °P × 27 L | idem | 6,84 |
| par format à 12 °P | 33 cl, 75 cl, 20 L | 0,08 / 0,19 / 5,06 (arrondi à l'affichage ; exact 0,0836 / 0,1899 / 5,064) |
| bornes | 10,0 / 10,1 / 14,0 / 14,1 °P | 16,88 / 25,32 / 25,32 / 33,76 (déjà testé via `beerTaxBracket`, ajouté pour `beerTaxForVolume`) |
| OG absente ou hors 1,020–1,130 | 27 L | `montant` null, fourchette 4,56 – 9,12 ; jamais 25,32 |
| litres ≤ 0 / NaN | — | `montant` null |
| réduction hors année | `reductionYear` ≠ année | taux plein (déjà testé, étendu à `beerTaxForVolume`) |
| ≤ 0,5 % vol. | abv 0,5 | exonéré, 0 (cas connu, pas inconnu) |
| litres sortis | `litresSortis` {B1: 12,4} | 12,4 L taxés, pas `volumePackagedL` ; `warning` adapté |
| aucune lecture du réglage | `config.fiscal.beerTaxFullRatePerHl = 99` | résultat inchangé (le calcul n'a pas ce paramètre : test d'API, signature sans `ratePerHl` obligatoire) |
| pas de littéral | lecture du source du fichier | 0 occurrence de `25.32` hors `BAREME_IMPOT_BIERE` |

`tests/unit/brewBudget.test.ts` (existant, étendu ; aucun des tests actuels n'est supprimé)
| Règle | Attendu |
|---|---|
| `stockCost + purchaseCost = consumedCost` à 0,01 par ligne | oui |
| `dejaPaye + aPayer + annee = totalCost` | oui, sur trois cas : stock seul, achat seul, mixte arrondi au sac |
| arrondi au sac | `cashRequiredTTC` > `aPayer` ; `resteEnStock` = écart ; `totalCost` inchangé |
| impôt calculé | `og` 1,048, net 27 → 6,84, `beerTaxSource: 'calcule'`, `amountTTC` manuel ignoré |
| impôt sans OG | chemin manuel actuel, `beerTaxSource: 'manuel'` ; manuel vide → issue « montant à estimer », pas 0 |
| fixture complète | 202,77 ; `costPerL` 7,51 ; `dejaPaye` 22,41, `aPayer` 64,26, `annee` 116,10 (stock et prix construits pour retomber sur ces chiffres) |
| TVA assujetti | coût HT, `cashRequiredTTC` TTC, `aPayer` du côté HT, écart expliqué |

## 4. Appelants hors Possède (grep `src/ tests/ scripts/` entiers, rejoués sur HEAD)

Commande : `npx vitest run <24 fichiers> --reporter=dot > voies/d1/tests-head.txt` ; sortie sur HEAD : **`Test Files 1 failed | 23 passed (24)` · `Tests 273 passed (273)`**.
L'échec unique est `financeAssistantContext.test.ts` (import `firebase-admin/firestore`, environnement ; il ne charge aucun code de d1).

| Appelant | Lit | Ce qui changerait | Sort |
|---|---|---|---|
| `src/components/tabs/ClientsTab.tsx:121,16` | `calculateSwissBeerTax` → champs listés § 2.2, `BEER_TAX_SOURCE` | rien (champs et valeurs identiques) | `bDiversImpot`, `bDiversClients`, `compactClients` rejoués |
| `src/services/brewingMath.ts:85,788` | `estimateSwissBeerTax` ; copie du polynôme | copie à retirer (D1) ; `sgToPlato` garde ses gardes et son arrondi | `brewingMath`, `brewingMathStandards`, `brewingMathFuzzer`, `catalogOrganization`, `gravityBounds` |
| `src/domain/gravityBounds.ts:11`, `yeastProjection.ts:7` | `alcoholByVolume` | rien | `contreCalculAbv`, `gravityBounds`, 8 tests levure |
| `src/domain/finance/assistantContext.ts:160` | `ingredientsCost`, `purchasesTTC`, `cashRequiredTTC`, `totalCost`, `costPerL` | rien (additif) | `financeAssistantContext` : déjà rouge sur HEAD |
| `src/ui/finance/BrewBudgetSheet.tsx`, `BrewBudgetDialog.tsx` | idem + `settings.costs.beerTax` manuel | rien tant que l'impôt manuel reste sur le chemin sans `og` | `brewBudgetSheet` (l. 166-182 : 6,84 manuel), `brewBudgetDialog`, `brewCreationBudgetContinuity` |
| `src/dev/financeDemo.ts:32` | `estimateBrewBudget`, `cashRequiredTTC` | rien | `financeWorkspace`, `rxPrixInconnu` |
| `src/components/tabs/FinancesTab.tsx:123,146,178` | instantanés enregistrés | rien (champs facultatifs) | `financeWorkspace`, `financeArchiveContinuity` |
| `src/domain/finance/brewStockConsumption.ts` | `BrewBudgetSnapshot` | rien | `brewStockConsumption`, `contreCalculUnites`, `depense/enregistrement/*`, `expenseSheetMouture` |
| `storage.ts:245-247`, `types/index.ts:836` | `beerTaxFullRatePerHl` | rien | `contreCalculTauxImpotBiere` (reste vert : 25,32 = `beerTaxBracket(12)`) |
| `scripts/` | aucun import de ces modules (grep : 0) | — | — |

À l'étape 2, rejouer les mêmes 24 fichiers plus les trois fichiers de d1 ; les seuls écarts acceptés sont les nouveaux tests.

## 5. Risques

- **Données existantes** : instantanés déjà dans Firestore sans `dejaPaye`… → champs facultatifs, `troisNotions` rend `null`, aucune migration, aucune écriture. `bindings`, `prices`, `settings` du snapshot restent lus par `completeBrewStock` (`storage.ts:1021`) : forme inchangée.
- **Hors ligne** : fonctions pures, aucun appel réseau, aucune écriture. Aucun changement de schéma Firestore.
- **Arrondis** : tout en centimes entiers aux sommes ; arrondi final unique ; per-format affiché arrondi, jamais resommé. 202,77 ÷ 26,6 = 7,62 contre 7,51 pour 27 L : c'est la raison d'une seule source de litres (c3a 27 L, p2b 26,6 L).
- **Double clic / concurrence** : sans objet (calcul pur).
- **TVA** : assujetti, coût HT et argent TTC ; l'impôt bière sort sans TVA (`:375`, conservé). `resteEnStock` nul si TVA en jeu plutôt que faux.
- **Barème à jour** : 16,88 / 25,32 / 33,76 viennent de la LIB art. 14 (cités dans PLAN-METIER § 4) ; non revérifiés à la source officielle dans cette voie (pas d'accès réseau demandé).
- **Réduction petit brasseur** : appliquée seulement l'année confirmée, comme aujourd'hui.
- **Algorithme** : °Plato (polynôme de Lincoln, ASBC) et coûts complets : méthodes standard déjà dans MISSION.md « État de l'art » (coût de revient, impôt bière). Aucune rustine : une seule formule factorisée.

## 6. Hors périmètre

Écrans c3a, p2b, v3a ; Prévisions et dates de l'impôt (voie d2) ; matériel et usure (d3) ; facture et QR (f1) ; sélection article de stock → format (hors types) ;
retrait de la saisie manuelle de l'impôt dans la feuille (uc) ; marge et tarif (problèmes 18, 19) ; `storage.ts` et le réglage `beerTaxFullRatePerHl` (stocké, non lu, laissé) ;
dates de déclaration et période OFDF ; coût réel ex post d'un brassin terminé (problème 5) ; `ClientsTab.tsx` (affichage de l'impôt).

## 7. Décisions à trancher avant le code

- **D1** Ajouter `src/services/brewingMath.ts` au Possède de d1 (une ligne : `sgToPlato` appelle `platoFromSg`) ? Recommandé : oui. Sinon la copie reste et un test de parité la garde.
- **D2** Deux litres : complet (7,51, repris de c3a) et liquide (6,37, base du format). Recommandé : oui, c'est la seule lecture qui rend 7,51 **et** 2,48. À confirmer contre PLAN-METIER § 3.1 (texte à corriger).
- **D3** Litres nets : le conditionné réel prime sur l'estimation enregistrée (change `BrewBudgetSheet.tsx:47,50`). Recommandé : oui, `uc` suit.
- **D4** Emballage par format : aucun lien article → format n'existe. Recommandé : `chaineLitre` prend `emballageUnite` en entrée ; le lien (volume sur l'article « Emballage ») est une décision de modèle de données pour `uc` / `uv`.
- **D5** Impôt calculé dès que l'OG est connue, manuel conservé en repli jusqu'au passage de `uc`. Recommandé : oui (réversible).

## 8. Étape 2 : source du barème, puis chaque constat des revues (REVUE-A, REVUE-B)

**Source vérifiée (09.11).** Lu dans le PDF OFDF `BEER_TAX_SOURCE` (« Impôt sur la bière, directives à l'intention des brasseries indigènes », avril 2022, qui cite la LIB, RS 641.411) :
bière légère jusqu'à 10 °P : 16,88 CHF/hl ; normale ou spéciale de 10,1 à 14,0 °P : 25,32 ; forte dès 14,1 °P : 33,76. Les bornes et le pas de 0,1 °P du code sont ceux de la directive.
Réduction : « jusqu'à 40 % », échelonnée selon la production annuelle (moins de 55 000 hl), fixée provisoirement en début d'année et définitivement au 1er trimestre suivant : le code applique donc la réduction seulement confirmée, comme avant.
Assiette : l'impôt est dû « au moment où la bière quitte l'unité de fabrication » (problème 13 confirmé). Période : trimestre ou année civile ; déclaration sous 20 jours, paiement sous 30 jours après la fin de la période (pour la voie d2).
**Non vérifié** : le numéro « art. 14 » de la LIB et l'OIBi (Fedlex est une page dynamique, illisible depuis ce poste) ; le seuil d'exonération « 0,5 % vol. » (absent de la directive, repris du code existant et de son test).

| Constat | Sort | Raison / ce qui est fait |
|---|---|---|
| A D1-1 litre arrondi | retenu | `coutLitre` rend `complet`/`liquide` exacts et `affiche` à part ; test fût 20 L = 127,356 |
| A D1-2 somme au centime | retenu | `aPayer` = `totalCost − dejaPaye − annee` en centimes ; test assujetti 8,1 % |
| A D1-3 « à payer » = coût | retenu | doc-commentaire sur `aPayer` ; test « frais inclus dans le récurrent » : `aPayer` 64,26, caisse 56,26 |
| A D1-4 litres nets silencieux | retenu autrement | `netVolumeSource` dans l'instantané et `troisNotions` incomplet (`manque: ['litres nets']`, coût du litre null). **Pas d'`issue`** : `complete` serait faux pour tout appelant sans `netVolumeL`, et `tests/unit/financeArchiveContinuity.test.ts:154` (hors Possède) attend `complete: true`. À reprendre par `uc` (la feuille passe toujours les litres) |
| A D1-5 exonération ≤ 0,5 % | retenu | `abv?` sur `beerTaxForVolume` et sur `estimateBrewBudget` ; test NoLo : impôt 0, source `calcule`, `complete` vrai |
| A D1-6 « 12 °P » | retenu | tests en `plato: 12` ou « 11,9 °P » (OG 1,048) |
| A D1-7 base HT de l'emballage | retenu | dit dans le commentaire de `coutFormat` (même base que le coût du brassin) |
| A D1-8 arrondi du °P au dixième | retenu tel quel | conforme à la directive (« 10.1 à 14.0 ») ; `volumePackagedL` : constat 5 du plan inexact, sans effet |
| B R1 copie °Plato de `brewingMath.ts` | écarté | la consigne d'étape 2 dit de rester dans le Possède : `brewingMath.ts` n'est pas touché ; test de parité `platoFromSg` / `sgToPlato` (1,030 à 1,100). Le pilote peut ajouter le fichier (une ligne) |
| B R2 `og` pour les autres appelants | à répercuter | d2 (assistantContext) et uc (feuille) doivent passer `og`, `abv`, `beerTaxReductionPct` ; `financeDemo.ts` reste sur le chemin manuel (non modifié) |
| B R6 virgule | retenu | aucun nombre affiché dans `chaineLitre.ts` ; `controle-virgule.mjs` : `VIRGULE OK` |
| B d1-1 fixture `financeDemo` | retenu | fixture construite à la main, dates fixes ; la démo dépend de l'horloge |
| B d1-2 emballage et impôt dans les notions | retenu | `packagingCost`, `beerTaxCost` dans l'instantané, `emballage` / `impot` dans `TroisNotions` |
| B d1-3 ligne sans prix | retenu | `troisNotions` rend le connu, `complet` faux, `manque` ; `coutLitre` null (variante assumée : l'écran c3a affiche le connu « partiel », il lui faut les valeurs) |
| B d1-4 réduction | retenu | `beerTaxReductionPct?` ; absent = taux plein (prudent), testé |
| B d1-5 usure comptée une fois | retenu | d1 n'ajoute aucune usure de projet ; `usureLineaireAnnee(assets, year)` donne l'usure linéaire du registre (frigo 3 000 CHF « production » : 450, non les 900 du dégressif) ; test : 450 ÷ 1 200 × 27 = 10,13 une fois. À brancher par uc (`BrewBudgetDialog.tsx:21-25` lit encore l'AFC) |
| B d1-6 `montantPlein` | retenu | exposé par `beerTaxForVolume` |
| B d1-7 `litresSortis` | retenu | le filtre accepte un brassin avec `litresSortis > 0` ; testé |
| B d1-8 test sans objet | retenu | remplacé par le test « source sans littéral hors `BAREME_IMPOT_BIERE` » |
| B d1-9 preuve rouge | retenu | `tests-rouge.txt` écrit avant le code. Les tests de bornes via `beerTaxBracket` étaient déjà verts : ils ne sont rouges que par `beerTaxForVolume` absent |
| B d1-10, d1-11 | notés | additif, sans Firebase ; ordre des litres à répercuter chez uc |
| Décision pilote : usure une fois | retenu | ci-dessus ; le projet futur reste dans d3 |

Un test existant a changé : aucun. Un test existant a été complété (pas modifié) : `brewBudget.test.ts` et `swissBeerTax.test.ts` ont reçu un bloc `describe` ; leurs imports ont gagné les nouveaux noms.
