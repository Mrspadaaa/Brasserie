// D88 (19.10, soir) : les pictos d'arôme au trait, sans halo. Les mots du brasseur, sur l8b (la
// baseline qu'il retient) : « le glowing des icône de arôme c'est non, plutôt type Baseline 2 type fil ».
// Dans l8b, le « glowing » est un disque pâle au ton de la famille derrière le trait (.pi : padding,
// border-radius 50 %, background var(--f)) ; dans l7, un drop-shadow néon.
// Règle : chaque picto de famille visible (svg[data-famille], hors d'une légende fermée) n'a ni fond
// teinté, ni ombre, ni filtre CSS, ni parent de 32 px au plus qui lui fasse un disque (fond teinté ou
// ombre ; une pastille blanche neutre, comme celle de la biotransformation, n'en est pas un) ; son
// dessin n'utilise ni flou (feGaussianBlur, feDropShadow, feMorphology) ni forme pleine de plus de 25 %
// du cadre ; son trait est d'une seule couleur, opaque.
// Usage : node controle-pictos-trait.mjs <dossier> [ids…] [--page=etat-b.html] ; imprime TRAIT OK,
// ou TRAIT ECHEC et la liste.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const args = process.argv.slice(2);
const dir = path.resolve(args.find((a) => !a.startsWith('--')) || '.');
const only = args.filter((a) => !a.startsWith('--')).slice(1);
const pg = (args.find((a) => a.startsWith('--page=')) || '--page=etat-b.html').slice(7);
const ids = (only.length ? only : fs.readdirSync(dir).filter((d) => fs.existsSync(path.join(dir, d, pg)))).sort();
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const problems = [];
for (const id of ids) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(pathToFileURL(path.join(dir, id, pg)).href, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 300));
  const r = await page.evaluate(() => {
    const vis = (e) => { const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
    const plein = (c) => { const m = /rgba?\(([^)]+)\)/.exec(c || ''); if (!m) return false; const p = m[1].split(',').map(Number); return p.length < 4 || p[3] > 0; };
    // Un fond blanc neutre (pastille posée sur un fond teinté) n'est pas un halo ; un fond teinté l'est.
    const teinte = (c) => { if (!plein(c)) return false; const p = /rgba?\(([^)]+)\)/.exec(c)[1].split(',').map(Number); return !(Math.min(p[0], p[1], p[2]) >= 245 && Math.max(p[0], p[1], p[2]) - Math.min(p[0], p[1], p[2]) <= 6); };
    const halo = (e) => { const cs = getComputedStyle(e); return teinte(cs.backgroundColor) || cs.backgroundImage !== 'none' || cs.boxShadow !== 'none' || (cs.filter !== 'none' && cs.filter !== ''); };
    const pictos = [...document.querySelectorAll('svg[data-famille]')].filter(vis);
    const fautes = [];
    const vus = new Set();
    for (const s of pictos) {
      const f = s.dataset.famille;
      const ou = (s.closest('[data-voie]') && 'voie') || (s.closest('[data-role="objectif"]') && 'objectif') || 'page';
      if (halo(s)) fautes.push(f + ' (' + ou + ') : fond, ombre ou filtre sur le picto');
      let p = s.parentElement;
      for (let k = 0; k < 2 && p; k++, p = p.parentElement) {
        const b = p.getBoundingClientRect();
        if (b.width <= 32 && b.height <= 32 && halo(p)) { fautes.push(f + ' (' + ou + ') : disque ou ombre sur son cadre de ' + Math.round(b.width) + ' px'); break; }
      }
      const u = s.querySelector('use');
      const ref = u && (u.getAttribute('href') || u.getAttribute('xlink:href'));
      if (!ref || vus.has(ref)) continue;
      vus.add(ref);
      const sym = document.querySelector(ref);
      if (!sym) continue;
      const vb = (sym.getAttribute('viewBox') || '0 0 24 24').split(/\s+/).map(Number);
      const cadre = vb[2] * vb[3];
      for (const fl of sym.querySelectorAll('[filter]')) {
        const fid = (/url\(#([^)]+)\)/.exec(fl.getAttribute('filter')) || [])[1];
        const fe = fid && document.getElementById(fid);
        if (fe && fe.querySelector('feGaussianBlur, feDropShadow, feMorphology')) fautes.push(f + ' : filtre flou ou épaississant (' + fid + ')');
      }
      const traits = new Set();
      for (const g of sym.querySelectorAll('path, circle, ellipse, rect, polygon, line, polyline')) {
        const cs = getComputedStyle(g);
        if (plein(cs.fill) && cs.fillOpacity !== '0') {
          let a = 0; try { const bb = g.getBBox(); a = bb.width * bb.height; } catch { a = 0; }
          if (a > 0.25 * cadre) fautes.push(f + ' : forme pleine de ' + Math.round((100 * a) / cadre) + ' % du cadre');
        }
        if (cs.stroke !== 'none' && plein(cs.stroke)) traits.add(cs.stroke + '|' + cs.strokeOpacity);
        if (Number(cs.strokeOpacity) < 1 || Number(cs.opacity) < 1) fautes.push(f + ' : trait translucide (lavis)');
      }
      if (traits.size > 1) fautes.push(f + ' : ' + traits.size + ' couleurs de trait');
    }
    return { n: pictos.length, fautes: [...new Set(fautes)] };
  });
  await page.close();
  if (!r.n) problems.push(id + ' ' + pg + ' : aucun picto de famille visible (svg[data-famille])');
  for (const x of r.fautes.slice(0, 8)) problems.push(id + ' ' + pg + ' : ' + x);
  if (r.fautes.length > 8) problems.push(id + ' ' + pg + ' : … et ' + (r.fautes.length - 8) + ' autre(s)');
  console.log(id + ' · ' + r.n + ' pictos de famille · ' + r.fautes.length + ' faute(s)');
}
await browser.close();
if (problems.length) { console.log('TRAIT ECHEC ' + problems.length + ' problème(s)'); for (const x of problems) console.log('  ' + x); process.exit(1); }
console.log('TRAIT OK');
