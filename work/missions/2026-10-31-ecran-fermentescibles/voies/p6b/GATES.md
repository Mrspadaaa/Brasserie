# Gates: voie p6b — la masse sans clavier sur chaque ligne, côté b (barre tirée)

OWNS: work/missions/2026-10-31-ecran-fermentescibles/v6/p6-b1/, work/missions/2026-10-31-ecran-fermentescibles/v6/p6-b2/, work/missions/2026-10-31-ecran-fermentescibles/voies/p6b/COMPRIS.md, work/missions/2026-10-31-ecran-fermentescibles/voies/p6b/RESULTAT.md

Scope: v5/m1/b.html telle quelle, plus la masse de chaque ligne changée d'un geste sans clavier (D219), par − / + ou par un mini curseur ; deux variantes.

- [x] G1: la voie est comprise avant de construire
  CHECK: node scripts/agents/systeme.mjs comprendre work/missions/2026-10-31-ecran-fermentescibles/voies/p6b
  EXPECT: COMPRIS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=47c9d10157389df5822f661143ee0fba4c0a8df91bdb7e0e5d3275b5c383fa36; exit=0; EXPECT=matched; output-sha256=894efba9d20a9c0af2d4f57bf6c3141c1a698d6b9207404de99b7c27589f2dfd; output-bytes=22; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: p6-b1, la masse de chaque ligne se change sans clavier, d'un geste (D219)
  CHECK: node work/missions/2026-10-31-ecran-fermentescibles/controle-masse-ligne.mjs work/missions/2026-10-31-ecran-fermentescibles/v6/p6-b1/etat.html
  EXPECT: MASSE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=ef9aae05604ab6ec2fae78cad61ce9184753ceb07de7bdbe4d3a8980431fce64; exit=0; EXPECT=matched; output-sha256=305dd5c7adbf61ca19543b100a58a49731ef801ae3fd828da1fc5d8af2445fa2; output-bytes=1472; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: p6-b1, le moment de la ligne n'a pas l'air d'un bouton (D218)
  CHECK: node work/missions/2026-10-31-ecran-fermentescibles/controle-moment-ligne.mjs work/missions/2026-10-31-ecran-fermentescibles/v6/p6-b1/etat.html
  EXPECT: MOMENT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=b45f7121e90b984474409a9947095f54ea09503c840df11f126c9be844569ed2; exit=0; EXPECT=matched; output-sha256=a545cf55235da41bf7dfec4439845f417297369c1d12d6032eacd70b63e9e4db; output-bytes=408; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: p6-b1, chaque réglage de la ligne se change toujours sur la ligne (D211)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-volee.mjs work/missions/2026-10-31-ecran-fermentescibles/v6/p6-b1/etat.html
  EXPECT: VOLEE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=d85b48c1b0aed809c824047ceb751fedd5f6fd3fdafe360882323a94287f8225; exit=0; EXPECT=matched; output-sha256=76174ef4b2e81870ebcf3b0fb7578ae546917b0b6fa0ec905b942bd88c37d318; output-bytes=839; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: p6-b1, les gestes de r4d tiennent (masse tapée, retrait, ajout, détail)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-gestes-ligne.mjs work/missions/2026-10-31-ecran-fermentescibles/v6/p6-b1/etat.html
  EXPECT: GESTES OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=53d080d2d7c9a68fb2f40de6ddcf83bbb86524d38f96fe35a1b88a5c59264fc6; exit=0; EXPECT=matched; output-sha256=71f4950a40b29618d0ecc5dd22adae6b0fecd2e5e8027cdc1bc803548e2f1185; output-bytes=662; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: p6-b1 se rend sans erreur
  CHECK: node scripts/agents/verifier-page.mjs work/missions/2026-10-31-ecran-fermentescibles/v6/p6-b1/etat.html --min-images 0
  EXPECT: PAGE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=0350edaca94ea4203de847576eab2d35f885b3475f739d71c6a3511ec7cdb351; exit=0; EXPECT=matched; output-sha256=8b41bf6d50130554819585d7bc2314ffb9174f5a88af247a6bd7ca1b8522fa10; output-bytes=50; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: p6-b1, 80 mots au plus au premier écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs work/missions/2026-10-31-ecran-fermentescibles/v6 p6-b1 --page=etat.html --max=80 --profil=sans-houblons
  EXPECT: MOTS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=df584665f221294a0a1897b86ca6ea399a4e7dfb536900ece4a60a033c13933c; exit=0; EXPECT=matched; output-sha256=443d52259162c7508089de5d474589c070f4e8a427499819dfcb0564139f81b4; output-bytes=22; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G8: p6-b1, le cadre commun tient, couleurs mises à part comme r4c
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/missions/2026-10-31-ecran-fermentescibles/v6 p6-b1 --page=etat.html --profil=sans-houblons --sans=couleurs
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=330865e19440ef43e62dc8cad3531b6bec0eaa275911d146f5af79ba1cb9430b; exit=0; EXPECT=matched; output-sha256=b1eb81e605666a86110c81bfdc456969c5da4552e65264efd55b22d3ef5e6472; output-bytes=606; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G9: p6-b1, contraste
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-contraste.mjs work/missions/2026-10-31-ecran-fermentescibles/v6 p6-b1 --page=etat.html
  EXPECT: CONTRASTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=4e7494288346c0d4b016244b556204606f914ceb6ec40fffb3625fb55fe24af4; exit=0; EXPECT=matched; output-sha256=1778fe9abd5578833bcc7c8a5af87c2126cafcd8829b4ba8ef3badfe6e65f0ac; output-bytes=87; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G10: p6-b1, hauteur
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-hauteur.mjs work/missions/2026-10-31-ecran-fermentescibles/v6 p6-b1 --page=etat.html
  EXPECT: HAUTEUR OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=45809231393dd3cbdd0f424943943b1d0b7bec198c9b22046d270b5d93d0a0ad; exit=0; EXPECT=matched; output-sha256=c05b9e72bc913875abe7fbc93fc0c8cd86a19b7203d5466d91f16e77b14a2591; output-bytes=178; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G11: les captures de p6-b1 se refont sans erreur
  CHECK: node work/missions/2026-10-31-ecran-fermentescibles/v6/p6-b1/capturer.mjs
  EXPECT: CAPTURES OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=7e972860290756b6343e7d8a684b8b76895a99cc6a1df9464072c1151b6b4969; exit=0; EXPECT=matched; output-sha256=6fcacaf244080fb6458ef5bb0a1d80e3a8ddd975a3763d30391df79c1f0e9ea7; output-bytes=1121; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G12: p6-b2, la masse de chaque ligne se change sans clavier, d'un geste (D219)
  CHECK: node work/missions/2026-10-31-ecran-fermentescibles/controle-masse-ligne.mjs work/missions/2026-10-31-ecran-fermentescibles/v6/p6-b2/etat.html
  EXPECT: MASSE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=8c4973ea9f4ae37fe42df539a32d89a5594da18ad6beb0e6c22477779ad35d28; exit=0; EXPECT=matched; output-sha256=5d3a36965f5225e6a65e184c9b11accad2a08e5fff697dda312ee11d521c52e1; output-bytes=707; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G13: p6-b2, le moment de la ligne n'a pas l'air d'un bouton (D218)
  CHECK: node work/missions/2026-10-31-ecran-fermentescibles/controle-moment-ligne.mjs work/missions/2026-10-31-ecran-fermentescibles/v6/p6-b2/etat.html
  EXPECT: MOMENT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=6b0ef6c6f0b262f2bfecbbf93a463e8e20f9d922a7fb94bc79715cf629cbb76d; exit=0; EXPECT=matched; output-sha256=31407919a11ec784684d6df4f5c13625c64328e5dff10fe2d39c1d1e68741b0c; output-bytes=408; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G14: p6-b2, chaque réglage de la ligne se change toujours sur la ligne (D211)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-volee.mjs work/missions/2026-10-31-ecran-fermentescibles/v6/p6-b2/etat.html
  EXPECT: VOLEE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=e104371c866ad1bce1cb54cffac15f541abb27910f3c2bdf284f917ee0b62cc6; exit=0; EXPECT=matched; output-sha256=76174ef4b2e81870ebcf3b0fb7578ae546917b0b6fa0ec905b942bd88c37d318; output-bytes=839; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G15: p6-b2, les gestes de r4d tiennent (masse tapée, retrait, ajout, détail)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-gestes-ligne.mjs work/missions/2026-10-31-ecran-fermentescibles/v6/p6-b2/etat.html
  EXPECT: GESTES OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=49b930adb8639225f43113c7d63544882a01e7957af8c8f22019f2cb23032016; exit=0; EXPECT=matched; output-sha256=71f4950a40b29618d0ecc5dd22adae6b0fecd2e5e8027cdc1bc803548e2f1185; output-bytes=662; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G16: p6-b2 se rend sans erreur
  CHECK: node scripts/agents/verifier-page.mjs work/missions/2026-10-31-ecran-fermentescibles/v6/p6-b2/etat.html --min-images 0
  EXPECT: PAGE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=1cf722c236305c89bdaee596e98e4254d77ef789d881968a9eb27a3e41bdea1e; exit=0; EXPECT=matched; output-sha256=8b41bf6d50130554819585d7bc2314ffb9174f5a88af247a6bd7ca1b8522fa10; output-bytes=50; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G17: p6-b2, 80 mots au plus au premier écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs work/missions/2026-10-31-ecran-fermentescibles/v6 p6-b2 --page=etat.html --max=80 --profil=sans-houblons
  EXPECT: MOTS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=b4692dad15e86a3fbdd65210742c4732ac2df7c70b55c9a2c29f1fb87064de0b; exit=0; EXPECT=matched; output-sha256=e40a915df14e1988adf70dd537bcf160e9d9610949079da3733ff5f90fea554e; output-bytes=22; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G18: p6-b2, le cadre commun tient, couleurs mises à part comme r4c
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/missions/2026-10-31-ecran-fermentescibles/v6 p6-b2 --page=etat.html --profil=sans-houblons --sans=couleurs
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=4e1d949647531c6e59dfc36012bb8e19156bb68d2faa33d0adf90254474051b8; exit=0; EXPECT=matched; output-sha256=b1eb81e605666a86110c81bfdc456969c5da4552e65264efd55b22d3ef5e6472; output-bytes=606; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G19: p6-b2, contraste
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-contraste.mjs work/missions/2026-10-31-ecran-fermentescibles/v6 p6-b2 --page=etat.html
  EXPECT: CONTRASTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=51afd42dcaba5f9d57daf6b6bb8b092cb247ee4100ec7e3b55f9402bce8101e7; exit=0; EXPECT=matched; output-sha256=54a71a14d2a07eacb47b7930d8846b5fa3547ce67dd9b8720bbc2646337fb4e8; output-bytes=87; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G20: p6-b2, hauteur
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-hauteur.mjs work/missions/2026-10-31-ecran-fermentescibles/v6 p6-b2 --page=etat.html
  EXPECT: HAUTEUR OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=d0ee8f8b1342eb92777ab40415b026fabd63df76d28da9a56908cde479c7c39d; exit=0; EXPECT=matched; output-sha256=06b0f51c493bb616c6aa4977aa3e4c097c37ccbd8f8059160cc453cd4699acf3; output-bytes=178; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G21: les captures de p6-b2 se refont sans erreur
  CHECK: node work/missions/2026-10-31-ecran-fermentescibles/v6/p6-b2/capturer.mjs
  EXPECT: CAPTURES OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=a4ccc110d3312ffc19c9f65155f9c40c7fbd86699f20512ab2c78ab897687534; exit=0; EXPECT=matched; output-sha256=157ad4d3a973199a175b3adc964b663b71ccfd258dcd28e5f808f33dce0834ed; output-bytes=1318; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G22: le résultat cite sa demande, le slider et les captures
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-31-ecran-fermentescibles/voies/p6b/RESULTAT.md --contient "D219,slider,captures"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=c2756c8f4566b9a95d5c22a7bcc9f1d0d500ea8a75ec95d811aaa7cac55c119a; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
