import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { hopDescriptorEvidence, createHopExtrapolationCache } from '../../../functions/src/hopExtrapolationCore';
import type { HopDescription, HopSource, HopVariety } from '../../../functions/src/hopIndexSchema';
import type { HopAxis, HopYeast } from '../../../functions/src/hopPredictionSchema';
import type { HopExtrapolation } from '../../../functions/src/hopExtrapolationSchema';
import type { HopDecisionMaterial, HopDecisionProgram, HopUse } from '../../domain/hopDecision/types';
import { programFingerprint } from '../../domain/hopDecision/programs';
import type { PreparedBrewingScenarioContext } from '../../domain/brewingScenarioContext';
import { Input } from '../Input';
import { formatDecimal, parseDecimal } from '../numericInput';
import { HopV55ExactInput } from './ExactInput';
import type { HopV55Intent } from '../../services/hopV55/contracts';
import type { HopV55DecisionReadingArchiveV4 } from '../../services/hopV55/decisionArchive';
import { readHopV55ExplorationTrialOriginContextV1 } from '../../services/hopV55/explorationTrialPreparation';
import type { HopV55ExplorationTrialOriginContextV1 } from '../../services/hopV55/explorationTrialPreparation';
import {
  HopV55ContextualComparisonPanel,
  HopV55ExplorationProfilePanel,
  HopV55ExplorationTrialPanel,
  SESSION_PROFILE_KEY,
} from './ContextualExploration';
import {
  HOP_V55_FORM_LABELS,
  HOP_V55_USE_OPTIONS,
  createHopV55ContextualComparisonSnapshot,
  hopV55ExplorationProfileHistory,
  hopV55IntentCriteria,
  hopV55ProfileCriteria,
  type HopV55ExplorationProfileV1,
  type HopV55ContextualComparisonSnapshotV1,
  type HopV55ExplorationTrialRequestV1,
  type HopV55TrialLineDraft,
} from './contextualExplorationModel';
import './explorer.css';

export interface HopV55Composition {
  label: string;
  materials: Array<{ materialId: string; grams: number }>;
  use: HopUse;
  temperatureC?: number;
  contactHours?: number;
  yeastId?: string;
  volumeL: number;
}

export interface HopV55ExplorerProps {
  prepared: PreparedBrewingScenarioContext;
  intent: HopV55Intent;
  /** Legacy blend composer, used while the parent does not provide `onPrepareTrial`. */
  onCompose: (composition: HopV55Composition) => void;
  selectionRequest?: { id: string; materialId?: string; materialIds?: string[]; yeastId?: string; terms?: string[] };
  /** Current or explicitly adopted hypothetical programme; defaults to the prepared current programme. `null` means none. */
  program?: HopDecisionProgram | null;
  /** Workspace exploration profiles exactly as stored; read without rebuilding or requalifying them. */
  profiles?: readonly unknown[];
  /** Exact archived V4 reading used as source coverage; never parsed again by the Explorer. */
  readingArchive?: HopV55DecisionReadingArchiveV4;
  /** Exact owner/source/runtime/NR/reading/program frame from Page. */
  originContext?: HopV55ExplorationTrialOriginContextV1 | null;
  /** Appends one immutable profile version to the workspace. Absent: profiles stay session drafts, shown as such. */
  onDeclareProfile?(profile: HopV55ExplorationProfileV1): void | Promise<void>;
  /** Simulates the canonical prepared branch through the parent's J5, comparison and copy contracts. */
  onPrepareTrial?(request: HopV55ExplorationTrialRequestV1): void | Promise<void>;
}

interface ModelReference {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
  source: HopSource;
  axisSource: HopSource;
}

interface DocumentaryFamily {
  key: string;
  axisId: string;
  version: string;
  name: string;
  description?: string;
  terms: string[];
  axisDefinitionSource?: HopSource;
  sources: HopSource[];
  models: ModelReference[];
}

interface ExplorerMaterial {
  material: HopDecisionMaterial;
  variety?: HopVariety;
  evidence: Record<string, HopDescription[]>;
  searchText: string;
}

type FocusKey = string | '__unknown__' | '__all__' | null;

const UNKNOWN_FOCUS = '__unknown__' as const;
const ALL_FOCUS = '__all__' as const;
const MATERIAL_PAGE_SIZE = 12;
const FAMILY_PAGE_SIZE = 10;
const MAP_FAMILY_LIMIT = 8;

const formLabels = HOP_V55_FORM_LABELS;
const useOptions = HOP_V55_USE_OPTIONS;
const newId = () => globalThis.crypto.randomUUID();

const contextLabels: Record<HopDescription['context'], string> = {
  rawHop: 'Houblon brut',
  infusion: 'Infusion',
  beer: 'Bière',
  unspecified: 'Contexte non précisé',
};

const collator = new Intl.Collator('fr-CH', { sensitivity: 'base', numeric: true });

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr-CH');
}

function uniqueSources(sources: Array<HopSource | undefined>): HopSource[] {
  const seen = new Set<string>();
  return sources.flatMap((source) => {
    if (!source) return [];
    const key = JSON.stringify(source);
    if (seen.has(key)) return [];
    seen.add(key);
    return [source];
  });
}

function sourceSearchText(source: HopSource): string {
  return [source.title, source.author, source.year === null ? '' : String(source.year), source.reference, source.locator ?? ''].join(' ');
}

function sourceText(source: HopSource): string {
  return [source.author, source.year === null ? '' : String(source.year), source.reference, source.locator ?? '']
    .filter(Boolean)
    .join(' · ');
}

function SourceCitation({ source }: { source: HopSource }) {
  const reference = source.reference;
  const isLink = /^https?:\/\//i.test(reference);
  return (
    <span className="hop-v55-explorer__source">
      <span>{source.title}</span>
      {sourceText(source) && <span className="hop-v55-explorer__source-meta"> — {sourceText(source)}</span>}
      {isLink && (
        <a href={reference} target="_blank" rel="noreferrer" aria-label={`Ouvrir la source ${source.title}`}>
          Ouvrir
        </a>
      )}
    </span>
  );
}

function matchesSearch(haystack: string, query: string): boolean {
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
  return terms.every((term) => haystack.includes(term));
}

function categoryKey(axisId: string, version: string, terms: string[]): string {
  return `${axisId}@${version}:${JSON.stringify(terms)}`;
}

function buildCatalogue(prepared: PreparedBrewingScenarioContext): {
  families: DocumentaryFamily[];
  materials: ExplorerMaterial[];
} {
  const { engineData, materials: runtimeMaterials } = prepared.runtime;
  const axisDefinitions = engineData.knowledge.filter((entry): entry is HopAxis => entry.kind === 'axis');
  const models = engineData.knowledge.filter((entry): entry is HopExtrapolation => entry.kind === 'extrapolation');
  const grouped = new Map<string, DocumentaryFamily>();

  models.forEach((model) => {
    model.axes.forEach((modelAxis) => {
      const definition = axisDefinitions.find((axis) => axis.id === modelAxis.id && axis.version === modelAxis.version);
      const key = categoryKey(modelAxis.id, modelAxis.version, modelAxis.terms);
      const modelReference: ModelReference = {
        id: model.id,
        name: model.name,
        version: model.version,
        enabled: model.enabled,
        source: model.source,
        axisSource: modelAxis.source,
      };
      const existing = grouped.get(key);
      if (existing) {
        if (!existing.models.some((row) => row.id === model.id && row.version === model.version)) existing.models.push(modelReference);
        existing.sources = uniqueSources([...existing.sources, definition?.source, modelAxis.source, model.source]);
        return;
      }
      grouped.set(key, {
        key,
        axisId: modelAxis.id,
        version: modelAxis.version,
        name: definition?.name ?? modelAxis.id,
        ...(definition?.description ? { description: definition.description } : {}),
        // These exact documented terms define the lexical family. They are not an intensity scale.
        terms: [...modelAxis.terms],
        ...(definition?.source ? { axisDefinitionSource: definition.source } : {}),
        sources: uniqueSources([definition?.source, modelAxis.source, model.source]),
        models: [modelReference],
      });
    });
  });

  const families = [...grouped.values()].sort((a, b) => collator.compare(a.name, b.name) || collator.compare(a.key, b.key));
  const varietiesById = new Map(engineData.varieties.map((variety) => [variety.id, variety]));
  const cache = createHopExtrapolationCache();
  const materials = runtimeMaterials.map((material): ExplorerMaterial => {
    const variety = material.variety ?? (material.lot ? varietiesById.get(material.lot.varietyId) : undefined);
    const evidence: Record<string, HopDescription[]> = {};
    if (variety) {
      families.forEach((family) => {
        evidence[family.key] = hopDescriptorEvidence(variety, family.terms, cache);
      });
    }
    const documentaryText = variety?.descriptions.map((row) => `${row.text} ${sourceSearchText(row.source)}`).join(' ') ?? '';
    const analysisText = [
      ...(material.declaredAnalysis ?? []),
      ...(material.variety?.analysis ?? []),
      ...(material.lot?.analysis ?? []),
    ].map((row) => `${row.analyte} ${row.unit} ${row.kind} ${row.source.title} ${row.source.reference} ${row.note ?? ''}`).join(' ');
    const familyText = families.filter((family) => evidence[family.key]?.length)
      .map((family) => `${family.name} ${family.axisId} ${family.terms.join(' ')}`).join(' ');
    const searchText = normalize([
      material.id,
      material.name,
      formLabels[material.form],
      material.variety?.name,
      material.variety?.id,
      ...(material.variety?.aliases ?? []),
      material.variety?.origin,
      material.lot?.name,
      material.lot?.lotNumber,
      material.lot?.harvestYear === undefined ? '' : String(material.lot.harvestYear),
      material.lot?.growingRegion,
      material.lot?.grower,
      material.lot?.storageNotes,
      material.lot?.notes,
      material.lot?.varietyId,
      material.product?.id,
      material.product?.name,
      material.product?.manufacturer,
      material.product?.supportedUses.join(' '),
      material.product?.cautions.join(' '),
      material.product?.source ? sourceSearchText(material.product.source) : '',
      documentaryText,
      analysisText,
      familyText,
    ].filter(Boolean).join(' '));
    return { material, variety, evidence, searchText };
  }).sort((a, b) => collator.compare(a.material.name, b.material.name) || collator.compare(a.material.id, b.material.id));

  return { families, materials };
}

function evidenceForFamily(row: ExplorerMaterial, familyKey: string | undefined): HopDescription[] {
  if (!familyKey) return [];
  return row.evidence[familyKey] ?? [];
}

function hasFamilyEvidence(row: ExplorerMaterial): boolean {
  return Object.values(row.evidence).some((descriptions) => descriptions.length > 0);
}

function familySearchText(family: DocumentaryFamily): string {
  return normalize([
    family.name,
    family.axisId,
    family.version,
    family.description,
    family.terms.join(' '),
    ...family.models.map((model) => `${model.name} ${model.id} ${model.version} ${model.enabled ? 'actif' : 'inactif'} ${sourceSearchText(model.source)} ${sourceSearchText(model.axisSource)}`),
    ...family.sources.map(sourceSearchText),
  ].filter(Boolean).join(' '));
}

function formatValue(value: number): string {
  return formatDecimal(value);
}

function dataIndex(index: number): string {
  return String(index + 1).padStart(2, '0');
}

function MaterialEvidence({ descriptions, emptyMessage }: { descriptions: HopDescription[]; emptyMessage?: string }) {
  if (!descriptions.length) return emptyMessage ? <p className="hop-v55-explorer__unknown-note">{emptyMessage}</p> : null;
  return (
    <ul className="hop-v55-explorer__evidence-list">
      {descriptions.map((description, index) => (
        <li key={`${description.context}-${description.source.reference}-${index}`}>
          <blockquote>« {description.text} »</blockquote>
          <span className="hop-v55-explorer__context-label">{contextLabels[description.context]}</span>
          <SourceCitation source={description.source} />
        </li>
      ))}
    </ul>
  );
}

function OptionalExactField({ label, unit, min, value, onValue, onValidity }: {
  label: string;
  unit: string;
  min?: number;
  value: number | undefined;
  onValue(value: number | undefined): void;
  onValidity(valid: boolean): void;
}) {
  const [draft, setDraft] = useState(() => formatDecimal(value));
  const parsed = parseDecimal(draft);
  const invalid = draft.trim() !== '' && (parsed === null || (min !== undefined && parsed < min));
  return (
    <label className="hop-v55-explorer__field">
      <span>{label} <small>{unit} · facultatif</small></span>
      <Input
        type="text"
        inputMode="decimal"
        value={draft}
        aria-label={label}
        aria-invalid={invalid || undefined}
        placeholder="Non renseignée"
        onChange={(event) => {
          const next = event.currentTarget.value;
          const number = parseDecimal(next);
          const nextInvalid = next.trim() !== '' && (number === null || (min !== undefined && number < min));
          setDraft(next);
          onValue(next.trim() !== '' && !nextInvalid ? number ?? undefined : undefined);
          onValidity(!nextInvalid);
        }}
      />
      {invalid && <small className="hop-v55-explorer__field-error" role="alert">Valeur illisible ou inférieure à {formatDecimal(min ?? 0)}.</small>}
    </label>
  );
}

function formName(material: HopDecisionMaterial): string {
  return formLabels[material.form] ?? 'Forme inconnue';
}

function mapCoordinates(index: number, count: number): { x: number; y: number } {
  const angle = -Math.PI / 2 + (2 * Math.PI * index) / Math.max(1, count);
  return { x: 180 + Math.cos(angle) * 118, y: 124 + Math.sin(angle) * 76 };
}

export function HopV55Explorer({
  prepared, intent, onCompose, selectionRequest, program: programProp, profiles, readingArchive, originContext, onDeclareProfile, onPrepareTrial,
}: HopV55ExplorerProps) {
  const { families, materials } = useMemo(() => buildCatalogue(prepared), [prepared.runtime.engineData, prepared.runtime.materials]);
  const materialById = useMemo(() => new Map(materials.map((row) => [row.material.id, row])), [materials]);
  const trialMode = !!onPrepareTrial;
  const program = (programProp === undefined ? prepared.runtime.current?.program : programProp) ?? undefined;
  const programReference = program ? programFingerprint(program) : null;
  const originContextRead = useMemo(() => originContext
    ? readHopV55ExplorationTrialOriginContextV1(originContext)
    : { status: 'invalid' as const, reason: 'Cadre d’origine non fourni par le parent.' }, [originContext]);
  const currentOriginContext = originContextRead.status === 'current'
    && originContextRead.originContext.programReference === programReference ? originContextRead.originContext : undefined;
  const trialFrameReady = !!programReference && !!currentOriginContext;
  const suggestedFocus = useMemo(() => {
    const axisCriterion = intent.criteria.find((criterion) => criterion.axisId || criterion.familyId);
    if (!axisCriterion) return null;
    return families.find((family) => family.axisId === axisCriterion.axisId || family.axisId === axisCriterion.familyId)?.key ?? null;
  }, [families, intent.criteria]);

  const [query, setQuery] = useState('');
  const [focus, setFocus] = useState<FocusKey>(null);
  const [visibleMaterialCount, setVisibleMaterialCount] = useState(MATERIAL_PAGE_SIZE);
  const [visibleFamilyCount, setVisibleFamilyCount] = useState(FAMILY_PAGE_SIZE);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [gramsById, setGramsById] = useState<Record<string, number | undefined>>({});
  const [label, setLabel] = useState('Exploration de houblons');
  const [volumeL, setVolumeL] = useState<number | undefined>(() => {
    const sourceVolume = prepared.runtime.current?.input.volumeL;
    return typeof sourceVolume === 'number' && Number.isFinite(sourceVolume) && sourceVolume > 0 ? sourceVolume : undefined;
  });
  const [use, setUse] = useState<HopUse | ''>('');
  const [temperatureC, setTemperatureC] = useState<number | undefined>();
  const [contactHours, setContactHours] = useState<number | undefined>();
  const [temperatureValid, setTemperatureValid] = useState(true);
  const [contactValid, setContactValid] = useState(true);
  const [yeastId, setYeastId] = useState('');
  const [error, setError] = useState('');
  const [compareSourceId, setCompareSourceId] = useState('');
  const [compareAlternativeId, setCompareAlternativeId] = useState('');
  const [sessionProfile, setSessionProfile] = useState<HopV55ExplorationProfileV1>();
  const [activeProfileKey, setActiveProfileKey] = useState('');
  const [trialLines, setTrialLines] = useState<HopV55TrialLineDraft[]>([]);

  const addTrialMaterial = (materialId: string) => {
    if (!trialFrameReady || !currentOriginContext || !programReference) {
      setError('Relis la source exacte avant de créer une ligne d’essai; aucun contexte par défaut n’est retenu.');
      return;
    }
    const line: HopV55TrialLineDraft = { key: newId(), originProgramReference: programReference,
      originContextReference: currentOriginContext.reference,
      kind: 'add', additionId: `exploration-hop:${newId()}`, materialId };
    setTrialLines((current) => current.some((row) => row.kind === 'add' && row.materialId === materialId) ? current : [...current, line]);
  };

  useEffect(() => {
    if (!selectionRequest) return;
    setError('');
    const requested = [...(selectionRequest.materialIds ?? []), ...(selectionRequest.materialId ? [selectionRequest.materialId] : [])].filter(id => materialById.has(id));
    if (requested.length) setSelectedIds(current => [...new Set([...current, ...requested])]);
    // A hand-off adds exact identities without mass, use or conditions.
    if (requested.length && trialMode) requested.forEach(addTrialMaterial);
    if (selectionRequest.terms?.length) setQuery(selectionRequest.terms.join(' '));
    if (selectionRequest.yeastId) setYeastId(selectionRequest.yeastId);
  }, [selectionRequest?.id, selectionRequest?.materialId, selectionRequest?.yeastId]);

  const profileHistory = useMemo(() => hopV55ExplorationProfileHistory(profiles), [profiles]);
  const sessionPersisted = !!sessionProfile && profileHistory.history.some((profile) => profile.reference === sessionProfile.reference);
  useEffect(() => {
    // Once the parent returns the exact stored version, the lens follows that same reference.
    if (activeProfileKey === SESSION_PROFILE_KEY && sessionProfile && sessionPersisted) setActiveProfileKey(sessionProfile.reference);
  }, [activeProfileKey, sessionProfile, sessionPersisted]);
  const activeProfile = activeProfileKey === SESSION_PROFILE_KEY
    ? (sessionProfile ? { profile: sessionProfile, persisted: sessionPersisted } : undefined)
    : activeProfileKey
      ? (() => { const stored = profileHistory.history.find((profile) => profile.reference === activeProfileKey); return stored ? { profile: stored, persisted: true } : undefined; })()
      : undefined;
  const confrontationCriteria = useMemo(() => [
    ...hopV55IntentCriteria(intent),
    ...(activeProfile ? hopV55ProfileCriteria(activeProfile.profile, activeProfile.persisted) : []),
  ], [intent, activeProfile?.profile.reference, activeProfile?.persisted]);
  const subjectFor = useCallback((material: HopDecisionMaterial) => materialById.get(material.id)?.variety, [materialById]);
  const programMaterialIds = useMemo(() => new Set(program?.additions.map((addition) => addition.materialId) ?? []), [program]);
  const runtimeMaterials = useMemo(() => materials.map((row) => row.material), [materials]);

  const activeFocus = focus === null ? suggestedFocus : focus;
  const contextVolume = prepared.runtime.current?.input.volumeL;
  const contextVolumeIsKnown = typeof contextVolume === 'number' && Number.isFinite(contextVolume) && contextVolume > 0;
  const activeFamily = activeFocus && activeFocus !== ALL_FOCUS && activeFocus !== UNKNOWN_FOCUS
    ? families.find((family) => family.key === activeFocus)
    : undefined;
  const activeFamilySources = activeFamily
    ? uniqueSources([...activeFamily.models.flatMap((model) => [model.axisSource, model.source]), activeFamily.axisDefinitionSource])
    : [];
  const unknownRows = useMemo(() => materials.filter((row) => !hasFamilyEvidence(row)), [materials]);
  const familyCounts = useMemo(() => new Map(families.map((family) => [
    family.key,
    materials.filter((row) => evidenceForFamily(row, family.key).length > 0).length,
  ])), [families, materials]);
  const visibleFamilyRows = families.filter((family) => matchesSearch(familySearchText(family), query));
  const focusRows = activeFocus === UNKNOWN_FOCUS
    ? unknownRows
    : activeFamily
      ? materials.filter((row) => evidenceForFamily(row, activeFamily.key).length > 0)
      : materials;
  const filteredMaterials = focusRows.filter((row) => matchesSearch(row.searchText, query));
  const visibleMaterials = filteredMaterials.slice(0, visibleMaterialCount);
  const visibleFamilies = visibleFamilyRows.slice(0, visibleFamilyCount);
  const totalGrams = selectedIds.reduce((total, id) => total + (gramsById[id] ?? 0), 0);
  const totalMassKnown = selectedIds.length > 0 && selectedIds.every((id) => typeof gramsById[id] === 'number' && Number.isFinite(gramsById[id]));
  const validMasses = selectedIds.length > 0 && selectedIds.every((id) => {
    const grams = gramsById[id];
    return typeof grams === 'number' && Number.isFinite(grams) && grams > 0 && materialById.has(id);
  });
  const knownDose = validMasses && typeof volumeL === 'number' && Number.isFinite(volumeL) && volumeL > 0
    ? totalGrams / volumeL
    : undefined;
  const yeastOptions = prepared.runtime.engineData.knowledge
    .filter((row): row is HopYeast => row.kind === 'yeast')
    .sort((a, b) => collator.compare(a.name, b.name));

  const setSelected = (materialId: string) => {
    setError('');
    setSelectedIds((current) => current.includes(materialId)
      ? current.filter((id) => id !== materialId)
      : [...current, materialId]);
  };

  const setQuantity = (materialId: string, next: number | undefined) => {
    setError('');
    setGramsById((current) => ({ ...current, [materialId]: next }));
  };

  const toggleTrialMaterial = (materialId: string) => {
    if (trialLines.some((line) => line.kind === 'add' && line.materialId === materialId)) {
      setTrialLines((current) => current.filter((line) => !(line.kind === 'add' && line.materialId === materialId)));
    } else addTrialMaterial(materialId);
  };

  const chooseComparison = (role: 'source' | 'alternative', materialId: string) => {
    const current = role === 'source' ? compareSourceId : compareAlternativeId;
    const other = role === 'source' ? compareAlternativeId : compareSourceId;
    const setCurrent = role === 'source' ? setCompareSourceId : setCompareAlternativeId;
    const setOther = role === 'source' ? setCompareAlternativeId : setCompareSourceId;
    if (current === materialId) { setCurrent(''); return; }
    if (other === materialId) setOther('');
    setCurrent(materialId);
  };

  const comparisonSource = materialById.get(compareSourceId)?.material;
  const comparisonAlternative = materialById.get(compareAlternativeId)?.material;
  const comparisonSnapshot = useMemo(() => {
    if (!comparisonSource || !comparisonAlternative) return undefined;
    try {
      return createHopV55ContextualComparisonSnapshot({
        source: comparisonSource,
        alternative: comparisonAlternative,
        sourceSubject: subjectFor(comparisonSource),
        alternativeSubject: subjectFor(comparisonAlternative),
        families,
        criteria: confrontationCriteria,
        readingReference: readingArchive?.contentReference ?? null,
        profileSnapshotReference: activeProfile?.profile.reference ?? null,
      });
    } catch { return undefined; }
  }, [comparisonSource, comparisonAlternative, subjectFor, families, confrontationCriteria, readingArchive?.contentReference,
    activeProfile?.profile.reference]);
  const plannedSourceLines = comparisonSource && program
    ? program.additions.filter((addition) => addition.materialId === comparisonSource.id && addition.status === 'planned')
    : [];
  const comparisonTrialAction = !comparisonSource || !comparisonAlternative ? undefined
    : !trialMode ? {
      label: `Placer ${comparisonAlternative.name} dans le creuset`,
      hint: 'Masse, emploi et volume restent à saisir dans le creuset.',
      onClick: () => setSelectedIds((current) => current.includes(comparisonAlternative.id) ? current : [...current, comparisonAlternative.id]),
    }
      : !program ? undefined
        : plannedSourceLines.length ? {
          label: `Préparer l’essai : remplacer ${comparisonSource.name} par ${comparisonAlternative.name}`,
              hint: !trialFrameReady ? 'Relis la source exacte et son contexte avant de créer une ligne d’essai.' : plannedSourceLines.length === 1
            ? 'La seule ligne prévue de cette source est reprise; la dose ou la convention reste à choisir.'
            : `${plannedSourceLines.length} lignes prévues portent cette source : choisis la ligne exacte dans l’essai.`,
              disabled: !trialFrameReady,
          onClick: () => {
                if (!trialFrameReady || !currentOriginContext || !programReference) {
                  setError('Relis la source exacte avant de créer une ligne d’essai; aucun contexte par défaut n’est retenu.');
                  return;
                }
            const line: HopV55TrialLineDraft = { key: newId(), originProgramReference: programReference,
                  originContextReference: currentOriginContext.reference,
              kind: 'replace', materialId: comparisonAlternative.id, dose: '',
              ...(plannedSourceLines.length === 1 ? { sourceAdditionId: plannedSourceLines[0].id } : {}) };
            setTrialLines((current) => [...current, line]);
          },
        } : {
          label: `Placer ${comparisonAlternative.name} dans l’essai`,
              hint: !trialFrameReady ? 'Relis la source exacte et son contexte avant de créer une ligne d’essai.'
                : 'La source n’a pas de ligne prévue dans le programme : l’alternative peut être ajoutée, sans masse ni emploi préremplis.',
              disabled: !trialFrameReady,
          onClick: () => addTrialMaterial(comparisonAlternative.id),
        };

  const focusName = activeFocus === UNKNOWN_FOCUS
    ? 'Sans descripteur relié aux axes du modèle'
    : activeFamily?.name ?? (activeFocus && activeFocus !== ALL_FOCUS ? 'Catégorie absente des données chargées' : 'Tout le catalogue');

  const compose = () => {
    if (selectedIds.length < 2) {
      setError('Ajoute au moins deux matières au creuset.');
      return;
    }
    if (selectedIds.some((id) => !materialById.has(id))) {
      setError('Une matière sélectionnée n’est plus disponible dans le contexte chargé. Retire-la ou recharge le contexte.');
      return;
    }
    if (!label.trim()) {
      setError('Donne un nom à cette composition.');
      return;
    }
    if (typeof volumeL !== 'number' || !Number.isFinite(volumeL) || volumeL <= 0) {
      setError('Indique un volume strictement positif pour cette hypothèse.');
      return;
    }
    if (!use) {
      setError('Choisis explicitement un emploi pour cette composition.');
      return;
    }
    if (!validMasses) {
      setError('Renseigne une masse positive en grammes pour chaque matière sélectionnée.');
      return;
    }
    if (!temperatureValid || !contactValid) {
      setError('Corrige ou efface la saisie invalide de température ou de contact avant de composer.');
      return;
    }
    if (temperatureC !== undefined && (!Number.isFinite(temperatureC) || temperatureC < -273.15)) {
      setError('La température doit être une valeur valide au-dessus du zéro absolu.');
      return;
    }
    if (contactHours !== undefined && (!Number.isFinite(contactHours) || contactHours < 0)) {
      setError('Le contact doit être une durée positive ou nulle.');
      return;
    }
    setError('');
    onCompose({
      label: label.trim(),
      materials: selectedIds.map((materialId) => ({ materialId, grams: gramsById[materialId]! })),
      use,
      ...(temperatureC !== undefined ? { temperatureC } : {}),
      ...(contactHours !== undefined ? { contactHours } : {}),
      ...(yeastId ? { yeastId } : {}),
      volumeL,
    });
  };

  const mapFamilies = families.slice(0, MAP_FAMILY_LIMIT);
  const mapNodes = [
    ...mapFamilies.map((family, index) => ({
      key: family.key,
      number: dataIndex(index),
      count: familyCounts.get(family.key) ?? 0,
      label: family.name,
      unknown: false,
    })),
    {
      key: UNKNOWN_FOCUS,
      number: '?',
      count: unknownRows.length,
      label: 'Sans descripteur relié aux axes du modèle',
      unknown: true,
    },
  ];

  const handleMapKey = (event: React.KeyboardEvent<SVGGElement>, key: FocusKey) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setFocus(key);
      setVisibleMaterialCount(MATERIAL_PAGE_SIZE);
    }
  };

  return (
    <section className="hop-v55-explorer" aria-labelledby="hop-v55-explorer-title">
      <header className="hop-v55-explorer__header">
        <p className="hop-v55-explorer__eyebrow">Explorer les houblons</p>
        <h2 id="hop-v55-explorer-title">Panorama documentaire et creuset</h2>
        <p>
          La carte relie les matières aux termes exacts des axes documentés. Les positions servent au repérage :
          elles ne représentent ni intensité, ni distance sensorielle, ni résultat de bière.
        </p>
        <div className="hop-v55-explorer__intent">
          <b>Question</b>
          <span>{intent.question || 'Aucune question saisie'}</span>
          {intent.criteria.length > 0 && (
            <span className="hop-v55-explorer__criteria">
              Critères : {intent.criteria.map((criterion) => criterion.label).join(' · ')}
            </span>
          )}
        </div>
      </header>

      <HopV55ContextualComparisonPanel
        materials={runtimeMaterials}
        families={families}
        subjectFor={subjectFor}
        programMaterialIds={programMaterialIds}
        sourceId={compareSourceId}
        alternativeId={compareAlternativeId}
        onSourceChange={setCompareSourceId}
        onAlternativeChange={setCompareAlternativeId}
        criteria={confrontationCriteria}
        readingArchive={readingArchive}
        comparisonSnapshot={comparisonSnapshot}
        trialAction={comparisonTrialAction}
      >
        <HopV55ExplorationProfilePanel
          families={families}
          history={profileHistory}
          sessionProfile={sessionProfile}
          activeKey={activeProfileKey}
          onActiveKeyChange={setActiveProfileKey}
          onSessionProfile={setSessionProfile}
          onDeclare={onDeclareProfile}
          newId={newId}
          now={() => new Date().toISOString()}
        />
      </HopV55ContextualComparisonPanel>

      <div className="hop-v55-explorer__workspace">
        <div className="hop-v55-explorer__discovery">
          <section className="hop-v55-explorer__panel" aria-labelledby="hop-v55-map-title">
            <div className="hop-v55-explorer__section-head">
              <div>
                <p className="hop-v55-explorer__eyebrow">Carte des familles</p>
                <h3 id="hop-v55-map-title">Du large au terme documenté</h3>
              </div>
              <span className="hop-v55-explorer__count">{materials.length} matières chargées</span>
            </div>

            <div className="hop-v55-explorer__map-wrap">
              <svg
                className="hop-v55-explorer__map"
                viewBox="0 0 360 260"
                role="group"
                aria-label="Carte cliquable des catégories documentaires"
              >
                <circle cx="180" cy="124" r="43" className="hop-v55-explorer__map-hub" />
                <text x="180" y="121" textAnchor="middle" className="hop-v55-explorer__map-hub-title">Catalogue</text>
                <text x="180" y="138" textAnchor="middle" className="hop-v55-explorer__map-hub-caption">par familles</text>
                {mapNodes.map((node, index) => {
                  const point = node.unknown ? { x: 180, y: 226 } : mapCoordinates(index, mapFamilies.length);
                  const selected = activeFocus === node.key;
                  return (
                    <g
                      key={node.key}
                      className={`hop-v55-explorer__map-node${selected ? ' is-active' : ''}${node.unknown ? ' is-unknown' : ''}`}
                      role="button"
                      tabIndex={0}
                      aria-pressed={selected}
                      aria-label={node.unknown
                        ? `${node.label} : ${node.count} matière${node.count > 1 ? 's' : ''} sans correspondance lexicale trouvée`
                        : `${node.label} : ${node.count} matière${node.count > 1 ? 's' : ''} portant des termes documentés`}
                      onClick={() => { setFocus(node.key); setVisibleMaterialCount(MATERIAL_PAGE_SIZE); }}
                      onKeyDown={(event) => handleMapKey(event, node.key)}
                    >
                      {!node.unknown && <line x1="180" y1="124" x2={point.x} y2={point.y} className="hop-v55-explorer__map-link" />}
                      {node.unknown && <line x1="180" y1="168" x2={point.x} y2={point.y - 22} className="hop-v55-explorer__map-link is-dashed" />}
                      <circle cx={point.x} cy={point.y} r={node.unknown ? 21 : 19} className="hop-v55-explorer__map-dot" />
                      <text x={point.x} y={point.y - 25} textAnchor="middle" className="hop-v55-explorer__map-index">{node.number}</text>
                      <text x={point.x} y={point.y + 5} textAnchor="middle" className="hop-v55-explorer__map-number">{node.count}</text>
                      <title>{`${node.label} · ${node.count} matière${node.count > 1 ? 's' : ''} avec une correspondance documentaire`}</title>
                    </g>
                  );
                })}
              </svg>
              <p className="hop-v55-explorer__map-note">
                Le nombre indique des fiches avec une correspondance lexicale, jamais une intensité. « ? » regroupe les matières
                sans correspondance trouvée : cela reste inconnu, pas nul.
              </p>
              {families.length > MAP_FAMILY_LIMIT && (
                <p className="hop-v55-explorer__limit-note">
                  Carte limitée à {MAP_FAMILY_LIMIT} catégories sur {families.length} ; toutes restent disponibles dans la liste et la recherche.
                </p>
              )}
            </div>

            <div className="hop-v55-explorer__family-list" role="group" aria-label="Familles et termes documentaires">
              <div className="hop-v55-explorer__family-tools">
                <button
                  type="button"
                  className={`hop-v55-explorer__family-button${activeFocus === ALL_FOCUS || (activeFocus === null && !suggestedFocus) ? ' is-active' : ''}`}
                  aria-pressed={activeFocus === ALL_FOCUS || (activeFocus === null && !suggestedFocus)}
                  onClick={() => { setFocus(ALL_FOCUS); setVisibleMaterialCount(MATERIAL_PAGE_SIZE); }}
                >
                  Tout le catalogue <span>{materials.length}</span>
                </button>
                {visibleFamilies.map((family) => {
                  const count = familyCounts.get(family.key) ?? 0;
                  const selected = activeFocus === family.key;
                  const familyIndex = families.findIndex((candidate) => candidate.key === family.key);
                  return (
                    <button
                      type="button"
                      className={`hop-v55-explorer__family-button${selected ? ' is-active' : ''}`}
                      key={family.key}
                      aria-pressed={selected}
                      onClick={() => { setFocus(family.key); setVisibleMaterialCount(MATERIAL_PAGE_SIZE); }}
                    >
                      <span className="hop-v55-explorer__family-index">{dataIndex(familyIndex)}</span>
                      <span className="hop-v55-explorer__family-copy">
                        <b>{family.name}</b>
                        <small>{family.terms.join(' · ')}</small>
                      </span>
                      <span className="hop-v55-explorer__family-count" aria-label={`${count} matière${count === 1 ? '' : 's'} documentée${count === 1 ? '' : 's'}`}>{count}</span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  className={`hop-v55-explorer__family-button is-unknown${activeFocus === UNKNOWN_FOCUS ? ' is-active' : ''}`}
                  aria-pressed={activeFocus === UNKNOWN_FOCUS}
                  onClick={() => { setFocus(UNKNOWN_FOCUS); setVisibleMaterialCount(MATERIAL_PAGE_SIZE); }}
                >
                  <span className="hop-v55-explorer__family-index">?</span>
                  <span className="hop-v55-explorer__family-copy">
                    <b>Sans descripteur relié aux axes du modèle</b>
                    <small>Inconnu sur ces catégories · pas une absence sensorielle</small>
                  </span>
                  <span className="hop-v55-explorer__family-count" aria-label={`${unknownRows.length} matières sans correspondance documentaire`}>{unknownRows.length}</span>
                </button>
                {visibleFamilyRows.length > visibleFamilies.length && (
                  <button type="button" className="hop-v55-explorer__more" onClick={() => setVisibleFamilyCount((count) => count + FAMILY_PAGE_SIZE)}>
                    Afficher les catégories suivantes ({visibleFamilyRows.length - visibleFamilies.length} restantes)
                  </button>
                )}
              </div>
            </div>

            {activeFamily && (
              <div className="hop-v55-explorer__focus" aria-live="polite">
                <div className="hop-v55-explorer__section-head">
                  <div>
                    <p className="hop-v55-explorer__eyebrow">Focus documentaire · axe {activeFamily.axisId} v{activeFamily.version}</p>
                    <h4>{activeFamily.name}</h4>
                  </div>
                  <button type="button" className="hop-v55-explorer__text-button" onClick={() => setFocus(ALL_FOCUS)}>Retirer le focus</button>
                </div>
                {activeFamily.description && <p>{activeFamily.description}</p>}
                <p><b>Termes exacts du modèle :</b> {activeFamily.terms.join(' · ')}</p>
                <p className="hop-v55-explorer__limit-note">Une correspondance décrit un texte documentaire sur la matière ou l’infusion. Elle ne quantifie pas le profil ni la bière.</p>
                <div className="hop-v55-explorer__model-sources">
                  {activeFamily.models.map((model) => (
                    <div key={`${model.id}@${model.version}`}>
                      <p className="hop-v55-explorer__limit-note">Modèle {model.name} · v{model.version} · {model.enabled ? 'activé' : 'désactivé'}</p>
                    </div>
                  ))}
                </div>
                <div className="hop-v55-explorer__citations">
                  {activeFamilySources.map((source, index) => <SourceCitation key={`${source.reference}-${index}`} source={source} />)}
                </div>
              </div>
            )}
            {activeFocus === UNKNOWN_FOCUS && (
              <div className="hop-v55-explorer__focus" aria-live="polite">
                <div className="hop-v55-explorer__section-head">
                  <div>
                    <p className="hop-v55-explorer__eyebrow">Focus explicite</p>
                    <h4>Sans descripteur relié aux axes du modèle</h4>
                  </div>
                  <button type="button" className="hop-v55-explorer__text-button" onClick={() => setFocus(ALL_FOCUS)}>Retirer le focus</button>
                </div>
                <p>Ces fiches restent choisissables. L’absence de correspondance lexicale ne signifie ni intensité nulle, ni propriété absente.</p>
              </div>
            )}
          </section>

          <section className="hop-v55-explorer__panel" aria-labelledby="hop-v55-catalogue-title">
            <div className="hop-v55-explorer__section-head">
              <div>
                <p className="hop-v55-explorer__eyebrow">Catalogue complet</p>
                <h3 id="hop-v55-catalogue-title">Chercher une matière et la choisir</h3>
              </div>
              <span className="hop-v55-explorer__count">{filteredMaterials.length} résultat{filteredMaterials.length === 1 ? '' : 's'}</span>
            </div>
            <label className="hop-v55-explorer__search-label" htmlFor="hop-v55-explorer-search">
              Matière, lot, variété, description, source ou terme documentaire
            </label>
            <Input
              id="hop-v55-explorer-search"
              className="hop-v55-explorer__search"
              type="search"
              value={query}
              onChange={(event) => { setQuery(event.target.value); setVisibleMaterialCount(MATERIAL_PAGE_SIZE); setVisibleFamilyCount(FAMILY_PAGE_SIZE); }}
              placeholder="Ex. une variété, une description, une source…"
            />
            <p className="hop-v55-explorer__limit-note">
              La recherche porte sur toutes les matières chargées, y compris les lots et les alias. Le focus « {focusName} » filtre seulement les résultats affichés.
            </p>

            {filteredMaterials.length === 0 ? (
              <div className="hop-v55-explorer__empty" role="status">
                <b>Aucune matière dans ce focus pour cette recherche.</b>
                <span>Efface le filtre de famille ou la recherche ; le catalogue complet reste chargé.</span>
                <button type="button" className="hop-v55-explorer__text-button" onClick={() => { setQuery(''); setFocus(ALL_FOCUS); }}>
                  Revenir à tout le catalogue
                </button>
              </div>
            ) : (
              <ul className="hop-v55-explorer__materials" aria-label="Résultats du catalogue de houblons">
                {visibleMaterials.map((row) => {
                  const selected = trialMode
                    ? trialLines.some((line) => line.kind === 'add' && line.materialId === row.material.id)
                    : selectedIds.includes(row.material.id);
                  const matchedDescriptions = evidenceForFamily(row, activeFamily?.key);
                  const isSource = compareSourceId === row.material.id;
                  const isAlternative = compareAlternativeId === row.material.id;
                  return (
                    <li className={`hop-v55-explorer__material${selected ? ' is-selected' : ''}`} key={row.material.id}>
                      <div className="hop-v55-explorer__material-head">
                        <div>
                          <h4>{row.material.name}</h4>
                          <p>{formName(row.material)}{row.material.lot?.lotNumber ? ` · lot ${row.material.lot.lotNumber}` : ''}</p>
                        </div>
                        {trialMode ? (
                          <button
                            type="button"
                            className={`hop-v55-explorer__select${selected ? ' is-selected' : ''}`}
                            aria-label={`${selected ? 'Retirer' : 'Ajouter'} ${row.material.name} ${selected ? 'de' : 'à'} l’essai`}
                            aria-pressed={selected}
                            disabled={!trialFrameReady}
                            onClick={() => toggleTrialMaterial(row.material.id)}
                          >
                            {selected ? 'Dans l’essai ✓' : 'Ajouter à l’essai'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={`hop-v55-explorer__select${selected ? ' is-selected' : ''}`}
                            aria-label={`${selected ? 'Retirer' : 'Ajouter'} ${row.material.name} ${selected ? 'du' : 'au'} creuset`}
                            aria-pressed={selected}
                            onClick={() => setSelected(row.material.id)}
                          >
                            {selected ? 'Au creuset ✓' : 'Ajouter au creuset'}
                          </button>
                        )}
                      </div>
                      <div className="hop-v55-explorer__compare-actions" role="group" aria-label={`Comparer ${row.material.name}`}>
                        <button type="button" className={`hop-v55-explorer__compare-button${isSource ? ' is-active' : ''}`} aria-pressed={isSource}
                          aria-label={`Choisir ${row.material.name} comme source de comparaison`} onClick={() => chooseComparison('source', row.material.id)}>
                          {isSource ? 'Source ✓' : 'Source'}
                        </button>
                        <button type="button" className={`hop-v55-explorer__compare-button${isAlternative ? ' is-active' : ''}`} aria-pressed={isAlternative}
                          aria-label={`Choisir ${row.material.name} comme alternative de comparaison`} onClick={() => chooseComparison('alternative', row.material.id)}>
                          {isAlternative ? 'Alternative ✓' : 'Alternative'}
                        </button>
                      </div>
                      {activeFamily ? (
                        <MaterialEvidence descriptions={matchedDescriptions} emptyMessage="Aucune correspondance documentaire dans ce focus." />
                      ) : row.variety?.descriptions.length ? (
                        <details className="hop-v55-explorer__descriptions">
                          <summary>{row.variety.descriptions.length} description{row.variety.descriptions.length === 1 ? '' : 's'} documentée{row.variety.descriptions.length === 1 ? '' : 's'}</summary>
                          <MaterialEvidence descriptions={row.variety.descriptions} />
                        </details>
                      ) : (
                        <p className="hop-v55-explorer__unknown-note">Aucune description de variété chargée. L’identité et la forme déclarée restent conservées.</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            {filteredMaterials.length > visibleMaterials.length && (
              <button type="button" className="hop-v55-explorer__more" onClick={() => setVisibleMaterialCount((count) => count + MATERIAL_PAGE_SIZE)}>
                Afficher {Math.min(MATERIAL_PAGE_SIZE, filteredMaterials.length - visibleMaterials.length)} matières de plus
                <span> · {visibleMaterials.length} sur {filteredMaterials.length} rendues, recherche complète</span>
              </button>
            )}
          </section>
        </div>

        {trialMode && onPrepareTrial ? (
          <aside className="hop-v55-explorer__crucible" aria-labelledby="hop-v55-crucible-title">
            <div className="hop-v55-explorer__crucible-heading">
              <p className="hop-v55-explorer__eyebrow">Préparer un essai</p>
              <h3 id="hop-v55-crucible-title">Essai</h3>
              <p>Chaque ligne garde son identité exacte, sa masse, son emploi et ses conditions. La préparation passe par le contrôle canonique du programme; rien n’est appliqué.</p>
            </div>
            {!trialFrameReady ? <p className="hop-v55-explorer__limit-note" role="status">
              {originContextRead.status === 'unsupportedReadOnly'
                ? `Format du cadre d’origine non pris en charge${originContextRead.format ? ` (${originContextRead.format})` : ''}; lignes d’essai désactivées.`
                : 'Le cadre exact propriétaire/source/runtime/lecture/programme manque ou ne correspond pas au programme courant; lignes d’essai désactivées.'}
            </p> : null}
            <HopV55ExplorationTrialPanel
              program={program}
              originContext={currentOriginContext ?? null}
              materials={runtimeMaterials}
              intent={intent}
              lines={trialLines}
              onLinesChange={setTrialLines}
              yeasts={yeastOptions.map((yeast) => ({ id: yeast.id, name: yeast.name }))}
              yeastId={yeastId}
              onYeastChange={setYeastId}
              profileSnapshot={activeProfile ? { kind: activeProfile.persisted ? 'persisted' : 'session', profile: activeProfile.profile } : null}
              comparisonSnapshot={comparisonSnapshot && comparisonSource && comparisonAlternative
                ? { sourceId: comparisonSource.id, alternativeId: comparisonAlternative.id, snapshot: comparisonSnapshot } : null}
              onPrepareTrial={onPrepareTrial}
              newId={newId}
            />
          </aside>
        ) : (
        <aside className="hop-v55-explorer__crucible" aria-labelledby="hop-v55-crucible-title">
          <div className="hop-v55-explorer__crucible-heading">
            <p className="hop-v55-explorer__eyebrow">Composer une hypothèse</p>
            <h3 id="hop-v55-crucible-title">Creuset</h3>
            <p>Choisis au moins deux matières puis règle leurs masses et le procédé. Composer transmet un brouillon au parent ; cela ne modifie ni recette ni brassin.</p>
          </div>

          {selectedIds.length === 0 ? (
            <p className="hop-v55-explorer__empty">Aucune matière choisie. La recherche et les changements de focus ne modifient pas cette composition.</p>
          ) : (
            <ol className="hop-v55-explorer__crucible-list">
              {selectedIds.map((materialId) => {
                const row = materialById.get(materialId);
                return (
                  <li key={materialId}>
                    <div className="hop-v55-explorer__crucible-row-head">
                      <div>
                        <b>{row?.material.name ?? `Matière indisponible · ${materialId}`}</b>
                        <span>{row ? formName(row.material) : 'Référence conservée; à retirer ou recharger'}</span>
                      </div>
                      <button type="button" className="hop-v55-explorer__remove" aria-label={`Retirer ${row?.material.name ?? materialId} du creuset`} onClick={() => setSelected(materialId)}>Retirer</button>
                    </div>
                    {row && !hasFamilyEvidence(row) && <p className="hop-v55-explorer__unknown-note">Descripteurs de ces axes inconnus pour cette matière ; elle reste composable.</p>}
                    <div className="hop-v55-explorer__field">
                      <HopV55ExactInput
                        label={`Quantité de ${row?.material.name ?? materialId}`}
                        unit="g"
                        value={gramsById[materialId]}
                        onValue={(next) => setQuantity(materialId, typeof next === 'number' && Number.isFinite(next) ? next : undefined)}
                        min={0}
                        required
                      />
                    </div>
                  </li>
                );
              })}
            </ol>
          )}

          <div className="hop-v55-explorer__composition-fields">
            <label className="hop-v55-explorer__field" htmlFor="hop-v55-composition-label">
              <span>Nom de cette composition</span>
              <Input id="hop-v55-composition-label" className="hop-v55-explorer__text-input" value={label} onChange={(event) => { setLabel(event.target.value); setError(''); }} />
            </label>
            <div className="hop-v55-explorer__field">
              {contextVolumeIsKnown
                ? <small className="hop-v55-explorer__field-hint">Prérempli depuis le contexte actif : {formatValue(contextVolume)} L. Vérifie ce volume.</small>
                : <small className="hop-v55-explorer__field-hint">Aucun volume connu pour cette hypothèse : saisis une valeur positive.</small>}
              <HopV55ExactInput
                label="Volume de cette hypothèse"
                unit="L"
                value={volumeL}
                onValue={(next) => { setVolumeL(typeof next === 'number' && Number.isFinite(next) ? next : undefined); setError(''); }}
                min={0}
                required
              />
            </div>
            <label className="hop-v55-explorer__field" htmlFor="hop-v55-composition-use">
              <span>Emploi <small>obligatoire</small></span>
              <select id="hop-v55-composition-use" value={use} onChange={(event) => { setUse(event.target.value as HopUse | ''); setError(''); }} required>
                <option value="">Choisir un emploi</option>
                {useOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label className="hop-v55-explorer__field" htmlFor="hop-v55-composition-yeast">
              <span>Souche de levure <small>facultative</small></span>
              <select id="hop-v55-composition-yeast" value={yeastId} onChange={(event) => { setYeastId(event.target.value); setError(''); }}>
                <option value="">Aucune souche sélectionnée</option>
                {yeastId && !yeastOptions.some((yeast) => yeast.id === yeastId)
                  ? <option value={yeastId}>Souche liée à la sélection · {yeastId} · fiche non chargée</option>
                  : null}
                {yeastOptions.map((yeast) => <option key={yeast.id} value={yeast.id}>{yeast.name} · {yeast.id}</option>)}
              </select>
            </label>
            <div className="hop-v55-explorer__field-grid">
              <OptionalExactField label="Température" unit="°C" value={temperatureC} min={-273.15}
                onValue={(next) => { setTemperatureC(next); setError(''); }} onValidity={setTemperatureValid} />
              <OptionalExactField label="Contact" unit="heures" value={contactHours} min={0}
                onValue={(next) => { setContactHours(next); setError(''); }} onValidity={setContactValid} />
            </div>
          </div>

          <div className="hop-v55-explorer__dose" aria-live="polite">
            <span>Masse totale saisie</span>
            <b>{totalMassKnown ? `${formatValue(totalGrams)} g` : 'À compléter'}</b>
            <span>Dose réelle calculable</span>
            <b>{knownDose === undefined ? 'À compléter' : `${formatValue(knownDose)} g/L`}</b>
          </div>
          {error && <p className="hop-v55-explorer__error" role="alert">{error}</p>}
          <button type="button" className="hop-v55-explorer__compose" onClick={compose}>
            Composer l’hypothèse
          </button>
          <p className="hop-v55-explorer__footnote">La sélection, l’édition et la composition n’appliquent aucun changement. Le parent choisit explicitement si cette hypothèse rejoint une branche future.</p>
        </aside>
        )}
      </div>
    </section>
  );
}

