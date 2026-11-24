// CALP-6 (details des caddies homonymes) et CALP-11 (toucher la fete « vi » : feuille sur place), en ligne, lecture seule (aucun enregistrement).
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
  const h = await page.evaluate(() => { const e = document.querySelector('[data-poignee="debut"]'); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await glisser(cdp, h, { x: h.x - 45, y: h.y }, { pause: 200 });
  await sleep(800);
  // les caddies de brassins : etiquette lue dans la ligne (le texte vit a cote de la barre)
  const cad = await page.evaluate(() => [...document.querySelectorAll('[data-frise] [data-chose^="brassin-"]')].map((e) => {
    const ligne = e.parentElement; const r = e.getBoundingClientRect();
    return { id: e.getAttribute('data-chose'), aria: e.getAttribute('aria-label'), w: Math.round(r.width), ligne: (ligne?.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 80), titre: e.getAttribute('title') };
  }));
  log('brassins', cad);
  const f = await page.evaluate(() => { const e = document.querySelector('[data-frise] [data-chose^="creatif-"]'); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.left + Math.min(60, r.width / 2), y: r.top + r.height / 2, aria: e.getAttribute('aria-label'), t: e.innerText }; });
  log('fete', f);
  if (f) {
    await toucher(cdp, f.x, f.y, 70);
    await sleep(1000);
    log('apres toucher', await page.evaluate(() => ({ dialogs: [...document.querySelectorAll('[role="dialog"]')].map((d) => (d.getAttribute('aria-label') || '') + ' | ' + d.innerText.replace(/\s+/g, ' ').slice(0, 220)), calendrier: !!document.querySelector('[data-calendrier]'), chemin: location.pathname + location.search + location.hash, hautDePage: [...document.querySelectorAll('h1,h2')].map((x) => x.innerText).slice(0, 3) })));
    await page.screenshot({ path: 'c06-fete-touchee.png' });
    const ferm = await page.evaluate(() => { const bs = [...document.querySelectorAll('[role="dialog"] button, button')].filter((x) => /fermer|annuler|retour|abandonner|×/i.test((x.getAttribute('aria-label') || x.innerText || ''))); return bs.map((b) => { const r = b.getBoundingClientRect(); return { t: (b.getAttribute('aria-label') || b.innerText).trim().slice(0, 40), x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; }); });
    log('boutons de sortie', ferm);
  }
} finally {
  try { await page.evaluate(([k, v]) => { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); }, [CLE, avant]); } catch (e) { log('remise', String(e)); }
  await fermer();
}
