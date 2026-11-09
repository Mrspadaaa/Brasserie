// Étape Eau à 390 : onglets « 1. Eau » et « 2. Sels » ; refus dits (épaisseur, gypse), sans débordement horizontal.
import { ouvrir, etape, taper, valeurChamp, cliquer, capture, dormir } from './banc.mjs';
const largeur = Number(process.argv[2] ?? 390);
const theme = process.argv[3] ?? 'clair';
const { browser, page } = await ouvrir({ largeur, hauteur: 844, theme });
const alertes = () => page.evaluate(() => [...document.querySelectorAll('[role=alert]')].map((e) => e.textContent.trim().slice(0, 150)));
const debord = () => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
await etape(page, 'Eau');
await taper(page, 'Rapport eau grain', '-1'); await page.keyboard.press('Tab'); await dormir(600);
console.log('1. Eau, épaisseur −1 ->', await valeurChamp(page, 'Rapport eau grain'), JSON.stringify(await alertes()), 'débord', await debord());
await capture(page, `s14-eau-1-${largeur}-${theme}`);
await taper(page, 'Rapport eau grain', '2,5'); await page.keyboard.press('Tab'); await dormir(600);
console.log('épaisseur 2,5 ->', await valeurChamp(page, 'Rapport eau grain'));
console.log('onglet sels ->', await cliquer(page, '2. Sels')); await dormir(800);
await taper(page, 'Dose de Gypse', '-1'); await page.keyboard.press('Tab'); await dormir(600);
console.log('2. Sels, gypse −1 ->', await valeurChamp(page, 'Dose de Gypse'), JSON.stringify(await alertes()), 'débord', await debord());
await capture(page, `s14-eau-2-${largeur}-${theme}`);
await browser.close();
