/* PI-NOTE-2 (08.11) : `alphaConfirme` n'est pas dans `HopIngredient` (src/types) ; sa survie à l'enregistrement n'était pas vérifiée.
   Le brasseur confirme un α de 30 à 100 % (Confirmer 80 %) ; si le champ se perdait en route, l'IBU redemanderait la confirmation
   à chaque ouverture. On suit le champ sur chaque passage d'une ligne de houblon : écriture (saveRecipeConfirmed, relue du serveur),
   lecture (normalizeRecipe), figeage d'un brassin (captureSnapshot), geste de l'outil v4 sur la dose (versPatch). */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Recipe } from '../../../src/types';
import { fullRecipe } from '../../fixtures/fullRecipe';

const state = vi.hoisted(() => ({ submitted: undefined as Recipe | undefined, commit: vi.fn(), read: vi.fn() }));
vi.mock('../../../src/services/firebase', () => ({ db: {} }));
vi.mock('firebase/firestore', () => ({
  collection: (_: unknown, name: string) => name,
  doc: (_: unknown, name: string, id: string) => ({ name, id }),
  onSnapshot: vi.fn(), writeBatch: () => ({ set: vi.fn(), delete: vi.fn(), commit: () => state.commit() }),
  getDocFromServer: (...args: unknown[]) => state.read(...args), waitForPendingWrites: vi.fn(),
  getDocs: vi.fn(), getDocsFromServer: vi.fn(), deleteField: vi.fn(), increment: vi.fn(), query: vi.fn(), limit: vi.fn(),
}));
vi.mock('../../../src/services/storage', () => ({ StorageService: {
  getRecipes: () => [], addRecipe: (r: Recipe) => { state.submitted = structuredClone(r); FirestoreRepo.put('recipes', r.id, r); }, updateRecipe: vi.fn(),
} }));
import { FirestoreRepo, stripUndefined } from '../../../src/services/firestoreRepo';
import { saveRecipeConfirmed } from '../../../src/services/recipeSave';
import { captureSnapshot, normalizeRecipe } from '../../../src/domain/recipeSnapshot';
import { toHopRecipe, versPatch } from '../../../src/domain/hopIndex/v4/recipeConversion';

const recette = (): Recipe => ({ ...structuredClone(fullRecipe), id: 'REC-ALPHA', name: 'Lotus fort', boilMin: 60,
  hops: [{ name: 'Citra', weightG: 20, alpha: 80, alphaConfirme: 80, stage: 'boil', timeMin: 60 }] as unknown as Recipe['hops'] });
const confirme = (r: { hops?: unknown[] } | undefined) => (r?.hops?.[0] as { alphaConfirme?: number } | undefined)?.alphaConfirme;

beforeEach(() => {
  FirestoreRepo.stopSync(); state.submitted = undefined;
  state.commit.mockReset().mockResolvedValue(undefined);
  state.read.mockReset().mockImplementation(async () => ({ id: 'REC-ALPHA', exists: () => true,
    data: () => stripUndefined(structuredClone(state.submitted!)), metadata: { hasPendingWrites: false, fromCache: false } }));
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('PI-NOTE-2 — alphaConfirme survit', () => {
  it('à l’enregistrement : la recette relue du serveur porte encore 80', async () => {
    const relue = await saveRecipeConfirmed(recette());
    expect(confirme(relue)).toBe(80);
    expect(confirme(state.submitted)).toBe(80);
  });
  it('à la lecture (normalizeRecipe) et au figeage d’un brassin (captureSnapshot)', () => {
    expect(confirme(normalizeRecipe(recette()))).toBe(80);
    expect(confirme(captureSnapshot(recette()))).toBe(80);
  });
  it('quand l’outil v4 ne change que la dose : la ligne revient avec sa confirmation', () => {
    const conv = toHopRecipe(recette() as never);
    const apres = { ...conv.recette, additions: conv.recette.additions.map(a => ({ ...a, grams: 35 })) };
    const { patch } = versPatch(conv, apres);
    expect(patch.hops[0]).toMatchObject({ weightG: 35, alpha: 80, alphaConfirme: 80 });
  });
  it('remplacer le houblon ne reporte pas la confirmation de l’ancien : elle porte sur son α, pas sur celui du nouveau', () => {
    const conv = toHopRecipe(recette() as never);
    const apres = { ...conv.recette, additions: conv.recette.additions.map(a => ({ ...a, hopKey: 'cascade' })) };
    const { patch } = versPatch(conv, apres);
    expect((patch.hops[0] as { alphaConfirme?: number }).alphaConfirme).toBeUndefined();
  });
});
