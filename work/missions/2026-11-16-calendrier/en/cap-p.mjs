// node en/cap-p.mjs : captures 390x844 DPR 2 (base + p1..p6) dans en/cap/, et contrôles de la tête.
// Contrôles : hauteur de tête (haut de #frise) < base ; rien sous 14 px ; aucun texte chevauché ni coupé ni hors écran ;
// frise identique à la base au pixel (barres fixes masquées) ; + à la même place que dans la base.
import path from 'node:path'; import fs from 'node:fs'; import { fileURLToPath } from 'node:url'; import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer = require('puppeteer-core');
const HERE = path.dirname(fileURLToPath(import.meta.url));
const pages = [['p-base', path.join(HERE, '..', 'paliers', 'g-d1.html')], ...['p1', 'p2', 'p3', 'p4', 'p5', 'p6'].map(k => [k, path.join(HERE, k + '.html')])].filter(([k]) => process.argv.length < 3 || process.argv.slice(2).includes(k) || k === 'p-base');
const theme = process.env.THEME || '';
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const p = await nav.newPage();
const url = (f) => 'file:///' + f.split(path.sep).join('/');
const res = {}; let ref = null, ok = true;
for (const [k, f] of pages) {
  await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await p.goto(url(f)); if (theme) await p.evaluate(t => document.documentElement.dataset.theme = t, theme);
  await p.evaluate(() => document.fonts.ready); await new Promise(r => setTimeout(r, 250));
  await p.screenshot({ path: path.join(HERE, 'cap', k + (theme ? '-' + theme : '') + '.png') });
  await p.screenshot({ path: path.join(HERE, 'cap', 'tete-' + k + (theme ? '-' + theme : '') + '.png'), clip: { x: 0, y: 0, width: 390, height: 250 } });
  const m = await p.evaluate((k) => {
    const fr = document.querySelector('#frise').getBoundingClientRect().top, fb = document.querySelector('#fb').getBoundingClientRect().top;
    const head = k === 'p-base' ? [...document.querySelectorAll('#lhead, #mini')] : [document.querySelector('.en-h')];
    const vis = (e) => { for (let n = e; n && n.nodeType === 1; n = n.parentElement) { const cs = getComputedStyle(n); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false; } return true; };
    const boites = []; let minF = 99; const defauts = [];
    for (const h of head) for (const e of h.querySelectorAll('button')) { const r = e.getBoundingClientRect(); if (r.width && (r.left < 0 || r.right > 390)) defauts.push('BOUTON HORS ' + (e.getAttribute('aria-label') || '').slice(0, 20)); }
    for (const h of head) {
      const tw = document.createTreeWalker(h, NodeFilter.SHOW_TEXT);
      for (let n; (n = tw.nextNode());) {
        if (!n.textContent.trim() || !vis(n.parentElement)) continue;
        const el = n.parentElement, fs = parseFloat(getComputedStyle(el).fontSize); minF = Math.min(minF, fs);
        const rg = document.createRange(); rg.selectNodeContents(n);
        for (const r of rg.getClientRects()) if (r.width > 1) boites.push({ t: n.textContent.trim().slice(0, 18), x0: r.left, y0: r.top, x1: r.right, y1: r.bottom, fs });
        // coupe : un parent qui rogne
        for (let q = el; q && q !== h.parentElement; q = q.parentElement) { const cs = getComputedStyle(q); if ((cs.overflow + cs.overflowX).includes('hidden') && (q.scrollWidth > q.clientWidth + 1 || q.scrollHeight > q.clientHeight + 1)) defauts.push('COUPE ' + n.textContent.trim().slice(0, 18)); }
      }
    }
    // chevauchements (les boîtes de texte se resserrent de 25 % en hauteur : interlignage)
    const sh = (b) => { const d = (b.y1 - b.y0) * .2; return { ...b, y0: b.y0 + d, y1: b.y1 - d }; };
    const B = boites.map(sh);
    for (let i = 0; i < B.length; i++) { const a = B[i];
      if (a.x0 < 0 || a.x1 > 390 || a.y0 < 0) defauts.push('HORS ' + a.t);
      for (let j = i + 1; j < B.length; j++) { const b = B[j]; const ix = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), iy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0); if (ix > 1 && iy > 1) defauts.push(`CHEVAUCHE « ${a.t} » × « ${b.t} »`); } }
    // cibles : 24 px au moins, au centre l'élément lui-même
    for (const h of head) for (const e of h.querySelectorAll('button')) { if (!vis(e)) continue; const r = e.getBoundingClientRect(); if (r.width < 24 || r.height < 24) defauts.push('CIBLE ' + (e.getAttribute('aria-label') || '').slice(0, 20) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height)); const z = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); if (z && !e.contains(z)) defauts.push('CIBLE COUVERTE ' + (e.getAttribute('aria-label') || '').slice(0, 20)); }
    const svgH = (k === 'p-base' ? [...document.querySelectorAll('#mini svg')] : [...document.querySelectorAll('.en-h svg.en-g')]).reduce((s, e) => s + e.getBoundingClientRect().height, 0);
    const fab = document.querySelector('#fab').getBoundingClientRect();
    return { tete: Math.round(fr), tetePct: +(fr / 844 * 100).toFixed(1), teteFb: Math.round(fb), graphe: Math.round(svgH), minF, nTextes: boites.length, defauts: [...new Set(defauts)], fab: [Math.round(fab.left), Math.round(fab.top)], over: document.documentElement.scrollWidth > 390 };
  }, k);
  // frise au pixel : grande fenêtre, barres fixes masquées, découpe à partir du haut de #frise
  await p.setViewport({ width: 390, height: 1700, deviceScaleFactor: 1 });
  await p.addStyleTag({ content: '.fab,.bot,#fab{visibility:hidden!important}' });
  await new Promise(r => setTimeout(r, 120));
  const top = await p.evaluate(() => document.querySelector('#frise').getBoundingClientRect().top);
  const img = await p.screenshot({ clip: { x: 0, y: top, width: 390, height: 1200 }, encoding: 'base64' });
  if (k === 'p-base') ref = img; else m.frise = img === ref ? 'IDENTIQUE' : 'DIFFERE';
  res[k] = m;
}
const b = res['p-base'];
for (const [k, m] of Object.entries(res)) {
  if (k !== 'p-base') {
    if (m.tete >= b.tete) m.defauts.push(`TETE ${m.tete} ≥ base ${b.tete}`);
    if (m.graphe <= b.graphe) m.defauts.push(`GRAPHE ${m.graphe} ≤ base ${b.graphe}`);
    if (m.frise !== 'IDENTIQUE') m.defauts.push('FRISE ' + m.frise);
    if (m.fab.join() !== b.fab.join()) m.defauts.push('FAB ' + m.fab + ' ≠ ' + b.fab);
    if (m.minF < 14) m.defauts.push('TAILLE ' + m.minF);
    if (m.over) m.defauts.push('DEBORDE');
    if (m.defauts.length) ok = false;
  }
  console.log(k.padEnd(4), `tête ${m.tete} px (${m.tetePct} %) · jusqu'aux barres ${m.teteFb} · graphe ${m.graphe} px · min ${m.minF} px · textes ${m.nTextes} · frise ${m.frise || '-'} · + ${m.fab}`, m.defauts.length ? '\n   ' + m.defauts.join('\n   ') : '');
}
fs.writeFileSync(path.join(HERE, 'cap', 'p-mesures' + (theme ? '-' + theme : '') + '.json'), JSON.stringify(res, null, 1));
console.log(ok ? 'CONTROLE OK' : 'CONTROLE ECHEC');
await nav.close();
