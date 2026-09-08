import React from 'react';
import { HopAxis, HopPrediction } from '../../../functions/src/hopPredictionSchema';
import { HOP_CONFIDENCE_LABELS, HOP_TIMING_LABELS, hopIntensityLabel, hopRangeLabel } from './presentation';
import { BrewTag } from '../BrewTag';
import { HopRangePlot } from './HopRangePlot';
import type { HopRange, HopSource } from '../../../functions/src/hopIndexSchema';
function Source({ source: s }: { source: HopSource }) {
  return <p className="break-words">{s.author}, {s.year ?? 'année inconnue'} — {s.title}. {/^(https?:\/\/)/i.test(s.reference) ? <a className="underline text-water" href={s.reference} target="_blank" rel="noreferrer">Consulter la source</a> : s.reference}{s.locator && <span className="block">{s.locator}</span>}</p>;
}
export function HopPredictionView({ prediction, axes, names, target }: { prediction: HopPrediction; axes: HopAxis[]; names?: { variety?: string; yeast?: string }; target?: Record<string, HopRange> }) {
  return <div className="space-y-3">
    <p className="text-lg font-semibold text-cave-50 break-words">{names?.variety || prediction.triplet.varietyId || 'Houblon inconnu'} <span className="text-cave-400">×</span> {names?.yeast || prediction.triplet.yeastId || 'Levure inconnue'}</p>
    <div className="flex flex-wrap gap-2"><BrewTag tone="info">{HOP_TIMING_LABELS[prediction.triplet.timing] || 'Timing inconnu'}</BrewTag><BrewTag>{prediction.triplet.lotId ? 'Lot sélectionné' : 'Référence variété'}</BrewTag></div>
    <p className="text-sm text-cave-200">{prediction.triplet.doseGL ?? '?'} g/L · {prediction.triplet.temperatureC ?? '?'} °C · {prediction.triplet.contactHours ?? '?'} h</p>
    <div className="rounded-panel border border-cave-700 bg-cave-900 p-4 space-y-2"><p className="text-sm text-cave-400">Adéquation au profil recherché</p><p className="font-mono text-xl text-cave-50">{hopRangeLabel(prediction.score.range)}{prediction.score.range && <span className="text-sm text-cave-400"> / 100</span>}</p><BrewTag tone={prediction.score.confidence === 'high' ? 'done' : prediction.score.confidence === 'medium' ? 'info' : 'pause'}>Confiance {HOP_CONFIDENCE_LABELS[prediction.score.confidence]}</BrewTag><p className="text-sm text-cave-400">{prediction.score.range ? 'Une plage de rapprochement, pas une probabilité de réussite.' : 'Le contexte ou les données ne permettent pas de chiffrer l’adéquation.'}</p></div>
    <div className="space-y-4">{axes.map(axis => {
      const estimate = prediction.profile[axis.id];
      return <div key={axis.id} className="space-y-2"><div className="flex flex-wrap justify-between items-center gap-2"><span className="font-semibold text-cave-50">{axis.name}</span><BrewTag tone={estimate?.range ? 'info' : 'neutral'}>{hopIntensityLabel(estimate, axis)}</BrewTag></div>
        <HopRangePlot axis={axis} predicted={estimate?.range ?? null} target={target?.[axis.id]} />
        <details className="text-sm text-cave-400"><summary className="cursor-pointer min-h-touch flex items-center">Plage, confiance et sources</summary><div className="space-y-2"><p>Plage : {hopRangeLabel(estimate?.range ?? null)} · confiance {HOP_CONFIDENCE_LABELS[estimate?.confidence ?? 'low']}</p>
          {estimate?.reasons.map((reason, i) => <p key={i}>{reason}</p>)}
          {estimate?.sources.map((s, i) => <Source key={i} source={s} />)}
        </div></details></div>;
    })}</div>
    {prediction.risks.length > 0 && <div aria-label="Vigilances du triplet" className="space-y-3">{prediction.risks.map((r, i) => <div key={i} className={`border-l-2 ${r.status === 'flagged' ? 'border-alert' : r.status === 'possible' ? 'border-ebc-straw' : 'border-cave-600'} pl-3 text-sm space-y-1`}><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-cave-50">{r.title}</p><BrewTag tone={r.status === 'flagged' ? 'due' : r.status === 'possible' ? 'pause' : 'neutral'}>{r.status === 'unknown' ? 'Non évaluable' : r.status === 'flagged' ? 'Signalé' : 'Possible'}</BrewTag></div><p className="text-cave-200">{r.message}</p><p className="text-cave-400">Confiance {HOP_CONFIDENCE_LABELS[r.confidence]}</p><details><summary className="cursor-pointer text-cave-400 min-h-touch flex items-center">Source du signal</summary><Source source={r.source} /></details></div>)}</div>}
    <details className="text-sm text-cave-400 space-y-2"><summary className="cursor-pointer min-h-touch flex items-center">Comprendre le résultat</summary><p className="break-all">Contexte : {prediction.triplet.matrixId || 'non précisé'}.</p>{[...prediction.reasons, ...prediction.score.reasons].map((reason, i) => <p key={i}>{reason}</p>)}<p className="break-words">Modèles : {prediction.modelRefs.map(m => `${m.id} (${m.version})`).join(', ') || 'aucun applicable'}.</p></details>
  </div>;
}
