// Eau, Paliers, Récap : gestes absurdes. Usage : node sonde3.mjs <largeur> <etape>
import { ouvrir, etape, texte, taper, valeurChamp, capture, cliquer, dormir } from './banc.mjs';
const largeur = Number(process.argv[2] ?? 1280);
const quelle = process.argv[3] ?? 'Eau';
const { browser, page } = await ouvrir({ largeur, hauteur: largeur < 600 ? 844 : 900 });
await etape(page, quelle);
const alertes = () => page.evaluate(() => [...document.querySelectorAll('[role=alert]')].map((e) => e.textContent.trim().slice(0, 140)));
const CAS = {
  Eau: [
    ['Volume d’eau d’empâtage', ['99999', '-1']],
    ['Volume d’eau de rinçage', ['99999', '-1']],
    ['Rapport eau grain', ['-1', '2,5']],
    ['Osmosée disponible au total', ['99999']],
    ['Litres d’osmosée', ['-1', '99999']],
    ['Dose de Gypse', ['99999', '-1']],
    ['Dose d’acide lactique 80 % à l’empâtage', ['99999', '-1']],
  ],
  Paliers: [
    ['Température du palier 1', ['99', '-1']],
    ['Durée du palier 1', ['999', '0']],
    ['Température de la phase Fermentation primaire', ['99']],
    ['Durée de la phase Fermentation primaire', ['0', '99999']],
  ],
  'Récap': [
    ['Volume', ['2,5', '99999']],
    ['Eau d’empâtage', ['-1']],
    ['Quantité de levure', ['99999', '-1']],
    ['Durée de fermentation', ['99999']],
  ],
};
for (const [aria, vals] of CAS[quelle]) {
  const avant = await valeurChamp(page, aria);
  for (const v of vals) {
    const ok = await taper(page, aria, v);
    if (!ok) { console.log(aria, v, 'CHAMP ABSENT'); continue; }
    const pend = await valeurChamp(page, aria);
    await page.keyboard.press('Tab'); await dormir(600);
    console.log(`${aria} [${avant}] tapé ${v} -> pendant=${pend} sortie=${await valeurChamp(page, aria)} | alertes=${JSON.stringify(await alertes())}`);
  }
}
await capture(page, `s3-${quelle}-${largeur}`, { fullPage: true });
await browser.close();
