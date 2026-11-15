# Gates: voie m5 — retours du 15.11

OWNS: work/missions/2026-11-14-finances/voies/m5

Scope: Modifier modifie (montant compris), Payer et l'apport ont un justificatif, la fiche reçoit la barre de m2fo-c.

- [ ] G1: les dix maquettes existent et passent les motifs de ses retours
  CHECK: node work/missions/2026-11-14-finances/outils/controle-minis.mjs work/missions/2026-11-14-finances/voies/m5 m5mo-a,m5mo-b,m5mo-c,m5mo-d,m5pa-a,m5pa-b,m5pa-c,m5pa-d,m5ap-a,m5fo-a 'mo=^(?![\s\S]*\block\b)[\s\S]*inputmode="decimal";pa=justificatif;ap=justificatif' 'ap:1,fo:1'
  EXPECT: MINIS OK
  EVIDENCE: pending

- [ ] G2: le témoin d'avant reste rouge (m2mo-a verrouillée, m2pa sans justificatif)
  CHECK: node work/missions/2026-11-14-finances/outils/controle-minis.mjs work/missions/2026-11-14-finances/voies/m2 m2mo-a,m2pa-a,m2pa-b,m2pa-c,m2pa-d 'mo=^(?![\s\S]*\block\b)[\s\S]*inputmode="decimal";pa=justificatif;ap=justificatif' 'mo:1'
  EXPECT: MINIS ECHEC
  EVIDENCE: pending
