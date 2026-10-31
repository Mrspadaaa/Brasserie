# Gates: voie p1-port — r4-a dans l'étape Identité de l'app

OWNS: src/pages/BrewWizard.tsx, src/pages/recipe-wizard.css, src/ui/identite/, tests/unit/identite/, work/refonte-frontend/v4/choix/ecrans-app.json, work/missions/2026-10-31-ecran-identite/v1/r4-a/, work/missions/2026-10-31-ecran-identite/voies/p1-port/

Scope: l'étape Identité de l'app reprend r4-a telle quelle, avec ses adaptations et la cuve qui déborde.

- [ ] G1: l'app se construit
  CHECK: npm run build
  EXPECT: built in
  EVIDENCE: pending

- [ ] G2: les tests de l'étape Identité passent
  CHECK: npx vitest run tests/unit/identite --maxWorkers=2
  EXPECT: /Tests\s+\d+ passed/
  EVIDENCE: pending

- [ ] G3: le registre des choix de l'app est valide
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-choix.mjs --registre=work/refonte-frontend/v4/choix/ecrans-app.json
  EXPECT: REGISTRE OK
  EVIDENCE: pending

- [ ] G4: le résultat liste ce que devient chaque fonction et demande les captures Chrome
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-31-ecran-identite/voies/p1-port/RESULTAT.md --contient "Rien ne se perd,DEMANDE EXECUTANT,lint:design,+22 L de trop"
  EXPECT: NOTE OK
  EVIDENCE: pending
