# Gates: voie t2-mat — verdict de passe 2

OWNS: work/missions/2026-11-14-materiel/critique/VERDICT-V1.md, work/missions/2026-11-14-materiel/voies/t2-mat/

Scope: verdict et problèmes des 12 variantes v1.

- [ ] G1: un verdict pour chacune des 12 variantes, classement et phrases
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-11-14-materiel/critique/VERDICT-V1.md','utf8');const ids=['rq1','rq2','rq3','rq4','zq1','zq2','zq3','zq4','uq1','uq2','uq3','uq4'];const m=ids.filter(i=>!new RegExp('### '+i+'[\s\S]{0,200}(MONTRABLE|A REPRENDRE)').test(t));const s=['## Classement','## Une phrase par variante'].filter(x=>!t.includes(x));console.log(!m.length&&!s.length?'VERDICT OK':'VERDICT ECHEC '+m+' '+s)"
  EXPECT: VERDICT OK
  EVIDENCE: pending
