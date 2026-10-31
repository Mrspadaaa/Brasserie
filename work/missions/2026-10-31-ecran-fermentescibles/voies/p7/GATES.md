# Gates: voie p7 — la recherche du champ d'ajout : sous le champ, dans la liste, ou en menu

OWNS: work/missions/2026-10-31-ecran-fermentescibles/v7/s1/, work/missions/2026-10-31-ecran-fermentescibles/v7/s2/, work/missions/2026-10-31-ecran-fermentescibles/v7/s3/, work/missions/2026-10-31-ecran-fermentescibles/voies/p7/COMPRIS.md, work/missions/2026-10-31-ecran-fermentescibles/voies/p7/RESULTAT.md

Scope: v6/p6-b2 telle quelle (son choix, D220), plus l'affichage de la recherche et l'alias ; trois variantes.

- [x] G1: la voie est comprise avant de construire
  CHECK: node scripts/agents/systeme.mjs comprendre work/missions/2026-10-31-ecran-fermentescibles/voies/p7
  EXPECT: COMPRIS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=7c35fe2984a1703d17dfe10f6e4f7e9d460c1bb57cb72c1468dfb2cb93e86f30; exit=0; EXPECT=matched; output-sha256=fe39635c9c75b2a2cd1a3ecd2518a8480405c3646a23211f8fe96e79ba795131; output-bytes=22; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: s1, la recherche trouve, dit « déjà là », crée, et « Munich » donne Münchner Malz (D220)
  CHECK: node work/missions/2026-10-31-ecran-fermentescibles/controle-recherche.mjs work/missions/2026-10-31-ecran-fermentescibles/v7/s1/etat.html
  EXPECT: RECHERCHE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=7a3513770faaa37b89017993d51c79c9d0532107e7960574b69a1558e500c3fb; exit=0; EXPECT=matched; output-sha256=e4398f27ff4873e5638e99103a3e9e712f994e9e5c4aecead686452895be7021; output-bytes=49; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: s1, la barre porte toujours la masse (D219)
  CHECK: node work/missions/2026-10-31-ecran-fermentescibles/controle-masse-ligne.mjs work/missions/2026-10-31-ecran-fermentescibles/v7/s1/etat.html
  EXPECT: MASSE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=6ff9cb2dff78ef08f1f1e97e9f171222a1a0c386769c02f64c074ca54ad5f927; exit=0; EXPECT=matched; output-sha256=2c2db0d5ea5993b9ed6cb70cad3232255ab26c5468610b5d87a8e0fcb5d5fb23; output-bytes=674; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: s1, le moment sans pilule (D218)
  CHECK: node work/missions/2026-10-31-ecran-fermentescibles/controle-moment-ligne.mjs work/missions/2026-10-31-ecran-fermentescibles/v7/s1/etat.html
  EXPECT: MOMENT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=4c180594a568ce394e7c9176f032b8862fe47b8163d0434b0962c3c2d95aff14; exit=0; EXPECT=matched; output-sha256=a027c3f1a1d6b8e8e487a8341e0b818810f230117f675936c986683a5209c6e5; output-bytes=396; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: s1, chaque réglage de la ligne se change sur la ligne (D211)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-volee.mjs work/missions/2026-10-31-ecran-fermentescibles/v7/s1/etat.html
  EXPECT: VOLEE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=99fa7a7cdbc84f7497bad657a5162425e99fdcdccd47da8ea1fda69c38a85703; exit=0; EXPECT=matched; output-sha256=76174ef4b2e81870ebcf3b0fb7578ae546917b0b6fa0ec905b942bd88c37d318; output-bytes=839; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: s1, les gestes de la ligne tiennent
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-gestes-ligne.mjs work/missions/2026-10-31-ecran-fermentescibles/v7/s1/etat.html
  EXPECT: GESTES OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=8130fb32d61fc2ecca4ea0bf081b0181a7540a4afbd8e1f4f9f33575ca200823; exit=0; EXPECT=matched; output-sha256=71f4950a40b29618d0ecc5dd22adae6b0fecd2e5e8027cdc1bc803548e2f1185; output-bytes=662; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: s1 se rend sans erreur
  CHECK: node scripts/agents/verifier-page.mjs work/missions/2026-10-31-ecran-fermentescibles/v7/s1/etat.html --min-images 0
  EXPECT: PAGE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=5f9975201c3631149f293c91d0768174c87a8e0f6840a8522238549708f687aa; exit=0; EXPECT=matched; output-sha256=8b41bf6d50130554819585d7bc2314ffb9174f5a88af247a6bd7ca1b8522fa10; output-bytes=50; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G8: s1, 80 mots au plus au premier écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs work/missions/2026-10-31-ecran-fermentescibles/v7 s1 --page=etat.html --max=80 --profil=sans-houblons
  EXPECT: MOTS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=dccac60278bf21520750d846739e847a7f0200273cbf98ff7affa0c0cf83341d; exit=0; EXPECT=matched; output-sha256=34472a94dbf377e7a557ec5edbdd0a92f9bcc182411d6d78a7876c87452ab983; output-bytes=19; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G9: s1, le cadre commun tient, couleurs mises à part
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/missions/2026-10-31-ecran-fermentescibles/v7 s1 --page=etat.html --profil=sans-houblons --sans=couleurs
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=e0f56105b428ff3dd9bf76cca1aaa5c5923a4f2807fd937d70d2da39595a3d6b; exit=0; EXPECT=matched; output-sha256=b1eb81e605666a86110c81bfdc456969c5da4552e65264efd55b22d3ef5e6472; output-bytes=606; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G10: s1, contraste
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-contraste.mjs work/missions/2026-10-31-ecran-fermentescibles/v7 s1 --page=etat.html
  EXPECT: CONTRASTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=1ec810db4c6fa25e0e91b381ed830a008925ce4acecfae503ba22e9ad605f27e; exit=0; EXPECT=matched; output-sha256=c1e2733d66398166c593b0dce9eaee957264c07334d47bd66330ae2996075cfc; output-bytes=84; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G11: s1, hauteur
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-hauteur.mjs work/missions/2026-10-31-ecran-fermentescibles/v7 s1 --page=etat.html
  EXPECT: HAUTEUR OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=eb783dba47d4ddf6374e7d70718a7f0f56302064d00983bae8dfa94d328f46d5; exit=0; EXPECT=matched; output-sha256=3786ca77703e7e43b29e8d9b55c696ea11b161ee229d8f3d9a63e0dfcee63382; output-bytes=175; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G12: les captures de s1 se refont sans erreur
  CHECK: node work/missions/2026-10-31-ecran-fermentescibles/v7/s1/capturer.mjs
  EXPECT: CAPTURES OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=f4b8bb854f4220ac0ce3f73c94eb375552d0e6f78c1537853576302168e56a4c; exit=0; EXPECT=matched; output-sha256=9ff4ffed170e64961020bc6e7214db2c7201a1035a2b6b77740bf3a3612b2433; output-bytes=2272; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G13: s2, la recherche trouve, dit « déjà là », crée, et « Munich » donne Münchner Malz (D220)
  CHECK: node work/missions/2026-10-31-ecran-fermentescibles/controle-recherche.mjs work/missions/2026-10-31-ecran-fermentescibles/v7/s2/etat.html
  EXPECT: RECHERCHE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=a3fdafb4d7bc26d34d4770556929848e4e5b70fa2fe3f53fdbd6ad4d4d0648ec; exit=0; EXPECT=matched; output-sha256=f588fa56784d5dfc532920bc5f612f6f0074940f9b7a8d83d5c83efb7503d02c; output-bytes=49; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G14: s2, la barre porte toujours la masse (D219)
  CHECK: node work/missions/2026-10-31-ecran-fermentescibles/controle-masse-ligne.mjs work/missions/2026-10-31-ecran-fermentescibles/v7/s2/etat.html
  EXPECT: MASSE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=96234cdfd4c01ed0bc82be94337c7b929ee38a05007b84ad2327ab23e48b69b4; exit=0; EXPECT=matched; output-sha256=8de338fed5a88ecedfd55575be101a3936e9ec82bb05fe39191cebe8f089dc54; output-bytes=674; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G15: s2, le moment sans pilule (D218)
  CHECK: node work/missions/2026-10-31-ecran-fermentescibles/controle-moment-ligne.mjs work/missions/2026-10-31-ecran-fermentescibles/v7/s2/etat.html
  EXPECT: MOMENT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=0b394ff7923b56e51651061eac24e5f13b62fa68adfa9bd414cd2f62ecc53250; exit=0; EXPECT=matched; output-sha256=b9c2e57e15960def4492c544cab323cab10ba4dd0092e4ee1f0d5c05bdb56535; output-bytes=396; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G16: s2, chaque réglage de la ligne se change sur la ligne (D211)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-volee.mjs work/missions/2026-10-31-ecran-fermentescibles/v7/s2/etat.html
  EXPECT: VOLEE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=05bcaa4780ca61952a719cfc12125013ff6da92da2e5c8f44e7059c5a2ceb5ed; exit=0; EXPECT=matched; output-sha256=76174ef4b2e81870ebcf3b0fb7578ae546917b0b6fa0ec905b942bd88c37d318; output-bytes=839; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G17: s2, les gestes de la ligne tiennent
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-gestes-ligne.mjs work/missions/2026-10-31-ecran-fermentescibles/v7/s2/etat.html
  EXPECT: GESTES OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=3e897d4018822c90973415eff7c004900cfea32be5eb5d68bd5f5d849a1d9e05; exit=0; EXPECT=matched; output-sha256=71f4950a40b29618d0ecc5dd22adae6b0fecd2e5e8027cdc1bc803548e2f1185; output-bytes=662; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G18: s2 se rend sans erreur
  CHECK: node scripts/agents/verifier-page.mjs work/missions/2026-10-31-ecran-fermentescibles/v7/s2/etat.html --min-images 0
  EXPECT: PAGE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=0e2c9d1ef05c400f0cf5eb3447ae0baba7b60c541d29274a837dc848c0694ab5; exit=0; EXPECT=matched; output-sha256=8b41bf6d50130554819585d7bc2314ffb9174f5a88af247a6bd7ca1b8522fa10; output-bytes=50; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G19: s2, 80 mots au plus au premier écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs work/missions/2026-10-31-ecran-fermentescibles/v7 s2 --page=etat.html --max=80 --profil=sans-houblons
  EXPECT: MOTS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=c1efe7887d362ec05e4e3ee8e8a9585d14fd78b8484fa037ffdd5d970f6d45ca; exit=0; EXPECT=matched; output-sha256=75c4ac1d7d09b298cc34c906f018b77baa243f753f78d3327f5b71676b415092; output-bytes=19; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G20: s2, le cadre commun tient, couleurs mises à part
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/missions/2026-10-31-ecran-fermentescibles/v7 s2 --page=etat.html --profil=sans-houblons --sans=couleurs
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=c59688694d8a22fcdd2c3fb046b8e2cad6961ee4b4e28af06dcfccaa6e740997; exit=0; EXPECT=matched; output-sha256=b1eb81e605666a86110c81bfdc456969c5da4552e65264efd55b22d3ef5e6472; output-bytes=606; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G21: s2, contraste
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-contraste.mjs work/missions/2026-10-31-ecran-fermentescibles/v7 s2 --page=etat.html
  EXPECT: CONTRASTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=dc6b007c0160c532b72f9383af592f5c9b2fecdca4a72b1b790dd8feb0986a17; exit=0; EXPECT=matched; output-sha256=550f3ed00cd1e507c0988db6549c958907378526c0487c4ac878001177a6ecec; output-bytes=84; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G22: s2, hauteur
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-hauteur.mjs work/missions/2026-10-31-ecran-fermentescibles/v7 s2 --page=etat.html
  EXPECT: HAUTEUR OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=e67eb0f786cbd43755798651eef8e84a3b8a0316e7a26153eea5000fe6d22ed6; exit=0; EXPECT=matched; output-sha256=8a43c686f31075e27b4c5672173bd9288164a6089e18f1ee47c1cd2bf73c7244; output-bytes=175; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G23: les captures de s2 se refont sans erreur
  CHECK: node work/missions/2026-10-31-ecran-fermentescibles/v7/s2/capturer.mjs
  EXPECT: CAPTURES OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=83cddf790c5624f2910fb852d4a762e5b2116b1e3daf667fb6b447f63b5fdc96; exit=0; EXPECT=matched; output-sha256=e7f8a0e3a4562b6fa41652d6632b691679609c5f7bdfe54119aed4fd0de951fd; output-bytes=2349; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G24: s3, la recherche trouve, dit « déjà là », crée, et « Munich » donne Münchner Malz (D220)
  CHECK: node work/missions/2026-10-31-ecran-fermentescibles/controle-recherche.mjs work/missions/2026-10-31-ecran-fermentescibles/v7/s3/etat.html
  EXPECT: RECHERCHE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=2c66d5a70c35b74bb73e90229aa90500c99fb1ef957c06b468922eef986ac8f3; exit=0; EXPECT=matched; output-sha256=af4e62fdb5640eb3c67da766fd623b65bd36d889fd8b5b694d07b4a5447953b5; output-bytes=49; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G25: s3, la barre porte toujours la masse (D219)
  CHECK: node work/missions/2026-10-31-ecran-fermentescibles/controle-masse-ligne.mjs work/missions/2026-10-31-ecran-fermentescibles/v7/s3/etat.html
  EXPECT: MASSE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=e8f1a10ebc4a3f22ef0cf1aa1f81d507235ffcc2adbfdeddbcceab5f2f95dfbe; exit=0; EXPECT=matched; output-sha256=d570725f017240e00991f88d394d58703f334165bc11ce5d24adae471495c0a8; output-bytes=674; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G26: s3, le moment sans pilule (D218)
  CHECK: node work/missions/2026-10-31-ecran-fermentescibles/controle-moment-ligne.mjs work/missions/2026-10-31-ecran-fermentescibles/v7/s3/etat.html
  EXPECT: MOMENT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=4073600c683b46e14f7440894e15d8360188adb03d4895d6d9e08e056ea35ae9; exit=0; EXPECT=matched; output-sha256=0a29edddd213f5f724c350465bbe9f26cbf1116c94888c7667bf0e10a8d85888; output-bytes=396; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G27: s3, chaque réglage de la ligne se change sur la ligne (D211)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-volee.mjs work/missions/2026-10-31-ecran-fermentescibles/v7/s3/etat.html
  EXPECT: VOLEE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=b80271c3869fdb0768e4d736ef792d484066e3f132e5cd567d7df1b77d1ff8c8; exit=0; EXPECT=matched; output-sha256=76174ef4b2e81870ebcf3b0fb7578ae546917b0b6fa0ec905b942bd88c37d318; output-bytes=839; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G28: s3, les gestes de la ligne tiennent
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-gestes-ligne.mjs work/missions/2026-10-31-ecran-fermentescibles/v7/s3/etat.html
  EXPECT: GESTES OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=fbe026eae143744a9c5949dc78a8d20b5957135f98540ef72b09122579656e75; exit=0; EXPECT=matched; output-sha256=71f4950a40b29618d0ecc5dd22adae6b0fecd2e5e8027cdc1bc803548e2f1185; output-bytes=662; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G29: s3 se rend sans erreur
  CHECK: node scripts/agents/verifier-page.mjs work/missions/2026-10-31-ecran-fermentescibles/v7/s3/etat.html --min-images 0
  EXPECT: PAGE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=065dce2446d8541d99e7b725f0c3de004ef6eb8473517d10f70b843115c460fe; exit=0; EXPECT=matched; output-sha256=8b41bf6d50130554819585d7bc2314ffb9174f5a88af247a6bd7ca1b8522fa10; output-bytes=50; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G30: s3, 80 mots au plus au premier écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs work/missions/2026-10-31-ecran-fermentescibles/v7 s3 --page=etat.html --max=80 --profil=sans-houblons
  EXPECT: MOTS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=c68b6a621c4a72650f3dfd35abac4c8c92803ddef84399def8a0f24efbab71c4; exit=0; EXPECT=matched; output-sha256=cf350be0b1f4439aa91f74918bfac0b21c33e12ac7f4253b703e59359b016a78; output-bytes=19; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G31: s3, le cadre commun tient, couleurs mises à part
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/missions/2026-10-31-ecran-fermentescibles/v7 s3 --page=etat.html --profil=sans-houblons --sans=couleurs
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=ab92a71937081a570a51ead59ae2152a337427e79675d2f401aa29567ff5ae6b; exit=0; EXPECT=matched; output-sha256=b1eb81e605666a86110c81bfdc456969c5da4552e65264efd55b22d3ef5e6472; output-bytes=606; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G32: s3, contraste
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-contraste.mjs work/missions/2026-10-31-ecran-fermentescibles/v7 s3 --page=etat.html
  EXPECT: CONTRASTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=e889db82bf81d439b89205015dc69016ee4bd4e4ad6867d14032cbd073c6239b; exit=0; EXPECT=matched; output-sha256=a2081a6916fcf8645fbcbc4ef8b01660b25fbd17d09b29c565cb1c2f9f879e59; output-bytes=84; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G33: s3, hauteur
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-hauteur.mjs work/missions/2026-10-31-ecran-fermentescibles/v7 s3 --page=etat.html
  EXPECT: HAUTEUR OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=ba130c1ed38b891e6d970c39d79b1c03fe7d7110294ea405badb4e46cef7544f; exit=0; EXPECT=matched; output-sha256=90a235bf2e05d0e955598daf71e3a45b16bac6c098d251c9a162c41508bf2a6b; output-bytes=175; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G34: les captures de s3 se refont sans erreur
  CHECK: node work/missions/2026-10-31-ecran-fermentescibles/v7/s3/capturer.mjs
  EXPECT: CAPTURES OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=0782664917f78cf17575488f893d47098c699a0961f943cea44154acc4dbec80; exit=0; EXPECT=matched; output-sha256=33ec20a3937a54e88ef1234548c85350b301288385825ce471229978e244394c; output-bytes=3096; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G35: le résultat cite sa question, Munich et les captures
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-31-ecran-fermentescibles/voies/p7/RESULTAT.md --contient "D220,Munich,Dans la liste,captures"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=cfb5b6afde94f5b7a6f558a125b894e9a6ca0d15691d93a18bc2276a2c3c08ad; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G36: le registre des choix de l'app est valide (son choix p6-b2, D220)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-choix.mjs --registre --registre=work/refonte-frontend/v4/choix/ecrans-app.json
  EXPECT: REGISTRE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=e6af4d5a8af53626e316498d70882c353ba359b1c1b0f6cdf462b627b42cc7a3; exit=0; EXPECT=matched; output-sha256=7142ebfd23c0af2c605e93f5d2ce7e870bd06dc49d75d27c0320b461356a6c79; output-bytes=24; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
