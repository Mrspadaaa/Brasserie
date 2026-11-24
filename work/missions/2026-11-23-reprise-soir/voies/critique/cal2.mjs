import { ouvrir, sleep, photo, log, taper, toucher } from './outil.mjs';
const { page, cdp, lacher } = await ouvrir();
const nom = await page.evaluate(() => { const e = [...document.querySelectorAll('textarea')].filter((x) => x.getBoundingClientRect().width > 0).find((x) => !x.placeholder); e.scrollIntoView({ block: 'center' }); const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; });
await toucher(cdp, nom.x, nom.y); await sleep(300); await page.keyboard.type('ZZ TEST — barre'); await sleep(300);
await taper(page, cdp, 'Ajouter en S48', 'button'); await sleep(2500);
await photo(page, 'C2-cree');
const barre = await page.evaluate(() => { const e = [...document.querySelectorAll('button,[role=button]')].find((x) => (x.getAttribute('aria-label') || x.textContent).includes('ZZ TEST — barre') && x.getBoundingClientRect().width > 0); if (!e) return null; e.scrollIntoView({ block: 'center', inline: 'center' }); const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2, w: b.width, l: b.left, a: e.getAttribute('aria-label') }; });
log('barre', barre);
if (!barre) { lacher(); process.exit(1); }
await sleep(800);
const b = await page.evaluate((a) => { const e = [...document.querySelectorAll('button,[role=button]')].find((x) => (x.getAttribute('aria-label') || '') === a); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, barre.a);
await photo(page, 'C3-avant-glisser');
const pt = (x, y) => ({ x: Math.round(x), y: Math.round(y), id: 1, radiusX: 4, radiusY: 4, force: 1 });
await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [pt(b.x, b.y)] });
await sleep(600);
for (let i = 1; i <= 12; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [pt(b.x + i * 6, b.y)] }); await sleep(30); }
await sleep(300); await photo(page, 'C4-pendant-glisser');
log('pendant', await page.evaluate(() => [...document.querySelectorAll('*')].filter((x) => x.childElementCount === 0 && /J0|prête|→|jours?|\bj\b/.test(x.textContent) && x.getBoundingClientRect().top > 100 && x.getBoundingClientRect().top < 700).slice(0, 6).map((x) => { const r = x.getBoundingClientRect(); return x.textContent.trim().slice(0, 40) + ' @' + Math.round(r.left) + ',' + Math.round(r.top) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height); })));
await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
await sleep(1500); await photo(page, 'C5-apres-glisser');
const tx = (await page.evaluate(() => document.body.innerText)).replace(/\n+/g, ' | '); const i = tx.indexOf('ZZ TEST'); log('après', tx.slice(i - 100, i + 300));
lacher();
