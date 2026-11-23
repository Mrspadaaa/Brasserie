# Gates: voie r13-dryhopper — Dryhopper devient p4b2f (D43)

OWNS: prototypes/houblons-v4/parcours/src/ecrans/dryhopper/**, prototypes/houblons-v4/maquettes/parcours-dryhopper/**, work/refonte-frontend/v4/choix/etats/dryhopper.json, work/refonte-frontend/v4/choix/etats/captures/etat-dryh-*, work/refonte-frontend/v4/choix/etats/acquis.json, work/missions/2026-10-23-maquette-parcours/voies/r13-dryhopper/RESULTAT.md

Scope: Dryhopper rendu en p4b2f, ses états relevés puis rendus, la continuité tenue.

- [x] G1: la maquette se construit
  CHECK: node prototypes/houblons-v4/parcours/outils/construire.mjs --sortie=prototypes/houblons-v4/maquettes/parcours-dryhopper
  EXPECT: CONSTRUIT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=fb832efe9b602158a5b9fd3ca39b3da8c865352ef431cc9c03a8f32f86f19d0f; exit=0; EXPECT=matched; output-sha256=bccedd80b9144f6ebbbae9f34215f2c221dfaa61c6ae83c95f7805501448c9c8; output-bytes=80; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: ses états relevés sur p4b2f tiennent sur sa page (témoin)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-etats.mjs --choisie --ecran=dryhopper
  EXPECT: ETATS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=58c27a2bfe3667e7f37c5ef583cdf5f35807d3c5b53dc7091faba55fd2463550; exit=0; EXPECT=matched; output-sha256=7e64c8458dd0934ff486f0058b4af95e250ec358bfe2e8d6500d15b7e53579ee; output-bytes=546; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: ses états tiennent sur la maquette, et l'acquis y1b
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-etats.mjs prototypes/houblons-v4/maquettes/parcours-dryhopper --ecran=dryhopper && node work/refonte-frontend/v4/tournoi/outils/controle-etats.mjs prototypes/houblons-v4/maquettes/parcours-dryhopper --ecran=acquis --id=etat-acquis-y1b-brassin-au-doigt
  EXPECT: ETATS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=9834bb4f558a20e31c153ebf822768aa58e1008022af4fc2b235585adc5816b4; exit=0; EXPECT=matched; output-sha256=cfd7f0ee27986f32e8c967231679255ad98da1a5f236bebc92c25249ea5c2899; output-bytes=570; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: le rail de Dryhopper, et la continuité (en-tête, pied)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-rail.mjs prototypes/houblons-v4/maquettes/parcours-dryhopper dryhopper --page=etat.html --parcours && node work/refonte-frontend/v4/tournoi/outils/controle-continuite.mjs prototypes/houblons-v4/maquettes/parcours-dryhopper
  EXPECT: CONTINUITE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=9c17f478a3abac6894fa0d32706af6a47e29fb54819fa036fb7c3555aac5bbd1; exit=0; EXPECT=matched; output-sha256=5d07657f68fc3ddd6ef68c508aa902ec5fdaf3b9bd9a03677c2557041fd041ed; output-bytes=347; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: la baseline et Annuler
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs prototypes/houblons-v4/maquettes/parcours-dryhopper dryhopper --page=etat.html --sans=mots && node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs prototypes/houblons-v4/maquettes/parcours-dryhopper dryhopper --max=106 --page=etat.html && node work/refonte-frontend/v4/tournoi/outils/controle-annuler.mjs prototypes/houblons-v4/maquettes/parcours-dryhopper
  EXPECT: ANNULER OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=58446e3f89f40229cc4c23b7a6ebbd3ae13cc4faf3c470a833b80ecb1e499cbc; exit=0; EXPECT=matched; output-sha256=33ea749c57d478c0cc9e79c473aa2481cbd1bbf82ea41d65264e324886ac9013; output-bytes=1386; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
