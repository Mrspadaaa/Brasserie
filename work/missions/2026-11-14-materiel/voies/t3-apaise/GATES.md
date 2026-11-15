# Gates: voie t3-apaise — verdict des variantes apaisées

OWNS: work/missions/2026-11-14-materiel/critique/VERDICT-V2.md, work/missions/2026-11-14-materiel/voies/t3-apaise/

Scope: verdict de za1 à za4.

- [ ] G1: un verdict pour chacune, classement et phrases
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-11-14-materiel/critique/VERDICT-V2.md','utf8');const m=['za1','za2','za3','za4'].filter(i=>!new RegExp('### '+i+'[\s\S]{0,200}(MONTRABLE|A REPRENDRE)').test(t));const s=['## Classement','## Une phrase par variante'].filter(x=>!t.includes(x));console.log(!m.length&&!s.length?'VERDICT OK':'VERDICT ECHEC '+m+' '+s)"
  EXPECT: VERDICT OK
  EVIDENCE: pending
