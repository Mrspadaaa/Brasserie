# Gates: voie k6 — Critique de g6 et e5n

OWNS: work/missions/2026-11-14-brassins/voies/k6/

Scope: un verdict par maquette et un classement.

- [ ] G1: sept verdicts, le compte en tête, le classement
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-11-14-brassins/voies/k6/VERDICT.md','utf8');const ok=/^OK — \d+ problèmes, \d+ bloquants/.test(t)&&/## Classement/.test(t)&&['g6a','g6b','g6c','e5na','e5nb','e5nc','e5nd'].every(i=>new RegExp('## '+i+' — (MONTRER|CORRIGER)').test(t));console.log(ok?'VERDICT OK':'VERDICT KO')"
  EXPECT: VERDICT OK
  EVIDENCE: pending
