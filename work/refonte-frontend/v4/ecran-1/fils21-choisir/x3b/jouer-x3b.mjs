// x3b · preuve des gestes au doigt (puppeteer-core, écran tactile émulé, 390 × 844) : valeurs lues à l'écran
// (window.__releve) avant, pendant et après chaque geste, et une capture à chaque fois.
//   1. tenir « tenir » : les jours passent, « depuis hier » en bulle ;
//   2. glisser Idaho 7 sur le jour de Citra (doigt gardé : « pendant »), lâcher : « ensemble » ;
//   3. glisser Citra après J6 : après fermentation, l'aimant le pose à J7 ;
//   4. Citra seul, étirer son bord de 3 à 7 j : « reste 4 j sans gain mesuré » ;
//   2b. Pomona en fermentation active sur l'ajout cumulé : la biotransformation change ;
//   5. après fermentation, la rangée des levures dit « levure au repos ».
// Usage : node jouer-x3b.mjs  →  captures/x3b-geste-*.png, x3b/geste-x3b.json
import { ouvrir, preuve, attendre } from '../y1/socle/jouer.mjs';

const J = await ouvrir('x3b/etat.html');
const bio = () => J.p.evaluate(() => { const b = document.querySelector('[data-role="biotransformation"]'); return b ? b.textContent.trim() : ''; });
const r = {};
r.avant = await J.releve(); await J.capture('x3b-geste-1-avant');
// 1. tenir « tenir » sur la suite, de J4 : les jours passent, Idaho 7 entre à J5, « depuis hier » en bulle
const t = await J.boite('[data-reglage="tenir"]');
await J.p.touchscreen.touchStart(t.cx, t.cy); await attendre(420);
r.tenirPendant = await J.releve(); await J.capture('x3b-geste-1-tenir-pendant');
await attendre(700);
r.tenu = await J.releve(); await J.capture('x3b-geste-1-tenir');
await J.lever(); r.tenuLache = await J.releve();
await J.p.evaluate(() => { const i = document.querySelector('input[data-reglage="jour"]'); i.value = 4; i.dispatchEvent(new Event('input', { bubbles: true })); });
r.avantGlisser = await J.releve();
// 2. Idaho 7 glissé sur le jour de Citra
let a = await J.boite('.blk[data-i="1"]'), c = await J.boite('.blk[data-i="0"]');
await J.glisser([[a.x + 12, a.cy], [c.x + 12, a.cy]], { garder: true, pas: 14, delai: 25 });
r.pendant = await J.releve(); await J.capture('x3b-geste-2-glisser-pendant');
await J.lever(); await attendre(300);
r.apres = await J.releve(); await J.capture('x3b-geste-2-glisser-apres');
// 2b. la levure, en fermentation active : Pomona
let po = await J.boite('[data-reglage="levure"][data-v="pomona"]'); await J.toucher(po.cx, po.cy);
r.ensemblePomonaActif = { ...(await J.releve()), bio: await bio() }; await J.capture('x3b-geste-2b-pomona-actif');
const us = await J.boite('[data-reglage="levure"][data-v="us05"]'); await J.toucher(us.cx, us.cy);
// 3. Citra (et l'ajout cumulé) glissé après J6
c = await J.boite('.blk[data-i="0"]');
const pxJour = await J.p.evaluate(() => (document.querySelector('.fr-g').clientWidth - 70) / 17);
await J.glisser([[c.x + 10, c.cy], [c.x + 10 + 5.6 * pxJour, c.cy]], { pas: 14, delai: 20 });
r.apresFermentation = await J.releve(); await J.capture('x3b-geste-3-apres-fermentation');
// 4. Citra seul, étiré de 3 à 7 j
const sc = await J.boite('[data-reglage="scenario"]'); await J.toucher(sc.cx, sc.cy);
const pc = await J.boite('[data-reglage="plan"][data-v="citra"]'); await J.toucher(pc.cx, pc.cy);
r.citraSeul = await J.releve();
const poi = await J.boite('.blk[data-i="0"] .poi');
await J.glisser([[poi.cx, poi.cy], [poi.cx + 4 * pxJour, poi.cy]], { garder: true, pas: 12, delai: 25 });
r.etirePendant = await J.releve(); await J.capture('x3b-geste-4-etire-pendant');
await J.lever(); r.etire = await J.releve(); await J.capture('x3b-geste-4-etire-apres');
// 5. après fermentation, la levure dort : la rangée le dit
r.levureAuRepos = await J.p.evaluate(() => document.querySelector('[data-role="lv-non"]').textContent.trim());
preuve('x3b', 'geste-x3b', { ...r, erreurs: J.erreurs });
const L = (n, v) => console.log(n.padEnd(18), (v.plan || '').padEnd(42), v.jour.padEnd(4), 'trop.', String(v.crans.tropical).padEnd(4), 'agr.', String(v.crans.citrus).padEnd(4), 'barre trop.', String(v.hautBarres.tropical).padStart(3) + ' px', '|', v.verdict.slice(0, 70), '|', v.aimant.slice(0, 60), v.bio ? '| ' + v.bio : '');
for (const [k, v] of Object.entries(r)) if (v && v.crans) L(k, v);
console.log('levure au repos :', r.levureAuRepos);
console.log('bulle pendant tenir :', r.tenirPendant.bulle, '| tenue :', r.tenu.bulle);
console.log('blocs avant', JSON.stringify(r.avant.blocs), '\nblocs pendant', JSON.stringify(r.pendant.blocs), '\nblocs après', JSON.stringify(r.apres.blocs));
console.log('erreurs', J.erreurs.length ? J.erreurs : 'aucune');
await J.fermer();
