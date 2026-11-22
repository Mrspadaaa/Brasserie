# Gates: voie a1-analyse — analyse de Stocks › Matériel

OWNS: work/missions/2026-11-14-materiel/analyse/, work/missions/2026-11-14-materiel/voies/a1-analyse/

Scope: problèmes numérotés, parcours manquants, couverture, à garder.

- [ ] G1: les quatre sections et au moins 10 problèmes et 6 parcours manquants
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-11-14-materiel/analyse/ANALYSE.md','utf8');const s=['## Problèmes','## Parcours manquants','## Couverture','## À garder'].filter(x=>!t.includes(x));const p=(t.match(/^\W*P\d+/gm)||[]).length,m=(t.match(/^\W*M\d+/gm)||[]).length;console.log(!s.length&&p>=10&&m>=6?'NOTE OK P'+p+' M'+m:'NOTE ECHEC '+s+' P'+p+' M'+m)"
  EXPECT: NOTE OK
  EVIDENCE: pending
