// Gestes fins : « + autre » tapé, compte cyclé, curseur lent et long, toucher la piste, Annuler et Saisir un autre
import { ouvrir, sleep, photo, log, ou, toucher } from './outil.mjs';
import { outils, texte } from './commun.mjs';
const { page, cdp, lacher } = await ouvrir();
const o = outils(page, cdp);
setTimeout(() => { log('G DÉLAI'); lacher(); process.exit(2); }, 420000);
const lire = () => page.evaluate(() => {
  const s = [...document.querySelectorAll('[role=slider]')].find((e) => e.getBoundingClientRect().width > 0);
  const d = [...document.querySelectorAll('button')].find((b) => /^Date :/.test(b.getAttribute('aria-label') || ''));
  const n = [...document.querySelectorAll('button')].find((b) => /^Nom/.test(b.getAttribute('aria-label') || ''));
  const r = s && s.getBoundingClientRect();
  const st = [...document.querySelectorAll('button')].find((b) => /^(Payé|Reçu)/.test(b.textContent.trim()) && b.getBoundingClientRect().top < 400 && b.getBoundingClientRect().width > 0);
  return { val: s && s.getAttribute('aria-valuetext'), x: r && Math.round(r.left + r.width / 2), y: r && Math.round(r.top + r.height / 2), l: r && Math.round(r.left), w: r && Math.round(r.width), pastille: d && d.textContent.trim(), titre: n && n.textContent.trim(), statut: st && st.textContent.trim() };
});
const ouvrirSaisie = async (sorte, k = 0) => {
  for (let i = 0; i < 3; i++) { const f = await ou(page, 'Fermer', 'button'); if (f && f.t < 60) { await toucher(cdp, f.x, f.y); await sleep(600); } }
  await o.tap('Actions rapides'); await sleep(800); await o.tap('Écriture, à la main'); await sleep(1200);
  if (!sorte) return;
  const r = await page.evaluate((s, k) => { const e = [...document.querySelectorAll('[role=dialog] button')].filter((b) => b.getBoundingClientRect().width > 0 && b.textContent.trim().startsWith(s))[k]; if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, sorte, k);
  await toucher(cdp, r.x, r.y); await sleep(1100);
};
const montant = async (v) => { await page.evaluate(() => { const i = document.querySelector('input[aria-label="Montant en CHF"]'); i.focus(); i.select(); }); await page.keyboard.type(v, { delay: 50 }); await sleep(400); };
const finBtn = async () => { const f = await page.evaluate(() => { const bs = [...document.querySelectorAll('button')].filter((b) => { const r = b.getBoundingClientRect(); return r.width > 0 && r.top > 760 && r.top < 800; }); const b = bs[bs.length - 1]; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, t: b.textContent.trim() }; }); await toucher(cdp, f.x, f.y); await sleep(1800); return f.t; };
const titre = async (t) => { const c = await ou(page, 'Nom, facultatif', 'button'); if (!c) { log('pas de crayon'); return; } await toucher(cdp, c.x, c.y); await sleep(500); await page.keyboard.type(t, { delay: 25 }); await page.keyboard.press('Enter'); await sleep(500); };
await o.nav('Finances');
// 3b. curseur lent et long vers le passé, piste entière (E35-4)
await ouvrirSaisie('Vente');
await o.tap('Date :', 'button'); await sleep(800);
let s = await lire();
const piste = await page.evaluate(() => { const t = [...document.querySelectorAll('[role=slider]')].find((e) => e.getBoundingClientRect().width > 0); let p = t.parentElement; while (p && p.getBoundingClientRect().width < 200) p = p.parentElement; const r = p.getBoundingClientRect(); return { l: Math.round(r.left), r: Math.round(r.right) }; });
log('G7 piste', piste, s);
const cible = piste.l + 30;
await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: s.x, y: s.y, id: 1 }] }); await sleep(200);
for (let i = 1; i <= 80; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: Math.round(s.x + (i * (cible - s.x)) / 80), y: s.y, id: 1 }] }); await sleep(80); if (i % 20 === 0) log('G7 pendant', i, await lire()); }
await sleep(1500); s = await lire(); log('G7 doigt arrêté', s); await photo(page, 'G7-doigt-arrete');
await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(1500);
log('G7 lâché', await lire()); await photo(page, 'G7-lache');
await o.tap('Date :', 'button'); await sleep(800); log('G7 rouvert', await lire());
// 6. Saisir un autre
await o.tap('changer', 'button'); await sleep(900);
{ const r = await page.evaluate(() => { const e = [...document.querySelectorAll('[role=dialog] button')].find((b) => b.getBoundingClientRect().width > 0 && b.textContent.trim() === 'Achat'); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }); if (r) { await toucher(cdp, r.x, r.y); await sleep(1000); } }
await titre('ZZ TEST — Saisir un autre'); await montant('1');
log('G6 enregistrer', await finBtn()); await photo(page, 'G6-fin', true);
await o.tap('Saisir un autre', 'button'); await sleep(1300); await photo(page, 'G6-saisir-autre');
log('G6 après', await lire(), (await texte(page)).slice(0, 300).replace(/\n/g, ' ¦ '));
// Opérations
for (let i = 0; i < 3; i++) { const f = await ou(page, 'Fermer', 'button'); if (f && f.t < 60) { await toucher(cdp, f.x, f.y); await sleep(600); } }
await o.nav('Finances'); await o.tap('Opérations', 'button,[role=tab]'); await sleep(1300); { const x = await ou(page, 'Effacer la recherche', 'button'); if (x) { await toucher(cdp, x.x, x.y); await sleep(900); } }
await photo(page, 'O1-operations');
log('O1 zz', await page.evaluate(() => [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')).filter((x) => /ZZ TEST/.test(x))));
log('O1 texte', (await texte(page)).replace(/\n/g, ' ¦ ').slice(0, 2500));
lacher(); process.exit(0);
