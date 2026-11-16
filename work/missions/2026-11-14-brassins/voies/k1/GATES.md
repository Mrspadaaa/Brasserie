# Gates: voie k1 — Critique de e1, e2, e3, e4

OWNS: work/missions/2026-11-14-brassins/voies/k1/

Scope: un verdict par variante et un classement.

- [ ] G1: les verdicts, le compte en tête, le classement
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-11-14-brassins/voies/k1/VERDICT.md','utf8');const ok=/^OK — \d+ problèmes, \d+ bloquants/.test(t)&&/## Classement/.test(t)&&['e1a','e1b','e1c','e1d','e2a','e2b','e2c','e2d','e3a','e3b','e3c','e3d','e4a','e4b','e4c','e4d'].every(i=>new RegExp('## '+i+' — (MONTRER|CORRIGER)').test(t));console.log(ok?'VERDICT OK':'VERDICT KO')"
  EXPECT: VERDICT OK
  EVIDENCE: pending
