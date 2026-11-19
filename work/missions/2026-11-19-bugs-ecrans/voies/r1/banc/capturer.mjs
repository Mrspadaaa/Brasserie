// Captures r1 : node scripts/with_server.mjs --server "npm run dev" --port 3102 --env PORT=3102 -- node <ce fichier>
// 390 tactile et 1280, clair et cave, fiche (US-05 et Hefe) et carnet ; mesure aussi les contrastes de la fiche (texte < 4,5:1).
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const RACINE = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..', '..');
const { ouvrir, calme } = await import(pathToFileURL(path.join(RACINE, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const url = `http://localhost:${(process.env.WITH_SERVER_PORTS ?? '3102').split(',')[0]}`;
const SORTIE = path.join(import.meta.dirname, '..', 'captures');
fs.mkdirSync(SORTIE, { recursive: true });
const prefixe = process.argv[2] ?? 'apres';
const banc = '/work/missions/2026-11-19-bugs-ecrans/voies/r1/banc/banc.html';

const contrastes = () => {
  const lum = ([r, g, b]) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const rgba = (s) => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] ?? 1]; };
  const fond = (el) => { for (let n = el; n; n = n.parentElement) { const c = rgba(getComputedStyle(n).backgroundColor); if (c && c[3] > 0.95) return c; } return [255, 255, 255, 1]; };
  const sortie = [];
  for (const el of document.querySelectorAll('body *')) {
    if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.opacity === '0') continue;
    const fg = rgba(cs.color); if (!fg) continue; const bg = fond(el);
    const a = lum(fg), b = lum(bg); const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    if (ratio < 4.5) sortie.push({ texte: el.textContent.trim().slice(0, 30), px: cs.fontSize, ratio: Math.round(ratio * 100) / 100, fg: cs.color, bg: `rgb(${bg.slice(0, 3)})` });
  }
  return sortie;
};

for (const [largeur, mobile] of [[390, true], [1280, false]]) {
  const { browser, page, journal } = await ouvrir({ largeur, hauteur: largeur === 390 ? 844 : 900, mobile, echelle: 1 });
  for (const theme of ['clair', 'cave']) {
    for (const [vue, r] of [['fiche', 'us05'], ['fiche', 'hefe']]) {
      await page.goto(`${url}${banc}?vue=${vue}&r=${r}&theme=${theme}`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => document.body.innerText.length > 200, { timeout: 170000 }).catch(() => console.log('page vide', vue, theme));
      await calme(page, 1500);
      const nom = `${prefixe}-${largeur}-${theme}-${vue}${vue === 'fiche' ? '-' + r : ''}`;
      await page.screenshot({ path: path.join(SORTIE, nom + '.png'), fullPage: true });
      if (vue === 'fiche') {
        const t = await page.$$eval('[data-booster="plage-fg"],[data-booster="plage-abv"]', (l) => l.map((n) => n.textContent));
        console.log(nom, 'pastilles', JSON.stringify(t), 'repères', await page.$eval('[aria-label="Repères de la recette"]', (n) => n.textContent.replace(/\s+/g, ' ')).catch(() => '?'));
        const c = await page.evaluate(contrastes);
        console.log(nom, 'contrastes < 4,5 :', c.length, JSON.stringify(c.slice(0, 12)));
      }
    }
  }
  console.log('erreurs', largeur, JSON.stringify(journal.erreurs.slice(0, 3)), 'bloquées', journal.bloquees.length);
  await browser.close();
}
