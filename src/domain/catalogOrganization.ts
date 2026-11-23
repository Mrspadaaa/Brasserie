/** Archive is a filing preference, never a production status, deletion or stock movement. */
export type CatalogFolder = 'current' | 'archived' | 'all';
export type CatalogEntityKind = 'recipe' | 'batch';
export interface CatalogOrganization {
  favorite?: boolean;
  archivedAt?: string | null;
}
export const isArchived = (item: CatalogOrganization): boolean => !!item.archivedAt;
export const isCurrent = (item: CatalogOrganization): boolean => !isArchived(item);
export function inCatalogFolder(item: CatalogOrganization, folder: CatalogFolder): boolean {
  return folder === 'all' || (folder === 'archived' ? isArchived(item) : isCurrent(item));
}
export const CATALOG_FOLDER_LABELS: Record<CatalogFolder, string> = {
  current: 'Courant',
  archived: 'Archives',
  all: 'Tout, archives incluses'
};
