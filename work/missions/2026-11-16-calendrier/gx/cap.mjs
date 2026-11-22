// node gx/cap.mjs [filtre] : captures 390x844 DPR2 clair et cave dans gx/cap, et règles dures (police, débord, chevauchement, +).
import path from 'node:path'; import fs from 'node:fs'; import { fileURLToPath } from 'node:url'; import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer = require('puppeteer-core');
const H = path.dirname(fileURLToPath(import.meta.url)); const f = process.argv[2] || '';
const GARDE = ['c1-a', 'c1-b', 'c2-b', 'c3-a', 'c3-b', 'c4-a', 'c5-a', 'c5-b'];
const files = fs.readdirSync(H).filter((n) => /^c\d-[ab]-(avant|apres)\.html$/.test(n) && n.includes(f) && GARDE.includes(n.slice(0, 4)));
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const p = await nav.newPage();
await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
let ko = 0;
for (const n of files) for (const th of ['', 'cave']) {
  const url = 'file:///' + path.join(H, n).split(path.sep).join('/') + (th ? '#cave' : '');
  await p.goto('about:blank'); await p.goto(url); await p.waitForSelector('body[data-gx=pret]'); await new Promise((r) => setTimeout(r, 250));
  const nom = n.replace('.html', '') + (th ? '-cave' : '');
  await p.screenshot({ path: path.join(H, 'cap', nom + '.png') });
  await p.screenshot({ path: path.join(H, '..', 'page14', 'img', nom + '.webp'), type: 'webp', quality: 82 });
  const m = await p.evaluate(() => {
    const err = document.querySelector('pre'); if (err) return { err: err.textContent.slice(0, 300) };
    const T = []; let minF = 99; const petits = [];
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walk.nextNode()) {
      const t = walk.currentNode; if (!t.textContent.trim()) continue; const el = t.parentElement;
      const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      if (el.closest('[hidden],defs,script,style,title')) continue;
      const rg = document.createRange(); rg.selectNodeContents(t);
      const rs = [...rg.getClientRects()].filter((r) => r.width > 1 && r.height > 1);
      for (const r of rs) {
        if (r.bottom < 0 || r.top > 844 || r.right < 0 || r.left > 390) continue;
        let op = 1; for (let e = el; e; e = e.parentElement) op *= +getComputedStyle(e).opacity;
        const fs = parseFloat(cs.fontSize); if (fs < minF) minF = fs; if (fs < 14) petits.push(t.textContent.trim().slice(0, 20));
        const cx = Math.min(389, Math.max(0, r.left + r.width / 2)), cy = Math.min(843, Math.max(0, r.top + r.height / 2));
        const top = document.elementFromPoint(cx, cy);
        const couvert = top && !(top === el || el.contains(top) || top.contains(el)) && top.closest('.gx-card,.gx-loupe,.gx-tag,.gx-chip,.gx-etsi,.gx-step,.fab,.bot,.gx-pied');
        if (r.left < -0.5 || r.right > 390.5) T.push({ coupe: t.textContent.trim().slice(0, 24) });
        if (!couvert && op > 0.5) T.push({ t: t.textContent.trim().slice(0, 24), r: [r.left, r.top, r.right, r.bottom] });
      }
    }
    const coupes = T.filter((x) => x.coupe).map((x) => x.coupe);
    const B = T.filter((x) => x.r), chev = [];
    for (let i = 0; i < B.length; i++) for (let j = i + 1; j < B.length; j++) {
      const a = B[i].r, b = B[j].r; const ix = Math.min(a[2], b[2]) - Math.max(a[0], b[0]), iy = Math.min(a[3], b[3]) - Math.max(a[1], b[1]);
      if (ix > 2 && iy > 3 && B[i].t !== B[j].t) chev.push(B[i].t + ' / ' + B[j].t);
    }
    const fab = document.querySelector('#fab').getBoundingClientRect(), bot = document.querySelector('.bot').getBoundingClientRect();
    const over = document.documentElement.scrollWidth > 390 || [...document.querySelectorAll('body *')].some((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.top < 844 && r.bottom > 0 && (r.right > 391 || r.left < -1) && !e.closest('.cutr,.cutl,.fixe,.mo'); });
    return { minF, petits: petits.slice(0, 4), coupes, chev: [...new Set(chev)].slice(0, 6), fabGap: Math.round(bot.top - fab.bottom), fabR: Math.round(390 - fab.right), over };
  });
  const bad = m.err || m.minF < 14 || m.coupes.length || m.chev.length || m.fabGap < 4 || m.fabGap > 24 || m.over;
  if (bad) ko++;
  console.log((bad ? 'KO ' : 'ok ') + nom, JSON.stringify(m));
}
await nav.close();
console.log(ko ? `REGLES ECHEC ${ko}` : 'REGLES OK');
