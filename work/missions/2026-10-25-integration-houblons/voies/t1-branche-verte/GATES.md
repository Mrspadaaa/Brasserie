# Gates: voie t1-branche-verte — un houblon inconnu ne plante plus Ma bière ; tests du moteur dans npm test

OWNS: prototypes/houblons-v4/parcours/src/moteur/index.ts, prototypes/houblons-v4/tests/, vitest.config.ts, work/missions/2026-10-25-integration-houblons/voies/t1-branche-verte/

Scope: R1 corrigé avec un test qui était rouge sur HEAD, les tests du prototype dans le Vitest de la racine, le parcours wizard → hopV55 → retour joué.

- [ ] G1: les tests du prototype passent depuis la racine, dont un test d'un houblon inconnu ; témoin et parcours écrits avec leurs captures
  CHECK: node work/missions/2026-10-25-integration-houblons/voies/t1-branche-verte/verifier.mjs
  EXPECT: BRANCHE OK
  EVIDENCE: pending

- [ ] G2: le build de l'app reste vert
  CHECK: npm run build
  EXPECT: built in
  EVIDENCE: pending
