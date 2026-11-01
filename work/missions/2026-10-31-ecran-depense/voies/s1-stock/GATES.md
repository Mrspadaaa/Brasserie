# Gates: voie s1-stock — chaque ligne de facture reliée au bon article, ou à aucun

OWNS: src/services/stockLineMatching.ts, src/services/ingredientIdentity.ts, src/ui/finance/ExpenseSheet.tsx, tests/unit/stockLineMatching.test.ts, tests/integration/jus0Journey.test.tsx, tests/unit/depense/stock/, work/missions/2026-10-31-ecran-depense/voies/s1-stock/

Scope: S1 à S4, A8, A9, B-V3-5 ; la chasse du 17.10 sans fausse proposition ; Gemini simulé.

- [x] G1: l'app se construit
  CHECK: npm run build
  EXPECT: built in
  EVIDENCE: automatic-evidence=v1; definition-sha256=46d72eccd628b28a4b0e974e69890ad856bb5d28a16876531804fc540a571513; exit=0; EXPECT=matched; output-sha256=c005931d2db7f3cfa7f242ec2b4a4567139b3609196568dc1ddbe764dca28bcb; output-bytes=47377; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: les tests de l'appariement passent, la chasse et sa facture comprises
  CHECK: npx vitest run tests/unit/stockLineMatching.test.ts tests/unit/depense/stock tests/unit/purchaseEntry.test.ts tests/unit/purchasePrefill.test.ts tests/integration/jus0Journey.test.tsx tests/integration/expenseSheet.test.tsx --maxWorkers=2 && echo TESTS STOCK OK
  EXPECT: TESTS STOCK OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=608994314c293ccf782221f7547dc111a27df03ce13c3cec536bfb4e7e131330; exit=0; EXPECT=matched; output-sha256=a4036c129713586ccd3762f4986f00636ac406d8842bf079cbdae328143ad9c9; output-bytes=3731; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: le plan a été relu par deux regards neufs, sans bloquant laissé
  CHECK: node scripts/agents/systeme.mjs revue work/missions/2026-10-31-ecran-depense/voies/s1-stock/REVUE-PLAN.md
  EXPECT: REVUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=426f34c9671525e386205e1f12eb8898f0982fd922ef61a3496e8ef9c47f238d; exit=0; EXPECT=matched; output-sha256=c352b3c479586144e65178b93d0a304ec0e62bdaf9b52217f1229ce1cf324b36; output-bytes=45; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: le résultat dit le témoin, la chasse et ce qui ne se perd pas
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-31-ecran-depense/voies/s1-stock/RESULTAT.md --contient "TEMOIN AVANT,0 fausse proposition,Rien ne se perd,372765,unités"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=a1105fe330b58f58d5456c04e9885756890b9919e840aa3f3deefc37372b3429; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
