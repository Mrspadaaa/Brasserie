# Gates: voie r4c-picto-epice-2 — « épicé », changer de genre de solution

OWNS: work/refonte-frontend/v4/ecran-1/fils22-picto-epice-2/**, work/missions/2026-10-22-reprise-lot21/voies/r4c-picto-epice-2/RESULTAT.md

Scope: 6 à 8 propositions « épicé » de cinq genres au moins, sans idée ni dessin déjà refusés, à 390 px, en contexte, capturées et regardées.

- [x] G1: le critère échoue toujours sur la planche refusée le 22.10
  CHECK: node scripts/agents/systeme.mjs echoue "PLANCHE ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-planche-picto.mjs work/refonte-frontend/v4/tournoi/outils/temoins/planche-r4-refusee.html --refuses
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=40e6fddb3306097984bad92d51161253cada58530a7275f199a7495b7f64700b; exit=0; EXPECT=matched; output-sha256=cf62c07fa70dd0c05de0082955e865f17933def754e4b08104b6faa08ce617d2; output-bytes=34; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: la planche resserrée tient (contrat réécrit par le pilote après le rejet du critique, 22.10) : 3 à 5 propositions, deux genres au moins, rien de déjà refusé, chacune à côté d'Herbacé et de Végétal, rien sous 12 px, au ton Épicé
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-planche-picto.mjs work/refonte-frontend/v4/ecran-1/fils22-picto-epice-2/planche/etat.html --refuses --genres=2 --nombre=3-5 --voisins=herbal,green
  EXPECT: /PLANCHE OK \([345] variantes\)/
  EVIDENCE: automatic-evidence=v1; definition-sha256=fb7edbc35daaf336efab9d55281d9770f2b288d31f5eeb994a975c82de1f470f; exit=0; EXPECT=matched; output-sha256=c5b06771587d3c0a2ceea7fda644bb865ba7e43b02f4e64dc40839aeb95d55ed; output-bytes=283; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: les pictos sont au trait, sans halo (D88)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-pictos-trait.mjs work/refonte-frontend/v4/ecran-1/fils22-picto-epice-2 planche --page=etat.html
  EXPECT: TRAIT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=0c21fc766d8fd45bf6dd44f251b38ebaae0fccda030931ddcd8cb943ed1710b7; exit=0; EXPECT=matched; output-sha256=1c98c21c2f729be1a3ccae85f6d299110ecc8493854a0063331c07a8077ea049; output-bytes=56; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: générateur, note et captures existent
  CHECK: node scripts/agents/systeme.mjs existent work/refonte-frontend/v4/ecran-1/fils22-picto-epice-2/generer-planche.mjs work/refonte-frontend/v4/ecran-1/fils22-picto-epice-2/NOTE.md work/refonte-frontend/v4/ecran-1/fils22-picto-epice-2/captures/planche-390.png work/refonte-frontend/v4/ecran-1/fils22-picto-epice-2/captures/contexte-390.png
  EXPECT: EXISTENT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=2594650171065356e927250d2123298fffc25df04d3b12be4aff7545b1aed371; exit=0; EXPECT=matched; output-sha256=7788ed647b1edcf759c31994b845c556419af95132ca73a9354fc74025ab615c; output-bytes=14; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: le rapport cite les captures ouvertes et la question au brasseur
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r4c-picto-epice-2/RESULTAT.md --contient "planche-390.png,contexte-390.png,DÉCISION À PRENDRE"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=45e4145750bbc3e83dbc3478821f5163358a4e711cb9158e296f15b9d34ec65e; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
