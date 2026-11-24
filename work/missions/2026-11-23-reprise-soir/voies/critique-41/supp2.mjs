import { ouvrir, sleep, photo, log, ou, toucher } from './outil.mjs';
import { outils, texte } from './commun.mjs';
const { page, cdp, lacher } = await ouvrir();
const o = outils(page, cdp);
setTimeout(() => { log('T DÉLAI'); lacher(); process.exit(2); }, 560000);
const fermer = async () => { for (let i = 0; i < 4; i++) { const f = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].filter((x) => /^Fermer$/.test(x.getAttribute('aria-label') || x.textContent.trim()) && x.getBoundingClientRect().width > 0).pop(); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }); if (!f) break; await toucher(cdp, f.x, f.y); await sleep(700); } };
const ops = async () => { await fermer(); await o.nav('Finances'); await o.tap('Opérations', 'button,[role=tab]'); await sleep(1300); const x = await ou(page, 'Effacer la recherche', 'button'); if (x) { await toucher(cdp, x.x, x.y); await sleep(900); } };
const liste = () => page.evaluate(() => [...document.querySelectorAll('button,[role=button]')].map((e) => e.getAttribute('aria-label') || '').filter((x) => /ZZ TEST — /.test(x) && !/Joindre|Marquer/.test(x)));
const viser = async (a) => { const r = await page.evaluate((a) => { const e = [...document.querySelectorAll('button,[role=button]')].find((x) => x.getAttribute('aria-label') === a); if (!e) return null; e.scrollIntoView({ block: 'center' }); const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; }, a); if (r) { await sleep(300); await toucher(cdp, r.x, r.y); await sleep(1300); } return r; };
const ko = new Set(); const nbEssais = {};
for (let n = 0; n < 30; n++) {
  await ops();
  const l = await liste(); if (!l.length) { log('T plus de ZZ'); break; }
  // Remboursements d'abord, puis le reste
  const cible = [...l.filter((x) => /^Remboursement/.test(x)), ...l].find((x) => !ko.has(x));
  if (!cible) { log('T restent (non retirables)', l); break; }
  const avant = l.filter((x) => x === cible).length;
  log('T cible', cible);
  await viser(cible);
  const essai = (nbEssais[cible] = (nbEssais[cible] || 0) + 1);
  await o.tap('Corriger une erreur de saisie', 'button,summary,[role=button]'); await sleep(900);
  const s = await ou(page, 'Retirer cette écriture', 'button'); if (!s) { log('T pas de Retirer', (await o.b()).slice(-8)); ko.add(cible); continue; }
  await toucher(cdp, s.x, s.y); await sleep(1000);
  if (/Achat/.test(cible)) await photo(page, `T-achat-confirmer-${essai}`);
  const c = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].filter((x) => /^Confirmer le retrait/.test(x.textContent.trim()) && x.getBoundingClientRect().width > 0).pop(); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  if (c) { await toucher(cdp, c.x, c.y); await sleep(1600); }
  if (/Achat/.test(cible)) { await photo(page, `T-achat-apres-${essai}`); log('T achat après', (await texte(page)).slice(-400).replace(/\n/g, ' ¦ ')); }
  await ops(); const apres = (await liste()).filter((x) => x === cible).length;
  log('T résultat', cible.slice(0, 40), avant, '→', apres);
  if (apres >= avant && essai >= 2) ko.add(cible);
}
await ops(); await photo(page, 'T9-operations'); log('T9 restants', await liste());
lacher(); process.exit(0);
