import React from 'react';
import { Check, CircleAlert, Thermometer } from 'lucide-react';
import { BrewDayState, BrewDayStep, RecipeSnapshot } from '../types';
import { measuredReadingFeedback, READING, ReadingKind } from '../domain/brewDay';

export function BrewReadingsSummary({
  state,
  step,
  recipe,
  onMeasure
}: {
  state: BrewDayState;
  step: BrewDayStep;
  recipe: RecipeSnapshot;
  onMeasure: () => void;
}) {
  const latest = (Object.keys(READING) as ReadingKind[])
    .map((kind) =>
      [...(state.readings ?? [])].reverse().find((r) => r.kind === kind && r.stepId === step.id)
    )
    .filter((r) => r != null);
  if (!latest.length) return null;
  return (
    <section className="brew-readings-summary" aria-label="Relevés de cette étape">
      <div className="brew-section-heading">
        <h3>Relevés</h3>
        <button type="button" className="brew-text-button" onClick={onMeasure}>
          <Thermometer size={16} />
          Mesurer
        </button>
      </div>
      <div>
        {latest.map((reading) => {
          const feedback = measuredReadingFeedback(reading, state, step, recipe);
          return (
            <div key={reading.kind} className={`brew-summary-reading is-${feedback.tone}`}>
              <div>
                <span>{READING[reading.kind].label}</span>
                <strong>
                  {reading.kind === 'densite'
                    ? reading.value.toFixed(3)
                    : String(reading.value).replace('.', ',')}{' '}
                  <small>{reading.unit}</small>
                </strong>
                <time>
                  {new Date(reading.at).toLocaleTimeString('fr-CH', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </time>
              </div>
              <p>
                {feedback.tone === 'ok' ? (
                  <Check size={15} />
                ) : feedback.tone === 'watch' ? (
                  <CircleAlert size={15} />
                ) : null}
                {feedback.title}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
