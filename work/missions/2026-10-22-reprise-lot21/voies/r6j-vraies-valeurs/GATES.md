# Gates: voie r6j-vraies-valeurs — Les vraies valeurs d'abord

OWNS: work/refonte-frontend/v4/ecran-1/fils22-comparer/r6j/**, work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6j-*.png, work/missions/2026-10-22-reprise-lot21/voies/r6j-vraies-valeurs/RESULTAT.md

Scope: une mini maquette de Comparer (lot 22) qui ne laisse libre que la variété, porte les quatre acquis et les choix Radar : r2 ; Base : effet égal (agrumes) ; Porte : non ; Descripteurs : B.

- [x] G1: les exigences de toute l'app tiennent (MOTS joué à part, à 80)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6j --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=77438388d55180f6abce3b283e24f6582fa1dbccb3e4702eddf47e5d2218a782; exit=0; EXPECT=matched; output-sha256=17c208fcc8bcaece23f4c60d9cb18741b72129c670bc157e4fe6eff6b3b9ac33; output-bytes=191; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: 80 mots au plus au premier écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6j --max=80 --page=etat.html
  EXPECT: MOTS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=259b791dbc15018b07a12c9e3a055aed10cb729e26120869f9813a8bd4a3dc7a; exit=0; EXPECT=matched; output-sha256=fecb14c61fe24dcbfa4f3a59f3b7ff1d7a2b47f99ecb0b1d68100bc309f60227; output-bytes=20; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: un seul facteur libre, la variété (D98)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6j --page=etat.html
  EXPECT: /UNE-QUESTION OK \(1 groupe libre : houblon\)/
  EVIDENCE: automatic-evidence=v1; definition-sha256=5782798fabb45b3aab0a61cb8f725f7b4d9cff03148c458e316b35e8f6a50ad1; exit=0; EXPECT=matched; output-sha256=d215604b27badaf58ab200ed93f9e2ebca5ff91a3d6f4198b781c70208cd72b9; output-bytes=165; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: les quatre acquis sont là (D99)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-acquis.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6j --page=etat.html
  EXPECT: ACQUIS OK (4/4
  EVIDENCE: automatic-evidence=v1; definition-sha256=e26fbea8bd0b457c0732fe8da02672060f338150ac6cb35d5dd6dc17f6377600; exit=0; EXPECT=matched; output-sha256=be155ee79e0d551073c7c678098af45c7c80de026e8223b441e565ad12baa2bc; output-bytes=136; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: l'α de chaque houblon, sourcé (D87)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-alpha.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6j --page=etat.html
  EXPECT: ALPHA OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=1bcaf4109238b25fe33c378364a2c397ae45b1f6156abd2d6ec760f5446f0949; exit=0; EXPECT=matched; output-sha256=8169e6604addf9d9e8d059587aea288d76dc7ffa8f886aa9c490d9e71ec421b2; output-bytes=42; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: option B : la part « autres » se voit au seuil proposé de 25 % (D100)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-sans-famille.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6j --page=etat.html --seuil=0.25
  EXPECT: /SANS-FAMILLE OK \([1-9]/
  EVIDENCE: automatic-evidence=v1; definition-sha256=11337e44bdddf16a2be7159b369087c3d7b0e664dce8c3d2300edd47777ba6a5; exit=0; EXPECT=matched; output-sha256=c327a0557d9cb404b0e6cea565fde7185f9f6db308ab1e5b3b431c02bfb0e041; output-bytes=149; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: page, générateur, note et captures existent
  CHECK: node scripts/agents/systeme.mjs existent work/refonte-frontend/v4/ecran-1/fils22-comparer/r6j/etat.html work/refonte-frontend/v4/ecran-1/fils22-comparer/r6j/generer.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer/r6j/NOTE.md work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6j-390.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6j-premier-ecran.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6j-fiche-390.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6j-toucher-390.png
  EXPECT: EXISTENT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=40a005eb216d062099349f26c3626db46bcc4a890388ba5463da04533be8773e; exit=0; EXPECT=matched; output-sha256=3156347a759048d840ab56a5d7c1806edb556ccf6a0825499f2641c077c25bd9; output-bytes=14; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G8: la NOTE dit les choix que la variante porte
  CHECK: node scripts/agents/systeme.mjs note work/refonte-frontend/v4/ecran-1/fils22-comparer/r6j/NOTE.md --contient "Choix portés,Radar : r2,Base : effet égal (agrumes),Porte : non,Descripteurs : B"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=a47c2af8a11c4d4e0879e89667f1281c4442082cd85beb7ba751e99cc48c3bf8; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G9: le rapport cite les captures ouvertes
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r6j-vraies-valeurs/RESULTAT.md --contient "r6j-390.png,r6j-premier-ecran.png,r6j-fiche-390.png,LEÇON PROPOSÉE"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=20d5e7b02decdc33ffaa7592d39046283bb261f75ccd1bbc58fe065c6030ed77; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
