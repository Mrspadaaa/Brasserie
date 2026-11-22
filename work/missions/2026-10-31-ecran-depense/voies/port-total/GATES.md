# Gates: voie port-total — les frais de port « Total seulement » (D249)

OWNS: src/services/purchaseEntry.ts, functions/src/invoiceScanCore.ts, tests/unit/depense/port/, tests/unit/purchaseEntry.test.ts, scripts/banc-lecture-facture.ts, scripts/banc-lecture-facture-juger.ts, tests/unit/banc-lecture-facture.test.ts, tests/unit/banc-lecture-k5.test.ts, work/missions/2026-11-01-banc-lecture/GESTES.md, work/missions/2026-10-31-ecran-depense/voies/port-total/

Scope: le port (lignes `kind: 'shipping'`) n'est jamais un article de stock, un mouvement, ni une rangée d'écran (sauf un port invalide, qui reste une rangée corrigeable) (il reste une entrée `shipping` de `finance.lines`), compte dans le total et dans le contrôle de somme ; banc corrigé et rejoué hors ligne.

- [ ] G1: la voie est comprise avant le plan
  CHECK: node scripts/agents/systeme.mjs comprendre work/missions/2026-10-31-ecran-depense/voies/port-total
  EXPECT: COMPRIS OK
  EVIDENCE: pending

- [ ] G2: le plan a été relu, sans bloquant laissé
  CHECK: node scripts/agents/systeme.mjs revue work/missions/2026-10-31-ecran-depense/voies/port-total/REVUE-PLAN.md
  EXPECT: REVUE OK
  EVIDENCE: pending

- [ ] G3: les tests du port, de l'enregistrement, de la lecture et du banc passent
  CHECK: npx vitest run tests/unit/depense/port tests/unit/purchaseEntry.test.ts tests/unit/invoiceScanMontantSeul.test.ts tests/unit/invoiceScanVote.test.ts tests/unit/invoiceScanCsv8.test.ts tests/unit/banc-lecture-facture.test.ts tests/unit/banc-lecture-k5.test.ts tests/integration/invoiceReview.test.ts --maxWorkers=2 && echo TESTS PORT OK
  EXPECT: TESTS PORT OK
  EVIDENCE: pending

- [ ] G4: les fonctions se construisent
  CHECK: npm --prefix functions run build && echo BUILD FONCTIONS OK
  EXPECT: BUILD FONCTIONS OK
  EVIDENCE: pending

- [ ] G5: les types de l'app tiennent (hors les deux erreurs connues de `qrLecture.ts`, zxing-wasm et pdfjs-dist absents de ce worktree)
  CHECK: test -z "$(npx tsc --noEmit -p . 2>&1 | grep 'error TS' | grep -v '^src/services/qrLecture.ts(')" && echo TYPES OK
  EXPECT: TYPES OK
  EVIDENCE: pending

- [ ] G6: le résultat dit le témoin, ce qui ne se perd pas et le rejeu du banc
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-31-ecran-depense/voies/port-total/RESULTAT.md --contient "TEMOIN AVANT,Rien ne se perd,banc,shipping"
  EXPECT: NOTE OK
  EVIDENCE: pending
