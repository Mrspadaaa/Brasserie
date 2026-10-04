import pack from '../data/brewingStylesBootstrap.json';
import { assertBrewingStyleGuide, type BrewingStyleGuide, type BrewingStyle, type BrewingStyleRef } from '../../functions/src/brewingStyleSchema';
import type { HopKnowledge } from '../../functions/src/hopPredictionSchema';

export type ListedStyle = BrewingStyle & { ref: BrewingStyleRef; edition: string; historical?: boolean; selectable?: boolean };
export const foldStyle = (s: string) => s.normalize('NFKD').replace(/\p{M}/gu, '').replace(/ß/g, 'ss').toLocaleLowerCase('fr').replace(/[’'-]/g,' ').replace(/\s+/g,' ').trim();
function allBrewingStyleGuides(saved: HopKnowledge[] = []): BrewingStyleGuide[] {
  return [...new Map([...pack, ...saved].map(r => [r.id, r])).values()].filter((r): r is BrewingStyleGuide => {
    if (r.kind !== 'styleGuide') return false;
    try { assertBrewingStyleGuide(r); return true; } catch { return false; }
  });
}
/** Guides offered for a new selection; disabled sources remain readable by exact style ref. */
export function brewingStyleGuides(saved: HopKnowledge[] = []): BrewingStyleGuide[] {
  return allBrewingStyleGuides(saved).filter(guide => guide.enabled);
}
export function brewingStyles(saved: HopKnowledge[] = []): ListedStyle[] {
  return allBrewingStyleGuides(saved).flatMap(g => [
    ...g.styles.map(s => ({ ...s, edition: g.edition, historical: !g.enabled, selectable: g.enabled, ref: { guideId: g.id, version: g.version, styleId: s.id } })),
    ...(g.history ?? []).flatMap(revision => revision.styles.map(s => ({ ...s, edition: revision.edition, historical: true, selectable: false,
      ref: { guideId: g.id, version: revision.version, styleId: s.id } })))
  ]);
}
let defaults: ListedStyle[] | undefined;
const defaultStyles = () => defaults ??= brewingStyles();
/** Exact documented aliases only. Ambiguity is returned to the caller, never guessed. */
export function matchBrewingStyles(name: string, styles: ListedStyle[] = defaultStyles()): ListedStyle[] {
  const term = foldStyle(name);
  if (!term) return [];
  return styles.filter(s => s.selectable !== false && !s.historical && [s.name, ...s.aliases].some(n => foldStyle(n) === term));
}
export function resolveBrewingStyle(name: string, ref?: BrewingStyleRef, styles: ListedStyle[] = defaultStyles()): ListedStyle | undefined {
  if (ref) return styles.find(s => s.ref.guideId === ref.guideId && s.ref.styleId === ref.styleId && s.ref.version === ref.version);
  const matches = matchBrewingStyles(name, styles);
  return matches.length === 1 ? matches[0] : undefined;
}
