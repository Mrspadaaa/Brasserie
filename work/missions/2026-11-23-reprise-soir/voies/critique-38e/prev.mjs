// Finances › Prévisions : trouver les récurrences ZZ restantes et les retirer
import { ouvrir, sleep, photo, log, ou, toucher, glisser } from './outil.mjs';
import { outils, texte } from './commun.mjs';
const { page, cdp, lacher } = await ouvrir();
const o = outils(page, cdp);
const mode = process.argv[2] || 'voir';
await o.nav('Finances'); await o.tap('Prévisions', 'button,[role=tab]'); await sleep(1500);
const zz = () => page.evaluate(() => [...document.querySelectorAll('button,[role=button],li')].filter((e) => /ZZ TEST/.test(e.getAttribute('aria-label') || e.textContent) && e.getBoundingClientRect().width > 0 && e.childElementCount < 10).map((e) => { const r = e.getBoundingClientRect(); return (e.getAttribute('aria-label') || e.textContent).trim().replace(/\s+/g, ' ').slice(0, 120) + ' @' + Math.round(r.top); }));
await photo(page, 'P0-previsions'); log('P0', await zz());
if (mode === 'voir') {
  const z = await ou(page, 'ZZ TEST — ', 'button,[role=button]', true);
  if (z) { await toucher(cdp, z.x, z.y); await sleep(1300); await photo(page, 'P1-zz-touche', false); log('P1', (await o.b()).slice(-12)); log('P1 t', (await texte(page)).slice(-500).replace(/\n/g, ' ¦ ')); }
}
if (mode === 'retirer') {
  for (let n = 0; n < 6; n++) {
    await o.nav('Finances'); await o.tap('Prévisions', 'button,[role=tab]'); await sleep(1300);
    const z = await ou(page, 'ZZ TEST — ', 'button,[role=button]', true); if (!z) { log('PR plus de ZZ'); break; }
    log('PR cible', z.aria || z.txt); await toucher(cdp, z.x, z.y); await sleep(1200);
    await o.tap('Supprimer cette prévision', 'button'); await sleep(900); if (n === 0) await photo(page, 'P2-supprimer', false);
    const c = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].filter((x) => /^(Supprimer|Confirmer|Oui)/.test(x.textContent.trim()) && !/cette prévision/.test(x.textContent) && x.getBoundingClientRect().width > 0).pop(); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, t: b.textContent.trim() }; });
    if (c) { log('PR confirme', c.t); await toucher(cdp, c.x, c.y); await sleep(1200); }
  }
  await o.nav('Finances'); await o.tap('Prévisions', 'button,[role=tab]'); await sleep(1300); log('PR reste', await zz());
  await o.nav('Calendrier'); await sleep(1500); log('PR cal', await page.evaluate(() => [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')).filter((x) => /ZZ TEST|CHF à dépenser/.test(x)))); await photo(page, 'P3-cal');
}
lacher();
