# Gates: voie kg — Critique des greffes

OWNS: work/missions/2026-11-14-brassins/voies/kg/

Scope: un verdict par greffe et un classement.

- [ ] G1: quatre verdicts, le compte en tête, le classement
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-11-14-brassins/voies/kg/VERDICT.md','utf8');const ok=/^OK — \d+ problèmes, \d+ bloquants/.test(t)&&/## Classement/.test(t)&&['gfa','gfb','gfc','gfd'].every(i=>new RegExp('## '+i+' — (MONTRER|CORRIGER)').test(t));console.log(ok?'VERDICT OK':'VERDICT KO')"
  EXPECT: VERDICT OK
  EVIDENCE: pending
