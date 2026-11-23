# Gates: voie pg-choix — la page « Choix de vues · 24.10 »

OWNS: work/refonte-frontend/v4/outils/pages/2026-10-24-choix-vues/**, work/missions/2026-10-23-maquette-parcours/voies/pg-choix/RESULTAT.md

Scope: une page lisible au téléphone qui montre chaque choix ouvert en mini maquettes côte à côte avec sa référence.

- [ ] G1: la page est lisible (PUBLIER.md)
  CHECK: node scripts/agents/verifier-page.mjs work/refonte-frontend/v4/outils/pages/2026-10-24-choix-vues/index.html --page-lot --captures work/refonte-frontend/v4/outils/pages/2026-10-24-choix-vues/verif
  EXPECT: PAGE OK
  EVIDENCE: pending

- [ ] G2: les sept sections et le panel sont là, chaque image existe
  CHECK: node -e "const fs=require('fs');const d='work/refonte-frontend/v4/outils/pages/2026-10-24-choix-vues/';const t=fs.readFileSync(d+'index.html','utf8');const ids=['p4a4','p4b2','p4a3','sbc1b','sbz7c','flc8b','flb3c','psa','lva','gr1','gr6','a-choisir'];const manque=ids.filter(i=>!t.includes(i));const imgs=[...t.matchAll(/src=\"(img\/[^\"]+)\"/g)].map(m=>m[1]);const absentes=imgs.filter(s=>!fs.existsSync(d+s));console.log(!manque.length&&!absentes.length&&imgs.length>=100?['CHOIX','BIEN',imgs.length].join('-'):'CHOIX ECHEC manque '+manque.join(',')+' images absentes '+absentes.length+' sur '+imgs.length);process.exit(!manque.length&&!absentes.length&&imgs.length>=100?0:1)"
  EXPECT: CHOIX-BIEN
  EVIDENCE: pending
