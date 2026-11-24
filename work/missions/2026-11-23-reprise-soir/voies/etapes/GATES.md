# Gates: voie etapes — étapes de lecture d'un lien

OWNS: src/ui/carnets, src/domain/carnets, src/services/aiClient.ts, src/design/CarnetsPreview.tsx, scripts/controles/controle-etapes-dense.mjs

Scope: porter CHOIX.md (D448) plus dense, et T26-4

- [ ] G1: types sans erreur neuve
  CHECK: npx tsc --noEmit -p . 2>&1 | grep 'error TS' | grep -v 'seedData\|pwa-register' | wc -l | sed 's/^ *0$/TSC OK/'
  EXPECT: TSC OK
  EVIDENCE: pending

- [ ] G2: tests carnets verts
  CHECK: npx vitest run tests/unit/carnets --reporter=dot 2>&1 | grep -E 'Tests .*passed' | grep -qv failed && echo TESTS OK
  EXPECT: TESTS OK
  EVIDENCE: pending

- [ ] G3: densité contrôlée, témoin rouge sur v01
  CHECK: node scripts/controles/controle-etapes-dense.mjs 2>&1 | tail -3
  EXPECT: OK
  EVIDENCE: pending

- [ ] G4: planches côte à côte des 5 écrans et de T26-4
  CHECK: ls work/missions/2026-11-23-reprise-soir/voies/etapes/captures/*.png | wc -l | awk '$1>=6{print "CAPTURES OK"}'
  EXPECT: CAPTURES OK
  EVIDENCE: pending
