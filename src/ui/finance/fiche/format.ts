import { accord } from '../../../services/plural';
import { isoDate } from '../../../domain/finance/ledger';

/** Unités comptables qui s'accordent (« 10 pièces », « 1 pièce ») ; une unité de mesure (kg, L, cl) reste telle quelle. */
const UNITES_COMPTABLES = new Set(['pièce', 'sachet', 'bouteille', 'fût', 'carton', 'caisse', 'boîte', 'paquet', 'canette', 'palette', 'sac', 'unité']);
export const uniteAccordee = (quantite: number, unite?: string): string => unite && UNITES_COMPTABLES.has(unite.toLowerCase()) ? accord(quantite, unite) : (unite ?? '');

const dateCourte = new Intl.DateTimeFormat('fr-CH', { day: 'numeric', month: 'short', year: 'numeric' });
/** « 7 nov. 2026 » (m5fo-a) : le mois abrégé, l'année toujours écrite. Une date illisible reste dite, jamais inventée. */
export function dateFiche(date?: string): string {
  const iso = isoDate(date);
  return iso ? dateCourte.format(new Date(`${iso}T12:00:00`)) : 'Date à vérifier';
}

export const MODE_COURT: Record<string, string> = { bank: 'banque', cash: 'espèces', twint: 'TWINT', other: 'autre' };
