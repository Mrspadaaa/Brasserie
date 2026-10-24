import path from 'node:path'; import os from 'node:os'; import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';
const ici = path.dirname(fileURLToPath(import.meta.url)); const lot = path.resolve(ici, '..');
const id = process.argv[2] || 'base'; const tmp = path.join(os.tmpdir(), 'jc-levure');
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
await p.goto(pathToFileURL(path.join(lot, id, 'etat.html')).href, { waitUntil: 'networkidle0' }); await new Promise((r) => setTimeout(r, 800));
const r = await p.evaluate(() => {
  const sc = [...document.querySelectorAll('*')].filter((e) => { const s = getComputedStyle(e); return /(auto|scroll)/.test(s.overflowY) && e.scrollHeight > e.clientHeight + 5; }).map((e) => ({ tag: e.tagName, cls: e.className.toString().slice(0, 120), sh: e.scrollHeight, ch: e.clientHeight, id: e.id }));
  const dh = [...document.querySelectorAll('*')].filter((e) => e.children.length < 3 && /Dry hop|IBU après|Hors houblon ·|Assembler|Remplacer/.test(e.textContent) && e.textContent.length < 80).map((e) => ({ tag: e.tagName, cls: e.className.toString().slice(0, 100), t: e.textContent.trim().slice(0, 60), parent: e.parentElement.tagName + '.' + e.parentElement.className.toString().slice(0, 80) }));
  return { sc, dh };
});
console.log(JSON.stringify(r, null, 1));
await b.close();
