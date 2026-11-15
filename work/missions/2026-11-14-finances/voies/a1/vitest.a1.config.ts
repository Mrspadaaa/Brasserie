/* Config de la voie a1 : la config racine, avec une liste de fichiers à elle (la config racine ne charge que `tests/`, jamais `src/`).
   Lancement : npx vitest run --config work/missions/2026-11-14-finances/voies/a1/vitest.a1.config.ts --no-color */
import { defineConfig } from 'vitest/config';
import base from '../../../../../vitest.config';

const racine = new URL('../../../../../', import.meta.url).pathname.replace(/^\/(\w:)/, '$1');
export default defineConfig({
  ...base,
  root: racine,
  test: {
    ...base.test,
    include: [
      'src/ui/finance/annuel/**/*.test.{ts,tsx}',
      'tests/integration/annuel*.test.{ts,tsx}',
      'tests/unit/periodeSynthese.test.ts'
    ]
  }
});
