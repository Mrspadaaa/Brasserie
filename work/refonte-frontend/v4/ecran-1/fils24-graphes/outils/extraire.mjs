// Fige les graphes de ses écrans choisis, rendus (maquette jouable du 24.10, reprises r2 à r5) : le DOM rendu de
// chaque graphe, dans l'état voulu, et le texte de la légende de l'écran. Lecture seule de prototypes/.
// Usage : node extraire.mjs   → extraits/<gr>.html, extraits/<gr>.json, extraits/sprite.svg
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';
const ici = path.dirname(fileURLToPath(import.meta.url));
const M = path.resolve(ici, '../../../../../../prototypes/houblons-v4/maquettes');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const LCA = `window.__lca=(a,b)=>{let x=a;while(x&&!x.contains(b))x=x.parentElement;return x;};`;
const JOBS = {
  gr1: { page: 'parcours-biere/biere/etat.html', zone: `__lca(document.querySelector('[data-role=alerte]'),[...document.querySelectorAll('[data-barre]')].pop())` },
  gr2: { page: 'parcours-biere/biere/etat.html', geste: async (p) => { await p.click('[data-e=absolu]'); }, zone: `__lca(document.querySelector('[data-role=alerte]'),[...document.querySelectorAll('[data-barre]')].pop())` },
  gr3: { page: 'parcours-biere/biere/etat.html', geste: async (p) => { await p.evaluate(() => [...document.querySelectorAll('[data-lecture] button')].find((e) => e.textContent.trim() === 'Radar').click()); }, zone: `__lca(document.querySelector('[data-role=alerte]'),[...document.querySelectorAll('[data-role^=pont-objectif]')].pop())` },
  gr4: { page: 'parcours-fiche/fiche/etat.html', geste: async (p) => { const h = await p.$('[data-role=ouvrir-fiche]'); const r = await h.boundingBox(); const t = await p.touchscreen.touchStart(r.x + 10, r.y + 8); await wait(700); await t.end(); }, zone: `(()=>{const f=[...document.querySelectorAll('[role=dialog]')].pop();const s=f.querySelector('svg[data-radar]');const t=[...f.querySelectorAll('*')].find(e=>(e.innerText||'').trim().startsWith('+ Floral'));const z=__lca(s,t).cloneNode(true);const k=[...z.children].findIndex(c=>(c.textContent||'').includes('+ Floral'));[...z.children].slice(k+1).forEach(e=>e.remove());document.body.appendChild(z);return z;})()` },
  gr5: { page: 'parcours-suggerer/suggerer/etat.html', zone: `(()=>{const g=document.querySelector('[data-role=graphe]').cloneNode(true);const ul=g.querySelector('ul[data-role=cadre-voies]');[...ul.children].slice(4).forEach(e=>e.remove());let x=ul;while(x.parentElement&&x.parentElement!==g)x=x.parentElement;let n=x.nextElementSibling;while(n){const m=n.nextElementSibling;n.remove();n=m;}document.body.appendChild(g);return g;})()`, zone2: `document.querySelector('[data-e=style]').closest('div[data-lecture]').parentElement` },
  etape: { page: 'parcours-etape/ma-biere/etat.html', zone: `document.querySelector('section[data-role=profil]')` },
  gr6: { page: 'parcours-comparer/comparer/etat.html', zone: `(()=>{const z=__lca(document.querySelector('[data-role=reponse]'),document.querySelector('svg[data-radar]')).cloneNode(true);z.querySelectorAll('section[data-role=simulation]').forEach(e=>e.remove());document.body.appendChild(z);return z;})()`, zone2: `__lca(...[...document.querySelectorAll('[data-role=reglage][data-col]')].slice(0,3).reduce((a,e,i,l)=>[l[0],l[2]],[]))` },
};
for (const [id, J] of Object.entries(JOBS)) {
  const p = await b.newPage();
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await p.goto(pathToFileURL(path.join(M, J.page)).href, { waitUntil: 'networkidle0' });
  await wait(900);
  if (J.geste) { await J.geste(p); await wait(900); }
  await p.evaluate(LCA);
  const r = await p.evaluate((z, z2) => {
    const e = eval(z); const e2 = z2 ? eval(z2) : null;
    const bx = (x) => { const r = x.getBoundingClientRect(); return { t: Math.round(r.top + scrollY), h: Math.round(r.height), w: Math.round(r.width) }; };
    // Les styles calculés du conteneur (fond, marges) ne viennent pas avec lui : on note sa largeur et sa police.
    return { html: e.outerHTML, box: bx(e), html2: e2 ? e2.outerHTML : '', box2: e2 ? bx(e2) : null, chaine: (() => { const L = []; for (let x = e; x && x !== document.body; x = x.parentElement) L.push(x.tagName + '.' + String(x.className).slice(0, 50) + ' h' + Math.round(x.getBoundingClientRect().height)); return L.slice(0, 6); })() };
  }, J.zone, J.zone2 || '');
  // La légende de l'écran : le texte qui apparaît au toucher du premier « ? ».
  const avant = await p.evaluate(() => document.body.innerText);
  await p.evaluate(() => { const q = document.querySelector('[role=dialog] [data-role=legende-bouton]') || document.querySelector('[data-role=legende-bouton]'); q && q.click(); });
  await wait(500);
  const apres = await p.evaluate(() => document.body.innerText);
  const A = new Set(avant.split('\n').map((s) => s.trim()));
  r.legende = apres.split('\n').map((s) => s.trim()).filter((s) => s && !A.has(s));
  if (id === 'gr1') fs.writeFileSync(path.join(ici, 'extraits/sprite.svg'), await p.evaluate(() => document.querySelector('symbol[id^=p-]').parentElement.outerHTML));
  fs.writeFileSync(path.join(ici, 'extraits', id + '.html'), r.html);
  if (r.html2) fs.writeFileSync(path.join(ici, 'extraits', id + '-b.html'), r.html2);
  fs.writeFileSync(path.join(ici, 'extraits', id + '.json'), JSON.stringify({ page: J.page, box: r.box, box2: r.box2, chaine: r.chaine, legende: r.legende }, null, 1));
  console.log(id, JSON.stringify(r.box), r.box2 ? JSON.stringify(r.box2) : '', Math.round(r.html.length / 1024) + ' ko', '\n   ', r.chaine.join(' < '), '\n    légende:', r.legende.join(' | ').slice(0, 300));
  await p.close();
}
await b.close();
