import { isoDate, summarizeLedger, todayISO } from '../../../domain/finance/ledger';
import type { Transaction } from '../../../types';
import type { FinancialPayment, FinancialProfile } from '../../../domain/finance/types';

/**
 * L'effet d'un apport ou d'un prélèvement privé (m5ap-a, « effet sur le mois »).
 * Tout est lu du registre : la caisse vient du solde de départ confirmé (`null` sinon : jamais 0), le résultat du mois est la différence
 * de deux photographies du même registre (les ventes et les dépenses cumulées à la fin du mois, moins celles de la veille de son premier jour),
 * donc les avoirs liés à une pièce d'un autre mois sont traités comme partout ailleurs.
 */
export interface EffetMouvement {
  /** Caisse aujourd'hui ; `null` tant que le solde de départ n'est pas confirmé. */
  caisseCents: number | null;
  /** Ce que le mouvement ajoute (+) ou retire (−) à la caisse ; `null` sans montant saisi. */
  deltaCents: number | null;
  ventesCents: number;
  depensesCents: number;
  /** Ventes − dépenses du mois de la date choisie. Un apport ne le change jamais. */
  resultatCents: number;
  mois: string;
}

const ajouterJours = (iso: string, jours: number): string => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + jours);
  return d.toISOString().slice(0, 10);
};
const finDeMois = (mois: string): string => {
  const [a, m] = mois.split('-').map(Number);
  return new Date(Date.UTC(a, m, 0, 12)).toISOString().slice(0, 10);
};

export function effetMouvement(input: {
  transactions: Transaction[]; payments: FinancialPayment[]; profile: FinancialProfile;
  date: string; sens: 'in' | 'out'; amountCents: number | undefined; today?: string;
}): EffetMouvement {
  const today = input.today ?? todayISO();
  const jour = isoDate(input.date) ?? today;
  const mois = jour.slice(0, 7);
  const fin = finDeMois(mois) < today ? finDeMois(mois) : today;
  const veille = ajouterJours(`${mois}-01`, -1);
  const jusqualaFin = summarizeLedger(input.transactions, input.payments, input.profile, fin);
  const avant = summarizeLedger(input.transactions, input.payments, input.profile, veille);
  const aujourdhui = summarizeLedger(input.transactions, input.payments, input.profile, today);
  const ventesCents = jusqualaFin.incomeCents - avant.incomeCents;
  const depensesCents = jusqualaFin.expenseCents - avant.expenseCents;
  const montant = input.amountCents;
  return {
    caisseCents: aujourdhui.cashComplete ? aujourdhui.cashCents : null,
    deltaCents: montant && montant > 0 ? (input.sens === 'in' ? montant : -montant) : null,
    ventesCents, depensesCents, resultatCents: ventesCents - depensesCents, mois,
  };
}

/** Largeurs (en %) de la piste « Caisse » : le fond gris = la caisse qui reste, puis le segment du mouvement. `null` quand la caisse est inconnue. */
export function pisteCaisse(effet: Pick<EffetMouvement, 'caisseCents' | 'deltaCents'>): { base: number; segment: number } | null {
  const { caisseCents: caisse, deltaCents: delta } = effet;
  if (delta === null) return { base: caisse !== null && caisse > 0 ? 90 : 0, segment: 0 };
  if (caisse === null) return null;
  const apres = caisse + delta;
  const echelle = Math.max(Math.abs(caisse), Math.abs(apres), Math.abs(delta), 1);
  const base = Math.max(0, Math.min(caisse, apres));
  return { base: (base / echelle) * 90, segment: (Math.abs(delta) / echelle) * 90 };
}

/** Largeur (en %) de la piste « Ventes − dépenses » : la part du résultat dans le plus grand des deux, 3 % au moins pour qu'un résultat non nul se voie. */
export function pisteResultat(effet: Pick<EffetMouvement, 'ventesCents' | 'depensesCents' | 'resultatCents'>): number {
  const grand = Math.max(effet.ventesCents, effet.depensesCents, 1);
  if (effet.resultatCents === 0) return 0;
  return Math.min(100, Math.max(3, (Math.abs(effet.resultatCents) / grand) * 100));
}
