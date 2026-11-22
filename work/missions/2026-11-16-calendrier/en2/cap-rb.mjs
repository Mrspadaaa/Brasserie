// node en2/cap-r.mjs [r1 r2 …] : captures 390×844 DPR 2 (clair, cave, toucher) dans en2/cap/, contrôles de l'en-tête, planches.
// Contrôles : haut de la frise ≤ 190 (q5-tout) ; textes < 14 px ; hors écran ; texte sur texte ; texte sur trait ou hachure
// (points du texte testés contre chaque tracé .ob : isPointInStroke / isPointInFill) ; texte dans la fenêtre des semaines.
import path from 'node:path'; import fs from 'node:fs'; import { fileURLToPath, pathToFileURL } from 'node:url'; import { createRequire } from 'node:module';
const HERE = path.dirname(fileURLToPath(import.meta.url)), CAP = path.join(HERE, 'cap'); fs.mkdirSync(CAP, { recursive: true });
const req = createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json'); const pp = req('puppeteer-core');
const noms = process.argv.slice(2).length ? process.argv.slice(2) : ['r6b', 'r2b', 'r5b'];
const TOUCHE = { r6b: '.rb-z', r2b: '.rb-z', r5b: '.rb-z' };
const nav = await pp.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const p = await nav.newPage(); await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const mesure = () => p.evaluate(() => {
  const fr = document.querySelector('#fb').getBoundingClientRect().top;
  const vis = (e) => { for (let x = e; x && x !== document.body; x = x.parentElement) { const s = getComputedStyle(x); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return false; } return true; };
  const T = [];
  for (const zone of [document.querySelector('#lhead'), document.querySelector('#fh')]) {
    const w = document.createTreeWalker(zone, NodeFilter.SHOW_TEXT); let n;
    while ((n = w.nextNode())) { const s = n.textContent.trim(); if (!s) continue; const el = n.parentElement; if (el.closest('title')) continue; if (el.closest('svg') && !el.closest('text')) continue; if (!vis(el)) continue;
      const t = el.closest('text') || el; const g = document.createRange(); g.selectNodeContents(n); const r = el.closest('text') ? t.getBoundingClientRect() : g.getBoundingClientRect(); if (r.width < 1) continue;
      T.push({ s, fs: parseFloat(getComputedStyle(el).fontSize), x: r.left, y: r.top, r: r.right, b: r.bottom, el: t }); } }
  const U = []; for (const t of T) { const u = U.find((v) => v.el === t.el); if (u) { u.s += ' ' + t.s; u.fs = Math.min(u.fs, t.fs); u.x = Math.min(u.x, t.x); u.r = Math.max(u.r, t.r); } else U.push({ ...t }); }
  const petits = U.filter((t) => t.fs < 14).map((t) => t.s + ' ' + t.fs);
  const hors = U.filter((t) => t.x < 0 || t.r > 390 || t.y < 0 || t.b > fr + 1).map((t) => t.s);
  const cheva = []; for (let i = 0; i < U.length; i++) for (let j = i + 1; j < U.length; j++) { const a = U[i], b = U[j]; const ox = Math.min(a.r, b.r) - Math.max(a.x, b.x), oy = Math.min(a.b, b.b) - Math.max(a.y, b.y); if (ox > 1 && oy > 3) cheva.push(a.s + ' × ' + b.s); }
  // texte sur trait : échantillons dans la zone d'encre (rectangle réduit), testés contre chaque tracé .ob des svg de l'en-tête
  const obs = [...document.querySelectorAll('#lhead svg .ob')].filter(vis);
  const surTrait = [];
  for (const t of U) { const y0 = t.y + 3.5, y1 = t.b - 3.5, x0 = t.x + 1, x1 = t.r - 1; let touche = null;
    for (let y = y0; y <= y1 && !touche; y += 2) for (let x = x0; x <= x1 && !touche; x += 2) for (const o of obs) { const svg = o.ownerSVGElement, m = svg.getScreenCTM().inverse(); const q = new DOMPoint(x, y).matrixTransform(m);
      const f = o.classList.contains('ob-f') ? o.isPointInFill(q) : o.isPointInStroke(q); if (f) { touche = (o.getAttribute('d') ? 'tracé' : o.tagName) + ' ' + (o.getAttribute('stroke') || o.getAttribute('fill') || ''); break; } }
    if (touche) surTrait.push(t.s + ' → ' + touche); }
  const br = document.querySelector('.q-brosse'), bR = br.getBoundingClientRect();
  const dansFen = U.filter((t) => t.x < bR.right - 2 && t.r > bR.left + 2 && t.y < bR.bottom - 2 && t.b > bR.top + 2).map((t) => t.s);
  const svgs = [...document.querySelectorAll('#lhead svg')].filter((s) => s.getBoundingClientRect().width > 150);
  const fh = document.querySelector('#fh').getBoundingClientRect();
  return { fr: Math.round(fr), bande: Math.round(fh.height), textes: U.length, petits, hors, cheva, surTrait, dansFen, txt: U.map((t) => t.s).join(' | ') };
});
const log = [];
for (const n of noms) {
  const f = path.join(HERE, n + '.html');
  for (const th of ['clair', 'cave']) {
    await p.goto(pathToFileURL(f).href); if (th === 'cave') await p.evaluate(() => document.documentElement.setAttribute('data-theme', 'cave'));
    await p.evaluate(() => document.fonts.ready); await new Promise((r) => setTimeout(r, 250));
    await p.screenshot({ path: path.join(CAP, `${n}${th === 'cave' ? '-cave' : ''}.png`) });
    await p.screenshot({ path: path.join(CAP, `_tete-${n}-${th}.png`), clip: { x: 0, y: 0, width: 390, height: 250 } });
    if (th === 'clair') { const m = await mesure(); const ok = m.fr <= 190 && !m.petits.length && !m.hors.length && !m.cheva.length && !m.surTrait.length && !m.dansFen.length;
      const l = `${ok ? 'ok' : 'KO'} ${n} : en-tête ${m.fr} px, bande ${m.bande} px, ${m.textes} textes · petits ${m.petits.length} · hors ${m.hors.length} · chevauchés ${m.cheva.length} · sur trait ${m.surTrait.length} · dans la fenêtre ${m.dansFen.length}`;
      log.push(l); console.log(l); for (const k of ['petits', 'hors', 'cheva', 'surTrait', 'dansFen']) if (m[k].length) { const s = '  ' + k + ': ' + JSON.stringify(m[k]).slice(0, 500); log.push(s); console.log(s); } }
    if (TOUCHE[n]) { await p.tap(TOUCHE[n]); await new Promise((r) => setTimeout(r, 200)); await p.screenshot({ path: path.join(CAP, `${n}-toucher${th === 'cave' ? '-cave' : ''}.png`) });
      if (th === 'clair') await p.screenshot({ path: path.join(CAP, `_tete-${n}-toucher.png`), clip: { x: 0, y: 0, width: 390, height: 420 } }); }
  }
}
// planches : têtes côte à côte (clair, cave)
for (const th of ['clair', 'cave', 'toucher']) {
  const im = (th === 'toucher' ? noms.filter((n) => TOUCHE[n]) : noms).map((n) => `<figure><figcaption>${n}</figcaption><img src="${pathToFileURL(path.join(CAP, `_tete-${n}-${th}.png`)).href}"></figure>`).join('');
  const html = `<html><body style="margin:0;background:#888;display:grid;grid-template-columns:repeat(3,390px);gap:8px;padding:8px;font:16px sans-serif">${im}</body><style>figure{margin:0}img{width:390px;display:block}figcaption{color:#fff}</style></html>`;
  const tf = path.join(CAP, `_planche-b-${th}.html`); fs.writeFileSync(tf, html);
  const q = await nav.newPage(); await q.setViewport({ width: 1210, height: 600, deviceScaleFactor: 1.4 }); await q.goto(pathToFileURL(tf).href); await new Promise((r) => setTimeout(r, 300));
  await q.screenshot({ path: path.join(CAP, `planche-b-${th}.png`), fullPage: true }); await q.close();
}
fs.writeFileSync(path.join(CAP, 'controle-rb.txt'), log.join('\n') + '\n');
await nav.close();
