# Gates: voie r6n2-passe2 — r6n2 corrigée des défauts de r6nc

OWNS: work/refonte-frontend/v4/ecran-1/fils22-comparer/r6n2/**, work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6n2-*.png, work/missions/2026-10-22-reprise-lot21/voies/r6n2-passe2/RESULTAT.md

Scope: une mini maquette de reprise de r6a (lot 22 bis) qui ne laisse libre que la variété, porte les quatre acquis, classe et balise chaque élément de l'inventaire, le reste à un toucher.

- [x] G1: les exigences de toute l'app tiennent (MOTS joué à part, à 80)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6n2 --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=d494c0c37420d9f3f3a30318b26b2089b2246b091e186d9d0be7b27ff26b2792; exit=0; EXPECT=matched; output-sha256=17c208fcc8bcaece23f4c60d9cb18741b72129c670bc157e4fe6eff6b3b9ac33; output-bytes=191; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: 80 mots au plus au premier écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6n2 --max=80 --page=etat.html
  EXPECT: MOTS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=256b8467184b6a097420d7ecc689cd32126b0e1ab6a35e413bf597d21cfece20; exit=0; EXPECT=matched; output-sha256=d3f84837a4ce00dec0008d770bab9e158bf1c1ab68865f14802e6a1f5aedeff2; output-bytes=21; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: un seul facteur libre, la variété (D98)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6n2 --page=etat.html
  EXPECT: /UNE-QUESTION OK \(1 groupe libre : houblon\)/
  EVIDENCE: automatic-evidence=v1; definition-sha256=1b940b95c0aecfbb6cbb4e19dce4a357113c9800d6f398d1a7576bbc84f2d801; exit=0; EXPECT=matched; output-sha256=acfbd5c548d437055da2414c2fabbf2026cf99bac61d4e0408c0bfb05c0a014d; output-bytes=180; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: les quatre acquis sont là (D99)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-acquis.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6n2 --page=etat.html
  EXPECT: ACQUIS OK (4/4
  EVIDENCE: automatic-evidence=v1; definition-sha256=c7243ce6474d1b4e497e9c48cb7f91c75217cdb26e20b469dc522908b3842ba0; exit=0; EXPECT=matched; output-sha256=e8f3e31167679077d5446386ce5364d799cae2bba8eeccdc283fd226fadd3023; output-bytes=147; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: l'α de chaque houblon, sourcé (D87)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-alpha.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6n2 --page=etat.html
  EXPECT: ALPHA OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=b51d933c36bbcb476d907a6cb478bba85c214de895975afe0a844acb696fc213; exit=0; EXPECT=matched; output-sha256=e7730fc5f88f1134df2a65f5ecf7b8f75ee16f813683a27cd862275cd6121c93; output-bytes=43; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: chaque élément de l'inventaire est classé et balisé (D104)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-reprise.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6n2 --page=etat.html
  EXPECT: REPRISE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=de8d28545e5ce8420ddc7a99cd08bbc6df73cb66afceeee38a4e42ec1c914d15; exit=0; EXPECT=matched; output-sha256=7041fcf68896f577eb6700b4215b058bbd0a2f44b455b5f55403b7ce36775d6a; output-bytes=1675; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: la page se rend sans erreur de script ni défilement horizontal
  CHECK: node scripts/agents/verifier-page.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer/r6n2/etat.html --min-images 0
  EXPECT: PAGE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=53f8c05c74630f1c59b75af9d888f6ac691e915420b0055ed79b502ff75ff990; exit=0; EXPECT=matched; output-sha256=8b41bf6d50130554819585d7bc2314ffb9174f5a88af247a6bd7ca1b8522fa10; output-bytes=50; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G8: page, générateur, note et captures existent
  CHECK: node scripts/agents/systeme.mjs existent work/refonte-frontend/v4/ecran-1/fils22-comparer/r6n2/etat.html work/refonte-frontend/v4/ecran-1/fils22-comparer/r6n2/generer.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer/r6n2/NOTE.md work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6n2-390.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6n2-premier-ecran.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6n2-toucher-390.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6n2-fiche-390.png
  EXPECT: EXISTENT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=3b640579490ba06a103f3b5881fc34a335c6e2e82356ac45a886cb27602ecc2d; exit=0; EXPECT=matched; output-sha256=3156347a759048d840ab56a5d7c1806edb556ccf6a0825499f2641c077c25bd9; output-bytes=14; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G9: la NOTE dit ses choix, sa reprise et sa règle de radar
  CHECK: node scripts/agents/systeme.mjs note work/refonte-frontend/v4/ecran-1/fils22-comparer/r6n2/NOTE.md --contient "Choix portés,Radar : r2,Base : dose égale,Porte : non,Descripteurs : A,## Reprise,D103,Premier écran"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=8e80d4b0759184846c9cab71ddbd682e754ebe4684685a7783e895439636ddde; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G10: le rapport cite les captures ouvertes
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r6n2-passe2/RESULTAT.md --contient "r6n2-premier-ecran.png,r6n2-toucher-390.png,r6n2-fiche-390.png,LEÇON PROPOSÉE"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=c8d6b4d7f7509d58d30870616649bd4578aa885792eba1c8c62ae6db3d078142; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
