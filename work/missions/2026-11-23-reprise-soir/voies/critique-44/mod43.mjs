// Modifier : depuis le Calendrier (Vente 4,80 → 3,80), depuis Finances (Achat : date seule, puis montant 4,50), Apport et Loyer ouverts sans enregistrer. E40-4, E41-4, E41-5.
import { ouvrir, sleep, photo, log, ou, toucher } from './outil.mjs';
import { outils, texte } from './commun.mjs';
const { page, cdp, lacher } = await ouvrir();
const o = outils(page, cdp);
page.on('console', (m) => { if (/error|warn/.test(m.type())) log('CONSOLE', m.type(), m.text().slice(0, 240)); });
page.on('pageerror', (e) => log('PAGEERROR', String(e).slice(0, 240)));
setTimeout(() => { log('M DÉLAI'); lacher(); process.exit(2); }, 560000);
const fermer = async () => { for (let i = 0; i < 4; i++) { const f = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].filter((x) => /^Fermer$/.test(x.getAttribute('aria-label') || x.textContent.trim()) && x.getBoundingClientRect().width > 0).pop(); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }); if (!f) break; await toucher(cdp, f.x, f.y); await sleep(700); } };
const zz = () => page.evaluate(() => [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')).filter((x) => /ZZ TEST|CHF à dépenser/.test(x)));
const montant = async (v) => { const p = await page.evaluate(() => { const e = [...document.querySelectorAll('input,textarea')].find((i) => i.getBoundingClientRect().width > 0 && /Montant/.test(i.getAttribute('aria-label') || i.placeholder || '')); if (!e) return null; e.focus(); e.select(); return e.getAttribute('aria-label') || e.placeholder; }); log('montant champ', p); if (p) { await page.keyboard.down('Control'); await page.keyboard.press('a'); await page.keyboard.up('Control'); await page.keyboard.type(v, { delay: 60 }); await sleep(600); } };
const finBtn = () => page.evaluate(() => { const b = [...document.querySelectorAll('button')].filter((x) => x.getBoundingClientRect().width > 0 && /^(Enregistrer|Payé|Reçu|À payer|À recevoir)/.test(x.textContent.trim()) && x.getBoundingClientRect().top > 700).pop(); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, t: b.textContent.trim(), d: b.disabled }; });
const champs = async (code) => log(code + ' champs', await page.evaluate(() => [...document.querySelectorAll('input,textarea,[role=slider]')].filter((e) => e.getBoundingClientRect().width > 0).map((e) => (e.getAttribute('aria-label') || e.placeholder || e.getAttribute('role')) + '=' + (e.value ?? e.getAttribute('aria-valuetext')))));
const changer = async (code) => {
  const ch = await ou(page, 'changer', 'button'); if (!ch) { log(code + ' PAS DE changer'); return; }
  await toucher(cdp, ch.x, ch.y); await sleep(1100); await photo(page, code + '-changer'); log(code + ' changer', (await o.b()).slice(0, 30));
  const ch3 = await ou(page, 'changer', 'button'); if (ch3) { await toucher(cdp, ch3.x, ch3.y); await sleep(800); } await photo(page, code + '-changer-replie', true);
  log(code + ' après Échap', !!(await ou(page, 'changer', 'button')), !!(await ou(page, 'Date :', 'button')));
};
const curseur = async (code, dx) => {
  const d = (await ou(page, 'Date :', 'button')) || (await page.evaluate(() => { const e = [...document.querySelectorAll('button')].find((b) => b.getBoundingClientRect().width > 0 && /^dd.dd$/.test(b.textContent.trim())); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, a: e.getAttribute('aria-label') }; })); log(code + ' pastille', d); if (d) { await toucher(cdp, d.x, d.y); await sleep(800); }
  const sl = await page.evaluate(() => { const s = [...document.querySelectorAll('[role=slider]')].find((e) => e.getBoundingClientRect().width > 0); if (!s) return null; const r = s.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; });
  if (!sl) { log(code + ' PAS DE CURSEUR'); return; }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: sl.x, y: sl.y, id: 1 }] }); await sleep(150);
  for (let i = 1; i <= 20; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: Math.round(sl.x + (i * dx) / 20), y: sl.y, id: 1 }] }); await sleep(40); }
  await sleep(300); await photo(page, code + '-curseur-pendant');
  log(code + ' pendant', await page.evaluate(() => [...document.querySelectorAll('button,[role=slider]')].filter((b) => b.getBoundingClientRect().width > 0).map((b) => b.getAttribute('aria-valuetext') || b.getAttribute('aria-label') || b.textContent.trim()).filter((x) => /Date|nov|déc|Nom/.test(x)).slice(0, 6)));
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(900);
};
const enregistrer = async (code) => { await page.evaluate(() => document.activeElement && document.activeElement.blur()); await sleep(400); await photo(page, code + '-avant-enr'); const f = await finBtn(); log(code + ' fin', f); if (f && !f.d) { await toucher(cdp, f.x, f.y); await sleep(2000); await photo(page, code + '-apres'); log(code + ' après', (await texte(page)).slice(-500).replace(/\n/g, ' ¦ ')); } };
const ops = async () => { await fermer(); await o.nav('Finances'); await o.tap('Opérations', 'button,[role=tab]'); await sleep(1300); const x = await ou(page, 'Effacer la recherche', 'button'); if (x) { await toucher(cdp, x.x, x.y); await sleep(900); } };
const ouvrirOp = async (re) => { const r = await page.evaluate((re) => { const e = [...document.querySelectorAll('button,[role=button]')].find((x) => new RegExp(re).test(x.getAttribute('aria-label') || '') && x.getBoundingClientRect().width > 0); if (!e) return null; e.scrollIntoView({ block: 'center' }); const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2, a: e.getAttribute('aria-label') }; }, re); log('op', r); if (r) { await sleep(300); await toucher(cdp, r.x, r.y); await sleep(1400); } return r; };
const detail = async (code) => log(code + ' détail', (await texte(page)).split('ZZ TEST — Achat').slice(1).join('|').slice(0, 700).replace(/\n/g, ' ¦ '));

// 1. Calendrier › Vente › Ouvrir › Modifier
await fermer(); await o.nav('Calendrier'); await sleep(1500);
const v = await page.evaluate(() => { const e = [...document.querySelectorAll('[aria-label]')].find((x) => /^ZZ TEST — Vente,/.test(x.getAttribute('aria-label')) && x.getBoundingClientRect().width > 0); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
await sleep(500); await toucher(cdp, v.x, v.y); await sleep(1400); await photo(page, 'M2-vente-touchee', true);
await o.tap('Ouvrir', 'button'); await sleep(1600); await photo(page, 'M3-vente-ouverte'); log('M3', (await o.b()).slice(-12));
await o.tap('Modifier', 'button'); await sleep(1500); await photo(page, 'M4-modifier-vente'); await champs('M4');
await changer('M4'); await photo(page, 'M4-apres-changer', true);
await montant('3,80'); await photo(page, 'M4-montant'); await enregistrer('M4');
await fermer(); await o.nav('Calendrier'); await sleep(1500);
log('M4 cal', (await zz()).filter((x) => /Vente|dépenser/.test(x)), await page.evaluate(() => (document.body.innerText.match(/Ventes\n[^\n]+\n[^\n]+/) || [''])[0]));
// 2. Finances › Achat › Modifier : date seule
await ops(); await ouvrirOp('^ZZ TEST — Achat'); await photo(page, 'M7-achat-detail'); await detail('M7');
await o.tap('Modifier', 'button'); await sleep(1500); await photo(page, 'M8-achat-modifier'); await champs('M8');
await changer('M8');
await curseur('M8', -40); await photo(page, 'M8-date-lachee'); await enregistrer('M8');
await ops(); log('M9 ops', (await zz()).filter((x) => /Achat/.test(x))); await photo(page, 'M9-ops');
await ouvrirOp('^ZZ TEST — Achat'); await photo(page, 'M9-achat-detail'); await detail('M9');
await fermer(); await o.nav('Calendrier'); await sleep(1500); log('M9 cal', (await zz()).filter((x) => /Achat|dépenser/.test(x)));
// 3. Achat › Modifier : montant 4,50
await ops(); await ouvrirOp('^ZZ TEST — Achat'); await o.tap('Modifier', 'button'); await sleep(1500);
await montant('4,50'); await photo(page, 'M10-montant'); await enregistrer('M10');
await ops(); log('M11 ops', (await zz()).filter((x) => /Achat/.test(x)));
await ouvrirOp('^ZZ TEST — Achat'); await photo(page, 'M11-achat-detail'); await detail('M11');
await fermer(); await o.nav('Calendrier'); await sleep(1500); log('M11 cal', (await zz()).filter((x) => /Achat|dépenser/.test(x)));
// 4. Apport et Loyer : Modifier ouvert, rien enregistré
for (const [c, re] of [['M12', '^ZZ TEST — Apport'], ['M13', '^ZZ TEST — Loyer']]) { await ops(); if (await ouvrirOp(re)) { await photo(page, c + '-detail', true); await o.tap('Modifier', 'button'); await sleep(1500); await photo(page, c + '-modifier'); await champs(c); await changer(c); } }
await fermer();
lacher(); process.exit(0);
