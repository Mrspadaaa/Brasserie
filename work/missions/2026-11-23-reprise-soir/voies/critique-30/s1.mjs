import { ouvrir, sleep, photo, log, toucher } from './outil.mjs';
const { page, cdp, lacher } = await ouvrir();
const c = await page.evaluate(() => { const e = [...document.querySelectorAll('textarea,input')].find((x) => /Une idée/.test(x.placeholder)); const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; });
await toucher(cdp, c.x, c.y); await sleep(300);
await page.keyboard.type('ZZ TEST — tour 30'); await page.keyboard.press('Enter'); await sleep(2500);
await photo(page, '01-cree');
log('CREE', (await page.evaluate(() => document.body.innerText)).replace(/\n+/g, ' | ').slice(0, 500));
await sleep(6000);
const r = await page.evaluate(() => { const e = [...document.querySelectorAll('div,span,p,b,strong')].find((x) => x.childElementCount === 0 && x.textContent.trim() === 'ZZ TEST — tour 30'); if (!e) return null; e.scrollIntoView({ block: 'center' }); const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; });
await sleep(600);
if (r) { await toucher(cdp, r.x, r.y); await sleep(2500); }
await photo(page, '02-zz-ouvert');
log('ZZ', (await page.evaluate(() => document.body.innerText)).replace(/\n+/g, ' | ').slice(150, 900));
log('champs', await page.evaluate(() => [...document.querySelectorAll('textarea,input')].map((e) => e.placeholder)));
lacher();
