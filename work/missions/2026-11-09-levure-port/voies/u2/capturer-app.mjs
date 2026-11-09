// Captures des trois vues DANS L'APP (banc ?dev-local&etape=levure de la voie u1) : la vraie coque, la vraie recette de démonstration
// (US-05, OG 1,066, 30 L, 19 °C), l'API de d1. Les gestes passent par l'écran : onglet, champ, ligne, « Comparer ».
//   node scripts/with_server.mjs --server "npm run dev -- --port 5657 --strictPort" --port 5657 --env VITE_HOP_V4=on --env VITE_FIREBASE_API_KEY=fake -- node work/missions/2026-11-09-levure-port/voies/u2/capturer-app.mjs --sortie=work/missions/2026-11-09-levure-port/voies/u2/captures-app [--only=m3] [--theme=cave] [--format=1280]
// Réseau hors localhost bloqué (polices tolérées). Rien n'est écrit dans les données.
import puppeteer from 'puppeteer-core';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const arg = (nom, defaut) => process.argv.find((a) => a.startsWith(`--${nom}=`))?.slice(nom.length + 3) ?? defaut;
const port = (process.env.WITH_SERVER_PORTS || '5657').split(',')[0];
const base = `http://127.0.0.1:${port}`;
const sortie = resolve(arg('sortie', 'captures-app'));
const only = arg('only', '').split(',').filter(Boolean);
await mkdir(sortie, { recursive: true });
const attendre = (ms) => new Promise((fin) => setTimeout(fin, ms));
const navigateur = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--mute-audio', '--no-first-run'] });
const journal = { base, erreurs: [], bloques: [], captures: [], notes: {} };

async function ouvrir(largeur, hauteur, mobile, theme) {
  const contexte = await navigateur.createBrowserContext();
  const page = await contexte.newPage();
  await page.setViewport({ width: largeur, height: hauteur, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
  page.on('pageerror', (e) => journal.erreurs.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') journal.erreurs.push('console: ' + m.text().slice(0, 200)); });
  await page.setRequestInterception(true);
  page.on('request', (r) => {
    const u = new URL(r.url());
    if (u.origin === base || ['data:', 'blob:'].includes(u.protocol) || ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(u.hostname)) return r.continue();
    journal.bloques.push(u.origin); return r.abort();
  });
  await page.evaluateOnNewDocument((t) => { try { localStorage.setItem('laffinee.theme', t); } catch { /* */ } }, theme);
  await page.goto(`${base}/?dev-local&etape=levure`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-lv="etape"]', { timeout: 90000 });
  await attendre(1500);
  return { page, contexte };
}
const cliquer = async (page, sel, re) => {
  const ok = await page.evaluate((s, r) => {
    const rx = new RegExp(r, 'i');
    const el = [...document.querySelectorAll(s)].find((e) => rx.test(e.getAttribute('aria-label') ?? '') || rx.test(e.textContent ?? ''));
    if (!el) return false; el.click(); return true;
  }, sel, re.source);
  if (!ok) journal.notes['introuvable:' + sel + ':' + re.source] = true;
  await attendre(400);
  return ok;
};
const onglet = (page, id) => cliquer(page, `button[data-vue-id="${id}"]`, /./);
const texte = (page, sel) => page.evaluate((s) => document.querySelector(s)?.textContent?.replace(/\s+/g, ' ').trim() ?? null, sel);
/** Pose une levure dans Comparer par Chercher : onglet, champ, ligne, « Comparer » de la ligne déroulée. */
async function poser(page, requete, re) {
  await onglet(page, 'chercher');
  await page.click('input[aria-label="Nom, fabricant ou code"]', { clickCount: 3 });
  await page.type('input[aria-label="Nom, fabricant ou code"]', requete);
  await attendre(600);
  await cliquer(page, '.lvv-us-t, .lvv-nm', re); // la levure tapée est une carte (`.lvv-us-t`), sinon une ligne
  await cliquer(page, '.lvv-actions .lvv-btn', /^\s*Comparer$/);
}
const capturer = async (nom, page) => { await page.screenshot({ path: resolve(sortie, `${nom}.png`), fullPage: false }); journal.captures.push(nom); console.log('CAPTURE ' + nom); };
/** M2 : une cellule ne déborde jamais de sa colonne (le texte d'une cellule ne passe pas sous sa voisine). */
const debord = (page) => page.evaluate(() => [...document.querySelectorAll('.lvv-cell, .lvv-head')].filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent.replace(/\s+/g, ' ').slice(0, 40)));
const defiler = async (page, sel) => { await page.evaluate((s) => document.querySelector(s)?.scrollIntoView({ block: 'start' }), sel); await attendre(300); };

const SCENARIOS = {
  c1: async (page) => { await onglet(page, 'chercher'); await page.type('input[aria-label="Nom, fabricant ou code"]', '1056'); await attendre(700); await defiler(page, '[data-vue="chercher"]'); return { resume: await texte(page, '.lvv-res'), premier: await texte(page, '.lvv-rayon-ici .lvv-nm-t') }; },
  c2: async (page) => { await onglet(page, 'chercher'); await cliquer(page, '.lvv-res', /./); await cliquer(page, '.lvv-idx button', /Tol[ée]rance/); return { panneau: await texte(page, '.lvv-pan h3'), repere: await page.evaluate(() => ({ trait: !!document.querySelector('.lvv-reperl'), rond: !!document.querySelector('[data-filtre="tolerance"] .lvv-irp'), bascule: !![...document.querySelectorAll('[role=switch]')].find((b) => /ne garder que/.test(b.textContent)) })) }; },
  c3: async (page) => {
    await onglet(page, 'chercher'); await cliquer(page, '.lvv-res', /./);
    await cliquer(page, '.lvv-idx button', /Famille/); await cliquer(page, '.lvv-opt', /ale/i);
    await cliquer(page, '.lvv-idx button', /STA1/); await cliquer(page, '[role="switch"]', /STA1|sans/i);
    await cliquer(page, '.lvv-prim', /Voir/); await attendre(500);
    await defiler(page, '.lvv-rayon-ici'); return { titres: await page.evaluate(() => [...document.querySelectorAll('.lvv-th h3')].map((h) => [h.innerText, Math.round(h.getBoundingClientRect().height)])), phrase: await texte(page, '.lvv-phr'), verif: await texte(page, '.lvv-verif'), lignesIci: await page.evaluate(() => [...document.querySelectorAll('.lvv-rayon-ici .lvv-row')].map((r) => r.textContent.replace(/\s+/g, ' ').slice(0, 80))), chevauche: await page.evaluate(() => [...document.querySelectorAll('.lvv-nmw')].filter((n) => [...n.children].some((c, i, a) => i > 0 && c.getBoundingClientRect().top < a[i - 1].getBoundingClientRect().bottom - 1 && c.getBoundingClientRect().left < a[i - 1].getBoundingClientRect().right - 1)).length) };
  },
  m1: async (page) => {
    await poser(page, 'Verdant', /Verdant/); await onglet(page, 'suggerer'); await cliquer(page, '.lvv-plusr:not([disabled])', /Ajouter/); // une troisième colonne par le ⊕ de Suggérer
    await onglet(page, 'comparer'); await attendre(500);
    return { colonnes: await page.evaluate(() => [...document.querySelectorAll('[role=columnheader]')].map((c) => c.textContent)), dose: await texte(page, '[data-ligne="dose"]'), fg: await texte(page, '[data-ligne="fg"]'), debordements: await debord(page) };
  },
  m2: async (page) => {
    await poser(page, 'Verdant', /Verdant/); await onglet(page, 'comparer');
    await cliquer(page, '[data-ligne="phenols"] .lvv-inc', /./); await attendre(5000); // la recherche part, le réseau est coupé : l'issue arrive
    return { phenolsUS05: await texte(page, '[data-ligne="phenols"] .lvv-c1'), rognes: await page.evaluate(() => [...document.querySelectorAll('.lvv-cell')].filter((e) => e.scrollWidth > e.clientWidth + 1).length) };
  },
  m3: async (page) => {
    await poser(page, 'W-34/70', /34.?70/);
    await onglet(page, 'comparer'); await attendre(500);
    return { colonnes: await page.evaluate(() => [...document.querySelectorAll('[role=columnheader]')].map((c) => c.textContent)), hors: await texte(page, '.lvv-alerte'), dose: await texte(page, '[data-ligne="dose"]'), debordements: await debord(page) };
  },
  s1: async (page) => { await onglet(page, 'suggerer'); return { cartes: await page.evaluate(() => document.querySelectorAll('[data-axe]').length), premiere: await texte(page, '.lvv-srow') }; },
  s2: async (page) => { await onglet(page, 'suggerer'); await cliquer(page, '.lvv-pm-b', /Moins de att[ée]nuation/i); return { phrase: await texte(page, '.lvv-dep b'), carte: await texte(page, '[data-axe="attenuation"]') }; },
  s3: async (page) => {
    await onglet(page, 'suggerer'); await cliquer(page, '.lvv-pm-b', /Plus de thiols/i); await cliquer(page, '.lvv-aj', /2/); await cliquer(page, '.lvv-pm-b', /Plus de clart[ée]/i);
    return { phrase: await texte(page, '.lvv-dep b'), leviers: await page.evaluate(() => [...document.querySelectorAll('.lvv-lv')].map((l) => l.textContent)) };
  },
};

const formats = [['390', 390, 844, true], ['1280', 1280, 900, false]];
const themes = arg('theme', 'clair,cave').split(',');
const fmts = arg('format', '390,1280').split(',');
for (const theme of themes) for (const [nom, w, h, mobile] of formats.filter((f) => fmts.includes(f[0]))) {
  for (const [id, jouer] of Object.entries(SCENARIOS)) {
    if (only.length && !only.includes(id)) continue;
    const { page, contexte } = await ouvrir(w, h, mobile, theme);
    journal.notes[`${id}-${nom}-${theme}`] = await jouer(page);
    await capturer(`${id}-${nom}-${theme}`, page);
    await contexte.close();
  }
}
await writeFile(resolve(sortie, 'journal.json'), JSON.stringify(journal, null, 2));
console.log('erreurs', journal.erreurs.length, 'bloquées', [...new Set(journal.bloques)].join(','));
await navigateur.close();
