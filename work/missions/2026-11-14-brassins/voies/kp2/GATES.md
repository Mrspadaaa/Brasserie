# Gates: voie kp2 — Critique du port

OWNS: work/missions/2026-11-14-brassins/voies/kp2/

Scope: un verdict par maquette portée.

- [x] G1: six verdicts, le compte en tête
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-11-14-brassins/voies/kp2/VERDICT.md','utf8');const ok=/^OK — \d+ problèmes, \d+ bloquants/.test(t)&&['e1a','e2a','e4c','e7a','e10c','e11a'].every(i=>new RegExp('## '+i+' — (CONFORME|CORRIGER)').test(t));console.log(ok?'VERDICT OK':'VERDICT KO')"
  EXPECT: VERDICT OK
  EVIDENCE: VERDICT OK (kp2, 15.11, « OK — 32 problèmes, 4 bloquants »)
