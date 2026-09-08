import { FirestoreRepo } from './firestoreRepo';
import type { CatalogEntityKind, CatalogOrganization } from '../domain/catalogOrganization';

/** Patch only filing metadata, so a star cannot overwrite another device's recipe or brew log. */
export function writeCatalogOrganization(
  kind: CatalogEntityKind,
  id: string,
  patch: Partial<CatalogOrganization>
): { name: string } | undefined {
  const collection = kind === 'recipe' ? 'recipes' : 'batches';
  const record = FirestoreRepo.all<{
    id: string;
    name: string;
    __docId?: string;
  }>(collection).find((item) => item.id === id || item.__docId === id);
  if (!record) return undefined;
  FirestoreRepo.put(collection, record.__docId || id, patch, { merge: true });
  return { name: record.name };
}
