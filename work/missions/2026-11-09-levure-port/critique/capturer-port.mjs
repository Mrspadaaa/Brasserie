// Voie t1 (critique) : captures de l'app servie (?dev-local&etape=levure, port 5660) pour le verdict du port, état par état et geste
// par geste, 390 tactile et 1280, clair et cave. Les gestes passent par l'écran (boutons de l'app), jamais par l'état React.
//   node work/missions/2026-11-09-levure-port/critique/capturer-port.mjs --port=5660 [--only=l1,c1] [--theme=clair] [--format=390]
import puppeteer from 'puppeteer-core';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const arg = (nom, defaut) => process.argv.find((a) => a.startsWith(`--${nom}=`))?.slice(nom.length + 3) ?? defaut;
const base = `http://127.0.0.1:${arg('port', '5660')}`;
const sortie = resolve(arg('sortie','work/missions/2026-11-09-levure-port/critique/captures-2'));
const only = arg('only', '').split(',').filter(Boolean);
await mkdir(sortie, { recursive: true });
const attendre = (ms) => new Promise((fin) => setTimeout(fin, ms));
const navigateur = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--mute-audio', '--no-first-run'] });
const journal = { base, erreurs: [], bloques: [], captures: [], notes: {} };

const CHEMIN = arg('chemin', '/?dev-local&etape=levure');
async function ouvrir(largeur, hauteur, mobile, theme, chemin = CHEMIN) {
  const contexte = await navigateur.createBrowserContext();
  const page = await contexte.newPage();
  await page.setViewport({ width: largeur, height: hauteur, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
  page.on('pageerror', (e) => journal.erreurs.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') journal.erreurs.push('console: ' + m.text().slice(0, 200)); });
  await page.setRequestInterception(true);
  page.on('request', (r) => {
    const u = new URL(r.url());
    if (u.origin === base || ['data:', 'blob:'].includes(u.protocol) || ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(u.hostname)) return r.continue();
    if (u.port === '5001') { journal.bloques.push(u.origin + ' (refusé après 4 s)'); setTimeout(() => r.abort().catch(() => {}), 4000); return; }
    journal.bloques.push(u.origin); return r.abort();
  });
  // Le thème de l'app : la même clé que son bouton (src/theme/theme.ts, CLE_THEME).
  await page.evaluateOnNewDocument((t) => { try { localStorage.setItem('laffinee.theme', t); } catch { /* */ } }, theme);
  await page.goto(base + chemin, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-lv="etape"]', { timeout: 90000 });
  await attendre(1500);
  return { page, contexte };
}
const cliquer = async (page, sel, re, cle = '') => {
  const ok = await page.evaluate((s, r) => {
    const rx = new RegExp(r, 'i');
    const el = [...document.querySelectorAll(s)].find((e) => rx.test(e.getAttribute('aria-label') ?? '') || rx.test(e.textContent ?? ''));
    if (!el) return false; el.click(); return true;
  }, sel, re.source);
  if (!ok) journal.notes[`introuvable:${cle}:${sel}:${re.source}`] = true;
  await attendre(450);
  return ok;
};
const onglet = (page, id) => cliquer(page, `button[data-vue-id="${id}"]`, /./);
const texte = (page, sel) => page.evaluate((s) => document.querySelector(s)?.textContent?.replace(/\s+/g, ' ').trim() ?? null, sel);
const textes = (page, sel) => page.evaluate((s) => [...document.querySelectorAll(s)].map((e) => e.textContent?.replace(/\s+/g, ' ').trim()), sel);
const capturer = async (nom, page, plein = false) => { await page.screenshot({ path: resolve(sortie, `${nom}.png`), fullPage: plein }); journal.captures.push(nom); console.log('CAPTURE ' + nom); };
const defiler = async (page, sel) => { await page.evaluate((s) => document.querySelector(s)?.scrollIntoView({ block: 'start' }), sel); await attendre(350); };
const pied = (page) => page.evaluate(() => {
  const fabEl = [...document.querySelectorAll('button')].find((b) => (b.textContent?.trim() ?? '') === '+' || /ajouter|assistant|plus/i.test(b.getAttribute('aria-label') ?? '')) ;
  const fabR = fabEl ? fabEl.getBoundingClientRect() : null;
  const b = [...document.querySelectorAll('button')].filter((x) => /^(Retour|Comparer \(\d+\)|Suivant)/.test(x.textContent?.trim() ?? ''));
  const fab = document.querySelector('[data-lv="pied-comparer"]');
  const r = (el) => { if (!el) return null; const c = el.getBoundingClientRect(); return { t: el.textContent?.trim(), x: Math.round(c.x), y: Math.round(c.y), w: Math.round(c.width), h: Math.round(c.height), visible: c.width > 0 && c.bottom <= innerHeight && c.top >= 0 }; };
  const suiv = b.find((x) => /^Suivant/.test(x.textContent ?? '')); const sr = suiv?.getBoundingClientRect(); const chevauche = sr && fabR ? !(sr.right <= fabR.left || sr.left >= fabR.right || sr.bottom <= fabR.top || sr.top >= fabR.bottom) : null;
  return { boutons: b.map(r), comparer: r(fab), fab: fabR ? { x: Math.round(fabR.x), y: Math.round(fabR.y), w: Math.round(fabR.width) } : null, chevauche, innerHeight };
});
/** Pose une levure dans Comparer via son ⊕ (feuille de choix). */
async function ajouterDansComparer(page, requete, re) {
  await onglet(page, 'comparer');
  await cliquer(page, 'button[aria-label="Ajouter une levure à comparer"]', /./, 'plus-comparer');
  await attendre(600);
  if (requete) { const champ = await page.$('[role="dialog"] input[aria-label="Nom, fabricant ou code"]'); if (champ) { await champ.type(requete); await attendre(700); } }
  const ok = await cliquer(page, '.lvv-pick button', re, 'choix-comparer:' + re.source);
  await attendre(700);
  return ok;
}

const SC = {
  // ---- Ma levure (l5b)
  l1: async (page) => { await capturer(`l1-repos-${page._suf}`, page); 
    return { pied: await pied(page), effets: await textes(page, '[data-axe]'), dose: await texte(page, '[data-lv="dose"]') }; },
  l2: async (page) => { await defiler(page, '.lv-cond'); await page.evaluate(() => document.querySelector('[data-phase-select="1"]')?.click()); await attendre(500);
    await capturer(`l2-palier2-touche-${page._suf}`, page); return { sous: await texte(page, '.lv-cond-sous'), moins: await page.$$eval('.lv-moins', (l) => l.length) }; },
  l3: async (page) => { await defiler(page, '.lv-cond'); await page.evaluate(() => document.querySelector('[data-phase-select="1"]')?.click()); await attendre(500);
    const ok = await cliquer(page, '.lv-moins', /./, 'croix'); await attendre(600); await capturer(`l3-croix-${page._suf}`, page); return { ok, sous: await texte(page, '.lv-cond-sous') }; },
  l4: async (page) => { await defiler(page, '.lv-cond'); const ok = await cliquer(page, '.lv-plus[data-frontiere="1"]', /./, 'plus-entre'); await attendre(700);
    await capturer(`l4-plus-entre-${page._suf}`, page); return { ok, sous: await texte(page, '.lv-cond-sous'), champs: await texte(page, '.lv-cond-champs'), dit: await texte(page, '.lv-cond-dit') }; },
  l5: async (page) => { await defiler(page, '.lv-cond'); const n = await page.$$eval('.lv-plus', (l) => l.length); const ok = await cliquer(page, `.lv-plus[data-frontiere="${n - 2}"]`, /./, 'plus-fin'); await attendre(700);
    await capturer(`l5-plus-fin-${page._suf}`, page); return { ok, n, sous: await texte(page, '.lv-cond-sous') }; },
  l6: async (page) => { const ok = await cliquer(page, '.lv-ch, .lvv-inc, button[aria-label*="chercher la donnée"]', /./, 'loupe'); await attendre(900); await capturer(`l6-loupe-${page._suf}`, page);
    const enVol = await page.evaluate(() => document.body.innerText.match(/recherche[^\n]{0,40}/)?.[0] ?? null); await attendre(8000); await capturer(`l6b-loupe-issue-${page._suf}`, page);
    const issue = await page.evaluate(() => [...document.querySelectorAll('[data-recherche]')].map((e) => e.textContent?.replace(/\s+/g, ' ').trim()).slice(0, 4));
    return { ok, enVol, issue, vue: await page.evaluate(() => document.querySelector('[data-lv="etape"]')?.getAttribute('data-vue')), replisOuverts: await page.evaluate(() => [...document.querySelectorAll('[data-lv="replis"] [open], [data-lv="replis"] [aria-expanded="true"]')].length) }; },
  // ---- Chercher (c6b)
  c1: async (page) => { await onglet(page, 'chercher'); await page.type('input[aria-label="Nom, fabricant ou code"]', '1056'); await attendre(800); await capturer(`c1-1056-${page._suf}`, page); 
    return { resume: await texte(page, '.lvv-res'), puces: await textes(page, '.lvv-puces button, .lvv-puce'), premier: await texte(page, '.lvv-rayon-ici .lvv-nm-t'), tapee: await texte(page, '.lvv-us-t') }; },
  c2: async (page) => { await onglet(page, 'chercher'); await page.type('input[aria-label="Nom, fabricant ou code"]', '1056'); await attendre(600); await cliquer(page, '.lvv-res', /./, 'resume'); await cliquer(page, '.lvv-idx button', /Tol[ée]rance/, 'idx-tolerance'); await attendre(400);
    await capturer(`c2-feuille-${page._suf}`, page); return { panneau: await texte(page, '.lvv-pan'), idx: await textes(page, '.lvv-idx-l') }; },
  c3: async (page) => {
    await onglet(page, 'chercher'); await cliquer(page, '.lvv-res', /./, 'resume');
    await cliquer(page, '.lvv-idx button', /Famille/, 'idx-famille'); await cliquer(page, '.lvv-opt', /ale/i, 'opt-ale');
    await cliquer(page, '.lvv-idx button', /^Temp[ée]rature|^°C|°C/, 'idx-temp'); await cliquer(page, '.lvv-col', /18|20/, 'col-18');
    await cliquer(page, '.lvv-idx button', /STA1/, 'idx-sta1'); await cliquer(page, '[role="switch"]', /STA1|sans/i, 'sw-sta1');
    await capturer(`c3-feuille-3filtres-${page._suf}`, page);
    await cliquer(page, '.lvv-prim', /Voir/, 'voir'); await attendre(600);
    await capturer(`c3-3filtres-${page._suf}`, page); 
    return { phrase: await texte(page, '.lvv-phr'), verif: await texte(page, '.lvv-verif'), rayons: await textes(page, '.lvv-rayon h3, .lvv-rayon-t') };
  },
  // ---- Comparer (s5a)
  m1: async (page) => { await onglet(page, 'comparer'); await attendre(400); await capturer(`m1-repos-${page._suf}`, page);
    await cliquer(page, 'button[aria-label="Ajouter une levure à comparer"]', /./, 'plus-comparer'); await attendre(600); await capturer(`m1-plus-feuille-${page._suf}`, page);
    const champ = await page.$('[role="dialog"] input[aria-label="Nom, fabricant ou code"]'); if (champ) { await champ.type('Verdant'); await attendre(700); }
    const listeTapee = await textes(page, '.lvv-pick button'); await capturer(`m1-feuille-tape-verdant-${page._suf}`, page);
    const okTape = await cliquer(page, '.lvv-pick button', /Verdant/, 'choix-verdant-tape');
    if (!okTape) { if (champ) { await champ.click({ clickCount: 3 }); await page.keyboard.press('Backspace'); await attendre(600); } await cliquer(page, '.lvv-pick button', /Verdant/, 'choix-verdant-liste'); }
    await attendre(700); await capturer(`m1-verdant-ajoute-${page._suf}`, page);
    const pied1 = await pied(page); await onglet(page, 'ma-levure'); await attendre(400); const pied2 = await pied(page); await capturer(`m1b-pied-malevure-${page._suf}`, page);
    await page.evaluate(() => { const r = document.querySelector('[data-lv="etape"]')?.closest('[class*=overflow]') || document.scrollingElement; (r || document.scrollingElement).scrollTop = 1e6; }); await attendre(400); const pied3 = await pied(page); await capturer(`m1c-pied-malevure-bas-${page._suf}`, page);
    return { okTape, listeTapee, colonnes: await textes(page, '[role=columnheader]'), piedComparer: pied1, piedMaLevure: pied2, piedMaLevureBas: pied3 }; },
  m2: async (page) => { await ajouterDansComparer(page, '', /Verdant/); await ajouterDansComparer(page, 'Wyeast', /1056/); await attendre(500);
    await capturer(`m2-trois-colonnes-${page._suf}`, page);
    const lignes = await textes(page, '[role=row]');
    const ok = await cliquer(page, 'button[aria-label^="Retirer"]', /Verdant/, 'retirer-verdant'); await attendre(700); await capturer(`m2-croix-${page._suf}`, page);
    await page.evaluate(() => { let el = document.querySelector('[data-lv="etape"]'); while (el && el.scrollHeight <= el.clientHeight + 2) el = el.parentElement; (el || document.scrollingElement).scrollTop = 1e6; }); await attendre(400); await capturer(`m2c-bas-${page._suf}`, page);
    const basBoutons = await page.evaluate(() => [...document.querySelectorAll('button[aria-label^="Retirer"], button[aria-label^="Remplacer"]')].map((b) => { const c = b.getBoundingClientRect(); const pied = document.querySelector('[data-lv="pied-comparer"]')?.getBoundingClientRect(); return { l: b.getAttribute('aria-label'), bas: Math.round(c.bottom), piedHaut: pied ? Math.round(pied.top) : null, cache: pied ? c.bottom > pied.top : null }; }));
    return { ok, lignes, basBoutons, colonnes: await textes(page, '[role=columnheader]') }; },
  m3: async (page) => { await ajouterDansComparer(page, '', /Verdant/); await onglet(page, 'comparer'); const ok = await cliquer(page, '[data-ligne="phenols"] .lvv-inc, [data-ligne="phenols"] button', /./, 'loupe-phenols'); await attendre(900);
    await capturer(`m3-loupe-${page._suf}`, page); const enVol = await texte(page, '[data-ligne="phenols"]'); await attendre(8000); await capturer(`m3b-loupe-issue-${page._suf}`, page);
    return { ok, enVol, issue: await texte(page, '[data-ligne="phenols"]'), vue: await page.evaluate(() => document.querySelector('[data-lv="etape"]')?.getAttribute('data-vue')) }; },
  // ---- Suggérer (s7a)
  s1: async (page) => { await onglet(page, 'suggerer'); await attendre(400); await capturer(`s1-repos-${page._suf}`, page); 
    return { cartes: await textes(page, '[data-axe]'), liste: await textes(page, '.lvv-lg-s') }; },
  s2: async (page) => { await onglet(page, 'suggerer'); const ok = await cliquer(page, '.lvv-pm-b', /Moins de att[ée]nuation/i, 'moins-att'); await attendre(600);
    await capturer(`s2-moins-attenuation-${page._suf}`, page); 
    return { ok, titre: await texte(page, '.lvv-dep'), carte: await texte(page, '[data-axe="attenuation"]'), liste: await textes(page, '.lvv-lg-s') }; },
  s3: async (page) => { await onglet(page, 'suggerer'); const ok1 = await cliquer(page, '.lvv-pm-b', /Plus de thiols/i, 'plus-thiols'); await cliquer(page, '.lvv-aj', /2/, 'deuxieme'); const ok2 = await cliquer(page, '.lvv-pm-b', /Plus de clart[ée]/i, 'plus-clarte'); await attendre(600);
    await capturer(`s3-deux-axes-${page._suf}`, page); 
    return { ok1, ok2, titre: await texte(page, '.lvv-dep'), leviers: await textes(page, '.lvv-lv'), liste: await textes(page, '.lvv-lg-s') }; },
};

const formats = [['390', 390, 844, true], ['1280', 1280, 900, false]];
const themes = arg('theme', 'clair,cave').split(',');
const fmts = arg('format', '390,1280').split(',');
for (const theme of themes) for (const [nom, w, h, mobile] of formats.filter((f) => fmts.includes(f[0]))) {
  for (const [id, jouer] of Object.entries(SC)) {
    if (only.length && !only.includes(id)) continue;
    const { page, contexte } = await ouvrir(w, h, mobile, theme);
    page._suf = `${nom}-${theme}${arg('suffixe', '')}`;
    try { journal.notes[`${id}-${nom}-${theme}`] = await jouer(page); } catch (e) { journal.notes[`${id}-${nom}-${theme}`] = { erreur: String(e).slice(0, 300) }; console.log('ERREUR', id, nom, theme, String(e).slice(0, 200)); }
    await contexte.close();
  }
}
await writeFile(resolve(sortie, 'journal.json'), JSON.stringify(journal, null, 2));
console.log('erreurs', journal.erreurs.length, 'bloquées', [...new Set(journal.bloques)].join(','));
await navigateur.close();
