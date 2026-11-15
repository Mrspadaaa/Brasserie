import type { FinanceTransaction } from './types';
import { transactionKind } from './ledger';

/**
 * Numéro de facture continu `FAC-2026-0001` (décision P6) : max + 1 sur le grand livre local, par année.
 * Hors ligne, deux appareils peuvent donner le même numéro : `doublonsNumeroFacture` le signale, jamais de renumérotation après envoi.
 */
const MOTIF = /^FAC-(\d{4})-(\d{4,6})$/;

/** Numéros de facture client portés par une écriture : son champ `invoiceNumber` et son identifiant (l'un est copié dans l'autre à l'émission). */
function numerosDe(ecriture: FinanceTransaction): string[] {
  return [ecriture.finance?.invoiceNumber, ecriture.id].filter((n): n is string => typeof n === 'string' && MOTIF.test(n));
}

/** Seules les recettes comptent : un fournisseur peut imprimer « FAC-2026-0009 » sans aucun rapport. Les écritures annulées comptent (un numéro envoyé ne se réutilise pas). */
const estRecette = (ecriture: FinanceTransaction): boolean => transactionKind(ecriture) === 'income';

/** Le numéro suivant de l'année `annee` (celle de la date d'émission). Les anciens `FAC-2026-<8 hex>` ne sont pas des séquences : ignorés. */
export function prochainNumeroFacture(ecritures: FinanceTransaction[], annee: number): string {
  let max = 0;
  for (const ecriture of ecritures.filter(estRecette)) {
    for (const numero of numerosDe(ecriture)) {
      const [, an, sequence] = MOTIF.exec(numero)!;
      if (Number(an) === annee) max = Math.max(max, Number(sequence));
    }
  }
  return `FAC-${annee}-${String(max + 1).padStart(4, '0')}`;
}

/** Les numéros portés par au moins deux recettes différentes, avec leurs identifiants. */
export function doublonsNumeroFacture(ecritures: FinanceTransaction[]): { numero: string; ids: string[] }[] {
  const parNumero = new Map<string, Set<string>>();
  for (const ecriture of ecritures.filter(estRecette)) {
    for (const numero of new Set(numerosDe(ecriture))) {
      if (!parNumero.has(numero)) parNumero.set(numero, new Set());
      parNumero.get(numero)!.add(ecriture.id);
    }
  }
  return [...parNumero].filter(([, ids]) => ids.size > 1).map(([numero, ids]) => ({ numero, ids: [...ids] }));
}

/**
 * Échéance d'une facture : la date d'émission (`AAAA-MM-JJ`) plus 0, 10 ou 30 jours (30 par défaut).
 * Calcul en UTC : jours calendaires, sans effet du changement d'heure. Une date impossible lève (jamais de repli silencieux).
 */
export function echeanceFacture(dateIso: string, delai: 'reception' | 10 | 30 = 30): string {
  const lue = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateIso);
  if (!lue) throw new Error(`Date d'émission illisible : ${dateIso}`);
  const [annee, mois, jour] = [Number(lue[1]), Number(lue[2]), Number(lue[3])];
  const date = new Date(Date.UTC(annee, mois - 1, jour));
  if (date.getUTCFullYear() !== annee || date.getUTCMonth() !== mois - 1 || date.getUTCDate() !== jour) throw new Error(`Date d'émission impossible : ${dateIso}`);
  if (delai !== 'reception') date.setUTCDate(date.getUTCDate() + delai);
  return date.toISOString().slice(0, 10);
}
