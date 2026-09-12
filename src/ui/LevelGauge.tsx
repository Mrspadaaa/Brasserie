import React from 'react';
import { StockLevel } from '../domain/stockLevel';

/**
 * Jauge de niveau de stock, en couverture de brassins.
 *
 * Elle remplace la barre qui n'existait que sur les malts. Le repère n'est plus
 * un seuil arbitraire mais ce que consomment réellement les brassins planifiés :
 * deux kilos de malt torréfié, c'est trois brassins d'avance ; deux kilos de
 * malt de base, c'est un tiers de brassin.
 *
 * Quand rien ne permet de calculer une couverture, la jauge le DIT au lieu de
 * s'afficher pleine — un niveau inventé serait pire que pas de niveau.
 */

const TONE_BAR: Record<StockLevel['tone'], string> = {
  alert: 'bg-alert',
  straw: 'bg-ebc-straw',
  hop: 'bg-hop',
  muted: 'bg-cave-700'
};

const TONE_TEXT: Record<StockLevel['tone'], string> = {
  alert: 'text-alert',
  straw: 'text-ebc-straw',
  hop: 'text-hop',
  muted: 'text-cave-400'
};

function sourceLabel(source: StockLevel['source']): string {
  switch (source) {
    case 'planifie':
      return 'selon les brassins planifiés';
    case 'historique':
      return "d'après l'historique";
    case 'minStock':
      return 'seuil minimum';
    default:
      return '';
  }
}

interface LevelGaugeProps {
  level: StockLevel;
  /** Position du stock minimum sur la jauge, en pourcentage. */
  minMarkerPercent?: number;
  /** Version compacte pour les lignes de liste. */
  compact?: boolean;
}

/** Un seuil minimum ne constitue pas une consommation mesurée de brassin. */
export function stockLevelLabel(level: StockLevel): string {
  if (level.source !== 'minStock' || level.band === 'rupture') return level.label;
  if (level.band === 'juste') return 'Sous le seuil';
  return `${level.coverage?.toLocaleString('fr-CH', { maximumFractionDigits: 1 })} × le seuil`;
}

export const LevelGauge: React.FC<LevelGaugeProps> = ({
  level,
  minMarkerPercent,
  compact = false
}) => {
  const label = stockLevelLabel(level);
  const known = level.source !== 'aucune';
  return (
  <div className={compact ? 'flex min-w-0 items-center gap-1.5' : 'w-full space-y-1'}>
    <div
      className={`relative h-1.5 rounded-full bg-cave-850 overflow-hidden border border-cave-700 ${compact ? 'w-12 shrink-0' : 'w-full'} ${known ? '' : 'border-dashed'}`}
      role={known ? 'meter' : undefined}
      aria-valuenow={known ? Math.round(level.fillPercent) : undefined}
      aria-valuemin={known ? 0 : undefined}
      aria-valuemax={known ? 100 : undefined}
      aria-valuetext={known ? label : undefined}
      aria-label={known ? (level.source === 'minStock' ? 'Niveau face au seuil minimum' : 'Couverture des brassins') : undefined}
      aria-hidden={known ? undefined : true}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-300 ${TONE_BAR[level.tone]}`}
        style={{ width: `${known ? level.fillPercent : 0}%` }}
      />

      {/* Repère du stock minimum : indicatif, il ne pilote pas la jauge. */}
      {minMarkerPercent !== undefined && minMarkerPercent > 0 && minMarkerPercent < 100 && (
        <span
          className="absolute top-0 bottom-0 w-px bg-cave-200/60"
          style={{ left: `${minMarkerPercent}%` }}
          title="Stock minimum"
        />
      )}
    </div>

      <div className="flex items-baseline gap-2 min-w-0 flex-wrap">
        <span className={`text-xs leading-snug ${TONE_TEXT[level.tone]}`}>{label}</span>
        {!compact && level.source !== 'aucune' && level.perBatch !== null && (
          <span
            className="hidden sm:inline text-footnote text-cave-400 shrink-0 ml-auto"
            title={sourceLabel(level.source)}
          >
            {sourceLabel(level.source)}
          </span>
        )}
      </div>
  </div>
  );
};

/** Pastille de niveau, pour les endroits où la jauge complète ne tient pas. */
export const LevelDot: React.FC<{ level: StockLevel }> = ({ level }) => (
  <span
    className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${TONE_BAR[level.tone]}`}
    title={stockLevelLabel(level)}
    aria-label={stockLevelLabel(level)}
  />
);
