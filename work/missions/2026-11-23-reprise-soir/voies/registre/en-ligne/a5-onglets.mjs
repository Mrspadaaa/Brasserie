// CALP-12/13 : les onglets, en ligne, lecture seule. Liens de calendrier de section (data-lien-calendrier) par onglet.
import { ouvrir, APP, sleep, toucher, photo, log } from './outil.mjs';
const { page, cdp, fermer } = await ouvrir();
const tapTexte = async (re, racine = 'button') => {
  const p = await page.evaluate(([src, sel]) => { const r = new RegExp(src); const b = [...document.querySelectorAll(sel)].find((x) => { const q = x.getBoundingClientRect(); return q.width > 0 && q.height > 0 && r.test((x.getAttribute('aria-label') || '') + ' ' + (x.innerText || '')); }); if (!b) return null; b.scrollIntoView({ block: 'center' }); const q = b.getBoundingClientRect(); return { x: q.left + q.width / 2, y: q.top + q.height / 2, t: (b.getAttribute('aria-label') || b.innerText || '').trim().slice(0, 50) }; }, [re.source, racine]);
  if (!p) return null;
  await toucher(cdp, p.x, p.y, 70); await sleep(1200); return p;
};
const lire = () => page.evaluate(() => ({ cal: !!document.querySelector('[data-calendrier]'), liens: [...document.querySelectorAll('[data-lien-calendrier]')].map((e) => e.getAttribute('data-lien-calendrier') + ':' + e.innerText.trim()), boutons: [...document.querySelectorAll('button')].map((b) => (b.getAttribute('aria-label') || b.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 34)).filter((t) => /calendrier|agenda/i.test(t)) }));
try {
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('nav button', { timeout: 90000 });
  await sleep(1500);
  for (const [nom, fichier] of [['Finances', 'c09-finances'], ['Brassins', 'c10-brassins'], ['Bord', 'c12-bord']]) {
    log(nom, await tapTexte(new RegExp('^\\s*' + nom), 'nav button'));
    await sleep(1200);
    await page.evaluate(() => window.scrollTo(0, 0));
    log(nom, await lire());
    await photo(page, fichier);
  }
  log('Stocks', await tapTexte(/^\s*Stocks/, 'nav button'));
  await sleep(1200);
  log('Stocks', await lire());
  await photo(page, 'c11-stocks');
  log('Materiel', await tapTexte(/^\s*Matériel\s*$/));
  await sleep(1200);
  log('Materiel', await lire());
  await photo(page, 'c11b-stocks-materiel');
} finally { await fermer(); }
