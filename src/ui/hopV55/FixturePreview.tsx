import React, { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createHopV55FixtureServices, type HopV55FixtureMode } from '../../services/hopV55/fixtureRuntime';
import type { HopV55Services } from '../../services/hopV55/contracts';
import { loadHopV55CanonicalObservationFixture, type HopV55CanonicalObservationFixtureV1 } from '../../services/hopV55/canonicalObservationFixture';
import { HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_FIXTURE_SEED } from '../../services/hopV55/propertyAdviceRequalificationFixture';
import { HopV55Page } from './Page';
import { BrewerChat, type BrewerChatJobActivity } from '../BrewerChat';
import { createHopV55AssistedAdviceFixtureRuntime } from '../../services/hopV55/assistedAdviceFixtureRuntime';
import type { HopV55AssistedCompanionSession } from './assistedAdviceUiContracts';

const EMPTY_ASSISTED_JOBS: BrewerChatJobActivity = { jobs: [], connectionError: '' };
const emptyAssistedSnapshot = () => EMPTY_ASSISTED_JOBS;
const emptyAssistedSubscribe = () => () => {};

/** Imported only by the DEV branch in main.tsx, before App or Firebase bootstrap. */
export function HopV55FixturePreview() {
  const params = new URLSearchParams(location.search);
  const namespace = params.get('fixture') || 'integration-01';
  const assistantFixture = params.get('assistantFixture') === '1';
  const assistantDelay = params.get('assistantDelay') === 'manual' ? 'manual' : 'immediate';
  const initialMode = params.get('case') as HopV55FixtureMode;
  const [mode, setMode] = useState<HopV55FixtureMode>(['planning', 'fermenting', 'unknown', 'unknownCulture', 'nolo', 'sour'].includes(initialMode) ? initialMode : 'planning');
  const seed = mode === 'planning' && params.get('fixtureSeed') === HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_FIXTURE_SEED
    ? HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_FIXTURE_SEED
    : mode === 'unknown' && params.get('fixtureSeed') === 'unknownMassFuture' ? 'unknownMassFuture' as const
    : mode === 'fermenting' && params.get('fixtureSeed') === 'canonicalObservation' ? 'canonicalObservation' as const
    : mode === 'fermenting' && params.get('fixtureSeed') === 'canonicalContextOnly' ? 'canonicalContextOnly' as const : undefined;
  const [active, setActive] = useState<{ namespace: string; mode: HopV55FixtureMode; services?: HopV55Services; error?: string;
    observationFixture?: HopV55CanonicalObservationFixtureV1 }>();
  const activeRef = useRef<typeof active>(undefined);
  const assistantRuntime = useMemo(() => assistantFixture
    ? createHopV55AssistedAdviceFixtureRuntime({ namespace: `${namespace}-${mode}`, delay: assistantDelay })
    : undefined, [assistantDelay, assistantFixture, mode, namespace]);
  const [assistedSession, setAssistedSession] = useState<HopV55AssistedCompanionSession>();
  const assistedJobs = assistantRuntime?.runtime.jobs;
  useSyncExternalStore(
    assistedJobs?.subscribe ?? emptyAssistedSubscribe,
    assistedJobs?.snapshot ?? emptyAssistedSnapshot,
    assistedJobs?.snapshot ?? emptyAssistedSnapshot
  );
  const pendingAssistedJobs = assistantRuntime?.pending() ?? [];
  useEffect(() => { setAssistedSession(undefined); }, [assistantRuntime]);
  const openAssistedCompanion = (session: HopV55AssistedCompanionSession) => {
    if (!assistantRuntime) return;
    assistantRuntime.setSession(session);
    setAssistedSession(session);
  };
  useEffect(() => {
    const loading = { namespace, mode };
    activeRef.current = undefined;
    setActive(loading);
    let service: HopV55Services | undefined;
    let cancelled = false;
    void (async () => { try {
      service = createHopV55FixtureServices(namespace, { mode, ...(seed ? { seed } : {}) });
      const observationFixture = seed === 'canonicalObservation' ? await loadHopV55CanonicalObservationFixture() : undefined;
      if (!cancelled) {
        const ready = { namespace, mode, services: service, observationFixture };
        activeRef.current = ready;
        setActive(ready);
      }
    } catch (err) {
      if (!cancelled) {
        const failed = { namespace, mode, error: (err as Error).message };
        activeRef.current = failed;
        setActive(failed);
      }
    } })();
    return () => {
      cancelled = true;
      if (activeRef.current?.namespace === namespace && activeRef.current.mode === mode) activeRef.current = undefined;
      service?.close();
    };
  }, [namespace, mode, seed]);
  // Do not hand the prior mode's soon-to-close database to a freshly keyed Page.
  // In StrictMode, identity also rejects the first setup during its effect replay.
  const current = active?.namespace === namespace && active.mode === mode && activeRef.current === active ? active : undefined;
  return <div className="hop-v55"><div className="hv-fixture-bar" style={{ padding: '6px 10px', borderBottom: '1px solid #d7d7c8', display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', ...(assistantFixture ? { background: '#f7f5eb' } : {}) }}>
    <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>Parcours de vérification<select aria-label="Parcours de vérification" style={{ width: 'auto', fontSize: 13 }} value={mode} onChange={e => setMode(e.target.value as HopV55FixtureMode)}>
      <option value="planning">Recette avant brassage</option><option value="fermenting">Brassin en fermentation</option>
      <option value="unknown">Sans recette, passé inconnu</option><option value="nolo">Contexte NOLO</option><option value="sour">Contexte acide</option>
      <option value="unknownCulture">Programme connu, culture inconnue</option>
    </select></label><small>Fixtures synthétiques · écritures isolées · {namespace}{seed === HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_FIXTURE_SEED
      ? ' · parent historique 2,5 / contexte courant 3,25 point-fixture; même Recipe fixture'
      : seed === 'unknownMassFuture' ? ' · dossier hypothétique préexistant, une masse inconnue'
      : seed === 'canonicalObservation' ? ' · observation canonique, contrats de test explicites'
      : seed === 'canonicalContextOnly' ? ' · contexte canonique, protocoles et notes à déclarer' : ''}</small>
    {assistantFixture && assistantRuntime && <><strong role="status">Réponse assistée simulée</strong>
      <small>Aucun appel réseau/IA · transport local {assistantDelay === 'manual' ? 'avec libération manuelle' : 'à réponse immédiate'} · preuve froide du protocole calculée par l’outil canonique à partir d’une entrée de fixture 3,86 g/L (pas une dose du brasseur).</small>
      <button type="button" aria-label="Libérer la réponse assistée simulée" disabled={!pendingAssistedJobs.length}
        onClick={() => void assistantRuntime.releaseNext()}>
        Libérer la réponse simulée{pendingAssistedJobs.length ? ` · ${pendingAssistedJobs.length} en attente` : ''}
      </button>
    </>}
  </div>{current?.error ? <p role="alert">{current.error}</p> : current?.services ? <HopV55Page key={`${namespace}:${mode}`} services={current.services}
    onOpenAssistedCompanion={assistantFixture ? openAssistedCompanion : undefined}
    observationTargetChoices={current.observationFixture ? [{ id: 'canonical-contact-24h', label: 'Contact cible hypothétique · 24 h',
      role: 'targetHorizon', target: current.observationFixture.target }] : undefined} /> : <p role="status">Ouverture du dépôt de fixture…</p>}
    {assistantFixture && assistantRuntime && assistedSession && <BrewerChat
      key={`${assistedSession.request.contextLaunch.scope.kind}:${assistedSession.request.contextLaunch.scope.id}`}
      scope={assistedSession.request.contextLaunch.scope}
      label={assistedSession.label}
      {...(assistedSession.request.contextLaunch.scope.kind === 'draft' && assistedSession.context.recipe != null
        ? { draft: assistedSession.context.recipe } : {})}
      {...(assistedSession.request.contextLaunch.scope.kind === 'batch' && assistedSession.context.journal != null
        ? { localJournal: assistedSession.context.journal } : {})}
      phase={assistedSession.context.phase}
      editableTargets={[]}
      initialOpen
      assistedAdvice={{ id: assistedSession.id, request: assistedSession.request,
        onBeforeSend: assistedSession.onBeforeSend, onAssistedTurn: assistedSession.onAssistedTurn }}
      assistedRuntime={assistantRuntime.runtime}
      hideLauncher onClose={() => setAssistedSession(undefined)} />}
  </div>;
}
