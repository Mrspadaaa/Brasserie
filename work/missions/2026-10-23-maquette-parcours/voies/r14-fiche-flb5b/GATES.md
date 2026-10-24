# Gates: voie r14-fiche-flb5b — la liste de la fiche en flb5b (D130)

OWNS: prototypes/houblons-v4/parcours/src/ecrans/fiche/**, prototypes/houblons-v4/maquettes/parcours-fiche/**, work/missions/2026-10-23-maquette-parcours/voies/r14-fiche-flb5b/RESULTAT.md

Scope: la matrice de flb5b sous le radar de g1, ses types hors 16D en tête, sans perdre un état de la fiche.

- [ ] G1: la maquette se construit
  CHECK: node prototypes/houblons-v4/parcours/outils/construire.mjs --sortie=prototypes/houblons-v4/maquettes/parcours-fiche
  EXPECT: CONSTRUIT OK
  EVIDENCE: pending

- [ ] G2: les types hors 16D de la fiche
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-hors-16d.mjs prototypes/houblons-v4/maquettes/parcours-fiche/fiche/etat.html --min=1
  EXPECT: HORS-16D OK
  EVIDENCE: pending

- [ ] G3: aucun état de la fiche perdu
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-etats.mjs prototypes/houblons-v4/maquettes/parcours-fiche --ecran=fiche
  EXPECT: ETATS OK
  EVIDENCE: pending

- [ ] G4: son choix et la baseline
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-choix.mjs prototypes/houblons-v4/maquettes/parcours-fiche --ecran=fiche && node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs prototypes/houblons-v4/maquettes/parcours-fiche fiche --page=etat.html
  EXPECT: COMMUN OK
  EVIDENCE: pending

- [ ] G5: la fiche exhaustive, le pied de flu2b (D132)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-fiche-exhaustive.mjs prototypes/houblons-v4/maquettes/parcours-fiche/fiche/etat.html
  EXPECT: EXHAUSTIVE OK
  EVIDENCE: pending
