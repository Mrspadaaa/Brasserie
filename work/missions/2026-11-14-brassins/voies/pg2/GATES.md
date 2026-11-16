# Gates: voie pg2 — Page de choix neuve

OWNS: work/missions/2026-11-14-brassins/page2/

Scope: page des 12 nouvelles variantes, lisible.

- [ ] G1: la page passe le contrôle de lisibilité
  CHECK: node scripts/agents/verifier-page.mjs work/missions/2026-11-14-brassins/page2/index.html --page-lot --captures work/missions/2026-11-14-brassins/voies/pg2/verif
  EXPECT: PAGE OK
  EVIDENCE: pending

- [ ] G2: les 12 variantes, toutes leurs images, et le choix en tête
  CHECK: node -e "const fs=require('fs'),M='work/missions/2026-11-14-brassins';const t=fs.readFileSync(M+'/page2/index.html','utf8');const ids=['s4','s5','s6','s7'].flatMap(s=>['a','b','c'].map(l=>s+l));const n=ids.flatMap(i=>fs.readdirSync(M+'/voies/'+i.slice(0,2)+'/'+i).filter(f=>f.endsWith('.png'))).length;const im=(t.match(/data-vignette/g)||[]).length;console.log(ids.every(i=>t.includes(i))&&t.includes('id=\"a-choisir\"')&&!/fable/i.test(t)&&im>=n?'CONTENU OK '+im+'/'+n:'CONTENU KO '+im+'/'+n)"
  EXPECT: CONTENU OK
  EVIDENCE: pending
