# Gates: voie c5 — le contrôle « à la volée » (D211), qui échoue sur r4d

OWNS: work/refonte-frontend/v4/tournoi/outils/controle-volee.mjs, work/missions/2026-10-31-ecran-fermentescibles/voies/c5/

Scope: le contrôle de D211 ; il refuse r4d et accepte un témoin qui fait les quatre réglages sur la ligne.

- [ ] G1: le contrôle refuse r4d
  CHECK: node scripts/agents/systeme.mjs echoue "VOLEE ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-volee.mjs work/missions/2026-10-31-ecran-fermentescibles/v3/r4d/etat.html
  EXPECT: ECHOUE OK
  EVIDENCE: pending

- [ ] G2: le contrôle accepte le témoin positif
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-volee.mjs work/missions/2026-10-31-ecran-fermentescibles/voies/c5/temoin-ok.html
  EXPECT: VOLEE OK
  EVIDENCE: pending

- [ ] G3: le résultat donne la sortie sur r4d
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-31-ecran-fermentescibles/voies/c5/RESULTAT.md --contient "TEMOIN r4d,part,moment,couleur"
  EXPECT: NOTE OK
  EVIDENCE: pending
