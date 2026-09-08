import React from 'react';
import type { HopAxis } from '../../../functions/src/hopPredictionSchema';
import type { HopRange } from '../../../functions/src/hopIndexSchema';

export function HopAromaTargetPicker({ axes, target, disabled, onChange }: {
  axes: HopAxis[]; target: Record<string, HopRange>; disabled?: boolean;
  onChange: (target: Record<string, HopRange>, axis: HopAxis) => void;
}) {
  const choose = (axis: HopAxis, level: '' | 'low' | 'medium' | 'high') => {
    const next = { ...target };
    if (!level) delete next[axis.id];
    else next[axis.id] = level === 'low' ? { min: axis.scale.min, max: axis.lowMax }
      : level === 'medium' ? { min: axis.lowMax, max: axis.mediumMax }
        : { min: axis.mediumMax, max: axis.scale.max };
    onChange(next, axis);
  };
  return <fieldset disabled={disabled} className="space-y-3">
    <legend className="font-semibold text-cave-50 mb-2">Quel arôme veux-tu retrouver ?</legend>
    <p className="text-sm text-cave-400">Choisis tes familles, puis leur présence souhaitée. Tu pourras affiner en dégustant.</p>
    <div className="flex flex-wrap gap-2">{axes.map(axis => <button type="button" key={axis.id}
      aria-pressed={!!target[axis.id]} onClick={() => choose(axis, target[axis.id] ? '' : 'medium')}
      className={`min-h-touch rounded-control border px-3 py-2 text-sm ${target[axis.id] ? 'bg-ebc-straw/10 border-ebc-straw text-ebc-straw' : 'border-cave-700 text-cave-200'}`}>
      {axis.name}
    </button>)}</div>
    {axes.filter(axis => target[axis.id]).map(axis => {
      const range = target[axis.id];
      const level = range.min === axis.scale.min && range.max === axis.lowMax ? 'low'
        : range.min === axis.lowMax && range.max === axis.mediumMax ? 'medium'
          : range.min === axis.mediumMax && range.max === axis.scale.max ? 'high' : 'custom';
      return <div key={axis.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-cave-800 pb-2">
        <span className="text-sm text-cave-100">{axis.name}{level === 'custom' ? ' · cible personnalisée' : ''}</span>
        <span role="img" aria-label={`${axis.name} : présence souhaitée ${level === 'low' ? 'faible' : level === 'medium' ? 'moyenne' : level === 'high' ? 'forte' : 'personnalisée'}`} className="relative block h-3 w-full order-last rounded bg-cave-800 overflow-hidden">
          <span className="absolute inset-y-0 bg-ebc-straw/70 rounded" style={{ left: `${100 * (range.min - axis.scale.min) / (axis.scale.max - axis.scale.min)}%`, width: `${100 * (range.max - range.min) / (axis.scale.max - axis.scale.min)}%` }} />
        </span>
        <div role="group" aria-label={`Présence souhaitée : ${axis.name}`} className="flex gap-1">
          {([['low', 'Faible'], ['medium', 'Moyenne'], ['high', 'Forte']] as const).map(([id, label]) =>
            <button type="button" key={id} aria-pressed={level === id} onClick={() => choose(axis, id)}
              className={`min-h-touch rounded-control px-2 text-sm ${level === id ? 'bg-cave-700 text-cave-50' : 'text-cave-400'}`}>{label}</button>)}
        </div>
      </div>;
    })}
  </fieldset>;
}
