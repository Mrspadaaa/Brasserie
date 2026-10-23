# Gates: voie r6p2-reponse — variante de r6n2 : La réponse d'abord

OWNS: work/refonte-frontend/v4/ecran-1/fils22-comparer/r6p2/**, work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6p2-*.png, work/missions/2026-10-22-reprise-lot21/voies/r6p2-reponse/RESULTAT.md

Scope: une variante de r6n2 qui ne laisse libre que la variété, garde les quatre acquis et les 37 éléments de l'inventaire, et reprend les meilleures idées sous l'angle « La réponse d'abord ».

- [x] G1: les exigences de toute l'app tiennent (MOTS joué à part, à 80)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6p2 --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=f7b53cad2357ba17fe6487cf6e80010e276129831ebc9c9264fb915d16d65a4e; exit=0; EXPECT=matched; output-sha256=17c208fcc8bcaece23f4c60d9cb18741b72129c670bc157e4fe6eff6b3b9ac33; output-bytes=191; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: 80 mots au plus au premier écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6p2 --max=80 --page=etat.html
  EXPECT: MOTS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=61e07d367029a0384424130237bd991b5f1ccc83c301823c32160de1572fb8ef; exit=0; EXPECT=matched; output-sha256=09b923427ae9bf5eb1f437e8ed498fbabff1c1122da924168c2f668f5d5b44d9; output-bytes=21; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: un seul facteur libre, la variété (D98)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6p2 --page=etat.html
  EXPECT: /UNE-QUESTION OK \(1 groupe libre : houblon\)/
  EVIDENCE: automatic-evidence=v1; definition-sha256=29db835182ba206778fb7f1a35d07ffeb4644f1b3c3ddd652f076a34f4631f9e; exit=0; EXPECT=matched; output-sha256=42ac82592f90a1a6f3c53afc884cb1988725580ce676d5472c54e8c707a7ce1c; output-bytes=166; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: les quatre acquis sont là (D99)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-acquis.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6p2 --page=etat.html
  EXPECT: ACQUIS OK (4/4
  EVIDENCE: automatic-evidence=v1; definition-sha256=4f2cf59a179d51b57881963cf85f1dc0988377c4fab905d77388eb160ad22b60; exit=0; EXPECT=matched; output-sha256=f334c37f9a1bca54310ec8240e31c986309e5b351ea41aeaeabe51f379f25b6e; output-bytes=147; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: l'α de chaque houblon, sourcé (D87)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-alpha.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6p2 --page=etat.html
  EXPECT: ALPHA OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=4c62be94a7b6b571f09436f040a4506106bf27544633c011d16f997767846619; exit=0; EXPECT=matched; output-sha256=f0ed9eb2e8fb6934201e522d5d71d57905d61b08aef9d18e8256907233e9eb2e; output-bytes=43; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: chaque élément de l'inventaire est classé et balisé (D104)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-reprise.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6p2 --page=etat.html
  EXPECT: REPRISE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=9ca442b5a45e842c0bab13da6070b02c76b6bfe3af6f4cd9b2e6aed0ead1a007; exit=0; EXPECT=matched; output-sha256=7041fcf68896f577eb6700b4215b058bbd0a2f44b455b5f55403b7ce36775d6a; output-bytes=1675; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: la page se rend sans erreur de script ni défilement horizontal
  CHECK: node scripts/agents/verifier-page.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer/r6p2/etat.html --min-images 0
  EXPECT: PAGE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=058c1999900087a0d7a015d3e8126319eec396a215ab5cb1d82581f0e5641e24; exit=0; EXPECT=matched; output-sha256=8b41bf6d50130554819585d7bc2314ffb9174f5a88af247a6bd7ca1b8522fa10; output-bytes=50; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G8: page, générateur, note et captures existent
  CHECK: node scripts/agents/systeme.mjs existent work/refonte-frontend/v4/ecran-1/fils22-comparer/r6p2/etat.html work/refonte-frontend/v4/ecran-1/fils22-comparer/r6p2/generer.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer/r6p2/NOTE.md work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6p2-390.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6p2-premier-ecran.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6p2-toucher-390.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6p2-fiche-390.png
  EXPECT: EXISTENT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=e47f6693711c2a28d4b45fc9eed17e2432f7dac2d0e0bacbb8d1eb98949b4ec4; exit=0; EXPECT=matched; output-sha256=3156347a759048d840ab56a5d7c1806edb556ccf6a0825499f2641c077c25bd9; output-bytes=14; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G9: la NOTE dit ses choix, ses idées reprises, sa reprise et sa règle de radar
  CHECK: node scripts/agents/systeme.mjs note work/refonte-frontend/v4/ecran-1/fils22-comparer/r6p2/NOTE.md --contient "Choix portés,Radar : r2,Base : dose égale,Porte : non,Descripteurs : A,## Idées reprises,## Reprise,D103"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=7a5570b44a594ca2b747c7775c71a1a247ac5412346e4bbcc48c0d9b39b5905f; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G10: le rapport cite les captures ouvertes
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r6p2-reponse/RESULTAT.md --contient "r6p2-premier-ecran.png,r6p2-toucher-390.png,r6p2-fiche-390.png,LEÇON PROPOSÉE"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=46a42bbf170f0de22bc45ee7d6ac45087fae13987896b99c5f4af009dac9bc38; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
