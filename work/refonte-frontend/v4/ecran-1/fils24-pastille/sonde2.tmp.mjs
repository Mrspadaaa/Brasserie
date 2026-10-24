import path from 'node:path'; import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';
const f = process.argv[2], out = process.argv[3];
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await p.goto(pathToFileURL(path.resolve(f)).href, { waitUntil: 'networkidle0' }); await new Promise(r=>setTimeout(r,500));
for (const n of ['valeurs','preuve']) {
  await p.click(`[data-dock="${n}"]`); await new Promise(r=>setTimeout(r,400));
  await p.screenshot({ path: out.replace('.png','-'+n+'.png') });
  console.log(n, await p.evaluate(()=>{ const d=[...document.querySelectorAll('[role="dialog"]')].at(-1); return d? d.innerText.slice(0,1500) + '\n--CLASS ' + d.className + ' ' + d.outerHTML.slice(0,300): 'none'; }));
  await p.click(`[data-dock="${n}"]`); await new Promise(r=>setTimeout(r,300));
}
await b.close();
