// y1b · preuve du geste au doigt (puppeteer-core, écran tactile émulé, 390 × 844) :
//   1. état de départ (Citra 4 g/L, dry hop actif, US-05) : capture « avant » ;
//   2. le jeton Citra du dock glissé jusqu'à 10′, doigt gardé : la loupe ×3, le profil et la réponse ont
//      changé, le plan d'avant (actif) en pointillé : capture « pendant » ;
//   3. glissé jusqu'à 60′, levé : capture « après » ;
//   4. Pomona touchée (de retour en actif) ; un second houblon posé, glissé jusqu'à « puis » ;
//   5. les trois blocs : le défi, vingt bières (même tirage deux fois), la preuve.
// Usage : node jouer-y1b.mjs  →  captures/y1b-*.png, y1b/geste-y1b.json
import { ouvrir, preuve, attendre } from '../y1/socle/jouer.mjs';
// Un bouton de page au-dessus du dock (fixe) : défiler pour le mettre au milieu de l'écran, puis le toucher.
const centre = async (J, sel) => { await J.p.evaluate((s) => document.querySelector(s).scrollIntoView({ block: 'center' }), sel); await attendre(150); const b = await J.p.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 }; }, sel); await J.toucher(b.cx, b.cy); };

const J = await ouvrir('y1b/etat.html');
const avant = await J.releve();
await J.capture('y1b-avant');
const fr = await J.boite('#fr'), jt = await J.boite('[data-jt="h1"]');
const xA = (u) => fr.x + u * fr.w;
// 10′ : (60 − 10) / 60 × 0,44 = 0,367 de la frise ; 60′ : 0
await J.glisser([[jt.cx, jt.cy], [xA(0.55), jt.cy], [xA(0.367), jt.cy]], { garder: true, pas: 10, delai: 18 });
const pendant = await J.releve();
const loupe = await J.p.evaluate(() => { const l = document.getElementById('loupe'), r = l.getBoundingClientRect(), d = document.querySelector('.quai').getBoundingClientRect(); const t = [...document.querySelectorAll('#loupe-r i')].map((i) => i.getBoundingClientRect().left).sort((a, b) => a - b), k = [...document.querySelectorAll('#ticks i')].map((i) => i.getBoundingClientRect().left).sort((a, b) => a - b); const pas = (a) => Math.min(...a.slice(1).map((x, i) => x - a[i]).filter((x) => x > 1)); return { visible: !l.hidden, texte: document.getElementById('loupe-t').textContent, pasLoupe: pas(t), pasFrise: pas(k), basLoupe: Math.round(r.bottom), hautDock: Math.round(d.top), etiquettesSousLoupe: [...document.querySelectorAll('#loupe-r span')].map((s) => s.textContent) }; });
await J.capture('y1b-pendant');
for (let k = 1; k <= 12; k++) { await J.p.touchscreen.touchMove(xA(0.367 - (0.367 * k) / 12), jt.cy); await attendre(18); }
await J.lever();
const apres = await J.releve();
await J.capture('y1b-apres');
// de retour au dry hop actif, la levure au premier toucher
const ac = await J.boite('#arrets [data-k="14"]'); await J.toucher(ac.cx, ac.cy);
const actifUS05 = await J.releve();
await centre(J, '[data-lev="Pomona"]');
const pomona = await J.releve();
// le second houblon : posé au même dry hop (ensemble), puis glissé jusqu'à « puis »
await centre(J, '[data-pa="plus"]');
const ensemble = await J.releve();
await J.capture('y1b-ensemble');
const j2 = await J.boite('[data-jt="h2"]'), f2 = await J.boite('#fr');
await J.glisser([[j2.cx, j2.cy], [f2.x + 0.965 * f2.w, j2.cy]], { pas: 12, delai: 18 });
const puis = await J.releve();
await J.capture('y1b-puis');
// les blocs à un toucher
await centre(J, '#b-defi');
await J.capture('y1b-defi', { pleine: true });
const defi = await J.p.evaluate(() => document.getElementById('defi').innerText.replace(/\s+/g, ' ').trim());
await centre(J, '#b-defi');
await centre(J, '#b-tire');
const tire1 = await J.p.evaluate(() => [document.getElementById('tire').innerText.replace(/\s+/g, ' ').trim(), document.querySelectorAll('.sp-dots i').length]);
await J.capture('y1b-tire');
await centre(J, '#b-tire'); await centre(J, '#b-tire');
const tire2 = await J.p.evaluate(() => document.getElementById('tire').innerText.replace(/\s+/g, ' ').trim());
await centre(J, '#b-preuve');
await J.capture('y1b-preuve');
preuve('y1b', 'geste-y1b', { avant, pendant, loupe, apres, actifUS05, pomona, ensemble, puis, defi, tire: tire1[0], points: tire1[1], memeTirage: tire1[0] === tire2, erreurs: J.erreurs });
const L = (n, v) => console.log(n.padEnd(10), v.plan.slice(0, 44).padEnd(45), '| agrumes', String(v.crans.citrus).padEnd(4), 'tropical', String(v.crans.tropical).padEnd(4), 'barre agr.', String(v.largeurs.citrus).padStart(3) + ' px', '|', v.ibu, '|', v.reponse.slice(0, 90));
L('avant', avant); L('pendant', pendant); L('après', apres); L('actif', actifUS05); L('Pomona', pomona); L('ensemble', ensemble); L('puis', puis);
console.log('loupe', JSON.stringify(loupe), 'grossissement ×' + (loupe.pasLoupe / loupe.pasFrise).toFixed(1));
console.log('défi :', defi.slice(0, 200));
console.log('tirage :', tire1[0].slice(0, 200), '| points', tire1[1], '| même tirage au second toucher :', tire1[0] === tire2);
console.log('erreurs', J.erreurs.length ? J.erreurs : 'aucune');
await J.fermer();
