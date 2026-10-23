# Gates: voie r6e-entrees — les entrées du lot 22, vérifiées avant l'éventail

OWNS: work/refonte-frontend/v4/ecran-1/fils22-comparer/donnees/extraire-comparer.mjs, work/refonte-frontend/v4/ecran-1/fils22-comparer/donnees/comparer-stout.json, work/refonte-frontend/v4/ecran-1/fils22-comparer/donnees/ENTREES.md, work/missions/2026-10-22-reprise-lot21/voies/r6e-entrees/profils-regeneres.json.tmp, work/missions/2026-10-22-reprise-lot21/voies/r6e-entrees/RESULTAT.md

Scope: moteur et profils vérifiés (L08), données du lot 22 extraites au contrat et recalculées par le contrôle D102.

- [x] G1: le moteur passe ses tests
  CHECK: npm --prefix prototypes/houblons-v4 run check:engine
  EXPECT: ENGINE-V4 OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=5118c9bec4d2119c17e042e72d8185734715b79cf97b8a96f216cf300ab36ce4; exit=0; EXPECT=matched; output-sha256=50b9553eeaec5ed7b47a7df3034033e2984578f13d6b4ee535972430f8d2b7e7; output-bytes=544; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: les données du lot 22 se recalculent à l'identique, sur des profils identiques à une régénération fraîche
  CHECK: cd prototypes\houblons-v4 && node_modules\.bin\vite-node scripts/profil-simule-cas.ts ../../work/missions/2026-10-22-reprise-lot21/voies/r6e-entrees/profils-regeneres.json.tmp > NUL && cd ..\.. && node work/refonte-frontend/v4/tournoi/outils/controle-entrees-lot22.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer/donnees/comparer-stout.json --regenere=work/missions/2026-10-22-reprise-lot21/voies/r6e-entrees/profils-regeneres.json.tmp
  EXPECT: ENTREES OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=92d2f7521448ac7da499114bd62ec945661eee098b1f61d2f3d075549f387f71; exit=0; EXPECT=matched; output-sha256=83ae4437bef0dbf7f145132dac389421e05d03c1355bcd08eb913d9740a9a67b; output-bytes=11; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: le contrôle D102 échoue sur son témoin (une dose d'effet égal faussée)
  CHECK: node scripts/agents/systeme.mjs echoue "ENTREES ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-entrees-lot22.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer/donnees/comparer-stout.json --regenere=work/missions/2026-10-22-reprise-lot21/voies/r6e-entrees/profils-regeneres.json.tmp --temoin
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=f5b2911f2f5e5324f9e2a8a7fc8ca9550e5210eae670c6ba92e72072fb00d6cc; exit=0; EXPECT=matched; output-sha256=afcd90d02763c40d6600ba9361beb435f48da3665bdad4a02f7455c7fc6282d3; output-bytes=34; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: le rapport pour les auteurs nomme ce qui a été vérifié et ce qu'il contient
  CHECK: node scripts/agents/systeme.mjs note work/refonte-frontend/v4/ecran-1/fils22-comparer/donnees/ENTREES.md --contient "4,75,Cascade,Idaho 7,Galaxy,Nelson Sauvin,effet égal,IBU égal,panel,inconnu"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=02a523b1267ee1240ef40329bb54b0183a6374179b0e1c86cbad6b22f79a4573; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: rien n'a été écrit dans le prototype
  CHECK: node -e "const o=require('child_process').execSync('git status --porcelain --untracked-files=all -- prototypes/houblons-v4/src prototypes/houblons-v4/data prototypes/houblons-v4/scripts').toString().trim(); if (o) { console.log(o); process.exit(1); } console.log('MOTEUR INTACT')"
  EXPECT: MOTEUR INTACT
  EVIDENCE: automatic-evidence=v1; definition-sha256=eb3ab05ca3cec9328407922d4e98881d05ba76b163e167784506dad1bdfd3672; exit=0; EXPECT=matched; output-sha256=ed2db22972077f6ea153e25662067a28832fd63e0513fb512d6680cb81c39db3; output-bytes=14; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
