import { expect, it, vi } from 'vitest';
import type { HopKnowledge } from '../../functions/src/hopPredictionSchema';
import documented from '../../src/data/yeastRecipeReferences.json';
import { yeastReferences } from '../../src/domain/yeastReferences';
import { hopTestVariety, hopTestLot } from '../fixtures/hopIndex';

const repo = vi.hoisted(() => ({ rows: [] as unknown[], writes: vi.fn() }));
vi.mock('../../src/services/firestoreRepo', () => ({ FirestoreRepo: {
  all: () => repo.rows, put: repo.writes, stopSync: () => {}
}, ALL_COLLECTIONS: [] }));
import { StorageService } from '../../src/services/storage';

it('shares unchanged knowledge and invalidates replacement, in-place row writes, deletion and session clearing', () => {
  const original = { ...structuredClone(documented[0]), __docId: documented[0].id };
  repo.rows = [original];
  const first = StorageService.getHopKnowledge();
  expect(first[0]).not.toHaveProperty('__docId');
  expect(StorageService.getHopKnowledge()).toBe(first);
  const references = yeastReferences(first);
  expect(yeastReferences(StorageService.getHopKnowledge())).toBe(references);
  repo.rows[0] = { ...original, name: 'Culture renommée' };
  const replaced = StorageService.getHopKnowledge();
  expect(replaced).not.toBe(first);
  expect(yeastReferences(replaced).find(row => row.id === original.id)).toMatchObject({ name: 'Culture renommée' });
  expect(first[0].name).toBe(original.name); // Previous snapshots remain unchanged.
  repo.rows.push({ ...original, id: 'another-reference' });
  expect(StorageService.getHopKnowledge()).toHaveLength(2);
  repo.rows.splice(0, 1);
  expect(StorageService.getHopKnowledge().map(row => row.id)).toEqual(['another-reference']);
  const beforeClear = StorageService.getHopKnowledge();
  StorageService.clearMemoryCache();
  expect(StorageService.getHopKnowledge()).not.toBe(beforeClear);
  repo.rows = [];
  const empty = StorageService.getHopKnowledge();
  expect(empty).toEqual([]); expect(StorageService.getHopKnowledge()).toBe(empty);
  repo.rows = [{ ...original, catalogue: null } as unknown as HopKnowledge];
  expect(yeastReferences(StorageService.getHopKnowledge()).some(row => row.id === original.id)).toBe(false);
  expect(repo.writes).not.toHaveBeenCalled();
});

it.each([
  ['varieties', StorageService.getHopVarieties, () => hopTestVariety()],
  ['lots', StorageService.getHopLots, () => hopTestLot()]
] as const)('shares unchanged %s and updates existing and new records without mutating previous snapshots', (_name, read, fixture) => {
  const original=fixture();repo.rows=[{...original,__docId:original.id}];
  const first=read();expect(read()).toBe(first);expect(first[0]).not.toHaveProperty('__docId');
  repo.rows[0]={...original,name:'Référence corrigée'};
  expect(read()).not.toBe(first);expect(read()[0].name).toBe('Référence corrigée');
  expect(first[0].name).toBe(original.name);
  repo.rows.push({...original,id:'new-record'});expect(read()).toHaveLength(2);
  repo.rows.splice(0,1);expect(read()).toHaveLength(1);
});
