# Gates: voie k9 — Critique de e8na à e8nd et e9na à e9nd

OWNS: work/missions/2026-11-14-brassins/voies/k9/

Scope: un verdict par maquette et un classement.

- [ ] G1: 8 verdicts, le compte en tête, le classement
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-11-14-brassins/voies/k9/VERDICT.md','utf8');const ok=/^OK — \d+ problèmes, \d+ bloquants/.test(t)&&/## Classement/.test(t)&&['e8na','e8nb','e8nc','e8nd','e9na','e9nb','e9nc','e9nd'].every(i=>new RegExp('## '+i+' — (MONTRER|CORRIGER)').test(t));console.log(ok?'VERDICT OK':'VERDICT KO')"
  EXPECT: VERDICT OK
  EVIDENCE: pending
