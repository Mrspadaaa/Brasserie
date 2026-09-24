import type { Batch } from '../types';
import { useEffect, useRef } from 'react';
import { BrewSystemFeedback } from './BrewSystemFeedback';

const STAGES = {
  preboil: 'Avant ébullition',
  postboil: 'Après ébullition',
  fermenter: 'En fermenteur',
  'kettle-cold': 'Cuve refroidie avant transfert',
};

/** Read-only evidence beside calibration; opening it never changes the batch. */
export function BrewSystemSource({batch,onClose}:{batch:Batch;onClose:()=>void}) {
  const ref=useRef<HTMLElement>(null);
  useEffect(()=>{ref.current?.scrollIntoView?.({block:'start'});ref.current?.focus({preventScroll:true});},[batch.id]);
  return <section ref={ref} tabIndex={-1} className="brew-system" aria-label={`Mesures sources ${batch.id}`}>
    <div className="brew-system-heading"><h3>{batch.id} · {batch.name}</h3><button type="button" className="brew-system-button" onClick={onClose}>Fermer les mesures</button></div>
    <p className="brew-system-intro">Profil figé : {batch.recipeSnapshot?.brewhouse?.name ?? 'non renseigné'} · {batch.recipeSnapshot?.volumeL ?? batch.volumeL} L prévus.</p>
    {batch.recipeSnapshot && batch.brewDay && <BrewSystemFeedback recipe={batch.recipeSnapshot} state={batch.brewDay} compact />}
    <details className="brew-system-details" open><summary>Relevés consignés</summary>
      <ul className="brew-system-sources">{(batch.brewDay?.readings ?? []).map((r,i)=><li key={r.id ?? i}>
        <div><strong>{r.value.toLocaleString('fr-CH',{maximumFractionDigits:r.kind==='densite'?3:2})} {r.unit}</strong><p>{r.measurementStage ? STAGES[r.measurementStage] : batch.brewDay?.steps.find(s=>s.id===r.stepId)?.label ?? 'Étape non renseignée'} · {new Date(r.at).toLocaleString('fr-CH')}</p>
        <p>{r.kind==='volume' ? r.volumeBasis==='cold' || (!r.volumeBasis && r.roomTemp) ? 'Volume à température de référence' : r.volumeBasis==='hot' ? 'Volume à ébullition' : 'Référence de volume inconnue' : r.kind==='densite' ? r.roomTemp ? 'Densité à température de référence ou corrigée' : 'Correction de densité non confirmée' : r.note}</p>
        {r.temperatureC != null && <p>Température déclarée : {r.temperatureC.toLocaleString('fr-CH')} °C</p>}</div>
      </li>)}</ul>
    </details>
  </section>;
}
