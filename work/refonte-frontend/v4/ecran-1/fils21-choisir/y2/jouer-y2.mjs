// y2 · preuve du geste au doigt : maintenir la cuve. Citra 4 g/L après fermentation : doigt posé à J0,
// gardé (J+1, capture « pendant »), gardé encore (J+5), levé ; puis la suite Citra 3 j → Galaxy 7 j.
// Usage : node jouer-y2.mjs  →  captures/y2-avant.png, y2-pendant.png, y2-apres.png, y2-suite.png, y2/geste-y2.json
import { ouvrir, preuve, attendre } from '../y1/socle/jouer.mjs';

const J = await ouvrir('y2/etat.html');
const avant = await J.releve();
await J.capture('y2-avant');
const b = await J.boite('#tenir');
await J.p.touchscreen.touchStart(b.cx, b.cy);
await attendre(480);
const pendant = await J.releve();
await J.capture('y2-pendant');
await attendre(1400);
const tenu = await J.releve();
await J.lever();
const apres = await J.releve();
await J.capture('y2-apres');
// la suite : Citra 3 j puis Galaxy 7 j, maintenue jusqu'au bout
const s = await J.boite('[data-plan="c3g7"]'); await J.toucher(s.cx, s.cy);
const b2 = await J.boite('#tenir');
await J.p.touchscreen.touchStart(b2.cx, b2.cy); await attendre(1500);
const suiteJ4 = await J.releve();
await J.capture('y2-suite-j4');
await attendre(2400); await J.lever();
const suiteFin = await J.releve();
await J.capture('y2-suite-fin');
// la levure en dry hop actif, et l'ajout cumulé
const ens = await J.boite('[data-plan="cg"]'); await J.toucher(ens.cx, ens.cy);
const act = await J.boite('[data-mom="dryActive"]'); await J.toucher(act.cx, act.cy);
const pom = await J.boite('[data-lev="Pomona"]'); await J.toucher(pom.cx, pom.cy);
for (let k = 0; k < 3; k++) { const t = await J.boite('#tenir'); await J.toucher(t.cx, t.cy); }
const ensemble = await J.releve();
await J.capture('y2-ensemble-pomona');
preuve('y2', 'geste-y2', { avant, pendant, tenu, apres, suiteJ4, suiteFin, ensemble, erreurs: J.erreurs });
const L = (n, v) => console.log(n.padEnd(10), v.plan.padEnd(26), v.jour.padEnd(5), 'tropical', String(v.crans.tropical).padEnd(4), 'agrumes', String(v.crans.citrus).padEnd(4), 'barre trop.', String(v.largeurs.tropical).padStart(3) + ' px', '|', v.change.slice(0, 60), '|', v.plat.slice(0, 50));
L('avant', avant); L('pendant', pendant); L('tenu', tenu); L('après', apres); L('suite J4', suiteJ4); L('suite fin', suiteFin); L('ensemble', ensemble);
console.log('source ensemble :', ensemble.source, '· levure', ensemble.levure, ensemble.moment);
console.log('erreurs', J.erreurs.length ? J.erreurs : 'aucune');
await J.fermer();
