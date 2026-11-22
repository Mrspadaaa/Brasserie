// v6 : geste Choisir jusqu'au bout, et glissé du doigt sur le titre de Comparer à 390. Usage : node fin.mjs
import { lancer, page, toucher, trouver, texte, haut, capture, log, ecrireJournal, attendre, boutons } from './outil.mjs';
const lignes = async (p, re) => (await texte(p)).split('\n').filter((l) => re.test(l)).map((l) => l.trim()).join(' / ');
const nav = await lancer();
try {
  for (const [L, th] of [[390, 'clair'], [1280, 'sombre']]) {
    log(`=== choisir ${L} ${th}`);
    try {
      const p = await page(nav, `&theme=${th}&ouvrir=ventilation`, L);
      await toucher(p, 'Comparer', { sel: 'button, a, [role="button"]', ms: 1200 });
      await toucher(p, 'Choisir', { sel: 'button', exact: true, ms: 1500 });
      log(`boutons ${L} : ${(await boutons(p)).filter((b) => /Choisir|Confirmer|Annuler|Retour/.test(b)).join(' | ')}`);
      const b = await trouver(p, 'Choisir chez', { sel: 'button' });
      if (b) { await b.evaluate((e) => e.scrollIntoView({ block: 'center' })); await capture(p, `fin-choisir-${L}-${th}-a`); if (L < 600) await b.tap(); else await b.click(); await attendre(2000); await haut(p);
        log(`apres ${L} : ${await lignes(p, /Choisi|À venir|Annuler|Critère|Pourquoi|Rangé/)}`); await capture(p, `fin-choisir-${L}-${th}-b-choisi`); }
      else log('Choisir chez : introuvable');
      await p.close();
    } catch (e) { log(`ERREUR ${e.message.slice(0, 140)}`); }
  }
  log('=== glisse 390');
  const q = await page(nav, '&theme=clair&ouvrir=ventilation', 390);
  await toucher(q, 'Comparer', { sel: 'button, a, [role="button"]', ms: 1200 }); await haut(q);
  const h = await q.evaluate(() => { const e = [...document.querySelectorAll('h1, h2')].find((x) => x.getClientRects().length); const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
  await q.touchscreen.touchStart(h[0], h[1]); for (let i = 1; i <= 8; i++) { await q.touchscreen.touchMove(h[0] - i * 25, h[1] + 2); await attendre(16); } await q.touchscreen.touchEnd(); await attendre(700);
  const d = await q.evaluate(() => [...document.querySelectorAll('*')].filter((e) => e.scrollLeft > 0).map((e) => [e.tagName, e.className.toString().slice(0, 25), e.scrollLeft]));
  log(`glisse titre : ${JSON.stringify(d)}`); await capture(q, 'fin-comparer-390-clair-glisse');
  await q.close();
} finally { await nav.close(); ecrireJournal('journal-v6-fin'); }
