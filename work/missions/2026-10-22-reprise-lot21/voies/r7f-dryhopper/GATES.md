# Gates: voie r7f-dryhopper — Dryhopper, série F (v0 ×8)

OWNS: work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-f/**, work/missions/2026-10-22-reprise-lot21/voies/r7f-dryhopper/RESULTAT.md

Scope: huit concepts minimalistes de Dryhopper (« Quand l'ajouter ? »), sur la baseline, un seul facteur libre (le moment), approche créatif à fond.

- [x] G1: baseline : les exigences de toute l'app tiennent sur les concepts 1 à 4 (MOTS joué à part ; coupé en deux pour tenir sous le délai de 120 s de gate-check)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-f f1 f2 f3 f4 --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=5286126b29039770c3e5f156b12c1073bf3c32ae56e143fe7797e6d17da3e376; exit=0; EXPECT=matched; output-sha256=17c208fcc8bcaece23f4c60d9cb18741b72129c670bc157e4fe6eff6b3b9ac33; output-bytes=191; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: la question de l'outil : un seul facteur libre, le moment (D98)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-f f1 f2 f3 f4 f5 f6 f7 f8 --page=etat.html
  EXPECT: /UNE-QUESTION OK \(1 groupe libre : moment\)/
  EVIDENCE: automatic-evidence=v1; definition-sha256=6941594bf8369f830d724630e5071aa676122e1debfd5916d6bddf61f6364c80; exit=0; EXPECT=matched; output-sha256=ff215716cfcf4bb7bb0062dbf6914dc0cf80d4d14f7a4d90f101129d834c70c3; output-bytes=1028; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: pages, note et captures existent
  CHECK: node scripts/agents/systeme.mjs existent work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-f/NOTE.md work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-f/f1/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-f/captures/f1-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-f/f2/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-f/captures/f2-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-f/f3/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-f/captures/f3-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-f/f4/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-f/captures/f4-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-f/f5/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-f/captures/f5-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-f/f6/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-f/captures/f6-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-f/f7/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-f/captures/f7-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-f/f8/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-f/captures/f8-390.png
  EXPECT: EXISTENT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=30a4b527b05320ce471b8ad69e3104d1a5cb3c4048927684011716df3310eddf; exit=0; EXPECT=matched; output-sha256=34b54ef1b2578ed681137cf3fdaf76aedc1df5adbd8c1c30561fec4d663aa996; output-bytes=15; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: la NOTE dit les concepts, la baseline et ses écarts, et les sorties de D98, D99 et MOTS
  CHECK: node scripts/agents/systeme.mjs note work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-f/NOTE.md --contient "## Concepts,## Baseline,D98,D99,MOTS,froide,tiède,chaude"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=2cda7d4c7435f9c3636644d130f923cc84eb299f2bdf1a7b256d18c2262c65f8; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: le rapport cite les captures ouvertes
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r7f-dryhopper/RESULTAT.md --contient "f1-390.png,f8-390.png,LEÇON PROPOSÉE"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=22835f4de9ad8917fea6a7a5389b1c7c90c2b6abc2136fc29deaf1f2ab576f74; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: baseline : les exigences de toute l'app tiennent sur les concepts 5 à 8 (MOTS joué à part)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-f f5 f6 f7 f8 --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=90a7e46f78b852c45602edacb8d065f40d19a303fe08499ba1314fb9b0393ef8; exit=0; EXPECT=matched; output-sha256=17c208fcc8bcaece23f4c60d9cb18741b72129c670bc157e4fe6eff6b3b9ac33; output-bytes=191; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
