// node v8/cap-w.mjs [w1 w2 w3] : captures 844×390 DPR 2 (clair seul) dans v8/cap/ : repos, défilé (et w2 replié), toucher du creux.
// Contrôles (en-tête et bande, au repos) : texte < 14 px (toute la page visible) ; texte hors écran ; texte sur texte ;
// texte sur trait ou hachure (.ob) ; + volant 4 à 24 px au-dessus des onglets ; semaines visibles ≥ 10.
import path from 'node:path'; import fs from 'node:fs'; import { fileURLToPath, pathToFileURL } from 'node:url'; import { createRequire } from 'node:module';
const HERE = path.dirname(fileURLToPath(import.meta.url)), CAP = path.join(HERE, 'cap'); fs.mkdirSync(CAP, { recursive: true });
const req = createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json'); const pp = req('puppeteer-core');
const noms = process.argv.slice(2).length ? process.argv.slice(2) : ['w1', 'w2', 'w3'];
const nav = await pp.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const p = await nav.newPage(); await p.setViewport({ width: 844, height: 390, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const mesure = () => p.evaluate(() => {
  const vis = (e) => { for (let x = e; x && x !== document.body; x = x.parentElement) { const s = getComputedStyle(x); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return false; } return true; };
  const bot = document.querySelector('.bot').getBoundingClientRect();
  // petits textes : toute la page visible
  const petits = []; { const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { const s = n.textContent.trim(); if (!s) continue; const el = n.parentElement; if (el.closest('title,script,style')) continue; if (!vis(el)) continue; const g = document.createRange(); g.selectNodeContents(n); const r = g.getBoundingClientRect(); if (!r.width || r.bottom < 0 || r.top > innerHeight) continue; const fs = parseFloat(getComputedStyle(el).fontSize); if (fs < 14) petits.push(s + ' ' + fs); } }
  const T = [];
  for (const zone of [document.querySelector('#lhead'), document.querySelector('#fh')]) {
    const w = document.createTreeWalker(zone, NodeFilter.SHOW_TEXT); let n;
    while ((n = w.nextNode())) { const s = n.textContent.trim(); if (!s) continue; const el = n.parentElement; if (el.closest('title')) continue; if (el.closest('svg') && !el.closest('text')) continue; if (!vis(el)) continue;
      const t = el.closest('text') || el; const g = document.createRange(); g.selectNodeContents(n); const r = el.closest('text') ? t.getBoundingClientRect() : g.getBoundingClientRect(); if (r.width < 1) continue;
      T.push({ s, x: r.left, y: r.top, r: r.right, b: r.bottom, el: t }); } }
  const U = []; for (const t of T) { const u = U.find((v) => v.el === t.el); if (u) { u.s += ' ' + t.s; u.x = Math.min(u.x, t.x); u.r = Math.max(u.r, t.r); } else U.push({ ...t }); }
  const hors = U.filter((t) => t.x < 0 || t.r > innerWidth || t.y < 0).map((t) => t.s);
  const cheva = []; for (let i = 0; i < U.length; i++) for (let j = i + 1; j < U.length; j++) { const a = U[i], b = U[j]; if (a.el.contains(b.el) || b.el.contains(a.el)) continue; const ox = Math.min(a.r, b.r) - Math.max(a.x, b.x), oy = Math.min(a.b, b.b) - Math.max(a.y, b.y); if (ox > 1 && oy > 3) cheva.push(a.s + ' × ' + b.s); }
  const obs = [...document.querySelectorAll('#lhead svg .ob')].filter(vis);
  const surTrait = [];
  for (const t of U) { const y0 = t.y + 3.5, y1 = t.b - 3.5, x0 = t.x + 1, x1 = t.r - 1; let touche = null;
    for (let y = y0; y <= y1 && !touche; y += 2) for (let x = x0; x <= x1 && !touche; x += 2) for (const o of obs) { const svg = o.ownerSVGElement, m = svg.getScreenCTM().inverse(); const q = new DOMPoint(x, y).matrixTransform(m);
      const f = o.classList.contains('ob-f') ? o.isPointInFill(q) : o.isPointInStroke(q); if (f) { touche = (o.getAttribute('d') ? 'tracé' : o.tagName) + ' ' + (o.getAttribute('stroke') || o.getAttribute('fill') || ''); break; } }
    if (touche) surTrait.push(t.s + ' → ' + touche); }
  const fab = document.querySelector('#fab').getBoundingClientRect();
  const sem = document.querySelectorAll('#fh .rb-c').length;
  const fh = document.querySelector('#fh').getBoundingClientRect(), fr = document.querySelector('#fb').getBoundingClientRect().top;
  return { petits, hors, cheva, surTrait, fabEcart: Math.round(bot.top - fab.bottom), sem, bande: Math.round(fh.height), tete: Math.round(fh.top), frise: Math.round(fr), textes: U.length };
});
const log = [];
for (const n of noms) {
  const f = path.join(HERE, n + '.html');
  await p.goto(pathToFileURL(f).href); await p.evaluate(() => document.fonts.ready); await new Promise((r) => setTimeout(r, 300));
  await p.screenshot({ path: path.join(CAP, `${n}.png`) });
  const m = await mesure(); const ok = !m.petits.length && !m.hors.length && !m.cheva.length && !m.surTrait.length && m.fabEcart >= 4 && m.fabEcart <= 24 && m.sem >= 10;
  const l = `${ok ? 'ok' : 'KO'} ${n} : bande en ${m.tete} px (${m.bande} px de haut, ${m.sem} semaines), frise en ${m.frise} px, ${m.textes} textes · petits ${m.petits.length} · hors ${m.hors.length} · chevauchés ${m.cheva.length} · sur trait ${m.surTrait.length} · + volant ${m.fabEcart} px au-dessus des onglets`;
  log.push(l); console.log(l); for (const k of ['petits', 'hors', 'cheva', 'surTrait']) if (m[k].length) { const s = '  ' + k + ': ' + JSON.stringify(m[k]).slice(0, 600); log.push(s); console.log(s); }
  // défilé : 240 px plus bas
  await p.evaluate(() => scrollTo(0, 240)); await new Promise((r) => setTimeout(r, 400));
  await p.screenshot({ path: path.join(CAP, `${n}-defile.png`) });
  await p.evaluate(() => scrollTo(0, 0)); await new Promise((r) => setTimeout(r, 300));
  await p.tap('.rb-z'); await new Promise((r) => setTimeout(r, 250));
  await p.screenshot({ path: path.join(CAP, `${n}-toucher.png`) });
}
fs.writeFileSync(path.join(CAP, 'controle-w.txt'), log.join('\n') + '\n');
await nav.close();
