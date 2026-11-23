// Sonde le curseur de date : glisser au doigt (lent) dans chaque sens, avec Reçu puis À recevoir ; toucher la piste.
import { ouvrir, sleep, photo, log, ou, toucher } from './outil.mjs';
import { outils } from './commun.mjs';
const { page, cdp, lacher } = await ouvrir();
const o = outils(page, cdp);
const lire = () => page.evaluate(() => { const s = [...document.querySelectorAll('[role=slider]')].find((e) => e.getBoundingClientRect().width > 0); const d = [...document.querySelectorAll('button')].find((b) => /^Date :/.test(b.getAttribute('aria-label') || '')); const n = [...document.querySelectorAll('button')].find((b) => /^Nom/.test(b.getAttribute('aria-label') || '')); const r = s && s.getBoundingClientRect(); return { val: s && (s.getAttribute('aria-valuetext') + ' / ' + s.getAttribute('aria-valuenow')), x: r && Math.round(r.left + r.width / 2), y: r && Math.round(r.top + r.height / 2), pastille: d && d.getAttribute('aria-label'), titre: n && n.textContent.trim() }; });
for (let i = 0; i < 3; i++) { const f = await ou(page, 'Fermer', 'button'); if (f && f.t < 40) { await toucher(cdp, f.x, f.y); await sleep(600); } }
await o.nav('Finances');
await o.tap('Actions rapides'); await sleep(800); await o.tap('Écriture, à la main'); await sleep(1200);
await o.tap('Vente', 'button'); await sleep(1000); const PFX = process.argv[2] || 'C';
const drag = async (nom, dx) => {
  let s = await lire(); if (!s.x) { await o.tap('Date :', 'button'); await sleep(800); s = await lire(); } log(PFX + nom + ' ouvert', s); if (!s.x) return;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: s.x, y: s.y, id: 1 }] }); await sleep(150);
  for (let i = 1; i <= 30; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: Math.round(s.x + (i * dx) / 30), y: s.y, id: 1 }] }); await sleep(40); }
  await sleep(300); log(PFX + nom + ' avant lâcher', await lire()); await photo(page, PFX + nom + '-pendant');
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(900); await photo(page, PFX + nom + '-lache'); log(PFX + nom + ' lâché', await lire());
};
await drag('C3-recu-droite', 120);
await o.tap('À recevoir', 'button'); await sleep(600);
await drag('C4-arecevoir-droite', 120);
await drag('C5-arecevoir-gauche-loin', -170);
{ let s = await lire(); if (!s.x) { await o.tap('Date :', 'button'); await sleep(800); s = await lire(); } if (s.x) { await toucher(cdp, Math.round(s.x + 60), s.y); await sleep(900); log(PFX + 'C6 piste', await lire()); await photo(page, PFX + 'C6-piste'); } }
lacher();
