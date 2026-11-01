# Gates: voie r2-details — les cinq détails de la relecture de r1

OWNS: src/services/purchaseEntry.ts, src/ui/finance/ExpenseSheet.tsx, tests/unit/purchaseEntry.test.ts, tests/integration/expenseSheet.test.tsx, tests/unit/depense/raccord/, work/missions/2026-10-31-ecran-depense/voies/r2-details/

Scope: détails 3 à 7 de voies/r1-raccord/RELECTURE.md ; Drive factice, Gemini simulé.

- [x] G1: la voie est comprise avant le plan
  CHECK: node scripts/agents/systeme.mjs comprendre work/missions/2026-10-31-ecran-depense/voies/r2-details
  EXPECT: COMPRIS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=f87899a7331fe034d962f1608ef72532da1e3773101f66bcff3cc3925c192402; exit=0; EXPECT=matched; output-sha256=894efba9d20a9c0af2d4f57bf6c3141c1a698d6b9207404de99b7c27589f2dfd; output-bytes=22; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: le plan a été relu par deux regards neufs, sans bloquant laissé
  CHECK: node scripts/agents/systeme.mjs revue work/missions/2026-10-31-ecran-depense/voies/r2-details/REVUE-PLAN.md
  EXPECT: REVUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=5a1fbcb92d5a8e40b0c186a5ec98fdf718970146b2c209ff34cf7b593f07e199; exit=0; EXPECT=matched; output-sha256=070d9b575a7d546488267492e76bcf18da4810ce8a232f233afea318c06cfbb6; output-bytes=44; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: l'app se construit
  CHECK: npm run build
  EXPECT: built in
  EVIDENCE: automatic-evidence=v1; definition-sha256=46d72eccd628b28a4b0e974e69890ad856bb5d28a16876531804fc540a571513; exit=0; EXPECT=matched; output-sha256=a1566498b6f89a9ebe18f4d0453410c1b9f1835e09dc6211d0589b76cc96dab8; output-bytes=47377; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: les types tiennent
  CHECK: npx tsc --noEmit -p . && echo TYPES OK
  EXPECT: TYPES OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=80124aa147802b69711fce941250771ac666157ec2b6a3706d483ab28aee9797; exit=0; EXPECT=matched; output-sha256=825f80aa6f2c74e6119827ce9086d829923aeedac46e3c0efa2596d4e807842c; output-bytes=10; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: les tests du raccord, de l'enregistrement, du stock et de l'écran passent
  CHECK: npx vitest run tests/unit/depense tests/unit/purchaseEntry.test.ts tests/unit/purchasePrefill.test.ts tests/unit/stockLineMatching.test.ts tests/integration/expenseSheet.test.tsx tests/integration/jus0Journey.test.tsx tests/integration/driveFileStore.test.ts tests/integration/financeDocumentPersistence.test.ts tests/integration/equipmentProjects.test.tsx --maxWorkers=2 && echo TESTS DETAILS OK
  EXPECT: TESTS DETAILS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=0b1ff4e2864b9b6fa5a51b3a74c13bb8e760baacc5dd0d297f9b0495335595c2; exit=0; EXPECT=matched; output-sha256=f61a06db1d37438d3123412364c11ff10d9a21cee7dd85b870cbdf186f0305a2; output-bytes=17604; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: le résultat dit le témoin, les cinq détails et ce qui ne se perd pas
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-31-ecran-depense/voies/r2-details/RESULTAT.md --contient "TEMOIN AVANT,SACHET_MAX_G,Rattacher le justificatif,mutation,isConfirmedWriteRejection,pendingId,Rien ne se perd"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=8b81428e2cf3dd8510a768cfb7182084846b165ff05c352bb393216371a06286; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
