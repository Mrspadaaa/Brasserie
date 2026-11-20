// Voie ct4b : banc local `?dev-local` (recette SIMULÉE posée en mémoire, jamais Firestore réel).
// Usage : node scripts/with_server.mjs --server "npm run dev" --port 3111 --env PORT=3111 -- node work/missions/2026-11-19-bugs-ecrans/voies/ct4b/banc.mjs <prefixe>
// Env : SEUL=390|844|1280, THEME=clair|cave. Captures : voies/ct4b/captures/<prefixe>-<ecran>-<taille>-<theme>.png
// Parcours : liste Recettes, aperçu (feuille), fiche, éditeur étape par étape (Modifier, puis « Suivant »).
import puppeteer from 'puppeteer-core';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const sortie = resolve(dirname(fileURLToPath(import.meta.url)), 'captures');
await mkdir(sortie, { recursive: true });
const port = (process.env.WITH_SERVER_PORTS || '3111').split(',')[0];
const [prefixe = 'apres'] = process.argv.slice(2);
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
const navigateur = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const tailles = [
  { nom: '390', w: 390, h: 844, mobile: true },
  { nom: '844', w: 844, h: 340, mobile: true },
  { nom: '1280', w: 1280, h: 900, mobile: false },
].filter((t) => !process.env.SEUL || t.nom === process.env.SEUL);
const rapport = [];

const recette = () => ({
  id: 'ct4b-fixture', name: 'ZZ TEST — American IPA', style: '21A', volumeL: 30, boilMin: 60, ogTarget: 1.066, colorEbc: 14, efficiencyPct: 75,
  fermentables: [{ name: 'Pilsner', kind: 'grain', use: 'empatage', weightKg: 6.2, potentialPpg: 37, colorEbc: 3 }],
  mash: { steps: [{ name: 'Empâtage', tempC: 66, durationMin: 60 }], mashoutEnabled: false },
  hops: [
    { name: 'Nugget', alpha: 13, weightG: 20, stage: 'boil', timeMin: 60 },
    { name: 'Citra', alpha: 12, weightG: 60, stage: 'boil', timeMin: 20 },
    { name: 'Citra', alpha: 12, weightG: 80, stage: 'dryHop', timeMin: 4320 },
  ],
  yeast: { name: 'SafAle US-05', form: 'sèche', qty: 11.5, unit: 'g', pitchTempC: 19 },
  fermentation: [{ name: 'Primaire', tempC: 19, days: 10 }],
  createdAt: '2026-11-19T10:00:00.000Z', updatedAt: '2026-11-19T10:00:00.000Z',
});

async function toucher(page, re, sel = 'button,[role=button],[role=tab],summary,a') {
  const c = await page.evaluate((src, s) => {
    const r = new RegExp(src, 'i');
    const b = [...document.querySelectorAll(s)].find((x) => r.test((x.getAttribute('aria-label') || x.textContent || '').trim()) && x.getClientRects().length);
    if (!b) return null;
    b.scrollIntoView({ block: 'center' }); const q = b.getBoundingClientRect();
    return { x: q.x + q.width / 2, y: q.y + q.height / 2 };
  }, re.source, sel);
  if (!c) { rapport.push(`toucher introuvable : ${re}`); return false; }
  await page.mouse.click(c.x, c.y); return true;
}

async function parcours(t, theme) {
  const contexte = await navigateur.createBrowserContext(); const page = await contexte.newPage();
  await page.setViewport({ width: t.w, height: t.h, deviceScaleFactor: 1, isMobile: t.mobile, hasTouch: t.mobile });
  await page.evaluateOnNewDocument((th) => { localStorage.setItem('laffinee.theme', th); }, theme);
  page.on('pageerror', (e) => rapport.push(`erreur page ${theme} ${t.nom} : ${e.message}`));
  await page.goto(`http://localhost:${port}/?dev-local`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => !!document.querySelector('[aria-label="Actions rapides"]'), { timeout: 170000 });
  await attendre(1500);
  await page.evaluate(async (r) => { const { StorageService } = await import('/src/services/storage.ts'); StorageService.saveRecipes([r]); }, recette());
  await attendre(600);
  const bas = () => page.evaluate(() => { [...document.querySelectorAll('*')].filter((n) => n.scrollHeight > n.clientHeight + 20 && /auto|scroll/.test(getComputedStyle(n).overflowY)).forEach((n) => { n.scrollTop = n.scrollHeight; }); });
  const largeurs = () => page.evaluate(() => { const m = document.querySelector('main') || document.body; const f = [...m.querySelectorAll('section,article,[class*=rounded]')].filter((n) => n.getClientRects().length && n.getBoundingClientRect().width > 200).slice(0, 3).map((n) => Math.round(n.getBoundingClientRect().width)); return f; });
  const photo = async (nom) => { await attendre(500); await page.screenshot({ path: `${sortie}/${prefixe}-${nom}-${t.nom}-${theme}.png` }); };
  for (let k = 0; k < 6; k++) {
    await toucher(page, /^(Production|Brassins)$/); await attendre(1200);
    if (await toucher(page, /^Recettes/, 'button,[role=button],[role=tab],a')) break;
    await attendre(2500);
  }
  await attendre(1500);
  await photo('01-liste');
  if (!(await toucher(page, /ZZ TEST — American IPA/, 'button,a,[role=button]'))) throw new Error('recette introuvable');
  await attendre(1000); await photo('02-apercu');
  if (!(await toucher(page, /couleur, alcool|Couleur, alcool, détail/, 'button'))) throw new Error('détail introuvable');
  await attendre(2500); await photo('03-fiche');
  if (t.nom !== '844') {
    await page.evaluate(() => { const b = [...document.querySelectorAll('[data-booster="tableau-moments"]')][0]; if (b) b.scrollIntoView({ block: 'center' }); });
    await photo('04-fiche-houblons');
  }
  if (!(await toucher(page, /^Modifier/, 'button'))) throw new Error('Modifier introuvable');
  await page.waitForFunction(() => [...document.querySelectorAll('button')].some((b) => /^Suivant/.test(b.textContent.trim())), { timeout: 90000 }); await attendre(1500); await photo('10-wiz-1'); await bas(); await photo('10-wiz-1-bas');
  for (let i = 2; i <= 7; i++) {
    const ok = await toucher(page, /^Suivant/, 'button'); await attendre(1800);
    if (!ok) { rapport.push(`étape ${i} : Suivant introuvable`); break; }
    await photo(`1${i - 1}-wiz-${i}`); await bas(); await photo(`1${i - 1}-wiz-${i}-bas`);
    rapport.push(`${theme} ${t.nom} étape ${i} largeur : ${JSON.stringify(await largeurs())}`);
  }
  await contexte.close();
}

try {
  for (const theme of ['clair', 'cave'].filter((x) => !process.env.THEME || x === process.env.THEME)) for (const t of tailles) {
    for (let essai = 1; essai <= 3; essai++) {
      try { await parcours(t, theme); break; } catch (e) { rapport.push(`${theme} ${t.nom} essai ${essai} : ${String(e?.message ?? e).slice(0, 140)}`); }
    }
  }
} finally { await navigateur.close(); }
await writeFile(`${sortie}/${prefixe}-rapport.txt`, rapport.join('\n'));
console.log(rapport.join('\n'));
