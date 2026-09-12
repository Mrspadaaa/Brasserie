import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Recipe } from '../../src/types';
import { fullRecipe } from '../fixtures/fullRecipe';
import { newNoloConfig, noloScience } from '../../src/domain/nolo';

const state = vi.hoisted(() => ({
  existing: [] as Recipe[], submitted: undefined as Recipe | undefined,
  add: vi.fn(), update: vi.fn(), commit: vi.fn(), read: vi.fn(), globalWait: vi.fn(),
}));
vi.mock('../../src/services/firebase', () => ({ db: {} }));
vi.mock('firebase/firestore', () => ({
  collection: (_: unknown, name: string) => name,
  doc: (_: unknown, name: string, id: string) => ({ name, id }),
  onSnapshot: vi.fn(), writeBatch: () => ({ set: vi.fn(), delete: vi.fn(), commit: () => state.commit() }),
  getDocFromServer: (...args: unknown[]) => state.read(...args), waitForPendingWrites: () => state.globalWait(),
  getDocs: vi.fn(), getDocsFromServer: vi.fn(), deleteField: vi.fn(), increment: vi.fn(), query: vi.fn(), limit: vi.fn(),
}));
vi.mock('../../src/services/storage', () => ({ StorageService: {
  getRecipes: () => state.existing, addRecipe: state.add, updateRecipe: state.update,
} }));
import { FirestoreRepo, stripUndefined } from '../../src/services/firestoreRepo';
import { saveRecipeConfirmed } from '../../src/services/recipeSave';

const recipe = (): Recipe => ({ ...structuredClone(fullRecipe), id: 'REC-CONFIRMED', name: 'Pale Ale à conserver' });
const snapshot = (value: Recipe | null) => ({ id: 'REC-CONFIRMED', exists: () => value !== null,
  data: () => value, metadata: { hasPendingWrites: false, fromCache: false } });
const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>(yes => { resolve = yes; });
  return { promise, resolve };
};
function reordered(value: any): any {
  if (Array.isArray(value)) return value.map(reordered);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).reverse().map(([key, item]) => [key, reordered(item)]));
}
beforeEach(() => {
  FirestoreRepo.stopSync();
  state.existing = []; state.submitted = undefined;
  state.commit.mockReset().mockResolvedValue(undefined);
  state.read.mockReset().mockImplementation(async () => snapshot(stripUndefined(structuredClone(state.submitted!))));
  state.globalWait.mockReset();
  const write = (value: Recipe) => { state.submitted = structuredClone(value); FirestoreRepo.put('recipes', value.id, value); };
  state.add.mockReset().mockImplementation(write); state.update.mockReset().mockImplementation(write);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => { FirestoreRepo.stopSync(); vi.restoreAllMocks(); });

describe('Sauvegarde de la version réellement soumise', () => {
  it('attend l’écriture et la lecture serveur de la recette avant de résoudre', async () => {
    const commit = deferred(); state.commit.mockReturnValueOnce(commit.promise);
    const original = recipe(), resolved = vi.fn();
    const saving = saveRecipeConfirmed(original).then(value => { resolved(value); return value; });
    expect(state.add).toHaveBeenCalledOnce(); expect(state.update).not.toHaveBeenCalled();
    expect(resolved).not.toHaveBeenCalled(); expect(state.read).not.toHaveBeenCalled();
    commit.resolve();
    const confirmed = await saving;
    expect(confirmed).toEqual(stripUndefined(original));
    expect(confirmed).not.toHaveProperty('__docId');
    expect(state.read).toHaveBeenCalledWith({ name: 'recipes', id: original.id });
    expect(state.globalWait).not.toHaveBeenCalled();
  });
  it('met à jour uniquement la recette existante et accepte les clés réordonnées', async () => {
    const original = recipe(); state.existing = [{ ...original, name: 'Ancien nom' }];
    state.read.mockResolvedValueOnce(snapshot(reordered({ ...stripUndefined(original), __docId: original.id })));
    await expect(saveRecipeConfirmed(original)).resolves.toEqual(stripUndefined(original));
    expect(state.update).toHaveBeenCalledExactlyOnceWith(original); expect(state.add).not.toHaveBeenCalled();
  });
  it('respecte la sérialisation des valeurs absentes et enlève les métadonnées internes', async () => {
    const original = recipe();
    original.instructions = undefined; original.yeast.notes = undefined;
    original.notes = ['À préparer', undefined as any];
    const server = stripUndefined(structuredClone(original));
    (server.yeast as any).__docId = 'metadata';
    state.read.mockResolvedValueOnce(snapshot(server));
    const confirmed = await saveRecipeConfirmed(original);
    expect(confirmed.notes).toEqual(['À préparer', null]);
    expect(confirmed).not.toHaveProperty('instructions');
    expect(confirmed.yeast).not.toHaveProperty('notes');
    expect(confirmed.yeast).not.toHaveProperty('__docId');
    expect(original.notes[1]).toBeUndefined();
  });
  it('conserve l’incertitude si la confirmation serveur est indisponible', async () => {
    state.read.mockRejectedValueOnce(new Error('Hors ligne'));
    await expect(saveRecipeConfirmed(recipe())).rejects.toMatchObject({ status: 'pending' });
    expect(state.add).toHaveBeenCalledOnce(); expect(state.commit).toHaveBeenCalledOnce();
  });
  it('propage le refus confirmé et permet de corriger avant une nouvelle soumission', async () => {
    const original = recipe();
    state.commit.mockRejectedValueOnce({ code: 'permission-denied', message: 'Écriture refusée' });
    state.read.mockResolvedValueOnce(snapshot(null));
    await expect(saveRecipeConfirmed(original)).rejects.toMatchObject({ status: 'rejected' });
    const corrected = { ...original, name: 'Recette corrigée' };
    await expect(saveRecipeConfirmed(corrected)).resolves.toEqual(stripUndefined(corrected));
    expect(state.add).toHaveBeenCalledTimes(2);
    expect(original.name).toBe('Pale Ale à conserver');
  });
  it('refuse une ancienne version encore présente après le rejet de sa modification', async () => {
    const old = recipe(), changed = { ...old, yeast: { ...old.yeast, qty: old.yeast.qty + 1 } };
    state.existing = [old];
    state.commit.mockRejectedValueOnce({ code: 'permission-denied', message: 'Modification refusée' });
    state.read.mockResolvedValueOnce(snapshot(old));
    await expect(saveRecipeConfirmed(changed)).rejects.toMatchObject({ status: 'conflict' });
    expect(state.update).toHaveBeenCalledOnce(); expect(state.add).not.toHaveBeenCalled();
    expect(state.existing[0]).toEqual(old);
    const corrected = { ...changed, yeast: { ...changed.yeast, qty: changed.yeast.qty + 1 } };
    await expect(saveRecipeConfirmed(corrected)).resolves.toEqual(stripUndefined(corrected));
    expect(state.update).toHaveBeenCalledTimes(2);
  });
  it.each<[string, (r: Recipe) => void]>([
    ['un nombre imbriqué', r => { r.fermentables![0].weightKg += 1; }],
    ['un élément ajouté', r => { r.fermentation.push({ kind: 'garde', name: 'Garde', tempC: 4, days: 5 }); }],
    ['un ordre de paliers différent', r => { r.mash.steps.reverse(); }],
    ['un champ ancien non supprimé', r => { r.instructions = 'Anciennes consignes'; }],
    ['null à la place d’une valeur absente', r => { r.instructions = null as any; }],
    ['un identifiant différent', r => { r.id = 'REC-OTHER'; }],
  ])('ne confirme pas %s', async (_label, modify) => {
    const submitted = recipe(); delete submitted.instructions;
    const server = structuredClone(submitted); modify(server);
    state.read.mockResolvedValueOnce(snapshot(server));
    await expect(saveRecipeConfirmed(submitted)).rejects.toMatchObject({ status: 'conflict' });
  });
  it('compare la copie soumise même si le formulaire est modifié pendant l’attente', async () => {
    const commit = deferred(); state.commit.mockReturnValueOnce(commit.promise);
    const original = recipe(), submittedWeight = original.fermentables![0].weightKg;
    const saving = saveRecipeConfirmed(original);
    original.fermentables![0].weightKg = 99;
    commit.resolve();
    const confirmed = await saving;
    expect(confirmed.fermentables![0].weightKg).toBe(submittedWeight);
    expect(original.fermentables![0].weightKg).toBe(99);
  });
  it('accepte seulement le snapshot NOLO ajouté automatiquement lorsqu’il était absent', async () => {
    const original = { ...recipe(), nolo: newNoloConfig() };
    const enriched = { ...original, nolo: { ...original.nolo, scienceSnapshot: noloScience() } };
    state.read.mockResolvedValueOnce(snapshot(reordered(enriched)));
    await expect(saveRecipeConfirmed(original)).resolves.toEqual(stripUndefined(enriched));
    expect(original.nolo).not.toHaveProperty('scienceSnapshot');
  });
  it('traite un snapshot NOLO nul comme l’absence que StorageService complète', async () => {
    const original = { ...recipe(), nolo: { ...newNoloConfig(), scienceSnapshot: null as any } };
    const enriched = { ...original, nolo: { ...original.nolo, scienceSnapshot: noloScience() } };
    state.read.mockResolvedValueOnce(snapshot(enriched));
    await expect(saveRecipeConfirmed(original)).resolves.toEqual(stripUndefined(enriched));
    expect(original.nolo.scienceSnapshot).toBeNull();
  });
  it('vérifie un snapshot NOLO explicitement soumis et les autres valeurs NOLO', async () => {
    const original = { ...recipe(), nolo: { ...newNoloConfig(), scienceSnapshot: noloScience()! } };
    const oldSnapshot = structuredClone(original);
    oldSnapshot.nolo.scienceSnapshot.waterMashMaxLKg.value += 1;
    state.read.mockResolvedValueOnce(snapshot(oldSnapshot));
    await expect(saveRecipeConfirmed(original)).rejects.toMatchObject({ status: 'conflict' });
    const noSnapshot = { ...recipe(), nolo: newNoloConfig() };
    state.read.mockResolvedValueOnce(snapshot({ ...noSnapshot, nolo: { ...noSnapshot.nolo, targetAbvPct: 0.9, scienceSnapshot: noloScience() } }));
    await expect(saveRecipeConfirmed(noSnapshot)).rejects.toMatchObject({ status: 'conflict' });
  });
  it.each<[string, (r: Recipe) => void]>([
    ['nom vide', r => { r.name = ''; }],
    ['volume absent', r => { r.volumeL = undefined as any; }],
    ['quantité négative', r => { r.hops[0].weightG = -1; }],
    ['température invalide', r => { r.mash.steps[0].tempC = NaN; }],
    ['identifiant absent', r => { r.id = ''; }],
  ])('ne produit aucune écriture pour une recette invalide : %s', async (_label, invalidate) => {
    const original = recipe(); invalidate(original);
    await expect(saveRecipeConfirmed(original)).rejects.toThrow();
    expect(state.add).not.toHaveBeenCalled(); expect(state.update).not.toHaveBeenCalled();
    expect(state.commit).not.toHaveBeenCalled(); expect(state.read).not.toHaveBeenCalled();
  });
});
