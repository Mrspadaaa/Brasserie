# Gates: voie r7e-dryhopper — Dryhopper, série E (v0 ×8)

OWNS: work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e/**, work/missions/2026-10-22-reprise-lot21/voies/r7e-dryhopper/RESULTAT.md

Scope: huit concepts minimalistes de Dryhopper (« Quand l'ajouter ? »), sur la baseline, un seul facteur libre (le moment), approche la frise.

- [x] G1: baseline : les exigences de toute l'app tiennent sur les concepts 1 à 4 (MOTS joué à part ; coupé en deux pour tenir sous le délai de 120 s de gate-check)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e e1 e2 e3 e4 --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=048a4bc257d80d69967974a52987bee4730e0d2e417f3b3efc3107d34f721a25; exit=0; EXPECT=matched; output-sha256=17c208fcc8bcaece23f4c60d9cb18741b72129c670bc157e4fe6eff6b3b9ac33; output-bytes=191; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: la question de l'outil : un seul facteur libre, le moment (D98)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e e1 e2 e3 e4 e5 e6 e7 e8 --page=etat.html
  EXPECT: /UNE-QUESTION OK \(1 groupe libre : moment\)/
  EVIDENCE: automatic-evidence=v1; definition-sha256=3f5ed94269b3f514cf5dcd0742778b9bbc6e3c8de3e49cff0b414e7411f533ba; exit=0; EXPECT=matched; output-sha256=f4219ea1ffcde5d8b4fd6e02e319974722acd815fd6e92eed386a3f911f00bc2; output-bytes=1010; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: pages, note et captures existent
  CHECK: node scripts/agents/systeme.mjs existent work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e/NOTE.md work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e/e1/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e/captures/e1-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e/e2/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e/captures/e2-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e/e3/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e/captures/e3-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e/e4/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e/captures/e4-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e/e5/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e/captures/e5-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e/e6/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e/captures/e6-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e/e7/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e/captures/e7-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e/e8/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e/captures/e8-390.png
  EXPECT: EXISTENT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=e0408b69fc670c77b740521164ddef23dc7b28ef3994b2cd2513d2c072e792f2; exit=0; EXPECT=matched; output-sha256=34b54ef1b2578ed681137cf3fdaf76aedc1df5adbd8c1c30561fec4d663aa996; output-bytes=15; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: la NOTE dit les concepts, la baseline et ses écarts, et les sorties de D98, D99 et MOTS
  CHECK: node scripts/agents/systeme.mjs note work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e/NOTE.md --contient "## Concepts,## Baseline,D98,D99,MOTS,froide,tiède,chaude"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=8b3199f27d48fab307d07fcbe90593c9a66874efa4ebe2bc7b77129b331d6868; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: le rapport cite les captures ouvertes
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r7e-dryhopper/RESULTAT.md --contient "e1-390.png,e8-390.png,LEÇON PROPOSÉE"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=0585eb3edf66b53d9989ee846a2bb5f40ccd789901e02f3df8a97cc77139bf8a; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: baseline : les exigences de toute l'app tiennent sur les concepts 5 à 8 (MOTS joué à part)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e e5 e6 e7 e8 --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=1bc3fa27847f5c35df0d90297e444649444e0c0ae043796e970afc9a508ea7cc; exit=0; EXPECT=matched; output-sha256=17c208fcc8bcaece23f4c60d9cb18741b72129c670bc157e4fe6eff6b3b9ac33; output-bytes=191; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
