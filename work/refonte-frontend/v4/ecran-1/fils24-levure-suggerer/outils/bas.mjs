import path from 'node:path'; import os from 'node:os'; import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';
const ici = path.dirname(fileURLToPath(import.meta.url)); const lot = path.resolve(ici, '..');
const id = process.argv[2] || 'base'; const tmp = path.join(os.tmpdir(), 'jc-levure');
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const p = await b.newPage(); const err = []; p.on('pageerror', (e) => err.push(String(e)));
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
await p.goto(pathToFileURL(path.join(lot, id, 'etat.html')).href, { waitUntil: 'networkidle0' }); await new Promise((r) => setTimeout(r, 800));
const steps = [];
for (let i = 0; i < 4; i++) {
  const y = await p.evaluate((i) => { const m = document.querySelector('main'); m.scrollTop = i * 700; return m.scrollTop; }, i);
  await new Promise((r) => setTimeout(r, 200)); await p.screenshot({ path: path.join(tmp, id + '-s' + i + '.png') }); steps.push(y);
}
const html = await p.evaluate(() => { const s = [...document.querySelectorAll('section')].filter((e) => /Dry hop/.test(e.querySelector('h3')?.textContent || '')); return s.map((e) => e.outerHTML).join('\n'); });
fs.writeFileSync(path.join(tmp, id + '-dryhop.html'), html);
console.log(steps, err);
await b.close();
