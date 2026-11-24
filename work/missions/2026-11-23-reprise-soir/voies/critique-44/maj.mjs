// Amène l'onglet au paquet du tour 44 : update du SW, avis « Nouvelle version » capturé et touché, sinon reload.
import { ouvrir, sleep, photo, log, ou, toucher, APP } from './outil.mjs';
const { page, cdp, lacher } = await ouvrir();
setTimeout(() => { log('MAJ délai'); lacher(); process.exit(2); }, 250000);
const src = () => page.evaluate(() => [...document.scripts].map((s) => s.src).filter((s) => /index-/.test(s))).catch(() => []);
const avis = () => page.evaluate(() => { const e = [...document.querySelectorAll('*')].filter((x) => x.childElementCount === 0 && /Nouvelle version/.test(x.textContent) && x.getBoundingClientRect().width > 0)[0]; if (!e) return null; const p = e.parentElement.getBoundingClientRect(); return { t: e.parentElement.innerText.replace(/\n/g, ' '), top: Math.round(p.top), h: Math.round(p.height) }; }).catch(() => null);
for (let k = 0; k < 6 && !(await src()).some((x) => /Cz4Lt44o/.test(x)); k++) {
  log('MAJ', k, await src());
  await page.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); if (r) await r.update(); }).catch((e) => log('sw', String(e).slice(0, 80)));
  for (let i = 0; i < 6 && !(await avis()); i++) await sleep(2500);
  const a = await avis(); log('MAJ avis', a);
  if (a) { await photo(page, `M1-avis-${k}`); const r = await ou(page, 'Recharger', 'button'); if (r) { await toucher(cdp, r.x, r.y); await sleep(7000); continue; } }
  await page.goto(APP, { waitUntil: 'networkidle2' }).catch(() => undefined); await sleep(5000);
}
log('MAJ src fin', await src()); await photo(page, 'M2-apres', true);
lacher(); process.exit(0);
