# Revue du plan t1-onglets, triée par le pilote (31.10)

Deux relecteurs neufs : `REVUE-conception.md` et `REVUE-pret.md` (le détail de chaque constat et ses preuves y restent). « corrigée » :
l'auteur corrige PLAN.md selon la colonne « Correction attendue » (et la raison, quand le pilote précise), avant toute ligne de code.

## Conception

| n | Gravité | Constat (preuve) | Correction attendue | Sort | Raison |
|---|---|---|---|---|---|
| 1 | majeur | TA3 et TA4 se contredisent pour une pièce sans échéance : « à payer » la compte, Prévisions non (`ledger.ts:126-129`, PLAN § 1) ; le test 9 de ta3 est faux dès qu'une pièce n'a pas d'échéance | écrire l'identité exacte, `payables + receivables (option) = Σ items invoice + undatedInCents + undatedOutCents`, pièces valides et non `unknown`, échéance dans l'horizon ; test 9 sur un jeu mêlé (datées, sans échéance, hors horizon) | corrigée | même identité que Prêt n° 3 ; la phrase « règle unique » de PLAN § 1 TA3 est réécrite avec elle |
| 2 | majeur | une dette sans échéance disparaît de l'écran Prévisions : `undated` n'est lu par aucun écran, l'avertissement reste replié et sans montant | avertissement avec montant ; et une ligne visible | corrigée | décision du pilote : une ligne visible, non repliée, « Échéance à préciser : N pièces · X CHF », dans `src/ui/finance/FinanceForecastSummary.tsx`, lue sur `undatedOutCents` et `undatedInCents` (0 pièce : pas de ligne). L'avertissement de `forecast.ts` donne aussi le montant. L'écran n'est pas refait : une ligne de plus, au style des lignes voisines |
| 3 | majeur | TA3 : pour une pièce future, les contrôles de montant et d'avoir (`ledger.ts:112-115`) ne s'exécutent pas, car `:110` sort avant | ces contrôles passent avant l'ajout à « à payer » ; tests ta3 : avoir futur bien lié, avoir futur mal lié (rien ajouté, avertissement), montant invalide | corrigée | — |
| 4 | majeur | TA6 : la tendance des catégories non récurrentes disparaît sans trace ; le solde estimé monte en silence | une ligne dans `warnings` quand une catégorie écartée a de l'historique, « Achats de brassage non projetés (irréguliers) » ; un test | corrigée | `['chargesFixes']` reste le défaut, réversible ; la raison de PLAN § 1 TA6 est reformulée : aucune périodicité connue pour `nettoyage` et `divers` (et non « par prudence », retirer une catégorie baisse les sorties prévues) |
| 5 | détail | l'égalité Synthèse / Prévisions n'est vraie que dans l'horizon et pour des pièces valides (`forecast.ts:53,63`) | écrire cette borne dans le plan et les tests ; nommer l'écart hors horizon dans RESULTAT.md | corrigée | — |
| 6 | détail | `UndatedForecastItem.amountCents` non défini ; pas de cas partiel ni de pièce ancienne sans `finance` | `amountCents = state.remainingCents` ; tests : pièce partielle sans échéance, pièce sans `finance` (ni `items` ni `undated`) | corrigée | — |
| 7 | détail | cas vide et bilan annuel non testés ; G2 ne rejoue pas les tests fiscaux et d'archives | test du cas vide ; test `buildAnnualReport` avec une pièce datée après la clôture, `payablesCents` inchangé | corrigée | le pilote ajoute `fribourgTax`, `financeArchiveContinuity` et `financeRefunds` au CHECK de G2 |
| 8 | détail | TA2 : « 0 active + N annulées » mal dit hors du filtre `void` | règle sur `activeCount === 0 && voidedCount > 0` : dire seulement « N annulée(s) » ; test | corrigée | — |
| 9 | détail | décision 2 : valeur d'échéance de la fixture non fixée, chemin hors OWNS | `dueDate: today` dans `financePeriodDrilldown.test.tsx` | corrigée | le pilote a étendu OWNS (GATES.md) et Possède (VOIE.md) |

## Prêt à coder

| n | Gravité | Constat (preuve) | Correction attendue | Sort | Raison |
|---|---|---|---|---|---|
| 1 | bloquant | `tests/integration/financeWorkspace.test.tsx` casse avec TA4 : `tx()` (`:17`) est une dépense `unpaid` sans `dueDate` ; `:77-81`, `:130` changent | une `dueDate` dans `tx()`, ce qui garde ses nombres ; le test entre au TEMOIN AVANT et au plan § 5-6 | corrigée | règle du pilote : une fixture reçoit une `dueDate` quand le test ne porte pas sur l'échéance (ici, l'espace de travail) |
| 2 | bloquant | `tests/integration/equipmentProjects.test.tsx` casse aussi (`:124-130`, et peut-être `it.each :89-111`) ; d'autres tests rendent `FinancesTab` sans avoir été triés | lancer tous les tests qui rendent `FinancesTab` pendant le plan ; lister ceux qui changent de nombre au plan § 5-6 et au TEMOIN AVANT | corrigée | `:124-130` reçoit une `dueDate` (le test porte sur le projet, pas l'échéance). Une facture saisie par le formulaire sans échéance (`:89-111`, si le formulaire n'en pose pas) garde son cas : son attendu passe de « Factures à régler » à la ligne « Échéance à préciser », car c'est le comportement voulu. Les fichiers : `dashboardNavigation`, `equipmentProjects`, `financeArchives`, `financeWorkspace`, `fix114`, `mobileDailyViews` (`tests/integration/`), `financePeriodDrilldown` (`tests/ux-mobile/`) ; tous entrent au CHECK de G2 et à OWNS |
| 3 | majeur | TA4 défait la règle unique de TA3 (sonde B : « à payer » 8 650, Prévisions 0) ; et l'horizon | l'identité exacte et la phrase de la règle pour les pièces sans échéance ; cas sans échéance et hors horizon au test 9 | corrigée | même correction que Conception n° 1 |
| 4 | majeur | `ta2-compteur.test.tsx` sous `tests/unit/` tournerait en `node` (`vitest.config.ts:65-66`) : l'échec du TEMOIN serait « document is not defined » | docblock `// @vitest-environment jsdom`, chemins `../../../../src/...` ; coller l'échec attendu (l'assertion sur « 3 opérations ») | corrigée | — |
| 5 | majeur | facture sans échéance liée à un plan non projeté (`forecast.ts:66-69`) : elle sort des mois et le plan ne la reprend pas ; place de `isUndatedPending` non dite | la pièce va dans `undated`, donc dans la ligne « Échéance à préciser » ; `isUndatedPending(tx, payments, transactions, asOf)` évalué dans la boucle des plans ; test « plan `draft` + facture sans échéance » | corrigée | décision du pilote : rien ne disparaît, la pièce se voit dans la ligne. L'avertissement `:71-73` continue de compter les factures liées sans échéance, écartées comprises |
| 6 | détail | TA2 : forme du texte non dite hors du filtre `void` ; fixtures des cas 2 à 5 floues | règle sur `activeCount === 0 && voidedCount > 0` ; nombres d'actives et d'annulées fixés par cas ; liste vide « 0 opération » | corrigée | même règle que Conception n° 8 |
| 7 | détail | `amountCents` et `label` de `UndatedForecastItem` non écrits | `amountCents = state.remainingCents`, `label = tx.description` ; test d'une pièce partielle | corrigée | — |
| 8 | détail | casse des mots de G4 | écrire dans RESULTAT.md, tels quels : « TEMOIN AVANT », « appelants », « échéance à préciser », « Rien ne se perd » | corrigée | — |
| 9 | détail | écritures hors OWNS (`FinancesTab.tsx`, les tests de n° 1 et 2) | étendre OWNS et Possède avant le code | corrigée | fait par le pilote le 31.10 : `src/components/tabs/FinancesTab.tsx` (`:76`, `{ includeScheduled: true }`, accepté), `src/ui/finance/FinanceForecastSummary.tsx` (la ligne de Conception n° 2) et les sept tests de n° 2 |

## Décisions du plan (§ 6)
1. `FinancesTab.tsx:76`, `{ includeScheduled: true }` : acceptée (seul appelant dont le sens change ; le défaut `false` protège `annual.ts`,
   `fribourgTax.ts`, `assistantContext.ts`, `DashboardTab.tsx`).
2. Fixture `financePeriodDrilldown.test.tsx` : `dueDate: today`.
3. `['chargesFixes']` seul : défaut réversible, raison reformulée (Conception n° 4). La catégorie lue par ligne contre `tx.category`
   (`forecast.ts:100-102` contre `FinancesTab.tsx:84`) : signalée dans RESULTAT.md, pas corrigée ici.
