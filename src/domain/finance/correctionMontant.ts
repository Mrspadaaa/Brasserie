import type { Transaction } from '../../types';
import type { FinancialPayment } from './types';
import { isActiveTransaction, isoDate, paidForTransaction, transactionAmount, transactionDirection, transactionKind, validPayment, ventilationAvoir } from './ledger';

/**
 * Corriger le montant d'une pièce, payée ou non (maquette m5mo-c, décision du pilote du 15.11).
 *
 * Problème d'école : corriger une écriture comptable immuable par contre-écriture (storno). Les règles Firestore l'imposent : un paiement ne se
 * modifie jamais ; une correction est un paiement `CONTRE-<id>` de même montant et de sens inverse ; le solde réglé d'une pièce ne dépasse jamais son
 * montant ; créer un paiement ne change sur la pièce que `settlementBalanceCents` et `lastPaymentId`. L'ordre des écritures compte donc :
 *   · hausse    : le montant monte d'abord (le solde réglé tient encore), puis le paiement de la différence ;
 *   · baisse    : les contre-paiements d'abord (le solde réglé redescend sous le nouveau montant), puis le montant, puis le nouveau paiement.
 * Centimes entiers partout ; aucune horloge, aucun identifiant ici : l'écran les fournit en exécutant le plan.
 */

/**
 * `suit` / `reste` : une pièce soldée dont le montant change. `avoir` (FN-10, jeu en ligne du 15.11) : sous le payé seulement, « j'ai bien payé le montant d'avant » :
 * le paiement redescend au nouveau montant (les règles interdisent un réglé au-dessus du montant) et l'excédent devient un avoir à recevoir de l'autre partie.
 */
export type ChoixPaiement = 'suit' | 'reste' | 'avoir';

export type EtapeCorrection =
  | { type: 'contre'; paiementId: string }
  | { type: 'montant'; cents: number }
  /** `date` : celle du dernier paiement inversé pour une baisse, celle du dernier paiement vivant pour une hausse (une correction n'est pas un nouveau virement, E38-3) ; absente sans paiement connu. */
  | { type: 'paiement'; cents: number; direction: 'in' | 'out'; method: FinancialPayment['method']; date?: string }
  /** L'excédent versé, à recevoir (`direction: 'in'` pour une dépense) : un avoir `refund` lié à la pièce, par le mécanisme d'avoir existant, non encore encaissé. */
  | { type: 'avoir'; cents: number; direction: 'in' | 'out' };

export interface EffetCorrection { montantCents: number; payeCents: number; resteCents: number; avoirCents: number }

/** Un apport ou un prélèvement privé n'est jamais une créance (FN-12) : son paiement suit toujours le montant, jamais « Reste à payer », jamais d'avoir. */
export function estMouvementPrive(piece: Transaction): boolean {
  const kind = transactionKind(piece);
  return kind === 'contribution' || kind === 'withdrawal';
}

/** Les paiements réels de la pièce encore en vigueur : ni contre-paiement, ni paiement déjà annulé, du sens de la pièce. */
export function paiementsVivants(piece: Transaction, paiements: FinancialPayment[]): FinancialPayment[] {
  const annules = new Set(paiements.filter(p => p.reversalOfId).map(p => p.reversalOfId));
  return paiements
    .filter(p => p.transactionId === piece.id && validPayment(p) && !p.reversalOfId && !annules.has(p.id))
    .sort((a, b) => a.date.localeCompare(b.date) || a.recordedAt.localeCompare(b.recordedAt));
}

/** u1 (20) : retirer une pièce payée = inverser chacun de ses paiements en vigueur (puis l'annuler) ; jamais un paiement déjà inversé. */
export function planRetrait(piece: Transaction, paiements: FinancialPayment[]): EtapeCorrection[] {
  return paiementsVivants(piece, paiements).map(p => ({ type: 'contre' as const, paiementId: p.id }));
}

/** Réglé net de la pièce (paiements moins contre-paiements), en centimes. */
export function payeNet(piece: Transaction, paiements: FinancialPayment[], transactions: Transaction[] = []): number {
  return paidForTransaction(piece, paiements, transactions);
}

/**
 * « Le paiement suit / Reste à payer » n'a de sens que pour une pièce entièrement réglée : sinon il n'y a rien qui doive « suivre ».
 * Une pièce partielle ou ouverte n'écrit que son nouveau montant.
 */
export function choixPertinent(piece: Transaction, paiements: FinancialPayment[], transactions: Transaction[] = []): boolean {
  const paye = payeNet(piece, paiements, transactions);
  return paye > 0 && paye >= transactionAmount(piece);
}

/**
 * E35-6 (23.11 soir) : le choix posé d'avance pour une pièce réglée dont on corrige le montant. Avant, une hausse (3,50 → 4,50) partait en « Reste à payer » :
 * une faute de frappe sur un achat PAYÉ créait une dette de 1,00 « sans échéance » et un bouton « Marquer payé ». Corriger le montant d'une pièce payée
 * corrige aussi son paiement (« Le paiement suit ») ; « Reste à payer » (le fournisseur a vraiment facturé plus) reste un choix du brasseur, visible,
 * jamais celui qui s'écrit tout seul. Ce choix ne sert que si la pièce est entièrement réglée (`choixPertinent`) ; sinon il est sans effet.
 */
export function choixParDefaut(): ChoixPaiement {
  return 'suit';
}

/** Une baisse qui passe SOUS ce qui est déjà payé (q6, point 1) : seul « Le paiement suit » a un sens ; l'excédent versé est un avoir à enregistrer, pas un reste à payer. */
export function baisseSousLePaye(piece: Transaction, paiements: FinancialPayment[], nouveauMontantCents: number, transactions: Transaction[] = []): boolean {
  return Number.isSafeInteger(nouveauMontantCents) && nouveauMontantCents > 0 && nouveauMontantCents < transactionAmount(piece) && payeNet(piece, paiements, transactions) > nouveauMontantCents;
}

/**
 * La suite d'écritures qui amène la pièce à `nouveauMontantCents`, dans l'ordre où les règles Firestore l'acceptent.
 * Sous le payé, le choix est ignoré : le paiement suit toujours (voir `baisseSousLePaye`). Vide si le montant ne change pas. Lève une erreur si le montant est invalide ou si un paiement à inverser est introuvable.
 */
export function planCorrection(piece: Transaction, paiements: FinancialPayment[], nouveauMontantCents: number, choixDemande: ChoixPaiement): EtapeCorrection[] {
  if (!Number.isSafeInteger(nouveauMontantCents) || nouveauMontantCents <= 0) throw new Error('Montant invalide : un nombre positif en CHF est requis.');
  // FN-12 : un apport ou un prélèvement ne devient pas une créance ; son paiement suit, et il n'a pas de facture à avoir.
  const choix: ChoixPaiement = estMouvementPrive(piece) ? 'suit' : choixDemande;
  const ancien = transactionAmount(piece);
  if (nouveauMontantCents === ancien) return [];
  const paye = payeNet(piece, paiements);
  const solde = paye > 0 && paye >= ancien;
  const vivants = paiementsVivants(piece, paiements);
  const dernier = vivants[vivants.length - 1];
  const direction = dernier?.direction ?? transactionDirection(piece);
  const mode = dernier?.method ?? 'bank';

  if (nouveauMontantCents > ancien) {
    const etapes: EtapeCorrection[] = [{ type: 'montant', cents: nouveauMontantCents }];
    // E38-3 : corriger une faute de frappe n'est pas un nouveau virement : le complément garde le jour du paiement d'origine (un seul paiement, celui du 18.11).
    const jourDuPaiement = dernier ? isoDate(dernier.date) ?? undefined : undefined;
    if (solde && choix === 'suit') etapes.push({ type: 'paiement', cents: nouveauMontantCents - ancien, direction, method: mode, ...(jourDuPaiement ? { date: jourDuPaiement } : {}) });
    return etapes;
  }

  // Baisse : si le réglé tient encore sous le nouveau montant, le montant seul suffit.
  if (nouveauMontantCents >= paye) return [{ type: 'montant', cents: nouveauMontantCents }];

  // Baisse sous le réglé : on inverse les derniers paiements jusqu'à ce que le réglé tienne sous le nouveau montant.
  const etapes: EtapeCorrection[] = [];
  let reste = paye;
  let dateInversee = '';
  for (let i = vivants.length - 1; i >= 0 && reste > nouveauMontantCents; i--) {
    etapes.push({ type: 'contre', paiementId: vivants[i].id });
    reste -= vivants[i].amountCents;
    // Le plus récent des paiements inversés donne la date : l'argent est sorti ce jour-là, la correction ne le déplace pas (M2).
    const jour = isoDate(vivants[i].date) ?? vivants[i].date;
    if (jour > dateInversee) dateInversee = jour;
  }
  if (reste > nouveauMontantCents) throw new Error('Aucun paiement à inverser pour descendre sous le montant déjà réglé.');
  etapes.push({ type: 'montant', cents: nouveauMontantCents });
  // q6, point 1 : sous le payé, « Reste à payer » n'existe pas (le payé ne disparaît jamais, aucune échéance inventée pour une pièce payée) : le paiement suit toujours, quel que soit `choix`.
  if (nouveauMontantCents - reste > 0) etapes.push({ type: 'paiement', cents: nouveauMontantCents - reste, direction, method: mode, date: dateInversee });
  // FN-10 : « j'ai bien payé » : l'argent sorti ne disparaît pas, l'excédent est une créance (un avoir à recevoir, de sens inverse à la pièce).
  if (choix === 'avoir') etapes.push({ type: 'avoir', cents: paye - nouveauMontantCents, direction: direction === 'out' ? 'in' : 'out' });
  return etapes;
}

/** Ce que le plan laisse : le montant, le réglé net et le reste dû, en centimes. */
export function effetCorrection(piece: Transaction, paiements: FinancialPayment[], etapes: EtapeCorrection[]): EffetCorrection {
  let montant = transactionAmount(piece);
  let paye = payeNet(piece, paiements);
  let avoir = 0;
  for (const etape of etapes) {
    if (etape.type === 'montant') montant = etape.cents;
    else if (etape.type === 'paiement') paye += etape.cents;
    else if (etape.type === 'avoir') avoir += etape.cents;
    else {
      const p = paiements.find(x => x.id === etape.paiementId);
      if (p) paye -= p.amountCents;
    }
  }
  return { montantCents: montant, payeCents: paye, resteCents: Math.max(0, montant - paye), avoirCents: avoir };
}

/**
 * L'avoir que l'étape « avoir » écrit : exactement ce que `MovementSheet` écrit pour « Avoir ou remboursement » en argent (`refundApplication: 'cash'`, non encaissé),
 * sur la pièce déjà au nouveau montant (`pieceCorrigee`). Pure : l'identifiant, la date et l'instant viennent de l'appelant. Le montant ne dépasse jamais celui de la pièce.
 */
export function avoirDeTropPaye(pieceCorrigee: Transaction, etape: Extract<EtapeCorrection, { type: 'avoir' }>, ctx: { aujourdhui: string; maintenant: string }, id: string): Transaction {
  const ventile = ventilationAvoir(pieceCorrigee, etape.cents);
  const motif = `Trop payé sur « ${pieceCorrigee.description} » : montant corrigé`;
  return {
    id, date: ctx.aujourdhui, description: motif, category: pieceCorrigee.category, subcategory: 'Avoir',
    amountHT: ventile.amountHT, amountTTC: etape.cents / 100, tvaRate: ventile.tvaRate, tvaAmount: ventile.tvaAmount,
    finance: {
      version: 1, kind: 'refund', amountCents: etape.cents, lines: [], refundOfId: pieceCorrigee.id, refundDirection: etape.direction, refundApplication: 'cash',
      paymentStatus: 'unpaid', recordedAt: ctx.maintenant, ...(pieceCorrigee.finance?.vendor ? { vendor: pieceCorrigee.finance.vendor } : {}), notes: motif
    }
  };
}

export interface ContexteVerrou {
  /** Années pour lesquelles une clôture confirmée existe (voir `anneesCloses`). */
  anneesCloturees: number[];
  /** L'année de la pièce est archivée (au sens de `isTransactionArchived`, calculé par l'appelant). */
  archivee: boolean;
  /** La date saisie dans le formulaire, si elle diffère de celle de la pièce : son année est jugée aussi (M3). */
  dateNouvelle?: string;
  /** L'année de `dateNouvelle` est archivée (calculé par l'appelant sur la pièce à cette date). */
  archiveeNouvelleDate?: boolean;
}

/** Une clôture « confirmée » est une clôture figée (`report` présent : `finalizeClosing`). Un brouillon d'inventaire ne ferme rien (M4). */
export function anneesCloses(clotures: ReadonlyArray<{ year: number; report?: unknown }>): number[] {
  return [...new Set(clotures.filter(c => !!c.report).map(c => c.year))];
}

/**
 * Pourquoi le montant ne se modifie pas, en une ligne ; `null` si tout se modifie. Décision du pilote (15.11) : le verrou ne tient que si l'année de la
 * pièce est close ou archivée, ou si la pièce est annulée. L'année de la nouvelle date compte autant que celle d'origine : on ne déplace pas une pièce
 * vers un exercice clos en changeant son montant (M3). Deux contraintes de données s'y ajoutent (écart dit au RESULTAT) : un avoir (borné par sa
 * facture) et une pièce à plusieurs lignes (le total est la somme des lignes).
 */
export function verrouMontant(piece: Transaction, ctx: ContexteVerrou): string | null {
  if (!isActiveTransaction(piece)) return 'Opération annulée : crée une nouvelle opération pour la remplacer.';
  const jours: Array<{ annee: number; archivee: boolean }> = [{ annee: Number((isoDate(piece.date) ?? '').slice(0, 4)), archivee: ctx.archivee }];
  const nouvelle = ctx.dateNouvelle ? isoDate(ctx.dateNouvelle) : null;
  if (nouvelle && nouvelle !== isoDate(piece.date)) jours.push({ annee: Number(nouvelle.slice(0, 4)), archivee: !!ctx.archiveeNouvelleDate });
  for (const { annee, archivee } of jours) {
    if (annee && ctx.anneesCloturees.includes(annee)) return `Exercice ${annee} clôturé : corrige par un avoir ou annule l’opération.`;
    if (archivee) return `Exercice ${annee || 'de la pièce'} archivé : corrige par un avoir ou annule l’opération.`;
  }
  if (transactionKind(piece) === 'refund') return 'Un avoir se corrige en l’annulant, puis en le recréant.';
  const lignes = piece.finance?.lines?.length ?? 0;
  if (lignes > 1) return `Le total vient des ${lignes} lignes de la facture : corrige-les ou annule l’opération.`;
  return null;
}

/** Un nouveau montant que les données refusent (hors verrou) : les avoirs actifs liés à la pièce ne la dépassent jamais. `null` si rien ne s'y oppose. */
export function erreurNouveauMontant(piece: Transaction, nouveauMontantCents: number, transactions: Transaction[]): string | null {
  const avoirs = transactions
    .filter(t => t.id !== piece.id && isActiveTransaction(t) && t.finance?.refundOfId === piece.id)
    .reduce((somme, t) => somme + transactionAmount(t), 0);
  return avoirs > nouveauMontantCents ? 'Les avoirs liés à cette pièce dépassent ce montant : corrige d’abord les avoirs.' : null;
}
