# Gates: voie r7g-dryhopper — Dryhopper, série G (v0 ×8)

OWNS: work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-g/**, work/missions/2026-10-22-reprise-lot21/voies/r7g-dryhopper/RESULTAT.md

Scope: huit concepts minimalistes de Dryhopper (« Quand l'ajouter ? »), sur la baseline, un seul facteur libre (le moment), approche libre, brief minimal.

- [x] G1: baseline : les exigences de toute l'app tiennent sur les concepts 1 à 4 (MOTS joué à part ; coupé en deux pour tenir sous le délai de 120 s de gate-check)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-g g1 g2 g3 g4 --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=172285b25c9fa68b764c388046fa6b206033c3be201606368636a0547e79cf17; exit=0; EXPECT=matched; output-sha256=17c208fcc8bcaece23f4c60d9cb18741b72129c670bc157e4fe6eff6b3b9ac33; output-bytes=191; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: la question de l'outil : un seul facteur libre, le moment (D98)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-g g1 g2 g3 g4 g5 g6 g7 g8 --page=etat.html
  EXPECT: /UNE-QUESTION OK \(1 groupe libre : moment\)/
  EVIDENCE: automatic-evidence=v1; definition-sha256=a729119221a0ad0f7a476aea8ad45948a00121f269445aca7065634a2cd8c3de; exit=0; EXPECT=matched; output-sha256=2112402964325a46fc0547436544f855a25ea5be1dcacf38fd68726190063d2d; output-bytes=1010; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: pages, note et captures existent
  CHECK: node scripts/agents/systeme.mjs existent work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-g/NOTE.md work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-g/g1/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-g/captures/g1-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-g/g2/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-g/captures/g2-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-g/g3/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-g/captures/g3-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-g/g4/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-g/captures/g4-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-g/g5/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-g/captures/g5-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-g/g6/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-g/captures/g6-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-g/g7/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-g/captures/g7-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-g/g8/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-g/captures/g8-390.png
  EXPECT: EXISTENT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=d7230cba7dbd91e9fa9a3b93d6088fc6b3370d2637da53508a3e83cee8e54270; exit=0; EXPECT=matched; output-sha256=34b54ef1b2578ed681137cf3fdaf76aedc1df5adbd8c1c30561fec4d663aa996; output-bytes=15; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: la NOTE dit les concepts, la baseline et ses écarts, et les sorties de D98, D99 et MOTS
  CHECK: node scripts/agents/systeme.mjs note work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-g/NOTE.md --contient "## Concepts,## Baseline,D98,D99,MOTS,froide,tiède,chaude"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=0c971ee60ef3adb402b991734a8b6baa9e27461d922c288ea094da2f974d6b4d; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: le rapport cite les captures ouvertes
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r7g-dryhopper/RESULTAT.md --contient "g1-390.png,g8-390.png,LEÇON PROPOSÉE"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=2d4ea2e8af6774f249a7cf93618fba4dd989d65f6c0acc441b6de1e29617fe6e; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: baseline : les exigences de toute l'app tiennent sur les concepts 5 à 8 (MOTS joué à part)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-g g5 g6 g7 g8 --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=2cce24588f8ef3c0319ab07ed3b3daa1440eacc03eb355e87c867cc5a8f275f2; exit=0; EXPECT=matched; output-sha256=17c208fcc8bcaece23f4c60d9cb18741b72129c670bc157e4fe6eff6b3b9ac33; output-bytes=191; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
