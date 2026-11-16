# Gates: voie e3 — Le carnet et le dossier d'un brassin

OWNS: work/missions/2026-11-14-brassins/voies/e3/

Scope: 4 mini maquettes statiques, repos et après un geste.

- [ ] G1: 4 variantes, chacune avec repos, geste et NOTE.md portant sa chaleur et son idée
  CHECK: node -e "const fs=require('fs'),d='work/missions/2026-11-14-brassins/voies/e3';const v=fs.readdirSync(d).filter(x=>/^e3[a-d]$/.test(x));const ok=v.length===4&&v.every(x=>{const f=fs.readdirSync(d+'/'+x);const n=fs.readFileSync(d+'/'+x+'/NOTE.md','utf8');return f.some(k=>k.includes('repos-390'))&&f.some(k=>k.includes('geste-390'))&&/froide|tiède|chaude/.test(n)&&/Idée/.test(n)});console.log(ok?'SERIE OK':'SERIE KO '+v.join(','))"
  EXPECT: SERIE OK
  EVIDENCE: pending

- [ ] G2: une cave, un 1280, une chaude, les états en plus
  CHECK: node -e "const fs=require('fs'),d='work/missions/2026-11-14-brassins/voies/e3';const vs=fs.readdirSync(d).filter(x=>/^e3[a-d]$/.test(x));const all=vs.flatMap(x=>fs.readdirSync(d+'/'+x));const n=k=>all.filter(f=>f.includes(k)&&f.endsWith('.png')).length;const ch=vs.filter(x=>/chaude/.test(fs.readFileSync(d+'/'+x+'/NOTE.md','utf8'))).length;const plus=['dossier-390-clair'].every(p=>n(p)>=4);console.log(n('-cave')>=1&&n('-1280')>=1&&ch>=1&&plus?'ETATS OK':'ETATS KO')"
  EXPECT: ETATS OK
  EVIDENCE: pending

- [ ] G3: aucune écriture hors de la mission
  CHECK: node -e "const o=require('child_process').execSync('git status --short').toString().split(String.fromCharCode(10)).filter(Boolean).filter(l=>!l.includes('work/missions/2026-11-14-brassins/')&&!l.includes('SPEC-BRASSEUR'));console.log(o.length?'HORS KO '+o.join(' | '):'HORS OK')"
  EXPECT: HORS OK
  EVIDENCE: pending
