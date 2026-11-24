import { ouvrir, sleep, photo, log, toucher, ou } from './outil.mjs';
const { page, cdp, lacher } = await ouvrir();
const p = await ou(page, 'Plus d’actions', 'button'); await toucher(cdp, p.x, p.y); await sleep(1000);
await photo(page, 'C7-menu');
const opts = await page.evaluate(() => [...document.querySelectorAll('button,[role=menuitem]')].filter((b) => b.getBoundingClientRect().width > 0).map((b) => (b.getAttribute('aria-label') || b.textContent.trim()).slice(0, 30)).filter((t) => /Suppr|Retir|Effac|Annul/.test(t)));
log('options', opts);
const s = opts.find((t) => /Suppr/.test(t));
if (s) { const r = await ou(page, s, 'button,[role=menuitem]'); await toucher(cdp, r.x, r.y); await sleep(1200); await photo(page, 'C8-suppr');
  const c = await page.evaluate(() => [...document.querySelectorAll('button')].filter((b) => b.getBoundingClientRect().width > 0).map((b) => b.textContent.trim()).filter((t) => /^Supprimer|Confirmer|Oui/.test(t))); log('confirm', c);
  if (c.length) { const r2 = await ou(page, c[c.length - 1], 'button'); await toucher(cdp, r2.x, r2.y); await sleep(2000); }
}
await sleep(8000);
await photo(page, 'C9-fin');
log('reste ZZ', await page.evaluate(() => [...document.querySelectorAll('button,[role=button]')].filter((x) => (x.getAttribute('aria-label') || x.textContent).includes('ZZ TEST')).length));
lacher();
