# Gates: voie k7 — Critique de gfa, gfc, gfd, g6a, g6b, e5ga, e5gb

OWNS: work/missions/2026-11-14-brassins/voies/k7/

Scope: un verdict par maquette et un classement.

- [ ] G1: 7 verdicts, le compte en tête, le classement
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-11-14-brassins/voies/k7/VERDICT.md','utf8');const ok=/^OK — \d+ problèmes, \d+ bloquants/.test(t)&&/## Classement/.test(t)&&['gfa','gfc','gfd','g6a','g6b','e5ga','e5gb'].every(i=>new RegExp('## '+i+' — (MONTRER|CORRIGER)').test(t));console.log(ok?'VERDICT OK':'VERDICT KO')"
  EXPECT: VERDICT OK
  EVIDENCE: pending
