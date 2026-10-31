# Gates: voie p2-correctifs — le port d'Identité garde r4-a aussi quand il touche

OWNS: src/pages/BrewWizard.tsx, src/pages/recipe-wizard.css, src/ui/identite/, tests/unit/identite/, work/missions/2026-10-31-ecran-identite/voies/p2-correctifs/

Scope: les 11 écarts de critique/VERDICT-port.md, corrigés dans l'app ; r4-a telle quelle, à 390 et à 1280.

- [ ] G1: l'app se construit
  CHECK: npm run build
  EXPECT: built in
  EVIDENCE: pending

- [ ] G2: les tests de l'étape Identité passent
  CHECK: npx vitest run tests/unit/identite --maxWorkers=2 && echo TESTS IDENTITE OK
  EXPECT: TESTS IDENTITE OK
  EVIDENCE: pending

- [ ] G3: la série Chrome passe, avec les contrôles des écarts
  CHECK: node scripts/with_server.mjs --server "npm run dev -- --port 5613 --strictPort" --port 5613 --env VITE_HOP_V4=on --env VITE_FIREBASE_API_KEY=fake -- node work/missions/2026-10-31-ecran-identite/voies/p2-correctifs/capturer-identite.mjs --sortie=work/missions/2026-10-31-ecran-identite/voies/p2-correctifs/captures/r3
  EXPECT: IDENTITE OK
  EVIDENCE: pending

- [ ] G4: les contrôles ajoutés ont échoué avant la correction, et le résultat le dit
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-31-ecran-identite/voies/p2-correctifs/RESULTAT.md --contient "TEMOIN AVANT : IDENTITE ECHEC,baseline,Rien ne se perd"
  EXPECT: NOTE OK
  EVIDENCE: pending

- [ ] G5: le registre des choix de l'app reste valide
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-choix.mjs --registre --registre=work/refonte-frontend/v4/choix/ecrans-app.json
  EXPECT: REGISTRE OK
  EVIDENCE: pending
