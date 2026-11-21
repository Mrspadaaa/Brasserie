// Outils du PARCOURS CHAINES (21.11) : un build de test servi en local, une page 390×844 tactile par étape, des gestes AU DOIGT
// (touchscreen.tap, jamais element.click()), la lecture du magasin dev-local (localStorage `parcours-chaines:cache`).
// Chaque étape repart d'une fixture neuve (contexte de navigateur jetable) : les étapes ne se contaminent pas.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(ICI, '..', '..', 'package.json'));
const puppeteer = require('puppeteer-core');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const JEU = 'parcours-chaines';

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };

export async function lancerBanc(dir) {
  const srv = http.createServer((q, r) => {
    let f = path.join(dir, decodeURIComponent(q.url.split('?')[0]));
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(dir, 'index.html');
    r.setHeader('content-type', TYPES[path.extname(f)] || 'application/octet-stream');
    fs.createReadStream(f).pipe(r);
  });
  await new Promise((o) => srv.listen(0, '127.0.0.1', o));
  const url = `http://127.0.0.1:${srv.address().port}/?dev-local&finance-demo=${JEU}`;
  const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
  return { url, nav, fermer: async () => { await nav.close(); srv.close(); } };
}

const SEL_ACTIF = 'button,[role=button],[role=menuitem],[role=option],[role=tab],a,[data-chose-id],label,summary,li';

/** Une page neuve (contexte jetable) chargée sur la fixture, avec ses gestes. */
export async function pageNeuve(banc, entrees, sortie) {
  const ctx = await banc.nav.createBrowserContext();
  const p = await ctx.newPage();
  await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  await p.evaluateOnNewDocument((j) => { if (!localStorage.getItem(`parcours-chaines:fixture`)) localStorage.setItem(`parcours-chaines:fixture`, j); }, JSON.stringify(entrees));
  const erreurs = [];
  p.on('pageerror', (e) => erreurs.push(String(e).slice(0, 200)));
  p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|favicon/.test(m.text())) erreurs.push(`console: ${m.text().slice(0, 220)}`); });
  const norm = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
  const cap = async (nom) => { fs.mkdirSync(sortie, { recursive: true }); await p.screenshot({ path: path.join(sortie, `${nom}.png`) }); };
  const texte = (max = 4000) => p.evaluate((m) => document.body.innerText.replace(/\s+/g, ' ').slice(0, m), max);

  /** Position (centre) d'un élément actif visible dont le texte ou l'aria-label correspond ; défilé dans la vue si besoin. */
  const trouver = (txt, { prefixe = false, contient = false, dans = SEL_ACTIF, i = 0, regex = false } = {}) => p.evaluate((t, pr, co, d, i, rx) => {
    const n = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
    const re = rx ? new RegExp(t, 'i') : null;
    const ok = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
    const m = [...document.querySelectorAll(d)].filter((e) => {
      if (!ok(e)) return false;
      const l = n(e.getAttribute('aria-label')); const x = n(e.innerText);
      if (re) return re.test(l) || re.test(x);
      return co ? (l.includes(t) || x.includes(t)) : pr ? (l.startsWith(t) || x.startsWith(t)) : (l === t || x === t);
    });
    const e = i < 0 ? m.at(i) : m[i]; if (!e) return null;
    let r = e.getBoundingClientRect();
    if (r.top < 56 || r.bottom > innerHeight - 64) { e.scrollIntoView({ block: 'center', inline: 'center' }); r = e.getBoundingClientRect(); }
    return [r.x + r.width / 2, r.y + r.height / 2, Math.round(r.width), Math.round(r.height), n(e.innerText || e.getAttribute('aria-label')).slice(0, 60)];
  }, txt, prefixe, contient, dans, i, regex);

  let gestes = 0;
  async function toucher(txt, o = {}) {
    const c = await trouver(txt, o);
    if (!c) throw new Error(`introuvable : « ${txt} » (écran : ${(await texte(200))})`);
    await sleep(100);
    const c2 = (await trouver(txt, o)) ?? c;
    await p.touchscreen.tap(c2[0], c2[1]); gestes++;
    await sleep(o.att ?? 700);
    return c2;
  }
  const visible = async (txt, o = {}) => !!(await trouver(txt, o).catch(() => null));
  /** Touche un champ (sélecteur CSS) puis écrit au clavier. */
  async function ecrire(sel, valeur, { vider = true } = {}) {
    const c = await p.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }, sel);
    if (!c) throw new Error(`champ absent : ${sel}`);
    await p.touchscreen.tap(c[0], c[1]); gestes++; await sleep(250);
    if (vider) { await p.keyboard.down('Control'); await p.keyboard.press('KeyA'); await p.keyboard.up('Control'); await p.keyboard.press('Backspace'); }
    await p.keyboard.type(String(valeur), { delay: 20 }); gestes++; await sleep(400);
  }
  const boutons = () => p.evaluate(() => [...document.querySelectorAll('button,[role=button],[role=tab],[role=option],a')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight; }).map((e) => (e.getAttribute('aria-label') || e.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 60)).filter(Boolean));
  const store = (col) => p.evaluate((c) => JSON.parse(localStorage.getItem('parcours-chaines:cache') || '[]').filter((e) => e.name === c).map((e) => e.data), col);
  const attendre = (re, ms = 20000) => p.waitForFunction((s) => new RegExp(s, 'i').test(document.body.innerText), { timeout: ms }, re.source ?? re).then(() => true, () => false);
  async function demarrer() {
    await p.goto(banc.url, { waitUntil: 'load' });
    await p.waitForSelector('nav button', { timeout: 90000 }).catch(async () => { await cap('erreur-demarrage').catch(() => {}); throw new Error(`l'application ne démarre pas : ${erreurs.slice(0, 2).join(' | ')}`); });
    await sleep(1200);
  }
  const onglet = (nom) => toucher(nom, { dans: 'nav button' });
  return { p, ctx, cap, texte, trouver, toucher, visible, ecrire, boutons, store, attendre, demarrer, onglet, erreurs, gestes: () => gestes, fermer: () => ctx.close() };
}
