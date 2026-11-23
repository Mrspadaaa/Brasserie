#!/usr/bin/env node
// Un verdict par variante du lot « légendes » et une ligne « Tête : » dans critique/VERDICTS.md.
import fs from 'node:fs';
const f = 'work/refonte-frontend/v4/ecran-1/fils24-legendes/critique/VERDICTS.md';
const r = fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split(/\r?\n/) : [];
const ids = ["leg1","leg2","leg3","leg4","legz1","legz2","legz3","legz4"];
const manque = ids.filter((i) => !r.some((l) => l.startsWith('- ' + i + ' : ACCEPTÉ') || l.startsWith('- ' + i + ' : REJET — ')));
const tete = r.some((l) => l.startsWith('Tête : '));
console.log(manque.length || !tete ? 'VERDICTS ECHEC ' + manque.join(',') + (tete ? '' : ' sans tête') : ['VERDICTS', 'COMPLETS', ids.length].join('-'));
process.exit(manque.length || !tete ? 1 : 0);
