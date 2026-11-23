// Banc commun de l'analyse transversale (principes) : app locale port-carnet, ?dev-local, fixtures « ZZ TEST » en cache mémoire.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

export const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const ici = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'));
export const DOSSIER = path.join(ici, 'captures');
fs.mkdirSync(DOSSIER, { recursive: true });

export async function ouvrir({ largeur = 390, port = 3177, theme = 'clair' } = {}) {
  const mobile = largeur < 700;
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: largeur, height: mobile ? 844 : 800, hasTouch: mobile, isMobile: mobile, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.log('PAGEERROR', String(e).slice(0, 200)));
  await page.setRequestInterception(true);
  page.on('request', (r) => { const u = r.url(); if (/^https?:\/\/(localhost|127\.0\.0\.1)/.test(u) || u.startsWith('data:') || u.startsWith('blob:')) r.continue(); else r.abort(); });
  await page.evaluateOnNewDocument(() => { window.WebSocket = class { constructor() {} send() {} close() {} addEventListener() {} removeEventListener() {} }; });
  await page.evaluateOnNewDocument((t) => { try { localStorage.setItem('laffinee.theme', t); } catch {} }, theme);
  await page.goto(`http://localhost:${port}/?dev-local`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  for (let k = 0; k < 4; k++) { const ok = await page.waitForFunction(() => document.querySelectorAll('button').length > 5, { timeout: 40000 }).then(() => true, () => false); if (ok) break; console.log('RECHARGE', k); await page.reload({ waitUntil: 'domcontentloaded' }); }
  await pause(4000);
  await semer(page);
  await pause(1500);
  return { browser, page };
}

export async function semer(page) {
  return page.evaluate(async () => {
    const { FirestoreRepo } = await import('/src/services/firestoreRepo.ts');
    const d = (j, m, a = 2026) => `${String(j).padStart(2, '0')}.${String(m).padStart(2, '0')}.${a}`;
    const put = (c, id, o) => FirestoreRepo.put(c, id, { id, ...o });
    const stock = [
      ['ZZ-M1', 'ZZ TEST Pale Ale malt', 'Malt', 'kg', 18, 2.1], ['ZZ-M2', 'ZZ TEST Caramunich II', 'Malt', 'kg', 3, 3.4],
      ['ZZ-M3', 'ZZ TEST Avoine', 'Malt', 'kg', 4, 2.8], ['ZZ-H1', 'ZZ TEST Citra', 'Houblon', 'g', 450, 0.09],
      ['ZZ-H2', 'ZZ TEST Nelson Sauvin', 'Houblon', 'g', 200, 0.12], ['ZZ-L1', 'ZZ TEST US-05', 'Levure', 'sachet', 3, 4.5],
      ['ZZ-E1', 'ZZ TEST Bouteille 33 cl', 'Emballage', 'pce', 240, 0.32], ['ZZ-C1', 'ZZ TEST Soude', 'CIP alcalin', 'kg', 2, 6],
    ];
    for (const [id, name, category, unit, q, p] of stock) await put('stockItems', id, { ref: id, name, category, unit, currentStock: q, minStock: q / 3, reorder: false, pricePerUnit: p, alphaPct: category === 'Houblon' ? 12 : undefined });
    const recette = { name: 'ZZ TEST IPA Noël', style: 'American IPA', volumeL: 25, boilMin: 60, version: 1, og: '1.062',
      fermentables: [{ name: 'ZZ TEST Pale Ale malt', weightKg: 5.5, kind: 'grain', use: 'empatage' }, { name: 'ZZ TEST Caramunich II', weightKg: 0.3, kind: 'grain', use: 'empatage' }],
      hops: [{ name: 'ZZ TEST Citra', grams: 30, timeMin: 60, alphaPct: 12, use: 'boil' }, { name: 'ZZ TEST Citra', grams: 80, timeMin: 0, alphaPct: 12, use: 'dryhop' }],
      createdAt: new Date().toISOString() };
    await put('recipes', 'ZZ-R1', recette);
    await put('batches', 'ZZ-LOT-1', { name: 'ZZ TEST IPA Noël', style: 'American IPA', volumeL: 25, status: 'fermentation', brewDate: d(12, 11), plannedBrewDate: d(12, 11), og: '1.062', recipeRef: 'ZZ-R1', recipeSnapshot: { ...recette, id: 'x', capturedAt: new Date().toISOString() }, gravityLog: [{ date: d(12, 11), sg: 1.062, tempC: 19 }, { date: d(16, 11), sg: 1.030, tempC: 19 }], stockAccountingVersion: 1 });
    await put('batches', 'ZZ-LOT-2', { name: 'ZZ TEST Stout', style: 'Stout', volumeL: 25, status: 'planifie', brewDate: d(5, 12), plannedBrewDate: d(5, 12), recipeRef: 'ZZ-R1', gravityLog: [], stockAccountingVersion: 1 });
    await put('batches', 'ZZ-LOT-3', { name: 'ZZ TEST Pale', style: 'Pale Ale', volumeL: 25, status: 'termine', brewDate: d(2, 10), plannedBrewDate: d(2, 10), bottlingDate: d(20, 10), abv: '5,1', recipeRef: 'ZZ-R1', recipeSnapshot: { ...recette, id: 'y', capturedAt: new Date().toISOString() }, gravityLog: [], stockAccountingVersion: 1 });
    await put('clients', 'ZZ-CL1', { name: 'ZZ TEST Bar du Port', type: 'Pro', contact: 'ZZ', phone: '000', email: 'zz@test.invalid' });
    await put('transactions', 'ZZ-T1', { date: d(14, 11), description: 'ZZ TEST Vente 24 bouteilles', amountHT: 120, tvaRate: 0.026, tvaAmount: 3.12, amountTTC: 123.12, category: 'recettes', subcategory: 'Ventes bière' });
    await put('transactions', 'ZZ-T2', { date: d(10, 11), description: 'ZZ TEST Achat malt', amountHT: -80, tvaRate: 0.026, tvaAmount: -2.08, amountTTC: -82.08, category: 'brassage', subcategory: 'Matières premières' });
    await put('creativeItems', 'ZZ-P1', { type: 'carnet', title: 'ZZ TEST Fermenteur conique 60 L', status: 'idea', estimatedCost: 900 });
    await put('creativeItems', 'ZZ-P2', { type: 'recipe-idea', title: 'ZZ TEST Bière de Noël épicée', status: 'idea' });
    return 'ok';
  });
}

export const cliquer = (page, txt, { exact = false, dernier = false } = {}) => page.evaluate((t, ex, der) => {
  const tous = [...document.querySelectorAll('button, a, [role=button], [role=tab], summary')].filter((x) => x.offsetParent || x.getClientRects().length);
  const ok = (x) => { const s = (x.getAttribute('aria-label') || x.textContent || '').trim().replace(/\s+/g, ' '); return ex ? s === t : s.startsWith(t); };
  const liste = tous.filter(ok); const b = der ? liste.at(-1) : liste[0];
  if (b) { b.click(); return true; } return false;
}, txt, exact, dernier);

// Inventaire de l'écran visible : champs, types, mots au premier écran, boutons.
export const inventaire = (page) => page.evaluate(() => {
  const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight; };
  const champs = [...document.querySelectorAll('input, select, textarea')].filter((e) => e.type !== 'hidden' && e.getClientRects().length);
  const types = {}; for (const c of champs) { const k = c.tagName === 'INPUT' ? `${c.type}${c.inputMode ? '/' + c.inputMode : ''}` : c.tagName.toLowerCase(); types[k] = (types[k] || 0) + 1; }
  const premiers = champs.filter(vis).length;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let mots = 0; let n;
  while ((n = walker.nextNode())) { const p = n.parentElement; if (!p || !p.getClientRects().length) continue; const r = p.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) continue; if (getComputedStyle(p).visibility === 'hidden') continue; mots += (n.textContent.match(/[\p{L}\p{N}]+/gu) || []).length; }
  const boutons = [...document.querySelectorAll('button')].filter(vis).map((b) => (b.getAttribute('aria-label') || b.textContent).trim().replace(/\s+/g, ' ').slice(0, 30));
  const hautPage = document.scrollingElement.scrollHeight; const main = document.querySelector('main');
  return { champsTotal: champs.length, champsPremierEcran: premiers, types, motsPremierEcran: mots, nbBoutons: boutons.length, boutons: boutons.slice(0, 40), hautPage, mainScroll: main ? main.scrollHeight : null, titre: document.querySelector('h1,h2')?.textContent?.trim().slice(0, 60) };
});

export async function cap(page, nom, extra = {}) {
  const f = path.join(DOSSIER, `${nom}.png`);
  await page.screenshot({ path: f });
  const inv = await inventaire(page);
  console.log('ECRAN', nom, JSON.stringify({ ...inv, ...extra }));
  return inv;
}
