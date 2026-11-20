// T3B-13 : la caisse (Vendre) avec les tarifs du brasseur (33 cl à 3,00 ; 75 cl à 569,50). Fixtures en mémoire sous ?dev-local.
// Usage : node scripts/with_server.mjs --server "npm run dev" --port 3110 --env PORT=3110 -- node <ce fichier>
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const RACINE = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..');
const { ouvrir } = await import(pathToFileURL(path.join(RACINE, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const url = `http://localhost:${(process.env.WITH_SERVER_PORTS ?? '3110').split(',')[0]}`;
const SORTIE = path.join(import.meta.dirname, 'captures');
fs.mkdirSync(SORTIE, { recursive: true });
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

const poserFixtures = () => page => page.evaluate(async () => {
  const { FirestoreRepo } = await import('/src/services/firestoreRepo.ts');
  const { StorageService } = await import('/src/services/storage.ts');
  const cfg = StorageService.getConfig();
  StorageService.saveConfig({ ...cfg, company: { ...cfg.company, name: 'Brasserie Test', uid: '', iban: 'CH93 0076 2011 6238 5295 7', adresse: { rue: 'Rue du Test', numero: '1', npa: '1700', localite: 'Fribourg', pays: 'CH' } }, fiscal: { ...cfg.fiscal, isTvaRegistered: false } });
  FirestoreRepo.put('batches', 'B1', { id: 'B1', name: 'Pale Ale', style: 'Pale Ale', status: 'conditionne', brewDate: '2026-09-05', volumeL: 30, volumePackagedL: 27, packaging: { bottles33: 96, bottles75: 24, kegIds: [] } });
  StorageService.saveTarifs([{ product: 'Pale Ale 33 cl', biere: 'Pale Ale', format: { id: '33cl', label: '33 cl', volumeL: 0.33 }, costIngredients: 0, costLabor: 0, costFixed: 0, costTotal: 0, priceHT: 3, marginCHF: 0, marginPercent: 0 },
    { product: 'Pale Ale 75 cl', biere: 'Pale Ale', format: { id: '75cl', label: '75 cl', volumeL: 0.75 }, costIngredients: 0, costLabor: 0, costFixed: 0, costTotal: 0, priceHT: 569.5, marginCHF: 0, marginPercent: 0 }]);
});
const cliquerTexte = (page, re) => page.evaluate((src) => {
  const r = new RegExp(src, 'i');
  const b = [...document.querySelectorAll('button,[role=button],[role=menuitem]')].find((x) => r.test((x.getAttribute('aria-label') || x.textContent || '').trim()) && x.getClientRects().length);
  if (b) { b.click(); return true; } return false;
}, re.source);

async function une(largeur, theme) {
  const mobile = largeur < 600;
  const { browser, page, journal } = await ouvrir({ largeur, hauteur: mobile ? 844 : 900, mobile, echelle: 1 });
  await page.evaluateOnNewDocument((t) => { try { localStorage.setItem('laffinee.theme', t); } catch { /* rien */ } }, theme);
  await page.goto(`${url}/?dev-local`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!document.querySelector('[aria-label="Actions rapides"]'), { timeout: 170000 });
  await dormir(1500); await poserFixtures()(page); await dormir(500);
  await cliquerTexte(page, /^Actions rapides$/); await dormir(600);
  await cliquerTexte(page, /^Vente$/);
  await page.waitForSelector('.cs-tiles', { timeout: 20000 }); await dormir(900);
  const tuiles = await page.evaluate(() => [...document.querySelectorAll('.cs-t')].map(t => t.textContent.trim().replace(/\s+/g, ' ')));
  console.log(largeur, theme, 'tuiles', JSON.stringify(tuiles));
  await page.screenshot({ path: path.join(SORTIE, `vendre-${largeur}-${theme}.png`) });
  // un clic sur la tuile 75 cl ouvre la ligne libre (prix vide), il ne pose pas 569,50
  await cliquerTexte(page, /^75 cl/); await dormir(500);
  const libre = await page.evaluate(() => ({ ligne: !!document.querySelector('.cs-libre'), prix: document.querySelector('.cs-libre input[aria-label="Prix unitaire"]')?.value ?? null, total: document.querySelector('[aria-label="Total"]')?.textContent ?? null }));
  console.log(largeur, theme, 'clic 75 cl', JSON.stringify(libre));
  if (largeur === 390) await page.screenshot({ path: path.join(SORTIE, `vendre-${largeur}-${theme}-clic75.png`) });
  const note = await page.evaluate(() => { const n = document.querySelector('.cs-libre-note'); if (!n) return null; const r = n.getBoundingClientRect(); return { texte: n.textContent, visible: r.top >= 0 && r.bottom <= innerHeight, titreInfobulle: null }; });
  console.log(largeur, theme, 'raison affichée sans infobulle', JSON.stringify(note));
  const champ = await page.evaluate(() => { const i = document.querySelector('.cs-libre input, .cs-libre textarea'); if (!i) return null; const c = getComputedStyle(i); const rgb = (t) => (t.match(/[\d.]+/g) || []).slice(0, 3).map(Number); const lum = (t) => { const [r, g, b] = rgb(t).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; }; const L1 = lum(c.color), L2 = lum(c.backgroundColor); return { fond: c.backgroundColor, texte: c.color, bord: c.borderTopColor + ' ' + c.borderTopWidth, contraste: +((Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05)).toFixed(2) }; });
  console.log(largeur, theme, 'champ de la ligne libre', JSON.stringify(champ));
  if (largeur === 390) await page.screenshot({ path: path.join(SORTIE, `vendre-${largeur}-${theme}-toucher-averifier.png`) });
  console.log(largeur, theme, 'erreurs', JSON.stringify(journal.erreurs.slice(0, 3)));
  await browser.close();
}
for (const [l, t] of [[390, 'clair'], [390, 'cave'], [1280, 'clair'], [1280, 'cave']]) {
  for (let essai = 1; essai <= 3; essai++) {
    try { await une(l, t); break; } catch (e) { console.log(l, t, 'essai', essai, 'échec :', String(e?.message ?? e).slice(0, 140)); }
  }
}
