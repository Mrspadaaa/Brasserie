import React, { useEffect, useMemo, useState } from 'react';
import type { HopSource } from '../../../functions/src/hopIndexSchema';
import type { HopAxis } from '../../../functions/src/hopPredictionSchema';
import type { HopExtrapolation } from '../../../functions/src/hopExtrapolationSchema';
import { assertBrewingSensoryDimension, createBrewingSensoryDefinitionReference,
  type BrewingSensoryDimension } from '../../domain/brewingSensory';
import {
  adoptBrewingNuancePlan,
  assertBrewingNuancePlan,
  proposeBrewingNuancePlans,
  reviseBrewingNuancePlan,
  type BrewingNuanceParameterChoice,
  type BrewingNuanceParameterTarget,
  type BrewingNuancePlan,
} from '../../domain/brewingNuanceProjection';
import type { PreparedBrewingScenarioContext } from '../../domain/brewingScenarioContext';
import type { HopV55Workspace } from '../../services/hopV55/contracts';
import { Input, Textarea } from '../Input';
import { HopV55ExactInput } from './ExactInput';
import { parameterChoiceFor, parameterOriginLabel, planParameterDomain, samePlanTarget, targetOptions,
  type BrewingNuanceParameterOption } from './nuancePlanParameters';
import './nuance-plan-editor.css';

export interface NuancePlanDimensionCandidate {
  dimension: BrewingSensoryDimension;
  source: { kind: 'note' | 'protocol'; reference: string; label: string };
}

export interface HopV55NuancePlanEditorProps {
  prepared: PreparedBrewingScenarioContext;
  workspace?: HopV55Workspace;
  getWorkspace(): Promise<HopV55Workspace>;
  onSave(workspace: HopV55Workspace): Promise<HopV55Workspace>;
  /** Exact dimension snapshots from note/protocol references; saved plan definitions are loaded from workspace. */
  dimensionCandidates?: NuancePlanDimensionCandidate[];
}

interface DimensionSource {
  kind: 'note' | 'protocol' | 'plan' | 'declaration';
  reference: string;
  label: string;
}

interface DimensionOption {
  reference: string;
  dimension: BrewingSensoryDimension;
  sources: DimensionSource[];
}

interface RevisionDraft {
  planReference: string;
  targetKey: string;
  min?: number;
  max?: number;
  central?: number;
  reason: string;
}

const clone = <T,>(value: T): T => structuredClone(value);
const hasText = (value: unknown): value is string => typeof value === 'string' && !!value.trim();
const collator = new Intl.Collator('fr-CH', { sensitivity: 'base', numeric: true });
const formatNumber = (value: number): string => value.toLocaleString('fr-CH', { maximumFractionDigits: 15 });
const formatRange = (range: { min: number; max: number }): string => `${formatNumber(range.min)}–${formatNumber(range.max)}`;

function dimensionReference(dimension: BrewingSensoryDimension): string {
  return createBrewingSensoryDefinitionReference(dimension, null, null).dimensionReference;
}

function sourceMeta(source: HopSource): string {
  return [source.author, source.year === null ? '' : String(source.year)].filter(Boolean).join(' · ');
}

function SourceCitation({ source }: { source: HopSource }) {
  const canOpen = /^https?:\/\//i.test(source.reference);
  return <div className="hv-npe-source">
    <b>{source.title}</b>
    {sourceMeta(source) ? <span>{sourceMeta(source)}</span> : null}
    {source.locator ? <span>Repère : {source.locator}</span> : null}
    {canOpen ? <a href={source.reference} target="_blank" rel="noreferrer">Consulter la source</a> : null}
    <details><summary>Référence exacte</summary><code>{source.reference}</code></details>
  </div>;
}

function userSource(workspaceId: string, label: string, detail: string): HopSource {
  return { title: label, author: 'Utilisateur local', year: new Date().getUTCFullYear(), kind: 'judgment',
    reference: `brewing-nuance-user:${encodeURIComponent(workspaceId)}:${crypto.randomUUID()}`, locator: detail };
}

function dimensionSourceLabel(source: DimensionSource): string {
  return source.kind === 'note' ? 'Note' : source.kind === 'protocol' ? 'Protocole'
    : source.kind === 'plan' ? 'Plan de nuance' : 'Déclaration locale';
}

function dimensionSourceSummary(sources: DimensionSource[]): string {
  const references = sources.filter((source) => source.kind !== 'plan')
    .map((source) => `${dimensionSourceLabel(source)} · ${source.label}`);
  const priorPlans = sources.filter((source) => source.kind === 'plan').length;
  if (priorPlans) references.push(`${priorPlans} plan(s) antérieur(s)`);
  return references.join(' · ');
}

function parameterLabel(plan: BrewingNuancePlan, target: BrewingNuanceParameterTarget): string {
  return targetOptions(plan).find((option) => samePlanTarget(option.target, target))?.label ?? 'Paramètre du modèle';
}

export function HopV55NuancePlanEditor({ prepared, workspace, getWorkspace, onSave, dimensionCandidates = [] }: HopV55NuancePlanEditorProps) {
  const engineData = prepared.runtime.engineData;
  const [workingWorkspace, setWorkingWorkspace] = useState(workspace);
  const [unsavedPlans, setUnsavedPlans] = useState<BrewingNuancePlan[]>([]);
  const [localDimensions, setLocalDimensions] = useState<DimensionOption[]>([]);
  const [selectedDimensionReferences, setSelectedDimensionReferences] = useState<string[]>([]);
  const [selectedModelKey, setSelectedModelKey] = useState('');
  const [dimensionName, setDimensionName] = useState('');
  const [dimensionDefinition, setDimensionDefinition] = useState('');
  const [dimensionTerms, setDimensionTerms] = useState('');
  const [dimensionReason, setDimensionReason] = useState('');
  const [adoptionReasons, setAdoptionReasons] = useState<Record<string, string>>({});
  const [revision, setRevision] = useState<RevisionDraft>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!workspace) return;
    setWorkingWorkspace((current) => !current || current.id !== workspace.id || workspace.revision >= current.revision ? workspace : current);
  }, [workspace?.id, workspace?.revision]);

  const currentWorkspace = workingWorkspace ?? workspace;
  const sourceModels = useMemo(() => engineData.knowledge
    .filter((row): row is Extract<typeof row, { kind: 'extrapolation' }> => row.kind === 'extrapolation' && row.enabled)
    .sort((left, right) => collator.compare(left.name, right.name) || collator.compare(left.id, right.id)), [engineData]);
  const availableAxes = useMemo(() => engineData.knowledge.filter((row): row is HopAxis => row.kind === 'axis'), [engineData]);

  const savedPlans = currentWorkspace?.nuancePlans ?? [];
  const plans = useMemo(() => {
    const byReference = new Map<string, BrewingNuancePlan>();
    [...savedPlans, ...unsavedPlans].forEach((plan) => byReference.set(plan.reference, plan));
    return [...byReference.values()];
  }, [savedPlans, unsavedPlans]);
  const unsavedReferences = useMemo(() => new Set(unsavedPlans.map((plan) => plan.reference)), [unsavedPlans]);

  const { dimensionOptions, invalidDimensionCandidateCount } = useMemo(() => {
    const byReference = new Map<string, DimensionOption>();
    let invalidCount = 0;
    const add = (dimension: BrewingSensoryDimension, source: DimensionSource) => {
      try {
        assertBrewingSensoryDimension(dimension);
        if (!hasText(source.reference) || !hasText(source.label)) throw Error('Référence de dimension absente.');
        if ((source.kind === 'note' || source.kind === 'protocol' || source.kind === 'declaration')
          && !dimension.sourceRefs.some((row) => row.reference === source.reference)) {
          throw Error('La source exacte de la note/protocole doit rester dans les références de la dimension.');
        }
        const reference = dimensionReference(dimension);
        const existing = byReference.get(reference);
        if (existing) {
          if (!existing.sources.some((row) => row.reference === source.reference && row.kind === source.kind)) existing.sources.push(source);
          return;
        }
        byReference.set(reference, { reference, dimension: clone(dimension), sources: [source] });
      } catch { invalidCount += 1; }
    };
    dimensionCandidates.forEach((candidate) => add(candidate.dimension, candidate.source));
    savedPlans.forEach((plan) => {
      try {
        assertBrewingNuancePlan(plan);
        plan.definitions.forEach((definition) => add(definition.dimension, {
          kind: 'plan', reference: plan.reference, label: `${plan.planId} · r${plan.revision} · ${plan.status}`,
        }));
      } catch { invalidCount += 1; }
    });
    localDimensions.forEach((option) => add(option.dimension, option.sources[0]));
    return { dimensionOptions: [...byReference.values()].sort((left, right) => collator.compare(left.dimension.name, right.dimension.name)
      || collator.compare(left.dimension.version, right.dimension.version)), invalidDimensionCandidateCount: invalidCount };
  }, [dimensionCandidates, localDimensions, savedPlans]);

  const selectedDimensions = selectedDimensionReferences.flatMap((reference) => {
    const option = dimensionOptions.find((row) => row.reference === reference);
    return option ? [option.dimension] : [];
  });
  const selectedModel = sourceModels.find((model) => `${model.id}@${model.version}` === selectedModelKey);
  const selectedRevisionPlan = plans.find((plan) => plan.reference === revision?.planReference);
  const selectedRevisionOption = selectedRevisionPlan
    ? targetOptions(selectedRevisionPlan).find((option) => option.key === revision?.targetKey) : undefined;

  const persistPlans = async (additions: BrewingNuancePlan[]) => {
    if (!additions.length) return;
    setUnsavedPlans((current) => {
      const byReference = new Map(current.map((plan) => [plan.reference, plan]));
      additions.forEach((plan) => byReference.set(plan.reference, clone(plan)));
      return [...byReference.values()];
    });
    const latest = await getWorkspace();
    if (workspace && latest.id !== workspace.id) throw Error('L’espace de travail actif a changé; les propositions restent locales à cette vue.');
    const existing = latest.nuancePlans ?? [];
    for (const plan of additions) {
      assertBrewingNuancePlan(plan);
      const sameReference = existing.find((row) => row.reference === plan.reference);
      if (sameReference && JSON.stringify(sameReference) !== JSON.stringify(plan)) throw Error('Une référence de plan existe avec un contenu différent.');
      const sameRevision = existing.find((row) => row.planId === plan.planId && row.revision === plan.revision);
      const isExactAdoptionOfStoredProposal = plan.status === 'adopted' && sameRevision?.status === 'proposed'
        && plan.adoption?.proposalReference === sameRevision.reference;
      if (sameRevision && sameRevision.reference !== plan.reference && !isExactAdoptionOfStoredProposal) {
        throw Error('Cette révision de plan existe déjà sous une autre empreinte.');
      }
      const appendedReferences = new Set(additions.map((row) => row.reference));
      if (plan.previousReference && !existing.some((row) => row.reference === plan.previousReference)
        && !appendedReferences.has(plan.previousReference)) {
        throw Error('La révision exige son plan prédécesseur exact dans le workspace.');
      }
      if (plan.status === 'adopted' && !existing.some((row) => row.reference === plan.adoption?.proposalReference && row.status === 'proposed')) {
        throw Error('Enregistre d’abord la proposition exacte avant de l’adopter.');
      }
    }
    const references = new Set(existing.map((plan) => plan.reference));
    const nextPlans = [...existing, ...additions.filter((plan) => !references.has(plan.reference))];
    if (nextPlans.length === existing.length) {
      setWorkingWorkspace(latest);
      setUnsavedPlans((current) => current.filter((plan) => !references.has(plan.reference)));
      return;
    }
    const saved = await onSave({ ...latest, nuancePlans: nextPlans, updatedAt: new Date().toISOString() });
    if (saved.id !== latest.id) throw Error('La sauvegarde a changé l’identité du workspace.');
    setWorkingWorkspace(saved);
    setUnsavedPlans((current) => current.filter((plan) => !saved.nuancePlans?.some((row) => row.reference === plan.reference)));
  };

  const createDimension = () => {
    const terms = dimensionTerms.split(/\r?\n/).map((term) => term.trim()).filter(Boolean);
    const uniqueTerms = [...new Set(terms)];
    if (!hasText(dimensionName) || !hasText(dimensionDefinition) || !uniqueTerms.length || !hasText(dimensionReason)) {
      setError('Renseigne un nom, une définition, un terme exact et la provenance de cette nuance.'); return;
    }
    const workspaceId = currentWorkspace?.id;
    if (!workspaceId) { setError('Ouvre un workspace avant de préparer un plan de nuance.'); return; }
    const dimensionId = `fine-nuance-${crypto.randomUUID()}`;
    const source = userSource(workspaceId, 'Définition de nuance déclarée par le brasseur', dimensionReason.trim());
    const dimension: BrewingSensoryDimension = { id: dimensionId, version: '1', name: dimensionName.trim(),
      definition: dimensionDefinition.trim(), terms: uniqueTerms, sourceRefs: [source] };
    try {
      assertBrewingSensoryDimension(dimension);
      const reference = dimensionReference(dimension);
      setLocalDimensions((rows) => [...rows, { reference, dimension, sources: [{ kind: 'declaration', reference: source.reference, label: source.title }] }]);
      setSelectedDimensionReferences((rows) => rows.includes(reference) ? rows : [...rows, reference]);
      setDimensionName(''); setDimensionDefinition(''); setDimensionTerms(''); setDimensionReason('');
      setError(''); setNotice('Nuance ajoutée au brouillon du plan; son lexique ne représente pas une mesure.');
    } catch (cause) { setError((cause as Error).message || 'La définition de nuance est invalide.'); }
  };

  const proposePlans = async () => {
    if (!currentWorkspace) { setError('Ouvre un workspace avant d’enregistrer un plan.'); return; }
    if (!selectedModel) { setError('Choisis un modèle de source présent dans le contexte préparé.'); return; }
    if (!selectedDimensions.length) { setError('Choisis au moins une dimension issue d’une note, d’un protocole, d’un plan ou de ta déclaration.'); return; }
    if (selectedDimensions.length !== selectedDimensionReferences.length) { setError('Une dimension sélectionnée n’est plus disponible; relis les références avant de proposer.'); return; }
    try {
      setBusy(true); setError(''); setNotice('');
      const proposed = proposeBrewingNuancePlans({
        planId: `nuance:${encodeURIComponent(currentWorkspace.id)}:${crypto.randomUUID()}`,
        dimensions: clone(selectedDimensions), sourceModel: clone(selectedModel), axes: clone(availableAxes),
        proposedAt: new Date().toISOString(), proposedBy: { origin: 'user', name: 'Utilisateur local' },
      });
      if (!proposed.length) {
        setNotice('Aucune convention de dose compatible avec ce modèle et les références chargées. Aucune borne n’a été inventée.');
        return;
      }
      await persistPlans(proposed);
      setNotice(`${proposed.length} variante${proposed.length === 1 ? '' : 's'} enregistrée${proposed.length === 1 ? '' : 's'} comme proposition. Aucune n’est adoptée.`);
    } catch (cause) { setError((cause as Error).message || 'Les propositions n’ont pas été enregistrées; leur contenu reste disponible.'); }
    finally { setBusy(false); }
  };

  const adoptPlan = async (plan: BrewingNuancePlan) => {
    const reason = adoptionReasons[plan.reference]?.trim();
    if (!reason) { setError('Explique pourquoi tu retiens cette variante avant de l’adopter.'); return; }
    if (unsavedReferences.has(plan.reference)) { setError('Enregistre d’abord cette proposition avant de l’adopter.'); return; }
    try {
      setBusy(true); setError(''); setNotice('');
      const adopted = adoptBrewingNuancePlan(plan, { adoptedAt: new Date().toISOString(),
        adoptedBy: { origin: 'user', name: 'Utilisateur local' }, reason });
      await persistPlans([adopted]);
      setNotice('Adoption explicite enregistrée comme une nouvelle version. La proposition antérieure reste intacte.');
    } catch (cause) { setError((cause as Error).message || 'L’adoption n’a pas été enregistrée.'); }
    finally { setBusy(false); }
  };

  const revisePlan = async (plan: BrewingNuancePlan) => {
    if (unsavedReferences.has(plan.reference)) { setError('Enregistre ce plan avant de créer une révision.'); return; }
    if (!revision || revision.planReference !== plan.reference || !selectedRevisionOption
      || revision.min === undefined || revision.max === undefined || revision.central === undefined) {
      setError('Choisis un paramètre, ses bornes et une centrale explicites.'); return;
    }
    if (revision.min > revision.max || revision.central < revision.min || revision.central > revision.max) {
      setError('La centrale doit rester dans la plage exacte de cette hypothèse.'); return;
    }
    if (selectedRevisionOption.strictlyPositive && revision.min <= 0) {
      setError('Ce paramètre exige une borne basse strictement positive.'); return;
    }
    if (!revision.reason.trim()) { setError('Justifie la révision avant de créer sa nouvelle version.'); return; }
    const source = userSource(currentWorkspace?.id ?? '', 'Paramètre de nuance révisé par le brasseur', revision.reason.trim());
    const choice: BrewingNuanceParameterChoice = { id: crypto.randomUUID(), target: clone(selectedRevisionOption.target),
      range: { min: revision.min, max: revision.max }, central: revision.central, origin: 'userHypothesis',
      explanation: revision.reason.trim(), sourceRefs: [source] };
    const parameterChoices = [...plan.parameterChoices.filter((row) => !samePlanTarget(row.target, choice.target)), choice];
    try {
      setBusy(true); setError(''); setNotice('');
      const revised = reviseBrewingNuancePlan(plan, { parameterChoices, proposedAt: new Date().toISOString(),
        proposedBy: { origin: 'user', name: 'Utilisateur local' }, explanation: revision.reason.trim() });
      await persistPlans([revised]);
      setRevision(undefined);
      setNotice(`Révision r${revised.revision} enregistrée comme proposition; la version antérieure reste intacte.`);
    } catch (cause) { setError((cause as Error).message || 'La révision n’a pas été enregistrée.'); }
    finally { setBusy(false); }
  };

  return <section className="hv-nuance-plan-editor" aria-labelledby="hv-npe-title">
    <header className="hv-npe-header">
      <div><p className="hv-npe-eyebrow">Plans hypothétiques de nuance</p>
        <h2 id="hv-npe-title">Choisir et adopter un cadre de calcul</h2>
        <p>Prépare une convention à partir des références déjà chargées ou d’une définition explicite. Aucun résultat de brassage n’est requis; une proposition ne devient active qu’après ton adoption motivée.</p>
      </div>
      <span className="hv-npe-workspace">{currentWorkspace ? 'Workspace local' : 'Workspace à ouvrir'}</span>
    </header>

    <section className="hv-npe-panel" aria-labelledby="hv-npe-dimensions-title">
      <div className="hv-npe-section-heading"><div><h3 id="hv-npe-dimensions-title">1. Choisir les dimensions fines</h3>
        <p>Les noms et termes restent des dimensions, pas des notes d’intensité.</p></div></div>
      {!dimensionOptions.length ? <p className="hv-npe-empty">Aucune définition disponible depuis une note, un protocole ou un plan antérieur.</p>
        : <fieldset className="hv-npe-dimension-list" disabled={busy}>
          <legend>Références disponibles</legend>
          {dimensionOptions.map((option) => <label className="hv-npe-dimension-option" key={option.reference}>
            <input type="checkbox" aria-label={`Dimension ${option.dimension.name} · ${dimensionSourceSummary(option.sources)}`}
              checked={selectedDimensionReferences.includes(option.reference)}
              onChange={(event) => setSelectedDimensionReferences((rows) => event.target.checked
                ? [...rows, option.reference] : rows.filter((reference) => reference !== option.reference))} />
            <span><b>{option.dimension.name}</b> · v{option.dimension.version}
              <small>{option.dimension.definition}</small>
              {option.dimension.terms?.length ? <small>Termes exacts : {option.dimension.terms.join(' · ')}</small> : null}
              <small>Sources : {dimensionSourceSummary(option.sources)}</small>
              <details><summary>Références de cette dimension</summary>
                <code>{option.reference}</code>
                {option.sources.map((source) => <span key={source.reference}><code>{source.reference}</code></span>)}
                <ul>{option.dimension.sourceRefs.map((source) => <li key={source.reference}>{source.title} · {source.author} · <code>{source.reference}</code></li>)}</ul>
              </details>
            </span>
          </label>)}
        </fieldset>}
      {invalidDimensionCandidateCount ? <p className="hv-npe-warning" role="status">{invalidDimensionCandidateCount} référence(s) de dimension n’ont pas passé la validation et ne sont pas proposées.</p> : null}

      <details className="hv-npe-create-dimension">
        <summary>Déclarer explicitement une nouvelle dimension</summary>
        <div className="hv-npe-grid">
          <label><span>Nom de la dimension</span><Input value={dimensionName} onChange={(event) => setDimensionName(event.target.value)} placeholder="Ex. poire fermentée" /></label>
          <label><span>Définition sémantique</span><Textarea value={dimensionDefinition} onChange={(event) => setDimensionDefinition(event.target.value)} placeholder="Décris précisément ce que recouvre ce terme." /></label>
          <label><span>Termes exacts · un par ligne</span><Textarea value={dimensionTerms} onChange={(event) => setDimensionTerms(event.target.value)} placeholder={'poire\npoire mûre'} /></label>
          <label><span>Provenance ou raison de cette déclaration</span><Textarea value={dimensionReason} onChange={(event) => setDimensionReason(event.target.value)} placeholder="Note, protocole ou motif explicite du brasseur." /></label>
        </div>
        <button type="button" className="hv-npe-secondary" disabled={busy} onClick={createDimension}>Ajouter au prochain plan</button>
      </details>
    </section>

    <section className="hv-npe-panel" aria-labelledby="hv-npe-model-title">
      <div className="hv-npe-section-heading"><div><h3 id="hv-npe-model-title">2. Proposer un plan depuis le modèle source</h3>
        <p>Les plages, centrales et sources proviennent du modèle sélectionné. Les centrales ne sont pas des mesures.</p></div></div>
      <label className="hv-npe-model-select"><span>Modèle d’extrapolation exact</span>
        <select value={selectedModelKey} disabled={busy} onChange={(event) => setSelectedModelKey(event.target.value)}>
          <option value="">Choisir un modèle chargé</option>
          {sourceModels.map((model) => <option key={`${model.id}@${model.version}`} value={`${model.id}@${model.version}`}>{model.name} · v{model.version}</option>)}
        </select>
      </label>
      {selectedModel ? <details className="hv-npe-model-source"><summary>Source et limites du modèle</summary>
        <SourceCitation source={selectedModel.source} />
        {selectedModel.limitations.map((limitation) => <p key={limitation}>{limitation}</p>)}
        <p>Conventions de dose disponibles dans le runtime : {selectedModel.axes.map((axis) => `${axis.id}@${axis.version}`).join(' · ') || 'aucune'}.</p>
        <p>Axes chargés : {availableAxes.map((axis) => `${axis.name} · ${axis.id}@${axis.version}`).join(' · ') || 'aucun'}.</p>
      </details> : null}
      <button type="button" className="hv-npe-primary" disabled={busy || !selectedModel || !selectedDimensions.length || !currentWorkspace}
        onClick={() => void proposePlans()}>
        Proposer les variantes disponibles
      </button>
    </section>

    <section className="hv-npe-panel" aria-labelledby="hv-npe-plans-title">
      <div className="hv-npe-section-heading"><div><h3 id="hv-npe-plans-title">3. Examiner, adopter ou réviser</h3>
        <p>Chaque adoption et chaque correction crée une nouvelle entrée; les versions précédentes restent intactes.</p></div></div>
      {unsavedPlans.length ? <div className="hv-npe-pending" role="status">
        <p>{unsavedPlans.length} plan(s) attendent leur sauvegarde locale.</p>
        <button type="button" className="hv-npe-secondary" disabled={busy} onClick={() => void persistPlans(unsavedPlans).catch((cause) => setError((cause as Error).message || 'Sauvegarde impossible.'))}>
          Enregistrer les plans en attente
        </button>
      </div> : null}
      {!plans.length ? <p className="hv-npe-empty">Aucun plan n’est encore proposé. Les propositions n’adoptent rien automatiquement.</p>
        : <div className="hv-npe-plans">{plans.map((plan) => {
          const planUnsaved = unsavedReferences.has(plan.reference);
          const planRevision = revision?.planReference === plan.reference ? revision : undefined;
          return <article className="hv-npe-plan" key={plan.reference}>
            <div className="hv-npe-plan-heading"><div>
              <p className="hv-npe-eyebrow">{plan.status === 'adopted' ? 'Adoptée explicitement' : 'Proposée · à examiner'} · révision {plan.revision}</p>
              <h4>{plan.definitions.map((definition) => definition.dimension.name).join(' · ')}</h4>
            </div><span>{plan.parameterChoices.length ? 'Réglages explicitement choisis' : 'Plages source conservées'}</span></div>
            <dl className="hv-npe-meta">
              <div><dt>Modèle</dt><dd>{plan.sourceModel.name} · v{plan.sourceModel.version}</dd></div>
              <div><dt>Convention de dose</dt><dd>{plan.doseAxis.name} · v{plan.doseAxis.version} · {formatRange(plan.doseAxis.scale)}</dd></div>
              <div><dt>Dimensions</dt><dd>{plan.definitions.map((definition) => `${definition.dimension.name} · ${definition.dimension.terms?.join(' / ') ?? 'lexique absent'}`).join(' · ')}</dd></div>
            </dl>
            <p className="hv-npe-caveat">Projection hypothétique conditionnelle aux sources et paramètres adoptés; aucune intensité fine n’est mesurée.</p>
            <details className="hv-npe-domain"><summary>Plages, centrales et sources utilisables</summary>
              <div className="hv-npe-domain-list">{planParameterDomain(plan).map((row, index) => <div key={`${row.label}-${row.source.reference}-${index}`}>
                <b>{row.label}</b><span>{formatRange(row.range)}{row.central === undefined ? '' : ` · centrale ${formatNumber(row.central)}`}</span>
                <SourceCitation source={row.source} />
              </div>)}</div>
              <div className="hv-npe-definitions">{plan.definitions.map((definition) => <article key={definition.contentReference}>
                <h5>{definition.dimension.name} · {definition.dimension.terms?.join(' · ')}</h5>
                <p>{definition.dimension.definition}</p>
                <p>Métrique : {definition.metric?.name ?? 'non renseignée'} · {definition.metric?.unit ?? 'unité inconnue'}.</p>
                <p>Domaine : {definition.scale?.domain ? formatRange(definition.scale.domain) : 'inconnu'}.</p>
                <ul>{definition.dimension.sourceRefs.map((source) => <li key={source.reference}>{source.title} · {source.author} · <code>{source.reference}</code></li>)}</ul>
                <details><summary>Références exactes</summary><code>{definition.dimensionReference} · {definition.contentReference}</code></details>
              </article>)}</div>
              <SourceCitation source={plan.sourceModel.source} />
            </details>
            {plan.parameterChoices.length ? <details className="hv-npe-choices"><summary>Réglages de cette variante</summary>
              <ul>{plan.parameterChoices.map((choice) => <li key={choice.id}>
                <b>{parameterLabel(plan, choice.target)}</b> · {formatRange(choice.range)} · centrale {formatNumber(choice.central)} · {parameterOriginLabel(choice.origin)}
                <p>{choice.explanation}</p>{choice.sourceRefs.map((source) => <SourceCitation key={source.reference} source={source} />)}
              </li>)}</ul>
            </details> : null}
            {plan.status === 'adopted' ? <p className="hv-npe-adoption-reason"><b>Motif d’adoption :</b> {plan.adoption?.reason}</p> : null}
            <details className="hv-npe-technical"><summary>Identité et lignée immuables</summary>
              <p>Plan · <code>{plan.planId}</code> · révision {plan.revision}</p><p>Référence · <code>{plan.reference}</code></p>
              <p>Révision précédente · {plan.previousReference ? <code>{plan.previousReference}</code> : 'aucune'}</p>
              <p>Source du modèle · <code>{plan.sourceModelReference}</code></p><p>Source de l’axe · <code>{plan.doseAxisReference}</code></p>
              <p>Proposée le {plan.proposedAt} par {plan.proposedBy.name}.</p>
            </details>
            {plan.status === 'proposed' ? <div className="hv-npe-actions">
              <label><span>Pourquoi adopter cette hypothèse ?</span><Textarea value={adoptionReasons[plan.reference] ?? ''}
                onChange={(event) => setAdoptionReasons((current) => ({ ...current, [plan.reference]: event.target.value }))}
                placeholder="Motif explicite; ce choix reste une hypothèse, pas une mesure." disabled={busy || planUnsaved} /></label>
              <button type="button" className="hv-npe-secondary" disabled={busy || planUnsaved || !adoptionReasons[plan.reference]?.trim()}
                onClick={() => void adoptPlan(plan)}>Adopter cette version</button>
              {planUnsaved ? <small>Enregistre la proposition avant de l’adopter.</small> : null}
            </div> : null}
            <div className="hv-npe-actions">
              <button type="button" className="hv-npe-secondary" disabled={busy || planUnsaved}
                onClick={() => setRevision({ planReference: plan.reference, targetKey: '', reason: '' })}>Créer une nouvelle révision</button>
            </div>
            {planRevision ? <form className="hv-npe-revision" autoComplete="off" onSubmit={(event) => { event.preventDefault(); void revisePlan(plan); }}>
              <h5>Réviser cette version vers une nouvelle proposition</h5>
              <label><span>Paramètre exact</span><select value={planRevision.targetKey} disabled={busy}
                onChange={(event) => setRevision((current) => current ? { ...current, targetKey: event.target.value, min: undefined, max: undefined, central: undefined } : current)}>
                <option value="">Choisir un paramètre de ce plan</option>
                {targetOptions(plan).map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
              </select></label>
              {selectedRevisionPlan && selectedRevisionPlan.reference === plan.reference && selectedRevisionOption ? <div className="hv-npe-source-card">
                <p><b>Plage et centrale source :</b> {formatRange(selectedRevisionOption.range)} · {formatNumber(selectedRevisionOption.central)}</p>
                <SourceCitation source={selectedRevisionOption.source} />
                {parameterChoiceFor(plan, selectedRevisionOption.target) ? <p>Choix de cette version : {formatRange(parameterChoiceFor(plan, selectedRevisionOption.target)!.range)} · {formatNumber(parameterChoiceFor(plan, selectedRevisionOption.target)!.central)}.</p> : null}
              </div> : null}
              <div className="hv-npe-number-grid">
                <HopV55ExactInput label="Borne basse" unit="selon le paramètre source" min={0} max={Number.MAX_SAFE_INTEGER}
                  value={planRevision.min} onValue={(min) => setRevision((current) => current ? { ...current, min } : current)} required />
                <HopV55ExactInput label="Borne haute" unit="selon le paramètre source" min={0} max={Number.MAX_SAFE_INTEGER}
                  value={planRevision.max} onValue={(max) => setRevision((current) => current ? { ...current, max } : current)} required />
                <HopV55ExactInput label="Centrale déclarée" unit="selon le paramètre source" min={0} max={Number.MAX_SAFE_INTEGER}
                  value={planRevision.central} onValue={(central) => setRevision((current) => current ? { ...current, central } : current)} required />
              </div>
              <label><span>Raison de la révision</span><Textarea value={planRevision.reason}
                onChange={(event) => setRevision((current) => current ? { ...current, reason: event.target.value } : current)}
                placeholder="Pourquoi tester ces bornes et cette centrale ?" disabled={busy} /></label>
              {selectedRevisionOption?.strictlyPositive && planRevision.min !== undefined && planRevision.min <= 0
                ? <p className="hv-npe-warning">Cette cible exige une borne basse strictement positive.</p> : null}
              <div className="hv-npe-actions"><button type="button" className="hv-npe-secondary" disabled={busy} onClick={() => setRevision(undefined)}>Annuler</button>
                <button type="submit" className="hv-npe-primary" disabled={busy || !selectedRevisionOption || planRevision.min === undefined
                  || planRevision.max === undefined || planRevision.central === undefined || planRevision.min > planRevision.max
                  || planRevision.central < planRevision.min || planRevision.central > planRevision.max || !planRevision.reason.trim()
                  || !!selectedRevisionOption?.strictlyPositive && planRevision.min <= 0}>Enregistrer la nouvelle proposition</button>
              </div>
            </form> : null}
          </article>;
        })}</div>}
    </section>

    {error ? <p className="hv-npe-error" role="alert">{error}</p> : null}
    {notice ? <p className="hv-npe-notice" role="status">{notice}</p> : null}
  </section>;
}
