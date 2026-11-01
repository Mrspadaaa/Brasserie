# Gates: voie l2-rapprochement — rapprochement des lectures, statut, points typés jusqu'au client

OWNS: functions/src/invoiceVisionReview.ts, functions/src/ai.ts, functions/src/invoiceScanCore.ts, functions/src/invoiceControls.ts, functions/src/invoiceScanBudget.ts, tests/unit/invoiceScanBudget.test.ts, src/services/geminiScanner.ts, src/services/purchasePrefill.ts, src/services/invoicePoints.ts, src/domain/finance/invoicePoints.ts, tests/unit/invoiceVisionReview.test.ts, tests/unit/invoiceScanCore.test.ts, tests/unit/purchasePrefill.test.ts, tests/unit/geminiScanner.test.ts, tests/unit/depense/rapprochement/, work/missions/2026-10-31-ecran-depense/voies/l2-rapprochement/

Scope: A1, A2, U1, LE1, LE4 et les relais 1 à 4 de l1 ; Gemini simulé ; aucun déploiement.

- [x] G1: la voie est comprise avant le plan
  CHECK: node scripts/agents/systeme.mjs comprendre work/missions/2026-10-31-ecran-depense/voies/l2-rapprochement
  EXPECT: COMPRIS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=852b42f4aa5557f78a9296259460740b88c1eca1432eb37595a763b76ad23462; exit=0; EXPECT=matched; output-sha256=f1038729d1c2a139e64cde6a2bc9ab8ee2522c0baa0ba8826d6dbf8811131105; output-bytes=22; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: le plan a été relu par deux regards neufs, sans bloquant laissé
  CHECK: node scripts/agents/systeme.mjs revue work/missions/2026-10-31-ecran-depense/voies/l2-rapprochement/REVUE-PLAN.md
  EXPECT: REVUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=17529611e3e8e4062818476078e559641ba9ac1402d1c6cc74d631232e54bf2b; exit=0; EXPECT=matched; output-sha256=24b6a2670abe8bf76bdfb3fe181dcb7befb32dd5180490357288156d767fa10f; output-bytes=45; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: l'app se construit
  CHECK: npm run build
  EXPECT: built in
  EVIDENCE: automatic-evidence=v1; definition-sha256=46d72eccd628b28a4b0e974e69890ad856bb5d28a16876531804fc540a571513; exit=0; EXPECT=matched; output-sha256=88e961afa563f8a17852a609e4633a651ce20caf42ba37d3f61be81aaa27ecc3; output-bytes=47377; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: les types tiennent, côté app et côté fonctions
  CHECK: npx tsc --noEmit -p . && npx tsc --noEmit -p functions && echo TYPES OK
  EXPECT: TYPES OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=eb7572c0c73b37883ef72550f148ff5d9b6e76a5c98344c03e6cb046358a31e0; exit=0; EXPECT=matched; output-sha256=825f80aa6f2c74e6119827ce9086d829923aeedac46e3c0efa2596d4e807842c; output-bytes=10; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: les tests de la lecture, du rapprochement et du pré-remplissage passent
  CHECK: npx vitest run tests/unit/depense tests/unit/invoiceVisionReview.test.ts tests/unit/invoiceScanCore.test.ts tests/unit/purchasePrefill.test.ts tests/integration/invoiceReview.test.ts tests/unit/invoiceScanTransport.test.ts tests/unit/invoiceScanBudget.test.ts tests/unit/geminiScanner.test.ts tests/integration/expenseSheet.test.tsx --maxWorkers=2 && echo TESTS RAPPROCHEMENT OK
  EXPECT: TESTS RAPPROCHEMENT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=74c6a79559c685b345bbf222c797fd341f8004d13caf2cd8dd49b558d381e12b; exit=0; EXPECT=matched; output-sha256=f6a45eac1dd007a1bf97522ca01c7876e9b36741c8f404f51a8396927dced10a; output-bytes=59680; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: le résultat dit le témoin, la facture 372765, les troisièmes lectures et ce qui ne se perd pas
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-31-ecran-depense/voies/l2-rapprochement/RESULTAT.md --contient "TEMOIN AVANT,372765,needsCorrection,documentTypeRetenu,troisième lecture,Rien ne se perd"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=0f8db2beed7f6b3e293ae08eed975314695fe94685bc6bfa72fe823a3da16c9f; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
