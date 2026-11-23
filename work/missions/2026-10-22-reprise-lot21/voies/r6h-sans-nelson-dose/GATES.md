# Gates: voie r6h-sans-nelson-dose — Je n'ai pas Nelson Sauvin

OWNS: work/refonte-frontend/v4/ecran-1/fils22-comparer/r6h/**, work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6h-*.png, work/missions/2026-10-22-reprise-lot21/voies/r6h-sans-nelson-dose/RESULTAT.md

Scope: une mini maquette de Comparer (lot 22) qui ne laisse libre que la variété, porte les quatre acquis et les choix Radar : r2 ; Base : dose égale ; Porte : oui (Nelson Sauvin) ; Descripteurs : B.

- [x] G1: les exigences de toute l'app tiennent (MOTS joué à part, à 80)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6h --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=7b53d7c7a6406b8411d9cdc7026859e01596dd1c54a742e808033a724bf7be6e; exit=0; EXPECT=matched; output-sha256=17c208fcc8bcaece23f4c60d9cb18741b72129c670bc157e4fe6eff6b3b9ac33; output-bytes=191; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: 80 mots au plus au premier écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6h --max=80 --page=etat.html
  EXPECT: MOTS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=10a1414d9db62b9c57ecd918bdfcb37f02f0b9be406ba97683ec8ef073aef665; exit=0; EXPECT=matched; output-sha256=b5d256c5e01023280f5ff24b08bec742185b02bdebf55e19d97ad3f8bedb6ce7; output-bytes=20; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: un seul facteur libre, la variété (D98)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6h --page=etat.html
  EXPECT: /UNE-QUESTION OK \(1 groupe libre : houblon\)/
  EVIDENCE: automatic-evidence=v1; definition-sha256=4db00dc877d9fe5a91389eaafe04248a2b2f6adff6b2408c5a0ce94c60738ede; exit=0; EXPECT=matched; output-sha256=2d490fd0b1aae0dc1abd74e56391e2e570fb66700d5750b61e6919472cc9ffb6; output-bytes=178; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: les quatre acquis sont là (D99)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-acquis.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6h --page=etat.html
  EXPECT: ACQUIS OK (4/4
  EVIDENCE: automatic-evidence=v1; definition-sha256=c7f7567db5d0aa8d9d3836296743639dc9d44b75d96cb518644ba14058473d4c; exit=0; EXPECT=matched; output-sha256=756a2da45ff8f55a0e6a7ad926e8744bd7e78073b41f5ea2dacec160742cc41e; output-bytes=136; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: l'α de chaque houblon, sourcé (D87)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-alpha.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6h --page=etat.html
  EXPECT: ALPHA OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=f235ceb7266d5a71bd8fbca03971cec58e688c3b53d6eb9bf151103db82f8222; exit=0; EXPECT=matched; output-sha256=7f252e7dfcc8f1ddffe762d4f6781eb44b5197879985f2517ab011000267e7e6; output-bytes=42; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: option B : la part « autres » se voit au seuil proposé de 25 % (D100)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-sans-famille.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6h --page=etat.html --seuil=0.25
  EXPECT: /SANS-FAMILLE OK \([1-9]/
  EVIDENCE: automatic-evidence=v1; definition-sha256=123044f37cbc7c76d5124d99bbcf09fc62ac0d1e80fbcf63f9396b52e4e56092; exit=0; EXPECT=matched; output-sha256=3b8fba70f1636c1a6e968bd322b8b74383cbdf820fbdae7099ada34df154971d; output-bytes=173; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: page, générateur, note et captures existent
  CHECK: node scripts/agents/systeme.mjs existent work/refonte-frontend/v4/ecran-1/fils22-comparer/r6h/etat.html work/refonte-frontend/v4/ecran-1/fils22-comparer/r6h/generer.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer/r6h/NOTE.md work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6h-390.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6h-premier-ecran.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6h-fiche-390.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6h-toucher-390.png
  EXPECT: EXISTENT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=8b45c440c92373bfa12e9829c84ff3ac81d34ca439b29c6ebd4ca133e05627ea; exit=0; EXPECT=matched; output-sha256=3156347a759048d840ab56a5d7c1806edb556ccf6a0825499f2641c077c25bd9; output-bytes=14; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G8: la NOTE dit les choix que la variante porte
  CHECK: node scripts/agents/systeme.mjs note work/refonte-frontend/v4/ecran-1/fils22-comparer/r6h/NOTE.md --contient "Choix portés,Radar : r2,Base : dose égale,Porte : oui (Nelson Sauvin),Descripteurs : B"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=e7996a17d2b0ae58379ce5294e5810eda802211f4d47e0d97ca889571710f78e; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G9: le rapport cite les captures ouvertes
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r6h-sans-nelson-dose/RESULTAT.md --contient "r6h-390.png,r6h-premier-ecran.png,r6h-fiche-390.png,LEÇON PROPOSÉE"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=cd7bf2a590296442eeb0eb2acbb0691af5689a4af00de06987437a70df360899; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
