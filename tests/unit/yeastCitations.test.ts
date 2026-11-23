import { describe, expect, it } from 'vitest';
import { yeastCitations } from '../../src/ui/YeastRecipeDossier';

describe('Citations documentaires attachées à leurs faits', () => {
  it('regroupe le même document malgré un titre ou une casse de domaine différents, et garde les dates', () => {
    const a = { source: 'Notice fabricant', sourceUrl: 'https://docs.example.invalid/Yeast-A.pdf?edition=A', retrievedAt: '2026-09-26T10:00:00Z' };
    const b = { source: 'Titre de recherche différent', sourceUrl: 'https://DOCS.EXAMPLE.INVALID/Yeast-A.pdf?edition=A', retrievedAt: '2026-09-27T12:00:00Z' };
    const citations = yeastCitations([a, b]);
    expect(citations.list).toHaveLength(1);
    expect(citations.of(a)).toBe(citations.of(b));
    expect(citations.list[0].dates).toEqual(['26.09.2026', '27.09.2026']);
    expect(citations.list[0].url).toBe(a.sourceUrl);
  });
  it('ne fusionne pas deux documents ou éditions dont le chemin ou la requête diffère en casse', () => {
    const a = { source: 'Notice', sourceUrl: 'https://docs.example.invalid/Yeast-A.pdf?edition=A' };
    const b = { source: 'Notice', sourceUrl: 'https://docs.example.invalid/yeast-a.pdf?edition=A' };
    const c = { source: 'Notice', sourceUrl: 'https://docs.example.invalid/Yeast-A.pdf?edition=a' };
    const citations = yeastCitations([a, b, c]);
    expect(citations.list).toHaveLength(3);
    expect(citations.of(a)?.url).toBe(a.sourceUrl);
    expect(citations.of(b)?.url).toBe(b.sourceUrl);
    expect(citations.of(c)?.url).toBe(c.sourceUrl);
  });
});
