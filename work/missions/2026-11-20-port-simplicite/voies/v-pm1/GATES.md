# Gates: voie v-pm1 — pm1 — le palier appelle la mesure

OWNS: src/ui/BrewThermalControl.tsx, src/ui/brassage/AppelMesure.tsx, src/pages/BrewDayPage.tsx, src/domain/appelMesure.ts, tests/unit/appelMesure.test.ts, tests/unit/appelMesureVue.test.tsx, work/missions/2026-11-20-port-simplicite/voies/v-pm1/

Scope: Au palier d'empâtage du jour J : la carte warn « Température du palier · à relever » avec un curseur posé sur la cible (repère vert), « 67 °C · proposé, à confirmer » ; la carte « pH d'empâtage · à 15′ » au curseur sur la cible, « 5,3 · cible 5,2 à 5,4 » ; « Relever » et « Plus tard ». Rien n'est noté sans son toucher.

- [ ] G1: les tests de la voie passent
  CHECK: npx vitest run tests/unit/appelMesure.test.ts tests/unit/appelMesureVue.test.tsx --reporter=dot
  EXPECT: passed
  EVIDENCE: pending

- [ ] G2: l'inventaire de la maquette et les écarts par capture sont écrits
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-11-20-port-simplicite/voies/v-pm1/RESULTAT.md','utf8');process.stdout.write(/Inventaire/i.test(t)&&/écarts/i.test(t)?'RESULTAT OK':'RESULTAT KO')"
  EXPECT: RESULTAT OK
  EVIDENCE: pending

- [ ] G3: au moins 8 captures (390 et 1280, clair et cave, deux états)
  CHECK: node -e "const fs=require('fs');const n=fs.existsSync('work/missions/2026-11-20-port-simplicite/voies/v-pm1/captures')?fs.readdirSync('work/missions/2026-11-20-port-simplicite/voies/v-pm1/captures').filter(f=>f.endsWith('.png')).length:0;process.stdout.write(n>=8?'CAPTURES OK':'CAPTURES KO '+n)"
  EXPECT: CAPTURES OK
  EVIDENCE: pending
