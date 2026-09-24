import React, { useEffect, useState } from 'react';
import type { BrewDayState, BrewDayStep, RecipeSnapshot } from '../types';
import { activeThermalSegment, effectiveThermalTarget, rampExposureDetail, startThermalSegment, thermalEstimate, thermalWindow, THERMAL_METHOD_LABELS } from '../domain/brewThermal';
import { markTransferred } from '../domain/brewDay';
import { pitchingPlan, pitchTemperatureFeedback, type PitchingChoiceId } from '../domain/pitchingPlan';
import { NumberInput } from './NumberInput';
import type { BrewUpdate } from './BrewDayMeasurements';
import { brewNow } from '../services/brewClock';
import './brew-thermal.css';

const fmt = (n: number) => n.toLocaleString('fr-CH', { maximumFractionDigits: 1 });
const time = (at: number) => new Date(at).toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit' });

export function BrewThermalControl({ recipe, state, step, now, update, onMeasure }: {
  recipe: RecipeSnapshot; state: BrewDayState; step: BrewDayStep; now: number; update: BrewUpdate;
  onMeasure: (kind: 'temperature') => void;
}) {
  const heating = /^mash/.test(step.id) || step.id === 'sparge';
  const cooling = ['refroidissement', 'ensemencement', 'whirlpool'].includes(step.id);
  const pitching = cooling && step.id !== 'whirlpool';
  const target = effectiveThermalTarget(recipe, state, step);
  const plan = pitchingPlan(recipe, state);
  const segment = activeThermalSegment(state, step.id);
  const holding = heating && step.holdStartedAt != null;
  const estimate = target == null ? undefined : thermalEstimate(state, step, target, now, state.coolingWaterC,
    recipe.brewhouse?.equipment?.heatingRateCPerMin ?? recipe.mash?.heatingRateCPerMin);
  const mode = state.thermalChoices?.pitchingMode ?? 'at-target';
  const [choice, setChoice] = useState<PitchingChoiceId>(mode);
  const [draftTarget, setDraftTarget] = useState<number | undefined>(target);
  const [coolant, setCoolant] = useState<number | undefined>(state.coolingWaterC);
  const [measuredVolume, setMeasuredVolume] = useState<number | undefined>(segment?.volumeL);
  const [notice, setNotice] = useState('');
  useEffect(() => { setChoice(mode); setDraftTarget(target); }, [mode, target, step.id]);
  useEffect(() => { setMeasuredVolume(segment?.volumeL); }, [segment?.id, segment?.volumeL]);
  if ((!heating && !cooling) || state.finishedAt != null || step.doneAt != null) return null;
  const rampEnd = step.holdStartedAt ?? step.startedAt ?? now;
  const rampMin = step.rampStartedAt == null ? undefined : Math.max(0, (rampEnd - step.rampStartedAt) / 60000);
  const exposure = rampExposureDetail(state, step, now);
  const last = holding ? [...state.readings ?? []].filter(r=>r.stepId===step.id && r.kind==='temperature' && (r.medium == null || r.medium==='wort' || step.id==='sparge' && r.medium==='water')).sort((a,b)=>b.at-a.at)[0] : estimate?.last;
  const points = estimate?.points ?? [];
  const method = estimate?.method ?? (heating ? 'heating' : 'immersion');
  const minX = points[0]?.at ?? now, maxX = Math.max(minX + 60000, points.at(-1)?.at ?? now);
  const values = points.map(p => p.value).concat(target == null ? [] : [target]);
  const minY = Math.min(...values) - 1, maxY = Math.max(...values) + 1;
  const x = (at: number) => 8 + 284 * (at - minX) / (maxX - minX);
  const y = (value: number) => 51 - 42 * (value - minY) / (maxY - minY);
  const gapMinutes = thermalWindow(method).freshMin;
  const hasGaps = points.some((p, i) => i > 0 && (p.at - points[i - 1].at) / 60000 > gapMinutes);
  const warmOkay = choice !== 'documented-warm' || !!plan.warmProtocol && draftTarget != null && draftTarget >= plan.warmProtocol.min && draftTarget <= plan.warmProtocol.max;
  const selected = plan.choices.find(c => c.id === choice)!;
  const comparison = (id: PitchingChoiceId) => {
    if (id === 'documented-warm' && (choice !== id || !warmOkay)) return 'Choisir la température d’ajout direct';
    const goal = id === 'documented-warm' ? draftTarget : plan.plannedTargetC;
    if (goal == null || id === 'chamber-before-pitch' && method !== 'chamber' || id === 'at-target' && method !== 'immersion') return 'Durée encore inconnue';
    const result = thermalEstimate(state, step, goal, now, state.coolingWaterC);
    return result.status === 'estimate' ? `≈ ${Math.round(result.minutes)} min jusqu’à ${fmt(goal)} °C · tendance actuelle`
      : result.status === 'reached' ? `${fmt(goal)} °C relevés · à confirmer` : `${fmt(goal)} °C · durée encore inconnue`;
  };
  const applyChoice = () => {
    const chosenTarget = choice === 'documented-warm' ? draftTarget : plan.plannedTargetC;
    if (chosenTarget == null || !selected.available || !warmOkay) return;
    update(s => {
      const at = brewNow();
      let next: BrewDayState = { ...s, thermalChoices: { ...s.thermalChoices, pitchingMode: choice, pitchTargetC: chosenTarget,
        changedAt: at, reason: selected.label,
        ...(choice === 'documented-warm' ? { protocolSource: plan.warmProtocol!.source, protocolConditions: plan.warmProtocol!.conditions } : { protocolSource: undefined, protocolConditions: undefined }) },
        notes: [...s.notes ?? [], { id: crypto.randomUUID(), at, stepId: step.id,
          text: `Conduite du jour : ${selected.label} · cible ${chosenTarget} °C.${choice === 'documented-warm' ? ` ${plan.warmProtocol!.conditions} Source : ${plan.warmProtocol!.source}` : ''}` }] };
      const active = activeThermalSegment(s, step.id);
      if (active && active.targetC !== chosenTarget) next = startThermalSegment(next, step, active.method, chosenTarget, at, { coolantC: active.coolantC, note: 'Cible du jour modifiée' });
      return next;
    });
    setNotice('Conduite consignée ; recette figée conservée.');
  };
  const transfer = () => update(s => {
    const at = brewNow(), next = markTransferred(s, at);
    const pitchStep = next.steps.find(x => x.id === 'ensemencement') ?? step;
    return mode === 'chamber-before-pitch' && target != null ? startThermalSegment(next, pitchStep, 'chamber', target, at,
      { note: 'Transfert effectué ; refroidissement du moût avant ajout de levure' }) : next;
  });
  return <section className="brew-thermal" aria-label="Suivi thermique">
    {state.phase === 'awaiting-pitch' && <p className="brew-thermal-waiting"><strong>En attente d’ensemencement</strong>
      <span>Transfert {state.transferredAt != null ? new Date(state.transferredAt).toLocaleString('fr-CH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'consigné'} · levure pas encore ajoutée.</span></p>}
    <div className="brew-thermal-readings">
      <span>{step.id === 'sparge' ? 'Eau de rinçage' : 'Moût'} <strong>{last ? `${fmt(last.value)} °C` : 'à mesurer'}</strong><small>{last ? `relevé ${time(last.at)} · il y a ${Math.max(0, Math.floor((now - last.at) / 60000))} min` : 'Aucune température déduite'}</small></span>
      {rampMin != null && <span>{cooling ? 'Refroidissement' : 'Montée'}<strong>{fmt(rampMin)} min</strong><small>{step.holdStartedAt != null || step.startedAt != null ? 'avant maintien' : 'écoulées'}</small></span>}
      {step.durationMin > 0 && <span>Maintien<strong>{fmt(step.durationMin)} min</strong><small>{step.holdStartedAt != null ? `départ réel ${time(step.holdStartedAt)}` : 'après température atteinte'}</small></span>}
    </div>
    {holding ? <p className="brew-thermal-estimate"><strong>Maintien en cours</strong> · La montée est terminée. Surveille la température du palier ; ses relevés restent dans le journal.</p> : <p className={`brew-thermal-estimate ${estimate && ['stale', 'stalled', 'unreachable', 'overshoot'].includes(estimate.status) ? 'is-attention' : ''}`}>
      <strong>{estimate?.status === 'estimate' ? `Encore ≈ ${estimate.low === estimate.high ? estimate.low : `${estimate.low}–${estimate.high}`} min` : estimate?.status === 'reached' ? 'Température à confirmer' : 'Arrivée non estimée'}</strong>
      {' · '}{estimate?.message ?? 'Choisis une température d’ensemencement dans la recette.'}
      {estimate?.status === 'estimate' && <span> {estimate.model}.</span>}
    </p>}
    {points.length > 0 && <details className="brew-thermal-curve"><summary>{THERMAL_METHOD_LABELS[method]} · {points.length} relevé{points.length > 1 ? 's' : ''}{hasGaps ? ' · lacunes visibles' : ''}</summary>
      <svg viewBox="0 0 300 64" role="img" aria-label="Températures du moût relevées ; les intervalles sans suivi restent interrompus">
        {target != null && <line x1="8" x2="292" y1={y(target)} y2={y(target)} className="brew-thermal-target" />}
        {points.map((p, i) => <React.Fragment key={p.id ?? p.at}>
          {i > 0 && (p.at - points[i - 1].at) / 60000 <= gapMinutes && <line x1={x(points[i - 1].at)} y1={y(points[i - 1].value)} x2={x(p.at)} y2={y(p.value)} className="brew-thermal-line" />}
          <circle cx={x(p.at)} cy={y(p.value)} r="2.5"><title>{time(p.at)} : {fmt(p.value)} °C</title></circle>
        </React.Fragment>)}
      </svg>
      <table><caption className="sr-only">Relevés de la méthode en cours</caption><thead><tr><th>Heure</th><th>Moût °C</th></tr></thead><tbody>{points.map(p => <tr key={p.id ?? p.at}><td>{time(p.at)}</td><td>{fmt(p.value)}</td></tr>)}</tbody></table>
      {estimate?.status === 'estimate' && <p>{estimate.model}. Les traits relient les relevés ; ils ne sont pas des mesures continues.</p>}
    </details>}
    {heating && rampMin != null && <p className="brew-thermal-note">{exposure.minutes == null ? 'Exposition entre les relevés inconnue.' : `≈ ${fmt(exposure.minutes)} min entre 58 et 72 °C sur ${fmt(exposure.coveredMin)} min suivies.`} La montée ne remplace pas le maintien. {step.pausedAt != null ? 'La pause arrête le minuteur, pas l’évolution réelle de la cuve.' : ''}</p>}
    <div className="brew-thermal-actions">
      <button type="button" onClick={() => onMeasure('temperature')}>{step.id === 'sparge' ? 'Relever l’eau' : 'Relever le moût'}</button>
      {target != null && !holding && <button type="button" onClick={() => { update(s => startThermalSegment(s, step, method, target, brewNow(), { ...(method === 'immersion' && state.coolingWaterC != null ? { coolantC: state.coolingWaterC } : {}), note: segment ? 'Conditions changées : puissance, débit ou circulation' : 'Début du suivi' })); onMeasure('temperature'); }}>{segment ? 'Conditions changées' : cooling ? 'Démarrer le suivi' : 'Suivre la chauffe'}</button>}
    </div>
    {target != null && !holding && <details><summary>Conditions suivies · {segment?.volumeL == null ? 'volume à préciser' : `${fmt(segment.volumeL)} L mesurés`}</summary>
      <label className="brew-thermal-coolant">Volume réellement {heating ? 'chauffé' : 'refroidi'} <span><NumberInput aria-label="Volume réellement suivi en litres" value={measuredVolume} min={.1} max={100000} onValue={setMeasuredVolume} /> L</span>
        <button type="button" disabled={measuredVolume == null || measuredVolume <= 0} onClick={() => update(s => startThermalSegment(s, step, method, target, brewNow(),
          { volumeL: measuredVolume, ...(method === 'immersion' && state.coolingWaterC != null ? { coolantC: state.coolingWaterC } : {}), note: 'Volume réellement suivi consigné' }))}>Consigner le volume</button>
      </label><p className="brew-thermal-note">{heating ? 'Volume de maische avec les grains, ou d’eau pour le rinçage.' : 'Volume de moût dans ce récipient.'} Le volume final prévu n’est pas une mesure. Une modification de volume, puissance, débit ou circulation commence une nouvelle série.</p>
    </details>}
    {cooling && method === 'immersion' && <label className="brew-thermal-coolant">Eau du serpentin mesurée <span><NumberInput aria-label="Température mesurée de l’eau du serpentin" value={coolant} min={0} max={60} onValue={setCoolant} /> °C</span>
      <button type="button" disabled={coolant == null || coolant < 0 || coolant > 60} onClick={() => update(s => {
        const next = { ...s, coolingWaterC: coolant };
        return target == null ? next : startThermalSegment(next, step, 'immersion', target, brewNow(), { coolantC: coolant, note: 'Température de l’eau de refroidissement mesurée' });
      })}>Consigner</button></label>}
    {pitching && <>
      {last && <p className="brew-thermal-note">{pitchTemperatureFeedback(recipe, last.value, state)}</p>}
      <details className="brew-thermal-choices"><summary>Conduite choisie · {plan.choices.find(c => c.id === mode)?.label}</summary>
        <fieldset><legend>Comparer le refroidissement</legend>{plan.choices.map(c => <label key={c.id}>
          <input type="radio" name={`pitching-${step.id}`} value={c.id} checked={choice === c.id} disabled={!c.available} onChange={() => { setChoice(c.id); if (c.id === 'documented-warm') setDraftTarget(undefined); }} />
          <span><strong>{c.label}</strong><small>{c.available ? comparison(c.id) : 'Pas de durée proposée'}</small><small>{c.reason}</small></span></label>)}</fieldset>
        {choice === 'documented-warm' && plan.warmProtocol && <label className="brew-thermal-coolant">Cible du jour · ajout direct {plan.warmProtocol.min}–{plan.warmProtocol.max} °C<NumberInput aria-label="Température d’ensemencement du jour" value={draftTarget} min={plan.warmProtocol.min} max={plan.warmProtocol.max} onValue={setDraftTarget} /><a href={plan.warmProtocol.source} target="_blank" rel="noreferrer">Notice de la levure</a></label>}
        <p className="brew-thermal-note">Consigne principale : {plan.primaryC == null ? 'à préciser' : `${fmt(plan.primaryC)} °C`}. Le profil aromatique dépend aussi du départ et de la descente réelle. Aucun gain de temps n’est garanti sans relevés comparables.</p>
        <button type="button" disabled={!selected.available || !warmOkay} onClick={applyChoice}>Appliquer cette conduite</button>
        {plan.preparationNotes.some(n => n.id === 'rehydrate') && <p className="brew-thermal-note">Réhydratation : température de préparation séparée du moût. {plan.preparationNotes.find(n => n.id === 'rehydrate')?.detail}</p>}
      </details>
      {plan.warning && <p role="status" className="brew-thermal-estimate is-attention">{plan.warning}</p>}
      {state.transferredAt == null && <button type="button" className="brew-thermal-transfer" onClick={transfer}>Transfert effectué · sans levure</button>}
      {state.phase === 'awaiting-pitch' && mode === 'chamber-before-pitch' && method !== 'chamber' && target != null && <button type="button" onClick={() => update(s => startThermalSegment(s, step, 'chamber', target, brewNow(), { note: 'Début du froid régulé avant levure' }))}>Démarrer le suivi dans l’enceinte</button>}
    </>}
    {notice && <p role="status" className="brew-thermal-note">{notice}</p>}
  </section>;
}
