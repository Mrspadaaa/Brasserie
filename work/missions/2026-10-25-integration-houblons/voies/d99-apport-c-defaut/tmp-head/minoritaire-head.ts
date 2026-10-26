// Voie g2d : un apport minoritaire (une famille citée par une fiche sur neuf) ne doit pas peser comme un apport établi.
// Trois options de Suggérer, mesurées, aucune active par défaut (défaut 'aucun', inchangé à l'octet) :
//  - 'c' : rang seul. Le débordement de style ne compte dans le rang que pour une famille MARQUÉE (la moitié des fiches au moins, D90) ;
//          les barres affichées (effets) ne changent pas.
//  - 'm' : effet si marquée. Une famille citée par moins de la moitié des fiches n'apporte aucun effet établi ; elle reste visible comme citée
//          (`FamilyEffect.minoritaire`). Les barres changent.
//  - 'w' : effet pondéré. L'effet d'une famille est multiplié par la part des fiches qui la citent. Les barres changent.
import { describeFamilies } from 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/src/domain/hopIndex/v4/hops';
import type { FamilyId } from 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/src/domain/hopIndex/v4/families';

export type ApportMinoritaire = 'aucun' | 'c' | 'm' | 'w';
export const APPORTS_MINORITAIRES: readonly ApportMinoritaire[] = ['aucun', 'c', 'm', 'w'];

/** Part des fiches lues d'un houblon qui citent la famille (describeFamilies : sources / of), 0 à 1. Sans fiche lue : 0, jamais une part inventée. */
export function partDesFiches(varietyId: string, f: FamilyId): number {
  const d = describeFamilies(varietyId)[f];
  return d.of > 0 ? Math.min(1, d.sources / d.of) : 0;
}
