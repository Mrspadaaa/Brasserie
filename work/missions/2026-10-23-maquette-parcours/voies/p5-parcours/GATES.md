# Gates: voie p5-parcours — le parcours entier, joué et capturé

OWNS: prototypes/houblons-v4/parcours/outils/parcours-complet.mjs, work/missions/2026-10-23-maquette-parcours/voies/p5-parcours/**

Scope: le parcours de la carte joué d'un bout à l'autre dans une seule session, état et écran vérifiés après chaque geste, au téléphone et à l'ordinateur, avec une capture par étape.

- [x] G1: le parcours entier joue, au téléphone et à l'ordinateur
  CHECK: node prototypes/houblons-v4/parcours/outils/parcours-complet.mjs --captures work/missions/2026-10-23-maquette-parcours/voies/p5-parcours/captures
  EXPECT: PARCOURS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=aca8bea10d5b5c34a47df16cf143a13ca22dde533b28d9b5563a157ff3577681; exit=0; EXPECT=matched; output-sha256=5aeb58920870d43718468d87c9dec83421f3c0a4f01916af6c958fe890d59c5d; output-bytes=1017; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: le parcours des ponts joue encore sur la maquette intégrée
  CHECK: node prototypes/houblons-v4/parcours/outils/jouer-parcours.mjs --ponts
  EXPECT: PONTS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=24c7d735263f2dde02a464fd259d21ead0a36f558e142824751cd275ed338d8b; exit=0; EXPECT=matched; output-sha256=897179f40ee6e98a750a6a6adf67a3bf6552f536ad3a38ddf036300eb22945ac; output-bytes=130; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: aucun fichier de l'app n'a changé
  CHECK: node prototypes/houblons-v4/parcours/outils/app-intacte.mjs
  EXPECT: APP INTACTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=a484ab77428d30fac0f9bbc722273a31c02eebb57bfa60b02569cbdaaa8a26e1; exit=0; EXPECT=matched; output-sha256=6dfcce3af6b507ef0fdf0bf4c49ae611c8747cca25559473ac691036968837b2; output-bytes=15; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: les captures des étapes existent, aux deux largeurs
  CHECK: node scripts/agents/systeme.mjs existent work/missions/2026-10-23-maquette-parcours/voies/p5-parcours/captures/01-ma-biere-390.png work/missions/2026-10-23-maquette-parcours/voies/p5-parcours/captures/01-ma-biere-1280.png
  EXPECT: EXISTENT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=5ab1fc979669679dbcd53143c9572dadda3bf7f9926930558efcff8873b076db; exit=0; EXPECT=matched; output-sha256=ebc53ca88d6720450456a129beb887e953149a55c96f2928e76c7393da040c6d; output-bytes=14; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: le rapport décrit chaque capture et chaque défaut
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/p5-parcours/RESULTAT.md --contient "390,1280,ma-biere,suggerer,comparer,dryhopper,levure,substituer,recalcul"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=fe534bf9017ccd25ff06e4abcab99a0c0b819601395bb13797668d3209b7a7d6; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: chaque écran de la maquette intégrée est conforme à ses choix ; les choix ouverts sont nommés (règle n° 1)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-choix.mjs prototypes/houblons-v4/maquettes/parcours
  EXPECT: CHOIX OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=1ec81ef94c962d69d2c99bffc9fa0c0ef22ed22f30898c774bfe77b4112a21c2; exit=0; EXPECT=matched; output-sha256=a8e5fd5b4d8c0cda83816f2de40d257e2dc6ac63afde5ae9000e56fc27000912; output-bytes=185; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: chaque écran choisi a la teinte de sa maquette (fond, aplats, encre ; D106)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-teinte.mjs prototypes/houblons-v4/maquettes/parcours
  EXPECT: TEINTE OK 5/5
  EVIDENCE: automatic-evidence=v1; definition-sha256=5af2c9212c090623552cf1339a7fc9857909e6d6beec3a22eb13d219ed6324a2; exit=0; EXPECT=matched; output-sha256=806adede415fb4dfd41d2006019045f16bf1f32f06bb5cd3a88c3412ce50f6d0; output-bytes=513; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
