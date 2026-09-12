import pack from '../data/brewingStylesBootstrap.json';
import { assertBrewingStyleGuide, type BrewingStyleGuide, type BrewingStyle, type BrewingStyleRef } from '../../functions/src/brewingStyleSchema';
import type { HopKnowledge } from '../../functions/src/hopPredictionSchema';

export type ListedStyle = BrewingStyle & { ref: BrewingStyleRef; edition: string };
export const foldStyle = (s: string) => s.normalize('NFKD').replace(/\p{M}/gu, '').replace(/ß/g, 'ss').toLocaleLowerCase('fr').replace(/[’'-]/g,' ').replace(/\s+/g,' ').trim();
export function brewingStyleGuides(saved: HopKnowledge[] = []): BrewingStyleGuide[] {
  return [...new Map([...pack, ...saved].map(r => [r.id, r])).values()].filter((r): r is BrewingStyleGuide => {
    if (r.kind !== 'styleGuide') return false;
    try { assertBrewingStyleGuide(r); return r.enabled; } catch { return false; }
  });
}
export function brewingStyles(saved: HopKnowledge[] = []): ListedStyle[] {
  return brewingStyleGuides(saved).flatMap(g => g.styles.map(s => ({ ...s, edition:g.edition, ref:{guideId:g.id,version:g.version,styleId:s.id} })));
}
let defaults: ListedStyle[] | undefined;
const defaultStyles = () => defaults ??= brewingStyles();
/** Exact documented aliases only. Ambiguity is returned to the caller, never guessed. */
export function matchBrewingStyles(name: string, styles: ListedStyle[] = defaultStyles()): ListedStyle[] {
  const term = foldStyle(name);
  if (!term) return [];
  return styles.filter(s => [s.name, ...s.aliases].some(n => foldStyle(n) === term));
}
export function resolveBrewingStyle(name: string, ref?: BrewingStyleRef, styles: ListedStyle[] = defaultStyles()): ListedStyle | undefined {
  if (ref) return styles.find(s => s.ref.guideId === ref.guideId && s.ref.styleId === ref.styleId && s.ref.version === ref.version);
  const matches = matchBrewingStyles(name, styles);
  return matches.length === 1 ? matches[0] : undefined;
}
