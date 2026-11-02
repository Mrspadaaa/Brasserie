// D371 : « SI je crée un houblon Idaho7 il le trouve pas directement ». La liaison au stock lit « Idaho7 » comme « Idaho 7 ».
import { describe, expect, it } from 'vitest';
import { memeProduit } from '../../../../src/ui/depense/etat';

const idaho: any = { id: 'h1', ref: 'MP-Idaho', name: 'Houblon Idaho 7 12.7%', unit: 'g', category: 'Houblon', currentStock: 500, alphaPct: 12.7 };
const citra: any = { id: 'h2', ref: 'MP-Citra', name: 'Houblon Citra 13%', unit: 'g', category: 'Houblon', currentStock: 300, alphaPct: 13 };

describe('D371 liaison au stock', () => {
  it('« Idaho 7 » trouve l’article (témoin de la base)', () => {
    expect(memeProduit('Idaho 7', 'g', [idaho, citra])?.ref).toBe('MP-Idaho');
  });
  it('« Idaho7 », collé, trouve le même article', () => {
    expect(memeProduit('Idaho7', 'g', [idaho, citra])?.ref).toBe('MP-Idaho');
    expect(memeProduit('Houblon Idaho7', 'g', [idaho, citra])?.ref).toBe('MP-Idaho');
  });
});

import { uniteHorsArticle } from '../../../../src/ui/depense/calculPlateau';
describe('D371 unité face à l’article relié', () => {
  it('« pièce » face à un houblon compté en g : hors article ; g ou Kg : non ; unité illisible : rien à dire', () => {
    expect(uniteHorsArticle({ description: 'Idaho 7', quantity: 7, unit: 'pièce' }, idaho)).toBe(true);
    expect(uniteHorsArticle({ description: 'Idaho 7', quantity: 100, unit: 'g' }, idaho)).toBe(false);
    expect(uniteHorsArticle({ description: 'Idaho 7', quantity: 1, unit: 'kg' }, idaho)).toBe(false);
    expect(uniteHorsArticle({ description: 'Idaho 7', unit: '' }, idaho)).toBe(false);
  });
  it('la règle d’appariement refuse « pièce » face au g (d’où le repli sur le nom seul à « Suivre au stock »)', () => {
    expect(memeProduit('Idaho7', 'pièce', [idaho, citra], 7)).toBeUndefined();
    expect(memeProduit('Idaho7', '', [idaho, citra])?.ref).toBe('MP-Idaho');
  });
});
