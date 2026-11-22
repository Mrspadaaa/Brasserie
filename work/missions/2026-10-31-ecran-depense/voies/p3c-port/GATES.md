# Gates: voie p3c-port — l'écran Nouvelle dépense devient p3c-3, avec le sceau QR z2

OWNS: src/ui/finance/ExpenseSheet.tsx, src/ui/finance/InvoiceScanReview.tsx, src/ui/depense/, src/ui/ModalShell.tsx, tests/integration/expenseSheet.test.tsx, tests/unit/depense/ecran/, tests/unit/depense/qr/, tests/unit/depense/fiche/ecran.test.tsx, tests/unit/depense/stock/ecran.test.ts, tests/integration/jus0Journey.test.tsx, tests/integration/expenseSheetMouture.test.tsx, tests/unit/depense/stock/unites.test.ts, scripts/check-invoice-journey-emulator.mjs, work/missions/2026-10-31-ecran-depense/voies/p3c-port/

Scope: le port de v3/p3c-3 (retouchée) dans ExpenseSheet, plein écran à 390, sceau z2 tel quel, port en « dont port » ; Drive factice, Gemini simulé.

- [ ] G1: la voie est comprise avant le plan
  CHECK: node scripts/agents/systeme.mjs comprendre work/missions/2026-10-31-ecran-depense/voies/p3c-port
  EXPECT: COMPRIS OK
  EVIDENCE: pending

- [ ] G2: le plan a été relu par deux regards neufs, sans bloquant laissé
  CHECK: node scripts/agents/systeme.mjs revue work/missions/2026-10-31-ecran-depense/voies/p3c-port/REVUE-PLAN.md
  EXPECT: REVUE OK
  EVIDENCE: pending

- [ ] G3: l'app se construit dans la copie isolée
  CHECK: node work/missions/2026-10-31-ecran-depense/voies/p3c-port/copie.mjs "npm run build && echo BUILD COPIE OK"
  EXPECT: BUILD COPIE OK
  EVIDENCE: pending

- [ ] G4: les types tiennent
  CHECK: node work/missions/2026-10-31-ecran-depense/voies/p3c-port/copie.mjs "npx tsc --noEmit -p . && echo TYPES OK"
  EXPECT: TYPES OK
  EVIDENCE: pending

- [ ] G5: les tests de la dépense, de l'enregistrement, du stock et de l'écran passent
  CHECK: node work/missions/2026-10-31-ecran-depense/voies/p3c-port/copie.mjs "npx vitest run tests/unit/depense tests/unit/purchaseEntry.test.ts tests/unit/purchasePrefill.test.ts tests/unit/stockLineMatching.test.ts tests/unit/geminiScanner.test.ts tests/integration/expenseSheet.test.tsx tests/integration/expenseSheetMouture.test.tsx tests/integration/jus0Journey.test.tsx tests/integration/driveFileStore.test.ts tests/integration/financeDocumentPersistence.test.ts tests/integration/financeQuickActions.test.tsx tests/integration/equipmentProjects.test.tsx tests/integration/ModalHandoff.behavior.test.tsx --maxWorkers=2 && echo TESTS ECRAN OK"
  EXPECT: TESTS ECRAN OK
  EVIDENCE: pending

- [ ] G6: les champs passent par le composant protégé, sans accès de développement
  CHECK: node scripts/audit_inputs.mjs && node scripts/check-no-dev-auth.mjs && echo GARDES OK
  EXPECT: GARDES OK
  EVIDENCE: pending

- [ ] G7: l'écran servi joue p3c-3 et le sceau z2, geste par geste, aux trois modes
  CHECK: node work/missions/2026-10-31-ecran-depense/voies/p3c-port/copie.mjs "node scripts/with_server.mjs --server \"npm run dev -- --port 3458 --strictPort\" --port 3458 --env VITE_FIREBASE_API_KEY=fake -- node C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-10-31-ecran-depense/voies/p3c-port/capturer-p3c.mjs --url=http://localhost:3458 --sortie=C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-10-31-ecran-depense/voies/p3c-port/captures"
  EXPECT: P3C OK
  EVIDENCE: pending

- [ ] G8: le résultat dit le témoin, ce qui ne se perd pas et les écarts à la maquette
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-31-ecran-depense/voies/p3c-port/RESULTAT.md --contient "TEMOIN AVANT,Rien ne se perd,dont port,sceau,captures"
  EXPECT: NOTE OK
  EVIDENCE: pending
