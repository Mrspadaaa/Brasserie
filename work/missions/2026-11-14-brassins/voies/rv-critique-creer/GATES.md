# Gates: voie rv-critique-creer — Revue Critique Créer un brassin

OWNS: work/missions/2026-11-14-brassins/revue-v0/creer-critique.md, work/missions/2026-11-14-brassins/voies/rv-critique-creer/

Scope: huit avis, classement, greffes.

- [x] G1: huit sections avec verdict, classement, greffes
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-11-14-brassins/revue-v0/creer-critique.md','utf8');const ok=['c1a','c1b','c1c','c1d','c2a','c2b','c2c','c2d'].every(i=>new RegExp('## '+i+'[^]*?Verdict : (GARDER|CORRIGER|ÉCARTER)').test(t))&&t.includes('## Classement')&&t.includes('## Greffes');console.log(ok?'REVUE OK':'REVUE KO')"
  EXPECT: REVUE OK
  EVIDENCE: REVUE OK (tests.txt)
