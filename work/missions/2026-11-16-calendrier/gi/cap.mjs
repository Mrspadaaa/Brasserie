// Captures 390×844 DPR 2 de g-d1 (référence), i1…i8, tout (+ cave) et contrôles : tête, rangées, tailles, chevauchements, coupes, +.
import path from 'node:path'; import fs from 'node:fs'; import { fileURLToPath } from 'node:url'; import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer = require('puppeteer-core');
const HERE = path.dirname(fileURLToPath(import.meta.url));
const u = (f) => 'file:///' + f.split(path.sep).join('/');
const pages = [['g-d1', path.join(HERE, '..', 'paliers', 'g-d1.html')], ...['i1', 'i2', 'i3', 'i4', 'i5', 'i6', 'i7', 'i8', 'tout'].map((n) => [n, path.join(HERE, n + '.html')]), ['tout-cave', path.join(HERE, 'tout.html'), 'cave'],
  // états touchés : semaine S50 (i3, i5), pastille ⏲ (i6), titre Ventes (i8, tout : rangée masquée)
  ['i3-toucher', path.join(HERE, 'i3.html'), null, '#fh .lib[data-libre-sem="50"]'], ['i5-toucher', path.join(HERE, 'i5.html'), null, '#fh .lib[data-libre-sem="50"]'],
  ['i6-toucher', path.join(HERE, 'i6.html'), null, '.gd-pill.bad'], ['i8-masque', path.join(HERE, 'i8.html'), null, '#fb .lane[data-voie=vente] .lt'],
  ['tout-masque', path.join(HERE, 'tout.html'), null, '#fb .lane[data-voie=vente] .lt']].filter(([n, f]) => fs.existsSync(f) && (!process.argv[2] || process.argv[2].split(',').includes(n)));
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const p = await nav.newPage();
await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const lignes = []; let ko = 0;
for (const [n, f, theme, tap] of pages) {
  await p.goto(u(f), { waitUntil: 'load' });
  if (theme) await p.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
  await new Promise((r) => setTimeout(r, 150));
  if (tap) { const [x, y] = await p.evaluate((q) => { const r = document.querySelector(q).getBoundingClientRect(); return [r.left + Math.min(30, r.width / 2), r.top + r.height / 2]; }, tap); await p.mouse.click(x, y); await new Promise((r) => setTimeout(r, 150)); }
  await p.screenshot({ path: path.join(HERE, 'cap', n + '.png') });
  const m = await p.evaluate(() => {
    const H = innerHeight, W = innerWidth, bot = document.querySelector('nav.bot').getBoundingClientRect().top;
    const tete = Math.round(document.querySelector('#fb').getBoundingClientRect().top * 100) / 100;
    const vis = (e) => { for (let x = e; x && x.nodeType === 1; x = x.parentElement) { const c = getComputedStyle(x); if (c.display === 'none' || c.visibility === 'hidden' || +c.opacity === 0) return false; } return true; };
    const lanes = [...document.querySelectorAll('#fb .lane')].map((l) => { const r = l.getBoundingClientRect(); return { v: l.dataset.voie, titre: l.querySelector('.lt').getBoundingClientRect().bottom <= bot, entiere: r.bottom <= bot + 0.5 }; });
    // nœuds texte visibles à l'écran
    const tx = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (w.nextNode()) { const t = w.currentNode; if (!t.textContent.trim() || !vis(t.parentElement)) continue; const rg = document.createRange(); rg.selectNodeContents(t);
      const fz = parseFloat(getComputedStyle(t.parentElement).fontSize); for (const r of rg.getClientRects()) if (r.width > 1 && r.bottom > 0 && r.top < H) { const c = (r.top + r.bottom) / 2, h = fz * 0.5; tx.push({ e: t.parentElement, s: t.textContent.trim().slice(0, 18), l: r.left, t: c - h, r: r.right, b: c + h, fs: fz }); } }
    const def = [];
    const petits = [...new Set(tx.filter((x) => x.fs < 14).map((x) => x.s + ' ' + x.fs))]; if (petits.length) def.push('PETIT ' + petits.join(' | '));
    const inter = (a, b, m = 1) => Math.min(a.r, b.r) - Math.max(a.l, b.l) > m && Math.min(a.b, b.b) - Math.max(a.t, b.t) > m;
    for (let i = 0; i < tx.length; i++) for (let j = i + 1; j < tx.length; j++) { const a = tx[i], b = tx[j]; if (a.e === b.e) continue; const ia = a.e.closest('#lhead,#fh,#fb,nav.bot,#fab'), ib = b.e.closest('#lhead,#fh,#fb,nav.bot,#fab'); if (ia !== ib && (ia?.id === 'fb' || ib?.id === 'fb')) continue; if (inter(a, b, 1.5)) def.push(`TEXTE/TEXTE « ${a.s} » × « ${b.s} »`); }
    for (const x of tx) if (x.l < -0.5 || x.r > W + 0.5) def.push(`BORD « ${x.s} »`);
    for (const e of document.querySelectorAll('#lhead *, #fh *, #fab, .lt *')) { if (!vis(e)) continue; const r = e.getBoundingClientRect(); if (r.width && (r.right > W + 0.5 || r.left < -0.5)) def.push('BORD objet ' + (e.className?.baseVal ?? e.className) + ' ' + Math.round(r.left) + '-' + Math.round(r.right)); }
    // coupe : élément porteur de texte dont le contenu déborde (overflow caché ou ellipsis)
    for (const e of document.querySelectorAll('body *')) { if (!vis(e) || !e.childNodes.length) continue; const c = getComputedStyle(e); if ((c.overflow !== 'visible' || c.textOverflow === 'ellipsis') && e.scrollWidth > e.clientWidth + 1 && [...e.childNodes].some((k) => k.nodeType === 3 && k.textContent.trim())) { const r = e.getBoundingClientRect(); if (r.bottom > 0 && r.top < H) def.push('COUPE « ' + e.textContent.trim().slice(0, 20) + ' »'); } }
    // nom de barre qui sort de sa barre
    for (const l of document.querySelectorAll('#fb .bar .lbl.in')) { const a = l.getBoundingClientRect(), b = l.closest('.bar').getBoundingClientRect(); if (a.right > b.right + 1) def.push('NOM DEBORDE « ' + l.textContent.trim().slice(0, 18) + ' »'); }
    // le + (rond) ne couvre ni texte ni picto
    const fb = document.querySelector('#fab').getBoundingClientRect(); const cx = fb.left + fb.width / 2, cy = fb.top + fb.height / 2, R = fb.width / 2 + 2;
    const touche = (r) => { const nx = Math.max(r.left ?? r.l, Math.min(cx, r.right ?? r.r)), ny = Math.max(r.top ?? r.t, Math.min(cy, r.bottom ?? r.b)); return Math.hypot(nx - cx, ny - cy) < R; };
    for (const x of tx) if (!x.e.closest('#fab') && touche(x)) def.push(`+ COUVRE « ${x.s} »`);
    for (const k of document.querySelectorAll('#fb .k17-p .k18-r, #fb .bar')) { const r = k.getBoundingClientRect(); if (r.width && vis(k) && touche(r)) def.push('+ COUVRE objet ' + k.className); }
    const fabTxt = [...document.querySelectorAll('#fab, #fab *')].filter(vis).map((e) => e.childNodes.length && [...e.childNodes].some((k) => k.nodeType === 3 && k.textContent.trim()) ? e.textContent.trim() : '').filter(Boolean).join(' ');
    const BR = (e) => e.getBoundingClientRect(); const fhb = BR(document.querySelector('#fh')).bottom;
    const ex = [];
    for (const ln of document.querySelectorAll('.k18-ln[data-k18-lien]')) { if (!vis(ln)) continue; const a = BR(ln), bar = BR(document.querySelector('[data-chose="' + ln.dataset.k18Lien + '"]')), ch = [...ln.closest('.lane').querySelectorAll('.k17-p .k18-r')].map(BR).find((c) => c.right <= a.left + 2);
      const ok = Math.abs(a.top - bar.bottom) <= 1.5 && a.height >= 25 && ch && a.bottom >= ch.top + 4 && a.bottom <= ch.bottom - 4; ex.push('lien ' + Math.round(a.top) + '→' + Math.round(a.bottom) + ' (barre ' + Math.round(bar.bottom) + ', chariot ' + (ch ? Math.round(ch.top) + '-' + Math.round(ch.bottom) : '?') + ')'); if (!ok) def.push('LIEN du chariot coupé'); }
    const l1 = document.querySelector('#fb .lane'); const hauts = tx.filter((x) => l1.contains(x.e)).map((x) => x.t).concat([...l1.querySelectorAll('.bar')].map((b) => BR(b).top)); const marge = Math.round((Math.min(...hauts) - fhb) * 10) / 10; ex.push('marge 1re rangée ' + marge);
    if (document.querySelector('.gi1-t') && marge < 6) def.push('MARGE sous la bande ' + marge + ' < 6');
    const pil = BR(document.querySelector('.gd-pill.bad')); ex.push('pastille ' + Math.round(pil.width) + '×' + Math.round(pil.height)); if (pil.width > 48 || pil.height > 33) def.push('PASTILLE grossie');
    for (const s of document.querySelectorAll('.lt .gi2')) { const ti = tx.find((x) => x.e === s.closest('.lt')), su = tx.find((x) => x.e === s); if (!ti || !su || Math.abs((ti.t + ti.b) / 2 - (su.t + su.b) / 2) > 2 || su.l < ti.r) def.push('RESUME hors de sa place « ' + s.textContent + ' »'); }
    if (document.querySelector('#fh .gi5')) def.push('JAUGE dans la bande');
    const tt = (v) => tx.find((x) => x.e === document.querySelector('#fb .lane[data-voie=' + v + '] .lt')); const tr = tt('renovation'), ta = tt('activite'); if (tr && ta) { const g = Math.round((ta.t - tr.b) * 10) / 10; ex.push('vides ' + g); if (g < 8) def.push('RANGEES VIDES à ' + g + ' px'); }
    const hd = document.querySelector('#side').getBoundingClientRect(), fh = document.querySelector('#fh').getBoundingClientRect();
    return { tete, side: hd.height, fh: Math.round(fh.height * 100) / 100, lanes, ex: ex.join(' · '), def: [...new Set(def)], fab: `${Math.round(fb.left)},${Math.round(fb.top)} ${Math.round(fb.width)}×${Math.round(fb.height)} « ${fabTxt} »`, sw: document.documentElement.scrollWidth, tailles: [...new Set(tx.map((x) => x.fs))].sort((a, b) => a - b).join('/') };
  });
  const ti = m.lanes.filter((l) => l.titre).length, en = m.lanes.filter((l) => l.entiere).length;
  const okTete = m.tete === 202; if (!okTete || m.def.length || ti < 7 || m.sw > 390) ko++;
  lignes.push(`${n.padEnd(9)} tête ${m.tete} px (côté ${m.side} + bande ${m.fh}) ${okTete ? '=' : '≠'} g-d1 · rangées titre ${ti}/7, entières ${en}/7 · tailles ${m.tailles} px · + ${m.fab} · largeur ${m.sw}\n          ${m.ex}\n          ${m.def.length ? m.def.join('\n          ') : 'défauts 0'}`);
}
await nav.close();
const out = lignes.join('\n') + `\n${ko ? 'CONTROLE KO (' + ko + ')' : 'CONTROLE OK'}`;
fs.writeFileSync(path.join(HERE, 'cap', 'controle.txt'), out); console.log(out);
