# Gates: voie r6l-cartes-glisser — Des cartes à glisser

OWNS: work/refonte-frontend/v4/ecran-1/fils22-comparer/r6l/**, work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6l-*.png, work/missions/2026-10-22-reprise-lot21/voies/r6l-cartes-glisser/RESULTAT.md

Scope: une mini maquette de Comparer (lot 22) qui ne laisse libre que la variété, porte les quatre acquis et les choix Radar : r2 ; Base : IBU égal ; Porte : oui (Nelson Sauvin) ; Descripteurs : A.

- [x] G1: les exigences de toute l'app tiennent (MOTS joué à part, à 80)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6l --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=762fa9cdf123530f20fd000a10f9576df27ff787738e816e8325f156c0a0aeaa; exit=0; EXPECT=matched; output-sha256=17c208fcc8bcaece23f4c60d9cb18741b72129c670bc157e4fe6eff6b3b9ac33; output-bytes=191; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: 80 mots au plus au premier écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6l --max=80 --page=etat.html
  EXPECT: MOTS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=c59507f54d8b3b059c9a404014ff0a299bae71c47959c393e70c64f3cc928078; exit=0; EXPECT=matched; output-sha256=1d4abe73207de2c1502790bbada9568d944168eb982dad6e1efffa869e11c7eb; output-bytes=20; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: un seul facteur libre, la variété (D98)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6l --page=etat.html
  EXPECT: /UNE-QUESTION OK \(1 groupe libre : houblon\)/
  EVIDENCE: automatic-evidence=v1; definition-sha256=fe45f1acdb63c4943a36e8d17154676b56b0bd804acd53b6c67d07fe1d7af914; exit=0; EXPECT=matched; output-sha256=95356328a290d840a39bd44abfba9c7cf5e27ba0acdbd93bd2e32baf64e43bc9; output-bytes=165; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: les quatre acquis sont là (D99)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-acquis.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6l --page=etat.html
  EXPECT: ACQUIS OK (4/4
  EVIDENCE: automatic-evidence=v1; definition-sha256=8a2403a0275ce9e4a4e837da7e81abd5e5596d5465e1c705b2942f52d4bf18a5; exit=0; EXPECT=matched; output-sha256=41bff6c22ec58f111159c7fd9a1c5db5ec5624219fe56292c49dd6f99cb5af18; output-bytes=146; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: l'α de chaque houblon, sourcé (D87)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-alpha.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6l --page=etat.html
  EXPECT: ALPHA OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=1aaa89a737e31e34cfd3998ac6c0257b36064fc798187073931e9c1b5727a5be; exit=0; EXPECT=matched; output-sha256=bbffd419fa4c567bf3bdb48838ef48a6d36355793b5aa8114d46488e1dba8f6c; output-bytes=42; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: page, générateur, note et captures existent
  CHECK: node scripts/agents/systeme.mjs existent work/refonte-frontend/v4/ecran-1/fils22-comparer/r6l/etat.html work/refonte-frontend/v4/ecran-1/fils22-comparer/r6l/generer.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer/r6l/NOTE.md work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6l-390.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6l-premier-ecran.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6l-fiche-390.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6l-toucher-390.png
  EXPECT: EXISTENT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=01c9d278fc84d14e00dde38aa8cf99f8682af44c20da2eeacab5b8d18de75d7e; exit=0; EXPECT=matched; output-sha256=3156347a759048d840ab56a5d7c1806edb556ccf6a0825499f2641c077c25bd9; output-bytes=14; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: la NOTE dit les choix que la variante porte
  CHECK: node scripts/agents/systeme.mjs note work/refonte-frontend/v4/ecran-1/fils22-comparer/r6l/NOTE.md --contient "Choix portés,Radar : r2,Base : IBU égal,Porte : oui (Nelson Sauvin),Descripteurs : A"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=82efb13e235f3d625a9513251abd7253bef8c6997f29acf3e469b04310cb07e0; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G8: le rapport cite les captures ouvertes
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r6l-cartes-glisser/RESULTAT.md --contient "r6l-390.png,r6l-premier-ecran.png,r6l-fiche-390.png,LEÇON PROPOSÉE"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=fe4299f221941e85815b3bc0ff18a958e6530258669b9711763a96b0fe58645d; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
