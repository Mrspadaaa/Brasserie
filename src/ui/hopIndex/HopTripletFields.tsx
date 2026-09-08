import React from 'react';
import { HopLot, HopVariety } from '../../../functions/src/hopIndexSchema';
import { HopTriplet, HopYeast, HOP_TIMINGS } from '../../../functions/src/hopPredictionSchema';
import { HopField } from './HopFactsEditor';
import { inputClass, TextInput } from '../FormNav';
import { NumberInput } from '../NumberInput';
import { HOP_TIMING_LABELS } from './presentation';
import { hopReferenceLabel } from '../../domain/hopIndex/labels';
export const emptyHopTriplet = (): HopTriplet => ({ varietyId: null, yeastId: null, timing: null, doseGL: null, temperatureC: null, contactHours: null, matrixId: null });
export function HopTripletFields({ value, onChange, varieties, lots, yeasts, hideIdentity = false }: { value: HopTriplet; onChange: (v: HopTriplet) => void; varieties: HopVariety[]; lots: HopLot[]; yeasts: HopYeast[]; hideIdentity?: boolean }) {
  const patch = (v: Partial<HopTriplet>) => onChange({ ...value, ...v });
  return <div className="grid gap-3 sm:grid-cols-2">
    {!hideIdentity && <>
      <HopField label="Houblon"><select className={inputClass} value={value.varietyId ?? ''} onChange={e => patch({ varietyId: e.target.value || null, lotId: null })}><option value="">Non identifié</option>{varieties.map(v => <option key={v.id} value={v.id}>{hopReferenceLabel(v)}</option>)}</select></HopField>
      <HopField label="Lot analysé"><select className={inputClass} value={value.lotId ?? ''} onChange={e => patch({ lotId: e.target.value || null })}><option value="">Référence variété</option>{lots.filter(l => l.varietyId === value.varietyId).map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select></HopField>
      <HopField label="Levure du triplet"><select className={inputClass} value={value.yeastId ?? ''} onChange={e => patch({ yeastId: e.target.value || null })}><option value="">Non identifiée</option>{yeasts.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}</select></HopField>
      <HopField label="Moment du houblonnage"><select className={inputClass} value={value.timing ?? ''} onChange={e => patch({ timing: e.target.value as HopTriplet['timing'] || null })}><option value="">Non précisé</option>{HOP_TIMINGS.map(t => <option key={t} value={t}>{HOP_TIMING_LABELS[t]}</option>)}</select></HopField>
    </>}
    <HopField label="Dose de houblon (g/L)"><NumberInput className={inputClass} value={value.doseGL ?? undefined} emptyValue={undefined} onValue={doseGL => patch({ doseGL: doseGL ?? null })} /></HopField>
    <HopField label="Température de contact (°C)"><NumberInput className={inputClass} value={value.temperatureC ?? undefined} emptyValue={undefined} onValue={temperatureC => patch({ temperatureC: temperatureC ?? null })} /></HopField>
    <HopField label="Durée de contact (h)"><NumberInput className={inputClass} value={value.contactHours ?? undefined} emptyValue={undefined} onValue={contactHours => patch({ contactHours: contactHours ?? null })} /></HopField>
    <HopField label="Référence du contexte de bière" hint="Identifiant du domaine décrit dans le modèle ; ne pas assimiler deux matrices différentes."><TextInput value={value.matrixId ?? ''} onChange={matrixId => patch({ matrixId: matrixId || null })} /></HopField>
  </div>;
}
