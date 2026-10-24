import puppeteer from 'puppeteer-core';
import { pathToFileURL } from 'node:url';
const [f, sel] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const p = await b.newPage(); await p.setViewport({ width: 390, height: 844 });
await p.goto(pathToFileURL(f).href, { waitUntil: 'networkidle0' });
console.log(await p.evaluate((sel) => [...document.querySelectorAll(sel)].slice(0, 3).map((e) => { const cs = getComputedStyle(e); return e.className + ' bg=' + cs.backgroundColor + ' ' + cs.backgroundImage.slice(0, 40); }).join('\n'), sel));
await b.close();
