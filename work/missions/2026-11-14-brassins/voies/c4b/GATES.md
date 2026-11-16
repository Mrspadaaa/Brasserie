# Gates: voie c4b — Critique de s6 et s7

OWNS: work/missions/2026-11-14-brassins/voies/c4b/

Scope: un verdict par variante et un classement.

- [ ] G1: six verdicts, le compte en tête, le classement
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-11-14-brassins/voies/c4b/VERDICT.md','utf8');const ok=/^OK — \d+ problèmes, \d+ bloquants/.test(t)&&/## Classement/.test(t)&&['s6a','s6b','s6c','s7a','s7b','s7c'].every(i=>new RegExp('## '+i+' — (MONTRER|CORRIGER)').test(t));console.log(ok?'VERDICT OK':'VERDICT KO')"
  EXPECT: VERDICT OK
  EVIDENCE: pending
