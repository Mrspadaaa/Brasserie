import React from 'react';
import { Check, Thermometer, TriangleAlert } from 'lucide-react';
import { BrewDayReading, BrewDayState, BrewDayStep, RecipeSnapshot } from '../types';
import { measuredReadingFeedback, READING, ReadingKind, readingKey, sg } from '../domain/brewDay';
import type { MesureAttendue } from '../domain/brewMeasures';
import { brewNow } from '../services/brewClock';
import { heureCuve } from './BrewIngredients';

/**
 * « Relevés du jour » (z1) : le dernier relevé de chaque grandeur à chaque étape de la journée, en une rangée de valeurs, puis
 * ce que l'étape en cours en conclut (l'écart, l'alerte). Un relevé absent n'est jamais rempli à la place du brasseur.
 *
 * m2 (10.11, VB-1) : dès qu'une étape attend une mesure, la carte est là, à vide : une case « ? » par mesure attendue (nom, cible,
 * moment). Toucher la case ouvre Mesurer sur le bon onglet ; le relevé fait revenir sa valeur dans la ligne, avec « dans la cible ».
 */
export function BrewReadingsSummary({
  state,
  step,
  recipe,
  cloture,
  attendues = [],
  onMeasure,
  now
}: {
  state: BrewDayState;
  step: BrewDayStep;
  recipe: RecipeSnapshot;
  /** Les mesures que l'étape attend (`mesuresAttendues`) : chacune est une case. Vide : la carte reste celle de z1. */
  attendues?: MesureAttendue[];
  /** Ouvre Mesurer sur l'onglet de cette grandeur. */
  onMeasure?: (kind: ReadingKind) => void;
  /** Les relevés de clôture (densité initiale, volume en fermenteur) : une rangée de plus dans « Relevés du jour ». */
  cloture?: React.ReactNode;
  now?: number;
}) {
  const parCle = new Map<string, BrewDayReading>();
  for (const r of [...(state.readings ?? [])].sort((a, b) => a.at - b.at))
    parCle.set(`${r.stepId ?? ''}|${r.kind}`, r);
  const attendus = new Set(attendues.map((a) => a.kind));
  // Les valeurs de l'étape qui ont leur ligne ne reviennent pas dans la rangée : deux places au plus, celles de z1.
  const jour = [...parCle.values()]
    .filter((r) => !(r.stepId === step.id && attendus.has(r.kind)))
    .sort((a, b) => a.at - b.at);
  // VB-4 : les cases « Densité initiale » et « Au fermenteur » disent déjà valeur et cible ; le bilan de clôture les répéterait en chasse fixe.
  const bilan = attendus.has('densite') && attendus.has('volume') ? undefined : cloture;
  if (!jour.length && !bilan && !attendues.length) return null;
  const stepLabel = (id?: string) => state.steps.find((s) => s.id === id)?.label ?? '';
  const valeur = (r: BrewDayReading) => (r.kind === 'densite' ? sg(r.value) : String(r.value).replace('.', ','));
  const ici = (Object.keys(READING) as ReadingKind[])
    .filter((kind) => !attendus.has(kind))
    .map((kind) => parCle.get(`${step.id}|${kind}`))
    .filter((r): r is BrewDayReading => r != null);
  const faits = attendues.filter((a) => a.reading).length;
  const maintenant = now ?? brewNow();
  const depuis = (at: number) => {
    const min = Math.max(0, Math.round((maintenant - at) / 60000));
    return min < 1 ? 'à l’instant' : `il y a ${min} min`;
  };
  return (
    <section className="brew-readings-summary bz-groupe" aria-label="Relevés de cette étape" data-attendues={attendues.length || undefined}>
      <header className="bz-groupe-tete">
        {attendues.length > 0 && <Thermometer size={14} aria-hidden="true" />}
        <h3>Relevés du jour</h3>
        {attendues.length > 0 && <span className="bz-compte bz-m">{faits}/{attendues.length}</span>}
      </header>
      {attendues.map((a) => {
        const r = a.reading;
        const avis = r ? measuredReadingFeedback(r, state, step, recipe) : null;
        const val = r ? valeur(r) : '?';
        return (
          <div className="bz-row is-mesure" key={a.kind} data-mesure={a.kind}>
            <div className="bz-nom">
              <strong>{a.nom}</strong>
              <small>
                {r ? (
                  <>
                    {depuis(r.at)}
                    {avis?.tone === 'ok' && (
                      <> · <span className="bz-mesure-ok"><Check size={14} aria-hidden="true" /> dans la cible</span></>
                    )}
                    {avis && avis.tone !== 'ok' && avis.tone !== 'watch' && avis.title && (
                      <> · <span className="bz-mesure-tard">{avis.title}</span></>
                    )}
                    {avis?.tone === 'watch' && (
                      <> · <span className="bz-mesure-hors"><TriangleAlert size={14} aria-hidden="true" /> {avis.title}</span></>
                    )}
                  </>
                ) : (
                  <>
                    {a.cible && <>cible <span className="bz-m">{a.cible}</span> · </>}
                    <span className={a.due ? 'bz-mesure-du' : 'bz-mesure-tard'}>{a.quand}</span>
                  </>
                )}
              </small>
            </div>
            <button
              type="button"
              className={`bz-dose bz-m ${r ? 'is-lecture' : 'bz-attendu'}`}
              data-tard={!r && !a.due ? '' : undefined}
              aria-label={r ? `Corriger ${a.nom} : ${val}${a.court === 'pH' ? '' : ` ${a.court}`}` : `Relever ${a.nom}`}
              onClick={() => onMeasure?.(a.kind)}
            >
              <strong>{val}</strong>
              <small>{a.court}</small>
            </button>
          </div>
        );
      })}
      {(bilan || jour.length > 0) && (
        <div className="bz-releve">
          {bilan}
          {jour.map((r) => (
            <span key={readingKey(r)}>
              {READING[r.kind].label}
              {r.stepId && r.stepId !== step.id ? ` · ${stepLabel(r.stepId)}` : ''}{' '}
              <b className="bz-m">{valeur(r)}{r.unit ? ` ${r.unit}` : ''}</b>{' '}
              <span className="bz-m bz-heure">{heureCuve(r.at)}</span>
            </span>
          ))}
        </div>
      )}
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
