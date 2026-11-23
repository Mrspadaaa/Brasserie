# Gates: voie cm-quand — le contrôle « choisir quand comparer »

OWNS: work/refonte-frontend/v4/tournoi/outils/controle-quand-comparer.mjs, work/refonte-frontend/v4/tournoi/outils/temoins/quand-comparer-ok/, work/refonte-frontend/v4/tournoi/outils/temoins/quand-comparer-immobile/, work/missions/2026-10-23-maquette-parcours/voies/cm-quand/RESULTAT.md

Scope: le contrôle, OK sur un témoin qui choisit le moment, ECHEC sur la base jouable et sur un sélecteur immobile.

- [ ] G1: le témoin positif passe
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-quand-comparer.mjs work/refonte-frontend/v4/tournoi/outils/temoins quand-comparer-ok --page=etat.html
  EXPECT: QUAND OK
  EVIDENCE: pending

- [ ] G2: la base jouable échoue (aucun sélecteur de moment)
  CHECK: node scripts/agents/systeme.mjs echoue QUAND -- node work/refonte-frontend/v4/tournoi/outils/controle-quand-comparer.mjs prototypes/houblons-v4/maquettes/parcours-cmp-base comparer --page=etat.html
  EXPECT: ECHOUE OK
  EVIDENCE: pending

- [ ] G3: un sélecteur immobile échoue
  CHECK: node scripts/agents/systeme.mjs echoue QUAND -- node work/refonte-frontend/v4/tournoi/outils/controle-quand-comparer.mjs work/refonte-frontend/v4/tournoi/outils/temoins quand-comparer-immobile --page=etat.html
  EXPECT: ECHOUE OK
  EVIDENCE: pending
