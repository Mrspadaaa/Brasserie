# Gates: voie pg4 — Pages à jour

OWNS: work/missions/2026-11-14-brassins/voies/pg4/

Scope: toutes les images des variantes sur leur page, deux pages lisibles.

- [ ] G1: chaque PNG de variante est sur sa page, et la mention du rhabillage est en tête
  CHECK: node -e "const fs=require('fs'),M='work/missions/2026-11-14-brassins',V=M+'/voies';const miss=[];for(const s of fs.readdirSync(V).filter(x=>/^(e\d+|s[4-7])$/.test(x))){const pg=s.startsWith('s')?'page2':'page3';const t=fs.readFileSync(M+'/'+pg+'/index.html','utf8');for(const v of fs.readdirSync(V+'/'+s).filter(x=>/^[es]\d+[a-d]$/.test(x)))for(const f of fs.readdirSync(V+'/'+s+'/'+v).filter(f=>f.endsWith('.png')))if(!t.includes('img/'+f)||!fs.existsSync(M+'/'+pg+'/img/'+f))miss.push(f)}const ok=['page2','page3'].every(p=>fs.readFileSync(M+'/'+p+'/index.html','utf8').includes('identité de l'+String.fromCharCode(39)+'app'));console.log(!miss.length&&ok?'PAGES OK':'PAGES KO '+miss.length+' '+miss.slice(0,5).join(' '))"
  EXPECT: PAGES OK
  EVIDENCE: pending

- [ ] G2: la page 2 passe le contrôle de lisibilité
  CHECK: node scripts/agents/verifier-page.mjs work/missions/2026-11-14-brassins/page2/index.html --page-lot --captures work/missions/2026-11-14-brassins/voies/pg4/verif2
  EXPECT: PAGE OK
  EVIDENCE: pending

- [ ] G3: la page 3 passe le contrôle de lisibilité
  CHECK: node scripts/agents/verifier-page.mjs work/missions/2026-11-14-brassins/page3/index.html --page-lot --captures work/missions/2026-11-14-brassins/voies/pg4/verif3
  EXPECT: PAGE OK
  EVIDENCE: pending
