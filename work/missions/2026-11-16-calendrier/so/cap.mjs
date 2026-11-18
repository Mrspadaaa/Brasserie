// node so/cap.mjs [t1 t2 t3] : captures 844×390 (×2) au repos, défilé, et nom touché ; vérifie textes coupés/chevauchés de l'en-tête
import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url'; import { createRequire } from 'node:module';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const req = createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const pp = req('puppeteer-core');
const nav = await pp.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const vs = process.argv.slice(2).length ? process.argv.slice(2) : ['t1', 't2', 't3'];
for (const v of vs) {
  const p = await nav.newPage(); await p.setViewport({ width: 844, height: 390, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await p.goto(pathToFileURL(path.join(HERE, v + '.html')).href); await new Promise((r) => setTimeout(r, 600));
  const chk = await p.evaluate(() => {
    const fb = document.querySelector('#fb').getBoundingClientRect().top, bx = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
    while ((n = w.nextNode())) { const t = n.textContent.trim(); if (!t) continue; const r = document.createRange(); r.selectNodeContents(n); const b = r.getBoundingClientRect(); if (!b.height || b.bottom < 0 || b.top > innerHeight) continue;
      const fs = parseFloat(getComputedStyle(n.parentElement).fontSize); bx.push({ t, x: b.left, y: b.top, w: b.width, h: b.height, fs }); }
    const petits = bx.filter((b) => b.fs < 14).map((b) => b.t); let chev = [];
    for (let i = 0; i < bx.length; i++) for (let j = i + 1; j < bx.length; j++) { const a = bx[i], b = bx[j]; const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y); if (ox > 1 && oy > 3) chev.push(a.t + ' / ' + b.t); }
    const hors = bx.filter((b) => b.x < -1 || b.x + b.w > innerWidth + 1).map((b) => b.t);
    const fab = document.querySelector('#fab').getBoundingClientRect(), tab = document.querySelector('nav, .tabbar, .tabs, [role=tablist]');
    const lanes = [...document.querySelectorAll('#fb .lane')].map((l) => l.dataset.voie + ':' + Math.round(l.getBoundingClientRect().height));
    return { fb: Math.round(fb), petits, chev: chev.slice(0, 12), hors, fab: tab ? Math.round(tab.getBoundingClientRect().top - fab.bottom) : 'onglets ?', lanes };
  });
  console.log(v, JSON.stringify(chk));
  await p.screenshot({ path: path.join(HERE, 'cap', v + '.png') });
  await p.evaluate(() => scrollTo(0, 260)); await new Promise((r) => setTimeout(r, 300));
  await p.screenshot({ path: path.join(HERE, 'cap', v + '-defile.png') });
  await p.evaluate(() => scrollTo(0, 0)); await new Promise((r) => setTimeout(r, 200));
  const g = await p.$('.so-mv text'); if (g) { await g.click(); await new Promise((r) => setTimeout(r, 200)); await p.screenshot({ path: path.join(HERE, 'cap', v + '-toucher.png') }); }
  await p.close();
}
await nav.close();
