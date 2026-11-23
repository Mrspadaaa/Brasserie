import { ouvrir, sleep, photo, log, ou, toucher } from './outil.mjs';
const { page, cdp, lacher } = await ouvrir();
const d = await ou(page, 'Déplacer l’article « Kibernetik', 'button'); if (d) { await toucher(cdp, d.x, d.y); await sleep(900); }
const sel = 'button[aria-label="Retirer l’article « brewtools.com »"]';
await page.evaluate((s) => document.querySelector(s)?.scrollIntoView({ block: 'center' }), sel); await sleep(700);
await photo(page, 'D-retirer-avant');
const r = await page.evaluate((s) => { const b = document.querySelector(s); if (!b) return null; const x = b.getBoundingClientRect(); const top = document.elementFromPoint(x.left + x.width / 2, x.top + x.height / 2); return { x: x.left + x.width / 2, y: x.top + x.height / 2, w: x.width, h: x.height, visible: top === b || b.contains(top), op: getComputedStyle(b).opacity }; }, sel);
log('Retirer brewtools', r);
if (r) { await toucher(cdp, r.x, r.y); await sleep(1500); await photo(page, 'D-retirer-apres'); }
const tx = (await page.evaluate(() => document.body.innerText)).replace(/\n+/g, ' | '); log(tx.slice(tx.indexOf('ZZ TEST'), tx.indexOf('ZZ TEST') + 300));
await sleep(10000); lacher();
