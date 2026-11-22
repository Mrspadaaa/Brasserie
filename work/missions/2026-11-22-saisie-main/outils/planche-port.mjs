// Planche côte à côte : pour chaque état, la maquette (captures/v01s/v01s-<état>.png) à gauche et le port (captures/port/etats/<état>-<h>.png) à droite.
//   node outils/planche-port.mjs <sortie.png> <état>[:<h>] …   (h par défaut 844 ; la maquette « -660 » est prise quand h = 660 et qu'elle existe)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet/package.json');
const puppeteer = require('puppeteer-core');
const [sortie, ...etats] = process.argv.slice(2);
const cap = path.join(ICI, '..', 'captures');
const url = (f) => (fs.existsSync(f) ? pathToFileURL(f).href : '');
const cols = etats.map((e) => {
  const [nom, h = '844'] = e.split(':');
  const m660 = path.join(cap, 'v01s', `v01s-${nom}-660.png`);
  const maq = h === '660' && fs.existsSync(m660) ? m660 : path.join(cap, 'v01s', `v01s-${nom}.png`);
  return { nom: `${nom} ${h}`, maq: url(maq), port: url(path.join(cap, 'port', 'etats', `${nom}-${h}.png`)) };
});
const html = `<html><body style="margin:0;background:#888;font:13px system-ui"><div style="display:flex;gap:14px;padding:8px;align-items:flex-start">${cols.map((c) => `<div><b style="color:#fff">${c.nom} · maquette | port</b><div style="display:flex;gap:4px;align-items:flex-start">${c.maq ? `<img src="${c.maq}" style="width:300px">` : '<div style="width:300px;color:#fff">(pas de maquette)</div>'}<img src="${c.port}" style="width:300px"></div></div>`).join('')}</div></body></html>`;
const f = path.join(ICI, '..', 'captures', 'port', '_planche.html');
fs.writeFileSync(f, html);
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--allow-file-access-from-files'] });
const p = await nav.newPage();
await p.setViewport({ width: cols.length * 618 + 16, height: 800 });
await p.goto(pathToFileURL(f).href, { waitUntil: 'load' });
await p.screenshot({ path: sortie, fullPage: true });
await nav.close();
fs.rmSync(f);
console.log(`PLANCHE ${sortie}`);
