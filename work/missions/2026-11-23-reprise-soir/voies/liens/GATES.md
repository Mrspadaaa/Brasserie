# Gates: voie liens — petits défauts de la lecture des liens

OWNS: functions/src, src/ui/carnets/FicheArticle.tsx, src/ui/carnets/fiche-article.css

Scope: T25-8, T26-1, T26-2, T26-3 et escalade

- [ ] G1: types des fonctions
  CHECK: cd functions && npx tsc --noEmit && echo FN OK
  EXPECT: FN OK
  EVIDENCE: pending

- [ ] G2: tests liens verts
  CHECK: npx vitest run tests/unit/carnetsLireLien.test.ts tests/unit/carnetsLecturesLiens.test.ts --reporter=dot 2>&1 | grep -E 'Tests .*passed' | grep -qv failed && echo TESTS OK
  EXPECT: TESTS OK
  EVIDENCE: pending

- [ ] G3: types racine
  CHECK: npx tsc --noEmit -p . 2>&1 | grep 'error TS' | grep -v 'seedData\|pwa-register' | wc -l | sed 's/^ *0$/TSC OK/'
  EXPECT: TSC OK
  EVIDENCE: pending
