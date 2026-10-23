# Gates: voie p4-dryhopper — Dryhopper (a1) et l'étape Levure, jouables

OWNS: prototypes/houblons-v4/parcours/src/ecrans/dryhopper/**, prototypes/houblons-v4/parcours/src/ecrans/levure/**, prototypes/houblons-v4/maquettes/parcours-p4/**, work/missions/2026-10-23-maquette-parcours/voies/p4-dryhopper/RESULTAT.md

Scope: a1 portée en React dans le socle, le moment calculé en direct à chaque geste, D95 corrigé, puis l'étape Levure qui inscrit l'ajout dans la recette.

- [x] G1: la maquette se construit dans la sortie de la voie
  CHECK: node prototypes/houblons-v4/parcours/outils/construire.mjs --sortie=prototypes/houblons-v4/maquettes/parcours-p4
  EXPECT: CONSTRUIT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=afd753595b523273ee1a1b4b34ee398ec2e4afeb6f2afa71c80f9ef4cbd2dacc; exit=0; EXPECT=matched; output-sha256=8e6216fb90b54a658602f73d978cf0fa5f5586c1f3b009858a353c4987f68900; output-bytes=73; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: le dossier est typé sans erreur
  CHECK: node prototypes/houblons-v4/parcours/outils/verifier-types.mjs
  EXPECT: TYPES OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=04b8f7f64868614636c57492d1eed9c8a1a1faefce1f18fda5816ed951a12860; exit=0; EXPECT=matched; output-sha256=5015cfef1a82e20e9a8cf800854297f68212ed6cc721038a989cde20903a582b; output-bytes=9; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: les exigences de toute l'app tiennent (MOTS joué à part, à 80)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs prototypes/houblons-v4/maquettes/parcours-p4 dryhopper --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=d47485aafa10d19b2d79f0385df898cb37f1d294efd5b68298dafe89ef4b1156; exit=0; EXPECT=matched; output-sha256=17c208fcc8bcaece23f4c60d9cb18741b72129c670bc157e4fe6eff6b3b9ac33; output-bytes=191; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: 80 mots au plus au premier écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs prototypes/houblons-v4/maquettes/parcours-p4 dryhopper --max=80 --page=etat.html
  EXPECT: MOTS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=4e6f76187edbe38ed9b3068628bb263cd726861b0403375b15e02b644c4d6c4d; exit=0; EXPECT=matched; output-sha256=6ab13fa4dc6b393cafe39c067358d5edf6eafce49da383decd25316481d29488; output-bytes=26; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: un seul facteur libre, le moment (D98)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs prototypes/houblons-v4/maquettes/parcours-p4 dryhopper --page=etat.html
  EXPECT: /UNE-QUESTION OK \(1 groupe libre : moment\)/
  EVIDENCE: automatic-evidence=v1; definition-sha256=c6657934e4aacb2a7b10f2b1ce303034de0e55542d0a73f7da03780f1ec58b84; exit=0; EXPECT=matched; output-sha256=3a45dc6c6e915f308e4f5e5415b076cc4ab1205c710b57dfa32e469e95779062; output-bytes=170; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: les acquis de Dryhopper sont là : geste, frise, valeurs, levure (D99)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-acquis.mjs prototypes/houblons-v4/maquettes/parcours-p4 dryhopper --page=etat.html --outil=dryhopper
  EXPECT: ACQUIS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=28dd20cba3b345b9faeeed34230bc8c9781c7fdb7719d1d745ffd9165dae9af3; exit=0; EXPECT=matched; output-sha256=7aac78a5ac5ccbcaaa38bd8ba86f5ce316f1ec8c345a0f10076850dd1c2ca068; output-bytes=141; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: l'α du houblon, sourcé (D87)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-alpha.mjs prototypes/houblons-v4/maquettes/parcours-p4 dryhopper --page=etat.html
  EXPECT: ALPHA OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=96d6f901b432ff1378681111a79c8e2274caa853dae7da81edd464e8a2b6ced6; exit=0; EXPECT=matched; output-sha256=e4cfcd7c4b62cc9516112d00c102a611dac6172a5a2ee3efae1d62df4ea2f31a; output-bytes=48; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G8: tout simulé est marqué (D94)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-lisible.mjs prototypes/houblons-v4/maquettes/parcours-p4 dryhopper --page=etat.html
  EXPECT: LISIBLE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=a513d73833673d91ba6a9c4d9eb1dc92ac3cd2fb7e064f607138e347cc3e0d59; exit=0; EXPECT=matched; output-sha256=30caf005cad2399703b20f25a8aa4c552439add02e3d228c7dd24e518536acdd; output-bytes=79; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G9: le rail fait bouger le simulé, une vraie valeur à côté (D95, rouge sur a1)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-simulation.mjs prototypes/houblons-v4/maquettes/parcours-p4 dryhopper --page=etat.html
  EXPECT: SIMULATION OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=780bf23e15b77f8c6650aeae63e2152d26590ce2d8dff4135ac2b5207a5ed629; exit=0; EXPECT=matched; output-sha256=a8726fc6e2621e47689c465922cfa2a25894a16eec215b14100bfe1c592f63f2; output-bytes=97; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G10: l'étape Levure : un seul facteur libre, la levure (D98)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs prototypes/houblons-v4/maquettes/parcours-p4 levure --page=etat.html
  EXPECT: /UNE-QUESTION OK \(1 groupe libre : levure\)/
  EVIDENCE: automatic-evidence=v1; definition-sha256=22762f1a533d09175fdf627f6c29c189bd897673970f7a3145860ff1376f9959; exit=0; EXPECT=matched; output-sha256=0ea91e14fffeae1f2144c2e27ed0093d7c30ddd5b21fc9bd4fc6dd7304036b01; output-bytes=167; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G11: l'étape Levure : la levure fait bouger le simulé, la biotransformation se voit (D96)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-cumul-levure.mjs prototypes/houblons-v4/maquettes/parcours-p4 levure --page=etat.html
  EXPECT: CUMUL OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=bdf4cf8e0f13fdc966cfc41a37c8445548c3a4dd8cf8113f78bcb771b5f563db; exit=0; EXPECT=matched; output-sha256=f788a4510dcc3c5322b77fa3eb1f4e9ef0f48a5536f789d8f62dee5ee0f8f773; output-bytes=127; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G12: l'étape Levure : tout simulé est marqué, et elle garde les exigences de toute l'app
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs prototypes/houblons-v4/maquettes/parcours-p4 levure --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=9cb3d79faf68f921b4c0f80940578bf051ed6bf8363ce1071751082e60e0a4a2; exit=0; EXPECT=matched; output-sha256=17c208fcc8bcaece23f4c60d9cb18741b72129c670bc157e4fe6eff6b3b9ac33; output-bytes=191; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G13: les gestes de Dryhopper et de Levure jouent, l'ajout est inscrit dans la recette
  CHECK: node prototypes/houblons-v4/parcours/outils/jouer-parcours.mjs --dossier=prototypes/houblons-v4/maquettes/parcours-p4 --etape=dryhopper --etape=levure
  EXPECT: ETAPE OK (levure)
  EVIDENCE: automatic-evidence=v1; definition-sha256=6ec76b32e80a9d1b991ae451abc81e067194d54d0da77e9204516e8067367562; exit=0; EXPECT=matched; output-sha256=42737d851747fa8487325c525e651b63503e2fa3ea037a1e7eee1ed7b76b7851; output-bytes=18; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G14: le parcours entier joue encore
  CHECK: node prototypes/houblons-v4/parcours/outils/jouer-parcours.mjs --dossier=prototypes/houblons-v4/maquettes/parcours-p4 --ponts
  EXPECT: PONTS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=ab272d0337a845774e4deb40f24b1a8f138be8aea33476f697be38e8066ade1a; exit=0; EXPECT=matched; output-sha256=0f5fd1b597cbf67a39870f040a4b67153abf383194995fb1b5a5c727cb8f09ac; output-bytes=130; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G15: le pouvoir des composés tient (D85)
  CHECK: cd prototypes/houblons-v4 && npx vitest run tests/pouvoir.test.ts && echo POUVOIR OK
  EXPECT: POUVOIR OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=5d255539635fa4c0f40ef9338994498e2d207e625ffff92f227e100e960ef610; exit=0; EXPECT=matched; output-sha256=c9b5ac1ea0b7f88616d6433a7f63a15495b8a310e7e799d2144d12ccb119818d; output-bytes=800; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G16: aucun fichier de l'app n'a changé
  CHECK: node prototypes/houblons-v4/parcours/outils/app-intacte.mjs
  EXPECT: APP INTACTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=a484ab77428d30fac0f9bbc722273a31c02eebb57bfa60b02569cbdaaa8a26e1; exit=0; EXPECT=matched; output-sha256=6dfcce3af6b507ef0fdf0bf4c49ae611c8747cca25559473ac691036968837b2; output-bytes=15; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G17: les NOTE disent la base, les écarts, les contrôles écartés et ce qu'il faudra brancher
  CHECK: node scripts/agents/systeme.mjs note prototypes/houblons-v4/parcours/src/ecrans/dryhopper/NOTE.md --contient "## Base,## Idées reprises,## Écarts,## Pour l'app,controle-moments,D96"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=094319fea9d950ddaa184f4a8fb30323c1dfc8d7505ff64c1199cb0bbfc2fa9f; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G18: le rapport nomme les captures ouvertes, à côté de a1, à 390 et à 1280 px, et le temps d'un recalcul
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/p4-dryhopper/RESULTAT.md --contient "390,1280,a1,levure,ms"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=56fa1f060ebc67e60eecd0af3359dd692c3906b334aaec3d8513c617246e4a57; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G19: le rail de Dryhopper tient ses plaintes (D35 loupe sans chevauchement, D46 pouce continu, D47 seuls les crans du segment sous le doigt), y compris à 45′ et 120′
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-rail.mjs prototypes/houblons-v4/maquettes/parcours-p4 dryhopper --page=etat.html --parcours
  EXPECT: RAIL OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=a53915ff6a14e9839947ae4f886e9308b9a6bbbfa1648a7a1fe21e271b72bb69; exit=0; EXPECT=matched; output-sha256=9778954c20f537fb582502493530041965cefd12276c72cefc6c296b1356c41e; output-bytes=307; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
