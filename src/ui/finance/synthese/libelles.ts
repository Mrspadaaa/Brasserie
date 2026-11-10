import { CATEGORY_LABELS } from '../FinanceForms';
import { shiftMonth } from '../financeFormat';

/** Libellé d'un poste de la pile. Le matériel qui figure dans le dépensé est du matériel passé en charge (le capital est « à part »). */
export const libelleCategorie = (categorie: string): string =>
  categorie === 'materiel' ? 'Matériel en charge'
    : categorie === 'divers' ? 'Autres frais'
    : CATEGORY_LABELS[categorie as keyof typeof CATEGORY_LABELS] ?? categorie;

/**
 * Couleurs de catégorie : celles de la maquette g3a (etat.html), les mêmes en clair et en cave. Ce sont les valeurs des jetons `--c-*` de la cave
 * (`couleurs-portees.css`) ; le thème clair les fonce pour du texte, mais la maquette choisie les veut vives, avec le texte sombre de g3a posé dessus.
 */
const COULEURS: Record<string, { fond: string; texte: string }> = {
  nettoyage: { fond: '#56C1D2', texte: '#0f3a40' }, brassage: { fond: '#D2B356', texte: '#3a2f10' }, chargesFixes: { fond: '#9856D2', texte: '#ffffff' },
  materiel: { fond: '#567BD2', texte: '#0d1f4d' }, renovation: { fond: '#D27B56', texte: '#3a1c10' }, recettes: { fond: '#56D27B', texte: '#123d1f' },
};
export const couleur = (categorie: string): string => COULEURS[categorie]?.fond ?? '#9A9A9A';
/** Le texte lisible posé sur la couleur d'une catégorie. */
export const texteSur = (categorie: string): string => COULEURS[categorie]?.texte ?? '#111111';
/** Hachure : la couleur de la catégorie rayée avec le fond de la page, donc lisible en clair comme en cave. */
export const hachure = (categorie: string): string => {
  const c = couleur(categorie);
  return `repeating-linear-gradient(135deg, ${c} 0 4px, color-mix(in srgb, ${c} 22%, rgb(var(--cave-950))) 4px 9px)`;
};

const MOIS_COURT = new Intl.DateTimeFormat('fr-CH', { month: 'short' });
const MOIS_LONG = new Intl.DateTimeFormat('fr-CH', { month: 'long' });
const date = (mois: string) => new Date(Number(mois.slice(0, 4)), Number(mois.slice(5, 7)) - 1, 1, 12);
const majuscule = (texte: string) => texte.charAt(0).toUpperCase() + texte.slice(1);

/** Les trois mois qui finissent au mois courant : « sept. oct. nov. ». Un mois choisi plus ancien (état restauré) prend la place du premier. */
export function fenetreMois(courant: string, choisi: string): string[] {
  const base = [shiftMonth(courant, -2), shiftMonth(courant, -1), courant];
  return choisi < base[0] ? [choisi, base[1], base[2]] : base;
}
/** « nov. », avec l'année quand ce n'est pas l'année en cours (« déc. 2025 »). */
export function moisCourt(mois: string, anneeCourante: string): string {
  const base = MOIS_COURT.format(date(mois));
  return mois.slice(0, 4) === anneeCourante ? base : `${base} ${mois.slice(0, 4)}`;
}
/**
 * Titre d'une plage de mois (CP-9) : « Juin – nov. 2026 » ; sur deux années, chaque bout porte la sienne : « Déc. 2025 – mars 2026 ».
 * L'année est toujours dite (une plage n'est pas « le mois en cours »).
 */
export function titrePlage(du: string, au: string): string {
  const court = (mois: string) => MOIS_COURT.format(date(mois));
  const [a1, a2] = [du.slice(0, 4), au.slice(0, 4)];
  return majuscule(a1 === a2 ? `${court(du)} – ${court(au)} ${a2}` : `${court(du)} ${a1} – ${court(au)} ${a2}`);
}
/** « Novembre », avec l'année quand ce n'est pas l'année en cours. */
export function titreMois(mois: string, anneeCourante: string): string {
  const base = majuscule(MOIS_LONG.format(date(mois)));
  return mois.slice(0, 4) === anneeCourante ? base : `${base} ${mois.slice(0, 4)}`;
}
