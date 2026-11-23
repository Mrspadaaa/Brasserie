# Gates: voie r6a-colonnes — Trois colonnes côte à côte

OWNS: work/refonte-frontend/v4/ecran-1/fils22-comparer/r6a/**, work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6a-*.png, work/missions/2026-10-22-reprise-lot21/voies/r6a-colonnes/RESULTAT.md

Scope: une mini maquette de Comparer (lot 22) qui ne laisse libre que la variété, porte les quatre acquis et les choix Radar : r2 ; Base : dose égale ; Porte : non ; Descripteurs : A.

- [x] G1: les exigences de toute l'app tiennent (MOTS joué à part, à 80)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6a --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=5de4bf7d15266b50272fdf7daa3fcc2efa8c328854eddef764216cbbf8ed484c; exit=0; EXPECT=matched; output-sha256=17c208fcc8bcaece23f4c60d9cb18741b72129c670bc157e4fe6eff6b3b9ac33; output-bytes=191; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: 80 mots au plus au premier écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6a --max=80 --page=etat.html
  EXPECT: MOTS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=106bff61cc89d644b0415cd1f35e9ffdc2db3d6f56167a635eaf5843ea356112; exit=0; EXPECT=matched; output-sha256=39a69fb3d8b980ae5e526b584267be11b5e255b055c686f062f8b18b941da423; output-bytes=20; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: un seul facteur libre, la variété (D98)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6a --page=etat.html
  EXPECT: /UNE-QUESTION OK \(1 groupe libre : houblon\)/
  EVIDENCE: automatic-evidence=v1; definition-sha256=6948dedbe533dea972044e1f5ebb5b58da6925013fa7459fdd698cf561472b50; exit=0; EXPECT=matched; output-sha256=142f92068a8563f629541c99edb1b87510b57c6cadf26925f55ef81a095cfc5f; output-bytes=179; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: les quatre acquis sont là (D99)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-acquis.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6a --page=etat.html
  EXPECT: ACQUIS OK (4/4
  EVIDENCE: automatic-evidence=v1; definition-sha256=2dcbcae103d150738abbea0775d2a5f1d6733007d76e9f3c9a62eade94aece7c; exit=0; EXPECT=matched; output-sha256=b99a752c69f4a6cf54c666caa769557d1c4228b25b86b56f5ec6a2c751a6028c; output-bytes=141; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: l'α de chaque houblon, sourcé (D87)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-alpha.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6a --page=etat.html
  EXPECT: ALPHA OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=1afb7790a2d58fa5166645cdb6c9947e6b091e7b1167c74f13a79f2ee18478bf; exit=0; EXPECT=matched; output-sha256=fbe84d7504017a7f328db15d903c7839671b53326b64710f646d943a504175fa; output-bytes=42; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: page, générateur, note et captures existent
  CHECK: node scripts/agents/systeme.mjs existent work/refonte-frontend/v4/ecran-1/fils22-comparer/r6a/etat.html work/refonte-frontend/v4/ecran-1/fils22-comparer/r6a/generer.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer/r6a/NOTE.md work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6a-390.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6a-premier-ecran.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6a-fiche-390.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6a-toucher-390.png
  EXPECT: EXISTENT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=5ca323a95aa6a2f07df50df2c8dcaec1449dd39592be8c89bee312b23dcfbe9c; exit=0; EXPECT=matched; output-sha256=3156347a759048d840ab56a5d7c1806edb556ccf6a0825499f2641c077c25bd9; output-bytes=14; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: la NOTE dit les choix que la variante porte
  CHECK: node scripts/agents/systeme.mjs note work/refonte-frontend/v4/ecran-1/fils22-comparer/r6a/NOTE.md --contient "Choix portés,Radar : r2,Base : dose égale,Porte : non,Descripteurs : A"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=2c468d8290eac58c7ac9fad4d5ae42b516100f8c9f6cbcbff6db6c79eb72cd15; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G8: le rapport cite les captures ouvertes
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r6a-colonnes/RESULTAT.md --contient "r6a-390.png,r6a-premier-ecran.png,r6a-fiche-390.png,LEÇON PROPOSÉE"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=87bdcebd3c202685f9efd295dc3ea64e60b199c8afacb9f41d6b205b27f1232e; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
