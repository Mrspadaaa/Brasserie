// Captures 390×844 DPR 2, clair et cave, + contrôles (texte < 14 px, débordement, texte coupé, chevauchements lk-, place du +).
// node work/missions/2026-11-16-liens-app/inter/outils/lk-cap.mjs [filtre]
import { createRequire } from 'module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const require = createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer = require('puppeteer-core');
const INTER = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const V = JSON.parse(fs.readFileSync(path.join(INTER, 'outils/lk-vues.json'), 'utf8'));
const filtre = process.argv[2] || '';
const VERIF = fs.readFileSync(path.join(INTER, 'outils/verif-recouvre.js'), 'utf8');
const br = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const p = await br.newPage();
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const res = [];
for (const x of V) {
  if (filtre && !(x.v + '-' + x.f).includes(filtre)) continue;
  for (const th of ['clair', 'cave']) {
    const url = pathToFileURL(path.join(INTER, x.v, x.f + '.html')).href + '?theme=' + th;
    await p.goto(url, { waitUntil: 'load' });
    await new Promise(r => setTimeout(r, x.base === 'carnet' ? 2200 : 900));
    const m = await p.evaluate(() => {
      const out = { err: document.title.startsWith('LKERR') ? document.title : '', petit: [], coupe: [], chev: [], fab: null, debord: document.documentElement.scrollWidth > 391 };
      const vis = e => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < 844 && r.right > 0 && r.left < 390 && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0.05; };
      const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let t; while ((t = tw.nextNode())) { const s = t.textContent.trim(); if (!s) continue; const e = t.parentElement; if (!e || !vis(e)) continue; if (e.closest('[hidden],[aria-hidden=true] svg,.scrim')) continue;
        const fs = parseFloat(getComputedStyle(e).fontSize); if (fs < 13.9) out.petit.push(s.slice(0, 30) + ' ' + fs);
      }
      for (const e of document.querySelectorAll('[class*=lk-] , [class*=lk-] *')) { if (!vis(e)) continue; if (e.scrollWidth > e.clientWidth + 1 && e.clientWidth > 0 && /hidden|clip/.test(getComputedStyle(e).overflowX) && e.textContent.trim()) out.coupe.push((e.className.baseVal ?? e.className) + ':' + e.textContent.trim().slice(0, 30)); 
        const r = e.getBoundingClientRect(); if (r.right > 390.5 || r.left < -0.5) out.coupe.push('hors écran ' + (e.className.baseVal ?? e.className)); }
      const L = [...document.querySelectorAll('.lk-pop,.lk-bul,.lk-tip,.lk-toast,.lk-drag,.lk-cc,.lk-lies,.lk-meta,.toast:not([hidden]),#s-toast:not([hidden])')].filter(vis);
      const fab = [...document.querySelectorAll('#fab,.fab,.s-fab')].find(vis);
      if (fab) { const r = fab.getBoundingClientRect(); const nav = [...document.querySelectorAll('nav.bot,nav.nav,nav.s-bot,.bot,.nav')].find(vis); out.fab = { droite: Math.round(390 - r.right), bas: Math.round(r.bottom), ecart: nav ? Math.round(nav.getBoundingClientRect().top - r.bottom) : null }; L.push(fab); }
      const ov = (a, b) => { const r = a.getBoundingClientRect(), s = b.getBoundingClientRect(); return Math.max(0, Math.min(r.right, s.right) - Math.max(r.left, s.left)) * Math.max(0, Math.min(r.bottom, s.bottom) - Math.max(r.top, s.top)); };
      for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) if (ov(L[i], L[j]) > 4 && !L[i].contains(L[j]) && !L[j].contains(L[i])) out.chev.push((L[i].className.baseVal ?? L[i].className) + ' × ' + (L[j].className.baseVal ?? L[j].className));
      return out;
    });
    const rc = await p.evaluate(VERIF); m.sousPlus = rc.sousPlus; m.tranche = rc.tranche;
    const f = path.join(INTER, 'cap', `${x.v}-${x.f}-${th}.png`);
    await p.screenshot({ path: f });
    const ok = !m.err && !m.debord && !m.petit.length && !m.coupe.length && !m.chev.length && !m.sousPlus.length && !m.tranche.length && (!m.fab || (m.fab.ecart >= 4 && m.fab.ecart <= 24));
    res.push({ cap: path.basename(f), ok, ...m });
    console.log((ok ? 'OK ' : 'KO ') + path.basename(f) + (ok ? '' : ' ' + JSON.stringify(m)));
  }
}
fs.writeFileSync(path.join(INTER, 'cap', 'lk-verif.json'), JSON.stringify(res, null, 1));
await br.close();
