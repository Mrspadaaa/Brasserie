# Gates: voie f4 — Volumes alignés

OWNS: work/missions/2026-11-14-brassins/voies/f4/

Scope: aucun volume impossible ou incohérent dans e1 à e11, images à jour.

- [ ] G1: plus aucun des volumes relevés hors e10
  CHECK: node -e "const fs=require('fs'),V='work/missions/2026-11-14-brassins/voies';const bad=[];for(let i=1;i<=11;i++){if(i===10)continue;const s=V+'/e'+i;for(const x of fs.readdirSync(s).filter(x=>/^e\d+[a-d]$/.test(x))){const t=fs.readFileSync(s+'/'+x+'/etat.html','utf8');for(const k of ['31,5 L','102,5 L','29,9 L','43 L','45 L','47 L','51,9 L','54,5 L','55,5 L'])if(t.includes(k))bad.push(x+':'+k)}}console.log(bad.length?'VOLUMES KO '+bad.join(' '):'VOLUMES OK')"
  EXPECT: VOLUMES OK
  EVIDENCE: pending

- [ ] G2: chaque image plus récente que son etat.html
  CHECK: node -e "const fs=require('fs'),V='work/missions/2026-11-14-brassins/voies';const old=[];for(let i=1;i<=11;i++){const s=V+'/e'+i;for(const x of fs.readdirSync(s).filter(x=>/^e\d+[a-d]$/.test(x))){const h=fs.statSync(s+'/'+x+'/etat.html').mtimeMs;for(const f of fs.readdirSync(s+'/'+x).filter(f=>f.endsWith('.png')))if(fs.statSync(s+'/'+x+'/'+f).mtimeMs<h)old.push(x+'/'+f)}}console.log(old.length?'IMAGES KO '+old.join(' '):'IMAGES OK')"
  EXPECT: IMAGES OK
  EVIDENCE: pending

- [ ] G3: aucune écriture hors de la mission
  CHECK: node -e "const o=require('child_process').execSync('git status --short').toString().split(String.fromCharCode(10)).filter(Boolean).filter(l=>!l.includes('work/missions/2026-11-14-brassins/')&&!l.includes('SPEC-BRASSEUR'));console.log(o.length?'HORS KO '+o.join(' | '):'HORS OK')"
  EXPECT: HORS OK
  EVIDENCE: pending
