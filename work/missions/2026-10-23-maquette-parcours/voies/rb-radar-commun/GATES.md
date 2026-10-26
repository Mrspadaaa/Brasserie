# Gates: voie rb-radar-commun — le radar de cmc2h partout où il y a un radar

OWNS: prototypes/houblons-v4/parcours/src/commun/, prototypes/houblons-v4/parcours/src/ecrans/comparer/, prototypes/houblons-v4/parcours/src/ecrans/fiche/, prototypes/houblons-v4/parcours/src/ecrans/suggerer/, prototypes/houblons-v4/parcours/src/ecrans/substituer/, prototypes/houblons-v4/maquettes/parcours/, work/refonte-frontend/v4/tournoi/outils/controle-radar-base.mjs, work/missions/2026-10-23-maquette-parcours/voies/rb-radar-commun/

Scope: un composant RadarBase porté de cmc2h, posé dans Comparer (cmc2h entier), la fiche, Suggérer et Substituer ; Ma bière après t12b.

- [ ] G1: chaque vue à radar porte la baseline
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-radar-base.mjs prototypes/houblons-v4/maquettes/parcours
  EXPECT: RADAR-BASE OK
  EVIDENCE: pending

- [ ] G2: la maquette rend toujours ses parcours
  CHECK: node prototypes/houblons-v4/parcours/outils/batterie.mjs
  EXPECT: BATTERIE OK
  EVIDENCE: pending

- [ ] G3: les états de ses maquettes choisies tiennent
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-etats.mjs prototypes/houblons-v4/maquettes/parcours
  EXPECT: ETATS OK
  EVIDENCE: pending

- [ ] G4: ses choix tiennent (règle n° 1)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-choix.mjs prototypes/houblons-v4/maquettes/parcours
  EXPECT: CHOIX OK
  EVIDENCE: pending

- [ ] G5: les moments de Comparer
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-quand-comparer.mjs prototypes/houblons-v4/maquettes/parcours comparer --page=etat.html
  EXPECT: QUAND OK
  EVIDENCE: pending
