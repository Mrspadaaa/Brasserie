# Gates: voie r7e2-passe2 — Dryhopper, passe 2 de e5

OWNS: work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e/passe2/**, work/missions/2026-10-22-reprise-lot21/voies/r7e2-passe2/RESULTAT.md

Scope: e5 améliorée avec ses greffes : baseline et acquis de Dryhopper, un seul facteur libre (le moment), 80 mots au plus, page sans erreur, captures ouvertes.

- [x] G1: baseline : les exigences de toute l'app tiennent (MOTS joué à part)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e/passe2 e5 --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=bdb43392407ab28e648d7798c33265e9e6cb6f59f73cc20f576cd53ae47a750b; exit=0; EXPECT=matched; output-sha256=17c208fcc8bcaece23f4c60d9cb18741b72129c670bc157e4fe6eff6b3b9ac33; output-bytes=191; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: 80 mots au plus au premier écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e/passe2 e5 --max=80 --page=etat.html
  EXPECT: MOTS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=54456a6cfe67fa8e1f49e424ba1a5f7b8bce79e941778bc6bae5b69725f7d4d6; exit=0; EXPECT=matched; output-sha256=7da9785fbb8a20ee0a06574fc6099c8027eb9905d17a1b1d370d4190885429bf; output-bytes=19; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: un seul facteur libre, le moment (D98, édition du contexte admise)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e/passe2 e5 --page=etat.html --edition
  EXPECT: /UNE-QUESTION OK \(1 groupe libre : moment\)/
  EVIDENCE: automatic-evidence=v1; definition-sha256=532bd22ba951717cb3f4f7a406986bd7d6e50c6fbbaf1064a8866cc1bb70bc79; exit=0; EXPECT=matched; output-sha256=09aca32a905aed6f10ef3e5c6c4996fd3365ad13a34210d16f56ae162ef93f0d; output-bytes=163; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: les acquis de Dryhopper : geste, frise, valeurs, levure
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-acquis.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e/passe2 e5 --page=etat.html --outil=dryhopper
  EXPECT: ACQUIS OK (4/4 : geste, frise, valeurs, levure)
  EVIDENCE: automatic-evidence=v1; definition-sha256=f6739e86f4659df582042bbc25e74284ca58639f7468865018aba1e9ddc40cd6; exit=0; EXPECT=matched; output-sha256=3fdd3fc0ca688202401adece26c519ed647d2501c16f55005035a431cf36de29; output-bytes=134; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: la page se rend sans erreur de script ni défilement horizontal
  CHECK: node scripts/agents/verifier-page.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e/passe2/e5/etat.html --min-images 0
  EXPECT: PAGE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=9a6c8fc40d869ebecbf294f9220243d95267bcfb8bd8935382ff3f8be7ddf75d; exit=0; EXPECT=matched; output-sha256=8b41bf6d50130554819585d7bc2314ffb9174f5a88af247a6bd7ca1b8522fa10; output-bytes=50; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: page, note et captures existent
  CHECK: node scripts/agents/systeme.mjs existent work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e/passe2/e5/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e/passe2/NOTE.md work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e/passe2/captures/e5-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e/passe2/captures/e5-premier-ecran.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e/passe2/captures/e5-toucher-390.png
  EXPECT: EXISTENT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=fc418d5b28384aaad5d46d6351d526fcd4e825e2482ef3b18e437c0c8928558e; exit=0; EXPECT=matched; output-sha256=6135d4eaaef809fdb6913125e25ddab705378564706aac0a57963d6ff2a4e803; output-bytes=14; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: la NOTE dit la passe 2, les greffes et la baseline
  CHECK: node scripts/agents/systeme.mjs note work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e/passe2/NOTE.md --contient "## Passe 2,## Baseline,greffe"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=753d5662b1f8824622ddc47c1450e49d9b7f2d8888a8c3218c73e53dc78f3166; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G8: le rapport cite les captures ouvertes
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r7e2-passe2/RESULTAT.md --contient "e5-premier-ecran.png,e5-toucher-390.png,LEÇON PROPOSÉE"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=141f10eaeeea000528d7afe5eef167503af706f43e172209684cd2ab18aaed06; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
