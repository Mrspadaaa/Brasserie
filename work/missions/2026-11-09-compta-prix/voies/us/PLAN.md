# Plan de la voie us — port de g3a, la Synthèse (étape 1, avant tout code)

Sources lues : `VOIE.md`, `voies/COMMUN.md`, `p2/g3a/` (etat.html lu en entier, NOTE.md, g3a-page.png et g3a-etat.png **ouvertes**), `INVENTAIRE-CODE.md` §1 (problèmes 1, 2, 22),
`FinancesTab.tsx` (168 l.), `FinanceOverview.tsx` (87 l.), `domain/finance/ledger.ts`, `chaineLitre.ts`, `annual.ts:120-140`, `src/dev/financeDemo.ts`.
Choix du brasseur : `work/refonte-frontend/v4/choix/ecrans-app.json:107` — `synthese` → `g3a`, statut `choisi`. Règle n° 1 : la maquette remplace l'écran, rien de l'ancien ne reste à côté.
Aucune ligne de code n'est écrite. Aucun test n'est ajouté ni modifié à cette étape.

> **Ce plan est amendé par §10 (revues A et B, décisions du pilote). En cas de contradiction, §10 prime.**

## 0. Portée en une ligne (L01)
Onglet Finances › Synthèse : les deux lectures « Situation » et « Coûts » disparaissent, remplacées par UN écran, g3a (période → entré contre dépensé, l'à-payer hachuré, le gain, la caisse, le litre). Les autres onglets (Opérations, Prévisions, Annuel) ne sont pas touchés.

## 1. Défauts visés (ids de INVENTAIRE-CODE.md)
| id | Défaut | Corrigé par |
|---|---|---|
| P1 | Finances ne répond pas à « ai-je gagné de l'argent ? » | colonne Entré, colonne Dépensé, pastille « +23,20 CHF gagnés » (g3a) |
| P2 | Deux « résultats » qui se contredisent (Accueil compte le matériel en charge, l'Annuel non) | un seul résultat dans cet écran : ventes − charges de la période, matériel **à part** (règle de la maquette ; ELLE DIFFÈRE de l’Annuel, voir §10 US-2). Le Bord n'est pas dans Possède : voir §7 |
| P22 | Titre « Synthèse » répété, sous-onglets Situation/Coûts | plus de `finance-bar`, plus de sous-onglet : le titre est la période (« Novembre ») |
| 1b-métier | Matériel (capital) dans la même barre que le malt ; pas de recettes en face | colonne « Matériel à part » ; recettes en face |
| 1a-métier | « à payer » mêle factures fournisseurs et futures | hachuré dans la colonne (par pièce, avec son échéance), légende « payé / à payer » |
| 1a-interface | chevron seul sans libellé (`finance-position-open`) ; 3 phrases pour dire « À compléter » | l'en-tête « En caisse » devient un bouton nommé ; « À compléter » en une ligne |
| 1b-interface | « sur » dans « +120 sur octobre » ; « Dépenses nettes » dit deux fois ; texte « Le bouton + enregistre un achat » | disparaissent avec l'ancien écran |
| BE-72 | le solde saisi mais non confirmé doit rester visible | conservé : « Solde saisi : X, à confirmer » sous « En caisse » (test `soldeDepartVisible`) |

## 2. Inventaire de la maquette g3a : chaque élément, chaque état (ce que le code doit rendre)
Éléments (etat.html) :
- **E1 période** : titre « Novembre » + segment `sept. | oct. | nov. | tout` (`aria-pressed`). → mois courant, les deux précédents, « tout ».
- **E2 scène** deux colonnes de même échelle (`grid 1fr 1fr 58px`, hauteur 340 px) :
  - **E2a colonne Entré** : en-tête « Entré 720,00 », pile verte unie, légende interne « Vente au marché » (libellé de la pièce).
  - **E2b colonne Dépensé** : en-tête « Dépensé 696,80 », empilé du plus petit au plus gros (Nettoyage 42,00 · Brassage 186,80 · Électricité 68,00), puis **segment hachuré** « Loyer 400,00 / à payer 25 nov. ».
  - **E2c écart** : bord pointillé vert (`g3a-ecart`) en haut de la colonne Dépensé, relié par un trait pointillé (`g3a-fil`) à la pastille.
  - **E2d colonne Matériel à part** : « Matériel 28,60 à part », pile hachurée bleue de 12 px (pas à l'échelle, valeur écrite).
  - **E2e pastille gain** : « +23,20 CHF gagnés » (30 px, bord vert) posée dans la colonne Entré, au-dessus du bouton « ✦ Pourquoi ? ».
- **E3 légende** : « payé / à payer » (carrés plein / hachuré).
- **E4 caisse** : « En caisse 4 181,60 CHF » ; barre « libre 3 721,60 | à payer 460,00 » (hachure rouge) ; chips « ● Solde atelier 60,00 [Payer] » (point rouge = en retard) et « Loyer 400,00 [Payer] ».
- **E5 litre** : « Pale Ale · 27 L nets · tout compris · estimé » + « 7,51 CHF/L » + bouton « + » (coût d'un autre brassin).
- **E6 ligne repliée « Fournisseurs, matériel »** (chevron bas). **E7 ligne « ✦ Compagnon brasseur ›»**.
- **E8 feuille « Pourquoi si peu ? »** (état g3a-etat.png) : titre, pastille « exemple », 3 lignes de phrase, barre de parts (Loyer 56 % · électricité · Brassage 26 % · nettoyage · gain), ligne « Source : Opérations de novembre (6 lignes). Le calcul ne vient pas de l'IA ; elle le raconte. »
- Desktop (≥ 900 px) : scène à gauche (1,1 fr), caisse + lignes à droite (1 fr), écart 40 px.
- Cadre commun (pas à moi) : en-tête App, rail Synthèse/Opérations/Prévisions/Annuel, barre du bas, bouton +.

États (annexe de la maquette, NOTE.md) :
- **S1** mois avec vente, un impayé (la maquette).
- **S2** mois **sans vente** (octobre) : colonne Entré en pointillé, « 0,00 » écrit, dépensé 28,00, pastille **« Perdu −28,00 »** rouge.
- **S3** **tout payé** : plus aucune hachure, légende « à payer » absente.
- **S4** feuille « Pourquoi ? » ouverte. S5 période « tout ».
États que la maquette n'a pas et que le code impose (rangés dans un état de la maquette, pas un composant neuf, L03) :
- **S6** aucune écriture du mois : S2 sans dépensé (« 0,00 » des deux côtés, pastille absente, une ligne « Aucune écriture en novembre »).
- **S7** solde de départ inconnu : « En caisse À compléter », pas de barre (l'inconnu n'est jamais 0), chip « Renseigner le solde » (BE-72 : « Solde saisi : X, à confirmer »).
- **S8** libre négatif (à payer > caisse) : barre entièrement hachurée rouge, « libre −X ».
- **S9** pas de brassin estimé : la ligne E5 devient « Estimer un brassin » avec son « + ». Brassin estimé mais litre non calculable (`coutLitre` = null) : « À compléter » à droite, jamais 0.
- **S10** à encaisser (vente non payée) : même langage que l'à-payer (hachuré vert dans Entré, chip « Encaisser »).

## 3. L'ancien écran, élément par élément : sort (« Remplacer, jamais fusionner »)
| Ancien (code) | Sort |
|---|---|
| `finance-bar` h2 « Synthèse » + sous-onglets Situation/Coûts (`FinancesTab.tsx:117-122`) | **supprimé** pour la vue Synthèse (la barre reste pour Opérations et Annuel, `view!=='forecast'` devient `view!=='forecast'&&view!=='overview'`) |
| ⚙ « Solde et paramètres financiers » (`ProfileSheet`) | **second plan** : l'en-tête « En caisse » est un bouton (`aria-label` « Solde et paramètres financiers ») qui ouvre `ProfileSheet` ; « Renseigner le solde » en S7. Listé §8 (compromis 1) |
| Trésorerie + note (`FinanceOverview.tsx:37-44`) | **remplacé** par E4 (même donnée `ledger.cashCents`, mêmes notes S7) |
| Seuil TVA (`:46-52`) | **second plan** : ligne « À vérifier · n » (§4, F8) |
| « Pour une situation fiable » (3 tâches, `:54-65`) | **second plan** : même ligne « À vérifier · n », dépliée |
| « Règlements à suivre » (4 lignes + Payer/Encaisser, totaux, « Tout voir ») | **remplacé** par les chips d'E4 (les 2 plus proches, « + n » = « Tout voir » vers Opérations `filter:'due'`) ; les totaux « à payer / à encaisser » restent boutons nommés dans le pied de la caisse |
| « Origine et limites des montants » (`:85`) | **second plan** : dans « À vérifier » |
| Période : ‹ mois › + « Tout l'historique » (`FinancePeriodBar`, `MonthStepper`) | **remplacé** par E1. Mois plus anciens : plus de sélecteur (compromis 2, §8) |
| « Dépenses nettes » + écart sur le mois précédent | **supprimé** : l'écart vs le mois précédent n'est pas dans la maquette ; l'écart qui compte est « gagné » |
| « Répartition des dépenses » (`CostComposition`, légende %, clic → Opérations par catégorie) | **remplacé** par la pile E2b ; le clic par segment (→ Opérations, `category`, `month`) est **conservé** : chaque segment est un bouton « Brassage 186,80 CHF, voir ces opérations » |
| « N pièces avec une date à corriger » | **second plan** : « À vérifier » |
| « Coût des brassins » (≤ 6) + « Estimer un brassin » | **remplacé** par E5 (le dernier brassin estimé) ; le « + » ouvre le sélecteur existant `budgetPicker` (la liste des autres estimations n'est plus visible : compromis 3) |
| « Principaux fournisseurs » (≤ 5) | **second plan** : dans la ligne repliée E6 |
| « Investissements et matériel » (`UpgradeAnalytics`) + sa phrase d'aide | **second plan** : dans E6 ; la phrase « Un achat de matériel s'enregistre… » est supprimée (le + est dans l'App) |
| `FinanceAssistant` (carte « Comprendre mes dépenses ») | **remplacé** par E7 (ligne `✦ Compagnon brasseur ›`), qui ouvre le même `BrewerChat` (scope `app/finances`), question préparée jamais envoyée seule |
| `CostComposition.tsx`, `FinancePeriod.tsx` (`MonthStepper` utilisé aussi par `TransactionJournal`) | **non supprimés** (hors Possède, d'autres les utilisent ; `CostComposition` devient orpheline : listée §8) |

## 4. Changements : fichier, fonction
Domaine pur : **`src/domain/finance/periodeSynthese.ts`** (neuf, ajouté au Possède par le pilote, DECISIONS D2 ; ÉCRIT ET TESTÉ : `tests/unit/periodeSynthese.test.ts`, 31 verts). Il remplace `calcul.ts` partout dans ce plan (`periodeSynthese`, `echelle`, `explication`, `ordrePile`, `regrouperPetits`) ; Opérations (uo) l’importe. Centimes entiers, `null` pour l'inconnu, aucune horloge (la date du jour est un paramètre).

1. `calcul.ts › periodeSynthese({ transactions, payments, mois: 'AAAA-MM' | null, aujourdhui })` → `{ entreCents, depenseCents, gainCents, materielCents, entre: { payeCents, aEncaisser: Reste[] , libelle }, postes: Poste[], aPayer: Reste[], lignes, sansDate, aConfirmer }`.
   - Pièces retenues : `isActiveTransaction`, `isoDate(date)` commence par `mois` (ou toutes si `null`) ; pièce sans date → `sansDate` (jamais comptée dans une période, dite dans « À vérifier »).
   - Sens (reprend `FinancesTab.tsx:83-84`, `ledger.ts:transactionKind`) : `expense` et avoir sortant→entrant (`refund` + `transactionDirection==='in'`) = charges ; `income` et avoir `out` = entrées (moins) ; `contribution` et `withdrawal` **exclus** (ni vente ni charge) ; archives : un avoir ne dessine jamais de segment négatif, il diminue `depenseCents` (ou `entreCents`) et se dit dans « À vérifier ».
   - Répartition en catégories d'une charge : `lines[].category ?? (equipment→materiel, cleaning→nettoyage, ingredient|packaging→brassage, sinon tx.category)` (logique de `FinancesTab.tsx:86`), le **reliquat** (`montant − Σ lignes`, TVA, transport, remise) va à `tx.category` : la somme des postes = la somme des montants **au centime** (invariant testé).
   - **Matériel à part** : lignes `kind==='equipment'` avec `capitalTreatment!=='expense'` ; sans lignes : catégorie `materiel` ou `renovation` (règle de la maquette, qui diffère de l’Annuel : §10 US-2). Exclu de `depenseCents` et du gain.
   - Payé / à payer : `paymentState(tx, payments, transactions, aujourdhui)` ; `remainingCents` = hachuré de cette pièce (borné à la part non-matériel) ; état `unknown` = compté plein, nommé dans `aConfirmer` (jamais devenu 0, jamais supposé impayé) ; hachure par pièce : `{ id, libelle, restantCents, echeance|null }`.
   - Gain = `entreCents − depenseCents` ; `null` n'existe pas ici (une période vide = 0 écriture, `lignes === 0`, état S6).
2. `calcul.ts › echelle(entre, depense, hauteur)` → hauteurs de pile et d'écart sur **une seule échelle** (la plus grande des deux colonnes = `hauteur`), écart minimum 10 px (la maquette dessine 23,20 sur 720 en 10 px : distorsion ≤ 7 px, assumée et écrite).
3. `calcul.ts › explication(periode)` → la phrase et la barre de parts de E8, **par gabarit** (aucun appel IA) : poste dominant, sa part de l'entré, deuxième poste, gain. Aucune projection (« une deuxième vente… » de la maquette est une promesse : non retenue, §8). Parts arrondies sans jamais « 0 % » pour une dépense réelle (règle de `CostComposition.tsx:8`).
4. `calcul.ts › litreDuDernierBrassin({ plans, batches })` → `{ titre, litres, complet } | null`. Source : `plans.filter(p => p.brewEstimate)`, dernier par `createdAt` et un par brassin/recette (`FinancesTab.tsx:95`) ; `troisNotions(snapshot)`, `litresNets({ conditionneL: batch?.volumePackagedL, netEnregistreL: netVolumeSaisi(snapshot) })`, `coutLitre({ notions, litres })` (même appel que `BrewBudgetSheet.tsx:71,127-128` et `brewForecast.ts:157,226-228`) ; le chiffre affiché est `affiche.complet`. Instantané ancien (`troisNotions` = null) ou litres inconnus → « À compléter ». Nombres du domaine, jamais recalculés (règle du pilote : le 7,51 est dans le domaine, pas dans l'écran).
5. `synthese/Scene.tsx` (E2 + E3), `synthese/Caisse.tsx` (E4), `synthese/LigneLitre.tsx` (E5), `synthese/Replie.tsx` (E6 + « À vérifier »), `synthese/Pourquoi.tsx` (E8, dans `ui/Sheet`), `synthese/LigneCompagnon.tsx` (E7), `synthese/Periode.tsx` (E1). `src/ui/finance/synthese.css` : classes préfixées `syn-` (L26), couleurs de catégorie = les jetons déjà portés `--c-56c1d2`, `--c-d2b356`, `--c-9856d2`, `--c-567bd2`, `--c-d27b56`, `--c-56d27b` (`finance.css:86-94`, `couleurs-portees.css` clair **et** cave) : pas de hex en dur, hachures par `repeating-linear-gradient` mélangées au fond (`color-mix`) pour tenir en cave.
6. `src/ui/finance/FinanceOverview.tsx` : **réécrit** — devient la composition de la Synthèse. Nouveau contrat de props : `{ transactions, payments, plans, batches, recipes, ledger, tvaThreshold, openingCashReady, openingCash, undatedCount, month, allDates, onPeriod, onProfile, onJournal, onTransaction, onPayment, onOpenBudget, onBudgetPicker, onUpgrade, onBrowseProjects, plansProjets… }` (liste exacte fixée au code, mêmes callbacks qu'aujourd'hui). Plus aucun JSX de l'ancien (`finance-position`, `finance-completion`, `finance-settlement-*`).
7. `src/components/tabs/FinancesTab.tsx` : supprime `overviewPart`, `expenses`, `totals`, `sum`, `vendors`, `previousMonth`, `previousKey`, `previousTotal`, `isCost`, `costSign`, `snapshots` (migrent dans `calcul.ts`), la branche `view==='overview'&&overviewPart==='costs'` entière, les imports devenus morts (`CostComposition`, `FinancePeriodBar`, `MonthStepper`, `monthLabel`, `shortDate`, `Plus`, `CalendarDays`, `Wheat`, `Wrench`, `Check`, `X`, `compte`, `transactionAmount`, `transactionKind`, `transactionDirection`, `transactionVendor`, `UpgradeAnalytics`, `nombreFr` si plus utilisé, `CATEGORY_LABELS` si plus utilisé — vérifié au `tsc`). Conserve : états `month`/`allDates`, `budgetPicker`, `budget`, `BrewBudgetDialog`, `upgrade`, `showProjects`. N'édite **aucune** autre branche (journal, forecast, annual) ni leurs lignes ; seule la ligne de la barre (`view!=='forecast'`) change. `assistantView` : `'costs'` n'est plus atteint pour overview (la valeur `'costs'` reste dans `FinanceAssistant`, hors Possède).
8. Ligne « À vérifier · n » (E6 bis, n'existe que si n > 0) : seuil TVA (`tvaThreshold.level !== 'ok'`, message conservé mot pour mot, lien « Voir les ventes »), solde de départ à vérifier, paiements à confirmer (`ledger.unknownPaymentCount` → `filter:'unknown'`), pièces sans date (→ `filter:'review'`), avoirs non dessinés, `ledger.warnings` (« Origine et limites »). À 0 : la ligne est absente, l'écran est celui de la maquette.

## 5. Tests qui échouent d'abord (`tests/integration/synthese*.test.tsx`, fixtures, Gemini simulé : aucun appel)
Fixture = la démo de la maquette (`src/dev/financeDemo.ts:24-29`, mêmes montants) construite à la main dans le test.
| n | Données | Attendu (rouge aujourd'hui : l'écran n'a ni recettes ni résultat) |
|---|---|---|
| T1 | vente 720 payée ; nettoyage 42, brassage 186,80, électricité 68 payés ; loyer 400 non payé ; joints 28,60 (`materiel`) ; période = mois courant | `entreCents=72000`, `depenseCents=69680`, `gainCents=2320`, `materielCents=2860`, hachuré = [loyer 40000] ; invariant Σ postes + matériel = Σ montants des charges |
| T2 | idem, DOM | texte « +23,20 », « Entré 720,00 », « Dépensé 696,80 », « Matériel 28,60 à part », segment « Loyer 400,00 » avec « à payer 25 nov. », légende « payé » et « à payer » |
| T3 | mois sans vente, 28,00 de « divers » payés | `entreCents=0`, colonne Entré en pointillé, « 0,00 », pastille « Perdu −28,00 », aucune hachure, pas de légende « à payer » (S2, S3) |
| T4 | facture mixte 100 : lignes `equipment` 60 (capital) + `ingredient` 40 + TVA hors lignes 10 (total 110) | matériel 6000 ; brassage 4000 ; reliquat 1000 sur `tx.category` ; somme = 11000 (au centime) |
| T5 | facture de 3 lignes à tiers (33,33 / 33,33 / 33,34) à 100,00 avec paiement partiel 40,00 | hachuré = 6000 exactement ; payé + hachuré = 10000 ; pas d'arrondi dérivant |
| T6 | avoir sortant (fournisseur) de 20 sur une charge de 150 | `depenseCents=13000`, aucun segment négatif, ligne « À vérifier » le dit |
| T7 | apport privé 500 + prélèvement 200 dans le mois | exclus de entré et dépensé (ni vente ni charge) |
| T8 | pièce sans date | absente des colonnes, comptée « 1 pièce » dans « À vérifier » |
| T9 | paiement inconnu (`paymentState` = `unknown`) | compté plein, nommé dans « Paiements à confirmer », jamais hachuré |
| T10 | solde de départ absent / saisi non confirmé | « En caisse » + « À compléter », pas de barre ; saisi : « Solde saisi : 1 000,00 CHF, à confirmer » visible (reprend `soldeDepartVisible`) ; jamais « 0,00 » |
| T11 | caisse 4181,60, payables 460 | libre 3721,60, bouton « Voir les factures à payer » (même nom accessible qu'aujourd'hui) → Opérations `payable` ; caisse 100 et payables 460 → « libre −360,00 » (S8) |
| T12 | chip « Solde atelier » échu avant aujourd'hui | point rouge + nom accessible « en retard » ; bouton « Payer » ouvre `PaymentSheet` ; une vente à encaisser → bouton « Encaisser » |
| T13 | période : segment `sept. oct. nov. tout` | `aria-pressed` suit ; « tout » somme toutes les dates ; le titre suit |
| T14 | clic sur segment « Brassage » | ouvre Opérations avec `category=brassage` et le mois (parcours de `financePeriodDrilldown`, adapté) |
| T15 | brassin estimé (snapshot complet, 27 L nets) | ligne « Pale Ale · 27 L nets · tout compris · estimé » et `coutLitre().affiche.complet` mis en CHF/L ; snapshot ancien → « À compléter », jamais « 0,00 » ; aucun snapshot → « Estimer un brassin » ; « + » ouvre « Quel brassin veux-tu estimer ? » |
| T16 | ligne « Fournisseurs, matériel » | repliée (`aria-expanded=false`) ; dépliée : fournisseurs (≤ 5) et `UpgradeAnalytics` ; clic fournisseur → Opérations `query` |
| T17 | « ✦ Pourquoi ? » | feuille titrée, phrase par gabarit avec les vrais montants (loyer 400 = 56 % de 720 si loyer dominant : le test le calcule depuis la fixture, pas depuis la maquette), barre de parts dont la somme = 100 %, ligne source « Opérations de novembre (N lignes) », aucune pastille « exemple » ; × ferme |
| T18 | « ✦ Compagnon brasseur » | ouvre `BrewerChat` (mocké) avec question préparée, non envoyée |
| T19 | aucun résidu de l'ancien | absence de « Situation », « Coûts », « Règlements à suivre », « Dépenses nettes », `.finance-subnav` ; un seul `h2`/titre de période dans la vue |
| T20 | `echelle()` | les deux piles sur la même échelle ; écart ≥ 10 px ; pas de NaN avec entré = dépensé = 0 |
Les tests T1, T3-T9, T20 sont de pures fonctions (Vitest, centimes) ; T2, T10-T19 rendent l'écran dans jsdom. Les captures (390 tactile et 1280, clair et cave, côte à côte avec la maquette, états S1-S4 et S7) viennent à l'étape 2, sur `?dev-local&finance-demo`, **ouvertes**.

## 6. Appelants hors Possède, grep `src/` `tests/` `scripts/`, rejoués sur HEAD
`FinancesTab` : seul appelant `src/App.tsx:964` (props inchangées : `transactions, openTransactionRequest, recipes, batches, stockItems, budgetLines, config, globalTimeFilter, onOpenStockItem, onOpenRecipe` ; `onOpenSale` n'est pas passé). `FinanceOverview` : seul `FinancesTab.tsx:125` + `tests/integration/soldeDepartVisible.test.tsx:4`.
Tests existants rejoués sur HEAD (`voies/us/tests-head.txt`) : **9 fichiers, 95 tests, tous verts** (`financeWorkspace`, `mobileDailyViews`, `soldeDepartVisible`, `equipmentProjects`, `fix114`, `financeArchives`, `previsionsEcran`, `dashboardNavigation`, `financeAnnuelSaisie`). `tests/ux-mobile/financePeriodDrilldown.test.tsx` n'est pas chargé par `vitest.config.ts` (0 occurrence dans la sortie : L11, « test non chargé » ≠ vert) → il se lancera à la main (`npx vitest run --config` explicite ou chemin forcé) à l'étape 2 ; noté.

Ceux qui **changent** (la maquette remplace l'écran ; chacun est dans mon périmètre « tests d'intégration des fichiers possédés », je ne touche que leurs `it` Synthèse) :
| Fichier | `it` concerné | Changement |
|---|---|---|
| `tests/integration/soldeDepartVisible.test.tsx` | tout (23 l.) | nouveaux props de `FinanceOverview`, même assertion « Solde saisi : …, à confirmer » |
| `tests/integration/financeWorkspace.test.tsx` L23-44, L74-78 | « arrive sur une synthèse commune… », « ne redemande pas le solde… » | `getByLabelText('Situation financière actuelle')` → bloc « En caisse » ; « Trésorerie » → « En caisse » ; les boutons « Voir les factures à payer » / « …à encaisser » **gardent leur nom** (pied de la caisse) |
| idem L155-181 | « déduit les avoirs des coûts… », « ouvre les coûts puis retrouve une facture mixte… », « conserve une pièce sans date… » | plus de clic « Coûts » : `Autres frais 130` → segment « Divers/Autres frais 130,00 » ; ligne matériel → « Matériel … à part » ouvre Opérations ; « 1 pièce avec une date à corriger » → « À vérifier » |
| `tests/integration/equipmentProjects.test.tsx` L125-127, L143-145 | deux parcours | plus de « Coûts » ; « Investissements et matériel » → ligne « Fournisseurs, matériel » (à déplier) |
| `tests/integration/mobileDailyViews.test.tsx` L111 | position visible | `Situation financière actuelle` → « En caisse » |
| `tests/ux-mobile/financePeriodDrilldown.test.tsx` L138-146 | parcours de `CostComposition` | « Coûts » retiré ; garde `/Brassage.*Voir ces opérations/` |
| `tests/ux-mobile/finance.browser.mjs` L155-156 | script Chrome | `.finance-subnav button 'Coûts'` retiré |
| `scripts/agents/inventaire-ecrans.mjs` L125-126 | `zone` de « finances-synthese » | déjà périmé sur HEAD (`overviewPart`, `forecastPart` n'existent plus) ; hors Possède : **listé au pilote**, pas édité |
Inchangés (rien de Synthèse dans leurs assertions) : `fix114`, `financeArchives`, `previsionsEcran`, `dashboardNavigation`, `financeAnnuelSaisie`.

## 7. Le Bord (DashboardTab) : lecture seule, contradictions listées
- `DashboardTab.tsx:160-162,301-302` : « Résultat de la période » = `periodLedger.incomeCents − periodLedger.expenseCents` (via `summarizeLedger`, TTC, matériel **compté en charge**, apports exclus, `periodTxs` = la période globale de l'App, pas un mois civil) → **contredit** la Synthèse (matériel à part). Sur la démo : Bord = 720 − 725,40 (dont joints 28,60) = −5,40 ; Synthèse = +23,20. Déjà au diagnostic (P2). Je ne touche pas ; au pilote : aligner le Bord sur `periodeSynthese` (qui deviendrait une fonction du domaine) ou le libeller « avant matériel ».
- `ledger.expenseCents` ne sépare ni matériel ni impayé : c'est l'origine de la contradiction, hors Possède.

## 8. Risques, compromis, décisions (le pilote tranche ; aucune n'est bloquante)
Risques (données existantes, hors ligne, arrondis) :
- **Données anciennes** : pièces sans `finance` (héritage) → `transactionKind`/`transactionAmount` ont déjà des replis (`ledger.ts:62-75`) ; les pièces à catégorie `materiel` sans lignes sont rangées « à part » (comme l'Annuel) : un malt mal classé `materiel` sortira du « dépensé ». Dit dans « À vérifier » seulement si le registre manque, comme `annual.ts:133`.
- **Hors ligne** : tout est local (Dexie via `useStorageValue`), aucun appel réseau ; le Compagnon et « Demander au compagnon » dépendent de BrewerChat (déjà tolérant hors ligne). Gemini n'est jamais appelé.
- **Arrondis** : centimes entiers de bout en bout ; la répartition des restes se fait au plus fort reste (T4, T5) ; un seul arrondi, à l'affichage. Les parts du « Pourquoi ? » arrondies sans « 0 % ».
- **Un double clic** : aucune écriture dans cet écran sauf via `PaymentSheet` (existant) : rien à protéger.
- **Mélange TTC** : l'écran est en TTC (comme le journal et le Bord) ; pour un assujetti à la TVA les deux colonnes sont TTC : dit en une ligne dans « À vérifier » seulement si `vatRegistered` (limite, pas de calcul HT inventé).
- **Cumul de périodes** : « tout » additionne toute l'histoire (archives comprises ? non : `active` seulement, comme avant ; les années archivées restent dans l'Annuel).
Compromis (« 99 % mini maquettes » : rares, listés pour RESULTAT.md) :
1. ⚙ absent de la maquette : l'en-tête « En caisse » le remplace (bouton sans changer le visuel). Alternative : un petit ⚙ à droite de « En caisse ».
2. Pas de sélecteur de mois précis (la maquette n'en a pas) : seulement les trois derniers mois + « tout » ; un mois plus ancien se lit dans Opérations. Perte réelle par rapport à `MonthStepper`.
3. La liste « Coût des brassins » (≤ 6) n'a plus de place : un brassin visible (le dernier estimé) + « + » vers le sélecteur.
4. La colonne Entré hachurée « à encaisser » (S10) et la ligne « À vérifier · n » n'existent pas dans la maquette ; elles reprennent son langage (hachure, ligne de 44 px) et n'apparaissent que si nécessaires.
5. « ✦ Pourquoi ? » : la maquette montre une réponse IA « exemple ». Ici la phrase est **calculée** (gabarit) et sa source dite ; pas de pastille « exemple », pas de projection (« une deuxième vente resterait presque entière » inventerait). Un lien « Demander au compagnon » ouvre BrewerChat avec la question préparée. Écart assumé : pas d'appel IA payant dans l'écran.
6. Écart dessiné : la hauteur minimale de 10 px (maquette) déforme l'échelle de ≤ 7 px quand le gain est petit.
Décision à prendre, pour le pilote : **(D1)** « Électricité » et « Loyer » de la maquette sont des libellés de pièces : le code range par catégories (`Charges fixes`). Je garde les catégories pour les parties payées et le libellé de la pièce pour la partie hachurée (le loyer est nommé, l'électricité payée apparaît dans « Charges fixes »). Recommandation : accepter ; l'autre option (une ligne par pièce) casserait l'échelle dès 10 pièces.
**(D2)** Faut-il remonter `periodeSynthese` dans `src/domain/finance/` pour que le Bord et l'Annuel l'appellent (P2) ? Recommandation : oui, après cette voie (hors Possède).

## 9. Hors périmètre
Opérations, Prévisions, Annuel ; `TransactionJournal` et `FinancePeriod.tsx` (utilisé par le journal) ; `CostComposition.tsx`, `UpgradeWorkspace.tsx`, `FinanceAssistant.tsx`, `BrewBudget*` (réemployés tels quels ou orphelins) ; le Bord ; le cadre commun (rail, barre, +) ; le schéma, Firestore, Drive, TVA, impôt ; écriture de paiements (reste `PaymentSheet`) ; IBAN jamais lu ; aucun commit, pas de `git stash`.

## 10. Revues A et B et décisions du pilote : constat par constat (09.11)
Décisions du pilote (DECISIONS.md) : D1 accepté ; D2 = `src/domain/finance/periodeSynthese.ts` ; compromis §8 acceptés et listés au brasseur ; FinancesTab fournit à uo `onAddProof`, `onPay`, `assistant`.
| Constat | Sort | Raison, et ce qui change |
|---|---|---|
| A US-1 (B) un seul calcul | **retenu, fait** | `periodeSynthese.ts` posé et testé avant le reste ; uo l'importe. Périmètre : **mois strict** (les ouvertes d'autres mois ne sont pas dans les piles ; elles restent dans les chips de la caisse). Test commun « Synthèse `depenseCents` = légende d'Opérations » : côté uo, sur la fixture de `tests/unit/periodeSynthese.test.ts` (démo de la maquette) |
| A US-2 / B 1 (B) matériel « comme l'Annuel » | **retenu, fait** | phrases corrigées (§1, §4). La règle est celle de la maquette (28,60 à part) ; l'Annuel la diffère (registre, `businessUsePct`). Écart écrit dans l'en-tête du module, test croisé `buildAnnualReport` (deux `it` : ligne `equipment` identique ; pièce `materiel` sans ligne divergente), et `aVerifier.materielSansRegistre` dit « à part sans registre » dans « À vérifier » |
| A US-3 / B 2 (B) avoirs | **retenu, fait** | `refundLinkIssue` → exclu et nommé (`avoirsInvalides`) ; l'avoir réduit le poste de sa facture (ou le matériel) ; poste écrêté à 0, excédent dans `avoirsNonDessinesCents` ; imputé : la facture d'origine garde son reste réduit par `paymentState`, l'avoir ne touche pas le hachuré (test : dépensé 130, hachuré 130, payé 0) ; avoir client `out` réduit l'entré ; en-tête = Σ des segments dessinés. Tests T6 à T6f écrits |
| A US-4 (G) libellé Entré | **retenu, fait** | 1 vente → son libellé, n → « n ventes », 0 → `null` ; légende « à encaisser » seulement s'il y en a |
| A US-5 (G) perte avec entré > 0 | **retenu, fait** | état S2b : écart pointillé **rouge** posé en haut de la colonne la plus courte (Entré), « Perdu −X » rouge, la colonne la plus haute = l'échelle ; gain nul : « 0,00 », « ni gain ni perte » (`signe:'nul'`) ; `echelle` testée (gain, perte, perte sans vente, nul, vide, pas de NaN) ; `explication` ne divise pas par zéro et ne donne pas de parts en perte |
| A US-6 (G) ordre de la pile et petits postes | **retenu, fait** | ordre réel de g3a : petits postes (croissant), charges fixes, hachurés en bas (`ordrePile`) ; `regrouperPetits` (< 3 % du dépensé → « Autres frais ») ; hachuré par pièce, couleur de sa catégorie dominante ; l'écart « Électricité 68,00 » → « Charges fixes » est **listé dans RESULTAT.md pour le brasseur** |
| A US-7 (G) « tout » et archives | **retenu** | « tout » inclut ce que reçoit l'écran (années archivées comprises, comme l'ancien « Tout l'historique ») ; le titre dit « Tout l'historique » ; test d'une pièce de 2024 dans « tout » |
| A US-8 (G) seuil TVA | **retenu** | niveau `over` : rangée rouge VISIBLE hors repli, `role="alert"`, message conservé mot pour mot, lien « Voir les ventes » → Opérations `recettes` ; niveau `warn` : `role="status"` dans le bloc « À vérifier » |
| A US-9 (G) BE-72 | **retenu** | sous « En caisse » : « Solde de départ saisi : X, à confirmer » ET « Solde saisi : X au jj.mm.aaaa, pas encore confirmé. Coche « J'ai vérifié ce solde ». » ; « Solde de départ à renseigner » ; `soldeDepartVisible.test.tsx` garde ses assertions, seules ses props changent |
| A US-10 (D) / B 4 (G) FinancesTab et uo | **retenu en partie** | j'ajoute les trois props à la branche journal **dès que `TransactionJournal` les déclare** (sinon `tsc` échoue : uo n'a pas encore codé). Ordre : uo déclare, puis us câble. Sinon la ligne exacte à poser est dans RESULTAT.md (N1). La `finance-bar` de la vue Opérations reste jusqu'au port de v6b (à retirer avec N1, en gardant le ⚙) |
| A US-11 (D) fil du gain | **retenu** | le fil se dessine en pixels à partir de `echelle()` (haut de l'écart), pas en coordonnées fixes ; captures à gain faible et fort, 390 et 1280 |
| A US-12 (D) inconnu dessiné payé | **retenu** | légende « n à confirmer » quand `paiementsAConfirmer` > 0, en plus de « À vérifier » |
| A US-13 / B 7 (D, G) litre | **retenu en partie** | je ne peux pas exporter une fonction de `brewForecast.ts` (hors Possède). La ligne litre n'ajoute aucun calcul : mêmes trois appels de domaine (`litresNets`, `troisNotions`, `coutLitre`) que `BrewBudgetSheet.tsx:71,127` et `brewForecast.ts:157,226`, mêmes entrées (conditionné > net saisi, jamais le volume à brasser). Test d'égalité côté écran : le CHF/L affiché = `coutLitre(...).affiche.complet` du même instantané |
| A US-14 (D) Compagnon | **retenu** | je réemploie `FinanceAssistant` (question préparée, jamais envoyée seule), restylé en ligne « ✦ Compagnon brasseur › » par `synthese.css` ; plus de ligne E7 à part (§4 point 5 : `LigneCompagnon.tsx` supprimé) |
| B 3 (B) tests partagés | **retenu** | **us est propriétaire** de `financeWorkspace.test.tsx` et `mobileDailyViews.test.tsx` pour les `it` Synthèse ; uo donne ses adaptations en liste, par tranches de lignes disjointes. « Confirmer les paiements » (L35, 80, 85, `toBeVisible`) : le bloc « À vérifier » n'est **pas replié** quand n > 0 (rangées de 44 px visibles ; seul « Origine et limites » est replié). Le §3 « replié » est corrigé : zéro point = ligne absente |
| B 5 (G) duplication | **retenu** | = US-1 |
| B 6 (G) chemin du domaine | **retenu, fait** | `src/domain/finance/periodeSynthese.ts` et `tests/unit/periodeSynthese.test.ts` ; §4 et §5 lisent ce chemin |
| B 8 (D) fenêtre de périodes | **retenu** | trois mois finissant au mois courant (le mois courant reste toujours visible) ; un mois choisi plus ancien prend la place du premier ; l'étiquette ajoute l'année si ce n'est pas l'année en cours |
| B 9 (D) `tests/ux-mobile` non chargé | **retenu** | `financePeriodDrilldown.test.tsx` est adapté (sans « Coûts ») mais n'est pas chargé ; le même parcours (segment de catégorie → Opérations) est rejoué dans `tests/integration/synthese.test.tsx` (T14) |
| B 10 (D) horloge | **retenu** | les tests de rendu fixent la date (`vi.useFakeTimers({ toFake: ['Date'] })`, `vi.setSystemTime('2026-11-09T10:00:00Z')`) ; la fonction pure prend `aujourdhui` en paramètre |
