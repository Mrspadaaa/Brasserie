import React, { useEffect, useId, useRef, useState } from 'react';
import { ShieldCheck, Pause, Play, ChevronDown } from 'lucide-react';
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
    [limits, setLimits] = useState<BrewerAiLimits>(),
    [monthlyChf, setMonthlyChf] = useState<number>();
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
        setMonthlyChf(current => current ?? (data.monthly?.limitMicroChf == null ? 5 : data.monthly.limitMicroChf / 1_000_000));
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
  const save = async (paused: boolean | undefined, nextLimits?: BrewerAiLimits, nextMonthly?: number) => {
    version.current++;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const next = nextMonthly === undefined ? await api.setBudget(paused, nextLimits) : await api.setBudget(paused, nextLimits, nextMonthly);
      setStatus(next);
      setLimits(next.limits);
      setNotice(
        paused
          ? 'IA suspendue. Les analyses en cours du compagnon sont arrêtées.'
          : nextMonthly !== undefined
            ? 'Budget mensuel enregistré. Il couvre tous les appels Gemini de l’application.'
          : nextLimits
            ? 'Plafonds enregistrés.'
            : 'IA réactivée. Les questions arrêtées peuvent être relancées.'
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
        {status?.paused ? 'IA suspendue · limites IA' : 'Limites IA'}
      </summary>
      <div className="brewer-budget-body">
        {(error || readError) && <p role="alert">{error || readError}</p>}
        {!status && !error && !readError && <p>Chargement des limites…</p>}
        {status && limits && (
          <>
            <section aria-label="Budget mensuel Gemini">
              <strong>Gemini · budget du mois</strong>
              {status.monthly?.limitMicroChf == null
                ? <p>Choisis et enregistre ton budget pour activer les analyses IA. Le montant proposé n’est pas encore activé.</p>
                : <p>{((status.monthly.usedMicroChf + status.monthly.reservedMicroChf) / 1_000_000).toLocaleString('fr-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CHF comptabilisés sur {(status.monthly.limitMicroChf / 1_000_000).toLocaleString('fr-CH')} CHF · {status.monthly.month}</p>}
              {status.monthly && status.monthly.limitMicroChf != null && status.monthly.limitMicroChf > 0 && <progress aria-label="Budget mensuel consommé ou réservé" max={status.monthly.limitMicroChf} value={Math.min(status.monthly.limitMicroChf, status.monthly.usedMicroChf + status.monthly.reservedMicroChf)} className="w-full accent-amber-400" />}
              {Boolean(status.monthly?.reservedMicroChf) && <small>Dont {(status.monthly!.reservedMicroChf / 1_000_000).toLocaleString('fr-CH', { maximumFractionDigits: 3 })} CHF réservés pour les appels en cours ou dont le coût n’a pas été confirmé.</small>}
              {status.monthly?.pricing === 'expired' && <p role="status">Révision des tarifs conseillée. Le budget continue avec les derniers tarifs de provision connus, sans garantie du montant exact facturé par Google.</p>}
              <form onSubmit={event => { event.preventDefault(); if (monthlyChf != null && Number.isFinite(monthlyChf)) void save(undefined, undefined, Math.round(Math.max(0, Math.min(100, monthlyChf)) * 1_000_000)); }}>
                <div className="flex gap-2" role="group" aria-label="Budgets mensuels proposés">
                  {[5, 10, 20].map(amount => <button key={amount} type="button" aria-pressed={monthlyChf === amount} disabled={busy} onClick={() => setMonthlyChf(amount)} className="min-h-11 flex-1">{amount} CHF</button>)}
                </div>
                <div className="brewer-budget-field"><div><label htmlFor={`${field}-monthly`}>Maximum mensuel estimé · CHF</label><small>0 à 100 CHF · renouvelé le 1er, heure de Zurich</small></div><NumberInput id={`${field}-monthly`} value={monthlyChf} onValue={setMonthlyChf} min={0} max={100} required disabled={busy} /></div>
                <button type="submit" disabled={busy || monthlyChf == null}>Enregistrer le budget mensuel</button>
              </form>
              <small>Factures, compagnon et autres analyses partagent ce budget. Chaque appel réserve une marge avant de démarrer ; à court de budget, l’IA s’arrête et la saisie manuelle reste disponible.</small>
            </section>
            <button
              type="button"
              className={status.paused ? 'is-resume' : 'is-stop'}
              disabled={busy}
              onClick={() => void save(!status.paused)}
            >
              {status.paused ? <Play size={16} /> : <Pause size={16} />}
              {status.paused ? 'Réactiver l’IA' : 'Suspendre l’IA'}
            </button>
            <details className="brewer-budget-advanced"><summary>Limites quotidiennes et par question <ChevronDown size={16} /></summary><form
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
                Trois chercheurs Flash et deux relecteurs peuvent travailler en parallèle. Jusqu’à six recherches web et deux corrections si nécessaire ; le mode Approfondi garde une seule correction. Les recherches sont incluses dans le budget estimé.
              </small>
              <button type="submit" disabled={busy}>
                Enregistrer les plafonds
              </button>
            </form></details>
            <small>
              Estimation prudente : tarifs Gemini vérifiés le {status.monthly?.pricingVerifiedAt ?? '—'}, 1 USD provisionné à 1,25 CHF. Ce montant n’est pas la facture Google : stockage, serveur, taxes et variation de change restent distincts. Un appel interrompu conserve sa réservation si son coût est inconnu.
            </small>
          </>
        )}
        {notice && <p role="status">{notice}</p>}
      </div>
    </details>
  );
}
