// #142 (19.10, soir) : « "normaliser" l'affichage, les forme. couleur aromonisé ça coorectement » ;
// « regarde aussi pour la standardisation, UX booster, petit icone et autres ». Inventaire, page par
// page, de ce qui doit être commun : couleur de chaque famille (data-famille) et de chaque houblon
// (data-couleur, data-houblon), dessin de chaque icône (par sens : aria-label ou title), tailles de
// texte, rayons, épaisseurs de trait des icônes. Lecture seule ; écrit un JSON et imprime les écarts.
// Usage : node inventaire-forme.mjs <sortie.json> <page.html> [page2.html…]
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const [sortie, ...pages] = process.argv.slice(2);
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const inv = { pages: [], familles: {}, houblons: {}, icones: {}, tailles: {}, rayons: {}, traits: {} };
const ajoute = (o, k, v, pg) => { o[k] ??= {}; (o[k][v] ??= new Set()).add(pg); };
for (const f of pages) {
  const pg = path.relative(process.cwd(), f).replace(/\\/g, '/');
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(pathToFileURL(path.resolve(f)).href, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 300));
  const r = await page.evaluate(() => {
    const vis = (e) => { const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
    const sature = (c) => { const m = String(c).match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/); if (!m || (m[4] !== undefined && +m[4] < 0.3)) return null;
      const [R, G, B] = [m[1], m[2], m[3]].map(Number), mx = Math.max(R, G, B), mn = Math.min(R, G, B);
      return mx - mn > 40 ? '#' + [R, G, B].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('') : null; };
    const couleurDe = (e) => {
      const v = getComputedStyle(e).getPropertyValue('--c').trim();
      if (/^#[0-9a-f]{6}$/i.test(v)) return v.toLowerCase();
      for (const x of [e, ...e.querySelectorAll('*')].slice(0, 12)) { const cs = getComputedStyle(x); for (const p of ['fill', 'stroke', 'backgroundColor', 'color']) { const s = sature(cs[p]); if (s) return s; } }
      return null;
    };
    const familles = [...document.querySelectorAll('[data-famille]')].filter(vis).map((e) => [e.dataset.famille, couleurDe(e)]).filter(([, c]) => c);
    const houblons = [...document.querySelectorAll('[data-couleur]')].filter(vis).map((e) => [(e.dataset.houblonCompare || e.dataset.serie || e.dataset.houblon || e.getAttribute('aria-label') || '?').slice(0, 30), e.dataset.couleur.toLowerCase()]);
    const forme = (svg) => { const u = svg.querySelector('use'); const id = u && (u.getAttribute('href') || u.getAttribute('xlink:href'));
      const src = id ? document.querySelector(id) : svg; return src ? src.innerHTML.replace(/\s+/g, ' ').replace(/ (fill|stroke|opacity|class|style)="[^"]*"/g, '').trim() : ''; };
    const h = (s) => { let x = 0; for (let i = 0; i < s.length; i++) x = (x * 31 + s.charCodeAt(i)) | 0; return (x >>> 0).toString(36); };
    const icones = [...document.querySelectorAll('svg')].filter((s) => vis(s) && s.getBoundingClientRect().width <= 32 && !s.closest('[data-famille]'))
      .map((s) => [(s.getAttribute('aria-label') || s.closest('[title]')?.getAttribute('title') || s.closest('[aria-label]')?.getAttribute('aria-label') || '').split(/[,:(]/)[0].trim().toLowerCase(), h(forme(s)),
        Math.round(s.getBoundingClientRect().width), [...s.querySelectorAll('[stroke-width]')].map((x) => x.getAttribute('stroke-width'))[0] || (forme(s).includes('stroke') ? '?' : 'plein')]).filter(([k]) => k);
    const tailles = {}, rayons = {};
    for (const e of [...document.querySelectorAll('body *')].filter(vis)) {
      const cs = getComputedStyle(e);
      if ([...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) tailles[cs.fontSize] = (tailles[cs.fontSize] || 0) + 1;
      if (cs.borderTopLeftRadius !== '0px' && (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || cs.borderTopWidth !== '0px')) rayons[cs.borderTopLeftRadius] = (rayons[cs.borderTopLeftRadius] || 0) + 1;
    }
    return { familles, houblons, icones, tailles, rayons };
  });
  await page.close();
  inv.pages.push(pg);
  for (const [f2, c] of r.familles) ajoute(inv.familles, f2, c, pg);
  for (const [n, c] of r.houblons) ajoute(inv.houblons, n, c, pg);
  for (const [k, hs, w, t] of r.icones) { ajoute(inv.icones, k, hs, pg); ajoute(inv.traits, k, w + 'px/' + t, pg); }
  for (const [t, n] of Object.entries(r.tailles)) inv.tailles[t] = (inv.tailles[t] || 0) + n;
  for (const [t, n] of Object.entries(r.rayons)) inv.rayons[t] = (inv.rayons[t] || 0) + n;
}
await browser.close();
const plat = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Object.fromEntries(Object.entries(v).map(([x, s]) => [x, [...s]]))]));
const out = { pages: inv.pages, familles: plat(inv.familles), houblons: plat(inv.houblons), icones: plat(inv.icones), traits: plat(inv.traits), tailles: inv.tailles, rayons: inv.rayons };
fs.writeFileSync(sortie, JSON.stringify(out, null, 1) + '\n');
const ecarts = (o, nom) => Object.entries(o).filter(([, v]) => Object.keys(v).length > 1).map(([k, v]) => '  ' + nom + ' « ' + k + ' » : ' + Object.keys(v).length + ' variantes (' + Object.entries(v).map(([x, p]) => x + ' sur ' + p.length + ' page(s)').join(' ; ') + ')');
const lignes = [...ecarts(out.familles, 'famille'), ...ecarts(out.houblons, 'houblon'), ...ecarts(out.icones, 'icône')];
console.log(out.pages.length + ' pages · familles ' + Object.keys(out.familles).length + ' · houblons ' + Object.keys(out.houblons).length + ' · icônes ' + Object.keys(out.icones).length);
console.log('tailles de texte : ' + Object.entries(out.tailles).sort((a, b) => parseFloat(a[0]) - parseFloat(b[0])).map(([t, n]) => t + '×' + n).join(' '));
console.log('rayons : ' + Object.entries(out.rayons).sort((a, b) => parseFloat(a[0]) - parseFloat(b[0])).map(([t, n]) => t + '×' + n).join(' '));
console.log('ÉCARTS ' + lignes.length + '\n' + lignes.join('\n'));
