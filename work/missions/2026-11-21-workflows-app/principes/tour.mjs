// Tour complet : chaque onglet, sous-onglet, création et feuille, à 390 tactile. Sortie : captures/ + tour.log
import { ouvrir, cap, cliquer, pause } from './commun.mjs';
const { browser, page } = await ouvrir();
const charge = async () => { await page.waitForFunction(() => { const m = document.querySelector('main'); return m && (m.innerText.match(/\S+/g) || []).length > 45 && !/Recharger l.application/.test(m.innerText); }, { timeout: 30000 }).catch(() => console.log('LENT/ECHEC chargement')); await pause(700); };
const nav = async (t) => { await page.evaluate((t) => { const n = [...document.querySelectorAll('nav')].find(x => x.getBoundingClientRect().bottom >= innerHeight - 5); [...n.querySelectorAll('button,a')].find(b => (b.getAttribute('aria-label')||b.textContent).trim().startsWith(t))?.click(); }, t); await charge(); };
const fermer = async () => { await page.keyboard.press('Escape'); await pause(500); await cliquer(page, 'Fermer', { dernier: true }); await pause(500); };
const etape = async (nom, fn) => { try { await fn(); } catch (e) { console.log('ERREUR', nom, String(e).slice(0, 160)); } };
const bas = async (nom) => { const h = await page.evaluate(() => { const m = document.querySelector('main'); return Math.max(document.scrollingElement.scrollHeight, m?.scrollHeight || 0); }); if (h > 1000) { await page.evaluate(() => { scrollBy(0, 760); document.querySelector('main')?.scrollBy(0, 760); }); await pause(400); await cap(page, nom + '-b'); await page.evaluate(() => { scrollTo(0, 0); document.querySelector('main')?.scrollTo(0, 0); }); } };
const temps = async (fn) => { const t = Date.now(); await fn(); return Date.now() - t; };

// 1. Onglets et sous-onglets
for (const [t, subs] of [['Finances', []], ['Calendrier', []], ['Brassins', ['Recettes', 'Atelier', 'Volumes']], ['Stocks', []], ['Clients', []]]) {
  await etape(t, async () => {
    const ms = await temps(() => nav(t)); const slug = 't-' + t.toLowerCase();
    await cap(page, slug, { ms }); await bas(slug);
    const segs = await page.evaluate(() => [...document.querySelectorAll('main [role=tab], main [aria-pressed], main [role=radio], main [aria-selected]')].filter(b => b.getClientRects().length).map(b => (b.getAttribute('aria-label')||b.textContent).trim().replace(/\s+/g,' ').slice(0, 30)));
    console.log('SEG', t, JSON.stringify(segs));
    const liste = subs.length ? subs : segs.filter(s => s && s.length < 25).slice(0, 8);
    for (const s of liste) { await etape(t + '/' + s, async () => { if (!(await cliquer(page, s))) return console.log('ABSENT', s); await charge(); const sl = slug + '-' + s.toLowerCase().normalize('NFD').replace(/[^a-z]+/g, '').slice(0, 12); await cap(page, sl); await bas(sl); }); }
  });
}
// 2. Actions rapides
await etape('plus', async () => {
  await nav('Bord'); await cliquer(page, 'Actions rapides'); await pause(1200); await cap(page, 'q-menu');
  const items = await page.evaluate(() => [...document.querySelectorAll('[role=dialog] button')].filter(b => b.getClientRects().length).map(b => (b.getAttribute('aria-label')||b.textContent).trim().replace(/\s+/g,' ').slice(0, 40)));
  console.log('MENU+', JSON.stringify(items)); await fermer();
  for (const it of items.filter(x => x && !/Fermer|Annuler/.test(x)).slice(0, 9)) {
    await etape('+' + it, async () => { await cliquer(page, 'Actions rapides'); await pause(1000); await cliquer(page, it, { dernier: true }); await pause(2500);
      await cap(page, 'q-' + it.toLowerCase().normalize('NFD').replace(/[^a-z]+/g, '').slice(0, 14)); await fermer(); await fermer(); await nav('Bord'); });
  }
});
// 3. Fiches et feuilles
await etape('fiche-brassin', async () => { await nav('Brassins'); await cliquer(page, 'Ouvrir le brassin ZZ-LOT-1'); await pause(2000); await cap(page, 'f-brassin'); await bas('f-brassin'); await fermer(); });
await etape('mesures', async () => { await nav('Brassins'); await cliquer(page, 'Voir les mesures · ZZ-LOT-1'); await pause(2000); await cap(page, 'f-mesures'); await cliquer(page, 'Mesurer'); await cliquer(page, 'Ajouter une mesure'); await pause(1200); await cap(page, 'f-mesure-saisie'); await fermer(); await fermer(); });
await etape('fiche-client', async () => { await nav('Clients'); const ok = await page.evaluate(() => { const c = [...document.querySelectorAll('main button, main a, main [role=button]')].find(x => /ZZ TEST Bar|Cave|Bar /.test(x.textContent)); c?.click(); return !!c; }); await pause(1500); await cap(page, 'f-client', { ok }); await bas('f-client'); await fermer(); });
await etape('nouveau-client', async () => { await nav('Clients'); const ok = (await cliquer(page, 'Nouveau client')) || (await cliquer(page, 'Ajouter un client')) || (await cliquer(page, '+ Client')); await pause(1500); await cap(page, 'f-client-nouveau', { ok }); await fermer(); });
await etape('article', async () => { await nav('Stocks'); const ok = await page.evaluate(() => { const c = [...document.querySelectorAll('main button, main [role=button]')].find(x => /Citra|Pale Ale|Pilsner|Malt/.test(x.textContent)); c?.click(); return c?.textContent.slice(0, 40); }); await pause(1500); await cap(page, 'f-article', { ok }); await fermer(); });
await etape('recherche', async () => { await nav('Bord'); await cliquer(page, 'Rechercher'); await pause(800); await page.keyboard.type('citra'); await pause(1200); await cap(page, 'f-recherche'); await fermer(); });
await etape('reglages', async () => { await nav('Bord'); const ok = await page.evaluate(() => { const b = [...document.querySelectorAll('header button')].find(x => /^G|Compte|Profil|Réglages/i.test((x.getAttribute('aria-label')||x.textContent).trim())); b?.click(); return b?.getAttribute('aria-label') || b?.textContent; }); await pause(1200); await cap(page, 'f-compte', { ok }); const r = (await cliquer(page, 'Réglages')) || (await cliquer(page, 'Paramètres')); await pause(1500); await cap(page, 'f-reglages', { r }); await bas('f-reglages'); await fermer(); });
await etape('agenda', async () => { await nav('Bord'); await cliquer(page, 'Gérer'); await pause(1500); await cap(page, 'f-agenda'); await fermer(); });
await etape('echeances', async () => { await nav('Bord'); await page.evaluate(() => [...document.querySelectorAll('main *')].find(x => /^Échéances et démarches/.test(x.textContent?.trim()) && x.closest('button,a,[role=button],summary'))?.closest('button,a,[role=button],summary')?.click()); await pause(1500); await cap(page, 'f-echeances'); await fermer(); });
await etape('hors-ligne', async () => { await nav('Bord'); await page.setOfflineMode(true); await page.evaluate(() => window.dispatchEvent(new Event('offline'))); await pause(1500); await cap(page, 'f-hors-ligne'); await cliquer(page, 'Compagnon brasseur'); await pause(2500); await cap(page, 'f-compagnon'); await page.setOfflineMode(false); });
await browser.close();