import React, { useEffect, useState } from 'react';
import type { BrewDayReading, BrewDayState, BrewDayStep } from '../types';
import { parseReading } from '../domain/brewDay';
import { brewNow } from '../services/brewClock';
import { Input } from './Input';
import type { BrewReadingDraft, BrewUpdate } from './BrewDayMeasurements';

export interface WortPairDraft {
  volume: string;
  gravity: string;
  basis: '' | 'cold' | 'hot';
  corrected: boolean;
  stage: 'preboil' | 'postboil' | 'fermenter' | 'kettle-cold';
  editing?: string;
}
const stages = { preboil: 'Avant ébullition', postboil: 'Après ébullition', 'kettle-cold': 'Cuve refroidie, avant transfert', fermenter: 'En fermenteur' };
const input = 'w-full min-w-0 h-touch-lg rounded-control border border-cave-600 bg-cave-950 px-2 text-base reading text-cave-50';

export function BrewWortPair({ step, state, update, drafts, requestedStage }: {
  step: BrewDayStep; state: BrewDayState; update: BrewUpdate; drafts?: Map<string, BrewReadingDraft>;
  requestedStage?: { stage: WortPairDraft['stage']; token: number };
}) {
  const key = `${step.id}:wort-pair`;
  const [draft, setDraft] = useState<WortPairDraft>(() => drafts?.get(key)?.pair ?? {
    volume: '', gravity: '', basis: '', corrected: false,
    stage: step.id === 'preboil' || step.id === 'sparge' ? 'preboil' : /boil|refroidissement|whirlpool/.test(step.id) ? 'postboil' : 'fermenter'
  });
  const [notice, setNotice] = useState('');
  useEffect(() => {
    if (requestedStage) setDraft(d => ({ ...d, stage: requestedStage.stage, editing: undefined, volume: '', gravity: '' }));
  }, [requestedStage?.token]);
  const [retained, setRetained] = useState(state.lauterRetainedL != null ? String(state.lauterRetainedL) : '');
  const retainedValue = /^\d+(?:[.,]\d+)?$/.test(retained.trim()) ? Number(retained.replace(',', '.')) : NaN;
  useEffect(() => { drafts?.set(key, { kind: 'volume', raw: '', roomTemp: false, editing: null, pair: draft }); }, [draft, drafts, key]);
  const patch = (p: Partial<WortPairDraft>) => { setDraft(d => ({ ...d, ...p })); setNotice(''); };
  const volume = /[.,]$/.test(draft.volume.trim()) ? null : parseReading(draft.volume, 'volume');
  const gravity = /[.,]$/.test(draft.gravity.trim()) ? null : parseReading(draft.gravity, 'densite');
  const latest = [...(state.readings ?? [])].reverse().find(r => r.kind === 'volume' && r.pairId && r.measurementStage === draft.stage);
  const save = (event: React.FormEvent) => {
    event.preventDefault();
    if (volume == null || volume <= 0 || (gravity == null && draft.stage !== 'kettle-cold')) return;
    const at = brewNow(), pairId = draft.editing ?? crypto.randomUUID();
    const stepId = draft.stage === 'fermenter' ? 'ensemencement' : draft.stage;
    update(s => {
      const old = (s.readings ?? []).filter(r => r.pairId === pairId);
      const make = (kind: 'volume' | 'densite', value: number): BrewDayReading => {
        const previous = old.find(r => r.kind === kind);
        const reading: BrewDayReading = {
        ...previous,
        id: previous?.id ?? crypto.randomUUID(),
        at: previous?.at ?? at,
        pairId, measurementStage: draft.stage, stepId, kind, value,
        unit: kind === 'volume' ? 'L' : 'SG',
        roomTemp: kind === 'densite' ? draft.corrected : draft.basis === 'cold',
        ...(kind === 'volume' ? { volumeBasis: draft.basis || undefined } : {})
        };
        if (kind === 'volume' && previous?.volumeBasis !== reading.volumeBasis)
          delete reading.temperatureC;
        return reading;
      };
      return { ...s, readings: [...(s.readings ?? []).filter(r => r.pairId !== pairId), make('volume', volume), ...(gravity != null ? [make('densite', gravity)] : [])].sort((a,b) => a.at-b.at) };
    });
    patch({ volume: '', gravity: '', editing: undefined });
    setNotice(gravity != null ? 'Volume et densité du même moût enregistrés.' : 'Volume en cuve refroidie enregistré.');
  };
  return <div className="space-y-2">
    <p className="text-xs text-cave-200">Relève le volume de la cuve et la densité d’un échantillon du même moût, sans ajout entre les deux.</p>
    <form onSubmit={save} autoComplete="off" className="space-y-2">
      <label className="block text-xs text-cave-200">Moment du relevé
        <select className={input} aria-label="Moment du couple volume et densité" value={draft.stage} onChange={e => patch({ stage: e.target.value as WortPairDraft['stage'], editing: undefined, volume: '', gravity: '' })}>
          {Object.entries(stages).map(([value,label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-cave-200">Volume mesuré (L)<Input aria-label="Volume du même moût en litres" className={input} inputMode="decimal" value={draft.volume} onChange={e => patch({ volume: e.target.value })} /></label>
        <label className="text-xs text-cave-200">Densité mesurée (SG){draft.stage === 'kettle-cold' ? ' · facultative' : ''}<Input aria-label="Densité du même moût" className={input} inputMode="decimal" value={draft.gravity} onChange={e => patch({ gravity: e.target.value })} /></label>
      </div>
      <label className="block text-xs text-cave-200">Référence du volume
        <select aria-label="Référence de température du volume" className={input} value={draft.basis} onChange={e => patch({ basis: e.target.value as WortPairDraft['basis'] })}>
          <option value="">Température non précisée</option><option value="cold">À 20 °C (mesuré/corrigé)</option><option value="hot">À ébullition</option>
        </select>
      </label>
      <label className="flex items-center gap-2 text-xs text-cave-200 min-h-touch">
        <input type="checkbox" className="accent-ebc-straw" checked={draft.corrected} onChange={e => patch({ corrected: e.target.checked })} />Densité refroidie ou corrigée à l’étalonnage
      </label>
      {(!draft.basis || !draft.corrected) && <p className="text-xs text-cave-400">Le rendement attendra la référence de température et une densité corrigée.</p>}
      <button type="submit" className="min-h-touch-lg rounded-control bg-ebc-straw px-2 text-sm font-semibold text-cave-950 disabled:opacity-40" disabled={volume == null || volume <= 0 || (gravity == null && draft.stage !== 'kettle-cold')}>{draft.editing ? 'Corriger le couple' : draft.stage === 'kettle-cold' ? 'Noter le relevé en cuve' : 'Noter volume et densité'}</button>
    </form>
    {notice && <p role="status" className="text-xs text-hop">{notice}</p>}
    {latest && !draft.editing && <button type="button" className="min-h-touch text-xs text-cave-200 underline" onClick={() => {
      const density = state.readings?.find(r => r.pairId === latest.pairId && r.kind === 'densite');
      patch({ volume: String(latest.value), gravity: density ? String(density.value) : '', basis: latest.volumeBasis ?? (latest.roomTemp ? 'cold' : ''), corrected: !!density?.roomTemp, editing: latest.pairId });
    }}>Corriger le dernier couple · {latest.value} L</button>}
    {draft.stage === 'preboil' && <details className="text-xs text-cave-200">
      <summary className="min-h-touch cursor-pointer">Préciser les pertes de filtration</summary>
      <label className="block">Moût libre resté après filtration (L à froid)
        <Input aria-label="Moût libre resté après filtration" className={input} inputMode="decimal" value={retained} onChange={e => setRetained(e.target.value)} />
      </label>
      <p className="text-cave-400 my-1">Mesure distincte du liquide absorbé dans le grain. Saisis 0 uniquement si vérifié.</p>
      <button type="button" className="min-h-touch underline" disabled={!Number.isFinite(retainedValue) || retainedValue < 0} onClick={() => { if(Number.isFinite(retainedValue) && retainedValue >= 0) { update(s=>({...s,lauterRetainedL:retainedValue})); setNotice('Perte de filtration consignée.'); } }}>Noter la perte mesurée</button>
    </details>}
  </div>;
}
