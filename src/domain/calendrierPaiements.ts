import type { FinanceTransaction, FinancialPayment } from './finance/types';
import { isActiveTransaction, isoDate, transactionKind, validPayment } from './finance/ledger';
import { CATEGORIES_TRAVAUX, type ChoseCalendrier, type Rangee } from './calendrier';
import { jourLisible } from './calendrier/dates';

/**
 * Ce que le Calendrier montre de l'argent DÉJÀ BOUGÉ (E35-2, E35-3, E35-10, 23.11 soir) : une chose par paiement réel, à son jour, dans la fenêtre
 * `[depuis, aujourdhui]`. La prévision (`buildForecast`) n'a que l'à venir ; sans ceci, un achat payé il y a trois jours ne se voyait nulle part,
 * alors que la vente d'hier s'y voyait.
 *
 * Une règle pour les sorties comme pour les rentrées :
 *  - une vente (`income`) → Ventes ; un apport (`contribution`) et une autre entrée → Ventes aussi, mais `horsVentes` : hors du total des ventes ;
 *  - une charge (`expense`) → Travaux (matériel, local), Papiers (charges fixes, impôts), sinon Achats ;
 *  - un prélèvement privé (`withdrawal`, « Pour moi ») → Papiers, `horsVentes` ne s'applique pas (c'est une sortie) ;
 *  - un remboursement (`refund`) n'y est pas : il corrige une autre pièce.
 * Une pièce annulée, un paiement invalide ou de sens contraire à la pièce ne sont pas des choses. Une pièce encore attendue dans la prévision
 * (`attendues`, reste à payer ou à encaisser) y est déjà : pas deux fois.
 */
export interface EntreesPaiements {
  payments: readonly FinancialPayment[];
  transactions: readonly FinanceTransaction[];
  /** Les pièces (id) que la prévision attend encore. */
  attendues: ReadonlySet<string>;
  /** Les factures de matières (`estFactureDeMatieres`) : Achats même sans catégorie `brassage`. */
  matieres?: ReadonlySet<string>;
  depuis: string;
  aujourdhui: string;
}

export function rangeeDePiece(tx: FinanceTransaction, matieres?: ReadonlySet<string>): Rangee | null {
  const kind = transactionKind(tx);
  if (kind === 'refund') return null;
  if (kind === 'income' || kind === 'contribution') return 'ventes';
  if (kind === 'withdrawal') return 'papiers';
  if (CATEGORIES_TRAVAUX.includes(tx.category)) return 'travaux';
  if (matieres?.has(tx.id)) return 'achats';
  if (tx.category === 'chargesFixes' || /^imp[oô]t/i.test(tx.subcategory ?? '')) return 'papiers';
  return 'achats';
}

/** « Autre recette » : la rentrée qui n'est ni une vente ni un apport (`GENRES.autrei`). */
export const estAutreEntree = (tx: FinanceTransaction): boolean => transactionKind(tx) === 'income' && tx.subcategory === 'Autre recette';

/** Ce qui rentre sans être une vente : un apport, une autre entrée (absent pour une vente ou une sortie). */
export function horsVentesDe(tx: FinanceTransaction | undefined): ChoseCalendrier['horsVentes'] {
  if (!tx) return undefined;
  return transactionKind(tx) === 'contribution' ? 'apport' : estAutreEntree(tx) ? 'autre-entree' : undefined;
}

/** Une pièce à encaisser que la prévision attend (apport ou autre entrée promis, pas encore reçu) reste « hors ventes » : sa chose le dit aussi. */
export function marquerHorsVentes(choses: readonly ChoseCalendrier[], transactions: readonly FinanceTransaction[]): ChoseCalendrier[] {
  const pieces = new Map(transactions.map(t => [t.id, t] as const));
  return choses.map(c => {
    if (c.rangee !== 'ventes' || c.source.genre !== 'facture' || c.horsVentes) return c;
    const h = horsVentesDe(pieces.get(c.source.id));
    return h ? { ...c, horsVentes: h } : c;
  });
}

export function chosesPayees(e: EntreesPaiements): ChoseCalendrier[] {
  const pieces = new Map(e.transactions.map(t => [t.id, t] as const));
  return e.payments.flatMap((pay): ChoseCalendrier[] => {
    const tx = pay.transactionId ? pieces.get(pay.transactionId) : undefined;
    const jour = isoDate(pay.date);
    if (!tx || !jour || jour < e.depuis || jour > e.aujourdhui || !validPayment(pay) || !isActiveTransaction(tx) || e.attendues.has(tx.id)) return [];
    const kind = transactionKind(tx);
    const entre = kind === 'income' || kind === 'contribution';
    if (pay.direction !== (entre ? 'in' : 'out')) return [];
    const rangee = rangeeDePiece(tx, e.matieres);
    if (!rangee) return [];
    const apport = kind === 'contribution', autre = estAutreEntree(tx), prive = kind === 'withdrawal';
    const detail = apport ? `apport, reçu le ${jourLisible(jour)}` : autre ? `autre entrée, reçue le ${jourLisible(jour)}` : prive ? `prélèvement privé, le ${jourLisible(jour)}`
      : entre ? `encaissée le ${jourLisible(jour)}` : `payée le ${jourLisible(jour)}`;
    const quoi = apport ? 'Apport reçu' : autre ? 'Entrée reçue' : prive ? 'Prélèvement fait' : entre ? 'Vente encaissée' : 'Paiement fait';
    return [{
      id: `paiement-${pay.id}`, rangee, titre: tx.description || tx.id, debut: jour, fin: jour, centimes: entre ? pay.amountCents : -pay.amountCents, detail,
      ...(horsVentesDe(tx) ? { horsVentes: horsVentesDe(tx) } : {}),
      source: { genre: 'facture', id: tx.id }, ouvre: { ecran: 'piece', id: tx.id },
      deplacable: { raison: `${quoi} : sa date est un fait. Elle se corrige dans la pièce (Finances › Opérations).` }
    }];
  });
}
