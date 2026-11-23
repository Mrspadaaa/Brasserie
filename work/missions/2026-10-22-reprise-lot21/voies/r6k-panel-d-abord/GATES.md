# Gates: voie r6k-panel-d-abord — Le panel d'abord

OWNS: work/refonte-frontend/v4/ecran-1/fils22-comparer/r6k/**, work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6k-*.png, work/missions/2026-10-22-reprise-lot21/voies/r6k-panel-d-abord/RESULTAT.md

Scope: une mini maquette de Comparer (lot 22) qui ne laisse libre que la variété, porte les quatre acquis et les choix Radar : r3 ; Base : dose égale ; Porte : non ; Descripteurs : A.

- [x] G1: les exigences de toute l'app tiennent (MOTS joué à part, à 80)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6k --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=078baf8f41f2d0c878004aebea017efa7de92a94243726966ca71317cc077d81; exit=0; EXPECT=matched; output-sha256=17c208fcc8bcaece23f4c60d9cb18741b72129c670bc157e4fe6eff6b3b9ac33; output-bytes=191; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: 80 mots au plus au premier écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6k --max=80 --page=etat.html
  EXPECT: MOTS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=090a832bc5a24080ad444aa95d08edaf8e0143a25f6000a121ba141c00b795de; exit=0; EXPECT=matched; output-sha256=64f7ddc4e260aa5a1dde2a78e330c3612eef7ad917b72b1aa248f94e851f7ad7; output-bytes=20; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: un seul facteur libre, la variété (D98)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6k --page=etat.html
  EXPECT: /UNE-QUESTION OK \(1 groupe libre : houblon\)/
  EVIDENCE: automatic-evidence=v1; definition-sha256=6bb45bf668e93996f3e3dd75eca4b174de6b2260387e651ce246d4f41be14328; exit=0; EXPECT=matched; output-sha256=e09d47455da6dc2291a3c8981891d0a3551934e7599dccd36e87424b430fddc5; output-bytes=179; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: les quatre acquis sont là (D99)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-acquis.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6k --page=etat.html
  EXPECT: ACQUIS OK (4/4
  EVIDENCE: automatic-evidence=v1; definition-sha256=ce866a5bbaa39f6d4a0cadf18081d610afb637d1c3d671049d2b6576ba727e1f; exit=0; EXPECT=matched; output-sha256=82bf1707d1fcce1b9cbc9be06883cba206a4e3f3d8045c30412cce8f638bfac3; output-bytes=144; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: l'α de chaque houblon, sourcé (D87)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-alpha.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6k --page=etat.html
  EXPECT: ALPHA OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=a4c72984e5f3f5fcdf963f0899e48e53fa7c0db81a3c9c891a009a8210ec838c; exit=0; EXPECT=matched; output-sha256=cef882e96d3b0f64a641715609708ad5fe4fa353841eedae716b4a8b8216a7f2; output-bytes=42; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: page, générateur, note et captures existent
  CHECK: node scripts/agents/systeme.mjs existent work/refonte-frontend/v4/ecran-1/fils22-comparer/r6k/etat.html work/refonte-frontend/v4/ecran-1/fils22-comparer/r6k/generer.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer/r6k/NOTE.md work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6k-390.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6k-premier-ecran.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6k-fiche-390.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6k-toucher-390.png
  EXPECT: EXISTENT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=3b153488c80806775b1ef1706afa16a4c09122f95d4870cdaccf6a1ff7515a6b; exit=0; EXPECT=matched; output-sha256=3156347a759048d840ab56a5d7c1806edb556ccf6a0825499f2641c077c25bd9; output-bytes=14; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: la NOTE dit les choix que la variante porte
  CHECK: node scripts/agents/systeme.mjs note work/refonte-frontend/v4/ecran-1/fils22-comparer/r6k/NOTE.md --contient "Choix portés,Radar : r3,Base : dose égale,Porte : non,Descripteurs : A"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=151e3ca66c994ee5260c3d91bba781a6d430d0bd935db6be711d9013276ca38b; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G8: le rapport cite les captures ouvertes
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r6k-panel-d-abord/RESULTAT.md --contient "r6k-390.png,r6k-premier-ecran.png,r6k-fiche-390.png,LEÇON PROPOSÉE"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=d8526801db241b601bdfaa74702bd5701390a3695ea569f04c3b83ef7ff82ca0; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
