import type { FinanceTransaction, FinancialPayment } from './finance/types';
import { isActiveTransaction, isoDate, transactionKind, validPayment } from './finance/ledger';
import { CATEGORIES_TRAVAUX, type ChoseCalendrier, type Rangee } from './calendrier';
import { jourLisible } from './calendrier/dates';
import { estAutreEntree } from './finance/libelleEcriture';

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

export { estAutreEntree };

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

/**
 * E38-3 : une chose par pièce ET par jour, pas par paiement. Une correction de montant écrit un complément le jour du paiement d'origine (3,50 puis 1,00 le
 * 18.11) : le Calendrier dit « 4,50 le 18.11 », jamais deux lignes. Un paiement inversé (contre-paiement) ne compte plus, ni son contre.
 */
export function chosesPayees(e: EntreesPaiements): ChoseCalendrier[] {
  const pieces = new Map(e.transactions.map(t => [t.id, t] as const));
  const inverses = new Set(e.payments.filter(p => p.reversalOfId).map(p => p.reversalOfId as string));
  const parPieceEtJour = new Map<string, { tx: FinanceTransaction; jour: string; premier: FinancialPayment; cents: number }>();
  for (const pay of e.payments) {
    const tx = pay.transactionId ? pieces.get(pay.transactionId) : undefined;
    const jour = isoDate(pay.date);
    if (!tx || !jour || jour < e.depuis || jour > e.aujourdhui || !validPayment(pay) || !isActiveTransaction(tx) || e.attendues.has(tx.id)) continue;
    if (pay.reversalOfId || inverses.has(pay.id)) continue;
    const kind = transactionKind(tx);
    const entre = kind === 'income' || kind === 'contribution';
    if (pay.direction !== (entre ? 'in' : 'out')) continue;
    if (!rangeeDePiece(tx, e.matieres)) continue;
    const cle = `${tx.id}|${jour}`;
    const deja = parPieceEtJour.get(cle);
    if (deja) deja.cents += pay.amountCents; else parPieceEtJour.set(cle, { tx, jour, premier: pay, cents: pay.amountCents });
  }
  return [...parPieceEtJour.values()].flatMap(({ tx, jour, premier, cents }): ChoseCalendrier[] => {
    const kind = transactionKind(tx);
    const entre = kind === 'income' || kind === 'contribution';
    const rangee = rangeeDePiece(tx, e.matieres)!;
    const apport = kind === 'contribution', autre = estAutreEntree(tx), prive = kind === 'withdrawal';
    const detail = apport ? `apport, reçu le ${jourLisible(jour)}` : autre ? `autre entrée, reçue le ${jourLisible(jour)}` : prive ? `prélèvement privé, le ${jourLisible(jour)}`
      : entre ? `encaissée le ${jourLisible(jour)}` : `payée le ${jourLisible(jour)}`;
    const quoi = apport ? 'Apport reçu' : autre ? 'Entrée reçue' : prive ? 'Prélèvement fait' : entre ? 'Vente encaissée' : 'Paiement fait';
    return [{
      id: `paiement-${premier.id}`, rangee, titre: tx.description || tx.id, debut: jour, fin: jour, centimes: entre ? cents : -cents, detail,
      ...(horsVentesDe(tx) ? { horsVentes: horsVentesDe(tx) } : {}),
      source: { genre: 'facture', id: tx.id }, ouvre: { ecran: 'piece', id: tx.id },
      deplacable: { raison: `${quoi} : sa date est un fait. Elle se corrige dans la pièce (Finances › Opérations).` }
    }];
  });
}
