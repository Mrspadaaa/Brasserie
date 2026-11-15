import { isoDate, summarizeLedger, todayISO } from '../../../domain/finance/ledger';
import { periodeSynthese } from '../../../domain/finance/periodeSynthese';
import type { Transaction } from '../../../types';
import type { FinancialPayment, FinancialProfile } from '../../../domain/finance/types';

/**
 * L'effet d'un apport ou d'un prélèvement privé (m5ap-a, « effet sur le mois »).
 * Tout est lu du registre : la caisse vient du solde de départ confirmé (`null` sinon : jamais 0), le résultat du mois vient de
 * `periodeSynthese` pour le mois de la date choisie : la même fonction que la bande d'Opérations (matériel à part exclu des dépenses,
 * avoirs traités comme partout ailleurs), jamais une copie (q6, point 4).
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

export function effetMouvement(input: {
  transactions: Transaction[]; payments: FinancialPayment[]; profile: FinancialProfile;
  date: string; sens: 'in' | 'out'; amountCents: number | undefined; today?: string;
}): EffetMouvement {
  const today = input.today ?? todayISO();
  const jour = isoDate(input.date) ?? today;
  const mois = jour.slice(0, 7);
  const aujourdhui = summarizeLedger(input.transactions, input.payments, input.profile, today);
  // Ventes et dépenses du mois : `periodeSynthese`, la fonction de la bande d'Opérations, pas une copie : « dépensé » met le matériel à part (q6, point 4).
  const periode = periodeSynthese({ transactions: input.transactions, payments: input.payments, mois, aujourdhui: today });
  const ventesCents = periode.entreCents;
  const depensesCents = periode.depenseCents;
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
