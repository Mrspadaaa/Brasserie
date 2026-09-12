import React from 'react';
import { Check, Pencil, ChevronRight, Archive } from 'lucide-react';
import { FavoriteToggle } from '../EntityList';
import { BeerStyleTag } from '../BeerStyleTag';
import { CatalogItemMenu } from './CatalogItemMenu';
import type { Batch, Recipe } from '../../types';
import { catalogNumber, type CatalogEntry } from '../../domain/productionCatalog';
import { statusOf } from '../../domain/batchStatus';
import { fermentationReadings } from '../../domain/fermentationReadings';
import {
  batchNextAction,
  daysSinceBrew,
  missingBatchMeasurements,
  recipeSignature,
  type BatchDetailSection
} from '../../domain/productionInsights';

const number = (value: number | undefined, digits = 1) =>
  value === undefined
    ? '—'
    : value.toLocaleString('fr-CH', {
        minimumFractionDigits: digits === 3 ? 3 : 0,
        maximumFractionDigits: digits === 3 ? 5 : digits
      });
function Measure({
  label,
  value,
  detail
}: {
  label: string;
  value: React.ReactNode;
  detail?: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-sm text-cave-400">{label}</dt>
      <dd className="mt-0.5 text-base font-semibold tabular-nums text-cave-50">{value}</dd>
      {detail && <dd className="text-sm text-cave-400 mt-0.5">{detail}</dd>}
    </div>
  );
}
export function RecipeCard({
  entry,
  onOpen,
  onEdit,
  onHistory,
  onFavorite,
  onArchive,
  comparing,
  selected,
  disabled,
  onSelect,
  compact = false
}: {
  entry: CatalogEntry;
  onOpen: (r: Recipe) => void;
  onEdit: (r: Recipe) => void;
  onHistory: (e: CatalogEntry) => void;
  onFavorite: (e: CatalogEntry) => void;
  onArchive: (e: CatalogEntry, archived: boolean) => void;
  comparing: boolean;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
  compact?: boolean;
}) {
  const recipe = entry.recipe!,
    signature = recipeSignature(recipe);
  if (compact) return <article className={`panel overflow-hidden ${selected ? 'ring-1 ring-ebc-straw' : ''}`} aria-label={`Recette ${entry.name}, version ${entry.version}`}>
    <div className="flex gap-1 px-3 pt-3">
      <button type="button" onClick={() => onOpen(recipe)} aria-label={`Ouvrir la recette ${entry.name}`} className="flex min-w-0 flex-1 gap-2.5 text-left min-h-touch">
        <span className={`w-1 self-stretch rounded-full shrink-0 ${entry.swatch ?? 'bg-cave-700'}`} aria-hidden="true"/>
        <span className="min-w-0"><strong className="block text-base font-semibold text-cave-50 leading-snug">{entry.name}</strong>
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-cave-400 mt-1"><BeerStyleTag style={entry.style}/><span>V{entry.version}{entry.archivedAt ? ' · Archivée' : ''}</span></span>
          <span className="block text-sm text-cave-200 mt-1 tabular-nums">{number(entry.volumeL)} L · {recipe.nolo?.enabled ? `NOLO ≤ ${number(recipe.nolo.targetAbvPct)} %` : `${number(entry.abv)} %`} · {number(entry.ibu)} IBU</span>
        </span>
      </button>
      {comparing ? <button type="button" role="checkbox" aria-checked={selected} aria-label={`Comparer ${entry.name}, V${entry.version}`} disabled={disabled} onClick={onSelect}
        className={`touch-target self-start rounded-control border ${selected ? 'border-ebc-straw text-ebc-straw' : 'border-cave-700 text-cave-400 disabled:opacity-30'}`}>{selected ? <Check size={19}/> : <span className="h-4 w-4 rounded border border-current"/>}</button>
        : <FavoriteToggle active={entry.favorite} onToggle={() => onFavorite(entry)} label={`la recette ${entry.name}, V${entry.version}`}/>}
    </div>
    <details className="group/card px-3">
      <summary className="list-none cursor-pointer min-h-touch flex items-center justify-between text-sm text-cave-400">Détails et actions<ChevronRight size={16} className="group-open/card:rotate-90"/></summary>
      <div className="pb-3 space-y-2">
        <p className="text-sm text-hop">{entry.hops.length ? entry.hops.join(', ') : 'Sans houblon renseigné'}</p>
        <p className="text-sm text-cave-200">{signature.yeast || 'Levure à préciser'} · {number(signature.grainKg)} kg de grain · {number(signature.dryHopPerL,2)} g/L à cru</p>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="min-h-touch text-sm text-ebc-straw px-1" aria-label={`Modifier la recette ${entry.name}`} onClick={() => onEdit(recipe)}>Modifier</button>
          {entry.linkedBatches.length > 0 ? <button type="button" className="min-h-touch text-sm text-water px-1" aria-label={`Voir les brassins de ${entry.name}, V${entry.version}`} onClick={() => onHistory(entry)}>{entry.linkedBatches.length} brassin{entry.linkedBatches.length > 1 ? 's' : ''}</button> : <span className="text-sm text-cave-400">Sans brassin associé</span>}
          <CatalogItemMenu entry={entry} onArchive={onArchive}/>
        </div>
      </div>
    </details>
  </article>;
  return (
    <article
      className={`panel overflow-hidden ${selected ? 'ring-1 ring-ebc-straw' : ''}`}
      aria-label={`Recette ${entry.name}, version ${entry.version}`}
    >
      <div className="flex gap-2 px-4 pt-4">
        <button
          type="button"
          className="flex gap-3 text-left min-w-0 flex-1 min-h-touch"
          onClick={() => onOpen(recipe)}
          aria-label={`Ouvrir la recette ${entry.name}`}
        >
          <span
            className={`w-2 self-stretch rounded-full shrink-0 ${entry.swatch ?? 'bg-cave-700'}`}
            aria-hidden
          />
          <span className="min-w-0 flex-1">
            <span className="block text-sm text-cave-400">
              <BeerStyleTag style={entry.style}/>{' '}
              <span className="text-cave-200">· V{entry.version}</span>
            </span>
            <span className="flex items-center gap-2 mt-0.5">
              <span className="text-lg font-semibold text-cave-50 break-words leading-snug">
                {entry.name}
              </span>
            </span>
            {entry.archivedAt && (
              <span className="inline-flex items-center gap-1 text-sm text-water mt-1">
                <Archive className="w-3.5 h-3.5" />
                Archivée
              </span>
            )}
          </span>
        </button>
        {comparing ? (
          <button
            type="button"
            role="checkbox"
            aria-checked={selected}
            aria-label={`Comparer ${entry.name}, V${entry.version}`}
            onClick={onSelect}
            disabled={disabled}
            className={`touch-target rounded-control border self-start ${selected ? 'border-ebc-straw bg-ebc-straw text-cave-950' : 'border-cave-700 text-cave-400 disabled:opacity-30'}`}
          >
            {selected ? (
              <Check className="h-5 w-5" />
            ) : (
              <span className="w-4 h-4 border border-current rounded" aria-hidden />
            )}
          </button>
        ) : (
          <div className="shrink-0 flex flex-col items-center">
            <FavoriteToggle
              active={entry.favorite}
              onToggle={() => onFavorite(entry)}
              label={`la recette ${entry.name}, V${entry.version}`}
            />
            <span className="text-sm text-cave-200">{number(entry.volumeL)} L</span>
          </div>
        )}
      </div>
      <dl className="grid grid-cols-3 gap-3 mx-4 mt-4 pb-3 border-b border-cave-800">
        <Measure label={recipe.nolo?.enabled ? 'Cible NOLO' : 'Alcool cible'} value={recipe.nolo?.enabled ? `≤ ${number(recipe.nolo.targetAbvPct)} %` : `${number(entry.abv)} %`} />
        <Measure label="Amertume" value={`${number(entry.ibu)} IBU`} />
        <Measure label="À cru" value={`${number(signature.dryHopPerL, 2)} g/L`} />
      </dl>
      <div className="px-4 pt-3 pb-2 space-y-1 text-sm">
        <p className="text-hop break-words">
          {entry.hops.length ? entry.hops.join(', ') : 'Sans houblon renseigné'}
        </p>
        <p className="text-cave-400 break-words">
          {signature.yeast || 'Levure à préciser'} · {number(signature.grainKg)} kg de grain
        </p>
      </div>
      <div className="flex justify-between items-center gap-2 px-4 pb-1">
        {entry.linkedBatches.length ? (
          <button
            type="button"
            onClick={() => onHistory(entry)}
            aria-label={`Voir les brassins de ${entry.name}, V${entry.version}`}
            className="min-h-touch text-sm text-water inline-flex items-center gap-1"
          >
            {entry.linkedBatches.length} brassin
            {entry.linkedBatches.length > 1 ? 's' : ''}
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <span className="text-sm text-cave-400">Sans brassin associé</span>
        )}
        <div className="flex items-center shrink-0 gap-1">
          <button
            type="button"
            className="min-h-touch px-1 rounded-control text-ebc-straw inline-flex items-center gap-2 text-sm"
            onClick={() => onEdit(recipe)}
            aria-label={`Modifier la recette ${entry.name}`}
          >
            <Pencil className="h-4 w-4" />
            Modifier
          </button>
          <CatalogItemMenu entry={entry} onArchive={onArchive} />
        </div>
      </div>
    </article>
  );
}

export function BatchCard({
  entry,
  onOpen,
  onBrew,
  onFavorite,
  onArchive,
  compact = false
}: {
  entry: CatalogEntry;
  onOpen: (b: Batch, section?: BatchDetailSection) => void;
  onBrew: (b: Batch) => void;
  onFavorite: (e: CatalogEntry) => void;
  onArchive: (e: CatalogEntry, archived: boolean) => void;
  compact?: boolean;
}) {
  const batch = entry.batch!,
    status = statusOf(batch.status),
    action = batchNextAction(batch);
  const readings = fermentationReadings(batch),
    latest = readings.points.at(-1),
    missing = missingBatchMeasurements(batch);
  const days = daysSinceBrew(batch),
    planned = batch.status === 'planifie',
    active = batch.status === 'fermentation' || batch.status === 'garde';
  const target = batch.recipeSnapshot;
  const dayLabel =
    days !== undefined && days >= 0 && active
      ? `J+${days} depuis brassage`
      : entry.date || 'Date à renseigner';
  const context = missing.length
    ? `${missing.join(' et ')} à renseigner`
    : planned
      ? batch.brewDay?.startedAt && !batch.brewDay.finishedAt
        ? 'Brassage en cours'
        : `Brassage prévu ${entry.date ? `le ${entry.date}` : 'sans date'}`
      : active
        ? latest
          ? `${latest.date} : ${number(latest.sg, 3)}${latest.tempC !== undefined ? ` à ${number(latest.tempC)} °C` : ''}`
          : 'Aucun relevé enregistré'
        : batch.notesTasting?.trim() ||
          (batch.status === 'annule'
            ? 'Historique conservé'
            : 'Pas encore de retour de dégustation');
  if (compact) return <article className="panel overflow-hidden" aria-label={`Brassin ${entry.id}, ${entry.name}`}>
    <div className="flex gap-1 px-3 pt-3">
      <button type="button" className="min-w-0 flex-1 text-left min-h-touch" aria-label={`Ouvrir le brassin ${entry.id}`} onClick={() => onOpen(batch)}>
        <span className="flex flex-wrap items-center justify-between gap-1"><span className="text-xs text-cave-400">{entry.id}{entry.archivedAt ? ' · Archivé' : ''}</span><span className={`text-xs rounded-full px-2 py-0.5 border ${status.chip}`}>{status.label}</span></span>
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1"><strong className="text-base font-semibold text-cave-50 leading-snug">{entry.name}</strong>{entry.style && <BeerStyleTag style={entry.style}/>}</span>
        <span className="block text-sm text-cave-200 mt-1">{dayLabel} · {active && readings.latest !== undefined ? `SG ${number(readings.latest,3)}` : `${number(entry.volumeL)} L prévus`}</span>
      </button>
      <FavoriteToggle active={entry.favorite} onToggle={() => onFavorite(entry)} label={`le brassin ${entry.id}`}/>
    </div>
    {missing.length > 0 && <p className="text-xs text-ebc-straw px-3 pt-2">{context}</p>}
    <div className="flex items-center gap-1 px-3">
      <button type="button" onClick={() => action.brew ? onBrew(batch) : onOpen(batch,action.section)} aria-label={`${action.label} · ${entry.id}`}
        className="min-h-touch min-w-0 flex-1 text-left text-sm font-medium text-ebc-straw">{action.label}</button>
      <CatalogItemMenu entry={entry} onArchive={onArchive}/>
    </div>
  </article>;
  return (
    <article className="panel overflow-hidden" aria-label={`Brassin ${entry.id}, ${entry.name}`}>
      <div className="flex gap-1 px-4 pt-4">
        <button
          type="button"
          className="min-w-0 flex-1 min-h-touch flex gap-3 text-left"
          onClick={() => onOpen(batch)}
          aria-label={`Ouvrir le brassin ${entry.id}`}
        >
          <span
            className={`w-2 self-stretch shrink-0 rounded-full ${entry.swatch ?? 'bg-cave-700'}`}
            aria-hidden
          />
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap justify-between items-center gap-1.5">
              <span className="text-sm text-cave-400 break-all">{entry.id}</span>
              <span className={`text-sm border rounded-full px-2 py-0.5 ${status.chip}`}>
                {status.label}
              </span>
            </span>
            <span className="flex flex-wrap items-center gap-2 mt-1">
              <span className="font-semibold text-lg text-cave-50 break-words leading-snug">{entry.name}</span>
              {entry.style && <BeerStyleTag style={entry.style}/>}
            </span>
            <span className="block text-sm text-cave-400 mt-1">{dayLabel}</span>
            {entry.archivedAt && (
              <span className="inline-flex items-center gap-1 text-sm text-water mt-1">
                <Archive className="w-3.5 h-3.5" />
                Archivé
              </span>
            )}
          </span>
        </button>
        <FavoriteToggle
          active={entry.favorite}
          onToggle={() => onFavorite(entry)}
          label={`le brassin ${entry.id}`}
        />
      </div>
      {batch.status !== 'annule' && (
        <dl className="grid grid-cols-3 gap-2 px-4 py-4">
          {planned ? (
            <>
              <Measure label="Volume visé" value={`${number(entry.volumeL)} L`} />
              <Measure label="OG cible" value={number(target?.ogTarget, 3)} />
              <Measure label="Alcool cible" value={(batch.nolo??target?.nolo)?.enabled ? `NOLO ≤ ${number((batch.nolo??target?.nolo)?.targetAbvPct)} %` : `${number(target?.abvTarget)} %`} />
            </>
          ) : active ? (
            <>
              <Measure
                label="OG mesurée"
                value={number(catalogNumber(batch.og), 3)}
                detail={target ? `cible ${number(target.ogTarget, 3)}` : undefined}
              />
              <Measure
                label="Dernière SG"
                value={number(readings.latest, 3)}
                detail={target ? `FG visée ${number(target.fgTarget, 3)}` : undefined}
              />
              <Measure
                label="En cuve"
                value={`${number(batch.volumeBrewedL)} L`}
                detail={`${number(entry.volumeL)} L prévus`}
              />
            </>
          ) : (
            <>
              <Measure
                label="FG mesurée"
                value={number(catalogNumber(batch.fg), 3)}
                detail={target ? `cible ${number(target.fgTarget, 3)}` : undefined}
              />
              <Measure label="Alcool" value={(batch.nolo??target?.nolo)?.enabled ? <button type="button" className="min-h-touch text-xs underline" onClick={()=>onOpen(batch,'measurements')}>Analyse NOLO</button> : `${number(entry.abv)} %`} />
              <Measure label="Conditionné" value={`${number(batch.volumePackagedL)} L`} />
            </>
          )}
        </dl>
      )}
      <div className="border-t border-cave-800 mx-4 py-2">
        <p
          className={`text-sm line-clamp-2 ${missing.length ? 'text-ebc-straw' : 'text-cave-400'}`}
        >
          {context}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => (action.brew ? onBrew(batch) : onOpen(batch, action.section))}
            aria-label={`${action.label} · ${entry.id}`}
            className="min-h-touch flex-1 inline-flex items-center justify-between gap-2 text-sm font-semibold text-ebc-straw"
          >
            {action.label}
            <ChevronRight className="h-4 w-4 shrink-0" />
          </button>
          <CatalogItemMenu entry={entry} onArchive={onArchive} />
        </div>
      </div>
    </article>
  );
}
