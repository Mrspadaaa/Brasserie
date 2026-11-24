import { ouvrir, APP, sleep, toucher, photo, log } from './outil.mjs';
const { page, cdp, fermer } = await ouvrir();
const tapTexte = async (re, racine = 'button') => {
  const p = await page.evaluate(([src, sel]) => { const r = new RegExp(src); const b = [...document.querySelectorAll(sel)].find((x) => { const q = x.getBoundingClientRect(); return q.width > 0 && q.height > 0 && r.test(((x.getAttribute('aria-label') || '') + ' ' + (x.innerText || '')).trim().replace(/\s+/g, ' ')); }); if (!b) return null; b.scrollIntoView({ block: 'center' }); const q = b.getBoundingClientRect(); return { x: q.left + q.width / 2, y: q.top + q.height / 2, t: (b.getAttribute('aria-label') || b.innerText || '').trim().slice(0, 50) }; }, [re.source, racine]);
  if (!p) return null;
  await toucher(cdp, p.x, p.y, 70); await sleep(1400); return p;
};
const lire = () => page.evaluate(() => ({ cal: !!document.querySelector('[data-calendrier]'), liens: [...document.querySelectorAll('[data-lien-calendrier]')].map((e) => e.getAttribute('data-lien-calendrier') + ':' + e.innerText.trim()), rangees: [...document.querySelectorAll('[data-frise] [data-rangee]')].map((e) => e.getAttribute('data-rangee')) }));
try {
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('nav button', { timeout: 90000 });
  await sleep(1500);
  log('nav', await tapTexte(/^Brassins/, 'nav button'));
  log('sous-onglet', await tapTexte(/^Brassins \(\d+\)/));
  log('Brassins', await lire());
  await page.evaluate(() => window.scrollTo(0, 0)); await photo(page, 'c14a-brassins-sous-onglet');
  log('lien', await tapTexte(/Calendrier des brassins/));
  await sleep(1500);
  log('-> section', await lire());
  await page.evaluate(() => window.scrollTo(0, 0)); await photo(page, 'c14-section-brassins');
  log('nav', await tapTexte(/^Brassins/, 'nav button'));
  log('retour Atelier', await tapTexte(/^Atelier$/));
} finally { await fermer(); }
