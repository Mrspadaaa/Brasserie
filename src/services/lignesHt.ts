/**
 * Voie n3-ht (D304, D317) : une pièce dont les lignes sont imprimées HORS TAXE (la somme des lignes est le total HT, la TVA s'ajoute au pied) est lue juste
 * et le serveur l'accepte (`controls.sum.base === 'HT'`), mais « Confirmer » exige que les lignes somment le total TTC. Cette fonction pure, appelée sur le
 * résultat assaini (`GeminiScannerService.normalizeResult`, donc pour le provisoire du flux et pour le final), passe les montants et les prix des lignes
 * au TTC, au prorata, sans jamais ajouter de ligne « TVA » (une ligne sans produit, risque de fiche en plus).
 *
 * - Par groupe de TVA quand c'est possible : chaque ligne porte un `vatCode` qui a sa rangée dans `vat[]` ; la somme des lignes du groupe est la base lue de
 *   la rangée ; le groupe est ramené à base + montant de sa rangée. Sinon, un seul rapport `amountTTC / amountHT` pour toutes les lignes.
 * - Le reste en centimes va à la plus grande ligne du groupe. Une remise (montant négatif) suit le même rapport.
 * - Rien n'est inventé : sans devise CHF, sans `amountHT` et `amountTTC`, sans montant à chaque ligne, ou si la somme des lignes n'est pas exactement le HT lu,
 *   le résultat est rendu tel quel (le cas d'avant). Rejouer la fonction sur son propre résultat ne change plus rien (la somme est alors le TTC, pas le HT).
 */
import type { ScannedInvoiceResult } from './geminiScanner';

/** La phrase posée sur le total quand la conversion a eu lieu (`invoiceFieldHints`). */
export const LIGNES_HT_PASSEES_AU_TTC = 'Lignes imprimées hors taxe, passées au TTC.';

type Ligne = ScannedInvoiceResult['items'][number];

const enCentimes = (n: number) => Math.round(n * 100);
const estMontant = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
const arrondiDe = (n: number) => (n < 0 ? -Math.round(-n) : Math.round(n));

/** Ramène des centimes HT à `cible` (centimes) : prorata arrondi, le reste à la plus grande ligne. `null` si la base n'est pas positive. */
function ramener(centimes: number[], cible: number): number[] | null {
  const base = centimes.reduce((somme, c) => somme + c, 0);
  if (base <= 0 || cible <= 0) return null;
  const sortie = centimes.map(c => arrondiDe((c * cible) / base));
  const reste = cible - sortie.reduce((somme, c) => somme + c, 0);
  if (reste !== 0) {
    let plus = 0;
    centimes.forEach((c, i) => { if (c > centimes[plus]) plus = i; });
    sortie[plus] += reste;
  }
  return sortie;
}

/** Les rangées de `vat[]` rattachables par code ; `null` si un code manque, est en double, ou si une rangée n'a pas ses deux montants lus. */
function groupesDeTva(result: ScannedInvoiceResult, centimes: number[]): { indices: number[]; cible: number }[] | null {
  const rangs = result.vat ?? [];
  if (!rangs.length) return null;
  const code = (valeur: string | undefined) => (valeur ?? '').trim().toUpperCase();
  const parCode = new Map<string, number[]>();
  for (let i = 0; i < result.items.length; i++) {
    const c = code(result.items[i].vatCode);
    if (!c) return null;
    parCode.set(c, [...(parCode.get(c) ?? []), i]);
  }
  const groupes: { indices: number[]; cible: number }[] = [];
  for (const [c, indices] of parCode) {
    const rangees = rangs.filter(r => code(r.code) === c);
    if (rangees.length !== 1) return null;
    const { base, amount } = rangees[0];
    if (!estMontant(base) || !estMontant(amount) || base <= 0 || amount < 0) return null;
    if (indices.reduce((somme, i) => somme + centimes[i], 0) !== enCentimes(base)) return null;
    groupes.push({ indices, cible: enCentimes(base) + enCentimes(amount) });
  }
  return groupes;
}

export function lignesHtAuTtc(result: ScannedInvoiceResult): ScannedInvoiceResult {
  const controls = result.controls;
  if (!controls || controls.sum.base !== 'HT' || controls.sum.statut !== 'ok' || result.currency !== 'CHF') return result;
  if (!estMontant(result.amountHT) || !estMontant(result.amountTTC)) return result;
  const ht = enCentimes(result.amountHT), ttc = enCentimes(result.amountTTC);
  if (ht <= 0 || ttc <= ht || !result.items.length) return result;
  if (result.items.some(item => !estMontant(item.amountTTC))) return result;
  const centimes = result.items.map(item => enCentimes(item.amountTTC as number));
  if (centimes.reduce((somme, c) => somme + c, 0) !== ht) return result;

  const nouveaux: number[] = new Array(centimes.length).fill(0);
  const groupes = groupesDeTva(result, centimes);
  const cibleDesGroupes = groupes?.reduce((somme, g) => somme + g.cible, 0);
  if (groupes && cibleDesGroupes === ttc) {
    for (const g of groupes) {
      const rendu = ramener(g.indices.map(i => centimes[i]), g.cible);
      if (!rendu) return result;
      g.indices.forEach((i, rang) => { nouveaux[i] = rendu[rang]; });
    }
  } else {
    const rendu = ramener(centimes, ttc);
    if (!rendu) return result;
    rendu.forEach((c, i) => { nouveaux[i] = c; });
  }

  const items: Ligne[] = result.items.map((item, i) => {
    const ancien = centimes[i], nouveau = nouveaux[i];
    const prix = estMontant(item.price) && ancien !== 0 ? Math.round((item.price * nouveau * 10000) / ancien) / 10000 : item.price;
    return { ...item, amountTTC: nouveau / 100, ...(prix === undefined ? {} : { price: prix }) };
  });
  return { ...result, items, lignesPasseesAuTtc: true };
}
