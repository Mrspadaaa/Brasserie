import { beforeEach, describe, expect, it, vi } from 'vitest';
/**
 * Voie f4-enrichir, témoin E4 (PLAN § 8.1) : « Compléter avec l'IA » d'une recette (`learnIngredient`) face à un article f4 du même produit, de nom
 * différent. Aujourd'hui un `FICHE-…` de plus est écrit (ROUGE) ; attendu : les valeurs vont à l'article f4 (`meme`), aucun `FICHE-…`. Vert après le
 * branchement de `storage.ts` (`ficheRetenueDe`, RESULTAT.md). N'importe aucun module neuf de f4 : la clé est écrite telle que f4 la pose.
 * Firestore simulé : aucune donnée réelle.
 */
const etat = vi.hoisted(() => ({ items: [] as any[], puts: [] as any[] }));
vi.mock('../../../../src/services/firestoreRepo', async orig => {
  const m = await orig<any>();
  return { ...m, FirestoreRepo: { ...m.FirestoreRepo, all: (nom: string) => (nom === 'stockItems' ? etat.items : []), put: (...args: any[]) => { etat.puts.push(args); } } };
});
import { StorageService } from '../../../../src/services/storage';

beforeEach(() => {
  etat.puts = [];
  // L'article qu'f4 a créé et lié : nom de la facture, clé de fiche du produit (famille|fabricant|mots).
  etat.items = [{ id: 'MP-e4-0', ref: 'MP-e4-0', name: 'Carahell Weyermann 1 kg', category: 'Malt', unit: 'kg', currentStock: 1, minStock: 0, reorder: false, kind: 'rawMaterials',
    fiche: { id: 'cle:malt|weyermann|carahell', approchee: false, par: 'en-ligne', cle: 'malt|weyermann|carahell' } }];
});

// D286, D290 : branchés le 02.11 (accord du schéma) ; les témoins, en `it.fails` jusque-là, sont redevenus `it`.
describe('E4 : `learnIngredient` et la fiche retenue d’un article f4', () => {
  it('« Weyermann Carahell » (recette) : les valeurs vont à l’article f4, aucun FICHE-… (rouge jusqu’au branchement de storage.ts)', () => {
    StorageService.learnIngredient('Weyermann Carahell', { category: 'Malt', colorEbc: 20 } as any);
    const refs = etat.puts.filter(p => p[0] === 'stockItems').map(p => p[1]);
    expect(refs.some((r: string) => r.startsWith('FICHE-'))).toBe(false);
    expect(refs).toContain('MP-e4-0');
  });
  it('garde : un nom exact passe comme avant (aucun FICHE-…)', () => {
    StorageService.learnIngredient('Carahell Weyermann 1 kg', { category: 'Malt', colorEbc: 20 } as any);
    expect(etat.puts.filter(p => p[0] === 'stockItems').map(p => p[1])).toEqual(['MP-e4-0']);
  });
});
