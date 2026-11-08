import { formatCHF, isoDate, isActiveTransaction, transactionAmount, transactionDirection, transactionKind } from './ledger';
import type { FinanceTransaction } from './types';

/**
 * AM n° 10 : l'app tourne « non assujettie à la TVA ». L'assujettissement devient obligatoire dès 100 000 CHF de chiffre d'affaires imposable
 * (LTVA art. 10 al. 2 let. a) ; l'annonce à l'AFC se fait dans les 30 jours (art. 66). Le seuil des réglages (`tvaThresholdTurnover`) est donc surveillé
 * sur 12 mois glissants : avertissement à 80 %, alerte à 100 %. Rien n'est inventé : sans seuil lisible, pas de statut (`null`).
 */
export type TvaThresholdLevel = 'ok' | 'warn' | 'over';
export interface TvaThresholdStatus {
  level: TvaThresholdLevel;
  turnoverCents: number;
  thresholdCents: number;
  /** Part du seuil atteinte (1 = 100 %). */
  ratio: number;
  /** Fenêtre de 12 mois, en AAAA-MM-JJ, bornes comprises. */
  from: string;
  to: string;
  message: string;
}
export const TVA_WARN_RATIO = 0.8;

const addDays = (iso: string, days: number): string => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
};
/** Même jour, un an plus tôt (le 29 février retombe sur le 28). */
const oneYearBefore = (iso: string): string => {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y - 1, m - 1, d));
  return date.getUTCMonth() === m - 1 ? date.toISOString().slice(0, 10) : new Date(Date.UTC(y - 1, m - 1, 28)).toISOString().slice(0, 10);
};

/** Chiffre d'affaires hors taxe : les ventes (kind « income »), moins les avoirs de vente, des 12 derniers mois jusqu'à `asOf` compris. */
export function tvaThresholdStatus(transactions: FinanceTransaction[], asOf: string, thresholdChf: number, isTvaRegistered: boolean): TvaThresholdStatus | null {
  if (isTvaRegistered || !Number.isFinite(thresholdChf) || thresholdChf <= 0) return null;
  const to = isoDate(asOf);
  if (!to) return null;
  const from = addDays(oneYearBefore(to), 1);
  let turnoverCents = 0;
  for (const tx of transactions) {
    if (!isActiveTransaction(tx)) continue;
    const date = isoDate(tx.date);
    if (!date || date < from || date > to) continue;
    const kind = transactionKind(tx);
    const sale = kind === 'income', creditNote = kind === 'refund' && transactionDirection(tx, transactions) === 'out';
    if (!sale && !creditNote) continue;
    const vatCents = Number.isFinite(tx.tvaAmount) && tx.tvaAmount > 0 ? Math.round(tx.tvaAmount * 100) : 0;
    const net = Math.max(0, transactionAmount(tx) - vatCents);
    turnoverCents += sale ? net : -net;
  }
  turnoverCents = Math.max(0, turnoverCents);
  const thresholdCents = Math.round(thresholdChf * 100);
  const ratio = turnoverCents / thresholdCents;
  const level: TvaThresholdLevel = ratio >= 1 ? 'over' : ratio >= TVA_WARN_RATIO ? 'warn' : 'ok';
  const percent = `${Math.floor(ratio * 100)} %`;
  const message = level === 'over'
    ? `Seuil de TVA franchi : ${formatCHF(turnoverCents)} de chiffre d’affaires sur 12 mois, soit ${percent} du seuil de ${formatCHF(thresholdCents)}. L’assujettissement est obligatoire : annonce-toi à l’AFC dans les 30 jours (art. 66 LTVA).`
    : level === 'warn'
      ? `Chiffre d’affaires de ${formatCHF(turnoverCents)} sur 12 mois, soit ${percent} du seuil de TVA de ${formatCHF(thresholdCents)} : il reste ${formatCHF(thresholdCents - turnoverCents)}. Au-delà, l’assujettissement est obligatoire (art. 10 LTVA).`
      : '';
  return { level, turnoverCents, thresholdCents, ratio, from, to, message };
}
