// node cal.mjs <code> [duree] — Calendrier : chaque ZZ TEST (rangée, date, montant), solde à dépenser, captures en défilant
import { ouvrir, sleep, photo, log, ou, toucher, glisser } from './outil.mjs';
import { outils } from './commun.mjs';
const [code, duree] = process.argv.slice(2);
const { page, cdp, lacher } = await ouvrir();
const o = outils(page, cdp);
for (let i = 0; i < 3; i++) { const f = await ou(page, 'Fermer', 'button'); if (f && f.t < 40) { await toucher(cdp, f.x, f.y); await sleep(600); } }
await o.nav('Calendrier'); await sleep(1500);
if (duree) {
  await o.tap('· période, liste, tri et filtre', 'button'); await sleep(800);
  await photo(page, `${code}-menu`, true); log(code, 'menu', (await o.b()).filter((x) => /sem|mois|an|Liste|tri|filtre/i.test(x)).slice(0, 30));
  await o.tap(duree, 'button,[role=option],[role=radio]'); await sleep(800);
  const f = await ou(page, 'Fermer', 'button'); if (f) { await toucher(cdp, f.x, f.y); await sleep(600); } else { await page.keyboard.press('Escape'); await sleep(500); }
}
const lire = () => page.evaluate(() => {
  const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const lab = (e) => e.getAttribute('aria-label') || '';
  const zz = [...document.querySelectorAll('[aria-label]')].filter((e) => /ZZ TEST/.test(lab(e)) && vis(e)).map((e) => { const r = e.getBoundingClientRect(); return lab(e).slice(0, 110) + ' @' + Math.round(r.left) + ',' + Math.round(r.top) + ' ' + Math.round(r.width) + 'w'; });
  const dep = [...document.querySelectorAll('button')].map(lab).find((a) => /CHF à dépenser/.test(a));
  const rangees = [...document.querySelectorAll('button')].map(lab).filter((a) => /^Masquer /.test(a)).map((a) => a.replace('Masquer ', ''));
  const cadre = (document.querySelector('.ent-cadre') || {}).innerText;
  const zzTexte = [...document.querySelectorAll('*')].filter((x) => x.childElementCount === 0 && /ZZ TEST/.test(x.textContent) && vis(x)).map((x) => x.textContent.trim().slice(0, 60));
  return { dep, cadre, rangees, zz, zzTexte };
});
let e = await lire(); log(code, 'haut', e);
await photo(page, `${code}-0`);
for (let i = 1; i <= 4; i++) {
  const y0 = await page.evaluate(() => [...document.querySelectorAll('[aria-label^="Masquer"]')].map((e) => Math.round(e.getBoundingClientRect().top)).join(',')); await glisser(cdp, 200, 690, 200, 260, { n: 14, pas: 25 }); await sleep(600); const fin = y0 === await page.evaluate(() => [...document.querySelectorAll('[aria-label^="Masquer"]')].map((e) => Math.round(e.getBoundingClientRect().top)).join(','));
  await sleep(800); await photo(page, `${code}-${i}`); log(code, 'defile ' + i, (await lire()).zz);
  if (fin) break;
}
lacher();
