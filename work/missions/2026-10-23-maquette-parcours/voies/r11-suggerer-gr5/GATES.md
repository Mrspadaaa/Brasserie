# Gates: voie r11-suggerer-gr5 — les traits de gr5 dans Suggérer

OWNS: prototypes/houblons-v4/parcours/src/ecrans/suggerer/**, prototypes/houblons-v4/maquettes/parcours-suggerer/**, work/refonte-frontend/v4/choix/etats/suggerer.json, work/missions/2026-10-23-maquette-parcours/voies/r11-suggerer-gr5/RESULTAT.md

Scope: les lectures b et c de gr5 rendues dans Suggérer, sans perdre un état de q2b.

- [x] G1: la maquette se construit
  CHECK: node prototypes/houblons-v4/parcours/outils/construire.mjs --sortie=prototypes/houblons-v4/maquettes/parcours-suggerer
  EXPECT: CONSTRUIT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=579f6eeda4528e33957b87eab3661636590915a421c2bc6ee94dbdf92850a6fb; exit=0; EXPECT=matched; output-sha256=8c3cbb0fbe9e4f09bb431ce2298aae59fe36532c4159c8ccd386f2d684cbb2da; output-bytes=79; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: les deux états de gr5 tiennent sur sa page gr5 (témoin)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-etats.mjs --choisie --ecran=suggerer
  EXPECT: ETATS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=688e13fc129eef14d6b7c5d445b6b77cacfe2a30cfb9b0014fd26832de6af951; exit=0; EXPECT=matched; output-sha256=5b595fcd4552c8681190d5b7e7a3c4d6f58dd4d4dffc8252c27bf9868f981b9d; output-bytes=481; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: tous les états de Suggérer tiennent sur la maquette, gr5 compris
  CHECK: node -e "const j=JSON.parse(require('fs').readFileSync('work/refonte-frontend/v4/choix/etats/suggerer.json','utf8'));const ids=j.etats.map(e=>e.id);const m=['etat-sugg-gr5-cran','etat-sugg-gr5-crans-comptes'].filter(i=>!ids.includes(i));if(m.length){console.log('GR5 ABSENTS '+m.join(','));process.exit(1)}" && node work/refonte-frontend/v4/tournoi/outils/controle-etats.mjs prototypes/houblons-v4/maquettes/parcours-suggerer --ecran=suggerer
  EXPECT: ETATS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=853f4d1158c4ae0af366e5262a0db5fd29a392e8a64f88de99c447aca49e8ed4; exit=0; EXPECT=matched; output-sha256=032a97b1e257082da0f3f1bd804e1d696189416d4fb909cc30ce22eefd07166f; output-bytes=454; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: son choix et la baseline
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-choix.mjs prototypes/houblons-v4/maquettes/parcours-suggerer --ecran=suggerer && node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs prototypes/houblons-v4/maquettes/parcours-suggerer suggerer --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=0ac21229a9dfe6c7a72741802d44345adce0bd46f4ff1ae42a6e1c1583c19fe4; exit=0; EXPECT=matched; output-sha256=554e388bca5e711f22e22d5292335d741d2daf293b32c94e0167725a113861bc; output-bytes=253; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
