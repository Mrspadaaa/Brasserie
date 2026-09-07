import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, Pause, Play } from 'lucide-react';
import { BrewerChat as api } from '../services/brewerChat';
import type { BrewerAiBudget, BrewerAiLimits } from '../../functions/src/brewerLimits';

const format = (n: number) => new Intl.NumberFormat('fr-CH').format(n);
export function BrewerBudget() {
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<BrewerAiBudget>(),
    [limits, setLimits] = useState<BrewerAiLimits>();
  const [error, setError] = useState(''),
    [readError, setReadError] = useState(''),
    [notice, setNotice] = useState('');
  const version = useRef(0);
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
  const rows: Array<{
    key: 'dailyCalls' | 'dailyProCalls' | 'dailyTokens';
    label: string;
    used: number;
    min: number;
    max: number;
    step: number;
  }> = status
    ? [
        {
          key: 'dailyCalls',
          label: 'Appels Gemini',
          used: status.usage.calls,
          min: 1,
          max: 1000,
          step: 1
        },
        {
          key: 'dailyProCalls',
          label: 'Dont Pro',
          used: status.usage.proCalls,
          min: 0,
          max: 500,
          step: 1
        },
        {
          key: 'dailyTokens',
          label: 'Tokens comptabilisés',
          used: status.usage.tokens,
          min: 50000,
          max: 5000000,
          step: 50000
        }
      ]
    : [];
  return (
    <details className="brewer-budget" onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary>
        <ShieldCheck size={15} />
        {status?.paused ? 'Compagnon suspendu · limites IA' : 'Limites IA'}
      </summary>
      <div className="brewer-budget-body">
        {(error || readError) && <p role="alert">{error || readError}</p>}
        {!status && !error && !readError && <p>Chargement des limites…</p>}
        {status && (
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
            <strong>Aujourd’hui · heure de Zurich</strong>
            <dl>
              {rows.map((row) => (
                <div key={row.key}>
                  <dt>{row.label}</dt>
                  <dd>
                    {format(row.used)} / {format(status.limits[row.key])}
                  </dd>
                </div>
              ))}
            </dl>
            <p>
              Par question : {status.limits.questionCalls} appels maximum, 2 recherches web et une
              seule correction après relecture. Aucune création libre de sous-agents.
            </p>
            <details>
              <summary>Modifier les plafonds du jour</summary>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (limits) void save(undefined, limits);
                }}
              >
                {rows.map((row) => (
                  <label key={row.key}>
                    {row.label}
                    <input
                      type="number"
                      inputMode="numeric"
                      min={row.min}
                      max={row.max}
                      step={row.step}
                      required
                      disabled={busy}
                      value={limits?.[row.key] ?? ''}
                      onChange={(e) =>
                        setLimits(
                          (current) => current && { ...current, [row.key]: Number(e.target.value) }
                        )
                      }
                    />
                  </label>
                ))}
                <button type="submit" disabled={busy}>
                  Enregistrer les plafonds
                </button>
              </form>
            </details>
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
