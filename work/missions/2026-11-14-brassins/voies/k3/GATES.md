# Gates: voie k3 — Critique de e9, e10, e11, s4

OWNS: work/missions/2026-11-14-brassins/voies/k3/

Scope: un verdict par variante et un classement.

- [ ] G1: les verdicts, le compte en tête, le classement
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-11-14-brassins/voies/k3/VERDICT.md','utf8');const ok=/^OK — \d+ problèmes, \d+ bloquants/.test(t)&&/## Classement/.test(t)&&['e9a','e9b','e9c','e9d','e10a','e10b','e10c','e10d','e11a','e11b','e11c','e11d','s4a','s4b','s4c'].every(i=>new RegExp('## '+i+' — (MONTRER|CORRIGER)').test(t));console.log(ok?'VERDICT OK':'VERDICT KO')"
  EXPECT: VERDICT OK
  EVIDENCE: pending
