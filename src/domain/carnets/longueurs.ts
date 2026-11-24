/**
 * Les longueurs d'une même colonne se lisent dans une même unité (T30-6, test en ligne du tour 30 : « 2010 » à côté de « 180 cm » et « 143,5 cm »
 * dans la colonne Hauteur). Problème d'école : conversion d'unités de longueur (mm, cm, m ; facteurs décimaux exacts, pas de bibliothèque).
 *
 * Deux gestes, jamais davantage :
 *  - une valeur qui dit son unité (mm, cm, m) passe dans l'unité de la colonne ;
 *  - une valeur SANS unité, dans une colonne en cm, qui dépasse 1 000 (plus de 10 m : aucune pièce du brasseur) est lue en mm. C'est une
 *    déduction, dite comme telle par l'appelant (`supposee`) ; sous 1 000, rien n'est deviné et la valeur reste sans unité.
 * Un nom qui ne parle pas d'une longueur (« Poids », « Volume ») n'est jamais converti.
 */
import type { Valeur } from './modele';

const EN_MM: Record<string, number> = { mm: 1, cm: 10, m: 1000 };
const NOM_LONGUEUR = /hauteur|largeur|profondeur|longueur|diam[eè]tre|[ée]paisseur|height|width|depth|length|diameter/i;
/** Au-delà, un nombre sans unité n'est pas des cm (10 m) : il est lu en mm. */
export const SEUIL_MM_SANS_UNITE = 1000;

const arrondi = (n: number) => Math.round(n * 100) / 100;

/** `true` si ce nom de caractéristique dit une longueur. */
export const estLongueur = (nom: string): boolean => NOM_LONGUEUR.test(nom);

const MESURE_SEULE = /^\s*(\d+(?:[.,]\d+)?)\s*(mm|cm|m)\s*$/i;
/**
 * E47-2 : une longueur écrite d'un bloc (« 143,5 cm », « 370 mm ») dit son unité dans son texte ; la colonne de Comparer ne la voyait pas
 * (deux unités dans une colonne). Ici le texte se sépare en nombre et unité, pour les noms de longueur seulement ; une valeur à plusieurs
 * termes (« 525 × 550 mm ») ou sans unité reste telle quelle.
 */
export function separerUnite(nom: string, v: Valeur): Valeur {
  if (v.unite || typeof v.valeur !== 'string' || !estLongueur(nom)) return v;
  const m = v.valeur.match(MESURE_SEULE);
  if (!m) return v;
  const n = Number(m[1].replace(',', '.'));
  return Number.isFinite(n) ? { ...v, valeur: n, unite: m[2].toLowerCase() } : v;
}

/** L'unité de longueur d'une colonne : la plus lue ; à égalité, le cm (l'unité du brasseur), puis le mm, puis le m. */
export function uniteDeColonneLongueur(comptes: ReadonlyMap<string, number>): string | undefined {
  const rang = (u: string) => { const i = ['cm', 'mm', 'm'].indexOf(u.toLowerCase()); return i < 0 ? 9 : i; };
  return [...comptes.entries()].filter(([u]) => u !== '').sort((x, y) => y[1] - x[1] || rang(x[0]) - rang(y[0]))[0]?.[0];
}

/** La valeur passée dans l'unité de la colonne ; `null` : pas une longueur, unité inconnue ou nombre illisible. */
export function convertirLongueur(nom: string, uniteColonne: string, v: Valeur, nombre: number | null): Valeur | null {
  const de = v.unite ? EN_MM[v.unite.trim().toLowerCase()] : undefined;
  const vers = EN_MM[uniteColonne.trim().toLowerCase()];
  if (!estLongueur(nom) || !de || !vers || nombre === null) return null;
  return { ...v, valeur: arrondi((nombre * de) / vers), unite: uniteColonne };
}

/** Une valeur sans unité, plus grande que 10 m en cm : lue en mm et dite en cm (`supposee`) ; `null` : rien n'est deviné. */
export function mmSansUnite(nom: string, uniteColonne: string, v: Valeur, nombre: number | null): Valeur | null {
  if (v.unite || !estLongueur(nom) || uniteColonne.trim().toLowerCase() !== 'cm' || nombre === null || nombre < SEUIL_MM_SANS_UNITE) return null;
  return { ...v, valeur: arrondi(nombre / 10), unite: 'cm' };
}
