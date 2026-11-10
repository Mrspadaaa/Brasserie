import type { FinanceCategory } from '../../types';
import type { FinanceLine, FinanceTransaction, FinancialAsset, FinancialPayment } from './types';
import { isoDate } from './ledger';
import { periodeSynthese, type PeriodeSynthese } from './periodeSynthese';

/**
 * L'effet d'une pièce en cours de saisie (Dépense, Caisse) sur son mois : l'onglet « Mon mois » (f2d, choisi le 10.11).
 * AUCUN second calcul : « avant » et « après » sont deux appels de `periodeSynthese` (la Synthèse, les Opérations et l'Annuel l'appellent aussi) ;
 * « après » reçoit seulement la pièce en plus, comme une transaction provisoire construite comme l'enregistrement la construit
 * (mêmes lignes, même catégorie, même paiement). L'écart est après − avant, au centime. Fonctions pures, aucune horloge, aucune écriture.
 *
 * L'état de règlement est celui de la saisie, pas une copie : l'appelant passe `reglement` lu dans le brouillon, et c'est la bascule de l'onglet
 * qui réécrit ce même champ. Un règlement inconnu reste inconnu : `periodeSynthese` compte la pièce pleine, sans l'inventer à payer.
 */

/** Ce que la saisie dit de la pièce ; les champs sont déjà lus (dates ISO, montant en centimes). */
export interface PieceEnSaisie {
  /** `out` : une dépense ; `in` : une vente. */
  sens: 'out' | 'in';
  /** Date de la pièce (ISO ou suisse) : elle fixe le mois. Absente ou invalide : pas d'effet à dire. */
  date: string;
  montantCents: number;
  /** Catégorie de la pièce (`recettes` pour une vente). */
  categorie: FinanceCategory | '' | undefined;
  description?: string;
  /** Les lignes telles que l'enregistrement les écrit : elles répartissent la pièce en catégories et en matériel à part. */
  lignes?: FinanceLine[];
  /** `paye` : réglée ; `a-payer` : ouverte ; `inconnu` : le paiement n'est pas su (compté plein, jamais supposé à payer). */
  reglement: 'paye' | 'a-payer' | 'inconnu';
  /** Date du règlement (réglée) ; à défaut, la date de la pièce. */
  dateReglement?: string;
  moyen?: FinancialPayment['method'];
  /** Échéance (ouverte), facultative. */
  echeance?: string;
}

export interface EcartPiece {
  /** Dépensé (charges, matériel à part exclu) : après − avant. */
  depenseCents: number;
  payeCents: number;
  aPayerCents: number;
  /** Entré (ventes) : après − avant. */
  entreCents: number;
  encaisseCents: number;
  aEncaisserCents: number;
  /** Matériel à part : après − avant. */
  materielCents: number;
  /** L'écart que dit le bouton fermé : l'entré pour une vente, le dépensé pour une dépense, le matériel à part s'il est seul à bouger. */
  principalCents: number;
  /** Ce que `principalCents` mesure. */
  principal: 'entre' | 'depense' | 'materiel' | null;
}

export interface EffetPiece {
  /** `AAAA-MM` de la date de la pièce. */
  mois: string;
  avant: PeriodeSynthese;
  apres: PeriodeSynthese;
  ecart: EcartPiece;
  reglement: PieceEnSaisie['reglement'];
  sens: PieceEnSaisie['sens'];
}

export interface EffetPieceEntree {
  piece: PieceEnSaisie;
  transactions: FinanceTransaction[];
  payments: FinancialPayment[];
  assets?: FinancialAsset[];
  /** Date du jour, ISO (l'état de paiement est évalué à cette date). */
  aujourdhui: string;
  /** Id de la transaction que l'enregistrement donnera à cette pièce : si elle est déjà écrite, elle n'est pas comptée deux fois dans « avant ». */
  idFinal?: string;
}

export const ID_PIECE_EN_SAISIE = 'PIECE-EN-SAISIE';

/** La transaction provisoire et son paiement éventuel, ou null quand la pièce ne dit pas assez (montant nul, date invalide, catégorie absente). */
export function pieceProvisoire(piece: PieceEnSaisie, id = ID_PIECE_EN_SAISIE): { transaction: FinanceTransaction; payment: FinancialPayment | null; mois: string } | null {
  const date = isoDate(piece.date);
  if (!date) return null;
  if (!Number.isSafeInteger(piece.montantCents) || piece.montantCents <= 0) return null;
  const categorie = piece.sens === 'in' ? 'recettes' : piece.categorie;
  if (!categorie) return null;
  const montant = piece.montantCents / 100;
  const echeance = isoDate(piece.echeance);
  const reglee = piece.reglement === 'paye';
  const dateReglement = isoDate(piece.dateReglement) ?? date;
  const transaction: FinanceTransaction = {
    id, date, description: piece.description?.trim() || 'Pièce en saisie', category: categorie as FinanceCategory, subcategory: '',
    amountHT: montant, tvaRate: 0, tvaAmount: 0, amountTTC: montant,
    finance: {
      version: 1, kind: piece.sens === 'in' ? 'income' : 'expense', amountCents: piece.montantCents, lines: piece.lignes ?? [],
      ...(echeance && piece.reglement === 'a-payer' ? { dueDate: echeance } : {}),
      paymentStatus: piece.reglement === 'a-payer' ? 'unpaid' : reglee ? 'paid' : 'unknown',
    },
  };
  const payment: FinancialPayment | null = reglee
    ? { id: `${id}-REGLEMENT`, transactionId: id, date: dateReglement, amountCents: piece.montantCents, direction: piece.sens, method: piece.moyen ?? 'bank', recordedAt: `${date}T00:00:00.000Z` }
    : null;
  return { transaction, payment, mois: date.slice(0, 7) };
}

const ecartEntre = (avant: PeriodeSynthese, apres: PeriodeSynthese): EcartPiece => {
  const depenseCents = apres.depenseCents - avant.depenseCents, entreCents = apres.entreCents - avant.entreCents, materielCents = apres.materielCents - avant.materielCents;
  const principal: EcartPiece['principal'] = entreCents !== 0 ? 'entre' : depenseCents !== 0 ? 'depense' : materielCents !== 0 ? 'materiel' : null;
  return {
    depenseCents, entreCents, materielCents,
    payeCents: apres.payeCents - avant.payeCents, aPayerCents: apres.aPayerCents - avant.aPayerCents,
    encaisseCents: (apres.entreCents - apres.entreAEncaisserCents) - (avant.entreCents - avant.entreAEncaisserCents), aEncaisserCents: apres.entreAEncaisserCents - avant.entreAEncaisserCents,
    principalCents: principal === 'entre' ? entreCents : principal === 'depense' ? depenseCents : principal === 'materiel' ? materielCents : 0, principal,
  };
};

/** `null` : la pièce ne change rien à dire (montant nul, date invalide, catégorie absente) : l'onglet reste fermé et neutre, sans faux écart. */
export function effetPiece(entree: EffetPieceEntree): EffetPiece | null {
  const prov = pieceProvisoire(entree.piece);
  if (!prov) return null;
  const { transaction, payment, mois } = prov;
  const transactions = entree.transactions.filter(t => t.id !== entree.idFinal && t.id !== transaction.id);
  const payments = entree.payments.filter(p => p.transactionId !== entree.idFinal && p.transactionId !== transaction.id);
  const base = { mois, aujourdhui: entree.aujourdhui, assets: entree.assets };
  const avant = periodeSynthese({ ...base, transactions, payments });
  const apres = periodeSynthese({ ...base, transactions: [...transactions, transaction], payments: payment ? [...payments, payment] : payments });
  return { mois, avant, apres, ecart: ecartEntre(avant, apres), reglement: entree.piece.reglement, sens: entree.piece.sens };
}
