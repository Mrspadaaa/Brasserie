// D371 : la recherche « Chercher dans le stock » (Combobox, Fuse) trouve « Idaho7 » tapé collé.
import { describe, expect, it } from 'vitest';
import { createSearch, runSearch } from '../../../../src/services/search';

const options = [{ value: 'MP-Citra', label: 'Houblon Citra 13%' }, { value: 'MP-Idaho', label: 'Houblon Idaho 7 12.7%' }, { value: 'MP-Pils', label: 'Pilsner Malt' }];
describe('D371 recherche au stock', () => {
  it('« Idaho 7 » et « Idaho7 » mettent l’article en tête', () => {
    const fuse = createSearch(options, ['label']);
    expect(runSearch(fuse, 'Idaho 7')[0]?.value).toBe('MP-Idaho');
    expect(runSearch(fuse, 'Idaho7')[0]?.value).toBe('MP-Idaho');
    expect(runSearch(fuse, 'idaho7 ')[0]?.value).toBe('MP-Idaho');
  });
});
