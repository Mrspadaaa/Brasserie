# Gates: voie p0-socle — le socle de la maquette jouable

OWNS: prototypes/houblons-v4/parcours/**, prototypes/houblons-v4/package.json, work/missions/2026-10-23-maquette-parcours/voies/p0-socle/RESULTAT.md

Scope: une app React/TS jouable qui importe composants, jetons et moteur de l'app, sept routes sur un seul état de recette, moteur en direct, construite en pages par route, avec un script qui joue le parcours de la carte.

- [x] G1: le dossier est typé sans erreur
  CHECK: node prototypes/houblons-v4/parcours/outils/verifier-types.mjs
  EXPECT: TYPES OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=04b8f7f64868614636c57492d1eed9c8a1a1faefce1f18fda5816ed951a12860; exit=0; EXPECT=matched; output-sha256=5015cfef1a82e20e9a8cf800854297f68212ed6cc721038a989cde20903a582b; output-bytes=9; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: la construction sort les huit pages
  CHECK: node prototypes/houblons-v4/parcours/outils/construire.mjs
  EXPECT: CONSTRUIT OK (8 pages)
  EVIDENCE: automatic-evidence=v1; definition-sha256=c4357bf38d89226a2b5161dbfe95757c18c7172ecc05b61bee1648b3dbdb687a; exit=0; EXPECT=matched; output-sha256=78203c3b4c3320c8c61508216bf691178b4c4ce680e7b78601b59f48f0778921; output-bytes=70; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: chaque route s'ouvre sans erreur ni défilement horizontal
  CHECK: node prototypes/houblons-v4/parcours/outils/jouer-parcours.mjs --routes
  EXPECT: ROUTES OK (7/7)
  EVIDENCE: automatic-evidence=v1; definition-sha256=c11d5e342cb37fa7ef3446bff9592941006db5d778cdcaf9b54a8873fcc53533; exit=0; EXPECT=matched; output-sha256=4c99fc812d8a7ff96ce2e15dd1224328ce2b2709c9f32f6b00414cb9adc3f85c; output-bytes=16; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: le parcours de la carte se joue de bout en bout, état vérifié après chaque geste
  CHECK: node prototypes/houblons-v4/parcours/outils/jouer-parcours.mjs --ponts
  EXPECT: PONTS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=24c7d735263f2dde02a464fd259d21ead0a36f558e142824751cd275ed338d8b; exit=0; EXPECT=matched; output-sha256=4ca3af8ec378e3f63d4c0f0b314db8382ce8c0fe1f162d5b36406199246d4bef; output-bytes=131; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: aucun fichier de l'app n'a changé
  CHECK: node prototypes/houblons-v4/parcours/outils/app-intacte.mjs
  EXPECT: APP INTACTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=a484ab77428d30fac0f9bbc722273a31c02eebb57bfa60b02569cbdaaa8a26e1; exit=0; EXPECT=matched; output-sha256=6dfcce3af6b507ef0fdf0bf4c49ae611c8747cca25559473ac691036968837b2; output-bytes=15; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: ARCHITECTURE.md prépare la vraie implémentation
  CHECK: node scripts/agents/systeme.mjs note prototypes/houblons-v4/parcours/ARCHITECTURE.md --contient "## Fichiers et leur place dans l'app,## Types,## Routes,## Moteur en direct,## Ce qui manque,## Contrat d'un écran,useFullScreenRoute"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=9d5e9dfc8707a2f5d9c8cb8d93c6283ade46eebe6c95b56bbf837c39e92da292; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: le rapport nomme les captures ouvertes et le temps de recalcul
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/p0-socle/RESULTAT.md --contient "ponts,recalcul,ms"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=131f5fadcae18cf3581c5b1c91524df754348da827b22c41171cc5503c347e72; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
