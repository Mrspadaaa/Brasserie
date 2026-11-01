# Gates: voie p8-port — son choix s1 dans l'étape Malts/sucres de l'app

OWNS: src/pages/BrewWizard.tsx, src/pages/recipe-wizard.css, src/ui/fermentescibles/, tests/unit/fermentescibles/, work/missions/2026-10-31-ecran-fermentescibles/controle-masse-ligne.mjs, work/missions/2026-10-31-ecran-fermentescibles/controle-moment-ligne.mjs, work/missions/2026-10-31-ecran-fermentescibles/controle-recherche.mjs, work/refonte-frontend/v4/tournoi/outils/controle-volee.mjs, work/refonte-frontend/v4/tournoi/outils/controle-gestes-ligne.mjs, work/missions/2026-10-31-ecran-fermentescibles/voies/p8-port/

Scope: l'étape Fermentables devient v7/s1 geste par geste ; les contrôles du registre tournent sur l'app servie ; rien ne se perd.

- [x] G1: la voie est comprise
  CHECK: node scripts/agents/systeme.mjs comprendre work/missions/2026-10-31-ecran-fermentescibles/voies/p8-port
  EXPECT: COMPRIS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=5355f8b7e8240a2ea7ca7feb7cd2956cd2b0044877697bc7d3f15ccbce7dfe87; exit=0; EXPECT=matched; output-sha256=1f3f59c2f50e5bb301170ef4d11e620e68abb530f0f1595c159f44ad2f1acbf4; output-bytes=22; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: l'app se construit
  CHECK: npm run build
  EXPECT: built in
  EVIDENCE: automatic-evidence=v1; definition-sha256=46d72eccd628b28a4b0e974e69890ad856bb5d28a16876531804fc540a571513; exit=0; EXPECT=matched; output-sha256=9e8a97051015b067633fe553b8b21ac87d24dddd362384ac6a851450f7311306; output-bytes=47663; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: les types tiennent
  CHECK: npx tsc --noEmit -p . && echo TYPES OK
  EXPECT: TYPES OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=80124aa147802b69711fce941250771ac666157ec2b6a3706d483ab28aee9797; exit=0; EXPECT=matched; output-sha256=825f80aa6f2c74e6119827ce9086d829923aeedac46e3c0efa2596d4e807842c; output-bytes=10; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: les tests de l'étape passent
  CHECK: npx vitest run tests/unit/fermentescibles --maxWorkers=2 && echo TESTS MALTS OK
  EXPECT: TESTS MALTS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=dffb537b83f4c4dcbc3406687ed647725ff341141349d87eefce5aaa7dc1e7b5; exit=0; EXPECT=matched; output-sha256=671e82da43c21e80775cfbc5fb5938bea1f64ff36a32270702ee4df761e76937; output-bytes=4365; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: chaque champ passe par la saisie protégée
  CHECK: node scripts/audit_inputs.mjs
  EXPECT: INPUT PROTECTION AUDIT PASSED
  EVIDENCE: automatic-evidence=v1; definition-sha256=d3e3f2160089544736a60f0b30e68aa9cf8724d150fcdbad47eb194ba0115278; exit=0; EXPECT=matched; output-sha256=dd3ea0805497a5728e1bfd10af23bf811bafc62ff1044c31a07aa4323ef08d06; output-bytes=146; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: le registre des choix de l'app reste valide
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-choix.mjs --registre --registre=work/refonte-frontend/v4/choix/ecrans-app.json
  EXPECT: REGISTRE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=e6af4d5a8af53626e316498d70882c353ba359b1c1b0f6cdf462b627b42cc7a3; exit=0; EXPECT=matched; output-sha256=5fcf82069ba8c6b744b3cf479cfba6c48b452350193888c5f103315f82ed7b65; output-bytes=24; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [ ] G7: la série Chrome passe sur l'app servie, contrôles du registre compris
  CHECK: node scripts/with_server.mjs --server "npm run dev -- --port 5615 --strictPort" --port 5615 --env VITE_HOP_V4=on --env VITE_FIREBASE_API_KEY=fake -- node work/missions/2026-10-31-ecran-fermentescibles/voies/p8-port/capturer-malts.mjs --sortie=work/missions/2026-10-31-ecran-fermentescibles/voies/p8-port/captures
  EXPECT: MALTS OK

- [x] G8: le résultat dit ce qui ne se perd pas, l'appel de la proposition et les captures
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-31-ecran-fermentescibles/voies/p8-port/RESULTAT.md --contient "Rien ne se perd,proposerFermentables,Munich,stockItemRef,captures"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=f3598a935e826501b41914aa704b0f2d80f951e0e7a3323ffff5f5d8f35f32f6; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
