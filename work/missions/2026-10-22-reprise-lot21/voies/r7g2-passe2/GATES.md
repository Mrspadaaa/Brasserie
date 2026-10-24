# Gates: voie r7g2-passe2 — Dryhopper, passe 2 de g1

OWNS: work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-g/passe2/**, work/missions/2026-10-22-reprise-lot21/voies/r7g2-passe2/RESULTAT.md

Scope: g1 améliorée avec ses greffes : baseline et acquis de Dryhopper, un seul facteur libre (le moment), 80 mots au plus, page sans erreur, captures ouvertes.

- [x] G1: baseline : les exigences de toute l'app tiennent (MOTS joué à part)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-g/passe2 g1 --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=7d416b42ed1b43d503bb6b6b4a831d00245f58e6fc72e11ac574b417351c8a3e; exit=0; EXPECT=matched; output-sha256=17c208fcc8bcaece23f4c60d9cb18741b72129c670bc157e4fe6eff6b3b9ac33; output-bytes=191; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: 80 mots au plus au premier écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-g/passe2 g1 --max=80 --page=etat.html
  EXPECT: MOTS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=b5de41e3b4ccb937770c5b30dd217bb3f78bca30f991b53e6a0d7a004c0cc65b; exit=0; EXPECT=matched; output-sha256=cff2e766c81e7759858287b44499fcc07d572b1572ce84358705cffe471da64b; output-bytes=19; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: un seul facteur libre, le moment (D98, édition du contexte admise)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-g/passe2 g1 --page=etat.html --edition
  EXPECT: /UNE-QUESTION OK \(1 groupe libre : moment\)/
  EVIDENCE: automatic-evidence=v1; definition-sha256=96b1ee02e0002aea499ec52e897285718dcd317b2a42074428fa67df41d66b41; exit=0; EXPECT=matched; output-sha256=1770434b282428cd500e349b2699bbddf2622f6c857aa14c76f0c74c23ceee8c; output-bytes=163; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: les acquis de Dryhopper : geste, frise, valeurs, levure
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-acquis.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-g/passe2 g1 --page=etat.html --outil=dryhopper
  EXPECT: ACQUIS OK (4/4 : geste, frise, valeurs, levure)
  EVIDENCE: automatic-evidence=v1; definition-sha256=0b59f83ad91d0b76d523b123fb737341010f6335eafc0b168d36c05273e5bd5a; exit=0; EXPECT=matched; output-sha256=f8802d217aa413e0f33848ca2ad222f97f09fa703976de9518ff29520bf215fb; output-bytes=134; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: la page se rend sans erreur de script ni défilement horizontal
  CHECK: node scripts/agents/verifier-page.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-g/passe2/g1/etat.html --min-images 0
  EXPECT: PAGE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=e87c8afd5ee96eb1ee93a3b25f6234d727b2d7bed7e92386d78e489e041cf25a; exit=0; EXPECT=matched; output-sha256=8b41bf6d50130554819585d7bc2314ffb9174f5a88af247a6bd7ca1b8522fa10; output-bytes=50; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: page, note et captures existent
  CHECK: node scripts/agents/systeme.mjs existent work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-g/passe2/g1/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-g/passe2/NOTE.md work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-g/passe2/captures/g1-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-g/passe2/captures/g1-premier-ecran.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-g/passe2/captures/g1-toucher-390.png
  EXPECT: EXISTENT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=49aea2e26dac305d10c1f6a3556de38c468766e8d931efc10b315fc0728f8da7; exit=0; EXPECT=matched; output-sha256=6135d4eaaef809fdb6913125e25ddab705378564706aac0a57963d6ff2a4e803; output-bytes=14; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: la NOTE dit la passe 2, les greffes et la baseline
  CHECK: node scripts/agents/systeme.mjs note work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-g/passe2/NOTE.md --contient "## Passe 2,## Baseline,greffe"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=fe0d06ceddb9d5b1be9e45e6fc2444576cf275aa313df58f76d3f5d041eaf7f6; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G8: le rapport cite les captures ouvertes
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r7g2-passe2/RESULTAT.md --contient "g1-premier-ecran.png,g1-toucher-390.png,LEÇON PROPOSÉE"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=e294add02df3ba75635023ddc3506573abfc409f23bf73a82d0c6efc5c8d38d6; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
