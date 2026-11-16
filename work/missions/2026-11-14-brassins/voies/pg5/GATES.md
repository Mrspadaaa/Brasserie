# Gates: voie pg5 — Page des choix et de la suite

OWNS: work/missions/2026-11-14-brassins/page5/

Scope: ses choix retenus, les greffes, Créer un brassin refait, les vues restantes ; lisible.

- [ ] G1: la page passe le contrôle de lisibilité
  CHECK: node scripts/agents/verifier-page.mjs work/missions/2026-11-14-brassins/page5/index.html --page-lot --captures work/missions/2026-11-14-brassins/voies/pg5/verif
  EXPECT: PAGE OK
  EVIDENCE: pending

- [ ] G2: toutes les images des variantes montrées, les retenues, les sections et le choix en tête
  CHECK: node -e "const fs=require('fs'),M='work/missions/2026-11-14-brassins',V=M+'/voies';const t=fs.readFileSync(M+'/page5/index.html','utf8');const ser={gf:'gf[a-d]',g6:'g6[a-c]',e5n:'e5n[a-d]',e2:'e2[a-d]',e3:'e3[a-d]',e8:'e8[a-d]',e9:'e9[a-d]',e10:'e10[a-d]',e11:'e11[a-d]'};const miss=[];for(const [s,re] of Object.entries(ser))for(const v of fs.readdirSync(V+'/'+s).filter(x=>new RegExp('^'+re+'$').test(x)))for(const f of fs.readdirSync(V+'/'+s+'/'+v).filter(f=>f.endsWith('.png')))if(!t.includes('img/'+f)||!fs.existsSync(M+'/page5/img/'+f))miss.push(f);const ok=!miss.length&&['e1a-repos-390-clair.png','e4c-repos-390-clair.png','e7a-repos-390-clair.png','s4a-repos-390-clair.png','s6c-repos-390-clair.png','e6a-repos-390-clair.png','e6c-repos-390-clair.png'].every(f=>t.includes(f))&&['a-choisir','retenues','fiche','filtres','creer','reste'].every(i=>t.includes('id=\"'+i+'\"'))&&!/fable/i.test(t);console.log(ok?'CONTENU OK':'CONTENU KO '+miss.length+' '+miss.slice(0,4).join(' '))"
  EXPECT: CONTENU OK
  EVIDENCE: pending
