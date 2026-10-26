# Gates: voie t12b-finitions — l'étape Houblons de l'app, ses écarts réglés (#170)

OWNS: src/ui/hopIndex/, src/pages/BrewWizard.tsx, src/pages/PageShell.tsx, src/components/, src/App.tsx, tests/unit/, tests/integration/, work/missions/2026-10-25-integration-houblons/voies/t12b-finitions/

Scope: le « + » ne couvre plus « Suivant », en-tête réduit à l'étape 3, « ? » au lieu de NaN et 0, URL de l'étape 3 en dev-local, deux rouges hérités au vert ; drapeau éteint inchangé.

- [ ] G1: les quatre points mesurés dans Chrome, tests ciblés verts
  CHECK: node work/missions/2026-10-25-integration-houblons/voies/t12b-finitions/verifier.mjs
  EXPECT: FINITIONS OK
  EVIDENCE: pending

- [ ] G2: le vérificateur échoue sur HEAD (témoin négatif, L13)
  CHECK: node scripts/agents/systeme.mjs echoue FINITIONS -- node work/missions/2026-10-25-integration-houblons/voies/t12b-finitions/verifier.mjs --sur-head
  EXPECT: ECHOUE OK
  EVIDENCE: pending

- [ ] G3: jetons de couleur au vert
  CHECK: npx vitest run tests/unit/designTokens.test.ts
  EXPECT: passed
  EVIDENCE: pending

- [ ] G4: audit des champs au vert
  CHECK: node scripts/audit_inputs.mjs
  EXPECT: INPUT PROTECTION AUDIT PASSED
  EVIDENCE: pending

- [ ] G5: build vert
  CHECK: npm run build
  EXPECT: built in
  EVIDENCE: pending

- [ ] G6: ses choix tiennent sur l'app, étape 3 (règle n° 1)
  CHECK: node work/missions/2026-10-25-integration-houblons/voies/t12b-finitions/choix-app.mjs
  EXPECT: CHOIX OK
  EVIDENCE: pending
