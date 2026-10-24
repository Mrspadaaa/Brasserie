import puppeteer from 'puppeteer-core';
import { pathToFileURL } from 'node:url';
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
for (const f of process.argv.slice(2)) {
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await p.goto(pathToFileURL(f).href, { waitUntil: 'networkidle0' });
  const r = await p.evaluate(() => [...document.querySelectorAll('body *')].filter((e) => e.getBoundingClientRect().right > 391).slice(0, 6).map((e) => e.className + ' ' + Math.round(e.getBoundingClientRect().right)));
  console.log(f.split(/[\/]/).slice(-2).join('/'), JSON.stringify(r)); await p.close();
}
await b.close();
