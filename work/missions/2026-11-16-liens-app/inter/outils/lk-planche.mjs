// Planche de contrôle : captures côte à côte (DPR 1), pour les regarder d'un coup. node lk-planche.mjs sortie.png a.png b.png …
import { createRequire } from 'module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
const require = createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer = require('puppeteer-core');
const [out, ...imgs] = process.argv.slice(2);
const html = '<meta charset=utf-8><body style="margin:0;background:#777;display:flex;gap:6px;padding:4px">' + imgs.map(i => `<figure style="margin:0"><img src="${pathToFileURL(path.resolve(i)).href}" style="width:390px;display:block"><figcaption style="font:600 14px system-ui;color:#fff">${path.basename(i)}</figcaption></figure>`).join('') + '</body>';
const tmp = out.replace(/\.png$/, '.html'); fs.writeFileSync(tmp, html);
const br = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const p = await br.newPage(); await p.setViewport({ width: imgs.length * 396 + 8, height: 880, deviceScaleFactor: 1 });
await p.goto(pathToFileURL(path.resolve(tmp)).href, { waitUntil: 'load' }); await p.screenshot({ path: out, fullPage: true }); await br.close();
