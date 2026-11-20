// Diagnostic : position du + (et sa case) à chaque étape de l'éditeur, 1280. Serveur Vite déjà lancé (WITH_SERVER_PORTS=3141).
import puppeteer from 'puppeteer-core';
const port = (process.env.WITH_SERVER_PORTS || '3141').split(',')[0];
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
const [w, h, mobile] = process.env.TAILLE === '390' ? [390, 844, true] : process.env.TAILLE === '844' ? [844, 340, true] : [1280, 900, false];
const navigateur = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await (await navigateur.createBrowserContext()).newPage();
await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
await page.goto(`http://localhost:${port}/?dev-local`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.waitForFunction(() => !!document.querySelector('[aria-label="Actions rapides"]'), { timeout: 170000 });
await attendre(1500);
const recette = { id: 'ct4b-fixture', name: 'ZZ TEST — American IPA', style: '21A', volumeL: 30, boilMin: 60, ogTarget: 1.066, colorEbc: 14, efficiencyPct: 75,
  fermentables: [{ name: 'Pilsner', kind: 'grain', use: 'empatage', weightKg: 6.2, potentialPpg: 37, colorEbc: 3 }], mash: { steps: [{ name: 'Empâtage', tempC: 66, durationMin: 60 }], mashoutEnabled: false },
  hops: [{ name: 'Citra', alpha: 12, weightG: 60, stage: 'boil', timeMin: 20 }], yeast: { name: 'SafAle US-05', form: 'sèche', qty: 11.5, unit: 'g', pitchTempC: 19 }, fermentation: [{ name: 'Primaire', tempC: 19, days: 10 }],
  createdAt: '2026-11-19T10:00:00.000Z', updatedAt: '2026-11-19T10:00:00.000Z' };
await page.evaluate(async (r) => { const { StorageService } = await import('/src/services/storage.ts'); StorageService.saveRecipes([r]); }, recette);
await attendre(600);
const toucher = async (re) => { const c = await page.evaluate((src) => { const r = new RegExp(src, 'i'); const b = [...document.querySelectorAll('button,[role=button],[role=tab],a')].find((x) => r.test((x.getAttribute('aria-label') || x.textContent || '').trim()) && x.getClientRects().length); if (!b) return null; b.scrollIntoView({ block: 'center' }); const q = b.getBoundingClientRect(); return { x: q.x + q.width / 2, y: q.y + q.height / 2 }; }, re.source); if (c) await page.mouse.click(c.x, c.y); return !!c; };
for (let k = 0; k < 6; k++) { await toucher(/^(Production|Brassins)$/); await attendre(1200); if (await toucher(/^Recettes/)) break; await attendre(2500); }
await attendre(1500); await toucher(/ZZ TEST — American IPA/); await attendre(1000); await toucher(/^Modifier/);
await page.waitForFunction(() => [...document.querySelectorAll('button')].some((b) => /^Suivant/.test(b.textContent.trim())), { timeout: 90000 }); await attendre(1500);
for (let i = 1; i <= (process.env.TAILLE ? 1 : 7); i++) {
  await attendre(900);
  console.log(i, JSON.stringify(await page.evaluate(() => { const f = document.querySelector('.floating-actions'); const b = f?.querySelector('button')?.getBoundingClientRect(); const s = [...document.querySelectorAll('[data-page-end-actions] button')].map((x) => { const q = x.getBoundingClientRect(); return [x.textContent.trim().slice(0, 24), Math.round(q.left), Math.round(q.top), Math.round(q.right), Math.round(q.bottom)]; });
    return { fab: b && [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)], dock: f?.dataset.floatingActionsDock, docked: f?.dataset.floatingActionsDocked, anchor: f?.dataset.floatingActionsAnchor, masque: f?.dataset.floatingActionsMasque, fin: s, bodyFab: document.body.hasAttribute('data-has-fab-floating'), gap: [...document.querySelectorAll('[data-floating-actions-gap]')].map((g) => [g.dataset.floatingActionsGap, g.parentElement?.tagName, g.parentElement?.parentElement?.className?.toString().slice(0, 30), [...g.children].slice(0, 4).map((c) => c.tagName + ':' + getComputedStyle(c).marginRight)]) }; })));
  if (i < 7) { await toucher(/^Suivant/); await attendre(1500); }
}
await navigateur.close();
