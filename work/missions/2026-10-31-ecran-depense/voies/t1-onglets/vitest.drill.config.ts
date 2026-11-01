// Rejeu de tests/ux-mobile/financePeriodDrilldown.test.tsx : ce dossier n'est pas dans l'`include` de vitest.config.ts (le test n'est donc jamais lancé par G2).
// Usage (racine du dépôt) : npx vitest run --config work/missions/2026-10-31-ecran-depense/voies/t1-onglets/vitest.drill.config.ts --maxWorkers=1
import base from '../../../../../vitest.config';

const config = base as unknown as { test: Record<string, unknown> };
export default {
  ...config,
  root: process.cwd(),
  test: { ...config.test, include: ['tests/ux-mobile/financePeriodDrilldown.test.tsx'], environment: 'jsdom', environmentMatchGlobs: [] },
};
