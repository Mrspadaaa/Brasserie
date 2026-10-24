# Gates: voie r7b3-passe3 — Dryhopper, passe 3 de b4 : pas de vide

OWNS: work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-b/passe3/**, work/missions/2026-10-22-reprise-lot21/voies/r7b3-passe3/RESULTAT.md

Scope: b4 sans vide (premier écran couvert à 0,55 au moins, comme r6n2), avec tous les critères de la passe 2.

- [x] G1: baseline : les exigences de toute l'app tiennent (MOTS joué à part)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-b/passe3 b4 --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=f4e35346e2cd4f1b38816cbcfd20874b76e24d8221cd9f82473834886278666b; exit=0; EXPECT=matched; output-sha256=17c208fcc8bcaece23f4c60d9cb18741b72129c670bc157e4fe6eff6b3b9ac33; output-bytes=191; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: 80 mots au plus au premier écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-b/passe3 b4 --max=80 --page=etat.html
  EXPECT: MOTS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=52c57947b85a8cb864b4f7e89689599605cd864eb967961e66dfa1e61c9104f6; exit=0; EXPECT=matched; output-sha256=f1c5853ff12dc44c725a5c2ca19e18294c97491c59c54a709936fba72fccd9c0; output-bytes=19; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: un seul facteur libre, le moment (D98, édition du contexte admise)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-b/passe3 b4 --page=etat.html --edition
  EXPECT: /UNE-QUESTION OK \(1 groupe libre : moment\)/
  EVIDENCE: automatic-evidence=v1; definition-sha256=49f9db0bce006fc1529ed8b1759ea60916a4d208536e438c493acc9d737a237a; exit=0; EXPECT=matched; output-sha256=e6f746a1fe1d50bb1b3642c6c27b077ec7e867a7d0939ef9649243549b35ebc6; output-bytes=163; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: les acquis de Dryhopper
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-acquis.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-b/passe3 b4 --page=etat.html --outil=dryhopper
  EXPECT: ACQUIS OK (4/4 : geste, frise, valeurs, levure)
  EVIDENCE: automatic-evidence=v1; definition-sha256=a7e30105a402c119fe724672b82016b8af1b12c3ef851e46ddfac175084c67bc; exit=0; EXPECT=matched; output-sha256=2d44e0d9f0813e0d9b42c4a3cb5b62c02c076bf90fed4e8e5358b0824a00cf8f; output-bytes=134; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: la page se rend sans erreur de script ni défilement horizontal
  CHECK: node scripts/agents/verifier-page.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-b/passe3/b4/etat.html --min-images 0
  EXPECT: PAGE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=caf15f502be53f781929bb117708359872da1c49f71f10a6835ea665a0fc57e8; exit=0; EXPECT=matched; output-sha256=8b41bf6d50130554819585d7bc2314ffb9174f5a88af247a6bd7ca1b8522fa10; output-bytes=50; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: pas de vide : le premier écran couvert à 0,55 au moins, à côté de r6n2 (M14)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-panel.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-b/passe3/captures/b4-premier-ecran.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6n2-premier-ecran.png --plancher=0.55 --part-vides=0
  EXPECT: PANEL OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=32dca0ddc5cc30c29e37d11e97ad0fb95d8a4ab3be749cde2724f3f127f74171; exit=0; EXPECT=matched; output-sha256=b89b2ed717873d2d405c76a1a6e7cf20fd7ce610b7d9d26870d573018e4dfaa9; output-bytes=129; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: page, note et captures existent
  CHECK: node scripts/agents/systeme.mjs existent work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-b/passe3/b4/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-b/passe3/NOTE.md work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-b/passe3/captures/b4-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-b/passe3/captures/b4-premier-ecran.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-b/passe3/captures/b4-toucher-390.png
  EXPECT: EXISTENT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=befd44a362211097500a66b22cdcfe004318ec511ad8da18bef513f5332e0e13; exit=0; EXPECT=matched; output-sha256=6135d4eaaef809fdb6913125e25ddab705378564706aac0a57963d6ff2a4e803; output-bytes=14; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G8: la NOTE et le rapport disent la passe 3
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r7b3-passe3/RESULTAT.md --contient "b4-premier-ecran.png,remplissage,LEÇON PROPOSÉE"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=e6d6b4487f0c49bfba18f2ee9ea9567ce82e3d245a3bcc6e3a928dbf06eba8f9; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
