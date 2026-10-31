# Gates: voie s2-enregistrement — la dépense enregistrée juste, et son justificatif prouvé

OWNS: src/services/purchaseEntry.ts, src/services/purchasePrefill.ts, src/services/financeDocuments.ts, src/services/driveFileStore.ts, src/domain/finance/brewBudget.ts, src/domain/finance/types.ts, tests/unit/purchaseEntry.test.ts, tests/unit/purchasePrefill.test.ts, tests/unit/financeDocuments.test.ts, tests/integration/driveFileStore.test.ts, tests/integration/financeDocumentPersistence.test.ts, tests/unit/depense/enregistrement/, work/missions/2026-10-31-ecran-depense/voies/s2-enregistrement/

Scope: A7, A11, A12, S5, S7, S8, DR1, DR4 (message), DR5 ; Drive factice, Gemini simulé.

- [x] G1: l'app se construit
  CHECK: npm run build
  EXPECT: built in
  EVIDENCE: automatic-evidence=v1; definition-sha256=46d72eccd628b28a4b0e974e69890ad856bb5d28a16876531804fc540a571513; exit=0; EXPECT=matched; output-sha256=7e5fec750584b0ced33e5512f1188b2199c3aec278a960dbfd5c5c186dbb31f9; output-bytes=47234; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: les tests de l'enregistrement et du Drive factice passent
  CHECK: npx vitest run tests/unit/purchaseEntry.test.ts tests/unit/purchasePrefill.test.ts tests/unit/financeDocuments.test.ts tests/integration/driveFileStore.test.ts tests/integration/financeDocumentPersistence.test.ts tests/integration/expenseSheet.test.tsx tests/unit/brewBudget.test.ts tests/unit/financeArchiveContinuity.test.ts tests/unit/depense/enregistrement --maxWorkers=2 && echo TESTS ENREGISTREMENT OK
  EXPECT: TESTS ENREGISTREMENT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=44fd9fec6658b7201b41e5e3ca247118cb3b8dbc369e9a686788bdf8e977e9a6; exit=0; EXPECT=matched; output-sha256=6bd47ce90916801e6d8c73ae2a378b6aae69545f8467147c7141211c7f747a9a; output-bytes=2495; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: le plan a été relu par deux regards neufs, sans bloquant laissé
  CHECK: node scripts/agents/systeme.mjs revue work/missions/2026-10-31-ecran-depense/voies/s2-enregistrement/REVUE-PLAN.md
  EXPECT: REVUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=8de70f6e5c56fa5dc01ae5691270b79a3e3627923926ef9fa7d6bbb577901f10; exit=0; EXPECT=matched; output-sha256=47e8b7c2de8f3066d6d4d06faf54822e6b98bc170645b3031f450063c737c5d8; output-bytes=45; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: le résultat dit le témoin, la mouture et ce qui ne se perd pas
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-31-ecran-depense/voies/s2-enregistrement/RESULTAT.md --contient "TEMOIN AVANT,Zuschlag Schrotung,webViewLink,Rien ne se perd"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=212391954a26aedc0cbda4e49913830d17a7dc28ba5208ab344b253636a4ceb3; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
