// Captures de la voie f1 : node scripts/with_server.mjs --server "npx vite --port 3108 --strictPort" --port 3108 -- node <ce fichier>
// Fiche « Milk Stout » du banc (données simulées), 390 tactile et 1280, clair et cave. Chaque PNG est à ouvrir.
import { ouvrir, calme } from '../../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = dirname(fileURLToPath(import.meta.url));
const sortie = join(ici, '..', 'captures');
mkdirSync(sortie, { recursive: true });
const URL = 'http://localhost:3108/work/missions/2026-11-19-bugs-ecrans/voies/f1/banc/index.html';
const tailles = [{ nom: '390', largeur: 390, hauteur: 844, mobile: true }, { nom: '1280', largeur: 1280, hauteur: 900, mobile: false }];
const themes = ['clair', 'cave'];

for (const t of tailles) for (const theme of themes) {
  const { browser, page, journal } = await ouvrir({ largeur: t.largeur, hauteur: t.hauteur, mobile: t.mobile });
  await page.evaluateOnNewDocument((th) => { try { localStorage.setItem('laffinee.theme', th); } catch {} }, theme);
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await calme(page, 1200);
  // Ouvre toutes les sections de la fiche pour que la capture montre Houblons, Additifs et Brassins.
  await page.evaluate(() => document.querySelectorAll('details').forEach((d) => { d.open = true; }));
  await calme(page, 600);
  await page.screenshot({ path: join(sortie, `fiche-${t.nom}-${theme}.png`), fullPage: true });
  const texte = await page.evaluate(() => document.body.innerText);
  console.log(`${t.nom} ${theme} : erreurs ${journal.erreurs.length} ; IBU ${/IBU\s*\n?\s*(\d+)/.exec(texte)?.[1] ?? '?'} ; aucun brassin ${/aucun brassin/.test(texte)} ; Rstgerste ${/Rstgerste|Caramnch/.test(texte)} ; Lactose sous Houblons ${/Houblons[\s\S]{0,400}Lactose/.test(texte)}`);
  if (journal.erreurs.length) console.log(journal.erreurs.slice(0, 3));
  await browser.close();
}
