const nf2 = new Intl.NumberFormat('fr-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nf0 = new Intl.NumberFormat('fr-CH', { maximumFractionDigits: 0 });
/** Montant sans devise, deux décimales, virgule : « 1 099,18 ». Le signe moins est le vrai « − ». */
export const montant = (cents: number) => `${cents < 0 ? '−' : ''}${nf2.format(Math.abs(cents) / 100)}`;
export const montantSigne = (cents: number) => (cents < 0 ? montant(cents) : cents > 0 ? `+${montant(cents)}` : montant(0));
export const montantEntier = (cents: number) => `${cents < 0 ? '−' : ''}${nf0.format(Math.abs(cents) / 100)}`;
export const jourCourt = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}`;
export const moisCourt = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('fr-CH', { month: 'short', timeZone: 'UTC' });
export const litreFr = (chf: number) => nf2.format(chf);
/** « 5,00 » ou « 5.5 » saisi par le brasseur → centimes ; `null` si illisible ou non positif (jamais 0). */
export function centimesDeSaisie(saisie: string): number | null {
  const n = Number(saisie.trim().split(',').join('.').split(' ').join(''));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null;
}
