# Gates: voie k4 — Critique de s5, s6, s7

OWNS: work/missions/2026-11-14-brassins/voies/k4/

Scope: un verdict par variante et un classement.

- [ ] G1: les verdicts, le compte en tête, le classement
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-11-14-brassins/voies/k4/VERDICT.md','utf8');const ok=/^OK — \d+ problèmes, \d+ bloquants/.test(t)&&/## Classement/.test(t)&&['s5a','s5b','s5c','s6a','s6b','s6c','s7a','s7b','s7c'].every(i=>new RegExp('## '+i+' — (MONTRER|CORRIGER)').test(t));console.log(ok?'VERDICT OK':'VERDICT KO')"
  EXPECT: VERDICT OK
  EVIDENCE: pending
