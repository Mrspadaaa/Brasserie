// Lot fils25-comparer : critique/VERDICTS.md a un verdict par variante (cma1 à cmz4) et une tête. → VERDICTS-CMP-12 ou ECHEC.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const lot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const f = path.join(lot, 'critique', 'VERDICTS.md');
const t = fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '';
const ids = ['cma', 'cmb', 'cmz'].flatMap((s) => [1, 2, 3, 4].map((n) => s + n));
const manquent = ids.filter((id) => !new RegExp('^- ' + id + ' : (ACCEPTÉ|REJET)', 'm').test(t));
const tete = /^Tête : /m.test(t);
if (manquent.length || !tete) { console.log('  - verdicts manquants : ' + manquent.join(', ') + (tete ? '' : ' ; ligne « Tête : » absente')); console.log('VERDICTS-CMP ECHEC'); process.exit(1); }
console.log('VERDICTS-CMP-12');
