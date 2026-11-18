// B2 n° 2 (D372, D373) : Weizenmalz hell (« 2 Kg × 1,55 = 3,10 »), segment d'unité Kg → g → Kg : le prix lu était effacé au passage en g et ne revenait pas
// (« 2 kg × — 3,10 », « prix à remplir ») ; retaper la quantité effaçait ensuite le montant (« 2 kg × — — »).
// Attendu : l'aller-retour rend la ligne telle quelle (mêmes trois champs, même rangée) ; retaper la quantité 2 garde le prix et le montant ; un aller-retour
// après une quantité modifiée (3) revient aussi à la ligne d'avant ; et quand deux champs sont présents après le retour, le troisième se calcule (D373).
// Usage : node controle-b2-2-aller-retour.mjs [<build>] [<dossier captures>]   → ALLERRETOUR OK | ALLERRETOUR ECHEC <raisons>
import { demarrer, ouvrirLigne, numeroLigne, uniteChoisir, saisir, champs, rangee } from './aide-b2.mjs';
const { ouvrir, raisons, cap, verdict } = await demarrer();
const norm = c => JSON.stringify(c);
const infos = [];
for (const theme of ['clair', 'cave']) {
  const p = await ouvrir('3', 't390', theme);
  await ouvrirLigne(p, 'Weizenmalz'); const n = await numeroLigne(p, 'Weizenmalz');
  const q = `[aria-label="Quantité ligne ${n}"]`;
  const avant = { c: await champs(p, n), r: await rangee(p, 'Weizenmalz') };
  // 1. Kg → g → Kg
  await uniteChoisir(p, 'Weizenmalz', 'g'); const enG = { c: await champs(p, n), r: await rangee(p, 'Weizenmalz') };
  await cap(p, `2-g-${theme}`);
  await uniteChoisir(p, 'Weizenmalz', 'Kg'); const retour = { c: await champs(p, n), r: await rangee(p, 'Weizenmalz') };
  await cap(p, `2-retour-${theme}`);
  if (norm(retour.c) !== norm(avant.c)) raisons.push(`${theme} : Kg → g → Kg : champs ${norm(retour.c)} au lieu de ${norm(avant.c)}`);
  if (retour.r?.replace(/Kg/i, 'Kg') !== avant.r?.replace(/Kg/i, 'Kg')) raisons.push(`${theme} : la rangée est « ${retour.r} » au lieu de « ${avant.r} »`);
  // 2. Retaper la quantité 2 : le prix et le montant restent.
  await saisir(p, q, '2'); const retape = await champs(p, n);
  if (norm(retape) !== norm(avant.c)) raisons.push(`${theme} : quantité retapée (2) : ${norm(retape)} au lieu de ${norm(avant.c)}`);
  // 3. Une quantité modifiée (3) puis l'aller-retour : la ligne revient à celle d'avant l'aller-retour.
  await saisir(p, q, '3'); const trois = { c: await champs(p, n) };
  await uniteChoisir(p, 'Weizenmalz', 'g'); await uniteChoisir(p, 'Weizenmalz', 'Kg'); const apres3 = await champs(p, n);
  if (norm(apres3) !== norm(trois.c)) raisons.push(`${theme} : quantité 3 puis Kg → g → Kg : ${norm(apres3)} au lieu de ${norm(trois.c)}`);
  // 4. D373 : en g, la quantité tapée (2000) et le montant lu (3,10) : le prix se calcule.
  await saisir(p, q, '2'); await uniteChoisir(p, 'Weizenmalz', 'g'); await saisir(p, q, '2000'); const calc = await champs(p, n);
  if (!calc.Prix || calc.Prix === '' ) raisons.push(`${theme} : en g, quantité 2000 + montant ${calc.Montant} : le prix ne se calcule pas (${norm(calc)})`);
  infos.push({ theme, avant, enG, retour, retape, apres3, calc });
  await p.close();
}
await verdict('ALLERRETOUR', infos[0]);
