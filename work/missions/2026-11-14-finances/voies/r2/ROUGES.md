# ROUGES — suite complète (voie r2, 15.11)

Commande : `npx vitest run --reporter=dot --no-color` (tests-complet.txt) : 59 fichiers rouges, 14 tests rouges, 13 790 verts, 1 228 fichiers verts, 2 ignorés.
Base : la liste des rouges d'environnement de la voie f2 (`../f2/ROUGES.md`, rejouée sur la base en ligne par f2). Les 59 fichiers rouges d'ici sont exactement ceux de f2 (comparaison par `comm` : aucun fichier neuf, aucun disparu) et le nombre de tests rouges est le même (14).
Aucun rouge neuf venu des quatre ports (Payer, Apport, Fiche, Modifier). Une première passe, lancée pendant une compilation et des captures, a donné 63 fichiers rouges : 4 de plus.
- `editTransactionBe66.test.tsx` (2 tests) et `liveDataViews.test.tsx` (1 test) : rouges pour de bon, décrivaient l'ancien « Modifier l'écriture » (total « 0,00 CHF » toujours montré, « Dossier Google Drive »). Réalignés par r2 sur m5mo-c (TVA et total seulement pour une brasserie assujettie ; chemin Drive en mots) ; verts.
- `modifierMontant.test.tsx` (9 tests) et `fuzzSaisie.test.tsx` (1, délai de 30 s dépassé) : rouges seulement sous la charge de cette première passe ; verts seuls (3 fois de suite), verts avec 20 autres fichiers, et verts dans la deuxième passe complète, sans autre charge.

| fichier | base rouge | cause |
| --- | --- | --- |
| tests/integration/driveAuthorization.test.ts | oui | non chargé : Cannot find package 'firebase-admin/auth' (functions/ sans node_modules dans ce worktree) |
| tests/integration/financeAssistantContext.test.ts | oui | non chargé : Failed to resolve import "firebase-admin/firestore" (functions/ sans node_modules dans ce worktree) |
| tests/integration/invoiceReview.test.ts | oui | fichier non chargé (dépendance de functions/ absente du worktree) |
| tests/integration/recipeAiWorkflow.test.tsx | oui | 2 tests de l'IA de recette (hypothèse d'atténuation) : assertions |
| tests/integration/recipeEditing.test.tsx | oui | 6 tests de l'éditeur de recette (scénarios levure, Lager, Sour, houblons NEIPA) : éléments introuvables ou en double |
| tests/integration/yeastPitchingExecution.test.tsx | oui | 2 tests de la quantité de levure ajoutée au jour J : assertions |
| tests/unit/aiTaskMonthlyBudget.test.ts | oui | fichier non chargé (dépendance de functions/ absente du worktree) |
| tests/unit/backupTransferServer.test.ts | oui | non chargé : Cannot find package 'firebase-admin/firestore' (functions/ sans node_modules dans ce worktree) |
| tests/unit/banc-lecture-facture.test.ts | oui | fichier non chargé (dépendance de functions/ absente du worktree) |
| tests/unit/brewAlarmServer.test.ts | oui | non chargé : Cannot find package 'firebase-functions/v2/https' (functions/ sans node_modules dans ce worktree) |
| tests/unit/brewSessionServer.test.ts | oui | non chargé : Cannot find package 'firebase-functions/v2/https' (functions/ sans node_modules dans ce worktree) |
| tests/unit/brewerAppContext.test.ts | oui | non chargé : Cannot find package 'firebase-admin/firestore' (functions/ sans node_modules dans ce worktree) |
| tests/unit/brewerApplyTransaction.test.ts | oui | non chargé : Cannot find package 'firebase-admin/firestore' (functions/ sans node_modules dans ce worktree) |
| tests/unit/brewerBudgetLedger.test.ts | oui | non chargé : Cannot find package 'firebase-admin/firestore' (functions/ sans node_modules dans ce worktree) |
| tests/unit/brewerFlashLimits.test.ts | oui | fichier non chargé (dépendance de functions/ absente du worktree) |
| tests/unit/brewerHarness.test.ts | oui | fichier non chargé (dépendance de functions/ absente du worktree) |
| tests/unit/brewerHopAdviceProposal.test.ts | oui | fichier non chargé (dépendance de functions/ absente du worktree) |
| tests/unit/brewerHopAdviceSemanticProfileV5.test.ts | oui | fichier non chargé (dépendance de functions/ absente du worktree) |
| tests/unit/brewerHopAdviceTransportV1.browser.test.ts | non (verte sur la base) | chemin de @noble/hashes : le test attend node_modules DANS le worktree ; ici il vient du dossier parent (le test seul : 2 rouges ; sources et test identiques à la base : `git diff` vide). Non venu de la mission |
| tests/unit/brewerHopAdviceWizardDispatchV1.test.ts | oui | non chargé : Cannot find package 'firebase-admin/firestore' (functions/ sans node_modules dans ce worktree) |
| tests/unit/brewerJobsRequestNotSent.test.ts | oui | non chargé : Cannot find package 'firebase-admin/firestore' (functions/ sans node_modules dans ce worktree) |
| tests/unit/brewerSuppliers.test.ts | oui | fichier non chargé (dépendance de functions/ absente du worktree) |
| tests/unit/brewingNuanceTools.test.ts | oui | fichier non chargé (dépendance de functions/ absente du worktree) |
| tests/unit/d100AiTaskOutput.test.ts | oui | fichier non chargé (dépendance de functions/ absente du worktree) |
| tests/unit/dataBackupServer.test.ts | oui | non chargé : Cannot find package 'firebase-admin/firestore' (functions/ sans node_modules dans ce worktree) |
| tests/unit/depense/d381/serveur.test.ts | oui | non chargé : Cannot find package 'firebase-functions/v2/https' (functions/ sans node_modules dans ce worktree) |
| tests/unit/depense/lecture-d/serveur.test.ts | oui | non chargé : Cannot find module '../../../../functions/node_modules/firebase-functions' (functions/ sans node_modules dans ce worktree) |
| tests/unit/depense/noms-fr/aiTask-traduireNoms.test.ts | oui | non chargé : Cannot find package 'firebase-functions/v2/https' (functions/ sans node_modules dans ce worktree) |
| tests/unit/depense/pages/lecture-serveur.test.ts | oui | non chargé : Cannot find package 'firebase-functions/v2/https' (functions/ sans node_modules dans ce worktree) |
| tests/unit/depense/rapprochement/lecture-coupee.test.ts | oui | non chargé : Cannot find module '../../../../functions/node_modules/firebase-functions' (functions/ sans node_modules dans ce worktree) |
| tests/unit/designTokens.test.ts | oui | text-cave-300 (degré absent de la palette) dans src/ui/depense/Ligne.tsx et src/ui/finance/controlesCroisesVue.tsx, code antérieur à la mission |
| tests/unit/fermentationCompanion.test.ts | oui | fichier non chargé (dépendance de functions/ absente du worktree) |
| tests/unit/fermentationImport.test.ts | oui | fichier non chargé (dépendance de functions/ absente du worktree) |
| tests/unit/fermentationResearchAccess.test.ts | oui | non chargé : Cannot find package 'firebase-functions/v2/https' (functions/ sans node_modules dans ce worktree) |
| tests/unit/financeDocumentHistory.test.ts | oui | non chargé : Cannot find package 'firebase-admin/firestore' (functions/ sans node_modules dans ce worktree) |
| tests/unit/financeDocumentMigration.test.ts | oui | non chargé : Cannot find package 'firebase-admin/firestore' (functions/ sans node_modules dans ce worktree) |
| tests/unit/financialSyncServer.test.ts | oui | non chargé : Cannot find package 'firebase-admin/firestore' (functions/ sans node_modules dans ce worktree) |
| tests/unit/geminiErrors.test.ts | oui | non chargé : Cannot find package 'cheerio/slim' (functions/ sans node_modules dans ce worktree) |
| tests/unit/geminiModelRouting.test.ts | oui | fichier non chargé (dépendance de functions/ absente du worktree) |
| tests/unit/geminiNetworkGuard.test.ts | oui | non chargé : Cannot find package 'cheerio/slim' (functions/ sans node_modules dans ce worktree) |
| tests/unit/hopIndexV4/collecteBrewersfriend.test.ts | oui | non chargé : Cannot find module 'cheerio' (functions/ sans node_modules dans ce worktree) |
| tests/unit/hopIndexV4/collecteHopslist.test.ts | oui | non chargé : Cannot find module 'cheerio' (functions/ sans node_modules dans ce worktree) |
| tests/unit/hopIndexV4/collecteUsda.test.ts | oui | non chargé : Cannot find module 'cheerio' (functions/ sans node_modules dans ce worktree) |
| tests/unit/hopIndexV4/hopReclasserIA.test.ts | oui | non chargé : Cannot find package 'firebase-functions/v2/https' (functions/ sans node_modules dans ce worktree) |
| tests/unit/invoiceScanBudget.test.ts | oui | non chargé : Cannot find package 'firebase-admin/firestore' (functions/ sans node_modules dans ce worktree) |
| tests/unit/invoiceScanCsv8.test.ts | oui | non chargé : Cannot find module '../../functions/node_modules/firebase-functions' (functions/ sans node_modules dans ce worktree) |
| tests/unit/invoiceScanMontantSeul.test.ts | oui | non chargé : Cannot find module '../../functions/node_modules/firebase-functions' (functions/ sans node_modules dans ce worktree) |
| tests/unit/invoiceScanTransport.test.ts | oui | fichier non chargé (dépendance de functions/ absente du worktree) |
| tests/unit/monthlyAiBudget.test.ts | oui | non chargé : Cannot find package 'firebase-admin/firestore' (functions/ sans node_modules dans ce worktree) |
| tests/unit/noloCompanion.test.ts | oui | non chargé : Cannot find package 'cheerio/slim' (functions/ sans node_modules dans ce worktree) |
| tests/unit/rejeu-649b/virgule-transversale.test.ts | oui | « {nombre} unité » sans formateur à virgule, dans src/domain (brewDayBilan, brewDayCalculs, finance/controlesPiece…), code antérieur à la mission |
| tests/unit/yeastBelgianEnrichment.test.ts | oui | fichier non chargé (dépendance de functions/ absente du worktree) |
| tests/unit/yeastBiotransformationScope.test.ts | oui | fichier non chargé (dépendance de functions/ absente du worktree) |
| tests/unit/yeastCatalogue.test.ts | oui | fichier non chargé (dépendance de functions/ absente du worktree) |
| tests/unit/yeastCatalogueEnrichment.test.ts | oui | fichier non chargé (dépendance de functions/ absente du worktree) |
| tests/unit/yeastDbCorrections.test.ts | oui | non chargé : Cannot find package 'firebase-admin/firestore' (functions/ sans node_modules dans ce worktree) |
| tests/unit/yeastFactValues.test.ts | oui | non chargé : Cannot find module 'cheerio' (functions/ sans node_modules dans ce worktree) |
| tests/unit/yeastFermentationContexts.test.ts | oui | non chargé : Cannot find module 'cheerio' (functions/ sans node_modules dans ce worktree) |
| tests/unit/yeastLagerEnrichment.test.ts | oui | non chargé : Cannot find module 'cheerio' (functions/ sans node_modules dans ce worktree) |
