# Gates: voie frise — cœur de la frise (D444)

OWNS: src/ui/calendrier, src/domain/calendrier.ts, e2e/calendrier (dans la copie lot-cal)

Scope: état unique, échelle d3, test par modèle

- [ ] G1: types dans lot-cal
  CHECK: cd ../lot-cal && npx tsc --noEmit -p . 2>&1 | grep -c 'error TS' | sed 's/^0$/TSC OK/'
  EXPECT: TSC OK
  EVIDENCE: pending

- [ ] G2: inventaire écrit
  CHECK: test -s work/missions/2026-11-23-reprise-soir/voies/frise/INVENTAIRE.md && echo INVENTAIRE OK
  EXPECT: INVENTAIRE OK
  EVIDENCE: pending

- [ ] G3: prêt à mettre en ligne
  CHECK: grep -q 'PRÊT À METTRE EN LIGNE' work/missions/2026-11-23-reprise-soir/voies/frise/RESULTAT.md && echo PRET OK
  EXPECT: PRET OK
  EVIDENCE: pending
