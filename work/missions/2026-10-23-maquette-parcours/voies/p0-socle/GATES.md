# Gates: voie p0-socle — le socle de la maquette jouable

OWNS: prototypes/houblons-v4/parcours/**, prototypes/houblons-v4/package.json, work/missions/2026-10-23-maquette-parcours/voies/p0-socle/RESULTAT.md

Scope: une app React/TS jouable qui importe composants, jetons et moteur de l'app, sept routes sur un seul état de recette, moteur en direct, construite en pages par route, avec un script qui joue le parcours de la carte.

- [x] G1: le dossier est typé sans erreur
  CHECK: node prototypes/houblons-v4/parcours/outils/verifier-types.mjs
  EXPECT: TYPES OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=04b8f7f64868614636c57492d1eed9c8a1a1faefce1f18fda5816ed951a12860; exit=0; EXPECT=matched; output-sha256=5015cfef1a82e20e9a8cf800854297f68212ed6cc721038a989cde20903a582b; output-bytes=9; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: la construction sort les neuf pages (route biere, D105)
  CHECK: node prototypes/houblons-v4/parcours/outils/construire.mjs
  EXPECT: CONSTRUIT OK (9 pages)
  EVIDENCE: automatic-evidence=v1; definition-sha256=3a0a247af1f40c13dfddd6552e89d938ad25a8894ddae47c04c6432b691197d4; exit=0; EXPECT=matched; output-sha256=20797ceedf6c156ae449fcc11e150df8d1324dbbecd5de315c8ead122886c00c; output-bytes=70; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: chaque route s'ouvre sans erreur ni défilement horizontal
  CHECK: node prototypes/houblons-v4/parcours/outils/jouer-parcours.mjs --routes
  EXPECT: ROUTES OK (8/8)
  EVIDENCE: automatic-evidence=v1; definition-sha256=fbe485dbb108e8706c337d1c6f7370f4d6bfef83f406bb26d341a7a462a1fbf8; exit=0; EXPECT=matched; output-sha256=6c09cb6a805bb81e55f434417b0dddf3bdd74346dd988c7741772279840c92a4; output-bytes=16; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: le parcours de la carte se joue de bout en bout, état vérifié après chaque geste
  CHECK: node prototypes/houblons-v4/parcours/outils/jouer-parcours.mjs --ponts
  EXPECT: PONTS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=24c7d735263f2dde02a464fd259d21ead0a36f558e142824751cd275ed338d8b; exit=0; EXPECT=matched; output-sha256=0f5fd1b597cbf67a39870f040a4b67153abf383194995fb1b5a5c727cb8f09ac; output-bytes=130; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: aucun fichier de l'app n'a changé
  CHECK: node prototypes/houblons-v4/parcours/outils/app-intacte.mjs
  EXPECT: APP INTACTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=a484ab77428d30fac0f9bbc722273a31c02eebb57bfa60b02569cbdaaa8a26e1; exit=0; EXPECT=matched; output-sha256=6dfcce3af6b507ef0fdf0bf4c49ae611c8747cca25559473ac691036968837b2; output-bytes=15; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: ARCHITECTURE.md prépare la vraie implémentation
  CHECK: node scripts/agents/systeme.mjs note prototypes/houblons-v4/parcours/ARCHITECTURE.md --contient "## Fichiers et leur place dans l'app,## Types,## Navigation,## Moteur en direct,## Ce qui manque,## Contrat d'un écran,useFullScreenRoute"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=ca068344e0157931d910939e4595cb90d30f9c19f993b28a8cc83d75cd412f81; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: le rapport nomme les captures ouvertes et le temps de recalcul
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/p0-socle/RESULTAT.md --contient "ponts,recalcul,ms"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=131f5fadcae18cf3581c5b1c91524df754348da827b22c41171cc5503c347e72; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
