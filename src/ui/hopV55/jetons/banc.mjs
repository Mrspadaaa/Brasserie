// BR-45 (09.11) : banc Chrome de l'atelier Houblons V5.5 dans les deux thèmes, pour juger le passage aux jetons.
// Ouvre l'aperçu de fixtures (`?preview=hop-v55`, serveur de dev, données synthétiques, aucune requête hors localhost),
// pour chaque thème × largeur (390 tactile, 1280) × parcours de fixture × onglet de l'atelier, tous les <details>
// ouverts, et écrit dans <sortie> :
//  - <cle>.png : capture pleine page ;
//  - <cle>.json : couleurs calculées de chaque élément (comparées par compare.mjs), contraste axe-core (règle
//    `color-contrast`), et les surfaces claires (fond opaque de luminance > 0,3 et d'aire > 1 500 px²).
// Usage (le serveur sur un port libre, voir .claude/skills/webapp-testing) :
//   node scripts/with_server.mjs --server "npm run dev -- --port 3117 --strictPort" --port 3117 --timeout 180 -- \
//     node src/ui/hopV55/jetons/banc.mjs --url http://localhost:3117 --sortie <dossier> [--rapide]
// BR45_DEPS : dossier d'un `npm install axe-core` hors du dépôt (axe-core n'est pas une dépendance de l'app).
import fs from 'node:fs';
import path from 'node:path';
import { ouvrir, calme } from '../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? d : process.argv[i + 1]; };
const URL_BASE = arg('url', 'http://localhost:3117');
const SORTIE = path.resolve(arg('sortie', 'banc-br45'));
const RAPIDE = process.argv.includes('--rapide');
const AXE = path.join(process.env.BR45_DEPS ?? '', 'node_modules', 'axe-core', 'axe.min.js');
if (!fs.existsSync(AXE)) throw new Error(`axe-core introuvable : ${AXE} (BR45_DEPS)`);
fs.mkdirSync(SORTIE, { recursive: true });

const THEMES = (arg('themes', 'clair,cave')).split(',');
const LARGEURS = [{ nom: '390', largeur: 390, hauteur: 844, mobile: true }, { nom: '1280', largeur: 1280, hauteur: 900, mobile: false }];
const PARCOURS = RAPIDE ? ['planning'] : ['planning', 'fermenting', 'unknown', 'nolo', 'sour', 'unknownCulture'];
const PROPS = ['color', 'background-color', 'background-image', 'border-top-color', 'border-right-color', 'border-bottom-color',
  'border-left-color', 'outline-color', 'box-shadow', 'fill', 'stroke', 'text-decoration-color', 'accent-color', 'caret-color', 'color-scheme'];

async function mesurer(page, theme) {
  return page.evaluate(async (PROPS, theme) => {
    const els = [...document.querySelectorAll('body *')];
    const couleurs = els.map((e) => {
      const s = getComputedStyle(e);
      return [e.tagName + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\s+/).join('.') : ''), PROPS.map((p) => s.getPropertyValue(p))];
    });
    const lum = (r, g, b) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const claires = [];
    for (const e of els) {
      const m = getComputedStyle(e).backgroundColor.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/);
      if (!m || (m[4] !== undefined && +m[4] < 0.5)) continue;
      const r = e.getBoundingClientRect();
      if (r.width * r.height < 1500 || !e.checkVisibility?.()) continue;
      const L = lum(+m[1], +m[2], +m[3]);
      if (L > 0.3) claires.push({ el: e.tagName + '.' + String(e.className).slice(0, 60), fond: `rgb(${m[1]},${m[2]},${m[3]})`, aire: Math.round(r.width * r.height), L: +L.toFixed(3) });
    }
    const racine = document.querySelector('.hop-v55') ?? document.body;
    const axe = await window.axe.run(racine, { runOnly: ['color-contrast'], resultTypes: ['violations'] });
    const violations = axe.violations.flatMap((v) => v.nodes.map((n) => ({ cible: n.target.join(' '), texte: (n.any[0]?.data ? `${n.any[0].data.fgColor} sur ${n.any[0].data.bgColor} : ${n.any[0].data.contrastRatio}:1 (seuil ${n.any[0].data.expectedContrastRatio})` : n.failureSummary) })));
    return { theme, dataTheme: document.documentElement.dataset.theme, n: els.length, couleurs, claires, violations };
  }, PROPS, theme);
}

const bilan = [];
for (const theme of THEMES) for (const L of LARGEURS) {
  const { browser, page, journal } = await ouvrir({ largeur: L.largeur, hauteur: L.hauteur, mobile: L.mobile, echelle: 1 });
  await page.evaluateOnNewDocument((t) => { try { localStorage.setItem('laffinee.theme', t); } catch {} }, theme);
  try {
    for (const parcours of PARCOURS) {
      await page.goto(`${URL_BASE}/?preview=hop-v55&fixture=br45-${parcours}&case=${parcours}`, { waitUntil: 'networkidle0' });
      await page.waitForSelector('.hv-nav button', { timeout: 60000 }).catch(() => {});
      await calme(page, 800);
      await page.addScriptTag({ path: AXE });
      const onglets = await page.$$eval('.hv-nav button', (bs) => bs.map((b) => b.textContent.trim()));
      for (let i = 0; i < Math.max(onglets.length, 1); i++) {
        if (onglets.length) { await page.$$eval('.hv-nav button', (bs, i) => bs[i].click(), i); await calme(page, 600); }
        await page.$$eval('details', (ds) => ds.forEach((d) => { d.open = true; }));
        await calme(page, 600);
        const cle = `${theme}-${L.nom}-${parcours}-${i}`;
        const m = await mesurer(page, theme);
        m.onglet = onglets[i] ?? '';
        fs.writeFileSync(path.join(SORTIE, `${cle}.json`), JSON.stringify(m));
        await page.screenshot({ path: path.join(SORTIE, `${cle}.png`), fullPage: true });
        bilan.push(`${cle.padEnd(34)} ${String(m.n).padStart(5)} él. · ${String(m.violations.length).padStart(3)} contrastes · ${String(m.claires.length).padStart(3)} surfaces claires · ${m.onglet}`);
        console.log(bilan.at(-1));
      }
    }
  } finally {
    if (journal.erreurs.length) console.log('erreurs de page :', journal.erreurs.slice(0, 5));
    await browser.close();
  }
}
fs.writeFileSync(path.join(SORTIE, 'bilan.txt'), bilan.join('\n') + '\n');
