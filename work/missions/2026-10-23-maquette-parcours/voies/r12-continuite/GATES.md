# Gates: voie r12-continuite — en-tête et pied continus (D129)

OWNS: prototypes/houblons-v4/parcours/src/commun/**, prototypes/houblons-v4/parcours/src/ecrans/dryhopper/**, prototypes/houblons-v4/parcours/src/ecrans/levure/**, prototypes/houblons-v4/maquettes/parcours-continuite/**, work/missions/2026-10-23-maquette-parcours/voies/r12-continuite/RESULTAT.md

Scope: le même en-tête et le même pied sur chaque écran, sans rien perdre.

- [ ] G1: la maquette se construit
  CHECK: node prototypes/houblons-v4/parcours/outils/construire.mjs --sortie=prototypes/houblons-v4/maquettes/parcours-continuite
  EXPECT: CONSTRUIT OK
  EVIDENCE: pending

- [ ] G2: la continuité tient
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-continuite.mjs prototypes/houblons-v4/maquettes/parcours-continuite
  EXPECT: CONTINUITE OK
  EVIDENCE: pending

- [ ] G3: Annuler à côté de son action, et le rail de Dryhopper entier
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-annuler.mjs prototypes/houblons-v4/maquettes/parcours-continuite && node work/refonte-frontend/v4/tournoi/outils/controle-rail.mjs prototypes/houblons-v4/maquettes/parcours-continuite dryhopper --parcours
  EXPECT: RAIL OK
  EVIDENCE: pending

- [ ] G4: aucun état perdu
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-etats.mjs prototypes/houblons-v4/maquettes/parcours-continuite
  EXPECT: ETATS OK
  EVIDENCE: pending
