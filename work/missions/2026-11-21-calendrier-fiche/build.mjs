// node build.mjs : écrit vNN.html et vNN-paysage.html depuis decor.mjs et versions.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { portrait, paysage } from './decor.mjs';
import { VERSIONS } from './versions.mjs';

const ICI = path.dirname(fileURLToPath(import.meta.url));
for (const V of VERSIONS) {
  V.slots = V.slots || {};
  fs.writeFileSync(path.join(ICI, `${V.id}.html`), portrait(V));
  fs.writeFileSync(path.join(ICI, `${V.id}-paysage.html`), paysage(V));
}
console.log('écrit', VERSIONS.length, 'versions');
