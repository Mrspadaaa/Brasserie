// node en/cap-q.mjs q1 q2 … [base] : captures 390×844 DPR 2 (clair, cave) dans en/cap/, puis contrôles de l'en-tête.
// Contrôles : hauteur d'en-tête (haut de la frise) < base ; rien sous 14 px ; aucun texte hors cadre ni chevauché ; reste identique.
import path from 'node:path'; import fs from 'node:fs'; import { fileURLToPath } from 'node:url'; import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer = require('puppeteer-core');
const HERE = path.dirname(fileURLToPath(import.meta.url));
const fichier = (n) => n === 'base' ? path.join(HERE, '..', 'paliers', 'g-d1.html') : path.join(HERE, n + '.html');
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const p = await nav.newPage();
await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
fs.mkdirSync(path.join(HERE, 'cap'), { recursive: true });
const mesure = () => p.evaluate(() => {
  const fr = document.querySelector('#frise').getBoundingClientRect().top;
  const vis = (e) => { const s = getComputedStyle(e); return s.display !== 'none' && s.visibility !== 'hidden' && +s.opacity > 0; };
  const zone = document.querySelector('#side');
  // textes de l'en-tête : nœuds texte HTML et <text> SVG
  const T = [];
  const w = document.createTreeWalker(zone, NodeFilter.SHOW_TEXT);
  let n; while ((n = w.nextNode())) { const s = n.textContent.trim(); if (!s) continue; const el = n.parentElement; if (el.closest('svg') && !el.closest('text')) continue; if (el.closest('title')) continue;
    let e = el, ok = true; while (e && e !== document.body) { if (!vis(e)) { ok = false; break; } e = e.parentElement; } if (!ok) continue;
    const t = el.closest('text') || el; const r = el.closest('text') ? t.getBoundingClientRect() : (() => { const g = document.createRange(); g.selectNodeContents(n); return g.getBoundingClientRect(); })();
    if (r.width < 1) continue; T.push({ s, fs: parseFloat(getComputedStyle(el).fontSize), x: r.left, y: r.top, r: r.right, b: r.bottom, el: t }); }
  // dédoublonner (tspan dans text)
  const U = []; for (const t of T) if (!U.some((u) => u.el === t.el)) U.push(t); else { const u = U.find((v) => v.el === t.el); u.s += t.s; u.fs = Math.min(u.fs, t.fs); }
  const petits = U.filter((t) => t.fs < 14).map((t) => t.s + ' ' + t.fs);
  const hors = U.filter((t) => t.x < 0 || t.r > 390 || t.y < 0 || t.b > fr + 1).map((t) => t.s);
  const cheva = []; for (let i = 0; i < U.length; i++) for (let j = i + 1; j < U.length; j++) { const a = U[i], b = U[j]; const ox = Math.min(a.r, b.r) - Math.max(a.x, b.x), oy = Math.min(a.b, b.b) - Math.max(a.y, b.y); if (ox > 1 && oy > 3) cheva.push(a.s + ' × ' + b.s); }
  // coupé : élément avec débordement caché plus petit que son contenu
  const coupe = [...zone.querySelectorAll('*')].filter((e) => vis(e) && e.scrollWidth > e.clientWidth + 1 && /hidden|clip/.test(getComputedStyle(e).overflowX) && e.clientWidth > 0).map((e) => e.className);
  // cibles
  const cib = [...zone.querySelectorAll('button,[data-booster]')].filter((e) => vis(e) && e.getBoundingClientRect().width).map((e) => { const r = e.getBoundingClientRect(); return [e.dataset.booster || e.className, Math.round(r.width), Math.round(r.height)]; }).filter((c) => c[1] < 24 || c[2] < 24);
  const fR = document.querySelector('#fab').getBoundingClientRect(); const sousFab = [...document.querySelectorAll('.bar,.lbl,.lt i,.lt,.ps i,[data-libre-sem]')].filter((x) => { const q = x.getBoundingClientRect(); return q.width && q.left < fR.right && q.right > fR.left && q.top < fR.bottom && q.bottom > fR.top; }).length;
  const debord = [...zone.querySelectorAll('button')].filter((e) => vis(e) && e.getBoundingClientRect().width && (e.getBoundingClientRect().left < 0 || e.getBoundingClientRect().right > 390)).length;
  const fab = document.querySelector('#fab').getBoundingClientRect(), bot = document.querySelector('.bot').getBoundingClientRect();
  const lanes = [...document.querySelectorAll('#fb .lane')].map((l) => Math.round(l.getBoundingClientRect().top - fr));
  return { fr: Math.round(fr), textes: U.length, petits, hors, cheva, coupe, cib, fab: [Math.round(fab.left), Math.round(fab.top), Math.round(bot.top - fab.bottom)], lanes: lanes.join(','), sousFab, debord, txt: U.map((t) => t.s).join(' | ') };
});
const res = {}; let res0 = 99;
for (const n of process.argv.slice(2)) {
  for (const th of ['clair', 'cave']) {
    await p.goto('file:///' + fichier(n).split(path.sep).join('/'));
    await p.evaluate((th) => { if (th === 'cave') document.documentElement.setAttribute('data-theme', 'cave'); }, th);
    await p.evaluate(() => document.fonts.ready); await new Promise((r) => setTimeout(r, 200));
    await p.screenshot({ path: path.join(HERE, 'cap', `${n}${th === 'cave' ? '-cave' : ''}.png`) });
    if (th === 'clair') { const m = await mesure(); res[n] = m; if (n === 'base') res0 = m.sousFab;
      const ok = (n === 'base' || m.fr < 146) && !m.petits.length && !m.hors.length && !m.cheva.length && !m.coupe.length && !m.cib.length && !m.debord && m.sousFab <= res0;
      console.log(`${n} tête ${m.fr} px (${(m.fr / 844 * 100).toFixed(1)} %) · ${m.textes} textes · petits ${m.petits.length} · hors ${m.hors.length} · chevauchés ${m.cheva.length} · coupés ${m.coupe.length} · cibles<24 ${m.cib.length} · + ${m.fab} sous le + ${m.sousFab} · boutons hors écran ${m.debord} · rangées ${m.lanes} → ${ok ? 'TETE OK' : 'TETE ECHEC'}`);
      for (const k of ['petits', 'hors', 'cheva', 'coupe', 'cib']) if (m[k].length) console.log('  ' + k + ': ' + JSON.stringify(m[k]).slice(0, 400));
      console.log('  textes : ' + m.txt.slice(0, 300)); }
  }
}
await nav.close();
