# Gates: voie sb — Port de la feuille Brasser d1b et de Créer c2a

OWNS: src/ui/production/brasser/, src/ui/production/creer/, src/components/QuickActionModal.tsx, src/App.tsx, src/domain/fabActions.ts, src/components/tabs/ProductionTab.tsx, src/ui/production/recettes/, tests/unit/port-sb-, tests/integration/, work/missions/2026-11-14-brassins/voies/sb/

Scope: maquettes d1b, c2a portées telles quelles, typées, testées, capturées côte à côte.

- [ ] G1: types
  CHECK: node -e "const r=require('child_process').spawnSync('npx tsc --noEmit',{shell:true}).stdout.toString().split(String.fromCharCode(10)).filter(l=>/error TS/.test(l)&&!l.startsWith('functions/'));console.log(r.length?'TSC KO '+r.length:'TSC OK')"
  EXPECT: TSC OK
  EVIDENCE: pending

- [ ] G2: tests du port
  CHECK: npx vitest run port-sb --reporter=dot && echo TESTS OK
  EXPECT: TESTS OK
  EVIDENCE: pending

- [ ] G3: captures de l'app pour chaque maquette, inventaire écrit
  CHECK: node -e "const fs=require('fs'),d='work/missions/2026-11-14-brassins/voies/sb';const c=fs.existsSync(d+'/captures')?fs.readdirSync(d+'/captures'):[];const miss=['d1b','c2a'].filter(v=>!c.some(f=>f.startsWith(v+'-')&&f.includes('-app-390-clair')));console.log(!miss.length&&fs.existsSync(d+'/INVENTAIRE.md')?'CAPTURES OK':'CAPTURES KO '+miss.join(','))"
  EXPECT: CAPTURES OK
  EVIDENCE: pending

- [ ] G4: aucune écriture hors de la voie
  CHECK: node -e "const ok=['src/ui/production/brasser/','src/ui/production/creer/','src/components/QuickActionModal.tsx','src/App.tsx','src/domain/fabActions.ts','src/components/tabs/ProductionTab.tsx','src/ui/production/recettes/'].concat(['work/missions/2026-11-14-brassins/voies/sb/','work/missions/2026-11-14-brassins/']);const o=require('child_process').execSync('git status --short src').toString().split(String.fromCharCode(10)).filter(Boolean).map(l=>l.slice(3)).filter(f=>!ok.some(k=>f.startsWith(k)));console.log(o.length?'HORS ? '+o.join(' | '):'HORS OK')"
  EXPECT: HORS OK
  EVIDENCE: pending
