# Gates: voie t12-ma-biere — l'étape Houblons de l'app devient sa maquette choisie, sous drapeau

OWNS: src/ui/hopIndex/, src/pages/BrewWizard.tsx, prototypes/houblons-v4/parcours/src/, work/refonte-frontend/v4/tournoi/outils/, tests/unit/hopIndexV4/, tests/integration/, prototypes/houblons-v4/maquettes/parcours/, work/missions/2026-10-25-integration-houblons/voies/t12-ma-biere/

Scope: une seule copie de l'écran, rendue dans l'étape 3 du wizard drapeau allumé, captures côte à côte de chaque état, rien de changé drapeau éteint.

- [ ] G1: écran dans src seulement, wizard sous drapeau avec V5.5 gardé, côte à côte et écarts écrits, tests neufs verts, build vert, démarrage ≤ 919 ko
  CHECK: node work/missions/2026-10-25-integration-houblons/voies/t12-ma-biere/verifier.mjs
  EXPECT: MA-BIERE-APP OK
  EVIDENCE: pending

- [ ] G2: la maquette rend la même chose
  CHECK: node prototypes/houblons-v4/parcours/outils/batterie.mjs
  EXPECT: BATTERIE OK 46/46
  EVIDENCE: pending

- [ ] G3: les états de ses maquettes choisies tiennent
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-etats.mjs prototypes/houblons-v4/maquettes/parcours
  EXPECT: ETATS OK
  EVIDENCE: pending

- [ ] G4: ses choix tiennent sur la maquette construite (règle n° 1)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-choix.mjs prototypes/houblons-v4/maquettes/parcours --ecran=etape-houblons
  EXPECT: CHOIX OK
  EVIDENCE: pending
