// LEV-11 : après une recherche (simulée), « valeur · à confirmer · Retenir · Écarter » doit tenir sur UNE ligne à 390.
// Usage : … -- node lev11.mjs <dossier-captures> <clair|cave> [largeur]   (code de sortie 1 si une cellule passe sur deux lignes)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const RACINE = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..', '..');
const puppeteer = createRequire(path.join(RACINE, 'package.json'))('puppeteer-core');
const port = (process.env.WITH_SERVER_PORTS ?? '3123').split(',')[0];
const dossier = process.argv[2] ?? import.meta.dirname;
const theme = process.argv[3] ?? 'clair';
const largeur = Number(process.argv[4] ?? 390);
const etiquette = process.argv[5] ?? 'apres';
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
fs.mkdirSync(dossier, { recursive: true });
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
const p = await nav.newPage();
await p.setViewport(largeur < 600 ? { width: largeur, height: 760, isMobile: true, hasTouch: true } : { width: largeur, height: 900 });
await p.evaluateOnNewDocument((t) => { try { localStorage.setItem('laffinee.theme', t === 'cave' ? 'cave' : 'clair'); } catch { /* ignoré */ } }, theme);
await p.goto(`http://localhost:${port}/?dev-local&etape=levure&recherche=simulee`, { waitUntil: 'domcontentloaded', timeout: 150000 });
await p.waitForSelector('[data-lv="ma-levure"]', { timeout: 150000 });
await pause(1500);
// Andechs : floculation « moyen » ; US-05 (au départ) : floculation à chercher.
const bouton = await p.$('[aria-label="Floculation non documentée : chercher la donnée"]');
if (!bouton) throw new Error('bouton « chercher la floculation » absent');
await bouton.click();
await p.waitForSelector('[data-recherche="a-confirmer"]', { timeout: 15000 });
await pause(400);
const cellule = await p.$('[data-recherche="a-confirmer"]');
await cellule.evaluate((e) => e.scrollIntoView({ block: 'center' })); await pause(300);
const mesure = await p.evaluate(() => [...document.querySelectorAll('[data-recherche="a-confirmer"]')].map((c) => {
  const enfants = [...c.children].map((e) => ({ t: e.tagName.toLowerCase(), txt: e.textContent.trim().slice(0, 30), top: Math.round(e.getBoundingClientRect().top), bas: Math.round(e.getBoundingClientRect().bottom), gauche: Math.round(e.getBoundingClientRect().left), droite: Math.round(e.getBoundingClientRect().right) }));
  const lignes = new Set(enfants.map((e) => Math.round((e.top + e.bas) / 2 / 6))).size;
  const r = c.getBoundingClientRect();
  return { enfants, lignes, largeurCellule: Math.round(r.width), hauteurCellule: Math.round(r.height), debordeDroite: Math.round(r.right) > window.innerWidth };
}));
const fichier = path.join(dossier, `lev11-${etiquette}-${largeur}-${theme}.png`);
await p.screenshot({ path: fichier });
console.log(JSON.stringify(mesure, null, 1));
console.log(`CAPTURE ${fichier}`);
const deuxLignes = mesure.some((m) => m.lignes > 1);
console.log(deuxLignes ? 'LEV11 DEUX LIGNES' : 'LEV11 UNE LIGNE');
await nav.close();
process.exit(deuxLignes ? 1 : 0);
