import { ouvrir, APP, sleep, toucher, centre, photo, log } from './outil.mjs';
const { page, cdp, fermer } = await ouvrir();
try {
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('nav button', { timeout: 90000 });
  const paquet = await page.evaluate(() => [...document.scripts].map((s) => s.src).find((s) => /assets\/index-[\w-]+\.js/.test(s))?.replace(/^.*assets\//, '') ?? '');
  log('paquet', paquet);
  const noms = await page.evaluate(() => [...document.querySelectorAll('nav button')].map((b) => (b.getAttribute('aria-label') || b.innerText || '').trim().replace(/\s+/g, ' ')));
  log('nav', noms);
  const aCal = await page.$('[data-calendrier]');
  if (!aCal) {
    const p = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => (x.innerText || '').trim().startsWith('Calendrier') || x.getAttribute('aria-label') === 'Calendrier'); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    log('bouton calendrier', p);
    if (p) await toucher(cdp, p.x, p.y);
  }
  await page.waitForSelector('[data-calendrier]', { timeout: 30000 });
  await page.waitForSelector('.ent-cadre', { timeout: 30000 });
  await sleep(1500);
  log('periode', await page.evaluate(() => document.querySelector('[data-periode-pastille]')?.innerText.replace(/\s+/g, ' ')));
  log('poignees', await page.evaluate(() => [...document.querySelectorAll('[data-poignee]')].map((e) => { const r = e.getBoundingClientRect(); const i = e.querySelector('i')?.getBoundingClientRect(); return { k: e.getAttribute('data-poignee'), l: r.left, r: r.right, w: r.width, h: r.height, i: i && { l: i.left, r: i.right } }; })));
  log('cadre', await page.evaluate(() => { const c = document.querySelector('[data-cadre-etiquette]'); return c?.textContent; }));
  log('bande', await page.evaluate(() => [...document.querySelectorAll('[data-bande-semaines] [data-semaine]')].map((e) => e.textContent.trim()).slice(0, 8)));
  log('boutons', await page.evaluate(() => [...document.querySelectorAll('button')].map((b) => (b.getAttribute('aria-label') || b.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 50)).filter(Boolean).slice(0, 40)));
  log('w', await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth, sh: document.documentElement.scrollHeight })));
  log(await photo(page, 'c00-calendrier-ouvert'));
} finally { await fermer(); }
