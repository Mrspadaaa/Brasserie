// CALP-12 en ligne, lecture seule : Finances (Synthese), Brassins (sous-onglet Brassins), Bord > Agenda ouvrent un calendrier de section. Vues remises a la fin.
import { ouvrir, APP, sleep, toucher, photo, log } from './outil.mjs';
const { page, cdp, fermer } = await ouvrir();
const tapTexte = async (re, racine = 'button') => {
  const p = await page.evaluate(([src, sel]) => { const r = new RegExp(src); const b = [...document.querySelectorAll(sel)].find((x) => { const q = x.getBoundingClientRect(); return q.width > 0 && q.height > 0 && r.test(((x.getAttribute('aria-label') || '') + ' ' + (x.innerText || '')).trim()); }); if (!b) return null; b.scrollIntoView({ block: 'center' }); const q = b.getBoundingClientRect(); return { x: q.left + q.width / 2, y: q.top + q.height / 2, t: (b.getAttribute('aria-label') || b.innerText || '').trim().slice(0, 50) }; }, [re.source, racine]);
  if (!p) return null;
  await toucher(cdp, p.x, p.y, 70); await sleep(1400); return p;
};
const lire = () => page.evaluate(() => ({ cal: !!document.querySelector('[data-calendrier]'), liens: [...document.querySelectorAll('[data-lien-calendrier]')].map((e) => e.getAttribute('data-lien-calendrier') + ':' + e.innerText.trim()), rangees: [...document.querySelectorAll('[data-frise] [data-rangee]')].map((e) => e.getAttribute('data-rangee')), titre: [...document.querySelectorAll('h1,h2')].map((x) => x.innerText.trim()).slice(0, 2), entete: document.querySelector('[data-calendrier-entete]')?.innerText.replace(/\s+/g, ' ').slice(0, 120) ?? null }));
const nav = (n) => tapTexte(new RegExp('^' + n), 'nav button');
try {
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('nav button', { timeout: 90000 });
  await sleep(1500);
  // Finances
  await nav('Finances');
  log('Synthese', await tapTexte(/^Synthèse$/));
  log('Finances synthese', await lire());
  log('lien', await tapTexte(/Calendrier de l.argent/));
  await sleep(1500);
  log('-> section', await lire());
  await page.evaluate(() => window.scrollTo(0, 0)); await photo(page, 'c13-section-finances');
  // retour a Finances > Operations
  await nav('Finances'); log('Operations', await tapTexte(/^Opérations$/));
  // Brassins
  await nav('Brassins');
  log('sous-onglet Brassins', await tapTexte(/^Brassins\s*\d*$/));
  log('Brassins', await lire());
  log('lien', await tapTexte(/Calendrier des brassins/));
  await sleep(1500);
  log('-> section', await lire());
  await page.evaluate(() => window.scrollTo(0, 0)); await photo(page, 'c14-section-brassins');
  await nav('Brassins'); log('Atelier', await tapTexte(/^Atelier$/));
  // Bord > Agenda
  await nav('Bord');
  log('Agenda', await tapTexte(/Cette semaine au calendrier/));
  await sleep(1500);
  log('-> section', await lire());
  await page.evaluate(() => window.scrollTo(0, 0)); await photo(page, 'c15-section-agenda');
} finally { await fermer(); }
