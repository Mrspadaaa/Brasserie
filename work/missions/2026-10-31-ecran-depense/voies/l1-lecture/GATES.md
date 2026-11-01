# Gates: voie l1-lecture — la lecture d'une facture contrôlée par le code

OWNS: functions/src/invoiceScanCore.ts, functions/src/prompts.ts, functions/src/ai.ts, tests/unit/invoiceScanCore.test.ts, tests/unit/invoiceVisionReview.test.ts, tests/unit/depense/lecture/, work/missions/2026-10-31-ecran-depense/voies/l1-lecture/

Scope: C1 à C3, A10, A6, A9, P1, P2, A3 du diagnostic d1 ; un point typé par contrôle qui échoue ; Gemini simulé.

- [x] G1: le code des fonctions est typé
  CHECK: npx tsc -p functions/tsconfig.json --noEmit && echo FONCTIONS TYPEES OK
  EXPECT: FONCTIONS TYPEES OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=2ca9a47ec28d4b8d1d5b37461e7187feb150504af41215bc83a5b868f39df91f; exit=0; EXPECT=matched; output-sha256=8e4ded97ddb6a7a5c4a645c00b86e17875e861cf4b41f3247d6326308d8e22b0; output-bytes=21; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: les tests de la lecture passent, la vérité de sa facture comprise
  CHECK: npx vitest run tests/unit/invoiceScanCore.test.ts tests/unit/depense/lecture tests/unit/invoiceVisionReview.test.ts tests/unit/purchasePrefill.test.ts tests/integration/invoiceReview.test.ts tests/unit/invoiceScanTransport.test.ts --maxWorkers=2 && node scripts/check-prompts.mjs && echo TESTS LECTURE OK
  EXPECT: TESTS LECTURE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=2c01cf7902152f990882b77c0e2fed337a928f0fb2018d1e132812196fa652c0; exit=0; EXPECT=matched; output-sha256=4a5da12b9698d0867ecebf82bcfbd2c60da5f236ee03d328b3df048b424b6f0a; output-bytes=45920; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: le plan a été relu par deux regards neufs, sans bloquant laissé
  CHECK: node scripts/agents/systeme.mjs revue work/missions/2026-10-31-ecran-depense/voies/l1-lecture/REVUE-PLAN.md
  EXPECT: REVUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=081094b2c801495abc6af77e2f2c4a3dd17e8b92f40383ac0ad7eb5de1b3a809; exit=0; EXPECT=matched; output-sha256=46d61eb0ad72f72c79273131effbe21eedbdb1da7bf9603c3b297d46749dd1d0; output-bytes=45; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: le résultat dit le témoin, le contrat et ce qui ne se perd pas
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-31-ecran-depense/voies/l1-lecture/RESULTAT.md --contient "TEMOIN AVANT,contrat,Rien ne se perd,372765"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=2a0c583d49b9645ef93371b1918ee81daf13ff58a472bdfb7bc065fa368798d4; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
