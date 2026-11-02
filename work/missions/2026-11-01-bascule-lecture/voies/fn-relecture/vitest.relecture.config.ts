// Config de la voie fn-relecture : celle du dépôt, mais SEULS les tests de cette voie (le dépôt n'inclut que tests/**).
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import base from '../../../../../vitest.config';

const root = fileURLToPath(new URL('../../../../../', import.meta.url));
export default defineConfig({
  ...(base as any),
  root,
  test: { ...(base as any).test, include: ['work/missions/2026-11-01-bascule-lecture/voies/fn-relecture/*.test.ts'], exclude: [], environmentMatchGlobs: [] }
});
