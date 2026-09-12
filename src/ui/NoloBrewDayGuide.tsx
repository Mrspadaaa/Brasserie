import React, { useId, useMemo } from 'react';
import { ClipboardPen, Gauge } from 'lucide-react';
import type { BrewDayState, BrewDayStep, RecipeSnapshot } from '../types';
import { READING, type ReadingKind } from '../domain/brewDay';
import { noloBrewDayPlan, noloStepReadings } from '../domain/noloBrewDay';
import { RecipeDisclosure } from './RecipeDisclosure';

const control = 'min-h-touch rounded-control border border-cave-700 bg-cave-850 px-2 py-1 text-xs text-cave-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-water disabled:opacity-40';
const number = (value: number, kind: ReadingKind) => value.toLocaleString('fr-CH', {
  minimumFractionDigits: kind === 'densite' ? 3 : 0, maximumFractionDigits: kind === 'densite' ? 3 : 2
});
const compactLabel: Record<ReadingKind, string> = { densite: 'SG', volume: 'Vol.', temperature: 'Temp.', ph: 'pH' };

/** Guidance uses the captured recipe. Shortcuts only read or write the live brew journal. */
export function NoloBrewDayGuide({ recipe, state, step, overview = false, onMeasure, onNote }: {
  recipe: RecipeSnapshot;
  state: BrewDayState;
  step: BrewDayStep;
  overview?: boolean;
  onMeasure: (kind: ReadingKind) => void;
  onNote: (subject: string) => void;
}) {
  const id = useId();
  const plan = useMemo(() => noloBrewDayPlan(recipe), [recipe]);
  if (!plan) return null;
  const readings = noloStepReadings(state, step);
  const finish = ['refroidissement', 'ensemencement'].includes(step.id);
  const missingStabilization = !plan.stabilization.method.trim() || !plan.stabilization.validationReference.trim();
  return <section aria-labelledby={id} className="min-w-0 space-y-2 border-b border-cave-700 py-2">
    <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
      <h3 id={id} className="text-sm font-semibold text-area-production">NOLO · {plan.name}</h3>
      <span className="text-xs text-cave-200">Cible ≤ <span className="font-mono tabular-nums">{plan.target}</span></span>
    </div>
    {!overview && <>
      {readings.length > 0 && <div aria-label="Relevés NOLO de cette étape" className={readings.length > 3 ? 'grid grid-cols-2 gap-1 sm:grid-cols-4' : 'flex flex-wrap gap-1'}>
        {readings.map(({ kind, reading }) => <button key={kind} type="button"
          aria-label={`Relever ${READING[kind].label} pour le suivi NOLO`}
          onClick={() => onMeasure(kind)} className={control + ' flex min-h-touch-lg min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-1'}>
          <span>{compactLabel[kind]}</span>
          <span className="font-mono tabular-nums text-sm text-cave-50">{reading ? number(reading.value, kind) : '—'}{kind !== 'densite' && READING[kind].unit ? ` ${READING[kind].unit}` : ''}</span>
        </button>)}
      </div>}
      {finish && missingStabilization && <p className="text-xs text-attention">Stabilisation et analyses finales à documenter avant conditionnement.</p>}
    </>}
    <RecipeDisclosure title="Plan NOLO figé" summary={`${plan.operations.length} ${plan.operations.length === 1 ? 'opération' : 'opérations'} · ${plan.trials.length} ${plan.trials.length === 1 ? 'essai' : 'essais'}`}>
      <p className="text-sm text-cave-200">{plan.focus}</p>
      <p className="text-xs text-cave-400">Repères de la recette au lancement. Les relevés du jour restent dans le journal ; une hypothèse ne remplace pas une analyse d’alcool.</p>
      <dl className="divide-y divide-cave-800 text-sm">
        {plan.facts.map(fact => <div key={fact.label} className="flex min-w-0 flex-wrap justify-between gap-x-2 py-1">
          <dt className="text-cave-400">{fact.label}</dt><dd className="text-cave-50">{fact.value}</dd>
        </div>)}
      </dl>
      {plan.wortIssue && <p className="text-xs text-cave-400">{plan.wortIssue}</p>}
      {plan.missingProgramme && <p className="text-xs text-attention">{plan.missingProgramme}</p>}
      {plan.process === 'coldExtraction' && <p className="text-xs text-cave-400">Les paliers d’empâtage à chaud de la recette ne deviennent pas un protocole d’extraction à froid. Note les conditions réellement appliquées.</p>}
      {plan.operations.length > 0 ? <>
        <h4 className="text-sm font-semibold text-cave-50">Opérations prévues · ordre du bilan</h4>
        <p className="text-xs text-cave-400">Confirmer le moment, la quantité et le lot dans une note après réalisation.</p>
        <ol className="divide-y divide-cave-800">
          {plan.operations.map((operation, index) => <li key={operation.id} className="min-w-0 py-1.5">
            <div className="flex min-w-0 items-start gap-2">
              <div className="min-w-0 flex-1 text-sm text-cave-200"><span>{index + 1}. {operation.name}</span><span className="block font-mono tabular-nums text-cave-50">{operation.amount}</span></div>
              {!overview && <button type="button" className={control + ' inline-flex shrink-0 items-center gap-1'} aria-label={`Noter la réalisation de ${operation.name}`} onClick={() => onNote(operation.name)}><ClipboardPen size={14} aria-hidden="true"/>Noter</button>}
            </div>
            <p className="text-xs text-cave-400">{operation.kind} · {operation.detail}</p>
          </li>)}
        </ol>
      </> : <p className="text-sm text-cave-400">Aucune opération inscrite au bilan. Les réglages explorés dans les outils ne sont pas des ajouts prévus.</p>}
      {plan.inactiveCount > 0 && <p className="text-xs text-cave-400">{plan.inactiveCount} {plan.inactiveCount === 1 ? 'opération écartée' : 'opérations écartées'} pour ce procédé.</p>}
      {plan.trials.length > 0 && <>
        <h4 className="text-sm font-semibold text-cave-50">Essais et témoin</h4>
        <ul className="divide-y divide-cave-800">
          {plan.trials.map(trial => <li key={trial.id} className="py-1.5">
            <div className="flex min-w-0 items-start gap-2"><p className="min-w-0 flex-1 text-sm text-cave-50">{trial.name}<span className="block text-cave-200">{trial.detail}</span></p>
              {!overview && <button type="button" className={control + ' inline-flex shrink-0 items-center gap-1'} aria-label={`Noter l’essai ${trial.name}`} onClick={() => onNote(`Essai ${trial.name}`)}><ClipboardPen size={14} aria-hidden="true"/>Noter</button>}
            </div>
            <p className="text-xs text-cave-400">{trial.comparator} · {trial.moment || 'Moment à préciser'} · support {trial.carrier}</p>
            {trial.composition && <p className="text-xs text-cave-400">{trial.composition}</p>}
            {trial.tasting && <p className="text-xs text-cave-200">Dégustation inscrite : {trial.tasting}</p>}
          </li>)}
        </ul>
      </>}
      <div className="border-t border-cave-700 pt-2">
        <h4 className="flex items-center gap-1 text-sm font-semibold text-cave-50"><Gauge size={14} aria-hidden="true"/>Après le brassage</h4>
        <p className="text-xs text-cave-200">Traitement : {plan.stabilization.method || 'à renseigner'} · validation : {plan.stabilization.validationReference || 'à documenter'} · conservation : {plan.stabilization.storage || 'à préciser'}.</p>
        <p className="mt-1 text-xs text-cave-400">Le journal de densité ne certifie ni l’alcool au conditionnement ni la stabilité. Reporter les analyses finales dans le suivi NOLO du brassin.</p>
      </div>
    </RecipeDisclosure>
  </section>;
}
