# Gates: voie r10-comparer — r6a au premier écran, les étapes en sélecteur (D128)

OWNS: prototypes/houblons-v4/parcours/src/ecrans/comparer/**, prototypes/houblons-v4/maquettes/parcours-comparer/**, work/missions/2026-10-23-maquette-parcours/voies/r10-comparer/RESULTAT.md

Scope: Comparer reprend la forme de r6a au premier écran, avec les étapes de x3b en sélecteur, sans rien perdre.

- [ ] G1: la maquette se construit
  CHECK: node prototypes/houblons-v4/parcours/outils/construire.mjs --sortie=prototypes/houblons-v4/maquettes/parcours-comparer
  EXPECT: CONSTRUIT OK
  EVIDENCE: pending

- [ ] G2: ses rangées de familles au premier écran, comme r6a
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-comparer-familles.mjs prototypes/houblons-v4/maquettes/parcours-comparer/comparer/etat.html
  EXPECT: FAMILLES OK
  EVIDENCE: pending

- [ ] G3: les étapes 60′, 10′, dry hop tiennent (D107)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-comparer-etapes.mjs prototypes/houblons-v4/maquettes/parcours-comparer
  EXPECT: COMPARER-ETAPES OK
  EVIDENCE: pending

- [ ] G4: aucun état de Comparer perdu, et 80 mots au plus au premier écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-etats.mjs prototypes/houblons-v4/maquettes/parcours-comparer --ecran=comparer && node work/refonte-frontend/v4/tournoi/outils/controle-etats.mjs prototypes/houblons-v4/maquettes/parcours-comparer --ecran=acquis --id=etat-acquis-premier-plan-80-mots
  EXPECT: ETATS OK
  EVIDENCE: pending

- [ ] G5: son choix et la baseline
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-choix.mjs prototypes/houblons-v4/maquettes/parcours-comparer --ecran=comparer && node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs prototypes/houblons-v4/maquettes/parcours-comparer comparer --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: pending
