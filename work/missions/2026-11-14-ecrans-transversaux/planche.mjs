// Planche de captures : node planche.mjs <sortie.png> <colonnes> <largeur> <capture sans .png>...
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire('C:/Users/mrspa/AppData/Local/Temp/deploy-bc70/package.json');
const puppeteer = require('puppeteer-core');
const [, , sortie, cols, largeur, ...fichiers] = process.argv;
const dir = path.resolve('captures').replace(/\\/g, '/');
const cases = fichiers.map(f => '<div><div>' + f + '</div><img style="width:100%" src="file:///' + dir + '/' + f + '.png"></div>').join('');
const html = '<body style="margin:0;background:#888;display:grid;grid-template-columns:repeat(' + cols + ',1fr);gap:4px;font:11px sans-serif">' + cases + '</body>';
fs.writeFileSync('planche.html', html);
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--allow-file-access-from-files'] });
const p = await b.newPage();
await p.setViewport({ width: +largeur, height: 600 });
await p.goto('file:///' + path.resolve('planche.html').replace(/\\/g, '/'));
await new Promise(r => setTimeout(r, 800));
await p.screenshot({ path: sortie, fullPage: true });
await b.close();
