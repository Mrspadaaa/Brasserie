# Gates: voie g6f — Corrections de k6

OWNS: work/missions/2026-11-14-brassins/voies/g6f/

Scope: bloquants de k6 corrigés, images régénérées.

- [ ] G1: chaque bloquant coché
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-11-14-brassins/voies/g6f/RESULTAT.md','utf8');const n=(t.match(/- \[x\] [a-z]+\d*[a-z]*[a-d] n°/gi)||[]).length;console.log(n>=9?'COCHE OK '+n:'COCHE KO '+n)"
  EXPECT: COCHE OK
  EVIDENCE: pending

- [ ] G2: images des variantes corrigées plus récentes que le verdict
  CHECK: node -e "const fs=require('fs'),M='work/missions/2026-11-14-brassins/voies';const v=fs.statSync(M+'/k6/VERDICT.md').mtimeMs;const old=['g6a','g6b','e5na','e5nb','e5nc'].flatMap(x=>{const d=M+'/'+x.slice(0,-1)+'/'+x;return fs.readdirSync(d).filter(f=>f.endsWith('.png')).filter(f=>fs.statSync(d+'/'+f).mtimeMs<v).map(f=>x+'/'+f)});console.log(old.length?'IMAGES KO '+old.join(' '):'IMAGES OK')"
  EXPECT: IMAGES OK
  EVIDENCE: pending

- [ ] G3: aucune écriture hors de la mission
  CHECK: node -e "const o=require('child_process').execSync('git status --short').toString().split(String.fromCharCode(10)).filter(Boolean).filter(l=>!l.includes('work/missions/2026-11-14-brassins/')&&!l.includes('SPEC-BRASSEUR'));console.log(o.length?'HORS KO '+o.join(' | '):'HORS OK')"
  EXPECT: HORS OK
  EVIDENCE: pending
