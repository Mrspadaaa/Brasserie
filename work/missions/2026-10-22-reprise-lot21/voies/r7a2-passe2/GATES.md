# Gates: voie r7a2-passe2 — Dryhopper, passe 2 de a1

OWNS: work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/passe2/**, work/missions/2026-10-22-reprise-lot21/voies/r7a2-passe2/RESULTAT.md

Scope: a1 améliorée avec ses greffes : baseline et acquis de Dryhopper, un seul facteur libre (le moment), 80 mots au plus, page sans erreur, captures ouvertes.

- [x] G1: baseline : les exigences de toute l'app tiennent (MOTS joué à part)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/passe2 a1 --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=b4418adb5eb7cfcf8631eaad3e713081720675f943e32c4fd8df82187780fb1a; exit=0; EXPECT=matched; output-sha256=17c208fcc8bcaece23f4c60d9cb18741b72129c670bc157e4fe6eff6b3b9ac33; output-bytes=191; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: 80 mots au plus au premier écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/passe2 a1 --max=80 --page=etat.html
  EXPECT: MOTS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=439209d1044243ea439c64bd3b46948b0975c9a6dd8e015ddb114021c9fe90d7; exit=0; EXPECT=matched; output-sha256=9c4e1fa38b75199688faee50f865b507b50654e817d415d70c77d961f07d81ed; output-bytes=19; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: un seul facteur libre, le moment (D98, édition du contexte admise)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/passe2 a1 --page=etat.html --edition
  EXPECT: /UNE-QUESTION OK \(1 groupe libre : moment\)/
  EVIDENCE: automatic-evidence=v1; definition-sha256=ca11e89c39477fb1831eecfe3a08a7aa4f951af67b0f0a8aa52ae64fad0a1cc9; exit=0; EXPECT=matched; output-sha256=cf05e9fa11b011d200ebe6646cbff072165cf26026d7d955558de6bb8cac2dd5; output-bytes=163; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: les acquis de Dryhopper : geste, frise, valeurs, levure
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-acquis.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/passe2 a1 --page=etat.html --outil=dryhopper
  EXPECT: ACQUIS OK (4/4 : geste, frise, valeurs, levure)
  EVIDENCE: automatic-evidence=v1; definition-sha256=7f40634a0086fe7e5c2963dee8a6a9919e0f3b6a3636a46fac4592cbae3f4176; exit=0; EXPECT=matched; output-sha256=f68c2d9e7429620412766b9fba1cdb61ecca29dce3e7df12d3ad48da2f6d916e; output-bytes=134; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: la page se rend sans erreur de script ni défilement horizontal
  CHECK: node scripts/agents/verifier-page.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/passe2/a1/etat.html --min-images 0
  EXPECT: PAGE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=28d39cd040c6621a6c885bcf56ffe95f56b8a87ed672177033c26428a16ff753; exit=0; EXPECT=matched; output-sha256=8b41bf6d50130554819585d7bc2314ffb9174f5a88af247a6bd7ca1b8522fa10; output-bytes=50; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: page, note et captures existent
  CHECK: node scripts/agents/systeme.mjs existent work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/passe2/a1/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/passe2/NOTE.md work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/passe2/captures/a1-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/passe2/captures/a1-premier-ecran.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/passe2/captures/a1-toucher-390.png
  EXPECT: EXISTENT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=a583d16b279628d06f417dbc17bac541a8a89988c92762e6d5c2f8ec6264231b; exit=0; EXPECT=matched; output-sha256=6135d4eaaef809fdb6913125e25ddab705378564706aac0a57963d6ff2a4e803; output-bytes=14; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: la NOTE dit la passe 2, les greffes et la baseline
  CHECK: node scripts/agents/systeme.mjs note work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/passe2/NOTE.md --contient "## Passe 2,## Baseline,greffe"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=3949da0893dbf4f4b1d47ca264ac8d7d99db5522d56d3fc40347dbf377c21d76; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G8: le rapport cite les captures ouvertes
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r7a2-passe2/RESULTAT.md --contient "a1-premier-ecran.png,a1-toucher-390.png,LEÇON PROPOSÉE"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=615703cd2bb103a74f91878959f24582d34ba223dd041d7277e6c0ebad565292; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
