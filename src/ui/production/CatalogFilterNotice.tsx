import React from 'react';
import { X } from 'lucide-react';
import type { CatalogCriterion } from '../../domain/catalogPreferences';

export function CatalogFilterNotice({
  criteria,
  onRemove,
  onReset,
  onShowAll
}: {
  criteria: CatalogCriterion[];
  onRemove: (c: CatalogCriterion) => void;
  onReset: () => void;
  onShowAll: () => void;
}) {
  if (!criteria.length) return null;
  return (
    <div
      className="rounded-control border border-ebc-straw/40 bg-ebc-straw/5 px-3 pb-2"
      aria-label="Filtres actifs mémorisés"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ebc-straw" role="status">
          Vue filtrée · {criteria.length} critère
          {criteria.length > 1 ? 's' : ''}
        </p>
        <button
          type="button"
          className="min-h-touch px-1 text-sm text-cave-200 underline underline-offset-4"
          onClick={onReset}
        >
          Tout effacer
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        {criteria.slice(0, 3).map((c) => (
          <button
            type="button"
            key={c.id}
            onClick={() => onRemove(c)}
            aria-label={`Retirer le filtre ${c.label}`}
            className="min-h-touch max-w-[240px] shrink-0 inline-flex items-center gap-1.5 rounded-control bg-cave-850 px-2 text-sm text-cave-50"
          >
            <span className="truncate">
              {c.id === 'favorite' ? 'Favoris' : `${c.label} : ${c.value}`}
            </span>
            <X className="h-3.5 w-3.5 shrink-0" />
          </button>
        ))}
        {criteria.length > 3 && (
          <button
            type="button"
            onClick={onShowAll}
            className="min-h-touch shrink-0 px-2 text-sm text-ebc-straw"
          >
            Voir les {criteria.length} critères
          </button>
        )}
      </div>
      <p className="text-sm text-cave-400 pt-1">Mémorisés sur cet appareil.</p>
    </div>
  );
}
