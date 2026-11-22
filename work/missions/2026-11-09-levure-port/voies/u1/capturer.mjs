// Captures de l'étape Levure portée (voie u1, mission 2026-11-09-levure-port) : Ma levure au repos, un « + » touché, un × touché,
// la recette sans levure, « ⌕ » touché ; 390 tactile et 1280, thème clair puis thème sombre (le bouton du thème de l'app).
// Lancement depuis la racine du dépôt :
//   node scripts/with_server.mjs --server "npm run dev -- --port 5656 --strictPort" --port 5656 --env VITE_HOP_V4=on --env VITE_FIREBASE_API_KEY=fake -- node work/missions/2026-11-09-levure-port/voies/u1/capturer.mjs --sortie=work/missions/2026-11-09-levure-port/voies/u1/captures
// Rien n'est écrit dans les données : ?dev-local, réseau hors localhost bloqué.
import puppeteer from 'puppeteer-core';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const arg = (nom, defaut) => process.argv.find(a => a.startsWith(`--${nom}=`))?.slice(nom.length + 3) ?? defaut;
const port = (process.env.WITH_SERVER_PORTS || '5656').split(',')[0];
const base = `http://127.0.0.1:${port}`;
const sortie = resolve(arg('sortie', 'captures'));
await mkdir(sortie, { recursive: true });
const attendre = ms => new Promise(fin => setTimeout(fin, ms));
const navigateur = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--mute-audio', '--no-first-run'] });
const journal = { base, erreurs: [], bloques: [], captures: [], notes: [] };

async function ouvrir(chemin, largeur, hauteur, mobile, theme) {
  const contexte = await navigateur.createBrowserContext();
  const page = await contexte.newPage();
  await page.setViewport({ width: largeur, height: hauteur, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
  page.on('pageerror', e => journal.erreurs.push(e.message));
  page.on('console', m => { if (m.type() === 'error') journal.erreurs.push('console: ' + m.text().slice(0, 200)); });
  await page.setRequestInterception(true);
  page.on('request', async r => {
    const u = new URL(r.url());
    if (u.origin === base || ['data:', 'blob:'].includes(u.protocol) || ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(u.hostname)) return r.continue();
    journal.bloques.push(u.origin);
    // Le service IA n'est jamais joint (réseau bloqué) ; pour VOIR « recherche… · n/20 », la réponse d'échec est retardée de 6 s.
    if (globalThis.__retard) await attendre(6000);
    return r.abort().catch(() => {});
  });
  await page.evaluateOnNewDocument(t => { try { localStorage.setItem('laffinee.theme', t); } catch { /* */ } }, theme);
  await page.goto(base + chemin, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-lv="etape"]', { timeout: 90000 });
  await attendre(1500);
  return { page, contexte };
}
async function capturer(nom, page) {
  const fichier = resolve(sortie, `${nom}.png`);
  await page.screenshot({ path: fichier, fullPage: false });
  journal.captures.push(nom); console.log('CAPTURE ' + nom);
}
async function defiler(page, sel) { await page.evaluate(s => document.querySelector(s)?.scrollIntoView({ block: 'start' }), sel); await attendre(400); }
const lire = (page, f) => page.evaluate(f);

const formats = [['390', 390, 844, true], ['1280', 1280, 900, false]];
for (const theme of ['clair', 'cave']) for (const [nom, w, h, mobile] of formats) {
  const suffixe = `${nom}-${theme}`;
  // 1. repos
  let { page, contexte } = await ouvrir('/?dev-local&etape=levure', w, h, mobile, theme);
  await capturer(`1-repos-${suffixe}`, page);
  const repos = await lire(page, () => ({
    effets: [...document.querySelectorAll('[data-axe]')].map(e => e.getAttribute('data-axe') + ':' + e.getAttribute('data-genre') + ':' + e.textContent.trim().replace(/\s+/g, ' ')),
    dose: document.querySelector('[data-lv="dose"]')?.textContent, plus: document.querySelectorAll('.lv-plus').length, moins: document.querySelectorAll('.lv-moins').length,
    paliers: document.querySelector('.lv-cond-sous')?.textContent,
  }));
  journal.notes.push({ suffixe, repos });
  await defiler(page, '.lv-cond');
  await capturer(`1b-conduite-${suffixe}`, page);
  // 2. « + » touché : entre les paliers 2 et 3 (l5b cadre 6, version du milieu), puis sur la fin J12 (cadre 6)
  for (const [nomEtat, frontiere] of [['plus-entre', 1], ['plus-fin', 3]]) {
    if (nomEtat === 'plus-fin') { await contexte.close(); ({ page, contexte } = await ouvrir('/?dev-local&etape=levure', w, h, mobile, theme)); await defiler(page, '.lv-cond'); }
    await page.evaluate(() => document.querySelector('[data-phase-select="1"]')?.click()); await attendre(400);
    await page.click(`.lv-plus[data-frontiere="${frontiere}"]`); await attendre(700);
    await capturer(`2-${nomEtat}-${suffixe}`, page);
    journal.notes.push({ suffixe, nomEtat, sous: await lire(page, () => ({ sous: document.querySelector('.lv-cond-sous')?.textContent, boite: document.querySelector('[data-inconnu]')?.textContent, texteSvg: [...document.querySelectorAll('svg[data-plot-bottom] text')].map(t => t.textContent).join('|') })) });
  }
  await contexte.close();
  // 3. un × touché : le palier 2 est touché, puis son × (page neuve : la conduite est complète)
  ({ page, contexte } = await ouvrir('/?dev-local&etape=levure', w, h, mobile, theme));
  await defiler(page, '.lv-cond');
  await page.evaluate(() => document.querySelector('[data-phase-select="1"]')?.click()); await attendre(500);
  await capturer(`2b-palier-2-touche-${suffixe}`, page);
  const aRetirer = await page.$('.lv-moins');
  if (aRetirer) { await aRetirer.click(); await attendre(700); }
  await capturer(`3-croix-touchee-${suffixe}`, page);
  journal.notes.push({ suffixe, apresCroix: await lire(page, () => ({ sous: document.querySelector('.lv-cond-sous')?.textContent, dit: document.querySelector('.lv-cond-dit')?.textContent })) });
  await contexte.close();
  // 4. recette sans levure
  ({ page, contexte } = await ouvrir('/?dev-local&etape=levure&recette=vide', w, h, mobile, theme));
  await capturer(`4-sans-levure-${suffixe}`, page);
  await contexte.close();
  // 5. ⌕ touché
  globalThis.__retard = true;
  ({ page, contexte } = await ouvrir('/?dev-local&etape=levure', w, h, mobile, theme));
  const chercher = await page.$('.lv-ch');
  if (chercher) { await chercher.click(); await attendre(250); } else journal.notes.push({ suffixe, ch: 'aucun « non documenté » à toucher' });
  await capturer(`5-chercher-touche-${suffixe}`, page);
  journal.notes.push({ suffixe, recherche: await lire(page, () => [...document.querySelectorAll('[data-recherche]')].map(e => e.getAttribute('data-recherche') + ':' + e.textContent.trim())) , vue: await lire(page, () => document.querySelector('[data-lv="etape"]')?.getAttribute('data-vue')) });
  await contexte.close(); globalThis.__retard = false;
}
await navigateur.close();
await writeFile(resolve(sortie, 'journal.json'), JSON.stringify(journal, null, 1));
console.log('JOURNAL erreurs=' + journal.erreurs.length + ' bloques=' + journal.bloques.length);
