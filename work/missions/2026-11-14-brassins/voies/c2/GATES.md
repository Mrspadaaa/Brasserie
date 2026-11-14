# Gates: voie c2 — Critique des passes 2

OWNS: work/missions/2026-11-14-brassins/voies/c2/

Scope: un verdict par variante de passe 2.

- [ ] G1: quatre verdicts et le compte en tête
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-11-14-brassins/voies/c2/VERDICT.md','utf8');const ok=/^OK — \d+ problèmes, \d+ bloquants/.test(t)&&['s1e2','s1g','s2a2','s3b2'].every(i=>new RegExp('## '+i+' — (MONTRER|CORRIGER)').test(t));console.log(ok?'VERDICT OK':'VERDICT KO')"
  EXPECT: VERDICT OK
  EVIDENCE: pending
