// Retrait de ZZ TEST — Achat : message sous « Confirmer le retrait » ; puis soldes après, période du Calendrier
import { ouvrir, sleep, photo, log, ou, toucher } from './outil.mjs';
import { outils, texte } from './commun.mjs';
import fs from 'node:fs';
const { page, cdp, lacher } = await ouvrir();
const o = outils(page, cdp);
page.on('console', (m) => { if (/error|warn/.test(m.type())) log('CONSOLE', m.type(), m.text().slice(0, 240)); });
page.on('pageerror', (e) => log('PAGEERROR', String(e).slice(0, 240)));
setTimeout(() => { log('F DÉLAI'); lacher(); process.exit(2); }, 300000);
const fermer = async () => { for (let i = 0; i < 4; i++) { const f = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].filter((x) => /^Fermer$/.test(x.getAttribute('aria-label') || x.textContent.trim()) && x.getBoundingClientRect().width > 0).pop(); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }); if (!f) break; await toucher(cdp, f.x, f.y); await sleep(700); } };
const ops = async () => { await fermer(); await o.nav('Finances'); await o.tap('Opérations', 'button,[role=tab]'); await sleep(1300); const x = await ou(page, 'Effacer la recherche', 'button'); if (x) { await toucher(cdp, x.x, x.y); await sleep(900); } };
const zz = () => page.evaluate(() => [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')).filter((x) => /ZZ TEST/.test(x)));
await ops();
const r = await page.evaluate(() => { const e = [...document.querySelectorAll('button,[role=button]')].find((x) => /^ZZ TEST — Achat/.test(x.getAttribute('aria-label') || '') && x.getBoundingClientRect().width > 0); if (!e) return null; e.scrollIntoView({ block: 'center' }); const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; });
if (r) {
  await sleep(300); await toucher(cdp, r.x, r.y); await sleep(1400);
  await o.tap('Corriger une erreur de saisie', 'button,summary,[role=button]'); await sleep(900);
  await o.tap('Retirer cette écriture', 'button'); await sleep(900);
  const c = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].filter((x) => /^Confirmer le retrait/.test(x.textContent.trim()) && x.getBoundingClientRect().width > 0).pop(); if (!b) return null; b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await sleep(500); await photo(page, 'F1-confirmer');
  if (c) { await toucher(cdp, c.x, c.y); await sleep(2500); }
  await page.evaluate(() => { for (const e of document.querySelectorAll('[role=dialog] *')) if (e.scrollHeight > e.clientHeight + 20 && getComputedStyle(e).overflowY !== 'visible') e.scrollTop = 99999; }); await sleep(600);
  await photo(page, 'F2-apres-confirmer');
  log('F2', (await texte(page)).split('Confirmer le retrait').slice(1).join('|').slice(0, 500).replace(/\n/g, ' ¦ '), '| alertes:', await page.evaluate(() => [...document.querySelectorAll('[role=alert],[role=status]')].map((e) => e.innerText.trim()).filter(Boolean)));
}
await ops(); log('F3 restants', await zz()); await photo(page, 'F3-ops', true);
const s = await o.soldes('F4');
await o.nav('Calendrier'); await sleep(1500);
log('F5 période', await page.evaluate(() => ({ ls: localStorage.getItem('laffinee.calendrier.fenetre-locale'), cadre: (document.querySelector('.ent-cadre') || {}).innerText, bouton: [...document.querySelectorAll('button')].map((b) => b.getAttribute('aria-label') || '').find((a) => /période, liste/.test(a)), zz: [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')).filter((x) => /ZZ TEST/.test(x)) })));
await photo(page, 'F5-calendrier');
fs.writeFileSync('apres.json', JSON.stringify(s, null, 1));
lacher(); process.exit(0);
