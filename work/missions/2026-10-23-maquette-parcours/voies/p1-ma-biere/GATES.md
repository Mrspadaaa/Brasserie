# Gates: voie p1-ma-biere — Ma bière, la fiche et Substituer, jouables

OWNS: prototypes/houblons-v4/parcours/src/ecrans/ma-biere/**, prototypes/houblons-v4/parcours/src/ecrans/biere/**, prototypes/houblons-v4/parcours/src/ecrans/fiche/**, prototypes/houblons-v4/parcours/src/ecrans/substituer/**, prototypes/houblons-v4/maquettes/parcours-p1/**, work/missions/2026-10-23-maquette-parcours/voies/p1-ma-biere/RESULTAT.md

Scope: Ma bière (étape Houblons), sa fiche au long appui et Substituer en porte, en React dans le socle, calculés en direct, avec leurs gestes joués.

- [x] G1: la maquette se construit dans la sortie de la voie
  CHECK: node prototypes/houblons-v4/parcours/outils/construire.mjs --sortie=prototypes/houblons-v4/maquettes/parcours-p1
  EXPECT: CONSTRUIT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=f9312c582408582b245aff1a9bfd1c361216e50885fb67403d528de8a99156c8; exit=0; EXPECT=matched; output-sha256=6b592a3bea9183f9cc9563adfa25297819d6241a2cfc1c6c6453ffc403eed813; output-bytes=73; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: le dossier est typé sans erreur
  CHECK: node prototypes/houblons-v4/parcours/outils/verifier-types.mjs
  EXPECT: TYPES OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=04b8f7f64868614636c57492d1eed9c8a1a1faefce1f18fda5816ed951a12860; exit=0; EXPECT=matched; output-sha256=5015cfef1a82e20e9a8cf800854297f68212ed6cc721038a989cde20903a582b; output-bytes=9; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: les exigences de toute l'app tiennent (MOTS joué à part, à 80)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs prototypes/houblons-v4/maquettes/parcours-p1 ma-biere --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=3112bd8347e34aa63925da680c1fbd368cf3e97d966b6d86162cdda91c49e2c9; exit=0; EXPECT=matched; output-sha256=17c208fcc8bcaece23f4c60d9cb18741b72129c670bc157e4fe6eff6b3b9ac33; output-bytes=191; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: 80 mots au plus au premier écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs prototypes/houblons-v4/maquettes/parcours-p1 ma-biere --max=80 --page=etat.html
  EXPECT: MOTS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=e9447a8e339ac1694f11949de7ed1296d34ca361e5e9385ad9d5a64f7955063f; exit=0; EXPECT=matched; output-sha256=6d489ea8cb6e9b6485c5b59d56fd9e588b08167a6148c5a7002cba9430a670f4; output-bytes=25; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: Ma bière garde ce qu'il a validé (D79)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-ma-biere.mjs prototypes/houblons-v4/maquettes/parcours-p1 ma-biere --page=etat.html
  EXPECT: MA-BIERE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=7f04167fc95b731e77dfb08f5727c502bc5a549ba70b8d7a0263ea1b9664ef6c; exit=0; EXPECT=matched; output-sha256=d795b7df40e95f8408d177d9896de583be7ffa7b054404bc1dff5c101c38ac94; output-bytes=40; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: l'α de chaque houblon, sourcé (D87)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-alpha.mjs prototypes/houblons-v4/maquettes/parcours-p1 ma-biere --page=etat.html
  EXPECT: ALPHA OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=c4c920d8e866e2ec483632aada4c162e4bf0519848e01f30058fe054ab4bc62a; exit=0; EXPECT=matched; output-sha256=5a052e2327a137df61f057236fc08b1b2cc21ddac74317c833dfd75c707e25d1; output-bytes=47; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: l'appui long ouvre la fiche, courte et complète (D25)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-fiche.mjs prototypes/houblons-v4/maquettes/parcours-p1 ma-biere --pages=etat.html
  EXPECT: FICHE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=13bf6cead8cfc33969d93603542567b3b0fb8e71dcc906d375035667225f1040; exit=0; EXPECT=matched; output-sha256=5f3d49d4ad3ce32250b4e0d8803f78bec0e2ed6bb02877e9c77e13885adfefc8; output-bytes=57; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G8: la fiche parle le langage de la page (D93)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-fiche-baseline.mjs prototypes/houblons-v4/maquettes/parcours-p1 ma-biere --page=etat.html
  EXPECT: FICHE-BASELINE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=a1ac77e018d15b33ee5862c61040ed30fbb5a73e310f48433720a5b4a6e1481b; exit=0; EXPECT=matched; output-sha256=209fce5afaa2efcad1019b822bd1c439d558a3292a012a18fc8d3bd835a749ee; output-bytes=106; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G9: un houblon aux mots hors familles le montre (D100)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-sans-famille.mjs prototypes/houblons-v4/maquettes/parcours-p1 ma-biere --page=etat.html
  EXPECT: SANS-FAMILLE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=50c302b9a5cac7d2fa1a4b273cfad4d408fa8ac3c593a5a343130b2a68783fa3; exit=0; EXPECT=matched; output-sha256=aa72bf568e20ea2772a096c128646425e5e4a057fa590c5d8c8d8b5527477183; output-bytes=134; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G10: Substituer garde les exigences de toute l'app
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs prototypes/houblons-v4/maquettes/parcours-p1 substituer --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=9f1a599122189aa768ad56324d824d5f6267f9c1890510216627fef0d494c54a; exit=0; EXPECT=matched; output-sha256=17c208fcc8bcaece23f4c60d9cb18741b72129c670bc157e4fe6eff6b3b9ac33; output-bytes=191; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G11: les gestes de Ma bière, de la fiche et de Substituer jouent, état vérifié
  CHECK: node prototypes/houblons-v4/parcours/outils/jouer-parcours.mjs --dossier=prototypes/houblons-v4/maquettes/parcours-p1 --etape=ma-biere --etape=fiche --etape=substituer
  EXPECT: ETAPE OK (substituer)
  EVIDENCE: automatic-evidence=v1; definition-sha256=0e3935892256ab6c96d1c2d6cfd955980fc436e4c197c7641580d92ca0351c72; exit=0; EXPECT=matched; output-sha256=1e509bea5c402efff0d81c97dd0f09274aedc360c4bc7d3cf12131bbcaa1ed65; output-bytes=22; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G12: le parcours entier joue encore
  CHECK: node prototypes/houblons-v4/parcours/outils/jouer-parcours.mjs --dossier=prototypes/houblons-v4/maquettes/parcours-p1 --ponts
  EXPECT: PONTS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=c3b30601c35cdec0d05c046e7fb33741518c68a64b9cb20a29f59afc11060e52; exit=0; EXPECT=matched; output-sha256=27eca9d9022a792d09547113633a400faceac5f819c9ea69a2dcf7e033cb3055; output-bytes=130; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G13: les tolérances du moteur tiennent (D54)
  CHECK: cd prototypes/houblons-v4 && npx vitest run tests/tolerance.test.ts && echo TOLERANCE OK
  EXPECT: TOLERANCE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=01bb0fa00b4b584a8e4d38492ef7d074a5bf40ff8e439186d899e81749431e45; exit=0; EXPECT=matched; output-sha256=bb6b60d187f4251aa69194541afeafa8957ff009be8197fb643e54fbdeb2df64; output-bytes=2577; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G14: aucun fichier de l'app n'a changé
  CHECK: node prototypes/houblons-v4/parcours/outils/app-intacte.mjs
  EXPECT: APP INTACTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=a484ab77428d30fac0f9bbc722273a31c02eebb57bfa60b02569cbdaaa8a26e1; exit=0; EXPECT=matched; output-sha256=6dfcce3af6b507ef0fdf0bf4c49ae611c8747cca25559473ac691036968837b2; output-bytes=15; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G15: les NOTE disent la base, les écarts et ce qu'il faudra brancher
  CHECK: node scripts/agents/systeme.mjs note prototypes/houblons-v4/parcours/src/ecrans/ma-biere/NOTE.md --contient "## Base,## Idées reprises,## Écarts,## Pour l'app"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=1eaf5d970bc90ba64b18064d966430001c5892642e345fa457a3c23ea0a4a9f3; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G16: le rapport nomme les captures ouvertes, à 390 et à 1280 px
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/p1-ma-biere/RESULTAT.md --contient "390,1280,fiche,substituer"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=5c4678efe14b442650046314834928ccfff1d956bef4bf77b22a56ea794c235b; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G17: l'étape Houblons reprend la base v4.10, élément par élément (D105)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-reprise.mjs prototypes/houblons-v4/maquettes/parcours-p1 ma-biere --page=etat.html --inventaire=work/refonte-frontend/v4/ecran-1/base/donnees/inventaire-etape.json
  EXPECT: REPRISE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=de625d95066f1903b40a17cc7b10fa1ef2d4238a2ac0caae494c0fe57b4ad0d4; exit=0; EXPECT=matched; output-sha256=87e786a9213d2c743e5e3864398d12589c711f4b02d0453d1a978f940a5f3d60; output-bytes=311; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G18: l'onglet Ma bière reprend la base v4.10, élément par élément (D105)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-reprise.mjs prototypes/houblons-v4/maquettes/parcours-p1 biere --page=etat.html --inventaire=work/refonte-frontend/v4/ecran-1/base/donnees/inventaire-ma-biere.json
  EXPECT: REPRISE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=149511c14fde0d9601191d06d667f85054fc4e8762f2b9427b70117e39a575d1; exit=0; EXPECT=matched; output-sha256=697ab1519ee1ac77c7dc9dfa12f1ef0646c3e85d73371e8d6b2bbb098d5433e2; output-bytes=462; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G19: l'onglet Ma bière garde les exigences de toute l'app
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs prototypes/houblons-v4/maquettes/parcours-p1 biere --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=b7423792b024fde0fd8a0e26ea8341f05d04de3d8161a2e481a08a61ac34298c; exit=0; EXPECT=matched; output-sha256=17c208fcc8bcaece23f4c60d9cb18741b72129c670bc157e4fe6eff6b3b9ac33; output-bytes=191; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G20: les gestes de l'onglet Ma bière jouent (bannir, objectifs vers Suggérer)
  CHECK: node prototypes/houblons-v4/parcours/outils/jouer-parcours.mjs --dossier=prototypes/houblons-v4/maquettes/parcours-p1 --etape=biere
  EXPECT: ETAPE OK (biere)
  EVIDENCE: automatic-evidence=v1; definition-sha256=ffcaddf4f8164cc65b69a2621e0d722366711784d7ae1a1cd4a33c4e4d18590e; exit=0; EXPECT=matched; output-sha256=bc42403162942ba8a42a806a430a0620eda1feb0124cc1feab1dab4ec77863f0; output-bytes=17; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G21: l'étape Houblons est conforme à son choix (règle n° 1)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-choix.mjs prototypes/houblons-v4/maquettes/parcours-p1 --ecran=etape-houblons
  EXPECT: CHOIX OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=92f458bcdef446d64e76cbc57a29b0579cc0d20aa69ec5af1075761a4ce64970; exit=0; EXPECT=matched; output-sha256=faa65b63173f33986f1ad3af01b780870adfd9ee989c03f90f26ec4a2865d201; output-bytes=62; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G22: l'onglet Ma bière est conforme à son choix (règle n° 1)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-choix.mjs prototypes/houblons-v4/maquettes/parcours-p1 --ecran=ma-biere
  EXPECT: CHOIX OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=18ef00da8efe4ee37ac44f01d78f40b79ba8cde70229706042455e4c32ceb7d9; exit=0; EXPECT=matched; output-sha256=faa65b63173f33986f1ad3af01b780870adfd9ee989c03f90f26ec4a2865d201; output-bytes=62; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G23: le rail de l'étape Houblons tient ses plaintes (D27, D35, D36, D37, D46, D47, D69), y compris à 45′ et 120′
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-rail.mjs prototypes/houblons-v4/maquettes/parcours-p1 ma-biere --page=etat.html --parcours
  EXPECT: RAIL OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=2538227071d122593188bf37f7adbaeee298d217de752a72aa658f91541a1f3c; exit=0; EXPECT=matched; output-sha256=89d5ca4d3174d19dac63e4adc600fc11f1a3528face26f3aa97504e78531efc6; output-bytes=313; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G24: la fiche reprend g1, élément par élément (règle n° 1)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-choix.mjs prototypes/houblons-v4/maquettes/parcours-p1 --ecran=fiche
  EXPECT: CHOIX OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=2f05030fa6db49e926b0a9ee09bd81d2e6ef5755efb3da0875feef6019d10585; exit=0; EXPECT=matched; output-sha256=faa65b63173f33986f1ad3af01b780870adfd9ee989c03f90f26ec4a2865d201; output-bytes=62; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G25: l'étape Houblons, l'onglet Ma bière et la fiche ont la teinte de ses maquettes (D106)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-teinte.mjs prototypes/houblons-v4/maquettes/parcours-p1 --ecran=fiche
  EXPECT: TEINTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=3955fc03117c6e201c5d14f3228b404ac175f0914279b6f5e2234cfcfda319aa; exit=0; EXPECT=matched; output-sha256=90ea0da53fc5332d471791aa81c3a2bce609370ab700fee5ee31502588382a31; output-bytes=110; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
