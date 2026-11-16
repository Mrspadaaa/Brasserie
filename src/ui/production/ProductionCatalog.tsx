import React, { useEffect, useMemo, useState } from 'react';
import { SearchX, X } from 'lucide-react';
import type { Batch, Recipe } from '../../types';
import { dansPeriode, enPeriode, type Periode, type PeriodeEntree } from '../../components/periode/periode';
import { StorageService } from '../../services/storage';
import {
  CatalogFilters,
  CatalogKind,
  CatalogEntry,
  DEFAULT_CATALOG_FILTERS,
  batchEntries,
  filterCatalog,
  recipeEntries
} from '../../domain/productionCatalog';
import {
  matchesWorkFilter,
  type WorkFilter,
  type BatchDetailSection
} from '../../domain/productionInsights';
import { CatalogToolbar } from './CatalogToolbar';
import { CatalogAnalysis } from './CatalogAnalysis';
import { ListeBrassins } from './liste/ListeBrassins';
import { CRITERES_VIDES, restaurerCriteres, type Avancement, type Criteres } from './liste/listeModel';
import { RecipeCard, BatchCard } from './CatalogCards';
import { RecipeComparison } from './RecipeComparison';
import { Sheet } from '../Sheet';
import { useMobileLayout } from '../useViewport';
import { restoreCatalogFilters, catalogCriteria } from '../../domain/catalogPreferences';
import { inCatalogFolder, isArchived, type CatalogFolder } from '../../domain/catalogOrganization';

export function ProductionCatalog({
  kind,
  recipes,
  batches,
  globalTimeFilter,
  onChoisirPeriode,
  onOpenRecipe,
  onEditRecipe,
  onOpenBatch,
  onOpenBrewDay,
  onVueChange
}: {
  kind: CatalogKind;
  recipes: Recipe[];
  batches: Batch[];
  globalTimeFilter: PeriodeEntree;
  /** La feuille « Période » de la liste écrit la période de l'application. */
  onChoisirPeriode?: (p: Periode) => void;
  onOpenRecipe: (recipe: Recipe) => void;
  onEditRecipe: (recipe: Recipe) => void;
  onOpenBatch: (batch: Batch, section?: BatchDetailSection) => void;
  onOpenBrewDay: (batch: Batch) => void;
  /** Dit à l'écran parent si le bilan est ouvert : il masque alors sa phrase-réponse (e7a). */
  onVueChange?: (view: 'list' | 'analysis') => void;
}) {
  const mobile = useMobileLayout();
  const [filters, setFilters] = useState<CatalogFilters>(() =>
    restoreCatalogFilters(kind, StorageService.getUiState(`catalog-${kind}-filters`, {}))
  );
  const [analysisFolder, setAnalysisFolder] = useState<CatalogFolder>(() => {
    const saved = StorageService.getUiState<CatalogFolder>(
      `catalog-${kind}-analysis-folder`,
      'all'
    );
    return ['current', 'archived', 'all'].includes(saved) ? saved : 'all';
  });
  const [work, setWork] = useState<WorkFilter>(() =>
    kind === 'batches'
      ? (() => {
          const saved = StorageService.getUiState<WorkFilter>('catalog-batches-work', 'all');
          return ['all', 'measurements', 'tasting'].includes(saved) ? saved : 'all';
        })()
      : 'all'
  );
  // e6a, e6c : les critères posés par la liste des brassins (plusieurs par groupe), par-dessus le filtre du catalogue.
  const [criteres, setCriteres] = useState<Criteres>(() =>
    kind === 'batches' ? restaurerCriteres(StorageService.getUiState('catalog-batches-criteres', CRITERES_VIDES)) : CRITERES_VIDES
  );
  const [view, setView] = useState<'list' | 'analysis'>(() =>
    StorageService.getUiState<string>(`catalog-${kind}-view`, 'list') === 'analysis'
      ? 'analysis'
      : 'list'
  );
  const [comparing, setComparing] = useState(false),
    [selectedIds, setSelectedIds] = useState<string[]>([]),
    [compareOpen, setCompareOpen] = useState(false);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [historyArchives, setHistoryArchives] = useState(false);
  const [notice, setNotice] = useState<{
    text: string;
    undo?: () => void;
    error?: boolean;
  } | null>(null);
  /* m3r-a : une seule période. Brassins suit toujours celle de l'app ; Recettes garde « toutes les dates » ou la suit. Les anciens
     réglages locaux (30 j, 90 j, cette année, dates choisies) ne filtrent plus rien : ils étaient une seconde période. */
  const effectiveFilters = useMemo(
    () => ({
      ...filters,
      period: (kind === 'batches' || filters.period !== 'all' ? 'global' : 'all') as CatalogFilters['period'],
      from: '',
      to: '',
      folder: view === 'analysis' ? analysisFolder : filters.folder
    }),
    [filters, view, analysisFolder, kind]
  );
  const periodeApp = enPeriode(globalTimeFilter);
  const suitLaPeriode = effectiveFilters.period === 'global' && periodeApp.genre !== 'tout';
  /* Un brassin planifié sans date reste dans la liste sous toute période : sa date est inconnue (PD-3, PD-7). */
  const dansLaPeriode = (e: { batch?: { status?: string }; timestamp?: number; date?: string }) =>
    !suitLaPeriode || (e.batch?.status === 'planifie' && e.timestamp === undefined) || (e.timestamp !== undefined && dansPeriode(e.date ?? '', periodeApp));
  const changeFilters = (next: CatalogFilters) => {
    if (view === 'analysis') {
      setAnalysisFolder(next.folder);
      setFilters({ ...next, folder: filters.folder });
    } else setFilters(next);
  };
  useEffect(() => {
    StorageService.setUiState(`catalog-${kind}-filters`, filters);
  }, [filters, kind]);
  useEffect(() => {
    StorageService.setUiState(`catalog-${kind}-analysis-folder`, analysisFolder);
  }, [analysisFolder, kind]);
  useEffect(() => {
    StorageService.setUiState(`catalog-${kind}-view`, view);
    if (kind === 'batches') onVueChange?.(view);
  }, [view, kind]);
  useEffect(() => {
    if (kind === 'batches') StorageService.setUiState('catalog-batches-work', work);
  }, [work, kind]);
  useEffect(() => {
    if (kind === 'batches') StorageService.setUiState('catalog-batches-criteres', criteres);
  }, [criteres, kind]);
  const entries = useMemo(
    () => {
      if (kind !== 'recipes') return batchEntries(batches);
      const config = StorageService.getConfig();
      const cuverie = config.brewhouses.find((b) => b.id === config.activeBrewhouseId) ?? config.brewhouses[0];
      return recipeEntries(recipes, batches, cuverie?.efficiencyPct ?? 75);
    },
    [kind, recipes, batches]
  );
  // Tailles des fûts (stock) : la carte dit « fût 20 L » quand elle les connaît.
  const kegs = useMemo(() => {
    if (kind !== 'batches') return [];
    try { return StorageService.getStocks().kegs ?? []; } catch { return []; }
  }, [kind, batches]);
  const filtered = useMemo(() => {
    return filterCatalog(entries, effectiveFilters, 'all').filter((e) =>
      dansLaPeriode(e) && matchesWorkFilter(e, work)
    );
  }, [entries, effectiveFilters, periodeApp, work]); // eslint-disable-line react-hooks/exhaustive-deps
  const facetEntries = useMemo(
    () => filterCatalog(entries, { ...effectiveFilters, status: '', use: 'all' }, 'all').filter(dansLaPeriode),
    [entries, effectiveFilters, periodeApp] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const selected = selectedIds.flatMap((id) => {
    const e = entries.find((e) => e.id === id);
    return e && inCatalogFolder(e, filters.folder) ? [e] : [];
  });
  const history = entries.find((e) => e.id === historyId);
  const reset = () => {
    changeFilters({
      ...DEFAULT_CATALOG_FILTERS,
      folder: effectiveFilters.folder,
      sort: filters.sort
    });
    setWork('all');
  };
  const onFavorite = (entry: CatalogEntry) => {
    try {
      if (
        !StorageService.setCatalogFavorite(
          entry.recipe ? 'recipe' : 'batch',
          entry.id,
          !entry.favorite
        )
      )
        throw new Error('missing');
    } catch {
      setNotice({
        text: 'Cette fiche n’a pas pu être mise à jour. Réessaie depuis le carnet.',
        error: true
      });
    }
  };
  const onArchive = (entry: CatalogEntry, archived: boolean, undoable = true) => {
    try {
      if (!StorageService.setCatalogArchived(entry.recipe ? 'recipe' : 'batch', entry.id, archived))
        throw new Error('missing');
      setNotice({
        text: `« ${entry.name} » ${archived ? 'rangé dans Archives' : 'remis dans le carnet courant'}.`,
        ...(undoable ? { undo: () => onArchive(entry, !archived, false) } : {})
      });
      setSelectedIds((ids) => ids.filter((id) => id !== entry.id));
    } catch {
      setNotice({
        text: 'Le rangement n’a pas pu être enregistré. La fiche est conservée.',
        error: true
      });
    }
  };
  /* Fusion avec le tag en-ligne/2026-11-16-brassins : le bilan et la liste e6a sont les leurs ; la période de l'app reste celle d'ici (dansLaPeriode). */
  const bilanBrassins = kind === 'batches' && view === 'analysis';
  const bilanEntries = useMemo(
    () => bilanBrassins ? filterCatalog(entries, { ...DEFAULT_CATALOG_FILTERS, folder: 'all' }, 'all').filter(dansLaPeriode) : [],
    [bilanBrassins, entries, periodeApp] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const listeBrassins = kind === 'batches' && view === 'list';
  const hasCriteria = catalogCriteria(effectiveFilters, work, 'all').length > 0;
  const scopeCount = entries.filter((e) => inCatalogFolder(e, effectiveFilters.folder)).length;
  const archiveCount = entries.filter(isArchived).length;
  return (
    <div className="space-y-3">
      {!bilanBrassins && !listeBrassins && <CatalogToolbar
        kind={kind}
        entries={entries}
        facetEntries={facetEntries}
        count={filtered.length}
        filters={effectiveFilters}
        onChange={changeFilters}
        view={view}
        onViewChange={setView}
        globalPeriod="all"
        work={work}
        onWorkChange={setWork}
        comparing={comparing}
        onCompare={() => {
          setComparing(!comparing);
          setSelectedIds([]);
          setView('list');
        }}
      />}
      {notice && (
        <div
          className={`flex items-center gap-2 rounded-control border px-3 ${notice.error ? 'border-alert/40 text-alert' : 'border-water/40 text-water'}`}
          role={notice.error ? 'alert' : 'status'}
        >
          <p className="min-w-0 flex-1 text-sm">{notice.text}</p>
          {notice.undo && (
            <button type="button" className="min-h-touch text-sm underline" onClick={notice.undo}>
              Annuler
            </button>
          )}
          <button
            type="button"
            className="touch-target shrink-0"
            aria-label="Fermer le message"
            onClick={() => setNotice(null)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {comparing && view === 'list' && (
        <div
          className="sticky top-0 z-20 flex gap-2 items-center bg-cave-850 border border-cave-700 rounded-control px-3 py-2 shadow-lift"
          role="region"
          aria-label="Sélection à comparer"
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm text-cave-50">{selected.length}/2 recettes choisies</p>
            <p className="text-sm text-cave-400">
              {selected.length < 2
                ? 'Coche deux recettes à comparer.'
                : selected.map((e) => `${e.name} V${e.version}`).join(' / ')}
            </p>
          </div>
          <button
            type="button"
            disabled={selected.length !== 2}
            onClick={() => setCompareOpen(true)}
            className="min-h-touch rounded-control bg-ebc-straw text-cave-950 font-semibold px-3 text-sm disabled:opacity-40"
          >
            Comparer
          </button>
          <button
            type="button"
            className="touch-target text-cave-400"
            aria-label="Quitter la comparaison"
            onClick={() => {
              setComparing(false);
              setSelectedIds([]);
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {listeBrassins ? (
        <ListeBrassins
          entries={entries}
          filtres={effectiveFilters}
          onFiltres={changeFilters}
          criteres={criteres}
          onCriteres={setCriteres}
          kegs={kegs}
          appPeriode={globalTimeFilter}
          onChoisirPeriode={onChoisirPeriode}
          onOpenBatch={onOpenBatch}
          onBrew={onOpenBrewDay}
          onFavorite={onFavorite}
          onArchive={onArchive}
          onBilan={() => setView('analysis')}
        />
      ) : (bilanBrassins ? bilanEntries.length === 0 : filtered.length === 0) ? (
        <div className="panel p-6 text-center space-y-3">
          <SearchX className="h-7 w-7 mx-auto text-cave-400" />
          <h3 className="font-semibold text-cave-50">
            {effectiveFilters.folder === 'archived' && !scopeCount
              ? 'Aucune fiche dans Archives'
              : effectiveFilters.folder === 'current' && !scopeCount && archiveCount
                ? 'Le carnet courant est vide'
                : entries.length
                  ? 'Aucun résultat pour ces critères'
                  : kind === 'recipes'
                    ? 'Le carnet attend ta première recette'
                    : 'Aucun brassin pour le moment'}
          </h3>
          <p className="text-sm text-cave-400">
            {!scopeCount && archiveCount && effectiveFilters.folder === 'current'
              ? 'Tes anciennes fiches sont conservées dans Archives.'
              : !scopeCount && effectiveFilters.folder === 'archived'
                ? 'Range les fiches depuis le menu de chaque recette ou brassin.'
                : entries.length
                  ? 'Élargis les filtres ou la période pour retrouver tes fiches.'
                  : 'Crée une recette, puis planifie son brassin.'}
          </p>
          {bilanBrassins && (
            <button type="button" onClick={() => setView('list')} className="min-h-touch px-4 rounded-control border border-cave-700 text-ebc-straw">
              Retour aux brassins
            </button>
          )}
          {!bilanBrassins && hasCriteria && (
            <button
              type="button"
              onClick={reset}
              className="min-h-touch px-4 rounded-control border border-cave-700 text-ebc-straw"
            >
              Effacer les filtres
            </button>
          )}
          {effectiveFilters.folder === 'current' && archiveCount > 0 && (
            <button
              type="button"
              onClick={() => changeFilters({ ...effectiveFilters, folder: 'archived' })}
              className="min-h-touch px-4 rounded-control text-water"
            >
              Ouvrir Archives · {archiveCount}
            </button>
          )}
        </div>
      ) : view === 'analysis' ? (
        <CatalogAnalysis
          kind={kind}
          entries={bilanBrassins ? bilanEntries : filtered}
          includeArchivedBatches={effectiveFilters.folder !== 'current'}
          onBack={bilanBrassins ? () => setView('list') : undefined}
          onFolder={bilanBrassins ? setAnalysisFolder : undefined}
          onOpenBatch={onOpenBatch}
          onFilter={(field, value) => {
            if (kind === 'batches') {
              // Du bilan vers la liste : le critère devient une puce posée de la liste (e6a), le reste est effacé.
              const av: Record<string, Avancement> = { fermentation: 'cuve', garde: 'cuve', planifie: 'brasser', conditionne: 'conditionnes', termine: 'termines' };
              setCriteres({
                ...CRITERES_VIDES,
                avancement: field === 'status' && av[value] ? [av[value]] : [],
                styles: field === 'style' ? [value] : [],
                houblons: field === 'hop' ? [value] : []
              });
              setFilters((f) => ({ ...f, search: '', folder: effectiveFilters.folder }));
              setWork('all');
              setView('list');
              return;
            }
            setFilters((f) => ({
              ...f,
              folder: effectiveFilters.folder,
              [field]: value
            }));
            if (field === 'status') setWork('all');
            setView('list');
          }}
        />
      ) : (
        <div
          className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 items-start"
          aria-label={kind === 'recipes' ? 'Liste des recettes' : 'Liste des brassins'}
        >
          {filtered.map((entry) =>
            kind === 'recipes' ? (
              <RecipeCard
                compact={mobile}
                key={entry.id}
                entry={entry}
                onOpen={onOpenRecipe}
                onEdit={onEditRecipe}
                onHistory={(e) => {
                  setHistoryId(e.id);
                  setHistoryArchives(false);
                }}
                onFavorite={onFavorite}
                onArchive={onArchive}
                comparing={comparing}
                selected={selectedIds.includes(entry.id)}
                disabled={selected.length === 2 && !selectedIds.includes(entry.id)}
                onSelect={() =>
                  setSelectedIds((ids) =>
                    ids.includes(entry.id)
                      ? ids.filter((id) => id !== entry.id)
                      : ids.length < 2
                        ? [...ids, entry.id]
                        : ids
                  )
                }
              />
            ) : (
              <BatchCard
                compact={mobile}
                key={entry.id}
                entry={entry}
                onOpen={onOpenBatch}
                onBrew={onOpenBrewDay}
                onFavorite={onFavorite}
                onArchive={onArchive}
              />
            )
          )}
        </div>
      )}
      {compareOpen && <RecipeComparison entries={selected} onClose={() => setCompareOpen(false)} />}
      {history && (
        <Sheet
          open
          onClose={() => setHistoryId(null)}
          title={`Brassins de ${history.name}`}
          subtitle={`Recette V${history.version} · ${history.linkedBatches.length} lot(s) associé(s)`}
          className="md:max-w-2xl md:mx-auto"
        >
          <div className="space-y-3">
            {history.linkedBatches.some(isArchived) && (
              <button
                type="button"
                aria-pressed={historyArchives}
                onClick={() => setHistoryArchives(!historyArchives)}
                className="min-h-touch px-3 rounded-control border border-water/40 text-water text-sm"
              >
                {historyArchives
                  ? 'Masquer les brassins archivés'
                  : `Afficher les brassins archivés (${history.linkedBatches.filter(isArchived).length})`}
              </button>
            )}
            {!historyArchives && history.linkedBatches.every(isArchived) && (
              <p className="text-sm text-cave-400">
                Tous les brassins associés sont dans Archives. Leur historique est conservé.
              </p>
            )}
            {batchEntries(history.linkedBatches)
              .filter((e) => historyArchives || !isArchived(e))
              .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0))
              .map((entry) => (
                <BatchCard
                  key={entry.id}
                  entry={entry}
                  onFavorite={onFavorite}
                  onArchive={onArchive}
                  onOpen={(batch, section) => {
                    setHistoryId(null);
                    onOpenBatch(batch, section);
                  }}
                  onBrew={(batch) => {
                    setHistoryId(null);
                    onOpenBrewDay(batch);
                  }}
                />
              ))}
          </div>
        </Sheet>
      )}
    </div>
  );
}
