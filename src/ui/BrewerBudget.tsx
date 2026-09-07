import React, { useEffect, useId, useRef, useState } from 'react';
import { ShieldCheck, Pause, Play } from 'lucide-react';
import { BrewerChat as api } from '../services/brewerChat';
import { NumberInput } from './NumberInput';
import { BREWER_LIMIT_BOUNDS } from '../../functions/src/brewerLimits';
import type { BrewerAiBudget, BrewerAiLimits } from '../../functions/src/brewerLimits';

const format = (n: number) => new Intl.NumberFormat('fr-CH').format(n);
type LimitKey = keyof BrewerAiLimits;

/**
 * Les cinq plafonds Gemini, tous réglables.
 *
 * ⚠️ Ils vivaient dans un `<details>` imbriqué, dont le `summary` perd son
 * triangle parce que le style le passe en `display: flex`. Rien ne disait donc
 * qu'on pouvait y toucher : le panneau se lisait comme une fiche en lecture
 * seule, jusqu'au jour où le plafond du jour bloque une question.
 */
const DAILY: Array<{ key: LimitKey; label: string; used: (u: BrewerAiBudget['usage']) => number }> =
  [
    { key: 'dailyCalls', label: 'Appels Gemini', used: (u) => u.calls },
    { key: 'dailyProCalls', label: 'Dont Pro', used: (u) => u.proCalls },
    { key: 'dailyTokens', label: 'Tokens comptabilisés', used: (u) => u.tokens }
  ];
const PER_QUESTION: Array<{ key: LimitKey; label: string }> = [
  { key: 'questionCalls', label: 'Appels par question' },
  { key: 'questionTokens', label: 'Tokens par question' }
];

/**
 * Ramène chaque plafond dans les bornes AVANT l'envoi.
 *
 * ⚠️ `NumberInput` n'applique ses bornes qu'à la sortie du champ — sans quoi un
 * minimum de 50 000 rendrait « 500 000 » impossible à taper. Un formulaire
 * envoyé sans quitter le dernier champ partirait donc hors bornes, et le
 * serveur le refuserait avec une erreur générique.
 */
const clamped = (limits: BrewerAiLimits): BrewerAiLimits =>
  Object.fromEntries(
    Object.entries(BREWER_LIMIT_BOUNDS).map(([key, bound]) => {
      const raw = Number(limits[key as LimitKey]);
      const value = Number.isFinite(raw) ? Math.round(raw) : bound.min;
      return [key, Math.min(bound.max, Math.max(bound.min, value))];
    })
  ) as BrewerAiLimits;

export function BrewerBudget() {
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<BrewerAiBudget>(),
    [limits, setLimits] = useState<BrewerAiLimits>();
  const [error, setError] = useState(''),
    [readError, setReadError] = useState(''),
    [notice, setNotice] = useState('');
  const version = useRef(0);
  const field = useId();
  useEffect(() => {
    if (!open || busy) return;
    const epoch = ++version.current;
    const refresh = async () => {
      try {
        const data = await api.budget();
        if (epoch !== version.current) return;
        setStatus(data);
        setLimits((current) => current ?? data.limits);
        setReadError('');
      } catch {
        if (epoch === version.current)
          setReadError('Les limites ne peuvent pas être chargées. Rouvre ce menu pour réessayer.');
      }
    };
    void refresh();
    const timer = setInterval(() => void refresh(), 15000);
    return () => {
      version.current++;
      clearInterval(timer);
    };
  }, [open, busy]);
  const save = async (paused: boolean | undefined, nextLimits?: BrewerAiLimits) => {
    version.current++;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const next = await api.setBudget(paused, nextLimits);
      setStatus(next);
      setLimits(next.limits);
      setNotice(
        paused
          ? 'Compagnon suspendu. Les analyses en cours sont arrêtées.'
          : nextLimits
            ? 'Plafonds enregistrés.'
            : 'Compagnon réactivé. Les questions arrêtées peuvent être relancées.'
      );
    } catch {
      setError(
        'Le changement n’a pas pu être confirmé. Vérifie l’état avant de relancer une question.'
      );
    } finally {
      setBusy(false);
    }
  };
  const cap = (key: LimitKey, label: string, hint: string) => {
    const bound = BREWER_LIMIT_BOUNDS[key];
    return (
      <div className="brewer-budget-field" key={key}>
        <div>
          <label htmlFor={`${field}-${key}`}>{label}</label>
          <small>{hint}</small>
        </div>
        <NumberInput
          id={`${field}-${key}`}
          value={limits?.[key]}
          onValue={(next: number) =>
            setLimits((current) => current && { ...current, [key]: next })
          }
          min={bound.min}
          max={bound.max}
          integer
          required
          disabled={busy}
        />
      </div>
    );
  };
  return (
    <details className="brewer-budget" onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary>
        <ShieldCheck size={15} />
        {status?.paused ? 'Compagnon suspendu · limites IA' : 'Limites IA'}
      </summary>
      <div className="brewer-budget-body">
        {(error || readError) && <p role="alert">{error || readError}</p>}
        {!status && !error && !readError && <p>Chargement des limites…</p>}
        {status && limits && (
          <>
            <button
              type="button"
              className={status.paused ? 'is-resume' : 'is-stop'}
              disabled={busy}
              onClick={() => void save(!status.paused)}
            >
              {status.paused ? <Play size={16} /> : <Pause size={16} />}
              {status.paused ? 'Réactiver le compagnon' : 'Suspendre le compagnon'}
            </button>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const next = clamped(limits);
                setLimits(next);
                void save(undefined, next);
              }}
            >
              <strong>Aujourd’hui · heure de Zurich</strong>
              {DAILY.map((row) =>
                cap(
                  row.key,
                  row.label,
                  `${format(row.used(status.usage))} utilisés · ${format(
                    BREWER_LIMIT_BOUNDS[row.key].min
                  )} à ${format(BREWER_LIMIT_BOUNDS[row.key].max)}`
                )
              )}
              <strong>Par question</strong>
              {PER_QUESTION.map((row) =>
                cap(
                  row.key,
                  row.label,
                  `${format(BREWER_LIMIT_BOUNDS[row.key].min)} à ${format(
                    BREWER_LIMIT_BOUNDS[row.key].max
                  )}`
                )
              )}
              <small>
                Restent fixes : 2 recherches web et une seule correction après relecture par
                question. Aucune création libre de sous-agents.
              </small>
              <button type="submit" disabled={busy}>
                Enregistrer les plafonds
              </button>
            </form>
            <small>
              Ces limites concernent le compagnon. Un appel déjà transmis peut rester facturé ; une
              interruption conserve une marge de consommation. Les autres services Google ont leur
              propre facturation.
            </small>
          </>
        )}
        {notice && <p role="status">{notice}</p>}
      </div>
    </details>
  );
}
