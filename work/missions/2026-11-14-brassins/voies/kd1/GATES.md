# Gates: voie kd1 — Critique de la feuille « Brasser » (choix du jour)

OWNS: work/missions/2026-11-14-brassins/voies/kd1/

Scope: un verdict par maquette et un classement.

- [ ] G1: 4 verdicts, le compte en tête, le classement
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-11-14-brassins/voies/kd1/VERDICT.md','utf8');const ok=/^OK — \d+ problèmes, \d+ bloquants/.test(t)&&/## Classement/.test(t)&&['d1a','d1b','d1c','d1d'].every(i=>new RegExp('## '+i+' — (MONTRER|CORRIGER)').test(t));console.log(ok?'VERDICT OK':'VERDICT KO')"
  EXPECT: VERDICT OK
  EVIDENCE: pending
