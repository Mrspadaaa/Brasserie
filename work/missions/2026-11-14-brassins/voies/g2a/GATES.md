# Gates: voie g2a — Corrections de k2

OWNS: work/missions/2026-11-14-brassins/voies/g2a/

Scope: bloquants de k2 corrigés, images régénérées.

- [ ] G1: chaque bloquant coché
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-11-14-brassins/voies/g2a/RESULTAT.md','utf8');const n=(t.match(/- \[x\] [es]\d+[a-d] n°/gi)||[]).length;console.log(n>=8?'COCHE OK '+n:'COCHE KO '+n)"
  EXPECT: COCHE OK
  EVIDENCE: pending

- [ ] G2: images des variantes corrigées plus récentes que le verdict
  CHECK: node -e "const fs=require('fs'),M='work/missions/2026-11-14-brassins/voies';const v=fs.statSync(M+'/k2/VERDICT.md').mtimeMs;const old=['e5a','e5b','e5d','e6b','e6c','e6d'].flatMap(x=>{const d=M+'/'+x.slice(0,-1)+'/'+x;return fs.readdirSync(d).filter(f=>f.endsWith('.png')).filter(f=>fs.statSync(d+'/'+f).mtimeMs<v).map(f=>x+'/'+f)});console.log(old.length?'IMAGES KO '+old.join(' '):'IMAGES OK')"
  EXPECT: IMAGES OK
  EVIDENCE: pending

- [ ] G3: aucune écriture hors de la mission
  CHECK: node -e "const o=require('child_process').execSync('git status --short').toString().split(String.fromCharCode(10)).filter(Boolean).filter(l=>!l.includes('work/missions/2026-11-14-brassins/')&&!l.includes('SPEC-BRASSEUR'));console.log(o.length?'HORS KO '+o.join(' | '):'HORS OK')"
  EXPECT: HORS OK
  EVIDENCE: pending
