# Gates: voie pg3 — Page de tous les écrans

OWNS: work/missions/2026-11-14-brassins/page3/

Scope: couverture et 44 variantes, lisible.

- [ ] G1: la page passe le contrôle de lisibilité
  CHECK: node scripts/agents/verifier-page.mjs work/missions/2026-11-14-brassins/page3/index.html --page-lot --captures work/missions/2026-11-14-brassins/voies/pg3/verif
  EXPECT: PAGE OK
  EVIDENCE: pending

- [ ] G2: les 44 variantes, toutes leurs images, la couverture et le choix en tête
  CHECK: node -e "const fs=require('fs'),M='work/missions/2026-11-14-brassins';const t=fs.readFileSync(M+'/page3/index.html','utf8');const ids=['e1','e2','e3','e4','e5','e6','e7','e8','e9','e10','e11'].flatMap(s=>['a','b','c','d'].map(l=>s+l));const n=ids.flatMap(i=>fs.readdirSync(M+'/voies/'+i.slice(0,-1)+'/'+i).filter(f=>f.endsWith('.png'))).length;const im=(t.match(/data-vignette/g)||[]).length;const ok=ids.every(i=>t.includes(i))&&t.includes('id=\"a-choisir\"')&&t.includes('id=\"couverture\"')&&t.includes('SqU1y2jQgMAX8tX6MKn9qL')&&!/fable/i.test(t)&&im>=n;console.log(ok?'CONTENU OK '+im+'/'+n:'CONTENU KO '+im+'/'+n)"
  EXPECT: CONTENU OK
  EVIDENCE: pending
