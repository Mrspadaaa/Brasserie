// Bundle the SAME pure calculators used by the UI, without importing browser/Firebase code.
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
await build({
  absWorkingDir: root,
  entryPoints: ['src/domain/brewerTools.ts'],
  outfile: 'functions/lib/brewerTools.js',
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  sourcemap: true
});
await build({
  absWorkingDir: root,
  entryPoints: ['src/domain/finance/assistantContext.ts'],
  outfile: 'functions/lib/financeContext.js',
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  sourcemap: true
});
