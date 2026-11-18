#!/usr/bin/env node
// p3 (D235) : « Je veux que en un écran je vois le maximum d'items ajouter ». Compte, à 390 × 844 tactile, les lignes de
// facture ENTIÈREMENT visibles : (a) au premier écran, (b) au mieux quand la liste est défilée sur ses lignes.
// Une ligne compte si sa boîte tient dans la fenêtre et si ses bords haut et bas ne sont couverts par rien (en-tête
// collant, bande de groupe, pied) : `elementFromPoint` aux deux bords rend la ligne ou un descendant.
// Usage : node compter-lignes.mjs [--page=etat.html] [--app=http://localhost:5616]
//   La variante : `[data-ligne]` de etat.html (ce dossier). La base : l'app servie (`[data-dp-ligne]`, fixture dev-local,
//   état 3) si --app est donné ou si with_server.mjs a posé WITH_SERVER_PORTS ; sinon la maquette r2b portée
//   (v1/r2b/etat.html, `.r2b-li, .r2b-mo`), et la sortie le dit.
// Sortie : `LIGNES a=<n> b=<n> (<quoi>)` pour la variante puis la base ; `LIGNES OK` si b ≥ 16 et a > a de la base,
// sinon `LIGNES ECHEC` (code 1).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '..', '..', '..', '..', '..');
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const argv = process.argv.slice(2);
const val = (n) => argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const PAGE = path.resolve(ICI, val('page') || 'etat.html');
const port = (process.env.WITH_SERVER_PORTS || '').split(',')[0];
const APP = val('app') || (port ? `http://localhost:${port}` : null);
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

function compter(sel) {
  const vh = innerHeight;
  const dedans = (el, x, y) => { const h = document.elementFromPoint(x, y); return !!h && (h === el || el.contains(h)); };
  return [...document.querySelectorAll(sel)].filter((el) => {
    const r = el.getBoundingClientRect();
    if (r.height < 8 || r.width < 8 || r.top < 0 || r.bottom > vh) return false;
    const x = Math.min(r.left + Math.min(40, r.width / 2), innerWidth - 2);
    return dedans(el, x, r.top + 2) && dedans(el, x, r.bottom - 2);
  }).length;
}
async function mesurer(p, sel) {
  const a = await p.evaluate(compter, sel);
  // Le conteneur qui défile : l'ancêtre de la première ligne qui défile vraiment, sinon la page.
  const pas = await p.evaluate((s) => {
    const l = [...document.querySelectorAll(s)];
    if (!l.length) return null;
    let c = l[0].parentElement;
    while (c && !(c.scrollHeight > c.clientHeight + 4 && /auto|scroll/.test(getComputedStyle(c).overflowY))) c = c.parentElement;
    window.__defil = c || document.scrollingElement;
    const base = window.__defil === document.scrollingElement ? 0 : window.__defil.getBoundingClientRect().top;
    const y0 = l[0].getBoundingClientRect().top - base + window.__defil.scrollTop;
    const y1 = l[l.length - 1].getBoundingClientRect().bottom - base + window.__defil.scrollTop;
    return { de: Math.max(0, Math.floor(y0 - 300)), a: Math.ceil(y1) };
  }, sel);
  let b = a;
  if (pas) for (let y = pas.de; y <= pas.a; y += 12) {
    await p.evaluate((yy) => { window.__defil.scrollTop = yy; }, y);
    await dormir(20);
    b = Math.max(b, await p.evaluate(compter, sel));
  }
  return { a, b };
}
const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
async function ouvrir(url) {
  const p = await nav.newPage();
  await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  await p.setRequestInterception(true);
  p.on('request', (r) => (/^(http:\/\/(localhost|127\.0\.0\.1)|file:|data:|blob:|about:|ws:\/\/(localhost|127))/.test(r.url()) ? r.continue() : r.abort('blockedbyclient')));
  await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 150000 });
  return p;
}
let code = 0;
try {
  const v = await ouvrir(pathToFileURL(PAGE).href);
  await v.waitForSelector('[data-ligne]', { timeout: 20000 });
  await v.evaluate(() => document.fonts.ready); await dormir(300);
  const mv = await mesurer(v, '[data-ligne]');
  console.log(`LIGNES a=${mv.a} b=${mv.b} (${path.basename(ICI)}, ${path.relative(RACINE, PAGE).replace(/\\/g, '/')})`);
  let mb;
  if (APP) {
    let p;
    for (let essai = 1; essai <= 3 && !mb; essai++) {
      try {
        p = await ouvrir(`${APP.replace(/\/$/, '')}/?dev-local&depense=3`);
        await p.waitForFunction(() => document.querySelectorAll('button').length > 3, { timeout: 150000 });
        await dormir(800);
        await p.click('[aria-label="Actions rapides"]');
        await p.waitForFunction(() => [...document.querySelectorAll('button')].some((b) => /Entrer une facture/.test(b.textContent)), { timeout: 20000 });
        await p.evaluate(() => [...document.querySelectorAll('button')].find((b) => /Entrer une facture/.test(b.textContent)).click());
        await p.waitForFunction(() => document.body.dataset.apercu === '3', { timeout: 45000 });
        await dormir(800);
        mb = await mesurer(p, '[data-dp-ligne]');
      } catch (e) { if (essai === 3) throw e; }
    }
    console.log(`LIGNES a=${mb.a} b=${mb.b} (base : l'app servie, ${APP}, ?dev-local&depense=3, [data-dp-ligne])`);
  } else if (fs.existsSync(path.join(ICI, 'base-app.json'))) {
    // La base dans l'app, mesurée par ce script sous with_server.mjs (la commande est dans le fichier) ; relancer pour la refaire.
    const j = JSON.parse(fs.readFileSync(path.join(ICI, 'base-app.json'), 'utf8'));
    mb = { a: j.a, b: j.b };
    console.log(`LIGNES a=${mb.a} b=${mb.b} (base : l'app servie, mesurée le ${j.date} ; base-app.json)`);
  } else {
    const r = await ouvrir(pathToFileURL(path.join(RACINE, 'work/missions/2026-10-31-ecran-depense/v1/r2b/etat.html')).href);
    await r.waitForSelector('.r2b-li', { timeout: 20000 }); await dormir(300);
    mb = await mesurer(r, '.r2b-li, .r2b-mo');
    console.log(`LIGNES a=${mb.a} b=${mb.b} (base : maquette r2b portée, app non lancée)`);
  }
  const ok = mv.b >= 16 && mv.a > mb.a;
  console.log(ok ? 'LIGNES OK' : `LIGNES ECHEC (b ${mv.b} < 16 ou a ${mv.a} ≤ base ${mb.a})`);
  code = ok ? 0 : 1;
} catch (e) { console.log('LIGNES ECHEC ' + String(e.message).slice(0, 200)); code = 1; }
await nav.close();
process.exit(code);
