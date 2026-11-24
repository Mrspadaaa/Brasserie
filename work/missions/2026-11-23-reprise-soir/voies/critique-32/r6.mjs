import { ouvrir, sleep, photo, log, boutons, toucher, ou, glisser, CAP } from './outil.mjs';
import { etat } from './lire.mjs';
import { outils, court, periode } from './commun.mjs';
import fs from 'node:fs';
const { page, cdp, lacher } = await ouvrir();
page.on('framenavigated', (f) => { if (f === page.mainFrame()) log('NAVIGATION', f.url()); });
const { pas, tap, duree, barre } = outils(page, cdp);
const P = (x, y) => ({ x: Math.round(x), y: Math.round(y), id: 1, radiusX: 4, radiusY: 4, force: 1 });
const clip = async (nom, x, y, w, h) => { const c = await page.createCDPSession(); const { data } = await c.send('Page.captureScreenshot', { format: 'png', clip: { x, y, width: w, height: h, scale: 3 } }); fs.writeFileSync(CAP + '/' + nom + '.png', Buffer.from(data, 'base64')); await c.detach(); };
// 3 ans
await periode(page, cdp, tap, '01.01.2025', '31.12.2027');
await pas('R8-00-3ans', null, false);
await clip('R8-01-entete-zoom', 0, 50, 200, 40);
log('chevauche entête', await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === '±'); const rb = b.getBoundingClientRect(); return [...document.querySelectorAll('body *')].filter((x) => x.childElementCount === 0 && /dépenser/.test(x.textContent)).map((x) => { const r = x.getBoundingClientRect(); return { t: x.textContent, r: Math.round(r.right), sw: x.scrollWidth, cw: x.clientWidth, pm: Math.round(rb.left) }; }); }));
// 3 sem.
await periode(page, cdp, tap, 'Tout');
const a = await ou(page, 'Revenir à aujourd’hui', 'button'); if (a) { await toucher(cdp, a.x, a.y); await sleep(1000); }
await duree('2 sem.'); await sleep(1000);
let p = await ou(page, 'Poignée de fin', 'button,[role=slider]');
await pas('R8-02-3sem', () => glisser(cdp, p.x, p.y, p.x + 60, p.y, { tenir: 150 }), false);
// bord gauche, puis Annuler
await periode(page, cdp, tap, '27.07.2026', '06.09.2026');
await duree('6 sem.'); await sleep(1000);
let b = await barre(); await page.evaluate((y) => scrollBy(0, y - 480), b.y); await sleep(500); b = await barre(); log('barre', b, court(await etat(page)));
await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [P(b.x, b.y)] }); await sleep(600);
for (let i = 1; i <= 12; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [P(b.x + (4 - b.x) * i / 12, b.y)] }); await sleep(30); }
await sleep(1500); await photo(page, 'R8-03-bord-gauche-pendant', false); log('bord gauche pendant', court(await etat(page)), JSON.stringify(await barre()));
await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(1500);
const t = await page.evaluate(() => [...document.querySelectorAll('[role=status],[role=alert]')].map((e) => e.innerText.trim()).filter(Boolean)); log('toast', t, court(await etat(page)));
await photo(page, 'R8-04-bord-gauche-apres', true);
await pas('R8-05-annuler', () => tap('Annuler'), false); log('après Annuler', (await barre())?.a);
// renvoi : toucher la barre ZZ
b = await barre(); if (b) { await page.evaluate((y) => scrollBy(0, y - 480), b.y); await sleep(400); b = await barre(); await toucher(cdp, b.x, b.y); await sleep(1500); await photo(page, 'R9-00-zz-feuille', false); log('feuille ZZ', await boutons(page, '.'), (await page.evaluate(() => document.querySelector('[role=dialog]')?.innerText || '')).replace(/\n+/g, ' | ').slice(0, 300)); await page.keyboard.press('Escape'); await sleep(800); if (await page.evaluate(() => !!document.querySelector('[role=dialog]'))) await tap('Fermer', '[role=dialog] button'); }
// renvoi : fête vi
const ra = await ou(page, 'Revenir à aujourd’hui', 'button'); if (ra) { await toucher(cdp, ra.x, ra.y); await sleep(1000); }
await page.evaluate(() => scrollTo(0, 0)); await sleep(400);
const vi = await ou(page, 'vi, 12 oct.', 'button,[role=button]'); log('vi', vi);
if (vi) { await toucher(cdp, Math.min(vi.x, 200), vi.y); await sleep(1500); await photo(page, 'R9-01-vi', false); log('vi ouvert', (await page.evaluate(() => document.querySelector('[role=dialog]')?.innerText || 'pas de feuille')).replace(/\n+/g, ' | ').slice(0, 300), page.url()); }
lacher();
