// gi2 (passe corrigée) : captures 390×844 DPR 2 (clair et cave) de g-d1, choisi-a/b (repos, ajout, masque, semaine S50 = i3, retard = i6),
// r2-a/c (repos, masque) ; contrôles de gi/cap.mjs + CARRE (colonne, cible, écart ≥ 32), YEUX (colonne), RESUME (place, collé), LEGENDE.
import path from 'node:path'; import fs from 'node:fs'; import { fileURLToPath } from 'node:url'; import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer = require('puppeteer-core');
const HERE = path.dirname(fileURLToPath(import.meta.url));
const u = (f) => 'file:///' + f.split(path.sep).join('/');
const V = ['choisi-a', 'choisi-b', 'r2-a', 'r2-c'];
const GESTES = { ajout: '#fb .lane[data-voie=vente] .g2-c', masque: '#fb .lane[data-voie=vente] .g2-oe', semaine: '#fh .lib[data-libre-sem="50"]', retard: '.gd-pill.bad' };
const pages = [['g-d1', path.join(HERE, '..', 'paliers', 'g-d1.html')]];
for (const n of V) for (const th of [null, 'cave']) {
  const f = path.join(HERE, n + '.html'), s = th ? '-cave' : '';
  pages.push([n + s, f, th]);
  for (const [g, q] of Object.entries(GESTES)) if (n.startsWith('choisi') || g === 'masque') pages.push([n + '-' + g + s, f, th, q]);
}
const filtre = pages.filter(([n, f]) => fs.existsSync(f) && (!process.argv[2] || process.argv[2].split(',').some((k) => n.startsWith(k))));
fs.mkdirSync(path.join(HERE, 'cap'), { recursive: true });
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const p = await nav.newPage();
await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const lignes = []; let ko = 0;
for (const [n, f, theme, tap] of filtre) {
  await p.goto(u(f), { waitUntil: 'load' });
  if (theme) await p.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
  await new Promise((r) => setTimeout(r, 150));
  if (tap) { const [x, y] = await p.evaluate((q) => { const r = document.querySelector(q).getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, tap); await p.mouse.click(x, y); await new Promise((r) => setTimeout(r, 150)); }
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
    for (let i = 0; i < tx.length; i++) for (let j = i + 1; j < tx.length; j++) { const a = tx[i], b = tx[j]; if (a.e === b.e) continue; const ia = a.e.closest('#lhead,#fh,#fb,nav.bot,#fab'), ib = b.e.closest('#lhead,#fh,#fb,nav.bot,#fab'); if (ia !== ib && (ia?.id === 'fb' || ib?.id === 'fb')) continue; const oa = a.e.closest('.gi-tip,.gi-sh'), ob = b.e.closest('.gi-tip,.gi-sh'); if (oa !== ob) continue; if (inter(a, b, 1.5)) def.push(`TEXTE/TEXTE « ${a.s} » × « ${b.s} »`); }
    for (const x of tx) if (x.l < -0.5 || x.r > W + 0.5) def.push(`BORD « ${x.s} »`);
    for (const e of document.querySelectorAll('#lhead *, #fh *, #fab, .lt *')) { if (!vis(e)) continue; const r = e.getBoundingClientRect(); if (r.width && (r.right > W + 0.5 || r.left < -0.5)) def.push('BORD objet ' + (e.className?.baseVal ?? e.className) + ' ' + Math.round(r.left) + '-' + Math.round(r.right)); }
    // coupe : élément porteur de texte dont le contenu déborde (overflow caché ou ellipsis)
    for (const e of document.querySelectorAll('body *')) { if (!vis(e) || !e.childNodes.length) continue; const c = getComputedStyle(e); if ((c.overflow !== 'visible' || c.textOverflow === 'ellipsis') && e.scrollWidth > e.clientWidth + 1 && [...e.childNodes].some((k) => k.nodeType === 3 && k.textContent.trim())) { const r = e.getBoundingClientRect(); if (r.bottom > 0 && r.top < H) def.push('COUPE « ' + e.textContent.trim().slice(0, 20) + ' »'); } }
    // nom de barre qui sort de sa barre
    for (const l of document.querySelectorAll('#fb .bar .lbl.in')) { const a = l.getBoundingClientRect(), b = l.closest('.bar').getBoundingClientRect(); if (a.right > b.right + 1) def.push('NOM DEBORDE « ' + l.textContent.trim().slice(0, 18) + ' »'); }
    // le + (rond) ne couvre ni texte ni picto
    const fb = document.querySelector('#fab').getBoundingClientRect(); const fabVu = fb.width > 0; const cx = fb.left + fb.width / 2, cy = fb.top + fb.height / 2, R = fb.width / 2 + 2;
    const touche = (r) => { const nx = Math.max(r.left ?? r.l, Math.min(cx, r.right ?? r.r)), ny = Math.max(r.top ?? r.t, Math.min(cy, r.bottom ?? r.b)); return Math.hypot(nx - cx, ny - cy) < R; };
    for (const x of tx) if (fabVu && !x.e.closest('#fab') && touche(x)) def.push(`+ COUVRE « ${x.s} »`);
    for (const k of document.querySelectorAll('#fb .k17-p .k18-r, #fb .bar')) { const r = k.getBoundingClientRect(); if (fabVu && r.width && vis(k) && touche(r)) def.push('+ COUVRE objet ' + k.className); }
    const fabTxt = [...document.querySelectorAll('#fab, #fab *')].filter(vis).map((e) => e.childNodes.length && [...e.childNodes].some((k) => k.nodeType === 3 && k.textContent.trim()) ? e.textContent.trim() : '').filter(Boolean).join(' ');
    const BR = (e) => e.getBoundingClientRect(); const fhb = BR(document.querySelector('#fh')).bottom;
    const ex = [];
    for (const ln of document.querySelectorAll('.k18-ln[data-k18-lien]')) { if (!vis(ln)) continue; const a = BR(ln), bar = BR(document.querySelector('[data-chose="' + ln.dataset.k18Lien + '"]')), ch = [...ln.closest('.lane').querySelectorAll('.k17-p .k18-r')].map(BR).find((c) => c.right <= a.left + 2);
      const ok = Math.abs(a.top - bar.bottom) <= 1.5 && a.height >= 25 && ch && a.bottom >= ch.top + 4 && a.bottom <= ch.bottom - 4; ex.push('lien ' + Math.round(a.top) + '→' + Math.round(a.bottom) + ' (barre ' + Math.round(bar.bottom) + ', chariot ' + (ch ? Math.round(ch.top) + '-' + Math.round(ch.bottom) : '?') + ')'); if (!ok) def.push('LIEN du chariot coupé'); }
    const l1 = document.querySelector('#fb .lane'); const hauts = tx.filter((x) => l1.contains(x.e)).map((x) => x.t).concat([...l1.querySelectorAll('.bar')].map((b) => BR(b).top)); const marge = Math.round((Math.min(...hauts) - fhb) * 10) / 10; ex.push('marge 1re rangée ' + marge);
    if (document.querySelector('.gi1-t') && marge < 6) def.push('MARGE sous la bande ' + marge + ' < 6');
    const pil = BR(document.querySelector('.gd-pill.bad')); ex.push('pastille ' + Math.round(pil.width) + '×' + Math.round(pil.height)); if (pil.width > 48 || pil.height > 33) def.push('PASTILLE grossie');
    const nb = document.querySelector('nav.bot').getBoundingClientRect().top, ecFab = Math.round(nb - fb.bottom); ex.push('+ à ' + ecFab + ' px des onglets'); if (!fabVu) ex.push('+ volant caché pendant la pose'); else if (ecFab < 4 || ecFab > 24) def.push('FAB à ' + ecFab + ' px des onglets');
    if (fabTxt) def.push('FAB dit « ' + fabTxt + ' »');
    const titreDe = (lt) => tx.find((x) => x.e.classList.contains('g2-nm') && lt.contains(x.e));
    const cars = [...document.querySelectorAll('#fb .lane:not(.k15-off) .g2-c')].map((c) => { const r = BR(c), ti = titreDe(c.closest('.lt')); return { x: r.left + r.width / 2, w: r.width, h: r.height, dy: ti ? (r.top + r.bottom) / 2 - (ti.t + ti.b) / 2 : 99, nom: c.closest('.lane').dataset.nom }; });
    if (cars.length) { const xs = cars.map((c) => c.x), e = Math.max(...xs) - Math.min(...xs); ex.push('carrés ' + cars.length + ', colonne ±' + Math.round(e * 10) / 10 + ' px, cible ' + Math.round(Math.min(...cars.map((c) => Math.min(c.w, c.h)))) + ' px, hors ligne max ' + Math.round(Math.max(...cars.map((c) => Math.abs(c.dy))) * 10) / 10);
      if (e > 2) def.push('CARRE hors colonne ' + e); for (const c of cars) { if (Math.min(c.w, c.h) < 24) def.push('CARRE cible < 24 ' + c.nom); if (Math.abs(c.dy) > 2) def.push('CARRE hors ligne ' + c.nom + ' ' + Math.round(c.dy)); } }
    if (document.querySelector('#fb .g2-c') && document.querySelector('#fb .k14-pl')) def.push('COLONNE de + encore là');
    const cy2 = [...document.querySelectorAll('#fb .lane .g2-c')].filter(vis).map((c) => { const r = BR(c); return [(r.top + r.bottom) / 2, c.closest('.lane').dataset.nom]; }).sort((a, b) => a[0] - b[0]);
    let ecMin = 999; for (let i = 1; i < cy2.length; i++) { const d = cy2[i][0] - cy2[i - 1][0]; ecMin = Math.min(ecMin, d); if (d < 32) def.push('CARRES à ' + Math.round(d) + ' px (' + cy2[i - 1][1] + '/' + cy2[i][1] + ') < 32'); }
    if (cy2.length > 1) ex.push('écart min carrés ' + Math.round(ecMin));
    const yeux = [...document.querySelectorAll('#fb .lane .g2-oe')].filter(vis).map((e) => { const r = BR(e); return r.left + r.width / 2; });
    if (yeux.length) { const e = Math.max(...yeux) - Math.min(...yeux); ex.push('yeux ' + yeux.length + ', colonne ±' + Math.round(e * 10) / 10 + ' px'); if (e > 2) def.push('YEUX hors colonne ' + Math.round(e)); }
    for (const c of document.querySelectorAll('#fb .lane:not(.k15-off) .lt .g2-r')) { const r = BR(c), L = c.closest('.lane'); for (const b of L.querySelectorAll('.bar')) { const q = BR(b); if (Math.min(r.bottom, q.bottom) - Math.max(r.top, q.top) > 2 && q.left - r.right < 8 && q.right > r.left) def.push('RESUME collé à « ' + b.textContent.trim().slice(0, 14) + ' » (' + Math.round(q.left - r.right) + ' px)'); } }
    const legs = [...document.querySelectorAll('.g2-leg')].filter(vis); if (document.querySelector('#fb .g2-r') && legs.length !== 1) def.push('LEGENDE ' + legs.length);
    for (const g of legs) { const r = BR(g); ex.push('légende ' + Math.round(r.left) + '-' + Math.round(r.right) + ' × ' + Math.round(r.top) + '-' + Math.round(r.bottom)); if (fabVu && touche(r)) def.push('+ COUVRE la légende'); if (r.bottom > bot) def.push('LEGENDE sous les onglets'); }
    const ouv = document.querySelector('.gi-tip'); if (ouv) ex.push('bulle « ' + ouv.textContent.trim() + ' »');
    const sh = document.querySelector('.gi-sh:not([hidden])'); if (sh) ex.push('feuille « ' + sh.textContent.trim().replace(/\s+/g, ' ').slice(0, 70) + ' »');
    const rs = [...document.querySelectorAll('#fb .lane:not(.k15-off) .lt .g2-r')]; if (rs.length) { const rd = rs.map((r) => BR(r).right); ex.push('résumés ' + rs.length + ' bords droits ' + rd.map(Math.round).join('/')); }
    for (const s of document.querySelectorAll('#fb .lane:not(.k15-off) .lt .g2-r')) { const ti = titreDe(s.closest('.lt')), su = tx.find((x) => s.contains(x.e) && x.s.match(/[0-9]/)); if (!ti || !su || Math.abs((ti.t + ti.b) / 2 - (su.t + su.b) / 2) > 2 || su.l < ti.r) def.push('RESUME hors de sa place « ' + s.textContent + ' »'); }
    if (document.querySelector('#fh .gi5')) def.push('JAUGE dans la bande');
    const tt = (v) => tx.find((x) => x.e === document.querySelector('#fb .lane[data-voie=' + v + '] .lt .g2-nm')); const tr = tt('renovation'), ta = tt('activite'); if (tr && ta) { const g = Math.round((ta.t - tr.b) * 10) / 10; ex.push('vides ' + g); if (g < 8) def.push('RANGEES VIDES à ' + g + ' px'); }
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
