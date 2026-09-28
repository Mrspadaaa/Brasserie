import React, { useId } from 'react';
import { Batch, StockItem } from '../types';
import { Units } from '../services/units';
import { computeStockLevel, pendingStockSummary, type RecipeStockComparison } from '../domain/stockLevel';
import { FavoriteToggle } from './EntityList';
import { LevelGauge, stockLevelLabel } from './LevelGauge';

interface StockRowProps {
  item: StockItem;
  batches: Batch[];
  stockItems?: StockItem[];
  onOpen: (item: StockItem) => void;
  /** Besoin prévu de la recette sélectionnée, converti dans l'unité de l'article. */
  comparison?: RecipeStockComparison;
  /** Ancien appel conservé pour les aperçus ; toute correction passe par la fiche. */
  onQuickAdjust?: (item: StockItem, delta: number) => void;
  onToggleFavorite: (item: StockItem) => void;
}

const quantity = (value: number | null, unit: string | null) =>
  value === null || !unit ? 'Inconnu' : Units.format(value, unit);

function ComparisonBar({ comparison }: { comparison: RecipeStockComparison }) {
  const { physical, reserved, available, quantity: needed, shortage, unit } = comparison;
  if ([physical, reserved, available, needed, shortage].some(value => value === null) || !unit) return null;
  const scale = Math.max(physical!, reserved! + needed!, 0);
  if (scale <= 0) return null;
  const reservedWidth = reserved! / scale * 100;
  const coveredNeed = Math.min(needed!, available!);
  const needWidth = coveredNeed / scale * 100;
  const freeWidth = Math.max(0, available! - needed!) / scale * 100;
  const shortageWidth = shortage! / scale * 100;
  return <div aria-hidden="true" className="flex h-2.5 overflow-hidden rounded-sm border border-cave-700 bg-cave-800">
    {reservedWidth > 0 && <span className="bg-water" style={{ width: `${reservedWidth}%` }} />}
    {needWidth > 0 && <span className="bg-attention" style={{ width: `${needWidth}%` }} />}
    {freeWidth > 0 && <span className="border-r-2 border-cave-50 bg-hop" style={{ width: `${freeWidth}%` }} />}
    {shortageWidth > 0 && <span className="bg-alert" style={{ width: `${shortageWidth}%` }} />}
  </div>;
}

function RecipeComparison({ comparison }: { comparison: RecipeStockComparison }) {
  const { quantity: needed, unit, reserved, available, shortage, issue, availabilityIssue } = comparison;
  return <div className="mt-1.5 space-y-1 border-t border-cave-800 pt-1.5">
    {comparison.ingredientNames.some(name => name.trim().toLocaleLowerCase() !== comparison.label.trim().toLocaleLowerCase()) &&
      <p className="text-xs text-cave-400 break-words">Recette : {comparison.ingredientNames.join(' · ')}</p>}
    <ComparisonBar comparison={comparison} />
    <dl className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs sm:grid-cols-4">
      <div><dt className="text-cave-400">Réservé</dt><dd className="font-mono tabular-nums text-cave-200">{quantity(reserved, unit)}</dd></div>
      <div><dt className="text-cave-400">Libre</dt><dd className="font-mono tabular-nums text-cave-50">{quantity(available, unit)}</dd></div>
      <div><dt className="text-cave-400">Besoin prévu</dt><dd className="font-mono tabular-nums text-cave-200">{quantity(needed, unit)}</dd></div>
      <div><dt className="text-cave-400">Manque</dt><dd className={`font-mono tabular-nums ${shortage === null ? 'text-cave-200' : shortage > 0 ? 'text-alert-strong' : 'text-hop'}`}>{quantity(shortage, unit)}</dd></div>
    </dl>
    {issue && <p className="text-xs text-attention">{issue}</p>}
    {availabilityIssue && <p className="text-xs text-attention">{availabilityIssue}</p>}
  </div>;
}

/** Nom et quantité, puis niveau : même lecture compacte au téléphone et au bureau. */
export const StockRow: React.FC<StockRowProps> = ({ item, batches, stockItems, onOpen, onToggleFavorite, comparison }) => {
  const descriptionId = useId();
  const level = computeStockLevel(item, batches, stockItems);
  const pending = pendingStockSummary(item, batches);
  const pendingDescription = pending.known
    ? pending.knownQuantity > 0 ? `${Units.format(pending.knownQuantity, item.unit)} réservés en fermentation` : ''
    : `${pending.knownQuantity > 0 ? `Au moins ${Units.format(pending.knownQuantity, item.unit)} réservés · ` : ''}quantité réservée inconnue`;
  const comparisonDescription = comparison
    ? `Besoin prévu ${quantity(comparison.quantity, comparison.unit)} · réservé ${quantity(comparison.reserved, comparison.unit)} · libre ${quantity(comparison.available, comparison.unit)} · manque ${quantity(comparison.shortage, comparison.unit)}`
    : '';
  return (
    <article className="flex items-start rounded-control border border-cave-800 bg-cave-900">
      <div className="min-w-0 flex-1">
        <button type="button" className="block w-full min-w-0 rounded-control px-2 py-1.5 text-left hover:bg-cave-850"
          onClick={() => onOpen(item)} aria-label={`Ouvrir ${item.name}`} aria-describedby={descriptionId}>
          <span className="flex items-baseline justify-between gap-2">
            <span className="min-w-0 text-sm font-semibold leading-snug text-cave-50 break-words">{item.name}</span>
            <span className="shrink-0 text-sm font-mono tabular-nums text-cave-50">{comparison ? `Physique · ${Units.format(item.currentStock, item.unit)}` : Units.format(item.currentStock, item.unit)}</span>
          </span>
          {!comparison && <span className="mt-0.5 block"><LevelGauge level={level} compact /></span>}
        </button>
        {comparison
          ? <div className="px-2 pb-1.5"><RecipeComparison comparison={comparison} /></div>
          : pendingDescription && <p className={`mt-0.5 px-2 pb-1.5 text-xs ${pending.known ? 'text-water' : 'text-attention'}`}>{pendingDescription}</p>}
      </div>
      <span id={descriptionId} className="sr-only">{Units.format(item.currentStock, item.unit)} · {comparisonDescription || stockLevelLabel(level)}{!comparison && pendingDescription ? ` · ${pendingDescription}` : ''}</span>
      <div className="pt-1 pr-1"><FavoriteToggle active={!!item.favorite} onToggle={() => onToggleFavorite(item)} label={item.name} /></div>
    </article>
  );
};
