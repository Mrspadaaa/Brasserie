# Gates: voie kp — Critique du port

OWNS: work/missions/2026-11-14-brassins/voies/kp/

Scope: un verdict par maquette portée.

- [ ] G1: six verdicts, le compte en tête
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-11-14-brassins/voies/kp/VERDICT.md','utf8');const ok=/^OK — \d+ problèmes, \d+ bloquants/.test(t)&&['e1a','e2a','e4c','e7a','e10c','e11a'].every(i=>new RegExp('## '+i+' — (CONFORME|CORRIGER)').test(t));console.log(ok?'VERDICT OK':'VERDICT KO')"
  EXPECT: VERDICT OK
  EVIDENCE: pending
