// Banc de la CSP (voie qr-rejeu, étape 6) : joue dans Chrome la lecture du QR de l'image et du PDF fictifs, par le banc
// `?dev-local&depense=qr-<état>` (apercuDev.ts : le fichier est relu par le VRAI décodeur, zxing-wasm ou pdf.js ; Gemini simulé).
// Usage : node csp-banc.mjs --url=http://localhost:3461 --passe=a [--sortie=<dossier>]
// Rapporte : état du sceau, violations CSP (texte exact de la console et securitypolicyviolation), statut du wasm et du worker pdf.js.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const racine = path.resolve(ici, '..', '..', '..', '..', '..', '..');
const require = createRequire(path.join(racine, 'package.json'));
const puppeteer = require('puppeteer-core');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const arg = (nom, defaut) => (process.argv.find(a => a.startsWith(`--${nom}=`)) ?? `--${nom}=${defaut}`).split('=').slice(1).join('=');
const URL_APP = arg('url', 'http://localhost:3461').replace(/\/$/, '');
const PASSE = arg('passe', 'a');
const SORTIE = path.resolve(arg('sortie', path.join(ici, '..', 'captures-csp')));
fs.mkdirSync(SORTIE, { recursive: true });
const dormir = (ms) => new Promise(r => setTimeout(r, ms));
const ETATS = ['qr-confirme', 'qr-pdf'];
const rapport = { url: URL_APP, passe: PASSE, etats: {} };

const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
try {
  for (const etat of ETATS) {
    const p = await nav.newPage();
    await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    const console_ = [], reseau = [], pageErr = [];
    await p.evaluateOnNewDocument(() => { window.__csp = []; document.addEventListener('securitypolicyviolation', e => window.__csp.push({ directive: e.violatedDirective, bloque: e.blockedURI, source: e.sample })); });
    p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console_.push(`${m.type()}: ${m.text().slice(0, 300)}`); });
    p.on('pageerror', e => pageErr.push(e.message.slice(0, 300)));
    p.on('response', r => { const u = r.url(); if (/\.wasm|pdf\.worker|zxing|pdf/i.test(u)) reseau.push(`${r.status()} ${u.replace(URL_APP, '')}`); });
    p.on('requestfailed', r => { const u = r.url(); if (/\.wasm|pdf\.worker|zxing|pdf/i.test(u)) reseau.push(`ECHEC ${r.failure()?.errorText} ${u.replace(URL_APP, '')}`); });
    p.setDefaultNavigationTimeout(150000);
    await p.goto(`${URL_APP}/?dev-local&depense=${etat}`, { waitUntil: 'domcontentloaded' });
    await p.waitForFunction(() => document.querySelectorAll('button').length > 3, { timeout: 150000 });
    await dormir(800);
    await p.click('[aria-label="Actions rapides"]');
    await p.waitForFunction(() => [...document.querySelectorAll('button')].some(b => /Entrer une facture/.test(b.textContent)), { timeout: 20000 });
    await p.evaluate(() => [...document.querySelectorAll('button')].find(b => /Entrer une facture/.test(b.textContent)).click());
    await p.waitForFunction(() => document.body.dataset.apercu, { timeout: 60000 });
    // Le sceau passe de « wait » à son verdict, ou la mention « sans QR » ; sans sceau (non vérifié), on laisse le temps au décodeur.
    await p.waitForFunction(() => { const s = document.querySelector('[data-dp="sceau-qr"]'); return (s && s.dataset.q !== 'wait') || document.querySelector('[data-dp="sans-qr"]'); }, { timeout: 45000 }).catch(() => undefined);
    await dormir(4000);
    const sceau = await p.evaluate(() => { const s = document.querySelector('[data-dp="sceau-qr"]'); return s ? { q: s.dataset.q, verdict: s.querySelector('b')?.textContent ?? null, nom: s.getAttribute('aria-label') } : null; });
    const sansQr = await p.evaluate(() => Boolean(document.querySelector('[data-dp="sans-qr"]')));
    const csp = await p.evaluate(() => window.__csp);
    const aucunSceau = sceau === null;
    // Le worker de pdf.js : la requête vers son fichier, son statut, et ce que la console dit de lui.
    const pdfWorker = reseau.filter(l => /pdf\.worker/.test(l));
    const wasm = reseau.filter(l => /\.wasm/.test(l));
    const etatRapp = { sceau, sansQr, aucunSceau, violationsCsp: csp, consoleErreurs: console_, erreursPage: pageErr, reseau, workerPdf: pdfWorker, wasm };
    rapport.etats[etat] = etatRapp;
    await p.screenshot({ path: path.join(SORTIE, `csp-${PASSE}-${etat}-390.png`) });
    await p.close();
  }
} finally {
  await nav.close();
}
fs.writeFileSync(path.join(SORTIE, `csp-${PASSE}.json`), JSON.stringify(rapport, null, 2));
console.log(JSON.stringify(rapport, null, 2));
