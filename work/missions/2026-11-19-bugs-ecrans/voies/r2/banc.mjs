// Voie r2 : banc local `?dev-local` (fixture SIMULÉE posée en mémoire, jamais Firestore réel).
// Usage : node scripts/with_server.mjs --server "npm run dev" --port 3104 --env PORT=3104 -- node work/missions/2026-11-19-bugs-ecrans/voies/r2/banc.mjs <mode> [prefixe]
// modes : fiche (recette : empâtage, levure, houblons, conduite), nolo (Identité NOLO), mesure (chiffres seuls, sans capture)
import puppeteer from 'puppeteer-core';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const sortie = resolve(dirname(fileURLToPath(import.meta.url)), 'captures');
await mkdir(sortie, { recursive: true });
const port = (process.env.WITH_SERVER_PORTS || '3104').split(',')[0];
const [mode = 'fiche', prefixe = 'apres'] = process.argv.slice(2);
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
const navigateur = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const tailles = [{ nom: '390', w: 390, h: 844, mobile: true }, { nom: '1280', w: 1280, h: 900, mobile: false }].filter((t) => !process.env.SEUL || t.nom === process.env.SEUL);
const rapport = [];

const recette = () => ({
  id: 'r2-fixture', name: 'ZZ TEST — Pale Ale', style: '18B', volumeL: 20, boilMin: 60, ogTarget: 1.050, colorEbc: 12, efficiencyPct: 75,
  fermentables: [{ name: 'Pale Ale', kind: 'grain', use: 'empatage', weightKg: 4.6, potentialPpg: 37, colorEbc: 7 }],
  mash: { steps: [{ name: 'Palier protéique', tempC: 44, durationMin: 15 }, { name: 'Empâtage', tempC: 66, durationMin: 60 }], mashoutEnabled: false },
  hops: [{ name: 'Nugget', alpha: 13, weightG: 20, stage: 'boil', timeMin: 60 }, { name: 'Citra', alpha: 12, weightG: 30, stage: 'boil', timeMin: 10 }],
  yeast: { name: 'Wyeast 3068', form: 'liquide', qty: 125, unit: 'mL', pitchTempC: 19 },
  fermentation: [{ name: 'Primaire', tempC: 19, days: 10 }],
  createdAt: '2026-11-19T10:00:00.000Z', updatedAt: '2026-11-19T10:00:00.000Z',
});

const clic = (page, re, sel = 'button,[role=button],[role=tab],summary') => page.evaluate((src, s) => {
  const r = new RegExp(src, 'i');
  const b = [...document.querySelectorAll(s)].find((x) => r.test((x.getAttribute('aria-label') || x.textContent || '').trim()) && x.getClientRects().length);
  if (b) { b.click(); return true; } return false;
}, re.source, sel);

// Vrai toucher (souris ou tactile) au centre de l'élément visible : les onglets et les lignes de l'app n'écoutent pas un `.click()` synthétique.
async function toucher(page, re, sel = 'button,[role=button],[role=tab],summary,a') {
  const c = await page.evaluate((src, s) => {
    const r = new RegExp(src, 'i');
    const b = [...document.querySelectorAll(s)].find((x) => r.test((x.getAttribute('aria-label') || x.textContent || '').trim()) && x.getClientRects().length);
    if (!b) return null;
    b.scrollIntoView({ block: 'center' }); const q = b.getBoundingClientRect();
    return { x: q.x + q.width / 2, y: q.y + q.height / 2 };
  }, re.source, sel);
  if (!c) { rapport.push(`toucher introuvable : ${re} (${(await page.evaluate((s) => [...document.querySelectorAll(s)].map((x) => (x.getAttribute('aria-label') || x.textContent || '').trim().slice(0, 25)).filter(Boolean).slice(0, 25).join(' | '), sel))})`); return false; }
  await page.mouse.click(c.x, c.y); return true;
}

async function ouvrir(t, theme, url) {
  const contexte = await navigateur.createBrowserContext(); const page = await contexte.newPage();
  await page.setViewport({ width: t.w, height: t.h, deviceScaleFactor: 1, isMobile: t.mobile, hasTouch: t.mobile });
  await page.evaluateOnNewDocument((th) => { localStorage.setItem('laffinee.theme', th); }, theme);
  page.on('pageerror', (e) => rapport.push(`erreur page ${theme} ${t.nom} : ${e.message}`));
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
  return { page, contexte };
}

async function fiche(t, theme) {
  const { page, contexte } = await ouvrir(t, theme, `http://localhost:${port}/?dev-local`);
  await page.waitForFunction(() => !!document.querySelector('[aria-label="Actions rapides"]'), { timeout: 170000 });
  await attendre(1500);
  await page.evaluate(async (r) => { const { StorageService } = await import('/src/services/storage.ts'); StorageService.saveRecipes([r]); }, recette());
  await attendre(600);
  // Recettes : onglet Production > Recettes, puis la fiche.
  await clic(page, /^(Production|Brassins)$/); await attendre(700);
  rapport.push('après Brassins : ' + (await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 140))));
  // k3 : la liste s'ouvre sur « Brassins » ; la recette est derrière « Recettes 1 » (compteur), puis un toucher sur la ligne.
  rapport.push(`toucher Recettes : ${await toucher(page, /^Recettes/,'button,[role=button],[role=tab],a')}`); await attendre(1200);
  rapport.push('après Recettes N : ' + (await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 160))));
  // Ligne de la recette (vrai toucher) → feuille → « OG … · couleur, alcool » ouvre la fiche.
  const nom = await toucher(page, /ZZ TEST — Pale Ale/, 'button,a,[role=button],article,li,h3,h4,strong,span,p');
  await attendre(1000);
  const detail = await toucher(page, /couleur, alcool|Couleur, alcool, détail/, 'button.rcp-detail,button'); await attendre(2200);
  rapport.push(String(theme) + ' ' + t.nom + ' ligne : ' + nom + ' ; détail : ' + detail + ' ; ' + (await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 200))));
  if (!nom || !detail) throw new Error('recette ou détail introuvable : le premier essai à froid arrive avant la fin du chargement ; la boucle recommence');
  // Déplier ce qui est replié (aria-expanded="false" ou <details> fermé), dans l'ordre de la fiche : Houblons, levure, Empâtage, Fermentation.
  for (const re of [/^Détail des ajouts/, /^Wyeast|^Levure/, /^Empâtage/, /^Ébullition/, /^Fermentation/]) {
    rapport.push(re.source + ' : ' + await toucher(page, re, 'button[aria-expanded="false"],details:not([open])>summary')); await attendre(700);
  }
  const lire = () => page.evaluate(() => {
    const svg = document.querySelector('[data-booster="courbe-empatage"]');
    const textes = svg ? [...svg.querySelectorAll('text')].map((x) => x.textContent + ' | ' + getComputedStyle(x).fontFamily.slice(0, 22)) : null;
    const T = document.body.innerText;
    return { courbe: !!svg, textes, produit: /Produit exact non choisi/.test(T), conditionnement: /Conditionnement et vendeur à choisir/.test(T), avant: /AVANT/.test(T), ebullition: /avant la fin de l’ébullition/.test(T), trouver: /Trouver une conduite/.test(T) };
  });
  rapport.push(theme + ' ' + t.nom + ' mesure : ' + JSON.stringify(await lire()));
  const voir = async (re, nomFichier) => {
    const ok = await page.evaluate((src) => { const r = new RegExp(src); const n = [...document.querySelectorAll('h2,h3,h4,button,summary,span,p,small,strong,svg')].find((x) => r.test(x.textContent || '') && x.getClientRects().length && (x.children.length < 4 || x.tagName === 'svg')); if (n) n.scrollIntoView({ block: 'center' }); return !!n; }, re.source);
    await attendre(400); await page.screenshot({ path: sortie + '/' + prefixe + '-' + nomFichier + '-' + t.nom + '-' + theme + '.png' }); rapport.push(nomFichier + ' ' + t.nom + ' ' + theme + ' : cible trouvée ' + ok);
  };
  await voir(/avant la fin de l’ébullition/, 'fiche-ebullition');
  await voir(/66 °C/, 'fiche');
  // La conduite : « Simuler une variante de levure » ouvre l'atelier avec ses deux boutons (BR-100) et le catalogue (BK2-4).
  const variante = await toucher(page, /^Simuler une variante de levure/, 'button'); await attendre(1500);
  rapport.push('variante : ' + variante);
  if (await toucher(page, /^Trouver une conduite/, 'button')) {
    await attendre(1000);
    const bouton = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /^Trouver une conduite/.test(x.textContent.trim())); const c = getComputedStyle(b); return { pressed: b.getAttribute('aria-pressed'), bordure: c.borderTopColor, fond: c.backgroundColor, poids: c.fontWeight }; });
    rapport.push(theme + ' ' + t.nom + ' bouton choisi : ' + JSON.stringify(bouton));
    await voir(/Trouver une conduite/, 'fiche-conduite');
    await toucher(page, /^Comparer les souches et affiner/, 'summary'); await attendre(800);
    if (await toucher(page, /^Chercher dans toutes les levures/, 'summary')) {
      await attendre(2500);
      const n = await page.evaluate(() => (document.body.innerText.match(/(\d[\d  ]*|Aucune|1) référence[s]? trouvée[s]?/) || [null])[0]);
      rapport.push(theme + ' ' + t.nom + ' catalogue : ' + n);
      await voir(/références? trouvées?|Aucune référence trouvée/, 'fiche-catalogue');
    }
  }
  await contexte.close();
}

const urlNolo = (p) => `http://localhost:${p}/?dev-local&etape=houblons&recette=identite`;
async function nolo(t, theme) {
  const { page, contexte } = await ouvrir(t, theme, urlNolo(port));
  await page.waitForSelector('body[data-apercu]', { timeout: 120000 }).catch(() => rapport.push('pas de body[data-apercu]'));
  await attendre(900);
  await clic(page, /^Identité$/); await attendre(600);
  const sw = await page.$('[aria-label="Objectif NOLO · ≤ 0,5 %"]');
  if (sw) { if ((await page.$eval('[aria-label="Objectif NOLO · ≤ 0,5 %"]', (e) => e.getAttribute('aria-checked'))) !== 'true') await sw.click(); }
  await attendre(1200);
  await clic(page, /Adapter à mon matériel/); await attendre(1500);
  // k3 : une page blanche ou un écran de chargement ne se capture pas ; on attend le bouton, sinon l'essai échoue et la boucle recommence.
  await page.waitForSelector('.nolo-solver-apply', { visible: true, timeout: 25000 });
  await page.$eval('.nolo-solver-apply', (e) => e.scrollIntoView({ block: 'center' }));
  await attendre(400);
  const mesurer = () => page.evaluate(() => {
    const b = document.querySelector('.nolo-solver-apply'); if (!b) return null;
    const c = getComputedStyle(b);
    const lum = (s) => { const v = (s.match(/[\d.]+/g) || []).slice(0, 3).map(Number).map((x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
    const l1 = lum(c.color), l2 = lum(c.backgroundColor);
    return { fond: c.backgroundColor, encre: c.color, filtre: c.filter, desactive: b.disabled, contraste: +((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)).toFixed(2) };
  });
  rapport.push(theme + ' ' + t.nom + ' Appliquer (repos) : ' + JSON.stringify(await mesurer()));
  const phrases = await page.evaluate(() => [...document.querySelectorAll('figure.nolo-simulation-range p')].map((p) => p.textContent));
  rapport.push(theme + ' ' + t.nom + ' phrases : ' + JSON.stringify(phrases));
  await page.screenshot({ path: sortie + '/' + prefixe + '-nolo-' + t.nom + '-' + theme + '.png' });
  if (!t.mobile) {
    await page.hover('.nolo-solver-apply'); await attendre(400);
    rapport.push(theme + ' ' + t.nom + ' Appliquer (survol) : ' + JSON.stringify(await mesurer()));
    await page.screenshot({ path: sortie + '/' + prefixe + '-nolo-survol-' + t.nom + '-' + theme + '.png' });
  }
  await contexte.close();
}

try {
  for (const theme of ['clair', 'cave'].filter((t) => !process.env.THEME || t === process.env.THEME)) for (const t of tailles) {
    for (let essai = 1; essai <= 3; essai++) {
      try { await (mode === 'nolo' ? nolo : fiche)(t, theme); break; } catch (e) { rapport.push(`${theme} ${t.nom} essai ${essai} : ${String(e?.message ?? e).slice(0, 140)}`); }
    }
  }
} finally { await navigateur.close(); }
console.log(rapport.join('\n'));
