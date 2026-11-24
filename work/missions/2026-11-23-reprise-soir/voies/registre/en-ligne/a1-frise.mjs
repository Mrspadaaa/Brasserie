// CALP-1, 3, 4, 9 en ligne, lecture seule : seule la fenetre LOCALE de la frise (localStorage de ce navigateur) bouge ; remise a la fin.
import { ouvrir, APP, sleep, toucher, glisser, centre, photo, log } from './outil.mjs';
const { page, cdp, fermer } = await ouvrir();
const CLE = 'laffinee.calendrier.fenetre-locale';
const lireEtiquette = () => page.evaluate(() => (document.querySelector('[data-cadre-etiquette]')?.textContent ?? '').replace(/\s+/g, ' ').trim());
const bande = () => page.evaluate(() => [...document.querySelectorAll('[data-bande-semaines] [data-semaine]')].map((e) => ({ t: e.textContent.trim(), l: Math.round(e.getBoundingClientRect().left), w: Math.round(e.getBoundingClientRect().width), lundi: e.getAttribute('data-lundi') })).filter((x) => x.t));
let avant = null;
try {
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('nav button', { timeout: 90000 });
  avant = await page.evaluate((k) => localStorage.getItem(k), CLE);
  log('fenetre-locale avant', avant);
  if (!(await page.$('[data-calendrier]'))) {
    const p = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => (x.innerText || '').trim().startsWith('Calendrier')); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    await toucher(cdp, p.x, p.y);
  }
  await page.waitForSelector('.ent-cadre', { timeout: 30000 });
  await sleep(1500);
  await page.evaluate(() => window.scrollTo(0, 0));

  // CALP-4 : menu de periode dans l'ecran
  const bp = await centre(page, '[aria-label$="période, liste, tri et filtre"], button[aria-label*="période, liste"]');
  log('bouton periode', bp);
  await toucher(cdp, bp.x, bp.y);
  await sleep(600);
  const menu = await page.evaluate(() => { const d = document.querySelector('[role="dialog"][aria-label="Période et vue"]'); if (!d) return null; const r = d.getBoundingClientRect(); const bs = [...d.querySelectorAll('button')].map((b) => { const q = b.getBoundingClientRect(); return { t: (b.innerText || b.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 24), l: Math.round(q.left), r: Math.round(q.right), t0: Math.round(q.top), b: Math.round(q.bottom) }; }); return { l: r.left, r: r.right, t: r.top, b: r.bottom, bs }; });
  log('menu periode', menu);
  await page.screenshot({ path: 'c01-menu-periode.png' });
  const chevauche = [];
  if (menu) for (let i = 0; i < menu.bs.length; i++) for (let j = i + 1; j < menu.bs.length; j++) { const a = menu.bs[i], b = menu.bs[j]; if (a.l < b.r && b.l < a.r && a.t0 < b.b && b.t0 < a.b) chevauche.push([a.t, b.t]); }
  log('CALP-4 menu dans l ecran', menu && menu.l >= 0 && menu.r <= 390, 'chevauchements', chevauche);
  await page.keyboard.press('Escape').catch(() => undefined);
  await sleep(400);
  if (await page.$('[role="dialog"][aria-label="Période et vue"]')) { await toucher(cdp, 195, 40); await sleep(400); }

  // CALP-9 : poignees entieres dans l'ecran
  const pog = await page.evaluate(() => [...document.querySelectorAll('[data-poignee]')].map((e) => { const r = e.getBoundingClientRect(); return { k: e.getAttribute('data-poignee'), l: Math.round(r.left), r: Math.round(r.right), w: Math.round(r.width), h: Math.round(r.height) }; }));
  log('CALP-9 poignees', pog);

  // CALP-1 : reculer avant aujourd'hui avec la poignee de debut
  const e0 = await lireEtiquette(); const b0 = await bande();
  log('avant geste', e0, 'bande', b0.slice(0, 4));
  const h = await page.evaluate(() => { const e = document.querySelector('[data-poignee="debut"]'); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await glisser(cdp, h, { x: h.x - 45, y: h.y }, { pause: 200 });
  await sleep(700);
  const e1 = await lireEtiquette(); const b1 = await bande();
  log('apres poignee debut a gauche de 45 px', e1, 'bande', b1.slice(0, 4));
  await page.screenshot({ path: 'c02-poignee-debut-recule.png' });
  await page.evaluate(() => window.scrollTo(0, 0));
  await photo(page, 'c02b-poignee-debut-recule-entiere');

  // Une semaine de plus vers le passe au doigt, et le bord gauche de la bande
  const h2 = await page.evaluate(() => { const e = document.querySelector('[data-poignee="debut"]'); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await glisser(cdp, h2, { x: Math.max(8, h2.x - 60), y: h2.y }, { pause: 200 });
  await sleep(700);
  const e2 = await lireEtiquette(); const b2 = await bande();
  log('apres un 2e geste', e2, 'bande', b2.slice(0, 4));
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: 'c03-poignee-debut-recule-2.png' });
  const premier = b2[0];
  log('CALP-1 verdict', { avant: e0, apres: e2, aujourdhui: (await page.evaluate(() => document.querySelector('[data-bande-semaines] [data-auj], [data-bande-semaines] [data-courant]')?.textContent)) });

  // CALP-3 : toucher la courbe : un point (curseur de lecture), pas un rond pointille sur la frise
  const cb = await centre(page, '.ent-cb');
  await page.evaluate(() => window.scrollTo(0, 0));
  const cb2 = await page.evaluate(() => { const r = document.querySelector('.ent-cb').getBoundingClientRect(); return { x: r.left + r.width * 0.6, y: r.top + r.height * 0.5 }; });
  await toucher(cdp, cb2.x, cb2.y, 80);
  await sleep(500);
  log('curseur', await page.evaluate(() => ({ dasharray: [...document.querySelectorAll('.ent-cb circle, .ent-cb [data-curseur]')].map((c) => c.getAttribute('stroke-dasharray') || c.getAttribute('data-curseur') || c.tagName).slice(0, 6), lecture: document.querySelector('[data-lecture], .ent-lecture, [data-curseur-lecture]')?.textContent?.slice(0, 80) ?? null })));
  await page.screenshot({ path: 'c04-courbe-touchee.png', clip: { x: 0, y: 0, width: 390, height: 300 } });
} finally {
  // remise de la fenetre locale a son etat d'avant
  try { await page.evaluate(([k, v]) => { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); }, [CLE, avant]); } catch (e) { log('remise', String(e)); }
  await fermer();
}
