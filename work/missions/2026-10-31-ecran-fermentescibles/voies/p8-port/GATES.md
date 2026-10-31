# Gates: voie p8-port — son choix s1 dans l'étape Malts/sucres de l'app

OWNS: src/pages/BrewWizard.tsx, src/pages/recipe-wizard.css, src/ui/fermentescibles/, tests/unit/fermentescibles/, work/missions/2026-10-31-ecran-fermentescibles/controle-masse-ligne.mjs, work/missions/2026-10-31-ecran-fermentescibles/controle-moment-ligne.mjs, work/missions/2026-10-31-ecran-fermentescibles/controle-recherche.mjs, work/refonte-frontend/v4/tournoi/outils/controle-volee.mjs, work/refonte-frontend/v4/tournoi/outils/controle-gestes-ligne.mjs, work/missions/2026-10-31-ecran-fermentescibles/voies/p8-port/

Scope: l'étape Fermentables devient v7/s1 geste par geste ; les contrôles du registre tournent sur l'app servie ; rien ne se perd.

- [ ] G1: la voie est comprise
  CHECK: node scripts/agents/systeme.mjs comprendre work/missions/2026-10-31-ecran-fermentescibles/voies/p8-port
  EXPECT: COMPRIS OK

- [ ] G2: l'app se construit
  CHECK: npm run build
  EXPECT: built in

- [ ] G3: les types tiennent
  CHECK: npx tsc --noEmit -p . && echo TYPES OK
  EXPECT: TYPES OK

- [ ] G4: les tests de l'étape passent
  CHECK: npx vitest run tests/unit/fermentescibles --maxWorkers=2 && echo TESTS MALTS OK
  EXPECT: TESTS MALTS OK

- [ ] G5: chaque champ passe par la saisie protégée
  CHECK: node scripts/audit_inputs.mjs
  EXPECT: INPUT PROTECTION AUDIT PASSED

- [ ] G6: le registre des choix de l'app reste valide
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-choix.mjs --registre --registre=work/refonte-frontend/v4/choix/ecrans-app.json
  EXPECT: REGISTRE OK

- [ ] G7: la série Chrome passe sur l'app servie, contrôles du registre compris
  CHECK: node scripts/with_server.mjs --server "npm run dev -- --port 5615 --strictPort" --port 5615 --env VITE_HOP_V4=on --env VITE_FIREBASE_API_KEY=fake -- node work/missions/2026-10-31-ecran-fermentescibles/voies/p8-port/capturer-malts.mjs --sortie=work/missions/2026-10-31-ecran-fermentescibles/voies/p8-port/captures
  EXPECT: MALTS OK

- [ ] G8: le résultat dit ce qui ne se perd pas, l'appel de la proposition et les captures
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-31-ecran-fermentescibles/voies/p8-port/RESULTAT.md --contient "Rien ne se perd,proposerFermentables,Munich,stockItemRef,captures"
  EXPECT: NOTE OK
