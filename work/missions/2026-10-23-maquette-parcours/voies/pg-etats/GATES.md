# Gates: voie pg-etats — la page « États · 24.10 »

OWNS: work/refonte-frontend/v4/outils/pages/2026-10-24-etats/index.html, work/refonte-frontend/v4/outils/pages/2026-10-24-etats/img/*-choisie.png, work/missions/2026-10-23-maquette-parcours/voies/pg-etats/RESULTAT.md

Scope: une page lisible au téléphone qui pose chaque état de ses maquettes choisies à côté de la maquette du jour.

- [ ] G1: la page est lisible (PUBLIER.md)
  CHECK: node scripts/agents/verifier-page.mjs work/refonte-frontend/v4/outils/pages/2026-10-24-etats/index.html --page-lot --captures work/refonte-frontend/v4/outils/pages/2026-10-24-etats/verif
  EXPECT: PAGE OK
  EVIDENCE: pending

- [ ] G2: chaque état de chaque relevé est dans la page, et chaque image citée existe
  CHECK: node -e "const fs=require('fs');const d='work/refonte-frontend/v4/outils/pages/2026-10-24-etats/';const e='work/refonte-frontend/v4/choix/etats/';const t=fs.readFileSync(d+'index.html','utf8');const ids=fs.readdirSync(e).filter(f=>f.endsWith('.json')).flatMap(f=>JSON.parse(fs.readFileSync(e+f,'utf8')).etats.map(s=>s.id));const manque=ids.filter(i=>!t.includes(i));const imgs=[...t.matchAll(/src=\"(img\/[^\"]+)\"/g)].map(m=>m[1]);const absentes=imgs.filter(s=>!fs.existsSync(d+s));const ok=!manque.length&&!absentes.length&&imgs.length>=230;console.log(ok?['ETATS','PAGE',ids.length,imgs.length].join('-'):'PAGE ECHEC manque '+manque.slice(0,5).join(',')+' ('+manque.length+') images absentes '+absentes.length+' sur '+imgs.length);process.exit(ok?0:1)"
  EXPECT: ETATS-PAGE-128
  EVIDENCE: pending
