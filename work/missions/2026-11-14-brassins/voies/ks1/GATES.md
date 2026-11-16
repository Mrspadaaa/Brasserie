# Gates: voie ks1 — Critique du port

OWNS: work/missions/2026-11-14-brassins/voies/ks1/

Scope: un verdict par maquette portée.

- [ ] G1: un verdict (r2a), le compte en tête
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-11-14-brassins/voies/ks1/VERDICT.md','utf8');const ok=/^OK — \d+ problèmes, \d+ bloquants/.test(t)&&['r2a'].every(i=>new RegExp('## '+i+' — (CONFORME|CORRIGER)').test(t));console.log(ok?'VERDICT OK':'VERDICT KO')"
  EXPECT: VERDICT OK
  EVIDENCE: pending
