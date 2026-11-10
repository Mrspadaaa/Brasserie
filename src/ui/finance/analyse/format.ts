import { amountOnly } from '../financeFormat';
import type { SourceCle } from '../../../domain/finance/analyse';

/** « 2 320,00 » ; jamais de « CHF » collé : l'unité est dite une fois par phrase. */
export const chf = (cents: number): string => amountOnly(cents);
/** « +540,00 » ou « −4 712,00 » (vrai signe moins). */
export const signe = (cents: number): string => cents > 0 ? `+${amountOnly(cents)}` : cents < 0 ? `−${amountOnly(-cents)}` : amountOnly(0);
/** « 22.10 » */
export const jjmm = (iso: string): string => `${iso.slice(8, 10)}.${iso.slice(5, 7)}`;
const MOIS = new Intl.DateTimeFormat('fr-CH', { month: 'short' });
const LONG = new Intl.DateTimeFormat('fr-CH', { month: 'long' });
const d = (mois: string) => new Date(Number(mois.slice(0, 4)), Number(mois.slice(5, 7)) - 1, 1, 12);
export const moisCourt = (mois: string): string => MOIS.format(d(mois));
export const moisLong = (mois: string): string => LONG.format(d(mois));
export const jourMois = (iso: string): string => { const n = Number(iso.slice(8, 10)); return `${n === 1 ? '1er' : n} ${MOIS.format(new Date(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, n, 12))}`; };
/** « janv. → oct. » ; avec l'année quand elle change. */
export const plage = (du: string, au: string): string => du === au ? moisCourt(du) : du.slice(0, 4) === au.slice(0, 4) ? `${moisCourt(du)} → ${moisCourt(au)}` : `${moisCourt(du)} ${du.slice(0, 4)} → ${moisCourt(au)} ${au.slice(0, 4)}`;
export const maj = (t: string): string => t.charAt(0).toUpperCase() + t.slice(1);
export const pluriel = (n: number, un: string, plus: string): string => `${n} ${n > 1 ? plus : un}`;

/** Les noms que le brasseur dit : « Charges fixes », « Brassage »… (ceux de la maquette a2a). */
export const nomSource = (s: SourceCle): string => ({ ventes: 'Ventes', chargesFixes: 'Charges fixes', brassage: 'Brassage', nettoyage: 'Nettoyage', autres: 'Autres', materiel: 'Matériel', prive: 'Apports et retraits' })[s];
/** Catégorie de pièce qui ouvre le journal pour une source. */
export const categorieDeSource = (s: SourceCle): string | undefined => ({ ventes: 'recettes', chargesFixes: 'chargesFixes', brassage: 'brassage', nettoyage: 'nettoyage', autres: 'divers', materiel: 'materiel', prive: undefined } as Record<SourceCle, string | undefined>)[s];
