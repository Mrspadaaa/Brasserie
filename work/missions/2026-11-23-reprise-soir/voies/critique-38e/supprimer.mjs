// 1) Modifier « ZZ TEST — Vente » depuis le Calendrier (Ouvrir › Modifier : 4,80 → 3,80 ; date) ; 2) supprimer toutes les écritures ZZ TEST
import { ouvrir, sleep, photo, log, ou, toucher } from './outil.mjs';
import { outils, texte } from './commun.mjs';
const { page, cdp, lacher } = await ouvrir();
const o = outils(page, cdp);
setTimeout(() => { log('S DÉLAI'); lacher(); process.exit(2); }, 560000);
const effacer = async () => { const x = await ou(page, 'Effacer la recherche', 'button'); if (x) { await toucher(cdp, x.x, x.y); await sleep(900); } };
const ops = async () => { await o.nav('Finances'); await o.tap('Opérations', 'button,[role=tab]'); await sleep(1200); await effacer(); };
const champ = async (ph, v) => { const p = await page.evaluate((ph) => { const e = [...document.querySelectorAll('textarea,input')].find((x) => (x.placeholder || x.getAttribute('aria-label')) === ph && x.getBoundingClientRect().width > 0); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, ph); if (!p) { log('champ absent', ph); return; } await toucher(cdp, p.x, p.y); await sleep(300); await page.keyboard.down('Control'); await page.keyboard.press('a'); await page.keyboard.up('Control'); await page.keyboard.press('Backspace'); await page.keyboard.type(v, { delay: 70 }); await sleep(400); };
// 1. Calendrier › Vente › Ouvrir › Modifier
if (process.argv[2] !== 'seul') {
  await o.nav('Calendrier'); await sleep(1200);
  const v = await page.evaluate(() => { const e = [...document.querySelectorAll('[aria-label]')].find((x) => /^ZZ TEST — Vente,/.test(x.getAttribute('aria-label')) && x.getBoundingClientRect().width > 0); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await toucher(cdp, v.x, v.y); await sleep(1200); await o.tap('Ouvrir', 'button'); await sleep(1500); await o.tap('Modifier', 'button'); await sleep(1500);
  await champ('Montant (CHF)', '3,80'); await champ('JJ.MM.AAAA', '16.12.2026'); await photo(page, 'S0-vente-modifiee', false);
  await o.tap('Enregistrer', 'button'); await sleep(1800); await photo(page, 'S0-vente-enregistree', false);
  log('S0 ops', await page.evaluate(() => [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')).filter((x) => /ZZ TEST — Vente/.test(x))));
  await o.nav('Calendrier'); await sleep(1500); await photo(page, 'S0-cal-apres-modif');
  log('S0 cal', await page.evaluate(() => [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')).filter((x) => /ZZ TEST — Vente|CHF à dépenser/.test(x))));
}
// 2. suppression
let premier = true;
for (let n = 0; n < 20; n++) {
  await ops();
  const z = await ou(page, 'ZZ TEST — ', 'button,[role=button]', true);
  if (!z) { log('S fin : plus de ZZ'); break; }
  log('S cible', z.aria);
  await toucher(cdp, z.x, z.y); await sleep(1300);
  if (premier) await photo(page, 'S1-detail', false);
  await o.tap('Corriger une erreur de saisie', 'button,summary,[role=button]'); await sleep(900);
  if (premier) { await photo(page, 'S2-corriger', false); log('S2 boutons', (await o.b()).slice(-10)); }
  const s = await ou(page, 'Retirer cette écriture', 'button'); if (!s) { log('S pas de Supprimer', (await o.b()).slice(-8)); break; }
  await toucher(cdp, s.x, s.y); await sleep(1000);
  if (premier) { await photo(page, 'S3-confirmer', false); log('S3 boutons', (await o.b()).slice(-8)); }
  const c = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].filter((x) => /^Confirmer le retrait/.test(x.textContent.trim()) && x.getBoundingClientRect().width > 0).pop(); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, t: b.textContent.trim() }; });
  if (c) { log('S confirme', c.t); await toucher(cdp, c.x, c.y); await sleep(1500); }
  if (premier) { await photo(page, 'S4-apres', false); log('S4', (await texte(page)).slice(-300).replace(/\n/g, ' ¦ ')); }
  premier = false;
}
await ops(); await photo(page, 'S9-operations');
log('S9 restants', await page.evaluate(() => [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')).filter((x) => /ZZ TEST/.test(x))));
lacher(); process.exit(0);
