// Bundle the SAME pure calculators used by the UI, without importing browser/Firebase code.
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
// A small dedicated bridge keeps the shared content-reference algorithm out of a copied implementation.
await build({
  absWorkingDir: root,
  entryPoints: ['src/domain/hopDecision/adviceContentReference.ts'],
  outfile: 'functions/lib/hopAdviceContentReference.js',
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  sourcemap: true
});
await build({
  absWorkingDir: root,
  entryPoints: ['src/domain/brewerTools.ts'],
  plugins: [{ name: 'shared-yeast-context', setup(bundler) {
    bundler.onResolve({ filter: /^\.\/yeastCompanion\.js$/ }, () => ({ path: fileURLToPath(new URL('../src/domain/yeastCompanion.ts', import.meta.url)) }));
  } }],
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
await build({
  absWorkingDir: root,
  entryPoints: ['src/domain/yeastCompanion.ts'],
  outfile: 'functions/lib/yeastCompanion.js',
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  sourcemap: true
});
await import('./build-brewerHopAdviceSemanticSource4Portable.mjs');
