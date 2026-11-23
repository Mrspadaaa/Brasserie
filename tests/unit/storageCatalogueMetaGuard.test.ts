import { beforeEach, describe, expect, it, vi } from 'vitest';
import { hopTestVariety } from '../fixtures/hopIndex';

const state = vi.hoisted(() => ({ rows: new Map<string, any>(), writes: vi.fn() }));
vi.mock('../../src/services/firestoreRepo', () => ({ FirestoreRepo: {
  all: (name: string) => [...state.rows.entries()].filter(([path]) => path.startsWith(`${name}/`)).map(([path, value]) => ({ ...structuredClone(value), __docId: path.split('/')[1] })),
  put: (name: string, id: string, value: any) => { state.writes(name, id, value); state.rows.set(`${name}/${id}`, structuredClone(value)); },
  bulkWrite: async (entries: any[]) => { for (const { name, id, data } of entries) { state.writes(name, id, data); state.rows.set(`${name}/${id}`, structuredClone(data)); } },
  remove: (name: string, id: string) => { state.rows.delete(`${name}/${id}`); },
  startSync: () => {}, isReady: () => true, subscribe: () => () => {}, clearMemoryCache: () => state.rows.clear()
} }));

import { StorageService } from '../../src/services/storage';

const ledger = (entityKind: 'hopVariety' | 'yeastStrain') => ({
  schemaVersion: 1, entityKind, revision: 1, fingerprint: 'a'.repeat(64),
  claims: [], unmapped: [], projections: [], corrections: [], identityResolutions: []
});
const source = { title: 'Fixture', author: 'Fixture', year: null, kind: 'observation', reference: 'fixture://catalogue-guard' } as const;
const yeast = (catalogueMeta?: ReturnType<typeof ledger>) => ({
  id: 'yeast-guard', kind: 'yeast' as const, name: 'Fixture yeast', betaLyase: 'unknown' as const, source,
  ...(catalogueMeta ? { catalogueMeta } : {})
});

beforeEach(() => { state.rows.clear(); state.writes.mockClear(); });

describe('écrivains legacy des fiches catalogue', () => {
  it('refuse une sauvegarde de variété obsolète qui effacerait un ledger déjà présent', () => {
    const saved = { ...hopTestVariety({ id: 'hop-guard' }), catalogueMeta: ledger('hopVariety') };
    state.rows.set('hopVarieties/hop-guard', structuredClone(saved));
    const stale = { ...hopTestVariety({ id: 'hop-guard', name: 'Ancien brouillon' }) };
    expect(() => StorageService.saveHopVariety(stale)).toThrow(/ledger/);
    expect(state.writes).not.toHaveBeenCalled();
    expect(state.rows.get('hopVarieties/hop-guard')).toEqual(saved);
  });

  it('refuse un import complet obsolète avant le premier lot d’écriture', async () => {
    const saved = yeast(ledger('yeastStrain'));
    state.rows.set('hopKnowledge/yeast-guard', structuredClone(saved));
    await expect(StorageService.importHopIndex(JSON.stringify({ hopKnowledge: [yeast()] }))).rejects.toThrow(/ledger/);
    expect(state.writes).not.toHaveBeenCalled();
    expect(state.rows.get('hopKnowledge/yeast-guard')).toEqual(saved);
  });

  it('laisse le writer classique modifier une fiche sans métadonnées protégées', () => {
    state.rows.set('hopVarieties/hop-guard', hopTestVariety({ id: 'hop-guard' }));
    expect(() => StorageService.saveHopVariety(hopTestVariety({ id: 'hop-guard', name: 'Révision classique' }))).not.toThrow();
    expect(state.writes).toHaveBeenCalledOnce();
  });
});
