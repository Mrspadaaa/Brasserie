# PLAN : voie t1-onglets (Opérations, Synthèse et Prévisions disent les mêmes nombres)

Auteur : Sonnet, 31.10. Premier temps : aucune ligne de code écrite, aucun test lancé. Sources lues : `diagnostic/d2/DIAGNOSTIC.md` (TA2 à TA6,
§ 2.3), `mesure-onglets.ts`, `ledger.ts`, `forecast.ts`, `TransactionJournal.tsx:170-260`, les trois tests finances, et par `grep` tous les
appelants. Les numéros de ligne sont ceux d'aujourd'hui.

## 0. Ce que ce plan demande au pilote avant le code (3 décisions, détail en § 6)

1. **Sortir du « Possède » une ligne** : `src/components/tabs/FinancesTab.tsx:76` (passer une option à `summarizeLedger`). Sans elle, TA3 ne
   peut pas atteindre la Synthèse sans fausser le bilan annuel (§ 1, TA3).
2. **Un test hors « Possède » casse** : `tests/ux-mobile/financePeriodDrilldown.test.tsx:86` (TA4). Autoriser une retouche de sa fixture, ou
   accepter un test rouge.
3. **Le test existant `finance.test.ts:71-79`** (dans mon Possède) change de catégorie (TA6) : fait avec ton accord implicite, dit ici.

## 1. Défauts visés, causes et changements

Quatre défauts : TA2, TA3, TA4, TA6. Aucun autre (TA1 et TA5 sont de l'interface, hors périmètre).

### TA2 : compteur de « Tout » qui compte les annulées (`TransactionJournal.tsx`)
- Cause : `matchesState` (`:184-188`) garde les annulées hors périmètre « courantes » ; `count={compte(filtered.length,'opération')…}` (`:253`)
  compte toute la liste, alors que `netCents` (`:230-233`) exclut les annulées. Compteur et somme ne portent pas sur les mêmes lignes.
- Changement, **uniquement le texte du compteur** : calculer `voidedCount = filtered.filter(e => !isActiveTransaction(e.transaction)).length` et
  `activeCount = filtered.length - voidedCount`. Texte :
  - cas normal : `2 opérations` ; avec annulées : `2 opérations + 1 annulée` (`compte(voidedCount,'annulée')` : accord automatique, `plural.ts:40`) ;
  - filtre « Écritures annulées » (`filter==='void'`) : activeCount vaut 0, on dit seulement `1 annulée` (jamais « 0 opération + 1 annulée ») ;
  - la pagination `· 1–50 affichées` reste calculée sur `filtered.length` : elle compte les lignes affichées, annulées comprises (c'est vrai).
- Les annulées restent listées (aucun filtre ne change). Périmètre « courantes » : elles n'y sont déjà pas, donc aucun « + N annulées » inutile.
- Pas de nouveau composant ni de nouvelle classe CSS : une chaîne dans la prop `count` existante de `FinancePeriodBar`.

### TA3 : « à payer » de la Synthèse ignore les pièces datées dans le futur (`ledger.ts`)
- Cause : `summarizeLedger` fait `if (date > asOf) return;` (`:110`) avant le calcul des restes ; `buildForecast` (`:61`) place la même pièce à son
  échéance (« Factures à régler »). Sonde A : 0 contre 5 000 centimes.
- **Piège trouvé par la lecture des appelants** : `summarizeLedger` sert aussi au bilan annuel (`annual.ts:141`, avec `asOf = fin d'exercice`,
  qui nourrit `payablesCents`/`outstanding` de la clôture fiscale `fribourgTax.ts:53,68-69`), au tableau de bord (`DashboardTab.tsx:155,157`)
  et à l'assistant (`assistantContext.ts:60,173`). Une dette datée **après** la fin d'exercice n'est pas une dette de cet exercice : changer la
  règle par défaut fausserait le bilan et les tests `fribourgTax.test.ts:88-89`, `financeArchiveContinuity.test.ts:74`, `financeRefunds.test.ts`.
- Changement (additif, par défaut inchangé) : `summarizeLedger(transactions, payments, profile, asOf = todayISO(), options: { includeScheduled?: boolean } = {})`.
  Avec `includeScheduled: true` seulement, une pièce **active, datée après `asOf`, d'état `unpaid` ou `partial`** (calculé par `paymentState(…, asOf)`,
  comme `buildForecast`) :
  - s'ajoute à `payablesCents` ou `receivablesCents` selon le sens (reste à payer/encaisser) ;
  - s'ajoute à `outstanding` (avec `dueDate`, `date` = date de la pièce), pour que le total et la liste de la Synthèse disent la même chose ;
  - ne change **ni** `incomeCents`/`expenseCents`/… (périodes passées), **ni** `cashCents`, **ni** `missingProofCount`, **ni** les avertissements,
    **ni** `cashComplete`, **ni** `unknownPaymentCount` : la trésorerie ne compte que les paiements faits (exigence de la consigne). Une pièce
    future d'état `unknown` est ignorée (comme dans `buildForecast`, sauf pièce liée à un plan : voir § 5 risque 4).
  - La date invalide, le montant invalide et l'avoir mal lié restent traités par le code existant (la pièce future n'est ajoutée que si sa date
    est valide et son montant entier ≥ 0) : aucun nouvel avertissement.
- `FinancesTab.tsx:76` passe `{ includeScheduled: true }` : **seul appelant qui change** (décision 1). Tous les autres gardent le défaut `false`.
- Règle unique, dite en une phrase : « une pièce active non soldée compte dans le reste à payer/encaisser dès qu'elle existe ; la Synthèse la montre
  à sa date, les Prévisions à son échéance ».
- Appelants et effet (tableau complet § 3).

### TA4 : pièce sans échéance placée aujourd'hui dans le premier mois (`forecast.ts`)
- Cause : `:61` `date = due && due > asOf ? due : asOf` + `:62` avertissement seul. Sondes B (date placée 2026-10-31) et E (vente de 300 CHF dans « Entrées
  prévues » du jour).
- Changement dans la boucle des pièces (`:56-64`) : si `!isoDate(tx.finance?.dueDate)` (absente **ou invalide**), la ligne ne va plus dans `items`/`months` ;
  elle va dans un nouveau tableau `undated` du résultat. Aucune date inventée (pas de +30 jours). Une échéance valide **passée** reste placée
  aujourd'hui comme avant : elle est réellement due, ce n'est pas une date inventée.
- Nouveau type et champs (ajouts seulement, facultatifs pour les lecteurs) :
  `UndatedForecastItem = { id, label, amountCents, direction, category, pieceDate: string | null, planId?, occurrenceId?, unconfirmed?: boolean }` ;
  `FinanceForecast.undated: UndatedForecastItem[]`, `undatedInCents`, `undatedOutCents` (sommes en centimes entiers). `unconfirmed` vaut `true` quand
  l'état de paiement est `unknown` (pièce liée à un plan), pour que l'écran ne la présente pas comme une dette sûre.
- L'avertissement reste (« Échéance à préciser : … ») mais sa fin change : « Montant placé aujourd'hui » (faux désormais) devient « Montant hors des
  mois prévus. » Aucun test existant ne cite ce texte (grep).
- **Plan lié à la pièce** (`:70-84`) : une pièce en attente sans échéance liée à un plan **ne remplace plus** l'occurrence du plan (sinon la dépense
  disparaîtrait des mois : sortie du mois par TA4 + déduite du plan par `invoiced`). Elle est écartée de `linked` pour le calcul de `invoiced`
  (fonction locale `isUndatedPending(tx)` : pas d'échéance valide **et** reste à payer > 0), et un avertissement dit « Facture sans échéance liée à
  « plan » : la prévision reste réservée. » Les sorties restent donc prudentes dans les mois ; les chiffres de `undated` sont à part et ne s'y
  additionnent pas. Pièce déjà soldée sans échéance : aucun changement (elle remplace le plan comme avant).
- Pas de repli « +30 jours ». `ForecastMonth` ne change pas ; `balanceCents` des mois **n'inclut plus** ces lignes (voir risque 2).

### TA6 : « Dépenses courantes » projette malt et houblon en charge mensuelle (`forecast.ts`)
- Cause : `isResidualExpense` (`:45-48`) accepte toute catégorie sauf `materiel`/`renovation` ; la boucle de tendance (`:100-122`) crée une ligne pour
  chaque catégorie vue sur les six mois. Sonde F : trois achats `brassage` de 100 CHF donnent 50 CHF par mois, 600 CHF sur 13 mois.
- Règle choisie (réversible, une ligne) : constante exportée `TREND_CATEGORIES: readonly string[] = ['chargesFixes']`. Dans la boucle, on ne
  garde que `categories.filter(c => TREND_CATEGORIES.includes(c))`. Pourquoi : `CATEGORY_LABELS` (`FinanceForms.tsx:12`) ne qualifie de récurrente que
  « Charges fixes » ; `brassage` est l'achat irrégulier visé ; `nettoyage` et `divers` sont d'une périodicité inconnue, donc écartés par prudence
  (ajouter une catégorie = ajouter son id à la liste). `isResidualExpense` **ne change pas** (seul `forecast.ts:97` l'utilise, mais elle est exportée).
- Avertissement quand des achats sont écartés ? Non : pas de nouveau texte ; la tendance disparaît simplement pour ces catégories (les plans de brassin
  `source:'brew'` et les budgets, eux, restent affichés par la boucle des plans).

## 2. Tests qui échouent d'abord (L13) : dossier `tests/unit/depense/onglets/`

Fixtures seules (modèle de `mesure-onglets.ts` : profil `openingCash 1 000 CHF confirmé 2026-01-01`, `historyCompleteFrom 2026-01-01`, `asOf = 2026-10-31`).
Aucun Gemini, aucune donnée réelle. Fichiers :

**`ta2-compteur.test.tsx`** (jsdom, même montage que `tests/integration/financeJournalUx.test.tsx:1-33`, mock `firebase` identique) :
1. Périmètre « Tout », 2 actives + 1 annulée : l'en-tête dit `2 opérations` et `1 annulée`, ne dit pas `3 opérations` ; les trois lignes sont listées. Échoue (`3`).
2. 2 annulées : `2 annulées` (accord). 3. Filtre « Écritures annulées » : `1 annulée`, pas `0 opération`. 4. Périmètre « courantes » avec une annulée : aucun « annulée » dans l'en-tête (elle n'est pas listée). 5. Zéro annulée : texte identique à l'actuel (`3 opérations`). Les cas 2 à 5 gardent le comportement ; seul le 1 doit échouer d'abord.

**`ta3-a-payer.test.ts`** (domaine) :
1. Sonde A : achat 50 CHF daté `2026-11-01`, échéance `2026-11-15`, `unpaid`, `asOf 2026-10-31` : avec `includeScheduled: true`, `payablesCents === 5000` et égal à la somme des items `source:'invoice'` `out` de `buildForecast` ; échoue (option inexistante, `0`).
2. Sans l'option : `payablesCents === 0` (le bilan annuel ne bouge pas) et `outstanding` vide.
3. Vente future 300 CHF `unpaid` : `receivablesCents === 30000` avec l'option ; égal aux items `in` de la prévision.
4. Pièce future `partial` (paiement de 20 CHF daté avant `asOf`) : reste 30 CHF dans les deux vues. 5. Pièce future `unknown` (sans statut) : 0 dans les deux. 6. Pièce annulée (`voidedAt`) : 0 dans les deux.
7. La trésorerie ne bouge pas : `cashCents`/`cashComplete`/`unknownPaymentCount`/`warnings` identiques avec et sans l'option. 8. Un paiement daté **après** `asOf` n'entre pas dans `cashCents` (inchangé).
9. Égalité à plusieurs jeux : un lot mêlant pièce passée, présente, future, partielle : `payablesCents + receivablesCents` (avec option) = somme des items `invoice` de la prévision.

**`ta4-sans-echeance.test.ts`** :
1. Sonde E : vente 300 CHF `unpaid` sans échéance : absente de `items`, absente de `months[0].incomeCents`, présente dans `undated` (`amountCents 30000`, direction `in`, `pieceDate '2026-10-25'`), `undatedInCents === 30000`. Échoue (placée `2026-10-31`).
2. Sonde B : facture 86,50 CHF `unpaid` sans échéance : `undated`, `undatedOutCents === 8650`, `months[0].expenseCents === 0`, avertissement « Échéance à préciser ». 3. Échéance invalide (`'31.02.2026'`) : traitée comme absente. 4. Avec échéance future : placée à cette date, hors `undated`. 5. Échéance passée : placée aujourd'hui, hors `undated`. 6. Pièce soldée sans échéance : ni items ni `undated`. 7. Aucune date inventée : aucun item dont la date vaut la pièce +30 j. 8. Pièce `unknown` liée à un plan : `undated` avec `unconfirmed:true`. 9. Pièce sans échéance liée à un plan récurrent : l'occurrence du plan reste dans le mois, avertissement « la prévision reste réservée » ; pièce soldée liée : l'occurrence est remplacée comme avant (non-régression). 10. Les montants restent des centimes entiers (somme de 3 pièces).

**`ta6-tendance.test.ts`** :
1. Sonde F : trois achats `brassage` de 100 CHF (juillet à septembre) : aucun item `source:'trend'`. Échoue (`60000`).
2. Trois achats `chargesFixes` : tendance présente (ancienne règle conservée, médiane inchangée). 3. Un jeu mêlé `brassage` + `chargesFixes` : seule `chargesFixes` produit une ligne. 4. `materiel`/`divers`/`nettoyage` : aucune. 5. `TREND_CATEGORIES` contient `chargesFixes`. 6. Un plan de brassin (`source:'brew'`) reste dans les mois (non-régression).

**Modification d'un test existant du Possède** : `finance.test.ts:71-79` (« médiane de mois complets… ») fabrique trois achats `brassage` (l'helper `expense`, `:10`) et attend `projectedCents === 20_000`. Avec TA6 il échouerait pour la bonne raison (la règle a changé). Je change les catégories des trois achats `a`,`b`,`c` en `chargesFixes` (une ligne, garder les attentes : trendMonths, médiane 20 000) et j'ajoute la contre-épreuve en `ta6`. Aucune autre assertion existante ne change.

**TEMOIN AVANT** : avant la moindre correction, je lance `npx vitest run tests/unit/depense/onglets` et je colle les échecs dans RESULTAT.md, plus (base) les sorties vertes des tests existants :
`npx vitest run tests/unit/finance.test.ts tests/unit/financeForecast.test.ts tests/unit/forecastHorizon.test.ts tests/unit/brewerBudgetLedger.test.ts tests/integration/financeJournalUx.test.tsx tests/unit/fribourgTax.test.ts tests/unit/financeArchiveContinuity.test.ts tests/unit/financeRefunds.test.ts tests/unit/financePaymentSync.test.ts tests/unit/equipmentUpgrades.test.ts tests/integration/financeAssistantContext.test.ts tests/integration/financeWorkspace.test.tsx tests/ux-mobile/financePeriodDrilldown.test.tsx --maxWorkers=2`.
Après, le même lot : tout vert, sauf ce que le pilote a tranché (décision 2).

## 3. Appelants des fonctions changées (`grep`) et ce que chacun affiche après

| Fonction | Appelant | Avant | Après |
|---|---|---|---|
| `summarizeLedger` (nouvelle option, défaut `false`) | `FinancesTab.tsx:76` | Synthèse : « à payer » sans les pièces futures | **avec `includeScheduled:true`** : « à payer / à encaisser » et « Règlements à suivre » incluent les pièces futures (étiquette d'échéance existante `FinanceOverview.tsx:20`) ; trésorerie, solde, « À compléter » inchangés |
| | `DashboardTab.tsx:155,157` | trésorerie suivie, apports | inchangé (défaut) |
| | `annual.ts:141` (puis `fribourgTax.ts:53,68-69`, `financeExport.ts`) | dettes/créances à fin d'exercice | inchangé (défaut) : une pièce datée après la clôture reste hors du bilan |
| | `assistantContext.ts:60,173` | `trackedPayablesCents` à la date du jour | inchangé (défaut). Limite : l'assistant ne voit pas les pièces futures dans ce champ ; elles sont dans ses échéances de prévision (`forecast.upcoming`). Fichier hors Possède, à signaler |
| | `forecast.ts:54` | trésorerie + avertissements pour la prévision | inchangé (défaut) |
| `buildForecast` (`undated`, tendance filtrée) | `FinancesTab.tsx:89,90` (`items`, `months`, `warnings`) | pièce sans échéance dans « Factures à régler » et dans le solde du premier mois ; tendance de toutes catégories | « Factures à régler » (`invoiceOut`) et « Entrées prévues » **sans** les pièces sans échéance ; solde estimé du premier mois **plus haut** de leurs sorties (voir risque 2) ; tendance seulement pour « Charges fixes » ; `undated` n'est pas encore lu par l'écran (variantes à venir) ; l'avertissement reste dans « Voir les limites » |
| | `assistantContext.ts:95,101,119,178` | échéances 30/90 jours et `warnings` incluent la pièce sans échéance « aujourd'hui » | échéances sans elle ; ses avertissements « Échéance à préciser » restent, donc l'assistant sait qu'il en manque. Limite : `undated` non transmis (hors Possède) |
| | tests : `forecastHorizon.test.ts`, `financeForecast.test.ts`, `equipmentUpgrades.test.ts`, `financeAssistantContext.test.ts` | | à rejouer (TEMOIN) |
| `TransactionJournal` (texte de `count`) | `FinancesTab.tsx` (onglet Opérations, `openJournal`) | `3 opérations` | `2 opérations + 1 annulée` |

## 4. Fichiers écrits
`src/domain/finance/ledger.ts`, `src/domain/finance/forecast.ts`, `src/ui/finance/TransactionJournal.tsx` (la chaîne de `count` seulement),
`tests/unit/finance.test.ts` (une ligne de fixture), `tests/unit/depense/onglets/*`, `voies/t1-onglets/{PLAN,RESULTAT}.md`. Sous réserve de la décision 1 :
`src/components/tabs/FinancesTab.tsx` (une ligne). `financeForecast.test.ts` et `forecastHorizon.test.ts` : lus, non modifiés (ajout seulement si un
cas de non-régression manque).

## 5. Risques

1. **Données existantes** : aucun champ lu n'est ajouté ni retiré dans Firestore ; `dueDate`, `paymentStatus`, `planId` gardent leur sens. Les anciennes dépenses
   (sans `finance`) restent `unknown` : jamais ajoutées en TA3, jamais dans `undated` (sauf pièce liée à un plan, signalée `unconfirmed`).
2. **TA4, solde estimé** : une dette sans échéance quitte les mois, donc le solde estimé du premier mois monte de son montant. C'est la règle choisie par le
   pilote, mais elle expose à un solde trop optimiste. Atténuation : `undatedOutCents` rend le chiffre à l'écran (« solde moins X à préciser ») dans les
   variantes ; l'avertissement reste. Test : le total `undatedOutCents` est exact. Le plan de TA4 ci-dessus (pièce liée à un plan qui ne remplace plus
   l'occurrence) évite au moins la disparition double d'une dépense planifiée.
3. **TA3 / annuel** : voir § 1 ; couvert par le test 2 (défaut inchangé) et par la relecture des tests fiscaux/archives.
4. **Pièce `unknown` liée à un plan** : `buildForecast` la place aujourd'hui (`:59-60`) car « le montant lié à la prévision reste réservé ». TA3 ne l'ajoute pas à
   la Synthèse (le grand livre n'a pas les plans) : petit écart voulu, documenté, donc la règle « une seule règle » est exacte pour les pièces non `unknown`
   (testée) et l'écart `unknown` + plan est nommé dans RESULTAT.md.
5. **Hors ligne** : calculs purs sur les données déjà en mémoire (Dexie/Firestore) ; aucun nouvel accès réseau.
6. **Double clic** : sans objet (aucune écriture, aucun état modifié).
7. **Arrondis** : centimes entiers, sommes d'entiers ; aucune division ni TVA ; `compte()` reste le seul arrondi de texte. Test 10 de TA4.
8. **Fuseau** : on réutilise `todayISO()` (Europe/Zurich) et `isoDate`, comparaisons de chaînes `AAAA-MM-JJ` ; aucune date construite à la main.
9. **Cache de rendu** : `FinancesTab` mémorise `ledger` sur `[transactions, data.payments, data.profile]` ; l'option est une constante, pas de dépendance à ajouter.
10. **`financePeriodDrilldown.test.tsx:86`** (hors Possède) : la fixture `ACHAT-MOIS` (`:41-42`) est une dépense `unpaid` **sans échéance** datée d'aujourd'hui ; ce test
    additionne ses 68 CHF dans le solde du mois. Avec TA4 ce nombre change de 6 800 centimes : le test casserait pour la bonne raison. Voir décision 2.

## 6. Décisions à prendre par le pilote

1. **Possède + `FinancesTab.tsx:76`** : accepter cette seule ligne (`{ includeScheduled: true }`). Alternatives rejetées : changer le défaut de `summarizeLedger` (fausse
   le bilan et la clôture fiscale) ; modifier `FinanceOverview.tsx` (plus de lignes, même effet). Recommandation : la ligne.
2. **`financePeriodDrilldown.test.tsx`** : mettre une échéance (`dueDate`) à `ACHAT-MOIS` dans sa fixture (la facture existe, seule la date manque, le test reste
   fidèle à son objet : factures vs estimations), ou me laisser l'écrire et le dire. Recommandation : modifier la fixture, ajouter l'échéance, le nombre attendu ne change pas.
3. **Catégories de tendance** : `['chargesFixes']` seul ; ajouter `nettoyage` ? (ni l'un ni l'autre n'est dit récurrent par le brasseur). Recommandation : seul `chargesFixes`.

## 6 bis. Corrections après REVUE-PLAN (31.10, ces lignes remplacent ce qui les contredit plus haut)

Décisions 1 à 3 du § 6 : acceptées par le pilote (voir REVUE-PLAN « Décisions du plan »). Corrections, par numéro de revue :
- **Conception 1 / Prêt 3 (identité TA3 et TA4)** : la règle « une seule règle » s'écrit
  `payablesCents + receivablesCents (option) = Σ items source invoice + undatedInCents + undatedOutCents`, vraie pour les pièces actives, à date valide,
  montant valide, d'état ni `unknown`, dont l'échéance tombe dans l'horizon de la prévision (`forecast.ts:53,63`). Écart nommé : hors horizon, une
  pièce compte dans la Synthèse mais pas dans les mois ; pièce sans date valide : hors Synthèse (`ledger.ts:109`), dans la prévision. Test 9 de `ta3` = jeu mêlé
  (passée, présente, future, partielle, sans échéance, hors horizon) qui prouve l'identité et nomme l'écart.
- **Conception 2** : ligne visible non repliée dans `FinanceForecastSummary.tsx` : « Échéance à préciser : N pièces · X CHF à payer · Y CHF à encaisser »
  (0 pièce : pas de ligne), lue sur `undatedCount`, `undatedOutCents`, `undatedInCents` (props facultatives). Le seul conduit est `FinancesTab.tsx:183` (le JSX
  qui rend le résumé) : je touche cette ligne en plus de `:76`, sans autre changement. L'avertissement de `forecast.ts` donne aussi le montant.
- **Conception 3** : avec l'option, une pièce future passe les contrôles de montant et d'avoir avant l'ajout (avertissement `Montant à vérifier` / avoir mal lié, rien
  ajouté, sans toucher `cashComplete`). Tests : avoir futur bien lié, mal lié, montant invalide.
- **Conception 4** : une ligne dans `warnings` « Achats de <catégorie> non projetés (irréguliers). » quand une catégorie écartée a de l'historique sur les mois de
  tendance. Raison de `['chargesFixes']` reformulée : aucune périodicité connue pour `nettoyage` et `divers`. Effet connu : ce nouvel avertissement fait afficher
  « Prévision incomplète / Sorties renseignées » (`FinanceForecastSummary.tsx:20`) dès que du brassage est écarté ; dit dans RESULTAT.md pour le pilote.
- **Conception 5** : borne d'horizon écrite ci-dessus ; l'écart hors horizon est nommé dans RESULTAT.md.
- **Conception 6 / Prêt 7** : `UndatedForecastItem.amountCents = state.remainingCents`, `label = tx.description`. Tests : pièce partielle sans échéance ; pièce sans
  `finance` (ancienne) ni dans `items` ni dans `undated`.
- **Conception 7** : test du cas vide (aucune pièce : `undated` vide, totaux 0) ; test `buildAnnualReport` avec une pièce datée après la clôture : `payablesCents` inchangé.
- **Conception 8 / Prêt 6 (TA2)** : texte = `compte(active,'opération')` seul sans annulée ; `compte(annulées,'annulée')` seul si `activeCount === 0 && voidedCount > 0` ;
  sinon `N opérations + M annulées`. Liste vide : `0 opération`. Nombres par cas fixés dans les tests.
- **Prêt 1, 2, 9** : fixtures des tests qui rendent `FinancesTab` : une `dueDate` est ajoutée quand le test ne porte pas sur l'échéance ; les attendus sont conservés. Une
  facture saisie par formulaire sans échéance garde son cas, attendu déplacé vers la ligne « Échéance à préciser ». Je lance les sept tests au TEMOIN AVANT pour
  voir lesquels changent de nombre (base verte mesurée le 31.10 : 128 tests, 14 fichiers).
- **Prêt 4** : `ta2-compteur.test.tsx` porte `// @vitest-environment jsdom` (le dossier `tests/unit` tourne en `node`, `vitest.config.ts:65-66`) ; échec attendu : l'assertion sur « 3 opérations ».
- **Prêt 5** : une pièce sans échéance liée à un plan, y compris un plan non projeté (`draft`), va dans `undated` (la boucle des pièces ne regarde pas l'état du plan
  quand l'état de paiement est connu) ; `isUndatedPending(tx, payments, transactions, asOf)` est évalué dans la boucle des plans pour que la pièce ne remplace pas
  l'occurrence ; l'avertissement `:71-73` continue de compter les pièces liées sans échéance, écartées comprises. Test « plan `draft` + facture sans échéance ».
- **Prêt 8** : les mots de G4 sont écrits tels quels dans RESULTAT.md : « TEMOIN AVANT », « appelants », « échéance à préciser », « Rien ne se perd ».

## 7. Hors périmètre
TA1 (filtre Entrées / Sorties), TA5 (solde avec sa réserve), la forme des vues, les onglets, les prévisions saisies, la lecture de `undated` à l'écran (variantes), l'assistant
financier (champs `trackedPayables` et `undated`), `docs/`. Aucun commit, aucun déploiement, aucune donnée réelle.
