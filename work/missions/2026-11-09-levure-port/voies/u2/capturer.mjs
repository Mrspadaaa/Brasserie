// Captures des trois vues (voie u2, mission 2026-11-09-levure-port), sur le banc `banc/index.html` servi par vite (port 5657) :
//   npx vite --port 5657 --strictPort            (dans un autre terminal ; hors bundle de production)
//   node work/missions/2026-11-09-levure-port/voies/u2/capturer.mjs --sortie=work/missions/2026-11-09-levure-port/voies/u2/captures [--only=c1,s2] [--api=reelle]
// Les trois cadres de chaque maquette (c6b, s5a, s7a), 390 tactile et 1280, thème clair puis cave (attribut data-theme du banc).
// Chaque scénario joue les gestes de sa maquette, capture, puis écrit dans le journal ce que la page dit (compte, ordre, rappels).
// Aucune donnée du brasseur, réseau hors localhost bloqué (sauf les polices Google, tolérées).
import puppeteer from 'puppeteer-core';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const arg = (nom, defaut) => process.argv.find((a) => a.startsWith(`--${nom}=`))?.slice(nom.length + 3) ?? defaut;
const base = `http://127.0.0.1:${arg('port', '5657')}`;
const api = arg('api', 'reelle');
const sortie = resolve(arg('sortie', 'captures'));
const only = arg('only', '')?.split(',').filter(Boolean);
await mkdir(sortie, { recursive: true });
const attendre = (ms) => new Promise((fin) => setTimeout(fin, ms));
const navigateur = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--mute-audio', '--no-first-run'] });
const journal = { base, api, erreurs: [], bloques: [], captures: [], notes: {} };
const URL_BANC = (q) => `${base}/work/missions/2026-11-09-levure-port/voies/u2/banc/index.html?api=${api}&${q}`;

async function ouvrir(q, largeur, hauteur, mobile, theme) {
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
  await page.goto(URL_BANC(`${q}&theme=${theme}&largeur=${mobile ? 390 : 640}`), { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-banc]', { timeout: 90000 });
  await attendre(900);
  return { page, contexte };
}
const texte = (page, sel) => page.evaluate((s) => document.querySelector(s)?.textContent?.replace(/\s+/g, ' ').trim() ?? null, sel);
const cliquerTexte = async (page, sel, re) => {
  const ok = await page.evaluate((s, r) => {
    const rx = new RegExp(r, 'i');
    const el = [...document.querySelectorAll(s)].find((e) => rx.test(e.getAttribute('aria-label') ?? '') || rx.test(e.textContent ?? ''));
    if (!el) return false; el.click(); return true;
  }, sel, re.source);
  if (!ok) journal.notes['introuvable:' + sel + ':' + re.source] = true;
  await attendre(350);
  return ok;
};
async function capturer(nom, page, plein = false) {
  await page.screenshot({ path: resolve(sortie, `${nom}.png`), fullPage: plein });
  journal.captures.push(nom); console.log('CAPTURE ' + nom);
}

/** Les scénarios : un par cadre de maquette. `q` = paramètres du banc, `jouer` = les gestes. */
const SCENARIOS = {
  c1: { q: 'vue=chercher', jouer: async (page) => { await page.type('input[aria-label="Nom, fabricant ou code"]', '1056'); await attendre(500); return { resume: await texte(page, '.lvv-res'), carte: await texte(page, '.lvv-us h2'), tete: await texte(page, '.lvv-row .lvv-nm-t') }; } },
  c2: { q: 'vue=chercher', jouer: async (page) => { await cliquerTexte(page, '.lvv-res', /./); await cliquerTexte(page, '.lvv-idx button', /Tol[ée]rance/); await attendre(300); return { panneau: await texte(page, '.lvv-pan h3') }; }, feuille: true },
  c3: { q: 'vue=chercher', jouer: async (page) => {
    await cliquerTexte(page, '.lvv-res', /./);
    await cliquerTexte(page, '.lvv-idx button', /Famille/); await cliquerTexte(page, '.lvv-opt', /ale/i);
    await cliquerTexte(page, '.lvv-idx button', /^Temp[ée]rature/); await cliquerTexte(page, '.lvv-col', /18|15–18|22/);
    await cliquerTexte(page, '.lvv-idx button', /STA1/); await cliquerTexte(page, '[role="switch"]', /STA1|sans/i);
    await cliquerTexte(page, '.lvv-prim', /Voir/); await attendre(500);
    return { phrase: await texte(page, '.lvv-phr'), verif: await texte(page, '.lvv-verif'), rayons: await page.evaluate(() => [...document.querySelectorAll('.lvv-th h3')].map((h) => h.textContent)) };
  } },
  m1: { q: 'vue=comparer&base=US-05&comparees=Verdant,1056', jouer: async (page) => ({ tete: await page.evaluate(() => [...document.querySelectorAll('[role=columnheader]')].map((c) => c.textContent)), lignes: await page.evaluate(() => [...document.querySelectorAll('[data-ligne]')].map((l) => l.getAttribute('data-ligne'))) }) },
  m2: { q: 'vue=comparer&base=US-05&comparees=Verdant,1056', jouer: async (page) => { await cliquerTexte(page, '[data-ligne="phenols"] .lvv-inc', /./); return { journal: await page.evaluate(() => window.__journal) }; } },
  m3: { q: 'vue=comparer&base=US-05&comparees=W-34/70', jouer: async (page) => ({ tete: await page.evaluate(() => [...document.querySelectorAll('[role=columnheader]')].map((c) => c.textContent)), hors: await texte(page, '.lvv-alerte') }) },
  s1: { q: 'vue=suggerer&base=US-05', jouer: async (page) => ({ cartes: await page.evaluate(() => [...document.querySelectorAll('[data-axe]')].map((c) => c.getAttribute('data-axe') + ' ' + c.textContent.replace(/\s+/g, ' ').trim())), rayons: await page.evaluate(() => [...document.querySelectorAll('.lvv-gh')].map((h) => h.textContent)) }) },
  s2: { q: 'vue=suggerer&base=US-05', jouer: async (page) => { await cliquerTexte(page, '.lvv-pm-b', /Moins de att[ée]nuation/i); await attendre(400); return { phrase: await texte(page, '.lvv-dep b'), carte: await texte(page, '[data-axe="attenuation"]'), rayons: await page.evaluate(() => [...document.querySelectorAll('.lvv-gh')].map((h) => h.textContent)), lignes: await page.evaluate(() => [...document.querySelectorAll('.lvv-srow')].slice(0, 6).map((r) => r.textContent.replace(/\s+/g, ' ').trim().slice(0, 90))) }; } },
  s3: { q: 'vue=suggerer&base=US-05', jouer: async (page) => { await cliquerTexte(page, '.lvv-pm-b', /Plus de thiols/i); await cliquerTexte(page, '.lvv-aj', /2/); await cliquerTexte(page, '.lvv-pm-b', /Plus de clart[ée]/i); await attendre(400); return { phrase: await texte(page, '.lvv-dep b'), leviers: await page.evaluate(() => [...document.querySelectorAll('.lvv-lv')].map((l) => l.textContent)), lignes: await page.evaluate(() => [...document.querySelectorAll('.lvv-srow')].slice(0, 5).map((r) => r.textContent.replace(/\s+/g, ' ').trim().slice(0, 90))) }; } },
};

const formats = [['390', 390, 844, true], ['1280', 1280, 900, false]];
const themes = arg('theme', 'clair,cave').split(',');
const fmts = arg('format', '390,1280').split(',');
for (const theme of themes) for (const [nom, w, h, mobile] of formats.filter((f) => fmts.includes(f[0]))) {
  for (const [id, sc] of Object.entries(SCENARIOS)) {
    if (only.length && !only.includes(id)) continue;
    const { page, contexte } = await ouvrir(sc.q, w, h, mobile, theme);
    const notes = await sc.jouer(page);
    journal.notes[`${id}-${nom}-${theme}`] = notes;
    await capturer(`${id}-${nom}-${theme}`, page, !mobile && false);
    await contexte.close();
  }
}
await writeFile(resolve(sortie, 'journal.json'), JSON.stringify(journal, null, 2));
console.log('erreurs', journal.erreurs.length, 'bloquées', [...new Set(journal.bloques)].join(','));
await navigateur.close();
