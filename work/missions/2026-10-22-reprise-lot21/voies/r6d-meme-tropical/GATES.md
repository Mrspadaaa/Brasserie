# Gates: voie r6d-meme-tropical — Le même tropical

OWNS: work/refonte-frontend/v4/ecran-1/fils22-comparer/r6d/**, work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6d-*.png, work/missions/2026-10-22-reprise-lot21/voies/r6d-meme-tropical/RESULTAT.md

Scope: une mini maquette de Comparer (lot 22) qui ne laisse libre que la variété, porte les quatre acquis et les choix Radar : r3 ; Base : effet égal (tropical) ; Porte : non ; Descripteurs : B.

- [x] G1: les exigences de toute l'app tiennent (MOTS joué à part, à 80)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6d --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=d9331f264ded5ec98a7c0403eac17c97949ec64fee825c2229521c53fd40bf4e; exit=0; EXPECT=matched; output-sha256=17c208fcc8bcaece23f4c60d9cb18741b72129c670bc157e4fe6eff6b3b9ac33; output-bytes=191; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: 80 mots au plus au premier écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6d --max=80 --page=etat.html
  EXPECT: MOTS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=9bc304cef182c87dad7ea30685062abb5a552d535eaf7e04b05104a7240c1af4; exit=0; EXPECT=matched; output-sha256=14cee97d5afab0cb80dca65c9eb9763e962ec6a285d821aa771832b126e16e05; output-bytes=20; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: un seul facteur libre, la variété (D98)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6d --page=etat.html
  EXPECT: /UNE-QUESTION OK \(1 groupe libre : houblon\)/
  EVIDENCE: automatic-evidence=v1; definition-sha256=0bc6d8339c900e487ee883b63534db298e9403f012ff3accce33effe3b7b5e44; exit=0; EXPECT=matched; output-sha256=2d2fc28d8d2038ef61c4c1ed4fdb24337ef6cb72c60b8752dcc859ec136fc7b4; output-bytes=179; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: les quatre acquis sont là (D99)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-acquis.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6d --page=etat.html
  EXPECT: ACQUIS OK (4/4
  EVIDENCE: automatic-evidence=v1; definition-sha256=713d517646001a26ade9764cf2713b5c8b13a41cf2edc0f15df4e37bee3a78e9; exit=0; EXPECT=matched; output-sha256=810a3c4842f61b90f4925b7159320fa04224b6fb7391f970d1de07dbaadb1367; output-bytes=139; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: l'α de chaque houblon, sourcé (D87)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-alpha.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6d --page=etat.html
  EXPECT: ALPHA OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=4df74d57926098e32ce443460d86a8f3d32bffbb07254b540935e6c7e4b3aeb0; exit=0; EXPECT=matched; output-sha256=db89cb649f3f32dc2ba551c9e02e5a4e43e7e51fa0bc26269169af594ac1adbf; output-bytes=42; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: option B : la part « autres » se voit au seuil proposé de 25 % (D100)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-sans-famille.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6d --page=etat.html --seuil=0.25
  EXPECT: /SANS-FAMILLE OK \([1-9]/
  EVIDENCE: automatic-evidence=v1; definition-sha256=497c032f077751dfc374004256004319c50236bdde23559c717cfdb78d0560af; exit=0; EXPECT=matched; output-sha256=16e5dd7c887590520c1293685e0a15144d6a0fd52281567b3cbcb05c588395db; output-bytes=149; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: page, générateur, note et captures existent
  CHECK: node scripts/agents/systeme.mjs existent work/refonte-frontend/v4/ecran-1/fils22-comparer/r6d/etat.html work/refonte-frontend/v4/ecran-1/fils22-comparer/r6d/generer.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer/r6d/NOTE.md work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6d-390.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6d-premier-ecran.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6d-fiche-390.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6d-toucher-390.png
  EXPECT: EXISTENT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=fc61588596d36ae3c045bb51af6aacdf7c0bc7491cd71ca379238c8a0b15740e; exit=0; EXPECT=matched; output-sha256=3156347a759048d840ab56a5d7c1806edb556ccf6a0825499f2641c077c25bd9; output-bytes=14; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G8: la NOTE dit les choix que la variante porte
  CHECK: node scripts/agents/systeme.mjs note work/refonte-frontend/v4/ecran-1/fils22-comparer/r6d/NOTE.md --contient "Choix portés,Radar : r3,Base : effet égal (tropical),Porte : non,Descripteurs : B"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=6bb6da53ddb12118687e643cf3e5ab17cf37ce6cae269ee60bcfe6852365acce; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G9: le rapport cite les captures ouvertes
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r6d-meme-tropical/RESULTAT.md --contient "r6d-390.png,r6d-premier-ecran.png,r6d-fiche-390.png,LEÇON PROPOSÉE"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=b94609a24cc708115e64294ec4720e1e482c6a63ce9565134690657369cfa166; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
