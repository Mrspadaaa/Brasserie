# Gates: voie r6f-meme-amertume — Même amertume, quel arôme ?

OWNS: work/refonte-frontend/v4/ecran-1/fils22-comparer/r6f/**, work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6f-*.png, work/missions/2026-10-22-reprise-lot21/voies/r6f-meme-amertume/RESULTAT.md

Scope: une mini maquette de Comparer (lot 22) qui ne laisse libre que la variété, porte les quatre acquis et les choix Radar : r2 ; Base : IBU égal ; Porte : non ; Descripteurs : B.

- [x] G1: les exigences de toute l'app tiennent (MOTS joué à part, à 80)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6f --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=55286297a1aa898901ec846cfc962c6ae271b28e9d5db5bd44a74fe391be16cd; exit=0; EXPECT=matched; output-sha256=17c208fcc8bcaece23f4c60d9cb18741b72129c670bc157e4fe6eff6b3b9ac33; output-bytes=191; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: 80 mots au plus au premier écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6f --max=80 --page=etat.html
  EXPECT: MOTS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=e8ceac1a610f88e2d352464c333b4b17a5ff0c2df81fe140d0bccd455d0d24ef; exit=0; EXPECT=matched; output-sha256=c8e3ed8a62ecba27adf64a75cd2ffd4567b2d4f131a267f4ec5756ab70417b5b; output-bytes=20; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: un seul facteur libre, la variété (D98)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6f --page=etat.html
  EXPECT: /UNE-QUESTION OK \(1 groupe libre : houblon\)/
  EVIDENCE: automatic-evidence=v1; definition-sha256=1ebded1ddb1d9e52f010d82bb841d95b41b06ce3949a0388e33a63808d96ede5; exit=0; EXPECT=matched; output-sha256=983fa08636c2aff7cdc59c08a53656942048c14a5975e52740914ce641a0b6ea; output-bytes=172; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: les quatre acquis sont là (D99)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-acquis.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6f --page=etat.html
  EXPECT: ACQUIS OK (4/4
  EVIDENCE: automatic-evidence=v1; definition-sha256=fb6630176f507654b9e8ba40c6f72b7aeb2f41b2dbf79c9da8bb9c7a65c09292; exit=0; EXPECT=matched; output-sha256=7da5a41fc216d13ed0f316b13233fcb06e6b58fa3b77265de8f768b48359362a; output-bytes=146; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: l'α de chaque houblon, sourcé (D87)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-alpha.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6f --page=etat.html
  EXPECT: ALPHA OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=9eabef2175b2081d2b09b85f7f4ef34f956e0d2afc05de9af29722c10365576c; exit=0; EXPECT=matched; output-sha256=25578dff82b4f5bd483b75f7c2aebe8d60bef755355b4899ccd6d988a4048be9; output-bytes=42; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: option B : la part « autres » se voit au seuil proposé de 25 % (D100)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-sans-famille.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6f --page=etat.html --seuil=0.25
  EXPECT: /SANS-FAMILLE OK \([1-9]/
  EVIDENCE: automatic-evidence=v1; definition-sha256=7ed126e08a333e0d99662b16fa3e88d1c7ac622543ce2f9fb5ccdd2382673de4; exit=0; EXPECT=matched; output-sha256=eeab0ac35954609389fbeda93cac1f321ffcd1617a1bd6c459be9442f49d72a3; output-bytes=149; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: page, générateur, note et captures existent
  CHECK: node scripts/agents/systeme.mjs existent work/refonte-frontend/v4/ecran-1/fils22-comparer/r6f/etat.html work/refonte-frontend/v4/ecran-1/fils22-comparer/r6f/generer.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer/r6f/NOTE.md work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6f-390.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6f-premier-ecran.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6f-fiche-390.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6f-toucher-390.png
  EXPECT: EXISTENT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=a08c28ed78391cafff99ac936edd0379cdd75766bda54c5e9e7f9a756683caa8; exit=0; EXPECT=matched; output-sha256=3156347a759048d840ab56a5d7c1806edb556ccf6a0825499f2641c077c25bd9; output-bytes=14; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G8: la NOTE dit les choix que la variante porte
  CHECK: node scripts/agents/systeme.mjs note work/refonte-frontend/v4/ecran-1/fils22-comparer/r6f/NOTE.md --contient "Choix portés,Radar : r2,Base : IBU égal,Porte : non,Descripteurs : B"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=c53916eb07b88027d472ec0d3796c0cf970a6524056bdd196ddccca57ab56aa5; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G9: le rapport cite les captures ouvertes
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r6f-meme-amertume/RESULTAT.md --contient "r6f-390.png,r6f-premier-ecran.png,r6f-fiche-390.png,LEÇON PROPOSÉE"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=3ecf1bb2485f8d1927c7cf88d85ea0967feb59239677e3aea3f88224147689b8; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
