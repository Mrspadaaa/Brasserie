import React from 'react';
import { Check, TriangleAlert } from 'lucide-react';
import { BrewDayReading, BrewDayState, BrewDayStep, RecipeSnapshot } from '../types';
import { measuredReadingFeedback, READING, ReadingKind, readingKey, sg } from '../domain/brewDay';
import { heureCuve } from './BrewIngredients';

/**
 * « Relevés du jour » (z1) : le dernier relevé de chaque grandeur à chaque étape de la journée, en une rangée de valeurs, puis
 * ce que l'étape en cours en conclut (l'écart, l'alerte). Un relevé absent n'est jamais rempli à la place du brasseur.
 */
export function BrewReadingsSummary({
  state,
  step,
  recipe,
  cloture
}: {
  state: BrewDayState;
  step: BrewDayStep;
  recipe: RecipeSnapshot;
  /** Gardé pour les appelants : le geste « Mesurer » vit dans le pied de la vue. */
  onMeasure?: () => void;
  /** Les relevés de clôture (densité initiale, volume en fermenteur) : une rangée de plus dans « Relevés du jour ». */
  cloture?: React.ReactNode;
}) {
  const parCle = new Map<string, BrewDayReading>();
  for (const r of [...(state.readings ?? [])].sort((a, b) => a.at - b.at))
    parCle.set(`${r.stepId ?? ''}|${r.kind}`, r);
  const jour = [...parCle.values()].sort((a, b) => a.at - b.at);
  if (!jour.length && !cloture) return null;
  const stepLabel = (id?: string) => state.steps.find((s) => s.id === id)?.label ?? '';
  const valeur = (r: BrewDayReading) => (r.kind === 'densite' ? sg(r.value) : String(r.value).replace('.', ','));
  const ici = (Object.keys(READING) as ReadingKind[])
    .map((kind) => parCle.get(`${step.id}|${kind}`))
    .filter((r): r is BrewDayReading => r != null);
  return (
    <section className="brew-readings-summary bz-groupe" aria-label="Relevés de cette étape">
      <header className="bz-groupe-tete">
        <h3>Relevés du jour</h3>
      </header>
      <div className="bz-releve">
        {cloture}
        {jour.map((r) => (
          <span key={readingKey(r)}>
            {READING[r.kind].label}
            {r.stepId && r.stepId !== step.id ? ` · ${stepLabel(r.stepId)}` : ''}{' '}
            <b className="bz-m">{valeur(r)}{r.unit ? ` ${r.unit}` : ''}</b>{' '}
            <span className="bz-m bz-heure">{heureCuve(r.at)}</span>
          </span>
        ))}
      </div>
      {ici.map((reading) => {
        const feedback = measuredReadingFeedback(reading, state, step, recipe);
        return (
          <p key={reading.kind} className={`bz-releve-avis is-${feedback.tone}`}>
            {feedback.tone === 'ok' ? <Check size={14} aria-hidden="true" /> : feedback.tone === 'watch' ? <TriangleAlert size={14} aria-hidden="true" /> : null}
            <span>{feedback.title}</span>
          </p>
        );
      })}
    </section>
  );
}
