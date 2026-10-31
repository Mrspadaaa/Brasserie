# Gates: voie p5 — r4e : tout ce que la ligne montre se change sur la ligne

OWNS: work/missions/2026-10-31-ecran-fermentescibles/v4/r4e-a/, work/missions/2026-10-31-ecran-fermentescibles/v4/r4e-b/, work/missions/2026-10-31-ecran-fermentescibles/voies/p5/RESULTAT.md

Scope: r4d telle quelle, plus la part, le moment et la couleur réglés sur la ligne (D211) ; plateau toujours visible (D212) ; deux variantes.

- [x] G1: r4e-a, chaque réglage de la ligne se change sur la ligne
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-volee.mjs work/missions/2026-10-31-ecran-fermentescibles/v4/r4e-a/etat.html
  EXPECT: VOLEE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=cd5879df5de23a2a636be957d1e60f1f83ac332ec979708a4fa1a38a157952bc; exit=0; EXPECT=matched; output-sha256=f52d9eff86e65e1afcfa85f34b71f76da203dbd5aaf2f587125da7502e506843; output-bytes=881; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: r4e-a, les gestes de r4d tiennent (masse, retrait, ajout, détail)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-gestes-ligne.mjs work/missions/2026-10-31-ecran-fermentescibles/v4/r4e-a/etat.html
  EXPECT: GESTES OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=d1a7e82179b6010e0b862b7bdc4befab7157c9871d1df23b123fb32a3c558249; exit=0; EXPECT=matched; output-sha256=71f4950a40b29618d0ecc5dd22adae6b0fecd2e5e8027cdc1bc803548e2f1185; output-bytes=662; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: r4e-a se rend sans erreur
  CHECK: node scripts/agents/verifier-page.mjs work/missions/2026-10-31-ecran-fermentescibles/v4/r4e-a/etat.html --min-images 0
  EXPECT: PAGE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=92d0fce721d1312536d4368ba1825f59e5e37276e83cb82ceaf41dff2f7f706c; exit=0; EXPECT=matched; output-sha256=8b41bf6d50130554819585d7bc2314ffb9174f5a88af247a6bd7ca1b8522fa10; output-bytes=50; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: r4e-a, 80 mots au plus au premier écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs work/missions/2026-10-31-ecran-fermentescibles/v4 r4e-a --page=etat.html --max=80 --profil=sans-houblons
  EXPECT: MOTS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=5f670d2a205de308c3a4a0f168340f2a15632099a5c4be94706f4c1888532d04; exit=0; EXPECT=matched; output-sha256=0737094d7de7fc9290fe40cd4104c764130c5c571d778b849311e003da4a1a0d; output-bytes=22; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: r4e-a, le cadre commun tient, couleurs mises à part comme r4c
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/missions/2026-10-31-ecran-fermentescibles/v4 r4e-a --page=etat.html --profil=sans-houblons --sans=couleurs
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=54f162be7d10daa2d4aac1bf498def7fac44635bbdb0b7ae6e273d20ebb93b7a; exit=0; EXPECT=matched; output-sha256=b1eb81e605666a86110c81bfdc456969c5da4552e65264efd55b22d3ef5e6472; output-bytes=606; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: r4e-a, contraste
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-contraste.mjs work/missions/2026-10-31-ecran-fermentescibles/v4 r4e-a --page=etat.html
  EXPECT: CONTRASTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=798c09dc356162def430f6afb459e7f26fb246693281cb252d348443a22217e2; exit=0; EXPECT=matched; output-sha256=f91d757e64ede564c63a1fbca43a5d758e92b2ac08617d231f56f82431f21173; output-bytes=87; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: r4e-a, hauteur
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-hauteur.mjs work/missions/2026-10-31-ecran-fermentescibles/v4 r4e-a --page=etat.html
  EXPECT: HAUTEUR OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=ea45f498265c84b7cd99ecd74d797b1cc285d96bacef21c45df8b73e1f283fd7; exit=0; EXPECT=matched; output-sha256=a5328a3410e6669c23e36244d71ae297e5b3d27e6e3572d414da416f1056e393; output-bytes=178; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G8: r4e-b, chaque réglage de la ligne se change sur la ligne
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-volee.mjs work/missions/2026-10-31-ecran-fermentescibles/v4/r4e-b/etat.html
  EXPECT: VOLEE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=792404d2e02e5c22d2c93c6071eadada63c5b34847a6ef6da590ec32a83ac371; exit=0; EXPECT=matched; output-sha256=76174ef4b2e81870ebcf3b0fb7578ae546917b0b6fa0ec905b942bd88c37d318; output-bytes=839; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G9: r4e-b, les gestes de r4d tiennent (masse, retrait, ajout, détail)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-gestes-ligne.mjs work/missions/2026-10-31-ecran-fermentescibles/v4/r4e-b/etat.html
  EXPECT: GESTES OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=57f935319cc8b4307acb3e36d35848bd648057be2ef7eca38a06fadc6542d271; exit=0; EXPECT=matched; output-sha256=71f4950a40b29618d0ecc5dd22adae6b0fecd2e5e8027cdc1bc803548e2f1185; output-bytes=662; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G10: r4e-b se rend sans erreur
  CHECK: node scripts/agents/verifier-page.mjs work/missions/2026-10-31-ecran-fermentescibles/v4/r4e-b/etat.html --min-images 0
  EXPECT: PAGE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=9fac905636cbce6256cb03d7b17f516ff69a90bd23414498dc53a5f488f0fea3; exit=0; EXPECT=matched; output-sha256=8b41bf6d50130554819585d7bc2314ffb9174f5a88af247a6bd7ca1b8522fa10; output-bytes=50; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G11: r4e-b, 80 mots au plus au premier écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs work/missions/2026-10-31-ecran-fermentescibles/v4 r4e-b --page=etat.html --max=80 --profil=sans-houblons
  EXPECT: MOTS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=5e4ead5e29a0ec1fe5000c7b9b30ed7a3b0587c22b0bab0af1ba57466322193a; exit=0; EXPECT=matched; output-sha256=289ba79f7d85ff996e15eb92267b44a1a570b59ae64d55d5f63e9d7edf1f451c; output-bytes=22; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G12: r4e-b, le cadre commun tient, couleurs mises à part comme r4c
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/missions/2026-10-31-ecran-fermentescibles/v4 r4e-b --page=etat.html --profil=sans-houblons --sans=couleurs
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=92843528e6ac42dd8393a6dd7ae2647c5711d863983e9f1779e15f69acbffe2b; exit=0; EXPECT=matched; output-sha256=b1eb81e605666a86110c81bfdc456969c5da4552e65264efd55b22d3ef5e6472; output-bytes=606; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G13: r4e-b, contraste
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-contraste.mjs work/missions/2026-10-31-ecran-fermentescibles/v4 r4e-b --page=etat.html
  EXPECT: CONTRASTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=0d7af4beb3ef8a83d1b5f2590928bb53290892634014468229110c7edf7fef4f; exit=0; EXPECT=matched; output-sha256=4736c991d20359c3d4a037e94e5d989f6807808f3258cc4d6caf23fd3eccd1a1; output-bytes=87; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G14: r4e-b, hauteur
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-hauteur.mjs work/missions/2026-10-31-ecran-fermentescibles/v4 r4e-b --page=etat.html
  EXPECT: HAUTEUR OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=029706b8e6cf0e5be41847c95d70b7e5723d078bcba4d6e5766d84eaa499c021; exit=0; EXPECT=matched; output-sha256=d97d4fa83bea4650efdd55d4db4d1da711bd08884e27f303d0f3d7487c46d985; output-bytes=178; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G15: le résultat cite la plainte, le choix du plateau et les captures
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-31-ecran-fermentescibles/voies/p5/RESULTAT.md --contient "D211,Toujours visible,captures"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=c0059657e6e433301ec94d75a2657536facace3b2c4b2a4f7592124624c12a86; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G16: les captures de r4e-a se refont sans erreur
  CHECK: node work/missions/2026-10-31-ecran-fermentescibles/v4/r4e-a/capturer.mjs
  EXPECT: CAPTURES OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=846372f92568ef8b32ca8e9fea4c2a340622bd8e2aa1afdbf0d554ae1b7ba4a7; exit=0; EXPECT=matched; output-sha256=e892571d8b86a2e48cf1366d1c55db2a255826a7998dda0b21149dfa71e91ef3; output-bytes=776; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G17: les captures de r4e-b se refont sans erreur
  CHECK: node work/missions/2026-10-31-ecran-fermentescibles/v4/r4e-b/capturer.mjs
  EXPECT: CAPTURES OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=37b5a8ea92e7f8655956ddb28133b57a8a809ff5a30dae5d17d956a854568997; exit=0; EXPECT=matched; output-sha256=86f2c04fe4b2a0d753a5ec6a692e001ca2e44060b0b00ddc23c5cb8b5f62b95d; output-bytes=665; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
