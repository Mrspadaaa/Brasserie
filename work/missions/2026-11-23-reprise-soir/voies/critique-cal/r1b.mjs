import { ouvrir, sleep, photo, log, toucher } from './outil.mjs';
import { etat } from './lire.mjs';
const { page, cdp, lacher } = await ouvrir();
const champ = (a) => page.evaluate((a) => { const e = [...document.querySelectorAll('input')].find((x) => x.getAttribute('aria-label')?.startsWith(a) && x.getBoundingClientRect().width > 0); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, v: e.value, ph: e.placeholder }; }, a);
for (const [a, v] of [['Du', '01.01.2024'], ['Au', '31.12.2027']]) {
  const c = await champ(a); log(a, c); if (!c) break;
  await toucher(cdp, c.x, c.y); await sleep(400);
  await page.keyboard.type(v, { delay: 40 }); await sleep(500);
  log(a + ' tapé', await champ(a));
  await page.keyboard.press('Enter'); await sleep(900);
  log(a + ' après Entrée', await champ(a));
}
await photo(page, 'R1-02-plage4ans');
log('texte feuille', (await page.evaluate(() => document.querySelector('[role=dialog]')?.innerText || '')).replace(/\n+/g, ' | ').slice(0, 400));
lacher();
