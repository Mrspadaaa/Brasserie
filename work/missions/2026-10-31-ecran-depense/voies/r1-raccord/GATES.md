# Gates: voie r1-raccord — ce que s1 et s2 ont réparé arrive jusqu'à l'écran, et la ligne reliée s'enregistre

OWNS: src/ui/finance/ExpenseSheet.tsx, src/services/purchaseEntry.ts, src/services/stockLineMatching.ts, tests/unit/purchaseEntry.test.ts, tests/integration/expenseSheet.test.tsx, tests/unit/depense/raccord/, work/missions/2026-10-31-ecran-depense/voies/r1-raccord/

Scope: R1 à R7 (A11, A12, A7, DR1, DR4 à l'écran ; Stk ↔ sachet, écritures d'unités de s1, garde D214 à l'enregistrement) ; Drive factice, Gemini simulé.

- [x] G1: la voie est comprise avant le plan
  CHECK: node scripts/agents/systeme.mjs comprendre work/missions/2026-10-31-ecran-depense/voies/r1-raccord
  EXPECT: COMPRIS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=ac3efdbf882f7f27da24ccb3f501a6f22bec45e8d32311c699ed79273e01c36a; exit=0; EXPECT=matched; output-sha256=f1038729d1c2a139e64cde6a2bc9ab8ee2522c0baa0ba8826d6dbf8811131105; output-bytes=22; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: le plan a été relu par deux regards neufs, sans bloquant laissé
  CHECK: node scripts/agents/systeme.mjs revue work/missions/2026-10-31-ecran-depense/voies/r1-raccord/REVUE-PLAN.md
  EXPECT: REVUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=f53b7fc49dc3fedf284c63b4848889d86d35fd9b3e0f0eee7e69707cd6c48b4f; exit=0; EXPECT=matched; output-sha256=c97c925cda949c74914d49c2f807e8f9fab48f8b4ab310e9c2d446b6fc809385; output-bytes=44; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: l'app se construit
  CHECK: npm run build
  EXPECT: built in
  EVIDENCE: automatic-evidence=v1; definition-sha256=46d72eccd628b28a4b0e974e69890ad856bb5d28a16876531804fc540a571513; exit=0; EXPECT=matched; output-sha256=a841f0b8b97895a17412441315b1cf51332f0e21681bfd5e320216c5576269bc; output-bytes=47377; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: les types tiennent
  CHECK: npx tsc --noEmit -p . && echo TYPES OK
  EXPECT: TYPES OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=80124aa147802b69711fce941250771ac666157ec2b6a3706d483ab28aee9797; exit=0; EXPECT=matched; output-sha256=825f80aa6f2c74e6119827ce9086d829923aeedac46e3c0efa2596d4e807842c; output-bytes=10; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: les tests du raccord, de l'enregistrement, du stock et de l'écran passent
  CHECK: npx vitest run tests/unit/depense tests/unit/purchaseEntry.test.ts tests/unit/purchasePrefill.test.ts tests/unit/stockLineMatching.test.ts tests/integration/expenseSheet.test.tsx tests/integration/jus0Journey.test.tsx tests/integration/driveFileStore.test.ts tests/integration/financeDocumentPersistence.test.ts tests/integration/equipmentProjects.test.tsx --maxWorkers=2 && echo TESTS RACCORD OK
  EXPECT: TESTS RACCORD OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=76445e9fda10ed985cca570cd311d86e253283b849971b2d8f40e594d6adba22; exit=0; EXPECT=matched; output-sha256=128826ba685e098ed4d39a5cc5f40bef56c7dd7c58f3773a258392fea346a911; output-bytes=15111; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: le résultat dit le témoin, la facture 372765, le lien et ce qui ne se perd pas
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-31-ecran-depense/voies/r1-raccord/RESULTAT.md --contient "TEMOIN AVANT,372765,Stk,Kilo,webViewLink,unité à préciser,Rien ne se perd"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=dae00408a41242a84a04125fd6c493eb915f528bf76cbda6a263ee1e390e8f50; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
