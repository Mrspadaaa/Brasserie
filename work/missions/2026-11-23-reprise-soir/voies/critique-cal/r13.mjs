import { ouvrir, sleep, photo, log, toucher, ou } from './outil.mjs';
import { etat } from './lire.mjs';
import { court } from './commun.mjs';
const { page, cdp, lacher } = await ouvrir();
const cible = (re) => page.evaluate((s) => { const e = [...document.querySelectorAll('*')].filter((x) => x.childElementCount === 0 && new RegExp(s).test(x.textContent.trim()) && x.getBoundingClientRect().width > 0)[0]; if (!e) return null; const c = e.closest('button,a,[role=button],li') || e; c.scrollIntoView({ block: 'center' }); const b = c.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2, t: c.textContent.trim().slice(0, 60), tag: c.tagName }; }, re);
const dlg = async () => (await page.evaluate(() => [...document.querySelectorAll('[role=dialog]')].map((d) => d.innerText).join(' ## ') || 'pas de dialog')).replace(/\n+/g, ' | ').slice(0, 300);
const bord = async () => { const r = await ou(page, 'Bord', 'nav button, nav a'); await toucher(cdp, r.x, r.y); await sleep(2500); };
for (const [nom, re] of [['semaine', '^Cette semaine au calendrier$'], ['zz', '^ZZ TEST — barre$'], ['fete', '^vi$']]) {
  await bord();
  let r = await cible(re); log(nom, r); if (!r) continue;
  await sleep(500); r = await cible(re); await photo(page, 'R13-' + nom + '-0', true);
  await toucher(cdp, r.x, r.y); await sleep(2500);
  await photo(page, 'R13-' + nom + '-1', false);
  const e = await etat(page); log(nom, 'après', court(e), '| feuille', await dlg());
  log(nom, 'texte', (await page.evaluate(() => document.body.innerText)).replace(/\n+/g, ' | ').slice(0, 200));
  const f = await ou(page, 'Fermer', '[role=dialog] button'); if (f) { await toucher(cdp, f.x, f.y); await sleep(800); } else { await page.keyboard.press('Escape'); await sleep(600); }
}
lacher();
