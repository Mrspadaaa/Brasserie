# Gates: voie s1 — Port du carnet de recettes (r2a), et du geste « Brasser » de c2a

OWNS: src/ui/production/recettes/, src/ui/production/ProductionCatalog.tsx, src/components/tabs/ProductionTab.tsx, src/domain/fabActions.ts, tests/unit/port-s1-, work/missions/2026-11-14-brassins/voies/s1/

Scope: maquettes r2a, c2a portées telles quelles, typées, testées, capturées côte à côte.

- [ ] G1: types
  CHECK: node -e "const r=require('child_process').spawnSync('npx tsc --noEmit',{shell:true}).stdout.toString().split(String.fromCharCode(10)).filter(l=>/error TS/.test(l)&&!l.startsWith('functions/'));console.log(r.length?'TSC KO '+r.length:'TSC OK')"
  EXPECT: TSC OK
  EVIDENCE: pending

- [ ] G2: tests du port
  CHECK: npx vitest run port-s1 --reporter=dot && echo TESTS OK
  EXPECT: TESTS OK
  EVIDENCE: pending

- [ ] G3: captures de l'app pour chaque maquette, inventaire écrit
  CHECK: node -e "const fs=require('fs'),d='work/missions/2026-11-14-brassins/voies/s1';const c=fs.existsSync(d+'/captures')?fs.readdirSync(d+'/captures'):[];const miss=['r2a','c2a'].filter(v=>!c.some(f=>f.startsWith(v+'-')&&f.includes('-app-390-clair')));console.log(!miss.length&&fs.existsSync(d+'/INVENTAIRE.md')?'CAPTURES OK':'CAPTURES KO '+miss.join(','))"
  EXPECT: CAPTURES OK
  EVIDENCE: pending

- [ ] G4: aucune écriture hors de la voie
  CHECK: node -e "const ok=['src/ui/production/recettes/','src/ui/production/ProductionCatalog.tsx','src/components/tabs/ProductionTab.tsx','src/domain/fabActions.ts','tests/unit/port-s1-'].concat(['work/missions/2026-11-14-brassins/voies/s1/','work/missions/2026-11-14-brassins/']);const o=require('child_process').execSync('git status --short src').toString().split(String.fromCharCode(10)).filter(Boolean).map(l=>l.slice(3)).filter(f=>!ok.some(k=>f.startsWith(k)));console.log(o.length?'HORS ? '+o.join(' | '):'HORS OK')"
  EXPECT: HORS OK
  EVIDENCE: pending
