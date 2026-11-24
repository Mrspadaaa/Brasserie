// H : habituel « De ma poche » (vue apport de sa plainte 2334) et titre par défaut qui suit le curseur (2339), sur Vente, Autre entrée, Achat ; rien enregistré sauf l'habituel en ZZ à 1 CHF
import { ouvrir, sleep, photo, log, ou, toucher } from './outil.mjs';
import { outils, texte } from './commun.mjs';
const { page, cdp, lacher } = await ouvrir();
const o = outils(page, cdp);
setTimeout(() => { log('H DÉLAI'); lacher(); process.exit(2); }, 280000);
const fermerTout = async () => { for (let i = 0; i < 4; i++) { const f = await ou(page, 'Fermer', 'button'); if (f && f.t < 40) { await toucher(cdp, f.x, f.y); await sleep(700); } else break; } };
const ouvrirSaisie = async () => { await fermerTout(); await o.nav('Finances'); await o.tap('Actions rapides'); await sleep(800); await o.tap('Écriture, à la main'); await sleep(1200); };
const tuile = async (s, k = 0) => { const r = await page.evaluate((s, k) => { const e = [...document.querySelectorAll('[role=dialog] button')].filter((b) => b.getBoundingClientRect().width > 0 && b.textContent.trim().startsWith(s))[k]; if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, s, k); if (r) { await toucher(cdp, r.x, r.y); await sleep(1200); } return r; };
const titre = () => page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /^Nom/.test(x.getAttribute('aria-label') || '') && x.getBoundingClientRect().width > 0); const d = [...document.querySelectorAll('button')].find((x) => /^Date :/.test(x.getAttribute('aria-label') || '') && x.getBoundingClientRect().width > 0); return { titre: b && b.textContent.trim(), date: d && d.textContent.trim() }; });
const curseur = async (code, dx) => {
  await o.tap('Date :', 'button'); await sleep(800);
  const sl = await page.evaluate(() => { const s = [...document.querySelectorAll('[role=slider]')].find((e) => e.getBoundingClientRect().width > 0); if (!s) return null; const r = s.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; });
  if (!sl) { log(code, 'pas de curseur'); return; }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: sl.x, y: sl.y, id: 1 }] }); await sleep(150);
  for (let i = 1; i <= 30; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: Math.round(sl.x + (i * dx) / 30), y: sl.y, id: 1 }] }); await sleep(40); }
  await sleep(300); log(code, 'pendant', await titre()); await photo(page, code + '-pendant');
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(900);
  log(code, 'lâché', await titre()); await photo(page, code + '-lache', true);
};
// 1. titre par défaut qui suit le curseur
for (const [code, s, k] of [['H1', 'Vente', 0], ['H2', 'Autre', 1], ['H3', 'Achat', 0], ['H4', 'Apport', 0]]) {
  await ouvrirSaisie(); await tuile(s, k); log(code, 'avant', await titre());
  const m = await page.$('input[aria-label="Montant en CHF"]'); const b = await m.boundingBox(); await toucher(cdp, b.x + b.width / 2, b.y + b.height / 2); await m.focus(); await page.keyboard.type('2', { delay: 60 }); await sleep(400);
  await curseur(code, -70);
}
// 2. habituel De ma poche
await ouvrirSaisie(); await tuile('De ma poche'); await sleep(800);
await photo(page, 'H5-habituel'); log('H5', (await o.b()).slice(0, 30));
log('H5 champs', await page.evaluate(() => [...document.querySelectorAll('input,textarea,[role=checkbox]')].filter((e) => e.getBoundingClientRect().width > 0).map((e) => `${e.type || e.getAttribute('role')} «${e.getAttribute('aria-label') || e.placeholder || ''}» ${e.value ?? ''}`)));
await page.evaluate(() => { for (const e of document.querySelectorAll('*')) if (e.scrollHeight > e.clientHeight + 20 && getComputedStyle(e).overflowY !== 'visible') e.scrollTop = 9999; }); await sleep(500);
await photo(page, 'H5-habituel-bas');
await fermerTout();
lacher(); process.exit(0);
