# Gates: voie t9-paresseux — les outils v4 dans un chunk à la demande, préchargé, rien au démarrage

OWNS: src/ui/hopIndex/, src/App.tsx, vite.config.ts, scripts/check-hop-budget.mjs, tests/unit/hopIndexV4/, work/missions/2026-10-25-integration-houblons/voies/t9-paresseux/

Scope: le chunk des outils, son préchargement au repos en ligne, l'ouverture hors ligne après un premier lancement, le démarrage inchangé.

- [ ] G1: build vert, démarrage ≤ 919 ko, chunk des outils ≤ 150 ko gzip hors démarrage, tests du chargement verts, hors ligne joué avec captures
  CHECK: node work/missions/2026-10-25-integration-houblons/voies/t9-paresseux/verifier.mjs
  EXPECT: PARESSEUX OK
  EVIDENCE: pending
