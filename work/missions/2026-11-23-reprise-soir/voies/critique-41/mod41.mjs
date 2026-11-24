// Calendrier à 6 sem. (lecture), étiquette de courbe, Vente › Ouvrir (recherche), Modifier depuis le Calendrier (Vente 4,80 → 3,80)
// puis Modifier depuis Finances (Achat 3,50 → 4,50). Période rendue à la fin.
import { ouvrir, sleep, photo, log, ou, toucher } from './outil.mjs';
import { outils, texte } from './commun.mjs';
const { page, cdp, lacher } = await ouvrir();
const o = outils(page, cdp);
setTimeout(() => { log('M DÉLAI'); lacher(); process.exit(2); }, 400000);
const fermer = async () => { for (let i = 0; i < 4; i++) { const f = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].filter((x) => /^Fermer$/.test(x.getAttribute('aria-label') || x.textContent.trim()) && x.getBoundingClientRect().width > 0).pop(); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }); if (!f) break; await toucher(cdp, f.x, f.y); await sleep(700); } };
const zz = () => page.evaluate(() => [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')).filter((x) => /ZZ TEST|CHF à dépenser/.test(x)));
const periode = async (p) => {
  const avant = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /sem\.|mois|an$/.test(x.textContent.trim()) && x.getBoundingClientRect().top < 120 && x.getBoundingClientRect().width > 60); return b && b.textContent.trim(); });
  await o.tap('· période, liste, tri et filtre', 'button'); await sleep(800);
  await photo(page, 'M0-menu-periode', true);
  await o.tap(p, 'button,[role=option],[role=radio]'); await sleep(800);
  const f = await ou(page, 'Fermer', 'button'); if (f) { await toucher(cdp, f.x, f.y); await sleep(600); }
  return avant;
};
const montant = async (v) => { const p = await page.evaluate(() => { const e = [...document.querySelectorAll('input')].find((i) => i.getBoundingClientRect().width > 0 && (/Montant/.test(i.getAttribute('aria-label') || i.placeholder || '') || /^[0-9]+,[0-9]{2}$/.test(i.value))); if (!e) return null; e.focus(); e.select(); return e.getAttribute('aria-label') || e.placeholder; }); log('montant champ', p); if (p) { await page.keyboard.type(v, { delay: 60 }); await sleep(600); } };
const finBtn = () => page.evaluate(() => { const bs = [...document.querySelectorAll('button')].filter((b) => { const r = b.getBoundingClientRect(); return r.width > 0 && r.top > 740 && r.top < 810 && !/^(Bord|Finances|Calendrier|Brassins|Stocks|Clients|Mon mois)/.test(b.textContent.trim()); }); const b = bs[bs.length - 1]; if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, t: b.textContent.trim() }; });

const explorer = async (code, sorte) => {
  log(code+' champs', await page.evaluate(() => [...document.querySelectorAll('input,textarea,[role=slider]')].filter((e) => e.getBoundingClientRect().width > 0).map((e) => (e.getAttribute('aria-label') || e.placeholder || e.getAttribute('role')) + '=' + (e.value ?? e.getAttribute('aria-valuetext')))));
  const ch = await ou(page, 'changer', 'button');
  if (ch) { await toucher(cdp, ch.x, ch.y); await sleep(1100); await photo(page, code + '-changer'); log(code + ' changer', (await o.b()).slice(0, 30)); const t = await page.evaluate((s) => { const e = [...document.querySelectorAll('button')].filter((b) => b.getBoundingClientRect().width > 0 && b.textContent.trim() === s).pop(); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, sorte); if (t) { await toucher(cdp, t.x, t.y); await sleep(1000); } else { await page.keyboard.press('Escape'); await sleep(600); } await photo(page, code + '-apres-changer', true); }
  else log(code + ' pas de changer');
  const d = await ou(page, 'Date :', 'button'); if (d) { await toucher(cdp, d.x, d.y); await sleep(800); }
  const sl = await page.evaluate(() => { const s = [...document.querySelectorAll('[role=slider]')].find((e) => e.getBoundingClientRect().width > 0); if (!s) return null; const r = s.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; });
  if (sl) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: sl.x, y: sl.y, id: 1 }] }); await sleep(150); for (let i = 1; i <= 15; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: sl.x - i * 2, y: sl.y, id: 1 }] }); await sleep(40); } await sleep(300); await photo(page, code + '-curseur-pendant'); log(code + ' pendant', await page.evaluate(() => [...document.querySelectorAll('button,[role=slider]')].filter((b) => b.getBoundingClientRect().width > 0).map((b) => b.getAttribute('aria-valuetext') || b.getAttribute('aria-label') || b.textContent.trim()).filter((x) => /Date|du d|nov|déc|Payé|Reçu|recevoir|payer/.test(x)).slice(0, 8))); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(800); }
  else log(code + ' pas de curseur');
};
await fermer();
await o.nav('Calendrier'); await sleep(1500);
const ancienne = '6 sem.';
await sleep(1200); await photo(page, 'M1-cal-6sem'); log('M1 zz', await zz());
// étiquettes de la courbe
log('M1 courbe', await page.evaluate(() => [...document.querySelectorAll('button,[role=button]')].filter((b) => b.getBoundingClientRect().top < 130 && b.getBoundingClientRect().top > 40).map((b) => (b.getAttribute('aria-label') || b.textContent.trim()).slice(0, 90))));
const et = await ou(page, 'ZZ TEST — Apport', 'button,[role=button]'); if (et && et.t < 130) { await toucher(cdp, et.x, et.y); await sleep(1300); await photo(page, 'M1b-etiquette'); log('M1b', (await texte(page)).slice(0, 600).replace(/\n/g, ' ¦ ')); await fermer(); }
// défiler pour voir les rangées
await page.evaluate(() => window.scrollBy(0, 420)); await sleep(800); await photo(page, 'M1c-cal-rangees');
await page.evaluate(() => window.scrollBy(0, 420)); await sleep(800); await photo(page, 'M1d-cal-rangees');
// Vente › Ouvrir
const v = await page.evaluate(() => { const e = [...document.querySelectorAll('[aria-label]')].find((x) => /^ZZ TEST — Vente,/.test(x.getAttribute('aria-label')) && x.getBoundingClientRect().width > 0); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
log('M2 vente', v);
if (v) {
  await sleep(500); await toucher(cdp, v.x, v.y); await sleep(1400); await photo(page, 'M2-vente-touchee'); log('M2 boutons', (await o.b()).slice(-10));
  const ov = await ou(page, 'Ouvrir', 'button');
  if (ov) {
    await toucher(cdp, ov.x, ov.y); await sleep(1600); await photo(page, 'M3-vente-ouverte');
    log('M3 recherche', await page.evaluate(() => [...document.querySelectorAll('input')].filter((i) => i.getBoundingClientRect().width > 0).map((i) => (i.getAttribute('aria-label') || i.placeholder) + '=' + i.value)));
    log('M3 boutons', (await o.b()).slice(-12));
    const m = await ou(page, 'Modifier', 'button');
    if (m) {
      await toucher(cdp, m.x, m.y); await sleep(1500); await photo(page, 'M4-modifier-cal');
      log('M4 boutons', (await o.b()).slice(-24)); await explorer('M4', 'Vente');
      await montant('3,80'); await photo(page, 'M4b-montant', true);
      const f = await finBtn(); log('M4 fin', f); if (f) { await toucher(cdp, f.x, f.y); await sleep(1800); await photo(page, 'M5-apres-modif'); log('M5', (await texte(page)).slice(-500).replace(/\n/g, ' ¦ ')); }
    } else log('M4 pas de Modifier');
  }
  await fermer();
}
// Finances › Opérations : la recherche est-elle restée ?
await o.nav('Finances'); await o.tap('Opérations', 'button,[role=tab]'); await sleep(1300);
log('M6 recherche restée', await page.evaluate(() => [...document.querySelectorAll('input')].filter((i) => i.getBoundingClientRect().width > 0).map((i) => (i.getAttribute('aria-label') || i.placeholder) + '=' + i.value)));
await photo(page, 'M6-operations', true);
{ const x = await ou(page, 'Effacer la recherche', 'button'); if (x) { await toucher(cdp, x.x, x.y); await sleep(900); } }
log('M6 vente', (await zz()).filter((x) => /Vente/.test(x)));
// Modifier l'Achat depuis Finances
const a = await ou(page, 'ZZ TEST — Achat ·', 'button,[role=button]', true);
if (a) {
  await toucher(cdp, a.x, a.y); await sleep(1300); await photo(page, 'M7-achat-detail');
  await o.tap('Modifier', 'button'); await sleep(1500); await photo(page, 'M8-achat-modifier'); log('M8 boutons', (await o.b()).slice(-24)); await explorer('M8', 'Achat');
  await montant('4,50'); const f = await finBtn(); log('M8 fin', f);
  if (f) { await toucher(cdp, f.x, f.y); await sleep(1800); await photo(page, 'M9-achat-apres'); log('M9', (await texte(page)).slice(-500).replace(/\n/g, ' ¦ ')); }
  await fermer();
}
await o.nav('Finances'); await o.tap('Opérations', 'button,[role=tab]'); await sleep(1300);
{ const x = await ou(page, 'Effacer la recherche', 'button'); if (x) { await toucher(cdp, x.x, x.y); await sleep(900); } }
log('M10 ops', (await zz()).filter((x) => /Achat|Vente/.test(x)));
await o.nav('Calendrier'); await sleep(1500); log('M11 cal', (await zz()).filter((x) => /Achat|Vente|dépenser/.test(x)));
if (ancienne && ancienne !== '6 sem.') { await periode(ancienne); log('M12 période rendue', ancienne); }
lacher(); process.exit(0);
