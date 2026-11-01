// Contre-vérification l2, détail C : une seule source pour la règle « total absent » — pointsDesIssues appelle totalAbsentPoint.
import { describe, expect, it, vi } from 'vitest';
vi.mock('../../../../functions/src/invoiceControls', async importOriginal => {
  const original = await importOriginal<typeof import('../../../../functions/src/invoiceControls')>();
  return { ...original, totalAbsentPoint: (amountTTC: number | null) => (amountTTC !== null && amountTTC > 0 ? null : original.makePoint('total-absent', 'ecart', 'amountTTC', null, { regle: 'source unique', message: 'SOURCE UNIQUE', unite: 'texte', enjeu: 'argent' })) };
});
import { pointsDesIssues } from '../../../../functions/src/invoiceVisionReview';
import { lire, propre } from './aide';

describe('C — pointsDesIssues passe par totalAbsentPoint', () => {
  it('le point total-absent vient de la fonction partagée, pas d\'une copie de la condition', () => {
    const points = pointsDesIssues(lire(propre({ amountTTC: null })));
    expect(points.find(p => p.code === 'total-absent')?.message).toBe('SOURCE UNIQUE');
  });
  it('un total présent ne pose aucun point', () => {
    expect(pointsDesIssues(lire(propre())).some(p => p.code === 'total-absent')).toBe(false);
  });
});
