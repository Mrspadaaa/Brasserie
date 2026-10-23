// Les 12 familles d'arômes : couleurs (une seule table, #142 : fils17-standard/jetons-familles.json, importée),
// noms courts du brasseur et ordres d'affichage. Les pictos sont dans Pictos.tsx.
import jetons from '../../../../../work/refonte-frontend/v4/ecran-1/fils17-standard/jetons-familles.json';
import { FAMILIES, type FamilyId } from '../../../src/engine';

export interface JetonFamille { base: string; texte: string; fond: string }
/** Couleur de la famille : `base` pour les aplats et pictos, `texte` pour un chiffre (≥ 4,5:1 sur blanc), `fond` pâle. */
export const COULEURS = jetons as unknown as Record<FamilyId, JetonFamille>;

/** Noms courts (carte fils22) ; FAMILY_NAMES du moteur garde les noms longs. */
export const COURT: Record<FamilyId, string> = {
  citrus: 'Agrumes', tropical: 'Tropicaux', stoneFruit: 'Noyau', pomeFruit: 'Pépins', berries: 'Baies', melon: 'Melon',
  floral: 'Floral', herbal: 'Herbacé', resin: 'Résineux', spice: 'Épicé', green: 'Végétal', earthy: 'Terreux',
};
/** Roue de la base (lot 16, r2) : agrumes en haut, pour les radars. */
export const ROUE: FamilyId[] = ['citrus', 'tropical', 'melon', 'stoneFruit', 'pomeFruit', 'berries', 'floral', 'green', 'herbal', 'spice', 'earthy', 'resin'];
export { FAMILIES };
