// BR-62 : liste des styles (Combobox) coupée ; mesure la largeur de la liste ouverte et des options.
import { ouvrir, etape, capture, dormir } from './banc.mjs';
const largeur = Number(process.argv[2] ?? 1280);
const { browser, page } = await ouvrir({ largeur, hauteur: largeur < 600 ? 844 : 900 });
await etape(page, 'Identité');
const champ = await page.evaluateHandle(() => [...document.querySelectorAll('input,textarea')].find((i) => (i.getAttribute('aria-label') || '') === 'Style de la bière'));
const el = champ.asElement();
await el.evaluate((e) => e.scrollIntoView({ block: 'center' }));
await el.click({ clickCount: 3 }); await page.keyboard.press('Backspace'); await page.keyboard.type('a'); await dormir(800);
const m = await page.evaluate(() => {
  const lb = document.querySelector('[role=listbox]');
  const opts = [...document.querySelectorAll('[role=option]')];
  const r = lb?.getBoundingClientRect();
  return { liste: r ? { w: Math.round(r.width), x: Math.round(r.x) } : null, n: opts.length,
    tronquees: opts.filter((o) => o.scrollWidth > o.clientWidth + 1 || [...o.querySelectorAll('*')].some((c) => c.scrollWidth > c.clientWidth + 1)).length,
    exemples: opts.slice(0, 3).map((o) => o.textContent.trim().slice(0, 60)) };
});
console.log(largeur, JSON.stringify(m));
await capture(page, `s7-styles-${largeur}`);
await browser.close();
