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
// 1. Vente : + autre
await ouvrirSaisie('Vente');
const a = await page.evaluate(() => { const e = [...document.querySelectorAll('button')].find((x) => /autre$/i.test(x.textContent.trim()) && x.getBoundingClientRect().top > 200 && x.getBoundingClientRect().width > 0); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
await toucher(cdp, a.x, a.y); await sleep(900); await photo(page, 'G1-autre-ouvert', true);
await page.keyboard.type('ZZ', { delay: 90 }); await sleep(900); await photo(page, 'G1-autre-tape');
log('G1 champs', await page.evaluate(() => [...document.querySelectorAll('input')].filter((e) => e.getBoundingClientRect().width > 0).map((e) => (e.getAttribute('aria-label') || e.placeholder) + '=' + e.value + (document.activeElement === e ? ' [focus]' : ''))), 'titre', (await lire()).titre);
log('G1 options', (await o.b()).filter((x) => /ZZ|créer|Créer/.test(x)));
await page.keyboard.press('Backspace'); await page.keyboard.press('Backspace'); await sleep(400);
// 2. compte cyclé
for (let i = 0; i < 4; i++) {
  const c = await ou(page, 'Moyen de paiement', 'button'); await toucher(cdp, c.x, c.y); await sleep(700);
  const lab = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /^Moyen de paiement/.test(x.getAttribute('aria-label') || '')); return b && b.textContent.trim(); });
  log('G2 compte', i, lab, (await o.b()).filter((x) => /Banque|Espèces|Caisse|Twint|Carte/.test(x)).slice(0, 6));
  if (i === 0) await photo(page, 'G2-compte-1', true);
}
// 3. curseur lent et long vers le passé (E35-4)
await o.tap('Date :', 'button'); await sleep(800);
let s = await lire(); log('G3 avant', s);
await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: s.x, y: s.y, id: 1 }] }); await sleep(200);
for (let i = 1; i <= 60; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: Math.max(s.l + 2, Math.round(s.x - (i * 170) / 60)), y: s.y, id: 1 }] }); await sleep(70); if (i % 20 === 0) log('G3 pendant', i, await lire()); }
await sleep(1200); s = await lire(); log('G3 doigt arrêté', s); await photo(page, 'G3-doigt-arrete');
await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(1200);
log('G3 lâché', await lire()); await photo(page, 'G3-lache');
// 4. toucher la piste à droite (E35-14)
s = await lire(); if (!s.x) { await o.tap('Date :', 'button'); await sleep(800); s = await lire(); }
log('G4 avant', s); await toucher(cdp, s.x + 50, s.y); await sleep(1000); log('G4 après toucher piste +50', await lire()); await photo(page, 'G4-piste');
// 5. Achat ZZ TEST — Annuler, puis Annuler
await o.tap('changer', 'button'); await sleep(900);
{ const r = await page.evaluate(() => { const e = [...document.querySelectorAll('[role=dialog] button')].find((b) => b.getBoundingClientRect().width > 0 && b.textContent.trim() === 'Achat'); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }); log('G5 achat', !!r); if (r) { await toucher(cdp, r.x, r.y); await sleep(1000); } }
await photo(page, 'G5-apres-changer', true); log('G5 état après changer', await lire(), await page.evaluate(() => (document.querySelector('input[aria-label="Montant en CHF"]') || {}).value));
await titre('ZZ TEST — Annuler'); await montant('1');
log('G5 enregistrer', await finBtn()); await photo(page, 'G5-fin', true);
await o.tap('Annuler', 'button'); await sleep(1500); await photo(page, 'G5-annule'); log('G5 après Annuler', (await texte(page)).slice(-300).replace(/\n/g, ' ¦ '));
// 6. Saisir un autre
log('G6 état', await lire());
if (await page.$('input[aria-label="Montant en CHF"]')) {
  await titre('ZZ TEST — Saisir un autre'); await montant('1');
  log('G6 enregistrer', await finBtn()); await photo(page, 'G6-fin', true);
  await o.tap('Saisir un autre', 'button'); await sleep(1300); await photo(page, 'G6-saisir-autre');
  log('G6 après', await lire(), (await texte(page)).slice(0, 400).replace(/\n/g, ' ¦ '));
}
lacher(); process.exit(0);
