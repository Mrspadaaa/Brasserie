// Parcours réel du banc ?dev-local : recette de démonstration par l'assistant, enregistrée, rouverte depuis le carnet (fiche de recette).
import { ouvrir, etape, texte, cliquer, capture, dormir } from './banc.mjs';
const largeur = Number(process.argv[2] ?? 1280);
const theme = process.argv[3] ?? 'clair';
const { browser, page } = await ouvrir({ largeur, hauteur: largeur < 600 ? 844 : 900, theme });
const lignes = async (re, n = 14) => (await texte(page)).split('\n').filter((l) => re.test(l)).slice(0, n).join(' | ').slice(0, 600);
await etape(page, 'Récap');
console.log('enregistrer ->', await cliquer(page, 'Enregistrer la recette'));
await dormir(2500);
await cliquer(page, 'Brassins'); await dormir(1200);
console.log('onglets ->', await lignes(/Recettes|Brassins|Catalogue|Stout/));
console.log('recettes ->', await cliquer(page, 'Recettes')); await dormir(1200);
console.log('carnet ->', await lignes(/Stout|recette|IBU/i));
await capture(page, `s12-carnet-${largeur}-${theme}`);
const ouvert = await page.evaluate(() => {
  const c = [...document.querySelectorAll('a,button,[role=button],article,li')].find((e) => /Stout export/.test(e.textContent || '') && !/Supprimer|Ranger/.test(e.getAttribute('aria-label') || ''));
  if (!c) return false;
  c.scrollIntoView({ block: 'center' }); c.click();
  return `${c.tagName}:${(c.textContent || '').slice(0, 60)}`;
});
console.log('ouvrir ->', ouvert);
await dormir(2500);
console.log('fiche ->', (await texte(page)).replace(/\n+/g, ' | ').slice(0, 700));
await capture(page, `s12-fiche-${largeur}-${theme}`, { fullPage: true });
await browser.close();
