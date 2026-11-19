// k1 / DEMANDE EXECUTANT x1 (BR-98), z1 (TL-26, TL-12), t1 (LR1-NOTE-5). Fixtures simulées, aucune donnée réelle, aucun Firebase : les requêtes hors localhost sont coupées.
// node scripts/with_server.mjs --server "npm run dev -- --port 3109 --strictPort" --port 3109 --env VITE_FIREBASE_API_KEY=fake -- node work/missions/2026-11-19-bugs-ecrans/voies/k1/banc/capturer-c.mjs [br98|lactose|palette]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const RACINE = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..', '..');
const puppeteer = createRequire(path.join(RACINE, 'package.json'))('puppeteer-core');
const port = (process.env.WITH_SERVER_PORTS ?? '3109').split(',')[0];
const SORTIE = path.join(import.meta.dirname, '..', 'captures');
fs.mkdirSync(SORTIE, { recursive: true });
const quoi = process.argv[2] ?? 'tout';
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const local = (u) => ['http://localhost', 'http://127.0.0.1', 'ws://localhost', 'data:', 'blob:', 'about:'].some((d) => u.startsWith(d));
const journal = [];
const nav = await puppeteer.launch({ executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });

async function page(l, h, tactile, theme, url) {
  const p = await nav.newPage();
  await p.setViewport({ width: l, height: h, isMobile: tactile, hasTouch: tactile, deviceScaleFactor: tactile ? 2 : 1 });
  await p.setRequestInterception(true);
  p.on('request', (r) => (local(r.url()) ? r.continue() : r.abort('blockedbyclient')));
  p.setDefaultNavigationTimeout(180000);
  await p.evaluateOnNewDocument((t) => { try { localStorage.setItem('laffinee.theme', t); } catch { /* */ } }, theme);
  await p.goto(url, { waitUntil: 'domcontentloaded' });
  return p;
}
const clic = (p, re) => p.evaluate((m) => { const b = [...document.querySelectorAll('button,[role="tab"]')].find((x) => new RegExp(m).test(x.getAttribute('aria-label') ?? x.textContent ?? '')); if (b) b.click(); return !!b; }, re);

// 1. BR-98 : « Houblon pour ce style », liste ouverte (banc de la fiche recette de x1). 390 cave et 1280 clair (+ les deux autres).
if (quoi === 'tout' || quoi === 'br98') {
  for (const [tag, l, h, tactile, theme] of [['390-cave', 390, 844, true, 'cave'], ['1280-clair', 1280, 800, false, 'clair'], ['390-clair', 390, 844, true, 'clair'], ['1280-cave', 1280, 800, false, 'cave']]) {
    const p = await page(l, h, tactile, theme, `http://localhost:${port}/work/missions/2026-11-19-bugs-ecrans/voies/x1/banc/banc.html?theme=${theme}`);
    await p.waitForFunction(() => document.querySelector('button.rc-lien') !== null, { timeout: 150000 });
    await clic(p, 'Potentiel'); await dormir(1500); await clic(p, '^Simuler$'); await dormir(900);
    await p.select('select[aria-label="Ajout à simuler"]', '-1'); await dormir(700);
    const combo = await p.$('[aria-label="Houblon du scénario"]');
    journal.push(`br98 ${tag} champ : ${!!combo}`);
    if (combo) { await combo.evaluate((c) => c.scrollIntoView({ block: 'start' })); await combo.click(); await combo.type('Cit', { delay: 60 }); await dormir(1200); }
    journal.push(`br98 ${tag} options (${await p.evaluate(() => document.querySelectorAll('[role="option"]').length)}) : ${await p.evaluate(() => [...document.querySelectorAll('[role="option"]')].slice(0, 3).map((o) => o.textContent.replace(/\s+/g, ' ').trim()).join(' || '))}`);
    await p.screenshot({ path: path.join(SORTIE, `c-br98-liste-${tag}.png`) });
    await p.close();
  }
}

// 2. TL-26 / TL-12 : l'assistant, étape Malts/sucres, un « Lactose » ajouté ; vrai thème cave (clé laffinee.theme), la ligne « ne fermente pas » à l'écran.
if (quoi === 'tout' || quoi === 'lactose') {
  for (const [tag, l, h, tactile, theme] of [['390-cave', 390, 800, true, 'cave'], ['1280-cave', 1280, 900, false, 'cave'], ['390-clair', 390, 800, true, 'clair']]) {
    const p = await page(l, h, tactile, theme, `http://localhost:${port}/?preview=brew&view=assistant&malts=sucre`);
    await p.waitForFunction(() => (document.querySelector('#root')?.children.length ?? 0) > 0 && !/Chargement de la brasserie/.test(document.body.innerText), { timeout: 240000 }).catch(() => journal.push(`lactose ${tag} : racine lente`));
    await dormir(2500);
    await p.evaluate((t) => { document.documentElement.dataset.theme = t; }, theme);
    const champ = await p.$('input[placeholder^="Nom"]');
    journal.push(`lactose ${tag} champ Nom : ${!!champ}`);
    if (champ) { await champ.focus(); await dormir(300); await p.keyboard.type('Lactose 1', { delay: 40 }); await dormir(500); await p.keyboard.press('Enter'); }
    await dormir(1500);
    const vu = await p.evaluate(() => { const e = [...document.querySelectorAll('*')].filter((x) => x.children.length === 0 && /ne fermente pas/.test(x.textContent ?? '')).pop(); if (!e) return null; e.scrollIntoView({ block: 'center' }); return e.closest('[data-sel], li, div')?.textContent?.replace(/\s+/g, ' ').slice(0, 120) ?? e.textContent; });
    journal.push(`lactose ${tag} ligne : ${vu ?? '(aucune « ne fermente pas »)'} ; thème = ${await p.evaluate(() => document.documentElement.dataset.theme)} ; fond = ${await p.evaluate(() => getComputedStyle(document.body).backgroundColor)}`);
    await dormir(600);
    await p.screenshot({ path: path.join(SORTIE, `c-lactose-${tag}.png`) });
    await p.close();
  }
}

// 3. LR1-NOTE-5 : une écriture locale « ZZ TEST » à 17,50 CHF, retrouvée par « 17,50 » dans la recherche (loupe).
if (quoi === 'tout' || quoi === 'palette') {
  for (const [tag, l, h, tactile, theme] of [['390-clair', 390, 844, true, 'clair'], ['1280-clair', 1280, 800, false, 'clair'], ['390-cave', 390, 844, true, 'cave']]) {
    const p = await page(l, h, tactile, theme, `http://localhost:${port}/?dev-local`);
    await p.waitForSelector('button[aria-label^="Rechercher"]', { timeout: 150000 });
    await dormir(1500);
    const ecrit = await p.evaluate(async () => {
      const m = await import('/src/services/storage.ts');
      m.StorageService.addTransaction({ id: 'zz-test-17-50', date: '19.11.2026', description: 'ZZ TEST — achat houblon', amountHT: 16.19, tvaRate: 0.081, tvaAmount: 1.31, amountTTC: 17.5, category: 'brassage', subcategory: 'Houblons' });
      return m.StorageService.getTransactions().filter((t) => t.id === 'zz-test-17-50').length;
    });
    journal.push(`palette ${tag} écriture locale écrite : ${ecrit}`);
    await dormir(800);
    await (tactile ? p.tap('button[aria-label^="Rechercher"]') : p.click('button[aria-label^="Rechercher"]'));
    await dormir(700);
    await p.keyboard.type('17,50', { delay: 40 });
    await dormir(900);
    journal.push(`palette ${tag} résultats : ${await p.evaluate(() => [...document.querySelectorAll('[cmdk-item]')].slice(0, 4).map((o) => o.textContent.replace(/\s+/g, ' ').trim()).join(' || ') || '(aucun)')}`);
    await p.screenshot({ path: path.join(SORTIE, `c-palette-17-50-${tag}.png`) });
    await p.close();
  }
}
await nav.close();
console.log(journal.join('\n'));
fs.writeFileSync(path.join(SORTIE, `c-journal-${quoi}.txt`), journal.join('\n') + '\n');
console.log('CAPTURES-C OK');
