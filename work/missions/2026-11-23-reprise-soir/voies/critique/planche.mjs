// node planche.mjs sortie.png img1 img2 ... (chemins absolus ou relatifs) : côte à côte, 390 px de large chacune
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
const require = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json');
const puppeteer = require('puppeteer-core');
const [sortie, ...imgs] = process.argv.slice(2);
const w = Number(process.env.W || 390);
const html = '<html><body style="margin:0;background:#888;display:flex;gap:8px;align-items:flex-start;font:12px sans-serif">' + imgs.map((i) => `<figure style="margin:0;width:${w}px"><figcaption style="background:#222;color:#fff;padding:2px">${path.basename(i)}</figcaption><img style="width:${w}px" src="data:image/png;base64,${fs.readFileSync(path.resolve(i)).toString('base64')}"></figure>`).join('') + '</body></html>';
const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
const page = await browser.newPage();
try {
  await page.setViewport({ width: imgs.length * (w + 8), height: 400, deviceScaleFactor: 1 });
  await page.setContent(html); await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: sortie, fullPage: true });
} finally { await page.close(); browser.disconnect(); }
