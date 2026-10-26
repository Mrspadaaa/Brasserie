// Voie g2d : un apport minoritaire (une famille citée par une fiche sur neuf) ne doit pas peser comme un apport établi.
// Trois options de Suggérer, mesurées ; seule 'c' est active par défaut, et seulement au dry hop (D99, voir plus bas) :
//  - 'c' : rang seul. Le débordement de style ne compte dans le rang que pour une famille MARQUÉE (la moitié des fiches au moins, D90) ;
//          les barres affichées (effets) ne changent pas.
//  - 'm' : effet si marquée. Une famille citée par moins de la moitié des fiches n'apporte aucun effet établi ; elle reste visible comme citée
//          (`FamilyEffect.minoritaire`). Les barres changent.
//  - 'w' : effet pondéré. L'effet d'une famille est multiplié par la part des fiches qui la citent. Les barres changent.
// D99 (26.10) : l'option 'c' est ACTIVE PAR DÉFAUT aux moments du dry hop (dry hop actif et après), où g2d l'a mesurée (Citra 54e → 2e, Mosaic 134e → 20e, Nelson Sauvin 107e → 31e,
// 0 barre changée). Option absente = 'c' sur les voies dont tous les ajouts sont au dry hop ; 'aucun' = le comportement d'avant partout (à l'octet) ; 'c' explicite = tous les moments (mesure g2d).
// Aux autres moments (10′, whirlpool, 60′, levure), g2d ne recommande rien : c y est neutre à 10′ et 60′ (débordement nul à 10–20 g) mais déplace des rangs (Nelson Sauvin 130 → 148 à 10′) :
// ces voies gardent donc leur débordement entier (D99 : pas d'extension au-delà de la recommandation).
import { describeFamilies } from './hops';
import type { FamilyId } from './families';
import type { MomentId } from './recipe';

export type ApportMinoritaire = 'aucun' | 'c' | 'm' | 'w';
export const APPORTS_MINORITAIRES: readonly ApportMinoritaire[] = ['aucun', 'c', 'm', 'w'];

/** Part des fiches lues d'un houblon qui citent la famille (describeFamilies : sources / of), 0 à 1. Sans fiche lue : 0, jamais une part inventée. */
export function partDesFiches(varietyId: string, f: FamilyId): number {
  const d = describeFamilies(varietyId)[f];
  return d.of > 0 ? Math.min(1, d.sources / d.of) : 0;
}

/** Moments où l'option 'c' est active par défaut (D99) : le dry hop actif et après fermentation. */
export const MOMENTS_APPORT_C_DEFAUT: readonly MomentId[] = ['dryActive', 'dryPost'];
