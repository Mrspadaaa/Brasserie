# Gates: voie t-mat — tri du panel

OWNS: work/missions/2026-11-14-materiel/critique/, work/missions/2026-11-14-materiel/voies/t-mat/

Scope: classement, défauts par variante, candidates, états de passe 2.

- [ ] G1: les quatre sections et une entrée de défauts pour chacune des 12 variantes
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-11-14-materiel/critique/SYNTHESE.md','utf8');const s=['## Classement','## Défauts','## Candidates','## États de passe 2'].filter(x=>!t.includes(x));const ids=['rq1','rq2','rq3','rq4','zq1','zq2','zq3','zq4','uq1','uq2','uq3','uq4'].filter(i=>!t.includes('### '+i));console.log(!s.length&&!ids.length?'SYNTHESE OK':'SYNTHESE ECHEC '+s+' '+ids)"
  EXPECT: SYNTHESE OK
  EVIDENCE: pending
