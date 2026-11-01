// Assemble capturer.mjs de p6-b2 depuis celui de r4e-b (split/join).
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const ICI = path.dirname(fileURLToPath(import.meta.url));
const lit = (n) => fs.readFileSync(path.join(ICI, n), 'utf8');
let s = fs.readFileSync(path.join(ICI, '../../v4/r4e-b/capturer.mjs'), 'utf8');
const rep = (a, b) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error(`${n} × ${a.slice(0, 50)}`); s = s.split(a).join(b); };
rep(s.slice(0, s.indexOf('import path')), lit('.cap-tete.txt'));
rep("path.join(ICI, `r4e-b-${n}.png`)", "path.join(ICI, `p6-b2-${n}.png`)");
rep("  if (h === 'huit') { const pied", "  if (h === 'huit') await p.screenshot({ path: out('huit-repos') });\n  if (h === 'huit') { const pied");
// La part se lit sur la ligne (le slider dit la masse, plus la part).
rep(`li.querySelector('[data-role="part-ligne"]')?.getAttribute('aria-valuenow') ?? ''`, `li.querySelector('.r4e-pn')?.textContent ?? ''`);
// Au clavier, le curseur avance d'un cran de masse (et non plus de 1 %).
rep(`// Au clavier : ← → par 1 %.
await p.focus('[data-pl="2"]'); await p.keyboard.press('ArrowRight'); await pret();
P = await parts(); if (P[2] !== '17') err.push('→ sur la barre : ' + P[2]);`,
`// Au clavier : ← → d'un cran de masse (1,5 → 1,6 kg).
await p.focus('[data-mk="2"]'); await p.keyboard.press('ArrowRight'); await pret();
L = await lignes(); if (L[2] !== 'Haferflocken 1,6') err.push('→ sur la barre : ' + L[2]);`);
rep('await p.setViewport({ width: 1280, height: 900 });', lit('.cap-b2.txt') + 'await p.setViewport({ width: 1280, height: 900 });');
fs.writeFileSync(path.join(ICI, 'capturer.mjs'), s);
console.log('capturer assemblé');
