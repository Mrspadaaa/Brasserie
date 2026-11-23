import { ouvrir, sleep, photo, log, boutons, toucher, ou } from './outil.mjs';
import { outils } from './commun.mjs';
const { page, cdp, lacher } = await ouvrir();
const { tap } = outils(page, cdp);
const nav = async (n) => { const r = await ou(page, n, 'nav button, nav a'); await toucher(cdp, r.x, r.y); await sleep(2500); };
const geo = () => page.evaluate(() => {
  const W = innerWidth, H = innerHeight;
  // plus grand élément fixe/absolu visible couvrant (voile) et panneau du menu
  const fx = [...document.querySelectorAll('body *')].filter((e) => { const s = getComputedStyle(e); const r = e.getBoundingClientRect(); return (s.position === 'fixed') && r.width > 100 && r.height > 100; }).map((e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return `${e.tagName}.${String(e.className).slice(0, 60)} [${Math.round(r.left)},${Math.round(r.top)} → ${Math.round(r.right)},${Math.round(r.bottom)}] bg ${s.backgroundColor} bf ${s.backdropFilter} z ${s.zIndex}`; });
  return { W, H, fx };
});
for (const ecran of ['Bord', 'Calendrier', 'Stocks', 'Finances']) {
  await nav(ecran); await page.evaluate(() => scrollTo(0, 300)); await sleep(600);
  const f = await ou(page, 'Actions rapides', 'button'); await toucher(cdp, f.x, f.y); await sleep(1200);
  await photo(page, 'C8-plus-' + ecran, false);
  log('plus', ecran, await geo());
  log('plus boutons', ecran, (await boutons(page)).filter((b) => !/^(Bord|Finances|Calendrier|Brassins|Stocks|Clients)/.test(b)).slice(-16));
  const x = await ou(page, 'Fermer', 'button'); const ar = await ou(page, 'Actions rapides', 'button');
  if (ar) { await toucher(cdp, ar.x, ar.y); } else await page.keyboard.press('Escape');
  await sleep(800);
}
lacher();
