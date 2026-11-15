# Plan métier — compta et prix (voie m, 09.11)

Portée : le métier sous les trois écrans choisis (c3a, v3a, p2b) et les deux nouveautés du brief passe 3 (brassin futur, matériel
futur). Un plan, pas du code. Lu dans le worktree au 09.11 ; aucun IBAN recopié. `dom/` = `src/domain/finance/`,
`fin/` = `src/ui/finance/`, `C` = `src/components/tabs/ClientsTab.tsx`.

Référence (fixture, brief passe 3) : Pale Ale de septembre, 27 L nets ; déjà payé 22,41 + à payer 64,26 (ingrédients 22,42, énergie 8,00, nettoyage 3,00, emballage 24,00, impôt 6,84)
+ année 116,10 (charges fixes 108,00, usure 8,10) = 202,77 ; 202,77 ÷ 27 = 7,51 CHF/L (sommes vérifiées).

## 1. Brassin futur → prévision automatique

### Aujourd'hui
- Un brassin planifié naît à un seul endroit : `StorageService.planRecipeBatch` (`src/services/storage.ts:987-1000`), statut
  `planifie`, `plannedBrewDate`, `recipeSnapshot` figé (`storage.ts:993-996`). Appelé par + › « Préparer un brassin »
  (`src/components/QuickActionModal.tsx:620`). La date change par `saveBatchSchedule` (`src/ui/BatchDetailSheet.tsx:192`) ;
  l'abandon passe le statut à `annule` (`BatchDetailSheet.tsx:132`) ; `deleteBatch` supprime (`storage.ts:1048`).
- La recette d'un brassin planifié est un instantané : modifier la recette ne change pas le brassin (aucune écriture de
  `recipeSnapshot` hors `planRecipeBatch`). La prévision doit suivre l'instantané du brassin, pas la recette vivante.
- Le calcul existe : `estimateBrewBudget` (`dom/brewBudget.ts:256-402`) réserve déjà le stock des brassins planifiés plus tôt
  (`brewBudget.ts:283-302`), prend le dernier prix de facture (`latestBrewPrices`, `:200-212`) et la moyenne pondérée du stock
  (`:218-254`), rend `purchasesTTC`, `operatingCashTTC`, `cashRequiredTTC` (`:398`), `costPerL` (`:399`), `complete`, `issues`.
- La prévision est manuelle : bouton « Prévoir cette dépense » grisé tant que `complete` est faux (`fin/BrewBudgetSheet.tsx:114`),
  puis `FinanceService.savePlan` d'un plan `source:'brew'`, montant = `cashRequiredTTC`, date = date de brassage, un seul item
  (`fin/BrewBudgetDialog.tsx:34-42`) ; les anciens plans du même brassin passent `completed` (`:40-41`). `buildForecast` lit
  ce plan comme une sortie ponctuelle (`dom/forecast.ts:88-114`, `source:'brew'` à `:113`).
- Défauts : (a) rien sans le geste ; (b) tout à la date de brassage, impôt compris (montant manuel, `brewBudget.ts:369-379`,
  `BrewBudgetSheet.tsx:175`) ; (c) un plan figé ne suit ni stock, ni prix, ni date ; (d) un brassin annulé garde son plan actif.

### Cible : une prévision **dérivée**, recalculée à la lecture, jamais écrite
Décision proposée (pilote) : ne pas créer de plans automatiques dans Firestore. Une fonction pure calcule, à chaque lecture,
les sorties de tous les brassins `planifie` à date valide, dans l'ordre des dates.
- Nouveau `dom/brewForecast.ts` : `estimatePlannedBrews({ batches, stockItems, transactions, plans, settings, asOf })` parcourt
  les brassins planifiés une seule fois, en partageant la carte de stock disponible (au lieu d'appeler `estimateBrewBudget` N fois,
  qui refait la réservation des précédents : coût N²). Rend, par brassin, ses lignes et ses `ForecastItem` (`source:'brew'`).
- Entrées du brasseur conservées : le dernier instantané enregistré du brassin (plans `brewEstimate` de même `batchId`) fournit
  `bindings`, `prices`, `cashTreatments`, `settings` (frais saisis) ; le calcul, lui, est refait. Ses saisies survivent, les
  montants suivent le stock et les prix.
- `buildForecast` reçoit `batches` et `stockItems` (nouvelle entrée, optionnelle pour ne pas casser les appelants : FinancesTab,
  `dom/assistantContext.ts`) et ajoute ces items. Tout appelant se trouve par `grep buildForecast` avant de changer la signature (L17).
- Inconnu jamais 0 : une ligne sans prix sort du montant et l'item porte « partiel · à compléter : houblon, levure ».
  Le montant affiché est le connu, l'avertissement dit ce qui manque (même règle que `brewBudget.ts:321`).
- Origine lisible (brief : « d'où vient chaque montant ») : chaque ligne garde `price.source` (`invoice` + n° de facture,
  `manual`), « du stock » (moyenne pondérée), « recette » (quantité). Le libellé de Prévisions (`FinancesTab.tsx:146`) devient
  « Brassin prévu · estimé auto ».

### Dates des sorties
| Sortie | Date proposée | Source de la date |
|---|---|---|
| Ingrédients à acheter (manque au stock, arrondi au sac) | date de brassage − délai d'achat (défaut 7 j, réglage) | `plannedBrewDate` |
| Énergie, nettoyage | date de brassage | idem |
| Emballage (bouteilles, capsules, étiquettes) | date de conditionnement estimée − 7 j | voir ci-dessous |
| Impôt sur la bière | fin de la période de déclaration qui suit le conditionnement + 30 j de paiement | OFDF, à vérifier |
- Date de conditionnement d'un brassin planifié : aucun champ (le brassin n'a que `bottlingDate` réel). Proposé : brassage +
  durée par défaut (réglage, 21 j, marqué « estimé ») ; plus tard, la durée tirée du plan de fermentation de la recette.
- Impôt : l'app dit « déclarer sous 20 j, payer sous 30 » (`C:279-315`, pli « Comprendre »). La période (mois ou trimestre)
  n'est écrite nulle part : à lire dans `BEER_TAX_SOURCE` (`dom/swissBeerTax.ts:5`) avant de coder ; tant qu'elle n'est pas
  confirmée, l'item porte « date estimée ». Assiette : le conditionnement reste un indicateur (problème 13) ; l'impôt dû
  vient des sorties (voir v3a : la vente rattachée au brassin donne les litres sortis).
- Conséquence sur c3a : « À payer avant le brassage 64,26 » compte l'impôt 6,84 et l'emballage 24,00, payés plus tard ; avant le brassage : 33,42 (B1).

### Mise à jour, annulation
- Recette modifiée : sans effet sur un brassin planifié (instantané) ; stock, prix, date, volume : recalcul à la lecture.
- Brassin `annule` ou supprimé : il sort de la liste des planifiés, ses items disparaissent. Ses plans enregistrés restent (historique).
- Brassin commencé (statut ≠ `planifie`) : les achats deviennent des factures ; les items d'achat disparaissent ; l'impôt reste
  jusqu'au conditionnement puis devient l'item d'impôt du brassin conditionné, jusqu'à son paiement.
- Factures déjà reçues pour ce brassin : une dépense portant `finance.batchId` (déjà exclue de la tendance,
  `forecast.ts:54-56`) diminue le reste de l'item (même règle que `planInvoiceAllocation`, `forecast.ts:101-109`).

### Risques
- **Doublons** : un plan `source:'brew'` actif du même `batchId` (ancien « Prévoir ») + l'item dérivé. Règle : pour un brassin
  planifié, l'item dérivé remplace le plan actif ; le plan reste lisible (« ancienne estimation »), jamais compté. Plans de
  recette sans `batchId` (`matchingRecipeBrewPlans`, `brewBudget.ts:165-175`) : inchangés. Test dédié.
- **Hors ligne, Firestore** : aucune écriture → ni file d'attente (`src/services/firestoreRepo.ts:80-90`), ni conflit entre
  appareils, ni coût d'écriture. Le calcul lit le cache local déjà chargé.
- **Temps de calcul** : à mesurer avant de brancher (L20) : `buildForecast` avec 10 brassins planifiés et l'historique de
  `src/dev/financeDemo.ts`, à froid. Seuil proposé 20 ms sur ce poste ; sinon mémoïsation par clé (ids + `updatedAt`).
- **Stock réservé** : `completeBrewStock` relit le dernier plan du brassin pour ses `bindings` (`storage.ts:1021`) ; garder
  l'enregistrement de l'instantané (geste c3a) pour ne pas perdre ce lien.

## 2. Achat de matériel futur (frigo 3 000 CHF)

### Ce qui existe
- Projet de matériel = plan `source:'equipment'` (`dom/upgrades.ts:36`), entre en prévision s'il a budget et date
  (`upgradeReadiness`, `:47-52`) ; détails `EquipmentUpgrade` sans catégorie ni durée (`dom/types.ts:114-127`).
- `simulateBreweryInvestment` (`dom/investmentScenario.ts:13-29`) : coût initial, retour, trésorerie après achat comptant
  (`:23`) ; refuse toute vente supposée (`:14`) ; servi seulement à l'assistant IA (problème 16).
- Barème AFC (`dom/annual.ts:7-14`, source `:6`) : machines de production 30 % dégressif / 15 % linéaire ; `depreciationForYear`
  (`:36`) sur un `FinancialAsset` (`dom/types.ts:129-150`).
- Le coût du litre prend l'amortissement fiscal de l'année des actifs enregistrés (`fin/BrewBudgetDialog.tsx:21-25`)
  réparti au volume annuel (`brewBudget.ts:382-390`, `profile.annualProductionL`, `dom/types.ts:163`).

### Cible : `dom/materielFutur.ts`, fonction pure `mesurerAchat`
Entrées : prix TTC (centimes), mois d'achat, durée d'usage (ans) ou catégorie AFC, prévision (`FinanceForecast`), production
annuelle, format de référence (prix, coût). Sorties, chacune `null` si une entrée manque :
1. **Trésorerie** : solde du mois d'achat et **point bas** après (mois, montant) = minimum du solde cumulé de `buildForecast`
   avec l'achat ajouté comme item `equipment`. Réutiliser le calcul de `simulateBreweryInvestment` pour le coût initial
   (achat + livraison + installation) ; ne pas dupliquer.
2. **Usure par an** : linéaire, prix ÷ durée (3 000 ÷ 5 = 600 CHF/an, « exemple »).
3. **Part dans le litre** : usure ÷ production annuelle (600 ÷ 1 200 = 0,50 → 7,51 + 0,50 = 8,01 CHF/L), appliquée aux
   brassins datés après la mise en service (le dérivé du § 1 l'inclut dans `annualDepreciationCHF`).
4. **Ventes pour le payer** : sur la **marge**, pas sur le prix. 33 cl : coût 7,51 × 0,33 = 2,48 ; marge 5,00 − 2,48 = 2,52 ;
   3 000 ÷ 2,52 = 1 191 bouteilles (≈ 393 L). Diviser par le prix (600 bouteilles) ferait croire qu'on le paie trois fois
   plus vite. Voir décision P3.
5. **Meilleur mois** : pour chaque mois de l'horizon, le point bas après achat ; proposer le premier mois où il reste ≥ seuil
   (réglage, défaut 0). Sans ventes prévues dans la prévision (problème 15), le solde ne fait que baisser : le meilleur mois
   n'a de sens qu'avec des entrées prévues (voir question B4).

### Données manquantes
- `EquipmentUpgrade` : `depreciationCategory`, `usefulLifeYears`, `inServiceMonth`. À l'achat (« Noter l'achat » → dépense
  matériel), l'`AssetSheet` reprend la catégorie (un seul classement, pas deux saisies).
- Usure économique (litre, linéaire, durée choisie) ≠ amortissement fiscal (Annuel, AFC, dégressif possible). Le frigo à 5 ans
  (20 %) n'est pas un taux AFC « production » (15 % linéaire = 6,7 ans, 450 CHF/an ; 30 % dégressif = 900 la 1re année).
  Décision P2.

## 3. Port des trois écrans choisis

Registre : `work/refonte-frontend/v4/choix/ecrans-app.json:79-105` (impot-biere p2b, cout-brassin-litre c3a, facture-vente v3a).
Règle n° 1 : chaque maquette (`etat.html`, captures ouvertes : `p2/c3a/c3a-page.png`, `p2/v3a/v3a-page.png`,
`v0/p2b/p2b-page.png`) est la base, reprise telle quelle ; inventaire de chaque élément et état avant le port (L03).

### 3.1 Une seule chaîne litre → format (nouveau `dom/chaineLitre.ts`)
- **Litres nets** : `volumePackagedL` réel > net enregistré > net attendu de la recette. Une seule fonction. Les maquettes
  divergent (c3a 27 L nets, p2b 26,6 L conditionnés : 6,84 contre 6,74 d'impôt) : la même source pour les deux écrans.
- **Coût du litre liquide** = (déjà payé + à payer hors emballage + année) ÷ litres nets ; **coût d'un format** = litre ×
  volume du format + emballage du format (articles de stock « Emballage », `src/types/index.ts:49`) + impôt du format.
  c3a affiche « 33 cl comprise » : brassin tout en 33 cl ; avec un mélange 33/75/fût, l'emballage se répartit par format.
- **Formats** : `PricingItem` n'a ni volume ni format (`src/types/index.ts:756-765`) ; `BatchPackaging` compte 33 cl,
  75 cl, fûts (`:640-644`). Ajouter `FormatVente { id, label, volumeL, prixHT }` dans `chaineLitre.ts` ; tarifs liés par id.
- **°Plato** : trois copies de la même formule (`src/domain/alcohol.ts:14`, `src/services/brewingMath.ts:84-85`,
  `dom/swissBeerTax.ts:32`). Une seule, exportée d'`alcohol.ts`.

### 3.2 c3a — coût du litre, feuille budget
- Remplace le contenu de `fin/BrewBudgetSheet.tsx` (même ouverture : `BatchDetailSheet.tsx:249`, `RecipePage.tsx:363`,
  `BrewWizard.tsx:3512`, Finances › Coûts `FinancesTab.tsx:178`) ; nouveau `fin/CoutBrassinFlux.tsx` (le flux) ; la saisie
  (volumes, prix, frais) passe à la feuille au toucher d'un nœud (baseline c3a : « feuille c1a »).
- Calculs à corriger en même temps :
  - problème 3 : trois notions sorties d'`estimateBrewBudget` — `dejaPaye` (part consommée du stock, valeur pondérée),
    `aPayer` (achats + frais), `annee` (charges fixes + usure). Aujourd'hui `ingredientsCost` mêle stock et achat
    (`brewBudget.ts:331-337`). Somme = `totalCost`, testée.
  - Argent ≠ coût : l'achat arrondi au sac (`brewBudget.ts:330`, `:357-365`) fait sortir plus que le coût consommé. La barre
    du litre découpe le coût ; le bloc jaune « À payer » montre l'argent, et dit « dont X restent en stock » si l'écart existe.
  - problème 12 : impôt calculé (`beerTaxForVolume`, § 3.4), plus de montant manuel (`BrewBudgetSheet.tsx:175`).
  - « Emballage 33 cl » calculé depuis les formats et les prix de stock ; manuel seulement si inconnu.
  - « Houblon, levure ? » : hachuré, hors total, total dit « partiel ». c3a affiche « estimé » : garder le mot si complet.
  - Volume net : repris du brassin (problème 27 : deux volumes saisis à la main).
- Bouton « Prévoir 64,26 CHF » (primaire de c3a, gardé tel quel) : la prévision existe déjà (§ 1) ; le geste **fige** les
  entrées (instantané enregistré, statut « prévu ») et ouvre sa ligne dans Prévisions. Voir question B2.

### 3.3 v3a — la caisse (facture)
- Une seule entrée (problème 20) : + › « Vendre » remplace « Encaisser une vente » (`QuickActionModal.tsx:710`, écran
  `quick-sale` `:549`, modes `:1230`) ; Clients › fiche › Facturer (`C:269`, `C:356`) ouvre la même caisse, client choisi.
  Nouveau `src/ui/vente/Caisse.tsx` ; `fin/InvoiceSheet.tsx` retiré du chemin (pas supprimé sans accord).
- Calculs à corriger en même temps :
  - problème 9 : QR réel par `swissqrbill` 4.4.1 (`package.json:48`), voir § 4 ; `swissQrBill.ts:13` (« No QR ») disparaît.
  - problème 10 : adresse du client imprimée (aujourd'hui « Destinataire » sans adresse, `swissQrBill.ts:26`) ; n° continu
    `FAC-2026-0001` au lieu de `FAC-<année>-<8 hex>` (`InvoiceSheet.tsx:20`, `swissQrBill.ts:15`) : nouveau `dom/numeroFacture.ts`.
  - problème 11 : nom, rue, n°, NPA, localité, UID de la brasserie éditables (Réglages, `src/components/SettingsModal.tsx:237-255` ;
    repli `.env`, `src/domain/companyDefaults.ts:16-23`). Adresse **structurée** (rue / n° / NPA / localité / pays) pour la brasserie
    et le client (`Client.address` est une chaîne, `src/types/index.ts:728` ; `EditClientModal` n'a pas le champ).
  - problème 21 : échéance par puces « à réception · 10 j · 30 j », 30 j par défaut ; libellé du journal = tous les articles
    (`InvoiceSheet.tsx:45` ne prend que le premier).
  - Ligne de vente = `{ batchId, formatId, quantité }` : la jauge « 12,4/27 L nets » de v3a se calcule (litres vendus du
    brassin), et les litres sortis deviennent l'assiette réelle de l'impôt (problème 13).
  - TVA : la bière est au taux normal (boisson alcoolique, hors taux réduit) ; garder `tvaNormalRate` (`InvoiceSheet.tsx:21`)
    pour un assujetti, mais par ligne (consigne, verres : même taux, à confirmer).
  - « Comptoir » : vente sans client ; une facture QR sans débiteur est permise par la norme (zone à remplir à la main).
  - « Payé ici » (TWINT, espèces) : encaissement immédiat, quittance (`ReceiptService`, `QuickActionModal.tsx:549`).

### 3.4 p2b — impôt bière
- Feuille ouverte depuis le brassin : `BatchDetailSheet.tsx` (lien « Impôt bière › ») ; nouveau `src/ui/production/ImpotBiereSheet.tsx`.
  Clients › Impôt sur la bière (`C:279-315`) : ouvrir la même feuille pour un brassin, et garder le total de l'année (question B3).
- Calculs à corriger en même temps :
  - problème 14 : un taux unique, `beerTaxBracket` (`dom/swissBeerTax.ts:6`, bornes 10,0 / 14,0 °P) ; le réglage
    `beerTaxFullRatePerHl` (`src/services/storage.ts:~247`, déjà non lu) reste stocké, plus aucune lecture ni affichage.
    Retirer le repli 25,32 codé (`swissBeerTax.ts:39-40`) au profit du barème.
  - Nouveau `beerTaxForVolume({ og | plato, litres, réduction })` et `beerTaxPerFormat` (33 cl 0,08 ; 75 cl 0,19 ; fût 20 L
    5,06 à 12 °P) ; `estimateSwissBeerTax` (`:8-44`) l'appelle pour l'année. Le curseur °P de p2b est une simulation, jamais
    écrite ; « Noter la densité » écrit `batch.og`.
  - problème 13 : « Quand : à la sortie de cave » ; l'assiette annuelle passe aux litres vendus quand v3a les fournit.
  - Réduction petit brasseur (`swissBeerTax.ts:14`) : appliquée seulement l'année confirmée ; la feuille le dit (« à confirmer »).

### 3.5 Voies, ordre, propriété (disjointe par phase)
| Phase | Voie | Possède | Dépend de |
|---|---|---|---|
| 1 | d1 chaîne | `dom/chaineLitre.ts` (neuf), `dom/brewBudget.ts`, `dom/swissBeerTax.ts`, `src/domain/alcohol.ts`, `tests/unit/chaineLitre.test.ts`, `tests/unit/brewBudget.test.ts`, `tests/unit/swissBeerTax.test.ts` | — |
| 1 | d3 matériel | `dom/materielFutur.ts` (neuf), `dom/investmentScenario.ts`, `dom/upgrades.ts`, `dom/types.ts`, `tests/unit/materielFutur.test.ts`, `tests/unit/equipmentUpgrades.test.ts` | — |
| 1 | f1 facture | `src/services/swissQrBill.ts`, `dom/numeroFacture.ts` (neuf), `tests/unit/factureQr.test.ts` | — |
| 2 | d2 prévision | `dom/brewForecast.ts` (neuf), `dom/forecast.ts`, `src/components/tabs/FinancesTab.tsx`, `dom/assistantContext.ts`, `tests/unit/brewForecast.test.ts` | d1, d3 |
| 2 | uc c3a | `fin/CoutBrassinFlux.tsx` (neuf), `fin/BrewBudgetSheet.tsx`, `fin/BrewBudgetDialog.tsx`, `fin/cout-brassin.css` (neuf), `tests/integration/brewBudgetSheet.test.tsx`, `tests/integration/brewBudgetDialog.test.tsx` | d1 |
| 2 | up p2b | `src/ui/production/ImpotBiereSheet.tsx` (neuf), `src/ui/BatchDetailSheet.tsx`, `C` (section impôt), `impot-biere.css` (neuf) | d1 |
| 3 | uv v3a | `src/ui/vente/**` (neuf), `fin/InvoiceSheet.tsx`, `QuickActionModal.tsx`, `C` (Facturer), `EditClientModal.tsx`, `SettingsModal.tsx`, `src/types/index.ts`, `src/services/storage.ts` (config `company`), `companyDefaults.ts`, `tests/integration/factureClientSaisie.test.tsx`, `tests/integration/incomeProofFlows.test.tsx` | f1, d1, up (pour `C`) |
- Agents : Sonnet auteur pour chaque voie (L18), plafond 60 ; d2 et uv sont les plus lourdes. CSS par écran, classes préfixées
  (L26) : jamais `finance.css` partagé dans deux voies. `git status --short` après chaque retour (L17).
- Une dépendance à ajouter (§ 4, QR vectoriel) : décision pilote avant f1.

### 3.6 Tests Vitest, une règle par test
- `chaineLitre` : 202,77 ÷ 27 = 7,51 ; trois notions = total (22,41 + 64,26 + 116,10) ; litres nets (conditionné > enregistré >
  recette) ; coût 33 cl, 75 cl, fût ; prix inconnu → `null`, jamais 0 ; °Plato unique (mêmes valeurs que l'ancienne formule).
- `swissBeerTax` : 12 °P × 26,6 L → 6,74 ; 27 L → 6,84 ; formats 0,08 / 0,19 / 5,06 ; bornes 10,0 / 10,1 / 14,0 / 14,1 ;
  OG absente → fourchette 16,88–33,76 ; réduction hors année → taux plein ; ≤ 0,5 % vol. exonéré ; aucune lecture du réglage 25,2.
- `brewForecast` : un planifié → items achats (J − 7), frais (J), emballage, impôt (date estimée) ; annulé → aucun item ;
  date déplacée → items déplacés ; deux brassins sur le même malt → le premier réserve ; facture `batchId` → reste diminué ;
  plan « Prévoir » actif du même brassin → un seul compte ; brassin commencé → achats disparus, impôt gardé ; prix inconnu →
  item partiel + avertissement. Exemple du brief : 33,42 au brassage (22,42 à J − 7, 11,00 à J) + 24,00 avant le conditionnement + 6,84 d'impôt = 64,26.
- `materielFutur` : 3 000 ÷ 5 = 600 ; 600 ÷ 1 200 = 0,50 → 8,01 ; 3 000 ÷ 2,52 → 1 191 bouteilles ; point bas ; meilleur
  mois (premier où le point bas ≥ seuil) ; durée inconnue → `null`.
- `factureQr` : `FAC-2026-0001` puis `0002`, l'année suivante repart à `0001`, numéros d'autres années ignorés ; données QR
  acceptées par `SwissQRBill` (aucune `ValidationError`) avec adresses structurées, refusées sans NPA ; référence SCOR
  (checksum `swissqrbill/utils`) ; débiteur absent permis ; échéance défaut +30 j ; TVA par ligne en centimes.
- Gemini jamais dans ces tests ; fixtures : `src/dev/financeDemo.ts` et l'IBAN d'exemple du guide SIX (jamais le vrai).

### 3.7 Contrôles de parcours
- `controle-choix.mjs` (D105) sur les trois routes ; captures côte à côte maquette / app, chaque état (c3a repos et « À payer » ;
  v3a panier, Facture QR, annexe imprimée ; p2b 12 °P et 15 °P, densité notée / à noter), 390 tactile et 1280, deux thèmes (L12).
- Parcours réels dans Chrome (`?dev-local`) : + › Préparer un brassin → Prévisions montre ses lignes datées → fiche du brassin
  → coût (c3a) → impôt (p2b) ; + › Vendre → Comptoir puis Café du Bourg → Facture QR → PDF : QR lisible par l'app bancaire
  d'un téléphone (geste du pilote, sur IBAN d'exemple) ; Clients › fiche › Facturer → même caisse.
- `npm test -- <fichiers>`, `npm run build`. Rien en ligne, rien de déployé.

## 4. État de l'art (L29) — à recopier dans MISSION.md
| Problème type | Examiné | Décision |
|---|---|---|
| QR-facture suisse | Norme SIX « Swiss Implementation Guidelines QR-bill » (v2.3 : adresses structurées seules, depuis novembre 2025, à vérifier) ; `swissqrbill` 4.4.1 installé : `swissqrbill/svg` (`SwissQRBill`, `SwissQRCode`), `swissqrbill/utils` (`isQRIBAN`, `isIBANValid`, `calculateSCORReferenceChecksum`, `calculateQRReferenceChecksum`), `swissqrbill/pdf` (exige PDFKit, absent) ; corps actuel en jsPDF (`package.json:40`) | Garder jsPDF pour la facture ; section paiement depuis `SwissQRBill` (SVG) posée dans le PDF par `svg2pdf.js` (vectoriel, à ajouter : décision pilote) ; repli sans dépendance : SVG rendu en PNG ≥ 300 dpi. Référence : SCOR (RF) avec IBAN ordinaire, QRR seulement si `isQRIBAN`. Jamais de QR dessiné à la main. |
| Coût de revient | Méthode des coûts complets : directs + indirects répartis par clé (volume annuel) ; déjà dans `brewBudget.ts:382-390` | Garder la clé « litres conditionnés par an », une seule valeur (`profile.annualProductionL`), problème 28. |
| Amortissement / usure | Notice AFC A 1995 (`annual.ts:6`), taux dégressif et linéaire (moitié) ; usure économique = linéaire sur la durée d'utilité | Annuel : AFC (inchangé). Litre et frigo : usure linéaire, durée saisie, défaut = 100 ÷ taux linéaire AFC de la catégorie (décision P2). |
| Prévision de trésorerie | Méthode directe (encaissements et décaissements par mois, solde cumulé), scénario « et si » par flux ajouté, point bas = minimum du cumul | Garder `buildForecast` (centimes entiers, mois calendaires déjà testés) ; ajouter les flux dérivés et le scénario ; aucune bibliothèque. |
| Impôt sur la bière | LIB (RS 641.411) art. 14, barème 16,88 / 25,32 / 33,76 CHF/hl ; OIBi (RS 641.411.1) pour la réduction ; °Plato par le polynôme de Lincoln | Un barème (`swissBeerTax.ts:6`), une formule °Plato ; période et délais lus dans la directive OFDF avant de dater l'item. |
| Diagramme de flux (c3a) | Sankey : `recharts` 3 installé (`package.json:47`) a `<Sankey>` ; son placement itératif réordonne les nœuds | Un essai `recharts` (`iterations={0}`, nœuds et liens dessinés par nous) ; si l'ordre de c3a ne tient pas, mise en page bipartite fixe (empilement proportionnel, liens Bézier), testée. |
| Numérotation continue | Compteur + transaction Firestore (exige le réseau) ; max + 1 local (hors ligne, risque de doublon sur deux appareils) | max + 1 sur le grand livre local par année ; doublon détecté à la synchro et signalé, jamais renuméroté après envoi. |

## 5. Qui tranche
### Au brasseur (goût ; mini maquettes, artefact neuf, sans bloquer)
- **B1** c3a, état « À payer » : le bloc dit « avant le brassage 64,26 » alors que 6,84 (impôt) se paie après le conditionnement
  et 24,00 (emballage) avant le conditionnement. Montrer : (a) tel quel ; (b) « 33,42 avant le brassage · 30,84 plus tard ».
  Recommandation : (b), la maquette inchangée hors ce bloc (L14 : une maquette choisie ne valide aucune règle).
- **B2** sens du bouton « Prévoir 64,26 CHF » quand la prévision est automatique : (a) libellé inchangé, geste = figer et ouvrir
  Prévisions ; (b) « Voir dans Prévisions ». Recommandation : (a), sa maquette telle quelle.
- **B3** où vit le total annuel de l'impôt (p2b est par brassin ; p2a/p2c non choisis) : « à dessiner ».
- **B4** Prévisions avec « ventes attendues » (litres des brassins planifiés × formats × tarifs, en pointillé « estimé ») :
  sans elles, le meilleur mois du frigo n'a pas de sens. Va dans les concepts p4 de la passe 3.
### Au pilote (métier sans goût)
- **P1** prévision dérivée à la lecture (recommandé) contre plans auto écrits dans Firestore.
- **P2** usure linéaire sur durée (litre, frigo) contre amortissement AFC de l'année (déjà utilisé, `BrewBudgetDialog.tsx:21-25`).
  Recommandé : linéaire, défaut tiré du taux AFC ; Annuel garde l'AFC.
- **P3** ventes nécessaires calculées sur la marge (1 191 bouteilles), le prix seul en second (600).
- **P4** dépendance `svg2pdf.js` ou rendu PNG ; **P5** délai d'achat (7 j) et durée avant conditionnement (21 j) ;
  **P6** numérotation max + 1 ; **P7** adresse structurée obligatoire pour la brasserie (bloque le QR tant qu'elle manque).

Limites : rien rendu dans Chrome ; `ExpenseSheet`, `AssetSheet`, `assistantContext.ts` non lus en détail ; période de déclaration
de l'impôt et date de la norme SIX v2.3 à vérifier à la source ; temps de calcul de la prévision dérivée estimé, à mesurer.
