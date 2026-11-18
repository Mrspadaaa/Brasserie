// Joue chaque geste des cinq protos au doigt (390 × 844 tactile), contrôle et capture.
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
const require = createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer = require('puppeteer-core');

const J = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CAP = path.join(J, 'captures');
fs.mkdirSync(CAP, { recursive: true });
const url = (rel, q = '') => pathToFileURL(path.join(J, rel)).href + q;
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

const MESURE = () => {
  const vw = innerWidth, out = { petits: [], coupes: [], debord: document.documentElement.scrollWidth > vw + 1, repos: [], fin: [], exemple: /exemple/.test(document.body.innerText) };
  const vis = (el) => { const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const fixe = (el) => { for (let e = el; e && e !== document.body; e = e.parentElement) { const p = getComputedStyle(e).position; if (p === 'fixed' || p === 'sticky') return true; } return false; };
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const textes = new Set();
  while (w.nextNode()) { const n = w.currentNode; if (!n.textContent.trim()) continue; const el = n.parentElement; if (!el || el.closest('script,style,svg') || !vis(el)) continue; textes.add(el); const fs = parseFloat(getComputedStyle(el).fontSize); if (fs < 14) out.petits.push(fs + 'px « ' + n.textContent.trim().slice(0, 30) + ' »'); }
  for (const el of document.querySelectorAll('body *')) { if (!vis(el)) continue; const cs = getComputedStyle(el); if ((cs.textOverflow === 'ellipsis' || cs.overflow === 'hidden' || cs.overflowX === 'hidden') && el.scrollWidth > el.clientWidth + 1 && el.innerText && el.innerText.trim() && !el.matches('.bar')) out.coupes.push((el.className || el.tagName) + ' « ' + el.innerText.trim().slice(0, 40) + ' »'); }
  for (const el of document.querySelectorAll('body *')) { if (!vis(el)) continue; const cs = getComputedStyle(el); if (/auto|scroll/.test(cs.overflowX) && el.scrollWidth > el.clientWidth + 1 && !fixe(el)) out.coupes.push('défile ' + (el.className || el.tagName)); }
  const fab = [...document.querySelectorAll('.fab,#fab,.s-fab')].find(vis);
  const sous = () => { if (!fab) return []; const f = fab.getBoundingClientRect(), r = []; const cand = new Set([...textes, ...document.querySelectorAll('button,.bar,.v1f,.p1-dot,i.dot')]); for (const el of cand) { if (!vis(el) || fixe(el) || el.contains(fab)) continue; const b = el.getBoundingClientRect(); if (b.right > f.left && b.left < f.right && b.bottom > f.top && b.top < f.bottom && b.bottom > 0 && b.top < innerHeight) r.push((el.className || el.tagName) + ' « ' + (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 30) + ' »'); } return r; };
  const sousVu = () => { if (!fab) return []; const f = fab.getBoundingClientRect(), r = new Set(); const v = fab.style.visibility; fab.style.visibility = 'hidden'; const dk = document.querySelector('.jx-dock'); if (dk) dk.style.pointerEvents = 'auto'; for (let x = f.left + 3; x < f.right - 2; x += 8) for (let yy = f.top + 3; yy < f.bottom - 2; yy += 8) { const e = document.elementFromPoint(x, yy); if (e && !e.closest('.jx-dock') && !fixe(e) && e !== document.body && e !== document.documentElement) r.add((e.className && e.className.baseVal === undefined ? e.className : e.tagName) + ' « ' + (e.innerText || '').trim().slice(0, 24) + ' »'); } fab.style.visibility = v; if (dk) dk.style.pointerEvents = ''; return [...r]; };
  out.repos = sousVu();
  const y = scrollY; scrollTo(0, document.documentElement.scrollHeight); out.fin = sousVu(); out.finGeo = sous().length; scrollTo(0, y);
  out.fab = !!fab;
  return out;
};

const SC = {
  onglet: [
    ['ouvre', '', 'repos'],
    ['tap', '[data-go="cal"]', 'cal', () => document.querySelector('h1').textContent === 'Calendrier'],
    ['tap', '[data-w="2"]', 'semaine', () => document.querySelector('.wpanel .hd').textContent.includes('S49')],
    ['tap', '#fab', 'plus', () => !!document.querySelector('.sheet') && document.querySelector('.sheet').textContent.includes('S49')],
    ['tap', '[data-a^="Poser un brassin"]', 'pose', () => [...document.querySelectorAll('.bar')].some((b) => b.getAttribute('aria-label') === 'Nouveau brassin' || b.textContent.includes('Nouveau brassin'))],
    ['tap', '[data-ev="0"]', null, () => !document.getElementById('toast').hidden],
    ['tap', '.wpanel .hd button', null, () => document.querySelector('.wpanel .hd').textContent.includes('Cette semaine')],
    ['tap', '[data-tab="fin"]', 'finances', () => document.querySelector('h1').textContent === 'Finances'],
    ['tap', '[data-tab="bord"]', null, () => document.querySelector('h1').textContent === 'Bord'],
    ['tap', '[data-t="0"]', null, () => document.querySelector('[data-t="0"]').classList.contains('done')],
    ['tap', '[data-act="vide"]', 'vide', () => document.body.innerText.includes('Rien à faire')],
    ['tap', '.jx-th', 'cave', () => (document.documentElement.dataset.theme === 'cave') === (document.querySelector('.jx-th').textContent === 'Clair')],
    ['tap', '[data-tab="cal"]', 'cal-cave', () => true],
  ],
  fournisseur: [
    ['ouvre', '', 'repos'],
    ['tap', '[data-d="4"]', null, () => document.querySelector('.p1-dcap').textContent.includes('9 j')],
    ['tap', '[data-a="0"]', 'prix', () => !!document.querySelector('.p1-hist')],
    ['tap', '[data-x="fus"]', 'reunir', () => !document.getElementById('s-sheet').hidden],
    ['tap', '.p1-nm[data-n="brouwland.com"]', null, () => document.querySelector('[data-y=oui]').textContent.includes('3')],
    ['tap', '.p1-nm[data-n="brouwland.com"]', null, () => document.querySelector('[data-y=oui]').textContent.includes('4')],
    ['tap', '[data-y=oui]', 'apres', () => !!document.querySelector('.p1-okb') && document.getElementById('s-toast').hidden],
    ['tap', '[data-x="annul"]', null, () => !!document.querySelector('.p1-fus')],
    ['tap', '[data-x="fus"]', null, () => !document.getElementById('s-sheet').hidden],
    ['glisse', '#s-sheet', null, () => document.getElementById('s-sheet').hidden],
    ['tap', '[data-x="fac"]', null, () => document.querySelectorAll('.p1-hr').length > 3],
    ['tap', '#s-fab', 'plus', () => !document.getElementById('s-vol').hidden],
    ['tap', '#s-dim', null, () => document.getElementById('s-vol').hidden],
    ['tap', '.s-back', 'liste', () => document.querySelector('.p1-lh') && document.querySelector('.p1-lh').textContent === 'Fournisseurs'],
    ['tap', '[data-fo="lac"]', 'vide', () => document.body.innerText.includes('Malterie du Lac') && !!document.querySelector('[data-r]')],
    ['tap', '[data-r="livre vite"]', null, () => !document.querySelector('[data-x="garder"]').disabled],
    ['tap', '.s-back', null, () => !!document.querySelector('.p1-lh')],
    ['tap', '[data-fo="brouwland"]', null, () => document.querySelector('h1').textContent === 'Brouwland'],
  ],
  suppression: [
    ['ouvre', '', 'repos'],
    ['tap', '[data-del="F-07"]', 'refus', () => document.querySelector('.v2-cnt .num').textContent === '3'],
    ['tap', '#sh [data-f="0"]', 'regle', () => document.querySelector('.v2-cnt .num').textContent === '2'],
    ['tap', '#sh [data-f="1"]', 'mouvement', () => document.querySelector('.jm-h') && document.querySelector('[data-jm=ok]').disabled],
    ['tap', '#sh [data-jm="ret"]', null, () => !document.querySelector('.jm-h') && document.querySelector('.v2-cnt .num').textContent === '2'],
    ['tap', '#sh [data-f="1"]', null, () => !!document.querySelector('.jm-h')],
    ['tap', '#sh [data-mo="Vendus"]', 'mouvement-motif', () => !document.querySelector('[data-jm=ok]').disabled],
    ['tap', '#sh [data-jm="ok"]', null, () => document.querySelector('.v2-cnt .num').textContent === '1'],
    ['tap', '#sh [data-f="2"]', 'libre', () => document.querySelector('.v2-cnt .num').textContent === '0' && !document.querySelector('[data-delok]').disabled],
    ['tap', '#sh [data-delok]', 'supprime', () => !document.querySelector('[data-del="F-07"]') && !document.getElementById('toast').hidden],
    ['tap', '#toast button', null, () => !!document.querySelector('[data-del="F-07"]')],
    ['tap', '[data-k="brassin"]', null, () => document.getElementById('ttl').textContent === 'Brassins'],
    ['tap', '[data-del="L-014"]', 'refus-brassin', () => !!document.querySelector('[data-archive]')],
    ['glisse', '#sh', null, () => !document.getElementById('sh').classList.contains('on')],
    ['tap', '[data-del="L-014"]', null, () => document.getElementById('sh').classList.contains('on')],
    ['tap', '#sh [data-archive]', 'archive', () => !!document.querySelector('[data-ress="L-014"]')],
    ['tap', '[data-ress="L-014"]', null, () => !!document.querySelector('[data-del="L-014"]')],
    ['tap', '[data-k="client"]', 'clients', () => document.body.innerText.includes('chez Café du Pont') || document.body.innerText.includes('Café du Pont')],
    ['tap', '#fab', null, () => !document.getElementById('toast').hidden],
  ],
  lot: [
    ['ouvre', '', 'repos'],
    ['tap', '[data-client="pont"] .v1row', 'branche', () => !!document.querySelector('[data-tel]')],
    ['tap', '[data-tel]', 'appeler', () => document.getElementById('jx-toast') && !document.getElementById('jx-toast').hidden],
    ['tap', '[data-fab]', 'plus', () => !document.querySelector('[data-dial]').hidden && !document.querySelector('[data-dial]').textContent.includes('densité')],
    ['tap', '[data-dial-action="livrer"]', 'livrer', () => !document.querySelector('[data-jxs]').hidden],
    ['tap', '[data-liv="tilleul"]', 'livre', () => document.querySelector('[data-client="tilleul"]').classList.contains('ouv') && document.querySelectorAll('[data-client="tilleul"] .v1f').length === 2],
    ['tap', '#jx-toast button', null, () => document.querySelectorAll('[data-client="tilleul"] .v1f').length === 1],
    ['tap', '[data-fab]', null, () => !document.querySelector('[data-dial]').hidden],
    ['tap', '[data-dial-action="rentrer"]', 'rentrer', () => !document.querySelector('[data-jxs]').hidden],
    ['tap', '[data-ren="0"]', null, () => document.querySelector('[data-jxs]').hidden],
    ['tap', '[data-fab]', null, () => true],
    ['tap', '[data-dial-action="livrer"]', null, () => !document.querySelector('[data-jxs]').hidden],
    ['glisse', '[data-jxs]', null, () => document.querySelector('[data-jxs]').hidden],
    ['tap', '[data-lot="42"]', 'vide', () => !!document.querySelector('[data-vide]')],
    ['tap', '[data-jxret]', 'liste', () => document.body.classList.contains('jx-liste')],
    ['tap', '[data-jxlot="41"]', null, () => !document.body.classList.contains('jx-liste') && document.querySelector('[data-titre]').textContent.includes('Blonde')],
  ],
  pastille: [
    ['ouvre', '', 'repos'],
    ['tap', '[data-h="52"]', 'six', () => document.getElementById('big').textContent === '11' && document.getElementById('pas').textContent === '11'],
    ['tap', '[data-h="99"]', 'tout', () => document.getElementById('big').textContent === '24' && document.getElementById('pas').textContent === '24'],
    ['tap', '#v3l .row', null, () => !document.getElementById('jx-toast').hidden],
    ['tap', '.fab', 'plus', () => !document.querySelector('[data-jxd]').hidden],
    ['tap', '[data-jxv]', null, () => document.querySelector('[data-jxd]').hidden],
    ['tap', '[data-h="49"]', null, () => document.getElementById('big').textContent === '5'],
    ['tap', '#demo', 'vide', () => !document.getElementById('vide').hidden],
    ['tap', '#demo', null, () => document.getElementById('vide').hidden],
  ],
};

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--allow-file-access-from-files'] });
const bilan = [];
const externes = new Set();
async function glisse(page, sel) {
  const r = await page.$eval(sel, (e) => { const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + 20 }; });
  const s = await page.target().createCDPSession();
  const pt = (y) => [{ x: r.x, y }];
  await s.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(r.y) });
  for (let k = 1; k <= 6; k++) { await s.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(r.y + k * 25) }); await pause(16); }
  await s.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
for (const theme of ['', '?theme=cave']) {
  for (const [sujet, pas] of Object.entries(SC)) {
    const page = await browser.newPage();
    await page.emulate({ viewport: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, userAgent: 'Mozilla/5.0 (Linux; Android 14) Mobile' });
    const err = [];
    page.on('pageerror', (e) => err.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') err.push(m.text()); });
    page.on('request', (q) => { const u = q.url(); if (!u.startsWith('file:') && !u.startsWith('data:') && !/fonts\.(googleapis|gstatic)\.com/.test(u)) externes.add(u); });
    await page.goto(url(sujet + '/index.html', theme), { waitUntil: 'load' });
    await pause(300);
    for (const [act, sel, cap, ok] of pas) {
      let res = 'ok';
      try {
        if (act === 'tap') { await page.waitForSelector(sel, { visible: true, timeout: 2000 }); await page.$eval(sel, (e) => e.scrollIntoView({ block: 'center' })); await pause(80); await page.tap(sel); }
        if (act === 'glisse') await glisse(page, sel);
        await pause(350);
        if (ok && !(await page.evaluate(ok))) res = 'ÉCHEC';
      } catch (e) { res = 'ERREUR ' + e.message.slice(0, 80); }
      if (cap) {
        await page.evaluate(() => scrollTo(0, 0)); await pause(60);
        const m = await page.evaluate(MESURE);
        const nom = `${sujet}-${cap}${theme ? '-cave' : ''}.png`;
        await page.screenshot({ path: path.join(CAP, nom) });
        bilan.push({ sujet, theme: theme ? 'cave' : 'clair', pas: cap, geste: `${act} ${sel}`, res, petits: m.petits.length ? m.petits.slice(0, 3) : 0, coupes: m.coupes.length ? m.coupes.slice(0, 3) : 0, debord: m.debord, exemple: m.exemple, sousFabRepos: m.repos.length ? m.repos.slice(0, 4) : 0, sousFabFin: m.fin.length ? m.fin.slice(0, 4) : 0, finGeo: m.finGeo });
      } else bilan.push({ sujet, theme: theme ? 'cave' : 'clair', geste: `${act} ${sel}`, res });
    }
    if (err.length) bilan.push({ sujet, erreurs: err.slice(0, 3) });
    await page.close();
  }
}
// porte : chaque tuile ouvre son proto, chaque proto revient à la porte
{
  const page = await browser.newPage();
  await page.emulate({ viewport: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, userAgent: 'Mozilla/5.0 (Linux; Android 14) Mobile' });
  await page.goto(url('index.html'), { waitUntil: 'load' });
  const m = await page.evaluate(MESURE);
  await page.screenshot({ path: path.join(CAP, 'porte.png') });
  bilan.push({ sujet: 'porte', petits: m.petits.length, coupes: m.coupes, debord: m.debord, exemple: m.exemple });
  for (const h of ['onglet', 'fournisseur', 'suppression', 'lot', 'pastille']) {
    await page.goto(url('index.html'), { waitUntil: 'load' });
    await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), page.tap(`[data-h="${h}/index.html"]`)]);
    const ici = page.url().includes(`/${h}/index.html`);
    await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), page.tap('.jx-ret')]);
    bilan.push({ porte: h, ouvre: ici, retour: /jouable\/index\.html/.test(page.url()) });
  }
  await page.tap('#th'); await page.screenshot({ path: path.join(CAP, 'porte-cave.png') });
  await page.close();
}
await browser.close();
for (const b of bilan) console.log(JSON.stringify(b));
console.log('EXTERNES', [...externes]);
