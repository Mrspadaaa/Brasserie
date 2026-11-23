# Gates: voie p25-controle-ibu — la cohérence des IBU d'une ligne de remplaçant

OWNS: work/refonte-frontend/v4/tournoi/outils/controle-coherence-ibu.mjs, work/refonte-frontend/v4/tournoi/outils/temoins/coherence-ibu-*/**, work/missions/2026-10-23-maquette-parcours/voies/p25-controle-ibu/RESULTAT.md

Scope: un contrôle qui recompte l'IBU de chaque ligne de remplaçant ; il échoue sur sbz7 tel quel et passe sur un témoin juste.

- [ ] G1: sbz7 tel quel échoue
  CHECK: node scripts/agents/systeme.mjs echoue "COHERENCE-IBU ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-coherence-ibu.mjs work/refonte-frontend/v4/ecran-1/fils24-substituer sbz7
  EXPECT: ECHOUE OK
  EVIDENCE: pending

- [ ] G2: le témoin juste passe
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-coherence-ibu.mjs work/refonte-frontend/v4/tournoi/outils/temoins coherence-ibu-ok
  EXPECT: COHERENCE-IBU OK
  EVIDENCE: pending

- [ ] G3: le câblage tient
  CHECK: node scripts/agents/systeme.mjs cablage
  EXPECT: CABLAGE OK
  EVIDENCE: pending
