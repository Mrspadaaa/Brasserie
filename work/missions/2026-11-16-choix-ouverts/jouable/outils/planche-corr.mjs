// Planches des captures corrigées (5 par planche) pour les ouvrir d'un coup.
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
const require = createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer = require('puppeteer-core');
const D = path.join(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), 'captures', 'corr');
const groupes = { a: ['onglet-bord', 'onglet-cal-message', 'onglet-finances', 'fournisseur-plus', 'fournisseur-liste'], b: ['suppression-archive', 'suppression-supprime', 'lot-livrer-f27', 'lot-liste', 'pastille-repos'], c: ['pastille-tout-fin'] };
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--allow-file-access-from-files'] });
for (const t of ['', '-cave']) for (const [g, l] of Object.entries(groupes)) {
  const p = await b.newPage(); await p.setViewport({ width: 390 * l.length + 10 * l.length, height: 900 });
  const html = '<body style="margin:0;display:flex;gap:10px;background:#888">' + l.map((n) => `<div><div style="font:14px sans-serif;color:#fff">${n}${t}</div><img src="${pathToFileURL(path.join(D, n + t + '.png')).href}" style="width:390px"></div>`).join('') + '</body>';
  const f = path.join(D, `_planche${t}-${g}.html`); fs.writeFileSync(f, html);
  await p.goto(pathToFileURL(f).href, { waitUntil: 'load' }); await p.screenshot({ path: path.join(D, `planche${t}-${g}.png`) }); fs.unlinkSync(f); await p.close();
}
await b.close();
