import { Input } from './Input';
import React, { useMemo, useState } from 'react';
import { GroupedVirtuoso, Virtuoso } from 'react-virtuoso';
import { createSearch, runSearch } from '../services/search';
import { Search, X, Star } from 'lucide-react';

/**
 * Liste d'entités — **toute** liste de l'application passe par ici.
 *
 * Trois choses qu'elle apporte et que les listes écrites à la main n'avaient pas :
 *
 *  1. **Virtualisation** (react-virtuoso) : seules les lignes visibles existent
 *     dans le DOM. Cinq mille articles défilent aussi bien que trente.
 *  2. **Groupes à en-tête collant** : « Malts », « Houblons », « Levures »
 *     restent visibles pendant qu'on fait défiler leur contenu.
 *  3. **Recherche tolérante** (fuse.js) : « caramunch » trouve « Caramünch »,
 *     « rostgerste » trouve « Röstgerste ». Sur des centaines d'articles aux
 *     noms allemands, c'est la différence entre trouver et renoncer.
 *
 * Les favoris remontent toujours en tête, quel que soit le tri.
 */

export interface EntityListProps<T> {
  items: T[];
  /** Identifiant stable, pour la réconciliation React. */
  keyOf: (item: T) => string;
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Groupe d'appartenance. Sans lui, la liste est plate. */
  groupOf?: (item: T) => string;
  /** Ordre imposé des groupes ; sinon ordre d'apparition. */
  groupOrder?: string[];
  /** Champs indexés par la recherche floue. */
  searchKeys?: string[];
  isFavorite?: (item: T) => boolean;
  searchPlaceholder?: string;
  /** Message quand la liste est vide au départ (pas après filtrage). */
  emptyState?: React.ReactNode;
  /** Bandeau libre au-dessus de la liste (totaux, actions). */
  header?: React.ReactNode;
  toolbarAction?: React.ReactNode;
  /** Hauteur de la zone défilante. Par défaut, tout l'espace disponible. */
  className?: string;
}

export function EntityList<T>({
  items,
  keyOf,
  renderItem,
  groupOf,
  groupOrder,
  searchKeys,
  isFavorite,
  searchPlaceholder = 'Rechercher…',
  emptyState,
  header,
  toolbarAction,
  className = ''
}: EntityListProps<T>) {
  const [query, setQuery] = useState('');

  // Index insensible aux accents : « caramunch » doit trouver « Caramünch ».
  const fuse = useMemo(() => {
    if (!searchKeys || searchKeys.length === 0) return null;
    return createSearch(items, searchKeys);
  }, [items, searchKeys]);

  const filtered = useMemo(() => {
    const q = query.trim();
    const base = q && fuse ? runSearch(fuse, q) : items;

    if (!isFavorite) return base;
    // Tri stable : les épinglés d'abord, l'ordre relatif préservé sinon.
    return [...base].sort((a, b) => {
      const fa = isFavorite(a) ? 0 : 1;
      const fb = isFavorite(b) ? 0 : 1;
      return fa - fb;
    });
  }, [items, query, fuse, isFavorite]);

  /** Découpage en groupes contigus, dans l'ordre demandé. */
  const grouped = useMemo(() => {
    if (!groupOf) return null;

    const buckets = new Map<string, T[]>();
    filtered.forEach((item) => {
      const g = groupOf(item);
      const arr = buckets.get(g) ?? [];
      arr.push(item);
      buckets.set(g, arr);
    });

    const names = groupOrder
      ? groupOrder.filter((g) => buckets.has(g)).concat(
          Array.from(buckets.keys()).filter((g) => !groupOrder.includes(g))
        )
      : Array.from(buckets.keys());

    return {
      names,
      counts: names.map((n) => buckets.get(n)!.length),
      flat: names.flatMap((n) => buckets.get(n)!)
    };
  }, [filtered, groupOf, groupOrder]);

  const showSearch = Boolean(searchKeys && searchKeys.length > 0);
  const isEmpty = items.length === 0;
  const noResults = !isEmpty && filtered.length === 0;

  return (
    <div className={`flex flex-col min-h-0 ${className}`}>
      {showSearch && (
        <div className="shrink-0 px-1 pb-2 sm:pb-3 flex gap-2 items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-cave-400 pointer-events-none" />
            <Input
              type="text"
              name="entity_filter_search"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              data-form-type="other"
              data-lpignore="true"
              data-1p-ignore="true"
              data-bwignore="true"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full min-h-touch pl-11 pr-11 rounded-control
                         bg-cave-900 border border-cave-800 text-cave-50 text-base
                         placeholder-cave-400 focus:outline-none focus:border-ebc-straw
                         transition-colors"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                aria-label="Effacer la recherche"
                className="absolute right-1 top-1/2 -translate-y-1/2 touch-target
                           text-cave-400 hover:text-cave-50 rounded-control"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          {toolbarAction}
        </div>
      )}
      {!showSearch && toolbarAction && <div className="shrink-0 flex justify-end pb-2">{toolbarAction}</div>}

      {header && <div className="shrink-0 px-1 pb-3">{header}</div>}

      {isEmpty && emptyState}

      {noResults && (
        <div className="py-12 text-center space-y-2">
          <p className="text-base text-cave-200">Rien ne correspond à « {query} »</p>
          <p className="text-sm text-cave-400">
            La recherche tolère les fautes et les accents manquants.
          </p>
        </div>
      )}

      {!isEmpty && !noResults && grouped && (
        <GroupedVirtuoso
          className="flex-1 min-h-0"
          groupCounts={grouped.counts}
          groupContent={(index) => (
            <div
              className="px-1 py-2 bg-cave-950/95 backdrop-blur-sm
                         flex items-baseline justify-between gap-2 border-b border-cave-800"
            >
              <span className="text-base font-semibold text-cave-50">
                {grouped.names[index]}
              </span>
              <span className="text-sm text-cave-400 font-mono shrink-0">
                {grouped.counts[index]}
              </span>
            </div>
          )}
          itemContent={(index) => (
            <div key={keyOf(grouped.flat[index])} className="py-1.5">
              {renderItem(grouped.flat[index], index)}
            </div>
          )}
        />
      )}

      {!isEmpty && !noResults && !grouped && (
        <Virtuoso
          className="flex-1 min-h-0"
          data={filtered}
          itemContent={(index, item) => (
            <div key={keyOf(item)} className="py-1.5">
              {renderItem(item, index)}
            </div>
          )}
        />
      )}
    </div>
  );
}

/** Étoile d'épinglage — même geste partout dans l'application. */
export const FavoriteToggle: React.FC<{
  active: boolean;
  onToggle: () => void;
  label: string;
}> = ({ active, onToggle, label }) => (
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      onToggle();
    }}
    aria-label={active ? `Retirer ${label} des favoris` : `Épingler ${label}`}
    aria-pressed={active}
    className="touch-target rounded-control shrink-0 transition-colors
               text-cave-400 hover:text-ebc-straw"
  >
    <Star
      className={`w-5 h-5 transition-colors ${active ? 'fill-ebc-straw text-ebc-straw' : ''}`}
    />
  </button>
);
