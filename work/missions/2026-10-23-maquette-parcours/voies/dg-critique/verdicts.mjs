#!/usr/bin/env node
// Un verdict par variante du lot « Dryhopper, avec ses retours » et une ligne « Tête : » dans critique/VERDICTS.md.
import fs from 'node:fs';
const f = 'work/refonte-frontend/v4/ecran-1/fils24-dryhopper-greffes/critique/VERDICTS.md';
const r = fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split(/\r?\n/) : [];
const ids = ["dga1","dga2","dga3","dga4","dgb1","dgb2","dgb3","dgb4","dgz1","dgz2","dgz3","dgz4"];
const manque = ids.filter((i) => !r.some((l) => l.startsWith('- ' + i + ' : ACCEPTÉ') || l.startsWith('- ' + i + ' : REJET — ')));
const tete = r.some((l) => l.startsWith('Tête : '));
console.log(manque.length || !tete ? 'VERDICTS ECHEC ' + manque.join(',') + (tete ? '' : ' sans tête') : ['VERDICTS', 'COMPLETS', ids.length].join('-'));
process.exit(manque.length || !tete ? 1 : 0);
