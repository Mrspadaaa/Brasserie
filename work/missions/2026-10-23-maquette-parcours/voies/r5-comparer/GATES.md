# Gates: voie r5-comparer — Comparer de r6a et ses améliorations, tous ses états rendus

OWNS: prototypes/houblons-v4/parcours/src/ecrans/comparer/**, prototypes/houblons-v4/maquettes/parcours-comparer/**, work/missions/2026-10-23-maquette-parcours/voies/r5-comparer/RESULTAT.md

Scope: chaque état perdu de sa maquette choisie rendu tel qu'il le montrait (D124), marqué data-etat, sans régression.

- [ ] G1: la maquette se construit dans sa sortie
  CHECK: node prototypes/houblons-v4/parcours/outils/construire.mjs --sortie=prototypes/houblons-v4/maquettes/parcours-comparer
  EXPECT: CONSTRUIT OK
  EVIDENCE: pending

- [ ] G2: chaque état de sa maquette choisie se rejoue sur l'écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-etats.mjs prototypes/houblons-v4/maquettes/parcours-comparer --ecran=comparer
  EXPECT: ETATS OK
  EVIDENCE: pending

- [ ] G3: l'écran est conforme à son choix (règle n° 1)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-choix.mjs prototypes/houblons-v4/maquettes/parcours-comparer --ecran=comparer
  EXPECT: CHOIX OK
  EVIDENCE: pending

- [ ] G4: les exigences de toute l'app tiennent
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs prototypes/houblons-v4/maquettes/parcours-comparer comparer --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: pending

- [ ] G5: la teinte de ses maquettes tient (D106)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-teinte.mjs prototypes/houblons-v4/maquettes/parcours-comparer
  EXPECT: TEINTE OK
  EVIDENCE: pending

- [ ] G6: les types tiennent et l'app reste intacte
  CHECK: node prototypes/houblons-v4/parcours/outils/verifier-types.mjs
  EXPECT: TYPES OK
  EVIDENCE: pending

- [ ] G7: le rapport liste les états rendus avec leurs captures
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/r5-comparer/RESULTAT.md --contient "data-etat,capture,choisie,5345f6ad"
  EXPECT: NOTE OK
  EVIDENCE: pending
