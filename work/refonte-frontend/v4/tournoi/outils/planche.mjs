// Planche contact d'une étape : les premiers écrans à 390 côte à côte, pour le pilote.
// Usage : node work/refonte-frontend/v4/tournoi/outils/planche.mjs <dossier-etape> [suffixe]
// Suffixe par défaut : 390 (captures/<id>-390.png). Sortie : captures/planche-<suffixe>.png
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

// Option --vue=<nom> (lot 3) : une planche par vue, pNN-<nom>-<suffixe>.png ; --vue=index
// garde seulement pNN-<suffixe>.png. Sans --vue : toutes les captures du suffixe.
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const vue = (process.argv.find((a) => a.startsWith('--vue=')) || '').slice(6);
// Option --id=pNN : toutes les vues d'une seule variante (planche-pNN-<suffixe>.png).
const seul = (process.argv.find((a) => a.startsWith('--id=')) || '').slice(5);
const dir = path.resolve(args[0] || '.');
const suffix = args[1] || '390';
const caps = path.join(dir, 'captures');
const ids = fs.readdirSync(caps)
  .filter((f) => f.endsWith('-' + suffix + '.png') && !f.startsWith('planche'))
  .map((f) => f.slice(0, -(suffix.length + 5)))
  .filter((id) => !vue || (vue === 'index' ? /^p\d+$/.test(id) : id.replace(/^p\d+-/, '') === vue && /^p\d+-/.test(id)))
  .filter((id) => !seul || id === seul || id.startsWith(seul + '-'))
  .sort();
const cols = suffix === '1280' ? 2 : 5;
const cell = suffix === '1280' ? 640 : 300;
const html = '<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#1a1714;font:14px sans-serif;color:#eee}'
  + '.g{display:grid;grid-template-columns:repeat(' + cols + ',' + cell + 'px);gap:12px;padding:12px}'
  + 'figure{margin:0}img{width:100%;display:block;border:1px solid #444}figcaption{padding:4px 0;font-weight:700}</style><div class="g">'
  + ids.map((id) => '<figure><figcaption>' + id + '</figcaption><img src="' + pathToFileURL(path.join(caps, id + '-' + suffix + '.png')).href + '"></figure>').join('')
  + '</div>';
const tmp = path.join(caps, '_planche.html');
fs.writeFileSync(tmp, html);
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage();
await page.setViewport({ width: cols * (cell + 12) + 12, height: 800, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(tmp).href, { waitUntil: 'load' });
const out = path.join(caps, 'planche-' + (seul ? seul + '-' : '') + (vue ? vue + '-' : '') + suffix + '.png');
await page.screenshot({ path: out, fullPage: true });
await browser.close();
fs.unlinkSync(tmp);
console.log('PLANCHE ' + ids.length + ' ' + out);
