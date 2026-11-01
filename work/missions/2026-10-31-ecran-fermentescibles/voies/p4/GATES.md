# Gates: voie p4 — r4d, les gestes sur la ligne

OWNS: work/missions/2026-10-31-ecran-fermentescibles/v3/r4d/, work/missions/2026-10-31-ecran-fermentescibles/voies/p4/RESULTAT.md

Scope: r4c reprise telle quelle, avec modifier, retirer et ajouter sur la ligne, et le détail au toucher du nom (D208, D209).

- [x] G1: les quatre gestes passent au repos et en #replie, à 390 et à 1280
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-gestes-ligne.mjs work/missions/2026-10-31-ecran-fermentescibles/v3/r4d/etat.html --etats=,replie
  EXPECT: GESTES OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=8d33e5e8737e25d47e609f74ccfed4466a8c7bda4724a825e1f83a82085905d9; exit=0; EXPECT=matched; output-sha256=de63ce065ccd2e802c5fb47593948f6bd52bba566bcd8a0e6686188e2eed9eb3; output-bytes=1319; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: le témoin négatif r4c échoue toujours
  CHECK: node scripts/agents/systeme.mjs echoue "GESTES ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-gestes-ligne.mjs work/missions/2026-10-31-ecran-fermentescibles/v2/r4c/etat.html
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=7c84c482461eba67b9a5a1a1e47aea3b791d763f6aeea2ddc460286799ccd89b; exit=0; EXPECT=matched; output-sha256=7c7d54fe886b9993e2aee3f7ad6f42818228287f3e7a04c9d2b00523508d4237; output-bytes=33; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: la page se rend sans erreur
  CHECK: node scripts/agents/verifier-page.mjs work/missions/2026-10-31-ecran-fermentescibles/v3/r4d/etat.html --min-images 0
  EXPECT: PAGE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=a9d5c7c65bab2405d5b7de1e58cf8e2a80815959b2c66a7405c088f3de57bd8e; exit=0; EXPECT=matched; output-sha256=8b41bf6d50130554819585d7bc2314ffb9174f5a88af247a6bd7ca1b8522fa10; output-bytes=50; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: 80 mots au plus au premier écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs work/missions/2026-10-31-ecran-fermentescibles/v3 r4d --page=etat.html --max=80 --profil=sans-houblons
  EXPECT: MOTS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=4bc50ec3c2ddeac309cced1f40d4a77ce3c66504799d5c1d53bdeef8a679d37f; exit=0; EXPECT=matched; output-sha256=73ac76c59ef239f02c2e3a8974768dff8c7a5e0c68e46ece6b6b3df7ed9086b4; output-bytes=20; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: le cadre commun tient, couleurs mises à part comme r4c
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/missions/2026-10-31-ecran-fermentescibles/v3 r4d --page=etat.html --profil=sans-houblons --sans=couleurs
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=02c536267fde72d0298baa586d69d980a32cb5011568e038ac2ffb766c455a2d; exit=0; EXPECT=matched; output-sha256=b1eb81e605666a86110c81bfdc456969c5da4552e65264efd55b22d3ef5e6472; output-bytes=606; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: contraste
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-contraste.mjs work/missions/2026-10-31-ecran-fermentescibles/v3 r4d --page=etat.html
  EXPECT: CONTRASTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=47a6dbfdeef17a147a8a04169e696924b6ec9c3ac5bc6159782fe2a7325e36d7; exit=0; EXPECT=matched; output-sha256=7e802bb515153632f905b531c38ba26cda693b640f06d75a9c51c561a6908273; output-bytes=85; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: hauteur
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-hauteur.mjs work/missions/2026-10-31-ecran-fermentescibles/v3 r4d --page=etat.html
  EXPECT: HAUTEUR OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=d50de5f08b7bdf1a05c9ddd89ce8fc2ba2c05e4c29de2fe2e9abdf81994285da; exit=0; EXPECT=matched; output-sha256=71217c6c08ff7104319ac6f7d8c4cbbe4502fd9cd64aedf795271d9fcc31de63; output-bytes=176; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G8: les captures se refont sans erreur, rien de tronqué
  CHECK: node work/missions/2026-10-31-ecran-fermentescibles/v3/r4d/capturer.mjs
  EXPECT: CAPTURES OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=ee2bfea7d89b77927cb56b9d584c0896db4c9e0c632393281ab1fdd025d87aa8; exit=0; EXPECT=matched; output-sha256=24b8153b52ae97fe0feb7311fbec6a68b5af419845df808b124a221a664d9cfe; output-bytes=717; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
