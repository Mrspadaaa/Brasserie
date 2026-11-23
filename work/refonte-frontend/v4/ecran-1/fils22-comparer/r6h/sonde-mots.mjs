import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
await p.goto(pathToFileURL(process.argv[2]).href, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 300));
console.log((await p.evaluate(() => {
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); const out = []; const rg = document.createRange();
  for (let n = w.nextNode(); n; n = w.nextNode()) { const t = n.textContent.trim(); if (!t) continue; const cs = getComputedStyle(n.parentElement); if (cs.display === 'none' || cs.visibility === 'hidden') continue; rg.selectNodeContents(n); const r = rg.getBoundingClientRect(); if (!r.width || !r.height || r.bottom <= 0 || r.top >= innerHeight) continue; out.push(Math.round(r.top) + ' [' + t.split(/\s+/).length + '] ' + t.slice(0, 60)); }
  return out;
})).join('\n'));
await b.close();
