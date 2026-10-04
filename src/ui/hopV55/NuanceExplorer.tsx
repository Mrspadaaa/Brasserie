import React, { useEffect, useMemo, useState } from 'react';
import { Input, Textarea } from '../Input';
import { HopV55ExactInput } from './ExactInput';
import { HopV55SensoryComparison } from './SensoryComparison';
import type { HopDescription, HopSource, HopVariety } from '../../../functions/src/hopIndexSchema';
import type { HopAxis, HopKnowledge, HopTiming } from '../../../functions/src/hopPredictionSchema';
import type { HopExtrapolation } from '../../../functions/src/hopExtrapolationSchema';
import type { HopEngineData } from '../../../functions/src/hopPredictionCore';
import type { BrewingScenarioBranchResult, BrewingScenarioResult } from '../../domain/brewingScenario';
import type { PreparedBrewingScenarioContext } from '../../domain/brewingScenarioContext';
import {
  extractBrewingSensoryDocumentaryEvidence,
  type BrewingSensoryComparisonContext,
  type BrewingSensoryComparisonDTO,
  type BrewingSensoryComparisonReference,
  type BrewingSensoryDimension,
  type BrewingSensoryLexicalRule,
} from '../../domain/brewingSensory';
import {
  adoptBrewingNuancePlan,
  brewingNuanceViewModel,
  projectBrewingNuances,
  proposeBrewingNuancePlans,
  readBrewingNuanceProjection,
  reviseBrewingNuancePlan,
  type BrewingNuanceParameterChoice,
  type BrewingNuancePlan,
  type BrewingNuanceProjection,
} from '../../domain/brewingNuanceProjection';
import { parameterChoiceFor, parameterOriginLabel, planParameterDomain, samePlanTarget, targetOptions,
  type BrewingNuanceParameterOption as ParameterOption } from './nuancePlanParameters';
import type { HopV55Workspace } from '../../services/hopV55/contracts';
import { HopV55ExplorationProfileArchive } from './ContextualExploration';
import { HOP_V55_LEXICAL_NEGATION_PREFIXES, HOP_V55_LEXICAL_RULE_SOURCE } from './contextualExplorationModel';
import './nuance-explorer.css';

export interface HopV55NuanceExplorerProps {
  prepared: PreparedBrewingScenarioContext;
  result: BrewingScenarioResult;
  snapshotReference: string;
  workspace?: HopV55Workspace;
  getWorkspace(): Promise<HopV55Workspace>;
  onSave(workspace: HopV55Workspace): Promise<HopV55Workspace>;
  /** Declared free profiles as stored in the workspace; shown beside, never merged into, this snapshot's facts. */
  explorationProfiles?: readonly unknown[];
  /** Exact profile version frozen into this branch trial; never resolved from the profile history head. */
  branchProfile?: { kind: 'persisted' | 'session'; profile: import('../../services/hopV55/explorationProfiles').HopV55ExplorationProfileV1 } | null;
}

type SavedNuancePlan = NonNullable<HopV55Workspace['nuancePlans']>[number];
type SavedNuanceStudy = NonNullable<HopV55Workspace['nuanceStudies']>[number];
type EngineData = HopEngineData;

interface FamilyChoice {
  axis: HopAxis;
  modelAxis: HopExtrapolation['axes'][number];
  key: string;
}

interface DocumentaryPhrase {
  varietyId: string;
  varietyName: string;
  description: HopDescription;
}

interface ModelTermChoice {
  key: string;
  family: FamilyChoice;
  term: string;
}

interface NuanceCandidateView {
  id: string;
  name: string;
  sourceReference: string;
  input: BrewingScenarioBranchResult['input'];
  engineData: EngineData;
  applicability?: BrewingScenarioBranchResult['applicability'];
}

interface DocumentaryMaterialReading {
  varietyId?: string;
  varietyName: string;
  dimensions: Array<ReturnType<typeof extractBrewingSensoryDocumentaryEvidence>['dimensions'][number]>;
  unknownReason?: string;
}

interface DocumentaryReading {
  candidateId: string;
  candidateName: string;
  dimension: BrewingSensoryDimension;
  materials: DocumentaryMaterialReading[];
}

const collator = new Intl.Collator('fr-CH', { sensitivity: 'base', numeric: true });
// Same documentary convention as the contextual exploration: one reading of a word everywhere.
const NEGATION_PREFIXES = HOP_V55_LEXICAL_NEGATION_PREFIXES;
const MATERIAL_PAGE_SIZE = 8;
const LEXICAL_RULE_SOURCE: HopSource = HOP_V55_LEXICAL_RULE_SOURCE;

const STATUS_LABEL: Record<string, string> = {
  documented: 'Occurrences documentaires',
  negated: 'Mentions négatives dans les sources',
  mixed: 'Mentions mixtes dans les sources',
  nonDocumented: 'Aucune occurrence dans les descriptions chargées',
  unresolved: 'Documentation insuffisante ou non résolue',
};

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr-CH');
}

function numberText(value: number): string {
  return String(value).replace('.', ',');
}

function rangeText(range: { min: number; max: number }): string {
  return `${numberText(range.min)}–${numberText(range.max)}`;
}

function sourceKey(source: HopSource): string {
  return JSON.stringify(source);
}

function uniqueSources(sources: Array<HopSource | undefined>): HopSource[] {
  const seen = new Set<string>();
  return sources.flatMap((source) => {
    if (!source) return [];
    const key = sourceKey(source);
    if (seen.has(key)) return [];
    seen.add(key);
    return [structuredClone(source)];
  });
}

function sourceMeta(source: HopSource): string {
  return [source.author, source.year === null ? '' : String(source.year)]
    .filter(Boolean)
    .join(' · ');
}

function sourceSearchText(source: HopSource): string {
  return [source.title, source.author, source.year === null ? '' : String(source.year), source.reference, source.locator ?? '']
    .filter(Boolean)
    .join(' ');
}

function SourceCitation({ source }: { source: HopSource }) {
  const canOpen = /^https?:\/\//i.test(source.reference);
  return <div className="hv-nuance__source">
    <b>{source.title}</b>
    <span>{sourceMeta(source)}</span>
    {source.locator ? <span>Repère : {source.locator}</span> : null}
    {canOpen ? <a href={source.reference} target="_blank" rel="noreferrer">Consulter la source</a> : null}
    <details className="hv-nuance__source-reference"><summary>Référence technique</summary><code>{source.reference}</code></details>
  </div>;
}

function SourceList({ sources }: { sources: HopSource[] }) {
  const unique = uniqueSources(sources);
  return unique.length ? <div className="hv-nuance__source-list">{unique.map((source, index) => <SourceCitation key={`${source.reference}-${index}`} source={source} />)}</div>
    : <p className="hv-nuance__unknown">Aucune source déclarée dans cette définition.</p>;
}

function DocumentaryEvidence({ rows }: { rows: Array<{ candidate: NuanceCandidateView; materials: DocumentaryMaterialReading[] }> }) {
  if (!rows.length) return <p className="hv-nuance__unknown">Aucune dimension fine en cours de lecture documentaire.</p>;
  return <div className="hv-nuance__documentary-candidates">{rows.map(({ candidate, materials }) => <article key={candidate.id}>
    <h4>{candidate.name} {candidate.applicability ? <small>· {applicabilityLabel(candidate.applicability)}</small> : null}</h4>
    <details className="hv-nuance__details"><summary>Provenance de cette variante</summary>
      <p>Référence : <code>{candidate.sourceReference || 'inconnue'}</code></p>
    </details>
    {materials.length ? materials.map((material, index) => <section className="hv-nuance__documentary-material" key={`${material.varietyId ?? material.varietyName}-${index}`}>
      <h5>{material.varietyName}</h5>
      {material.varietyId ? <details className="hv-nuance__details"><summary>Identifiant de la variété</summary><code>{material.varietyId}</code></details> : null}
      {material.unknownReason ? <p className="hv-nuance__unknown">{material.unknownReason} · mention et intensité inconnues.</p> : null}
      {material.dimensions.map((row) => <details className="hv-nuance__details" key={row.dimension.id + row.dimension.version}>
        <summary>{row.dimension.name} · {STATUS_LABEL[row.status] ?? 'Statut documentaire inconnu'} · le texte n’est pas une mesure</summary>
        {row.mentions.length ? <ul className="hv-nuance__mentions">{row.mentions.map((mention, mentionIndex) => <li key={`${mention.term}-${mentionIndex}`}>
          <blockquote>« {mention.text} »</blockquote>
          <span>{mention.term} · contexte {mention.context} · {mention.qualification === 'negated' ? 'négation lexicale configurée' : mention.qualification === 'qualified' ? `qualifié : ${mention.qualifierTerm}` : 'occurrence textuelle'}</span>
          <SourceCitation source={mention.source} />
        </li>)}</ul> : <p className="hv-nuance__unknown">Aucune occurrence n’a été relevée dans les descriptions chargées; ce résultat documentaire ne vaut pas zéro sensoriel.</p>}
      </details>)}
    </section>) : <p className="hv-nuance__unknown">Aucune identité de matière n’est liée au programme de ce candidat.</p>}
  </article>)}</div>;
}

function ParameterRevisionForm({ plan, options, busy, targetKey, setTargetKey, min, setMin, max, setMax,
  central, setCentral, reason, setReason, onCancel, onSubmit }: {
  plan: BrewingNuancePlan;
  options: ParameterOption[];
  busy: boolean;
  targetKey: string;
  setTargetKey(value: string): void;
  min: number | undefined;
  setMin(value: number | undefined): void;
  max: number | undefined;
  setMax(value: number | undefined): void;
  central: number | undefined;
  setCentral(value: number | undefined): void;
  reason: string;
  setReason(value: string): void;
  onCancel(): void;
  onSubmit(): void;
}) {
  const option = options.find((row) => row.key === targetKey);
  const priorChoice = option ? parameterChoiceFor(plan, option.target) : undefined;
  const canSubmit = !!option && !busy && min !== undefined && max !== undefined && central !== undefined
    && min <= max && central >= min && central <= max && !!reason.trim()
    && (!option.strictlyPositive || min > 0);
  return <form className="hv-nuance__revision-form" autoComplete="off" onSubmit={(event) => { event.preventDefault(); if (canSubmit) onSubmit(); }}>
    <h5>Nouvelle révision de paramètres</h5>
    <p>Les valeurs ci-dessous n’ont pas de préréglage. La source d’origine reste visible; ta révision sera attribuée à une hypothèse utilisateur.</p>
    <label className="hv-nuance__field"><span>Paramètre à réviser</span>
      <select value={targetKey} onChange={(event) => setTargetKey(event.target.value)}>
        <option value="">Choisir un paramètre explicite</option>
        {options.map((row) => <option key={row.key} value={row.key}>{row.label}</option>)}
      </select>
    </label>
    {option ? <div className="hv-nuance__source-card">
      <p><b>Paramètre du modèle source :</b> {rangeText(option.range)} · centrale déclarée {numberText(option.central)}</p>
      <SourceCitation source={option.source} />
      {priorChoice ? <p>Choix déjà présent dans cette version : {rangeText(priorChoice.range)} · centrale {numberText(priorChoice.central)} · origine {priorChoice.origin}.</p> : null}
    </div> : null}
    <div className="hv-nuance__numeric-grid">
      <HopV55ExactInput label="Borne basse hypothétique" unit="selon le paramètre source" min={0} max={Number.MAX_SAFE_INTEGER}
        value={min} onValue={setMin} required />
      <HopV55ExactInput label="Borne haute hypothétique" unit="selon le paramètre source" min={0} max={Number.MAX_SAFE_INTEGER}
        value={max} onValue={setMax} required />
      <HopV55ExactInput label="Centrale explicitement choisie" unit="selon le paramètre source" min={0} max={Number.MAX_SAFE_INTEGER}
        value={central} onValue={setCentral} required />
    </div>
    <label className="hv-nuance__field"><span>Raison et provenance de cette hypothèse</span>
      <Textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Pourquoi tester cette plage ? Elle restera une hypothèse, pas une mesure." />
    </label>
    <p className="hv-nuance__unknown">Si l’enveloppe révisée est plus étroite que le modèle source, elle reflète ton choix d’hypothèse, pas une calibration ni une confiance statistique.</p>
    <div className="hv-nuance__actions"><button type="button" className="hv-nuance__secondary" disabled={busy} onClick={onCancel}>Annuler</button>
      <button type="submit" className="hv-nuance__primary" disabled={!canSubmit}>Créer une nouvelle révision proposée</button></div>
  </form>;
}

function sourceRefsForBranch(branch: BrewingScenarioBranchResult): HopSource[] {
  const knowledge = branch.dependencySnapshot.engineData.knowledge.flatMap((entry) => ('source' in entry ? [entry.source] : []));
  const descriptions = branch.dependencySnapshot.engineData.varieties.flatMap((variety) => variety.descriptions.map((row) => row.source));
  const analyses = [
    ...branch.dependencySnapshot.engineData.varieties.flatMap((variety) => variety.analysis),
    ...branch.dependencySnapshot.engineData.lots.flatMap((lot) => lot.analysis),
  ].map((row) => row.source);
  const beerFacts = branch.beerContext?.facts.flatMap((fact) => fact.source ? [fact.source] : []) ?? [];
  const biologicalSources = branch.biologicalContributions.flatMap((contribution) => contribution.value?.sourceRefs ?? []);
  return uniqueSources([...knowledge, ...descriptions, ...analyses, ...beerFacts, ...biologicalSources]);
}

function comparisonContext(result: BrewingScenarioResult): BrewingSensoryComparisonContext {
  const branches = [result.baseline, ...result.branches];
  return {
    id: result.scenarioId,
    version: String(result.revision),
    kind: 'scenario',
    contentReference: result.inputReference,
    label: (result.baseline.label || 'Référence de cette prévision').replace(/\s*[·–—-]\s*branche J5\b/iu, ''),
    sourceRefs: uniqueSources(branches.flatMap(sourceRefsForBranch)),
  };
}

function intentReferenceSource(snapshotReference: string, intent: HopV55Workspace['intent']): HopSource {
  return {
    title: 'Question et critères figés pour ce snapshot',
    author: 'Utilisateur local',
    year: null,
    kind: 'judgment',
    reference: `brewing-sensory-intent:${encodeURIComponent(snapshotReference)}`,
    locator: [intent.question, ...intent.criteria.map((criterion) => `${criterion.direction}: ${criterion.label}`)].filter(Boolean).join(' · ')
      || 'Intention de lecture non détaillée.',
  };
}

function comparisonReference(
  result: BrewingScenarioResult,
  snapshotReference: string,
  intent?: HopV55Workspace['intent'],
): BrewingSensoryComparisonReference {
  return {
    id: 'baseline',
    version: String(result.revision),
    kind: result.requestSnapshot.baseline.kind,
    contentReference: result.baseline.reference,
    sourceRefs: uniqueSources([...sourceRefsForBranch(result.baseline), ...(intent ? [intentReferenceSource(snapshotReference, intent)] : [])]),
  };
}

function planPrefix(scenarioId: string, snapshotReference: string): string {
  return `nuance:${scenarioId}:${snapshotReference}:`;
}

function sourceModelAxes(model: HopExtrapolation, engineData: EngineData): FamilyChoice[] {
  const definitions = engineData.knowledge.filter((row): row is HopAxis => row.kind === 'axis');
  return model.axes.flatMap((modelAxis) => {
    const axis = definitions.find((row) => row.id === modelAxis.id && row.version === modelAxis.version);
    return axis ? [{ axis, modelAxis, key: `${axis.id}@${axis.version}` }] : [];
  });
}

function dimensionFamilyNames(dimension: BrewingSensoryDimension, engineData: EngineData): string {
  return (dimension.familyRefs ?? []).map(({ family }) => engineData.knowledge.find((row) =>
    row.kind === 'axis' && row.id === family.id && row.version === family.version)?.name ?? 'famille non résolue').join(' · ');
}

function candidateRows(result: BrewingScenarioResult): NuanceCandidateView[] {
  return [result.baseline, ...result.branches].map((branch) => ({
    id: branch.id,
    name: branch.id === result.baseline.id ? 'Référence de comparaison' : branch.label.replace(/\s*[·–—-]\s*branche J5\b/iu, ''),
    sourceReference: branch.reference,
    input: branch.input,
    engineData: branch.dependencySnapshot.engineData,
    applicability: branch.applicability,
  }));
}

function yeastDisplay(candidate: NuanceCandidateView): string {
  const id = candidate.input.yeastId;
  if (!id) return 'non renseignée';
  const yeast = candidate.engineData.knowledge.find((row) => row.kind === 'yeast' && row.id === id);
  return yeast && 'name' in yeast && typeof yeast.name === 'string' ? yeast.name : 'non retrouvée dans les sources';
}

function timingDisplay(timing: HopTiming | null | undefined): string {
  const labels: Record<HopTiming, string> = {
    firstWort: 'au premier moût',
    boil: 'pendant l’ébullition',
    whirlpool: 'après ébullition, au whirlpool',
    fermentation: 'pendant la fermentation',
    postFermentation: 'après fermentation',
  };
  return timing ? labels[timing] ?? 'emploi non renseigné' : 'emploi non renseigné';
}

function contactDurationDisplay(hours: number | null | undefined): string {
  if (hours == null) return 'durée de contact inconnue';
  if (hours >= 0 && hours < 1) {
    const minutes = hours * 60;
    const rounded = Math.round(minutes);
    const shown = Math.abs(minutes - rounded) < 0.000001 ? rounded : Number(minutes.toPrecision(5));
    return 'contact ' + numberText(shown) + ' min';
  }
  return 'contact ' + numberText(hours) + ' h';
}

function productFormDisplay(candidate: NuanceCandidateView, addition: NuanceCandidateView['input']['additions'][number]): string {
  const lot = addition.triplet.lotId
    ? candidate.engineData.lots.find((row) => row.id === addition.triplet.lotId)
    : undefined;
  const variety = lot ? undefined : candidate.engineData.varieties.find((row) => row.id === addition.triplet.varietyId);
  const form = lot?.form ?? variety?.form;
  const labels: Record<string, string> = {
    pelletT90: 'granulés T90',
    pelletT45: 'granulés T45',
    cryo: 'houblon cryogénique',
    cone: 'cônes',
    extract: 'extrait',
    unknown: 'forme inconnue',
  };
  return form ? labels[form] ?? 'forme inconnue' : 'forme inconnue';
}

function candidateDataById(rows: NuanceCandidateView[]): Readonly<Record<string, EngineData>> {
  return Object.fromEntries(rows.map((row) => [row.id, row.engineData]));
}

function userHypothesisSource(snapshotReference: string, label: string, detail: string): HopSource {
  const id = crypto.randomUUID();
  return {
    title: label,
    author: 'Utilisateur local',
    year: new Date().getUTCFullYear(),
    kind: 'judgment',
    reference: `brewing-nuance-hypothesis:${encodeURIComponent(snapshotReference)}:${id}`,
    locator: detail,
  };
}

function lexicalRule(dimension: BrewingSensoryDimension): BrewingSensoryLexicalRule {
  return {
    id: `lexical-${dimension.id}`,
    version: dimension.version,
    dimensionRef: { id: dimension.id, version: dimension.version },
    terms: [...(dimension.terms ?? [])],
    // These explicit word-boundary exclusions mirror the broad model matcher.
    // Original quotations stay visible; this never becomes an intensity score.
    negationPrefixes: [...NEGATION_PREFIXES],
    sourceRefs: uniqueSources([...dimension.sourceRefs, LEXICAL_RULE_SOURCE]),
  };
}

function availableDocumentPhrases(result: BrewingScenarioResult): DocumentaryPhrase[] {
  const branches = [result.baseline, ...result.branches];
  const values = branches.flatMap((branch) => branch.dependencySnapshot.engineData.varieties.flatMap((variety) =>
    variety.descriptions.map((description) => ({ varietyId: variety.id, varietyName: variety.name, description }))));
  const unique = new Map<string, DocumentaryPhrase>();
  for (const row of values) {
    const key = `${row.varietyId}\0${row.description.context}\0${row.description.text}\0${sourceKey(row.description.source)}`;
    if (!unique.has(key)) unique.set(key, row);
  }
  return [...unique.values()].sort((a, b) => collator.compare(a.varietyName, b.varietyName)
    || collator.compare(a.description.text, b.description.text));
}

function documentaryPhraseKey(varietyId: string, description: HopDescription): string {
  return [varietyId, description.text, description.context, sourceKey(description.source)].join('\u0000');
}

function documentaryEvidenceForTerms(
  choices: ModelTermChoice[],
  phrases: DocumentaryPhrase[],
): Map<string, DocumentaryPhrase[]> {
  const evidence = new Map(choices.map((choice) => [choice.key, [] as DocumentaryPhrase[]]));
  if (!choices.length) return evidence;
  const dimensions: BrewingSensoryDimension[] = choices.map((choice, index) => ({
    id: 'documentary-term-' + index,
    version: '1',
    name: choice.term,
    definition: 'Repère temporaire de recherche documentaire; aucune mesure ni intensité.',
    sourceRefs: [LEXICAL_RULE_SOURCE],
    terms: [choice.term],
  }));
  const rules: BrewingSensoryLexicalRule[] = dimensions.map((dimension, index) => ({
    id: 'documentary-term-rule-' + index,
    version: '1',
    dimensionRef: { id: dimension.id, version: dimension.version },
    terms: [...(dimension.terms ?? [])],
    negationPrefixes: [...NEGATION_PREFIXES],
    sourceRefs: [LEXICAL_RULE_SOURCE],
  }));
  const rowsByKey = new Map(phrases.map((row) => [documentaryPhraseKey(row.varietyId, row.description), row]));
  const evidenceKeys = new Map(choices.map((choice) => [choice.key, new Set<string>()]));
  const varieties = new Map<string, { id: string; name: string; descriptions: HopDescription[] }>();
  for (const row of phrases) {
    const prior = varieties.get(row.varietyId);
    if (prior) prior.descriptions.push(row.description);
    else varieties.set(row.varietyId, { id: row.varietyId, name: row.varietyName, descriptions: [row.description] });
  }
  for (const variety of varieties.values()) {
    const extracted = extractBrewingSensoryDocumentaryEvidence(variety, dimensions, rules);
    extracted.dimensions.forEach((dimensionEvidence, index) => {
      for (const mention of dimensionEvidence.mentions) {
        const phraseKey = documentaryPhraseKey(variety.id, {
          text: mention.text,
          context: mention.context,
          source: mention.source,
        });
        const row = rowsByKey.get(phraseKey);
        const matchedKeys = evidenceKeys.get(choices[index].key);
        if (row && matchedKeys && !matchedKeys.has(phraseKey)) {
          matchedKeys.add(phraseKey);
          evidence.get(choices[index].key)?.push(row);
        }
      }
    });
  }
  return evidence;
}

function sourceModelList(engineData: EngineData): HopExtrapolation[] {
  const valid = engineData.knowledge.filter((row): row is Extract<HopKnowledge, { kind: 'extrapolation' }> => row.kind === 'extrapolation' && row.enabled);
  return valid.sort((a, b) => collator.compare(a.name, b.name) || collator.compare(a.id, b.id));
}

function documentaryCandidateRows(candidate: NuanceCandidateView, dimensions: BrewingSensoryDimension[]): DocumentaryMaterialReading[] {
  const varietyById = new Map(candidate.engineData.varieties.map((row) => [row.id, row]));
  const lots = new Map(candidate.engineData.lots.map((row) => [row.id, row]));
  const materialIds = new Set<string>();
  const rows: DocumentaryMaterialReading[] = [];
  if (!candidate.input.additions.length) {
    return [{ varietyName: 'Aucun ajout de houblon déclaré', dimensions: [],
      unknownReason: 'Aucune nuance n’est projetée pour une variante sans matière.' }];
  }
  for (const addition of candidate.input.additions) {
    const varietyId = addition.triplet.varietyId ?? (addition.triplet.lotId ? lots.get(addition.triplet.lotId)?.varietyId : null);
    if (!varietyId) {
      rows.push({ varietyName: addition.name || addition.id, dimensions: [], unknownReason: 'Identité de variété inconnue dans cette addition.' });
      continue;
    }
    if (materialIds.has(varietyId)) continue;
    materialIds.add(varietyId);
    const variety = varietyById.get(varietyId);
    if (!variety) {
      rows.push({ varietyId, varietyName: 'Variété non retrouvée', dimensions: [], unknownReason: 'La variété liée à cette variante n’est pas présente dans les sources documentaires.' });
      continue;
    }
    const extracted = dimensions.map((dimension) => extractBrewingSensoryDocumentaryEvidence(variety, [dimension], [lexicalRule(dimension)]).dimensions[0]);
    rows.push({ varietyId, varietyName: variety.name, dimensions: extracted,
      ...(!variety.descriptions.length ? { unknownReason: 'Aucune description documentaire de cette variété n’est conservée avec cette prévision.' } : {}) });
  }
  return rows;
}

function applicabilityLabel(value: BrewingScenarioBranchResult['applicability']): string {
  switch (value) {
    case 'available': return 'Aperçu possible';
    case 'conditional': return 'Sous conditions';
    case 'unavailable': return 'Indisponible dans ce contexte';
    case 'hypotheticalOnly': return 'Hypothèse, non applicable';
  }
}

function factStatusLabel(status: string): string {
  switch (status) {
    case 'observed': return 'Observation';
    case 'reported': return 'Rapporté';
    case 'target': return 'Cible';
    case 'proposed': return 'Proposé';
    case 'selected': return 'Hypothèse retenue';
    case 'unknown': return 'Inconnu';
    default: return status;
  }
}

function factValueText(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return 'valeur non renseignée';
  return typeof value === 'number' ? numberText(value) : String(value);
}

function biologicalKindLabel(kind: string): string {
  if (kind === 'yeastOwnProducts') return 'Expression propre de la levure';
  if (kind === 'hopPrecursorTransformation') return 'Transformation d’un précurseur de houblon';
  if (kind === 'compoundTransferLoss') return 'Extraction, rétention ou perte';
  return kind;
}

function storedComparisonForStudy(study: SavedNuanceStudy): {
  projection?: BrewingNuanceProjection;
  comparison?: BrewingSensoryComparisonDTO;
  unsupported?: boolean;
  error?: string;
} {
  try {
    const projection = readBrewingNuanceProjection(study.projection);
    if ('status' in projection) return { unsupported: true };
    const comparison = brewingNuanceViewModel(projection, { context: study.context, reference: study.reference });
    return { projection, comparison };
  } catch (error) {
    return { error: (error as Error).message || 'Archive de nuance illisible.' };
  }
}

export function HopV55NuanceExplorer({
  prepared,
  result,
  snapshotReference,
  workspace,
  getWorkspace,
  onSave,
  explorationProfiles,
  branchProfile,
}: HopV55NuanceExplorerProps) {
  const snapshotEngineData = result.baseline.dependencySnapshot.engineData;
  const sourceModels = useMemo(() => sourceModelList(snapshotEngineData), [snapshotEngineData]);
  const sourcePhrases = useMemo(() => availableDocumentPhrases(result), [result]);
  const candidates = useMemo(() => candidateRows(result), [result]);
  const scopePrefix = planPrefix(result.scenarioId, snapshotReference);
  const snapshotIntent = workspace?.snapshotIntents?.find((row) => row.scenarioId === result.scenarioId
    && row.snapshotReference === snapshotReference)?.intent;

  const [workingWorkspace, setWorkingWorkspace] = useState(workspace);
  const [unsavedPlans, setUnsavedPlans] = useState<BrewingNuancePlan[]>([]);
  const [sourceModelKey, setSourceModelKey] = useState('');
  const [familyKey, setFamilyKey] = useState('');
  const [dimensionName, setDimensionName] = useState('');
  const [dimensionDefinition, setDimensionDefinition] = useState('');
  const [dimensions, setDimensions] = useState<BrewingSensoryDimension[]>([]);
  const [terms, setTerms] = useState<string[]>([]);
  const [termDraft, setTermDraft] = useState('');
  const [termSearch, setTermSearch] = useState('');
  const [familyFilterKey, setFamilyFilterKey] = useState('');
  const [visibleTermCount, setVisibleTermCount] = useState(24);
  const [phraseSearch, setPhraseSearch] = useState('');
  const [visiblePhraseCount, setVisiblePhraseCount] = useState(MATERIAL_PAGE_SIZE);
  const [adoptionReasons, setAdoptionReasons] = useState<Record<string, string>>({});
  const [revisionPlanReference, setRevisionPlanReference] = useState('');
  const [revisionTargetKey, setRevisionTargetKey] = useState('');
  const [revisionMin, setRevisionMin] = useState<number | undefined>();
  const [revisionMax, setRevisionMax] = useState<number | undefined>();
  const [revisionCentral, setRevisionCentral] = useState<number | undefined>();
  const [revisionReason, setRevisionReason] = useState('');
  const [pendingStudy, setPendingStudy] = useState<SavedNuanceStudy>();
  const [openedStudyId, setOpenedStudyId] = useState('');
  const [candidateIds, setCandidateIds] = useState<string[]>([]);
  const [dimensionIds, setDimensionIds] = useState<string[]>([]);
  const [mode, setMode] = useState<'bars' | 'radar'>('bars');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!workspace) return;
    setWorkingWorkspace((current) => !current || current.id !== workspace.id || workspace.revision >= current.revision ? workspace : current);
  }, [workspace?.id, workspace?.revision]);

  const currentWorkspace = workingWorkspace ?? workspace;
  const savedPlans = currentWorkspace?.nuancePlans ?? [];
  const plans = useMemo(() => {
    const byReference = new Map<string, BrewingNuancePlan>();
    [...savedPlans, ...unsavedPlans].forEach((plan) => {
      if (plan.planId.startsWith(scopePrefix)) byReference.set(plan.reference, plan);
    });
    return [...byReference.values()];
  }, [savedPlans, unsavedPlans, scopePrefix]);
  const unsavedReferences = useMemo(() => new Set(unsavedPlans.map((plan) => plan.reference)), [unsavedPlans]);
  const studies = (currentWorkspace?.nuanceStudies ?? []).filter((study) => study.scenarioId === result.scenarioId
    && study.snapshotReference === snapshotReference);
  const openedSavedStudy = studies.find((study) => study.id === openedStudyId);
  const activeStudy = openedSavedStudy ?? (pendingStudy?.scenarioId === result.scenarioId && pendingStudy.id === openedStudyId ? pendingStudy : undefined);
  const archiveRead = activeStudy ? storedComparisonForStudy(activeStudy) : undefined;
  const comparison = archiveRead?.comparison;
  const activeProjection = archiveRead?.projection;

  const selectedModel = sourceModels.find((model) => `${model.id}@${model.version}` === sourceModelKey);
  const familyChoices = useMemo(() => selectedModel ? sourceModelAxes(selectedModel, snapshotEngineData) : [],
    [selectedModel, snapshotEngineData]);
  const selectedFamily = familyChoices.find((row) => row.key === familyKey);
  const focusedFamily = familyChoices.find((row) => row.key === familyFilterKey);
  const modelTermChoices = useMemo<ModelTermChoice[]>(() => selectedModel ? familyChoices.flatMap((family) =>
    family.modelAxis.terms.map((term) => ({ key: family.key + '\u0000' + term, family, term }))) : [],
  [selectedModel, familyChoices]);
  const normalizedTermSearch = normalize(termSearch.trim());
  const matchingModelTerms = useMemo(() => {
    const inFocusedFamily = modelTermChoices.filter((choice) => {
      if (familyFilterKey && choice.family.key !== familyFilterKey) return false;
      return true;
    });
    const matchingTerms = normalizedTermSearch
      ? inFocusedFamily.filter((choice) => normalize(choice.term).includes(normalizedTermSearch))
      : inFocusedFamily;
    if (matchingTerms.length || !normalizedTermSearch) return matchingTerms;
    return inFocusedFamily.filter((choice) =>
      normalize(choice.family.axis.name + ' ' + choice.family.axis.description).includes(normalizedTermSearch));
  }, [modelTermChoices, familyFilterKey, normalizedTermSearch]);
  const visibleModelTerms = useMemo(() => matchingModelTerms.slice(0, visibleTermCount), [matchingModelTerms, visibleTermCount]);
  const visibleModelTermEvidence = useMemo(() => documentaryEvidenceForTerms(visibleModelTerms, sourcePhrases),
    [visibleModelTerms, sourcePhrases]);
  const currentPlan = plans.find((plan) => plan.reference === revisionPlanReference);
  const currentPlanTargets = currentPlan ? targetOptions(currentPlan) : [];
  const selectedRevisionTarget = currentPlanTargets.find((option) => option.key === revisionTargetKey);

  const phraseQuery = normalize(phraseSearch.trim());
  const matchingPhrases = useMemo(() => {
    if (phraseQuery.length < 2) return [];
    return sourcePhrases.filter((row) => normalize(`${row.varietyName} ${row.description.text} ${row.description.context} ${sourceSearchText(row.description.source)}`).includes(phraseQuery));
  }, [phraseQuery, sourcePhrases]);
  const visiblePhrases = matchingPhrases.slice(0, visiblePhraseCount);

  const planDimensions = (plan: BrewingNuancePlan | undefined) => plan?.definitions.map((definition) => definition.dimension) ?? [];
  const documentaryDimensions = activeProjection
    ? planDimensions(activeProjection.planSnapshot)
    : planDimensions(currentPlan).length ? planDimensions(currentPlan) : dimensions;

  const persistPlans = async (additions: BrewingNuancePlan[]) => {
    if (!additions.length) return;
    setUnsavedPlans((current) => {
      const byReference = new Map(current.map((plan) => [plan.reference, plan]));
      additions.forEach((plan) => byReference.set(plan.reference, structuredClone(plan)));
      return [...byReference.values()];
    });
    const latest = await getWorkspace();
    if (workspace && latest.id !== workspace.id) throw Error('L’espace de travail actif a changé; les hypothèses restent en brouillon dans cette vue.');
    const existing = latest.nuancePlans ?? [];
    const references = new Set(existing.map((plan) => plan.reference));
    const nextPlans = [...existing, ...additions.filter((plan) => !references.has(plan.reference))];
    if (nextPlans.length === existing.length) {
      setWorkingWorkspace(latest);
      setUnsavedPlans((current) => current.filter((plan) => !references.has(plan.reference)));
      return;
    }
    const saved = await onSave({ ...latest, nuancePlans: nextPlans, updatedAt: new Date().toISOString() });
    setWorkingWorkspace(saved);
    setUnsavedPlans((current) => current.filter((plan) => !saved.nuancePlans?.some((row) => row.reference === plan.reference)));
  };

  const persistStudies = async (study: SavedNuanceStudy): Promise<HopV55Workspace> => {
    const latest = await getWorkspace();
    if (workspace && latest.id !== workspace.id) throw Error('L’espace de travail actif a changé; l’étude reste visible et peut être réessayée.');
    if (!latest.scenarioIds.includes(study.scenarioId)) throw Error('Cette prévision n’appartient plus à l’espace de travail actif.');
    const prior = latest.nuanceStudies ?? [];
    const sameProjection = prior.find((row) => row.scenarioId === study.scenarioId
      && row.snapshotReference === study.snapshotReference && row.projection.reference === study.projection.reference);
    if (sameProjection) return latest;
    const saved = await onSave({ ...latest, nuanceStudies: [...prior, structuredClone(study)], updatedAt: new Date().toISOString() });
    setWorkingWorkspace(saved);
    return saved;
  };

  const addTerm = () => {
    const term = termDraft.trim();
    if (!term) { setError('Saisis un terme ou une expression exacte avant de l’ajouter.'); return; }
    if (terms.some((existing) => normalize(existing) === normalize(term))) {
      setError('Ce terme est déjà présent sous cette forme lexicale.'); return;
    }
    setTerms((current) => [...current, term]);
    setTermDraft('');
    setError('');
  };

  const addSourcedTerm = (choice: ModelTermChoice) => {
    if (!selectedModel) { setError('Choisis d’abord la source des termes et des paramètres.'); return; }
    const familyIdentity = choice.family.axis.id + '@' + choice.family.axis.version;
    if (dimensions.some((dimension) => dimension.familyRefs?.some((row) => row.family.id + '@' + row.family.version === familyIdentity)
      && dimension.terms?.some((term) => normalize(term) === normalize(choice.term)))) {
      setNotice('« ' + choice.term + ' » est déjà proposé pour cette famille.');
      return;
    }
    const occurrences = visibleModelTermEvidence.get(choice.key) ?? [];
    const familySources = uniqueSources([choice.family.axis.source, choice.family.modelAxis.source]);
    const documentarySources = occurrences.map((row) => row.description.source);
    const ruleSource = userHypothesisSource(snapshotReference, 'Convention lexicale documentaire proposée',
      'Repérage exact de « ' + choice.term + ' » par frontières de mots. Les négations configurées restent visibles dans les citations. Une occurrence ne mesure pas une intensité; aucune occurrence ne vaut pas zéro.');
    const dimension: BrewingSensoryDimension = {
      id: 'fine-nuance-' + crypto.randomUUID(),
      version: '1',
      name: choice.term,
      definition: 'Terme « ' + choice.term + ' » repris du lexique du modèle « ' + selectedModel.name
        + ' » et rattaché à la famille « ' + choice.family.axis.name
        + ' ». Convention documentaire proposée : repérage lexical exact par frontières de mots; les citations et négations restent visibles. Une occurrence ne mesure pas une intensité, et une occurrence absente ne vaut pas zéro.',
      terms: [choice.term],
      sourceRefs: uniqueSources([selectedModel.source, ...familySources, ...documentarySources, ruleSource, LEXICAL_RULE_SOURCE]),
      familyRefs: [{ family: { id: choice.family.axis.id, version: choice.family.axis.version },
        relation: 'memberOf', sourceRefs: familySources }],
    };
    setDimensions((current) => [...current, dimension]);
    setError('');
    setNotice('« ' + choice.term + ' » ajouté comme repère documentaire proposé. Aucun niveau ni coefficient n’a été choisi.');
  };

  const createDimension = () => {
    if (!selectedModel || !selectedFamily) { setError('Choisis explicitement un modèle source et une famille parent.'); return; }
    if (!dimensionName.trim() || !dimensionDefinition.trim()) { setError('Donne un nom et une définition à cette nuance.'); return; }
    if (!terms.length) { setError('Ajoute au moins un terme exact au lexique de cette nuance.'); return; }
    const ruleSource = userHypothesisSource(snapshotReference, 'Lexique de nuance choisi par le brasseur',
      `Libellé: ${dimensionName.trim()}. Définition: ${dimensionDefinition.trim()}. Termes exacts: ${terms.join(' · ')}. Aucune intensité n’est déduite du choix des mots.`);
    const familySourceRefs = uniqueSources([selectedFamily.axis.source, selectedFamily.modelAxis.source]);
    const draft: BrewingSensoryDimension = {
      id: `fine-nuance-${crypto.randomUUID()}`,
      version: '1',
      name: dimensionName.trim(),
      definition: dimensionDefinition.trim(),
      terms: [...terms],
      sourceRefs: uniqueSources([ruleSource, LEXICAL_RULE_SOURCE, ...familySourceRefs]),
      familyRefs: [{ family: { id: selectedFamily.axis.id, version: selectedFamily.axis.version }, relation: 'memberOf', sourceRefs: familySourceRefs }],
    };
    const rule = lexicalRule(draft);
    const documentarySources = snapshotEngineData.varieties.flatMap((variety) => {
      const extraction = extractBrewingSensoryDocumentaryEvidence(variety, [draft], [rule]);
      return extraction.dimensions.flatMap((row) => row.mentions.map((mention) => mention.source));
    });
    const dimension = { ...draft, sourceRefs: uniqueSources([...draft.sourceRefs, ...documentarySources]) };
    setDimensions((current) => [...current, dimension]);
    setDimensionName('');
    setDimensionDefinition('');
    setFamilyKey('');
    setTerms([]);
    setError('');
    setNotice('Nuance enregistrée dans le brouillon de cette vue. Son libellé et son lexique ne sont ni une mesure ni une intensité.');
  };

  const proposePlans = async () => {
    if (!selectedModel) { setError('Choisis explicitement le modèle source de ces hypothèses.'); return; }
    if (!dimensions.length) { setError('Définis au moins une nuance avec un libellé, une définition et un lexique exact.'); return; }
    const modelFamilyKeys = new Set(selectedModel.axes.map((row) => `${row.id}@${row.version}`));
    if (dimensions.some((dimension) => !dimension.familyRefs?.some((family) => modelFamilyKeys.has(`${family.family.id}@${family.family.version}`)))) {
      setError('Une dimension appartient à une famille d’un autre modèle; sélectionne le modèle correspondant ou recrée cette dimension.'); return;
    }
    try {
      setBusy(true); setError(''); setNotice('');
      const proposedAt = new Date().toISOString();
      const proposed = proposeBrewingNuancePlans({
        planId: `${planPrefix(result.scenarioId, snapshotReference)}${crypto.randomUUID()}`,
        dimensions,
        sourceModel: selectedModel,
        axes: snapshotEngineData.knowledge.filter((row): row is HopAxis => row.kind === 'axis'),
        proposedAt,
        proposedBy: { origin: 'model', name: `Proposition locale · ${selectedModel.name}` },
      });
      if (!proposed.length) {
        setNotice('Aucune convention de dose compatible avec cette prévision. Aucun paramètre de remplacement n’a été inventé.');
        return;
      }
      setRevisionPlanReference('');
      setAdoptionReasons({});
      await persistPlans(proposed);
      setNotice(`${proposed.length} variante${proposed.length === 1 ? '' : 's'} enregistrée${proposed.length === 1 ? '' : 's'} comme hypothèse à examiner. Aucune n’est adoptée.`);
    } catch (cause) {
      setError((cause as Error).message || 'Les variantes n’ont pas pu être conservées. Le brouillon reste disponible.');
    } finally { setBusy(false); }
  };

  const adoptPlan = async (plan: BrewingNuancePlan) => {
    const reason = adoptionReasons[plan.reference]?.trim();
    if (!reason) { setError('Explique pourquoi tu retiens cette variante avant de l’adopter.'); return; }
    if (unsavedReferences.has(plan.reference)) { setError('Enregistre d’abord cette proposition avant de l’adopter.'); return; }
    try {
      setBusy(true); setError(''); setNotice('');
      const adopted = adoptBrewingNuancePlan(plan, {
        adoptedAt: new Date().toISOString(),
        adoptedBy: { origin: 'user', name: 'Utilisateur local' },
        reason,
      });
      await persistPlans([adopted]);
      setNotice('Adoption explicite enregistrée comme une nouvelle version. La proposition antérieure reste intacte.');
    } catch (cause) {
      setError((cause as Error).message || 'Cette variante n’a pas pu être adoptée; son hypothèse reste consultable.');
    } finally { setBusy(false); }
  };

  const revisePlanParameter = async (plan: BrewingNuancePlan) => {
    if (!selectedRevisionTarget || revisionMin === undefined || revisionMax === undefined || revisionCentral === undefined) {
      setError('Renseigne une borne basse, une borne haute et une centrale explicite.'); return;
    }
    if (revisionMin > revisionMax || revisionCentral < revisionMin || revisionCentral > revisionMax) {
      setError('La centrale doit rester dans les bornes exactes de cette hypothèse.'); return;
    }
    if (selectedRevisionTarget.strictlyPositive && revisionMin <= 0) {
      setError('La convention sélectionnée exige une borne basse strictement positive.'); return;
    }
    if (!revisionReason.trim()) { setError('Justifie cette révision de paramètres avant de créer une nouvelle version.'); return; }
    try {
      setBusy(true); setError(''); setNotice('');
      const source = userHypothesisSource(snapshotReference, 'Paramètre hypothétique saisi par le brasseur', revisionReason.trim());
      const choice: BrewingNuanceParameterChoice = {
        id: crypto.randomUUID(),
        target: structuredClone(selectedRevisionTarget.target),
        range: { min: revisionMin, max: revisionMax },
        central: revisionCentral,
        origin: 'userHypothesis',
        explanation: revisionReason.trim(),
        sourceRefs: [source],
      };
      const parameterChoices = [...plan.parameterChoices.filter((row) => !samePlanTarget(row.target, choice.target)), choice];
      const revised = reviseBrewingNuancePlan(plan, {
        parameterChoices,
        proposedAt: new Date().toISOString(),
        proposedBy: { origin: 'user', name: 'Utilisateur local' },
        explanation: revisionReason.trim(),
      });
      await persistPlans([revised]);
      setRevisionPlanReference(''); setRevisionTargetKey(''); setRevisionMin(undefined); setRevisionMax(undefined); setRevisionCentral(undefined); setRevisionReason('');
      setNotice(`Révision r${revised.revision} enregistrée comme proposition. La version précédente et son adoption ne changent pas.`);
    } catch (cause) {
      setError((cause as Error).message || 'La révision n’a pas pu être enregistrée.');
    } finally { setBusy(false); }
  };

  const saveStudy = async (study: SavedNuanceStudy): Promise<HopV55Workspace> => {
    const latest = await getWorkspace();
    if (workspace && latest.id !== workspace.id) throw Error('L’espace de travail actif a changé; l’étude reste visible et peut être réessayée.');
    if (!latest.scenarioIds.includes(study.scenarioId)) throw Error('Cette prévision n’appartient plus à l’espace de travail actif.');
    const existing = latest.nuanceStudies ?? [];
    const prior = existing.find((row) => row.scenarioId === study.scenarioId && row.snapshotReference === study.snapshotReference
      && row.projection.reference === study.projection.reference);
    if (prior) { setWorkingWorkspace(latest); setOpenedStudyId(prior.id); setPendingStudy(undefined); return latest; }
    const saved = await onSave({ ...latest, nuanceStudies: [...existing, structuredClone(study)], updatedAt: new Date().toISOString() });
    setWorkingWorkspace(saved);
    return saved;
  };

  const projectPlan = async (plan: BrewingNuancePlan) => {
    if (plan.status !== 'adopted') { setError('Adopte explicitement cette version avant d’exécuter la projection.'); return; }
    if (pendingStudy) { setError('Archive d’abord la projection en attente avant d’en lancer une autre.'); return; }
    try {
      setBusy(true); setError(''); setNotice('');
      const candidateInputs = candidates.map((candidate) => ({ id: candidate.id, name: candidate.name,
        input: structuredClone(candidate.input), sourceReference: candidate.sourceReference }));
      const projection = projectBrewingNuances(plan, candidateInputs, snapshotEngineData, candidateDataById(candidates));
      const intent = currentWorkspace?.snapshotIntents?.find((row) => row.scenarioId === result.scenarioId
        && row.snapshotReference === snapshotReference)?.intent;
      const context = comparisonContext(result);
      const reference = comparisonReference(result, snapshotReference, intent);
      const study: SavedNuanceStudy = {
        id: `nuance-study-${crypto.randomUUID()}`,
        scenarioId: result.scenarioId,
        snapshotReference,
        projection,
        context,
        reference,
      };
      // Constructing this DTO validates identities, units, ranges and provenance before persistence.
      const comparison = brewingNuanceViewModel(projection, { context, reference });
      setPendingStudy(study); setOpenedStudyId(study.id);
      setCandidateIds(comparison.candidateOrder); setDimensionIds(comparison.dimensionOrder);
      const saved = await saveStudy(study);
      setWorkingWorkspace(saved); setPendingStudy(undefined);
      setNotice('Étude de nuance archivée pour cette prévision avec ses sources. Les nombres restent des hypothèses non calibrées, pas des dégustations observées.');
    } catch (cause) {
      setError((cause as Error).message || 'La projection ou son archivage a échoué. L’aperçu en cours reste présent.');
    } finally { setBusy(false); }
  };

  const retrySavePendingStudy = async () => {
    if (!pendingStudy) return;
    try {
      setBusy(true); setError('');
      const saved = await saveStudy(pendingStudy);
      setWorkingWorkspace(saved); setPendingStudy(undefined);
      setNotice('Étude conservée dans l’historique immuable de l’espace de travail.');
    } catch (cause) {
      setError((cause as Error).message || 'La projection reste en attente de sauvegarde.');
    } finally { setBusy(false); }
  };

  const openStudy = (study: SavedNuanceStudy) => {
    if (study.scenarioId !== result.scenarioId || study.snapshotReference !== snapshotReference) {
      setError('Ouvre d’abord la prévision d’origine pour relire cette étude exacte.'); return;
    }
    if (pendingStudy && pendingStudy.id !== study.id) {
      setError('Archive ou réessaie d’abord la projection en attente avant d’ouvrir une autre version.'); return;
    }
    setPendingStudy(undefined); setOpenedStudyId(study.id);
    const read = storedComparisonForStudy(study);
    if (read.comparison) {
      setCandidateIds(read.comparison.candidateOrder);
      setDimensionIds(read.comparison.dimensionOrder);
      setNotice('Étude précédente rouverte depuis l’historique. Aucun calcul n’a été relancé.');
    } else if (read.unsupported) setNotice('Format de projection futur conservé en lecture seule; aucune conversion ni recalcul.');
    else setError(read.error ?? 'Archive de nuance illisible.');
  };

  const shownDimensions = activeProjection
    ? activeProjection.planSnapshot.definitions.map((row) => row.dimension)
    : documentaryDimensions;
  const shownCandidates: NuanceCandidateView[] = activeProjection
    ? activeProjection.candidates.map((candidate) => ({ id: candidate.id, name: candidate.name,
      sourceReference: candidate.sourceReference ?? '', input: candidate.inputSnapshot, engineData: candidate.dependencySnapshot,
      applicability: candidate.id === 'baseline' ? result.baseline.applicability : undefined }))
    : candidates;
  const documentaryRows = useMemo(() => shownDimensions.length
    ? shownCandidates.map((candidate) => ({ candidate, materials: documentaryCandidateRows(candidate, shownDimensions) }))
    : [], [shownDimensions, shownCandidates]);

  const selectedSnapshotIntent = currentWorkspace?.snapshotIntents?.find((row) => row.scenarioId === result.scenarioId
    && row.snapshotReference === snapshotReference)?.intent;
  const currentVolume = prepared.runtime.current?.input.volumeL;
  const baselineVolume = result.baseline.input.volumeL;
  const volumesDiffer = typeof currentVolume === 'number' && typeof baselineVolume === 'number' && currentVolume !== baselineVolume;
  const baselineBeerContext = result.baseline.beerContext;
  const styleReference = baselineBeerContext?.style;
  const styleGuide = styleReference ? result.baseline.dependencySnapshot.engineData.knowledge.find((entry) =>
    entry.kind === 'styleGuide' && entry.id === styleReference.guideId && entry.version === styleReference.version) : undefined;

  return <section className="hv-nuance" aria-labelledby="hv-nuance-title">
    <header className="hv-nuance__header">
      <p className="hv-nuance__eyebrow">Explorer les termes documentés</p>
      <h2 id="hv-nuance-title">Suivre une nuance dans cette prévision</h2>
      <p>Choisis un terme sourcé pour retrouver ses citations et préparer une hypothèse de calcul. Les mots et mentions documentaires ne sont ni une dégustation, ni une mesure de concentration ou d’intensité.</p>
      <div className="hv-nuance__snapshot">
        <div><b>Prévision choisie</b><span>{result.baseline.label.replace(/\s*[·–—-]\s*branche J5\b/iu, '')} · version {result.revision}</span></div>
        <div><b>{selectedSnapshotIntent ? 'Question de cette prévision' : 'Question actuelle · non liée à cette prévision'}</b><span>{selectedSnapshotIntent?.question ?? currentWorkspace?.intent.question ?? 'Aucune question renseignée'}</span>
          {!selectedSnapshotIntent ? <small>Cette question n’a pas été rattachée à cette prévision.</small> : null}
        </div>
        <div><b>Volume prévu</b><span>{numberText(baselineVolume)} L</span>
          {typeof currentVolume === 'number' && <small>Contexte préparé maintenant : {numberText(currentVolume)} L{volumesDiffer ? ' · différent de cette prévision' : ''}</small>}
        </div>
      </div>
      <p className="hv-nuance__guard">La question de brassage et les faits connus de la bière restent visibles. Aucun style, nom commercial ou mot isolé ne fixe un résultat.</p>
      <details className="hv-nuance__details"><summary>Référence technique de cette prévision</summary>
        <p>Révision {result.revision} · référence immuable :</p><code>{snapshotReference}</code>
      </details>
      <details className="hv-nuance__details hv-nuance__context-details">
        <summary>Conditions documentées et inconnues de la bière</summary>
        {baselineBeerContext?.style ? <div className="hv-nuance__source-card">
          <p><b>Référence de style</b> · {baselineBeerContext.style.styleId} · {baselineBeerContext.style.guideId}@{baselineBeerContext.style.version} · rôle {baselineBeerContext.style.role}</p>
          {styleGuide && 'name' in styleGuide ? <p>{styleGuide.name}</p> : null}
          {styleGuide && 'source' in styleGuide ? <SourceCitation source={styleGuide.source} /> : null}
        </div> : <p className="hv-nuance__unknown">Aucune référence de style enregistrée dans ce contexte.</p>}
        <HopV55ExplorationProfileArchive profiles={explorationProfiles} branchProfile={branchProfile} />
        {baselineBeerContext?.facts.length ? <dl className="hv-nuance__facts">
          {baselineBeerContext.facts.map((fact) => <div key={fact.id}>
            <dt>{fact.field} <small>{factStatusLabel(fact.status)} · {fact.origin}</small></dt>
            <dd>{fact.range ? `plage ${rangeText(fact.range)}` : factValueText(fact.value)}{fact.range && fact.value !== undefined && fact.value !== null ? ` · valeur déclarée ${factValueText(fact.value)}` : ''}
              {fact.unit ? ` ${fact.unit}` : ''}{fact.basis ? ` · base ${fact.basis}` : ''}{fact.matrixId ? ` · matrice ${fact.matrixId}` : ''}{fact.timepoint ? ` · ${fact.timepoint}` : ''}</dd>
            {fact.source ? <SourceCitation source={fact.source} /> : null}
          </div>)}
        </dl> : <p className="hv-nuance__unknown">Aucun fait de bière enregistré ici; les dimensions non renseignées restent inconnues.</p>}
        {result.baseline.culture ? <div className="hv-nuance__source-card">
          <p><b>Culture de cette prévision :</b> {result.baseline.culture.state} · {result.baseline.culture.explanation ?? 'Composition non détaillée.'}</p>
          {result.baseline.culture.members.map((member, index) => <p key={`${member.yeastId ?? member.name}-${index}`}>
            {member.name ?? member.yeastId ?? 'Membre inconnu'}{member.proportion ? ` · proportion ${rangeText(member.proportion)}` : ' · proportion inconnue'}
            {member.source ? <SourceCitation source={member.source} /> : null}
          </p>)}
        </div> : <p className="hv-nuance__unknown">Culture non documentée dans ce résultat.</p>}
        {result.baseline.biologicalContributions.length ? <div className="hv-nuance__biological-facts">
          <h4>Contributions biologiques de cette prévision</h4>
          {result.baseline.biologicalContributions.map((contribution) => <article key={contribution.id}>
            <b>{biologicalKindLabel(contribution.kind)} · {contribution.status}</b>
            {contribution.value ? <p>{contribution.value.analyte} · {rangeText(contribution.value.range)} {contribution.value.unit} · {contribution.value.basis}
              {contribution.value.value === undefined ? ' · valeur centrale non fournie' : ` · valeur déclarée ${numberText(contribution.value.value)}`}
              {contribution.value.matrixId ? ` · matrice ${contribution.value.matrixId}` : ''}{contribution.value.timepoint ? ` · ${contribution.value.timepoint}` : ''}</p>
              : <p className="hv-nuance__unknown">Quantité inconnue; elle n’est pas interprétée comme nulle.</p>}
            {contribution.conditions.map((line, index) => <p key={`condition-${index}`}>{line}</p>)}
            {contribution.limitations.map((line, index) => <small key={`limitation-${index}`}>{line}</small>)}
            {contribution.value?.sourceRefs.length ? <SourceList sources={contribution.value.sourceRefs} /> : null}
          </article>)}
        </div> : <p className="hv-nuance__unknown">Aucune contribution biologique n’est chiffrée dans ce résultat.</p>}
      </details>
    </header>

    {error ? <p className="hv-nuance__error" role="alert">{error}</p> : null}
    {notice ? <p className="hv-nuance__notice" role="status">{notice}</p> : null}

    {activeStudy && archiveRead?.unsupported ? <section className="hv-nuance__panel" role="status">
      <h3>Archive conservée en lecture seule</h3>
      <p>Cette version n’est pas reconnue par le lecteur courant. Elle n’est ni convertie ni recalculée.</p>
      <button type="button" className="hv-nuance__secondary" onClick={() => setOpenedStudyId('')}>Retour à l’étude de cette prévision</button>
    </section> : null}

    {activeStudy && archiveRead?.error ? <section className="hv-nuance__panel" role="alert">
      <h3>Archive de nuance illisible</h3><p>{archiveRead.error}</p>
      <button type="button" className="hv-nuance__secondary" onClick={() => setOpenedStudyId('')}>Fermer l’archive</button>
    </section> : null}

    {activeStudy && comparison && activeProjection ? <section className="hv-nuance__panel hv-nuance__archive" aria-labelledby="hv-nuance-archive-title">
      <div className="hv-nuance__section-heading">
        <div><p className="hv-nuance__eyebrow">Projection archivée · immuable</p>
          <h3 id="hv-nuance-archive-title">{activeProjection.planSnapshot.definitions.map((row) => row.dimension.name).join(' · ')}</h3>
        </div>
        <button type="button" className="hv-nuance__secondary" onClick={() => setOpenedStudyId('')}>Retour à l’étude courante</button>
      </div>
      <p>{activeProjection.planSnapshot.explanation}</p>
      <p className="hv-nuance__disclaimer">Les intervalles sont ceux du modèle fin sous l’hypothèse adoptée; ils ne sont pas des intervalles de confiance ni des mesures du verre.</p>
      <HopV55SensoryComparison comparison={comparison} candidateIds={candidateIds} dimensionIds={dimensionIds} mode={mode}
        onModeChange={setMode}
        onToggleCandidate={(id) => setCandidateIds((current) => current.includes(id) ? current.filter((row) => row !== id) : [...current, id])}
        onToggleDimension={(id) => setDimensionIds((current) => current.includes(id) ? current.filter((row) => row !== id) : [...current, id])}
        selectedCandidateId={currentWorkspace?.selected?.scenarioId === activeStudy.scenarioId
          && currentWorkspace.selected.snapshotReference === activeStudy.snapshotReference ? currentWorkspace.selected.branchId : undefined} />
      <section className="hv-nuance__documentary" aria-labelledby="hv-nuance-archive-docs">
        <h4 id="hv-nuance-archive-docs">Descriptions exactes conservées avec cette étude</h4>
        <DocumentaryEvidence rows={documentaryRows} />
      </section>
      <details className="hv-nuance__details"><summary>Provenance, hypothèses et limites de l’archive</summary>
        <p>Références conservées avec cette étude :</p>
        <p>Prévision <code>{activeStudy.snapshotReference}</code> · étude <code>{activeProjection.reference}</code>.</p>
        <p>Hypothèse adoptée : {activeProjection.planSnapshot.adoption?.reason ?? 'Motif non conservé.'}</p>
        <SourceList sources={uniqueSources(activeProjection.planSnapshot.definitions.flatMap((row) => [
          ...row.dimension.sourceRefs, ...(row.metric?.sourceRefs ?? []), ...(row.scale?.sourceRefs ?? []),
        ]))} />
        {activeProjection.limitations.map((limitation) => <p key={limitation}>{limitation}</p>)}
      </details>
      {pendingStudy?.id === activeStudy.id ? <button type="button" className="hv-nuance__primary" disabled={busy} onClick={() => void retrySavePendingStudy()}>
        Réessayer l’archivage de cette projection
      </button> : null}
    </section> : null}

    {!activeStudy ? <>
      <section className="hv-nuance__panel" aria-labelledby="hv-nuance-candidates-title">
        <div className="hv-nuance__section-heading"><div><p className="hv-nuance__eyebrow">Variantes de cette prévision</p>
          <h3 id="hv-nuance-candidates-title">Programme, doses et conditions déclarés</h3></div>
          <span>{candidates.length} candidat{candidates.length === 1 ? '' : 's'}</span>
        </div>
        <div className="hv-nuance__candidate-list">
          {candidates.map((candidate) => <article key={candidate.id}>
            <h4>{candidate.name} <small>{applicabilityLabel(candidate.applicability)}</small></h4>
            <p>Volume : {numberText(candidate.input.volumeL)} L · levure : {yeastDisplay(candidate)}</p>
            {!candidate.input.additions.length ? <p>Aucun ajout de houblon déclaré.</p> : null}
            {candidate.input.additions.map((addition) => <p key={addition.id} className="hv-nuance__addition">
              <b>{addition.name || 'Ajout sans nom'}</b>
              {': dose '}{addition.triplet.doseGL == null ? 'inconnue' : numberText(addition.triplet.doseGL) + ' g/L'}
              {', '}{timingDisplay(addition.triplet.timing)}
              {addition.triplet.temperatureC == null ? ', température inconnue' : ' à ' + numberText(addition.triplet.temperatureC) + ' °C'}
              {', '}{contactDurationDisplay(addition.triplet.contactHours)}.
            </p>)}
            <details className="hv-nuance__details"><summary>Origine technique de cette variante</summary>
              <p>Identifiant : <code>{candidate.id}</code></p>
              <p>Référence de la branche : <code>{candidate.sourceReference}</code></p>
              <p>Levure associée : <code>{candidate.input.yeastId ?? 'non renseignée'}</code></p>
              {candidate.input.additions.map((addition) => <p key={'origin-' + addition.id}>
                Ajout <code>{addition.id}</code> · variété <code>{addition.triplet.varietyId ?? 'non renseignée'}</code>
                {' · forme ' + productFormDisplay(candidate, addition)}
              </p>)}
            </details>
          </article>)}
        </div>
        <p className="hv-nuance__disclaimer">L’étude conserve ces doses, emplois et conditions tels qu’ils sont déclarés pour chaque variante. Elle ne modifie pas une recette et n’en applique aucun élément.</p>
      </section>

      <div className="hv-nuance__columns">
        <section className="hv-nuance__panel" aria-labelledby="hv-nuance-dimensions-title">
          <div className="hv-nuance__section-heading"><div><p className="hv-nuance__eyebrow">Termes et citations des sources</p>
            <h3 id="hv-nuance-dimensions-title">Choisir un repère à suivre</h3></div></div>
          <p>Les choix ci-dessous viennent du lexique sourcé du modèle et des descriptions exactes liées aux variantes. Ajouter un terme propose un repère documentaire; cela ne fixe ni intensité ni chiffre.</p>
          <label className="hv-nuance__field"><span>Source des termes et des paramètres</span>
            <select aria-label="Source des termes et des paramètres" value={sourceModelKey} onChange={(event) => { setSourceModelKey(event.target.value); setFamilyKey(''); setFamilyFilterKey(''); setError(''); }}>
              <option value="">Choisir une source documentée</option>
              {sourceModels.map((model) => <option key={model.id + '@' + model.version} value={model.id + '@' + model.version}>{model.name} · version {model.version}</option>)}
            </select>
          </label>
          {selectedModel ? <details className="hv-nuance__details hv-nuance__model-source">
            <summary>Source retenue, détails et limites</summary>
            <div className="hv-nuance__source-card">
              <p><b>{selectedModel.name}</b> · version {selectedModel.version}</p>
              <SourceCitation source={selectedModel.source} />
              {selectedModel.limitations.map((limitation) => <small key={limitation}>{limitation}</small>)}
            </div>
          </details> : sourceModels.length === 0 ? <p className="hv-nuance__unknown">Aucune source de modèle activée dans ce scénario. Aucun terme ni niveau ne sera créé.</p> : null}
          <label className="hv-nuance__field"><span>Famille à explorer · facultatif</span>
            <select aria-label="Famille à explorer · facultatif" value={familyFilterKey} onChange={(event) => { setFamilyFilterKey(event.target.value); setVisibleTermCount(24); setError(''); }} disabled={!selectedModel}>
              <option value="">Toutes les familles</option>
              {familyChoices.map((family) => <option key={family.key} value={family.key}>{family.axis.name}</option>)}
            </select>
          </label>
          {focusedFamily ? <div className="hv-nuance__source-card">
            <p><b>{focusedFamily.axis.name}</b> · {focusedFamily.axis.description}</p>
            <details className="hv-nuance__details"><summary>Source de cette famille</summary>
              <SourceList sources={uniqueSources([selectedModel?.source, focusedFamily.axis.source, focusedFamily.modelAxis.source])} />
            </details>
          </div> : null}
          {selectedModel ? <>
            <label className="hv-nuance__field"><span>Rechercher dans tous les termes</span>
              <Input type="search" value={termSearch} onChange={(event) => { setTermSearch(event.target.value); setVisibleTermCount(24); }}
                placeholder="Mot ou famille" />
            </label>
            <p className="hv-nuance__catalog-count">
              {visibleModelTerms.length} terme{visibleModelTerms.length === 1 ? '' : 's'} affiché{visibleModelTerms.length === 1 ? '' : 's'} sur {matchingModelTerms.length} résultat{matchingModelTerms.length === 1 ? '' : 's'}.
              {matchingModelTerms.length > visibleModelTerms.length ? ' La recherche porte sur tout le lexique.' : ''}
            </p>
            {visibleModelTerms.length ? <ul className="hv-nuance__source-terms" aria-label="Termes documentés par le modèle">
              {visibleModelTerms.map((choice) => {
                const occurrences = visibleModelTermEvidence.get(choice.key) ?? [];
                const familySources = uniqueSources([selectedModel.source, choice.family.axis.source, choice.family.modelAxis.source]);
                const alreadyAdded = dimensions.some((dimension) => dimension.familyRefs?.some((row) =>
                  row.family.id === choice.family.axis.id && row.family.version === choice.family.axis.version)
                  && dimension.terms?.some((term) => normalize(term) === normalize(choice.term)));
                return <li key={choice.key}>
                  <div className="hv-nuance__term-heading"><b>« {choice.term} »</b><span>Famille : {choice.family.axis.name}</span></div>
                  <details className="hv-nuance__details"><summary>Source du terme et de sa famille</summary><SourceList sources={familySources} /></details>
                  {occurrences.length ? <ul className="hv-nuance__term-occurrences">{occurrences.slice(0, 2).map((row, index) =>
                    <li key={row.varietyId + row.description.source.reference + index}>
                      <blockquote>« {row.description.text} »</blockquote>
                      <small>{row.varietyName} · {row.description.context}</small>
                      <SourceCitation source={row.description.source} />
                    </li>)}</ul>
                    : <p className="hv-nuance__unknown">Aucune occurrence de ce terme dans les citations de cette étude. Ce constat documentaire ne vaut ni absence sensorielle ni zéro.</p>}
                  {occurrences.length > 2 ? <small>{occurrences.length - 2} autre(s) citation(s) exacte(s) reliée(s) à ce terme.</small> : null}
                  <button type="button" className="hv-nuance__secondary" disabled={busy || alreadyAdded} onClick={() => addSourcedTerm(choice)}>
                    {alreadyAdded ? 'Repère déjà ajouté' : 'Ajouter ce repère à l’étude'}
                  </button>
                </li>;
              })}
            </ul> : <p className="hv-nuance__unknown">{modelTermChoices.length
              ? 'Aucun terme ne correspond à cette recherche dans le lexique complet.'
              : 'Cette source ne déclare pas de termes pour les familles disponibles.'}</p>}
            {matchingModelTerms.length > visibleModelTerms.length ? <button type="button" className="hv-nuance__text-button"
              onClick={() => setVisibleTermCount((count) => count + 24)}>
              Afficher {Math.min(24, matchingModelTerms.length - visibleModelTerms.length)} termes supplémentaires
            </button> : null}
          </> : null}
          <details className="hv-nuance__details hv-nuance__manual">
            <summary>Ajouter ou corriger une nuance</summary>
            <p>Pour un terme absent du lexique, attribue toi-même son sens et son parent. Cette définition reste une hypothèse lexicale; elle ne crée pas un niveau sensoriel.</p>
          <label className="hv-nuance__field"><span>Famille parente documentée</span>
            <select aria-label="Famille parente documentée" value={familyKey} onChange={(event) => { setFamilyKey(event.target.value); setError(''); }} disabled={!selectedModel}>
              <option value="">Choisir une famille</option>
              {familyChoices.map((family) => <option key={family.key} value={family.key}>{family.axis.name}</option>)}
            </select>
          </label>
          {selectedFamily ? <div className="hv-nuance__source-card">
            <p><b>{selectedFamily.axis.name}</b> · {selectedFamily.axis.description}</p>
            <SourceList sources={uniqueSources([selectedFamily.axis.source, selectedFamily.modelAxis.source])} />
          </div> : null}
          <label className="hv-nuance__field"><span>Nom de la nuance</span>
            <Input value={dimensionName} onChange={(event) => setDimensionName(event.target.value)} placeholder="Libellé choisi par le brasseur" />
          </label>
          <label className="hv-nuance__field"><span>Définition sémantique</span>
            <Textarea value={dimensionDefinition} onChange={(event) => setDimensionDefinition(event.target.value)} placeholder="Ce que ce terme distingue, sans lui attribuer de niveau." />
          </label>
          <label className="hv-nuance__field"><span>Terme ou expression lexicale exacte</span>
            <div className="hv-nuance__inline-input"><Input aria-label="Terme ou expression lexicale exacte" value={termDraft} onChange={(event) => setTermDraft(event.target.value)} placeholder="Terme exact, selon la source" />
              <button type="button" className="hv-nuance__secondary" onClick={addTerm}>Ajouter le terme</button></div>
          </label>
          {terms.length ? <ul className="hv-nuance__term-list">{terms.map((term) => <li key={term}><code>{term}</code>
            <button type="button" aria-label={`Retirer le terme ${term}`} onClick={() => setTerms((rows) => rows.filter((row) => row !== term))}>Retirer</button></li>)}</ul> : <p className="hv-nuance__unknown">Aucun terme choisi; aucune nuance ne sera proposée.</p>}
          <details className="hv-nuance__details"><summary>Rechercher une citation exacte du scénario</summary>
            <label className="hv-nuance__field"><span>Variété, phrase ou source</span>
              <Input type="search" value={phraseSearch} onChange={(event) => { setPhraseSearch(event.target.value); setVisiblePhraseCount(MATERIAL_PAGE_SIZE); }} placeholder="Chercher dans les descriptions chargées" />
            </label>
              {phraseQuery.length < 2 ? <p>Saisis deux caractères ou plus; la recherche parcourt toutes les descriptions liées aux variantes.</p>
              : matchingPhrases.length === 0 ? <p>Aucune citation ne correspond. Tu peux saisir une expression choisie par le brasseur; sa provenance restera distincte.</p>
                : <ul className="hv-nuance__phrase-list">{visiblePhrases.map((row, index) => <li key={`${row.varietyId}-${row.description.source.reference}-${index}`}>
                  <blockquote>« {row.description.text} »</blockquote>
                  <small>{row.varietyName} · {row.description.context}</small>
                  <SourceCitation source={row.description.source} />
                  <button type="button" className="hv-nuance__text-button" onClick={() => setTermDraft(row.description.text)}>Préparer cette citation comme terme exact</button>
                </li>)}</ul>}
            {matchingPhrases.length > visiblePhrases.length ? <button type="button" className="hv-nuance__text-button" onClick={() => setVisiblePhraseCount((count) => count + MATERIAL_PAGE_SIZE)}>
              Afficher {Math.min(MATERIAL_PAGE_SIZE, matchingPhrases.length - visiblePhrases.length)} citations supplémentaires
            </button> : null}
          </details>
          <button type="button" className="hv-nuance__primary" disabled={busy || !selectedFamily || !dimensionName.trim() || !dimensionDefinition.trim() || !terms.length} onClick={createDimension}>
            Proposer cette définition versionnée
          </button>
          </details>
          {dimensions.length ? <div className="hv-nuance__dimension-list"><h4>Repères choisis pour l’étude</h4>{dimensions.map((dimension) => <article key={`${dimension.id}@${dimension.version}`}>
            <div><b>{dimension.name}</b> · version {dimension.version} <small>{dimensionFamilyNames(dimension, snapshotEngineData) || 'famille non renseignée'}</small></div>
            <p>{dimension.definition}</p><p>Lexique exact : {dimension.terms?.join(' · ')}</p>
            <SourceList sources={dimension.sourceRefs} />
            <details className="hv-nuance__details"><summary>Identifiants de cette définition</summary>
              <code>{dimension.id}@{dimension.version} · familles {dimension.familyRefs?.map((row) => row.family.id + '@' + row.family.version).join(' · ') || 'aucune'}</code>
            </details>
            <button type="button" className="hv-nuance__text-button" onClick={() => setDimensions((rows) => rows.filter((row) => row.id !== dimension.id))}>Retirer du prochain plan</button>
          </article>)}</div> : null}
        </section>

        <section className="hv-nuance__panel" aria-labelledby="hv-nuance-evidence-title">
          <div className="hv-nuance__section-heading"><div><p className="hv-nuance__eyebrow">Documentaire ≠ projection</p>
            <h3 id="hv-nuance-evidence-title">Relire les phrases, leur contexte et leur source</h3></div></div>
          <p>Chaque extrait reste lié à sa description originale et à son contexte. Une mention, une négation ou une absence de texte ne devient jamais une intensité ni un zéro sensoriel.</p>
          <DocumentaryEvidence rows={documentaryRows} />
        </section>
      </div>

      <section className="hv-nuance__panel" aria-labelledby="hv-nuance-plans-title">
        <div className="hv-nuance__section-heading"><div><p className="hv-nuance__eyebrow">Proposer, examiner, adopter</p>
          <h3 id="hv-nuance-plans-title">Propositions de calcul à examiner</h3></div>
          <button type="button" className="hv-nuance__primary" disabled={busy || !selectedModel || !dimensions.length} onClick={() => void proposePlans()}>
            Proposer les variantes de calcul
          </button>
        </div>
        <p>Les variantes restent proposées jusqu’à ton adoption explicite. Les paramètres génériques sont copiés du modèle sourcé; ils ne sont ni ajustés par nom de bière ni présentés comme calibrés sur les nuances fines.</p>
        {unsavedPlans.length ? <p className="hv-nuance__error" role="status">{unsavedPlans.length} plan(s) restent localement en attente de sauvegarde.</p> : null}
        {unsavedPlans.length ? <button type="button" className="hv-nuance__secondary" disabled={busy}
          onClick={() => void persistPlans(unsavedPlans).catch((cause) => setError((cause as Error).message || 'Sauvegarde des plans en attente impossible.'))}>
          Enregistrer les plans en attente
        </button> : null}
        {!plans.length ? <p className="hv-nuance__unknown">Aucune hypothèse préparée pour cette prévision.</p> : <div className="hv-nuance__plans">
          {plans.map((plan, index) => <article className="hv-nuance__plan" key={plan.reference}>
            <div className="hv-nuance__section-heading"><div>
              <p className="hv-nuance__eyebrow">{plan.status === 'adopted' ? 'Adoptée explicitement' : 'Proposée · à examiner'} · r{plan.revision}</p>
              <h4>{plan.parameterChoices.length ? 'Variante avec réglages explicitement choisis' : 'Plages complètes de la source'}</h4>
            </div><code>variante {index + 1}</code></div>
            <div className="hv-nuance__plan-meta">
              <span>Modèle et version : {plan.sourceModel.name} · v{plan.sourceModel.version}</span>
              <span>Échelle source de dose : {rangeText(plan.doseAxis.scale)}</span>
              <span>Indicateur comparé : {plan.definitions[0]?.metric?.name ?? 'non défini'} · unité {plan.definitions[0]?.metric?.unit ?? 'inconnue'}</span>
              <span>Portée numérique : {plan.definitions[0]?.scale?.domain ? rangeText(plan.definitions[0].scale.domain) : 'inconnue'}</span>
            </div>
            <SourceCitation source={plan.sourceModel.source} />
            <p className="hv-nuance__disclaimer">Ces termes fins ne sont pas étalonnés séparément. Les nombres éventuels restent conditionnels aux plages de la source; une mention lexicale n’est pas une intensité mesurée.</p>
            <ul className="hv-nuance__plan-dimensions">{plan.definitions.map((definition) => <li key={definition.contentReference}>
              <b>{definition.dimension.name}</b> · {definition.dimension.terms?.join(' · ')}
            </li>)}</ul>
            {plan.parameterChoices.length ? <div className="hv-nuance__choices">
              <h5>Réglages changés dans cette variante</h5>
              <ul className="hv-nuance__changed-parameters">{plan.parameterChoices.map((choice) => <li key={choice.id}>
                <b>{targetOptions(plan).find((option) => samePlanTarget(option.target, choice.target))?.label ?? 'Paramètre du modèle'}</b>
                <span>Plage {rangeText(choice.range)} · centrale déclarée {numberText(choice.central)} · {parameterOriginLabel(choice.origin)}</span>
              </li>)}</ul>
              <details className="hv-nuance__details"><summary>Motifs, cibles et sources de ces réglages</summary>
                {plan.parameterChoices.map((choice) => <article key={'choice-source-' + choice.id}>
                  <p>{choice.explanation}</p>
                  <details className="hv-nuance__details"><summary>Cible technique</summary><code>{JSON.stringify(choice.target)}</code></details>
                  <SourceList sources={choice.sourceRefs} />
                </article>)}
              </details>
            </div> : <p className="hv-nuance__disclaimer">Aucun réglage personnalisé : cette variante garde les plages complètes du modèle source.</p>}
            <details className="hv-nuance__details"><summary>Définitions, lexiques et citations exactes</summary>
              <p>{plan.explanation}</p>
              <div className="hv-nuance__plan-definitions">{plan.definitions.map((definition) => <article key={definition.contentReference}>
                <h5>{definition.dimension.name} · {definition.dimension.terms?.join(' · ')}</h5>
                <p>{definition.dimension.definition}</p>
                <p>Famille parente : {dimensionFamilyNames(definition.dimension, snapshotEngineData) || 'inconnue'}</p>
                <SourceList sources={definition.dimension.sourceRefs} />
                <details className="hv-nuance__details"><summary>Référence de définition</summary><code>{definition.dimensionReference}</code></details>
              </article>)}</div>
            </details>
            <details className="hv-nuance__details"><summary>Priors, domaines numériques et autres sources</summary>
              <p>La projection reprend les plages et priors génériques déclarés, sans les retuner. Les profils de levure par souche ne constituent pas une calibration fine des termes sélectionnés.</p>
              <div className="hv-nuance__parameter-domain">{planParameterDomain(plan).map((row) => <div key={row.label + '-' + sourceKey(row.source)}>
                <b>{row.label}</b><span>{rangeText(row.range)}{row.central === undefined ? '' : ` · centrale ${numberText(row.central)}`}</span><SourceCitation source={row.source} />
              </div>)}</div>
              <p>Forme inconnue : {rangeText(plan.sourceModel.unknownFormUncertainty.range)} · date inconnue : {rangeText(plan.sourceModel.undatedUncertainty.range)}.</p>
              <SourceList sources={uniqueSources([plan.doseAxis.source, ...plan.sourceModel.evidence])} />
            </details>
            {plan.status === 'proposed' ? <div className="hv-nuance__adoption">
              <label className="hv-nuance__field"><span>Pourquoi retenir cette variante ?</span>
                <Textarea value={adoptionReasons[plan.reference] ?? ''} onChange={(event) => setAdoptionReasons((current) => ({ ...current, [plan.reference]: event.target.value }))}
                  placeholder="Motif explicite de cette hypothèse, sans la présenter comme une mesure." />
              </label>
              <button type="button" className="hv-nuance__secondary" disabled={busy || unsavedReferences.has(plan.reference) || !adoptionReasons[plan.reference]?.trim()}
                onClick={() => void adoptPlan(plan)}>Adopter cette hypothèse</button>
              {unsavedReferences.has(plan.reference) ? <small>Enregistre la proposition avant de l’adopter.</small> : null}
            </div> : <div className="hv-nuance__adoption">
              <p><b>Motif d’adoption :</b> {plan.adoption?.reason}</p>
              <button type="button" className="hv-nuance__secondary" disabled={busy || unsavedReferences.has(plan.reference)}
                onClick={() => setRevisionPlanReference(plan.reference)}>Réviser les paramètres · créer une nouvelle version</button>
              <button type="button" className="hv-nuance__primary" disabled={busy || unsavedReferences.has(plan.reference)
                || studies.some((study) => study.snapshotReference === snapshotReference && study.projection.planSnapshot.reference === plan.reference)}
                onClick={() => void projectPlan(plan)}>Projeter cette version sur les variantes</button>
              {studies.some((study) => study.snapshotReference === snapshotReference && study.projection.planSnapshot.reference === plan.reference)
                ? <small>Une étude de cette version est déjà conservée pour cette prévision.</small> : null}
            </div>}
            {revisionPlanReference === plan.reference && <ParameterRevisionForm plan={plan} options={targetOptions(plan)}
              busy={busy} targetKey={revisionTargetKey} setTargetKey={(key) => { setRevisionTargetKey(key); setRevisionMin(undefined); setRevisionMax(undefined); setRevisionCentral(undefined); }}
              min={revisionMin} setMin={setRevisionMin} max={revisionMax} setMax={setRevisionMax} central={revisionCentral} setCentral={setRevisionCentral}
              reason={revisionReason} setReason={setRevisionReason} onCancel={() => setRevisionPlanReference('')}
              onSubmit={() => void revisePlanParameter(plan)} />}
          </article>)}
        </div>}
      </section>

      {pendingStudy ? <section className="hv-nuance__panel hv-nuance__pending" role="status">
        <h3>Étude calculée, enregistrement en attente</h3>
        <p>Cette étude reste visible, mais son enregistrement n’est pas encore confirmé.</p>
        <button type="button" className="hv-nuance__primary" disabled={busy} onClick={() => void retrySavePendingStudy()}>Réessayer l’archivage</button>
      </section> : null}

      {studies.length > 0
        ? <section className="hv-nuance__panel" aria-labelledby="hv-nuance-history-title">
          <div className="hv-nuance__section-heading"><div><p className="hv-nuance__eyebrow">Études enregistrées</p><h3 id="hv-nuance-history-title">Revoir une étude précédente</h3></div></div>
          <ul className="hv-nuance__history">{studies.map((study) => <li key={study.id}>
            <div><b>{study.projection.planSnapshot.definitions.map((row) => row.dimension.name).join(' · ')}</b>
              <details className="hv-nuance__details"><summary>Références de l’étude</summary>
                <small>Prévision : {study.snapshotReference} · étude : {study.projection.reference}</small>
              </details></div>
            <button type="button" className="hv-nuance__secondary" onClick={() => openStudy(study)}>Ouvrir l’étude archivée</button>
          </li>)}</ul>
        </section> : null}
    </> : null}
  </section>;
}


