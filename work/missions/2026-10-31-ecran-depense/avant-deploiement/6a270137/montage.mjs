// node montage.mjs <sortie> <img1> <img2> ... : pose les captures côte à côte (hauteur commune) pour les regarder d'un coup.
// Sortie dans le dossier temporaire du système (jamais livrée).
import puppeteer from 'puppeteer-core';
import { CHROME } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, join } from 'node:path';
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

const [sortie, ...imgs] = process.argv.slice(2);
const DIR = fileURLToPath(new URL('./', import.meta.url));
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--allow-file-access-from-files'] });
const page = await browser.newPage();
const html = `<body style="margin:0;display:inline-flex;gap:6px;background:#888;align-items:flex-start">${imgs.map((i) => `<figure style="margin:0"><figcaption style="font:12px sans-serif;color:#fff">${i}</figcaption><img src="${pathToFileURL(resolve(DIR, i)).href}" style="display:block;max-height:1100px"></figure>`).join('')}</body>`;
await page.setViewport({ width: 200, height: 1200 });
const f = join(tmpdir(), 'montage-6a27-' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.html'); writeFileSync(f, html);
await page.goto(pathToFileURL(f).href, { waitUntil: 'load' });
const { w, h } = await page.evaluate(() => ({ w: document.body.scrollWidth, h: document.body.scrollHeight }));
await page.setViewport({ width: Math.min(w, 4000), height: Math.min(h, 1200) });
await page.screenshot({ path: sortie });
await browser.close();
console.log('montage', sortie, w, h);
