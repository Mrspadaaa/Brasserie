import type { FinanceTransaction, FinancialArchive } from './types';
import { isoDate } from './ledger';
import { assertFinancialArchive, isArchiveTimestamp } from '../../../functions/src/financialArchiveCore';

export function archiveIndex(records: FinancialArchive[]): Map<number, FinancialArchive> {
  const index = new Map<number, FinancialArchive>();
  for (const record of records) {
    try { assertFinancialArchive(record); } catch { continue; }
    const previous = index.get(record.year);
    if (!previous || Date.parse(record.updatedAt) > Date.parse(previous.updatedAt) || Date.parse(record.updatedAt) === Date.parse(previous.updatedAt) && record.operationId > previous.operationId) index.set(record.year, record);
  }
  return index;
}
export function isTransactionArchived(transaction: FinanceTransaction, index: ReadonlyMap<number, FinancialArchive>): boolean {
  const date = isoDate(transaction.date);
  if (!date) return false;
  const archive = index.get(Number(date.slice(0, 4)));
  if (!archive || archive.status !== 'archived' || !archive.archivedAt) return false;
  const recorded = transaction.finance?.recordedAt;
  if (recorded == null) return true;
  if (!isArchiveTimestamp(recorded)) return false;
  const recordedAt = Date.parse(recorded), cutoff = Date.parse(archive.archivedAt);
  return Number.isFinite(recordedAt) && Number.isFinite(cutoff) && recordedAt <= cutoff;
}

/**
 * m1ar-c : la poignée de la frise. `limite` est la dernière année rangée voulue (`null` : aucune) ; seules les années FINIES se rangent
 * (`anneeCourante` et après restent au journal), sauf une année déjà rangée. Le plan dit ce que la poignée change, sans rien écrire :
 * les années à ranger (au plus `limite`, pas encore rangées) et celles à remettre (rangées, après `limite`). Les règles d'archivage du
 * domaine (`archiveIndex`, `isTransactionArchived`) ne changent pas : le plan se traduit en `setYearArchived` année par année.
 */
export interface PlanRangement { aRanger: number[]; aRemettre: number[] }
export const peutRanger = (annee: number, anneeCourante: number, archivees: ReadonlySet<number>): boolean => annee < anneeCourante || archivees.has(annee);
export function planRangement(annees: readonly number[], archivees: ReadonlySet<number>, limite: number | null, anneeCourante: number): PlanRangement {
  const triees = [...annees].sort((a, b) => a - b);
  const aRanger = limite == null ? [] : triees.filter(y => y <= limite && y < anneeCourante && !archivees.has(y));
  const aRemettre = triees.filter(y => archivees.has(y) && (limite == null || y > limite));
  return { aRanger, aRemettre };
}
/** La limite actuelle : la dernière année rangée (`null` : aucune). */
export const limiteRangee = (archivees: ReadonlySet<number>): number | null => archivees.size ? Math.max(...archivees) : null;
/** Les pièces comptées par mois de chaque année (la frise) ; les pièces sans date valide n'y figurent pas. */
export function piecesParMois(transactions: readonly FinanceTransaction[]): Map<number, number[]> {
  const parAnnee = new Map<number, number[]>();
  for (const transaction of transactions) {
    const date = isoDate(transaction.date); if (!date) continue;
    const annee = Number(date.slice(0, 4)), mois = Number(date.slice(5, 7)) - 1;
    if (!Number.isInteger(annee) || mois < 0 || mois > 11) continue;
    const ligne = parAnnee.get(annee) ?? Array<number>(12).fill(0);
    ligne[mois] += 1; parAnnee.set(annee, ligne);
  }
  return parAnnee;
}
