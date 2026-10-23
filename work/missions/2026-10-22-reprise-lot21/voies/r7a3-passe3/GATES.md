# Gates: voie r7a3-passe3 — Dryhopper, passe 3 de a1 : pas de vide

OWNS: work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/passe3/**, work/missions/2026-10-22-reprise-lot21/voies/r7a3-passe3/RESULTAT.md

Scope: a1 sans vide (premier écran couvert à 0,55 au moins, comme r6n2), avec tous les critères de la passe 2.

- [x] G1: baseline : les exigences de toute l'app tiennent (MOTS joué à part)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/passe3 a1 --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=019bd57eb1fc51209afd25d6d768864d2a2f379df03bdbd1e3b6b4b0b5372d50; exit=0; EXPECT=matched; output-sha256=17c208fcc8bcaece23f4c60d9cb18741b72129c670bc157e4fe6eff6b3b9ac33; output-bytes=191; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: 80 mots au plus au premier écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/passe3 a1 --max=80 --page=etat.html
  EXPECT: MOTS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=a81214d91f98dc9f8ed6a15bb39b17fd0ddbb3cca035efd17a38427c4671a443; exit=0; EXPECT=matched; output-sha256=bf82bea5da17873f32f5d72cf75996e2f349bc0e7b6c20cec68c1c09ef72df2a; output-bytes=19; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: un seul facteur libre, le moment (D98, édition du contexte admise)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/passe3 a1 --page=etat.html --edition
  EXPECT: /UNE-QUESTION OK \(1 groupe libre : moment\)/
  EVIDENCE: automatic-evidence=v1; definition-sha256=da30064164a600ed8348387a168fd4f48c399fc1dae198865a015cb78b1d897b; exit=0; EXPECT=matched; output-sha256=cf05e9fa11b011d200ebe6646cbff072165cf26026d7d955558de6bb8cac2dd5; output-bytes=163; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: les acquis de Dryhopper
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-acquis.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/passe3 a1 --page=etat.html --outil=dryhopper
  EXPECT: ACQUIS OK (4/4 : geste, frise, valeurs, levure)
  EVIDENCE: automatic-evidence=v1; definition-sha256=51a6912be0c846d9baa82ca1b5d35a19890a2c23587a1c42d6489a17afb147e0; exit=0; EXPECT=matched; output-sha256=f68c2d9e7429620412766b9fba1cdb61ecca29dce3e7df12d3ad48da2f6d916e; output-bytes=134; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: la page se rend sans erreur de script ni défilement horizontal
  CHECK: node scripts/agents/verifier-page.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/passe3/a1/etat.html --min-images 0
  EXPECT: PAGE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=64acc3b6486a05b9eda3e7b669434ca121922cc8ad62b4372e8993d4b5e52fa0; exit=0; EXPECT=matched; output-sha256=8b41bf6d50130554819585d7bc2314ffb9174f5a88af247a6bd7ca1b8522fa10; output-bytes=50; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: pas de vide : le premier écran couvert à 0,55 au moins, à côté de r6n2 (M14)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-panel.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/passe3/captures/a1-premier-ecran.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6n2-premier-ecran.png --plancher=0.55 --part-vides=0
  EXPECT: PANEL OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=a285b407fe4347d59353324e8341234e20e6a999c12603f0dd5ec6d6e76245cd; exit=0; EXPECT=matched; output-sha256=b89b2ed717873d2d405c76a1a6e7cf20fd7ce610b7d9d26870d573018e4dfaa9; output-bytes=129; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: page, note et captures existent
  CHECK: node scripts/agents/systeme.mjs existent work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/passe3/a1/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/passe3/NOTE.md work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/passe3/captures/a1-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/passe3/captures/a1-premier-ecran.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/passe3/captures/a1-toucher-390.png
  EXPECT: EXISTENT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=1a489a6ef920cdfd3b863a2c936233d4f832dab57324d7986058c960d0636a27; exit=0; EXPECT=matched; output-sha256=6135d4eaaef809fdb6913125e25ddab705378564706aac0a57963d6ff2a4e803; output-bytes=14; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G8: la NOTE et le rapport disent la passe 3
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r7a3-passe3/RESULTAT.md --contient "a1-premier-ecran.png,remplissage,LEÇON PROPOSÉE"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=6b4bb8043250020f8b085807ddeb272d470af3b023b05c8bb94e40b329eef56e; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
