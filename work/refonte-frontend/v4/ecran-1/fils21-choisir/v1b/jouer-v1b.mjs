// v1b · la preuve du geste, jouée au doigt (puppeteer-core, écran tactile émulé, 390 × 844), comme la série y :
//   1. le mélange : le doigt prend la poignée sur « Citra 4 g/L », glisse jusqu'au milieu (« ensemble, 2 + 2 g/L »,
//      doigt gardé : capture « pendant »), puis jusqu'à « Cascade 4 g/L », levé ;
//   2. un toucher sur la carte Galaxy : le duel devient Citra contre Galaxy (phrase, verdict, équivalence) ;
//   3. les réglages ouverts, un toucher sur Pomona (dry hop actif) : le profil simulé bouge ;
//   4. un toucher sur « après » : la levure passe au repos, le verdict change.
// Usage : node jouer-v1b.mjs  →  captures/v1b-avant.png, v1b-pendant.png, v1b-apres.png, v1b-galaxy-tap.png,
//         v1b-pomona-tap.png, v1b-apres-tap.png et v1b/geste-v1b.json
import { ouvrir, preuve, attendre } from '../y1/socle/jouer.mjs';

const J = await ouvrir('v1b/etat.html');
await J.capture('v1b-premier-ecran');
// 1. Le mélange au doigt : la carte du profil remonte en haut de l'écran, pour que l'effet se voie.
await J.p.evaluate(() => document.querySelector('#sim16').scrollIntoView({ block: 'start' })); await attendre(200);
const avant = await J.releve();
await J.capture('v1b-avant');
const t = await J.p.evaluate(() => { const r = document.querySelector('.mix-t').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
const x = (u) => t.x + t.w * u, y = t.y + t.h / 2;
const chemin = (a, b, n) => Array.from({ length: n + 1 }, (_, k) => [x(a + ((b - a) * k) / n), y]);
await J.glisser(chemin(0, 0.5, 10), { garder: true, pas: 3, delai: 16 });
const pendant = await J.releve();
await J.capture('v1b-pendant');
for (const [px, py] of chemin(0.5, 1, 10).slice(1)) { await J.p.touchscreen.touchMove(px, py); await attendre(16); }
await J.lever();
const apres = await J.releve();
await J.capture('v1b-apres');
// 2. La carte Galaxy.
const g = await J.boite('.hc[data-h="Galaxy"]');
await J.toucher(g.cx, g.cy);
await J.p.evaluate(() => window.scrollTo(0, 0)); await attendre(200);
const galaxy = await J.releve();
await J.capture('v1b-galaxy-tap');
// 3. Les réglages, Pomona.
const r = await J.boite('#regl-b'); await J.toucher(r.cx, r.cy);
const avantPomona = await J.releve();
const pm = await J.boite('[data-lev="pomona"]'); await J.toucher(pm.cx, pm.cy);
await J.p.evaluate(() => window.scrollTo(0, 0)); await attendre(200);
const pomona = await J.releve();
await J.capture('v1b-pomona-tap');
// 4. Après fermentation.
const ap = await J.boite('[data-mom="dryPost"]'); await J.toucher(ap.cx, ap.cy);
await J.p.evaluate(() => window.scrollTo(0, 0)); await attendre(200);
const repos = await J.releve();
await J.capture('v1b-apres-tap');
preuve('v1b', 'geste-v1b', { avant, pendant, apres, galaxy, avantPomona, pomona, repos, erreurs: J.erreurs });
const L = (n, v) => console.log(n.padEnd(12), '|', v.duel, '|', v.melange, '|', v.reglage, '| agrumes', (v.barres.citrus || {}).valeur, (v.barres.citrus || {}).hauteur + ' px | tropicaux', (v.barres.tropical || {}).valeur, (v.barres.tropical || {}).hauteur + ' px');
L('avant', avant); L('pendant', pendant); L('après', apres); L('galaxy', galaxy); L('avant pomona', avantPomona); L('pomona', pomona); L('repos', repos);
console.log('verdict avant  :', avant.verdict); console.log('verdict galaxy :', galaxy.verdict); console.log('verdict pomona :', pomona.verdict); console.log('verdict repos  :', repos.verdict);
console.log('égal avant :', avant.egal); console.log('égal repos :', repos.egal);
console.log('erreurs', J.erreurs.length ? J.erreurs : 'aucune');
await J.fermer();
