import React from 'react';
import type { HopRecipePrediction } from '../../../functions/src/hopRecipePrediction';
import type { HopRange } from '../../../functions/src/hopIndexSchema';
import { HOP_ANALYTE_LABELS } from '../../domain/hopIndex/labels';
import { HOP_CONFIDENCE_LABELS } from './presentation';
import { HopSourceLink } from './HopTechnicalPanel';

const number = (n: number) => n.toLocaleString('fr-FR', { maximumSignificantDigits: 4 });
const boundFormatter = (roundingMode: 'floor' | 'ceil') => {
  const options: Intl.NumberFormatOptions & { roundingMode: 'floor' | 'ceil' } = { maximumSignificantDigits: 4, roundingMode };
  const formatter = new Intl.NumberFormat('fr-FR', options);
  // Older browsers must preserve the value rather than silently round inward.
  const supported = (formatter.resolvedOptions() as unknown as { roundingMode?: string }).roundingMode === roundingMode;
  return (value: number) => supported ? formatter.format(value) : value.toLocaleString('fr-FR', { maximumSignificantDigits: 21 });
};
const lowerBound = boundFormatter('floor'), upperBound = boundFormatter('ceil');
export function hopChemicalRangeLabel(range: HopRange) {
  return Number.isFinite(range.min) && Number.isFinite(range.max) && range.min <= range.max
    ? `${lowerBound(range.min)}–${upperBound(range.max)}` : 'Non quantifiable';
}

/** Introduced analytical amounts are kept apart from final beer concentrations. */
export function HopRecipeChemistry({ chemistry, finalLabel = 'Dans la bière après fermentation' }: { chemistry: HopRecipePrediction['chemistry']; finalLabel?: string }) {
  const maxima = Object.fromEntries(['mg', 'ug', 'mL'].map(unit => [unit, Math.max(0, ...Object.values(chemistry.introduced).filter(a => a.unit === unit).map(a => a.range?.max ?? a.reported ?? 0))]));
  return <section aria-label="Chimie des ajouts simulés" className="space-y-4">
    <div><h4 className="font-semibold text-cave-50">Quantités introduites par le houblon</h4><p className="text-xs text-cave-400">Avant extraction et fermentation. Les valeurs inconnues ne valent pas zéro.</p></div>
    <div className="divide-y divide-cave-800">{Object.entries(chemistry.introduced).map(([id, amount]) => {
      const unit = amount.unit === 'ug' ? 'µg' : amount.unit;
      const value = amount.range ? `${hopChemicalRangeLabel(amount.range)} ${unit}` : amount.reported !== undefined ? `${number(amount.reported)} ${unit}` : 'Non quantifiable';
      return <details key={id} className="text-sm" aria-label={`Quantité introduite · ${HOP_ANALYTE_LABELS[amount.analyte]}`}>
        <summary className="min-h-touch cursor-pointer py-2"><span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1"><span className="text-cave-200">{HOP_ANALYTE_LABELS[amount.analyte]}</span><span className="text-water">{value}</span></span>{maxima[amount.unit] > 0 && (amount.range || amount.reported !== undefined) && <span className="relative block h-2 bg-cave-800 rounded overflow-hidden mt-1" aria-hidden="true">{amount.range ? <span className="absolute inset-y-0 bg-water/70 rounded min-w-px" style={{ left: `${100 * amount.range.min / maxima[amount.unit]}%`, width: `${100 * (amount.range.max - amount.range.min) / maxima[amount.unit]}%` }} /> : <span className="absolute inset-y-0 bg-water w-0.5 -translate-x-1/2" style={{ left: `${100 * amount.reported! / maxima[amount.unit]}%` }} />}</span>}</summary>
        <div className="text-xs text-cave-400 space-y-2 pb-3"><p>Confiance {HOP_CONFIDENCE_LABELS[amount.confidence]} · {amount.coverage.knownAdditions}/{amount.coverage.totalAdditions} ajout(s) renseigné(s).</p>
          {amount.reported !== undefined && !amount.range && <p>Quantité nominale calculée ; incertitude analytique non publiée.</p>}
          {amount.partialRange && <p>Contributions connues seulement : {hopChemicalRangeLabel(amount.partialRange)} {unit}. Le total reste inconnu.</p>}
          {amount.partialReported !== undefined && !amount.partialRange && <p>Contributions connues seulement : {number(amount.partialReported)} {unit}, sans incertitude publiée. Le total reste inconnu.</p>}
          {amount.reasons.map((reason, i) => <p key={i}>{reason}</p>)}{amount.sources.map((source, i) => <div key={i}><HopSourceLink source={source} /></div>)}
        </div>
      </details>;
    })}</div>
    <div><h4 className="font-semibold text-cave-50">{finalLabel}</h4><div className="divide-y divide-cave-800">{Object.entries(chemistry.final).map(([id, estimate]) => <details key={id} className="text-sm"><summary className="min-h-touch cursor-pointer py-2 flex flex-wrap justify-between gap-2"><span className="text-cave-200">{HOP_ANALYTE_LABELS[id.replace(/^beer:/, '') as keyof typeof HOP_ANALYTE_LABELS] ?? id}</span><span className="text-cave-400">{estimate.range && estimate.unit ? `Plage ${hopChemicalRangeLabel(estimate.range)} ${estimate.unit === 'ngL' ? 'ng/L' : estimate.unit}` : 'Concentration non quantifiable'}</span></summary><div className="text-xs text-cave-400 pb-3 space-y-1"><p>Confiance {HOP_CONFIDENCE_LABELS[estimate.confidence]}</p>{estimate.reasons.map((reason, i) => <p key={i}>{reason}</p>)}{estimate.sources.map((source, i) => <div key={i}><HopSourceLink source={source} /></div>)}</div></details>)}</div></div>
  </section>;
}
