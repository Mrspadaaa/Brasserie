import { ouvrir, sleep, photo, log, boutons, toucher, ou } from './outil.mjs';
import { etat } from './lire.mjs';
import { outils, court } from './commun.mjs';
const { page, cdp, lacher } = await ouvrir();
page.on('framenavigated', (f) => { if (f === page.mainFrame()) log('NAVIGATION', f.url()); });
const { tap } = outils(page, cdp);
const nav = async (n) => { await tap(n, 'nav button, nav a'); await sleep(2200); await page.evaluate(() => scrollTo(0, 0)); };
const liens = () => page.evaluate(() => [...document.querySelectorAll('button,a,[role=button]')].filter((b) => /calendrier|agenda/i.test((b.getAttribute('aria-label') || '') + b.textContent) && !b.closest('nav')).map((b) => { const r = b.getBoundingClientRect(); return { t: (b.getAttribute('aria-label') || b.textContent.trim()).slice(0, 70), x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width }; }));
for (const s of ['Finances', 'Brassins']) {
  await nav(s); const l = await liens(); log(s, 'liens', l);
  const c = l.find((x) => x.w > 0); if (c) { await page.evaluate((y) => scrollBy(0, y - 400), c.y); await sleep(400); const c2 = (await liens()).find((x) => x.t === c.t); await toucher(cdp, c2.x, c2.y); await sleep(2500); await photo(page, 'R10-' + s, false); log(s, 'calendrier', court(await etat(page)), JSON.stringify((await etat(page)).periode)); log(s, 'rangées', await page.evaluate(() => [...document.querySelectorAll('button')].map((b) => b.getAttribute('aria-label') || '').filter((a) => /^Masquer /.test(a)))); }
}
await nav('Stocks'); log('Stocks liens', await liens()); await photo(page, 'R10-Stocks', true);
const mat = await ou(page, 'Matériel', 'button,[role=tab],a'); if (mat) { await toucher(cdp, mat.x, mat.y); await sleep(1800); log('Matériel liens', await liens()); await photo(page, 'R10-Materiel', true); }
await nav('Bord');
const ag = await page.evaluate(() => { const t = document.body.innerText; const i = t.indexOf('Agenda'); return t.slice(i, i + 600); }); log('agenda texte', ag.replace(/\n+/g, ' | '));
log('agenda ZZ', await page.evaluate(() => [...document.querySelectorAll('body *')].filter((x) => x.childElementCount === 0 && /ZZ TEST/.test(x.textContent)).map((x) => { const r = x.getBoundingClientRect(); const lab = x.closest('label'); const btn = x.closest('button,a,[role=button]'); const cb = (lab || x.parentElement?.parentElement)?.querySelector('input[type=checkbox],[role=checkbox]'); const cr = cb?.getBoundingClientRect(); return { t: x.textContent, x: r.left + r.width / 2, y: r.top + r.height / 2, label: !!lab, btn: btn ? (btn.getAttribute('aria-label') || btn.tagName) : null, cb: cb ? { x: cr.left + cr.width / 2, y: cr.top + cr.height / 2, checked: cb.checked ?? cb.getAttribute('aria-checked'), a: cb.getAttribute('aria-label') } : null }; })));
const agb = await ou(page, 'Agenda', 'h2,h3,summary,button'); if (agb) await page.evaluate((y) => scrollBy(0, y - 150), agb.y);
await sleep(500); await photo(page, 'R11-00-bord-agenda', false);
lacher();
