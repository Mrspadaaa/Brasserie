// p3a (passe 3, D235) : compte les lignes de facture ENTIÈREMENT visibles à 390 × 844 (isMobile, hasTouch).
// (a) au premier écran ; (b) quand la liste est défilée jusqu'à ses lignes (la première ligne amenée en haut, sous ce qui colle).
// Une ligne compte si sa boîte tient dans la fenêtre ET si le point touché en haut et en bas de la ligne (à gauche et à droite)
// tombe sur la ligne elle-même : une ligne cachée sous un en-tête collant, un pied fixe ou une notification ne compte pas.
// Partagé par p3a-1, p3a-2, p3a-3 (chacun a son compter-lignes.mjs) ; la base (l'app servie) se mesure avec --base.
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const RACINE = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..');
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
export const FICHIER_BASE = path.join(import.meta.dirname, 'base-lignes.json');
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

function mesurer(sel) {
  const lignes = [...document.querySelectorAll(sel)];
  const H = innerHeight, W = innerWidth;
  const dedans = (el, x, y) => { const t = document.elementFromPoint(x, y); return !!t && (t === el || el.contains(t)); };
  let n = 0;
  for (const el of lignes) {
    const r = el.getBoundingClientRect();
    if (r.height < 8 || r.width < 40) continue;
    if (r.top < 0 || r.bottom > H || r.left < 0 || r.right > W + 1) continue;
    const xs = [r.left + Math.min(30, r.width / 3), r.right - Math.min(30, r.width / 3)];
    const ys = [r.top + 2, r.bottom - 2];
    if (xs.every((x) => ys.every((y) => dedans(el, x, y)))) n++;
  }
  return { n, total: lignes.length };
}

async function page390(nav) {
  const p = await nav.newPage();
  await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  await p.setRequestInterception(true);
  p.on('request', (r) => { const u = r.url(); if (/^(file:|data:|blob:|about:|http:\/\/(localhost|127\.0\.0\.1)|ws:\/\/(localhost|127\.0\.0\.1))/.test(u)) r.continue(); else r.abort('blockedbyclient'); });
  p.setDefaultNavigationTimeout(150000);
  return p;
}

async function compterOuvert(p, sel) {
  await p.evaluate(() => document.fonts && document.fonts.ready);
  await dormir(300);
  const a = await p.evaluate(mesurer, sel);
  await p.evaluate((s) => { const l = document.querySelector(s); if (l) l.scrollIntoView({ block: 'start' }); }, sel);
  await dormir(400);
  const b = await p.evaluate(mesurer, sel);
  return { a: a.n, b: b.n, total: a.total };
}

export async function compterMaquette(fichier, sel = '[data-ligne]') {
  const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  try {
    const p = await page390(nav);
    await p.goto('file:///' + path.resolve(fichier).replace(/\\/g, '/'));
    await p.waitForSelector(sel, { timeout: 30000 });
    return await compterOuvert(p, sel);
  } finally { await nav.close(); }
}

// La base : l'écran « Nouvelle dépense » de l'app servie (fixture ?dev-local&depense=3, sa facture, SIMULÉ), même script.
export async function compterBase(adresse) {
  const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  try {
    const p = await page390(nav);
    for (let essai = 1; essai <= 3; essai++) {
      try {
        await p.goto(`${adresse}/?dev-local&depense=3`, { waitUntil: 'domcontentloaded' });
        await p.waitForFunction(() => document.querySelectorAll('button').length > 3, { timeout: 150000 });
        await dormir(800);
        await p.click('[aria-label="Actions rapides"]');
        await p.waitForFunction(() => [...document.querySelectorAll('button')].some((b) => /Entrer une facture/.test(b.textContent)), { timeout: 20000 });
        await p.evaluate(() => [...document.querySelectorAll('button')].find((b) => /Entrer une facture/.test(b.textContent)).click());
        await p.waitForFunction(() => document.body.dataset.apercu === '3', { timeout: 45000 });
        await p.waitForSelector('[data-purchase-line]', { timeout: 30000 });
        break;
      } catch (e) { if (essai === 3) throw e; }
    }
    await dormir(800);
    return await compterOuvert(p, '[data-purchase-line]');
  } finally { await nav.close(); }
}

export async function principal(fichierVariante, id) {
  const port = (process.env.WITH_SERVER_PORTS ?? '').split(',')[0];
  let base;
  if (port) {
    base = await compterBase(`http://localhost:${port}`);
    fs.writeFileSync(FICHIER_BASE, JSON.stringify({ ...base, mesure: new Date().toISOString(), source: 'app servie, ?dev-local&depense=3, [data-purchase-line]' }, null, 2));
  } else if (fs.existsSync(FICHIER_BASE)) base = JSON.parse(fs.readFileSync(FICHIER_BASE, 'utf8'));
  const v = await compterMaquette(fichierVariante);
  if (base) console.log(`LIGNES base a=${base.a} b=${base.b} (sur ${base.total}, ${port ? 'mesurée à l’instant' : 'mesurée le ' + base.mesure.slice(0, 16)})`);
  else console.log('LIGNES base : non mesurée (lancer sous scripts/with_server.mjs pour la mesurer)');
  console.log(`LIGNES ${id} a=${v.a} b=${v.b} (sur ${v.total})`);
  const ok = v.total === 23 && v.b >= 16 && (!base || v.a > base.a);
  console.log(`LIGNES a=${v.a} b=${v.b}`);
  console.log(ok ? 'LIGNES OK' : `LIGNES ECHEC (b ≥ 16 ${v.b >= 16 ? 'oui' : 'non'} ; a > base ${base ? (v.a > base.a ? 'oui' : 'non') : 'inconnu'} ; 23 lignes ${v.total === 23 ? 'oui' : 'non : ' + v.total})`);
  process.exit(ok ? 0 : 1);
}
