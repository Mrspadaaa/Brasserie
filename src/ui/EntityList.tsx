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

/** Pause après le dernier appui sur une étoile avant que la ligne change de place (BR-69). */
const RETRI_MS = 1200;

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
  /** Quand cette valeur change (filtre choisi, onglet), la liste repart du haut (BR-70). */
  resetKey?: unknown;
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
  resetKey,
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

  /*
   * BR-69 : épingler retriait la liste à l'instant, et le second appui d'un double toucher tombait sur la ligne qui avait pris la place de la première
   * (Pilsner 23,5 kg désépinglé, Pilsner 3 kg épinglé). L'étoile change tout de suite ; la LIGNE, elle, ne change de place qu'après une pause
   * (RETRI_MS), ou à la recherche suivante. L'ordre sert au tri seulement, l'état affiché reste celui de `isFavorite`.
   */
  const epingles = useMemo(
    () => (isFavorite ? new Set(items.filter(isFavorite).map(keyOf)) : new Set<string>()),
    [items, isFavorite, keyOf]
  );
  const [ordre, setOrdre] = useState(epingles);
  React.useEffect(() => {
    if (ordre === epingles) return;
    const egal = ordre.size === epingles.size && [...epingles].every((cle) => ordre.has(cle));
    if (egal) return;
    const delai = setTimeout(() => setOrdre(epingles), RETRI_MS);
    return () => clearTimeout(delai);
  }, [epingles, ordre]);
  // Une nouvelle recherche repart de l'état à jour : rien à protéger d'un double toucher.
  React.useEffect(() => { setOrdre(epingles); }, [query]);

  const filtered = useMemo(() => {
    const q = query.trim();
    const base = q && fuse ? runSearch(fuse, q) : items;

    if (!isFavorite) return base;
    // Tri stable : les épinglés d'abord, l'ordre relatif préservé sinon.
    return [...base].sort((a, b) => {
      const fa = ordre.has(keyOf(a)) ? 0 : 1;
      const fb = ordre.has(keyOf(b)) ? 0 : 1;
      return fa - fb;
    });
  }, [items, query, fuse, isFavorite, ordre, keyOf]);

  // BR-70 : un nouveau filtre ou une nouvelle recherche repart du haut ; sinon la liste garde son défilement et cache ses premières lignes sous l'en-tête.
  const defilement = React.useRef<{ scrollToIndex: (arg: { index: number }) => void } | null>(null);
  React.useEffect(() => { defilement.current?.scrollToIndex({ index: 0 }); }, [query, resetKey]);

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
        <div className="shrink-0 pb-1 flex gap-1 items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-cave-400 pointer-events-none" />
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
              aria-label={searchPlaceholder}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full min-h-touch-lg pl-8 pr-8 rounded-control
                         bg-cave-900 border border-cave-800 text-cave-50 text-base
                         placeholder-cave-400 focus:outline-none focus:border-ebc-straw
                         transition-colors"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Effacer la recherche"
                className="absolute right-1 top-1/2 -translate-y-1/2 touch-target
                           text-cave-400 hover:text-cave-50 rounded-control"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {toolbarAction}
        </div>
      )}
      {!showSearch && toolbarAction && <div className="shrink-0 flex justify-end pb-2">{toolbarAction}</div>}

      {header && <div className="shrink-0 pb-1">{header}</div>}

      {isEmpty && emptyState}

      {noResults && (
        <div className="py-12 text-center space-y-2">
          <p className="text-base text-cave-200 break-words [overflow-wrap:anywhere]">Rien ne correspond à « {query} »</p>
          <p className="text-sm text-cave-400">
            La recherche tolère les fautes et les accents manquants.
          </p>
        </div>
      )}

      {!isEmpty && !noResults && grouped && (
        <GroupedVirtuoso
          ref={defilement as never}
          className="flex-1 min-h-0"
          groupCounts={grouped.counts}
          groupContent={(index) => (
            <div
              className="px-1 py-1 bg-cave-950/95 backdrop-blur-sm
                         flex items-baseline justify-between gap-2 border-b border-cave-800"
            >
              <span className="text-xs font-semibold text-cave-50">
                {grouped.names[index]}
              </span>
              <span className="text-xs text-cave-400 font-mono shrink-0">
                {grouped.counts[index]}
              </span>
            </div>
          )}
          itemContent={(index) => (
            <div key={keyOf(grouped.flat[index])} className="py-0.5">
              {renderItem(grouped.flat[index], index)}
            </div>
          )}
        />
      )}

      {!isEmpty && !noResults && !grouped && (
        <Virtuoso
          ref={defilement as never}
          className="flex-1 min-h-0"
          data={filtered}
          itemContent={(index, item) => (
            <div key={keyOf(item)} className="py-0.5">
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
      className={`w-4 h-4 transition-colors ${active ? 'fill-ebc-straw text-ebc-straw' : ''}`}
    />
  </button>
);
