import { ouvrir, APP, sleep, toucher, photo, log } from './outil.mjs';
const { page, cdp, fermer } = await ouvrir();
const tapTexte = async (re, racine = 'button') => {
  const p = await page.evaluate(([src, sel]) => { const r = new RegExp(src); const b = [...document.querySelectorAll(sel)].find((x) => { const q = x.getBoundingClientRect(); return q.width > 0 && q.height > 0 && r.test(((x.getAttribute('aria-label') || '') + ' ' + (x.innerText || '')).trim().replace(/\s+/g, ' ')); }); if (!b) return null; b.scrollIntoView({ block: 'center' }); const q = b.getBoundingClientRect(); return { x: q.left + q.width / 2, y: q.top + q.height / 2, t: (b.getAttribute('aria-label') || b.innerText || '').trim().slice(0, 50) }; }, [re.source, racine]);
  if (!p) return null;
  await toucher(cdp, p.x, p.y, 70); await sleep(1400); return p;
};
try {
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('nav button', { timeout: 90000 });
  await sleep(2000);
  log('etat initial boutons', await page.evaluate(() => [...document.querySelectorAll('button')].map((b) => (b.getAttribute('aria-label') || b.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 24)).filter(Boolean).slice(0, 16)));
  log('Atelier', await tapTexte(/^Atelier/));
  log('Carnet', await tapTexte(/^Carnet/));
  await sleep(800);
  await page.evaluate(() => window.scrollTo(0, 0)); await photo(page, 'c17-brassins-restaure');
  log('Finances restaure : Operations', await tapTexte(/^Finances/, 'nav button'), await tapTexte(/^Opérations/));
  log('Bord', await tapTexte(/^Bord/, 'nav button'));
} finally { await fermer(); }
