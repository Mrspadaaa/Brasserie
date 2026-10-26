# Gates: voie t11-communs — les composants communs de la maquette dans src/ui/hopIndex/, une seule copie

OWNS: src/ui/hopIndex/, prototypes/houblons-v4/parcours/src/, work/refonte-frontend/v4/tournoi/outils/controle-traits.mjs, prototypes/houblons-v4/parcours/ARCHITECTURE.md, tests/unit/hopIndexV4/, prototypes/houblons-v4/maquettes/parcours/, work/missions/2026-10-25-integration-houblons/voies/t11-communs/

Scope: les composants communs déménagent dans src, la maquette les importe de là, rendu identique, rien au démarrage.

- [ ] G1: composants dans src seulement, plus aucun import de l'ancien chemin, test de rendu vert, build vert, démarrage ≤ 919 ko
  CHECK: node work/missions/2026-10-25-integration-houblons/voies/t11-communs/verifier.mjs
  EXPECT: COMMUNS OK
  EVIDENCE: pending

- [ ] G2: la maquette rend la même chose (batterie entière : teinte, traits, pictos, légende v2a)
  CHECK: node prototypes/houblons-v4/parcours/outils/batterie.mjs
  EXPECT: BATTERIE OK 46/46
  EVIDENCE: pending

- [ ] G3: les états de ses maquettes choisies tiennent
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-etats.mjs prototypes/houblons-v4/maquettes/parcours
  EXPECT: ETATS OK
  EVIDENCE: pending
