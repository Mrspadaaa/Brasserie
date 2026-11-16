# Gates: voie k8 — Critique de e3ga à e3gd

OWNS: work/missions/2026-11-14-brassins/voies/k8/

Scope: un verdict par maquette et un classement.

- [ ] G1: 4 verdicts, le compte en tête, le classement
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-11-14-brassins/voies/k8/VERDICT.md','utf8');const ok=/^OK — \d+ problèmes, \d+ bloquants/.test(t)&&/## Classement/.test(t)&&['e3ga','e3gb','e3gc','e3gd'].every(i=>new RegExp('## '+i+' — (MONTRER|CORRIGER)').test(t));console.log(ok?'VERDICT OK':'VERDICT KO')"
  EXPECT: VERDICT OK
  EVIDENCE: pending
