# Gates: voie q2 — Port de la liste et de ses filtres (e6a + e6c)

OWNS: src/ui/production/fermentation/, src/ui/production/FermentationCurveChart.tsx, src/ui/production/BatchGravityEntry.tsx, src/ui/BatchDetailSheet.tsx, tests/unit/port-q1-, src/ui/production/ProductionCatalog.tsx, src/ui/production/CatalogCards.tsx, src/ui/production/CatalogToolbar.tsx, src/ui/production/CatalogScopeBar.tsx, src/ui/production/liste/, tests/unit/port-q2-, src/ui/production/carnet/, src/ui/BatchDetailSheet.tsx, tests/unit/port-q3-, src/components/CreativeLabTab.tsx, src/ui/atelier/, tests/unit/port-q4-, work/missions/2026-11-14-brassins/voies/q2/

Scope: maquettes e6a, e6c portées telles quelles, typées, testées, capturées côte à côte.

- [ ] G1: types
  CHECK: node -e "const r=require('child_process').spawnSync('npx tsc --noEmit',{shell:true}).stdout.toString().split(String.fromCharCode(10)).filter(l=>/error TS/.test(l)&&!l.startsWith('functions/'));console.log(r.length?'TSC KO '+r.length:'TSC OK')"
  EXPECT: TSC OK
  EVIDENCE: pending

- [ ] G2: tests du port
  CHECK: npx vitest run port-q2 --reporter=dot && echo TESTS OK
  EXPECT: TESTS OK
  EVIDENCE: pending

- [ ] G3: captures de l'app pour chaque maquette, inventaire écrit
  CHECK: node -e "const fs=require('fs'),d='work/missions/2026-11-14-brassins/voies/q2';const c=fs.existsSync(d+'/captures')?fs.readdirSync(d+'/captures'):[];const miss=['e6a','e6c'].filter(v=>!c.some(f=>f.startsWith(v+'-')&&f.includes('-app-390-clair')));console.log(!miss.length&&fs.existsSync(d+'/INVENTAIRE.md')?'CAPTURES OK':'CAPTURES KO '+miss.join(','))"
  EXPECT: CAPTURES OK
  EVIDENCE: pending

- [ ] G4: aucune écriture hors de la voie
  CHECK: node -e "const ok=['src/ui/production/fermentation/','src/ui/production/FermentationCurveChart.tsx','src/ui/production/BatchGravityEntry.tsx','src/ui/BatchDetailSheet.tsx','tests/unit/port-q1-','src/ui/production/ProductionCatalog.tsx','src/ui/production/CatalogCards.tsx','src/ui/production/CatalogToolbar.tsx','src/ui/production/CatalogScopeBar.tsx','src/ui/production/liste/','tests/unit/port-q2-','src/ui/production/carnet/','src/ui/BatchDetailSheet.tsx','tests/unit/port-q3-','src/components/CreativeLabTab.tsx','src/ui/atelier/','tests/unit/port-q4-'].concat(['work/missions/2026-11-14-brassins/voies/q2/','work/missions/2026-11-14-brassins/']);const o=require('child_process').execSync('git status --short src').toString().split(String.fromCharCode(10)).filter(Boolean).map(l=>l.slice(3)).filter(f=>!ok.some(k=>f.startsWith(k)));console.log(o.length?'HORS ? '+o.join(' | '):'HORS OK')"
  EXPECT: HORS OK
  EVIDENCE: pending
