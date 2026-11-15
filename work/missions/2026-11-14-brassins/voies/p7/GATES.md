# Gates: voie p7 — Les 4 derniers bloquants

OWNS: src/ui/BatchDetailSheet.tsx, src/ui/production/fiche/, src/App.tsx, src/ui/production/CatalogAnalysis.tsx, src/ui/production/BatchOutcomeAnalysis.tsx, src/ui/production/bilan/, src/ui/production/ProductionCatalog.tsx, src/components/tabs/ProductionTab.tsx, src/ui/FloatingActions.tsx, src/domain/fabActions.ts, tests/unit/, work/missions/2026-11-14-brassins/voies/p7/

Scope: bloquants de kp corrigés pour e2a, e4c, e7a, e11a, typé, testé, capturé.

- [ ] G1: chaque bloquant coché
  CHECK: node -e "const fs=require('fs');const v=fs.readFileSync('work/missions/2026-11-14-brassins/voies/kp2/VERDICT.md','utf8').split(/^(?=## )/m).filter(s=>['e2a','e4c','e7a','e11a'].some(i=>s.startsWith('## '+i+' ')));const n=v.reduce((a,s)=>a+(s.match(/^\d+\. \[B\]/gm)||[]).length,0);const t=fs.readFileSync('work/missions/2026-11-14-brassins/voies/p7/RESULTAT.md','utf8');const c=(t.match(/- \[x\] [a-z0-9]+ n°/gi)||[]).length;console.log(c>=n?'COCHE OK '+c+'/'+n:'COCHE KO '+c+'/'+n)"
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
