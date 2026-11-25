/**
 * R105 (c77, R73-25, 2e retour) : UNE seule façon de dire une date dans les carnets : Quand, la liste des carnets, À faire, la puce du genre.
 * La RÈGLE (pas un exemple) : une date dit son année quand elle n'est pas celle d'aujourd'hui, quelle que soit sa forme (jour, semaine, mois, plage,
 * Planning importé ou non) ; une date de l'année en cours ne la dit pas (« jamais l'année partout », CT4-A-13).
 * L'année d'une semaine est celle de son jeudi (ISO 8601) : le 01.01.2027 est en S53 2026. Le mois d'une date en horizon est celui du jeudi de sa semaine.
 */
import { MOIS_COURTS, ajouterJours, jourLisible, lundiDe, numeroSemaine } from '../calendrier/dates';
import { estPassee, lireIso } from '../horizons';

const an = (iso: string): string => iso.slice(0, 4);
/** « 2027 » précédé d'une espace quand `annee` n'est pas l'année courante ; sinon rien. */
const suffixe = (annee: string, courante: string): string => (annee !== courante ? ` ${annee}` : '');
const anneeIso = (lundi: string): string => an(ajouterJours(lundi, 3));

/** « 14 déc. » (année en cours), « 1 mai 2027 » (autre année). `courante` : un jour d'aujourd'hui (AAAA-MM-JJ). */
export const jourDit = (iso: string, courante: string): string => `${jourLisible(iso)}${suffixe(an(iso), an(courante))}`;
/** « S17 » (année en cours), « S17 2027 », « S53 2026 » : l'année de la semaine ISO, pas celle du lundi. */
export const semaineDite = (iso: string, courante: string): string => {
  const lundi = lundiDe(iso);
  return `S${numeroSemaine(lundi)}${suffixe(anneeIso(lundi), an(courante))}`;
};
/** « mars » (année en cours), « mars 2027 ». */
export const moisDit = (iso: string, courante: string): string => `${MOIS_COURTS[Number(iso.slice(5, 7)) - 1]}${suffixe(an(iso), an(courante))}`;

/**
 * Une date d'intention dite en clair : « cette semaine », « S48 », « S17 2027 », « vers févr. », « vers mars 2027 », « passé · S50 2025 ».
 * Jamais une semaine passée dite « vers » ; rien de lisible : `null`. `courante` est le jour d'aujourd'hui (AAAA-MM-JJ).
 */
export function dateDite(date: string | undefined, courante: string, precision?: 'semaine' | 'mois'): string | null {
  const d = lireIso(date), j = lireIso(courante);
  if (!d || !j) return null;
  const lundi = lundiDe(d);
  if (lundi === lundiDe(j)) return 'cette semaine';
  if (estPassee(lundi, j)) return `passé · ${semaineDite(lundi, j)}`;
  if (precision === 'semaine') return semaineDite(lundi, j);
  return `vers ${moisDit(ajouterJours(lundi, 3), j)}`;
}
