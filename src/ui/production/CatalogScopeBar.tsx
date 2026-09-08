import React from 'react';
import { Archive, FolderOpen } from 'lucide-react';
import type { CatalogEntry, CatalogFilters, CatalogKind } from '../../domain/productionCatalog';
import {
  CATALOG_FOLDER_LABELS,
  inCatalogFolder,
  isArchived,
  type CatalogFolder
} from '../../domain/catalogOrganization';

/** Folder and sort stay visible, independently of the collapsible filter details. */
export function CatalogScopeBar({
  kind,
  entries,
  count,
  filters,
  onChange,
  comparing,
  onCompare
}: {
  kind: CatalogKind;
  entries: CatalogEntry[];
  count: number;
  filters: CatalogFilters;
  onChange: (next: CatalogFilters) => void;
  comparing: boolean;
  onCompare: () => void;
}) {
  const noun = kind === 'recipes' ? 'recette' : 'brassin';
  const archivedCount = entries.filter(isArchived).length;
  const scopedCount = entries.filter((e) => inCatalogFolder(e, filters.folder)).length;
  const set = (patch: Partial<CatalogFilters>) => onChange({ ...filters, ...patch });
  return (
    <div>
      <div className="flex items-center gap-2">
        {filters.folder === 'archived' ? (
          <Archive className="h-4 w-4 shrink-0 text-water" />
        ) : (
          <FolderOpen className="h-4 w-4 shrink-0 text-cave-400" />
        )}
        <label className="sr-only" htmlFor={`catalog-folder-${kind}`}>
          Dossier des {noun}s
        </label>
        <select
          id={`catalog-folder-${kind}`}
          value={filters.folder}
          onChange={(e) => set({ folder: e.target.value as CatalogFolder })}
          className="min-h-touch min-w-0 flex-1 bg-cave-950 text-base font-semibold text-cave-100"
        >
          {(Object.keys(CATALOG_FOLDER_LABELS) as CatalogFolder[]).map((folder) => (
            <option key={folder} value={folder}>
              {CATALOG_FOLDER_LABELS[folder]} ·{' '}
              {entries.filter((e) => inCatalogFolder(e, folder)).length}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor={`catalog-sort-${kind}`}>
          Trier les {noun}s
        </label>
        <select
          id={`catalog-sort-${kind}`}
          className="min-h-touch w-[135px] sm:w-[155px] shrink-0 bg-cave-950 text-right pr-1 text-sm text-cave-200"
          value={filters.sort}
          onChange={(e) => set({ sort: e.target.value as CatalogFilters['sort'] })}
        >
          {kind === 'batches' && <option value="work">À suivre d’abord</option>}
          <option value="recent">Date ↓</option>
          <option value="oldest">Date ↑</option>
          <option value="name">Nom A–Z</option>
          <option value="volume">Volume ↓</option>
          <option value="abv">Alcool ↓</option>
          <option value="ibu">IBU cible ↓</option>
          <option value="color">Couleur EBC ↓</option>
          <option value="activity">{kind === 'batches' ? 'Avancement' : 'Nombre de lots ↓'}</option>
        </select>
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-cave-400" role="status">
          {count} {noun}
          {count > 1 ? 's' : ''} sur {scopedCount}
        </p>
        {kind === 'recipes' && (
          <button
            type="button"
            aria-label="Choisir des recettes à comparer"
            aria-pressed={comparing}
            onClick={onCompare}
            className={`min-h-touch px-2 text-sm ${comparing ? 'text-ebc-straw' : 'text-cave-200'}`}
          >
            Comparer
          </button>
        )}
      </div>
      {archivedCount > 0 && (
        <p className="text-sm text-cave-400 mt-1">
          {filters.folder === 'current'
            ? `${archivedCount} fiche${archivedCount > 1 ? 's' : ''} dans Archives, hors de cette vue.`
            : filters.folder === 'all'
              ? `Historique complet · ${archivedCount} archive${archivedCount > 1 ? 's' : ''} incluse${archivedCount > 1 ? 's' : ''}.`
              : 'Archives conservées · disponibles pour les analyses.'}
        </p>
      )}
    </div>
  );
}
