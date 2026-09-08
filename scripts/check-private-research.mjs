// Deployment guard: the protected report must not become a static asset again.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]);
const source = readFileSync(join(root, 'docs/research/fermentation/report-source.md'), 'utf8');
const marker = source.trim().split(/\r?\n\r?\n/)[1];
const failures = [];
if (!existsSync(join(root, 'dist/index.html'))) throw Error('Build required before privacy check.');
for (const base of ['public', 'dist']) {
  for (const file of walk(join(root, base))) {
    if (relative(join(root, base), file).replaceAll('\\', '/').startsWith('research/')) failures.push(relative(root, file));
    else if (/\.(html|js|json|md|map)$/.test(file) && readFileSync(file, 'utf8').includes(marker)) failures.push(relative(root, file));
  }
}
if (failures.length) throw Error('Private report in public output: ' + failures.join(', '));
console.log('Private report excluded from public files and browser bundles.');
