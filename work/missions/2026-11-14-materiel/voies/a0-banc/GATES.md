# Gates: voie a0-banc — captures au banc local

OWNS: work/missions/2026-11-14-materiel/banc/, work/missions/2026-11-14-materiel/voies/a0-banc/

Scope: capturer chaque vue de Stocks › Matériel, 390 tactile et 1280, clair et cave, listées dans banc/INDEX.md.

- [ ] G1: au moins 24 captures PNG dans banc/
  CHECK: node -e "const n=require('fs').readdirSync('work/missions/2026-11-14-materiel/banc').filter(f=>f.endsWith('.png')).length;console.log(n>=24?'BANC OK '+n:'BANC ECHEC '+n)"
  EXPECT: BANC OK
  EVIDENCE: pending

- [ ] G2: chaque vue a sa capture 390 clair
  CHECK: node -e "const fs=require('fs');const d='work/missions/2026-11-14-materiel/banc';const v=['liste','a-traiter','recherche','recherche-vide','actions','fiche','fiche-achat','fiche-reparer','fiche-gestion','nouveau','achat','vide'];const m=v.filter(x=>!fs.existsSync(d+'/'+x+'-390-clair.png'));console.log(m.length?'VUES ECHEC '+m.join(','):'VUES OK')"
  EXPECT: VUES OK
  EVIDENCE: pending

- [ ] G3: INDEX.md liste les captures
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-11-14-materiel/banc/INDEX.md','utf8');const k=['liste-390-cave','fiche-1280-clair','a-traiter-1280-cave','vide-390-clair'];const m=k.filter(x=>!t.includes(x));console.log(m.length?'NOTE ECHEC '+m:'NOTE OK')"
  EXPECT: NOTE OK
  EVIDENCE: pending
