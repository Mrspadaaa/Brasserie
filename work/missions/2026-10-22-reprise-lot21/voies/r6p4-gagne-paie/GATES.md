# Gates: voie r6p4-gagne-paie — variante de r6n2 : On gagne, on paie

OWNS: work/refonte-frontend/v4/ecran-1/fils22-comparer/r6p4/**, work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6p4-*.png, work/missions/2026-10-22-reprise-lot21/voies/r6p4-gagne-paie/RESULTAT.md

Scope: une variante de r6n2 qui ne laisse libre que la variété, garde les quatre acquis et les 37 éléments de l'inventaire, et reprend les meilleures idées sous l'angle « On gagne, on paie ».

- [x] G1: les exigences de toute l'app tiennent (MOTS joué à part, à 80)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6p4 --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=33d3fd3b50c9c879a5b5636506fbaeab880edf234a2d65bdbb96ffd86fce0025; exit=0; EXPECT=matched; output-sha256=17c208fcc8bcaece23f4c60d9cb18741b72129c670bc157e4fe6eff6b3b9ac33; output-bytes=191; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: 80 mots au plus au premier écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6p4 --max=80 --page=etat.html
  EXPECT: MOTS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=ce026f787925afe6eccac3f8314db53fb173d7401d17e0c7d8ab0900a6edf493; exit=0; EXPECT=matched; output-sha256=2c45ce34663e6fca7237c9b58a7efea6fee6608d3bbb3c7ee318c604c77b00f9; output-bytes=21; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: un seul facteur libre, la variété (D98)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6p4 --page=etat.html
  EXPECT: /UNE-QUESTION OK \(1 groupe libre : houblon\)/
  EVIDENCE: automatic-evidence=v1; definition-sha256=ca9c71fc4b61022b4dca4eadaaf890a99f255366a016789ee3c5cefe5be5556b; exit=0; EXPECT=matched; output-sha256=23e9555e51823c78d4bc79f7124c434af390b82984a050a70e709fe0aa20e2a8; output-bytes=166; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: les quatre acquis sont là (D99)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-acquis.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6p4 --page=etat.html
  EXPECT: ACQUIS OK (4/4
  EVIDENCE: automatic-evidence=v1; definition-sha256=32a1f846ef5c9364231ac77c7c7c6e168c98630ad4c402f007530ddc404326cc; exit=0; EXPECT=matched; output-sha256=6f6545276bd6ee465a97d966b9a41d84af6349f7ce9e08d3a2dfbd909990a06a; output-bytes=147; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: l'α de chaque houblon, sourcé (D87)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-alpha.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6p4 --page=etat.html
  EXPECT: ALPHA OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=1deaddedf0b1427ea1b117b43bf9187452574a3c8406b04955afcef23eba8762; exit=0; EXPECT=matched; output-sha256=bee2c25d7fe4017d36a5d5dcf0628d0848d3d3fc32ca4a0fae73b71a18db966c; output-bytes=43; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: chaque élément de l'inventaire est classé et balisé (D104)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-reprise.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6p4 --page=etat.html
  EXPECT: REPRISE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=8aa7d54503596b83aebf72877241adca141a322b59306c8bd56fe73a956b03ec; exit=0; EXPECT=matched; output-sha256=0357196c6f198edc13f68322df0883a1a9db79a25d5bd2d65634014b18121d64; output-bytes=1670; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: la page se rend sans erreur de script ni défilement horizontal
  CHECK: node scripts/agents/verifier-page.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer/r6p4/etat.html --min-images 0
  EXPECT: PAGE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=a50efe817460ee2b7153cdaafb7f62b5859fbb9ba0f18b3915341669abd67a3d; exit=0; EXPECT=matched; output-sha256=8b41bf6d50130554819585d7bc2314ffb9174f5a88af247a6bd7ca1b8522fa10; output-bytes=50; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G8: page, générateur, note et captures existent
  CHECK: node scripts/agents/systeme.mjs existent work/refonte-frontend/v4/ecran-1/fils22-comparer/r6p4/etat.html work/refonte-frontend/v4/ecran-1/fils22-comparer/r6p4/generer.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer/r6p4/NOTE.md work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6p4-390.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6p4-premier-ecran.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6p4-toucher-390.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6p4-fiche-390.png
  EXPECT: EXISTENT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=67557c7aac17256e020a7811843ffcc73a928375325ebcb459e30580240bfd4f; exit=0; EXPECT=matched; output-sha256=3156347a759048d840ab56a5d7c1806edb556ccf6a0825499f2641c077c25bd9; output-bytes=14; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G9: la NOTE dit ses choix, ses idées reprises, sa reprise et sa règle de radar
  CHECK: node scripts/agents/systeme.mjs note work/refonte-frontend/v4/ecran-1/fils22-comparer/r6p4/NOTE.md --contient "Choix portés,Radar : r2,Base : dose égale,Porte : non,Descripteurs : A,## Idées reprises,## Reprise,D103"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=460f4edd63bf6bc6e4584a702cd56d244218f0aaead3a89a0138ad14e3ee929e; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G10: le rapport cite les captures ouvertes
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r6p4-gagne-paie/RESULTAT.md --contient "r6p4-premier-ecran.png,r6p4-toucher-390.png,r6p4-fiche-390.png,LEÇON PROPOSÉE"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=f3b50ff3e1327f49322328792a3199e6d3a7986e6e07f139abd1ad40120b365a; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
