# Gates: voie s6-fiche — l'article d'un produit déjà connu : « bis » ou son origine, ses vraies valeurs, sa fiche

OWNS: src/services/stockLineMatching.ts, src/services/purchaseEntry.ts, src/types/index.ts, src/domain/stock/, src/ui/finance/ExpenseSheet.tsx, src/ui/depense/, tests/unit/depense/fiche/, tests/unit/purchaseEntry.test.ts, tests/unit/stockLineMatching.test.ts, src/domain/hopIndex/v4/donneesApp.ts, tests/unit/hopIndexV4/donneesApp.test.ts, src/services/ingredientIdentity.ts, tests/unit/depense/ecran/tri.test.tsx, work/missions/2026-10-31-ecran-depense/voies/s6-fiche/

Scope: D215 et D216 à la création d'un article depuis une dépense ; catalogues du dépôt seulement, Gemini jamais appelé.

- [ ] G1: la voie est comprise avant le plan
  CHECK: node scripts/agents/systeme.mjs comprendre work/missions/2026-10-31-ecran-depense/voies/s6-fiche
  EXPECT: COMPRIS OK

- [ ] G2: le plan a été relu par deux regards neufs, sans bloquant laissé
  CHECK: node scripts/agents/systeme.mjs revue work/missions/2026-10-31-ecran-depense/voies/s6-fiche/REVUE-PLAN.md
  EXPECT: REVUE OK

- [ ] G3: l'app se construit
  CHECK: npm run build
  EXPECT: built in

- [ ] G4: les types tiennent
  CHECK: npx tsc --noEmit -p . && echo TYPES OK
  EXPECT: TYPES OK

- [ ] G5: les tests de la dépense, du stock, de l'enregistrement et de la fiche passent
  CHECK: npx vitest run tests/unit/depense tests/unit/purchaseEntry.test.ts tests/unit/purchasePrefill.test.ts tests/unit/stockLineMatching.test.ts tests/integration/expenseSheet.test.tsx tests/integration/jus0Journey.test.tsx tests/integration/financeQuickActions.test.tsx tests/integration/fix114.test.tsx tests/integration/equipmentProjects.test.tsx --maxWorkers=2 && echo TESTS S6 OK
  EXPECT: TESTS S6 OK

- [ ] G6: les champs passent par le composant protégé
  CHECK: node scripts/audit_inputs.mjs
  EXPECT: INPUT PROTECTION AUDIT PASSED

- [ ] G7: l'app servie propose et écrit le bon article
  CHECK: node scripts/with_server.mjs --server "npm run dev -- --port 5617 --strictPort" --port 5617 --env VITE_FIREBASE_API_KEY=fake -- node work/missions/2026-10-31-ecran-depense/voies/s6-fiche/capturer-s6.mjs --sortie=work/missions/2026-10-31-ecran-depense/voies/s6-fiche/captures
  EXPECT: S6 OK

- [ ] G8: le résultat dit le témoin, ce qui ne se perd pas, les noms et la fiche
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-31-ecran-depense/voies/s6-fiche/RESULTAT.md --contient "TEMOIN AVANT,Rien ne se perd,bis,origine,fiche,jamais écrasée,captures"
  EXPECT: NOTE OK
