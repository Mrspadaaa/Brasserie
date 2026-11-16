# Gates: voie k2 — Critique de e5, e6, e7, e8

OWNS: work/missions/2026-11-14-brassins/voies/k2/

Scope: un verdict par variante et un classement.

- [ ] G1: les verdicts, le compte en tête, le classement
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-11-14-brassins/voies/k2/VERDICT.md','utf8');const ok=/^OK — \d+ problèmes, \d+ bloquants/.test(t)&&/## Classement/.test(t)&&['e5a','e5b','e5c','e5d','e6a','e6b','e6c','e6d','e7a','e7b','e7c','e7d','e8a','e8b','e8c','e8d'].every(i=>new RegExp('## '+i+' — (MONTRER|CORRIGER)').test(t));console.log(ok?'VERDICT OK':'VERDICT KO')"
  EXPECT: VERDICT OK
  EVIDENCE: pending
