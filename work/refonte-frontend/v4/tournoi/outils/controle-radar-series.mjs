// D77 (19.10, soir) : sur un radar à plusieurs houblons, chaque houblon se distingue. Les mots du
// brasseur, sur le radar de Comparer de la base v4.9 (Nugget, East Kent Goldings, Fuggle) : « très
// compliqué à voir les différence avec les cileur sur le spider graph » ; « surtout genant là » (oui,
// Comparer). Les surfaces à 0,18 se mêlent (mauve, vert-gris) et les traits de 2 px s'y perdent.
// Règle, pour chaque SVG qui porte au moins deux séries ([data-serie]) :
//   S1 une seule surface pleine au plus (remplissage d'une série ou de son noyau [data-noyau],
//      opacité > 0,05) : deux surfaces superposées font des teintes qui ne sont à aucun houblon ;
//   S2 les couleurs des séries (data-couleur, sinon le trait) à 25 au moins deux à deux (ΔE76, Lab) ;
//   S3 le trait de chaque série à 2,5 px au moins.
// Un radar par houblon (petits multiples) passe d'office. Portée : les radars de houblons
// (svg[data-objet="houblons"]) et les SVG de maquette sans data-objet.
// Usage : node controle-radar-series.mjs <page.html> [page2.html…] ; imprime
// RADAR-SERIES OK, ou RADAR-SERIES ECHEC et la liste.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const fichiers = process.argv.slice(2).filter((a) => !a.startsWith('--')).map((f) => path.resolve(f));
const lab = (hex) => {
  const h3 = String(hex).match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i);
  const m = (h3 ? '#' + h3[1] + h3[1] + h3[2] + h3[2] + h3[3] + h3[3] : String(hex)).match(/^#?([0-9a-f]{6})$/i); if (!m) return null;
  const c = [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16) / 255).map((v) => (v > 0.04045 ? ((v + 0.055) / 1.055) ** 2.4 : v / 12.92));
  const X = (c[0] * 0.4124 + c[1] * 0.3576 + c[2] * 0.1805) / 0.95047, Y = c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722, Z = (c[0] * 0.0193 + c[1] * 0.1192 + c[2] * 0.9505) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
};
const dE = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const problems = [];
for (const f of fichiers) {
  if (!fs.existsSync(f)) { problems.push(f + ' : absent'); continue; }
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(pathToFileURL(f).href, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 400));
  const radars = await page.evaluate(() => {
    const toHex = (c) => { const m = String(c).match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/); return m ? '#' + [m[1], m[2], m[3]].map((x) => (+x).toString(16).padStart(2, '0').replace(/^(.)$/, '0$1')).join('') : (/^#[0-9a-f]{6}$/i.test(c) ? c : null); };
    // Les radars de houblons (data-objet="houblons", Comparer) ; un SVG sans data-objet (maquette) aussi.
    // Ma bière et Suggestions (zone du style, avant / après) relèvent d'autres règles (D39, D62).
    return [...document.querySelectorAll('svg')].filter((svg) => !svg.dataset.objet || svg.dataset.objet === 'houblons').map((svg) => {
      const series = [...svg.querySelectorAll('[data-serie]')].filter((g) => g.getBoundingClientRect().width > 0);
      if (series.length < 2) return null;
      const pleins = new Set();
      const s = series.map((g) => {
        const p = g.querySelector('path');
        const cs = p ? getComputedStyle(p) : null;
        const remplie = (el) => { const c = getComputedStyle(el); return c.fill !== 'none' && c.fill !== 'transparent' && parseFloat(c.fillOpacity) * parseFloat(c.opacity || 1) > 0.05 && !/rgba\(.*,\s*0\)/.test(c.fill); };
        if ((p && remplie(p)) || [...g.querySelectorAll('[data-noyau]')].some(remplie)) pleins.add(g.dataset.serie);
        return { nom: g.dataset.serie, couleur: g.dataset.couleur || (cs ? toHex(cs.stroke) : null), trait: cs ? parseFloat(cs.strokeWidth) : 0 };
      });
      return { label: (svg.getAttribute('aria-label') || '').slice(0, 60), series: s, pleins: [...pleins] };
    }).filter(Boolean);
  });
  await page.close();
  const nom = path.relative(process.cwd(), f);
  if (!radars.length) console.log(nom + ' · aucun radar à plusieurs séries');
  for (const r of radars) {
    const p = (m) => problems.push(nom + ' · ' + r.series.map((x) => x.nom).join(', ') + ' : ' + m);
    if (r.pleins.length > 1) p('S1, ' + r.pleins.length + ' surfaces pleines superposées (' + r.pleins.join(', ') + ')');
    for (let i = 0; i < r.series.length; i++) for (let j = i + 1; j < r.series.length; j++) {
      const a = lab(r.series[i].couleur || ''), b = lab(r.series[j].couleur || '');
      if (!a || !b) { p('S2, couleur illisible (' + r.series[i].couleur + ', ' + r.series[j].couleur + ')'); continue; }
      const d = dE(a, b);
      if (d < 25) p('S2, ' + r.series[i].nom + ' et ' + r.series[j].nom + ' trop proches (ΔE ' + d.toFixed(1) + ' < 25)');
    }
    for (const x of r.series) if (x.trait < 2.5) p('S3, trait de ' + x.nom + ' à ' + x.trait + ' px (2,5 au moins)');
    console.log(nom + ' · ' + r.series.map((x) => x.nom + ' ' + x.couleur + ' ' + x.trait + 'px').join(' ; ') + ' · pleins : ' + r.pleins.length);
  }
}
await browser.close();
if (problems.length) { console.log('RADAR-SERIES ECHEC ' + problems.length + ' problème(s)'); for (const x of problems) console.log('  ' + x); process.exit(1); }
console.log('RADAR-SERIES OK');
