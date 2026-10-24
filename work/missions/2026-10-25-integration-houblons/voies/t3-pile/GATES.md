# Gates: voie t3-pile — pile de routes dans l'app, le wizard reste monté sous les outils

OWNS: src/pages/useFullScreenRoute.ts, src/App.tsx, src/ui/hopIndex/devHook.ts, src/ui/hopIndex/HopToolLayer.tsx, src/ui/hopIndex/flags.ts, tests/integration/, tests/unit/, work/missions/2026-10-25-integration-houblons/voies/t3-pile/

Scope: la pile à quatre niveaux, le wizard monté sous les outils, les retours existants inchangés, joué dans Chrome.

- [ ] G1: la pile existe, ses tests neufs et les tests de retour passent, la suite complète passe, le parcours Chrome a ses captures
  CHECK: node work/missions/2026-10-25-integration-houblons/voies/t3-pile/verifier.mjs
  EXPECT: PILE OK
  EVIDENCE: pending

- [ ] G2: le build de l'app reste vert
  CHECK: npm run build
  EXPECT: built in
  EVIDENCE: pending
