# Gates: voie p2-suggerer — Suggérer (q2b), jouable

OWNS: prototypes/houblons-v4/parcours/src/ecrans/suggerer/**, prototypes/houblons-v4/maquettes/parcours-p2/**, work/missions/2026-10-23-maquette-parcours/voies/p2-suggerer/RESULTAT.md, prototypes/houblons-v4/parcours/src/commun/Cadres.tsx, prototypes/houblons-v4/parcours/src/commun/retour.css, prototypes/houblons-v4/parcours/src/coquille/navigation.tsx, prototypes/houblons-v4/parcours/src/commun/Onglets.tsx

Scope: l'écran Suggérer de q2b (base v4.10), « Quel houblon ajouter à ma bière ? », avec D78 à D82, en React dans le socle, calculé en direct, qui ouvre Comparer avec les houblons cochés.

- [x] G1: la maquette se construit dans la sortie de la voie
  CHECK: node prototypes/houblons-v4/parcours/outils/construire.mjs --sortie=prototypes/houblons-v4/maquettes/parcours-p2
  EXPECT: CONSTRUIT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=d436e042825a53e351373d8f02d9ea26e2d8e7f914a73f3e06f77b2f68fa370f; exit=0; EXPECT=matched; output-sha256=a04a0323b4bf6615757cc2d460ca951f432a3804b7d1ae9ed211ba894961ce69; output-bytes=73; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: le dossier est typé sans erreur
  CHECK: node prototypes/houblons-v4/parcours/outils/verifier-types.mjs
  EXPECT: TYPES OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=04b8f7f64868614636c57492d1eed9c8a1a1faefce1f18fda5816ed951a12860; exit=0; EXPECT=matched; output-sha256=5015cfef1a82e20e9a8cf800854297f68212ed6cc721038a989cde20903a582b; output-bytes=9; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: les exigences de toute l'app tiennent (MOTS joué à part, à 80)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs prototypes/houblons-v4/maquettes/parcours-p2 suggerer --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=4601deacfdd54ee92314bb5a01609b2c1df855baa6c2f466394ee0f8b02d2c84; exit=0; EXPECT=matched; output-sha256=17c208fcc8bcaece23f4c60d9cb18741b72129c670bc157e4fe6eff6b3b9ac33; output-bytes=191; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: 80 mots au plus au premier écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs prototypes/houblons-v4/maquettes/parcours-p2 suggerer --max=80 --page=etat.html
  EXPECT: MOTS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=d3c5ef513a53604d86e1a74f7b930747820aa2cd5fc5d4ced8f2bdd765a6004e; exit=0; EXPECT=matched; output-sha256=b85f6b65b93e87d06818e522cec1d6108ff72df3a74deb946e21759374590788; output-bytes=25; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: un seul facteur libre, le houblon (D98) ; titre et contexte levés par la règle n° 1 (D117)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs prototypes/houblons-v4/maquettes/parcours-p2 suggerer --page=etat.html --regle-n1="D117 : sa base v4.10 et q2b n'ont ni question en titre ni ligne fixé"
  EXPECT: /UNE-QUESTION OK \(1 groupe libre : houblon\)/
  EVIDENCE: automatic-evidence=v1; definition-sha256=4e574cb2f338e5cbe1d33f8322623f3fae36480d3ea81d213307d712c0245a6f; exit=0; EXPECT=matched; output-sha256=3d23eb0514aaafb9b97514f623fe868a70c2fe97c8ce7ab4e3c67501e17f0ddf; output-bytes=169; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: les extras hors objectif se voient (D76)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-autres-ajouts.mjs prototypes/houblons-v4/maquettes/parcours-p2 suggerer --pages=etat.html
  EXPECT: AUTRES OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=bb00a1168ec7713de9b26e17fde4cdd2d26e8df2243376010ddf00c1dc094d8b; exit=0; EXPECT=matched; output-sha256=514f3c163db26c2990439a9a6283551374efca3c9c3139f3d0870d3488931588; output-bytes=147; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: la piste l5b sous chaque objectif (D92)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-piste-objectif.mjs prototypes/houblons-v4/maquettes/parcours-p2 suggerer --page=etat.html
  EXPECT: PISTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=544fea1f9931a01088c2c152ee83434dcb714b3c4942e5251deaba347ef897a2; exit=0; EXPECT=matched; output-sha256=a5951650ffe69fe25bcc165e6fab321e4ab80a26cba2587cb650fd04e5002402; output-bytes=62; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G8: cinq candidats au premier écran, sans gros blocs (D84)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-place-voies.mjs prototypes/houblons-v4/maquettes/parcours-p2 suggerer --page=etat.html
  EXPECT: PLACE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=d07577d8c926d637fc7eddc30db8783877d079a75b0c7bd6ec928f41b7f9a654; exit=0; EXPECT=matched; output-sha256=df38f777e422157ab34036b9f0bb3955e2db1db89d6e54469aff3174f1f6a47e; output-bytes=77; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G9: ce qu'il a validé de Ma bière tient sur l'écran (D79)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-ma-biere.mjs prototypes/houblons-v4/maquettes/parcours-p2 suggerer --page=etat.html
  EXPECT: MA-BIERE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=3326bad32aaa801bf02ac4e35a28219c84687d69146726f2ecf8affa23d9f26e; exit=0; EXPECT=matched; output-sha256=9e44fdfdd37deaa3b243b9f7551dddcee8bf2cd07e2f9b84f84920d769a82b43; output-bytes=40; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G10: l'α de chaque houblon, sourcé (D87)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-alpha.mjs prototypes/houblons-v4/maquettes/parcours-p2 suggerer --page=etat.html
  EXPECT: ALPHA OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=b26585eb03d870a4458c5356365f9b75cf7974d32c803b0b483914e5ff2343e4; exit=0; EXPECT=matched; output-sha256=3147b2b2436119410b7abde713d7d7646d50f72c14a9af7f9013af669ef68129; output-bytes=49; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G11: les gestes de Suggérer jouent (dont D80 en direct : intensité en crans, usage), et « Comparer les 3 » ouvre Comparer avec les choisis
  CHECK: node prototypes/houblons-v4/parcours/outils/jouer-parcours.mjs --dossier=prototypes/houblons-v4/maquettes/parcours-p2 --etape=suggerer
  EXPECT: ETAPE OK (suggerer)
  EVIDENCE: automatic-evidence=v1; definition-sha256=fd26930409c498e90e01f2dea49a867b1b1f2e419ef0e0986feddd8e0e43eac7; exit=0; EXPECT=matched; output-sha256=439449e20d05f4046f00a9c6c3f38e880182dd55651420267bbc0799abfc2e68; output-bytes=20; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G12: le parcours entier joue encore
  CHECK: node prototypes/houblons-v4/parcours/outils/jouer-parcours.mjs --dossier=prototypes/houblons-v4/maquettes/parcours-p2 --ponts
  EXPECT: PONTS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=a05f673d3fedfa58847023318d6cda48725433bc0ebc95c4d33e84b8f9741de6; exit=0; EXPECT=matched; output-sha256=b1628d60ee9d04697c5f1998e28be28b81d542e2aba2ebeef04c86ab70f34e5b; output-bytes=130; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G13: les tolérances du moteur tiennent (D54)
  CHECK: cd prototypes/houblons-v4 && npx vitest run tests/tolerance.test.ts && echo TOLERANCE OK
  EXPECT: TOLERANCE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=01bb0fa00b4b584a8e4d38492ef7d074a5bf40ff8e439186d899e81749431e45; exit=0; EXPECT=matched; output-sha256=4db0e08a6ed48a7d3b4845548f2e13893f83d7e0e2b82d82f955cbb80dd3827c; output-bytes=2577; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G14: aucun fichier de l'app n'a changé
  CHECK: node prototypes/houblons-v4/parcours/outils/app-intacte.mjs
  EXPECT: APP INTACTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=a484ab77428d30fac0f9bbc722273a31c02eebb57bfa60b02569cbdaaa8a26e1; exit=0; EXPECT=matched; output-sha256=6dfcce3af6b507ef0fdf0bf4c49ae611c8747cca25559473ac691036968837b2; output-bytes=15; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G15: la NOTE dit la base, les écarts, les contrôles écartés et ce qu'il faudra brancher
  CHECK: node scripts/agents/systeme.mjs note prototypes/houblons-v4/parcours/src/ecrans/suggerer/NOTE.md --contient "## Base,## Idées reprises,## Écarts,## Pour l'app,controle-moments,controle-cumul-levure"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=10eddf8691dd86ab8af758cb833381cfa8f8b7c90dcf1fa7b57e7ca569648c4f; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G16: le rapport nomme les captures ouvertes, à 390 et à 1280 px
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/p2-suggerer/RESULTAT.md --contient "390,1280,suggerer,q2b"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=13f9bb1a9ba9974fa19fa9f257628ff4ecef321956dd38ed41ec2a5d2d769acb; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G17: Suggérer reprend q2b, élément par élément (D105)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-reprise.mjs prototypes/houblons-v4/maquettes/parcours-p2 suggerer --page=etat.html --inventaire=work/refonte-frontend/v4/ecran-1/fils15-s5-complexe/donnees/inventaire-q2b.json
  EXPECT: REPRISE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=9a30ac4248a41159a42dba5fa36350f0566d98b4556910b109e7f29439cd86a9; exit=0; EXPECT=matched; output-sha256=c28906ab34bd8f81ead1068c728d8208a71ffbb5f365ffd56e8171d2f21c2e18; output-bytes=477; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G18: Suggérer est conforme à son choix, q2b (règle n° 1)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-choix.mjs prototypes/houblons-v4/maquettes/parcours-p2 --ecran=suggerer
  EXPECT: CHOIX OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=3c4742fbf57123e7252efe449f3e5294d4e1925d8250f755a4a370a029940c04; exit=0; EXPECT=matched; output-sha256=faa65b63173f33986f1ad3af01b780870adfd9ee989c03f90f26ec4a2865d201; output-bytes=62; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G19: Suggérer a la teinte de q2b : cartes d'objectif à sa hauteur (D106)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-teinte.mjs prototypes/houblons-v4/maquettes/parcours-p2 --ecran=suggerer
  EXPECT: TEINTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=4bd8a00746b415972b5089153a7ec48addfb4616fd8e6fb966f9aeba64f1c901; exit=0; EXPECT=matched; output-sha256=00a96512e5308df6f250d4374b7cb4fe08ad8c41a51fa54b4641fbad36369575; output-bytes=113; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [ ] G20: les traits se lisent au toucher, près du picto, et rien de plus au repos (D110)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-traits.mjs prototypes/houblons-v4/maquettes/parcours-p2
  EXPECT: TRAITS OK
  EVIDENCE: pending

- [ ] G21: le retour de chaque outil est grand, à l'encre, nommé, et quitte l'outil (D109)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-retour.mjs prototypes/houblons-v4/maquettes/parcours-p2
  EXPECT: RETOUR OK
  EVIDENCE: pending

- [ ] G22: le parcours entier joue avec le nouveau retour
  CHECK: node prototypes/houblons-v4/parcours/outils/parcours-complet.mjs --sans-construire --dossier=prototypes/houblons-v4/maquettes/parcours-p2
  EXPECT: PARCOURS OK
  EVIDENCE: pending

- [ ] G23: le rapport de la reprise nomme ses captures côte à côte avec q2b, les textes au toucher et les mesures du retour
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/p2-suggerer/RESULTAT.md --contient "## Reprise D117, D110, D109, D118, D119,consolide-b-390,q2b,cran,44,390,1280"
  EXPECT: NOTE OK
  EVIDENCE: pending

- [ ] G24: Suggérer reprend sa base v4.10 et q2b, élément par élément, inventaire complété (D117, règle n° 1)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-choix.mjs prototypes/houblons-v4/maquettes/parcours-p2 --ecran=suggerer
  EXPECT: CHOIX OK
  EVIDENCE: pending

- [ ] G25: la croix est la même sur les trois onglets et ramène à l'étape Houblons (D109, D118, D119)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-retour.mjs prototypes/houblons-v4/maquettes/parcours-p2 --routes=biere,suggerer,comparer
  EXPECT: RETOUR OK
  EVIDENCE: pending
