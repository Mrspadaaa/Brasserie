# Gates: voie t17-banc — jeu réaliste « beaucoup de données » et budgets bloquants

OWNS: scripts/check-hop-tools-perf.mjs, scripts/bench-hop-v4.ts, tests/fixtures/hopV4-volume/, package.json, work/missions/2026-10-25-integration-houblons/voies/t17-banc/

Scope: un contrôle juste (ses mesures par moment et budget, ECHEC sur le témoin lent) et le verdict écrit du moteur d'aujourd'hui.

- [ ] G1: le contrôle rend un verdict sur le moteur, échoue sur le témoin lent, montre ses moments et le facteur ×4 ; script npm ; verdict écrit
  CHECK: node work/missions/2026-10-25-integration-houblons/voies/t17-banc/verifier.mjs
  EXPECT: BANC OK
  EVIDENCE: pending
