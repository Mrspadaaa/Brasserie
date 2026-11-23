# Gates: voie r7b-dryhopper — Dryhopper, série B (v0 ×8)

OWNS: work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-b/**, work/missions/2026-10-22-reprise-lot21/voies/r7b-dryhopper/RESULTAT.md

Scope: huit concepts minimalistes de Dryhopper (« Quand l'ajouter ? »), sur la baseline, un seul facteur libre (le moment), approche la réponse d'abord.

- [x] G1: baseline : les exigences de toute l'app tiennent sur les concepts 1 à 4 (MOTS joué à part ; coupé en deux pour tenir sous le délai de 120 s de gate-check)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-b b1 b2 b3 b4 --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=22dd3c590badced59c41063d6f4650ff8db8aebec5e8e7c568efaad5ea7e4d73; exit=0; EXPECT=matched; output-sha256=17c208fcc8bcaece23f4c60d9cb18741b72129c670bc157e4fe6eff6b3b9ac33; output-bytes=191; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: la question de l'outil : un seul facteur libre, le moment (D98)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-b b1 b2 b3 b4 b5 b6 b7 b8 --page=etat.html
  EXPECT: /UNE-QUESTION OK \(1 groupe libre : moment\)/
  EVIDENCE: automatic-evidence=v1; definition-sha256=38f3645255ca1fe09e72f04f0a4cd091f7dda8a69d172d4c74c6c3fc3fd27a9b; exit=0; EXPECT=matched; output-sha256=a0b83de52a3cf6f0f274434b42fd34ce203f6ce4b9cc5ed809afcd1524d4de15; output-bytes=1010; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: pages, note et captures existent
  CHECK: node scripts/agents/systeme.mjs existent work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-b/NOTE.md work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-b/b1/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-b/captures/b1-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-b/b2/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-b/captures/b2-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-b/b3/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-b/captures/b3-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-b/b4/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-b/captures/b4-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-b/b5/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-b/captures/b5-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-b/b6/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-b/captures/b6-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-b/b7/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-b/captures/b7-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-b/b8/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-b/captures/b8-390.png
  EXPECT: EXISTENT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=ca1e97002bc8de17908d7011a00dd327d56ff8b0fd8d57506b35f096366ba5d5; exit=0; EXPECT=matched; output-sha256=34b54ef1b2578ed681137cf3fdaf76aedc1df5adbd8c1c30561fec4d663aa996; output-bytes=15; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: la NOTE dit les concepts, la baseline et ses écarts, et les sorties de D98, D99 et MOTS
  CHECK: node scripts/agents/systeme.mjs note work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-b/NOTE.md --contient "## Concepts,## Baseline,D98,D99,MOTS,froide,tiède,chaude"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=53063e8235ad0a56bb65b420e4bff24683865f241b3f7f3deec6b0b473ca37e4; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: le rapport cite les captures ouvertes
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r7b-dryhopper/RESULTAT.md --contient "b1-390.png,b8-390.png,LEÇON PROPOSÉE"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=db4beb293ceca5d51c2bed239cba38d5b1c0472addf5ac2f0c4a85ec71b7d72c; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: baseline : les exigences de toute l'app tiennent sur les concepts 5 à 8 (MOTS joué à part)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-b b5 b6 b7 b8 --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=1f99fbb993698619e0f5efccd055d9f94019dca00ce47be4ec39786f8e3bbb61; exit=0; EXPECT=matched; output-sha256=17c208fcc8bcaece23f4c60d9cb18741b72129c670bc157e4fe6eff6b3b9ac33; output-bytes=191; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
