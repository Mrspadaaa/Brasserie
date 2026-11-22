# Gates: voie p2-r2 — passe 2

OWNS: work/missions/2026-11-14-materiel/v1/r/rq3/, work/missions/2026-11-14-materiel/v1/r/rq4/, work/missions/2026-11-14-materiel/voies/p2-r2/

Scope: deux variantes, sept images chacune, NOTE avec « ## Passe 2 ».

- [ ] G1: sept images et la NOTE de passe 2 pour chaque variante
  CHECK: node -e "const fs=require('fs');const d='work/missions/2026-11-14-materiel/v1/r';const m=[];for(const i of ['rq3','rq4']){for(const f of ['repos-390','geste-390','traiter-390','ajout-390','vide-390','repos-cave-390','repos-1280'])if(!fs.existsSync(d+'/'+i+'/'+i+'-'+f+'.png'))m.push(i+'-'+f);const n=d+'/'+i+'/NOTE.md';if(!fs.existsSync(n)||!fs.readFileSync(n,'utf8').includes('## Passe 2'))m.push(i+'-NOTE')}console.log(m.length?'PASSE ECHEC '+m:'PASSE OK')"
  EXPECT: PASSE OK
  EVIDENCE: pending
