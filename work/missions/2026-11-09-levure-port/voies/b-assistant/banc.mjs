// Banc local de la voie b-assistant (jamais l'app en ligne, aucune donnée réelle) : ouvre l'assistant sur la fixture « Stout export »
// (`?dev-local&etape=houblons&recette=identite`), va à une étape par le rail, aide à taper et à lire.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

export const BASE = process.env.BANC_URL ?? 'http://localhost:5655';
export const SORTIE = path.join(import.meta.dirname, 'captures');
fs.mkdirSync(SORTIE, { recursive: true });
export const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

export async function ouvrir({ largeur = 1280, hauteur = 900, theme = 'clair', recette = 'identite', etape = 'houblons' } = {}) {
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const page = await browser.newPage();
  const mobile = largeur < 600;
  await page.setViewport({ width: largeur, height: hauteur, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
  page.setDefaultNavigationTimeout(120000);
  const erreurs = [];
  page.on('pageerror', (e) => erreurs.push(String(e?.message ?? e)));
  await page.setRequestInterception(true);
  page.on('request', (r) => {
    const u = r.url();
    if (/^(https?|ws)s?:\/\/(localhost|127\.0\.0\.1)/i.test(u) || /^(data|blob|about):/i.test(u)) r.continue();
    else r.abort('blockedbyclient');
  });
  await page.evaluateOnNewDocument((t) => { try { localStorage.setItem('laffinee.theme', t); } catch {} }, theme);
  await page.goto(`${BASE}/?dev-local&etape=${etape}&recette=${recette}`, { waitUntil: 'load' });
  await page.waitForFunction(() => /Suivant|Malts\/sucres/.test(document.body.innerText) && !/Ouverture de la page/.test(document.body.innerText), { timeout: 150000 }).catch(() => {});
  await dormir(1500);
  return { browser, page, erreurs };
}

/** Va à une étape par le rail (texte du bouton). */
const TITRES = { 'Identité': 'Identité 1/7', 'Malts': 'Malts/sucres 2/7', 'Paliers': 'Paliers 5/7', 'Eau': 'Eau et sels 6/7', 'Récap': 'Récapitulatif 7/7' };
export async function etape(page, libelle) {
  for (let essai = 0; essai < 6; essai++) {
    await page.evaluate((l) => {
      const b = [...document.querySelectorAll('button')].find((x) => (x.textContent || '').trim().startsWith(l));
      b?.click();
    }, libelle);
    await dormir(1200);
    if (!TITRES[libelle] || (await page.evaluate(() => document.body.innerText)).includes(TITRES[libelle])) return;
  }
}

/** Clique le premier bouton (ou lien, ou résumé) dont le texte contient `t`. */
export async function cliquer(page, t) {
  const ok = await page.evaluate((x) => {
    const b = [...document.querySelectorAll('button,summary,a,[role=button],[role=tab],[role=switch]')].find((e) => (e.textContent || '').includes(x) || (e.getAttribute('aria-label') || '').includes(x));
    if (!b) return false; b.scrollIntoView({ block: 'center' }); b.click(); return true;
  }, t);
  await dormir(500);
  return ok;
}

export async function texte(page) { return page.evaluate(() => document.body.innerText); }

/** Tape dans le champ désigné par un aria-label (contient). */
export async function taper(page, aria, valeur) {
  const h = await page.evaluateHandle((a) => [...document.querySelectorAll('input,textarea')].find((i) => i.type !== 'range' && (i.getAttribute('aria-label') || '').includes(a)) ?? null, aria);
  const el = h.asElement();
  if (!el) return false;
  await el.evaluate((e) => e.scrollIntoView({ block: 'center' }));
  await dormir(200);
  await el.click({ clickCount: 3 });
  await page.keyboard.press('Backspace');
  await page.keyboard.type(String(valeur));
  await dormir(500);
  return true;
}

export async function valeurChamp(page, aria) {
  return page.evaluate((a) => [...document.querySelectorAll('input,textarea')].find((i) => i.type !== 'range' && (i.getAttribute('aria-label') || '').includes(a))?.value ?? null, aria);
}

export async function capture(page, nom, opts = {}) {
  const f = path.join(SORTIE, `${nom}.png`);
  await page.screenshot({ path: f, ...opts });
  return f;
}

export async function champs(page) {
  return page.evaluate(() => [...document.querySelectorAll('input,select,textarea')].map((i) => ({
    aria: i.getAttribute('aria-label') || '', nom: i.name || '', id: i.id || '', val: i.value, type: i.type,
  })));
}
