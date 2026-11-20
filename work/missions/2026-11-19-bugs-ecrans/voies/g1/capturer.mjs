// Captures de la voie g1 : node scripts/with_server.mjs --server "npx vite --port 3109 --strictPort" --port 3109 -- node work/missions/2026-11-19-bugs-ecrans/voies/g1/capturer.mjs
// Écran Dépense, états SIMULÉS de `apercuDev.ts` : `montant-deduit` (LR2-6) et `port` (LR2-4, rangée Articles sans le port), 390 tactile et 1280, clair et cave. Chaque PNG est à ouvrir.
import { ouvrir, calme } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const sortie = join(dirname(fileURLToPath(import.meta.url)), 'captures');
mkdirSync(sortie, { recursive: true });
const tailles = [{ nom: '390', largeur: 390, hauteur: 844, mobile: true }, { nom: '1280', largeur: 1280, hauteur: 900, mobile: false }];
for (const etat of ['montant-deduit', 'port']) for (const t of tailles) for (const theme of ['clair', 'cave']) {
  const { browser, page, journal } = await ouvrir({ largeur: t.largeur, hauteur: t.hauteur, mobile: t.mobile });
  try {
    await page.evaluateOnNewDocument((th) => { try { localStorage.setItem('laffinee.theme', th); } catch {} }, theme);
    await page.goto(`http://localhost:3109/?dev-local&depense=${etat}`, { waitUntil: 'networkidle0' });
    await calme(page, 1500);
    await page.screenshot({ path: join(sortie, `${etat}-${t.nom}-${theme}.png`) });
    const texte = await page.evaluate(() => document.body.innerText);
    console.log(`${etat} ${t.nom} ${theme} : erreurs ${journal.erreurs.length} ; « Sédation » ${/Sédation/.test(texte)} ; « 0,00 » ${/0[,.]00/.test(texte)} ; « à remplir » ${/à remplir/.test(texte)}`);
  } finally { await browser.close(); }
}
