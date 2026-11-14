# Gates: voie s7 — Série G4 — Le dry hop en question, à la Dryhopper

OWNS: work/missions/2026-11-14-brassins/voies/s7/

Scope: 3 mini maquettes statiques, repos et après un geste.

- [ ] G1: 3 variantes, chacune avec repos, geste et NOTE.md portant sa chaleur
  CHECK: node -e "const fs=require('fs'),d='work/missions/2026-11-14-brassins/voies/s7';const v=fs.readdirSync(d).filter(x=>/^s7[a-c]$/.test(x));const ok=v.length===3&&v.every(x=>{const f=fs.readdirSync(d+'/'+x);return f.some(n=>n.includes('repos-390'))&&f.some(n=>n.includes('geste-390'))&&/froide|tiède|chaude/.test(fs.readFileSync(d+'/'+x+'/NOTE.md','utf8'))});console.log(ok?'SERIE OK':'SERIE KO '+v.join(','))"
  EXPECT: SERIE OK
  EVIDENCE: pending

- [ ] G2: une liste, une cave, un 1280, une chaude
  CHECK: node -e "const fs=require('fs'),d='work/missions/2026-11-14-brassins/voies/s7';const vs=fs.readdirSync(d).filter(x=>/^s7[a-c]$/.test(x));const all=vs.flatMap(x=>fs.readdirSync(d+'/'+x));const n=k=>all.filter(f=>f.includes(k)&&f.endsWith('.png')).length;const ch=vs.filter(x=>/chaude/.test(fs.readFileSync(d+'/'+x+'/NOTE.md','utf8'))).length;console.log(n('liste-390')>=1&&n('-cave')>=1&&n('-1280')>=1&&ch>=1?'ETATS OK':'ETATS KO')"
  EXPECT: ETATS OK
  EVIDENCE: pending

- [ ] G3: aucune écriture hors de la mission
  CHECK: node -e "const o=require('child_process').execSync('git status --short').toString().split(String.fromCharCode(10)).filter(Boolean).filter(l=>!l.includes('work/missions/2026-11-14-brassins/')&&!l.includes('SPEC-BRASSEUR'));console.log(o.length?'HORS KO '+o.join(' | '):'HORS OK')"
  EXPECT: HORS OK
  EVIDENCE: pending
