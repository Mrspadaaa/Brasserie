# Gates: voie p3-comparer — Comparer (r6a, avec les petites améliorations des autres), jouable

OWNS: prototypes/houblons-v4/parcours/src/ecrans/comparer/**, prototypes/houblons-v4/maquettes/parcours-p3/**, work/missions/2026-10-23-maquette-parcours/voies/p3-comparer/RESULTAT.md, prototypes/houblons-v4/parcours/outils/parcours-complet.mjs

Scope: r6a portée en React dans le socle, calculée en direct, avec les petites améliorations des autres versions, D95 corrigé, avec ses gestes joués et le pont vers Dryhopper.

- [x] G1: la maquette se construit dans la sortie de la voie
  CHECK: node prototypes/houblons-v4/parcours/outils/construire.mjs --sortie=prototypes/houblons-v4/maquettes/parcours-p3
  EXPECT: CONSTRUIT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=3c84643dafd032c4281ec1dc52facfcfabe5dd95a3f0e52294ec9f1cdb75b597; exit=0; EXPECT=matched; output-sha256=d96ab12f4644526d29614c09524b56e0fe4459d6b1b3bd922cda82b548e3e7ba; output-bytes=73; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: le dossier est typé sans erreur
  CHECK: node prototypes/houblons-v4/parcours/outils/verifier-types.mjs
  EXPECT: TYPES OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=04b8f7f64868614636c57492d1eed9c8a1a1faefce1f18fda5816ed951a12860; exit=0; EXPECT=matched; output-sha256=5015cfef1a82e20e9a8cf800854297f68212ed6cc721038a989cde20903a582b; output-bytes=9; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: les exigences de toute l'app tiennent (MOTS joué à part, à 80)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs prototypes/houblons-v4/maquettes/parcours-p3 comparer --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=0a69c788d22ee4665a7b836b92d9f583fb96d50100331a0a9b2356b41f9dd292; exit=0; EXPECT=matched; output-sha256=17c208fcc8bcaece23f4c60d9cb18741b72129c670bc157e4fe6eff6b3b9ac33; output-bytes=191; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: 80 mots au plus au premier écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs prototypes/houblons-v4/maquettes/parcours-p3 comparer --max=80 --page=etat.html
  EXPECT: MOTS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=30bef40d6277b1196e86180f2a4fe97d28334f56f5abd13e2499d7f41e486707; exit=0; EXPECT=matched; output-sha256=c7a57522ea7956c91b04c30304b05e8d096a81d171e7768cb557a1a90d918ed2; output-bytes=25; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: un seul facteur libre, le houblon (D98)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs prototypes/houblons-v4/maquettes/parcours-p3 comparer --page=etat.html
  EXPECT: /UNE-QUESTION OK \(1 groupe libre : houblon\)/
  EVIDENCE: automatic-evidence=v1; definition-sha256=b41ab1d25728a6a51cd8e26cf2e1d22fdffc9312501b5300b34dee838de656d7; exit=0; EXPECT=matched; output-sha256=ecf70c61acbce4e14f21028fbb9406a89b841adae1638a796a40964f77a0d3dd; output-bytes=175; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: les quatre acquis de Comparer sont là (D99)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-acquis.mjs prototypes/houblons-v4/maquettes/parcours-p3 comparer --page=etat.html
  EXPECT: ACQUIS OK (4/4
  EVIDENCE: automatic-evidence=v1; definition-sha256=87acba122b4783c573598c85b5799259d75b1dbb3bc956b3db3aefdef6b2509a; exit=0; EXPECT=matched; output-sha256=2f74b39633c5b93c895942ee20e58842ac01ff264cd1bfcd2b7d9516f6c237cf; output-bytes=151; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: l'α de chaque houblon, sourcé (D87)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-alpha.mjs prototypes/houblons-v4/maquettes/parcours-p3 comparer --page=etat.html
  EXPECT: ALPHA OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=d23126fc16db861ddd7b3f81032566a88c209abca28a43ba1b4575c7cf6184f8; exit=0; EXPECT=matched; output-sha256=31d31e925f96220d1f9a506b8080e7bc90ece9f33ec5ab141aae5040d747df88; output-bytes=47; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G8: chaque houblon se distingue sur le radar (D77)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-radar-series.mjs prototypes/houblons-v4/maquettes/parcours-p3/comparer/etat.html
  EXPECT: RADAR-SERIES OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=9db8543c0d0c4a36268f73632c8b516beb65b71f1ff01c84b03e109418fc75a2; exit=0; EXPECT=matched; output-sha256=ac07ec733ba9b1868cb07e37048c9df65de7f009ca32804d1a06b9bf0f3d50c2; output-bytes=164; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G9: tout simulé est marqué (D94)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-lisible.mjs prototypes/houblons-v4/maquettes/parcours-p3 comparer --page=etat.html
  EXPECT: LISIBLE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=67d6ec29b237e0d40e7a265977a7329473bdc65f7fd74b7f5b5d3b0a66f5c93a; exit=0; EXPECT=matched; output-sha256=5e1bd931c6979f0fbbb7ca699c4666445666ea91c800edc30092df8348e31dc9; output-bytes=78; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G10: un réglage fait bouger le simulé, une vraie valeur à côté (D95, rouge sur r6a)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-simulation.mjs prototypes/houblons-v4/maquettes/parcours-p3 comparer --page=etat.html
  EXPECT: SIMULATION OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=99f7b8961493813ee15fc430af7da27dbf41a2787d66cd540247fc4a25c2013d; exit=0; EXPECT=matched; output-sha256=f1a77eda0ad6fa4b486c5551c0446b7ed5e5ad228096861a970690125f7f6f85; output-bytes=96; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G11: un houblon aux mots hors familles le montre (D100)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-sans-famille.mjs prototypes/houblons-v4/maquettes/parcours-p3 comparer --page=etat.html
  EXPECT: SANS-FAMILLE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=d092c7eb7fd2b797d3185caad1075aa0580b8cfe8343ba88370dcb7570be932a; exit=0; EXPECT=matched; output-sha256=6708b0b21ce579f53840b4ca5e9d919a4e3d8f60bb94c1af3c8418a4a896152f; output-bytes=134; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G12: r6a elle-même (12 éléments) et les 37 éléments notés ailleurs sont classés et balisés (D104, D105, règle n° 1)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-reprise.mjs prototypes/houblons-v4/maquettes/parcours-p3 comparer --page=etat.html --inventaire=work/refonte-frontend/v4/ecran-1/fils22-comparer/donnees/inventaire-comparer.json
  EXPECT: REPRISE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=168c825947ac709e3e81db6425b009a90ce0ad657395ac5442278e4a34ea49c2; exit=0; EXPECT=matched; output-sha256=39acb350a90c34517057f41eeca46d7aeba1d935701b8721ff879ea3e6106dc3; output-bytes=1897; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G13: les gestes de Comparer jouent, et « Placer » ouvre Dryhopper avec le bon houblon
  CHECK: node prototypes/houblons-v4/parcours/outils/jouer-parcours.mjs --dossier=prototypes/houblons-v4/maquettes/parcours-p3 --etape=comparer
  EXPECT: ETAPE OK (comparer)
  EVIDENCE: automatic-evidence=v1; definition-sha256=95ba7f1818054d516bbc3f634f0f8f4ad53a91e23ac314bb22ced911292a8eba; exit=0; EXPECT=matched; output-sha256=690b65344c4aeb688653adc7b077529b33925e274ffad1d1489a6ee80fc5eace; output-bytes=20; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G14: le parcours entier joue encore
  CHECK: node prototypes/houblons-v4/parcours/outils/jouer-parcours.mjs --dossier=prototypes/houblons-v4/maquettes/parcours-p3 --ponts
  EXPECT: PONTS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=764472f0846dd366203a591554d6f9ccf894805bef8ddc30d01a9a52c6a9b916; exit=0; EXPECT=matched; output-sha256=3b50f857f26b21d91dccfe9cf22e59f95329b74a48527e222dea51b485db7f10; output-bytes=130; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G15: aucun fichier de l'app n'a changé
  CHECK: node prototypes/houblons-v4/parcours/outils/app-intacte.mjs
  EXPECT: APP INTACTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=a484ab77428d30fac0f9bbc722273a31c02eebb57bfa60b02569cbdaaa8a26e1; exit=0; EXPECT=matched; output-sha256=6dfcce3af6b507ef0fdf0bf4c49ae611c8747cca25559473ac691036968837b2; output-bytes=15; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G16: le rapport nomme les captures ouvertes, à côté de r6a, à 390 et à 1280 px, et les améliorations prises
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/p3-comparer/RESULTAT.md --contient "390,1280,r6a,D95,r6n2,r6p"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=864e2af7d862033d8b2c79ea6c3deed10e0a47d4750f452bc38e2d0229327268; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G17: Comparer est conforme à son choix (r6a) dans le registre de ses choix
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-choix.mjs prototypes/houblons-v4/maquettes/parcours-p3 --ecran=comparer
  EXPECT: CHOIX OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=14652e9da1f754719d83dce411af61509eaaa2be8340c9f9b8e7cbf9ab6ce406; exit=0; EXPECT=matched; output-sha256=faa65b63173f33986f1ad3af01b780870adfd9ee989c03f90f26ec4a2865d201; output-bytes=62; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G18: chaque houblon comparé à 60′, 10′ et au dry hop, visibles ensemble, avec une référence (D107)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-comparer-etapes.mjs prototypes/houblons-v4/maquettes/parcours-p3
  EXPECT: COMPARER-ETAPES OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=894e46530a9ddeaf85284552d0c0eb81410073bc6a37742eb238a495df739229; exit=0; EXPECT=matched; output-sha256=3485b3c4d8ab12ce59feb7ad894aaba5e4922b1c7c23105ea4753778e0476c93; output-bytes=499; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G19: le parcours entier joue avec le nouveau Comparer
  CHECK: node prototypes/houblons-v4/parcours/outils/parcours-complet.mjs --sans-construire --dossier=prototypes/houblons-v4/maquettes/parcours-p3
  EXPECT: PARCOURS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=82a1f180c63407e49705b6d88682fdb855eee716ee59ee19cf7cdbc682db2de6; exit=0; EXPECT=matched; output-sha256=653614977aff1473f49b81c5c84b72c8cfd713bd510d0a6bc642def9d29de74c; output-bytes=1015; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G20: le rapport de la reprise D107 nomme ses captures côte à côte avec r6a et x3b
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/p3-comparer/RESULTAT.md --contient "## Reprise D107,x3b,r6a,d107-etapes,d107-reference,390,1280"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=eb6c6ab3ea22f8981ac1e58bf225d86b12adf902e6447b5c6d9db07598ea6841; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
