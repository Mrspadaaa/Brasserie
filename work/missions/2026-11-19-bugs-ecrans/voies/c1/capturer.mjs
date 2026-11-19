// Voie c1 : captures de la caisse (AM-69 espèces arrondies). Fixtures posées en mémoire sous ?dev-local (jamais Firestore réel).
// Usage : node scripts/with_server.mjs --server "npm run dev" --port 3107 --env PORT=3107 -- node work/missions/2026-11-19-bugs-ecrans/voies/c1/capturer.mjs
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const RACINE = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..');
const { ouvrir } = await import(pathToFileURL(path.join(RACINE, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const url = `http://localhost:${(process.env.WITH_SERVER_PORTS ?? '3107').split(',')[0]}`;
const SORTIE = path.join(import.meta.dirname, 'captures');
fs.mkdirSync(SORTIE, { recursive: true });
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

const poserFixtures = () => page => page.evaluate(async () => {
  const { FirestoreRepo } = await import('/src/services/firestoreRepo.ts');
  const { StorageService } = await import('/src/services/storage.ts');
  const cfg = StorageService.getConfig();
  StorageService.saveConfig({ ...cfg, company: { ...cfg.company, name: 'Brasserie Test', uid: '', iban: 'CH93 0076 2011 6238 5295 7', adresse: { rue: 'Rue du Test', numero: '1', npa: '1700', localite: 'Fribourg', pays: 'CH' } }, fiscal: { ...cfg.fiscal, isTvaRegistered: false } });
  FirestoreRepo.put('clients', 'CL-006', { id: 'CL-006', name: 'ZZ TEST — Clients', type: 'Pro', contact: '', phone: '', email: '', adresse: { rue: 'Chemin des Fixtures', numero: '4', npa: '1700', localite: 'Fribourg', pays: 'CH' } });
  FirestoreRepo.put('batches', 'B1', { id: 'B1', name: 'Pale Ale', style: 'Pale Ale', status: 'conditionne', brewDate: '2026-09-05', volumeL: 30, volumePackagedL: 27, packaging: { bottles33: 96, bottles75: 24, kegIds: [] } });
  StorageService.saveTarifs([{ product: 'Pale Ale 33 cl', biere: 'Pale Ale', format: { id: '33cl', label: '33 cl', volumeL: 0.33 }, costIngredients: 0, costLabor: 0, costFixed: 0, costTotal: 0, priceHT: 3.96, marginCHF: 0, marginPercent: 0 },
    { product: 'Pale Ale 75 cl', biere: 'Pale Ale', format: { id: '75cl', label: '75 cl', volumeL: 0.75 }, costIngredients: 0, costLabor: 0, costFixed: 0, costTotal: 0, priceHT: 10, marginCHF: 0, marginPercent: 0 }]);
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
  await dormir(1500);
  await poserFixtures()(page);
  await dormir(500);
  await cliquerTexte(page, /^Actions rapides$/); await dormir(600);
  // Le menu « Actions rapides » (diagnostic du 19.11) liste « Vente », pas « Vendre » : c'est l'entrée de la caisse (App.tsx, case 'vente').
  const vendu = await cliquerTexte(page, /^Vente$/);
  console.log(largeur, theme, 'Vendre', vendu);
  if (!vendu) {
    // Diagnostic : libellés réellement visibles après « Actions rapides », et capture du menu tel qu'il est.
    const libelles = await page.evaluate(() => [...document.querySelectorAll('button,[role=button],[role=menuitem],[aria-label]')].filter((x) => x.getClientRects().length).map((x) => (x.getAttribute('aria-label') || x.textContent || '').trim().slice(0, 40)).filter(Boolean).slice(0, 120));
    console.log('libellés visibles :', JSON.stringify(libelles));
    await page.screenshot({ path: path.join(import.meta.dirname, 'diag-menu.png') });
  }
  await page.waitForSelector('.cs', { timeout: 20000 }); await dormir(900);
  for (let i = 0; i < 3; i++) await cliquerTexte(page, /^33 cl/);
  await cliquerTexte(page, /^Espèces$/); await dormir(600);
  const lu = await page.evaluate(() => ({ total: document.querySelector('[aria-label="Total"]')?.textContent, arrondi: [...document.querySelectorAll('[data-arrondi]')].map((n) => n.textContent), bouton: document.querySelector('.cs-go')?.textContent }));
  console.log(largeur, theme, JSON.stringify(lu));
  const base = path.join(SORTIE, `c1-caisse-${largeur}-${theme}`);
  await page.screenshot({ path: `${base}-haut.png` });
  if (mobile) {
    // Le conteneur qui défile n'est pas forcément .cs : on fait défiler tout élément à défilement réel, puis la page.
    await page.evaluate(() => {
      const defilants = [...document.querySelectorAll('*')].filter((n) => n.scrollHeight > n.clientHeight + 20 && /auto|scroll/.test(getComputedStyle(n).overflowY));
      defilants.forEach((n) => { n.scrollTop = n.scrollHeight; });
      document.scrollingElement?.scrollTo(0, 99999);
    });
    await dormir(500); await page.screenshot({ path: `${base}-bas.png` });
  }
  console.log(largeur, theme, 'erreurs', JSON.stringify(journal.erreurs.slice(0, 3)));
  await browser.close();
}
// Les rechargements HMR (d'autres sessions éditent le même dépôt pendant le banc) détruisent le document : un parcours est rejoué, trois essais au plus.
for (const [l, t] of [[1280, 'clair'], [1280, 'cave'], [390, 'clair'], [390, 'cave']]) {
  for (let essai = 1; essai <= 3; essai++) {
    try { await une(l, t); break; } catch (e) { console.log(l, t, 'essai', essai, 'échec :', String(e?.message ?? e).slice(0, 140)); }
  }
}
