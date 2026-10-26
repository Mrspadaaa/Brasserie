#!/usr/bin/env node
// e7 : lit, au repos, le texte (visible + libellés accessibles) de chaque bloc de Substituer que jouent les six états
// etat-subst-face, -alpha, -aromes, -radar, -beta, -style. Lecture seule. Usage : node lire-substituer.mjs <dossier construit>
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ici, '..', '..', '..', '..', '..');
const puppeteer = createRequire(path.join(RACINE, 'package.json'))('puppeteer-core');
const dossier = path.resolve(RACINE, process.argv[2] ?? 'prototypes/houblons-v4/maquettes/parcours-e7');
const BLOCS = { 'etat-subst-face': 'h2', 'etat-subst-alpha': '#m-alpha', 'etat-subst-aromes': '#aro',
  'etat-subst-radar': 'svg[data-radar]', 'etat-subst-beta': '#m-beta', 'etat-subst-style': '#style16' };

const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const page = await nav.newPage();
await page.setViewport({ width: 390, height: 844, hasTouch: true, isMobile: true });
await page.goto('file:///' + path.join(dossier, 'substituer', 'etat.html').replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 1500));
for (const [id, sel] of Object.entries(BLOCS)) {
  const texte = await page.evaluate((s, id) => {
    let e = document.querySelector(s);
    if (!e) return '(sélecteur absent)';
    // « h2 » : le titre « Face à face » ; le bloc lu est la section qui le suit.
    if (id === 'etat-subst-face') e = [...document.querySelectorAll('h2')].find((h) => /Face à face/.test(h.textContent))?.parentElement ?? e;
    const bouts = [(e.innerText || e.textContent || '').replace(/\s+/g, ' ').trim()];
    for (const x of e.querySelectorAll('[aria-label],[title]')) for (const a of ['aria-label', 'title']) { const v = x.getAttribute(a); if (v) bouts.push(`[${a}] ${v}`); }
    for (const x of e.querySelectorAll('svg text, svg title, svg desc')) bouts.push(`[svg] ${(x.textContent || '').trim()}`);
    return bouts.join('\n');
  }, sel, id);
  console.log(`=== ${id} (${sel})\n${texte}\n`);
}
await nav.close();
