import { ouvrir, sleep, photo, log, boutons, toucher, ou, glisser } from './outil.mjs';
import { etat } from './lire.mjs';
import { court, outils } from './commun.mjs';
const { page, cdp, lacher } = await ouvrir();
const { tap } = outils(page, cdp);
await page.evaluate(() => scrollTo(0, 0));
await tap('An', '[role=dialog] button, button'); await sleep(1200); await page.keyboard.press('Escape'); await sleep(800);
log('An', court(await etat(page)));
for (let i = 0; i < 6; i++) {
  const e = await etat(page); const d = e.duree || '';
  const m = /(\d+) mois/.exec(d); if (m && +m[1] >= 19 && +m[1] <= 21) break;
  const p = await ou(page, 'Poignée de fin');
  if (!p) { log('pas de poignée'); break; }
  await glisser(cdp, p.x, p.y, Math.min(388, p.x + 40), p.y, { tenir: 80, n: 10 });
  await sleep(1200); log('pas', i, court(await etat(page)));
}
await page.evaluate(() => scrollTo(0, 0)); await sleep(600);
await photo(page, 'C2-01-haut', false);
const mes = () => page.evaluate(() => {
  const W = innerWidth, H = innerHeight;
  const nav = document.querySelector('nav')?.getBoundingClientRect();
  // éléments larges du calendrier : fonds de rangées et grilles
  const larges = [...document.querySelectorAll('main *, [data-calendrier] *')].filter((e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > W * 0.8 && r.height > 20 && (s.backgroundColor !== 'rgba(0, 0, 0, 0)' || s.backgroundImage !== 'none'); }).slice(0, 25).map((e) => { const r = e.getBoundingClientRect(); return `${e.tagName}.${(e.className?.baseVal ?? e.className).toString().slice(0, 50)} x${Math.round(r.left)}-${Math.round(r.right)} y${Math.round(r.top)}-${Math.round(r.bottom)} bg ${getComputedStyle(e).backgroundColor}`; });
  return { W, H, nav: nav && [Math.round(nav.top), Math.round(nav.bottom)], scrollH: document.scrollingElement.scrollHeight, larges };
});
log('mesures haut', await mes());
await page.evaluate(() => scrollTo(0, 99999)); await sleep(900);
await photo(page, 'C2-02-bas', false);
log('mesures bas', await mes());
lacher();
