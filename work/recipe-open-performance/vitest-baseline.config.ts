// Reuse the exact test configuration; load only corrected modules from the base.
import config from '../../vitest.config';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
const files = ['src/pages/PageShell.tsx', 'src/services/storage.ts', 'src/domain/hopIndex/recipeGuide.ts', 'src/domain/yeastReferences.ts'];
const sources = new Map(files.map(file => [resolve(file).replaceAll('\\', '/'), execFileSync('git', ['show', `5a49cc51ba4d37ef4300e6404c0c989d22d10425:${file}`], { encoding: 'utf8' })]));
config.plugins!.unshift({ name: 'performance-regression-baseline', enforce: 'pre', load(id) { return sources.get(id.replaceAll('\\', '/')); } });
export default config;
