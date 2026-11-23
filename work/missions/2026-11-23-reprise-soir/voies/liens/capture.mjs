import puppeteer from 'puppeteer-core';
const [, , cible, sortie, ...gestes] = process.argv;
const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
const page = await browser.newPage();
try {
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
  await page.goto(cible, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await new Promise(r => setTimeout(r, 12000));
  for (const g of gestes) {
    if (g.startsWith('texte:')) {
      const t = g.slice(6);
      const ok = await page.evaluate((t) => { const el = [...document.querySelectorAll('button')].filter(e => e.textContent && e.textContent.includes(t) && e.children.length < 40).pop(); if (!el) return false; el.click(); return true; }, t);
      console.log('clic', t, ok);
      await new Promise(r => setTimeout(r, 1200));
    }
  }
  if (sortie === 'liste') console.log(await page.evaluate(() => [...document.querySelectorAll('button,a,article,h2,h3')].map(e => e.tagName + ':' + (e.textContent || '').trim().slice(0, 60)).slice(0, 60).join('\n')));
  else { await page.screenshot({ path: sortie, fullPage: true }); console.log('capture', sortie); }
} finally { await page.close(); browser.disconnect(); }
