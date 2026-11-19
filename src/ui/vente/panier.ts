import { invoiceTotals, type InvoiceItem } from '../../services/swissQrBill';
import { messageMontantChfHorsBornes } from '../../domain/finance/bornesFinance';

/** Une ligne du panier. `prixHT: null` = prix inconnu (jamais 0). `litresUnite` : litres d'une unité, 0 pour une ligne libre. */
export interface LignePanier {
  cle: string; batchId?: string; formatId: string; designation: string; litresUnite: number; quantite: number; prixHT: number | null;
}

export const QUANTITE_MAX = 10_000;
export const PRIX_UNITAIRE_MAX = 10_000;

export const versArticles = (lignes: LignePanier[], tvaRate: number): InvoiceItem[] =>
  lignes.map(l => ({ description: l.designation, quantity: l.quantite, unitPriceHT: l.prixHT ?? Number.NaN, tvaRate }));

/** Le premier défaut du panier (règles de l'ancienne feuille : TE-6 prix inconnu, un article à 0 CHF ne se facture pas), sinon `null`. */
export function problemePanier(lignes: LignePanier[]): string | null {
  if (!lignes.length) return 'Le panier est vide.';
  const i = lignes.findIndex(l => l.prixHT === null || !(l.prixHT > 0));
  if (i >= 0) return `Article ${i + 1} : indique son prix. Un article à 0 CHF ou sans prix ne se facture pas.`;
  const q = lignes.findIndex(l => !(l.quantite > 0));
  return q >= 0 ? `Article ${q + 1} : indique sa quantité.` : null;
}

export interface TotauxPanier { totalCents: number; netCents: number; vatCents: number; lines: { netCents: number; vatCents: number; totalCents: number }[] }

/** Totaux en centimes (`invoiceTotals`) ; `null` tant qu'une ligne est incomplète. */
export function totauxPanier(lignes: LignePanier[], assujetti: boolean, tvaRate: number): TotauxPanier | null {
  if (!lignes.length || problemePanier(lignes)) return null;
  try { return invoiceTotals(versArticles(lignes, tvaRate), assujetti); } catch { return null; }
}

/**
 * AM-69 : un paiement en espèces s'arrondit au multiple de 5 centimes le plus proche (`Math.round(x * 20) / 20`, en centimes entiers).
 * L'écart est une ligne « Arrondi à 5 centimes », jamais une TVA ni un prix changé. Un total qui tomberait à 0 (1 ou 2 ct) reste exact.
 */
export function arrondiEspeces(totalCents: number): { totalCents: number; ecartCents: number } {
  const arrondi = Math.round(totalCents / 5) * 5;
  return arrondi < 5 ? { totalCents, ecartCents: 0 } : { totalCents: arrondi, ecartCents: arrondi - totalCents };
}

/** La borne d'une vente (MV-38 : 50 000 CHF), en message, sinon `null`. */
export const messageBornes = (totalCents: number | null): string | null => totalCents === null ? null : messageMontantChfHorsBornes(totalCents / 100, 'income');

/** Résumé d'un panier pour le libellé du journal et la quittance (140 caractères au plus). */
export function resumePanier(lignes: Pick<LignePanier, 'designation' | 'quantite'>[]): string {
  const parts = lignes.map(l => `${String(l.quantite).replace('.', ',')} × ${l.designation.trim()}`);
  for (let k = parts.length; k >= 1; k--) {
    const texte = `${parts.slice(0, k).join(' · ')}${k < parts.length ? ` … et ${parts.length - k} autre${parts.length - k > 1 ? 's' : ''}` : ''}`;
    if (texte.length <= 140) return texte;
  }
  return (parts[0] ?? '').slice(0, 139) + '…';
}
