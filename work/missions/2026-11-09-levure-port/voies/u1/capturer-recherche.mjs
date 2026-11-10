// La cellule de recherche « ⌕ » à 390 (verdict 2, N1) : Ma levure et Comparer, en vol « recherche… · n/20 », « à confirmer » et l'issue d'échec, thèmes clair et cave.
// La réponse « à confirmer » est SIMULÉE (banc `&recherche=simulee`, aucun appel IA) ; l'issue d'échec vient du réseau bloqué, retardé de 6 s.
// Lancement : node scripts/with_server.mjs --server "npm run dev -- --port 5656 --strictPort" --port 5656 --env VITE_HOP_V4=on --env VITE_FIREBASE_API_KEY=fake -- node <ce fichier> --sortie=<dossier>
import puppeteer from 'puppeteer-core';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const port = (process.env.WITH_SERVER_PORTS || '5656').split(',')[0];
const base = `http://127.0.0.1:${port}`;
const sortie = resolve(process.argv.find(a => a.startsWith('--sortie='))?.slice(9) ?? 'captures');
await mkdir(sortie, { recursive: true });
const attendre = ms => new Promise(fin => setTimeout(fin, ms));
const navigateur = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--no-first-run'] });
const journal = { notes: [], erreurs: [] };
let retard = false;

async function ouvrir(chemin, theme) {
  const contexte = await navigateur.createBrowserContext();
  const page = await contexte.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  page.on('pageerror', e => journal.erreurs.push(e.message));
  await page.setRequestInterception(true);
  page.on('request', async r => {
    const u = new URL(r.url());
    if (u.origin === base || ['data:', 'blob:'].includes(u.protocol) || /fonts\.g/.test(u.hostname)) return r.continue();
    if (retard) await attendre(6000);
    return r.abort().catch(() => {});
  });
  await page.evaluateOnNewDocument(t => { try { localStorage.setItem('laffinee.theme', t); } catch { /* */ } }, theme);
  await page.goto(base + chemin, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-lv="etape"]', { timeout: 90000 });
  await attendre(1500);
  return { page, contexte };
}
const prise = async (nom, page) => { await page.screenshot({ path: resolve(sortie, `${nom}.png`) }); console.log('CAPTURE ' + nom); };
const cellules = page => page.evaluate(() => [...document.querySelectorAll('[data-recherche]')].map(e => {
  const r = e.getBoundingClientRect(), pere = e.parentElement.getBoundingClientRect();
  return { etat: e.getAttribute('data-recherche'), texte: e.textContent.trim().replace(/\s+/g, ' '), droite: Math.round(r.right), largeurEcran: window.innerWidth, depasse: r.right > window.innerWidth || r.left < 0, coupe: e.scrollWidth > e.clientWidth + 1 };
}));

for (const theme of ['clair', 'cave']) {
  // Ma levure : floculation, simulée
  let { page, contexte } = await ouvrir('/?dev-local&etape=levure&recherche=simulee', theme);
  await page.evaluate(() => document.querySelector('[data-cel="floculation"] .lv-ch')?.click()); await attendre(600);
  await prise(`ma-levure-en-vol-${theme}`, page);
  journal.notes.push({ theme, vue: 'ma-levure', temps: 'vol', cellules: await cellules(page) });
  await attendre(3500);
  await prise(`ma-levure-a-confirmer-${theme}`, page);
  journal.notes.push({ theme, vue: 'ma-levure', temps: 'a-confirmer', cellules: await cellules(page) });
  // une ligne d'effet, aussi (thiols)
  await page.evaluate(() => document.querySelector('[data-axe="thiols"] .lv-ch')?.click()); await attendre(600);
  await prise(`ma-levure-ligne-en-vol-${theme}`, page);
  journal.notes.push({ theme, vue: 'ma-levure-ligne', temps: 'vol', cellules: await cellules(page) });
  await contexte.close();
  // Comparer, simulée
  ({ page, contexte } = await ouvrir('/?dev-local&etape=levure&recherche=simulee', theme));
  await page.evaluate(() => [...document.querySelectorAll('[role="tab"]')].find(t => /Comparer/.test(t.textContent))?.click()); await attendre(1200);
  const clique = await page.evaluate(() => { const b = [...document.querySelectorAll('[data-vue="comparer"] button, [role="tabpanel"] button')].find(x => /non documenté|à chercher|⌕|chercher la donnée/i.test((x.getAttribute('aria-label') || '') + x.textContent)); b?.click(); return !!b; });
  journal.notes.push({ theme, vue: 'comparer', clique }); await attendre(600);
  await prise(`comparer-en-vol-${theme}`, page);
  journal.notes.push({ theme, vue: 'comparer', temps: 'vol', cellules: await cellules(page) });
  await attendre(3500);
  await prise(`comparer-a-confirmer-${theme}`, page);
  journal.notes.push({ theme, vue: 'comparer', temps: 'a-confirmer', cellules: await cellules(page) });
  await contexte.close();
  // l'issue d'échec (réseau bloqué, réponse retardée de 6 s)
  retard = true;
  ({ page, contexte } = await ouvrir('/?dev-local&etape=levure', theme));
  await page.evaluate(() => document.querySelector('[data-cel="floculation"] .lv-ch')?.click()); await attendre(8000);
  await prise(`ma-levure-issue-${theme}`, page);
  journal.notes.push({ theme, vue: 'ma-levure', temps: 'issue', cellules: await cellules(page) });
  await contexte.close(); retard = false;
}
await navigateur.close();
await writeFile(resolve(sortie, 'journal-recherche.json'), JSON.stringify(journal, null, 1));
console.log('FIN erreurs=' + journal.erreurs.length);
