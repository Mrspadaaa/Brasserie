// T4-1 : le + flottant au repos recouvre-t-il un texte (montant, nom) ? Défile chaque écran par pas, attend l'arrêt, mesure.
// node sous-le-plus.mjs <prefixe> [capture:oui]
import { createRequire } from 'node:module';
const req = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet/package.json');
const puppeteer = req('puppeteer-core');
const z = ms => new Promise(r => setTimeout(r, ms));
const PREF = process.argv[2] ?? 'x'; const CAPT = process.argv[3] === 'oui';
const BASE = 'http://localhost:5625/?dev-local&finance-demo';
const ECRANS = [['fin-synthese', 'Finances', 'Synthèse'], ['fin-operations', 'Finances', 'Opérations'], ['fin-previsions', 'Finances', 'Prévisions'], ['fin-annuel', 'Finances', 'Annuel'], ['stocks-courses', 'Stocks', 'Courses']];
const TOUS = [['m390', 390, 844, true], ['l844x340', 844, 340, true], ['d1280', 1280, 800, false]];
const CONFIGS = TOUS.filter(c => (process.env.TAILLES ?? 'm390,l844x340,d1280').split(',').includes(c[0]));
const THEMES = (process.env.THEMES ?? 'clair,cave').split(',');
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--lang=fr-CH'] });
let total = 0; const lignes = [];
for (const [nom, w, h, tact] of CONFIGS) for (const theme of THEMES) {
  const p = await nav.newPage();
  await p.setViewport({ width: w, height: h, isMobile: tact, hasTouch: tact, deviceScaleFactor: 1 });
  await p.evaluateOnNewDocument(t => { try { localStorage.setItem('laffinee.theme', t); } catch {} }, theme);
  await p.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: theme === 'cave' ? 'dark' : 'light' }]);
  await p.goto(BASE, { waitUntil: 'domcontentloaded' });
  await p.waitForSelector('.floating-actions', { timeout: 60000 }); await z(2500);
  const clic = t => p.evaluate(t => { const b = [...document.querySelectorAll('button,a,[role=tab]')].find(x => (x.getAttribute('aria-label') || x.textContent.trim()).replace(/\s+/g,' ').startsWith(t)); b?.click(); return !!b; }, t);
  const mesure = () => p.evaluate(() => {
    const f = document.querySelector('.floating-actions > button'); if (!f) return { absent: true };
    const rb = f.parentElement.getBoundingClientRect(); if (getComputedStyle(f.parentElement).display === 'none') return { cache: true };
    const hits = []; const W = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = W.nextNode(); n; n = W.nextNode()) {
      const t = n.textContent.replace(/\s+/g, ' ').trim(); if (!t) continue;
      const el = n.parentElement; if (!el || el.closest('.floating-actions') || el.closest('svg') || el.closest('script,style,noscript')) continue;
      const s = getComputedStyle(el); if (s.visibility === 'hidden' || s.display === 'none' || Number(s.opacity) === 0) continue;
      const rg = document.createRange(); rg.selectNodeContents(n);
      for (const r of rg.getClientRects()) {
        const ix = Math.min(r.right, rb.right) - Math.max(r.left, rb.left), iy = Math.min(r.bottom, rb.bottom) - Math.max(r.top, rb.top);
        if (ix > 2 && iy > 2 && r.width > 0) { const cx = Math.max(r.left, rb.left) + ix / 2, cy = Math.max(r.top, rb.top) + iy / 2; hits.push(t.slice(0, 30) + ' <' + (() => { const out = []; for (let e = el; e && out.length < 3 && e !== document.body; e = e.parentElement) { const c = (e.className + '').split(' ').filter(Boolean)[0]; if (c) out.push(e.tagName.toLowerCase() + '.' + c); } return out.join('<'); })() + '>'); }
      }
    }
    return { rect: [Math.round(rb.left), Math.round(rb.top), Math.round(rb.right), Math.round(rb.bottom)], hits: [...new Set(hits)] };
  });
  for (const [id, onglet, sous] of ECRANS) {
    await p.goto(BASE, { waitUntil: 'domcontentloaded' }); await p.waitForSelector('.floating-actions', { timeout: 60000 }); await z(2000);
    await clic(onglet); await z(2000); if (sous) { await clic(sous); await z(1800); }
    const hauteur = () => p.evaluate(() => { const m = document.querySelector('[data-page-shell] main'); const mm = m && m.scrollHeight > m.clientHeight + 4 ? m : null; return { src: mm ? 'main' : 'win', H: mm ? mm.scrollHeight : document.documentElement.scrollHeight, V: mm ? mm.clientHeight : innerHeight }; });
    const { H, V } = await hauteur(); const pas = 24; const vus = new Set(); let pos = 0, n = 0;
    while (true) {
      await p.evaluate(y => { const m = document.querySelector('[data-page-shell] main'); if (m && m.scrollHeight > m.clientHeight + 4) m.scrollTop = y; else window.scrollTo(0, y); }, pos);
      await z(45);
      const m = await mesure();
      if (m.hits) for (const t of m.hits) vus.add(t);
      if (CAPT && m.hits?.length && n < 3) { await p.screenshot({ path: `${PREF}-${id}-${nom}-${theme}-y${pos}.png` }); n++; }
      if (pos >= H - V) break; pos += pas;
    }
    total += vus.size; lignes.push(`${nom} ${theme} ${id} H=${H} V=${V} : ${vus.size ? 'KO ' + [...vus].join(' | ') : 'ok'}`);
    if (CAPT) { await p.evaluate(() => { const m = document.querySelector('[data-page-shell] main'); if (m) m.scrollTop = 0; window.scrollTo(0, 0); }); await z(900); await p.screenshot({ path: `${PREF}-${id}-${nom}-${theme}-haut.png` }); }
  }
  await p.close();
}
await nav.close();
console.log(lignes.join('\n')); console.log(`TOTAL recouvrements : ${total}`);
