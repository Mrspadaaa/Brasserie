import { ouvrir, sleep, photo, log, taper, toucher, ou } from './outil.mjs';
const { page, cdp, lacher } = await ouvrir();
const NOM = 'Armoire de rangement malte';
await taper(page, cdp, 'Carnets', '[role=tab],button'); await sleep(1500);
await page.evaluate((n) => [...document.querySelectorAll('div,span,p,b,strong')].find((x) => x.childElementCount === 0 && x.textContent.trim() === n)?.scrollIntoView({ block: 'center' }), NOM); await sleep(900);
const r = await page.evaluate((n) => { const e = [...document.querySelectorAll('div,span,p,b,strong')].find((x) => x.childElementCount === 0 && x.textContent.trim() === n); const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; }, NOM);
await toucher(cdp, r.x, r.y); await sleep(2500);
await photo(page, 'R-armoire-avant');
const ph = await page.evaluate(() => [...document.querySelectorAll('textarea')].map((e) => e.placeholder)); log('placeholder', ph);
if (!ph.some((p) => p.includes('Armoire'))) { log('PAS DANS ARMOIRE'); lacher(); process.exit(1); }
await taper(page, cdp, 'Articles, actions', 'button'); await sleep(1000);
const sel = [...await page.evaluate(() => [...document.querySelectorAll('button')].map((b) => b.getAttribute('aria-label') || '').filter((a) => a.startsWith('Retirer l’article')))]; log('retirables', sel);
const cible = sel.find((a) => a.includes('Schwerlastregal'));
if (cible) {
  await page.evaluate((a) => document.querySelector(`button[aria-label="${a}"]`).scrollIntoView({ block: 'center' }), cible); await sleep(700);
  const b = await page.evaluate((a) => { const x = document.querySelector(`button[aria-label="${a}"]`).getBoundingClientRect(); return { x: x.left + x.width / 2, y: x.top + x.height / 2 }; }, cible);
  await toucher(cdp, b.x, b.y); await sleep(1500); await photo(page, 'R-armoire-retire');
  await sleep(12000);
}
await page.reload({ waitUntil: 'domcontentloaded' }); await sleep(5000);
await photo(page, 'R-armoire-apres');
const tx = (await page.evaluate(() => document.body.innerText)).replace(/\n+/g, ' | '); log('après', tx.slice(140, 700));
lacher();
