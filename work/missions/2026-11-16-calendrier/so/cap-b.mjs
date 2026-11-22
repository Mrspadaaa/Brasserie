// node so/cap-b.mjs [t1b t3b s1b s4b] : captures de la passe b (×2) au repos, défilé, et un toucher ; contrôles à l'œil mécanisés :
// textes < 14 px, textes chevauchés (repos et chaque toucher), hors écran, + volant (écart aux onglets, centre dans le tiers droit,
// rien de la frise sous lui, au repos et défilé). Paysage 844×390, portrait 390×844.
import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url'; import { createRequire } from 'node:module';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const req = createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const pp = req('puppeteer-core');
const nav = await pp.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const vs = process.argv.slice(2).length ? process.argv.slice(2) : ['t1b', 't3b', 's1b', 's4b'];
const CHK = () => {
  const tabs = document.querySelector('nav, .tabbar, .tabs, [role=tablist]'), tabTop = tabs ? tabs.getBoundingClientRect().top : innerHeight, bx = [];
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
  while ((n = w.nextNode())) { const t = n.textContent.trim(); if (!t) continue; const el = n.parentElement; const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || el.closest('[hidden],[style*="display:none"],[style*="display: none"]')) continue;
    let o = 1; for (let e = el; e; e = e.parentElement) o *= +getComputedStyle(e).opacity; if (o < 0.05) continue;
    const r = document.createRange(); r.selectNodeContents(n); const b = r.getBoundingClientRect(); if (!b.height || b.bottom < 0 || b.top > tabTop - 1) continue;
    if (tabs && tabs.contains(el)) continue; bx.push({ t, x: b.left, y: b.top, w: b.width, h: b.height, fs: parseFloat(cs.fontSize) }); }
  const petits = bx.filter((b) => b.fs < 14).map((b) => b.t), chev = [];
  for (let i = 0; i < bx.length; i++) for (let j = i + 1; j < bx.length; j++) { const a = bx[i], b = bx[j]; const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y); if (ox > 1 && oy > 3) chev.push(a.t + ' / ' + b.t); }
  const hors = bx.filter((b) => b.x < -1 || b.x + b.w > innerWidth + 1).map((b) => b.t);
  const f = document.querySelector('#fab').getBoundingClientRect(), sous = [];
  document.querySelectorAll('#fb .bar, #fb .k17-p, #fb .lbl, #fb .lt, #fh .rb-c').forEach((e) => { const r = e.getBoundingClientRect(); if (!r.width || r.bottom <= 0 || r.top >= tabTop) return;
    if (r.left < f.right && f.left < r.right && r.top < f.bottom && f.top < r.bottom) sous.push((e.dataset.chose || e.className) + ''); });
  return { petits, chev, hors, fab: { ecart: Math.round(tabTop - f.bottom), tiersDroit: (f.left + f.width / 2) > innerWidth * 2 / 3, sous } };
};
for (const v of vs) {
  const pay = v.startsWith('t'), W = pay ? 844 : 390, Hh = pay ? 390 : 844;
  const p = await nav.newPage(); await p.setViewport({ width: W, height: Hh, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await p.goto(pathToFileURL(path.join(HERE, v + '.html')).href); await new Promise((r) => setTimeout(r, 700));
  const out = { repos: await p.evaluate(CHK) };
  await p.screenshot({ path: path.join(HERE, 'cap', v + '.png') });
  await p.evaluate(() => scrollTo(0, 260)); await new Promise((r) => setTimeout(r, 300));
  out.defile = await p.evaluate(CHK); const d = out.defile; out.defile = { fab: d.fab, petits: d.petits };
  await p.screenshot({ path: path.join(HERE, 'cap', v + '-defile.png') });
  await p.evaluate(() => scrollTo(0, 0)); await new Promise((r) => setTimeout(r, 200));
  // chaque mouvement touché (nom ou saut) : aucun texte chevauché, aucun hors écran
  const sel = pay ? '[data-so-mv]' : '[data-mv]';
  const ids = await p.evaluate((s) => [...new Set([...document.querySelectorAll('header.qh ' + s)].map((g) => g.dataset.soMv || g.dataset.i))], sel);
  out.toucher = {};
  for (const id of ids) {
    const el = await p.evaluateHandle((s, i) => [...document.querySelectorAll('header.qh ' + s)].filter((g) => (g.dataset.soMv || g.dataset.i) === i).pop(), sel, id);
    await p.evaluate((e) => { const r = e.getBoundingClientRect(); const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); (t && e.contains(t) ? t : e).dispatchEvent(new MouseEvent('click', { bubbles: true })); }, el);
    await new Promise((r) => setTimeout(r, 120));
    const c = await p.evaluate(CHK); const lab = await p.evaluate(() => { const t = document.querySelector('header.qh .so-on'); const b = document.querySelector('.so-bul:not([hidden]), .so-chip:not([hidden])'); return (t ? t.textContent : '—') + (b ? ' [bulle]' : ''); });
    out.toucher[id] = lab + (c.chev.length ? ' CHEV ' + c.chev.join(' ; ') : '') + (c.hors.length ? ' HORS ' + c.hors.join(' ; ') : '');
    if (id === ids[0] || id === '25') await p.screenshot({ path: path.join(HERE, 'cap', v + '-toucher' + (id === ids[0] ? '' : '-' + id) + '.png') });
    await p.evaluate(() => document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }))); await new Promise((r) => setTimeout(r, 60));
  }
  const ok = !out.repos.petits.length && !out.repos.chev.length && !out.repos.hors.length && !out.repos.fab.sous.length && !out.defile.fab.sous.length && out.repos.fab.tiersDroit && out.repos.fab.ecart >= 4 && out.repos.fab.ecart <= 24 && Object.values(out.toucher).every((t) => !/CHEV|HORS|bulle/.test(t));
  console.log(v, ok ? 'VUE OK' : 'VUE ÉCHEC', JSON.stringify(out));
  await p.close();
}
await nav.close();
