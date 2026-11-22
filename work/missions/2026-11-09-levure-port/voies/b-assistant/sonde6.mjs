// BR-20 : volume absurde (2,5 L pour 6,1 kg de grain) : une alerte au bandeau ? Lit le texte de chaque étape après la saisie.
import { ouvrir, etape, texte, taper, capture, dormir } from './banc.mjs';
const largeur = Number(process.argv[2] ?? 1280);
const { browser, page } = await ouvrir({ largeur, hauteur: largeur < 600 ? 844 : 900 });
await etape(page, 'Identité');
await taper(page, 'Volume en fermenteur', '2,5'); await page.keyboard.press('Tab'); await dormir(800);
for (const e of ['Identité', 'Malts', 'Paliers', 'Récap']) {
  await etape(page, e);
  const t = await texte(page);
  const l = t.split('\n').filter((x) => /kg\/L|aucune bière|erreur de saisie|trop|OG retenue|Une valeur à corriger/i.test(x));
  console.log(e, '->', JSON.stringify(l).slice(0, 400));
}
await capture(page, `s6-volume-2-5-${largeur}`);
await browser.close();
