import React, { useId } from 'react';
import { Batch, StockItem } from '../types';
import { Units } from '../services/units';
import { computeStockLevel, pendingStockQuantity } from '../domain/stockLevel';
import { FavoriteToggle } from './EntityList';
import { LevelGauge, stockLevelLabel } from './LevelGauge';

interface StockRowProps {
  item: StockItem;
  batches: Batch[];
  stockItems?: StockItem[];
  onOpen: (item: StockItem) => void;
  /** Ancien appel conservé pour les aperçus ; toute correction passe par la fiche. */
  onQuickAdjust?: (item: StockItem, delta: number) => void;
  onToggleFavorite: (item: StockItem) => void;
}

/** Nom et quantité, puis niveau : même lecture compacte au téléphone et au bureau. */
export const StockRow: React.FC<StockRowProps> = ({ item, batches, stockItems, onOpen, onToggleFavorite }) => {
  const descriptionId = useId();
  const level = computeStockLevel(item, batches, stockItems);
  const pending = batches.reduce((sum, batch) => sum + pendingStockQuantity(item, batch), 0);
  return (
    <article className="flex items-start rounded-control border border-cave-800 bg-cave-900">
      <button type="button" className="min-w-0 flex-1 px-2 py-1.5 text-left rounded-control hover:bg-cave-850"
        onClick={() => onOpen(item)} aria-label={`Ouvrir ${item.name}`} aria-describedby={descriptionId}>
        <span className="flex items-baseline justify-between gap-2">
          <span className="min-w-0 text-sm font-semibold leading-snug text-cave-50 break-words">{item.name}</span>
          <span className="shrink-0 text-sm font-mono tabular-nums text-cave-50">{Units.format(item.currentStock, item.unit)}</span>
        </span>
        <span className="mt-0.5 block"><LevelGauge level={level} compact /></span>
        {pending > 0 && <span className="mt-0.5 block text-xs text-water">{Units.format(pending, item.unit)} réservés en fermentation</span>}
      </button>
      <span id={descriptionId} className="sr-only">{Units.format(item.currentStock, item.unit)} · {stockLevelLabel(level)}{pending > 0 ? ` · ${Units.format(pending, item.unit)} réservés en fermentation` : ''}</span>
      <div className="pt-1 pr-1"><FavoriteToggle active={!!item.favorite} onToggle={() => onToggleFavorite(item)} label={item.name} /></div>
    </article>
  );
};
