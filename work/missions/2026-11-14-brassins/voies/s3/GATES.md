# Gates: voie s3 — Série C — L'écart au prévu

OWNS: work/missions/2026-11-14-brassins/voies/s3/

Scope: 5 mini maquettes statiques, repos et après un geste.

- [ ] G1: 5 variantes, chacune avec repos, geste et NOTE.md portant sa chaleur
  CHECK: node -e "const fs=require('fs'),d='work/missions/2026-11-14-brassins/voies/s3';const v=fs.readdirSync(d).filter(x=>/^s3[a-e]$/.test(x));const ok=v.length===5&&v.every(x=>{const f=fs.readdirSync(d+'/'+x);return f.some(n=>n.includes('repos-390'))&&f.some(n=>n.includes('geste-390'))&&/froide|tiède|chaude/.test(fs.readFileSync(d+'/'+x+'/NOTE.md','utf8'))});console.log(ok?'SERIE OK':'SERIE KO '+v.join(','))"
  EXPECT: SERIE OK
  EVIDENCE: pending

- [ ] G2: deux listes, deux caves, deux 1280, au moins deux chaudes
  CHECK: node -e "const fs=require('fs'),d='work/missions/2026-11-14-brassins/voies/s3';const all=fs.readdirSync(d).filter(x=>/^s3[a-e]$/.test(x)).flatMap(x=>fs.readdirSync(d+'/'+x));const n=k=>all.filter(f=>f.includes(k)&&f.endsWith('.png')).length;const ch=fs.readdirSync(d).filter(x=>/^s3[a-e]$/.test(x)).filter(x=>/chaude/.test(fs.readFileSync(d+'/'+x+'/NOTE.md','utf8'))).length;console.log(n('liste-390')>=2&&n('-cave')>=2&&n('-1280')>=2&&ch>=2?'ETATS OK':'ETATS KO')"
  EXPECT: ETATS OK
  EVIDENCE: pending

- [ ] G3: aucune écriture hors de la mission
  CHECK: node -e "const o=require('child_process').execSync('git status --short').toString().split('\n').filter(Boolean).filter(l=>!l.includes('work/missions/2026-11-14-brassins/'));console.log(o.length?'HORS KO '+o.join(' | '):'HORS OK')"
  EXPECT: HORS OK
  EVIDENCE: pending
