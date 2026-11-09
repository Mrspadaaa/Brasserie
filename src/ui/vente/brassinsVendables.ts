import type { Batch, Transaction } from '../../types';
import { litresNets } from '../../domain/finance/chaineLitre';
import { decoderLigneVente } from './ligneVente';

/** Les brassins qu'on peut vendre : conditionnés ou terminés, avec un conditionnement noté. */
export const brassinsVendables = (batches: Batch[]): Batch[] =>
  batches.filter(b => (b.status === 'conditionne' || b.status === 'termine') && !b.archivedAt && b.packaging);

/**
 * Les litres sortis par la caisse pour un brassin : Σ quantité × litres de l'unité, sur les recettes non annulées dont la ligne porte `vente:`.
 * Les ventes saisies avant la caisse n'ont pas de référence : elles ne sont pas comptées (la jauge le dit : « notés depuis la caisse »).
 * Les avoirs ne retranchent rien (hors périmètre).
 */
export function litresVendus(transactions: Transaction[], batchId: string): number {
  let total = 0;
  for (const t of transactions) {
    if (t.finance?.kind !== 'income' || t.finance.voidedAt) continue;
    for (const ligne of t.finance.lines) {
      const lue = decoderLigneVente(ligne.sourceReference);
      if (lue?.batchId === batchId && Number.isFinite(ligne.quantity)) total += (ligne.quantity as number) * lue.litresUnite;
    }
  }
  return Math.round(total * 1000) / 1000;
}

export interface Jauge { vendus: number; nets: number | null; source: 'conditionne' | 'enregistre' | 'attendu' | null; ratio: number | null; depasse: boolean }

/** La jauge « 12,4/27 L nets » : litres notés depuis la caisse sur les litres nets du brassin. Nets inconnus → pas de rapport, jamais 0. */
export function jaugeBrassin(batch: Batch, vendus: number): Jauge {
  const nets = litresNets({ conditionneL: batch.volumePackagedL ?? null });
  if (!nets) return { vendus, nets: null, source: null, ratio: null, depasse: false };
  return { vendus, nets: nets.litres, source: nets.source, ratio: Math.min(1, vendus / nets.litres), depasse: vendus > nets.litres };
}
