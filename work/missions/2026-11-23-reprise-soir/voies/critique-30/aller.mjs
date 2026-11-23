// node aller.mjs <carnet|-> [pre] : Stocks › Matériel › Carnets, puis ouvre le carnet nommé (- = rester sur la liste)
import { ouvrir, sleep, photo, log, toucher, taper, ou } from './outil.mjs';
const [nom, pre] = process.argv.slice(2);
const { page, cdp, lacher } = await ouvrir();
if (!(await ou(page, 'Carnets', '[role=tab],button'))) { await taper(page, cdp, 'Stocks', 'nav button, nav a, [role=tab], button'); await sleep(1200); await taper(page, cdp, 'Matériel'); await sleep(1200); }
await taper(page, cdp, 'Carnets', '[role=tab],button'); await sleep(1500);
if (nom !== '-') {
  const f = () => page.evaluate((n) => { const e = [...document.querySelectorAll('div,span,p,b,strong')].find((x) => x.childElementCount === 0 && x.textContent.trim().startsWith(n)); if (!e) return null; e.scrollIntoView({ block: 'center' }); const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; }, nom);
  await f(); await sleep(600); const r = await f(); if (r) { await toucher(cdp, r.x, r.y); await sleep(2000); }
}
if (pre) await photo(page, pre);
log('aller', nom, (await page.evaluate(() => document.body.innerText)).replace(/\n+/g, ' | ').slice(150, 900));
lacher();
