// y1 · preuve du geste au doigt : le pouce de la frise, posé à 60′, glissé jusqu'à 10′ (doigt gardé : la
// loupe), puis jusqu'au dry hop après, relâché. Valeurs lues à l'écran avant, pendant, après.
// Usage : node jouer-y1.mjs  →  captures/y1-avant.png, y1-pendant.png, y1-apres.png, y1/geste-y1.json
import { ouvrir, preuve, attendre } from './socle/jouer.mjs';

const J = await ouvrir('y1/etat.html');
const avant = await J.releve();
await J.capture('y1-avant');
const piste = await J.boite('#piste'), jeton = await J.boite('#jeton');
const xA = (u) => piste.x + u * piste.w, y = jeton.cy;
// 10′ : (60 − 10) / 60 × 0,48 = 0,40 de la piste ; dry hop après : 0,93
await J.glisser([[jeton.cx, y], [xA(0.2), y], [xA(0.4), y]], { garder: true, pas: 10, delai: 20 });
const pendant = await J.releve();
const loupe = await J.p.evaluate(() => { const l = document.getElementById('loupe'); const r = l.getBoundingClientRect(); const t = [...document.querySelectorAll('#loupe-r i')].map((i) => i.getBoundingClientRect().left); const ticks = [...document.querySelectorAll('#ticks i')].map((i) => i.getBoundingClientRect().left); const pas = (a) => { const d = a.slice(1).map((x, k) => x - a[k]).filter((x) => x > 1); return d.length ? Math.min(...d) : null; }; return { visible: !l.hidden, texte: document.getElementById('loupe-t').textContent, pasLoupe: pas(t.sort((a, b) => a - b)), pasFrise: pas(ticks.sort((a, b) => a - b)), haut: Math.round(r.top) }; });
await J.capture('y1-pendant');
for (let k = 1; k <= 14; k++) { await J.p.touchscreen.touchMove(xA(0.4 + (0.53 * k) / 14), y); await attendre(20); }
await J.lever();
const apres = await J.releve();
await J.capture('y1-apres');
// La levure, puis l'ajout cumulé, au toucher (les réglages de repli)
const pom = await J.boite('[data-lev="Pomona"]'); await J.toucher(pom.cx, pom.cy);
const actif = await J.boite('#arrets [data-k="14"]'); await J.toucher(actif.cx, actif.cy);
const pomonaActif = await J.releve();
await J.capture('y1-pomona-actif');
const ens = await J.boite('#ens'); await J.toucher(ens.cx, ens.cy);
const ensemble = await J.releve();
await J.capture('y1-ensemble');
preuve('y1', 'geste-y1', { avant, pendant, loupe, apres, pomonaActif, ensemble, erreurs: J.erreurs });
const L = (n, v) => console.log(n.padEnd(12), v.moment.padEnd(14), 'agrumes', String(v.crans.citrus).padEnd(4), 'tropical', String(v.crans.tropical).padEnd(4), 'barre agrumes', String(v.largeurs.citrus).padStart(3) + ' px', '|', v.ibu, '|', v.citra);
L('avant', avant); L('pendant', pendant); L('après', apres); L('Pomona actif', pomonaActif); L('ensemble', ensemble);
console.log('loupe', JSON.stringify(loupe), 'grossissement ×' + (loupe.pasLoupe / loupe.pasFrise).toFixed(1));
console.log('erreurs', J.erreurs.length ? J.erreurs : 'aucune');
await J.fermer();
