import React from 'react';
import { ChevronRight, Tag } from 'lucide-react';
import { Batch, StockItem } from '../types';
import { Units } from '../services/units';
import { computeStockLevel, allocatedBatches, pendingStockQuantity } from '../domain/stockLevel';
import { LevelGauge } from './LevelGauge';
import { FavoriteToggle } from './EntityList';
import { useMobileLayout } from './useViewport';

/**
 * Ligne de stock — **une seule** pour toutes les catégories.
 *
 * ⚠️ Elle remplace cinq fonctions écrites à la main (`renderMaltCard`,
 * `renderHopCard`, `renderYeastCard`, `renderAdjunctCard`, `renderCleaningCard`).
 * Chacune codait en dur son unité, son pas d'incrément, et seule celle du malt
 * portait une jauge. C'est de là que venait le houblon affiché « 20000g » : le
 * code multipliait par 1000 en supposant des kilos, alors que le houblon est
 * stocké en grammes.
 *
 * Ici, plus aucune supposition : l'unité de l'article pilote le formatage, les
 * pas et les conversions. Ajouter une catégorie de stock ne demande aucun
 * nouveau composant.
 */

interface StockRowProps {
  item: StockItem;
  batches: Batch[];
  stockItems?: StockItem[];
  onOpen: (item: StockItem) => void;
  onQuickAdjust: (item: StockItem, delta: number) => void;
  onToggleFavorite: (item: StockItem) => void;
}

export const StockRow: React.FC<StockRowProps> = ({
  item,
  batches,
  stockItems,
  onOpen,
  onQuickAdjust,
  onToggleFavorite
}) => {
  const mobile = useMobileLayout();
  const level = computeStockLevel(item, batches, stockItems);
  const allocated = allocatedBatches(item, batches, stockItems);
  const pending = batches.reduce((sum, batch) => sum + pendingStockQuantity(item, batch), 0);
  const ladder = Units.stepLadder(item.unit);

  // Repère du minimum sur la jauge, à la même échelle qu'elle (3 brassins).
  const minMarker =
    level.perBatch && level.perBatch > 0 && item.minStock > 0
      ? Math.min(100, (item.minStock / level.perBatch / 3) * 100)
      : undefined;

  if(mobile) return <article className="panel flex items-start overflow-hidden">
    <button type="button" aria-label={`Ouvrir ${item.name}`} onClick={()=>onOpen(item)} className="min-w-0 flex-1 p-3 text-left">
      <span className="flex items-start justify-between gap-3"><strong className="min-w-0 text-base leading-snug break-words">{item.name}</strong><span className="shrink-0 text-base tabular-nums">{Units.format(item.currentStock,item.unit)}</span></span>
      <span className={`block text-sm mt-1 ${level.tone==='alert'?'text-alert':level.tone==='straw'?'text-ebc-straw':'text-cave-400'}`}>{item.alphaPct?`${item.alphaPct}% AA · `:''}{level.label}</span>
      <span className="block mt-2"><LevelGauge level={level} minMarkerPercent={minMarker} compact/></span>
      {pending>0&&<span className="block text-sm text-ebc-straw mt-1">{Units.format(pending,item.unit)} réservés</span>}
    </button>
    <div className="pt-1"><FavoriteToggle active={!!item.favorite} onToggle={()=>onToggleFavorite(item)} label={item.name}/></div>
  </article>;

  return (
    <article className="panel overflow-hidden">
      <button
        type="button"
        onClick={() => onOpen(item)}
        className="w-full text-left px-3 sm:px-4 pt-2.5 pb-2 sm:pt-3.5 sm:pb-3 hover:bg-cave-850/50 transition-colors"
      >
        <div className="flex items-start gap-2.5 sm:gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm sm:text-base font-semibold text-cave-50 leading-snug truncate">
              {item.name}
            </h3>
            <p className="text-xs sm:text-sm text-cave-400 mt-0.5 truncate">
              {item.category}
              {item.alphaPct ? ` · ${item.alphaPct}% AA` : ''}
              {item.supplier ? ` · ${item.supplier}` : ''}
            </p>
          </div>

          {/* Le stock, formaté selon l'unité de l'article — jamais convertie à l'aveugle */}
          <div className="text-right shrink-0">
            <div className="reading text-base sm:text-lg text-cave-50 leading-none">
              {Units.round(item.currentStock, item.unit)}
            </div>
            <div className="text-xs sm:text-sm text-cave-400 leading-none mt-1">{item.unit}</div>
          </div>

          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-cave-400 shrink-0 mt-0.5" />
        </div>

        <div className="mt-2 sm:mt-3">
          <LevelGauge level={level} minMarkerPercent={minMarker} />
          {pending > 0 && <p className="text-xs text-cave-400 mt-1">Couverture après {Units.format(pending, item.unit)} réservés en fermentation.</p>}
        </div>

        {allocated.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {allocated.map((b) => (
              <span
                key={b.id}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-control
                           bg-water/10 border border-water/30 text-water text-xs sm:text-sm"
              >
                <Tag className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                {b.name} · {Units.format(b.qty, item.unit)}
              </span>
            ))}
          </div>
        )}
      </button>

      <div className="flex items-center border-t border-cave-800">
        <FavoriteToggle
          active={!!item.favorite}
          onToggle={() => onToggleFavorite(item)}
          label={item.name}
        />

        <button
          type="button"
          onClick={() => onOpen(item)}
          className="flex-1 min-h-touch px-2.5 sm:px-3 text-left text-xs sm:text-sm text-cave-400
                     hover:text-cave-200 transition-colors truncate"
        >
          {item.currentStock <= 0
            ? 'Épuisé — à commander'
            : `Corriger l’inventaire · min. ${Units.format(item.minStock, item.unit)}`}
        </button>
      </div>
    </article>
  );
};
