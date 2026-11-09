import { ouvrir, etape, texte, capture, champs } from './banc.mjs';
const largeur = Number(process.argv[2] ?? 1280);
const { browser, page, erreurs } = await ouvrir({ largeur, hauteur: largeur < 600 ? 844 : 900 });
for (const [l, n] of [['Identité', 'id'], ['Malts', 'ferm'], ['Paliers', 'pal'], ['Eau', 'eau'], ['Récap', 'rec']]) {
  await etape(page, l);
  await capture(page, `s1-${n}-${largeur}`, { fullPage: true });
  const t = await texte(page);
  console.log(`===== ${l} (${t.length} car.)`);
  console.log(t.slice(0, 1800).replace(/\n+/g, ' | '));
  console.log('champs', JSON.stringify((await champs(page)).map((c) => c.aria || c.nom || c.id).slice(0, 40)));
}
console.log('erreurs', erreurs.slice(0, 5));
await browser.close();
