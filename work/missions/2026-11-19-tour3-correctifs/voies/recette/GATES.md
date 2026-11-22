# Gates: voie recette — Recette : eau ajoutée partout, planifier depuis une recette non figée

OWNS: src/domain/brewerRecipeRefresh.ts, src/domain/brewerTools.ts, src/domain/brewSystemInsights.ts, src/ui/production/brasser/, tests/unit/recetteTour3.test.ts, tests/unit/recetteTour3.test.tsx

Scope: Recette : eau ajoutée partout, planifier depuis une recette non figée

- [ ] G1: le test de la voie passe (il échouait avant la correction, sortie rouge citée dans RESULTAT.md)
  CHECK: cd C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet && npx vitest run tests/unit/recetteTour3.test.ts* --reporter=dot > /dev/null && echo VITEST OK
  EXPECT: VITEST OK
  EVIDENCE: pending

- [ ] G2: le typage passe
  CHECK: cd C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet && npx tsc --noEmit -p . && echo TSC OK
  EXPECT: TSC OK
  EVIDENCE: pending

- [ ] G3: RESULTAT.md cite la sortie rouge d'avant
  CHECK: grep -q -i "avant" work/missions/2026-11-19-tour3-correctifs/voies/recette/RESULTAT.md && echo ROUGE CITE
  EXPECT: ROUGE CITE
  EVIDENCE: pending
