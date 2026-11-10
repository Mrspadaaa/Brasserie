// B2 n° 3 (lot 2 : le brasseur veut le bug réglé, pas une maquette) : la case g laissait « 2 Kg » devenir « 2 g » (pas 2 000 g) ; le stock disait « 1 → 1,002 Kg », la bande « 16,002 Kg ».
// Attendu : d'une masse à l'autre la quantité se CONVERTIT (2 Kg → 2 000 g), le prix suit (1,55 → 0,00155), le montant reste (3,10) ; le stock dit « 1 → 3 Kg », la bande « 18 Kg » ;
// Kg → g → Kg rend les mêmes valeurs (critère d'invariance) ; Galaxy (60 g × 0,08 = 4,80) en Kg : 0,06 × 80 = 4,80 ; là où la conversion est impossible (pièce, masse) le garde-fou
// reste : la quantité est vide, marquée « à remplir », le montant lu est gardé, et le retour à l'unité d'avant rend la ligne.
// Usage : node controle-b2-3-garde-unite.mjs [<build>] [<dossier captures>]   → GARDEUNITE OK | GARDEUNITE ECHEC <raisons>
import { demarrer, ouvrirLigne, numeroLigne, uniteChoisir, champs } from './aide-b2.mjs';
const { ouvrir, raisons, cap, verdict } = await demarrer();
const infos = [];
const num = s => Number(String(s).replace(/\s/g, '').replace(',', '.'));
const etatLigne = (p, nom, n) => p.evaluate((n, nom) => {
  const a = [...document.querySelectorAll('[data-dp-ligne]')].find(a => a.querySelector('summary')?.innerText.includes(nom));
  const q = document.querySelector(`[aria-label="Quantité ligne ${n}"]`);
  return { qDoute: q?.closest('[data-dp-niveau]')?.dataset.dpNiveau ?? null, stock: [...a.querySelectorAll('[data-dp-apres]')].map(e => e.innerText).join(' | '), bande: a.closest('[data-dp-bande]').querySelector('[data-dp-sous-qte]')?.innerText.replace(/\s+/g, ' ') };
}, n, nom);
for (const theme of ['clair', 'cave']) {
  const p = await ouvrir('3', 't390', theme);
  // (a) masse → masse : Weizenmalz 2 Kg × 1,55 = 3,10 → g
  await ouvrirLigne(p, 'Weizenmalz'); const n = await numeroLigne(p, 'Weizenmalz');
  const avant = await champs(p, n);
  await uniteChoisir(p, 'Weizenmalz', 'g');
  const g = await champs(p, n), eg = await etatLigne(p, 'Weizenmalz', n);
  if (num(g.Quantité) !== 2000) raisons.push(`${theme} Kg → g : quantité « ${g.Quantité} » au lieu de 2 000`);
  if (Math.abs(num(g.Prix) - 0.00155) > 1e-9) raisons.push(`${theme} Kg → g : prix « ${g.Prix} » au lieu de 0,00155`);
  if (g.Montant !== avant.Montant) raisons.push(`${theme} Kg → g : montant « ${g.Montant} » au lieu de « ${avant.Montant} »`);
  if (!/^1 → 3 Kg$|^1 → 3 Kg/.test(eg.stock) && !/\b3 Kg\b/.test(eg.stock)) raisons.push(`${theme} Kg → g : stock « ${eg.stock} » au lieu de « 1 → 3 Kg »`);
  if (/16,002|18,002/.test(eg.bande ?? '')) raisons.push(`${theme} Kg → g : bande « ${eg.bande} »`);
  if (!/^18 Kg/.test(eg.bande ?? '')) raisons.push(`${theme} Kg → g : bande « ${eg.bande} » au lieu de « 18 Kg »`);
  await cap(p, `3-g-${theme}`);
  await uniteChoisir(p, 'Weizenmalz', 'Kg');
  const retour = await champs(p, n);
  if (JSON.stringify(retour) !== JSON.stringify(avant)) raisons.push(`${theme} Kg → g → Kg : ${JSON.stringify(retour)} au lieu de ${JSON.stringify(avant)}`);
  // (b) g → Kg : Galaxy 60 g × 0,08 = 4,80
  await ouvrirLigne(p, 'Galaxy'); const ng = await numeroLigne(p, 'Galaxy');
  const ga = await champs(p, ng);
  await uniteChoisir(p, 'Galaxy', 'Kg');
  const gk = await champs(p, ng);
  if (Math.abs(num(gk.Quantité) - 0.06) > 1e-9 || Math.abs(num(gk.Prix) - 80) > 1e-9 || gk.Montant !== ga.Montant) raisons.push(`${theme} Galaxy g → Kg : ${JSON.stringify(gk)} au lieu de 0,06 × 80 = ${ga.Montant}`);
  await uniteChoisir(p, 'Galaxy', 'g');
  const gr = await champs(p, ng);
  if (JSON.stringify(gr) !== JSON.stringify(ga)) raisons.push(`${theme} Galaxy g → Kg → g : ${JSON.stringify(gr)} au lieu de ${JSON.stringify(ga)}`);
  // (c) garde-fou : masse → pièce : rien ne se convertit
  await ouvrirLigne(p, 'Weizenmalz'); // le plateau n'existe que ligne ouverte : Galaxy l'a refermé
  await uniteChoisir(p, 'Weizenmalz', 'pièce');
  const pc = await champs(p, n), ep = await etatLigne(p, 'Weizenmalz', n);
  if (pc.Quantité !== '') raisons.push(`${theme} Kg → pièce : la quantité « ${pc.Quantité} » est gardée sous la nouvelle unité`);
  if (ep.qDoute !== 'inconnu') raisons.push(`${theme} Kg → pièce : la quantité vidée n'est pas marquée « à remplir » (${ep.qDoute})`);
  if (pc.Montant !== avant.Montant) raisons.push(`${theme} Kg → pièce : le montant ${avant.Montant} est devenu « ${pc.Montant} »`);
  await uniteChoisir(p, 'Weizenmalz', 'Kg');
  const rp = await champs(p, n);
  if (JSON.stringify(rp) !== JSON.stringify(avant)) raisons.push(`${theme} Kg → pièce → Kg : ${JSON.stringify(rp)} au lieu de ${JSON.stringify(avant)}`);
  infos.push({ theme, avant, g, eg, retour, gk, pc });
  await p.close();
}
await verdict('GARDEUNITE', infos.slice(0, 1));
