# Plan d3 — mesurer un achat de matériel futur (`mesurerAchat`)

Étape 1 : plan seul, aucun code. Lu dans le worktree le 09.11 (`dom/` = `src/domain/finance/`). Sources : `PLAN-METIER.md` § 2 et § 4,
`COMMUN.md`, `INVENTAIRE-CODE.md` problèmes 15 et 16, code cité ci-dessous. Exemple du brasseur : un frigo à 3 000 CHF.

## 1. Défauts visés

| Id | Défaut (preuve) | Ce que la voie corrige |
|---|---|---|
| 15 | « Puis-je acheter ce matériel ? » sans réponse : `buildForecast` n'ajoute aucune vente prévue, la tendance ne couvre que `chargesFixes` (`dom/forecast.ts:14`, `:127-128`) ; un projet `equipment` n'est qu'une sortie datée (`forecast.ts:88-114`), sans point bas, sans durée, sans effet sur le litre | Fonction pure `mesurerAchat` : trésorerie au mois d'achat, point bas, meilleur mois, usure par an, part dans le coût du litre, ventes pour le payer |
| 16 | `simulateBreweryInvestment` (`dom/investmentScenario.ts:13`) n'est appelé que par l'assistant IA (`assistantContext.ts:10`, `functions/src/brewerFinanceTools.ts:16`) ; aucun écran | La fonction neuve est pure et sans Firestore, prête à être branchée par l'écran (voie ultérieure). Le contrat de la simulation IA ne bouge pas |

Hors voie mais liés : l'écran (Prévisions, p4 de la passe 3), l'écriture de la prévision (d2), le coût du litre (d1).

## 2. Décisions déjà prises (rappel, pas rouvertes)

P2 usure linéaire sur durée, défaut = 100 ÷ taux linéaire AFC de la catégorie, l'Annuel garde l'AFC ; P3 ventes nécessaires sur la marge, le
prix seul en second. Ici je détaille seulement ce que le plan métier laissait ouvert (§ 7, trois choix de méthode que je tranche en
option prudente et réversible, à confirmer à la revue).

## 3. Changements, fichier par fichier

### 3.1 `dom/types.ts` — `EquipmentUpgrade` (additif, version inchangée)

Ajouter trois champs **optionnels** à l'interface (`types.ts:114-127`) :
- `depreciationCategory?: DepreciationCategory` (type déjà défini `types.ts:129`) ;
- `usefulLifeYears?: number` (durée d'usage saisie, années, entier ou demi-année ; 1 à 50) ;
- `inServiceMonth?: string` (`AAAA-MM`, mise en service prévue ; défaut = mois d'achat).

Aucune migration : `version: 1` reste, les plans existants (dont `DEMO-FERMENTEUR`, `DEMO-CUVERIE`, `src/dev/financeDemo.ts:28-29`) n'ont pas ces
champs et se lisent comme avant (`upgradeDetails` rend l'objet tel quel). Aucun champ n'est écrit tant que le brasseur ne le saisit pas
(jamais `undefined` littéral dans un document Firestore) ; `firestore.rules.template` ne liste pas les clés de `upgrade` (grep fait :
seules des listes `hasOnly` sur des archives), donc rien à changer côté règles.

### 3.2 `dom/upgrades.ts`

- `validateUpgrade` (`upgrades.ts:40-50`) : valider les trois champs **seulement s'ils sont présents** — durée dans [1 ; 50] et finie, mois
  `AAAA-MM` valide, catégorie dans `DEPRECIATION_CATEGORIES` ; message FR court, même style que les lignes voisines. Plan sans ces champs : inchangé.
- `upgradeDetails` (`:8-10`) : valeur de repli inchangée (champs absents).
- Rien d'autre. `upgradeBudget` (`:11-18`, prix + livraison + installation, `null` si le prix manque) est **le coût initial** de `mesurerAchat`.

### 3.3 `dom/investmentScenario.ts`

**Non modifié.** Écart au plan métier (§ 2 : « réutiliser le calcul de `simulateBreweryInvestment` pour le coût initial ») : cette fonction exige les
sept montants, une note d'hypothèse et lève des exceptions (`:14-17`) ; elle est faite pour le contrat de l'assistant IA, dont le test vérifie
les messages d'erreur (`tests/integration/financeAssistantContext.test.ts:199-216`). Réemployer `upgradeBudget` (déjà testé,
`null` si inconnu, jamais 0) évite de dupliquer la somme à trois termes et ne lie pas l'écran à l'IA. Le bundle `functions/lib/financeContext.js` (construit depuis
`assistantContext.ts`, `scripts/build-brewer-tools.mjs:30-38`) n'en est pas touché, aucune régénération.

### 3.4 `dom/materielFutur.ts` (neuf) — `mesurerAchat`

Tout en **centimes entiers** (l'unité de `forecast.ts`). `brewBudget` parle en CHF flottants (`costPerL`, `money`) : l'appelant convertit une fois
(`Math.round(costPerL * 100)`), la fonction ne reçoit jamais de CHF.

```ts
export interface AchatMateriel {
  /** Total à sortir, TTC, centimes (achat + livraison + installation : `upgradeBudget`). null = inconnu. */
  coutInitialCents: number | null;
  moisAchat: string;                              // 'AAAA-MM'
  usure?: { dureeAns: number } | { categorie: DepreciationCategory };   // absent = inconnu
  /** Base de l'usure : HT si assujetti à la TVA (TVA récupérée), sinon TTC. Défaut = coutInitialCents. */
  baseUsureCents?: number | null;
  productionAnnuelleL?: number | null;            // profile.annualProductionL
  coutLitreCents?: number | null;                 // coût du litre SANS ce matériel (c3a)
  format?: { label: string; volumeL: number; prixCents: number; coutCents?: number | null };
  prevision: FinanceForecast;                     // sortie de buildForecast, jamais relue ici
  ignorerPlanId?: string;                         // le projet est déjà dans la prévision : ne pas le compter deux fois
  seuilCents?: number;                            // défaut 0
}
export interface MesureAchat {
  tresorerie: { soldeMoisAchatCents: number; pointBas: { mois: string; soldeCents: number } } | null;
  meilleurMois: { mois: string; soldeMiniCents: number } | null;
  usureParAnCents: number | null;
  partParLitreCents: number | null;
  coutLitreAvecCents: number | null;
  ventes: { formatLabel: string; margeUnitaireCents: number; bouteilles: number; litres: number; bouteillesSiToutEstMarge: number } | null;
  ventesPrevuesIncluses: boolean;
  avertissements: string[];
}
```

Chaque sortie est **`null` si une de ses entrées manque**, indépendamment des autres (durée inconnue → usure `null`, trésorerie calculée quand même).

1. **Trésorerie.** Soit `solde'(k) = solde(k) − coût` pour `k ≥ moisAchat`, où `solde(k) = prevision.months[k].balanceCents`. Le solde cumulé de
   `buildForecast` est une somme de flux (`forecast.ts:152-159`) : ajouter un flux d'achat revient à décaler d'un montant constant tous les soldes
   suivants. On ne rejoue donc pas `buildForecast`, et aucun plan n'est créé ni écrit. `soldeMoisAchatCents = solde(moisAchat) − coût`.
   `pointBas` = minimum de `solde'(k)` pour `k ≥ moisAchat` (mois et montant). `null` si `openingCashCents == null`, si un solde est `null`, ou si
   `moisAchat` est hors de `prevision.months` (avertissement « achat hors de l'horizon prévu : N mois »). Mois d'achat avant le mois courant : refusé (`null`).
   `ignorerPlanId` : les montants des items `planId === ignorerPlanId` (dates déjà ramenées dans l'horizon par `buildForecast`) sont rajoutés cumulativement
   avant le décalage ; sans cela un projet déjà prévu se compterait deux fois (test dédié).
   Limite dite : soldes de **fin de mois** ; un creux au milieu du mois n'est pas vu.
2. **Usure par an.** `base × tauxLinéaire/100` (catégorie, `DEPRECIATION_CATEGORIES`, `annual.ts:7-14`) ou `base ÷ dureeAns` (durée saisie), arrondi au centime
   (`Math.round`). Catégorie `custom` (taux 0) ou durée non finie / ≤ 0 → `null`, jamais 0. 3 000 CHF ÷ 5 ans = 60 000 c ; catégorie `production` : 3 000 × 15 % = 45 000 c.
3. **Part dans le litre.** `Math.round(usureParAnCents ÷ productionAnnuelleL)` (production ≤ 0 ou absente → `null`). 60 000 ÷ 1 200 = 50 c/L ; `coutLitreAvecCents = coutLitreCents + partParLitreCents` = 751 + 50 = 801.
4. **Ventes pour le payer (P3, sur la marge).** Coût du format = `format.coutCents` si l'appelant le donne (d1 : litre + emballage + impôt), sinon repli
   `Math.round(coutLitreCents × volumeL)` **marqué** dans `avertissements` (« coût du format : liquide seul »). `margeUnitaireCents = prixCents − coûtFormat`.
   Le coût du litre est celui **sans** le matériel : sinon on compte l'achat deux fois (une fois en part du litre, une fois en marge à rattraper).
   `bouteilles = ⌈coutInitialCents ÷ marge⌉` ; marge ≤ 0 → `null` + avertissement « chaque vente perd de l'argent ». `litres = bouteilles × volumeL`, arrondi à 0,1 L.
   `bouteillesSiToutEstMarge = ⌈coût ÷ prixCents⌉` (le prix seul, **second** chiffre, nommé pour ne pas être lu comme le principal). 33 cl, 5,00 CHF, coût 751 c/L : 248 c ; marge 252 c ; ⌈300 000 ÷ 252⌉ = 1 191 ; 393,0 L ; 600 si tout est marge.
5. **Meilleur mois.** Comme le décalage est constant, `pointBas(m) = min_{k ≥ m} solde(k) − coût`. Un passage de droite à gauche donne tous les minima en O(n) ;
   `meilleurMois` = premier `m ≥ mois courant` avec `pointBas(m) ≥ seuilCents` (défaut 0). Aucun mois ne convient dans l'horizon → `null` + avertissement
   (« aucun mois ne tient ; horizon 12 mois »).
6. **Ventes prévues.** `ventesPrevuesIncluses = prevision.items.some(i => i.direction === 'in')`. Sans entrée prévue, le solde ne fait que baisser et le « meilleur mois » ne dit rien :
   l'avertissement le dit en clair (« aucune vente prévue dans la prévision : le solde ne peut que baisser »), la valeur reste rendue (la décision d'affichage est à p4, B4). Les sorties
   sans échéance (`undatedOutCents`) et les `warnings` de la prévision sont repris en avertissement (« N CHF sans échéance, non comptés »).

Pas de classe, pas d'état, pas de `Date.now()` ni de lecture Firestore : tout est dans les arguments (L29 : aucune bibliothèque, un calcul d'école —
prévision de trésorerie par méthode directe, point bas = minimum du cumul ; décision déjà écrite dans PLAN-METIER § 4).

## 4. Tests qui échouent d'abord (`tests/unit/materielFutur.test.ts`, neuf ; fixture à la main sauf le dernier)

Fixture `prevision` minimale (soldes de fin de mois, centimes) : `nov 200 000 · déc 150 000 · jan 250 000 · fév 400 000 · mar 450 000` ; achat 300 000.

| # | Règle | Données | Attendu |
|---|---|---|---|
| 1 | usure durée | 300 000, 5 ans | 60 000 |
| 2 | usure catégorie AFC | 300 000, `production` | 45 000 ; `custom` → `null` |
| 3 | durée inconnue/0/NaN | idem | usure, part, coût avec → `null`, trésorerie quand même calculée |
| 4 | part dans le litre | 60 000 ÷ 1 200 L, litre 751 | 50 ; 801 ; production 0 ou absente → `null` |
| 5 | ventes sur la marge | 33 cl, prix 500, litre 751, coût 300 000 | marge 252 ; 1 191 bouteilles ; 393,0 L ; `bouteillesSiToutEstMarge` 600 |
| 6 | marge ≤ 0 | coût du format 520 | `ventes: null` + avertissement ; jamais de division par zéro |
| 7 | coût du format fourni | `coutCents` 300 | marge 200 → 1 500 bouteilles, pas d'avertissement « liquide seul » |
| 8 | trésorerie, achat en nov | fixture | solde du mois −100 000 ; point bas déc −150 000 |
| 9 | trésorerie, achat en jan | fixture | solde du mois −50 000 ; point bas jan −50 000 |
| 10 | meilleur mois | seuil 0 | `2027-fév` (min(400 000, 450 000) − 300 000 = 100 000) ; seuil 150 000 → `null` + avertissement |
| 11 | achat hors horizon / dans le passé | `moisAchat` absent des mois | trésorerie `null`, avertissement |
| 12 | solde d'ouverture inconnu | `openingCashCents: null`, soldes `null` | trésorerie, meilleur mois `null` (pas 0) |
| 13 | sans ventes prévues | prévision sans item `in` | `ventesPrevuesIncluses: false` + avertissement |
| 14 | projet déjà dans la prévision | item `planId: 'FRIGO'` 300 000 en jan, `ignorerPlanId` | même point bas que sans le projet, puis −300 000 ; sans `ignorerPlanId` : compté deux fois (preuve du piège) |
| 15 | non-mutation | `structuredClone` avant/après | prévision et entrées inchangées |
| 16 | bout en bout avec le vrai `buildForecast` | `financeDemo` (ouverture 4 000 CHF, loyer 400 CHF/mois, `DEMO-FERMENTEUR`), achat 3 000 | `tresorerie` non nulle, cohérente avec `months[k].balanceCents − 300 000` |

`tests/unit/equipmentUpgrades.test.ts` (existant, 88 lignes) : ajouter (a) un plan **sans** les trois champs valide comme avant (déjà couvert par `project()`, vérifier qu'il l'est
encore) ; (b) `usefulLifeYears: 0` ou 51 → refus ; `inServiceMonth: '2026-13'` → refus ; `depreciationCategory: 'inconnu'` → refus ; (c) plan avec les trois champs valides → accepté et `upgradeBudget` inchangé.
Ils échouent d'abord (le champ n'existe pas, `validateUpgrade` n'en refuse aucun).

## 5. Appelants hors Possède (grep `src/ tests/ scripts/ functions/`) et rejeu sur HEAD

| Appelant | Lien | Effet du plan |
|---|---|---|
| `src/ui/finance/UpgradeSheet.tsx:5-6,17-40` | `EquipmentUpgrade`, `upgradeBudget`, `upgradeDetails`, `upgradeReadiness`, `upgradeProgress` | champs optionnels : aucun changement de comportement ; **saisie de la durée et de la catégorie** : pas dans la voie (UI, ensuite) |
| `src/ui/finance/UpgradeWorkspace.tsx:4,19-89` | idem + `UPGRADE_*` | inchangé |
| `src/domain/finance/forecast.ts:3,89-113` | `isUpgradePlan`, `upgradeReadiness` ; item `source:'equipment'` | inchangé (`mesurerAchat` lit sa sortie) ; la signature de `buildForecast` n'est pas touchée par d3 (d2 la change) |
| `src/domain/finance/assistantContext.ts:9-10,49,183-188` | `mergeUpgradePlans`, `upgradeDetails`, `upgradeProgress`, `simulateBreweryInvestment` | inchangé ; l'objet `records` de l'assistant ne porte pas les trois champs (à ne pas ajouter ici) |
| `src/services/financeService.ts:6,63-66,80,83` | `validateUpgrade` à l'enregistrement | un plan existant reste valide ; un plan à champ invalide est refusé comme prévu |
| `src/components/tabs/FinancesTab.tsx:32,97,223` | `isUpgradePlan` | inchangé |
| `functions/src/brewerFinanceTools.ts:1,16`, `functions/src/financeContext.d.ts:4` | `simulateBreweryInvestment` | inchangé (fichier non modifié) |
| `src/dev/financeDemo.ts:28-29` | fabrique deux plans `equipment` | fixture de d3 (test 16), non modifiée |
| `scripts/agents/inventaire-ecrans.mjs` | mentions de texte « matériel » seulement | sans lien de code |

Rejeu sur HEAD (worktree sans changement de source, `npx vitest run … --reporter=dot`, journal : `voies/d3/tests-head.txt`) des douze fichiers qui touchent ce module :
`tests/unit/equipmentUpgrades.test.ts`, `tests/integration/financeAssistantContext.test.ts`, `tests/integration/equipmentProjects.test.tsx`, `tests/integration/upgradeSheetTe35.test.tsx`,
`tests/unit/financeForecast.test.ts`, `tests/unit/forecastHorizon.test.ts`, `tests/unit/finance.test.ts`, `tests/unit/depense/onglets/ta3-a-payer.test.ts`, `…/ta4-sans-echeance.test.ts`, `…/ta6-tendance.test.ts`,
`tests/unit/depense/ecran/libelles.test.tsx`, `tests/integration/financeWorkspace.test.tsx`.

**Résultat sur HEAD : `Test Files 1 failed | 11 passed (12)` ; `Tests 108 passed (108)`.** L'échec est antérieur à la voie : `tests/integration/financeAssistantContext.test.ts` ne charge pas
(`Failed to resolve import "firebase-admin/firestore" from functions/src/brewerFinanceContext.ts` : le paquet n'est pas installé dans ce worktree, `functions/node_modules` absent). C'est lui qui couvre
`simulateBreweryInvestment` ; comme le fichier n'est pas modifié par la voie, ce test ne peut pas passer ni casser ici. Tant qu'il ne se charge pas, son verdict ne compte pas : à rejouer là où `functions/node_modules` existe
(décision pilote : installer, ou rejeu sur le poste principal). Les 11 autres fichiers sont la ligne de base à rejouer après le code (attendu : mêmes 108 tests verts, plus les ajouts).

Autres tests qui verraient un changement : aucun (types additifs, aucune fonction existante modifiée de signature ni de résultat).

## 6. Risques

- **Données existantes** : champs optionnels, pas de migration, plans anciens identiques. Un plan dont `upgrade.depreciationCategory` serait écrit par une version future puis relu par une
  version ancienne : les anciennes lisent un objet avec une clé en plus, sans effet (aucun `hasOnly` côté règles).
- **Hors ligne** : fonction pure sur la prévision déjà chargée ; ni écriture, ni file d'attente, ni lecture réseau.
- **Double clic / concurrence** : aucune écriture, donc rien à dédoubler.
- **Arrondis** : centimes entiers partout ; `Math.round` pour l'usure et la part du litre (le demi-centime est arrondi vers le haut, écart max 0,5 c/L, dit dans le doc-commentaire) ; `⌈⌉` pour les bouteilles
  (on ne vend pas 0,4 bouteille : arrondi au-dessus, sens prudent) ; litres à 0,1 L. Conversion CHF → centimes faite une seule fois par l'appelant (`coutLitreCents`), jamais dans la fonction.
- **Double compte de l'usure** : une fois l'achat noté (`AssetSheet`), l'actif entre dans l'amortissement fiscal de l'année (`BrewBudgetDialog.tsx:21-25`) et le plan passe `completed` ; si d2/d1 ajoutent aussi
  l'usure linéaire du **projet** au litre, le frigo compterait deux fois. Règle à imposer à ces voies : l'usure d'un projet ne compte que tant qu'aucune facture ni actif n'y est lié ; d3 n'écrit pas cette jonction.
- **TVA** : le coût initial est TTC (flux de caisse) ; l'usure et la marge doivent être sur base HT pour un assujetti. Entrée `baseUsureCents` et prix du format fournis par l'appelant ; `mesurerAchat` ne devine pas le taux. À ajouter aux tests de l'écran.
- **Ventes d'un mois non prévues** : le meilleur mois n'a de sens qu'avec des entrées prévues (B4 : Prévisions avec ventes attendues, concepts p4). Le calcul ne ment pas (il avertit) mais ne remplace pas B4.
- **Temps** : O(mois) (≤ 24) ; aucun `buildForecast` rejoué, donc rien à mesurer (L20 : coût de la prévision déjà mesuré par d2).
- **Prévision déjà « avec » le projet** : sans `ignorerPlanId`, un projet actif et daté est déjà dans les sorties ; l'écran doit le passer. Le test 14 l'attrape.

## 7. Choix de méthode tranchés (option prudente, réversible ; à valider à la revue)

1. **Décalage constant du cumul** plutôt que de rejouer `buildForecast` avec un plan fictif (`PLAN-METIER` § 2.1 disait « avec l'achat ajouté comme item `equipment` ») : même résultat, plus rapide, aucun plan synthétique, un seul comptage d'`ignorerPlanId`. Réversible : le test 16 rejoue le vrai `buildForecast` pour le prouver.
2. **Pas de réemploi de `simulateBreweryInvestment`** pour le coût initial (§ 3.3) : `upgradeBudget` à la place.
3. **Coût du litre sans le matériel** pour la marge (§ 3.4.4) : sinon l'achat se rattrape deux fois.

## 8. Hors périmètre

- Aucun écran, aucun composant (saisie durée/catégorie, carte de réponse « puis-je acheter ? » : voie UI, après d2 et p4).
- `dom/brewBudget.ts`, `dom/chaineLitre.ts` (d1), `dom/forecast.ts`, `dom/brewForecast.ts` (d2) : non touchés ; l'ajout de l'usure du projet au litre des brassins postérieurs à la mise en service reste à ces voies (risque « double compte »).
- Ventes attendues dans la prévision (B4) ; période et date de l'impôt ; `AssetSheet` (reprise de la catégorie à l'achat : à noter pour l'UI).
- Le brasseur n'a pas de choix ouvert ici (aucun goût tranché : seuil 0, durée saisie, libellés viennent plus tard dans p4). Gemini : jamais. IBAN : jamais recopié. Aucun commit, aucun `git stash`.

## 9. Étape 2 — traitement des revues (REVUE-A `D3-*`, REVUE-B `d3-*`) et décisions du pilote

Décision pilote retenue : **l'usure n'est comptée qu'une fois** ; le litre prend l'usure LINÉAIRE (P2) ; projet futur = estimation (durée saisie, défaut 100 ÷ taux linéaire AFC) ; à l'achat l'usure linéaire de l'actif du registre la remplace ; jamais les deux, jamais le dégressif pour le litre.
Écarts au PLAN-METIER (1 `upgradeBudget`, 2 décalage constant, 3 coût du litre sans le matériel) : acceptés. Test non chargé `financeAssistantContext.test.ts` (`firebase-admin`) : à rejouer sur le poste principal, une seule fois pour d1 et d3.

| Constat | Sort | Traitement (code ou test) |
|---|---|---|
| D3-1 test 10 faux | retenu | seuil 150 000 → mars ; 150 001 → `null` + avertissement |
| D3-2 / d3-1 usure unique, AFC dégressif | retenu | `usureLineaireActifCents` (linéaire seul), `usureAnnuelleLitre` (un matériel, une ligne), `FinancialAsset.usefulLifeYears?` ajouté à `types.ts` ; tests « projet seul / facture seule / facture + actif » (60 000 une fois, ni 90 000 ni 120 000) |
| D3-3 déclencheur actif ≠ décision | retenu | lien par `asset.transactionId` ∈ pièces du projet (`actifLiePourProjet`) ; facture sans actif : l'usure du projet continue + « Actif à créer » |
| D3-4 TVA | retenu | entrées `assujettiTva`, `baseUsureCents` ; assujetti sans HT → usure et ventes `null` ; test 1 102 bouteilles |
| D3-5 marge après tous les coûts | retenu | champ nommé `margeApresTousCoutsCents`, avertissement dit « marge après tous les coûts du litre » ; `coutVariableCents` du format (d1) → `bouteillesSurMargeVariable` en second |
| D3-6 / d3-3 « ventes » = facture client | retenu | `encaissementsPrevusCents` (sources plan, récurrente, brassin ; pas `invoice`) ; avertissement tant que entrées < sorties |
| D3-7 `coutLitreCents` contrat | retenu | doc-commentaire « hors usure de CE projet » + `usureAnnuelleLitre({ ignorerPlanId })`. **À écrire dans d2/uc** : l'écran passe le coût du litre calculé avec `ignorerPlanId` |
| D3-8 arrondi de la part | retenu | `partParLitreCents` exact (35,714 pour 42 857 ÷ 1 200), arrondi à l'affichage |
| D3-9 durée demi-année | retenu | `validateUpgrade` : 1 à 50, multiple de 0,5 ; tests |
| D3-10 / d3-7 facture liée | retenu | test « facture due en mars » (`ignorerPlanId` rend le reste dû). Facture déjà payée : dans l'ouverture, pas dans les items |
| D3-11 TVA préalable | retenu | avertissement chiffré (TTC − HT) |
| d3-2 repli mal étiqueté | retenu | « coût complet moyen du litre × volume », marge de rattrapage prudente |
| d3-4 test 16 horloge | retenu | `vi.useFakeTimers`, `asOf` fixé, plan à la main (pas `financeDemo`) ; seule la relation `solde − 300 000` est affirmée |
| d3-5 durée contre catégorie | retenu | durée saisie > catégorie, non arrondie (22,5 % : 67 500) ; tests |
| d3-6 mois courant | retenu | mois courant = `prevision.months[0].month` ; tests « passé » et « hors horizon » |
| d3-8 rejeu HEAD | retenu | voir ci-dessus |
| d3-9 données existantes | vérifié | aucun défaut |
| R3 (test 16 casse si d2 change `forecast.ts`) | retenu | `tests/unit/materielFutur.test.ts` à rejouer par d2 |
| R6 `controle-virgule` | retenu | `virgule()` + `montantChf` ; `node scripts/agents/controle-virgule.mjs` → `VIRGULE OK` |
| Preuve rouge avant le code | retenu | `voies/d3/tests-rouge.txt` (2 fichiers échouent) puis `tests.txt` vert |

Limite assumée : l'usure d'un projet est estimée sur son budget TTC (le projet ne porte pas de prix HT) ; pour un assujetti, l'actif au registre (HT) la remplace à l'achat.
