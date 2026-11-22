// node cmp-capture.mjs [filtre] : capture chaque cmp-<v>-<état>.html à 390 × 844 (tactile, ×2) dans cmp-captures/,
// et signale tout débord (largeur > 390, contenu sous le champ d'ajout, texte < 14 px).
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const req = createRequire(path.join(ICI, '..', '..', '..', 'package.json'));
const pp = req('puppeteer-core');
const filtre = process.argv[2] || '';
const pages = fs.readdirSync(ICI).filter((f) => /^cmp-[abc]\d-(repos|sans|eur)\.html$/.test(f) && f.includes(filtre)).sort();
const nav = await pp.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const p = await nav.newPage();
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
for (const f of pages) {
  await p.goto('file:///' + path.join(ICI, f).replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
  await p.evaluate(() => document.fonts.ready);
  const m = await p.evaluate(() => {
    const champ = document.querySelector('.ajout').getBoundingClientRect().top;
    let bas = 0, petits = [];
    for (const el of document.querySelectorAll('main *')) {
      const r = el.getBoundingClientRect();
      if (r.width && r.height) bas = Math.max(bas, r.bottom);
    }
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (w.nextNode()) { const t = w.currentNode; if (!t.textContent.trim()) continue; const fs = parseFloat(getComputedStyle(t.parentElement).fontSize); if (fs < 14) petits.push(t.textContent.trim().slice(0, 20)); }
    return { debord: document.documentElement.scrollWidth - 390, bas: Math.round(bas), champ: Math.round(champ), petits };
  });
  await p.screenshot({ path: path.join(ICI, 'cmp-captures', f.replace('.html', '.jpg')), type: 'jpeg', quality: 84 });
  const pb = [];
  if (m.debord > 0) pb.push(`débord ${m.debord}px`);
  if (m.bas > m.champ - 4) pb.push(`contenu jusqu'à ${m.bas} (champ ${m.champ})`);
  if (m.petits.length) pb.push(`texte <14 : ${m.petits.slice(0, 3).join(' | ')}`);
  console.log(f.padEnd(22), pb.length ? 'PB ' + pb.join(' ; ') : 'ok', `bas=${m.bas}`);
}
await nav.close();
