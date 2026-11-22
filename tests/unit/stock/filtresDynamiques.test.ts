import { describe, expect, it } from 'vitest';
import { pucesVisibles, refsBrassin, refsRecents } from '../../../src/domain/stock/filtresDynamiques';

const c = (o: Partial<{ manque: number; manquePlus: number; bas: number; epuise: number; compter: number; ddm: number }> = {}) => ({ manque: 0, manquePlus: 0, bas: 0, epuise: 0, compter: 0, ddm: 0, ...o });
const vide = { recents: new Set<string>(), brassin: new Set<string>() };

describe('filtres dynamiques (D420)', () => {
  it('ne montre que n > 0, dans l\'ordre de pertinence', () => {
    const p = pucesVisibles(c({ bas: 3, manque: 6, epuise: 17, compter: 1 }), vide, null, 6);
    expect(p.map((x) => x.id)).toEqual(['manque', 'epuise', 'bas', 'compter']);
  });
  it('manque compte aussi ses « au moins »', () => {
    expect(pucesVisibles(c({ manquePlus: 2 }), vide, null, 4)[0]).toMatchObject({ id: 'manque', n: 2 });
  });
  it('coupe à max mais garde le filtre actif, même à 0', () => {
    const p = pucesVisibles(c({ manque: 1, epuise: 1, ddm: 1, bas: 1, compter: 1 }), vide, 'recents', 4);
    expect(p).toHaveLength(4);
    expect(p.at(-1)!.id).toBe('recents');
    expect(p.find((x) => x.id === 'recents')!.n).toBe(0);
  });
  it('récents : un mouvement de moins de 14 jours', () => {
    const r = refsRecents([{ itemRef: 'a', date: '2026-11-10T08:00:00Z' }, { itemRef: 'b', date: '2026-10-01' }, { itemRef: 'c' }, { stockItemRef: 'd', createdAt: '2026-11-08' }], '2026-11-22');
    expect([...r].sort()).toEqual(['a', 'd']);
  });
  it('brassin : les articles qu\'un brassin planifié attend', () => {
    const r = refsBrassin([{ item: { ref: 'h1' }, sources: [{ genre: 'brassin' }] }, { item: { ref: 'm1' }, sources: [{ genre: 'recette' }] }]);
    expect([...r]).toEqual(['h1']);
  });
});
