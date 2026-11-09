import type { Transaction } from '../../../types';
import type { FinancialPayment } from '../../../domain/finance/types';
import { formatCHF, isActiveTransaction, isoDate, paymentState, transactionAmount, validPayment } from '../../../domain/finance/ledger';
import { shortDate } from '../financeFormat';

/**
 * Règles pures de l'écran Opérations (v6b) : échéance, état d'une ligne, pièce, paiement rapide et contre-écriture.
 * Aucune horloge ici : la date du jour est un paramètre (tests figés par `vi.setSystemTime`). Centimes entiers partout.
 * Les piles et la légende du mois ne sont PAS calculées ici : elles viennent de `periodeSynthese` (voie us, un seul « dépensé »).
 */

export type EtatPaiement = ReturnType<typeof paymentState>;
export type Ton = 'ok' | 'pay' | 'late' | 'unknown' | 'alert' | 'void';

const MODES: Record<FinancialPayment['method'], string> = { bank: 'banque', cash: 'espèces', twint: 'TWINT', other: '' };

/** Jours entiers de `de` à `a` (dates ISO, calcul en UTC : aucun saut d'heure d'été). */
export function joursEntre(de: string, a: string): number {
  const ms = (iso: string) => Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)));
  return Math.round((ms(a) - ms(de)) / 86400000);
}

/** « 25 nov. · dans 16 j », « aujourd'hui », « depuis le 20 déc. 2025 » ; sans échéance valide : « sans échéance » (jamais 0 jour inventé). */
export function echeance(due: string | null | undefined, today: string): { texte: string; retard: boolean; jours: number | null } {
  const iso = isoDate(due ?? undefined);
  if (!iso) return { texte: 'sans échéance', retard: false, jours: null };
  const jours = joursEntre(today, iso);
  if (jours < 0) return { texte: `depuis le ${shortDate(iso)}`, retard: true, jours };
  if (jours === 0) return { texte: 'aujourd’hui', retard: false, jours };
  return { texte: `${shortDate(iso)} · dans ${jours} j`, retard: false, jours };
}

/** Une écriture active, ouverte (à payer ou à encaisser, en partie ou en entier), dont l'échéance est passée. */
export function enRetard(tx: Transaction, etat: EtatPaiement, today: string): boolean {
  if (!isActiveTransaction(tx) || !['unpaid', 'partial'].includes(etat.state) || etat.remainingCents <= 0) return false;
  const due = isoDate(tx.finance?.dueDate);
  return !!due && due < today;
}

/** Reste dû de toutes les écritures en retard (suivi : toutes années, archives comprises) et les années concernées. */
export function retardTotal(lignes: Array<{ transaction: Transaction; payment: EtatPaiement }>, today: string): { totalCents: number; annees: string[] } {
  let totalCents = 0;
  const annees = new Set<string>();
  for (const { transaction, payment } of lignes) {
    if (!enRetard(transaction, payment, today)) continue;
    totalCents += payment.remainingCents;
    annees.add(isoDate(transaction.finance?.dueDate)!.slice(0, 4));
  }
  return { totalCents, annees: [...annees].sort() };
}

/** Dernier paiement réel de l'écriture : ni une contre-écriture, ni un paiement déjà annulé. */
export function dernierPaiement(tx: Transaction, payments: FinancialPayment[]): FinancialPayment | null {
  const annules = new Set(payments.filter(p => p.reversalOfId).map(p => p.reversalOfId));
  const reels = payments.filter(p => p.transactionId === tx.id && validPayment(p) && !p.reversalOfId && !annules.has(p.id));
  reels.sort((a, b) => a.date.localeCompare(b.date) || a.recordedAt.localeCompare(b.recordedAt));
  return reels[reels.length - 1] ?? null;
}

/** Le paiement de la journée qu'« Annuler » peut inverser : le dernier non annulé, daté d'aujourd'hui. Après le jour, la correction passe par la fiche. */
export function dernierPaiementAnnulable(tx: Transaction, payments: FinancialPayment[], today: string): FinancialPayment | null {
  const dernier = dernierPaiement(tx, payments);
  return dernier && isoDate(dernier.date) === today ? dernier : null;
}

/**
 * « ✓ Payé » en un toucher : le reste dû exact, aujourd'hui, par banque (hypothèse du geste rapide, dite dans la pastille).
 * `null` si l'état est inconnu (la date réelle doit être demandée), si rien n'est dû ou si l'écriture n'est pas active.
 */
export function paiementRapide(tx: Transaction, etat: EtatPaiement, sens: 'in' | 'out', today: string, id: string, maintenant: string): FinancialPayment | null {
  if (!isActiveTransaction(tx) || tx.finance?.refundApplication === 'offset') return null;
  if (!['unpaid', 'partial'].includes(etat.state) || etat.remainingCents <= 0) return null;
  return { id, transactionId: tx.id, date: today, amountCents: etat.remainingCents, direction: sens, method: 'bank', recordedAt: maintenant };
}

/** Contre-écriture exacte d'un paiement (règles de `FinanceService.recordPayment`) : identifiant `CONTRE-<id>`, sens inversé, date d'origine (comme la fiche). */
export function contrePaiement(p: FinancialPayment, maintenant: string): FinancialPayment {
  return { ...p, id: `CONTRE-${p.id}`, direction: p.direction === 'in' ? 'out' : 'in', reversalOfId: p.id, note: 'Correction d’un paiement saisi par erreur', recordedAt: maintenant };
}

/** Texte d'état d'une ligne : le mot court (exceptions du code actuel conservées) + la date et le mode quand ils sont connus. */
export function etatDeLigne(tx: Transaction, etat: EtatPaiement, entrant: boolean, payments: FinancialPayment[], today: string): { texte: string; ton: Ton; regle: boolean; retard: boolean } {
  const base = { regle: false, retard: false };
  if (tx.finance?.voidedAt) return { ...base, texte: 'Annulé', ton: 'void' };
  if (tx.finance?.refundApplication === 'offset') return { ...base, texte: 'Imputé', ton: 'void' };
  if (etat.overpaidCents > 0) return { ...base, texte: 'Paiement à vérifier', ton: 'alert' };
  if (etat.state === 'paid' && etat.appliedCreditCents > 0) return { ...base, texte: 'Soldé', ton: 'ok' };
  const verbe = entrant ? 'à encaisser' : 'à payer';
  if (etat.state === 'unpaid' || etat.state === 'partial') {
    const ech = echeance(tx.finance?.dueDate, today);
    const debut = etat.state === 'partial' ? `Reste ${formatCHF(etat.remainingCents)} ${verbe}` : verbe;
    const suite = ech.retard ? ` ${ech.texte}` : ` · ${ech.texte}`;
    return { texte: `${debut}${suite}`, ton: ech.retard ? 'late' : 'pay', regle: false, retard: ech.retard };
  }
  if (etat.state === 'unknown') return { ...base, texte: 'Paiement à confirmer', ton: 'unknown' };
  const dernier = dernierPaiement(tx, payments);
  const date = dernier ? (isoDate(dernier.date) === today ? 'aujourd’hui' : shortDate(dernier.date)) : '';
  const mode = dernier ? MODES[dernier.method] : '';
  const mot = entrant ? 'encaissé' : 'payé';
  return { texte: `✓ ${mot}${date ? ` ${date}` : ''}${mode ? ` · ${mode}` : ''}`, ton: 'ok', regle: true, retard: false };
}

export type Piece = { texte: string; manque: boolean };

/** La pièce de la ligne : type et détail quand ils sont connus ; « sans pièce » seulement s'il n'y en a vraiment aucune (un envoi en cours n'est pas une absence). */
export function pieceDe(tx: Transaction): Piece {
  const envoi = tx.finance?.proofUpload;
  const rangee = !!tx.proofUrl || !!tx.finance?.proofDocumentId;
  if (!rangee) {
    if (envoi && (envoi.state === 'queued' || envoi.state === 'sending')) return { texte: 'envoi en cours', manque: false };
    if (envoi?.state === 'failed') return { texte: 'à renvoyer', manque: true };
    return { texte: 'sans pièce', manque: true };
  }
  const genre = ({ invoice: 'facture', receipt: 'ticket', credit_note: 'avoir' } as Record<string, string>)[tx.finance?.sourceDocumentType ?? ''] ?? 'pièce';
  const lignes = tx.finance?.lines ?? [];
  const seule = lignes.length === 1 ? lignes[0] : null;
  const detail = seule && seule.quantity > 0 && seule.unit ? ` · ${seule.description} ${String(seule.quantity).replace('.', ',')} ${seule.unit}` : '';
  return { texte: `${genre}${detail}`, manque: false };
}

/** Le montant de l'écriture avec son sens : positif pour ce qui entre, négatif pour ce qui sort. */
export const montantSigne = (tx: Transaction, sens: 'in' | 'out'): number => (sens === 'in' ? 1 : -1) * transactionAmount(tx);

/** Mois sans l'année pour l'année courante (« novembre »), abrégé avec l'année sinon (« nov. 2025 »). */
export function moisCourt(mois: string, today: string): string {
  const date = new Date(`${mois}-01T12:00:00`);
  if (mois.slice(0, 4) === today.slice(0, 4)) return date.toLocaleDateString('fr-CH', { month: 'long' });
  return date.toLocaleDateString('fr-CH', { month: 'short', year: 'numeric' });
}
