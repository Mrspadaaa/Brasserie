// Planche de contrôle : le haut (0 à H px CSS) de chaque capture s1, côte à côte, pour les regarder ensemble.
// Usage : node work/missions/2026-11-14-finances/voies/s1/planche.mjs <sortie.png> <H> <capture.png…>
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(ICI, '../../../../../package.json'));
const puppeteer = require('puppeteer-core');
const [sortie, H, ...imgs] = process.argv.slice(2);
const cells = imgs.map((f) => `<figure><figcaption>${basename(f)}</figcaption><div style="height:${H}px;overflow:hidden"><img src="data:image/png;base64,${readFileSync(f).toString('base64')}" width="390"></div></figure>`).join('');
const html = `<body style="margin:0;background:#888;display:flex;flex-wrap:wrap;gap:8px;padding:8px;width:${imgs.length * 398 + 8}px;font:12px sans-serif">${cells}</body>`;
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const p = await b.newPage();
await p.setViewport({ width: imgs.length * 398 + 16, height: 400, deviceScaleFactor: 1 });
await p.setContent(html.replace('<figure>', '<figure style="margin:0">').split('<figure>').join('<figure style="margin:0">'));
await p.screenshot({ path: sortie, fullPage: true });
await b.close();
