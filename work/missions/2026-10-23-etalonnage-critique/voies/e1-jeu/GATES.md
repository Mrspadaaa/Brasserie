# Gates: e1-jeu

OWNS: work/refonte-frontend/v4/etalonnage/jeu.json, work/refonte-frontend/v4/etalonnage/JEU.md, work/missions/2026-10-23-etalonnage-critique/voies/e1-jeu/RESULTAT.md

Scope: le jeu d'étalonnage du critique, fait seulement des verdicts du brasseur et des captures qu'il a jugées.

- [ ] G1: assez d'items, des deux sortes, dans les deux sens
  CHECK: node -e "const j=JSON.parse(require('fs').readFileSync('work/refonte-frontend/v4/etalonnage/jeu.json','utf8')).items;const p=j.filter(i=>i.type==='paire'),c=j.filter(i=>i.type==='classe');const n=(k)=>c.filter(i=>i.classe===k).length;const ok=p.length>=24&&c.length>=12&&n('aime')>=4&&n('rejette')>=4&&new Set(j.map(i=>i.id)).size===j.length&&p.every(i=>['a','b'].includes(i.prefere))&&c.every(i=>['aime','mitige','rejette'].includes(i.classe));console.log((ok?'JEU OK ':'JEU ECHEC ')+p.length+' paires, '+c.length+' classes ('+n('aime')+' aime, '+n('mitige')+' mitige, '+n('rejette')+' rejette)');process.exit(ok?0:1)"
  EXPECT: JEU OK
  EVIDENCE: pending

- [ ] G2: chaque capture existe
  CHECK: node -e "const fs=require('fs');const j=JSON.parse(fs.readFileSync('work/refonte-frontend/v4/etalonnage/jeu.json','utf8')).items;const c=j.flatMap(i=>i.type==='paire'?[i.a.capture,i.b.capture]:[i.capture]);const m=c.filter(x=>!x||!fs.existsSync(x));console.log(m.length?'CAPTURES ECHEC '+m.slice(0,5).join(' '):'CAPTURES OK '+c.length);process.exit(m.length?1:0)"
  EXPECT: CAPTURES OK
  EVIDENCE: pending

- [ ] G3: chaque verdict est cité mot pour mot depuis SPEC-BRASSEUR
  CHECK: node -e "const fs=require('fs');const norm=s=>s.replace(/[’']/g,\"'\").replace(/\s+/g,' ').trim();const spec=norm(fs.readFileSync('work/refonte-frontend/v4/SPEC-BRASSEUR.md','utf8'));const j=JSON.parse(fs.readFileSync('work/refonte-frontend/v4/etalonnage/jeu.json','utf8')).items;const bad=j.filter(i=>{const q=[...(i.mots||'').matchAll(/«\s*([^»]+?)\s*»/g)].map(m=>m[1]);return !q.length||q.some(x=>x.split(/\[…\]|…$/).map(norm).filter(p=>p.length>3).some(p=>!spec.includes(p)))});console.log(bad.length?'CITATIONS ECHEC '+bad.map(i=>i.id).join(' '):'CITATIONS OK '+j.length);process.exit(bad.length?1:0)"
  EXPECT: CITATIONS OK
  EVIDENCE: pending

- [ ] G4: la table lisible existe
  CHECK: node scripts/agents/systeme.mjs note work/refonte-frontend/v4/etalonnage/JEU.md --contient "paire,classe,rejette,aime"
  EXPECT: NOTE OK
  EVIDENCE: pending
