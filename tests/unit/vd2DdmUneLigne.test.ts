// Voie vd2, verdict 5cdcd12e n° 7 : une levure périmée ne dit pas son fait deux fois (« DDM dépassée » puis « Périmé depuis 44 j ») : une seule ligne, « périmée depuis 44 j ».
import { describe, expect, it } from 'vitest';
import type { StockItem } from '../../src/types';
import { infoLigne } from '../../src/domain/stock/liste';
import { etatDit } from '../../src/domain/stock/ligne';

const J = '2026-11-14';
const levure = (expiresOn: string | undefined, o: Partial<StockItem> = {}): StockItem =>
  ({ id: 'l', ref: 'l', name: 'SafAle S-04', category: 'Levure', unit: 'sachet', currentStock: 1, minStock: 1, reorder: false, yeastLot: expiresOn ? { expiresOn } : undefined, ...o } as StockItem);
const dit = (i: StockItem) => etatDit(i, infoLigne(i, new Map(), J), undefined, J);

describe('la ligne d\'une levure dont la DDM compte : une seule phrase, avec les jours', () => {
  it('périmée depuis 44 j (10.2026 vu le 14.11), seuil dit comme avant', () => {
    const d = dit(levure('2026-10-01'));
    expect(d.texte).toBe('périmée depuis 44 j · au seuil');
    expect(d.classe).toBe('ddm');
  });
  it('sans seuil à surveiller : la phrase seule', () => {
    expect(dit(levure('2026-10-01', { currentStock: 4, minStock: 1 })).texte).toBe('périmée depuis 44 j');
  });
  it('proche : « périme dans 12 j », et « périme aujourd\'hui » le jour même', () => {
    expect(dit(levure('2026-11-26', { currentStock: 4 })).texte).toBe('périme dans 12 j');
    expect(dit(levure('2026-11-14', { currentStock: 4 })).texte).toBe('périme aujourd’hui');
  });
  it('aucun mot « DDM dépassée » ni « DDM proche » dans la ligne (le repère « DDM 10.2026 » reste dans sa pastille)', () => {
    expect(dit(levure('2026-10-01')).texte).not.toMatch(/DDM/);
    expect(dit(levure('2026-11-26', { currentStock: 4 })).texte).not.toMatch(/DDM/);
  });
});
