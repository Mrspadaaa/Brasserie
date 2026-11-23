#!/usr/bin/env node
// Un verdict par concept du lot « recherche avancée » et une ligne « Tête : » dans critique/VERDICTS.md.
import fs from 'node:fs';
const f = 'work/refonte-frontend/v4/ecran-1/fils24-recherche/critique/VERDICTS.md';
const r = fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split(/\r?\n/) : [];
const ids = ["rca1","rca2","rca3","rca4","rcb1","rcb2","rcb3","rcb4","rcc1","rcc2","rcc3","rcc4"];
const manque = ids.filter((i) => !r.some((l) => l.startsWith('- ' + i + ' : ACCEPTÉ') || l.startsWith('- ' + i + ' : REJET — ')));
const tete = r.some((l) => l.startsWith('Tête : '));
console.log(manque.length || !tete ? 'VERDICTS ECHEC ' + manque.join(',') + (tete ? '' : ' sans tête') : ['VERDICTS', 'COMPLETS', ids.length].join('-'));
process.exit(manque.length || !tete ? 1 : 0);
