import type { Batch, KegItem, Transaction } from '../../types';
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

/** Les unités vendues par la caisse pour un brassin, par format (`33cl`, `75cl`, `fut`) : même lecture que `litresVendus`. */
export function unitesVendues(transactions: Transaction[], batchId: string): Record<string, number> {
  const parFormat: Record<string, number> = {};
  for (const t of transactions) {
    if (t.finance?.kind !== 'income' || t.finance.voidedAt) continue;
    for (const ligne of t.finance.lines) {
      const lue = decoderLigneVente(ligne.sourceReference);
      if (lue?.batchId === batchId && Number.isFinite(ligne.quantity)) parFormat[lue.formatId] = (parFormat[lue.formatId] ?? 0) + (ligne.quantity as number);
    }
  }
  return parFormat;
}

export interface Reste { b33: number; b75: number; futs: number | null; texte: string; vide: boolean }

/**
 * D393 B1 (K6) : ce qu'il reste à vendre d'un brassin, lu sur sa carte (« 114 × 33 cl · 2 fûts »). Bouteilles : conditionnées moins vendues par
 * la caisse. Fûts : ceux du stock encore pleins de ce brassin (un fût vendu est livré par la caisse, B6) ; sans fûts connus du stock, ceux du
 * conditionnement moins les fûts vendus. Dérivé des ventes, jamais stocké à part. Sans conditionnement en unités : `null`.
 */
export function resteAVendre(batch: Batch, transactions: Transaction[], kegs: KegItem[]): Reste | null {
  const p = batch.packaging;
  if (!p || !(p.bottles33 || p.bottles75 || p.kegIds?.length)) return null;
  const vendu = unitesVendues(transactions, batch.id);
  const b33 = Math.max(0, (p.bottles33 ?? 0) - (vendu['33cl'] ?? 0));
  const b75 = Math.max(0, (p.bottles75 ?? 0) - (vendu['75cl'] ?? 0));
  const ids = p.kegIds ?? [];
  const connus = kegs.filter(k => !k.archivedAt && (k.batchRef === batch.id || ids.includes(k.id)));
  const futs = ids.length || connus.length
    ? (connus.length ? connus.filter(k => k.state === 'plein').length : Math.max(0, ids.length - (vendu.fut ?? 0)))
    : null;
  // Un format épuisé se tait ; tout épuisé : « tout vendu ».
  const parts = [b33 ? `${b33} × 33 cl` : '', b75 ? `${b75} × 75 cl` : '', futs ? `${futs} fût${futs > 1 ? 's' : ''}` : ''].filter(Boolean);
  const vide = b33 + b75 + (futs ?? 0) === 0;
  return { b33, b75, futs, texte: vide ? 'tout vendu' : parts.join(' · '), vide };
}
