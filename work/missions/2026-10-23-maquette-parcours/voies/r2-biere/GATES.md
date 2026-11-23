# Gates: voie r2-biere â€” l'onglet Ma biÃ¨re de la base v4.10, tous ses Ã©tats rendus

OWNS: prototypes/houblons-v4/parcours/src/ecrans/biere/**, prototypes/houblons-v4/parcours/src/ecrans/ma-biere/RadarBiere.tsx, prototypes/houblons-v4/maquettes/parcours-biere/**, work/missions/2026-10-23-maquette-parcours/voies/r2-biere/RESULTAT.md

Scope: chaque Ã©tat perdu de sa maquette choisie rendu tel qu'il le montrait (D124), marquÃ© data-etat, sans rÃ©gression.

- [ ] G1: la maquette se construit dans sa sortie
  CHECK: node prototypes/houblons-v4/parcours/outils/construire.mjs --sortie=prototypes/houblons-v4/maquettes/parcours-biere
  EXPECT: CONSTRUIT OK
  EVIDENCE: pending

- [ ] G2: chaque Ã©tat de sa maquette choisie se rejoue sur l'Ã©cran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-etats.mjs prototypes/houblons-v4/maquettes/parcours-biere --ecran=biere
  EXPECT: ETATS OK
  EVIDENCE: pending

- [ ] G3: l'Ã©cran est conforme Ã  son choix (rÃ¨gle nÂ° 1)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-choix.mjs prototypes/houblons-v4/maquettes/parcours-biere --ecran=ma-biere
  EXPECT: CHOIX OK
  EVIDENCE: pending

- [ ] G4: les exigences de toute l'app tiennent
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs prototypes/houblons-v4/maquettes/parcours-biere biere --page=etat.html --sans=mots,fiche
  EXPECT: COMMUN OK
  EVIDENCE: pending

- [ ] G5: la teinte de ses maquettes tient (D106)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-teinte.mjs prototypes/houblons-v4/maquettes/parcours-biere
  EXPECT: TEINTE OK
  EVIDENCE: pending

- [ ] G6: les types tiennent et l'app reste intacte
  CHECK: node prototypes/houblons-v4/parcours/outils/verifier-types.mjs
  EXPECT: TYPES OK
  EVIDENCE: pending

- [ ] G7: le rapport liste les Ã©tats rendus avec leurs captures
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/r2-biere/RESULTAT.md --contient "data-etat,capture,choisie,5345f6ad"
  EXPECT: NOTE OK
  EVIDENCE: pending
