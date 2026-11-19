import { describe, expect, it } from 'vitest';
import { libellesSources } from '../../src/domain/stock/disponibilite';

// T3-5 (en ligne, 19.11) : « neipa v3 prévu » ×7 (date sur deux), « Jhhh prévu le 05.09.2026 » ×2 dans Courses.
describe('T3-5 · sources de besoin dites une fois', () => {
  it('une recette citée sur plusieurs lignes ne se répète pas ; la mention datée l’emporte', () => {
    const neipa = Array.from({ length: 7 }, (_, i) => ({ genre: 'brassin' as const, nom: 'neipa v3', date: i < 2 ? '2026-11-24' : null }));
    const jhhh = [{ genre: 'brassin' as const, nom: 'Jhhh', date: '2026-09-05' }, { genre: 'brassin' as const, nom: 'Jhhh', date: '2026-09-05' }];
    expect(libellesSources([...neipa, ...jhhh])).toEqual(['neipa v3 prévu le 24.11', 'Jhhh prévu le 05.09']);
  });
  it('deux brassins de la même recette à deux dates restent deux ; genres distincts gardés', () => {
    expect(libellesSources([
      { genre: 'brassin', nom: 'IPA', date: '2026-11-14' }, { genre: 'brassin', nom: 'IPA', date: '2026-12-01' },
      { genre: 'recette', nom: 'IPA', date: null }, { genre: 'recette', nom: 'IPA', date: null },
    ])).toEqual(['IPA prévu le 14.11', 'IPA prévu le 01.12', 'IPA écrite']);
  });
});
