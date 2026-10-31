// Captures de u2b (passe 2, 31.10) : états à 390 × 844, 1280, et les gestes joués (« pils 5 », Entrée ; « pale », Entrée ; couleurs).
// Usage : node capturer.mjs   (écrit cap-*.png à côté)
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ici, '..', '..', '..', '..', '..');
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const fichier = path.join(ici, 'etat.html').split(path.sep).join('/');
const url = (e) => `file:///${fichier}?etat=${e}`;
const out = (n) => path.join(ici, `cap-${n}.png`);
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
const erreurs = [];
try {
  const p = await nav.newPage();
  p.on('pageerror', (e) => erreurs.push(e.message));
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const aller = async (e) => { await p.goto(url(e), { waitUntil: 'networkidle0' }); await p.evaluate(() => document.fonts.ready); };
  const mesure = () => p.evaluate(() => {
    const pied = document.querySelector('[data-commun="pied"]');
    return { piedBas: Math.round(pied.getBoundingClientRect().bottom + scrollY), debord: document.documentElement.scrollWidth - innerWidth,
      ebc: document.querySelector('[data-role="bebc"]').textContent, grain: document.querySelector('[data-role="bgrain"]').textContent,
      focus: document.activeElement && (document.activeElement.getAttribute('aria-label') || '').slice(0, 40) };
  });
  for (const e of ['recette', 'couleurs', 'sucre', 'lactose', 'huit', 'vide']) {
    await aller(e);
    await p.screenshot({ path: out(e) });
    const m = await mesure();
    console.log(`${e.padEnd(9)} pied bas ${m.piedBas} px (${(m.piedBas / 844).toFixed(2)} écran) ; débord ${m.debord} ; EBC ${m.ebc}`);
  }
  await aller('recette');
  await p.screenshot({ path: out('page'), fullPage: true });
  // La première lettre montre déjà l'aperçu.
  await p.focus('[data-role="q"]');
  await p.keyboard.type('p');
  await attendre(60);
  await p.screenshot({ path: out('premiere-lettre') });
  // « pils 5 », Entrée, sur une recette vide ; puis « weizen 1,5 » et « hafer 1,5 » : sa recette en trois frappes.
  await aller('vide');
  await p.focus('[data-role="q"]');
  await p.keyboard.type('pils 5');
  await attendre(60);
  await p.screenshot({ path: out('clavier-pendant') });
  await p.keyboard.press('Enter');
  await attendre(60);
  let m = await mesure();
  console.log(`pils 5 + Entrée : grain ${m.grain}, focus « ${m.focus} »`);
  for (const t of ['weizen 1,5', 'hafer 1,5']) { await p.keyboard.type(t); await p.keyboard.press('Enter'); await attendre(60); }
  await p.screenshot({ path: out('clavier-apres') });
  m = await mesure();
  console.log(`weizen 1,5 et hafer 1,5 : grain ${m.grain}`);
  // L'acquis : un nom seul entre à 0 kg et le curseur passe à la masse.
  await aller('recette');
  await p.focus('[data-role="q"]');
  await p.keyboard.type('pale');
  await p.keyboard.press('Enter');
  await attendre(60);
  m = await mesure();
  console.log(`pale + Entrée : focus « ${m.focus} »`);
  await p.keyboard.type('0,5');
  await p.keyboard.press('Enter');
  await attendre(60);
  await p.screenshot({ path: out('clavier-zero') });
  // Le geste couleur : la marque ouvre la première, Entrée passe à la suivante.
  await aller('recette');
  await p.click('[data-role="ar"]');
  await attendre(60);
  await p.keyboard.type('3,5');
  await attendre(60);
  await p.screenshot({ path: out('couleur-pendant') });
  await p.keyboard.press('Enter');
  await p.keyboard.type('4');
  await p.keyboard.press('Enter');
  await p.keyboard.type('2');
  await p.keyboard.press('Enter');
  await attendre(60);
  await p.screenshot({ path: out('couleur-apres') });
  m = await mesure();
  console.log(`couleurs 3,5 · 4 · 2 : EBC ${m.ebc}`);
  await p.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
  await aller('recette');
  await p.screenshot({ path: out('1280') });
  console.log(`erreurs de script : ${erreurs.length}${erreurs.length ? ' — ' + erreurs.join(' ; ') : ''}`);
} finally {
  await nav.close();
}
