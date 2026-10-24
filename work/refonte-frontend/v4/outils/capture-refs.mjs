// Capture en lecture seule des références envoyées par le brasseur (18.10.2026).
// Usage : node work/refonte-frontend/v4/outils/capture-refs.mjs
// Sortie : work/refonte-frontend/v4/reference/brasseur-2026-10-18/<nom>-<n>.png
// Pages longues découpées en tranches de 1600 px (8 au plus). Aucun clic, aucun cookie accepté.
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const refs = [
  ['solaire-ia', 'https://dribbble.com/shots/25445144-AI-Driven-Solar-Panel-App-UI-UX-Design-Renewable-Energy'],
  ['stardog', 'https://fuselabcreative.com/our-projects/stardog-conversational-ai/'],
  ['solaire-gestion', 'https://dribbble.com/shots/26924115-Solar-Panels-Management-App-UX-UI-Design'],
  ['ag-drone', 'https://fuselabcreative.com/our-projects/ag-drone/'],
  ['clyhealth', 'https://fuselabcreative.com/our-projects/clyhealth-dashboard-design/'],
];
const out = path.resolve('work/refonte-frontend/v4/reference/brasseur-2026-10-18');
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
for (const [name, url] of refs) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1600, deviceScaleFactor: 1 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36');
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    // Faire charger les images paresseuses en descendant la page.
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < Math.min(total, 1600 * 8); y += 800) {
      await page.evaluate((v) => window.scrollTo(0, v), y);
      await new Promise((r) => setTimeout(r, 350));
    }
    const h = Math.min(await page.evaluate(() => document.documentElement.scrollHeight), 1600 * 8);
    let n = 0;
    for (let y = 0; y < h; y += 1600) {
      n++;
      await page.evaluate((v) => window.scrollTo(0, v), y);
      await new Promise((r) => setTimeout(r, 500));
      await page.screenshot({ path: path.join(out, name + '-' + n + '.png') });
    }
    console.log(name + ' ' + n + ' tranches (hauteur ' + h + ')');
  } catch (e) {
    console.log(name + ' ECHEC ' + e.message);
  }
  await page.close();
}
await browser.close();
