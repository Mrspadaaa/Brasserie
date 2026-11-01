# Gates: voie p3c-port-b — corriger le port de p3c-3 (relecture du code et verdict du critique)

OWNS: src/ui/finance/ExpenseSheet.tsx, src/ui/finance/InvoiceScanReview.tsx, src/ui/depense/, src/ui/ModalShell.tsx, tests/integration/expenseSheet.test.tsx, tests/integration/expenseSheetMouture.test.tsx, tests/integration/jus0Journey.test.tsx, tests/unit/depense/ecran/, tests/unit/depense/qr/, tests/unit/depense/fiche/ecran.test.tsx, tests/unit/depense/stock/ecran.test.ts, tests/unit/depense/stock/unites.test.ts, scripts/check-invoice-journey-emulator.mjs, work/missions/2026-10-31-ecran-depense/voies/p3c-port/capturer-p3c.mjs, work/missions/2026-10-31-ecran-depense/voies/p3c-port/captures/, work/missions/2026-10-31-ecran-depense/voies/p3c-port-b/

Scope: B1, M1 à M3, D1 à D12 de REVUE-code.md et les points 1 à 9 de VERDICT-p3c-port.md ; Drive factice, Gemini simulé.

- [ ] G1: l'app se construit dans la copie isolée
  CHECK: node work/missions/2026-10-31-ecran-depense/voies/p3c-port/copie.mjs "npm run build && echo BUILD COPIE OK"
  EXPECT: BUILD COPIE OK
  EVIDENCE: pending

- [ ] G2: les types tiennent
  CHECK: node work/missions/2026-10-31-ecran-depense/voies/p3c-port/copie.mjs "npx tsc --noEmit -p . && echo TYPES OK"
  EXPECT: TYPES OK
  EVIDENCE: pending

- [ ] G3: les tests de la dépense, de l'enregistrement, du stock et de l'écran passent
  CHECK: node work/missions/2026-10-31-ecran-depense/voies/p3c-port/copie.mjs "npx vitest run tests/unit/depense tests/unit/purchaseEntry.test.ts tests/unit/purchasePrefill.test.ts tests/unit/stockLineMatching.test.ts tests/unit/geminiScanner.test.ts tests/integration/expenseSheet.test.tsx tests/integration/expenseSheetMouture.test.tsx tests/integration/jus0Journey.test.tsx tests/integration/driveFileStore.test.ts tests/integration/financeDocumentPersistence.test.ts tests/integration/financeQuickActions.test.tsx tests/integration/equipmentProjects.test.tsx tests/integration/ModalHandoff.behavior.test.tsx --maxWorkers=2 && echo TESTS ECRAN OK"
  EXPECT: TESTS ECRAN OK
  EVIDENCE: pending

- [ ] G4: les champs passent par le composant protégé, sans accès de développement
  CHECK: node scripts/audit_inputs.mjs && node scripts/check-no-dev-auth.mjs && echo GARDES OK
  EXPECT: GARDES OK
  EVIDENCE: pending

- [ ] G5: l'assertion vide (B1) et la phrase du tiroir de port (M2) ont disparu ; le script d'émulateur se lit
  CHECK: bash -c '! grep -rq "data-dp-chevron" tests/unit/depense/ecran/tri.test.tsx && ! grep -q "non compté dans les bandes" src/ui/finance/ExpenseSheet.tsx && node --check scripts/check-invoice-journey-emulator.mjs && ! grep -q "Détails de la lecture" scripts/check-invoice-journey-emulator.mjs && echo CORRECTIFS OK'
  EXPECT: CORRECTIFS OK
  EVIDENCE: pending

- [ ] G6: l'écran servi joue p3c-3 et le sceau z2, avec les contrôles neufs des points critiques 1 à 3
  CHECK: node work/missions/2026-10-31-ecran-depense/voies/p3c-port/copie.mjs "node scripts/with_server.mjs --server \"npm run dev -- --port 3458 --strictPort\" --port 3458 --env VITE_FIREBASE_API_KEY=fake -- node C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-10-31-ecran-depense/voies/p3c-port/capturer-p3c.mjs --url=http://localhost:3458 --sortie=C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-10-31-ecran-depense/voies/p3c-port/captures"
  EXPECT: P3C OK
  EVIDENCE: pending

- [ ] G7: le capturer contient les contrôles neufs (récap collant, tête compacte, chip du pied)
  CHECK: bash -c 'f=work/missions/2026-10-31-ecran-depense/voies/p3c-port/capturer-p3c.mjs; grep -qi "collant\|sticky" $f && grep -qi "compact\|tete\|tête" $f && grep -qi "chip.*pied\|pied.*chip\|160" $f && echo CONTROLES NEUFS OK'
  EXPECT: CONTROLES NEUFS OK
  EVIDENCE: pending

- [ ] G8: le résultat dit les témoins, chaque correction et chaque test modifié
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-31-ecran-depense/voies/p3c-port-b/RESULTAT.md --contient "TEMOIN AVANT,Corrigé,avant → après,Rien ne se perd,captures"
  EXPECT: NOTE OK
  EVIDENCE: pending
