# Gates: voie r7d-dryhopper — Dryhopper, série D (v0 ×8)

OWNS: work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-d/**, work/missions/2026-10-22-reprise-lot21/voies/r7d-dryhopper/RESULTAT.md

Scope: huit concepts minimalistes de Dryhopper (« Quand l'ajouter ? »), sur la baseline, un seul facteur libre (le moment), approche le simulateur.

- [x] G1: baseline : les exigences de toute l'app tiennent sur les concepts 1 à 4 (MOTS joué à part ; coupé en deux pour tenir sous le délai de 120 s de gate-check)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-d d1 d2 d3 d4 --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=abcd65868be820af8cc77cfc6a8df34b34810b0c6f57e48917f2a0d07a67e137; exit=0; EXPECT=matched; output-sha256=17c208fcc8bcaece23f4c60d9cb18741b72129c670bc157e4fe6eff6b3b9ac33; output-bytes=191; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: la question de l'outil : un seul facteur libre, le moment (D98)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-d d1 d2 d3 d4 d5 d6 d7 d8 --page=etat.html
  EXPECT: /UNE-QUESTION OK \(1 groupe libre : moment\)/
  EVIDENCE: automatic-evidence=v1; definition-sha256=a63f73d695ae9ced849cde819e9dc85c076b06b1387ab70ae1b6d2a67d56783b; exit=0; EXPECT=matched; output-sha256=d5faa4e4b7ee80c37e1ce8fee2001f0f118865bf954f7fa28dcb26f78b15137a; output-bytes=1010; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: pages, note et captures existent
  CHECK: node scripts/agents/systeme.mjs existent work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-d/NOTE.md work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-d/d1/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-d/captures/d1-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-d/d2/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-d/captures/d2-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-d/d3/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-d/captures/d3-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-d/d4/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-d/captures/d4-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-d/d5/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-d/captures/d5-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-d/d6/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-d/captures/d6-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-d/d7/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-d/captures/d7-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-d/d8/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-d/captures/d8-390.png
  EXPECT: EXISTENT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=7de01efe0f67c235cbb8c5054693bf199836ee54e614fca73d9d8d05e977d02d; exit=0; EXPECT=matched; output-sha256=34b54ef1b2578ed681137cf3fdaf76aedc1df5adbd8c1c30561fec4d663aa996; output-bytes=15; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: la NOTE dit les concepts, la baseline et ses écarts, et les sorties de D98, D99 et MOTS
  CHECK: node scripts/agents/systeme.mjs note work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-d/NOTE.md --contient "## Concepts,## Baseline,D98,D99,MOTS,froide,tiède,chaude"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=cd39a3ebeaf72aa99cf1b80ead649fb3f3f209d79669b6c87c278d94c0388004; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: le rapport cite les captures ouvertes
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r7d-dryhopper/RESULTAT.md --contient "d1-390.png,d8-390.png,LEÇON PROPOSÉE"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=ef865767426d98d6680a58066ac91a2a28290fdbb37ebaaa5991c7669401cc71; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: baseline : les exigences de toute l'app tiennent sur les concepts 5 à 8 (MOTS joué à part)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-d d5 d6 d7 d8 --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=790ae3e1d4ac948bec584d55551491384d12f28e82790d33bd80490329f7df46; exit=0; EXPECT=matched; output-sha256=17c208fcc8bcaece23f4c60d9cb18741b72129c670bc157e4fe6eff6b3b9ac33; output-bytes=191; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
