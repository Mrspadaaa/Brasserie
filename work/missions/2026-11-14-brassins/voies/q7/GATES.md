# Gates: voie q7 — Corriger le port

OWNS: src/components/CreativeLabTab.tsx, src/ui/atelier/, tests/unit/, work/missions/2026-11-14-brassins/voies/q7/

Scope: bloquants de kp corrigés pour e9na, typé, testé, capturé.

- [ ] G1: chaque bloquant coché
  CHECK: node -e "const fs=require('fs');const v=fs.readFileSync('work/missions/2026-11-14-brassins/voies/kq/VERDICT.md','utf8').split(/^(?=## )/m).filter(s=>['e9na'].some(i=>s.startsWith('## '+i+' ')));const n=v.reduce((a,s)=>a+(s.match(/^\d+\. \[B\]/gm)||[]).length,0);const t=fs.readFileSync('work/missions/2026-11-14-brassins/voies/q7/RESULTAT.md','utf8');const c=(t.match(/- \[x\] [a-z0-9]+ n°/gi)||[]).length;console.log(c>=n?'COCHE OK '+c+'/'+n:'COCHE KO '+c+'/'+n)"
  EXPECT: COCHE OK
  EVIDENCE: pending

- [ ] G2: types
  CHECK: node -e "const r=require('child_process').spawnSync('npx tsc --noEmit',{shell:true}).stdout.toString().split(String.fromCharCode(10)).filter(l=>/error TS/.test(l)&&!l.startsWith('functions/'));console.log(r.length?'TSC KO '+r.length:'TSC OK')"
  EXPECT: TSC OK
  EVIDENCE: pending

- [ ] G3: tests du port
  CHECK: npx vitest run port- --reporter=dot && echo TESTS OK
  EXPECT: TESTS OK
  EVIDENCE: pending
