// Captures de la voie d3b (M9-1) : node scripts/with_server.mjs --server "npx vite --port 3121 --strictPort" --port 3121 -- node work/missions/2026-11-19-bugs-ecrans/voies/d3/capturer-m9-1.mjs
// Écran Dépense, état SIMULÉ `hors-stock` de `apercuDev.ts` (ticket « Brauhaus Fictif », une ligne « Citra » dont deux articles voisins sont au stock : elle reste hors stock).
// Geste : « + » flottant, « Nouvelle écriture », puis « Confirmer et enregistrer » SANS rien changer : le bandeau « À corriger » doit nommer « Citra : ingrédient hors stock… ».
// 390 tactile (en défilant jusqu'au bandeau) et 1280, clair et cave. Sortie : une ligne par capture ; l'ouverture de chaque PNG (Read) est faite à la main.
import { ouvrir, calme, cliquerTexte } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const sortie = join(dirname(fileURLToPath(import.meta.url)), 'captures');
mkdirSync(sortie, { recursive: true });
const tailles = [{ nom: '390', largeur: 390, hauteur: 844, mobile: true }, { nom: '1280', largeur: 1280, hauteur: 900, mobile: false }];
const URL_BASE = `http://localhost:${process.env.WITH_SERVER_PORTS?.split(',')[0] ?? 3121}/?dev-local`;
const CHARGEMENT_KO = 'Impossible de charger la brasserie';

async function ouvrirFeuille(page) {
  await page.waitForSelector('button[title="Actions rapides"]', { timeout: 20000 });
  await page.click('button[title="Actions rapides"]');
  await new Promise((r) => setTimeout(r, 800));
  try { await cliquerTexte(page, 'Nouvelle écriture', { timeout: 5000 }); return 'Nouvelle écriture'; }
  catch { await cliquerTexte(page, 'Écriture', { timeout: 5000 }); return 'Écriture'; }
}

for (const t of tailles) for (const theme of ['clair', 'cave']) {
  const { browser, page, journal } = await ouvrir({ largeur: t.largeur, hauteur: t.hauteur, mobile: t.mobile });
  try {
    await page.evaluateOnNewDocument((th) => { try { localStorage.setItem('laffinee.theme', th); } catch {} }, theme);
    await page.goto(`${URL_BASE}&depense=hors-stock`, { waitUntil: 'networkidle0' });
    await calme(page, 1000);
    if ((await page.evaluate(() => document.body.innerText)).includes(CHARGEMENT_KO)) { await page.reload({ waitUntil: 'networkidle0' }); await calme(page, 1000); }
    await ouvrirFeuille(page);
    await calme(page, 1500);
    const avant = await page.evaluate(() => document.body.innerText);
    const principal = await page.$('button[data-primary]');
    if (!principal) throw new Error('bouton principal introuvable');
    await principal.evaluate((b) => b.scrollIntoView({ block: 'center' }));
    await calme(page, 300);
    await principal.click();
    await calme(page, 1200);
    const alerte = await page.evaluate(() => [...document.querySelectorAll('[role="alert"]')].map((a) => a.textContent).join(' | '));
    const bandeau = await page.$('[role="alert"]');
    if (bandeau) await bandeau.evaluate((b) => b.scrollIntoView({ block: 'center' }));
    await calme(page, 400);
    await page.screenshot({ path: join(sortie, `m9-1-${t.nom}-${theme}.png`) });
    const texte = await page.evaluate(() => document.body.innerText);
    console.log(`m9-1 ${t.nom} ${theme} : erreurs ${journal.erreurs.length} ; ligne « hors stock » avant ${/Citra/.test(avant)} ; alerte « ${alerte.slice(0, 160)} » ; « Enregistré » ${/Achat enregistré|Enregistré avec succès/.test(texte)}`);
  } catch (e) {
    console.log(`m9-1 ${t.nom} ${theme} : ÉCHEC ${String(e?.message ?? e).split('\n')[0]}`);
  } finally { await browser.close(); }
}
