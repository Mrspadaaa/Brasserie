// node mg/cap.mjs [g1 …] : captures (repos 390×844, passage depuis le mode actuel r6b, paysage 844×390) et contrôles.
import { createRequire } from 'node:module'; import path from 'node:path'; import fs from 'node:fs'; import { fileURLToPath, pathToFileURL } from 'node:url';
const require = createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer = require('puppeteer-core');
const HERE = path.dirname(fileURLToPath(import.meta.url)); const CAP = path.join(HERE, 'cap'); fs.mkdirSync(CAP, { recursive: true });
const IDS = process.argv.slice(2).length ? process.argv.slice(2) : ['g1', 'g2', 'g3', 'g4', 'g5', 'g6'];
const BASE = pathToFileURL(path.join(HERE, '..', 'en2', 'r6b.html')).href;
const FG = (x, y) => `<div class="mgfg" style="left:${x - 23}px;top:${y - 23}px"></div>`;
const BULLE = (x, y, t) => `<div class="mgbu" style="left:${x}px;top:${y}px">${t}</div>`;
const CSSP = `.mgfg{position:fixed;width:46px;height:46px;border-radius:50%;background:rgba(17,17,17,.30);border:3px solid #fff;box-shadow:0 0 0 2px rgba(17,17,17,.55),0 4px 12px rgba(0,0,0,.3);z-index:9999;pointer-events:none}
.mgbu{position:fixed;z-index:9999;background:#111;color:#fff;font:700 15px "Segoe UI",system-ui,sans-serif;padding:5px 10px;border-radius:14px;white-space:nowrap}
.mgar{position:fixed;z-index:9998;pointer-events:none}
.mgctl{position:fixed;z-index:9990;display:inline-flex;align-items:center;gap:6px;font:700 15px "Segoe UI",system-ui,sans-serif;color:#111;background:#fff}
.mgctl svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}`;
const SV = { cal: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>', courbe: '<svg viewBox="0 0 24 24"><path d="M3 20h18"/><path d="M4 16l4-6 4 3 4-7 4 4"/></svg>' };
const fleche = (x1, y1, x2, y2) => `<svg class="mgar" style="left:0;top:0" width="390" height="844"><defs><marker id="mh${x1}${y1}" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0L10 5L0 10z" fill="#111"/></marker></defs><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#111" stroke-width="4" stroke-dasharray="2 7" stroke-linecap="round" marker-end="url(#mh${x1}${y1})"/></svg>`;
const PASSAGE = {
  g1: `<div class="mgctl" style="left:163px;top:193px;width:64px;height:20px;justify-content:center;background:transparent"><i style="width:40px;height:5px;border-radius:3px;background:#777;display:block"></i></div>${fleche(195, 232, 195, 560)}${FG(195, 203)}${BULLE(208, 420, 'tirer vers le bas')}`,
  g2: `${fleche(195, 350, 195, 440)}${fleche(195, 680, 195, 560)}${FG(195, 320)}${FG(195, 708)}${BULLE(208, 486, 'pincer la frise')}`,
  g3: `<div class="mgctl" style="right:10px;top:196px;height:32px;border:1.5px solid #111;border-radius:16px;overflow:hidden;gap:0"><span style="display:inline-flex;align-items:center;gap:4px;padding:0 9px;height:100%;background:#111;color:#fff">${SV.cal}Frise</span><span style="display:inline-flex;align-items:center;gap:4px;padding:0 9px;height:100%">${SV.courbe}Courbe</span></div>${FG(338, 212)}${BULLE(150, 252, 'toucher « Courbe »')}`,
  g4: `${FG(365, 16)}${BULLE(170, 52, 'toucher le plein écran')}`,
  g5: `<div class="mgctl" style="left:14px;top:722px;height:44px;border-radius:22px;padding:0 14px 0 12px;box-shadow:0 3px 12px rgba(0,0,0,.22),0 0 0 1.5px #111 inset"><span style="color:#9a4f1e;display:inline-flex">${SV.courbe}</span>Courbe</div>${FG(62, 744)}${BULLE(14, 672, 'au pouce')}`,
  g6: `${FG(290, 120)}<div class="mgfg" style="left:259px;top:89px;width:62px;height:62px;background:transparent;border:2px solid #111;box-shadow:none"></div>${BULLE(140, 168, 'toucher deux fois la courbe')}`,
};
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--allow-file-access-from-files'] });
const bilan = [];
async function controle(p, id, vue) {
  return p.evaluate((id, vue) => {
    const W = innerWidth, H = innerHeight, g = window.__mg, err = [];
    const nav = document.querySelector('.bot').getBoundingClientRect(), fab = document.querySelector('.fab').getBoundingClientRect();
    const gap = nav.top - fab.bottom; if (gap < 4 || gap > 24) err.push('fab-gap ' + gap.toFixed(0)); if (W - fab.right > 20) err.push('fab-droite');
    const textes = [];
    document.querySelectorAll('svg text, .tt, .u, .per, .pil, .ch, .seg button, .tog, .pouce, .fin2, .sub, .cle, .bot a span, .badge, .fab span').forEach((e) => {
      const fs = parseFloat(getComputedStyle(e).fontSize); const r = e.getBoundingClientRect(); if (!r.width) return;
      if (fs < 13.99) err.push('petit ' + fs + ' ' + (e.textContent || '').slice(0, 20));
      if (r.left < -.5 || r.right > W + .5 || r.top < -.5 || r.bottom > H + .5) err.push('hors ' + (e.textContent || '').slice(0, 20));
      if (e.tagName !== 'text' && e.clientWidth && e.scrollWidth > e.clientWidth + 1) err.push('coupe ' + (e.textContent || '').slice(0, 20));
      textes.push({ t: (e.textContent || '').slice(0, 24), r, lab: e.matches('text.lab'), svg: e.tagName === 'text' });
    });
    const labs = textes.filter((t) => t.lab), autres = textes.filter((t) => t.svg && !t.lab);
    const X = (a, b, p = 0) => a.left < b.right - p && b.left < a.right - p && a.top < b.bottom - p && b.top < a.bottom - p;
    for (let i = 0; i < labs.length; i++) { for (let j = i + 1; j < labs.length; j++) if (X(labs[i].r, labs[j].r, 1)) err.push('chevauche ' + labs[i].t + ' / ' + labs[j].t); autres.forEach((o) => { if (X(labs[i].r, o.r, 1)) err.push('chevauche ' + labs[i].t + ' / ' + o.t); }); }
    document.querySelectorAll('svg text, .leg, .tt, .per, .pil, #band, .pouce, .seg, .tog, #plot').forEach((e) => { const r = e.getBoundingClientRect(); if (r.width && X(r, fab, 0)) err.push('fab couvre ' + (e.id || (e.className && e.className.baseVal) || e.className || e.textContent).toString().slice(0, 20)); });
    const pouce = document.querySelector('.pouce'); if (pouce) { const r = pouce.getBoundingClientRect(); document.querySelectorAll('svg text, #plot, #band, .leg').forEach((e) => { const q = e.getBoundingClientRect(); if (q.width && X(q, r, 0)) err.push('pouce couvre ' + (e.id || e.textContent).slice(0, 20)); }); }
    const part = g.courbe.height / g.U; if (part < .55) err.push('courbe ' + Math.round(part * 100) + '%');
    const bande = g.bandeVerticale ? g.bande.width : g.bande.height; if (bande > 40.5) err.push('bande ' + bande);
    if (g.caches.length) err.push('cachées ' + g.caches.join(', '));
    if (!g.hon.ok) err.push('sommes ' + JSON.stringify(g.hon.bad));
    return { id, vue, part: Math.round(part * 100), bande: Math.round(bande), labs: labs.length + ' liens croisés ' + (g.croisements || 0) + ' sur un lien ' + (g.reprises || 0), err };
  }, id, vue);
}
for (const id of IDS) {
  const url = pathToFileURL(path.join(HERE, id + '.html')).href;
  for (const [vue, w, h] of [['repos', 390, 844], ['paysage', 844, 390]]) {
    const p = await browser.newPage(); await p.setViewport({ width: w, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const errs = []; p.on('pageerror', (e) => errs.push(e.message));
    await p.goto(url, { waitUntil: 'load', timeout: 120000 }); await new Promise((r) => setTimeout(r, 250));
    let c; try { c = await controle(p, id, vue); } catch (e) { c = { id, vue, part: 0, bande: 0, labs: 0, err: ['controle ' + e.message.slice(0, 120)] }; }
    c.err.push(...errs.map((e) => 'js ' + e)); bilan.push(c);
    await p.screenshot({ path: path.join(CAP, `${id}${vue === 'repos' ? '' : '-paysage'}.png`) }); await p.close();
  }
  const p = await browser.newPage(); await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p.goto(BASE, { waitUntil: 'load' }); await new Promise((r) => setTimeout(r, 300));
  await p.evaluate((css, html) => { const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s); const d = document.createElement('div'); d.innerHTML = html; document.body.appendChild(d); }, CSSP, PASSAGE[id]);
  await p.screenshot({ path: path.join(CAP, `${id}-passage.png`) }); await p.close();
}
await browser.close();
let ok = true;
for (const c of bilan) { if (c.err.length) ok = false; console.log(`${c.id} ${c.vue} courbe ${c.part}% bande ${c.bande}px étiquettes ${c.labs} ${c.err.length ? 'ERREURS ' + [...new Set(c.err)].slice(0, 8).join(' | ') : 'ok'}`); }
console.log(ok ? 'MG OK' : 'MG ECHEC');
