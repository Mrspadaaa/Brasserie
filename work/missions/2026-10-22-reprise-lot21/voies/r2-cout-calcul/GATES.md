# Gates: voie r2-cout-calcul — chronométrer le moteur de simulation

OWNS: cerveau/metier/cout-calcul-moteur.md, work/missions/2026-10-22-reprise-lot21/voies/r2-cout-calcul/ANNEXE.md, work/missions/2026-10-22-reprise-lot21/voies/r2-cout-calcul/bench.ts, work/missions/2026-10-22-reprise-lot21/voies/r2-cout-calcul/RESULTAT.md

Scope: le temps de simulerCas, léger et complet, sur le cas stout et sur tout le catalogue, dans une note du cerveau, sans écrire dans le moteur.

- [x] G1: la note a ses trois parties et nomme ce qu'elle mesure
  CHECK: node scripts/agents/systeme.mjs note cerveau/metier/cout-calcul-moteur.md --exiger "Mesures,Conditions,Conclusion" --contient "simulerCas,léger,complet,stout,catalogue,ms,profils-simules.json"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=c4659246d4852a905248b9657bf57db54c1d50af92fa05e789b47195195a4121; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: la note est au format du cerveau et ses liens sont résolus
  CHECK: node scripts/agents/systeme.mjs cerveau --voie --min-notes 3 --min-lecons 12 --fichiers cerveau/metier/cout-calcul-moteur.md
  EXPECT: CERVEAU OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=ad65970f6d9af0d0cb819c66037e14798f5b82d91dd8f98cc05163ba107d4b02; exit=0; EXPECT=matched; output-sha256=f3d8b670355d5764819774f728755e860cc1293dc50df0794597c22c6743142d; output-bytes=34; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: l'annexe garde le script et les mesures brutes
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r2-cout-calcul/ANNEXE.md --contient "simulerCas,performance.now,complet: false,médiane,p95,MOMENTS_SIMULES,CATALOGUE"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=94418255a36763dea34d100b217c38486504b182b96e9a4dfb22dafd381207ea; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: rien n'a été écrit dans le prototype (moteur, données, scripts)
  CHECK: node -e "const o=require('child_process').execSync('git status --porcelain --untracked-files=all -- prototypes/houblons-v4/src prototypes/houblons-v4/data prototypes/houblons-v4/scripts').toString().trim(); if (o) { console.log(o); process.exit(1); } console.log('MOTEUR INTACT')"
  EXPECT: MOTEUR INTACT
  EVIDENCE: automatic-evidence=v1; definition-sha256=eb3ab05ca3cec9328407922d4e98881d05ba76b163e167784506dad1bdfd3672; exit=0; EXPECT=matched; output-sha256=ed2db22972077f6ea153e25662067a28832fd63e0513fb512d6680cb81c39db3; output-bytes=14; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: le moteur passe toujours ses tests
  CHECK: npm --prefix prototypes/houblons-v4 run check:engine
  EXPECT: ENGINE-V4 OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=5118c9bec4d2119c17e042e72d8185734715b79cf97b8a96f216cf300ab36ce4; exit=0; EXPECT=matched; output-sha256=366ee2d897c5cc058c7499aa5d458740261fe7963ab972efe35f56ac535d25c6; output-bytes=545; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
