# Gates: voie r7a-dryhopper — Dryhopper, série A (v0 ×8)

OWNS: work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/**, work/missions/2026-10-22-reprise-lot21/voies/r7a-dryhopper/RESULTAT.md

Scope: huit concepts minimalistes de Dryhopper (« Quand l'ajouter ? »), sur la baseline, un seul facteur libre (le moment), approche le geste d'abord.

- [x] G1: baseline : les exigences de toute l'app tiennent sur les concepts 1 à 4 (MOTS joué à part ; coupé en deux pour tenir sous le délai de 120 s de gate-check)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a a1 a2 a3 a4 --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=a69adac4e9d8587bf505dec30b61c4be3daa585618beed6fec5b42406a1f46a2; exit=0; EXPECT=matched; output-sha256=17c208fcc8bcaece23f4c60d9cb18741b72129c670bc157e4fe6eff6b3b9ac33; output-bytes=191; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: la question de l'outil : un seul facteur libre, le moment (D98)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a a1 a2 a3 a4 a5 a6 a7 a8 --page=etat.html
  EXPECT: /UNE-QUESTION OK \(1 groupe libre : moment\)/
  EVIDENCE: automatic-evidence=v1; definition-sha256=101cf4280bbe4032da96832d028c3028da6f06562b67c672caa002f7f79b07f9; exit=0; EXPECT=matched; output-sha256=1ab3db0ea020b3b08865f02f80e3839015c8e0db9dcd40dd20c3c25a59176001; output-bytes=1010; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: pages, note et captures existent
  CHECK: node scripts/agents/systeme.mjs existent work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/NOTE.md work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/a1/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/captures/a1-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/a2/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/captures/a2-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/a3/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/captures/a3-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/a4/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/captures/a4-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/a5/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/captures/a5-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/a6/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/captures/a6-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/a7/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/captures/a7-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/a8/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/captures/a8-390.png
  EXPECT: EXISTENT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=4cffab4a9dd948167168551d3daeb9391dce67ca3cdb5fc6fe3e4efa2558312a; exit=0; EXPECT=matched; output-sha256=34b54ef1b2578ed681137cf3fdaf76aedc1df5adbd8c1c30561fec4d663aa996; output-bytes=15; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: la NOTE dit les concepts, la baseline et ses écarts, et les sorties de D98, D99 et MOTS
  CHECK: node scripts/agents/systeme.mjs note work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/NOTE.md --contient "## Concepts,## Baseline,D98,D99,MOTS,froide,tiède,chaude"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=7e942eae4e1d0493dec102e3d6578f825305091e616dbb4a8bee42fab28b539f; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: le rapport cite les captures ouvertes
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r7a-dryhopper/RESULTAT.md --contient "a1-390.png,a8-390.png,LEÇON PROPOSÉE"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=3f3985cdb1eb2c253283ed0d8ac6697e79a303baac6fef62cdee454366a6dedd; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: baseline : les exigences de toute l'app tiennent sur les concepts 5 à 8 (MOTS joué à part)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a a5 a6 a7 a8 --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=f19a892f4f332c24c5e37512e3c3e76870ac85ce4010c4d2526f2dbb29fd3558; exit=0; EXPECT=matched; output-sha256=17c208fcc8bcaece23f4c60d9cb18741b72129c670bc157e4fe6eff6b3b9ac33; output-bytes=191; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
