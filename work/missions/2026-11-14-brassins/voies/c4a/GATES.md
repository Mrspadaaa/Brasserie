# Gates: voie c4a — Critique de s4 et s5

OWNS: work/missions/2026-11-14-brassins/voies/c4a/

Scope: un verdict par variante et un classement.

- [ ] G1: six verdicts, le compte en tête, le classement
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-11-14-brassins/voies/c4a/VERDICT.md','utf8');const ok=/^OK — \d+ problèmes, \d+ bloquants/.test(t)&&/## Classement/.test(t)&&['s4a','s4b','s4c','s5a','s5b','s5c'].every(i=>new RegExp('## '+i+' — (MONTRER|CORRIGER)').test(t));console.log(ok?'VERDICT OK':'VERDICT KO')"
  EXPECT: VERDICT OK
  EVIDENCE: pending
