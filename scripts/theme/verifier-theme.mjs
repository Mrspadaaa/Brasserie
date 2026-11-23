// G3 de la voie t1-theme (#144) : l'app s'ouvre en clair par défaut, passe en « cave » par le bouton de l'en-tête (à côté
// de l'import dans le wizard), garde ce choix au rechargement, et le pose AVANT le premier rendu (sans clignotement).
// Lance son propre serveur Vite (?dev-local, aucune donnée réelle ; toute requête hors localhost est coupée).
// Usage : node scripts/theme/verifier-theme.mjs [--defaut=clair|cave] [--captures=<dossier>]
//   --defaut=cave : témoin négatif (G4) ; l'app étant claire par défaut, la vérification doit échouer.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createServer } from 'vite';

const RACINE = path.resolve(import.meta.dirname, '..', '..');
const { ouvrir, calme, cliquerTexte } = await import(pathToFileURL(path.join(RACINE, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const opt = (n, d) => process.argv.find((a) => a.startsWith(`--${n}=`))?.split('=')[1] ?? d;
const attenduDefaut = opt('defaut', 'clair');
const captures = opt('captures', '');
if (captures) fs.mkdirSync(captures, { recursive: true });
const FOND = { clair: 'rgb(255, 255, 255)', cave: 'rgb(18, 16, 14)' };

const echecs = [];
const verifie = (nom, ok, detail = '') => { if (!ok) echecs.push(nom); console.log(`${ok ? 'OK    ' : 'ECHEC '} ${nom}${detail ? ` — ${detail}` : ''}`); };

const port = 3190 + Math.floor(Math.random() * 9);
const serveur = await createServer({ root: RACINE, logLevel: 'error', server: { port, strictPort: true, host: '127.0.0.1' } });
await serveur.listen();
const base = `http://127.0.0.1:${port}`;
const { browser, page } = await ouvrir({ largeur: 390, hauteur: 844 });
try {
  // Thème lu au moment où <body> apparaît : avant le premier rendu possible.
  await page.evaluateOnNewDocument(() => {
    new MutationObserver((_, obs) => {
      if (document.body) { window.__themeAuCorps = document.documentElement.dataset.theme ?? null; obs.disconnect(); }
    }).observe(document, { childList: true, subtree: true });
  });
  const etat = () => page.evaluate(() => ({
    theme: document.documentElement.dataset.theme ?? null,
    auCorps: window.__themeAuCorps ?? null,
    fond: getComputedStyle(document.body).backgroundColor,
    stocke: localStorage.getItem('laffinee.theme'),
    barre: document.querySelector('meta[name="theme-color"]')?.getAttribute('content') ?? null,
  }));
  const capture = async (n) => { if (captures) await page.screenshot({ path: path.join(captures, `${n}.png`) }); };

  // 1. Premier lancement, stockage vide.
  await page.goto(`${base}/?dev-local`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => localStorage.removeItem('laffinee.theme'));
  await page.reload({ waitUntil: 'networkidle0' });
  await calme(page, 800);
  const e1 = await etat();
  await capture('theme-01-defaut');
  verifie(`thème par défaut : ${attenduDefaut}`, e1.theme === attenduDefaut && e1.auCorps === attenduDefaut && e1.fond === FOND[attenduDefaut],
    `posé ${e1.theme}, au premier rendu ${e1.auCorps}, fond ${e1.fond}`);

  // 2. Le bouton de l'en-tête de l'accueil passe en cave.
  const bouton = await page.$('header [data-theme-toggle]');
  verifie('bouton du thème dans l\'en-tête de l\'accueil', !!bouton);
  if (bouton) await bouton.click();
  await calme(page, 300);
  const e2 = await etat();
  await capture('theme-02-cave-accueil');
  verifie('un toucher passe en cave et le garde sur l\'appareil', e2.theme === 'cave' && e2.fond === FOND.cave && e2.stocke === 'cave' && /12100e/i.test(e2.barre ?? ''),
    `posé ${e2.theme}, fond ${e2.fond}, stocké ${e2.stocke}, barre ${e2.barre}`);

  // 3. Rechargement : cave dès le premier rendu (script d'index.html), sans repasser par le clair.
  await page.reload({ waitUntil: 'networkidle0' });
  await calme(page, 800);
  const e3 = await etat();
  verifie('le choix tient au rechargement, posé avant le premier rendu', e3.theme === 'cave' && e3.auCorps === 'cave' && e3.fond === FOND.cave,
    `au premier rendu ${e3.auCorps}, fond ${e3.fond}`);

  // 4. Le wizard : le bouton est dans l'en-tête, juste à côté de l'import, et ramène au clair.
  await page.locator('::-p-aria(Actions rapides)').click();
  await calme(page, 400);
  await cliquerTexte(page, 'Créer une recette');
  await calme(page, 1500);
  const voisin = await page.evaluate(() => {
    const t = [...document.querySelectorAll('[data-theme-toggle]')].find((b) => b.getBoundingClientRect().width > 0 && b.closest('.recipe-titlebar'));
    const prec = t?.previousElementSibling;
    return { trouve: !!t, voisin: prec?.getAttribute('aria-label') ?? null, haut: t ? Math.round(t.getBoundingClientRect().top) : null };
  });
  await capture('theme-03-wizard-cave');
  verifie('dans le wizard, le bouton du thème suit l\'icône d\'import, en haut à droite', voisin.trouve && voisin.voisin === 'Coller une recette' && voisin.haut < 60,
    `voisin « ${voisin.voisin} », haut ${voisin.haut} px`);
  await page.locator('.recipe-titlebar [data-theme-toggle]').click();
  await calme(page, 300);
  const e4 = await etat();
  await capture('theme-04-wizard-clair');
  verifie('retour au clair depuis le wizard, gardé', e4.theme === 'clair' && e4.fond === FOND.clair && e4.stocke === 'clair', `posé ${e4.theme}, stocké ${e4.stocke}`);
} catch (e) {
  verifie('parcours joué jusqu\'au bout', false, String(e?.message ?? e));
} finally {
  await browser.close();
  await serveur.close();
}
console.log(echecs.length ? `THEME ECHEC ${echecs.length} : ${echecs.join(' ; ')}` : 'THEME OK');
process.exit(echecs.length ? 1 : 0);
