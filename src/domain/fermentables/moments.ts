// La table unique « famille × moment permis » des fermentescibles (audit métier du 08.11, AM 1 et 2).
//
// Cas réel : Pilsner Malz posé à « fermentation » J+4 et Caramünch à J+3, comptés dans l'OG (1,290) et l'EBC, réservés au fermenteur,
// sans une alerte. « Donc le fait que on puisse mettre du malt après la fermentation, ça a pas posé de problème ???? »
//
// Règle du métier :
//  - Un GRAIN (malt de base, caramel, torréfié, flocons, céréale crue) ne s'emploie qu'à l'empâtage : son amidon n'est converti en sucre que
//    par les enzymes de la maische, à 62–72 °C. Bouilli, il donne des tanins et de l'amidon non converti ; à froid au fermenteur, ni extrait ni
//    couleur, seulement un risque d'infection (Palmer, How to Brew, ch. 12 et 14 ; Briggs, Brewing Science and Practice, ch. 4).
//    Le modèle n'a pas de moment « trempage » : un grain n'a donc qu'un moment, et jamais de jour J+.
//  - Sucre, sucre de lait, fruit, extrait : à l'ébullition ou en fermentation (le modèle existant ; jour J+ en fermentation seulement).
//    Le premier moment de chaque liste est celui d'une ligne neuve (les familles de l'assistant : sucre, lactose, extrait à l'ébullition,
//    fruit en fermentation).
//
// Lecteurs : la pastille de moment (`src/ui/fermentescibles`), la validation (`recipeValidation.ts`), l'OG et la projection
// (`yeastProjection.ts`, `brewingMath.extractPoints`), l'EBC et l'eau (`BrewWizard.tsx`, `beerColor.ts`), le stock (`brewStockConsumption.ts`),
// l'import (`recipeImport.ts`).
import type { Fermentable, FermentableKind, FermentableUse } from '../../types';

export const MOMENTS_PERMIS: Readonly<Record<FermentableKind, readonly FermentableUse[]>> = {
  grain: ['empatage'],
  sucre: ['ebullition', 'fermentation'],
  lactose: ['ebullition', 'fermentation'],
  extrait: ['ebullition', 'fermentation'],
  fruit: ['fermentation', 'ebullition'],
};

type Ligne = Pick<Fermentable, 'kind' | 'use'> | { kind?: FermentableKind; use?: FermentableUse };

// Une ligne ancienne sans famille est un grain ; sans moment, un empâtage (`normalizeRecipe`, `recipeSnapshot`).
const familleDe = (f: Ligne): FermentableKind => f.kind ?? 'grain';
const momentDe = (f: Ligne): FermentableUse => f.use ?? 'empatage';

/** Les moments qu'une famille accepte (une famille inconnue : ceux du grain, le cas le plus strict). */
export function momentsPermis(kind: FermentableKind | undefined): readonly FermentableUse[] {
  return MOMENTS_PERMIS[kind ?? 'grain'] ?? MOMENTS_PERMIS.grain;
}

/** Le moment d'une ligne neuve de cette famille. */
export const momentParDefaut = (kind: FermentableKind | undefined): FermentableUse => momentsPermis(kind)[0];

export const momentPermis = (f: Ligne): boolean => momentsPermis(familleDe(f)).includes(momentDe(f));

/** Un toucher sur la pastille : le moment permis suivant. Un moment interdit (donnée ancienne) revient au premier permis. */
export function momentSuivant(f: Ligne): FermentableUse {
  const permis = momentsPermis(familleDe(f));
  const i = permis.indexOf(momentDe(f));
  return i < 0 ? permis[0] : permis[(i + 1) % permis.length];
}

/** La pastille fait-elle quelque chose ? (Un grain bien placé n'a qu'un moment : rien à faire tourner.) */
export const momentTourne = (f: Ligne): boolean => momentSuivant(f) !== momentDe(f);

/**
 * Un grain hors de l'empâtage : il ne donne ni extrait ni couleur. Il compte 0 dans l'OG, l'EBC, l'eau et la part du grain, et l'écran le dit.
 * (Un sucre à l'empâtage, donnée ancienne, est signalé par la validation mais compte toujours : il se dissout dans le moût.)
 */
export const grainHorsEmpatage = (f: Ligne): boolean => familleDe(f) === 'grain' && momentDe(f) !== 'empatage';

/** Le grain qui passe vraiment par la maische : celui de la facture, de la couleur et de l'eau. */
export const grainEmpate = (f: Ligne): boolean => familleDe(f) === 'grain' && momentDe(f) === 'empatage';

const MOT: Record<FermentableUse, string> = { empatage: 'l’empâtage', ebullition: 'l’ébullition', fermentation: 'la fermentation' };

/** Le message d'une ligne mal placée, `null` si le moment est permis. */
export function messageMoment(f: Pick<Fermentable, 'name' | 'kind' | 'use'>): string | null {
  if (momentPermis(f)) return null;
  const nom = f.name?.trim() || 'Cet ingrédient';
  if (grainHorsEmpatage(f))
    return `${nom} : un grain s’empâte. À ${MOT[momentDe(f)]}, il ne donne ni sucre ni couleur : compté 0 dans l’OG et l’EBC.`;
  return `${nom} : se verse à ${momentsPermis(familleDe(f)).map((u) => MOT[u]).join(' ou à ')}, pas à ${MOT[momentDe(f)]}.`;
}
