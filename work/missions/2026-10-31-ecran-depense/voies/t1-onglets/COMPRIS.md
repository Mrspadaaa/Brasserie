# Compris : voie t1-onglets

## Objectif
Faire que Opérations, Synthèse et Prévisions affichent les mêmes nombres, en corrigeant le calcul des quatre défauts TA2, TA3, TA4 et TA6 du diagnostic d2, sans changer la forme des vues. L'interface (filtre Entrées / Sorties, solde avec sa réserve) reste hors de cette voie : le brasseur la choisira sur des variantes.

## Écrit dans
- `src/domain/finance/ledger.ts`
- `src/domain/finance/forecast.ts`
- `src/ui/finance/TransactionJournal.tsx`
- `tests/unit/finance.test.ts`
- `tests/unit/financeForecast.test.ts`
- `tests/unit/forecastHorizon.test.ts`
- `tests/unit/depense/onglets/`
- `work/missions/2026-10-31-ecran-depense/voies/t1-onglets/`

## Fini quand
- L'app se construit : `npm run build` affiche « built in ».
- Les tests finances passent, sondes du diagnostic comprises : la commande vitest sur les fichiers listés affiche « TESTS ONGLETS OK ».
- Le plan est relu par deux regards neufs, sans bloquant : `REVUE-PLAN.md` donne « REVUE OK ».
- RESULTAT.md contient les mots « TEMOIN AVANT », « appelants », « échéance à préciser » et « Rien ne se perd ».
- TA2 : le compteur de Tout ne compte que les opérations actives ; les annulées restent listées et se disent à part, « + N annulées ».
- TA3 : une pièce à payer datée dans le futur compte dans « à payer » de la Synthèse à son échéance, comme dans Prévisions. La trésorerie ne compte que les paiements faits.
- TA4 : une facture à payer ou une vente à encaisser sans échéance sort du premier mois et va dans « échéance à préciser », comptée à part. Aucune date inventée.
- TA6 : la tendance « Dépenses courantes » ne projette que les catégories récurrentes (charges fixes) ; malt, houblon et levure ne deviennent pas une charge mensuelle.
- Chaque défaut a d'abord un test qui échoue sur le code actuel, dont la sortie va sous « TEMOIN AVANT : ». Puis correction, puis le même test passe. Le plan va dans PLAN.md, et je m'arrête avec `PLAN PRÊT — <n> défauts` avant de coder.

## Ne fait pas
- Ne change pas la forme des vues, ni le filtre Entrées / Sorties (TA1), ni le solde avec sa réserve (TA5), ni les onglets eux-mêmes, ni les prévisions saisies.
- Ne modifie ni VOIE.md ni GATES.md.
- Ne lit pas `functions/.env`, `.codex/`, `source4-portable-bundle-manifest-01.json`, `work/refonte-frontend/v4/choix/` ni `work/missions/2026-10-31-ecran-depense/brasseur/`.
- N'appelle pas Gemini, n'accède pas au Drive réel, ne déploie rien, ne touche aucune donnée réelle, ne fait aucun appel hors localhost.
- Pas de `git stash`, pas de commit, pas de code écrit par heredoc ni par `node -e`, pas d'installation.
- Ne retire aucun champ d'un document Firestore : ajouts facultatifs seulement.

## Doutes
- COMMUN.md exige un plan arrêté avant le code, et VOIE.md ne le dit pas. Je suppose que le codage attend la revue triée par le pilote.
- G2 lance `tests/integration/financeJournalUx.test.tsx` et `tests/unit/brewerBudgetLedger.test.ts`, qui ne sont pas dans « Possède ». Si elles cassent, je ne sais pas si je peux les modifier. Option prudente : ne pas les toucher, et le signaler.
- « Dépenses courantes » : VOIE.md ne dit pas comment reconnaître une catégorie récurrente ou charge fixe dans les données (champ, liste). À trancher dans le plan, d'après le code.
- TA4 : une pièce sans échéance déjà payée n'est probablement pas concernée, mais la consigne ne le dit pas.
- TA2 : le format exact de « + N annulées » et son emplacement ne sont pas précisés.
- G3 demande deux relecteurs neufs. Ce test ne les lance pas ; je ne compte pas ce critère comme couvert.
- Le nombre de défauts (`<n>`) : la consigne donne quatre identifiants. Je pars de quatre, sauf si le plan en découpe davantage.
