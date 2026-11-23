// CALP-11 (Modifier sur place) et CALP-12/13 (calendriers de section) en ligne, lecture seule : aucun enregistrement, aucun geste d'ecriture.
import { ouvrir, APP, sleep, toucher, glisser, photo, log } from './outil.mjs';
const { page, cdp, fermer } = await ouvrir();
const CLE = 'laffinee.calendrier.fenetre-locale';
let avant = null;
const tapTexte = async (re, racine = 'button') => {
  const p = await page.evaluate(([src, sel]) => { const r = new RegExp(src); const b = [...document.querySelectorAll(sel)].find((x) => { const q = x.getBoundingClientRect(); return q.width > 0 && q.height > 0 && r.test((x.getAttribute('aria-label') || '') + ' ' + (x.innerText || '')); }); if (!b) return null; b.scrollIntoView({ block: 'center' }); const q = b.getBoundingClientRect(); return { x: q.left + q.width / 2, y: q.top + q.height / 2, t: (b.getAttribute('aria-label') || b.innerText || '').trim().slice(0, 50) }; }, [re.source, racine]);
  if (!p) return null;
  await toucher(cdp, p.x, p.y, 70); await sleep(900); return p;
};
const nav = (nom) => tapTexte(new RegExp('^\\s*' + nom), 'nav button');
const etat = () => page.evaluate(() => ({ cal: !!document.querySelector('[data-calendrier]'), liens: [...document.querySelectorAll('[data-lien-calendrier]')].map((e) => e.getAttribute('data-lien-calendrier')), titres: [...document.querySelectorAll('h1,h2')].map((x) => x.innerText.trim()).slice(0, 3), rangees: [...document.querySelectorAll('[data-frise] [data-rangee], [data-frise] [data-genre]')].map((e) => e.getAttribute('data-rangee') || e.getAttribute('data-genre')).slice(0, 12), dialogs: [...document.querySelectorAll('[role="dialog"]')].map((d) => (d.getAttribute('aria-label') || '') + ' | ' + d.innerText.replace(/\s+/g, ' ').slice(0, 140)) }));
try {
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('nav button', { timeout: 90000 });
  avant = await page.evaluate((k) => localStorage.getItem(k), CLE);

  // CALP-11 : fete -> Modifier sur place (sans enregistrer)
  await nav('Calendrier'); await page.waitForSelector('.ent-cadre', { timeout: 30000 }); await sleep(1200);
  const f = await page.evaluate(() => { const e = document.querySelector('[data-frise] [data-chose^="creatif-"]'); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.left + Math.min(60, r.width / 2), y: r.top + r.height / 2 }; });
  log('fete', f);
  if (f) {
    await toucher(cdp, f.x, f.y, 70); await sleep(900);
    log('Modifier', await tapTexte(/Modifier/));
    await sleep(900);
    log('apres Modifier', await etat());
    await page.screenshot({ path: 'c07-fete-modifier-sur-place.png' });
    // sortie sans enregistrer : bouton Abandonner/Annuler/Fermer/Retour de la feuille
    log('sortie', await tapTexte(/^\s*(Abandonner|Annuler|Fermer|Retour(?! au tableau))/));
    await sleep(700);
    log('apres sortie', await etat());
    await page.screenshot({ path: 'c08-apres-sortie-feuille.png' });
  }

  // CALP-12 : Finances
  await nav('Finances'); await sleep(1500);
  log('Finances', await etat());
  const a = await tapTexte(/Calendrier de l.argent/);
  log('lien Finances', a);
  if (a) { await sleep(1500); log('Finances -> calendrier', await etat()); await page.evaluate(() => window.scrollTo(0, 0)); await photo(page, 'c09-calendrier-section-finances'); }
  // Brassins
  await nav('Brassins'); await sleep(1500);
  log('Brassins', await etat());
  const b = await tapTexte(/Calendrier des brassins/);
  log('lien Brassins', b);
  if (b) { await sleep(1500); log('Brassins -> calendrier', await etat()); await page.evaluate(() => window.scrollTo(0, 0)); await photo(page, 'c10-calendrier-section-brassins'); }
  // Bord > Agenda
  await nav('Bord'); await sleep(1500);
  const lb = await page.evaluate(() => [...document.querySelectorAll('button, a')].map((x) => (x.getAttribute('aria-label') || x.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 40)).filter((t) => /agenda|calendrier|atelier|idée/i.test(t)));
  log('Bord : boutons agenda', lb);
  // Stocks / Materiel : un calendrier de section existe-t-il ?
  await nav('Stocks'); await sleep(1500);
  log('Stocks', await etat());
  const m = await tapTexte(/^\s*Matériel/);
  log('Materiel', m, await etat());
  await page.screenshot({ path: 'c11-stocks-materiel.png' });
} finally {
  try { await page.evaluate(([k, v]) => { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); }, [CLE, avant]); } catch (e) { log('remise', String(e)); }
  await fermer();
}
