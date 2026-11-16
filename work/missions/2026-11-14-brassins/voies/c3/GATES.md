# Gates: voie c3 — Critique du refus

OWNS: work/missions/2026-11-14-brassins/voies/c3/

Scope: diagnostic du refus et quatre genres neufs.

- [ ] G1: compte en tête, causes, quatre genres, garder
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-11-14-brassins/voies/c3/DIAGNOSTIC.md','utf8');const ok=/^OK — \d+ causes, 4 genres/.test(t)&&/## Causes/.test(t)&&/## Garder/.test(t)&&[1,2,3,4].every(i=>new RegExp('### G'+i+' — ').test(t));console.log(ok?'DIAG OK':'DIAG KO')"
  EXPECT: DIAG OK
  EVIDENCE: pending
