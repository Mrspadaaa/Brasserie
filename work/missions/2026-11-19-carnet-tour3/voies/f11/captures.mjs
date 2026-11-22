// Voie f11 : captures des 4 constats (banc ?preview=carnets, port 5199), 390 et 1280, clair et sombre. Usage : node captures.mjs
import { lancer, page, toucher, taper, texte, haut, capture, log, ecrireJournal, attendre } from './outil.mjs';

async function note(p, n) {
  const c = await p.$('textarea'); await c.click();
  for (const [i, l] of n.split('\n').entries()) { if (i) { await p.keyboard.down('Shift'); await p.keyboard.press('Enter'); await p.keyboard.up('Shift'); } await p.keyboard.type(l, { delay: 2 }); }
  await attendre(300); await p.keyboard.press('Enter'); await attendre(5000);
}
const versListe = async (p) => { if (!(await toucher(p, 'Carnets', { exact: true, sel: 'button, a, [role="tab"]' }))) await toucher(p, '‹'); await attendre(900); };
const centrer = (p, re) => p.evaluate((s) => {
  const r = new RegExp(s); const e = [...document.querySelectorAll('.cn-carnet')].find((x) => r.test(x.innerText || '') && x.getClientRects().length && (x.innerText || '').length < 400);
  if (!e) return null; e.scrollIntoView({ block: 'center' }); const b = e.getBoundingClientRect();
  return { classes: e.className, texte: (e.innerText || '').replace(/\s+/g, ' ').slice(0, 160), picto: e.querySelector('[data-picto]')?.getAttribute('data-picto') ?? null, h: Math.round(b.height),
    cite: [...e.querySelectorAll('.cn-cite')].map((c) => ({ t: c.innerText, coupe: c.scrollHeight > c.clientHeight + 1 })) };
}, re);

const S = {
  /* PCN-110 : lien collé lu (hotte-140) dans Ventilation, sa fiche */
  lu: async (nav, L, th) => {
    const q = await page(nav, `&theme=${th}&ouvrir=ventilation`, L);
    await taper(q, 'https://exemple.invalid/hotte-140', { attente: 5000 });
    if (await toucher(q, 'Hotte inox 140', { sel: 'button, [role="button"], a' })) {
      await attendre(700); await haut(q);
      log(`lu ${L} ${th} : ${(await texte(q)).match(/Caractéristiques[^\n]*/)?.[0] ?? 'ABSENT'}`);
      await q.evaluate(() => { const h = [...document.querySelectorAll('h3')].find((e) => /Caractéristiques/.test(e.innerText)); h?.scrollIntoView({ block: 'center' }); });
      log(`style ${L} ${th} : ${JSON.stringify(await q.evaluate(() => { const h = [...document.querySelectorAll('h3')].find((e) => /Caractéristiques/.test(e.innerText)); const m = h?.querySelector('span'); if (!m) return null; const c = getComputedStyle(m); return { h3: h.className, span: m.className, fw: c.fontWeight, fs: c.fontSize, hTop: Math.round(h.getBoundingClientRect().height), mTop: Math.round(m.getBoundingClientRect().top - h.getBoundingClientRect().top), sheets: [...document.styleSheets].some((x) => { try { return [...x.cssRules].some((r) => r.selectorText === '.cn-sous > .cn-mut'); } catch { return false; } }) }; }))}`);
      await attendre(300); await capture(q, `pcn110-${L}-${th}`);
    } else log(`lu ${L} ${th} : article introuvable`);
    await q.close();
  },
  /* v7-1 : app ?dev-local, Stocks › Matériel › Carnets, « frigo de garde pour 6 fûts » puis un lien : les puces du carnet ouvert */
  puce: async (nav, L, th) => {
    if (th === 'sombre') return;
    const p = await page(nav, '?dev-local', L, { racine: true });
    await attendre(2500);
    await toucher(p, 'Stocks', { exact: true, sel: 'button, a, [role="tab"]' }); await attendre(1500);
    await toucher(p, 'Matériel', { sel: 'button, a, [role="tab"]' }); await attendre(1200);
    await toucher(p, 'Carnets', { sel: 'button, a, [role="tab"]' }); await attendre(2500);
    await taper(p, 'frigo de garde pour 6 fûts', { attente: 4500 });
    await taper(p, 'https://exemple.invalid/pompe-inox', { attente: 4500 }); await haut(p);
    log(`puce ${L} : ${JSON.stringify(await p.evaluate(() => document.body.innerText.match(/Comparer sur[^\n]*/g) ?? []))}`);
    await capture(p, `v7-1-${L}-clair`);
    await p.evaluate(() => document.documentElement.setAttribute('data-theme', 'cave')); await attendre(400);
    await capture(p, `v7-1-${L}-sombre`);
    await p.close();
  },
  /* v7-2 et v7-3 : notes « sol » puis « levure » (IA éteinte), la liste */
  liste: async (nav, L, th) => {
    for (const [nom, n, ia, re] of [['v7-2', 'résine pour le sol du local\nPour la hotte : tient 80 °C.\nacheter 2 sachets de levure', '', 'Résine'],
      ['v7-3', 'Sachets de levure x2.\nProchain brassage mardi.\nTient 80 °C pour la hotte.', '&ia=eteint', 'Prochain brassin']]) {
      const p = await page(nav, `&theme=${th}${ia}`, L);
      await note(p, n); await versListe(p); await haut(p);
      log(`${nom} ${L} ${th} : ${JSON.stringify(await centrer(p, re))}`);
      await attendre(300); await capture(p, `${nom}-${L}-${th}`);
      await p.close();
    }
  }
};
const nav = await lancer();
try {
  for (const n of (process.argv[2] ?? Object.keys(S).join(",")).split(",")) for (const L of [390, 1280]) for (const th of ['clair', 'sombre']) {
    try { await S[n](nav, L, th); } catch (e) { log(`ERREUR ${n} ${L} ${th} : ${e.message.slice(0, 160)}`); }
  }
} finally { await nav.close(); ecrireJournal('journal-f11'); }
