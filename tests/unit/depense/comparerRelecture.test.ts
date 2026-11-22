import { describe, it, expect } from 'vitest';
import { relectureGardee, MESSAGE_RELECTURE_PAS_MIEUX } from '../../../src/ui/depense/comparerRelecture';

/* Décision du pilote (14.11) : moins de lignes ou statut plus mauvais = on garde la lecture d'avant. Un statut absent est inconnu : il ne joue pas. */
const lecture = (n: number, status?: 'checked' | 'corrected' | 'disputed' | 'unavailable') => ({
  items: Array.from({ length: n }, (_, i) => ({ id: `l${i}` })),
  ...(status ? { review: { status, findings: [] } } : {}),
}) as any;

describe('relectureGardee', () => {
  it('plus de lignes ou autant, statut égal ou meilleur : gardée', () => {
    expect(relectureGardee(lecture(10, 'corrected'), lecture(12, 'checked'))).toBe(true);
    expect(relectureGardee(lecture(10, 'checked'), lecture(10, 'checked'))).toBe(true);
  });
  it('moins de lignes : refusée, même avec un meilleur statut', () => {
    expect(relectureGardee(lecture(29, 'disputed'), lecture(12, 'checked'))).toBe(false);
  });
  it('statut plus mauvais à lignes égales : refusée, à chaque cran', () => {
    expect(relectureGardee(lecture(5, 'checked'), lecture(5, 'corrected'))).toBe(false);
    expect(relectureGardee(lecture(5, 'corrected'), lecture(5, 'disputed'))).toBe(false);
    expect(relectureGardee(lecture(5, 'disputed'), lecture(5, 'unavailable'))).toBe(false);
  });
  it('un statut absent est inconnu : seul le nombre de lignes décide', () => {
    expect(relectureGardee(lecture(5), lecture(5, 'unavailable'))).toBe(true);
    expect(relectureGardee(lecture(5, 'checked'), lecture(5))).toBe(true);
    expect(relectureGardee(lecture(5), lecture(4))).toBe(false);
  });
  it('le message dit la décision', () => {
    expect(MESSAGE_RELECTURE_PAS_MIEUX).toBe('La relecture n’a pas fait mieux : lecture d’avant gardée.');
  });
});
