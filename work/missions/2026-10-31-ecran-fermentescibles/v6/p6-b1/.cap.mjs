// Assemble capturer.mjs de p6-b1 depuis celui de r4e-b (split/join).
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const ICI = path.dirname(fileURLToPath(import.meta.url));
let s = fs.readFileSync(path.join(ICI, '../../v4/r4e-b/capturer.mjs'), 'utf8');
const rep = (a, b) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error(`${n} × ${a.slice(0, 50)}`); s = s.split(a).join(b); };
rep(s.slice(0, s.indexOf('import path')), fs.readFileSync(path.join(ICI, '.cap-tete.txt'), 'utf8'));
rep("path.join(ICI, `r4e-b-${n}.png`)", "path.join(ICI, `p6-b1-${n}.png`)");
rep("  if (h === 'huit') { const pied", "  if (h === 'huit') await p.screenshot({ path: out('huit-repos') });\n  if (h === 'huit') { const pied");
rep('await p.setViewport({ width: 1280, height: 900 });', fs.readFileSync(path.join(ICI, '.cap-b1.txt'), 'utf8') + 'await p.setViewport({ width: 1280, height: 900 });');
fs.writeFileSync(path.join(ICI, 'capturer.mjs'), s);
console.log('capturer assemblé');
