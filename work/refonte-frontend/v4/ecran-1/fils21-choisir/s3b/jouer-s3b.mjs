// s3b · preuve du geste, jouée au doigt (puppeteer-core, Chrome, 390 × 844, écran tactile) :
//   1. le doigt se pose sur la case « dry hop actif, 4 g/L », glisse sur la carte jusqu'à « 10′, 2 g/L »
//      (doigt gardé : la loupe), puis jusqu'à « 60′, 4 g/L », et se lève ;
//   2. Pomona, puis « + Galaxy », au toucher (les pastilles de réglage) ;
//   3. la vue « pente » : le curseur glissé entre deux doses de la grille (la bulle, l'aimant).
// Valeurs lues à l'écran avant, pendant et après ; captures dans ../captures/ ; sortie : geste-s3b.json.
// Usage : node jouer-s3b.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const ICI = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json');
const puppeteer = require('puppeteer-core');
const CAP = path.join(path.dirname(ICI), 'captures');
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));

const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const erreurs = [];
p.on('pageerror', (e) => erreurs.push(e.message));
await p.goto(pathToFileURL(path.join(ICI, 'etat.html')).href, { waitUntil: 'networkidle0' });
await attendre(400);
const releve = () => p.evaluate(() => {
  const t = (s) => (document.querySelector(s) || {}).innerText || '';
  const lane = (f) => { const l = document.querySelector('[data-lane="' + f + '"]'); return l ? { ecart: l.querySelector('.lf-d').textContent, barre: Math.round(l.querySelector('[data-s="b"]').getBoundingClientRect().width) } : null; };
  const sel = document.querySelector('.cs[aria-pressed="true"]');
  const actif4 = document.querySelector('.cs[data-m="dryActive"][data-d="4"]');
  const lp = document.querySelector('[data-loupe]');
  return {
    case: sel ? sel.getAttribute('aria-label') : null,
    titre: t('[data-case-titre]'), reponse: t('[data-role="reponse"]'), ecart: t('[data-role="ecart"]'),
    tropical: lane('tropical'), citrus: lane('citrus'), floral: lane('floral'),
    actif4: actif4 ? { libelle: actif4.getAttribute('aria-label'), barres: [...actif4.querySelectorAll('.cs-e i')].map((i) => Math.round(i.getBoundingClientRect().height * 10) / 10) } : null,
    bio: [...document.querySelectorAll('[data-role="biotransformation"]')].filter((e) => e.getBoundingClientRect().height > 0).map((e) => e.innerText.replace(/\s+/g, ' ')).join(' | '),
    loupe: lp && !lp.hidden ? { texte: lp.innerText.replace(/\s+/g, ' '), police: parseFloat(getComputedStyle(lp.querySelector('b')).fontSize), policeCase: parseFloat(getComputedStyle(document.querySelector('.cp-rh')).fontSize), haut: Math.round(lp.getBoundingClientRect().top) } : null,
  };
});
const centre = async (sel) => { const e = await p.$(sel); const r = await e.boundingBox(); return [r.x + r.width / 2, r.y + r.height / 2]; };
const toucher = async (sel) => { const [x, y] = await centre(sel); await p.touchscreen.tap(x, y); await attendre(500); };

const avant = await releve();
await p.screenshot({ path: path.join(CAP, 's3b-avant.png') });
// 1. glisser le doigt sur la carte
const A = await centre('.cs[data-m="dryActive"][data-d="4"]'), B = await centre('.cs[data-m="wp"][data-d="4"]'), C = await centre('.cs[data-m="b10"][data-d="2"]'), Dd = await centre('.cs[data-m="b60"][data-d="4"]');
await p.touchscreen.touchStart(A[0], A[1]); await attendre(120);
const glisse = async (de, a, n = 10) => { for (let k = 1; k <= n; k++) { await p.touchscreen.touchMove(de[0] + (a[0] - de[0]) * k / n, de[1] + (a[1] - de[1]) * k / n); await attendre(25); } };
await glisse(A, B); await glisse(B, C);
await attendre(250);
const pendant = await releve();
await p.screenshot({ path: path.join(CAP, 's3b-pendant.png') });
await glisse(C, Dd);
await p.touchscreen.touchEnd(); await attendre(600);
const apres = await releve();
await p.screenshot({ path: path.join(CAP, 's3b-apres.png') });
// 2. la levure, puis le second houblon, au toucher
await toucher('[data-reglage="levure"][data-v="Pomona"]');
const pomona = await releve();
await toucher('.cs[data-m="dryActive"][data-d="4"]');
const pomonaActif = await releve();
await p.screenshot({ path: path.join(CAP, 's3b-pomona-actif.png') });
await toucher('[data-pil="second"]'); await toucher('.op[data-reglage="second"][data-v="Galaxy"]');
const ensemble = await releve();
await p.screenshot({ path: path.join(CAP, 's3b-ensemble.png') });
// 3. la pente : le curseur glissé de 4 à ~3 g/L (entre deux doses de la grille), doigt gardé
await toucher('[data-reglage="vue"][data-v="pente"]');
const rg = await p.$('.pe-r'), rb = await rg.boundingBox();
const xv = (v) => rb.x + (v - 0.5) / 7.5 * rb.width;
await p.touchscreen.touchStart(xv(4), rb.y + rb.height / 2); await attendre(80);
for (let k = 1; k <= 10; k++) { await p.touchscreen.touchMove(xv(4 - 1.1 * k / 10), rb.y + rb.height / 2); await attendre(30); }
await attendre(200);
const bulle = await p.evaluate(() => { const e = document.querySelector('[data-pe-bulle]'); return { visible: !e.hidden, texte: e.textContent, police: parseFloat(getComputedStyle(e).fontSize), policeAxe: 12, reponse: document.querySelector('[data-role="reponse"]').innerText }; });
await p.screenshot({ path: path.join(CAP, 's3b-pente-curseur.png') });
await p.touchscreen.touchEnd(); await attendre(500);
const penteApres = await releve();
await b.close();
const out = { page: 's3b/etat.html', date: new Date().toISOString(), geste: 'glisser le doigt sur la carte : actif 4 g/L → whirlpool 4 g/L → 10′ 2 g/L (gardé) → 60′ 4 g/L', avant, pendant, apres, pomona, pomonaActif, ensemble, pente: { bulle, apres: penteApres }, grossissementLoupe: pendant.loupe ? Math.round(pendant.loupe.police / pendant.loupe.policeCase * 10) / 10 : null, grossissementBulle: Math.round(bulle.police / bulle.policeAxe * 10) / 10, erreurs };
fs.writeFileSync(path.join(ICI, 'geste-s3b.json'), JSON.stringify(out, null, 1));
const L = (n, v) => console.log(n.padEnd(13), '|', (v.titre || '').padEnd(42), '| tropical', v.tropical && v.tropical.ecart, v.tropical && v.tropical.barre + ' px', '| agrumes', v.citrus && v.citrus.ecart, '|', v.loupe ? 'loupe « ' + v.loupe.texte + ' »' : '');
L('avant', avant); L('pendant', pendant); L('après', apres); L('Pomona', pomona); L('Pomona actif', pomonaActif); L('+ Galaxy', ensemble);
console.log('actif 4 g/L, US-05 → Pomona :', JSON.stringify(avant.actif4.barres), '→', JSON.stringify(pomona.actif4.barres));
console.log('écart écrit après le geste :', apres.ecart);
console.log('loupe ×' + out.grossissementLoupe, '| bulle de la pente « ' + bulle.texte + ' » ×' + out.grossissementBulle, '|', bulle.reponse);
console.log('erreurs', erreurs.length ? erreurs : 'aucune');
