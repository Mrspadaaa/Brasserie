// Tour complet : chaque onglet, sous-onglet, création et feuille, à 390 tactile. Sortie : captures/ + tour.log
import { ouvrir, cap, cliquer, pause } from './commun.mjs';
const { browser, page } = await ouvrir();
const charge = async () => { await page.waitForFunction(() => { const m = document.querySelector('main'); return m && (m.innerText.match(/\S+/g) || []).length > 45 && !/Recharger l.application/.test(m.innerText); }, { timeout: 30000 }).catch(() => console.log('LENT/ECHEC chargement')); await pause(700); };
const nav = async (t) => { await page.evaluate((t) => { const n = [...document.querySelectorAll('nav')].find(x => x.getBoundingClientRect().bottom >= innerHeight - 5); [...n.querySelectorAll('button,a')].find(b => (b.getAttribute('aria-label')||b.textContent).trim().startsWith(t))?.click(); }, t); await charge(); };
const fermer = async () => { await page.keyboard.press('Escape'); await pause(500); await cliquer(page, 'Fermer', { dernier: true }); await pause(500); };
const etape = async (nom, fn) => { try { await fn(); } catch (e) { console.log('ERREUR', nom, String(e).slice(0, 160)); } };
const bas = async (nom) => { const h = await page.evaluate(() => { const m = document.querySelector('main'); return Math.max(document.scrollingElement.scrollHeight, m?.scrollHeight || 0); }); if (h > 1000) { await page.evaluate(() => { scrollBy(0, 760); document.querySelector('main')?.scrollBy(0, 760); }); await pause(400); await cap(page, nom + '-b'); await page.evaluate(() => { scrollTo(0, 0); document.querySelector('main')?.scrollTo(0, 0); }); } };
const temps = async (fn) => { const t = Date.now(); await fn(); return Date.now() - t; };

const clicTexte = (re) => page.evaluate((src) => {
  const r = new RegExp(src);
  const c = [...document.querySelectorAll('button, a, [role=button], summary, li, article')].filter((x) => x.getClientRects().length).reverse()
    .find((x) => r.test(((x.getAttribute('aria-label') || '') + ' ' + x.textContent).trim().replace(/\s+/g, ' ')));
  c?.click(); return c ? (c.getAttribute('aria-label') || c.textContent).trim().slice(0, 50) : null;
}, re.source);
const dialogBoutons = () => page.evaluate(() => [...document.querySelectorAll('[role=dialog] button, [data-vaul-drawer] button')]
  .filter((b) => b.getClientRects().length).map((b) => (b.getAttribute('aria-label') || b.textContent).trim().replace(/\s+/g, ' ').slice(0, 36)));

await etape('reglages', async () => {
  await nav('Bord'); await page.evaluate(() => [...document.querySelectorAll('header button')].filter((x) => x.getClientRects().length).at(-1)?.click()); await pause(1500);
  console.log('REGL', await clicTexte(/^Réglages/)); await page.waitForFunction(() => !/Ouverture…|Ouverture\.\.\./.test(document.body.innerText), { timeout: 30000 }).catch(() => console.log('REGLAGES LENT > 30 s'));
  await pause(800); await cap(page, 'h-reglages'); await bas('h-reglages'); console.log('DLG', JSON.stringify(await dialogBoutons())); await fermer(); await fermer();
});
await etape('recherche', async () => {
  await nav('Bord'); await page.evaluate(() => document.querySelector('[aria-label^="Rechercher"]')?.click()); await pause(1200);
  const f = await page.evaluate(() => document.activeElement?.tagName + ' ' + (document.activeElement?.getAttribute('placeholder') || ''));
  console.log('FOCUS', f); await page.keyboard.type('citra', { delay: 40 }); await pause(1500); await cap(page, 'h-recherche'); await page.keyboard.press('Escape'); await pause(500);
});
await etape('brassin-fiche', async () => {
  await nav('Brassins'); await cliquer(page, 'Brassins (4)'); await pause(1000);
  await page.evaluate(() => document.querySelector('[aria-label="Ouvrir le brassin ZZ-LOT-1"]')?.click()); await pause(2500);
  await cap(page, 'h-brassin-fiche'); await bas('h-brassin-fiche'); console.log('DLG', JSON.stringify(await dialogBoutons())); await fermer();
});
await etape('fut-fiche', async () => { await nav('Stocks'); await cliquer(page, 'Fûts'); await pause(1000); console.log('CLIC', await clicTexte(/^F-001/)); await pause(1500); await cap(page, 'h-fut-fiche'); console.log('DLG', JSON.stringify(await dialogBoutons())); await fermer(); });
await etape('article', async () => {
  await nav('Stocks'); await cliquer(page, 'Articles'); await pause(1200);
  console.log('CLIC', await clicTexte(/^Caramünch Typ 2/)); await pause(1500); await cap(page, 'h-article'); console.log('DLG', JSON.stringify(await dialogBoutons())); await fermer();
});
await etape('client', async () => { await nav('Clients'); await cliquer(page, 'Carnet'); await pause(1000); console.log('CLIC', await clicTexte(/^Cave à Bières Morat/)); await pause(1500); await cap(page, 'h-client'); await bas('h-client'); await fermer(); });
await etape('eau', async () => {
  await nav('Brassins'); await cliquer(page, 'Recettes'); await pause(1200); await clicTexte(/^ZZ TEST IPA Noël/); await pause(1500);
  await cliquer(page, 'Modifier', { dernier: true }); await pause(3000); await cap(page, 'h-wizard-1');
  for (let i = 0; i < 6; i++) { const t = await page.evaluate(() => document.body.innerText); if (/Eau et sels|Sels d.eau|Profil d.eau/.test(t) && /Eau/.test(document.querySelector('h1,h2,[aria-current=step]')?.textContent || '')) break; await cliquer(page, 'Suivant', { dernier: true }); await pause(1500); }
  await cap(page, 'h-eau'); await bas('h-eau');
});
await etape('hors-ligne', async () => {
  await fermer(); await fermer(); await nav('Bord'); await page.setOfflineMode(true); await page.evaluate(() => window.dispatchEvent(new Event('offline'))); await pause(2000);
  await cap(page, 'h-hors-ligne'); await page.setOfflineMode(false);
});
await browser.close();
