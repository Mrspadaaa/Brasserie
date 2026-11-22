// D372 : « Mais cette vue a été oublié ?? », « Et ça doit être générique […] pas juste sur ce cas précis ??? ».
// Toute ligne reliée dont l'unité ne s'ajoute pas à son article a son unité à remplir (rouge), comme une unité illisible : la rangée, « à remplir »
// et le plateau (face à face Facture | Stock, cinq cases, l'unité du stock proposée) suivent, quels que soient le produit et la paire d'unités.
import { describe, expect, it } from 'vitest';
import { confianceLigne, type ContexteConfiance, type LigneConfiance } from '../../../../src/ui/depense/confiance';

const articles: any[] = [
  { id: 'a1', ref: 'MP-Idaho', name: 'Houblon Idaho 7 12.7%', unit: 'g', category: 'Houblon', currentStock: 500 },
  { id: 'a2', ref: 'MP-Pils', name: 'Malt Pilsner', unit: 'Kg', category: 'Malt', currentStock: 25 },
  { id: 'a3', ref: 'MP-Acide', name: 'Acide lactique 80%', unit: 'L', category: 'Additif', currentStock: 2 },
  { id: 'a4', ref: 'MP-Flacon', name: 'Bouteille 33 cl', unit: 'pièce', category: 'Emballage', currentStock: 240 },
];
const ligne = (ref: string, description: string, unit: string, quantity = 2, kind = 'ingredient'): LigneConfiance =>
  ({ id: 'l1', description, kind, quantity, unit, unitPrice: 4, amount: quantity * 4, stockAction: 'existing', stockRef: ref });
const unite = (l: LigneConfiance) => { const c: ContexteConfiance = { lignes: [l], articles }; return confianceLigne(l, c).unite; };

describe('D372 — une unité qui ne s’ajoute pas à l’article relié est à remplir, pour tout produit', () => {
  it.each([
    ['MP-Idaho', 'Idaho 7', 'pièce', 'g'],
    ['MP-Pils', 'Pilsner', 'L', 'Kg'],
    ['MP-Acide', 'Acide lactique', 'g', 'L'],
    ['MP-Flacon', 'Bouteille 33 cl', 'Kg', 'pièce'],
  ])('%s : « %s » en %s face à l’article compté en %s → rouge, la raison le dit', (ref, desc, u, stock) => {
    const v = unite(ligne(ref, desc, u, 2, ref === 'MP-Flacon' ? 'packaging' : 'ingredient'));
    expect(v.niveau).toBe('inconnu');
    expect(v.raison).toContain('ne s\'ajoute pas');
    expect(v.raison.toLowerCase()).toContain(`compté en ${stock.toLowerCase()}`);
  });
  it.each([
    ['MP-Idaho', 'Idaho 7', 'g'], ['MP-Idaho', 'Idaho 7', 'Kg'], ['MP-Pils', 'Pilsner', 'g'], ['MP-Acide', 'Acide lactique', 'ml'], ['MP-Flacon', 'Bouteille 33 cl', 'pièce'],
  ])('%s : « %s » en %s s’ajoute (ou se convertit) : pas de rouge', (ref, desc, u) => {
    expect(unite(ligne(ref, desc, u, 2, ref === 'MP-Flacon' ? 'packaging' : 'ingredient')).niveau).not.toBe('inconnu');
  });
  it('une ligne hors stock (non reliée) en pièce n’est pas touchée', () => {
    const l = { ...ligne('MP-Idaho', 'Idaho 7', 'pièce'), stockAction: 'none' as const, stockRef: undefined };
    expect(unite(l).niveau).not.toBe('inconnu');
  });
});
