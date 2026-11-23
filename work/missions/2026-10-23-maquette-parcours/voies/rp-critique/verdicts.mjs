#!/usr/bin/env node
// Un verdict par variante du lot « r6a++ » et une ligne « Tête : » dans critique/VERDICTS.md.
import fs from 'node:fs';
const f = 'work/refonte-frontend/v4/ecran-1/fils24-r6a-plus/critique/VERDICTS.md';
const r = fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split(/\r?\n/) : [];
const ids = ["rpa1","rpa2","rpa3","rpa4","rpb1","rpb2","rpb3","rpb4","rpz1","rpz2","rpz3","rpz4"];
const manque = ids.filter((i) => !r.some((l) => l.startsWith('- ' + i + ' : ACCEPTÉ') || l.startsWith('- ' + i + ' : REJET — ')));
const tete = r.some((l) => l.startsWith('Tête : '));
console.log(manque.length || !tete ? 'VERDICTS ECHEC ' + manque.join(',') + (tete ? '' : ' sans tête') : ['VERDICTS', 'COMPLETS', ids.length].join('-'));
process.exit(manque.length || !tete ? 1 : 0);
