# Gates: voie p1-port — r4-a dans l'étape Identité de l'app

OWNS: src/pages/BrewWizard.tsx, src/pages/recipe-wizard.css, src/ui/identite/, tests/unit/identite/, work/refonte-frontend/v4/choix/ecrans-app.json, work/missions/2026-10-31-ecran-identite/v1/r4-a/, work/missions/2026-10-31-ecran-identite/voies/p1-port/

Scope: l'étape Identité de l'app reprend r4-a telle quelle, avec ses adaptations et la cuve qui déborde.

- [x] G1: l'app se construit
  CHECK: npm run build
  EXPECT: built in
  EVIDENCE: automatic-evidence=v1; definition-sha256=46d72eccd628b28a4b0e974e69890ad856bb5d28a16876531804fc540a571513; exit=0; EXPECT=matched; output-sha256=aa286b038f06c3149c37d2edc7417beabc62eb5b1ba02455ee9f822d02c5b617; output-bytes=47234; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: les tests de l'étape Identité passent
  CHECK: npx vitest run tests/unit/identite --maxWorkers=2 && echo TESTS IDENTITE OK
  EXPECT: TESTS IDENTITE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=fc99be0d6e73595b63f5315b93ef31e23a4d1c60e2ae415cea9490edf30f9ac5; exit=0; EXPECT=matched; output-sha256=02340ef8bff8ad8c007192dddb35dbfd4fd57d35b62fcc31ad0305eb4992414a; output-bytes=1370; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: le registre des choix de l'app est valide
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-choix.mjs --registre --registre=work/refonte-frontend/v4/choix/ecrans-app.json
  EXPECT: REGISTRE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=e6af4d5a8af53626e316498d70882c353ba359b1c1b0f6cdf462b627b42cc7a3; exit=0; EXPECT=matched; output-sha256=c7c48a987a2f8140c35b57c3b18fa00af4a3022ccbf58f1d48f8a519438689ea; output-bytes=24; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: le résultat liste ce que devient chaque fonction et demande les captures Chrome
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-31-ecran-identite/voies/p1-port/RESULTAT.md --contient "Rien ne se perd,DEMANDE EXECUTANT,lint:design,+22 L de trop"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=a3793d0f20d2a6fc1862c5aa510cc9cd0ab7a17603ab93ae7835be010474c944; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
