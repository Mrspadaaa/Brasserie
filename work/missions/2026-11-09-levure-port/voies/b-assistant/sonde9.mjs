// Paliers : retirer le seul palier (BR-31), ajouter un palier (TE-29), puis le Récap dit-il le manque ?
import { ouvrir, etape, texte, cliquer, capture, dormir } from './banc.mjs';
const largeur = Number(process.argv[2] ?? 1280);
const { browser, page } = await ouvrir({ largeur, hauteur: largeur < 600 ? 844 : 900 });
const filtre = async (re) => (await texte(page)).split('\n').filter((l) => re.test(l)).join(' | ').slice(0, 500);
await etape(page, 'Paliers');
console.log('avant ->', await filtre(/Saccharification|palier|Aucun|sans eau|empâtage/i));
console.log('retirer ->', await cliquer(page, 'Retirer le palier'));
await dormir(800);
const alertes = await page.evaluate(() => [...document.querySelectorAll('[role=alert],[role=status]')].map((e) => e.textContent.trim().slice(0, 160)));
console.log('après retrait ->', await filtre(/Saccharification|Aucun palier|sans saccharification|Temps et conduite|grain/i), JSON.stringify(alertes));
await capture(page, `s9-palier-retire-${largeur}`, { fullPage: true });
console.log('ajouter ->', await cliquer(page, 'Ajouter un palier'));
await dormir(600);
console.log('nom du palier ajouté ->', await page.evaluate(() => [...document.querySelectorAll('input')].filter((i) => /Nom du palier/.test(i.getAttribute('aria-label') || '')).map((i) => i.value)));
await etape(page, 'Récap');
console.log('récap ->', await filtre(/À compléter|palier|Paliers|empâtage|Saccharification/i));
await browser.close();
