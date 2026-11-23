// Adaptateur : app EN LIGNE, LECTURE SEULE, à jouer avec l'accord du brasseur.
// Le brasseur ouvre lui-même son Chrome QA (port de débogage 9222), se connecte, et laisse
// l'étape Houblons d'une recette ouverte. Le contrôle s'y attache sans créer d'onglet ni de
// session, ne saisit rien, n'enregistre rien, et ne touche que les commandes de SAFE_TAPS
// (ouvrir une liste, une comparaison : jamais Ajouter, Appliquer, Enregistrer, Supprimer).
// Stock attendu : PROD_STOCK=chemin d'un JSON [{ name, pattern?, grams }] relu le jour même en
// lecture seule ; par défaut, l'instantané du 17.10.2026.
import fs from 'node:fs';
import { productionHopStock, productionCatalogueOnly } from './stock-production.mjs';

export const stock = process.env.PROD_STOCK ? JSON.parse(fs.readFileSync(process.env.PROD_STOCK, 'utf8')) : productionHopStock;
export const catalogueOnly = productionCatalogueOnly;
export const attach = true;
export const browserURL = process.env.QA_CHROME || 'http://127.0.0.1:9222';
export const appOrigin = process.env.APP_ORIGIN || 'https://brasserie-l-affinee.web.app';
// Libellés de commandes sans écriture, à compléter avec l'écran refait (phase 8, porte B).
export const safeTaps = (process.env.SAFE_TAPS || 'Mes houblons,Comparer les 4 premiers,Ouvrir la liste').split(',');
export const settleMs = 1200;

export async function findPage(browser) {
  const pages = await browser.pages();
  const page = pages.find((p) => p.url().startsWith(appOrigin));
  if (!page) throw new Error(`aucun onglet ouvert sur ${appOrigin} dans le Chrome QA`);
  const onHops = await page.evaluate(() => /Houblons/.test(document.querySelector('[aria-current="step"]')?.getAttribute('aria-label') || ''));
  if (!onHops) throw new Error('l’onglet n’est pas sur l’étape Houblons : ouvre-la, puis relance');
  return page;
}
