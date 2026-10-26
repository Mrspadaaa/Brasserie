# Gates: voie t5-causes — moteur sans singleton, caches bornés, causes du lag mesuré

OWNS: src/domain/hopIndex/v4/, prototypes/houblons-v4/parcours/src/moteur/, prototypes/houblons-v4/parcours/src/commun/nombres.ts, prototypes/houblons-v4/parcours/src/ecrans/dryhopper/mesures.ts, prototypes/houblons-v4/parcours/src/ecrans/comparer/valeurs.ts, prototypes/houblons-v4/tests/, scripts/bench-hop-v4.mjs, scripts/bench-hop-v4.ts, prototypes/houblons-v4/maquettes/parcours/, work/missions/2026-10-25-integration-houblons/voies/t5-causes/

Scope: la fabrique, les caches bornés, substitutes sur les 8 rendus, les deux causes du profil t2, un banc ×1 ×5 ×10.

- [ ] G1: fabrique exportée, plus de toLocaleString à chaque appel, functions/ intact, banc ×10 dans ses seuils, tests verts dont la fabrique et la borne
  CHECK: node work/missions/2026-10-25-integration-houblons/voies/t5-causes/verifier.mjs
  EXPECT: CAUSES OK
  EVIDENCE: pending

- [ ] G2: la maquette rend la même chose (batterie entière)
  CHECK: node prototypes/houblons-v4/parcours/outils/batterie.mjs
  EXPECT: BATTERIE OK 46/46
  EVIDENCE: pending

- [ ] G3: les états de ses maquettes choisies tiennent
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-etats.mjs prototypes/houblons-v4/maquettes/parcours
  EXPECT: ETATS OK
  EVIDENCE: pending

- [ ] G4: le build de l'app reste vert
  CHECK: npm run build
  EXPECT: built in
  EVIDENCE: pending
