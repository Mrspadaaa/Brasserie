import type { Transaction } from '../../types';
import type { FinancialPayment } from './types';
import { formatCHF, isActiveTransaction, isoDate, paymentState, transactionDirection, transactionVendor } from './ledger';

/**
 * Un virement, plusieurs pièces : l'imputation d'un paiement sur des factures ouvertes (« payment allocation »,
 * la méthode des logiciels de comptabilité fournisseurs) : le montant solde d'abord la pièce la plus ancienne (le retard), puis la
 * suivante ; la dernière peut rester en partie à payer. Ordre : échéance, à défaut la date de la pièce (comme `summarizeLedger.outstanding`),
 * puis la date, puis l'identifiant (ordre stable). Tout est en centimes entiers : aucune division, donc aucun arrondi à rattraper.
 * Aucune horloge, aucun accès au stockage : fonctions pures.
 */
export interface PieceAPayer {
  id: string;
  /** Reste dû de la pièce, en centimes entiers (> 0). */
  resteCents: number;
  /** Échéance ISO ; `null` quand elle manque (jamais inventée). */
  echeance: string | null;
  /** Date de la pièce ISO ; `null` quand elle manque. */
  date: string | null;
}
export interface PartDeVirement {
  id: string;
  /** Ce que le virement impute à cette pièce, en centimes (0 : la pièce n'est pas touchée). */
  partCents: number;
  /** Ce qui resterait à payer sur la pièce après le virement. */
  resteApresCents: number;
  /** La pièce est soldée par le virement. */
  soldee: boolean;
}
export interface Repartition {
  /** Dans l'ordre d'imputation (la plus ancienne d'abord). */
  parts: PartDeVirement[];
  /** Total encore dû sur ces pièces. */
  totalCents: number;
  /** Total imputé : toujours égal au montant du virement. */
  imputeCents: number;
}

const cle = (p: PieceAPayer) => p.echeance ?? p.date ?? '9999-12-31';
/** La plus ancienne d'abord : échéance (ou date), puis date, puis identifiant. Ne modifie pas l'entrée. */
export function ordreDImputation<T extends PieceAPayer>(pieces: readonly T[]): T[] {
  return [...pieces].sort((a, b) => cle(a).localeCompare(cle(b)) || (a.date ?? '9999-12-31').localeCompare(b.date ?? '9999-12-31') || a.id.localeCompare(b.id));
}
export const totalDu = (pieces: readonly PieceAPayer[]): number => pieces.reduce((s, p) => s + Math.max(0, p.resteCents), 0);

/** Pourquoi ce montant ne peut pas être réparti (phrase pour le brasseur), ou `null` s'il peut l'être. */
export function refusDuVirement(pieces: readonly PieceAPayer[], montantCents: number | undefined | null): string | null {
  if (montantCents == null) return 'Indique le montant du virement.';
  if (!Number.isSafeInteger(montantCents) || montantCents <= 0) return 'Le virement doit être un montant positif.';
  if (pieces.some(p => !Number.isSafeInteger(p.resteCents) || p.resteCents < 0)) return 'Le reste dû d’une pièce est invalide.';
  const total = totalDu(pieces);
  if (total <= 0) return 'Aucune pièce n’est à payer.';
  if (montantCents > total) return `Le virement dépasse ce qui reste à payer (${formatCHF(total)}).`;
  return null;
}

/**
 * Répartit `montantCents` sur `pieces`, la plus ancienne d'abord. Refuse (exception) un montant nul, négatif, non entier, ou supérieur au
 * total dû : un virement ne paie jamais plus que les pièces choisies. Les pièces sans reste sont ignorées.
 */
export function repartirVirement(pieces: readonly PieceAPayer[], montantCents: number): Repartition {
  const refus = refusDuVirement(pieces, montantCents);
  if (refus) throw new RangeError(refus);
  let disponible = montantCents;
  const parts = ordreDImputation(pieces.filter(p => p.resteCents > 0)).map((p): PartDeVirement => {
    const partCents = Math.min(p.resteCents, disponible);
    disponible -= partCents;
    return { id: p.id, partCents, resteApresCents: p.resteCents - partCents, soldee: partCents === p.resteCents };
  });
  return { parts, totalCents: totalDu(pieces), imputeCents: montantCents - disponible };
}

/** « Atelier  du Lac » et « atelier du lac » sont le même tiers : minuscules, sans accent, espaces simples. */
export const cleDuTiers = (nom: string | undefined | null): string =>
  (nom ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim();

export type PieceOuverte = PieceAPayer & { transaction: Transaction; entrant: boolean };

/**
 * Les pièces qu'un même virement peut payer : celle qu'on ouvre (toujours, même si son paiement historique est inconnu : la date réelle
 * se demande alors), plus les autres pièces actives du MÊME tiers et du même sens, encore à payer. Sans nom de tiers, la pièce ouverte
 * reste seule : on ne groupe jamais sur un nom absent. Les pièces d'un autre tiers, soldées, annulées ou à l'avoir imputé sont exclues.
 * Résultat dans l'ordre d'imputation.
 */
export function piecesOuvertesDuTiers(ouverte: Transaction, transactions: readonly Transaction[], payments: readonly FinancialPayment[]): PieceOuverte[] {
  const sens = transactionDirection(ouverte, transactions as Transaction[]);
  const tiers = cleDuTiers(transactionVendor(ouverte));
  const enPiece = (tx: Transaction): PieceOuverte | null => {
    const etat = paymentState(tx, payments as FinancialPayment[], transactions as Transaction[]);
    if (etat.remainingCents <= 0 || !Number.isSafeInteger(etat.remainingCents)) return null;
    return { id: tx.id, resteCents: etat.remainingCents, echeance: isoDate(tx.finance?.dueDate) ?? null, date: isoDate(tx.date) ?? null, transaction: tx, entrant: sens === 'in' };
  };
  const premiere = enPiece(ouverte);
  const autres = tiers === '' ? [] : transactions.filter(tx => {
    if (tx.id === ouverte.id || !isActiveTransaction(tx) || tx.finance?.refundApplication === 'offset') return false;
    if (cleDuTiers(transactionVendor(tx)) !== tiers || transactionDirection(tx, transactions as Transaction[]) !== sens) return false;
    return ['unpaid', 'partial'].includes(paymentState(tx, payments as FinancialPayment[], transactions as Transaction[]).state);
  }).map(enPiece);
  return ordreDImputation([premiere, ...autres].filter((p): p is PieceOuverte => p !== null));
}