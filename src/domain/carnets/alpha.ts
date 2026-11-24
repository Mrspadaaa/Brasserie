/**
 * C59-8 / R45 (c61-fix, 24.11) : sur un houblon, l'acide alpha s'appelle « Alpha », partout. Une page le nomme de trois façons : sous le NOM DE LA VARIÉTÉ
 * (« Citra : 13,6 % » pour « Citra 13.6% »), « Taux d'acides alpha », « Alpha-Säure » ; sa valeur est gardée en nombre + « % », en chaîne + « % », ou toute
 * dans la chaîne (« 13,6 % »). Une seule fonction dit si une caractéristique est l'alpha : fiche, Comparer, carte, tableau et feuille s'en servent.
 * Problème d'école : rapprochement de noms (vocabulaire fermé, comme lienFusion.ts) ; aucune distance d'édition.
 */
import { cleDeNom } from '../../../functions/src/lienFusion';

/** « alpha », « acides alpha », « taux d'acides alpha », « alpha acids », « Alpha-Säure », « α-acides » : le nom d'une ligne qui dit l'acide alpha. */
const NOM_ALPHA = /^(?:taux d['’ ]?\s?|teneur en |gehalt an |anteil )?(?:(?:les )?acides? alpha|alpha[- ]?acids?|alpha[- ]?saeure[n]?|alpha[- ]?saure[n]?|α[- ]?acides?|alpha|alphasaure|alphaprozent)$/;
export const estNomAlpha = (nom: string): boolean => NOM_ALPHA.test(cleDeNom(nom).replace(/[:.]$/, '').replace(/\s+/g, ' ').replace(/ ?-+ ?/g, '-'));

/** Un pourcentage écrit, seul ou dans une plage : « 13,6 % », « 10 % - 15 % », « 10-15 % ». */
const POURCENT = /^\s*\d+(?:[.,]\d+)?\s*%?\s*(?:(?:-|–|à)\s*\d+(?:[.,]\d+)?\s*%?)?\s*$/;
const ECRIT_EN_POURCENT = /%/;

interface ValeurAlpha { valeur: number | string | boolean; unite?: string }

/** Une valeur qui est un pourcentage (« 13,6 » + « % », « 13,6 % » dans la chaîne, « 10 % - 15 % »). */
export function estPourcentage(x: ValeurAlpha): boolean {
  if (typeof x.valeur === 'boolean') return false;
  const t = `${x.valeur}${x.unite && !ECRIT_EN_POURCENT.test(String(x.valeur)) ? ` ${x.unite}` : ''}`;
  return (x.unite === '%' || ECRIT_EN_POURCENT.test(String(x.valeur))) && POURCENT.test(t.replace(/\s+%/g, '%').replace(/%\s*(?=[-–à])/g, '%'));
}

/** Le nombre d'alpha écrit dans le nom de l'article (« Citra 13.6% » → 13,6) ; `null` si le nom n'en porte pas. */
function alphaDuNom(nomArticle: string): string | null {
  const m = /(?<![\d.,])(\d{1,2}(?:[.,]\d{1,2})?)\s?%/.exec(nomArticle);
  return m ? m[1].replace(',', '.') : null;
}

/**
 * Le nom d'une caractéristique d'un houblon, quand c'est l'alpha : « Alpha » ; sinon `nom` tel quel. Trois cas : (1) le nom dit l'alpha (« Taux d'acides alpha ») ;
 * (2) le nom de la ligne ouvre le nom de l'article (« Citra » dans « Citra 13.6% ») et sa valeur est le pourcentage écrit dans ce nom (C59-8, R38) ; aucune autre
 * ligne n'est touchée (3).
 */
export function nomAlpha(nomArticle: string | undefined, nom: string, x: ValeurAlpha): string {
  if (estNomAlpha(nom)) return 'Alpha';
  if (!nomArticle || !estPourcentage(x)) return nom;
  const n = cleDeNom(nomArticle).replace(/[^a-z0-9% ]+/g, ' ').replace(/\s+/g, ' ');
  const c = cleDeNom(nom).replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (c.length < 3 || !(n === c || n.startsWith(`${c} `))) return nom;
  const ecrit = alphaDuNom(nomArticle);
  const num = String(x.valeur).replace(/%/g, '').replace(',', '.').trim();
  return ecrit !== null && /^\d+(?:\.\d+)?$/.test(num) && Number(num) >= 1 && Number(num) <= 30 && Number(num) === Number(ecrit) ? 'Alpha' : nom;
}

/** Cet article est-il un houblon (une matière qu'on pèse) : une ligne qui dit l'alpha, nommée ou lue sous le nom de la variété. */
export function ditAlpha(nomArticle: string | undefined, valeurs: Record<string, ValeurAlpha> | undefined): boolean {
  return Object.entries(valeurs ?? {}).some(([nom, x]) => nomAlpha(nomArticle, nom, x) === 'Alpha');
}
