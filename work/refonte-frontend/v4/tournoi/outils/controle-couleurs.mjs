// D74 (19.10, soir, Suggestions en Barres) : « refait les mini maquette file de fer pour barre
// suggestion. Tu t'es trop limité, m'eme au niveau des couleurs et tout... ». Les lots 5 et 6
// imposaient du gris et un seul accent (l'orangé d'alerte).
// Règle : au premier écran (390 × 844), au moins 3 teintes franches distinctes (saturation > 0,35,
// luminosité entre 0,2 et 0,85 ; teintes à plus de 20° l'une de l'autre) en plus de l'orangé d'alerte
// (--acc de la page, sinon 10° à 30°).
// Usage : node controle-couleurs.mjs <dossier> [ids…] [--page=etat-b.html] [--min=3]
// Imprime COULEURS OK, ou COULEURS ECHEC et la liste.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const args = process.argv.slice(2);
const dir = path.resolve(args.find((a) => !a.startsWith('--')) || '.');
const only = args.filter((a) => !a.startsWith('--')).slice(1);
const pageF = (args.find((a) => a.startsWith('--page=')) || '--page=etat-b.html').slice(7);
const min = Number((args.find((a) => a.startsWith('--min=')) || '--min=3').slice(6));
const ids = (only.length ? only : fs.readdirSync(dir).filter((d) => fs.existsSync(path.join(dir, d, pageF)))).sort();
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const problems = [];
for (const id of ids) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(pathToFileURL(path.join(dir, id, pageF)).href, { waitUntil: 'networkidle0', timeout: 30000 });
  const r = await page.evaluate(() => {
    const parse = (s) => {
      const c = (s || '').match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)/);
      if (c) return c[4] != null && Number(c[4]) < 0.3 ? null : [1, 2, 3].map((i) => Number(c[i]));
      const m = (s || '').match(/rgba?\(([^)]+)\)/); if (!m) return null;
      const p = m[1].split(',').map((x) => parseFloat(x)); if (p.length > 3 && p[3] < 0.3) return null;
      return p.slice(0, 3).map((v) => v / 255);
    };
    const hsl = ([R, G, B]) => { const mx = Math.max(R, G, B), mn = Math.min(R, G, B), l = (mx + mn) / 2, d = mx - mn; if (!d) return null; const s = d / (1 - Math.abs(2 * l - 1)); let h = mx === R ? ((G - B) / d) % 6 : mx === G ? (B - R) / d + 2 : (R - G) / d + 4; return { h: (h * 60 + 360) % 360, s, l }; };
    const acc = (() => { const v = getComputedStyle(document.documentElement).getPropertyValue('--acc').trim(); if (!v) return null; const t = document.createElement('i'); t.style.color = v; document.body.append(t); const c = parse(getComputedStyle(t).color); t.remove(); const x = c && hsl(c); return x ? x.h : null; })();
    const hues = [];
    for (const e of document.querySelectorAll('body *')) {
      const b = e.getBoundingClientRect(); if (!b.width || !b.height || b.top > innerHeight || b.bottom < 0) continue;
      const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || Number(cs.opacity) < 0.2) continue;
      for (const k of ['backgroundColor', 'color', 'fill', 'stroke', 'borderTopColor', 'borderLeftColor']) {
        if (k === 'color' && ![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
        if (k.startsWith('border') && parseFloat(cs[k.replace('Color', 'Width')]) === 0) continue;
        const c = parse(cs[k]); const x = c && hsl(c);
        if (!x || x.s <= 0.35 || x.l < 0.2 || x.l > 0.85) continue;
        const alerte = acc != null ? Math.min(Math.abs(x.h - acc), 360 - Math.abs(x.h - acc)) <= 10 : x.h >= 10 && x.h <= 30;
        if (!alerte) hues.push(x.h);
      }
    }
    const groupes = [];
    for (const h of hues.sort((a, b) => a - b)) if (!groupes.some((g) => Math.min(Math.abs(g - h), 360 - Math.abs(g - h)) <= 20)) groupes.push(h);
    return groupes.map(Math.round);
  });
  await page.close();
  if (r.length < min) problems.push(id + ' : ' + r.length + ' teinte(s) franche(s) au premier écran hors alerte (' + r.join('°, ') + (r.length ? '°' : '') + '), ' + min + ' au moins : trop retenu');
  console.log(id + ' · couleurs : ' + r.length + ' teintes');
}
await browser.close();
// Audit du 23.10 : un contrôle qui ne lit aucune page n'est pas un OK (« OK 0/0 »).
if (ids.length === 0) problems.push('aucune maquette lue : 0 page au format attendu ; ce contrôle ne garde rien ici (voir portee-defauts.json)');
if (problems.length) { console.log('COULEURS ECHEC ' + problems.length + ' problème(s)'); for (const x of problems) console.log('  ' + x); }
else console.log('COULEURS OK ' + ids.length + '/' + ids.length);
