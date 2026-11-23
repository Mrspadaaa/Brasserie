# Gates: voie r4-picto-epice — planche de pictos « épicé »

OWNS: work/refonte-frontend/v4/ecran-1/fils22-picto-epice/**, work/missions/2026-10-22-reprise-lot21/voies/r4-picto-epice/RESULTAT.md

Scope: 6 à 8 pictos « épicé » au trait, sans poivre, à 390 px, en contexte, capturés et regardés.

- [x] G1: le témoin négatif du contrôle de la planche échoue toujours (grains de poivre)
  CHECK: node scripts/agents/systeme.mjs echoue "PLANCHE ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-planche-picto.mjs work/refonte-frontend/v4/tournoi/outils/temoins/planche-poivre.html
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=8d58bdf0decbac139de2f43fef5647af751304119730bfd8762666f61b6ef4d9; exit=0; EXPECT=matched; output-sha256=cf62c07fa70dd0c05de0082955e865f17933def754e4b08104b6faa08ce617d2; output-bytes=34; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: la planche tient : 6 à 8 variantes sans poivre, deux tailles dont 16 px, en contexte, au ton Épicé
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-planche-picto.mjs work/refonte-frontend/v4/ecran-1/fils22-picto-epice/planche/etat.html
  EXPECT: /PLANCHE OK \([678] variantes\)/
  EVIDENCE: automatic-evidence=v1; definition-sha256=2d4d81cbc696ea7a1ef74b962ec012d11c3155dffbb074f2e73fb1da7895cd84; exit=0; EXPECT=matched; output-sha256=e3e99cb86e7c7dc1cc4f8dd1079db0428a8ea3ef95f7c562c5606913814437b0; output-bytes=536; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: les pictos sont au trait, sans halo (D88)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-pictos-trait.mjs work/refonte-frontend/v4/ecran-1/fils22-picto-epice planche --page=etat.html
  EXPECT: TRAIT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=6e4d30a396f9f72e999e34d6789bb0271c0a17fc6af29826a04ac27e036bf07d; exit=0; EXPECT=matched; output-sha256=99207da80907a99b83944acf0e56d846c7e8699367fb6e586ac2f28c6c881fd8; output-bytes=55; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: générateur, note et captures existent
  CHECK: node scripts/agents/systeme.mjs existent work/refonte-frontend/v4/ecran-1/fils22-picto-epice/generer-planche.mjs work/refonte-frontend/v4/ecran-1/fils22-picto-epice/NOTE.md work/refonte-frontend/v4/ecran-1/fils22-picto-epice/captures/planche-390.png work/refonte-frontend/v4/ecran-1/fils22-picto-epice/captures/contexte-390.png
  EXPECT: EXISTENT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=2ac9472899ba111da7464d9ce349ab16f78e5581b6a2e75b14a92f8cc96e08fe; exit=0; EXPECT=matched; output-sha256=7788ed647b1edcf759c31994b845c556419af95132ca73a9354fc74025ab615c; output-bytes=14; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: le rapport cite les captures ouvertes et la question au brasseur
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r4-picto-epice/RESULTAT.md --contient "planche-390.png,contexte-390.png,DÉCISION À PRENDRE"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=81e93892ae732357a96fe403d4206d9516cfb812d4c49a9f38f3f58fb950dffa; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
