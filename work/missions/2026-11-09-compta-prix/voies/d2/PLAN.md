# d2 — prévision dérivée des brassins planifiés (PLAN, étape 1 : aucun code écrit)

Portée : **domaine seul**. L'écran Prévisions (`FinancesTab.tsx`) attend son choix (D123) : d2 ne le touche pas. Possède : `src/domain/finance/brewForecast.ts`
(neuf), `src/domain/finance/forecast.ts`, `tests/unit/brewForecast.test.ts` (neuf), `tests/unit/financeForecast*.test.ts`, `voies/d2/**`.
Lu au 09.11 sur HEAD 480f8d3e (phase 1 commitée : `chaineLitre.ts`, `materielFutur.ts`, `brewBudget.ts` d1).

## 1. Défauts visés (PLAN-METIER § 1, « Aujourd'hui », défauts a à d)
| Id | Défaut | Cause dans le code |
|---|---|---|
| a | rien n'apparaît sans le geste « Prévoir cette dépense » | seul `BrewBudgetDialog.tsx:42` écrit un plan `source:'brew'` ; `buildForecast` ne lit pas les brassins |
| b | tout tombe à la date de brassage, impôt compris | un plan = un montant = une date (`forecast.ts:112`) |
| c | le plan figé ne suit ni stock, ni prix, ni date | `amountCents` écrit une fois (`BrewBudgetDialog.tsx:42`) |
| d | un brassin annulé garde son plan actif | rien ne relie plan `brew` et statut du brassin (`forecast.ts:88-114`) |
| e (d3, D3-7) | le coût du litre « sans ce projet de matériel » doit se calculer sans double usure | personne n'appelait `usureAnnuelleLitre` ni `ignorerPlanId` du côté prévision |

## 2. Décisions de conception (avec leur preuve)
1. **Réemployer `estimateBrewBudget` brassin par brassin**, pas une 2e logique de réservation de stock. Raison : l'écran c3a (uc) et Prévisions doivent
   montrer le même 64,26 ; copier la réservation (`brewBudget.ts:299-331`) créerait deux vérités. Il réserve déjà les brassins planifiés plus tôt. Le
   plan métier craignait un coût N² : **mesuré d'abord** (L20), seuil 20 ms pour 10 brassins sur l'historique de `financeDemo.ts`, à froid ;
   au-delà, mémoïsation par clé (ids + `updatedAt` + nombre de transactions) dans `brewForecast.ts`, sans toucher `brewBudget.ts` (d1).
2. **Rien n'est écrit** (P1). Fonction pure, aucune horloge (`asOf` passé), aucun Firestore, aucun hors-ligne à gérer.
3. **Entrées du brasseur gardées** : le dernier instantané enregistré du brassin (plans portant `brewEstimate.batchId`, le plus récent par
   `createdAt`) fournit `bindings`, `prices`, `cashTreatments`, `settings`, `netVolumeL`. Les montants, eux, sont recalculés à chaque lecture.
4. **Recette = instantané du brassin** (`batch.recipeSnapshot`, `storage.ts:993-996`), jamais la recette vivante : `estimateBrewBudget` reçoit
   `recipeForBatch`-équivalent (le `Recipe` tiré de `recipeSnapshot`, même construction que `brewBudget.ts:187-191`, copiée en 3 lignes car non exportée).
5. **Partiel = ce qui manque vraiment**, pas `snapshot.complete` : `complete` est faux pour des raisons étrangères à l'argent (charges annuelles, volume
   annuel, « historique du stock à confirmer » d'un autre brassin, `brewBudget.ts:320`). Un item est « partiel » si : une ligne a `purchaseTTC === null` ;
   un frais activé n'a pas de montant (énergie, nettoyage, emballage) ; `beerTaxSource === 'inconnu'`. Il porte `partial: string[]` (« houblon », « levure »,
   « emballage »). Le montant affiché est le connu, jamais 0 inventé ; chaque manque va aussi dans `warnings`.
6. **Découpe en quatre sorties** par brassin, la somme est **exacte** (le reste fait foi) : `achats = purchasesTTC` ; `emballage` et `impôt` pris sur leur
   réglage / `beerTaxCost` ; `énergie + nettoyage = operatingCashTTC − emballage − impôt` (au centime) ; total = `cashRequiredTTC`. Un frais « inclus dans
   le récurrent » vaut 0 en caisse (déjà le cas) : aucun item.
7. **Dates** (réglages en paramètre, valeurs par défaut exportées, P5 ; pas de stockage : `types.ts` n'est pas dans mon Possède) :
   achats = J − 7 j ; énergie/nettoyage = J ; conditionnement estimé C = J + 21 j (le brassin planifié n'a pas de date de conditionnement) ;
   emballage = C − 7 j ; impôt = fin du trimestre qui contient C + 30 j. Période : d1 a lu « trimestre ou année » à la directive OFDF
   (`BEER_TAX_SOURCE`), je prends le trimestre (le plus tôt, prudent) ; chaque item daté ainsi dit « date estimée ». Une date passée est ramenée à `asOf`
   (comme `forecast.ts:112`), avec un avertissement si J lui-même est passé (« brassin planifié en retard »). Date de brassage illisible → aucun item,
   avertissement, jamais une date inventée. Calendrier par UTC midi, sans `Date.now()`.
8. **Statuts** : `planifie` sans brassage commencé (`hasBrewStarted`, `batchSchedule`) → quatre sorties. Brassin commencé non conditionné
   (`fermentation`, `garde`) → seulement emballage et impôt (achats et frais sont passés : factures ou stock). `conditionne`, `termine`, `annule` →
   aucun item dérivé. L'impôt d'un brassin conditionné reste au suivi annuel de Clients (hors périmètre, voir § 8).
9. **Doublon** : tout plan `source:'brew'` actif dont le `batchId` (plan, ou `brewEstimate.batchId`) est celui d'un brassin qui produit des items dérivés
   est **sauté** dans `buildForecast` (il reste lisible, jamais compté ; un avertissement ne se justifie pas, c'est le cas normal). Un plan `brew` dont le
   brassin est `annule` est aussi sauté (défaut d). Un plan `brew` dont le brassin est absent de `batches` reste compté (inconnu ≠ supprimé). Les plans de
   recette sans `batchId` (`matchingRecipeBrewPlans`) restent comptés, inchangés.
10. **Factures rattachées au brassin** (`finance.batchId`) : **écart assumé au plan métier**. Le plan métier les soustrait de l'item. Or une facture
    d'achat saisie met le stock à jour (`purchaseEntry.ts:732`, `adjustNumber … currentStock`) : le besoin d'achat a déjà baissé, soustraire la facture
    compterait deux fois ; sa part impayée reste d'ailleurs son propre item `invoice`. Donc **l'item achats ne se réduit jamais d'une facture**. Seule
    exception : une facture dont toutes les lignes sont `packaging` et portant `batchId` réduit l'item emballage (le budget d'emballage est un montant saisi,
    pas du stock), montant `transactionAmount` ; cas mixte (`planInvoiceAllocation(...).issue`) ignoré avec avertissement. Question au pilote : Q3.
11. **Usure du litre, une seule fois** (décision pilote, ETAPE2) : le `BrassinPrevu.coutLitre` utilise `usureAnnuelleLitre` (d3) avec
    `moisReference` = mois du brassage ; le total complet devient `settings.annualDepreciationCHF` ; jamais `depreciationForYear` (AFC dégressif).
    `ignorerPlanId` est passé tel quel (coût « hors ce projet », pour `mesurerAchat`, D3-7). Usure incomplète (`complet:false`) → `annualDepreciationCHF`
    absent, donc coût du litre `null` (via `troisNotions`), jamais un minimum présenté comme total. Charges fixes : `annualBrewFixedCosts(plans)`.
12. **Matériel futur** : aucun nouveau flux ; les projets `equipment` entrent déjà dans `buildForecast` (`forecast.ts:90-91,113`). d2 ne change que leur
    effet sur le litre (point 11) et rejoue `tests/unit/materielFutur.test.ts` (test 16 sur le vrai `buildForecast`, REVUE-B R3) à chaque changement.

## 3. Changements, fichier par fichier
### `src/domain/finance/brewForecast.ts` (neuf)
- `export const REGLAGES_BREW_FORECAST_DEFAUT = { delaiAchatJours: 7, delaiConditionnementJours: 21, delaiEmballageJours: 7, delaiPaiementImpotJours: 30, periodeImpot: 'trimestre' as const }`.
- `export interface BrassinPrevu { batchId; titre; dateBrassage; items: ForecastItem[]; coutLitre: CoutLitre | null; partiel: string[]; origines: LigneOrigine[] }`.
- `export function estimerBrassinsPlanifies(input: { batches; stockItems; transactions; plans; profile; assets?; asOf; fin?; reglages?; ignorerPlanId? }): { brassins: BrassinPrevu[]; items: ForecastItem[]; warnings: string[]; remplaces: Set<string> }` — `remplaces` = `batchId` dont les plans `brew` actifs sont à sauter.
  Parcours des brassins dans l'ordre (date, id) ; par brassin : instantané enregistré → `estimateBrewBudget({ recipe, batches, stockItems, transactions, brewDate, batchId, … savedEstimates })` → découpe (points 5 à 8) → items.
- Helpers internes : `ajouterJours(iso, n)`, `finDeTrimestre(iso)`, `decouper(snapshot)`, `partielDe(snapshot)`. Origine par ligne : `price.source` + note (`invoice` + n° de facture dans `price.note`, `manual`), « du stock » (`stockCost > 0`), « recette » (quantité) : `LigneOrigine { label; amountCents; origine }`.
### `src/domain/finance/forecast.ts`
- `ForecastItem` : deux champs **facultatifs** `partial?: string[]` et `lines?: Array<{ label: string; amountCents: number; origin: string }>` (additif).
- `buildForecast` : entrées facultatives `batches?: Batch[]`, `stockItems?: StockItem[]`, `assets?: FinancialAsset[]`, `brewReglages?`, `ignoreUpgradePlanId?`. Sans `batches` : comportement strictement actuel. Avec : appel à `estimerBrassinsPlanifies`, ajout des items (filtrés `date <= end`), saut des plans de `remplaces` et des plans `brew` d'un brassin annulé (boucle `forecast.ts:88`), `warnings` fusionnés. Import type-only de `ForecastItem` côté `brewForecast.ts` (pas de cycle de valeur).
- Les mois, soldes, `committedCents` (`source !== 'trend'`) se recalculent seuls : aucun autre changement.

## 4. Tests qui échouent d'abord (`tests/unit/brewForecast.test.ts`, fixtures dérivées de `brewBudget.test.ts:223-232` : Pale Ale, 27 L nets, OG 1.048, `asOf` 2026-08-20, brassage 15.09.2026)
Rouge attendu avant le code : `brewForecast` introuvable ; les deux tests de `buildForecast` à signature étendue échouent (items absents).
| # | Test | Attendu |
|---|---|---|
| 1 | un planifié, fixture du brief | achats 22,42 le 2026-09-08 ; frais 11,00 le 2026-09-15 ; emballage 24,00 le 2026-09-29 ; impôt 6,84 le 2027-01-30 ; **somme = 64,26 = `cashRequiredTTC`** ; avant le brassage 33,42 |
| 2 | brassin annulé / terminé / conditionné | aucun item ; son plan `brew` actif n'est plus compté |
| 3 | date déplacée (`plannedBrewDate`) | tous les items suivent (J, J−7, C−7, trimestre) |
| 4 | deux brassins, même malt, stock pour un seul | le plus tôt réserve le stock ; le 2e a le manque ; l'ordre ne dépend pas de l'ordre du tableau |
| 5 | recette modifiée après la planification | sans effet (instantané) ; stock modifié → montants changent |
| 6 | prix du houblon inconnu | item achats = connu seulement, `partial` contient « houblon », `warnings` aussi ; jamais 0 ; la somme ne ment pas |
| 7 | frais jamais saisis (pas d'instantané) | items frais absents, `partial` : énergie, nettoyage, emballage |
| 8 | **doublon** : plan `brew` actif même `batchId` + dérivé | un seul compte (le dérivé) ; plan intact dans `plans` ; plan de recette sans `batchId` : compté |
| 9 | brassin commencé (`fermentation`, `plannedBrewDate` passée) | pas d'achats ni de frais ; emballage et impôt gardés ; plan `brew` sauté |
| 10 | facture `batchId` d'ingrédients | item achats **inchangé** (point 10) ; facture d'emballage : item emballage réduit, jamais négatif ; facture mixte ignorée + avertissement |
| 11 | date de brassage passée / illisible | passée : items à `asOf` + avertissement ; illisible : aucun item + avertissement |
| 12 | impôt : date | C = 2026-10-06 → 2027-01-30 ; C = 2026-12-31 → 2027-01-30 ; C = 2027-01-01 → 2027-04-30 (bornes de trimestre) |
| 13 | usure une seule fois | projet frigo 3 000 CHF / 5 ans seul : litre = 7,51 + 0,50 ; avec facture + actif : toujours 0,50 ; `ignorerPlanId` : 7,51 ; durée inconnue : coût du litre `null` |
| 14 | `buildForecast` sans `batches` | résultat strictement égal à avant (`toEqual` sur une entrée de `financeForecast.test.ts`) ; ajouter ce test dans `financeForecast*.test.ts` |
| 15 | `buildForecast` avec `batches` | les items dérivés sont dans `months` (dépenses du mois, `committedCents`), solde cumulé = solde sans brassin − 64,26 |
| 16 | pureté | entrées non modifiées (`structuredClone` avant/après), même résultat deux fois |
| 17 | temps (L20) | 10 brassins planifiés + historique `financeDemo` : durée mesurée à froid, notée dans RESULTAT.md ; garde large (< 500 ms) contre l'explosion seulement |
Arithmétique vérifiée à la main : 22,42 + 8 + 3 + 24 + 6,84 = 64,26 ; 8 + 3 = 11 ; `operatingCashTTC − 24 − 6,84 = 11`. 15.09.2026 + 21 = 06.10.2026 ;
06.10 − 7 = 29.09 ; T4 finit le 31.12.2026, + 30 j = 30.01.2027 ; 31.12.2026 est déjà T4 (fin 31.12) → 30.01.2027 ; 01.01.2027 est T1, fin 31.03, +30 = 30.04.2027.

## 5. Appelants hors Possède (grep `src/` `tests/` `scripts/` entiers, rejoués sur HEAD)
- `buildForecast` : `FinancesTab.tsx:92-93`, `assistantContext.ts:95`, `materielFutur.ts` (commentaire seulement), tests `finance`, `financeForecast`, `forecastHorizon`, `equipmentUpgrades`, `materielFutur` (test 16), `financeArchiveContinuity`, `depense/onglets/ta3`, `ta4`, `ta6`, `depense/ecran/libelles`. `scripts/` : aucun appel (`inventaire-ecrans.mjs`, `check-ux-mobile-poc.mjs` citent le mot, ne l'exécutent pas). Signature **additive** : aucun appelant à modifier.
- Lecteurs de `ForecastItem` : `FinancesTab.tsx:95,141-146` (libellé par `source`), `assistantContext.ts:101,178` (champs nommés). Champs ajoutés facultatifs, ignorés par eux.
- **Rejeu sur HEAD** (`voies/d2/tests-head.txt`, 199 fichiers : les 11 fichiers ci-dessus + tout `tests/unit/depense` + `financeAssistantContext`) : `Test Files 6 failed | 192 passed | 1 skipped (199)` · `Tests 2630 passed`. Les 6 échecs sont des fichiers qui ne se chargent pas (dont `financeAssistantContext`, `firebase-admin/firestore` absent de ce poste, déjà noté par d1 et d3) : **à rejouer sur le poste principal**. Après le code : même liste, mêmes 6 échecs, 0 test en moins.
- Aucune fixture ne change : rien d'existant n'utilise `batches` dans `buildForecast`.

## 6. Risques
- **Données existantes** : aucun champ requis, aucune écriture, aucune migration. Un instantané ancien (sans `dejaPaye` etc.) suffit : j'utilise `purchasesTTC`, `operatingCashTTC`, `settings`.
- **Hors ligne / Firestore / double clic** : sans objet (aucune écriture). Calcul sur le cache déjà chargé.
- **Arrondis** : centimes entiers (`Math.round(x * 100)` une fois à l'entrée de chaque item) ; la somme des items égale `cashRequiredTTC` au centime par construction (reste). Impôt en CHF exacts de `beerTaxForVolume`, arrondi par `estimateBrewBudget` (`money`).
- **TVA** : assujetti → `cashRequiredTTC` reste TTC (argent sorti) ; l'usure et le coût du litre suivent `estimateBrewBudget(isTvaRegistered)`. Prévisions parle d'argent : TTC.
- **Stock réservé** : `completeBrewStock` relit le dernier plan du brassin pour ses `bindings` (`storage.ts:1021`) : je ne modifie aucun plan, ce lien reste intact. Le plan « Prévoir » du geste c3a (uc, B2 a : « fige les entrées ») garde ce rôle d'instantané et n'est plus compté.
- **Coût** : voir décision 1 ; mesure avant branchement, repli par mémoïsation.
- **Brassin sans OG** : impôt par le chemin manuel (`brewBudget.ts:420`) ou inconnu → item impôt absent + `partial`. d1 a dit que `financeDemo.ts` et l'assistant restent sur le manuel ; je passe `og: batch.og` (réel) sinon `recipeSnapshot.og` : à confirmer au code qu'un champ existe (sinon `partial: impôt`).

## 7. Questions au pilote (avant le code)
- **Q1 branchement** : `FinancesTab.tsx` (2 appels, libellé « Brassin prévu · estimé auto », l. 146) et `assistantContext.ts:95` (1 appel) sont hors Possède ; tant qu'ils ne passent pas `batches`, rien n'apparaît à l'écran (L11 : fini = branché). Changer Prévisions touche un écran dont le choix est ouvert (D123). Recommandé : d2 livre le domaine + `buildForecast` étendu ; le pilote ajoute le branchement de `assistantContext` (sans écran) à une voie, celui de `FinancesTab` après le choix de Prévisions.
- **Q2 frais par défaut** : un brassin planifié jamais enregistré n'a ni énergie, ni nettoyage, ni emballage. Option (a) item partiel honnête (recommandé pour d2) ; (b) reprendre les réglages du dernier instantané de la brasserie, marqués « repris de … ». (b) donne un chiffre utile mais c'est un goût du brasseur (une valeur reprise à sa place) : à lui montrer, pas à trancher ici.
- **Q3 factures `batchId`** : écart assumé au plan métier (décision 10). Confirmer.
- **Q4 brassins commencés** : emballage + impôt inclus (décision 8) alors que le contrat parle de « brassins planifiés ». Recommandé : oui (PLAN-METIER § 1 « Mise à jour »).
- **Q5 période d'impôt** : trimestre par défaut (d1 : « trimestre ou année », selon le régime). Réglage en paramètre seulement ; le stockage demande `types.ts` / Réglages.

## 8. Hors périmètre
Écran Prévisions et son libellé ; branchement `FinancesTab`/`assistantContext` (Q1) ; stockage des réglages de délais ; ventes attendues et meilleur mois du frigo (B4) ; impôt d'un brassin conditionné (assiette = litres sortis, v3a) ; signalement des doublons de numéros (REVUE-B R4, uv) ; saisie durée/catégorie dans `UpgradeSheet` (d3 liste) ; `BrewBudgetDialog.tsx` et le geste « fige » (uc) ; troisième copie du °Plato (d1) ; aucun appel Gemini, aucun commit, aucun `git stash`, aucun IBAN.

## 9. Étape 2 : sort de chaque constat des revues P2 (A = métier, B = code)
Écarts au plan d'origine : décision 10 (factures `batchId`) retirée ; items à 0 émis seulement s'ils sont « partiels » ; test 17 remplacé (voir D2-6 B) ; la découpe en quatre sorties est inchangée.
| Constat | Sort | Raison / preuve |
|---|---|---|
| A D2-1 (B) `og`, alcool, réduction | **retenu, corrigé** | `og = batch.og` sinon `recipeSnapshot.ogTarget` (dit « estimé » dans l'origine de la ligne), `abv = batch.abv`, réduction en entrée (`reductionImpot: { pct, annee }`, seulement si `annee` = année du brassage, même règle que c3a). Tests : fixture = 64,26 ; 33,42 / 30,84 ; exonéré 0,4 % vol. ; réduction 5,47 (20 %) / plein une autre année |
| A D2-2 / B D2-3 : litres nets | **retenu, corrigé** | net = conditionné réel > net d'un instantané `netVolumeSource === 'saisi'` ; sinon aucune densité passée : item impôt partiel `impôt (litres nets)`, jamais 7,59 ni 7,60. Tests : sans instantané, instantané ancien refusé, 26,6 L donne 6,74 |
| A D2-3 usure registre vide | **retenu, corrigé** | aucun actif ni projet, ou registre non fourni, ou durée inconnue : `annualDepreciationCHF` absent, coût du litre `null`. Quatre tests |
| A D2-4 impôt du conditionné | **retenu autrement** | pas d'item (aucun suivi de paiement par brassin : un item resterait à vie) ; un avertissement nomme le brassin et l'échéance estimée tant qu'elle n'est pas passée. **À décider par le pilote** (voir RESULTAT) |
| A D2-5 / B D2-2 : deux découpes | **retenu** | `fraisParPoste` n'existe pas sur HEAD (voie uc en cours) : test de croisement, somme des items = `cashRequiredTTC` de l'instantané, sur 5 cas (base, assujetti TVA, énergie incluse dans le récurrent, impôt saisi inclus, emballage désactivé). À rejouer quand uc livre `fraisParPoste` |
| A D2-6 plans de brassins conditionnés/terminés | **retenu** | sautés comme les annulés (`remplaces`). Tests annulé, terminé, conditionné |
| A D2-7 / B D2-5 écrivains de `finance.batchId` | **retenu** | grep `src/` : aucun écrivain (lecture seule). Règle « facture rattachée » supprimée du plan et du code : hors périmètre |
| A D2-8 dates | **retenu** | impôt = fin du trimestre du conditionnement, puis + 30 j ; brassin commencé : jour réellement brassé (`batchDisplayDate`, `brewDate`) ; « date estimée » dans le libellé de l'emballage et de l'impôt |
| A D2-9 / T1 Q1 à Q5 | **défauts prudents** | Q1 non branché ; Q2 partiel honnête ; Q3 caduc ; Q4 brassins commencés inclus (emballage + impôt) ; Q5 trimestre, paramètre |
| B P-1 branchement | **signalé** | `FinancesTab`/`assistantContext`/`financeDemo` hors Possède : domaine livré, non branché (L11), voir RESULTAT |
| B P-2 `brewBudget.ts` à uc | **sans effet** | d2 ne modifie pas `brewBudget.ts` ; `brewBudget.test.ts` passe avec la version de uc présente dans le worktree (`tests-appelants.txt`) |
| B D2-1 pureté | **retenu** | `now = asOf à midi UTC` ; `id`/`createdAt` de l'instantané jamais exposés ; test « deux appels identiques, entrées intactes » |
| B D2-4 prêt à coder | **retenu** | ids `brew:<batchId>:achats\|frais\|emballage\|impot` ; `category: 'brassage'` ; pas de `planId`, `batchId` porté ; dates par `brewBudgetDateKey(batchDisplayDate(b))` ; `recipeForBatch` copiée avec ses deux branches ; item à 0 non émis sauf partiel ; un seul nom `origin` |
| B D2-6 performance | **retenu, mesuré** | 10 brassins, 2 000 factures, 150 articles, à froid : 437 ms avant optimisation. Optimisation exacte : seules les pièces portant une ligne d'un article du brassin sont passées à `estimateBrewBudget` (index par article, ordre d'origine gardé ; test d'équivalence avec le grand livre entier). Après : 11,6 ms (60 factures des articles du brassin), 54 ms (300 : cas lourd). Seuil 20 ms tenu sur le cas réaliste ; le cas lourd a une garde de 250 ms |
| B D2-7 code mort | **retenu** | dit : `BrassinPrevu.coutLitre`, `ignorerPlanId` sans consommateur (domaine livré, non branché) |
| B D2-8 id pour `onOpenForecast` | **retenu** | les items dérivés portent `batchId` et l'id `brew:<batchId>:…` ; uc reçoit l'id du brassin |
| B D2-9 date du brassage | **retenu** | la date du brassin fait foi ; la date écrite dans un plan « Prévoir » n'est plus lue pour un brassin dérivé |
| B D2-10 importeurs de `forecast.ts` | **noté** | `purchaseEntry.ts:11`, `ExpenseSheet.tsx:22`, `TransactionDetails.tsx:12` importent `planOccurrences` : `forecast.ts` tire désormais `brewForecast` → `brewBudget` dans leurs chemins ; signatures inchangées, tests verts. Le paquet serveur (`scripts/build-brewer-tools.mjs`) bundle `assistantContext.ts` : à vérifier au build du poste principal |
| B D2-11 virgule | **retenu** | aucun montant dans les avertissements ; `controle-virgule` : aucune ligne de mes fichiers |
| B D2-12 brassin en garde depuis longtemps | **noté** | emballage et impôt ramenés à `asOf` tant que le brassin n'est pas conditionné : bruit assumé, dit dans RESULTAT |
