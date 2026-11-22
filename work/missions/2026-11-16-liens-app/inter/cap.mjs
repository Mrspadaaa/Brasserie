// Captures 390 × 844 DPR 2, clair et cave, avec mesures : node cap.mjs [filtre]
import { createRequire } from 'node:module'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';
const require = createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer = require('puppeteer-core');
const ICI = path.dirname(fileURLToPath(import.meta.url)); const CAP = path.join(ICI, 'cap');
const L9 = ['fut-avant', 'fut-apres', 'brassin-avant', 'brassin-apres', 'cuve-avant', 'cuve-apres', 'table-avant', 'table-apres'];
const LOTS = { 'l9-a': L9, 'l9-b': L9, 'l9-c': L9, 'l4-a': ['avant', 'apres', 'jalon'], 'l4-b': ['avant', 'apres', 'stocks'] };
const filtre = process.argv[2] || '';
const VERIF = fs.readFileSync(path.join(ICI, 'outils/verif-recouvre.js'), 'utf8');
const LOTS_GARDES = process.argv[3] === 'gardes';
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const lignes = []; let ko = 0;
for (const [v, etats] of Object.entries(LOTS)) {
  if (filtre && !v.includes(filtre)) continue; if (LOTS_GARDES && v === 'l9-a') continue;
  for (const s of etats) for (const th of ['', 'cave']) {
    const url = pathToFileURL(path.join(ICI, v, 'index.html')).href + `?s=${s}${th ? '&theme=cave' : ''}`;
    const err = []; p.removeAllListeners('pageerror'); p.on('pageerror', e => err.push(e.message));
    await p.goto(url, { waitUntil: 'load' });
    await p.waitForFunction(v === 'l4-a' ? 'document.body.dataset.ix==="1"' : 'document.body.dataset.pret==="1"', { timeout: 5000 }).catch(() => err.push('pas prêt'));
    await new Promise(r => setTimeout(r, 120));
    const m = await p.evaluate(() => {
      const vis = el => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && cs.visibility !== 'hidden' && +cs.opacity > 0.05; };
      let min = 99, minTxt = '', coupes = [];
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (w.nextNode()) { const n = w.currentNode; if (!n.nodeValue.trim()) continue; const el = n.parentElement; if (!vis(el) || el.closest('svg')) continue;
        const rg = document.createRange(); rg.selectNodeContents(n); const rr = rg.getBoundingClientRect(); if (rr.width === 0 || rr.bottom < 0 || rr.top > innerHeight) continue;
        const fs = parseFloat(getComputedStyle(el).fontSize); if (fs < min) { min = fs; minTxt = n.nodeValue.trim().slice(0, 30); }
        // coupé : sort de son ancêtre qui masque, ou ellipse
        let a = el; while (a && a !== document.body) { const cs = getComputedStyle(a); if (/(hidden|clip|auto|scroll)/.test(cs.overflowX + cs.overflow)) { const ar = a.getBoundingClientRect(); if (rr.right > ar.right + 1 || rr.left < ar.left - 1) coupes.push(n.nodeValue.trim().slice(0, 24)); break; } a = a.parentElement; }
        if (getComputedStyle(el).textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth + 1) coupes.push('…' + n.nodeValue.trim().slice(0, 24));
        if (rr.right > innerWidth + 1 || rr.left < -1) coupes.push('écran:' + n.nodeValue.trim().slice(0, 24));
      }
      const navEl = document.querySelector('.ix-nav, nav.bot'); const fabEl = document.querySelector('.ix-fab, #fab');
      const gap = navEl && fabEl ? Math.round(navEl.getBoundingClientRect().top - fabEl.getBoundingClientRect().bottom) : null;
      const fabR = fabEl ? Math.round(innerWidth - fabEl.getBoundingClientRect().right) : null;
      const t = document.body.innerText;
      return { min, minTxt, coupes: [...new Set(coupes)], gap, fabR, hx: document.documentElement.scrollWidth > innerWidth + 1, interdit: /entretien|toucher pour poser/i.test(t) || !!document.querySelector('[aria-label="Toucher pour poser"]') };
    });
    const rc = await p.evaluate(VERIF);
    const nom = `${v}-${s}${th ? '-cave' : ''}.png`;
    await p.screenshot({ path: path.join(CAP, nom) });
    const pb = []; if (m.min < 14) pb.push(`police ${m.min} (${m.minTxt})`); if (m.coupes.length) pb.push('coupé ' + m.coupes.join(' | ')); if (m.hx) pb.push('débord'); if (m.interdit) pb.push('interdit'); if (err.length) pb.push('err ' + err.join(';')); if (m.gap == null || m.gap < 4 || m.gap > 24) pb.push(`+ à ${m.gap}`); if (rc.sousPlus.length) pb.push('sous le + : ' + rc.sousPlus.join(' | ')); if (rc.tranche.length) pb.push('tranché : ' + rc.tranche.join(' | '));
    if (pb.length) ko++;
    lignes.push(`${pb.length ? 'KO' : 'ok'} ${nom} min ${m.min} · + ${m.gap} px au-dessus, ${m.fabR} px du bord${pb.length ? ' · ' + pb.join(' · ') : ''}`);
  }
}
// planches (clair et cave), une par version
for (const [v, etats] of Object.entries(LOTS)) { if (filtre && !v.includes(filtre)) continue; for (const th of ['', '-cave']) {
  const html = `<body style="margin:0;background:#888;display:flex;gap:10px;padding:10px;font:600 16px system-ui">${etats.map(s => `<figure style="margin:0"><figcaption style="color:#fff;padding:0 0 4px">${s}</figcaption><img src="${pathToFileURL(path.join(CAP, `${v}-${s}${th}.png`)).href}" style="width:390px;display:block"></figure>`).join('')}</body>`;
  const f = path.join(CAP, `_planche.html`); fs.writeFileSync(f, html);
  await p.setViewport({ width: etats.length * 400 + 10, height: 900, deviceScaleFactor: 1 });
  await p.goto(pathToFileURL(f).href, { waitUntil: 'load' }); await p.screenshot({ path: path.join(CAP, `planche-${v}${th}.png`) });
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
} }
fs.rmSync(path.join(CAP, '_planche.html'), { force: true });
await b.close();
fs.writeFileSync(path.join(CAP, `mesures${filtre ? '-' + filtre : ''}.txt`), lignes.join('\n') + '\n');
console.log(lignes.filter(l => l.startsWith('KO')).join('\n') || '(aucun KO)'); console.log(ko ? `CAP KO ${ko}` : `CAP OK ${lignes.length}`);
