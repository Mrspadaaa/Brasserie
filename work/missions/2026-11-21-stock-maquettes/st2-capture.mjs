// node st2-capture.mjs [filtre] : capture chaque st2-*.html à 390 × 844 (tactile, ×2) dans st2-captures/,
// et signale débord en largeur, texte < 14 px, contenu de main caché sous la barre d'onglets ou le pied.
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath, pathToFileURL } from 'url';
const ICI = path.dirname(fileURLToPath(import.meta.url));
const pp = createRequire(path.join(ICI, '..', '..', '..', 'package.json'))('puppeteer-core');
const filtre = process.argv[2] || '';
const pages = fs.readdirSync(ICI).filter((f) => /^st2-d\d.*\.html$/.test(f) && f.includes(filtre)).sort();
const nav = await pp.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const p = await nav.newPage();
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
for (const f of pages) {
  await p.goto(pathToFileURL(path.join(ICI, f)).href, { waitUntil: 'networkidle0' });
  await p.evaluate(() => document.fonts.ready);
  const m = await p.evaluate(() => {
    const bas = document.querySelector('nav.onglets, .pied')?.getBoundingClientRect().top ?? 844;
    let fin = 0; const petits = []; const deb = [];
    for (const el of document.querySelectorAll('main *, .tete *, .tuiles *, .geste *, .regle *, .rayon *, .lignes *')) {
      const r = el.getBoundingClientRect(); if (!r.width) continue; fin = Math.max(fin, r.bottom);
      if (r.right > 391) deb.push(el.className?.baseVal ?? el.className);
    }
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (w.nextNode()) { const t = w.currentNode; if (!t.textContent.trim()) continue; const s = parseFloat(getComputedStyle(t.parentElement).fontSize); if (s < 14) petits.push(t.textContent.trim().slice(0, 20)); }
    const fb = document.querySelector('.fab')?.getBoundingClientRect(); const couvre = []; if (fb) { const w2 = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); while (w2.nextNode()) { const t = w2.currentNode; if (!t.textContent.trim() || t.parentElement.closest('svg')) continue; const r = document.createRange(); r.selectNodeContents(t); const b = r.getBoundingClientRect(); if (b.width && b.left < fb.right + 3 && b.right > fb.left - 3 && b.top < fb.bottom + 3 && b.bottom > fb.top - 3) couvre.push(t.textContent.trim().slice(0, 14)); } }
    return { couvre, debord: document.documentElement.scrollWidth - 390, deb: [...new Set(deb)].slice(0, 3), fin: Math.round(fin), bas: Math.round(bas), petits };
  });
  await p.screenshot({ path: path.join(ICI, 'st2-captures', f.replace('.html', '.jpg')), type: 'jpeg', quality: 84 });
  const pb = [];
  if (m.debord > 0 || m.deb.length) pb.push(`débord ${m.debord}px ${m.deb.join(',')}`);
  if (m.petits.length) pb.push(`texte <14 : ${m.petits.slice(0, 3).join(' | ')}`);
  console.log(f.padEnd(24), pb.length ? 'PB ' + pb.join(' ; ') : 'ok', `fin=${m.fin} bas=${m.bas}`);
}
await nav.close();
