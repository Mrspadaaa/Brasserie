// Captures « Qui a reçu ce lot » dans la fiche du brassin (390 tactile et 1280, deux thèmes) sur le banc simulé. Usage : node tests/ux-mobile/fournisseurs.visual.mjs [dossier]
// Sortie : LOT OK + le dossier des captures (à ouvrir : L12). Mesure aussi la plus petite police et les cibles tactiles.
import { createServer } from 'node:http';
import { mkdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { build } from 'vite';

const output = resolve(process.argv[2] ?? resolve(tmpdir(), 'laffinee-lot'));
await mkdir(output, { recursive: true });
const root = fileURLToPath(new URL('../../', import.meta.url));
const buildDir = resolve(tmpdir(), `laffinee-lot-build-${process.pid}-${Date.now()}`);
// Valeurs factices : le banc ne contacte pas Firebase, il faut seulement que son initialisation ne refuse pas une clé vide.
const faux = Object.fromEntries(['API_KEY', 'APP_ID', 'AUTH_DOMAIN', 'MEASUREMENT_ID', 'MESSAGING_SENDER_ID', 'PROJECT_ID', 'STORAGE_BUCKET']
  .map(k => [`import.meta.env.VITE_FIREBASE_${k}`, JSON.stringify(`banc-${k.toLowerCase()}`)]));
await build({ configFile: resolve(root, 'vite.config.ts'), root, logLevel: 'error', define: faux,
  build: { outDir: buildDir, emptyOutDir: true, rollupOptions: { input: resolve(root, 'tests/ux-mobile/lot.fixture.html') } } });
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = resolve(buildDir, `.${pathname === '/' ? '/tests/ux-mobile/lot.fixture.html' : pathname}`);
    if (!file.startsWith(buildDir + sep)) { response.writeHead(403); response.end(); return; }
    const type = ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' })[extname(file)] ?? 'application/octet-stream';
    response.writeHead(200, { 'Content-Type': type });
    response.end(await readFile(file));
  } catch { if (!response.headersSent) { response.writeHead(404); response.end(); } }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, pipe: true, timeout: 15000, args: ['--mute-audio', '--no-sandbox', '--disable-gpu'] });
const problemes = [];
const clic = async (page, texte) => {
  const ok = await page.evaluate(t => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.replace(/\s+/g, ' ').includes(t) || x.getAttribute('aria-label') === t); if (!b) return false; b.click(); return true; }, texte);
  if (!ok) problemes.push(`bouton introuvable : ${texte}`);
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
};
try {
  for (const [largeur, theme, etat] of [[390, 'clair', ''], [390, 'cave', ''], [1280, 'clair', ''], [390, 'clair', 'cuve']]) {
    const page = await browser.newPage();
    page.on('pageerror', e => { console.log('erreur page :', e.message); problemes.push('erreur page : ' + e.message); });
    await page.evaluateOnNewDocument(() => { try { localStorage.clear(); } catch { /* rien */ } });
    await page.setViewport({ width: largeur, height: largeur < 900 ? 844 : 900, isMobile: largeur < 900, hasTouch: largeur < 900, deviceScaleFactor: 1 });
    await page.goto(base + '/?theme=' + theme + (etat ? '&etat=' + etat : ''), { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForSelector('[data-qar]', { timeout: 8000 });
    const nom = (e) => resolve(output, 'lot-' + e + '-' + largeur + (theme === 'cave' ? '-cave' : '') + (etat ? '-' + etat : '') + '.png');
    const vers = async () => { await page.evaluate(() => document.querySelector('[data-qar]').scrollIntoView({ block: 'start' })); await new Promise(r => setTimeout(r, 300)); };
    await vers();
    await page.screenshot({ path: nom('repos') });
    if (!etat) {
      await clic(page, 'Café du Pont'); await vers();
      await page.screenshot({ path: nom('branche') });
      await page.evaluate(() => document.querySelector('[data-qar]').scrollIntoView({ block: 'end' })); await new Promise(r => setTimeout(r, 300));
      await page.screenshot({ path: nom('bas') });
      await clic(page, 'Encore en cave');
      await new Promise(r => setTimeout(r, 600));
      await page.screenshot({ path: nom('livrer') });
      await clic(page, 'proposé');
      await new Promise(r => setTimeout(r, 500)); await vers();
      await page.screenshot({ path: nom('livre') });
      await clic(page, 'Annuler');
      await new Promise(r => setTimeout(r, 300));
      await clic(page, 'Plus'); await clic(page, 'Rentrer un fût');
      await new Promise(r => setTimeout(r, 600));
      await page.screenshot({ path: nom('rentrer') });
    }
    const mesure = await page.evaluate(() => {
      let min = 99; const petits = [];
      for (const el of document.querySelectorAll('[data-qar] *, .qar-choix *, .qar-aide, .qar-chips *')) {
        if (![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
        const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
        const f = parseFloat(getComputedStyle(el).fontSize); if (f < min) min = f; if (f < 14) petits.push(el.textContent.trim().slice(0, 24) + ' ' + f);
      }
      return { min, petits, largeurDoc: document.documentElement.scrollWidth };
    });
    console.log(largeur + ' ' + theme + (etat ? ' ' + etat : '') + ' : police min ' + mesure.min + 'px, débordement ' + (mesure.largeurDoc > largeur ? 'OUI' : 'non') + ', petits ' + JSON.stringify(mesure.petits));
    if (mesure.min < 14) problemes.push('police sous 14 px (' + largeur + ' ' + theme + ')');
    if (mesure.largeurDoc > largeur) problemes.push('défilement horizontal (' + largeur + ' ' + theme + ')');
    await page.close();
  }
} finally { await browser.close(); server.close(); }
if (problemes.length) { console.log('LOT PROBLEMES : ' + problemes.join(' | ')); process.exitCode = 1; } else console.log('LOT OK · captures : ' + output);
