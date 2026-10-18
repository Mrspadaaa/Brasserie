// D33 (18.10, soir) : « il y a des truc jaune ?? » (capture de p2, biere.html : un cadre jaune
// autour de « Pépins » après un toucher). La page posait le focus sur la ligne touchée et la
// vue web du téléphone dessinait son cadre de focus. Et DESIGN.md : gris et une seule couleur
// d'alerte.
// Usage : node work/refonte-frontend/v4/tournoi/outils/controle-palette.mjs <dossier> [ids…]
// Vérifie sur chaque page à 390 : (a) le corps a -webkit-tap-highlight-color transparent ;
// (b) après chaque toucher (8 au plus par page), l'élément actif ne montre aucun contour
// (outline) : le contour de focus est réservé au clavier (:focus-visible) ; (c) une seule
// teinte saturée (écart de teinte ≤ 30°) hors code couleur des arômes (data-role="aromes") et
// radars (svg data-radar).
// Imprime PALETTE OK si tout passe, sinon PALETTE ECHEC et la liste.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const dir = path.resolve(process.argv[2] || '.');
const only = process.argv.slice(3).filter((a) => !a.startsWith('--'));
const ids = fs.readdirSync(dir).filter((d) => /^p\d+$|^consolide$|^version-/.test(d) && fs.existsSync(path.join(dir, d, 'index.html')))
  .filter((d) => !only.length || only.includes(d)).sort();
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const problems = [];
const SEL = 'button, [role="button"], [tabindex], [data-famille], [data-role="ligne-houblon"], [data-booster], [data-action], label, summary';

const teintes = (page) => page.evaluate(() => {
  const hsl = (c) => {
    const m = c && c.match(/[\d.]+/g); if (!m) return null;
    const [r, g, b, a = 1] = m.map(Number); if (a < 0.3) return null;
    const R = r / 255, G = g / 255, B = b / 255, mx = Math.max(R, G, B), mn = Math.min(R, G, B), l = (mx + mn) / 2, d = mx - mn;
    if (!d) return null;
    const s = d / (1 - Math.abs(2 * l - 1));
    let h = mx === R ? ((G - B) / d) % 6 : mx === G ? (B - R) / d + 2 : (R - G) / d + 4;
    h = (h * 60 + 360) % 360;
    return s > 0.35 && l > 0.15 && l < 0.85 ? Math.round(h) : null;
  };
  const out = new Set();
  for (const e of document.querySelectorAll('body *')) {
    if (e.closest('[data-role="aromes"], svg[data-radar]')) continue;
    const r = e.getBoundingClientRect(); if (!r.width || !r.height || r.top > innerHeight) continue;
    const cs = getComputedStyle(e);
    for (const k of ['color', 'backgroundColor', 'borderTopColor', 'outlineColor', 'fill', 'stroke']) {
      if (k === 'borderTopColor' && parseFloat(cs.borderTopWidth) === 0) continue;
      if (k === 'outlineColor' && (cs.outlineStyle === 'none' || parseFloat(cs.outlineWidth) === 0)) continue;
      const h = hsl(cs[k]); if (h !== null) out.add(h);
    }
  }
  return [...out].sort((a, b) => a - b);
});

for (const id of ids) {
  const p = (m) => problems.push(id + ' : ' + m);
  for (const file of fs.readdirSync(path.join(dir, id)).filter((f) => f.endsWith('.html')).sort()) {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    const url = pathToFileURL(path.join(dir, id, file)).href;
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    await wait(250);
    const tap = await page.evaluate(() => getComputedStyle(document.body).webkitTapHighlightColor);
    if (!/rgba\(0, 0, 0, 0\)|transparent/.test(tap)) p('D33 ' + file + ' : surlignage du toucher non neutralisé (-webkit-tap-highlight-color : ' + tap + ')');
    const h = await teintes(page);
    // Regroupe les teintes proches (≤ 30°, en tenant compte du tour du cercle).
    const groupes = [];
    for (const x of h) { const g = groupes.find((y) => Math.min(Math.abs(y - x), 360 - Math.abs(y - x)) <= 30); if (!g) groupes.push(x); }
    if (groupes.length > 1) p('D33 ' + file + ' : ' + groupes.length + ' teintes saturées (' + groupes.join('°, ') + '°) : une seule couleur d\'alerte');
    let contours = 0;
    for (let i = 0; i < 8; i++) {
      if (page.url() !== url) await page.goto(url, { waitUntil: 'networkidle0' });
      const els = await page.$$(SEL);
      const e = els[i * 2];
      if (!e) break;
      const ok = await e.evaluate((x) => { const r = x.getBoundingClientRect(); return r.height > 0 && r.top >= 0 && r.bottom <= innerHeight; }).catch(() => false);
      if (!ok) continue;
      try { await e.tap(); } catch { continue; }
      await wait(200);
      // Contour visible, ou focus posé (par script) sur un élément qui n'est pas une commande :
      // c'est ce focus que la vue web du téléphone entoure de jaune.
      const o = await page.evaluate(() => {
        const a = document.activeElement; if (!a || a === document.body) return null;
        const cs = getComputedStyle(a);
        const commande = /^(BUTTON|INPUT|SELECT|TEXTAREA|A|SUMMARY)$/.test(a.tagName) || /^(button|slider|tab|switch|checkbox|radio|menuitem)$/.test(a.getAttribute('role') || '');
        return (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || !commande ? (a.getAttribute('data-famille') || a.getAttribute('data-role') || a.tagName) : null;
      });
      if (o) contours++;
    }
    if (contours) p('D33 ' + file + ' : contour de focus visible après ' + contours + ' toucher(s) (réservé au clavier)');
    await page.close();
  }
  console.log(id + ' · palette et focus contrôlés');
}
await browser.close();
if (problems.length === 0) console.log('PALETTE OK ' + ids.length + '/' + ids.length);
else { console.log('PALETTE ECHEC ' + problems.length + ' problème(s)'); for (const x of problems) console.log('  ' + x); process.exitCode = 1; }
