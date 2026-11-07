// Outils communs des contrôles B1 (n° 4 à 14) : ouvre le vrai écran d'un build figé (servi par interception, aucun serveur) en 390 tactile ou 1280,
// thème clair ou cave. Usage depuis un contrôle : const { nav, p, dormir } = await ouvrir(construit, { etat: 'huit', theme: 'cave', largeur: 1280 }).
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
const puppeteer = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json')('puppeteer-core');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.wasm': 'application/wasm', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
export const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

export async function ouvrir(construit, { etat = 'maquette', theme = 'clair', largeur = 390, hauteur, extra = '' } = {}) {
  const tactile = largeur < 700;
  const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const p = await nav.newPage();
  await p.setViewport({ width: largeur, height: hauteur ?? (tactile ? 844 : 800), isMobile: tactile, hasTouch: tactile, deviceScaleFactor: tactile ? 2 : 1 });
  p.tactile = tactile;
  await p.setRequestInterception(true);
  p.on('request', (r) => {
    const u = new URL(r.url());
    if (u.host !== 'localhost:4319') return r.abort();
    let f = path.join(construit, decodeURIComponent(u.pathname));
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(construit, 'index.html');
    r.respond({ status: 200, contentType: TYPES[path.extname(f)] ?? 'application/octet-stream', body: fs.readFileSync(f) });
  });
  await p.evaluateOnNewDocument((t) => { try { localStorage.setItem('laffinee.theme', t); } catch { /* sans stockage */ } }, theme === 'cave' ? 'cave' : 'clair');
  await p.goto(`http://localhost:4319/?dev-local&etape=houblons&recette=vide&malts=${etat}${extra}`, { waitUntil: 'networkidle0' });
  await p.waitForSelector('[data-etape="fermentescibles"] [data-role="ajout"]', { timeout: 60000 });
  await p.waitForFunction(() => !!document.body.dataset.apercu, { timeout: 30000 });
  await p.evaluate(() => document.fonts.ready);
  await dormir(500);
  return { nav, p, dormir };
}

/** Toucher (tactile) ou cliquer (PC) un élément. */
export async function toucher(p, sel) {
  const h = await p.$(sel);
  if (!h) throw new Error('introuvable : ' + sel);
  await h.evaluate((e) => e.scrollIntoView({ block: 'center' }));
  if (p.tactile) await h.tap(); else await h.click();
  await dormir(300);
}

export const noms = (p) => p.$$eval('[data-etape="fermentescibles"] [data-role="nom"]', (els) => els.map((e) => e.textContent.trim()));
export const lignes = (p) => p.$$eval('[data-etape="fermentescibles"] [data-sel]', (els) => els.map((e) => e.innerText.replace(/\s+/g, ' ').trim()));
export async function taper(p, texte, entree = true) {
  await toucher(p, '[data-role="ajout"]');
  await p.keyboard.type(texte, { delay: 10 });
  if (entree) { await p.keyboard.press('Enter'); await dormir(500); } else await dormir(300);
}
export const capturer = (p, chemin) => p.screenshot({ path: chemin });

/** Fin commune : imprime la ligne verdict. */
export async function verdict(nav, mot, raisons, infos) {
  await nav.close();
  if (infos) console.log(JSON.stringify(infos));
  console.log(raisons.length ? `${mot} ECHEC ${raisons.join(' ; ')}` : `${mot} OK`);
}
