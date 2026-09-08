import React, { useState } from 'react';
import { Archive, ArchiveRestore, MoreHorizontal } from 'lucide-react';
import type { CatalogEntry } from '../../domain/productionCatalog';
import { Sheet } from '../Sheet';

export function CatalogItemMenu({
  entry,
  onArchive
}: {
  entry: CatalogEntry;
  onArchive: (entry: CatalogEntry, archived: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const archived = !!entry.archivedAt;
  const label = entry.recipe
    ? `la recette ${entry.name}, V${entry.version}`
    : `le brassin ${entry.id}`;
  const Icon = archived ? ArchiveRestore : Archive;
  return (
    <>
      <button
        type="button"
        className="touch-target shrink-0 rounded-control text-cave-400 hover:text-cave-50"
        aria-label={`Ranger ${label}`}
        onClick={() => setOpen(true)}
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={`Ranger ${entry.name}`}
        subtitle={entry.recipe ? `Recette V${entry.version}` : entry.id}
      >
        <div className="space-y-4">
          <p className="text-base text-cave-200">
            {archived
              ? 'Cette fiche retrouvera sa place dans le carnet courant.'
              : 'Cette fiche sera rangée dans Archives et masquée du carnet courant. Tu pourras la remettre à tout moment.'}
          </p>
          <p className="text-sm text-cave-400">
            Les mesures, les liens entre recettes et brassins et tout l’historique sont conservés.
            Les archives restent disponibles pour les analyses. Le stock et le statut du brassin ne
            changent pas.
          </p>
          <button
            type="button"
            className="min-h-touch w-full rounded-control border border-water/40 bg-water/10 text-water px-3 flex items-center justify-center gap-2"
            onClick={() => {
              setOpen(false);
              onArchive(entry, !archived);
            }}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {archived ? 'Remettre dans le carnet' : 'Classer dans les archives'}
          </button>
        </div>
      </Sheet>
    </>
  );
}
