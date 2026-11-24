// CALP-6 (lignes identiques, Brassins) et CALP-11 (renvois : une fete s'ouvre sur place), en ligne, lecture seule.
import { ouvrir, APP, sleep, toucher, glisser, photo, log } from './outil.mjs';
const { page, cdp, fermer } = await ouvrir();
const CLE = 'laffinee.calendrier.fenetre-locale';
let avant = null;
try {
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('nav button', { timeout: 90000 });
  avant = await page.evaluate((k) => localStorage.getItem(k), CLE);
  if (!(await page.$('[data-calendrier]'))) {
    const p = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => (x.innerText || '').trim().startsWith('Calendrier')); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    await toucher(cdp, p.x, p.y);
  }
  await page.waitForSelector('.ent-cadre', { timeout: 30000 });
  await sleep(1500);
  const lignes = () => page.evaluate(() => [...document.querySelectorAll('[data-frise] [data-chose]')].map((e) => { const r = e.getBoundingClientRect(); return { t: (e.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 60), id: e.getAttribute('data-chose')?.slice(0, 40), y: Math.round(r.top + scrollY), l: Math.round(r.left), w: Math.round(r.width) }; }));
  const h = await page.evaluate(() => { const e = document.querySelector('[data-poignee="debut"]'); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  log('lignes 3 mois', await lignes());
  await glisser(cdp, h, { x: h.x - 45, y: h.y }, { pause: 200 });
  await sleep(800);
  const L = await lignes();
  log('lignes 19 sem', L);
  const vus = new Map(); const doubles = [];
  for (const l of L) { const k = l.t; if (vus.has(k)) doubles.push([k, vus.get(k), l.y]); else vus.set(k, l.y); }
  log('CALP-6 lignes de texte identiques', doubles);
  await page.evaluate(() => window.scrollTo(0, 200));
  await page.screenshot({ path: 'c05-brassins-19sem.png' });
  // CALP-11 : la fete « vi » s'ouvre-t-elle sur place ?
  await page.evaluate(() => window.scrollTo(0, 0));
  const f = await page.evaluate(() => { const e = [...document.querySelectorAll('[data-frise] [data-chose]')].find((x) => (x.innerText || '').trim() === 'vi' || (x.innerText || '').trim().startsWith('vi')); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.left + Math.min(40, r.width / 2), y: r.top + r.height / 2, w: r.width }; });
  log('fete vi', f);
  if (f) {
    await toucher(cdp, f.x, f.y, 70);
    await sleep(900);
    log('apres toucher', await page.evaluate(() => ({ dialogs: [...document.querySelectorAll('[role="dialog"]')].map((d) => (d.getAttribute('aria-label') || '') + ' | ' + d.innerText.replace(/\s+/g, ' ').slice(0, 160)), calendrier: !!document.querySelector('[data-calendrier]'), url: location.pathname + location.search })));
    await page.screenshot({ path: 'c06-fete-touchee.png' });
    log('fermeture', await page.evaluate(() => { const b = [...document.querySelectorAll('[role="dialog"] button, button')].find((x) => /^(Fermer|Annuler|Retour|×)/.test((x.getAttribute('aria-label') || x.innerText || '').trim())); if (!b) return null; const r = b.getBoundingClientRect(); return { t: (b.getAttribute('aria-label') || b.innerText).trim(), x: r.left + r.width / 2, y: r.top + r.height / 2 }; }));
  }
} finally {
  try { await page.evaluate(([k, v]) => { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); }, [CLE, avant]); } catch (e) { log('remise', String(e)); }
  await fermer();
}
