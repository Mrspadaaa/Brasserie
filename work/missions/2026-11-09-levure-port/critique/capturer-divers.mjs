// Voie t1, 3e passe : rejouer à 390 (clair) les écrans corrigés par b-divers dont l'« après » manque au dépôt :
// titres de Finances (BE-63, BE-74), Réglages (TE-63, AM-49), Journal (TE-59), Nouveau tarif (Marge brute), Atelier R&D (BE-25).
//   node work/missions/2026-11-09-levure-port/critique/capturer-divers.mjs --port=5660
import puppeteer from 'puppeteer-core';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const arg = (nom, defaut) => process.argv.find((a) => a.startsWith(`--${nom}=`))?.slice(nom.length + 3) ?? defaut;
const base = `http://127.0.0.1:${arg('port', '5660')}`;
const sortie = resolve('work/missions/2026-11-09-levure-port/critique/captures-3/divers');
await mkdir(sortie, { recursive: true });
const attendre = (ms) => new Promise((fin) => setTimeout(fin, ms));
const navigateur = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--mute-audio', '--no-first-run'] });
const journal = { erreurs: [], notes: {} };
const theme = arg('theme', 'clair');
const [w, h, mobile] = arg('format', '390') === '390' ? [390, 844, true] : [1280, 900, false];
const suf = `${arg('format', '390')}-${theme}`;

const contexte = await navigateur.createBrowserContext();
const page = await contexte.newPage();
await page.setViewport({ width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
page.on('pageerror', (e) => journal.erreurs.push(e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/ERR_FAILED|net::/.test(m.text())) journal.erreurs.push('console: ' + m.text().slice(0, 200)); });
await page.setRequestInterception(true);
page.on('request', (r) => { const u = new URL(r.url()); if (u.origin === base || ['data:', 'blob:'].includes(u.protocol) || /fonts\.g/.test(u.hostname)) return r.continue(); return r.abort(); });
await page.evaluateOnNewDocument((t) => { try { localStorage.setItem('laffinee.theme', t); } catch { /* */ } }, theme);
await page.goto(`${base}/?dev-local`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => document.querySelector('nav[aria-label="Navigation principale"]'), { timeout: 90000 });
await attendre(1500);

const cliquer = async (re, zone = 'main') => {
  const ok = await page.evaluate((src, z) => {
    const nav = document.querySelector('nav[aria-label="Navigation principale"]');
    const racine = z === 'nav' ? nav : document;
    const el = [...racine.querySelectorAll('button,a,[role=tab],[role=radio],summary')].find((b) => b.offsetParent !== null && !(z === 'main' && nav && nav.contains(b)) && new RegExp(src, 'i').test((b.getAttribute('aria-label') || b.innerText || '').trim()));
    if (!el) return false; el.click(); return true;
  }, re.source, zone);
  if (!ok) journal.notes['introuvable:' + re.source] = true;
  await attendre(700);
  return ok;
};
const capturer = async (nom) => { await page.screenshot({ path: resolve(sortie, `${nom}-${suf}.png`) }); console.log('CAPTURE', nom); };
const h1h2 = () => page.evaluate(() => [...document.querySelectorAll('h1,h2')].filter((e) => e.offsetParent !== null).map((e) => e.textContent?.trim()).slice(0, 6));
const deborde = () => page.evaluate(() => document.documentElement.scrollWidth > innerWidth || document.body.scrollWidth > innerWidth);

// Finances : quatre onglets
await cliquer(/^Finances/, 'nav');
for (const t of ['Synthèse', 'Opérations', 'Prévisions', 'Annuel']) {
  const ok = await cliquer(new RegExp('^' + t));
  journal.notes['finances-' + t] = { ok, titres: await h1h2(), deborde: await deborde() };
  await capturer('finances-' + t.normalize('NFD').replace(/[^\w]/g, ''));
}
// Clients › Prix et marges › + › Nouveau tarif
await cliquer(/^Clients/, 'nav'); await attendre(500);
journal.notes.clients = { onglets: await page.evaluate(() => [...document.querySelectorAll('[role=tab],button')].filter((b) => b.offsetParent !== null).map((b) => b.innerText.trim()).filter(Boolean).slice(0, 30)) };
await cliquer(/Prix et marges|Prix/); await attendre(500); await capturer('clients-prix');
const fab = await cliquer(/^\+$|Ajouter|Nouveau|assistant/);
await attendre(600); await capturer('clients-plus');
await cliquer(/Nouveau tarif/); await attendre(800); await capturer('clients-nouveau-tarif');
journal.notes.tarif = { fab, titres: await h1h2(), marge: await page.evaluate(() => [...document.querySelectorAll('*')].filter((e) => /^(Marge brute|Coût de revient|Prix TTC)$/.test(e.textContent?.trim() ?? '') && e.children.length === 0).map((e) => { const v = e.parentElement?.querySelector('b,strong,output,span:not(:first-child),p'); return { l: e.textContent.trim(), taille: v ? getComputedStyle(v).fontSize : null, texte: v?.textContent?.trim().slice(0, 20) }; })) };
await page.keyboard.press('Escape'); await attendre(500);
// Menu › Réglages, Journal, Atelier R&D
const menu = await cliquer(/^Menu$|Menu|Plus/);
await attendre(500); await capturer('menu');
journal.notes.menu = { menu, entrees: await page.evaluate(() => [...document.querySelectorAll('[role=menuitem],[role=dialog] button,[role=dialog] a,nav a,nav button')].filter((b) => b.offsetParent !== null).map((b) => b.innerText.trim()).filter(Boolean).slice(0, 40)) };
if (await cliquer(/^Réglages/)) {
  await attendre(900); journal.notes.reglages = { titres: await h1h2() }; await capturer('reglages');
  await cliquer(/^Brasserie/); await attendre(600);
  const champ = await page.$('input[aria-label*="Fermenteur"], input[name*="fermenter"], input[aria-label*="capacité"]');
  journal.notes.reglagesBrasserie = { champ: !!champ, labels: await page.evaluate(() => [...document.querySelectorAll('label')].filter((l) => l.offsetParent !== null).map((l) => l.innerText.trim()).slice(0, 25)) };
  if (champ) { await champ.click({ clickCount: 3 }); await champ.type('5000'); await page.keyboard.press('Tab'); await attendre(600); journal.notes.am49 = await page.evaluate(() => document.body.innerText.match(/Saisis[^\n]{0,30}/)?.[0] ?? null); }
  await capturer('reglages-brasserie-5000');
}
await cliquer(/^Menu$|Menu|Plus/); await attendre(400);
if (await cliquer(/Journal/)) { await attendre(900); journal.notes.journal = { titres: await h1h2() }; await capturer('journal'); }
await cliquer(/^Menu$|Menu|Plus/); await attendre(400);
if (await cliquer(/Atelier/)) { await attendre(900); journal.notes.atelier = { titres: await h1h2() }; await capturer('atelier'); }
await writeFile(resolve(sortie, `journal-${suf}.json`), JSON.stringify(journal, null, 2));
console.log('erreurs', journal.erreurs);
await navigateur.close();
