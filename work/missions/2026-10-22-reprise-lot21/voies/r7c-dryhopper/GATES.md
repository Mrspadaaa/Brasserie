# Gates: voie r7c-dryhopper — Dryhopper, série C (v0 ×8)

OWNS: work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-c/**, work/missions/2026-10-22-reprise-lot21/voies/r7c-dryhopper/RESULTAT.md

Scope: huit concepts minimalistes de Dryhopper (« Quand l'ajouter ? »), sur la baseline, un seul facteur libre (le moment), approche les vraies valeurs d'abord.

- [x] G1: baseline : les exigences de toute l'app tiennent sur les concepts 1 à 4 (MOTS joué à part ; coupé en deux pour tenir sous le délai de 120 s de gate-check)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-c c1 c2 c3 c4 --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=36791790ff8b997995f73e8b530972abbb150edd84b487aeb10eded59a0b9705; exit=0; EXPECT=matched; output-sha256=17c208fcc8bcaece23f4c60d9cb18741b72129c670bc157e4fe6eff6b3b9ac33; output-bytes=191; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: la question de l'outil : un seul facteur libre, le moment (D98)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-c c1 c2 c3 c4 c5 c6 c7 c8 --page=etat.html
  EXPECT: /UNE-QUESTION OK \(1 groupe libre : moment\)/
  EVIDENCE: automatic-evidence=v1; definition-sha256=b76e1c315aad1ce8f96d75df0693b069e4b77105a606cbe9714b9ece6ffa37a3; exit=0; EXPECT=matched; output-sha256=bd1bd5cb06eca256e4f6f22a5a70467f4862f1c21cdd82457c995963bbb7518a; output-bytes=1010; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: pages, note et captures existent
  CHECK: node scripts/agents/systeme.mjs existent work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-c/NOTE.md work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-c/c1/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-c/captures/c1-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-c/c2/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-c/captures/c2-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-c/c3/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-c/captures/c3-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-c/c4/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-c/captures/c4-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-c/c5/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-c/captures/c5-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-c/c6/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-c/captures/c6-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-c/c7/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-c/captures/c7-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-c/c8/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-c/captures/c8-390.png
  EXPECT: EXISTENT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=0b25a726d34915fca829c33e8f1f5ab2b27fc1c285086fe52524c926cd83175d; exit=0; EXPECT=matched; output-sha256=34b54ef1b2578ed681137cf3fdaf76aedc1df5adbd8c1c30561fec4d663aa996; output-bytes=15; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: la NOTE dit les concepts, la baseline et ses écarts, et les sorties de D98, D99 et MOTS
  CHECK: node scripts/agents/systeme.mjs note work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-c/NOTE.md --contient "## Concepts,## Baseline,D98,D99,MOTS,froide,tiède,chaude"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=50bc8d58558927613b1d4a55dfd9e1ad7577e3ec4b6a8e747e9da11afb03b3fd; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: le rapport cite les captures ouvertes
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r7c-dryhopper/RESULTAT.md --contient "c1-390.png,c8-390.png,LEÇON PROPOSÉE"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=c817b1a1a18fdf7229ef13113ea077fcc1b9b9708f9cc37cd38c04c57e76f262; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: baseline : les exigences de toute l'app tiennent sur les concepts 5 à 8 (MOTS joué à part)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-c c5 c6 c7 c8 --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=bf644f48f6700e3761a8532e2387a674ac2a67e7bf937ffe96e94ac68296b226; exit=0; EXPECT=matched; output-sha256=17c208fcc8bcaece23f4c60d9cb18741b72129c670bc157e4fe6eff6b3b9ac33; output-bytes=191; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
