import { describe, expect, it } from 'vitest';
import { lignesDeLecture } from '../../src/ui/depense/finale';
import { lecturesLenteur } from '../../src/ui/depense/apercuDev';

const lecture = (category: string, noms: string[]) => {
  const { final } = lecturesLenteur('perdue');
  const modele = final.items[0];
  return { ...final, vendor: 'Fournisseur fictif', category, items: noms.map((name, i) => ({ ...modele, id: `line-${i + 1}`, name, kind: 'equipment', stockCategory: undefined, quantity: 1, unit: 'pièce', price: 20 + i, amountTTC: 20 + i })) } as any;
};

/** ST-T34 : les lignes « Matériel de brassage » (cuve, siphon, tuyaux) sont proposées dans Stocks › Matériel ; la rénovation, non. */
describe('matériel de brassage proposé à Stocks › Matériel (ST-T34)', () => {
  it('une cuve, un siphon, un tuyau : fiche matériel proposée (présélectionnée), aucun article de stock', () => {
    const { lines } = lignesDeLecture(lecture('materiel', ['Cuve de fermentation inox 30 L', 'Siphon automatique', 'Tuyau silicone 10 m']), [], 'sub-test');
    expect(lines).toHaveLength(3);
    for (const l of lines) { expect(l.kind).toBe('equipment'); expect(l.equipmentAction).toBe('new'); expect(l.stockAction).toBe('none'); }
  });
  it('un ticket de bricolage (peinture, chevilles…) : aucune fiche matériel proposée', () => {
    const { lines } = lignesDeLecture(lecture('materiel', ['Peinture murale blanche 5 L', 'Cheville universelle 8 mm', 'Carrelage mural 30x60', 'Brosse radiateur 35 mm', 'Gants de travail', 'Ruban de masquage']), [], 'sub-test');
    expect(lines.every((l) => l.equipmentAction === 'none')).toBe(true);
  });
});
