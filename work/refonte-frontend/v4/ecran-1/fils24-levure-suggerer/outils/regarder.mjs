// Capture exploratoire d'une page (repos + pleine page) et dump du DOM utile. Usage : node regarder.mjs <id> [sortie-prefixe]
import path from 'node:path'; import os from 'node:os'; import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';
const ici = path.dirname(fileURLToPath(import.meta.url)); const lot = path.resolve(ici, '..');
const id = process.argv[2] || 'base'; const tmp = path.join(os.tmpdir(), 'jc-levure'); fs.mkdirSync(tmp, { recursive: true });
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const p = await b.newPage(); const err = []; p.on('pageerror', (e) => err.push(String(e))); p.on('console', (m) => { if (m.type() === 'error') err.push(m.text()); });
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
await p.goto(pathToFileURL(path.join(lot, id, 'etat.html')).href, { waitUntil: 'networkidle0' }); await new Promise((r) => setTimeout(r, 800));
await p.screenshot({ path: path.join(tmp, id + '-repos.png') });
await p.screenshot({ path: path.join(tmp, id + '-page.png'), fullPage: true });
const h = await p.evaluate(() => document.documentElement.scrollHeight);
fs.writeFileSync(path.join(tmp, id + '-dom.html'), await p.evaluate(() => document.getElementById('parcours').outerHTML));
console.log(id, 'hauteur', h, err.length ? 'ERR ' + err.join(' | ') : 'sans erreur', tmp);
await b.close();
