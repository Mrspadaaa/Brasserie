// Rend chaque [data-m] de maquettes.html en PNG (img/<id>.png), au double de la résolution du téléphone.
// Planche de relecture (non publiée) : --planche <fichier.png>.
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '..', '..', '..', '..');
const puppeteer = createRequire(path.join(RACINE, 'package.json'))('puppeteer-core');
const planche = process.argv.includes('--planche') ? process.argv[process.argv.indexOf('--planche') + 1] : null;
const nav = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--allow-file-access-from-files'] });
const erreurs = [];
try {
  const p = await nav.newPage();
  p.on('pageerror', (e) => erreurs.push(e.message));
  await p.setViewport({ width: 420, height: 900, deviceScaleFactor: 2 });
  await p.goto('file:///' + path.join(ICI, 'maquettes.html').split(path.sep).join('/'), { waitUntil: 'networkidle0' });
  await p.evaluate(() => document.fonts.ready);
  fs.mkdirSync(path.join(ICI, 'img'), { recursive: true });
  const ids = await p.$$eval('[data-m]', (els) => els.map((e) => e.dataset.m));
  for (const id of ids) await (await p.$(`[data-m="${id}"]`)).screenshot({ path: path.join(ICI, 'img', `${id}.png`) });
  console.log(`${ids.length} images : ${ids.join(', ')}`);
  if (planche) {
    await p.setViewport({ width: 1600, height: 900, deviceScaleFactor: 1 });
    const src = ids.map((id) => `<figure style="margin:0"><figcaption style="font:14px sans-serif">${id}</figcaption><img src="file:///${path.join(ICI, 'img', id + '.png').split(path.sep).join('/')}" width="390"></figure>`).join('');
    await p.goto('file:///' + path.join(ICI, 'img', 'actuel-3s.png').split(path.sep).join('/'));
    await p.setContent(`<body style="margin:0;background:#888;display:grid;grid-template-columns:repeat(4,390px);gap:8px">${src}</body>`, { waitUntil: 'load' });
    await p.screenshot({ path: planche, fullPage: true });
  }
} finally { await nav.close(); }
if (erreurs.length) { console.log('ERREURS', erreurs); process.exit(1); }
