// Identité : gestes absurdes (BR-62 à BR-67, MV-16, TL-30, AM-20).
import { ouvrir, etape, texte, taper, valeurChamp, capture, cliquer, dormir } from './banc.mjs';
const largeur = Number(process.argv[2] ?? 1280);
const { browser, page } = await ouvrir({ largeur, hauteur: largeur < 600 ? 844 : 900 });
await etape(page, 'Identité');
const ligne = async (re) => (await texte(page)).split('\n').filter((l) => re.test(l)).join(' | ');
const lire = async (nom, aria) => console.log(nom.padEnd(30), 'champ=', JSON.stringify(await valeurChamp(page, aria)), '|', (await ligne(/libres|trop|plein|Remplissage|Volume|Entre|refus|hors|alert|à renseigner|capacité/i)).slice(0, 260));
await cliquer(page, 'Espace libre');
await cliquer(page, 'Matériel');
for (const [nom, aria, vals] of [
  ['volume', 'Volume en fermenteur', ['99999', '-1', '0']],
  ['espace libre', 'Espace libre choisi', ['99999', '-1', '0,004', '2,5']],
  ['capacité', 'Capacité du fermenteur', ['99999', '0', '-1']],
  ['ébullition', 'Durée d’ébullition', ['99999', '-1']],
]) {
  for (const v of vals) {
    const ok = await taper(page, aria, v);
    if (!ok) { console.log(nom, v, 'CHAMP ABSENT'); continue; }
    await lire(`${nom} ${v}`, aria);
    await page.keyboard.press('Tab'); await dormir(500);
    await lire(`${nom} ${v} sortie`, aria);
  }
  await taper(page, aria, nom === 'ébullition' ? '60' : nom === 'espace libre' ? '20' : '30'); await page.keyboard.press('Tab');
}
console.log('REMPLISSAGE:', ((await texte(page)).match(/.*Remplissage.*/g) ?? []).join(' || '));
await capture(page, `s2-identite-${largeur}`, { fullPage: true });
await browser.close();
