# Gates: voie p3 — Port de la coque de l'onglet (e11a) et d'Adapter les volumes (e10c), filtre de période

OWNS: src/ui/BatchDetailSheet.tsx, src/ui/production/BatchSchedule.tsx, src/ui/production/BatchPackagingForm.tsx, src/ui/production/fiche/, tests/unit/port-p1-, src/ui/production/CatalogAnalysis.tsx, src/ui/production/BatchOutcomeAnalysis.tsx, src/ui/production/bilan/, tests/unit/port-p2-, src/components/tabs/ProductionTab.tsx, src/ui/production/volumes/, tests/unit/port-p3-, src/App.tsx, work/missions/2026-11-14-brassins/voies/p3/

Scope: maquettes e11a, e10c portées telles quelles, typées, testées, capturées côte à côte.

- [ ] G1: types
  CHECK: node -e "const r=require('child_process').spawnSync('npx tsc --noEmit',{shell:true}).stdout.toString().split(String.fromCharCode(10)).filter(l=>/error TS/.test(l)&&!l.startsWith('functions/'));console.log(r.length?'TSC KO '+r.length:'TSC OK')"
  EXPECT: TSC OK
  EVIDENCE: pending

- [ ] G2: tests du port
  CHECK: npx vitest run port-p3 --reporter=dot && echo TESTS OK
  EXPECT: TESTS OK
  EVIDENCE: pending

- [ ] G3: captures de l'app pour chaque maquette, inventaire écrit
  CHECK: node -e "const fs=require('fs'),d='work/missions/2026-11-14-brassins/voies/p3';const c=fs.existsSync(d+'/captures')?fs.readdirSync(d+'/captures'):[];const miss=['e11a','e10c'].filter(v=>!c.some(f=>f.startsWith(v+'-')&&f.includes('-app-390-clair')));console.log(!miss.length&&fs.existsSync(d+'/INVENTAIRE.md')?'CAPTURES OK':'CAPTURES KO '+miss.join(','))"
  EXPECT: CAPTURES OK
  EVIDENCE: pending

- [ ] G4: aucune écriture hors de la voie
  CHECK: node -e "const ok=['src/ui/BatchDetailSheet.tsx','src/ui/production/BatchSchedule.tsx','src/ui/production/BatchPackagingForm.tsx','src/ui/production/fiche/','tests/unit/port-p1-','src/ui/production/CatalogAnalysis.tsx','src/ui/production/BatchOutcomeAnalysis.tsx','src/ui/production/bilan/','tests/unit/port-p2-','src/components/tabs/ProductionTab.tsx','src/ui/production/volumes/','tests/unit/port-p3-','src/App.tsx'].concat(['work/missions/2026-11-14-brassins/voies/p3/','work/missions/2026-11-14-brassins/']);const o=require('child_process').execSync('git status --short src').toString().split(String.fromCharCode(10)).filter(Boolean).map(l=>l.slice(3)).filter(f=>!ok.some(k=>f.startsWith(k)));console.log(o.length?'HORS ? '+o.join(' | '):'HORS OK')"
  EXPECT: HORS OK
  EVIDENCE: pending
