// z2b : captures des états et des gestes (31.10). Usage : node work/missions/2026-10-31-ecran-fermentescibles/v1/z2b/captures.mjs
// Repos 390 et 1280 ; 8 grains (#huit, hauteur ≤ 1,05 écran) ; couleurs 3,5 · 4 · 2 (marque → règle → Entrée) ; sucre (famille, nom,
// Entrée, masse) ; clavier (pendant : nom tapé ; après : masse ciblée) ; geste couleur (pendant : doigt sur la règle ; après).
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
const ici = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.resolve(ici, '../../../../../package.json'));
const puppeteer = require('puppeteer-core');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const url = pathToFileURL(path.join(ici, 'etat.html')).href;
const out = (n) => path.join(ici, `z2b-${n}.png`);
const dodo = (ms) => new Promise((r) => setTimeout(r, ms));
const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
const erreurs = [];
async function page(hash = '', mobile = true) {
  const p = await nav.newPage();
  p.on('pageerror', (e) => erreurs.push(e.message));
  await p.setViewport(mobile ? { width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true } : { width: 1280, height: 800, deviceScaleFactor: 1 });
  await p.goto(url + hash, { waitUntil: 'networkidle0' });
  await p.evaluate(() => document.fonts.ready); await dodo(150);
  return p;
}
const hauteur = (p) => p.evaluate(() => Math.round((document.querySelector('.z2b-pied').getBoundingClientRect().bottom + scrollY) / 844 * 100) / 100);
try {
  let p = await page();
  await p.screenshot({ path: out('repos') });
  console.log(`repos : ${await hauteur(p)} écran`);
  // couleurs : la marque ouvre le plateau sur le premier grain inconnu, le champ EBC est ciblé ; Entrée passe au suivant
  await p.click('[data-role="marq"]');
  for (const v of ['3,5', '4', '2']) { await p.keyboard.type(v); await p.keyboard.press('Enter'); await dodo(80); }
  await dodo(150);
  await p.screenshot({ path: out('couleurs') });
  console.log(`couleurs : EBC ${await p.evaluate(() => document.querySelector('[data-role="bebc"]').textContent)} · teinte ${await p.evaluate(() => document.querySelector('[data-role="mot"]').textContent)}`);
  // sucre : la famille tourne (sucre), nom, Entrée, masse
  await p.click('[data-role="fam"]');
  await p.click('[data-role="nom"]'); await p.keyboard.type('Dextrose');
  await p.screenshot({ path: out('clavier-pendant') });
  await p.keyboard.press('Enter'); await dodo(120);
  const focus = await p.evaluate(() => document.activeElement && document.activeElement.getAttribute('aria-label'));
  await p.screenshot({ path: out('clavier-apres') });
  await p.keyboard.type('0,4'); await p.keyboard.press('Enter'); await dodo(150);
  await p.screenshot({ path: out('sucre') });
  console.log(`clavier : focus après Entrée « ${focus} » ; Grain ${await p.evaluate(() => document.querySelector('[data-role="grain"]').textContent)} kg ; ${await hauteur(p)} écran`);
  await p.close();
  // geste couleur : toucher la pastille « ? » de Weizenmalz hell, poser le doigt sur la règle des teintes
  p = await page();
  await p.click('[data-role="liste"] li:nth-child(2) [data-role="pil"]'); await dodo(120);
  const b = await (await p.$('[data-role="bande"]')).boundingBox();
  await p.mouse.move(b.x + b.width * 0.19, b.y + b.height / 2); await p.mouse.down(); await dodo(80);
  await p.screenshot({ path: out('couleur-pendant') });
  await p.mouse.up(); await dodo(150);
  await p.screenshot({ path: out('couleur-apres') });
  console.log(`geste couleur : Weizenmalz hell → ${await p.evaluate(() => document.querySelector('[data-role="ebc"]').value)} EBC`);
  await p.close();
  // 8 grains
  p = await page('#huit');
  await p.screenshot({ path: out('huit') });
  const marges = await p.evaluate(() => document.querySelectorAll('[data-role="leaders"] circle[stroke-dasharray]').length);
  console.log(`huit : ${await hauteur(p)} écran ; Grain ${await p.evaluate(() => document.querySelector('[data-role="grain"]').textContent)} kg ; ${marges} « ? » en marge`);
  await p.close();
  // ordinateur
  p = await page('', false);
  await p.screenshot({ path: out('1280') });
  await p.close();
  console.log(`erreurs de page : ${erreurs.length}${erreurs.length ? ' : ' + erreurs.join(' | ') : ''}`);
} finally { await nav.close(); }
