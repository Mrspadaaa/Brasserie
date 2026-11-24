// « + autre » (Client / Chez) : toucher au centre exact, puis voir ce qui s'ouvre
import { ouvrir, sleep, photo, log, ou, toucher } from './outil.mjs';
import { outils } from './commun.mjs';
const { page, cdp, lacher } = await ouvrir();
const o = outils(page, cdp);
for (let i = 0; i < 3; i++) { const f = await ou(page, 'Fermer', 'button'); if (f && f.t < 40) { await toucher(cdp, f.x, f.y); await sleep(600); } }
await o.nav('Finances');
await o.tap('Actions rapides'); await sleep(800); await o.tap('Écriture, à la main'); await sleep(1200);
for (const [s, code] of [['Vente', 'T1'], ['Achat', 'T2']]) {
  await o.tap(s, 'button'); await sleep(1000);
  const b = await page.evaluate(() => { const e = [...document.querySelectorAll('button')].find((x) => /^\+?\s*autre$/i.test(x.textContent.trim()) && x.getBoundingClientRect().width > 0 && x.getBoundingClientRect().top > 200); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, html: e.outerHTML.slice(0, 200) }; });
  log(code, 'bouton', b);
  const avant = await page.evaluate(() => document.querySelectorAll('input').length);
  await toucher(cdp, b.x, b.y); await sleep(1300);
  await photo(page, code + '-autre-touche');
  log(code, 'inputs', avant, '→', await page.evaluate(() => [...document.querySelectorAll('input')].filter((e) => e.getBoundingClientRect().width > 0).map((e) => (e.getAttribute('aria-label') || e.placeholder) + (document.activeElement === e ? ' [focus]' : ''))));
  await page.keyboard.type('ZZ', { delay: 80 }); await sleep(900); await photo(page, code + '-autre-tape');
  log(code, 'apres frappe', await page.evaluate(() => [...document.querySelectorAll('input')].filter((e) => e.getBoundingClientRect().width > 0).map((e) => (e.getAttribute('aria-label') || e.placeholder) + '=' + e.value)));
  await o.tap('changer', 'button'); await sleep(900);
}
lacher();
