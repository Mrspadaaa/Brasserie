import { ouvrir, sleep, photo, log, taper, toucher, ou } from './outil.mjs';
const { page, cdp, lacher } = await ouvrir();
await taper(page, cdp, 'Stocks', 'nav button, nav a, [role=tab]'); await sleep(1500);
await taper(page, cdp, 'Matériel'); await sleep(1200);
await taper(page, cdp, 'Carnets', '[role=tab],button'); await sleep(1500);
await page.evaluate(() => [...document.querySelectorAll('div,span,p,b,strong')].find((x) => x.childElementCount === 0 && x.textContent.trim() === 'ZZ TEST — tour 28')?.scrollIntoView({ block: 'center' })); await sleep(900);
const r = await page.evaluate(() => { const e = [...document.querySelectorAll('div,span,p,b,strong')].find((x) => x.childElementCount === 0 && x.textContent.trim() === 'ZZ TEST — tour 28'); const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; });
await toucher(cdp, r.x, r.y); await sleep(2000);
if (!(await page.evaluate(() => [...document.querySelectorAll('textarea')].some((e) => /Ajouter à ZZ/.test(e.placeholder))))) { log('PAS DANS ZZ'); lacher(); process.exit(1); }
await taper(page, cdp, 'Plus', 'button'); await sleep(1000);
await photo(page, 'F1-menu');
const opts = await page.evaluate(() => [...document.querySelectorAll('button,[role=menuitem]')].filter((b) => b.getBoundingClientRect().width > 0).map((b) => (b.getAttribute('aria-label') || b.textContent.trim()).slice(0, 40)).filter((t) => /Suppr|Retir|Effac/.test(t)));
log('options', opts);
const s = opts.find((t) => /Supprimer/.test(t));
if (s) { const q = await ou(page, s, 'button,[role=menuitem]'); await toucher(cdp, q.x, q.y); await sleep(1300); await photo(page, 'F2-confirm');
  const c = await page.evaluate(() => [...document.querySelectorAll('button')].filter((b) => b.getBoundingClientRect().width > 0).map((b) => b.textContent.trim()).filter((t) => /^(Supprimer|Confirmer|Oui)/.test(t))); log('confirm', c);
  if (c.length) { const q2 = await ou(page, c[c.length - 1], 'button'); await toucher(cdp, q2.x, q2.y); await sleep(2000); } }
await sleep(10000);
await page.reload({ waitUntil: 'domcontentloaded' }); await sleep(5000);
await photo(page, 'F3-carnets');
const tx = (await page.evaluate(() => document.body.innerText)).replace(/\n+/g, ' | ');
log('compte', tx.match(/Carnets \| (\d+)/)?.[1], 'ZZ restant', tx.includes('ZZ TEST'), 'Armoire', tx.match(/Armoire de rangement malte \| [^|]*\|/)?.[0]);
lacher();
