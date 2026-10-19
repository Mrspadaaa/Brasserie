// y3 · preuve du geste au doigt : tourner la molette. Cascade, après fermentation, 3 j : le doigt prend la
// poignée à 4 g/L et tourne jusqu'à 8 g/L (doigt gardé : capture « pendant »), puis jusqu'à 16 g/L, levé.
// On relève la longueur des barres à 2, 4, 8 et 16 g/L : à angle égal, elles avancent de moins en moins.
// Usage : node jouer-y3.mjs  →  captures/y3-avant.png, y3-pendant.png, y3-apres.png, y3/geste-y3.json
import { ouvrir, preuve, attendre } from '../y1/socle/jouer.mjs';

const J = await ouvrir('y3/etat.html');
const m = await J.boite('#molette');
const CX = m.x + 88, CY = m.y + 88, R = 72;
const pt = (d) => { const a = (-150 + (d / 16) * 300) * Math.PI / 180; return [CX + R * Math.sin(a), CY - R * Math.cos(a)]; };
const avant = await J.releve();
await J.capture('y3-avant');
const chemin = (a, b, n) => Array.from({ length: n + 1 }, (_, k) => pt(a + ((b - a) * k) / n));
await J.glisser(chemin(4, 8, 12), { garder: true, pas: 3, delai: 16 });
const pendant = await J.releve();
await J.capture('y3-pendant');
for (const [x, y] of chemin(8, 16, 16).slice(1)) { await J.p.touchscreen.touchMove(x, y); await attendre(16); }
await J.lever();
const apres = await J.releve();
await J.capture('y3-apres');
// la barre ralentit : longueurs relevées aux doses de la grille (même angle entre 4 et 8 qu'entre 8 et 12)
const longueurs = {};
for (const d of [0, 1, 2, 4, 8, 16]) { const b = await J.boite('[data-dose="' + d + '"]'); await J.toucher(b.cx, b.cy); longueurs[d + ' g/L'] = (await J.releve()).largeurs; }
// l'ajout cumulé et la levure, au toucher
const e = await J.boite('#ens'); await J.toucher(e.cx, e.cy);
const b4 = await J.boite('[data-dose="4"]'); await J.toucher(b4.cx, b4.cy);
const ensemble = await J.releve();
await J.capture('y3-ensemble');
preuve('y3', 'geste-y3', { avant, pendant, apres, longueurs, ensemble, erreurs: J.erreurs });
const L = (n, v) => console.log(n.padEnd(9), v.dose.padEnd(8), 'agrumes', String(v.crans.citrus).padEnd(4), 'barre agrumes', String(v.largeurs.citrus).padStart(3) + ' px', '| gain', v.gain, '|', v.egale.slice(0, 90));
L('avant', avant); L('pendant', pendant); L('après', apres); L('ensemble', ensemble);
console.log('barre des agrumes selon la dose :', Object.entries(longueurs).map(([d, l]) => d + ' ' + l.citrus + ' px').join(' · '));
console.log('erreurs', J.erreurs.length ? J.erreurs : 'aucune');
await J.fermer();
