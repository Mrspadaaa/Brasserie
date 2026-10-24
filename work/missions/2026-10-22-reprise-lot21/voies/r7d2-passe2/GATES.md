# Gates: voie r7d2-passe2 — Dryhopper, passe 2 de d8

OWNS: work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-d/passe2/**, work/missions/2026-10-22-reprise-lot21/voies/r7d2-passe2/RESULTAT.md

Scope: d8 améliorée avec ses greffes : baseline et acquis de Dryhopper, un seul facteur libre (le moment), 80 mots au plus, page sans erreur, captures ouvertes.

- [x] G1: baseline : les exigences de toute l'app tiennent (MOTS joué à part)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-d/passe2 d8 --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=44b57ed3419f008777a127f1a93468c84559373aaa6ac41d5a10e085949a9083; exit=0; EXPECT=matched; output-sha256=17c208fcc8bcaece23f4c60d9cb18741b72129c670bc157e4fe6eff6b3b9ac33; output-bytes=191; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: 80 mots au plus au premier écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-d/passe2 d8 --max=80 --page=etat.html
  EXPECT: MOTS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=662078b842f11d944a93d245260a377a210265db0e4587b053d6538e71b360fa; exit=0; EXPECT=matched; output-sha256=8fc1fd5e99253e7044bb5a0c0121812c9d2ebb57825dbb2411e57e490932e9f9; output-bytes=19; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: un seul facteur libre, le moment (D98, édition du contexte admise)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-d/passe2 d8 --page=etat.html --edition
  EXPECT: /UNE-QUESTION OK \(1 groupe libre : moment\)/
  EVIDENCE: automatic-evidence=v1; definition-sha256=550a9d34923fe78a8ff3c9462fd1b1018c96196d36c50a4760fdeb58674260c5; exit=0; EXPECT=matched; output-sha256=990ea29fc278a49d454db243a4a6215a090902eada3636e106e488e8fa0460c0; output-bytes=164; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: les acquis de Dryhopper : geste, frise, valeurs, levure
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-acquis.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-d/passe2 d8 --page=etat.html --outil=dryhopper
  EXPECT: ACQUIS OK (4/4 : geste, frise, valeurs, levure)
  EVIDENCE: automatic-evidence=v1; definition-sha256=96f38baad8d097416e3b9ee3487f7c9ca53cea22a76dc86b6252ed26158b2b51; exit=0; EXPECT=matched; output-sha256=6cb579d48ceb83506bb1e7f67e25c290fe13b447dd774cb6aad8ffecaae15a18; output-bytes=134; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: la page se rend sans erreur de script ni défilement horizontal
  CHECK: node scripts/agents/verifier-page.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-d/passe2/d8/etat.html --min-images 0
  EXPECT: PAGE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=c1f0cb7a2b306d09e3fa41ed08a2371f82805c0fb0e22f20e43f2f237e8ee7d3; exit=0; EXPECT=matched; output-sha256=8b41bf6d50130554819585d7bc2314ffb9174f5a88af247a6bd7ca1b8522fa10; output-bytes=50; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: page, note et captures existent
  CHECK: node scripts/agents/systeme.mjs existent work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-d/passe2/d8/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-d/passe2/NOTE.md work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-d/passe2/captures/d8-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-d/passe2/captures/d8-premier-ecran.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-d/passe2/captures/d8-toucher-390.png
  EXPECT: EXISTENT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=2f950511a1a6a18caa8bed5785058c8e7cd4e7df7e7524e59d723c2b23f77dca; exit=0; EXPECT=matched; output-sha256=6135d4eaaef809fdb6913125e25ddab705378564706aac0a57963d6ff2a4e803; output-bytes=14; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: la NOTE dit la passe 2, les greffes et la baseline
  CHECK: node scripts/agents/systeme.mjs note work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-d/passe2/NOTE.md --contient "## Passe 2,## Baseline,greffe"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=c27bb81a9579bba3059a1e864ac98cd4900c19d9ae70cacba2a4e925c5101613; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G8: le rapport cite les captures ouvertes
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r7d2-passe2/RESULTAT.md --contient "d8-premier-ecran.png,d8-toucher-390.png,LEÇON PROPOSÉE"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=b5d571c4bdf295a2d42159c785300854d38aa8a92ba8e397bc050c65623e5d91; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
