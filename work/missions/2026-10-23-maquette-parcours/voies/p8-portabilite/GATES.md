# Gates: voie p8-portabilite — rendre la maquette facile à intégrer dans l'app

OWNS: prototypes/houblons-v4/src/**, prototypes/houblons-v4/data/**, prototypes/houblons-v4/tests/**, prototypes/houblons-v4/parcours/src/moteur/**, prototypes/houblons-v4/parcours/src/etat/**, prototypes/houblons-v4/parcours/src/coquille/**, prototypes/houblons-v4/parcours/src/commun/**, prototypes/houblons-v4/parcours/src/integration/**, prototypes/houblons-v4/parcours/ARCHITECTURE.md, prototypes/houblons-v4/ENGINE.md, work/missions/2026-10-23-maquette-parcours/voies/p8-portabilite/RESULTAT.md

Scope: lever dans la maquette les bloquants d'intégration prouvés par p7 (moteur portable, données injectables, conversion de recette testée, navigation en pile, données hors de work/, crochet de test), sans toucher à l'app ni à ce que le brasseur voit.

- [x] G1: le moteur ne lit plus process.env (B3)
  CHECK: node prototypes/houblons-v4/parcours/outils/portabilite.mjs --process
  EXPECT: SANS PROCESS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=f9fd9ded73729a9ec28eb350d1c6b7d66902025341fff2b6479670cb3f1cb364; exit=0; EXPECT=matched; output-sha256=4c45128e0402a72dba868fef5c747a261c7640ca906714f54ccdfd50d4d38857; output-bytes=16; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: le moteur n'importe plus par les alias @app et @functions (B4)
  CHECK: node prototypes/houblons-v4/parcours/outils/portabilite.mjs --alias
  EXPECT: IMPORTS RELATIFS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=fbffad668fd0e42366dfdc888d0e851ddcf929be2a0eba131dab74f977b59ee5; exit=0; EXPECT=matched; output-sha256=b341c6644a3c92eb26e1d3d2e025e7921b2bf272afc17391de35a9c1dd6a69be; output-bytes=20; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: la maquette n'importe plus rien de work/ (B8)
  CHECK: node prototypes/houblons-v4/parcours/outils/portabilite.mjs --work
  EXPECT: SANS WORK OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=1b538a57cd30c9f02fd5a50414b84dca5b5fa6c173f3b9cfa97730e318a45c2a; exit=0; EXPECT=matched; output-sha256=f4f1ab6cf72fbe4af96556170e3646b0d3f62c5efc0b2cd6f3992fc04af70b8c; output-bytes=13; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: le moteur garde ses tests et son témoin négatif
  CHECK: cd prototypes/houblons-v4 && npm run check:engine
  EXPECT: ENGINE-V4 OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=327f1297ec29eea4b87982695dae6b13f6360534e0660b8d384196b43c10f000; exit=0; EXPECT=matched; output-sha256=d776a52fe955c6728e176f6f31aac3ba34b616807e1bf40b81eebcd8b477d84d; output-bytes=545; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: la conversion de recette de l'app est testée sur une recette réelle (B5)
  CHECK: cd prototypes/houblons-v4 && npx vitest run tests/conversion-recette.test.ts && echo CONVERSION OK
  EXPECT: CONVERSION OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=afee0a628951e2263d31dc9f1e8be1e3f0b61463cac698ec920d48e9abe90dbf; exit=0; EXPECT=matched; output-sha256=bbe46f38869ce60914d406d033a5380c781646f173365870c9d093b0bb9e366b; output-bytes=959; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: le dossier est typé sans erreur
  CHECK: node prototypes/houblons-v4/parcours/outils/verifier-types.mjs
  EXPECT: TYPES OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=04b8f7f64868614636c57492d1eed9c8a1a1faefce1f18fda5816ed951a12860; exit=0; EXPECT=matched; output-sha256=5015cfef1a82e20e9a8cf800854297f68212ed6cc721038a989cde20903a582b; output-bytes=9; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: la construction sort les neuf pages
  CHECK: node prototypes/houblons-v4/parcours/outils/construire.mjs
  EXPECT: CONSTRUIT OK (9 pages)
  EVIDENCE: automatic-evidence=v1; definition-sha256=3a0a247af1f40c13dfddd6552e89d938ad25a8894ddae47c04c6432b691197d4; exit=0; EXPECT=matched; output-sha256=20797ceedf6c156ae449fcc11e150df8d1324dbbecd5de315c8ead122886c00c; output-bytes=70; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G8: le parcours des ponts joue encore (navigation en pile)
  CHECK: node prototypes/houblons-v4/parcours/outils/jouer-parcours.mjs --ponts
  EXPECT: PONTS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=24c7d735263f2dde02a464fd259d21ead0a36f558e142824751cd275ed338d8b; exit=0; EXPECT=matched; output-sha256=290760454c5040ea46371b9b5d40f93d39883ac5cd2f90895232f83b8f9e5138; output-bytes=130; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G9: rien de ce que le brasseur voit n'a changé : ses choix sont tenus (règle n° 1)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-choix.mjs prototypes/houblons-v4/maquettes/parcours
  EXPECT: CHOIX OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=1ec81ef94c962d69d2c99bffc9fa0c0ef22ed22f30898c774bfe77b4112a21c2; exit=0; EXPECT=matched; output-sha256=a8e5fd5b4d8c0cda83816f2de40d257e2dc6ac63afde5ae9000e56fc27000912; output-bytes=185; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G10: aucun fichier de l'app n'a changé
  CHECK: node prototypes/houblons-v4/parcours/outils/app-intacte.mjs
  EXPECT: APP INTACTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=a484ab77428d30fac0f9bbc722273a31c02eebb57bfa60b02569cbdaaa8a26e1; exit=0; EXPECT=matched; output-sha256=6dfcce3af6b507ef0fdf0bf4c49ae611c8747cca25559473ac691036968837b2; output-bytes=15; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G11: ARCHITECTURE.md vise les vrais dossiers de l'app et décrit conversion et crochet de test
  CHECK: node scripts/agents/systeme.mjs note prototypes/houblons-v4/parcours/ARCHITECTURE.md --contient "src/ui/hopIndex,## Conversion de recette,## Crochet de test,useFullScreenRoute,import.meta.env.DEV"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=43215bc87eae37d3c641a2ccf951f6669e333ed327e1506a7bfed40634482599; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G12: le rapport traite chaque bloquant
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/p8-portabilite/RESULTAT.md --contient "B1,B2,B3,B4,B5,B8,IBU"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=ba8475bd5b8cdb2aab9e7c56cd6c50b957b3b342389fc406fa0998e249ec91b8; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
