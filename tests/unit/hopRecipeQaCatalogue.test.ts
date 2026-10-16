import { beforeEach, describe, expect, it } from 'vitest';
import { sha256 } from '@noble/hashes/sha2.js';
import {
  canonicalBrewerCatalogueFingerprintInput,
  projectBrewerCatalogueEntity,
} from '../../functions/src/brewerCatalogueCore';
import type { BrewerCatalogueEntity } from '../../functions/src/brewerCatalogueSchema';
import { loadBrewingCatalogueReferences } from '../../src/domain/brewingCatalogueReferences';
import { getFunctions, httpsCallable, qaCalls, qaInputs } from '../qa/hop-recipe/functions';

const hex = (bytes: Uint8Array) => Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
const queryKey = (value: string) => value.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase('fr').trim();

describe('adaptateur QA de lecture du catalogue de brassage', () => {
  beforeEach(() => {
    qaCalls.length = 0;
    qaInputs.length = 0;
  });

  it('renvoie les fiches Cascade officielles complètes avec projection, révision et empreinte canoniques', async () => {
    const official = await loadBrewingCatalogueReferences();
    const expectedById = new Map<string, BrewerCatalogueEntity>();
    for (const reference of official.varieties) {
      const projected = projectBrewerCatalogueEntity(reference);
      const terms = queryKey(`${projected.id}\n${projected.searchTerms.join('\n')}`);
      if (terms.includes(queryKey('Cascade'))) expectedById.set(projected.id, reference);
    }

    const read = httpsCallable(getFunctions(), 'readBrewingCatalogue');
    const response = await read({ kind: 'hopVariety', query: 'Cascade' });
    expect(response.data.truncated).toBe(false);
    expect(response.data.records.length).toBeGreaterThan(0);
    expect(response.data.records.map((row: { id: string }) => row.id).sort()).toEqual([...expectedById.keys()].sort());

    for (const row of response.data.records) {
      const source = expectedById.get(row.id);
      expect(source).toBeDefined();
      expect(row).toEqual({
        kind: 'hopVariety',
        id: source!.id,
        record: source,
        revision: source!.catalogueMeta?.revision ?? 0,
        fingerprint: hex(sha256(new TextEncoder().encode(canonicalBrewerCatalogueFingerprintInput(source!)))),
        origin: 'bundled',
      });
      // Exact record comparison above preserves its own descriptions, analyses,
      // provenance, and any lot/COA detail actually present in the reference.
    }

    expect(qaCalls).toEqual(['readBrewingCatalogue']);
    expect(qaInputs).toEqual([{ name: 'readBrewingCatalogue', input: { kind: 'hopVariety', query: 'Cascade' } }]);
  });

  it('distingue une recherche inconnue d’une lecture de référence incomplète', async () => {
    const read = httpsCallable(getFunctions(), 'readBrewingCatalogue');
    await expect(read({ kind: 'hopVariety', query: 'nom-inexistant-qa-7f04' }))
      .resolves.toEqual({ data: { records: [], truncated: false } });
  });

  it('refuse les écritures et autres appels hors liste sans les simuler', async () => {
    const write = httpsCallable(getFunctions(), 'writeBrewingCatalogue');
    await expect(write({ operation: 'create', entity: { kind: 'hopVariety', value: {} } }))
      .rejects.toThrow('Appel distant exclu du banc QA : writeBrewingCatalogue');
    const paidModel = httpsCallable(getFunctions(), 'aiTask');
    await expect(paidModel({ task: 'unmocked' }))
      .rejects.toThrow('Appel distant exclu du banc QA : aiTask');
    expect(qaCalls).toEqual(['writeBrewingCatalogue', 'aiTask']);
  });
});
