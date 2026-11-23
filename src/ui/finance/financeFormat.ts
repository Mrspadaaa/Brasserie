import { formatCHF, isoDate, todayISO } from '../../domain/finance/ledger';

/**
 * Formats partagés par les écrans financiers.
 *
 * Ils vivaient en double dans `FinancesTab` et dans le journal. Les regrouper
 * ici garde une seule écriture d'une date et d'un montant : deux colonnes ne se
 * comparent que si elles sont formatées de la même façon.
 *
 * ⚠️ Les formateurs `Intl` sont construits UNE FOIS, au chargement du module.
 * `toLocaleDateString` en fabrique un neuf à chaque appel — c'est la partie
 * coûteuse d'`Intl`, pas le formatage lui-même. Le journal appelle ces
 * fonctions une fois par jour affiché et une fois par échéance, à chaque
 * frappe dans la recherche.
 */

const dayMonth = new Intl.DateTimeFormat('fr-CH', { day: 'numeric', month: 'short' });
const dayMonthYear = new Intl.DateTimeFormat('fr-CH', { day: 'numeric', month: 'short', year: 'numeric' });
const monthYear = new Intl.DateTimeFormat('fr-CH', { month: 'long', year: 'numeric' });
const fullDate = new Intl.DateTimeFormat('fr-CH', { day: 'numeric', month: 'long', year: 'numeric' });
const amountFormatter = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Midi : une date lue à minuit bascule d'un jour selon le fuseau. */
const noon = (iso: string) => new Date(`${iso}T12:00:00`);

/** Date de ligne : l'année n'apparaît que lorsqu'elle n'est pas l'année courante. */
export const shortDate = (date?: string): string => {
  const iso = isoDate(date);
  if (!iso) return 'Date à vérifier';
  return (iso.slice(0, 4) === todayISO().slice(0, 4) ? dayMonth : dayMonthYear).format(noon(iso));
};

/** Date écrite en toutes lettres, pour une fiche qu'on lit posément. */
const longDate = (date?: string): string => {
  const iso = isoDate(date);
  return iso ? fullDate.format(noon(iso)) : 'Date à vérifier';
};

const monthLabel = (month: string): string => monthYear.format(noon(`${month}-01`));

/**
 * Solde net d'une période.
 *
 * Le signe est écrit, jamais porté par la seule couleur : un total qui sort de
 * la caisse s'affiche `− 725,40 CHF`, une entrée nette `+ 720,00 CHF`.
 */
const signedCHF = (cents: number): string =>
  `${cents < 0 ? '− ' : cents > 0 ? '+ ' : ''}${formatCHF(Math.abs(cents))}`;

/**
 * Montant sans son unité.
 *
 * Dans une colonne dont chaque valeur est en francs, « CHF » répété douze fois
 * n'apprend rien et vole la largeur du libellé. L'unité est portée une fois par
 * l'en-tête du jour ; le nom accessible de la ligne, lui, garde `formatCHF`.
 */
export const amountOnly = (cents: number): string => amountFormatter.format(cents / 100);

/** Commence par une voyelle (ou un h muet de mois : aucun) : « août », « avril », « octobre ». */
const voyelle = (texte: string) => /^[aeiouyàâäéèêëîïôöûü]/i.test(texte);
/** « de novembre 2026 », « d’août – nov. 2026 » (neuf n° 5 du 19.11 : jamais « de août »). */
export const de = (texte: string): string => (voyelle(texte) ? `d’${texte}` : `de ${texte}`);
/** La rangée « du … au … » : « du juin », « d’août » ; « au novembre », « à août ». */
export const duMois = (texte: string): string => (voyelle(texte) ? 'd’' : 'du ');
const auMois = (texte: string): string => (voyelle(texte) ? 'à ' : 'au ');

/** Mois voisin, sans passer par le sélecteur natif. */
export const shiftMonth = (month: string, step: number): string => {
  const date = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1 + step, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};
