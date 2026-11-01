# Gates: voie e-port — l'écran Nouvelle dépense devient r2b (le ticket)

OWNS: src/ui/finance/ExpenseSheet.tsx, src/ui/ModalShell.tsx, tests/unit/depense/raccord/ecran-recu.test.tsx, src/ui/finance/InvoiceScanReview.tsx, src/ui/depense/, src/components/QuickActionModal.tsx, src/domain/finance/forecast.ts, src/ui/finance/FinanceForecastSummary.tsx, tests/integration/expenseSheet.test.tsx, tests/unit/depense/ecran/, work/missions/2026-10-31-ecran-depense/voies/e-port/

Scope: le port de v1/r2b dans ExpenseSheet, ses greffes et les relais des voies de correction ; Drive factice, Gemini simulé.

- [x] G1: la voie est comprise avant le plan
  CHECK: node scripts/agents/systeme.mjs comprendre work/missions/2026-10-31-ecran-depense/voies/e-port
  EXPECT: COMPRIS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=5459e7a25862f05ef10879156cd945b5d9a532ece26e9f9f3ae38e68d2459eb1; exit=0; EXPECT=matched; output-sha256=1f3f59c2f50e5bb301170ef4d11e620e68abb530f0f1595c159f44ad2f1acbf4; output-bytes=22; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: le plan a été relu par deux regards neufs, sans bloquant laissé
  CHECK: node scripts/agents/systeme.mjs revue work/missions/2026-10-31-ecran-depense/voies/e-port/REVUE-PLAN.md
  EXPECT: REVUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=5324644f31df9737e971af34b76ab322d985bb2683d88d721b5b9d41bed97de4; exit=0; EXPECT=matched; output-sha256=bb992e168c32651755a87dd4d97281e055ade89dc0d02ff67228241cc23e7be6; output-bytes=45; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: l'app se construit
  CHECK: npm run build
  EXPECT: built in
  EVIDENCE: automatic-evidence=v1; definition-sha256=46d72eccd628b28a4b0e974e69890ad856bb5d28a16876531804fc540a571513; exit=0; EXPECT=matched; output-sha256=1be5d5ceaca6c6df8aecb0cde2656312fc703c8a178e758ef4774d732e9cd0ac; output-bytes=47377; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: les types tiennent
  CHECK: npx tsc --noEmit -p . && echo TYPES OK
  EXPECT: TYPES OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=80124aa147802b69711fce941250771ac666157ec2b6a3706d483ab28aee9797; exit=0; EXPECT=matched; output-sha256=825f80aa6f2c74e6119827ce9086d829923aeedac46e3c0efa2596d4e807842c; output-bytes=10; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: les tests de la dépense, de l'enregistrement, du stock et de l'écran passent
  CHECK: npx vitest run tests/unit/depense tests/unit/purchaseEntry.test.ts tests/unit/purchasePrefill.test.ts tests/unit/stockLineMatching.test.ts tests/unit/geminiScanner.test.ts tests/integration/expenseSheet.test.tsx tests/integration/jus0Journey.test.tsx tests/integration/driveFileStore.test.ts tests/integration/financeDocumentPersistence.test.ts tests/integration/equipmentProjects.test.tsx tests/integration/financeQuickActions.test.tsx tests/integration/fix114.test.tsx --maxWorkers=2 && echo TESTS ECRAN OK
  EXPECT: TESTS ECRAN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=833cddef43505dbd90cf51a8fbf9db88321f047feff908708f2d1461825fb7da; exit=0; EXPECT=matched; output-sha256=f9e0ae2955ec958214c698eecc33d5960f8fbc061ffc706aea00a4688f5e16e7; output-bytes=17553; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: les champs passent par le composant protégé
  CHECK: node scripts/audit_inputs.mjs
  EXPECT: INPUT PROTECTION AUDIT PASSED
  EVIDENCE: automatic-evidence=v1; definition-sha256=d3e3f2160089544736a60f0b30e68aa9cf8724d150fcdbad47eb194ba0115278; exit=0; EXPECT=matched; output-sha256=baff267ddb77e6beefea8607c0499b6372a71f3b7ff58d2b97a8ac98f1d93c09; output-bytes=146; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [ ] G7: l'écran servi joue la maquette r2b, geste par geste, aux trois modes
  CHECK: node scripts/with_server.mjs --server "npm run dev -- --port 5616 --strictPort" --port 5616 --env VITE_FIREBASE_API_KEY=fake -- node work/missions/2026-10-31-ecran-depense/voies/e-port/capturer-depense.mjs --sortie=work/missions/2026-10-31-ecran-depense/voies/e-port/captures
  EXPECT: DEPENSE OK

- [x] G8: le résultat dit le témoin, ce qui ne se perd pas et les relais
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-31-ecran-depense/voies/e-port/RESULTAT.md --contient "TEMOIN AVANT,Rien ne se perd,pendingId,S8,mouture,recomputeInvoicePoints,captures"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=f1f9c537cbe86924f5cbbda790f5ce0b9bc801679ee87dbf64531a1e978de054; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
