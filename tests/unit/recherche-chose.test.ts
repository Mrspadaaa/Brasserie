import { describe, expect, it } from 'vitest';
import { classer, typeDeId } from '../../src/components/recherche/modele';

describe('B10 : les choses du Calendrier dans la recherche', () => {
  it('un identifiant « cal-… » est une chose du Calendrier', () => {
    expect(typeDeId('cal-plan-P-HOTTE')).toBe('chose');
    expect(typeDeId('cal-fete-E-1')).toBe('chose');
  });
  it('à rang égal, la chose passe après les articles, les brassins, les recettes et les écritures', () => {
    const items = [
      { id: 'cal-plan-P1', label: 'Hotte' },
      { id: 'tx-T1', label: 'Hotte' },
      { id: 'stk-S1', label: 'Hotte' }
    ];
    expect(classer(items, 'hotte').map((i) => i.id)).toEqual(['stk-S1', 'tx-T1', 'cal-plan-P1']);
  });
});
