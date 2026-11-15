# Revue B (code et risques) du PLAN de la voie us (Synthèse g3a)

Relecteur sans mémoire, lecture seule hors ce fichier. Gravité : B = bloquant avant code, G = grave (corriger dans le plan ou à l'étape 2), D = détail.

## Verdict : PLAN À CORRIGER (3 B, 4 G, 3 D). Le fond est bon (appelants de FinanceOverview et FinancesTab exacts, Possède disjoints avec uo et ue). Mais la promesse « un seul résultat » (P2) n'est pas tenue par la règle du matériel, deux tests existants sont mal cartographiés, et le contrat avec uo n'est pas écrit.

## Constats

1. **B — La règle « matériel à part » n'est pas celle de l'Annuel, contrairement à ce que dit le plan (§1 P2, §4.1).**
   Le plan dit : « même séparation que `annual.ts:125-129` » et, sans lignes, « catégorie `materiel` ou `renovation` ».
   Preuve : `src/domain/finance/annual.ts:123-126`. Sans ligne `equipment`, le capex vaut `assetRows.reduce(acquisitionCents)` (le registre des immobilisations), pas la catégorie. Le test sur la catégorie n'existe que pour `!tx.finance` (l. 133, en avertissement). L'Annuel applique aussi `businessUsePct` (l. 124).
   Sur la démo `src/dev/financeDemo.ts` : « Joints de la cuve » 28,60 est `materiel` avec `finance.lines` vide et sans immobilisation. L'Annuel le compte en charge, la Synthèse le met « à part ». La contradiction P2 reste donc sur la donnée de démo même.
   Correction : (a) écrire la divergence comme décision explicite (la maquette impose 28,60 à part) et la dire dans « À vérifier » ; ou (b) rapprocher la règle du registre. Dans les deux cas : un test croisé `periodeSynthese` contre `buildAnnualReport` sur la même fixture. Et ne plus écrire « même règle que l'Annuel ».

2. **B — Avoirs invalides et avoirs imputés : pas de garde.**
   `ledger.ts:148-150` et `annual.ts:91-98` écartent un avoir dont `refundLinkIssue` est non nul (et le disent en avertissement). Le plan (T6, §4.1) n'écarte rien : un avoir orphelin ou antérieur à sa facture fausserait le gain.
   Correction : `periodeSynthese` appelle `refundLinkIssue`, exclut la pièce et la nomme dans « À vérifier ». Ajouter un test T6b. Cas `refundApplication === 'offset'` : `paymentState` met l'original en « payé » avec `appliedCreditCents`. Écrire ce que montre le hachuré, car ce crédit n'est pas de l'argent « payé ».

3. **B — Changements de `financeWorkspace.test.tsx` incomplets et en conflit avec uo.**
   Le tableau §6 ne couvre que L23-44, L74-78 et L155-181. Mais `financeWorkspace.test.tsx:35, 80, 85` exigent un bouton « Confirmer les paiements » **visible** sur la Synthèse (`toBeVisible`).
   Dans le plan, ce contrôle part dans « À vérifier · n », décrit comme « replié/dépliée ». Soit il reste visible sans geste, soit le test change. Le plan ne tranche pas, et c'est une garde BE-72.
   Le même fichier, L37-53, est aussi listé comme « à adapter » par uo (`uo/PLAN.md` §5), alors qu'il ne figure pas dans son Possède. Deux voies éditent le même fichier sur des lignes qui se chevauchent (us L23-44, uo L37-44).
   `mobileDailyViews.test.tsx` est aussi partagé : us L111, mais L113-115 et L120-130 dépendent des choix de uo.
   Correction : un seul propriétaire par fichier de test, écrit dans les deux VOIE.md. Proposition : us possède `financeWorkspace` et `mobileDailyViews` ; uo lui donne ses adaptations en liste.

4. **G — Contrat us ↔ uo (FinancesTab ↔ TransactionJournal) : ordre et type non écrits.**
   `us/DECISIONS.md` demande à us de passer `onAddProof`, `onPay`, `assistant` et de retirer `{financeAssistant}` après le journal (`FinancesTab.tsx:141`). Si us atterrit avant que uo déclare ces props, `tsc` échoue. Si le retrait précède `assistant`, le compagnon disparaît de Opérations.
   Autre point : `finance-bar` (titre h2 « Opérations » + ⚙, `FinancesTab.tsx:117-122`) est conservée pour `journal` par le plan us (§3 : seule `overview` la perd). La maquette v6b n'a ni titre ni ⚙ (`p4/v6b/etat.html`, seulement `v6b-hd`, `v6b-tabs`, `v6b-top`). Un bloc de l'ancien reste donc au-dessus de v6b, contre « Remplacer, jamais fusionner », et personne ne le retire : uo ne possède pas FinancesTab, us ne regarde que la vue overview.
   Correction : écrire dans les deux plans l'ordre (uo d'abord les props optionnelles, puis us le câblage) et qui retire la barre pour `journal`, en gardant un accès au ⚙ (ProfileSheet) pour Opérations et Annuel.

5. **G — Duplication de règle de calcul avec uo.**
   us définit « payé, à payer, matériel à part, catégorie de ligne » dans `periodeSynthese` ; uo redéfinit les mêmes notions dans `operations/calculs.ts` (`categorieDeLigne`, `pilesDuMois`) avec des règles différentes. Écarts : `capitalTreatment` (us) contre catégorie de ligne seule (uo) ; reliquat TVA et transport traité par us (T4), ignoré par uo ; avoirs.
   Le « dépensé 696,80 » doit être identique dans les deux écrans (D4 de uo le rappelle). Correction : uo consomme `src/domain/finance/periodeSynthese.ts` (décision D2 de us) ou un module commun, avec un test de cohérence entre les deux écrans sur la fixture de la démo. À séquencer : us livre le domaine en premier.

6. **G — `calcul.ts` contre `periodeSynthese.ts`.**
   Le PLAN écrit le domaine dans `src/ui/finance/synthese/calcul.ts`. `DECISIONS.md` le déplace vers `src/domain/finance/periodeSynthese.ts` « avec son test unitaire », mais le chemin du test n'est pas fixé. `VOIE.md` ne liste pas ce fichier dans Possède. Correction : amender le Possède (`src/domain/finance/periodeSynthese.ts`, `tests/unit/periodeSynthese.test.ts`) et réécrire §4 et §5 (T1, T3-T9, T20) sur ce chemin.

7. **G — `litreDuDernierBrassin` duplique `brewForecast`.**
   `src/domain/finance/brewForecast.ts:157-228` fait déjà `litresNets` + `troisNotions` + `coutLitre` par brassin. Un second assemblage dans l'écran crée deux sources du « 7,51 ». Correction : réutiliser une fonction exportée de `brewForecast` ou la factoriser dans le domaine, et tester l'égalité avec la valeur de Prévisions.

8. **D — Fenêtre de périodes.** E1 propose « mois courant, les deux précédents, tout ». Le plan ne dit pas le comportement en janvier (année dans l'étiquette) ni quand `month` (état de FinancesTab) sort de la fenêtre après un `openJournal`.

9. **D — `tests/ux-mobile/financePeriodDrilldown.test.tsx` n'est pas dans `include`** (`vitest.config.ts` : unit, integration, fuzz, prototypes). Le plan dit « lancer à la main » sans donner la commande. Un `vitest run <chemin>` ne le charge pas. Donner la commande (config explicite) ou le déplacer, sinon L11 s'applique.

10. **D — Dates.** Les tests rendus utilisent `todayISO()` (horloge réelle, fuseau Zurich, `ledger.ts:24`). La fixture « 9 nov. » de la maquette exige `vi.setSystemTime` dans les tests de rendu ; le plan écrit « aucune horloge » pour la fonction pure mais ne l'écrit pas pour T2, T10-T19.

## Vérifié
- Appelants : `FinanceOverview` (FinancesTab:125, soldeDepartVisible.test, inventaire-ecrans.mjs), `CostComposition` (FinancesTab, financePeriodDrilldown.test), `FinancePeriodBar` et `MonthStepper` (FinancesTab, TransactionJournal) : grep confirmé.
- Rejeu HEAD de us : 9 fichiers, 95 tests verts (`us/tests-head.txt`).
- Possède us, uo et ue : disjoints entre eux (ue = ClientsTab, TarifSheet, prix/**, BatchDetailSheet ; mais ue et uv se partagent ClientsTab, hors périmètre ici).
- `ledger.cashCents`, `payablesCents` (`includeScheduled`), `paymentState` : conformes à l'usage du plan.
- Registre `ecrans-app.json:107` : synthese → g3a choisi.

## Non vérifié
- Rendu visuel, captures, thème cave.
- Comportement hors ligne de `BrewerChat` (affirmé « tolérant », non relu).
- Contenu exact des `it` de `financeJournal*` côté uo (voir REVUE-B de uo).
- Que `financeDemo.ts` fournisse un octobre à « Perdu −28,00 » : les « Petits achats courants » à 28 sont présents à M-1, mais non exécuté.
