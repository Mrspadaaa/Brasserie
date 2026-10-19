// y5 · preuve du geste au doigt : glisser Galaxy dans la cuve où est Citra (doigt gardé au-dessus de la
// cuve : capture « pendant »), lâcher ; puis toucher « Tire une bière » douze fois : les points s'accumulent.
// Usage : node jouer-y5.mjs  →  captures/y5-avant.png, y5-pendant.png, y5-apres.png, y5-tirages.png, y5/geste-y5.json
import { ouvrir, preuve, attendre } from '../y1/socle/jouer.mjs';

const J = await ouvrir('y5/etat.html');
const avant = await J.releve();
await J.capture('y5-avant');
const g = await J.boite('[data-jt="Galaxy"]'), c = await J.boite('#cuve');
await J.glisser([[g.cx, g.cy], [g.cx, g.cy - 40], [c.cx + 40, c.cy]], { garder: true, pas: 10, delai: 18 });
const vise = await J.p.evaluate(() => document.getElementById('cuve').classList.contains('vise'));
await J.capture('y5-pendant');
await J.lever();
const apres = await J.releve();
await J.capture('y5-apres');
const t = await J.boite('#tirer');
for (let k = 0; k < 12; k++) await J.toucher(t.cx, t.cy, 40);
const tirages = await J.releve();
await J.capture('y5-tirages');
const pom = await J.boite('[data-lev="Pomona"]'); await J.toucher(pom.cx, pom.cy);
const act = await J.boite('[data-mom="dryActive"]'); await J.toucher(act.cx, act.cy);
const pomona = await J.releve();
preuve('y5', 'geste-y5', { avant, vise, apres, tirages, pomona, erreurs: J.erreurs });
const L = (n, v) => console.log(n.padEnd(9), v.cuve.padEnd(16), 'tropical', String(v.crans.tropical).padEnd(4), 'agrumes', String(v.crans.citrus).padEnd(4), 'barre trop.', String(v.largeurs.tropical).padStart(3) + ' px', 'points', String(v.points).padStart(3), '|', v.change.slice(0, 80));
L('avant', avant); L('après', apres); L('tirages', tirages); L('Pomona', pomona);
console.log('cuve visée pendant le glissé :', vise);
console.log('compte :', tirages.compte);
console.log('erreurs', J.erreurs.length ? J.erreurs : 'aucune');
await J.fermer();
