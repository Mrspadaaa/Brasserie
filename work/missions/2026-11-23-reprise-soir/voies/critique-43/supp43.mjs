import { ouvrir, sleep, photo, log, ou, toucher } from './outil.mjs';
import { outils, texte } from './commun.mjs';
const { page, cdp, lacher } = await ouvrir();
const o = outils(page, cdp);
setTimeout(() => { log('T DÉLAI'); lacher(); process.exit(2); }, 560000);
const fermer = async () => { for (let i = 0; i < 4; i++) { const f = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].filter((x) => /^Fermer$/.test(x.getAttribute('aria-label') || x.textContent.trim()) && x.getBoundingClientRect().width > 0).pop(); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }); if (!f) break; await toucher(cdp, f.x, f.y); await sleep(700); } };
const ops = async () => { await fermer(); await o.nav('Finances'); await o.tap('Opérations', 'button,[role=tab]'); await sleep(1300); const x = await ou(page, 'Effacer la recherche', 'button'); if (x) { await toucher(cdp, x.x, x.y); await sleep(900); } };
const liste = () => page.evaluate(() => [...document.querySelectorAll('button,[role=button]')].map((e) => e.getAttribute('aria-label') || '').filter((x) => /ZZ TEST — /.test(x) && !/Joindre|Marquer/.test(x)));
const viser = async (a) => { const r = await page.evaluate((a) => { const e = [...document.querySelectorAll('button,[role=button]')].find((x) => x.getAttribute('aria-label') === a); if (!e) return null; e.scrollIntoView({ block: 'center' }); const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; }, a); if (r) { await sleep(300); await toucher(cdp, r.x, r.y); await sleep(1300); } return r; };

// 0. Remboursement +1 de ZZ TEST — Achat (pour E41-1)
await fermer(); await o.nav('Finances'); await o.tap('Actions rapides'); await sleep(800); await o.tap('Écriture, à la main'); await sleep(1300);
{ const r = await page.evaluate(() => { const e = [...document.querySelectorAll('button')].find((b) => b.getBoundingClientRect().width > 0 && /^Remboursement/.test(b.textContent.trim())); const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; }); await toucher(cdp, r.x, r.y); await sleep(1300); }
{ const it = await page.evaluate(() => { const e = [...document.querySelectorAll('button,[role=option],li')].filter((x) => x.getBoundingClientRect().width > 0 && x.getBoundingClientRect().top > 500 && /^ZZ TEST — Achat/.test(x.textContent.trim())).pop(); if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.left + 60, y: b.top + b.height / 2, tag: e.tagName }; }); log('T0 item', it); if (it) { await toucher(cdp, it.x, it.y); await sleep(1300); } }
await photo(page, 'T0-remb-choisi');
{ const m = await page.$('input[aria-label="Montant en CHF"], textarea[aria-label="Montant en CHF"]'); if (m) { const b = await m.boundingBox(); await toucher(cdp, b.x + b.width / 2, b.y + b.height / 2); await m.focus(); await page.keyboard.type('1', { delay: 60 }); await sleep(600); } else log('T0 pas de montant'); }
await page.evaluate(() => document.activeElement && document.activeElement.blur()); await sleep(500); await photo(page, 'T0-remb-montant');
{ const f = await page.evaluate(() => { const bs = [...document.querySelectorAll('button')].filter((b) => { const r = b.getBoundingClientRect(); return r.width > 0 && r.top > 760 && r.top < 800; }); const b = bs[bs.length - 1]; if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, t: b.textContent.trim(), d: b.disabled }; }); log('T0 bouton', f); if (f && !f.d && !/Mon mois|De quelle/.test(f.t)) { await toucher(cdp, f.x, f.y); await sleep(2000); await photo(page, 'T0-remb-fin'); log('T0 fin', (await texte(page)).slice(-400).replace(/\n/g, ' ¦ ')); } }
await fermer();
const ko = new Set(); const nbEssais = {};
for (let n = 0; n < 30; n++) {
  await ops();
  const l = await liste(); if (!l.length) { log('T plus de ZZ'); break; }
  // Remboursements d'abord, puis le reste
  const cible = [...l.filter((x) => /^ZZ TEST — Achat/.test(x)), ...l].find((x) => !ko.has(x));
  if (!cible) { log('T restent (non retirables)', l); break; }
  const avant = l.filter((x) => x === cible).length;
  log('T cible', cible);
  await viser(cible);
  const essai = (nbEssais[cible] = (nbEssais[cible] || 0) + 1);
  await o.tap('Corriger une erreur de saisie', 'button,summary,[role=button]'); await sleep(900);
  const s = await ou(page, 'Retirer cette écriture', 'button'); if (!s) { log('T pas de Retirer', (await o.b()).slice(-8)); ko.add(cible); continue; }
  await toucher(cdp, s.x, s.y); await sleep(1000);
  await photo(page, `T-confirmer-${n}`, !/Achat/.test(cible)); log('T confirmer', (await texte(page)).split('Retirer cette écriture').pop().slice(0, 400).replace(/\n/g, ' ¦ '));
  const c = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].filter((x) => /^Confirmer le retrait/.test(x.textContent.trim()) && x.getBoundingClientRect().width > 0).pop(); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  if (c) { await toucher(cdp, c.x, c.y); await sleep(1600); }
  if (true) { await photo(page, `T-apres-${n}`, !/Achat/.test(cible)); log('T achat après', (await texte(page)).slice(-400).replace(/\n/g, ' ¦ ')); }
  await ops(); const apres = (await liste()).filter((x) => x === cible).length;
  log('T résultat', cible.slice(0, 40), avant, '→', apres);
  if (apres >= avant && essai >= 2) ko.add(cible);
}
await ops(); await photo(page, 'T9-operations'); log('T9 restants', await liste());
lacher(); process.exit(0);
