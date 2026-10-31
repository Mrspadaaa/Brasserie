# Gates: voie p4-suite — la suite de tests se termine sans épuiser la mémoire

OWNS: tests/integration/monkey.test.tsx, src/ui/SaltSolver.tsx, vitest.config.ts, work/missions/2026-10-31-ecran-identite/voies/p4-suite/

Scope: la graine 42 du singe de l'atelier de l'eau et les hopV55 qui épuisent le tas ; cause trouvée et corrigée, le singe jamais réduit.

- [ ] G1: la voie est comprise
  CHECK: node scripts/agents/systeme.mjs comprendre work/missions/2026-10-31-ecran-identite/voies/p4-suite
  EXPECT: COMPRIS OK

- [ ] G2: le singe passe seul, ses six graines comprises
  CHECK: npx vitest run tests/integration/monkey.test.tsx --maxWorkers=1 && echo MONKEY OK
  EXPECT: MONKEY OK

- [ ] G3: le singe n'est pas réduit (graines 42 et 99, 250 gestes, 251 lignes de journal)
  CHECK: node scripts/agents/systeme.mjs note tests/integration/monkey.test.tsx --contient "42].forEach,99].forEach,250);,toBe(251)"
  EXPECT: NOTE OK

- [ ] G4: les hopV55 d'intégration passent
  CHECK: npx vitest run tests/integration/hopV55 --maxWorkers=2 && echo HOPV55 OK
  EXPECT: HOPV55 OK

- [ ] G5: les types tiennent
  CHECK: npx tsc --noEmit -p . && echo TYPES OK
  EXPECT: TYPES OK

- [ ] G6: l'app se construit
  CHECK: npm run build
  EXPECT: built in

- [ ] G7: la suite entière se termine et passe
  CHECK: npm test -- --maxWorkers=2 && echo SUITE OK
  EXPECT: SUITE OK

- [ ] G8: le résultat dit le geste, le témoin rouge et les fichiers
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-31-ecran-identite/voies/p4-suite/RESULTAT.md --contient "graine 42,TEMOIN AVANT,hopV55,Fichiers touchés"
  EXPECT: NOTE OK
