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

// Bord
await etape('bord-semaine', async () => { await nav('Bord'); console.log('CLIC', await clicTexte(/^Cette semaine au calendrier/)); await charge(); await cap(page, 'g-bord-semaine'); });
await etape('bord-agenda-coche', async () => {
  await nav('Bord'); const t0 = Date.now();
  await page.evaluate(() => document.querySelector('main input[type=checkbox]')?.click()); await pause(800);
  await cap(page, 'g-bord-coche', { ms: Date.now() - t0 });
});
await etape('bord-echeances', async () => { await nav('Bord'); await page.evaluate(() => scrollTo(0, 400)); console.log('CLIC', await clicTexte(/Échéances et démarches/)); await pause(1500); await cap(page, 'g-echeances'); await bas('g-echeances'); await fermer(); });
// Brassins : fiche, mesures, recette
await etape('brassin-fiche', async () => {
  await nav('Brassins'); await cliquer(page, 'Brassins (4)'); await pause(1000); await cliquer(page, 'Ouvrir le brassin ZZ-LOT-1'); await pause(2000);
  await cap(page, 'g-brassin-fiche'); await bas('g-brassin-fiche'); console.log('DLG', JSON.stringify(await dialogBoutons())); await fermer();
});
await etape('brassin-mesures', async () => {
  await nav('Brassins'); await cliquer(page, 'Brassins (4)'); await pause(800); await cliquer(page, 'Voir les mesures · ZZ-LOT-1'); await pause(2000);
  await cap(page, 'g-mesures'); console.log('DLG', JSON.stringify(await dialogBoutons()));
  console.log('MESURER', await clicTexte(/^(Mesurer|Ajouter une mesure|\+ Mesure|Nouvelle mesure)/)); await pause(1500);
  await cap(page, 'g-mesure-saisie'); await fermer(); await fermer();
});
await etape('recette-fiche', async () => {
  await nav('Brassins'); await cliquer(page, 'Recettes'); await pause(1200); console.log('CLIC', await clicTexte(/ZZ TEST IPA Noël/)); await pause(2000);
  await cap(page, 'g-recette-fiche'); await bas('g-recette-fiche'); console.log('DLG', JSON.stringify(await dialogBoutons())); await fermer();
});
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
// Calendrier : ajouter
await etape('cal-ajout', async () => {
  await nav('Calendrier');
  const l = await page.evaluate(() => [...document.querySelectorAll('main button')].map((b) => b.getAttribute('aria-label')).filter(Boolean).filter((a) => /Ajouter|Nouvel|Nouvelle/.test(a)).slice(0, 10));
  console.log('CAL+', JSON.stringify(l)); if (l.length) await cliquer(page, l.find((x) => /Fête/.test(x)) || l[0]); await pause(1500);
  await cap(page, 'g-cal-ajout'); console.log('DLG', JSON.stringify(await dialogBoutons())); await fermer();
});
// Finances : prévisions
await etape('fin-prev', async () => { await nav('Finances'); await cliquer(page, 'Prévisions'); await pause(1500); await cap(page, 'g-fin-prev'); await bas('g-fin-prev'); });
// Recherche, compte, réglages, hors ligne
await etape('recherche', async () => { await nav('Bord'); await page.locator('::-p-aria(Rechercher (⌘K))').click(); await pause(1000); await page.keyboard.type('citra'); await pause(1500); await cap(page, 'g-recherche'); await page.keyboard.press('Escape'); await pause(500); });
await etape('compte', async () => {
  await nav('Bord');
  const a = await page.evaluate(() => { const b = [...document.querySelectorAll('header button, header a')].filter((x) => x.getClientRects().length).at(-1); b?.click(); return b?.getAttribute('aria-label') || b?.textContent; });
  console.log('COMPTE', a); await pause(1500); await cap(page, 'g-compte'); console.log('DLG', JSON.stringify(await dialogBoutons()));
});
await etape('reglages', async () => { console.log('REGL', await clicTexte(/Réglages|Paramètres|Matériel de brassage/)); await pause(1500); await cap(page, 'g-reglages'); await bas('g-reglages'); await fermer(); await fermer(); });
await etape('hors-ligne', async () => {
  await nav('Bord'); await page.setOfflineMode(true); await page.evaluate(() => window.dispatchEvent(new Event('offline'))); await pause(1500);
  await cap(page, 'g-hors-ligne'); await nav('Calendrier'); await cap(page, 'g-hors-ligne-cal');
  await page.setOfflineMode(false); await page.evaluate(() => window.dispatchEvent(new Event('online')));
});
await browser.close();
