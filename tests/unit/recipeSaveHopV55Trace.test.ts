import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Recipe } from '../../src/types';
import { fullRecipe } from '../fixtures/fullRecipe';
import { HOP_V55_RECIPE_DRAFT_APPLICATION_FORMAT } from '../../src/services/hopV55/recipeDraftApplication';
import { HOP_V55_RECIPE_COLD_CONTACT_ASSOCIATION_FORMAT } from '../../src/services/hopV55/recipeColdContactAssociation';

// #30 : le service habituel de sauvegarde (`saveRecipeConfirmed`) confirme une recette qui porte ses traces V5.5
// (application scellée, preuve froide, format futur) sur la relecture serveur, octet pour octet. Mêmes substituts
// Firestore que tests/unit/recipeSave.test.ts ; la vraie écriture est jouée sur émulateurs
// (scripts/check-recipe-hop-v55-emulator.mjs).
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

const RECIPE_ID = 'REC-V55-TRACE';
const application = () => ({
  format: HOP_V55_RECIPE_DRAFT_APPLICATION_FORMAT, id: 'application:emu-1', ownerKey: 'owner:brasseur', recipeId: RECIPE_ID,
  workspaceId: null, appliedAt: '2026-10-13T08:00:00.000Z', scenarioId: 'scenario:1', snapshotReference: 'sha256:snapshot',
  branchId: 'branch:essai', branchReference: 'sha256:branch', copyPreviewReference: 'sha256:copy', recipePreviewReference: 'sha256:preview',
  sourceRecipeReference: 'sha256:source', hopsReference: 'sha256:hops',
  alphaChoices: { 'scenario-hop:1': { alpha: 6.5, reason: 'COA du lot 2025', source: 'brewer' } },
  assumptions: ['Alpha nominal 6,5 % : hypothèse, pas une analyse du lot.'], conditions: ['Contact 48 h à 12 °C.'],
  materialReferences: [{ id: 'variety:cascade', reference: 'sha256:cascade' }], limits: ['Estimation, pas une mesure.'],
});
const coldAssociation = () => ({
  format: HOP_V55_RECIPE_COLD_CONTACT_ASSOCIATION_FORMAT, id: 'cold:emu-1', ownerKey: 'owner:brasseur', recipeId: RECIPE_ID,
  sourceRecipeReference: 'sha256:source', evidenceReference: 'sha256:evidence',
  evidenceSnapshot: { doseGL: 4 / 3, doseExact: { numerator: 400, denominator: 3, unit: 'g/hL' }, selectedAdditions: ['recipe-hop:1'],
    contact: { hours: 48, temperatureC: 12, phase: 'postFermentation' }, protocolSupplement: null, readings: [18.6, null] },
  origin: { kind: 'program', branchId: 'branch:essai' }, applicationRecordReference: null, applicationWitness: null,
  recordedAt: '2026-10-13T08:05:00.000Z', reference: 'sha256:association',
});
// A later app version wrote these: they must travel through the save untouched, never read nor rewritten.
const futureApplication = { format: 'hop-v55-recipe-draft-application-v9', id: 'application:futur', payload: { nested: [{ a: 1 }, { b: [2, 3] }] } };
const futureCold = { format: 'hop-v55-recipe-cold-contact-association-v9', id: 'cold:futur', opaque: { unknownField: true } };

const recipe = (): Recipe => ({ ...structuredClone(fullRecipe), id: RECIPE_ID, name: 'Pale V5.5 à conserver',
  hopV55Applications: [application(), structuredClone(futureApplication)],
  hopV55ColdEvidenceAssociations: [coldAssociation(), structuredClone(futureCold)] } as Recipe);
const snapshot = (value: unknown) => ({ id: RECIPE_ID, exists: () => value !== null,
  data: () => value, metadata: { hasPendingWrites: false, fromCache: false } });
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

describe('#30 — sauvegarde confirmée d’une recette portant ses traces V5.5', () => {
  it('confirme la première sauvegarde sur la relecture serveur, clés réordonnées, traces et formats futurs intacts', async () => {
    const original = recipe();
    state.read.mockImplementationOnce(async () => snapshot(reordered({ ...stripUndefined(structuredClone(state.submitted!)), __docId: RECIPE_ID })));
    const confirmed = await saveRecipeConfirmed(original);
    expect(state.add).toHaveBeenCalledExactlyOnceWith(original); expect(state.update).not.toHaveBeenCalled();
    expect(confirmed).toEqual(stripUndefined(original));
    expect(confirmed.hopV55Applications).toEqual([application(), futureApplication]);
    expect(confirmed.hopV55ColdEvidenceAssociations).toEqual([coldAssociation(), futureCold]);
    expect(confirmed).not.toHaveProperty('__docId');
  });

  it('corrige sous le même ID sans réécrire les traces existantes', async () => {
    const saved = recipe(); state.existing = [structuredClone(saved)];
    const corrected = { ...structuredClone(saved), hops: saved.hops.map((hop, index) => index ? hop : { ...hop, weightG: hop.weightG + 5 }) };
    const confirmed = await saveRecipeConfirmed(corrected);
    expect(state.update).toHaveBeenCalledExactlyOnceWith(corrected); expect(state.add).not.toHaveBeenCalled();
    expect(confirmed.id).toBe(RECIPE_ID);
    expect(state.submitted!.hopV55Applications).toEqual(saved.hopV55Applications);
    expect(state.submitted!.hopV55ColdEvidenceAssociations).toEqual(saved.hopV55ColdEvidenceAssociations);
  });

  it('accepte une valeur absente dans une trace telle que Firestore la relit (champ retiré, null dans une liste)', async () => {
    const original = recipe();
    (original.hopV55Applications![0] as Record<string, unknown>).dossierReference = undefined;
    (original.hopV55ColdEvidenceAssociations![0] as any).evidenceSnapshot.readings = [18.6, undefined];
    const confirmed = await saveRecipeConfirmed(original);
    expect(confirmed.hopV55Applications![0]).not.toHaveProperty('dossierReference');
    expect((confirmed.hopV55ColdEvidenceAssociations![0] as any).evidenceSnapshot.readings).toEqual([18.6, null]);
  });

  it('refuse une relecture dont une trace diffère et garde le brouillon (aucune confirmation)', async () => {
    const original = recipe();
    const server = stripUndefined(structuredClone(original)) as any;
    server.hopV55ColdEvidenceAssociations[0].evidenceSnapshot.contact.temperatureC = 13;
    state.read.mockResolvedValueOnce(snapshot(server));
    await expect(saveRecipeConfirmed(original)).rejects.toMatchObject({ status: 'conflict' });
    const futureChanged = stripUndefined(structuredClone(original)) as any;
    futureChanged.hopV55Applications[1].payload.nested[1].b = [2];
    state.read.mockResolvedValueOnce(snapshot(futureChanged));
    await expect(saveRecipeConfirmed(original)).rejects.toMatchObject({ status: 'conflict' });
  });
});
