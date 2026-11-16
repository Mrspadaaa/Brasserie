// Planches de 3 captures côte à côte (cap/planche-NN.png) : node work/missions/2026-11-16-carnet-decision/ra-p5f/planches.mjs [noms…]
import path from 'node:path'; import fs from 'node:fs'; import { fileURLToPath } from 'node:url'; import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer = require('puppeteer-core');
const dir = path.dirname(fileURLToPath(import.meta.url)), cap = path.join(dir, 'cap');
const { shots } = JSON.parse(fs.readFileSync(path.join(dir, 'bilan.json'), 'utf8'));
const choix = process.argv.slice(2), L = choix.length ? shots.filter(([f]) => choix.some((c) => f.startsWith(c))) : shots;
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const pl = await nav.newPage(); await pl.setViewport({ width: 1200, height: 900, deviceScaleFactor: 1 });
const out = [];
for (let i = 0; i < L.length; i += 3) {
  const g = L.slice(i, i + 3).map(([f, t]) => '<figure><figcaption>' + t + '</figcaption><img src="file:///' + path.join(cap, f).split(path.sep).join('/') + '"></figure>').join('');
  const hp = path.join(cap, '_planche.html'); fs.writeFileSync(hp, '<meta charset=utf-8><style>body{margin:0;background:#777;display:flex;gap:10px;padding:8px;font:600 14px system-ui}figure{margin:0;width:390px}figcaption{color:#fff;height:40px;overflow:hidden}img{width:390px;display:block}</style>' + g);
  await pl.goto('file:///' + hp.split(path.sep).join('/'), { waitUntil: 'load' });
  const f = path.join(cap, 'planche-' + String(i / 3 + 1).padStart(2, '0') + '.png'); await pl.screenshot({ path: f }); out.push(f);
}
fs.unlinkSync(path.join(cap, '_planche.html'));
await nav.close(); console.log(out.length + ' planches');
