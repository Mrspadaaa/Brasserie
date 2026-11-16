# Gates: voie rv-uxui-recettes — Revue UX/UI Recettes

OWNS: work/missions/2026-11-14-brassins/revue-v0/recettes-uxui.md, work/missions/2026-11-14-brassins/voies/rv-uxui-recettes/

Scope: huit avis, classement, greffes.

- [x] G1: huit sections avec verdict, classement, greffes
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-11-14-brassins/revue-v0/recettes-uxui.md','utf8');const ok=['r1a','r1b','r1c','r1d','r2a','r2b','r2c','r2d'].every(i=>new RegExp('## '+i+'[^]*?Verdict : (GARDER|CORRIGER|ÉCARTER)').test(t))&&t.includes('## Classement')&&t.includes('## Greffes');console.log(ok?'REVUE OK':'REVUE KO')"
  EXPECT: REVUE OK
  EVIDENCE: REVUE OK (15.11)
