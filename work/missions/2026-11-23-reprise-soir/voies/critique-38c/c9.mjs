import { ouvrir, sleep, photo, log, boutons, toucher, ou } from './outil.mjs';
const { page, cdp, lacher } = await ouvrir();
const nav = async (n) => { const r = await ou(page, n, 'nav button, nav a'); await toucher(cdp, r.x, r.y); await sleep(3000); };
await nav('Bord'); await page.evaluate(() => scrollTo(0, 0)); await sleep(800);
for (const k of [1, 2]) {
  const f = await ou(page, 'Actions rapides', 'button'); log('fab', f);
  await toucher(cdp, f.x, f.y); await sleep(1500);
  const v = await page.evaluate(() => { const e = document.querySelector('.plus-voile'); const r = e?.getBoundingClientRect(); return { voile: r ? [r.left, r.top, r.right, r.bottom] : null, exp: document.querySelector('[aria-label="Actions rapides"]')?.getAttribute('aria-expanded'), menu: [...document.querySelectorAll('button')].filter((b) => /Écriture, à la main/.test(b.getAttribute('aria-label') || b.textContent)).length }; });
  log('essai', k, v);
  await photo(page, 'C9-plus-Bord-' + k, false);
  if (v.voile) break;
}
lacher();
