// Carte de fin : Saisir un autre, puis Annuler (ZZ TEST — Annuler 0,30) ; Opérations sans ZZ après
import { ouvrir, sleep, photo, log, ou, toucher } from './outil.mjs';
import { outils, texte } from './commun.mjs';
const { page, cdp, lacher } = await ouvrir();
const o = outils(page, cdp);
page.on('console', (m) => { if (/error|warn/.test(m.type())) log('CONSOLE', m.type(), m.text().slice(0, 240)); });
page.on('pageerror', (e) => log('PAGEERROR', String(e).slice(0, 240)));
setTimeout(() => { log('N DÉLAI'); lacher(); process.exit(2); }, 200000);
const saisir = async (nom, m) => {
  await o.tap('Achat', 'button'); await sleep(1000);
  const c = await ou(page, 'Nom, facultatif', 'button'); await toucher(cdp, c.x, c.y); await sleep(500); await page.keyboard.type(nom, { delay: 30 }); await page.keyboard.press('Enter'); await sleep(400);
  const el = await page.$('input[aria-label="Montant en CHF"], textarea[aria-label="Montant en CHF"]'); const b = await el.boundingBox(); await toucher(cdp, b.x + b.width / 2, b.y + b.height / 2); await el.focus(); await page.keyboard.type(m, { delay: 60 }); await sleep(500);
  await page.evaluate(() => document.activeElement && document.activeElement.blur()); await sleep(400);
  const f = await page.evaluate(() => { const bs = [...document.querySelectorAll('button')].filter((b) => { const r = b.getBoundingClientRect(); return r.width > 0 && r.top > 760 && r.top < 800; }); const b = bs[bs.length - 1]; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, t: b.textContent.trim() }; });
  log('N enregistrer', f); await toucher(cdp, f.x, f.y); await sleep(2000);
};
await o.nav('Finances'); await o.tap('Actions rapides'); await sleep(800); await o.tap('Écriture, à la main'); await sleep(1300);
await saisir('ZZ TEST — Saisir un autre', '0,20'); await photo(page, 'N1-fin', true);
await o.tap('Saisir un autre', 'button'); await sleep(1200); await photo(page, 'N2-saisir-un-autre'); log('N2', (await texte(page)).split('Saisir à la main').pop().slice(0, 300).replace(/\n/g, ' ¦ '));
await saisir('ZZ TEST — Annuler', '0,30'); await photo(page, 'N3-fin', true);
await o.tap('Annuler', 'button'); await sleep(1800); await photo(page, 'N4-annule'); log('N4', (await texte(page)).slice(-300).replace(/\n/g, ' ¦ '));
for (let i = 0; i < 3; i++) { const f = await ou(page, 'Fermer', 'button'); if (f) { await toucher(cdp, f.x, f.y); await sleep(700); } }
await o.nav('Finances'); await o.tap('Opérations', 'button,[role=tab]'); await sleep(1300);
log('N5 ops', await page.evaluate(() => [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')).filter((x) => /ZZ TEST/.test(x))));
// retrait de ZZ TEST — Saisir un autre
{ const r = await page.evaluate(() => { const e = [...document.querySelectorAll('button,[role=button]')].find((x) => /^ZZ TEST — Saisir un autre/.test(x.getAttribute('aria-label') || '') && x.getBoundingClientRect().width > 0); if (!e) return null; e.scrollIntoView({ block: 'center' }); const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; });
  if (r) { await sleep(300); await toucher(cdp, r.x, r.y); await sleep(1400); await o.tap('Corriger une erreur de saisie', 'button,summary,[role=button]'); await sleep(900); await o.tap('Retirer cette écriture', 'button'); await sleep(900);
    const c = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].filter((x) => /^Confirmer le retrait/.test(x.textContent.trim()) && x.getBoundingClientRect().width > 0).pop(); if (!b) return null; b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }); if (c) { await sleep(400); await toucher(cdp, c.x, c.y); await sleep(2200); } } }
for (let i = 0; i < 3; i++) { const f = await ou(page, 'Fermer', 'button'); if (f) { await toucher(cdp, f.x, f.y); await sleep(700); } }
await o.nav('Finances'); await o.tap('Opérations', 'button,[role=tab]'); await sleep(1300);
log('N6 ops', await page.evaluate(() => [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')).filter((x) => /ZZ TEST/.test(x))));
await o.nav('Calendrier'); await sleep(1500); log('N7', await page.evaluate(() => [...document.querySelectorAll('button')].map((b) => b.getAttribute('aria-label') || '').find((a) => /CHF à dépenser/.test(a))));
lacher(); process.exit(0);
