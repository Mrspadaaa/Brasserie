// Captures de la voie g1 : node scripts/with_server.mjs --server "npx vite --port 3109 --strictPort" --port 3109 -- node work/missions/2026-11-19-bugs-ecrans/voies/g1/capturer.mjs
// Écran Dépense, états SIMULÉS de `apercuDev.ts` : `montant-deduit` (LR2-6) et `port` (LR2-4, rangée Articles sans le port), 390 tactile et 1280, clair et cave.
// Chemin : ?dev-local&depense=<état> ouvre le tableau de bord ; la feuille Dépense s'ouvre par le « + » flottant (FloatingActions, « Actions rapides »)
// puis « Nouvelle écriture » (PlusSheet). Si « Impossible de charger la brasserie » s'affiche, un rechargement.
// Sortie : une ligne par capture (erreurs, feuille ouverte, textes lus). La vérification se fait en ouvrant chaque PNG.
import { ouvrir, calme, cliquerTexte } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const sortie = join(dirname(fileURLToPath(import.meta.url)), 'captures');
mkdirSync(sortie, { recursive: true });
const tailles = [{ nom: '390', largeur: 390, hauteur: 844, mobile: true }, { nom: '1280', largeur: 1280, hauteur: 900, mobile: false }];
const URL_BASE = 'http://localhost:3109/?dev-local';
const CHARGEMENT_KO = 'Impossible de charger la brasserie';

async function ouvrirFeuille(page) {
  await page.waitForSelector('button[title="Actions rapides"]', { timeout: 20000 });
  await page.click('button[title="Actions rapides"]');
  await new Promise((r) => setTimeout(r, 800));
  try { await cliquerTexte(page, 'Nouvelle écriture', { timeout: 5000 }); return 'Nouvelle écriture'; }
  catch { await cliquerTexte(page, 'Écriture', { timeout: 5000 }); return 'Écriture'; }
}

for (const etat of ['montant-deduit', 'port']) for (const t of tailles) for (const theme of ['clair', 'cave']) {
  const { browser, page, journal } = await ouvrir({ largeur: t.largeur, hauteur: t.hauteur, mobile: t.mobile });
  try {
    await page.evaluateOnNewDocument((th) => { try { localStorage.setItem('laffinee.theme', th); } catch {} }, theme);
    await page.goto(`${URL_BASE}&depense=${etat}`, { waitUntil: 'networkidle0' });
    await calme(page, 1000);
    if ((await page.evaluate(() => document.body.innerText)).includes(CHARGEMENT_KO)) {
      await page.reload({ waitUntil: 'networkidle0' });
      await calme(page, 1000);
    }
    const bouton = await ouvrirFeuille(page);
    await calme(page, 1200);
    await page.screenshot({ path: join(sortie, `${etat}-${t.nom}-${theme}.png`) });
    const texte = await page.evaluate(() => document.body.innerText);
    const feuille = await page.evaluate(() => !!document.querySelector('[role="dialog"], [aria-modal="true"]'));
    const erreurEcran = /Écran indisponible/.test(texte);
    const lignes = (texte.match(/\d+ lignes[^\n]*/) ?? ['—'])[0];
    const lus = (texte.match(/Articles lus \d+/) ?? ['—'])[0];
    console.log(`${etat} ${t.nom} ${theme} : erreurs ${journal.erreurs.length} ; ouvert par « ${bouton} » ; feuille ${feuille} ; « Écran indisponible » ${erreurEcran} ; Sédation ${/Sédation/.test(texte)} ; à remplir ${/à remplir/.test(texte)} ; montant déduit ${/montant déduit \(somme = total\) : à contrôler/.test(texte)} ; en-tête « ${lignes} » ; rangée « ${lus} »`);
  } catch (e) {
    console.log(`${etat} ${t.nom} ${theme} : ÉCHEC ${String(e?.message ?? e).split('\n')[0]}`);
  } finally { await browser.close(); }
}
