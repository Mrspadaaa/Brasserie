import { formatCHF, isoDate, todayISO } from '../../domain/finance/ledger';

/**
 * Formats partagés par les écrans financiers.
 *
 * Ils vivaient en double dans `FinancesTab` et dans le journal. Les regrouper
 * ici garde une seule écriture d'une date et d'un montant : deux colonnes ne se
 * comparent que si elles sont formatées de la même façon.
 */

/** Date de ligne : l'année n'apparaît que lorsqu'elle n'est pas l'année courante. */
export const shortDate = (date?: string): string => {
  const iso = isoDate(date);
  if (!iso) return 'Date à vérifier';
  return new Date(`${iso}T12:00:00`).toLocaleDateString('fr-CH', {
    day: 'numeric',
    month: 'short',
    year: iso.slice(0, 4) === todayISO().slice(0, 4) ? undefined : 'numeric',
  });
};

export const monthLabel = (month: string): string =>
  new Date(`${month}-01T12:00:00`).toLocaleDateString('fr-CH', { month: 'long', year: 'numeric' });

/**
 * Solde net d'une période.
 *
 * Le signe est écrit, jamais porté par la seule couleur : un total qui sort de
 * la caisse s'affiche `− 725,40 CHF`, une entrée nette `+ 720,00 CHF`.
 */
export const signedCHF = (cents: number): string =>
  `${cents < 0 ? '− ' : cents > 0 ? '+ ' : ''}${formatCHF(Math.abs(cents))}`;

/** Mois voisin, sans passer par le sélecteur natif. */
export const shiftMonth = (month: string, step: number): string => {
  const date = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1 + step, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const amountFormatter = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Montant sans son unité.
 *
 * Dans une colonne dont chaque valeur est en francs, « CHF » répété douze fois
 * n'apprend rien et vole la largeur du libellé. L'unité est portée une fois par
 * l'en-tête du jour ; le nom accessible de la ligne, lui, garde `formatCHF`.
 */
export const amountOnly = (cents: number): string => amountFormatter.format(cents / 100);

/** Date écrite en toutes lettres, pour une fiche qu'on lit posément. */
export const longDate = (date?: string): string => {
  const iso = isoDate(date);
  if (!iso) return 'Date à vérifier';
  return new Date(`${iso}T12:00:00`).toLocaleDateString('fr-CH', { day: 'numeric', month: 'long', year: 'numeric' });
};
