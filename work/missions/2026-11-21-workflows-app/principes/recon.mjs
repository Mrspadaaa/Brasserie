import { ouvrir, cap, cliquer, pause } from './commun.mjs';
const { browser, page } = await ouvrir();
const lab = (sel) => page.evaluate((s) => [...document.querySelectorAll(s)].filter(b => b.getClientRects().length).map(b => (b.getAttribute('aria-label')||b.textContent).trim().replace(/\s+/g,' ').slice(0,40)), sel);
try {
  await cap(page, '00-accueil');
  const nav = await page.evaluate(() => { const ns = [...document.querySelectorAll('nav')]; const n = ns.find(x => x.getBoundingClientRect().bottom >= innerHeight - 5) || ns.at(-1); return n ? [...n.querySelectorAll('button,a')].map(b => (b.getAttribute('aria-label')||b.textContent).trim().replace(/\s+/g,' ')) : []; });
  console.log('NAV', JSON.stringify(nav));
  let i = 1;
  for (const t of nav) {
    if (!t) continue;
    await page.evaluate((t) => { const ns = [...document.querySelectorAll('nav')]; const n = ns.find(x => x.getBoundingClientRect().bottom >= innerHeight - 5) || ns.at(-1); [...n.querySelectorAll('button,a')].find(b => (b.getAttribute('aria-label')||b.textContent).trim().replace(/\s+/g,' ') === t)?.click(); }, t);
    await pause(2000);
    const slug = String(i++).padStart(2,'0') + '-' + t.toLowerCase().replace(/[^a-z]+/g,'').slice(0,12);
    await cap(page, slug);
    console.log('SEG', slug, JSON.stringify(await lab('[role=tab], [aria-pressed], [role=radio], [aria-selected]')));
    const h = await page.evaluate(() => document.scrollingElement.scrollHeight);
    if (h > 1200) { await page.evaluate(() => scrollTo(0, 844)); await pause(400); await page.screenshot({ path: `captures/${slug}-b.png` }); await page.evaluate(() => scrollTo(0, 0)); }
  }
} finally { await browser.close(); }
