/**
 * Dates calendaires du matériel. Méthode standard : jours entiers en UTC à midi (aucun fuseau, aucun passage à
 * l'heure d'été), validation par `isoDate` de la finance. `date-fns` n'est pas dans package.json : pas de bibliothèque neuve (L29).
 */
import { isoDate } from '../finance/ledger';

const MS_PAR_JOUR = 86_400_000;

/** ISO AAAA-MM-JJ valide (accepte aussi JJ.MM.AAAA tapé), sinon null. */
export const lireDate = (value?: string | null): string | null => isoDate(value ?? undefined);

const parts = (iso: string): [number, number, number] => {
  const [y, m, d] = iso.split('-').map(Number);
  return [y, m, d];
};
const utc = (iso: string): number => { const [y, m, d] = parts(iso); return Date.UTC(y, m - 1, d, 12); };
const ecrire = (ms: number): string => {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
};

export const addDays = (iso: string, days: number): string => ecrire(utc(iso) + days * MS_PAR_JOUR);

/** Mois calendaires : 11.10 + 1 → 11.11 ; fin de mois bornée (31.01 + 1 → 28 ou 29.02). */
export function addMonthsClamped(iso: string, months: number): string {
  const [y, m, d] = parts(iso);
  const total = y * 12 + (m - 1) + months;
  const ny = Math.floor(total / 12);
  const nm = total - ny * 12;
  const dernier = new Date(Date.UTC(ny, nm + 1, 0)).getUTCDate();
  return `${ny}-${String(nm + 1).padStart(2, '0')}-${String(Math.min(d, dernier)).padStart(2, '0')}`;
}

/** Jours entiers de `from` à `to` (négatif si `to` précède). */
export const daysBetween = (from: string, to: string): number => Math.round((utc(to) - utc(from)) / MS_PAR_JOUR);

/** « 05.11 » : l'affichage suisse court, sans l'année (la maquette ne la montre jamais). */
export const dateCourte = (iso: string): string => { const [, m, d] = parts(iso); return `${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}`; };

export const MOIS_COURTS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
export const moisCourt = (iso: string): string => MOIS_COURTS[parts(iso)[1] - 1];
export const premierDuMois = (iso: string): string => { const [y, m] = parts(iso); return `${y}-${String(m).padStart(2, '0')}-01`; };
