# Gates: voie r7b2-passe2 — Dryhopper, passe 2 de b4

OWNS: work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-b/passe2/**, work/missions/2026-10-22-reprise-lot21/voies/r7b2-passe2/RESULTAT.md

Scope: b4 améliorée avec ses greffes : baseline et acquis de Dryhopper, un seul facteur libre (le moment), 80 mots au plus, page sans erreur, captures ouvertes.

- [x] G1: baseline : les exigences de toute l'app tiennent (MOTS joué à part)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-b/passe2 b4 --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=ea19bc497b519aefc3f3117d520ca45508ac1866c39d01784d42a5517f270705; exit=0; EXPECT=matched; output-sha256=17c208fcc8bcaece23f4c60d9cb18741b72129c670bc157e4fe6eff6b3b9ac33; output-bytes=191; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: 80 mots au plus au premier écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-b/passe2 b4 --max=80 --page=etat.html
  EXPECT: MOTS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=8d8e64a9dc3f3278bf385c90aad7b16abca0b18c98233355885d633bc599e011; exit=0; EXPECT=matched; output-sha256=f1c5853ff12dc44c725a5c2ca19e18294c97491c59c54a709936fba72fccd9c0; output-bytes=19; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: un seul facteur libre, le moment (D98, édition du contexte admise)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-b/passe2 b4 --page=etat.html --edition
  EXPECT: /UNE-QUESTION OK \(1 groupe libre : moment\)/
  EVIDENCE: automatic-evidence=v1; definition-sha256=8383420b601276d60b9308cd7ce28cf9026c2d080ab192443f2b1f7e61e06c8f; exit=0; EXPECT=matched; output-sha256=e6f746a1fe1d50bb1b3642c6c27b077ec7e867a7d0939ef9649243549b35ebc6; output-bytes=163; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: les acquis de Dryhopper : geste, frise, valeurs, levure
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-acquis.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-b/passe2 b4 --page=etat.html --outil=dryhopper
  EXPECT: ACQUIS OK (4/4 : geste, frise, valeurs, levure)
  EVIDENCE: automatic-evidence=v1; definition-sha256=2f3f6ebda6ef5c86935652f7314e4405751dc7923045fcc3e8a2d6aab9c20596; exit=0; EXPECT=matched; output-sha256=2d44e0d9f0813e0d9b42c4a3cb5b62c02c076bf90fed4e8e5358b0824a00cf8f; output-bytes=134; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: la page se rend sans erreur de script ni défilement horizontal
  CHECK: node scripts/agents/verifier-page.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-b/passe2/b4/etat.html --min-images 0
  EXPECT: PAGE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=46b90b9ecaf3015aba9b64d668d65b37b5220ac1c40bf50c7434047b2587ce63; exit=0; EXPECT=matched; output-sha256=8b41bf6d50130554819585d7bc2314ffb9174f5a88af247a6bd7ca1b8522fa10; output-bytes=50; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: page, note et captures existent
  CHECK: node scripts/agents/systeme.mjs existent work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-b/passe2/b4/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-b/passe2/NOTE.md work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-b/passe2/captures/b4-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-b/passe2/captures/b4-premier-ecran.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-b/passe2/captures/b4-toucher-390.png
  EXPECT: EXISTENT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=4cf8a919ab5820fbedb4a29c0cdd67447f523144b1ccfba0e7af9613e013745f; exit=0; EXPECT=matched; output-sha256=6135d4eaaef809fdb6913125e25ddab705378564706aac0a57963d6ff2a4e803; output-bytes=14; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: la NOTE dit la passe 2, les greffes et la baseline
  CHECK: node scripts/agents/systeme.mjs note work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-b/passe2/NOTE.md --contient "## Passe 2,## Baseline,greffe"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=86515bcda7c763680827bc004d8418646548ecb90bd07dabab5efd29787a6ab7; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G8: le rapport cite les captures ouvertes
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r7b2-passe2/RESULTAT.md --contient "b4-premier-ecran.png,b4-toucher-390.png,LEÇON PROPOSÉE"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=112dad1a237ee73135ef77a7cb0c8677558d5440e8315b0d327010eed8788ed9; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
