# Gates: voie r4d-tri — tri des 48 propositions « épicé »

OWNS: work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/tri/**, work/missions/2026-10-22-reprise-lot21/voies/r4d-tri/RESULTAT.md

Scope: un fichier par série, une SYNTHESE en trois sections (Classement, Candidates, Greffes) ; 8 candidates, toutes des épices réelles, 6 épices différentes dont cannelle, vanille et girofle, venues de 3 séries ; sans REJET.

- [ ] G1: la SYNTHESE a ses trois sections
  CHECK: node scripts/agents/systeme.mjs note work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/tri/SYNTHESE.md --contient "## Classement,## Candidates,## Greffes"
  EXPECT: NOTE OK
  EVIDENCE:

- [ ] G2: 8 candidates au format, 3 séries, 6 épices différentes, dont cannelle, vanille et girofle
  CHECK: node -e "const t=require('fs').readFileSync('work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/tri/SYNTHESE.md','utf8'); const c=[...t.matchAll(/^- [*][*]([a-f][0-9][\w-]*)[*][*] [(]s.rie ([A-F]), .pice ([^)]+)[)].*CANDIDATE/gim)]; const s=new Set(c.map(m=>m[2].toUpperCase())); const e=new Set(c.map(m=>m[3].trim().toLowerCase().replace(/^clou de /,''))); const l=[...e].join(' '); const ok=c.length===8 && s.size>=3 && e.size>=6 && /cannelle/.test(l) && /vanille/.test(l) && /girofle/.test(l); console.log(ok?'SYNTHESE OK (8 candidates, '+s.size+' series, '+e.size+' epices)':'SYNTHESE ECHEC '+c.length+' candidates, '+s.size+' series, epices : '+l); process.exit(ok?0:1)"
  EXPECT: /SYNTHESE OK \(8 candidates/
  EVIDENCE:

- [ ] G3: chaque candidate existe dans sa série et y déclare son épice réelle
  CHECK: node -e "const fs=require('fs'); const t=fs.readFileSync('work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/tri/SYNTHESE.md','utf8'); const c=[...t.matchAll(/^- [*][*]([a-f][0-9][\w-]*)[*][*] [(]/gm)].map(m=>m[1]); const ko=c.filter(id=>{ const h=fs.readFileSync('work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-'+id[0]+'/v0/etat.html','utf8'); const tag=(h.match(new RegExp('<[^>]*data-variante=.'+id+'.[^>]*>'))||[''])[0]; return !/data-epice=/.test(tag); }); console.log(ko.length?'IDS ECHEC '+ko.join(', '):'IDS OK ('+c.length+')'); process.exit(ko.length?1:0)"
  EXPECT: IDS OK
  EVIDENCE:

- [ ] G4: aucun REJET, un fichier par série
  CHECK: node -e "const fs=require('fs'); const f=['SYNTHESE','serie-a','serie-b','serie-c','serie-d','serie-e','serie-f'].map(n=>'work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/tri/'+n+'.md'); const absents=f.filter(x=>!fs.existsSync(x)); const rejet=f.filter(x=>fs.existsSync(x) && /REJET/.test(fs.readFileSync(x,'utf8'))); const ok=!absents.length && !rejet.length; console.log(ok?'TRI OK':'TRI ECHEC absents '+absents.join(' ')+' rejets '+rejet.join(' ')); process.exit(ok?0:1)"
  EXPECT: TRI OK
  EVIDENCE:

- [ ] G5: le rapport cite les captures ouvertes des six séries
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r4d-tri/RESULTAT.md --contient "serie-a,serie-b,serie-c,serie-d,serie-e,serie-f,planche-390.png,cartes-390.png,LEÇON PROPOSÉE"
  EXPECT: NOTE OK
  EVIDENCE:
