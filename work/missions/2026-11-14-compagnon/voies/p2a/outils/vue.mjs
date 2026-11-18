// Capture de cadres isolés (vérification) dans le dossier temporaire : node vue.mjs <theme> <cadre…>
import { createRequire } from 'node:module';
import { join, dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
const ICI = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(resolve(ICI, '../../../../../..'), 'package.json'));
const puppeteer = require('puppeteer-core');
const [theme, ...cadres] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const p = await b.newPage();
await p.setViewport({ width: 1660, height: 900, deviceScaleFactor: 1 });
await p.goto(pathToFileURL(join(ICI, '../p2a/etat.html')).href);
await p.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
for (const c of cadres) { const el = await p.$(`[data-cadre="${c}"]`); const out = join(tmpdir(), `p2a-${c}-${theme}.png`); await el.screenshot({ path: out }); console.log(out); }
await b.close();
