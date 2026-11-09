// Voie b-stock (09.11) : captures avant (HEAD, port 5653) et après (port 5652), banc ?dev-local, données simulées seulement.
// Usage : node capturer.mjs <avant|apres> <sujet...>   Sorties : captures/<sujet>-<largeur>-<theme>-<avant|apres>.png
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire('C:/Users/mrspa/AppData/Local/Temp/deploy-bc70/package.json');
const puppeteer = require('puppeteer-core');
const OUT = new URL('./captures/', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
fs.mkdirSync(OUT, { recursive: true });
const [, , quand, ...sujets] = process.argv;
const PORT = quand === 'avant' ? 5653 : 5652;
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const MODES = [{ id: '390', w: 390, h: 844, t: true }, { id: '1280', w: 1280, h: 800, t: false }];
const THEMES = ['clair', 'cave'];

const lot = (id, status, extra = {}) => ({ id, name: `Bière ${id}`, style: 'IPA', status, volumeL: 20, brewDate: status === 'planifie' ? '' : '05.11.2026', plannedBrewDate: status === 'planifie' ? '2026-11-20' : '', gravityLog: [], ...extra });
const SNAPSHOT = { name: 'ZZ Pale', style: 'Pale Ale', volumeL: 20, ogTarget: 1.05, fgTarget: 1.01, abvTarget: 5, totalGristKg: 5, capturedAt: '2026-11-01', steps: [], notes: [],
  fermentables: [{ name: 'Pale', kind: 'grain', use: 'empatage', weightKg: 5, colorEbc: 6, potentialPpg: 36 }],
  hops: [{ name: 'Citra', stage: 'boil', weightG: 20, alpha: 12, timeMin: 60 }, { name: 'Mosaic', stage: 'dryHop', weightG: 40, alpha: 12, dayOffset: 4 }],
  yeast: { name: 'US-05', form: 'sèche', qty: 1, unit: 'sachet' }, boilMin: 60,
  fermentation: [{ kind: 'primaire', name: 'Fermentation primaire', tempC: 20.5, days: 7 }, { kind: 'reposDiacetyle', name: 'Repos diacétyle', tempC: 22, days: 2 }, { kind: 'garde', name: 'Garde', tempC: 3, days: 7 }],
  mash: { steps: [{ name: 'Saccharification', tempC: 67, durationMin: 60 }], spargeType: 'batch' },
  waterPlan: { sourceId: 'test', mashWaterL: 20, spargeWaterL: 10, targetPh: 5.4, diRatioPct: 0, startIons: { ca: 30, mg: 2, na: 5, so4: 10, cl: 15, hco3: 120 }, mash: {}, sparge: {}, acid: { id: 'lactique', mash: 1, sparge: 0.5 } } };
const EQUIP = { kettleCapacityL: 45, kettleWorkingL: 35, workingVolumeConfirmed: false, spargeCapacityL: 18, fermenterCapacityL: 30, fermenterHeadspacePct: 20, roPackL: 5, boilOffLPerHour: 3, grainAbsorptionLPerKg: 0.96, grainDisplacementLPerKg: 0.67, coolingShrinkagePct: 4, heatingRateCPerMin: 13 / 30 };
const RIG = { id: 'zz-rig', name: 'ZZ Mon installation', volumeL: 24, efficiencyPct: 75, boilOffRatePct: 10, deadSpaceL: 1.5, mashRatioLPerKg: 4.2, equipment: EQUIP, preferences: { preferredMashRatioLPerKg: 4.2, preferredSpargeHotL: 18, maximumSpargeHotL: 24, increaseMashToLimitSparge: true } };
const GROS = { ...SNAPSHOT, id: 'ZZ-R-GROS', name: 'ZZ Grosse recette', volumeL: 60, totalGristKg: 12, brewhouse: RIG, fermentables: [{ name: 'Pilsner', kind: 'grain', use: 'empatage', weightKg: 12, colorEbc: 4, potentialPpg: 37 }], hops: [] };
const DONNEES = {
  recipes: [GROS, { ...GROS, id: 'ZZ-R-DENSE', name: 'ZZ Recette dense', volumeL: 30 }],
  batches: [lot('ZZ-PLAN', 'planifie', { recipeSnapshot: SNAPSHOT }), lot('ZZ-FERM', 'fermentation'), lot('ZZ-GARDE', 'garde'), lot('ZZ-COND', 'conditionne'), lot('ZZ-FIN', 'termine'), lot('ZZ-ANN', 'annule')],
  kegs: [{ id: 'ZZ-F1', capacityL: 20, state: 'plein', batchRef: 'ZZ-COND', beerName: 'Bière ZZ-COND', fillDate: '05.11.2026' }, { id: 'ZZ-F9', capacityL: 30, state: 'propre' }],
  stockItems: ['Pilsner', 'Pale Ale Maris Otter', 'Caramünch II', 'Munich II', 'Flocons d’avoine'].map((n, i) => ({ id: `ZZ-S${i}`, ref: `ZZ-S${i}`, name: `ZZ TEST ${n}`, category: 'Malt', unit: 'kg', currentStock: i === 1 ? 1 : 20 + i, minStock: 5, reorder: i === 1, kind: 'rawMaterials' }))
};

async function ouvrir(nav, m, theme) {
  const p = await nav.newPage();
  await p.setViewport({ width: m.w, height: m.h, isMobile: m.t, hasTouch: m.t, deviceScaleFactor: 1 });
  await p.evaluateOnNewDocument((th) => { try { localStorage.setItem('laffinee.theme', th); } catch {} }, theme);
  for (let i = 0; i < 3; i++) {
    try { await p.goto(`http://localhost:${PORT}/?dev-local`, { waitUntil: 'domcontentloaded', timeout: 180000 }); await p.waitForFunction(() => document.querySelector('nav[aria-label="Navigation principale"]'), { timeout: 60000 }); break; } catch { /* nouvel essai */ }
  }
  await dormir(2500);
  for (let essai = 0; essai < 6; essai++) { try {
  await p.evaluate(async (d, th) => {
    document.documentElement.dataset.theme = th;
    const { FirestoreRepo } = await import('/src/services/firestoreRepo.ts');
    for (const [col, docs] of Object.entries(d)) for (const x of docs) FirestoreRepo.put(col, x.id, x);
  }, DONNEES, theme); break; } catch (e) { console.error('semis, essai', essai, e.message.slice(0, 80)); await dormir(4000); } }
  await dormir(1200);
  return p;
}
const cliquer = (p, re, zone) => p.evaluate((src, z) => {
  const racine = z === 'nav' ? document.querySelector('nav[aria-label="Navigation principale"]') : document;
  const el = [...racine.querySelectorAll('button,a,[role=tab],[role=radio],summary')].find((b) => b.offsetParent !== null && !(z === 'main' && b.closest('nav[aria-label="Navigation principale"]')) && new RegExp(src).test((b.getAttribute('aria-label') || b.innerText || '').trim()));
  if (el) el.click();
  return !!el;
}, re.source, zone);
const photo = (p, nom, m, theme) => p.screenshot({ path: `${OUT}${nom}-${m.id}-${theme}-${quand}.png` });

const SCENES = {
  async pastilles(p, m, theme) {
    await cliquer(p, /^Brassins$/, 'nav'); await dormir(1200);
    await cliquer(p, /^Brassins(\s|\()/, 'main'); await dormir(800);
    await photo(p, 'pastilles', m, theme);
    const rapports = await p.evaluate(() => [...document.querySelectorAll('span.rounded-full')].filter((e) => /Planifié|Fermentation|Garde froide|Conditionné|Terminé|Annulé/.test(e.textContent || '')).map((e) => { const s = getComputedStyle(e); return `${e.textContent.trim()} ${s.color} / ${s.backgroundColor}`; }));
    console.log(JSON.stringify(rapports));
  },
  async futs(p, m, theme) {
    await cliquer(p, /^Stocks/, 'nav'); await dormir(1000);
    await cliquer(p, /^Fûts/, 'main'); await dormir(900);
    await photo(p, 'futs-liste', m, theme);
    await p.evaluate(() => document.querySelector('[aria-label="Ouvrir le fût ZZ-F9"]')?.click()); await dormir(700);
    await p.evaluate(() => document.querySelector('[aria-label="Brassin à enfûter"]')?.click()); await dormir(600);
    await photo(p, 'futs-choix-brassin', m, theme);
    await p.evaluate(() => { const o = [...document.querySelectorAll('[role=option]')].find((x) => /ZZ-COND/.test(x.textContent)); o?.click(); }); await dormir(600);
    await photo(p, 'futs-couvert', m, theme);
    await p.keyboard.press('Escape'); await dormir(300);
    await p.evaluate(() => document.querySelector('[aria-label="Ouvrir le fût ZZ-F1"]')?.click()); await dormir(700);
    await photo(p, 'futs-livrer-sans-client', m, theme);
  },
  async articles(p, m, theme) {
    await cliquer(p, /^Stocks/, 'nav'); await dormir(1000);
    await photo(p, 'stocks-articles', m, theme);
    const txt = await p.evaluate(() => [...document.querySelectorAll('main button, main [role=radio]')].map((b) => (b.getAttribute('aria-label') || b.innerText || '').trim()).filter(Boolean).slice(0, 14));
    console.log(JSON.stringify(txt));
    const champ = await p.$('input[type=search], input[aria-label^="Rechercher"]');
    if (champ) { await champ.type('X'.repeat(90)); await dormir(700); await photo(p, 'stocks-recherche-90', m, theme); const l = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]); console.log('largeur page/fenetre', JSON.stringify(l)); }
  },
  async courbe(p, m, theme) {
    await cliquer(p, /^Brassins$/, 'nav'); await dormir(1200);
    await cliquer(p, /^Brassins(\s|\()/, 'main'); await dormir(800);
    console.log('ouvrir', await cliquer(p, /^Préparer le brassage/, 'main')); await dormir(2500);
    const boutons = await p.evaluate(() => [...document.querySelectorAll('button,summary,[role=tab]')].filter((b) => b.offsetParent).map((b) => (b.getAttribute('aria-label') || b.innerText || '').trim().slice(0, 30)).filter(Boolean));
    console.log(JSON.stringify(boutons.slice(0, 40)));
    await cliquer(p, /^Recette/, 'main'); await dormir(1200);
    await p.evaluate(() => { const g = [...document.querySelectorAll('summary,button')].find((b) => /^Levure ·/.test((b.innerText || '').trim())); g?.click(); }); await dormir(800);
    await p.evaluate(() => { const d = [...document.querySelectorAll('summary')].find((b) => /Programme, ajouts/.test(b.innerText)); d?.click(); d?.scrollIntoView({ block: 'start' }); }); await dormir(1200);
    await photo(p, 'courbe-haut', m, theme);
    await p.evaluate(() => { const c = document.querySelector('figure svg, svg[role=img]'); c?.scrollIntoView({ block: 'center' }); }); await dormir(600);
    await photo(p, 'courbe', m, theme);
    await p.evaluate(() => { for (const el of document.querySelectorAll('*')) if (el.scrollHeight > el.clientHeight + 4 && /(auto|scroll)/.test(getComputedStyle(el).overflowY)) el.scrollTop = el.scrollHeight; window.scrollTo(0, document.body.scrollHeight); }); await dormir(600);
    await photo(p, 'courbe-bas', m, theme);
  },
  async articles2(p, m, theme) {
    await cliquer(p, /^Stocks/, 'nav'); await dormir(1000);
    await cliquer(p, /^(Articles|Stock)(\s|\(|$)/, 'main'); await dormir(900);
    await photo(p, 'articles', m, theme);
    await p.evaluate(() => [...document.querySelectorAll('button')].find((b) => /^Rechercher/.test(b.getAttribute('aria-label') || '') && b.offsetParent && !b.closest('header'))?.click()); await dormir(500);
    const champ = await p.$('input[aria-label^="Rechercher"]');
    if (champ) { await champ.type('X'.repeat(90)); await dormir(700); await photo(p, 'articles-recherche-90', m, theme); console.log('largeur page/fenetre', JSON.stringify(await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]))); }
  },
  async volumes(p, m, theme) {
    await cliquer(p, /^Brassins$/, 'nav'); await dormir(1200);
    await cliquer(p, /^(Volumes|Adapter les volumes)/, 'main'); await dormir(1200);
    await p.evaluate(() => { const s = document.querySelector('select[name="production_scale_recipe_select"]'); if (s) { s.value = 'ZZ-R-DENSE'; s.dispatchEvent(new Event('change', { bubbles: true })); } }); await dormir(900);
    await photo(p, 'volumes-te39', m, theme);
    console.log('mention', await p.evaluate(() => /plafonné par la cuve/.test(document.body.innerText)));
  },
  async stockfiche(p, m, theme) {
    await cliquer(p, /^Brassins$/, 'nav'); await dormir(1200);
    await cliquer(p, /^Brassins(\s|\()/, 'main'); await dormir(600);
    await p.evaluate(() => document.querySelector('[aria-label="Ouvrir le brassin ZZ-FERM"]')?.click()); await dormir(1200);
    await cliquer(p, /^Mesures/, 'main'); await dormir(500);
    await photo(p, 'te41-mesures', m, theme);
    await p.evaluate(() => [...document.querySelectorAll('button')].find((b) => /^Dossier/.test((b.innerText || '').trim()))?.click()); await dormir(700);
    await photo(p, 'te41-dossier', m, theme);
  },
  async materiel(p, m, theme) {
    await p.evaluate(async () => {
      const { StorageService } = await import('/src/services/storage.ts');
      const { practicalEquipment, practicalBrewingPreferences } = await import('/src/domain/brewEquipment.ts');
      const cfg = StorageService.getConfig(); const b = cfg.brewhouses.find((x) => x.id === cfg.activeBrewhouseId) ?? cfg.brewhouses[0];
      b.equipment = { ...practicalEquipment }; b.preferences = { ...practicalBrewingPreferences }; StorageService.saveConfig(cfg);
    }); await dormir(800);
    await cliquer(p, /^Bord/, 'nav'); await dormir(900);
    await p.evaluate(() => document.querySelector('button[aria-label^="Actions rapides"]')?.click()); await dormir(700);
    console.log('menu', JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('[role=menuitem]')].map((e) => e.innerText.replace(/s+/g, ' ').slice(0, 40)))));
    await p.evaluate(() => [...document.querySelectorAll('[role=menuitem]')].find((b) => /Lancer un brassin/.test(b.innerText || ''))?.click()); await dormir(900);
    await p.evaluate(() => [...document.querySelectorAll('button')].find((b) => /^Préparer un brassin/.test((b.innerText || '').trim()))?.click()); await dormir(700);
    await p.evaluate(() => { const s = document.querySelector('select[aria-label="Recette à brasser"]'); if (s) { s.value = 'ZZ-R-GROS'; s.dispatchEvent(new Event('change', { bubbles: true })); } }); await dormir(900);
    await photo(p, 'am47-modal', m, theme);
    console.log('bandeau', await p.evaluate(() => /matériel actuel/.test(document.body.innerText)));
  },
  async ensemencement(p, m, theme) {
    await p.evaluate(async () => {
      const { buildTimeline } = await import('/src/services/brewTimer.ts');
      const { FirestoreRepo } = await import('/src/services/firestoreRepo.ts');
      const b = FirestoreRepo.all('batches').find((x) => x.id === 'ZZ-PLAN');
      const snap = { ...b.recipeSnapshot, yeast: { name: 'US-05', form: 'sèche' } };
      const steps = buildTimeline(snap); const i = steps.findIndex((s) => s.id === 'ensemencement');
      FirestoreRepo.put('batches', 'ZZ-PLAN', { ...b, recipeSnapshot: snap, brewDay: { steps, currentIndex: Math.max(0, i), readings: [], startedAt: Date.now() - 60000 } });
    }); await dormir(800);
    await cliquer(p, /^Brassins$/, 'nav'); await dormir(1000);
    await cliquer(p, /^Brassins(\s|\()/, 'main'); await dormir(600);
    console.log('ouvrir', await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /ZZ-PLAN/.test(x.getAttribute('aria-label') || '') && !/Ouvrir le brassin|Épingler|Ranger/.test(x.getAttribute('aria-label') || '')); b?.click(); return b?.getAttribute('aria-label'); })); await dormir(2500);
    await p.evaluate(() => { const e = [...document.querySelectorAll('.brew-amount strong')].find((x) => /À préciser/.test(x.textContent)); e?.scrollIntoView({ block: 'center' }); }); await dormir(600);
    await photo(p, 'rj14-ensemencement', m, theme);
    console.log('apreciser', await p.evaluate(() => { const e = [...document.querySelectorAll('strong[data-sans-valeur], .brew-amount strong')].map((s) => { const r = s.getBoundingClientRect(); const c = s.closest('.brew-amount').getBoundingClientRect(); return `${s.textContent}|${Math.round(r.width)}/${Math.round(c.width)}|${s.scrollWidth > s.clientWidth}`; }); return e; }));
    await cliquer(p, /^Journal/, 'main'); await dormir(900);
    await photo(p, 'journal-vide', m, theme);
    console.log('export', await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /Exporter \.txt/.test(x.innerText)); return b ? `disabled=${b.disabled}` : 'absent'; }));
  },
  async journal(p, m, theme) {
    // Ouvre le jour de brassage d'un brassin planifié, onglet Journal.
    await cliquer(p, /^Brassins$/, 'nav'); await dormir(1200);
    await p.evaluate(() => [...document.querySelectorAll('button')].find((b) => /ZZ-FERM/.test(b.getAttribute('aria-label') || b.innerText))?.click()); await dormir(1000);
    await photo(p, 'brassin-fiche', m, theme);
  }
};

const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
for (const nom of sujets) {
  for (const m of MODES) for (const theme of THEMES) {
    const p = await ouvrir(nav, m, theme);
    try { await SCENES[nom](p, m, theme); } catch (e) { console.error(nom, m.id, theme, 'ERREUR', e.message); }
    await p.close();
  }
}
await nav.close();
