// D83 (#142, 19.10, soir) : une notion, une couleur et une forme, sur tous les écrans. Les mots du
// brasseur : « "normaliser" l'affichage, les forme. couleur aromonisé ça coorectement » ; « regarde
// aussi pour la standardisation, UX booster, petit icone et autres ». L'inventaire (inventaire-forme)
// a trouvé, dans la base v4.9 : le bleu #0072B2 pour Nugget, « ma dégustation » et « après Golding » ;
// East Kent Goldings vert dans Comparer, Magnat vert dans Substitution ; les cases de famille de la
// matrice de Comparer à la couleur du houblon ; 20 rayons ; 7 épaisseurs de trait d'icône.
// Règle, sur l'ensemble des pages données :
//   S1 un houblon garde sa couleur partout (data-couleur) ; une couleur de houblon ne sert à aucun
//      autre houblon ni à une autre série (ma bière, avant, après) sur une autre page ;
//   S2 un élément de famille (data-famille) porte un ton de sa famille (base, texte ou fond de
//      fils17-standard/jetons-familles.json) ou l'orangé « hors du style » (#c2410c), rien d'autre ;
//   S3 les rayons d'angle suivent l'échelle : 2, 4 ou 8 px, une pilule (rayon ≥ moitié de la hauteur)
//      ou un rond (50 %) ; une feuille ([role="dialog"] ou son enfant direct) peut prendre rounded-sheet, 24 px
//      (DESIGN.md, « feuilles et modales » ; la fiche g1 de la maquette jouable, 23.10) ;
//   S4 les icônes dessinées (svg de 32 px au plus, hors pictos de famille) ont une seule épaisseur
//      de trait rendue (à 0,3 px près) ; les icônes pleines n'en ont pas.
// Usage : node controle-standard.mjs <page.html> [page2.html…] ; imprime STANDARD OK, ou STANDARD
// ECHEC et la liste.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const ici = path.dirname(fileURLToPath(import.meta.url));
const JETONS = JSON.parse(fs.readFileSync(path.join(ici, '../../ecran-1/fils17-standard/jetons-familles.json'), 'utf8'));
const ALERTE = '#c2410c';
const pages = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const problems = [];
const couleurHoublon = new Map(), houblonCouleur = new Map(), traits = new Map();
const proche = (a, b) => { const v = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); const [x, y] = [v(a), v(b)]; return x.every((c, i) => Math.abs(c - y[i]) <= 6); };
for (const f of pages) {
  const pg = path.relative(process.cwd(), f).replace(/\\/g, '/');
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(pathToFileURL(path.resolve(f)).href, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 300));
  const r = await page.evaluate(() => {
    const vis = (e) => { const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
    const hex = (c) => { const m = String(c).match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/); if (!m || (m[4] !== undefined && +m[4] < 0.3)) return null;
      const [R, G, B] = [m[1], m[2], m[3]].map(Number); return Math.max(R, G, B) - Math.min(R, G, B) > 40 ? '#' + [R, G, B].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('') : null; };
    const norm = (c) => { c = String(c || '').trim().toLowerCase(); const m = c.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/); return m ? '#' + m[1] + m[1] + m[2] + m[2] + m[3] + m[3] : c; };
    const tons = (e) => { const s = new Set(); for (const x of [e, ...e.querySelectorAll('*')].slice(0, 12)) { const cs = getComputedStyle(x); for (const p of ['fill', 'stroke', 'backgroundColor', 'color']) { const h = hex(cs[p]); if (h) s.add(h); } } return [...s]; };
    const familles = [...document.querySelectorAll('[data-famille]')].filter(vis).map((e) => ({ f: e.dataset.famille, tons: tons(e) }));
    const houblons = [...document.querySelectorAll('[data-couleur]')].filter(vis).map((e) => ({ n: e.dataset.houblonCompare || e.dataset.serie || e.dataset.houblon || '?', c: norm(e.dataset.couleur) }));
    const rayons = [...document.querySelectorAll('body *')].filter(vis).map((e) => { const cs = getComputedStyle(e), b = e.getBoundingClientRect();
      return { r: cs.borderTopLeftRadius, h: b.height, w: b.width, feuille: e.matches('[role="dialog"]') || !!e.parentElement?.matches('[role="dialog"]'), peint: cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || cs.borderTopWidth !== '0px' }; })
      .filter((x) => x.r !== '0px' && x.peint).map((x) => (x.feuille && x.r === '24px' ? 'feuille 24px' : x.r.endsWith('%') ? (parseFloat(x.r) >= 50 ? 'rond' : x.r) : parseFloat(x.r) >= Math.min(x.h, x.w) / 2 - 0.5 ? 'pilule' : parseFloat(x.r) + 'px'));
    const traits = [...document.querySelectorAll('svg')].filter((s) => vis(s) && s.getBoundingClientRect().width <= 32 && !s.closest('[data-famille]') && !s.querySelector('[data-famille]'))
      .map((s) => { const u = s.querySelector('use'), src = u ? document.querySelector(u.getAttribute('href') || u.getAttribute('xlink:href')) : s; if (!src) return null;
        const vb = (src.getAttribute('viewBox') || s.getAttribute('viewBox') || '0 0 24 24').split(/[\s,]+/).map(Number), k = s.getBoundingClientRect().width / (vb[2] || 24);
        const sw = [...src.querySelectorAll('[stroke]:not([stroke="none"])'), ...(src.getAttribute('stroke') && src.getAttribute('stroke') !== 'none' ? [src] : [])].map((x) => parseFloat(x.getAttribute('stroke-width') || src.getAttribute('stroke-width') || '1')).filter((x) => x > 0);
        return { nom: (s.getAttribute('aria-label') || s.closest('[aria-label]')?.getAttribute('aria-label') || '?').slice(0, 30), traits: [...new Set(sw.map((x) => Math.round(x * k * 10) / 10))] }; }).filter(Boolean);
    return { familles, houblons, rayons, traits };
  });
  await page.close();
  const p = (m) => problems.push(pg + ' : ' + m);
  // S1
  for (const { n, c } of r.houblons) {
    if (couleurHoublon.has(n) && couleurHoublon.get(n).c !== c) p('S1, ' + n + ' en ' + c + ', en ' + couleurHoublon.get(n).c + ' sur ' + couleurHoublon.get(n).pg);
    else if (!couleurHoublon.has(n)) couleurHoublon.set(n, { c, pg });
    if (houblonCouleur.has(c) && houblonCouleur.get(c).n !== n) p('S1, ' + c + ' pour ' + n + ' ici, pour ' + houblonCouleur.get(c).n + ' sur ' + houblonCouleur.get(c).pg);
    else if (!houblonCouleur.has(c)) houblonCouleur.set(c, { n, pg });
  }
  // S2
  const horsTon = new Map();
  for (const { f: fam, tons } of r.familles) {
    const J = JETONS[fam]; if (!J) continue;
    for (const t of tons) if (![J.base, J.texte, J.fond, ALERTE].some((x) => proche(t, x))) horsTon.set(fam + ' ' + t, (horsTon.get(fam + ' ' + t) || 0) + 1);
  }
  for (const [k, n] of horsTon) p('S2, famille ' + k + ' (' + n + ' élément(s)) hors de ses tons');
  // S3
  const hors = {}; for (const x of r.rayons) if (!['2px', '4px', '8px', 'pilule', 'rond', 'feuille 24px'].includes(x)) hors[x] = (hors[x] || 0) + 1;
  if (Object.keys(hors).length) p('S3, rayons hors échelle : ' + Object.entries(hors).map(([x, n]) => x + '×' + n).join(' '));
  // S4 (cumulé sur toutes les pages)
  for (const t of r.traits) for (const w of t.traits) traits.set(w, [...(traits.get(w) || []), pg + ' ' + t.nom]);
  console.log(pg + ' · houblons ' + r.houblons.length + ' · familles ' + r.familles.length + ' · rayons ' + r.rayons.length + ' · icônes ' + r.traits.length);
}
await browser.close();
const ws = [...traits.keys()].sort((a, b) => a - b);
const groupes = []; for (const w of ws) { if (groupes.length && w - groupes[groupes.length - 1][0] <= 0.3) groupes[groupes.length - 1].push(w); else groupes.push([w]); }
if (groupes.length > 1) problems.push('S4, ' + groupes.length + ' épaisseurs de trait d\'icône : ' + groupes.map((g) => g.join('/') + ' px (' + g.flatMap((w) => traits.get(w)).length + ')').join(', '));
if (problems.length) { console.log('STANDARD ECHEC ' + problems.length + ' problème(s)'); for (const x of problems) console.log('  ' + x); process.exit(1); }
console.log('STANDARD OK');
