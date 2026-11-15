# Gates: voie kq2 — Critique du port

OWNS: work/missions/2026-11-14-brassins/voies/kq2/

Scope: un verdict par maquette portée.

- [x] G1: cinq verdicts, le compte en tête
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-11-14-brassins/voies/kq2/VERDICT.md','utf8');const ok=/^OK — \d+ problèmes, \d+ bloquants/.test(t)&&['gfc','e6a','e6c','e3gb','e9na'].every(i=>new RegExp('## '+i+' — (CONFORME|CORRIGER)').test(t));console.log(ok?'VERDICT OK':'VERDICT KO')"
  EXPECT: VERDICT OK
  EVIDENCE: VERDICT OK (15.11, tests.txt) ; 35 problèmes, 5 bloquants recomptés dans VERDICT.md
