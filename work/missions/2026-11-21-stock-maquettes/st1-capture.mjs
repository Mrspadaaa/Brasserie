// node st1-capture.mjs [filtre] : capture chaque st1-*.html dans st1-captures/ (390 × 844 tactile ×2 ; -660 : 390 × 660 ;
// -1280 : 1280 × 800), et signale débord horizontal, texte sous 12 px et, pour les D2, les rangées d'article visibles
// au premier écran (contrôle visé STE-3 : au moins 3 à 390 × 660).
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const req = createRequire(path.join(ICI, '..', '..', '..', 'package.json'));
const pp = req('puppeteer-core');
const filtre = process.argv[2] || '';
const pages = fs.readdirSync(ICI).filter((f) => /^st1-d\d[a-c]-.+\.html$/.test(f) && f.includes(filtre)).sort();
const nav = await pp.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const p = await nav.newPage();
for (const f of pages) {
  const large = f.includes('-1280');
  await p.setViewport(large ? { width: 1280, height: 800, deviceScaleFactor: 1 } : { width: 390, height: f.includes('-660') ? 660 : 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p.goto('file:///' + path.join(ICI, f).replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
  const m = await p.evaluate(() => {
    const H = innerHeight - (document.querySelector('nav.bas')?.offsetHeight || 0);
    let petits = [];
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (w.nextNode()) { const t = w.currentNode; if (!t.textContent.trim()) continue; const el = t.parentElement; if (el.closest('svg')) continue; const fs = parseFloat(getComputedStyle(el).fontSize); if (fs < 12) petits.push(t.textContent.trim().slice(0, 16)); }
    const rangs = [...document.querySelectorAll('.li,.rc-l')].filter((e) => e.getBoundingClientRect().bottom <= H).length;
    const debords = [...document.querySelectorAll('.rg,.filt,.seg,.ra,.f-t')].filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.className.split(' ')[0]);
    const rays = [...document.querySelectorAll(".mur:not(.d3a-m) .ray")].map((e) => Math.round(e.getBoundingClientRect().height));
    const filts = [...document.querySelectorAll(".filt")].map((e) => e.scrollWidth);
    return { debord: document.documentElement.scrollWidth - innerWidth, petits, rangs, debords, rays, filts };
  });
  await p.screenshot({ path: path.join(ICI, 'st1-captures', f.replace('.html', '.jpg')), type: 'jpeg', quality: 86 });
  const pb = [];
  if (m.debord > 0) pb.push(`débord ${m.debord}px`);
  if (m.debords.length) pb.push(`coupé : ${[...new Set(m.debords)].join(',')}`);
  if (m.petits.length) pb.push(`texte <12 : ${m.petits.slice(0, 3).join(' | ')}`);
  console.log(f.padEnd(26), pb.length ? 'PB ' + pb.join(' ; ') : 'ok', `rangées=${m.rangs} ray=${m.rays.join("/")} filt=${m.filts.join("/")}`);
}
await nav.close();
