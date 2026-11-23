import { describe, expect, it } from 'vitest';
import { lireCumul, lireCumulVoie, noteDe, parseCellule, tableau, type Mesure } from '../../scripts/banc-t2b-taches';

describe('banc t2b (Gemini simulé, aucun réseau)', () => {
  it('lit une cellule modèle@niveau et refuse « minimal » hors Flash-Lite', () => {
    expect(parseCellule('hydrogen@low')).toEqual({ label: 'hydrogen@low', model: 'gemini-4-hydrogen', level: 'low' });
    expect(parseCellule('lite@minimal').model).toBe('gemini-3.5-flash-lite');
    expect(() => parseCellule('argon@minimal')).toThrow(/minimal/);
    expect(() => parseCellule('argon@xhigh')).toThrow();
    expect(parseCellule('hydrogen@xhigh').level).toBe('xhigh');
    expect(() => parseCellule('gpt@low')).toThrow(/inconnu/);
  });
  it('somme le coût du journal par la colonne « coût CHF », toutes voies, et à part pour la voie t2b', () => {
    const journal = [
      '| date | voie | usage | cellule | cas | tirage | durée | entrée | sortie | coût CHF | état |', '|---|---|---|---|---|---|---|---|---|---|---|',
      '| d | t2b | coa | lite@low | c | 1 | 1 ms | 1 | 1+0 | 0.010000 | STOP |',
      '| d | t2b | coa | lite@low | c | 2 | 1 ms | 1 | 1+0 | 0.020000 | STOP |',
      '| date | doc | coût CHF | cumul |', '|---|---|---|---|', '| d | x | 0,5 | 0,5 |'
    ].join('\n');
    expect(lireCumul(journal)).toBeCloseTo(0.53, 6);
    expect(lireCumulVoie(journal)).toBeCloseTo(0.03, 6);
  });
  it('note : critère critique raté = critique, sans objet exclu, inutilisable compté zéro au tableau', () => {
    expect(noteDe([{ id: 'a', weight: 1, critical: true, value: 0 }, { id: 'b', weight: 3, critical: false, value: 1 }, { id: 'c', weight: 5, critical: false, value: null }]))
      .toEqual({ score: 0.75, critique: true, detail: 'a' });
    const m = (cell: string, ok: boolean, score: number | null): Mesure => ({ cell, cas: 'x', tirage: 1, ok, ms: 2000, entree: 1, sortie: 1, reflexion: 0, chf: 0.01, score, critique: false, detail: '' });
    const table = tableau([m('a', true, 1), m('a', false, null), m('b', true, 0.5)]);
    expect(table).toContain('| a | 50 % (0 critique) | 1/2 |');
    expect(table).toContain('| b | 50 % (0 critique) | 0/1 |');
  });
});
