# Gates: voie ksb — Critique du port

OWNS: work/missions/2026-11-14-brassins/voies/ksb/

Scope: un verdict par maquette portée.

- [ ] G1: deux verdicts (d1b, c2a), le compte en tête
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-11-14-brassins/voies/ksb/VERDICT.md','utf8');const ok=/^OK — \d+ problèmes, \d+ bloquants/.test(t)&&['d1b','c2a'].every(i=>new RegExp('## '+i+' — (CONFORME|CORRIGER)').test(t));console.log(ok?'VERDICT OK':'VERDICT KO')"
  EXPECT: VERDICT OK
  EVIDENCE: pending
