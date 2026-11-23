# Gates: voie r6i-sans-nelson-effet — Remplacer Nelson Sauvin à effet égal

OWNS: work/refonte-frontend/v4/ecran-1/fils22-comparer/r6i/**, work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6i-*.png, work/missions/2026-10-22-reprise-lot21/voies/r6i-sans-nelson-effet/RESULTAT.md

Scope: une mini maquette de Comparer (lot 22) qui ne laisse libre que la variété, porte les quatre acquis et les choix Radar : r3 ; Base : effet égal (agrumes) ; Porte : oui (Nelson Sauvin) ; Descripteurs : A.

- [x] G1: les exigences de toute l'app tiennent (MOTS joué à part, à 80)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6i --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=56739c1d9a1fcb6d781a6baac104464a629faae42a8c04d1e1ca92214193d390; exit=0; EXPECT=matched; output-sha256=17c208fcc8bcaece23f4c60d9cb18741b72129c670bc157e4fe6eff6b3b9ac33; output-bytes=191; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: 80 mots au plus au premier écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6i --max=80 --page=etat.html
  EXPECT: MOTS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=312890db448961e53893573076d67c4e28f7ce09300234ec3dd8fdb1a80621a7; exit=0; EXPECT=matched; output-sha256=194305f4c50bbda6eb79662fc96dd262257432130d96fb00e9b83f3c4a75b138; output-bytes=20; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: un seul facteur libre, la variété (D98)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6i --page=etat.html
  EXPECT: /UNE-QUESTION OK \(1 groupe libre : houblon\)/
  EVIDENCE: automatic-evidence=v1; definition-sha256=56dbce9f3e246a9638aa28280e2215d7bb3d7e623ece4b225cf15f8106a52a6f; exit=0; EXPECT=matched; output-sha256=7d3f19ae5cf428fbe29626dc8d0cf96ad6c220cbdeb15db8a6e2ad80c50d4212; output-bytes=179; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: les quatre acquis sont là (D99)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-acquis.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6i --page=etat.html
  EXPECT: ACQUIS OK (4/4
  EVIDENCE: automatic-evidence=v1; definition-sha256=0759ce3822dd0ffac9f229434143ae0e2464caff9d9d00a6a8b23e85834e2e1b; exit=0; EXPECT=matched; output-sha256=6bf7f8e3689fdbd5eeb9bdb34b8777215f75632c3074e207eeda6665aba34b9b; output-bytes=144; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: l'α de chaque houblon, sourcé (D87)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-alpha.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6i --page=etat.html
  EXPECT: ALPHA OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=e5d7460ebadae1ac499daf75ee84822ddfd516119b3a868785466cd01f116831; exit=0; EXPECT=matched; output-sha256=48b0f30f4ade8dfadd22b32867ba75deb89274393ac2a81abb4e085ce686d17b; output-bytes=42; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: page, générateur, note et captures existent
  CHECK: node scripts/agents/systeme.mjs existent work/refonte-frontend/v4/ecran-1/fils22-comparer/r6i/etat.html work/refonte-frontend/v4/ecran-1/fils22-comparer/r6i/generer.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer/r6i/NOTE.md work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6i-390.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6i-premier-ecran.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6i-fiche-390.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6i-toucher-390.png
  EXPECT: EXISTENT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=119ff8a1633be8e318f91eba3fbd2f779db281811da036c6f5dcc1ccb7d7795b; exit=0; EXPECT=matched; output-sha256=3156347a759048d840ab56a5d7c1806edb556ccf6a0825499f2641c077c25bd9; output-bytes=14; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: la NOTE dit les choix que la variante porte
  CHECK: node scripts/agents/systeme.mjs note work/refonte-frontend/v4/ecran-1/fils22-comparer/r6i/NOTE.md --contient "Choix portés,Radar : r3,Base : effet égal (agrumes),Porte : oui (Nelson Sauvin),Descripteurs : A"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=e3db2e1684e13e1ab5e1a8948fabc3a7c1c35fbee656bbcc5a5a524b2b6ba389; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G8: le rapport cite les captures ouvertes
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r6i-sans-nelson-effet/RESULTAT.md --contient "r6i-390.png,r6i-premier-ecran.png,r6i-fiche-390.png,LEÇON PROPOSÉE"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=da084c082eec12e3c2baefdd71adf9efd42a59662491690730ff6de87353e9af; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
