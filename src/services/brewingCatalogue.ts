import type { BrewerCatalogueCommand, BrewerCatalogueKind } from '../../functions/src/brewerCatalogueSchema';
import type { BrewerCatalogueLookupRecord, BrewerCatalogueWriteResult } from '../../functions/src/brewerCatalogueStore';

/** Server confirmation is explicit. Offline callers retain their draft instead
 * of reporting a queued Firebase write as a confirmed catalogue mutation. */
export const BrewingCatalogue = {
  async lookup(kind: BrewerCatalogueKind, query: string): Promise<{ records: BrewerCatalogueLookupRecord[]; truncated: boolean }> {
    const [{ httpsCallable }, { functions }] = await Promise.all([import('firebase/functions'), import('./firebase')]);
    const result = await httpsCallable<{ kind: BrewerCatalogueKind; query: string }, { records: BrewerCatalogueLookupRecord[]; truncated: boolean }>(functions, 'readBrewingCatalogue', { timeout: 65_000 })({ kind, query });
    return result.data;
  },
  async write(command: BrewerCatalogueCommand): Promise<BrewerCatalogueWriteResult> {
    const [{ httpsCallable }, { functions }] = await Promise.all([import('firebase/functions'), import('./firebase')]);
    return (await httpsCallable<BrewerCatalogueCommand, BrewerCatalogueWriteResult>(functions, 'writeBrewingCatalogue', { timeout: 65_000 })(command)).data;
  }
};
