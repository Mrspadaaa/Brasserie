# Gates: voie r1-carte — la carte des outils houblons, en fil de fer

OWNS: work/refonte-frontend/v4/ecran-1/fils22-carte/**, work/missions/2026-10-22-reprise-lot21/voies/r1-carte/RESULTAT.md

Scope: une page en fil de fer, un écran par outil, un seul facteur libre par écran (celui de la carte du conseil), choix ouverts côte à côte.

- [x] G1: la carte, son générateur, sa note, ses huit écrans et sa capture existent
  CHECK: node scripts/agents/systeme.mjs existent work/refonte-frontend/v4/ecran-1/fils22-carte/carte.html work/refonte-frontend/v4/ecran-1/fils22-carte/generer.mjs work/refonte-frontend/v4/ecran-1/fils22-carte/NOTE.md work/refonte-frontend/v4/ecran-1/fils22-carte/ma-biere/etat.html work/refonte-frontend/v4/ecran-1/fils22-carte/suggerer/etat.html work/refonte-frontend/v4/ecran-1/fils22-carte/comparer/etat.html work/refonte-frontend/v4/ecran-1/fils22-carte/substituer-porte/etat.html work/refonte-frontend/v4/ecran-1/fils22-carte/substituer-outil/etat.html work/refonte-frontend/v4/ecran-1/fils22-carte/dryhopper/etat.html work/refonte-frontend/v4/ecran-1/fils22-carte/levure-etape/etat.html work/refonte-frontend/v4/ecran-1/fils22-carte/levure-outil/etat.html work/refonte-frontend/v4/ecran-1/fils22-carte/captures/carte-390.png
  EXPECT: EXISTENT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=fcbe68895d4f99ee0682e651338228bf64d61d7aa04564a77ba534d77ce635ae; exit=0; EXPECT=matched; output-sha256=dcf309e87d321ab8a44f6ea02c610f87b46386c13a6ccdf831eab892f47cc18f; output-bytes=15; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: Suggérer ne laisse libres que les candidats (houblon)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs work/refonte-frontend/v4/ecran-1/fils22-carte suggerer --page=etat.html
  EXPECT: /UNE-QUESTION OK \(1 groupe libre : houblon\)/
  EVIDENCE: automatic-evidence=v1; definition-sha256=db55e794359670acddce01527d61580c25fedf041e5e7182bd1e42dd60ce34df; exit=0; EXPECT=matched; output-sha256=afeec3e775eb246598a690c27833264a6d2b34168a6edfd400c9fe53ce2311fe; output-bytes=182; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: Comparer ne laisse libre que la variété
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs work/refonte-frontend/v4/ecran-1/fils22-carte comparer --page=etat.html
  EXPECT: /UNE-QUESTION OK \(1 groupe libre : houblon\)/
  EVIDENCE: automatic-evidence=v1; definition-sha256=74be2c4fd1374832b5d6c7bedc1233bd61a29f074fb86bf6daa6f56660745760; exit=0; EXPECT=matched; output-sha256=1a77a549fb797fe96512107a802c30b5b52b66928d7b39ba309a74c9ce7ac83e; output-bytes=183; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: Substituer, la porte (X épinglé) : la variété seule
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs work/refonte-frontend/v4/ecran-1/fils22-carte substituer-porte --page=etat.html
  EXPECT: /UNE-QUESTION OK \(1 groupe libre : houblon\)/
  EVIDENCE: automatic-evidence=v1; definition-sha256=052527c00aefea392b9fba4047f97d31d4c9497f533943d1f95f5c5c6134f425; exit=0; EXPECT=matched; output-sha256=e79b738dd198160977e9b6ba694501678073645874929b181a495eb8af0706d9; output-bytes=177; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: Substituer, l'outil propre : la variété seule
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs work/refonte-frontend/v4/ecran-1/fils22-carte substituer-outil --page=etat.html
  EXPECT: /UNE-QUESTION OK \(1 groupe libre : houblon\)/
  EVIDENCE: automatic-evidence=v1; definition-sha256=8292bd67133f444654dfe0fe30cfd13cd054e279030772d6e33c436ddf11170f; exit=0; EXPECT=matched; output-sha256=25e11708ac17cc3ff8843b07a956c868cc347da562758a0df79a05b9226adcb8; output-bytes=174; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: Dryhopper ne laisse libre que le moment
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs work/refonte-frontend/v4/ecran-1/fils22-carte dryhopper --page=etat.html
  EXPECT: /UNE-QUESTION OK \(1 groupe libre : moment\)/
  EVIDENCE: automatic-evidence=v1; definition-sha256=ca861e7ee411596eaa30584234517d8bc327db814acb4abcbc45994b17d9fdd8; exit=0; EXPECT=matched; output-sha256=72dbe998b22889e7dd630bf11152d2bbc7a3752929e2821d1fac3d1b4aebf9af; output-bytes=170; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: Levure, dernière étape de Dryhopper : la levure seule
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs work/refonte-frontend/v4/ecran-1/fils22-carte levure-etape --page=etat.html
  EXPECT: /UNE-QUESTION OK \(1 groupe libre : levure\)/
  EVIDENCE: automatic-evidence=v1; definition-sha256=2199ed8ebc32c8641978c290b1960bd20a99c9d6e10d6d855486d2f7f8aa957c; exit=0; EXPECT=matched; output-sha256=955726903c2de336ed94a53de383ce11e732dbc66984c8b2630ea10b88cfef4b; output-bytes=173; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G8: Levure, outil propre : la levure seule
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs work/refonte-frontend/v4/ecran-1/fils22-carte levure-outil --page=etat.html
  EXPECT: /UNE-QUESTION OK \(1 groupe libre : levure\)/
  EVIDENCE: automatic-evidence=v1; definition-sha256=9426e4fb121411dfb40da7b3a1d9ccc287de8beee080e4c1383c68fae7067e31; exit=0; EXPECT=matched; output-sha256=b682b5d2bcd77965cc0dd987c20b9a1b9a0f2d5813b5bf7cfb41c3c51281feec; output-bytes=172; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G9: les exigences de toute l'app tiennent sur les huit écrans (fiche et légende laissées aux lots d'outil)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils22-carte ma-biere suggerer comparer substituer-porte substituer-outil dryhopper levure-etape levure-outil --page=etat.html --sans=fiche,legende
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=8597b8f0531b922784158dedeb5d55842e379c86fdd03905c128c1a34e07c312; exit=0; EXPECT=matched; output-sha256=5de6ca712c2c6e3c43ce0576d1baba7690604951f6a23dfaffbbbd47c8fc62a1; output-bytes=204; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G10: la note porte la carte (écrans, questions, facteur libre, contexte, ponts)
  CHECK: node scripts/agents/systeme.mjs note work/refonte-frontend/v4/ecran-1/fils22-carte/NOTE.md --contient "Ma bière,Suggérer,Comparer,Substituer,Dryhopper,Levure,facteur libre,contexte,pont"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=20b2d81a0b12ef2562dce3e0d4d4c9cbca0839b9367df5a51ffcff152d1ff3b0; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G11: le rapport cite les captures ouvertes
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r1-carte/RESULTAT.md --contient "carte-390.png,comparer-390.png,dryhopper-390.png,LEÇON PROPOSÉE"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=a585ceda09e2ef1efa8d329a99a95c234b5e933ad1c3440d7219fd5eeb84b52e; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
