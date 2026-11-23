import { describe, expect, it } from 'vitest';
import { volumeEnCuveLibelle } from '../../src/ui/BatchDetailSheet';

/** CT4-B-2 (critique tour 4, bloquant) : « LOT-041 · cuve · 20 L » alors que la liste dit 29 L : 20 L est le volume visé, 29 L le brassé. */
describe('CT4-B-2 : le volume sous le mot « cuve »', () => {
  it('le volume brassé quand il existe (le même que la liste)', () => {
    expect(volumeEnCuveLibelle({ volumeL: 20, volumeBrewedL: 29 })).toBe('29 L');
  });
  it('sans volume brassé, le volume visé se dit visé', () => {
    expect(volumeEnCuveLibelle({ volumeL: 20 })).toBe('visé 20 L');
    expect(volumeEnCuveLibelle({ volumeL: 20, volumeBrewedL: null })).toBe('visé 20 L');
  });
  it('un volume brassé à 0 ou illisible n’est pas un volume : le visé', () => {
    expect(volumeEnCuveLibelle({ volumeL: 20, volumeBrewedL: 0 })).toBe('visé 20 L');
    expect(volumeEnCuveLibelle({ volumeL: 20, volumeBrewedL: Number.NaN })).toBe('visé 20 L');
  });
  it('ni brassé ni visé : rien de dit (l’inconnu n’est jamais 0)', () => {
    expect(volumeEnCuveLibelle({ volumeL: Number.NaN })).toBeNull();
  });
});
