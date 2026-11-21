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
    .find((x) => r.test((x.getAttribute('aria-label') || '') + ' ' + x.textContent));
  c?.click(); return c ? (c.getAttribute('aria-label') || c.textContent).trim().slice(0, 50) : null;
}, re.source);
const dialogBoutons = () => page.evaluate(() => [...document.querySelectorAll('[role=dialog] button, [data-vaul-drawer] button')]
  .filter((b) => b.getClientRects().length).map((b) => (b.getAttribute('aria-label') || b.textContent).trim().replace(/\s+/g, ' ').slice(0, 36)));

// Matériel
await etape('materiel-item', async () => {
  await nav('Stocks'); await cliquer(page, 'Matériel'); await pause(1200); console.log('CLIC', await clicTexte(/^Cuve d.ébullition/)); await pause(1500);
  await cap(page, 'g-materiel-fiche'); await bas('g-materiel-fiche'); console.log('DLG', JSON.stringify(await dialogBoutons())); await fermer();
});
await etape('materiel-etalonner', async () => { await nav('Stocks'); await cliquer(page, 'Matériel'); await pause(1000); await cliquer(page, 'Étalonner'); await pause(1500); await cap(page, 'g-etalonner'); await fermer(); });
await etape('materiel-achat', async () => { await nav('Stocks'); await cliquer(page, 'Matériel'); await pause(1000); await cliquer(page, 'Achat'); await pause(1500); await cap(page, 'g-materiel-achat'); await fermer(); });
// Fûts
await etape('fut', async () => { await nav('Stocks'); await cliquer(page, 'Fûts'); await pause(1000); await cliquer(page, 'Remplir depuis un lot'); await pause(1500); await cap(page, 'g-fut-remplir'); await fermer(); });
// Clients
await etape('client-ligne', async () => { await nav('Clients'); await cliquer(page, 'Carnet'); await pause(1000); console.log('CLIC', await clicTexte(/^Cave à Bières Morat/)); await pause(1500); await cap(page, 'g-client'); console.log('DLG', JSON.stringify(await dialogBoutons())); await fermer(); });
await etape('clients-prix', async () => { await nav('Clients'); await cliquer(page, 'Prix'); await pause(1500); await cap(page, 'g-clients-prix'); });
await etape('fut-fiche', async () => { await nav('Stocks'); await cliquer(page, 'Fûts'); await pause(1000); console.log('CLIC', await clicTexte(/^F-001/)); await pause(1500); await cap(page, 'g-fut-fiche'); console.log('DLG', JSON.stringify(await dialogBoutons())); await fermer(); });
await etape('article-ligne', async () => { await nav('Stocks'); await cliquer(page, 'Articles'); await pause(1200); await page.evaluate(() => scrollTo(0, 560)); await pause(400); console.log('CLIC', await clicTexte(/^Caramünch Typ 2/)); await pause(1500); await cap(page, 'g-article'); console.log('DLG', JSON.stringify(await dialogBoutons())); await fermer(); });
await etape('clients-impot', async () => { await nav('Clients'); await cliquer(page, 'Impôt bière'); await pause(1500); await cap(page, 'g-clients-impot'); });
await browser.close();