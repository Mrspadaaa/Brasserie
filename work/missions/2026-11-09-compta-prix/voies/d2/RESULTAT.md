OK — étape 2 : prévision dérivée des brassins (`brewForecast.ts` + `buildForecast` étendu), 44 tests verts ; domaine livré, non branché à un écran.

## Fichiers écrits (Possède)
`src/domain/finance/brewForecast.ts` (neuf), `src/domain/finance/forecast.ts` (champs facultatifs `batches`, `stockItems`, `assets`, `brewReglages`, `brewTaxReduction`, `ignoreUpgradePlanId` ; `ForecastItem` : `batchId?`, `partial?`, `lines?`), `tests/unit/brewForecast.test.ts` (neuf, 44 tests), `voies/d2/` : `PLAN.md` (§ 9 : sort de chaque constat des revues P2), `tests-head.txt`, `tests-rouge.txt`, `tests.txt`, `tests-appelants.txt`, `tsc.txt`.

## Sorties décisives
- Rouge avant le code (`tests-rouge.txt`) : `brewForecast` introuvable, fichier en échec (forecast remis à HEAD, module retiré le temps du test).
- Vert (`tests.txt`) : `Test Files 1 passed (1)` · `Tests 44 passed (44)`, rejoué deux fois.
- **Bloquant D2-1 (revue A)** : la prévision dérivée retrouve c3a sur la fixture : achats 22,42 (08.09) + énergie/nettoyage 11,00 (15.09) = **33,42** ; emballage 24,00 (29.09) + impôt 6,84 (30.01.2027) = **30,84** ; total **64,26** = `cashRequiredTTC`. Cinq cas croisés (TVA, énergie incluse dans le récurrent, impôt saisi inclus, emballage désactivé) : somme des items = `cashRequiredTTC`. Densité lue sur `batch.og`, sinon `ogTarget` ; `abv` et réduction passés.
- Appelants rejoués (`tests-appelants.txt`, 202 fichiers) : `Test Files 6 failed | 195 passed | 1 skipped (202)` · `Tests 2742 passed`. Les 6 échecs sont les mêmes qu'à HEAD (fichiers qui ne se chargent pas, `firebase-admin` absent, dont `financeAssistantContext` : **à rejouer sur le poste principal**). Aucun test en moins.
- `npx tsc --noEmit` : 2 erreurs, toutes `firebase-admin/firestore` introuvable ; aucune dans mes fichiers. `controle-virgule` : aucune ligne de mes fichiers (les 9 écritures signalées sont dans `CoutBrassinFlux.tsx`, voie uc).

## Mesure (L20, à froid, 10 brassins, 2 000 factures, 150 articles)
437 ms avant optimisation (chaque `estimateBrewBudget` retrie tout le grand livre). Après filtrage exact des pièces portant un article du brassin : **11,6 ms** (60 factures des articles du brassin), **54 ms** (300, cas lourd). Seuil de 20 ms tenu sur le cas réaliste, garde de 250 ms sur le lourd. Si `FinancesTab` appelle `buildForecast` deux fois (deux `useMemo`, l. 92-93), compter le double ; au besoin mémoïser par clé (ids + `updatedAt`).

## Doutes et limites
- **Non branché (L11)** : `FinancesTab.tsx`, `assistantContext.ts` et `financeDemo.ts` ne passent pas `batches` ; rien n'apparaît à l'écran et `?finance-demo` ne montre aucun brassin dérivé. `BrassinPrevu.coutLitre` et `ignorerPlanId` n'ont pas encore de consommateur (`mesurerAchat`, uc).
- `fraisParPoste` (uc) n'existait pas sur HEAD : d2 garde sa propre découpe, prouvée égale à `cashRequiredTTC` ; à recroiser quand uc livre.
- Brassin commencé (`fermentation`, `garde`) : emballage et impôt ramenés à aujourd'hui tant qu'il n'est pas conditionné ; un brassin en garde depuis 60 jours fait du bruit.
- Impôt d'un brassin conditionné : pas d'item (aucun suivi de paiement par brassin), un avertissement tant que l'échéance estimée n'est pas passée.
- Réglages (7 j, 21 j, 7 j, 30 j, trimestre) en paramètre seulement : le stockage demande `types.ts` / Réglages. Rien vu dans Chrome (domaine sans écran).

DÉCISION À PRENDRE : (1) Branchement : ajouter `FinancesTab.tsx` (2 appels `buildForecast`, libellé « Brassin prévu · estimé auto ») et `assistantContext.ts:95` à une voie ; `FinancesTab` après le choix de l'écran Prévisions (D123). Recommandé : `assistantContext` et `financeDemo` (un brassin planifié) tout de suite. (2) Impôt des brassins conditionnés : suivre le paiement par brassin (plan `source:'tax'` ?) pour garder un item, ou garder l'avertissement. Recommandé : l'avertissement pour l'instant.

CONNAISSANCE : `finance.batchId` n'est écrit nulle part dans `src/` (lecture seule) ; une facture d'achat saisie met le stock à jour (`purchaseEntry.ts:732`) : une prévision ne soustrait pas la facture du besoin d'achat.
LEÇON PROPOSÉE : un seuil de performance se mesure sur un jeu de la taille réelle avant d'être écrit (437 ms contre 20 ms prévus, trouvé seulement par la mesure).
