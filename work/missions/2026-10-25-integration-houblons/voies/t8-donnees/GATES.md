# Gates: voie t8-donnees — les données du moteur viennent des vraies sources, sans recalcul inutile

OWNS: src/ui/hopIndex/useHopData.ts, src/domain/hopIndex/v4/moteur.ts, src/domain/hopIndex/v4/donneesApp.ts, tests/unit/hopIndexV4/, work/missions/2026-10-25-integration-houblons/voies/t8-donnees/

Scope: useHopData depuis le stock, la dégustation et le catalogue du moteur ; un snapshot identique ne relance rien ; fixture de production lue.

- [ ] G1: useHopData, tests du snapshot et de la fixture verts, ligne du snapshot de check:hop-perf tenue, build vert, démarrage ≤ 919 ko
  CHECK: node work/missions/2026-10-25-integration-houblons/voies/t8-donnees/verifier.mjs
  EXPECT: DONNEES OK
  EVIDENCE: pending
