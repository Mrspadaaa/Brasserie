# Gates: voie r13-dryhopper — Dryhopper devient p4b2f (D43)

OWNS: prototypes/houblons-v4/parcours/src/ecrans/dryhopper/**, prototypes/houblons-v4/maquettes/parcours-dryhopper/**, work/refonte-frontend/v4/choix/etats/dryhopper.json, work/refonte-frontend/v4/choix/etats/captures/etat-dryh-*, work/refonte-frontend/v4/choix/etats/acquis.json, work/missions/2026-10-23-maquette-parcours/voies/r13-dryhopper/RESULTAT.md

Scope: Dryhopper rendu en p4b2f, ses états relevés puis rendus, la continuité tenue.

- [ ] G1: la maquette se construit
  CHECK: node prototypes/houblons-v4/parcours/outils/construire.mjs --sortie=prototypes/houblons-v4/maquettes/parcours-dryhopper
  EXPECT: CONSTRUIT OK
  EVIDENCE: pending

- [ ] G2: ses états relevés sur p4b2f tiennent sur sa page (témoin)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-etats.mjs --choisie --ecran=dryhopper
  EXPECT: ETATS OK
  EVIDENCE: pending

- [ ] G3: ses états tiennent sur la maquette, et l'acquis y1b
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-etats.mjs prototypes/houblons-v4/maquettes/parcours-dryhopper --ecran=dryhopper && node work/refonte-frontend/v4/tournoi/outils/controle-etats.mjs prototypes/houblons-v4/maquettes/parcours-dryhopper --ecran=acquis --id=etat-acquis-y1b-brassin-au-doigt
  EXPECT: ETATS OK
  EVIDENCE: pending

- [ ] G4: le rail de Dryhopper, et la continuité (en-tête, pied)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-rail.mjs prototypes/houblons-v4/maquettes/parcours-dryhopper dryhopper --page=etat.html --parcours && node work/refonte-frontend/v4/tournoi/outils/controle-continuite.mjs prototypes/houblons-v4/maquettes/parcours-dryhopper
  EXPECT: CONTINUITE OK
  EVIDENCE: pending

- [ ] G5: la baseline et Annuler
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs prototypes/houblons-v4/maquettes/parcours-dryhopper dryhopper --page=etat.html && node work/refonte-frontend/v4/tournoi/outils/controle-annuler.mjs prototypes/houblons-v4/maquettes/parcours-dryhopper
  EXPECT: ANNULER OK
  EVIDENCE: pending
