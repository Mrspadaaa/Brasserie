import { ouvrir, sleep, taper, photo, log, toucher } from './outil.mjs';
const { page, cdp, lacher } = await ouvrir();
const dansZZ = () => page.evaluate(() => [...document.querySelectorAll('textarea')].some((e) => /Ajouter à ZZ/.test(e.placeholder)));
for (let k = 0; k < 3 && !(await dansZZ()); k++) {
  if (await page.evaluate(() => [...document.querySelectorAll('button')].some((b) => b.textContent.trim().startsWith('Articles · ZZ')))) { await taper(page, cdp, 'Articles · ZZ TEST — tour 28', 'button'); await sleep(1500); continue; }
  await taper(page, cdp, 'Carnets', '[role=tab],button'); await sleep(1500);
  const p = await page.evaluate(() => { const e = [...document.querySelectorAll('div,span,p,b,strong')].find((x) => x.childElementCount === 0 && x.textContent.trim() === 'ZZ TEST — tour 28'); if (!e) return null; e.scrollIntoView({ block: 'center' }); return true; });
  await sleep(900);
  const r = await page.evaluate(() => { const e = [...document.querySelectorAll('div,span,p,b,strong')].find((x) => x.childElementCount === 0 && x.textContent.trim() === 'ZZ TEST — tour 28'); const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; });
  await toucher(cdp, r.x, r.y); await sleep(2000);
}
log('dans ZZ', await dansZZ());
if (process.argv[2]) await photo(page, process.argv[2]);
lacher();
