# Gates: voie p8-portabilite — rendre la maquette facile à intégrer dans l'app

OWNS: prototypes/houblons-v4/src/**, prototypes/houblons-v4/data/**, prototypes/houblons-v4/tests/**, prototypes/houblons-v4/parcours/src/moteur/**, prototypes/houblons-v4/parcours/src/etat/**, prototypes/houblons-v4/parcours/src/coquille/**, prototypes/houblons-v4/parcours/src/commun/**, prototypes/houblons-v4/parcours/src/integration/**, prototypes/houblons-v4/parcours/ARCHITECTURE.md, prototypes/houblons-v4/ENGINE.md, work/missions/2026-10-23-maquette-parcours/voies/p8-portabilite/RESULTAT.md

Scope: lever dans la maquette les bloquants d'intégration prouvés par p7 (moteur portable, données injectables, conversion de recette testée, navigation en pile, données hors de work/, crochet de test), sans toucher à l'app ni à ce que le brasseur voit.

- [ ] G1: le moteur ne lit plus process.env (B3)
  CHECK: node prototypes/houblons-v4/parcours/outils/portabilite.mjs --process
  EXPECT: SANS PROCESS OK
  EVIDENCE: pending

- [ ] G2: le moteur n'importe plus par les alias @app et @functions (B4)
  CHECK: node prototypes/houblons-v4/parcours/outils/portabilite.mjs --alias
  EXPECT: IMPORTS RELATIFS OK
  EVIDENCE: pending

- [ ] G3: la maquette n'importe plus rien de work/ (B8)
  CHECK: node prototypes/houblons-v4/parcours/outils/portabilite.mjs --work
  EXPECT: SANS WORK OK
  EVIDENCE: pending

- [ ] G4: le moteur garde ses tests et son témoin négatif
  CHECK: cd prototypes/houblons-v4 && npm run check:engine
  EXPECT: ENGINE-V4 OK
  EVIDENCE: pending

- [ ] G5: la conversion de recette de l'app est testée sur une recette réelle (B5)
  CHECK: cd prototypes/houblons-v4 && npx vitest run tests/conversion-recette.test.ts && echo CONVERSION OK
  EXPECT: CONVERSION OK
  EVIDENCE: pending

- [ ] G6: le dossier est typé sans erreur
  CHECK: node prototypes/houblons-v4/parcours/outils/verifier-types.mjs
  EXPECT: TYPES OK
  EVIDENCE: pending

- [ ] G7: la construction sort les neuf pages
  CHECK: node prototypes/houblons-v4/parcours/outils/construire.mjs
  EXPECT: CONSTRUIT OK (9 pages)
  EVIDENCE: pending

- [ ] G8: le parcours des ponts joue encore (navigation en pile)
  CHECK: node prototypes/houblons-v4/parcours/outils/jouer-parcours.mjs --ponts
  EXPECT: PONTS OK
  EVIDENCE: pending

- [ ] G9: rien de ce que le brasseur voit n'a changé : ses choix sont tenus (règle n° 1)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-choix.mjs prototypes/houblons-v4/maquettes/parcours
  EXPECT: CHOIX OK
  EVIDENCE: pending

- [ ] G10: aucun fichier de l'app n'a changé
  CHECK: node prototypes/houblons-v4/parcours/outils/app-intacte.mjs
  EXPECT: APP INTACTE OK
  EVIDENCE: pending

- [ ] G11: ARCHITECTURE.md vise les vrais dossiers de l'app et décrit conversion et crochet de test
  CHECK: node scripts/agents/systeme.mjs note prototypes/houblons-v4/parcours/ARCHITECTURE.md --contient "src/ui/hopIndex,## Conversion de recette,## Crochet de test,useFullScreenRoute,import.meta.env.DEV"
  EXPECT: NOTE OK
  EVIDENCE: pending

- [ ] G12: le rapport traite chaque bloquant
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/p8-portabilite/RESULTAT.md --contient "B1,B2,B3,B4,B5,B8,IBU"
  EXPECT: NOTE OK
  EVIDENCE: pending
