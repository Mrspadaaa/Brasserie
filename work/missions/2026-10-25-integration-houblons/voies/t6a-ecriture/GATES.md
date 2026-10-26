# Gates: voie t6a-ecriture — conversion de recette et une seule porte d'écriture

OWNS: src/domain/hopIndex/v4/recipeConversion.ts, prototypes/houblons-v4/parcours/src/integration/conversion.ts, prototypes/houblons-v4/tests/conversion-recette.test.ts, prototypes/houblons-v4/tests/houblon-inconnu.test.ts, src/pages/BrewWizard.tsx, tests/unit/hopIndexV4/, work/missions/2026-10-25-integration-houblons/voies/t6a-ecriture/

Scope: la conversion déménage dans src, applyHopV4Change passe par writeRecipeDraft, l'historique V5.5 survit à l'aller-retour.

- [ ] G1: conversion dans src seulement, applyHopV4Change par writeRecipeDraft, tests neufs et du prototype verts, témoin écrit
  CHECK: node work/missions/2026-10-25-integration-houblons/voies/t6a-ecriture/verifier.mjs
  EXPECT: ECRITURE OK
  EVIDENCE: pending

- [ ] G2: le build de l'app reste vert
  CHECK: npm run build
  EXPECT: built in
  EVIDENCE: pending
