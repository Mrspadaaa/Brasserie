/** User wishes, never analytical measurements or inferred style constraints. */
export interface FermentationIntent {
  version: 1;
  aroma: string;
  fruit: string;
  acidity: string;
}
export function readFermentationIntent(v: unknown): FermentationIntent | undefined {
  const r = v as FermentationIntent;
  return r?.version === 1 && [r.aroma, r.fruit, r.acidity].every(s => typeof s === 'string' && s.length <= 1000)
    ? { version: 1, aroma: r.aroma, fruit: r.fruit, acidity: r.acidity } : undefined;
}
