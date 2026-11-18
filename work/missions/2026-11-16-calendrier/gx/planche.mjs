// node gx/planche.mjs : planches avant|après (clair, cave) en PNG, pour la lecture et page14
import path from 'node:path'; import fs from 'node:fs'; import { fileURLToPath } from 'node:url'; import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer = require('puppeteer-core');
const H = path.dirname(fileURLToPath(import.meta.url));
const V = (process.argv[2] || 'c1-a,c1-b,c2-a,c2-b,c3-a,c3-b,c4-a,c4-b,c5-a,c5-b').split(',');
const th = process.argv[3] || '';
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const p = await nav.newPage(); await p.setViewport({ width: 800, height: 860, deviceScaleFactor: 1 });
for (const v of V) {
  const u = (e) => 'file:///' + path.join(H, 'cap', `${v}-${e}${th}.png`).split(path.sep).join('/');
  const tmp = path.join(H, 'cap', '_pl.html'); fs.writeFileSync(tmp, `<body style="margin:0;background:#888;display:flex;gap:20px;padding:8px"><img src="${u('avant')}" width="390"><img src="${u('apres')}" width="390"></body>`); await p.goto('file:///' + tmp.split(path.sep).join('/'));
  await new Promise((r) => setTimeout(r, 200));
  await p.screenshot({ path: path.join(H, 'cap', `pl-${v}${th}.png`) });
}
fs.unlinkSync(path.join(H, 'cap', '_pl.html')); await nav.close(); console.log('PLANCHES OK');
