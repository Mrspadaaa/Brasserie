// node mg/planche.mjs : planches de contrôle (repos, passage, paysage) pour l'œil, dans le dossier temporaire.
import { createRequire } from 'node:module'; import path from 'node:path'; import fs from 'node:fs'; import os from 'node:os'; import { fileURLToPath, pathToFileURL } from 'node:url';
const require = createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer = require('puppeteer-core');
const HERE = path.dirname(fileURLToPath(import.meta.url)); const OUT = process.argv[2] || os.tmpdir();
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--allow-file-access-from-files'] });
const ids = ['g1', 'g2', 'g3', 'g4', 'g5', 'g6'];
for (const [nom, suf, w, h, cols] of [['repos', '', 390, 844, 3], ['passage', '-passage', 390, 844, 3], ['paysage', '-paysage', 844, 390, 2]]) {
  const sel = process.argv[3] ? process.argv[3].split(',') : ids;
  const html = `<body style="margin:0;display:grid;grid-template-columns:repeat(${cols},${w}px);gap:8px;background:#888">${sel.map((i) => `<div style="position:relative"><img src="${pathToFileURL(path.join(HERE, 'cap', i + suf + '.png')).href}" width="${w}" height="${h}"><b style="position:absolute;left:0;top:0;background:#ff0;font:700 18px sans-serif">${i}</b></div>`).join('')}</body>`;
  const f = path.join(OUT, 'planche-' + nom + '.html'); fs.writeFileSync(f, html);
  const p = await b.newPage(); const rows = Math.ceil(sel.length / cols);
  await p.setViewport({ width: cols * w + (cols - 1) * 8, height: rows * h + (rows - 1) * 8, deviceScaleFactor: 1 });
  await p.goto(pathToFileURL(f).href, { waitUntil: 'load' }); await p.screenshot({ path: path.join(OUT, 'planche-' + nom + '.png') }); await p.close();
}
await b.close(); console.log('PLANCHES', OUT);
