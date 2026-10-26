# Gates: voie t7-worker — un worker persistant sert les calculs lourds, sans état d'attente visible

OWNS: src/ui/hopIndex/hopTools.worker.ts, src/ui/hopIndex/hopToolsTransport.ts, src/domain/hopIndex/v4/client.ts, prototypes/houblons-v4/parcours/src/moteur/, prototypes/houblons-v4/parcours/src/coquille/, prototypes/houblons-v4/tests/, tests/unit/hopIndexV4/, prototypes/houblons-v4/maquettes/parcours/, work/missions/2026-10-25-integration-houblons/voies/t7-worker/

Scope: le worker persistant derrière le contrat du client, toucher Ma bière → Suggérer ≤ 100 ms ×4, rien de visible ne change.

- [ ] G1: worker et test du transport, toucher Suggérer ×4 ≤ 100 ms, captures immédiat et worker, build vert, démarrage ≤ 919 ko
  CHECK: node work/missions/2026-10-25-integration-houblons/voies/t7-worker/verifier.mjs
  EXPECT: WORKER OK
  EVIDENCE: pending

- [ ] G2: la maquette rend la même chose (batterie entière)
  CHECK: node prototypes/houblons-v4/parcours/outils/batterie.mjs
  EXPECT: BATTERIE OK 46/46
  EVIDENCE: pending

- [ ] G3: les états de ses maquettes choisies tiennent
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-etats.mjs prototypes/houblons-v4/maquettes/parcours
  EXPECT: ETATS OK
  EVIDENCE: pending
