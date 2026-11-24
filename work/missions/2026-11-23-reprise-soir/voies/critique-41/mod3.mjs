// Modifier : Achat depuis Finances (3,50 → 4,50, date au curseur), Vente depuis Calendrier (4,80 → 3,80)
import { ouvrir, sleep, photo, log, ou, toucher } from './outil.mjs';
import { outils, texte } from './commun.mjs';
const { page, cdp, lacher } = await ouvrir();
const o = outils(page, cdp);
setTimeout(() => { log('N DÉLAI'); lacher(); process.exit(2); }, 400000);
const fermer = async () => { for (let i = 0; i < 4; i++) { const f = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].filter((x) => /^Fermer$/.test(x.getAttribute('aria-label') || x.textContent.trim()) && x.getBoundingClientRect().width > 0).pop(); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }); if (!f) break; await toucher(cdp, f.x, f.y); await sleep(700); } };
const exact = async (t) => { const r = await page.evaluate((t) => { const b = [...document.querySelectorAll('button')].filter((x) => x.getBoundingClientRect().width > 0 && (x.textContent.trim() === t || (x.getAttribute('aria-label') || '').startsWith(t))).pop(); if (!b) return null; b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, t); if (!r) { log('N introuvable', t); return null; } await sleep(300); await toucher(cdp, r.x, r.y); await sleep(1000); return r; };
const montant = async (v) => { const hs = await page.$$('input,textarea'); let el = null; for (const h of hs) { if (await h.evaluate((e) => e.getBoundingClientRect().width > 0 && /Montant/.test((e.getAttribute('aria-label') || '') + (e.placeholder || '')))) el = h; } if (!el) { log('N pas de montant'); return; } await el.evaluate((e) => e.scrollIntoView({ block: 'center' })); const b = await el.boundingBox(); await toucher(cdp, b.x + b.width / 2, b.y + b.height / 2); await sleep(300); await el.focus(); await page.keyboard.down('Control'); await page.keyboard.press('a'); await page.keyboard.up('Control'); await page.keyboard.press('Backspace'); await page.keyboard.type(v, { delay: 60 }); await sleep(600); log('N montant', await el.evaluate((e) => e.value)); };
const curseur = async (code, dx) => {
  const d = await exact('Date de l’opération'); await sleep(600); await photo(page, code + '-date-ouverte', true);
  const sl = await page.evaluate(() => { const s = [...document.querySelectorAll('[role=slider]')].find((e) => e.getBoundingClientRect().width > 0); if (!s) return null; const r = s.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; });
  if (!sl) { log(code, 'pas de curseur', (await o.b()).slice(-14)); return; }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: sl.x, y: sl.y, id: 1 }] }); await sleep(150);
  for (let i = 1; i <= 20; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: Math.round(sl.x + (i * dx) / 20), y: sl.y, id: 1 }] }); await sleep(40); }
  await sleep(300); await photo(page, code + '-curseur-pendant');
  log(code, 'pendant', await page.evaluate(() => [...document.querySelectorAll('button,[role=slider]')].filter((b) => b.getBoundingClientRect().width > 0).map((b) => b.getAttribute('aria-valuetext') || b.getAttribute('aria-label') || b.textContent.trim()).filter((x) => /Date|nov\.|déc\.|Payé|Reçu/.test(x)).slice(0, 8)));
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(800);
};
// 1. Achat depuis Finances
await fermer(); await o.nav('Finances'); await o.tap('Opérations', 'button,[role=tab]'); await sleep(1300);
{ const x = await ou(page, 'Effacer la recherche', 'button'); if (x) { await toucher(cdp, x.x, x.y); await sleep(900); } }
const a = await ou(page, 'ZZ TEST — Achat ·', 'button,[role=button]', true); await sleep(400);
await toucher(cdp, a.x, a.y); await sleep(1300);
await exact('Modifier'); await sleep(1200); await photo(page, 'N1-achat-modifier');
await montant('4,50'); await photo(page, 'N2-achat-montant', true);
log('N2 pied', await page.evaluate(() => [...document.querySelectorAll('button')].filter((b) => b.getBoundingClientRect().top > 760 && b.getBoundingClientRect().width > 0).map((b) => b.textContent.trim())));
await curseur('N3', -40); await photo(page, 'N3-apres');
await exact('Enregistrer'); await sleep(1800); await photo(page, 'N4-achat-enregistre'); log('N4', (await texte(page)).slice(-400).replace(/\n/g, ' ¦ '));
await fermer(); await o.nav('Finances'); await o.tap('Opérations', 'button,[role=tab]'); await sleep(1300);
log('N5 ops', await page.evaluate(() => [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')).filter((x) => /ZZ TEST — Achat/.test(x))));
// 2. Vente depuis Calendrier
await o.nav('Calendrier'); await sleep(1500);
const v = await page.evaluate(() => { const e = [...document.querySelectorAll('[aria-label]')].find((x) => /^ZZ TEST — Vente,/.test(x.getAttribute('aria-label')) && x.getBoundingClientRect().width > 0); e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
await sleep(400); await toucher(cdp, v.x, v.y); await sleep(1200); await exact('Ouvrir'); await sleep(1500); await exact('Modifier'); await sleep(1500);
await montant('3,80'); await photo(page, 'N6-vente-montant');
await exact('Enregistrer'); await sleep(1800); await photo(page, 'N7-vente-enregistree', true);
await fermer(); await o.nav('Calendrier'); await sleep(1500); await photo(page, 'N8-cal');
log('N8 cal', await page.evaluate(() => [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')).filter((x) => /ZZ TEST — (Vente|Achat)|à dépenser/.test(x))));
log('N8 pastilles', await page.evaluate(() => (document.body.innerText.match(/(Ventes|Achats)\n[^\n]+\n[^\n]+/g) || [])));
lacher(); process.exit(0);
