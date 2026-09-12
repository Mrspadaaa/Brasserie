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

export const LevelGauge: React.FC<LevelGaugeProps> = ({
  level,
  minMarkerPercent,
  compact = false
}) => (
  <div className="w-full space-y-1">
    <div
      className="relative w-full h-2 rounded-full bg-cave-850 overflow-hidden border border-cave-800"
      role="meter"
      aria-valuenow={Math.round(level.fillPercent)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={level.label}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-300 ${TONE_BAR[level.tone]}`}
        style={{ width: `${level.fillPercent}%` }}
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

    {!compact && (
      <div className="flex items-baseline gap-2 min-w-0">
        <span className={`text-sm truncate ${TONE_TEXT[level.tone]}`}>{level.label}</span>
        {level.source !== 'aucune' && level.perBatch !== null && (
          <span
            className="hidden sm:inline text-footnote text-cave-400 shrink-0 ml-auto"
            title={sourceLabel(level.source)}
          >
            {sourceLabel(level.source)}
          </span>
        )}
      </div>
    )}
  </div>
);

/** Pastille de niveau, pour les endroits où la jauge complète ne tient pas. */
export const LevelDot: React.FC<{ level: StockLevel }> = ({ level }) => (
  <span
    className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${TONE_BAR[level.tone]}`}
    title={level.label}
    aria-label={level.label}
  />
);
