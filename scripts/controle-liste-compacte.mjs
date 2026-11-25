// R90 (CARNET-LISTE-COMPACTE, sa plainte du 25.11) : à 390 × 844, la liste des carnets doit donner l'écran à ses LIGNES.
//   Zone utile = sous l'en-tête de l'app, au-dessus du champ « Une idée, un problème… » et de la barre du bas.
//   Mesure (avec ET sans le filtre « je cherche ») : part de la zone utile occupée par les lignes de carnets (`button.cnl-pb`),
//   et nombre de lignes ENTIÈRES visibles sans défiler. Seuils : ≥ 70 % et ≥ 7 lignes. Sortie : « LISTE OK … » ou « LISTE KO <mesures> » (code 1).
// Banc : voies/c74-tests/banc (CarnetsVue réel, fixture du suivi + 6 carnets d'exemple, données simulées ; en-tête et barre du bas = deux cadres vides marqués).
// Serveur : celui de dev de Vite (config sans vite-plugin-pwa), lancé ici s'il ne répond pas, et arrêté à la fin.
// Chrome de débug 127.0.0.1:9222 : un onglet à soi, `page.close()` puis `browser.disconnect()` ; JAMAIS `browser.close()`.
// Usage : node scripts/controle-liste-compacte.mjs [--captures <dossier>]
import { createRequire } from 'node:module';
import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const DOSSIER_BANC = 'work/missions/2026-11-23-reprise-soir/voies/c74-tests/banc';
const PORT = 3074;
const URL_BANC = `http://localhost:${PORT}/${DOSSIER_BANC}/index.html?dev-local=1`;
const SEUIL_PART = 0.7;
const SEUIL_LIGNES = 7;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const capturesDe = process.argv.indexOf('--captures') > 0 ? process.argv[process.argv.indexOf('--captures') + 1] : null;

async function repond() { try { return (await fetch(`http://localhost:${PORT}/${DOSSIER_BANC}/index.html`)).ok; } catch { return false; } }

let serveur = null;
async function demarrerServeur() {
  if (await repond()) return;
  serveur = spawn('npx', ['vite', '--config', `${DOSSIER_BANC}/vite.banc.config.mjs`], { cwd: RACINE, shell: true, stdio: 'ignore' });
  for (let i = 0; i < 120; i += 1) { if (await repond()) return; await sleep(1000); }
  throw new Error(`le serveur de dev ne répond pas sur ${PORT}`);
}
function arreterServeur() {
  if (!serveur) return;
  /* synchrone : le script sort aussitôt après, un taskkill asynchrone serait perdu */
  try { if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(serveur.pid), '/T', '/F'], { stdio: 'ignore' }); else serveur.kill(); } catch { /* déjà arrêté */ }
}

/** Mesure dans la page : zone utile, lignes, part. Rien n'est supposé de la mise en page : seulement des boîtes lues. */
function mesurerDansLaPage() {
  const r = (e) => e.getBoundingClientRect();
  const enteteApp = document.querySelector('[data-banc-cadre="entete"]');
  const racine = document.querySelector('[data-carnets]');
  const champ = document.querySelector('.cn-champ');
  if (!racine || !champ) return { erreur: 'le CarnetsVue ou son champ est introuvable' };
  const haut = Math.max(enteteApp ? r(enteteApp).bottom : 0, r(racine).top);
  const bas = r(champ).top;
  const utile = bas - haut;
  const lignes = [...document.querySelectorAll('button.cnl-pb')].filter((b) => { const x = r(b); return b.offsetParent !== null && x.height > 0 && !b.closest('[hidden]'); });
  let occupe = 0, entieres = 0, partielles = 0;
  for (const b of lignes) {
    const x = r(b);
    const vu = Math.max(0, Math.min(x.bottom, bas) - Math.max(x.top, haut));
    occupe += vu;
    if (vu > 0) partielles += 1;
    if (x.top >= haut - 1 && x.bottom <= bas + 1) entieres += 1;
  }
  return { utile: Math.round(utile), occupe: Math.round(occupe), part: utile > 0 ? occupe / utile : 0, entieres, partielles, total: lignes.length, haut: Math.round(haut), bas: Math.round(bas) };
}

async function mesure(page, nom, gestes) {
  await page.goto(URL_BANC, { waitUntil: 'domcontentloaded', timeout: 180000 });
  await page.waitForSelector('button.cnl-pb', { timeout: 120000 });
  await sleep(1500);
  for (const g of gestes) { await page.click(g); await sleep(500); }
  const m = await page.evaluate(mesurerDansLaPage);
  if (capturesDe) { fs.mkdirSync(capturesDe, { recursive: true }); await page.screenshot({ path: path.join(capturesDe, `liste-${nom}.png`) }); }
  return { nom, ...m };
}

let sortie = 1;
try {
  await demarrerServeur();
  const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
  const page = await browser.newPage();
  try {
    const cdp = await page.createCDPSession();
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1.5, mobile: true });
    page.on('pageerror', (e) => console.log('PAGEERROR', String(e).slice(0, 300)));
    const mesures = [await mesure(page, 'sans-filtre', []), await mesure(page, 'filtre-cherche', ['.cnl-case[data-etat="cherche"]'])];
    const dit = (m) => m.erreur ? `${m.nom}: ${m.erreur}` : `${m.nom}: ${Math.round(m.part * 100)} % de ${m.utile} px, ${m.entieres} lignes entières (${m.partielles} touchées, ${m.total} dans la liste)`;
    const bon = (m) => !m.erreur && m.part >= SEUIL_PART && m.entieres >= SEUIL_LIGNES;
    const ok = mesures.every(bon);
    console.log(`${ok ? 'LISTE OK' : 'LISTE KO'} ${mesures.map(dit).join(' | ')} (seuils : ≥ ${SEUIL_PART * 100} %, ≥ ${SEUIL_LIGNES} lignes)`);
    sortie = ok ? 0 : 1;
  } finally { await page.close().catch(() => {}); browser.disconnect(); }
} catch (e) {
  console.log(`LISTE KO erreur : ${String(e).slice(0, 300)}`);
  sortie = 2;
} finally { arreterServeur(); }
process.exit(sortie);
