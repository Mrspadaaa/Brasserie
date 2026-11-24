// Carte de fin : Annuler, puis Saisir un autre
import { ouvrir, sleep, photo, log, ou, toucher } from './outil.mjs';
import { outils, texte } from './commun.mjs';
const { page, cdp, lacher } = await ouvrir();
const o = outils(page, cdp);
setTimeout(() => { log('U DÉLAI'); lacher(); process.exit(2); }, 240000);
const fermerTout = async () => { for (let i = 0; i < 4; i++) { const f = await ou(page, 'Fermer', 'button'); if (f && f.t < 60) { await toucher(cdp, f.x, f.y); await sleep(700); } else break; } };
const saisie = async (nom, m) => {
  await fermerTout(); await o.nav('Finances'); await o.tap('Actions rapides'); await sleep(800); await o.tap('Écriture, à la main'); await sleep(1200);
  const r = await page.evaluate(() => { const e = [...document.querySelectorAll('[role=dialog] button')].filter((b) => b.getBoundingClientRect().width > 0 && b.textContent.trim() === 'Autre')[0]; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await toucher(cdp, r.x, r.y); await sleep(1100);
  const c = await ou(page, 'Nom, facultatif', 'button'); await toucher(cdp, c.x, c.y); await sleep(500); await page.keyboard.type(nom, { delay: 30 }); await page.keyboard.press('Enter'); await sleep(400);
  const el = await page.$('input[aria-label="Montant en CHF"]'); const b = await el.boundingBox(); await toucher(cdp, b.x + b.width / 2, b.y + b.height / 2); await el.focus(); await page.keyboard.type(m, { delay: 60 }); await sleep(500);
  await toucher(cdp, 195, 30); await sleep(300);
  const f = await page.evaluate(() => { const bs = [...document.querySelectorAll('button')].filter((b) => { const r = b.getBoundingClientRect(); return r.width > 0 && r.top > 760 && r.top < 800; }); const b = bs[bs.length - 1]; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, t: b.textContent.trim() }; });
  log('U enregistrer', f.t); await toucher(cdp, f.x, f.y); await sleep(1800);
};
await saisie('ZZ TEST — Annuler', '0,50'); await photo(page, 'U1-fin');
await o.tap('Annuler', 'button'); await sleep(1500); await photo(page, 'U2-annule'); log('U2', (await texte(page)).slice(-300).replace(/\n/g, ' ¦ '));
await fermerTout(); await o.nav('Finances'); await o.tap('Opérations', 'button,[role=tab]'); await sleep(1300);
log('U3 reste ?', await page.evaluate(() => [...document.querySelectorAll('[aria-label],button')].map((e) => e.getAttribute('aria-label') || e.textContent.trim()).filter((x) => /ZZ TEST — Annuler/.test(x))));
await saisie('ZZ TEST — Saisir un autre', '0,60');
await o.tap('Saisir un autre', 'button'); await sleep(1500); await photo(page, 'U4-saisir-autre'); log('U4', (await texte(page)).slice(-500).replace(/\n/g, ' ¦ '));
await fermerTout();
lacher(); process.exit(0);
