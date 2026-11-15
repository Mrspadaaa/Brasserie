import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { ShieldCheck, Pause, Play, ChevronDown, ChevronRight, Check, Smartphone, Wallet, History } from 'lucide-react';
import { BrewerChat as api } from '../services/brewerChat';
import { useBrewerJobs } from '../services/brewerJobs';
import { NumberInput } from './NumberInput';
import { BrewerNotifySwitch } from './BrewerNotifications';
import { BREWER_LIMIT_BOUNDS } from '../../functions/src/brewerLimits';
import type { BrewerAiBudget, BrewerAiLimits } from '../../functions/src/brewerLimits';
import type { BrewerMode } from '../../functions/src/companionTypes';
import { nombreFr } from '../domain/nombreAffiche';
import { MODES, NBSP, nombreTexte, partDe, renouvellement, statutsConversations } from './companion/derive';
import './companion/limites.css';

/** Ce que le serveur dit du budget : usage du jour, limites, mois en micro-CHF, suspension. */
export type BrewerBudgetStatus = BrewerAiBudget;

const format = (n: number) => new Intl.NumberFormat('fr-CH').format(n);
/** Un montant en CHF à deux décimales, virgule suisse, indépendant de la locale du navigateur (« 2,10 »). */
const chf2 = (micro: number) => (Math.round(micro / 10_000) / 100).toFixed(2).replace('.', ',');
type LimitKey = keyof BrewerAiLimits;
const MENSUEL_MAX_CHF = 100;
const toMicro = (chf: number) => Math.round(Math.max(0, Math.min(MENSUEL_MAX_CHF, chf)) * 1_000_000);
const MESSAGE_ECHEC = 'Le changement n’a pas pu être confirmé. Vérifie l’état avant de relancer une question.';

/**
 * Les plafonds hors du premier plan : approfondis du jour, jetons, et les deux limites par question.
 * Les appels du jour et le budget du mois ont leur propre carte.
 */
const DAILY: Array<{ key: LimitKey; label: string; used: (u: BrewerAiBudget['usage']) => number }> = [
  { key: 'dailyProCalls', label: 'Dont approfondis', used: (u) => u.proCalls },
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

const sameLimits = (a: BrewerAiLimits, b: BrewerAiLimits) =>
  (Object.keys(BREWER_LIMIT_BOUNDS) as LimitKey[]).every((key) => a[key] === b[key]);

/**
 * Deux textes courts pour la ligne du pied du compagnon, étiquettes comprises :
 * `${appelsJour} · ${mois}` donne « Aujourd’hui 4 sur 120 · mois 2,10 sur 15 CHF ».
 * Une donnée inconnue donne '' (jamais « 0 ») ; `atteint` : le budget du mois est consommé ou réservé.
 */
export function budgetResume(status?: BrewerBudgetStatus): { appelsJour: string; mois: string; atteint: boolean } {
  if (!status) return { appelsJour: '', mois: '', atteint: false };
  const calls = status.usage?.calls,
    plafond = status.limits?.dailyCalls;
  const appelsJour =
    typeof calls === 'number' && typeof plafond === 'number' ? `Aujourd’hui ${calls} sur ${plafond}` : '';
  const m = status.monthly;
  if (!m) return { appelsJour, mois: '', atteint: false };
  if (m.limitMicroChf == null) return { appelsJour, mois: 'budget du mois à régler', atteint: false };
  const pris = m.usedMicroChf + m.reservedMicroChf;
  return {
    appelsJour,
    mois: `mois ${chf2(pris)} sur ${nombreTexte(m.limitMicroChf / 1_000_000)}${NBSP}CHF`,
    atteint: m.limitMicroChf > 0 && pris >= m.limitMicroChf
  };
}

/** Lecture du budget + écriture, partagées par le hook public et par les deux vues. */
function useBudgetState() {
  const [status, setStatus] = useState<BrewerBudgetStatus>(),
    [loading, setLoading] = useState(true),
    [error, setError] = useState('');
  const live = useRef(true);
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.budget();
      if (!live.current) return;
      setStatus(data);
      setError('');
    } catch {
      if (live.current) setError('Les limites ne peuvent pas être chargées. Rouvre cet écran pour réessayer.');
    } finally {
      if (live.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    live.current = true;
    void refresh();
    return () => {
      live.current = false;
    };
  }, [refresh]);
  /** Relève le plafond du mois ; `true` quand le serveur l'a confirmé. */
  const saveMonthly = useCallback(async (chf: number): Promise<boolean> => {
    setError('');
    try {
      const next = await api.setBudget(undefined, undefined, toMicro(chf));
      if (live.current) setStatus(next);
      return true;
    } catch {
      if (live.current) setError(MESSAGE_ECHEC);
      return false;
    }
  }, []);
  return { status, setStatus, loading, error, setError, refresh, saveMonthly };
}

/**
 * Le budget IA, lu une fois à l'ouverture (`refresh()` relit). `saveMonthlyChf` relève le plafond du mois et ne rejette
 * jamais : un échec se lit dans `error`. Les nombres du serveur sont en micro-CHF (`status.monthly`).
 */
export function useBrewerBudget(): {
  status?: BrewerBudgetStatus;
  loading: boolean;
  error: string;
  refresh(): Promise<void>;
  saveMonthlyChf(chf: number): Promise<void>;
} {
  const { status, loading, error, refresh, saveMonthly } = useBudgetState();
  const saveMonthlyChf = useCallback(async (chf: number) => {
    await saveMonthly(chf);
  }, [saveMonthly]);
  return { status, loading, error, refresh, saveMonthlyChf };
}

const Pips = ({ n }: { n: number }) => (
  <i className="cmp-dur" aria-hidden="true">
    {[1, 2, 3].map((k) => (
      <u key={k} className={k <= n ? 'cmp-v' : ''} />
    ))}
  </i>
);

/**
 * Cadre `limites` de la maquette p2a : appels du jour, budget du mois, mode par défaut, notification, suspension,
 * renouvellement du mois. Les chiffres et les plafonds s'enregistrent par le pied (Annuler / Enregistrer) ;
 * le mode, la notification et la suspension agissent aussitôt.
 */
export function BrewerLimitsView({ onBack, mode, onMode }: { onBack(): void; mode: BrewerMode; onMode(m: BrewerMode): void }) {
  const { status, setStatus, loading, error: readError, refresh } = useBudgetState();
  const [limits, setLimits] = useState<BrewerAiLimits>(),
    [monthly, setMonthly] = useState<number>(),
    [seeded, setSeeded] = useState(false);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState('');
  const field = useId();
  /* Le premier état lu amorce les champs ; les relectures suivantes ne touchent qu'aux jauges, jamais à ce qui est en train de se taper. */
  useEffect(() => {
    if (!status || seeded) return;
    setLimits(status.limits);
    setMonthly(status.monthly?.limitMicroChf == null ? undefined : status.monthly.limitMicroChf / 1_000_000);
    setSeeded(true);
  }, [status, seeded]);
  useEffect(() => {
    const timer = setInterval(() => {
      if (!busy) void refresh();
    }, 15000);
    return () => clearInterval(timer);
  }, [busy, refresh]);

  const save = async (paused: boolean | undefined, nextLimits?: BrewerAiLimits, nextMonthly?: number) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const next =
        nextMonthly === undefined ? await api.setBudget(paused, nextLimits) : await api.setBudget(paused, nextLimits, nextMonthly);
      setStatus(next);
      return next;
    } catch {
      setError(MESSAGE_ECHEC);
      return undefined;
    } finally {
      setBusy(false);
    }
  };
  const toggleSuspend = async () => {
    if (!status) return;
    const next = await save(!status.paused);
    if (next)
      setNotice(
        next.paused
          ? 'IA suspendue. Les analyses en cours du compagnon sont arrêtées.'
          : 'IA réactivée. Les questions arrêtées peuvent être relancées.'
      );
  };
  const chooseMode = (next: BrewerMode) => {
    try {
      localStorage.setItem('brewer-chat-mode', next);
    } catch {
      /* stockage indisponible : le mode vaut pour cette session seulement */
    }
    onMode(next);
  };
  const monthlyMicro = monthly == null || !Number.isFinite(monthly) ? undefined : toMicro(monthly);
  const onSave = async () => {
    if (!status || !limits) return;
    const nextLimits = clamped(limits);
    const limitsChanged = !sameLimits(nextLimits, status.limits);
    const monthlyChanged = monthlyMicro !== undefined && monthlyMicro !== status.monthly?.limitMicroChf;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      if (limitsChanged) await api.setBudget(undefined, nextLimits);
      if (monthlyChanged) await api.setBudget(undefined, undefined, monthlyMicro);
      onBack();
    } catch {
      setError(MESSAGE_ECHEC);
      void refresh();
    } finally {
      setBusy(false);
    }
  };

  const cap = (key: LimitKey, label: string, hint: string) => {
    const bound = BREWER_LIMIT_BOUNDS[key];
    return (
      <div className="cmp-regl-l" key={key}>
        <div>
          <label htmlFor={`${field}-${key}`}>{label}</label>
          <small>{hint}</small>
        </div>
        <NumberInput
          id={`${field}-${key}`}
          className="cmp-in"
          value={limits?.[key]}
          onValue={(next: number) => setLimits((current) => current && { ...current, [key]: next })}
          min={bound.min}
          max={bound.max}
          integer
          required
          disabled={busy}
        />
      </div>
    );
  };

  const m = status?.monthly;
  const pris = m ? m.usedMicroChf + m.reservedMicroChf : 0;
  const partAppels = status ? partDe(status.usage?.calls, status.limits?.dailyCalls) : null;
  const partMois = m ? partDe(pris, m.limitMicroChf) : null;
  const renouv = m ? renouvellement(m.month, new Date()) : null;

  return (
    <div className="cmp-lx">
      {(error || readError) && (
        <p role="alert" className="cmp-note">
          {error || readError}
        </p>
      )}
      {!status && !error && !readError && loading && (
        <p aria-busy="true" className="cmp-note">
          Chargement des limites…
        </p>
      )}
      {status && limits && (
        <>
          <div className="cmp-carte cmp-regl">
            <div className="cmp-lbl">
              <span>Appels aujourd’hui</span>
              <span>
                <span className="cmp-n">{format(status.usage.calls)}</span> sur{' '}
                <span className="cmp-n">{format(status.limits.dailyCalls)}</span>
              </span>
            </div>
            <span
              className="cmp-piste"
              role="img"
              aria-label={`${status.usage.calls} appels sur ${status.limits.dailyCalls}`}
            >
              <i style={{ width: `${partAppels ?? 0}%` }} />
            </span>
            <div className="cmp-regl-l">
              <label htmlFor={`${field}-dailyCalls`}>Plafond par jour</label>
              <span className="cmp-num">
                <NumberInput
                  id={`${field}-dailyCalls`}
                  className="cmp-in"
                  value={limits.dailyCalls}
                  onValue={(next: number) => setLimits((current) => current && { ...current, dailyCalls: next })}
                  min={BREWER_LIMIT_BOUNDS.dailyCalls.min}
                  max={BREWER_LIMIT_BOUNDS.dailyCalls.max}
                  integer
                  required
                  disabled={busy}
                />
                <span>appels</span>
              </span>
            </div>
          </div>

          <div className="cmp-carte cmp-regl">
            <div className="cmp-lbl">
              <span>Budget du mois</span>
              {m?.limitMicroChf == null ? (
                <span>non réglé</span>
              ) : (
                <span>
                  <span className="cmp-n">{chf2(pris)}</span> sur{' '}
                  <span className="cmp-m">
                    <span className="cmp-n">{nombreTexte(m.limitMicroChf / 1_000_000)}</span>
                    {NBSP}CHF
                  </span>
                </span>
              )}
            </div>
            <span
              className={`cmp-piste${partMois !== null && partMois >= 100 ? ' cmp-piste-alerte' : ''}`}
              role="img"
              aria-label={
                m?.limitMicroChf == null
                  ? 'Budget du mois non réglé'
                  : `${chf2(pris)} CHF comptabilisés sur ${nombreTexte(m.limitMicroChf / 1_000_000)} CHF`
              }
            >
              <i style={{ width: `${partMois ?? 0}%` }} />
            </span>
            {m?.limitMicroChf == null && (
              <p className="cmp-note">Choisis et enregistre ton budget pour activer les analyses IA.</p>
            )}
            {Boolean(m?.reservedMicroChf) && (
              <p className="cmp-note">
                Dont {nombreFr(m!.reservedMicroChf / 1_000_000, 3)}
                {NBSP}CHF réservés pour les appels en cours ou dont le coût n’a pas été confirmé.
              </p>
            )}
            {m?.pricing === 'expired' && (
              <p role="status" className="cmp-note">
                Révision des tarifs conseillée. Le budget continue avec les derniers tarifs de provision connus, sans
                garantie du montant exact facturé.
              </p>
            )}
            <div className="cmp-regl-l">
              <label htmlFor={`${field}-monthly`}>Plafond du mois</label>
              <span className="cmp-num">
                <NumberInput
                  id={`${field}-monthly`}
                  className="cmp-in"
                  value={monthly}
                  onValue={setMonthly}
                  fractionDigits={2}
                  emptyValue={undefined}
                  min={0}
                  max={MENSUEL_MAX_CHF}
                  disabled={busy}
                />
                <span>CHF</span>
              </span>
            </div>
          </div>

          <div className="cmp-carte cmp-regl">
            <div className="cmp-lbl">
              <span>Mode par défaut · durée et coût</span>
              <span>relatifs</span>
            </div>
            <div className="cmp-modes-l" role="group" aria-label="Mode par défaut">
              {MODES.map((info) => (
                <button
                  key={info.value}
                  type="button"
                  className="cmp-ml"
                  aria-pressed={mode === info.value}
                  onClick={() => chooseMode(info.value)}
                >
                  <b>{info.label}</b>
                  <span>
                    <Pips n={info.pips} />
                    durée
                  </span>
                  <span>
                    <Pips n={info.pips} />
                    coût
                  </span>
                  <small>{info.duree}</small>
                </button>
              ))}
            </div>
          </div>

          <BrewerNotifySwitch label="Me notifier à la réponse" />

          <div className="cmp-reglage-l">
            {status.paused ? <Play className="cmp-i" size={16} aria-hidden="true" /> : <Pause className="cmp-i" size={16} aria-hidden="true" />}
            <span>
              Suspendre l’IA
              <small>{status.paused ? 'IA suspendue · tes questions restent gardées ici' : 'Tes questions restent gardées ici'}</small>
            </span>
            <button
              type="button"
              role="switch"
              className="cmp-bascule cmp-bascule-alerte"
              aria-checked={status.paused}
              aria-label="Suspendre l’IA"
              disabled={busy}
              onClick={() => void toggleSuspend()}
            >
              <i />
            </button>
          </div>

          {renouv && (
            <div className="cmp-carte cmp-mois">
              <div className="cmp-lbl">
                <span>Le budget repart {renouv.quand}</span>
                <span>
                  dans{' '}
                  <span className="cmp-m">
                    <span className="cmp-n">{renouv.jours}</span>
                    {NBSP}
                    {renouv.jours > 1 ? 'jours' : 'jour'}
                  </span>
                </span>
              </div>
              <span className="cmp-piste cmp-piste-n" role="img" aria-label={`${Math.round(renouv.pct)} % du mois écoulé`}>
                <i style={{ width: `${renouv.pct}%` }} />
              </span>
              <div className="cmp-grad">
                <span>{renouv.debut}</span>
                <span>{renouv.aujourdhui}</span>
                <span>{renouv.fin}</span>
              </div>
            </div>
          )}

          <p className="cmp-note">
            <Smartphone className="cmp-i" size={14} aria-hidden="true" />
            Limite atteinte&nbsp;: la question reste gardée ici&nbsp;; tu relèves ou tu attends.
          </p>

          <details className="cmp-detail">
            <summary>
              Limites quotidiennes et par question <ChevronDown className="cmp-i" size={16} aria-hidden="true" />
            </summary>
            <div className="cmp-detail-corps">
              <h4>Aujourd’hui · heure de Zurich</h4>
              {DAILY.map((row) =>
                cap(
                  row.key,
                  row.label,
                  `${format(row.used(status.usage))} utilisés · ${format(BREWER_LIMIT_BOUNDS[row.key].min)} à ${format(
                    BREWER_LIMIT_BOUNDS[row.key].max
                  )}`
                )
              )}
              <h4>Par question</h4>
              {PER_QUESTION.map((row) =>
                cap(
                  row.key,
                  row.label,
                  `${format(BREWER_LIMIT_BOUNDS[row.key].min)} à ${format(BREWER_LIMIT_BOUNDS[row.key].max)}`
                )
              )}
              <p className="cmp-note">
                Plusieurs recherches et relectures peuvent travailler en parallèle : jusqu’à six recherches web et deux
                corrections si nécessaire ; le mode Approfondi garde une seule correction. Les recherches sont incluses dans
                le budget estimé.
              </p>
              <p className="cmp-note">
                Ce budget est commun à toute l’application (factures, compagnon, autres analyses). Chaque appel réserve une
                marge avant de démarrer ; à court de budget, l’IA s’arrête et la saisie manuelle reste disponible.
              </p>
              <p className="cmp-note">
                Estimation prudente : tarifs vérifiés le {m?.pricingVerifiedAt ?? '—'}. Ce montant n’est pas la facture :
                stockage, serveur, taxes et variation de change restent distincts. Un appel interrompu conserve sa
                réservation si son coût est inconnu.
              </p>
            </div>
          </details>

          {notice && (
            <p role="status" className="cmp-note">
              {notice}
            </p>
          )}
        </>
      )}
      <div className="cmp-pied">
        <button type="button" className="cmp-btn cmp-g" disabled={busy} onClick={onBack}>
          Annuler
        </button>
        <button type="button" className="cmp-btn cmp-p" disabled={busy || !status || !limits} onClick={() => void onSave()}>
          <Check className="cmp-i" size={16} aria-hidden="true" />
          Enregistrer
        </button>
      </div>
    </div>
  );
}

/**
 * Ancien panneau repliable « Limites IA », gardé tant qu'un écran l'importe : il ouvre la vue Limites ci-dessus.
 * Le mode y vient du stockage local (`brewer-chat-mode`), comme dans le compagnon.
 */
export function BrewerBudget() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<BrewerMode>(() => {
    try {
      const saved = localStorage.getItem('brewer-chat-mode');
      return MODES.some((m) => m.value === saved) ? (saved as BrewerMode) : 'auto';
    } catch {
      return 'auto';
    }
  });
  return (
    <details className="brewer-budget" onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary>
        <ShieldCheck size={15} />
        Limites IA
      </summary>
      {open && <BrewerLimitsView onBack={() => setOpen(false)} mode={mode} onMode={setMode} />}
    </details>
  );
}

/**
 * Cadre `plafond` de la maquette p2a : le budget du mois est atteint, la question reste gardée ; un curseur relève le
 * plafond. `onRaised` (sinon `onLater`) est appelé quand le serveur a confirmé le nouveau plafond.
 */
export function BrewerBudgetCapView({
  onLimits,
  onLater,
  onRaised
}: {
  onLimits(): void;
  onLater(): void;
  onRaised?(): void;
}) {
  const { status, loading, error, saveMonthly } = useBudgetState();
  const { jobs } = useBrewerJobs();
  const [cible, setCible] = useState<number>();
  const [busy, setBusy] = useState(false);
  const m = status?.monthly;
  const limite = m?.limitMicroChf == null ? null : m.limitMicroChf / 1_000_000;
  const max = limite !== null && limite > 45 ? MENSUEL_MAX_CHF : 50,
    min = 5;
  const valeur = Math.min(max, Math.max(min, cible ?? Math.round((limite ?? 0) + 5)));
  const pct = (valeur - min) / (max - min);
  const ancien = limite !== null && limite >= min && limite <= max ? (limite - min) / (max - min) : -1;
  const pris = m ? m.usedMicroChf + m.reservedMicroChf : 0;
  const statuts = statutsConversations(jobs);
  const releve = async () => {
    setBusy(true);
    const ok = await saveMonthly(valeur);
    setBusy(false);
    if (ok) (onRaised ?? onLater)();
  };
  return (
    <div className="cmp-lx">
      {!status && loading && (
        <p aria-busy="true" className="cmp-note">
          Chargement du budget…
        </p>
      )}
      {error && (
        <p role="alert" className="cmp-note">
          {error}
        </p>
      )}
      {status && m && (
        <>
          <div className="cmp-carte cmp-plafond">
            <div className="cmp-pl-h">
              <Wallet className="cmp-i" size={16} aria-hidden="true" />
              <h3>{limite === null ? 'Budget IA du mois à régler' : 'Budget IA du mois atteint'}</h3>
            </div>
            {limite === null ? (
              <p className="cmp-note">Choisis un plafond pour activer les analyses IA : la question reste gardée ici.</p>
            ) : (
              <div
                className="cmp-pleine"
                role="img"
                aria-label={`${chf2(pris)} sur ${nombreTexte(limite)} CHF`}
              >
                <i />
                <span>
                  <span className="cmp-n">{chf2(pris)}</span>/
                  <span className="cmp-m">
                    <span className="cmp-n">{nombreTexte(limite)}</span>
                    {NBSP}CHF
                  </span>
                </span>
              </div>
            )}
            <div className="cmp-ligne">
              <span>Aujourd’hui</span>
              <span>
                <span className="cmp-n">{format(status.usage.calls)}</span> sur{' '}
                <span className="cmp-n">{format(status.limits.dailyCalls)}</span> appels
              </span>
            </div>
            <div className="cmp-lbl cmp-lbl-h">
              <span>Plafond du mois</span>
              <span>
                <span className="cmp-m">
                  {limite !== null && (
                    <>
                      <s className="cmp-n">{nombreTexte(limite)}</s>
                      {NBSP}→{NBSP}
                    </>
                  )}
                  <span className="cmp-n">{valeur}</span>
                  {NBSP}CHF
                </span>
              </span>
            </div>
            <div
              className="cmp-curseur"
              style={{ ['--pct' as string]: pct, ['--ancien' as string]: ancien } as React.CSSProperties}
            >
              {ancien >= 0 && <span className="cmp-cu-ancien" aria-hidden="true" />}
              <span className="cmp-cu-val" aria-hidden="true">
                <span className="cmp-m">
                  <span className="cmp-n">{valeur}</span>
                  {NBSP}CHF
                </span>
              </span>
              <input
                type="range"
                min={min}
                max={max}
                step={1}
                value={valeur}
                aria-label="Plafond du mois en CHF"
                disabled={busy}
                onChange={(event) => setCible(Number(event.currentTarget.value))}
              />
            </div>
            <div className="cmp-grad">
              <span>
                <span className="cmp-m">
                  <span className="cmp-n">{min}</span>
                  {NBSP}CHF
                </span>
              </span>
              <span>
                <span className="cmp-m">
                  <span className="cmp-n">{max}</span>
                  {NBSP}CHF
                </span>
              </span>
            </div>
            <div className="cmp-act">
              <button type="button" className="cmp-btn cmp-g" disabled={busy} onClick={onLater}>
                Plus tard
              </button>
              <button
                type="button"
                className="cmp-btn cmp-p"
                disabled={busy || (limite !== null && valeur <= limite)}
                onClick={() => void releve()}
              >
                <Check className="cmp-i" size={16} aria-hidden="true" />
                Relever à {valeur}
                {NBSP}CHF
              </button>
            </div>
          </div>

          <button type="button" className="cmp-ligne-btn" onClick={onLimits}>
            <ShieldCheck className="cmp-i" size={16} aria-hidden="true" />
            <span>Régler toutes les limites</span>
            <ChevronRight className="cmp-i" size={16} aria-hidden="true" />
          </button>

          {(() => {
            const renouv = renouvellement(m.month, new Date());
            return (
              renouv && (
                <div className="cmp-carte cmp-mois">
                  <div className="cmp-lbl">
                    <span>Le budget repart {renouv.quand}</span>
                    <span>
                      dans{' '}
                      <span className="cmp-m">
                        <span className="cmp-n">{renouv.jours}</span>
                        {NBSP}
                        {renouv.jours > 1 ? 'jours' : 'jour'}
                      </span>
                    </span>
                  </div>
                  <span className="cmp-piste cmp-piste-n" role="img" aria-label={`${Math.round(renouv.pct)} % du mois écoulé`}>
                    <i style={{ width: `${renouv.pct}%` }} />
                  </span>
                  <div className="cmp-grad">
                    <span>{renouv.debut}</span>
                    <span>{renouv.aujourdhui}</span>
                    <span>{renouv.fin}</span>
                  </div>
                </div>
              )
            );
          })()}

          {statuts.prets + statuts.enCours + statuts.echecs > 0 && (
            <div className="cmp-reglage-l">
              <History className="cmp-i" size={16} aria-hidden="true" />
              <span>Les réponses prêtes restent lisibles</span>
              <span className="cmp-pts" role="img" aria-label={`${statuts.prets} prêtes, ${statuts.enCours} en cours, ${statuts.echecs} à relancer`}>
                <i className="cmp-pv" />
                <span className="cmp-n">{statuts.prets}</span>
                <i className="cmp-pa" />
                <span className="cmp-n">{statuts.enCours}</span>
                <i className="cmp-pr" />
                <span className="cmp-n">{statuts.echecs}</span>
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
