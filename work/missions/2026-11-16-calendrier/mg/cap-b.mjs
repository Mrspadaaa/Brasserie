// node mg/cap-b.mjs [g2b g3b g4b] : captures de la passe 2 et contrôles.
// Par version : repos 390×844 ; passage en trois temps (toucher sur la base r6b → pendant → arrivé) ; paysage 844×390 ;
// retour en paysage (toucher dans le mode graph → base r6b). g3b : en plus, 6 mois.
import { createRequire } from 'node:module'; import path from 'node:path'; import fs from 'node:fs'; import { fileURLToPath, pathToFileURL } from 'node:url';
import { CSSB, SEL } from './build-b.mjs';
const require = createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer = require('puppeteer-core');
const HERE = path.dirname(fileURLToPath(import.meta.url)); const CAP = path.join(HERE, 'cap'); fs.mkdirSync(CAP, { recursive: true });
const IDS = process.argv.slice(2).length ? process.argv.slice(2) : ['g2b', 'g3b', 'g4b'];
const BASE = pathToFileURL(path.join(HERE, '..', 'en2', 'r6b.html')).href;
const CSSP = `.mgfg{position:fixed;width:46px;height:46px;border-radius:50%;background:rgba(17,17,17,.30);border:3px solid #fff;box-shadow:0 0 0 2px rgba(17,17,17,.55),0 4px 12px rgba(0,0,0,.3);z-index:9999;pointer-events:none}
.mgbu{position:fixed;z-index:9999;background:#111;color:#fff;font:700 15px "Segoe UI",system-ui,sans-serif;padding:5px 10px;border-radius:14px;white-space:nowrap}`;
/* préparation de la base : même période que le mode graph ; g2b/g3b : la ligne du sélecteur glissée sous la rangée d'en-tête (rien couvert) */
const PREP = { g2b: { per: '6 mois', sel: true, cible: '.mgsel button' }, g3b: { per: null, sel: true, cible: '.mgsel button' }, g4b: { per: '6 mois', sel: false, cible: '.q-pil.nu' } };
const RETOUR = { g2b: '.seg button', g3b: '.seg button', g4b: '.q-pil.nu' };
async function prepBase(p, id) {
  const o = PREP[id];
  await p.evaluate((o, css, sel) => {
    const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
    if (o.per) { const b = document.querySelector('.q-per'); b.firstChild.textContent = o.per; b.setAttribute('aria-label', 'Période : ' + o.per); const br = document.querySelector('.q-brosse'); if (br) br.style.width = (parseFloat(br.style.width) / 6 * 26) + 'px'; }
    if (o.sel) {
      const main = document.querySelector('main'), sp = document.createElement('div'); sp.style.cssText = 'height:32px;position:relative'; main.prepend(sp);
      document.querySelectorAll('.q5-t').forEach((q) => { if (q.getBoundingClientRect().width) q.style.top = (parseFloat(getComputedStyle(q).top) - 32) + 'px'; });
      const d = document.createElement('div'); d.className = 'mgsel'; d.innerHTML = sel.replace('class="sel"', 'class="sel" style="position:fixed"').split('aria-pressed="false"').join('aria-pressed="X"').split('aria-pressed="true"').join('aria-pressed="false"').split('aria-pressed="X"').join('aria-pressed="true"'); document.body.appendChild(d);
    }
  }, o, CSSB.split('\n').filter((l) => /^\.(sel|seg)/.test(l)).join('\n') + CSSP, SEL);
  await new Promise((r) => setTimeout(r, 150));
}
async function doigt(p, sel, bulle, cote) {
  await p.evaluate((sel, bulle, cote) => {
    const e = document.querySelector(sel); const r = e.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    const f = document.createElement('div'); f.className = 'mgfg'; f.style.left = (x - 23) + 'px'; f.style.top = (y - 23) + 'px'; document.body.appendChild(f);
    const b = document.createElement('div'); b.className = 'mgbu'; b.textContent = bulle; document.body.appendChild(b);
    const bw = b.offsetWidth; b.style.left = Math.max(6, Math.min(innerWidth - bw - 6, x - bw / 2)) + 'px'; b.style.top = (cote === 'haut' ? y - 62 : y + 30) + 'px'; if (cote === 'libre') { /* paysage : dans le vide entre la légende et le +, flèche vers le doigt */ const lg = document.querySelector('.leg').getBoundingClientRect(), fb = document.querySelector('.fab').getBoundingClientRect(), fin = [...document.querySelectorAll('.fin2')].reduce((m, e) => Math.max(m, e.getBoundingClientRect().bottom), lg.bottom); b.textContent = bulle + ' →'; const bw2 = b.offsetWidth; const dl = document.querySelector('.q5-t .d').getBoundingClientRect().left; b.style.left = (Math.min(r.left, dl) - bw2 - 10) + 'px'; b.style.top = (y - b.offsetHeight / 2) + 'px'; }
  }, sel, bulle, cote);
}
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--allow-file-access-from-files'] });
async function ouvre(url, w, h) { const p = await browser.newPage(); await p.setViewport({ width: w, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); const errs = []; p.on('pageerror', (e) => errs.push(e.message)); await p.goto(url, { waitUntil: 'load', timeout: 120000 }); await new Promise((r) => setTimeout(r, 300)); p.errs = errs; return p; }
const FAB = { 390: [295, 728, 44, 44], 844: [673, 274, 44, 44] };
async function controle(p, id, vue) {
  return p.evaluate((id, vue, FAB) => {
    const W = innerWidth, H = innerHeight, g = window.__mg, err = [];
    const nav = document.querySelector('.bot').getBoundingClientRect(), fab = document.querySelector('.fab').getBoundingClientRect();
    const gap = nav.top - fab.bottom; if (gap < 4 || gap > 24) err.push('fab-gap ' + gap.toFixed(0));
    const fb = FAB[W]; if ([fab.left, fab.top, fab.width, fab.height].some((v, i) => Math.abs(v - fb[i]) > 1)) err.push('fab ailleurs que dans r6b ' + [fab.left, fab.top, fab.width, fab.height].map(Math.round));
    const textes = [];
    document.querySelectorAll('svg text, .q5-n b, .q5-n span, .q5-n em, .q-per, .q-pil, .seg button, .fin2, .ch, .cle, .bot a span, .badge, .fab span').forEach((e) => {
      const fs = parseFloat(getComputedStyle(e).fontSize); const r = e.getBoundingClientRect(); if (!r.width) return;
      if (fs < 13.99) err.push('petit ' + fs + ' ' + (e.textContent || '').slice(0, 20));
      if (r.left < -.5 || r.right > W + .5 || r.top < -.5 || r.bottom > H + .5) err.push('hors ' + (e.textContent || '').slice(0, 20));
      if (e.tagName !== 'text' && e.clientWidth && e.scrollWidth > e.clientWidth + 1) err.push('coupe ' + (e.textContent || '').slice(0, 20));
      textes.push({ t: (e.textContent || '').slice(0, 24), r, lab: e.matches('text.lab'), svg: e.tagName === 'text', html: e.tagName !== 'text' && !e.closest('.bot') && !e.closest('.fab') });
    });
    const X = (a, b, p = 0) => a.left < b.right - p && b.left < a.right - p && a.top < b.bottom - p && b.top < a.bottom - p;
    const labs = textes.filter((t) => t.lab), autres = textes.filter((t) => t.svg && !t.lab), html = textes.filter((t) => t.html);
    for (let i = 0; i < labs.length; i++) { for (let j = i + 1; j < labs.length; j++) if (X(labs[i].r, labs[j].r, 1)) err.push('chevauche ' + labs[i].t + ' / ' + labs[j].t); autres.forEach((o) => { if (X(labs[i].r, o.r, 1)) err.push('chevauche ' + labs[i].t + ' / ' + o.t); }); }
    /* textes html entre eux et contre les textes du graphe */
    for (let i = 0; i < html.length; i++) { for (let j = i + 1; j < html.length; j++) if (!html[i].r.width || X(html[i].r, html[j].r, 1) && !(html[i].r.left <= html[j].r.left && html[i].r.right >= html[j].r.right) && !(html[j].r.left <= html[i].r.left && html[j].r.right >= html[i].r.right)) err.push('html chevauche ' + html[i].t + ' / ' + html[j].t); textes.filter((t) => t.svg).forEach((o) => { if (X(html[i].r, o.r, 1)) err.push('html sur graphe ' + html[i].t + ' / ' + o.t); }); }
    /* un trait de renvoi ne traverse aucun texte d'étiquette */
    const liens = [...document.querySelectorAll('line.lien')].map((l) => l.getBoundingClientRect());
    liens.forEach((l) => labs.forEach((t) => { if (X(l, t.r, 2) && !(l.width < 3 && (Math.abs(l.top - t.r.bottom) < 3 || Math.abs(l.bottom - t.r.top) < 3))) err.push('lien traverse ' + t.t); }));
    document.querySelectorAll('svg text, .leg, .fin2, #plot, #band, .sel, .q5-t').forEach((e) => { const r = e.getBoundingClientRect(); if (r.width && X(r, fab, 0)) err.push('fab couvre ' + (e.id || (e.className && e.className.baseVal) || e.className || e.textContent).toString().slice(0, 20)); });
    const part = g.courbe.height / g.U; if (part < .55) err.push('courbe ' + Math.round(part * 100) + '%');
    const bande = g.bande.height; if (bande > 40.5) err.push('bande ' + bande);
    if (g.caches && g.caches.length) err.push('cachées ' + g.caches.join(', '));
    if (!g.hon.ok) err.push('sommes ' + JSON.stringify(g.hon.bad));
    const per = (document.querySelector('.q-per') || {}).textContent;
    return { id, vue, part: Math.round(part * 100), bande: Math.round(bande), per, labs: labs.length + ' étiquettes, liens croisés ' + (g.croisements || 0), err };
  }, id, vue, FAB);
}
async function compose(fichier, panneaux, w, h) {
  const p = await browser.newPage(); const gap = 44, tw = panneaux.length * w + (panneaux.length - 1) * gap + 24, th = h + 44;
  await p.setViewport({ width: tw, height: th, deviceScaleFactor: 2 });
  const html = `<body style="margin:0;background:#e9e9e9;font:700 16px 'Segoe UI',system-ui,sans-serif;color:#111"><div style="display:flex;gap:${gap}px;padding:6px 12px">${panneaux.map((q, i) => `<div style="width:${w}px;position:relative"><div style="height:30px;line-height:30px">${q.t}</div><img src="data:image/png;base64,${q.b.toString('base64')}" style="width:${w}px;height:${h}px;display:block;box-shadow:0 0 0 1px #bbb">${i < panneaux.length - 1 ? `<div style="position:absolute;right:-38px;top:${30 + h / 2 - 16}px;font-size:30px">→</div>` : ''}</div>`).join('')}</div></body>`;
  await p.setContent(html, { waitUntil: 'load' }); await p.screenshot({ path: path.join(CAP, fichier) }); await p.close();
}
const bilan = [];
for (const id of IDS) {
  const url = pathToFileURL(path.join(HERE, id + '.html')).href;
  const vues = [['repos', 390, 844, ''], ['paysage', 844, 390, '']]; if (id === 'g3b') vues.push(['6mois', 390, 844, '?p=26']);
  const shots = {};
  for (const [vue, w, h, q] of vues) {
    const p = await ouvre(url + q, w, h); let c;
    try { c = await controle(p, id, vue); } catch (e) { c = { id, vue, part: 0, bande: 0, labs: 0, err: ['controle ' + e.message.slice(0, 160)] }; }
    c.err.push(...p.errs.map((e) => 'js ' + e)); bilan.push(c);
    shots[vue] = await p.screenshot({ path: path.join(CAP, `${id}${vue === 'repos' ? '' : '-' + vue}.png`) });
    if (vue === 'paysage') { await p.addStyleTag({ content: CSSP }); await doigt(p, RETOUR[id], id === 'g4b' ? 'toucher ⛶ : retour à la frise' : 'toucher « Frise »', 'libre'); shots.retour = await p.screenshot(); }
    await p.close();
  }
  /* 1 · la base r6b, même période, le doigt sur la bascule */
  let p = await ouvre(BASE, 390, 844); await prepBase(p, id); const propre = await p.screenshot();
  await doigt(p, PREP[id].cible === '.mgsel button' ? '.mgsel button:last-child' : PREP[id].cible, id === 'g4b' ? 'toucher ⛶' : 'toucher « Courbe »', 'bas'); const t1 = await p.screenshot(); await p.close();
  /* 2 · pendant : la courbe se déplie vers le bas, les rangées de la frise se tassent dans la bande */
  p = await ouvre(url, 390, 844);
  await p.evaluate((img) => {
    const pl = document.getElementById('plot').getBoundingClientRect(), bd = document.getElementById('band').getBoundingClientRect();
    const coupe = pl.top + pl.height * .5; document.getElementById('plot').style.clipPath = `inset(0 0 ${pl.height * .5}px 0)`;
    document.querySelectorAll('#band, #leg, .fin2:not(#fin)').forEach((e) => { e.style.opacity = '.25'; });
    const d = document.createElement('div'); const haut = 220, src = 788 - haut; /* rangées de la base, dès la rangée Brassins */
    d.style.cssText = `position:fixed;left:0;width:390px;top:${coupe + 6}px;height:${bd.top - coupe - 8}px;overflow:hidden;z-index:5`;
    d.innerHTML = `<div style="width:390px;height:${788 - 190}px;background:url(data:image/png;base64,${img}) 0 -190px/390px 844px no-repeat;transform-origin:top;transform:scaleY(${(bd.top - coupe - 8) / (788 - 190)});opacity:.6"></div>`;
    document.body.appendChild(d);
    const a = document.createElement('div'); a.style.cssText = `position:fixed;left:0;right:0;top:${coupe - 2}px;height:4px;background:linear-gradient(90deg,transparent,#111 20%,#111 80%,transparent);opacity:.35;z-index:6`; document.body.appendChild(a);
  }, propre.toString('base64'));
  const t2 = await p.screenshot(); await p.close();
  await compose(`${id}-passage.png`, [{ t: '1 · toucher (mode actuel)', b: t1 }, { t: '2 · pendant (0,2 s)', b: t2 }, { t: '3 · arrivé : mode graph', b: shots.repos }], 390, 844);
  /* retour en paysage : toucher dans le mode graph → la base r6b en paysage */
  p = await ouvre(BASE, 844, 390); await prepBase(p, id); const arr = await p.screenshot(); await p.close();
  await compose(`${id}-paysage-retour.png`, [{ t: '1 · toucher (mode graph, paysage)', b: shots.retour }, { t: '2 · arrivé : la frise, même période', b: arr }], 844, 390);
}
await browser.close();
let ok = true;
for (const c of bilan) { if (c.err.length) ok = false; console.log(`${c.id} ${c.vue} [${c.per}] courbe ${c.part}% bande ${c.bande}px ${c.labs} ${c.err.length ? 'ERREURS ' + [...new Set(c.err)].slice(0, 10).join(' | ') : 'ok'}`); }
console.log(ok ? 'MG-B OK' : 'MG-B ECHEC');
