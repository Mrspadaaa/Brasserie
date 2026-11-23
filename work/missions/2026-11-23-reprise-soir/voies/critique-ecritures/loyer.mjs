// Retirer la prévision « ZZ TEST — Loyer » cachée dans le groupe « 6 sorties le 23.11 » — seulement si la fiche ouverte est bien ZZ
import { ouvrir, sleep, photo, log, ou, toucher } from './outil.mjs';
import { outils, texte } from './commun.mjs';
const { page, cdp, lacher } = await ouvrir();
const o = outils(page, cdp);
await o.nav('Finances'); await o.tap('Prévisions', 'button,[role=tab]'); await sleep(1300);
const g = await ou(page, '6 sorties le 23.11', 'button,[role=button]', true); await toucher(cdp, g.x, g.y); await sleep(1200);
await photo(page, 'P4-groupe', false); log('P4', (await o.b()).filter((x) => /ZZ|Ssr|Ttt|Hefe|lol|Fermer|Supprimer/.test(x)));
const z = await page.evaluate(() => { const e = [...document.querySelectorAll('button,[role=button]')].find((x) => /^[0-9]?ZZ TEST — Loyer.*prévu/.test(x.textContent.trim()) && x.getBoundingClientRect().width > 0); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, t: e.tagName + ' ' + (e.getAttribute('aria-label') || e.textContent).slice(0, 80) }; });
log('P5 cible', z);
if (z) {
  await toucher(cdp, z.x, z.y); await sleep(1300); await photo(page, 'P5-loyer', false);
  const t = await texte(page); const ok = /avec ZZ TEST — Loyer/.test(t) || /ZZ TEST — Loyer/.test(t.slice(-900));
  log('P5 fiche ZZ ?', ok, t.slice(-400).replace(/\n/g, ' ¦ '));
  const s = await ou(page, 'Supprimer cette prévision', 'button');
  log('P5 bouton', !!s); if (s && /avec ZZ TEST — Loyer/.test(t)) {
    await toucher(cdp, s.x, s.y); await sleep(900);
    const c = await ou(page, 'Oui, supprimer', 'button'); if (c) { await toucher(cdp, c.x, c.y); await sleep(1300); log('P5 supprimé'); }
  } else log('P5 NON SUPPRIME : fiche incertaine');
}
await o.nav('Calendrier'); await sleep(1500); log('P6 cal', await page.evaluate(() => [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')).filter((x) => /ZZ TEST|CHF à dépenser/.test(x))));
lacher();
