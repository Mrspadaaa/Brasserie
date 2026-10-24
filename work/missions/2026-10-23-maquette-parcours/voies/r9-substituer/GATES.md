# Gates: voie r9-substituer — u4 enrichi (D127)

OWNS: prototypes/houblons-v4/parcours/src/ecrans/substituer/**, prototypes/houblons-v4/maquettes/parcours-substituer/**, work/missions/2026-10-23-maquette-parcours/voies/r9-substituer/RESULTAT.md

Scope: Substituer de u4, avec le dry hop, l'ajout à Comparer, remplacer et fermer d'un toucher, sans rien perdre.

- [ ] G1: la maquette se construit
  CHECK: node prototypes/houblons-v4/parcours/outils/construire.mjs --sortie=prototypes/houblons-v4/maquettes/parcours-substituer
  EXPECT: CONSTRUIT OK
  EVIDENCE: pending

- [ ] G2: ses mots du 24.10 sont tenus (dry hop, Comparer, remplacer, fermer)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-substituer-gestes.mjs prototypes/houblons-v4/maquettes/parcours-substituer
  EXPECT: SUBSTITUER-GESTES OK
  EVIDENCE: pending

- [ ] G3: aucun état de u4 perdu
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-etats.mjs prototypes/houblons-v4/maquettes/parcours-substituer --ecran=substituer
  EXPECT: ETATS OK
  EVIDENCE: pending

- [ ] G4: la baseline tient
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs prototypes/houblons-v4/maquettes/parcours-substituer substituer --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: pending

- [ ] G5: son choix et ses teintes
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-choix.mjs prototypes/houblons-v4/maquettes/parcours-substituer --ecran=substituer && node work/refonte-frontend/v4/tournoi/outils/controle-teinte.mjs prototypes/houblons-v4/maquettes/parcours-substituer
  EXPECT: TEINTE OK
  EVIDENCE: pending
