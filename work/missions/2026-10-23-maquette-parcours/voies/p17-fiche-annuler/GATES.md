# Gates: voie p17-fiche-annuler — la fiche (D115) et Annuler (D120)

OWNS: prototypes/houblons-v4/parcours/src/ecrans/fiche/**, prototypes/houblons-v4/parcours/src/ecrans/substituer/**, prototypes/houblons-v4/parcours/src/ecrans/levure/**, prototypes/houblons-v4/parcours/src/ecrans/dryhopper/**, prototypes/houblons-v4/maquettes/parcours-p17/**, work/missions/2026-10-23-maquette-parcours/voies/p17-fiche-annuler/RESULTAT.md, prototypes/houblons-v4/parcours/src/commun/Cadres.tsx

Scope: le radar avant la liste dans la fiche g1, et « Annuler » sans effet à côté de l'action sur Substituer, Levure et Dryhopper ; rien d'autre ne change à l'écran.

- [x] G1: la maquette se construit dans la sortie de la voie
  CHECK: node prototypes/houblons-v4/parcours/outils/construire.mjs --sortie=prototypes/houblons-v4/maquettes/parcours-p17
  EXPECT: CONSTRUIT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=7b602c2dba95470d2266e8c238a721f770573aca59914d1c26755bdc039dfce8; exit=0; EXPECT=matched; output-sha256=c32984842dd40a8f12bd7733f217a3df0c73b7d47a13a6bd68b4bdfe50c66e81; output-bytes=74; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: le dossier est typé sans erreur
  CHECK: node prototypes/houblons-v4/parcours/outils/verifier-types.mjs
  EXPECT: TYPES OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=04b8f7f64868614636c57492d1eed9c8a1a1faefce1f18fda5816ed951a12860; exit=0; EXPECT=matched; output-sha256=5015cfef1a82e20e9a8cf800854297f68212ed6cc721038a989cde20903a582b; output-bytes=9; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: le radar passe avant la liste, dans le premier écran (D115)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-fiche-radar.mjs prototypes/houblons-v4/maquettes/parcours-p17
  EXPECT: FICHE-RADAR OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=ff4fde5983bf531919b4e3405c04d533cb5b895266446743cff143ec6cd23b4e; exit=0; EXPECT=matched; output-sha256=7d5160e551713fb22d52d1206837359a6dd9936957523d1b126e75f1fccde014; output-bytes=107; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: Annuler à côté de l'action, sans effet sur la recette, sur les trois outils (D120)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-annuler.mjs prototypes/houblons-v4/maquettes/parcours-p17
  EXPECT: ANNULER OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=413b79290ec2c73ebcfca8ea19c5589ea05bd53fbbeeea54759e74db49430e0d; exit=0; EXPECT=matched; output-sha256=4b8e704756f0549600fa7dcb1c67cdbecd123829b386d942181fdbf9bdf1b607; output-bytes=1168; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: la fiche reste g1 (règle n° 1)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-choix.mjs prototypes/houblons-v4/maquettes/parcours-p17 --ecran=fiche
  EXPECT: CHOIX OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=a815e062af8b6020b01c5223e1f3ee831dc436bc9a7fb4822338fbbdfce105b2; exit=0; EXPECT=matched; output-sha256=faa65b63173f33986f1ad3af01b780870adfd9ee989c03f90f26ec4a2865d201; output-bytes=62; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: le parcours entier joue encore
  CHECK: node prototypes/houblons-v4/parcours/outils/parcours-complet.mjs --sans-construire --dossier=prototypes/houblons-v4/maquettes/parcours-p17
  EXPECT: PARCOURS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=06572d9139df2e78721a9d94a72993be19e9b79814cdd76ba3a65771feb045b3; exit=0; EXPECT=matched; output-sha256=a5826c3d03dac74442dfb280be63a75c7fd507c515164f669dd795fffb1c199a; output-bytes=1015; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: aucun fichier de l'app n'a changé
  CHECK: node prototypes/houblons-v4/parcours/outils/app-intacte.mjs
  EXPECT: APP INTACTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=a484ab77428d30fac0f9bbc722273a31c02eebb57bfa60b02569cbdaaa8a26e1; exit=0; EXPECT=matched; output-sha256=6dfcce3af6b507ef0fdf0bf4c49ae611c8747cca25559473ac691036968837b2; output-bytes=15; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G8: le rapport nomme ses captures, côte à côte avec la fiche g1, et la forme d'Annuler
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/p17-fiche-annuler/RESULTAT.md --contient "D115,D120,consolide-fiche-390,Annuler,390,1280"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=dc4a388e774499abf9d4f07abb5f5d14070f481eb146d861f8340436ea939116; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G9: le geste de Dryhopper tient son rail avec le nouveau pied (D35, D27, D46, D47, D55, D69)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-rail.mjs prototypes/houblons-v4/maquettes/parcours-p17 dryhopper --page=etat.html --parcours
  EXPECT: RAIL OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=b9f008a128c87dbb1df2ae028138b1c64918167ba5cebf2365f332c035674d41; exit=0; EXPECT=matched; output-sha256=9778954c20f537fb582502493530041965cefd12276c72cefc6c296b1356c41e; output-bytes=307; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G10: la fiche n'a qu'une croix ronde de 44 px à l'encre, sans « ‹ » (D109, critique p6)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-retour.mjs prototypes/houblons-v4/maquettes/parcours-p17 --fiche
  EXPECT: RETOUR OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=4b9db0c8d30cfb40f0cc2158ed698c8bbd6767ed82c10aa4b142dab9163e9a8a; exit=0; EXPECT=matched; output-sha256=f591ad88a4187fdd5467b9e60de0e7cf10537df2d9f0fe3316b466c18a8fd036; output-bytes=357; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
