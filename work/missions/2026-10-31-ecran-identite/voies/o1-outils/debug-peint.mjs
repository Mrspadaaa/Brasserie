// Débogage : la page « textes transparents » telle que le contrôle de contraste la photographie.
// Usage : node debug-peint.mjs <page.html> <sortie.png> [texte à sonder]
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const [f, sortie, sonde] = process.argv.slice(2);
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
await page.goto(pathToFileURL(path.resolve(f)).href, { waitUntil: 'networkidle0', timeout: 30000 });
await new Promise((r) => setTimeout(r, 300));
const avant = await page.evaluate(() => ({ h: document.documentElement.scrollHeight, w: document.documentElement.scrollWidth, iw: innerWidth, ih: innerHeight, vv: window.visualViewport && window.visualViewport.scale }));
const cible = sonde ? await page.evaluate((s) => {
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const res = [];
  for (let n = w.nextNode(); n; n = w.nextNode()) if (n.textContent.trim() === s) {
    const r = document.createRange(); r.selectNodeContents(n); const q = r.getBoundingClientRect(); const cs = getComputedStyle(n.parentElement);
    res.push({ tag: n.parentElement.tagName + '.' + n.parentElement.className, color: cs.color, opacity: cs.opacity, rect: [q.left, q.top, q.right, q.bottom].map(Math.round), cls: n.parentElement.parentElement.className });
  }
  return res;
}, sonde) : null;
await page.addStyleTag({ content: '*,*::before,*::after{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important;text-decoration-color:transparent!important;caret-color:transparent!important}text,tspan,textPath{fill:transparent!important;stroke:none!important}' });
await page.screenshot({ path: path.resolve(sortie), fullPage: true });
console.log(JSON.stringify(avant), JSON.stringify(cible));
await browser.close();
