// Un empâtage a besoin d'un malt de base (AM-8, audit métier du 08.11 : 100 % Caramünch, flocons ou torréfiés acceptés).
//
// Sans enzymes (amylases), l'amidon du grain ne devient pas sucre : un caramel (cuit au four, ses enzymes sont détruites), un torréfié, des flocons ou une
// céréale crue ne se saccharifient pas seuls (Palmer, How to Brew, ch. 14 ; Briggs, Brewing Science and Practice, ch. 4). Seul un malt peu coloré a le pouvoir
// diastasique : la classe « base » de l'app (≤ 20 EBC, `beerColor.ts`, Pilsner à Munich). Les flocons et céréales crues, peu colorés eux aussi, n'en ont pas.
//
// Honnêteté : une couleur inconnue ne dit rien (un grain « ? » n'est ni base ni autre) ; sans malt de base CONNU mais avec un grain à renseigner, on se tait.
import type { Fermentable, MaltIngredient } from '../../types';
import { grainEmpate } from './moments';

/** Flocons, céréales crues ou torréfiées à cru : peu colorés, sans enzymes. */
const SANS_ENZYMES = /flock|flak|flocon|\broh|\bcru\b|\braw\b|\bunmalted|non malt|gérst|gerst(?!enmalz)|\bmais\b|\bmaïs\b|\bcorn\b|\brice\b|\briz\b|\breis\b/i;

export const estMaltDeBase = (f: Pick<Fermentable, 'name' | 'colorEbc'>): boolean =>
  typeof f.colorEbc === 'number' && Number.isFinite(f.colorEbc) && f.colorEbc <= 20 && !SANS_ENZYMES.test(f.name ?? '');

/**
 * Le message d'une maische sans malt de base, `null` si elle en a un, si elle est vide, ou si une couleur à renseigner empêche de conclure.
 * Les extraits sans grain (aucun grain empâté) ne sont pas concernés.
 */
export function messageSansMaltDeBase(fermentables: readonly (Fermentable | MaltIngredient)[] | undefined): string | null {
  const grains = (fermentables ?? []).filter((f) => grainEmpate(f) && f.weightKg > 0);
  if (!grains.length) return null;
  if (grains.some(estMaltDeBase)) return null;
  if (grains.some((f) => f.colorEbc == null)) return null;
  return 'Aucun malt de base dans la maische : les caramels, les torréfiés et les flocons n’ont plus d’enzymes, l’amidon ne se transforme pas en sucre. Ajoute un malt de base (Pilsner, Pale Ale, Munich…).';
}
