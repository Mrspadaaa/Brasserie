// E41-1 rejoué : retrait de ZZ TEST — Achat (date déplacée), bouton « Confirmer le retrait » amené à l'écran avant de toucher
import { ouvrir, sleep, photo, log, ou, toucher } from './outil.mjs';
import { outils, texte } from './commun.mjs';
const { page, cdp, lacher } = await ouvrir(); const o = outils(page, cdp);
page.on('console', (m) => { if (/error|warn/.test(m.type())) log('CONSOLE', m.type(), m.text().slice(0, 300)); });
setTimeout(() => { log('U DÉLAI'); lacher(); process.exit(2); }, 200000);
const zz = () => page.evaluate(() => [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')).filter((x) => /ZZ TEST/.test(x)));
await o.fermerHaut(); await o.nav('Finances'); await o.tap('Opérations', '[role=tab],button'); await sleep(1300);
log('U0', await zz());
const r = await page.evaluate((re) => { const e = [...document.querySelectorAll('button,[role=button]')].find((x) => new RegExp(re).test(x.getAttribute('aria-label') || '')); if (!e) return null; e.scrollIntoView({ block: 'center' }); const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; }, process.argv[2] || '^ZZ TEST — Achat');
if (!r) { log('U pas d achat'); lacher(); process.exit(0); }
await sleep(400); await toucher(cdp, r.x, r.y); await sleep(1400);
await o.tap('Corriger une erreur de saisie', 'button,summary,[role=button]'); await sleep(900);
await o.tap('Retirer cette écriture', 'button'); await sleep(900);
for (let essai = 1; essai <= 2; essai++) {
  const c = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].filter((x) => /^Confirmer le retrait/.test(x.textContent.trim()) && x.getBoundingClientRect().width > 0).pop(); if (!b) return null; b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, dis: b.disabled }; });
  log('U bouton', essai, c); if (!c) break;
  await sleep(500); await photo(page, `U${essai}-avant`);
  await toucher(cdp, c.x, c.y); await sleep(3500);
  await photo(page, `U${essai}-apres`); log('U après', essai, (await texte(page)).slice(-500).replace(/\n/g, ' ¦ '));
  log('U alertes', await page.evaluate(() => [...document.querySelectorAll('[role=alert],[role=status]')].map((e) => e.innerText.trim()).filter(Boolean)));
}
await o.fermerHaut(); await o.nav('Finances'); await o.tap('Opérations', '[role=tab],button'); await sleep(1500); log('U fin', await zz()); await photo(page, 'U9-ops', true);
lacher(); process.exit(0);
