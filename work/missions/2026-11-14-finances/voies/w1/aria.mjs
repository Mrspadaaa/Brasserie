import path from 'node:path';
import { pathToFileURL } from 'node:url';
const L = await import(pathToFileURL(path.join(process.cwd(), '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const { browser, page } = await L.ouvrir({ largeur: 390, hauteur: 844, mobile: true, echelle: 1 });
await page.goto('http://localhost:3000/?dev-local&finance-demo', { waitUntil: 'domcontentloaded' }); await L.calme(page, 1500);
await page.evaluate(() => [...document.querySelectorAll('nav button')].find((e) => /^Finances$/.test(e.textContent.trim()))?.click()); await L.calme(page, 800);
await page.evaluate(() => [...document.querySelectorAll('[role=tab]')].find((e) => /Prévisions/.test(e.textContent))?.click()); await L.calme(page, 1200);
console.log(JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('button')].filter((b) => b.getClientRects().length && !b.innerText.trim()).map((b) => b.getAttribute('aria-label') + '|' + b.className))));
await browser.close();
