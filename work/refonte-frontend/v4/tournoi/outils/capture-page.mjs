// Capture rapide d'une page à 390 : node shot.mjs <page.html> <sortie.png> [hauteur]
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json');
const puppeteer = require('puppeteer-core');
const [src, out, h] = process.argv.slice(2);
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: Number(h || 844), deviceScaleFactor: 2 });
await page.goto(pathToFileURL(path.resolve(src)).href, { waitUntil: 'load' });
await new Promise((r) => setTimeout(r, 300));
await page.screenshot({ path: out });
await browser.close();
console.log('SHOT ' + out);
