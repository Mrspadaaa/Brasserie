import React, { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react';
import type { HopAdviceAssertion, HopAdviceSituation } from '../../domain/hopDecision/adviceSchema';
import type { HopDecisionContext } from '../../domain/hopDecision/dossier';
import { hopDecisionReference } from '../../domain/hopDecision/measurements';
import { programFingerprint } from '../../domain/hopDecision/programs';
import type { HopDecisionMaterial, HopDecisionProgram, HopProcessStage, HopUse } from '../../domain/hopDecision/types';
import type { PreparedBrewingScenarioContext } from '../../domain/brewingScenarioContext';
import type { HopV55QualifiedAdvicePrepareRequest } from '../../services/hopV55/qualifiedAdviceController';
import { readHopV55DecisionReadingArchive, type HopV55DecisionReadingArchiveV2,
  type HopV55DecisionReadingArchiveV3, type HopV55DecisionReadingArchiveV4 } from '../../services/hopV55/decisionArchive';
import { hopV55DecisionReadingScopesV1 } from '../../services/hopV55/decisionReadingAccessors';
import type { HopV55SemanticAnnotationV1, HopV55SemanticQuestionReadingV1 } from '../../services/hopV55/questionSemanticReading';
import type { HopV55QuestionScopeLedgerEntryV1 } from '../../services/hopV55/questionScopeReading';
import { Input, Textarea } from '../Input';
import './qualified-advice-preparation-controls.css';

export interface HopV55QualifiedAdvicePreparationControlsProps {
  /** Exact V2/V3/V4 source reading; a semantic V4 annotation is never reduced to legacy drafts. */
  archive: HopV55DecisionReadingArchiveV2 | HopV55DecisionReadingArchiveV3 | HopV55DecisionReadingArchiveV4;
  prepared: PreparedBrewingScenarioContext;
  /** Complete typed context supplied by the parent, including assertions and exclusions. */
  baseSituation: HopAdviceSituation;
  /** Exact loaded catalogue choices. Search only filters this list; it never selects a material. */
  materials: readonly HopDecisionMaterial[];
  sourceContext: HopDecisionContext | null | undefined;
  /** Exact programme for this source; undefined means the parent did not provide one. */
  currentProgram: HopDecisionProgram | null | undefined;
  readOnly?: boolean;
  onPrepare(request: HopV55QualifiedAdvicePrepareRequest): Promise<void>;
}

type SourceResolution =
  | { status: 'ready'; sourceLabel: string; kind: 'fixed'; stage: HopProcessStage; program: HopDecisionProgram | null }
  | { status: 'ready'; sourceLabel: string; kind: 'future' }
  | { status: 'blocked'; reason: string };

const STAGES: readonly HopProcessStage[] = ['planning', 'hotSide', 'fermenting', 'conditioning', 'packaged'];
const stageLabels: Record<HopProcessStage, string> = {
  planning: 'Préparation de la recette', hotSide: 'Côté chaud', fermenting: 'Fermentation',
  conditioning: 'Garde', packaged: 'Conditionnement terminé',
};
const stageDescriptions: Record<HopProcessStage, string> = {
  planning: 'avant le brassage', hotSide: 'pendant les opérations côté chaud', fermenting: 'pendant la fermentation',
  conditioning: 'pendant la garde', packaged: 'après conditionnement',
};
const useLabels: Record<HopUse, string> = {
  firstWort: 'premier moût', boil: 'ébullition', whirlpool: 'whirlpool', fermentation: 'fermentation', postFermentation: 'après fermentation',
};
const dimensionLabels: Record<NonNullable<HopAdviceSituation['criterionDimensions'][number]['dimension']>, string> = {
  aroma: 'arômes', acidity: 'acidité', alcohol: 'alcool', bioInteraction: 'interaction avec la culture', hopCreep: 'hop creep',
  matrixTransfer: 'transfert dans la bière', process: 'procédé', stock: 'stock', documentation: 'documentation', other: 'autre',
};
const assertionStateLabels: Record<HopAdviceAssertion['state'], string> = {
  reported: 'déclaré', measured: 'mesuré', planned: 'prévu', performed: 'réalisé', unknown: 'inconnu',
};
const exclusionCertaintyLabels: Record<HopAdviceSituation['exclusions'][number]['certainty'], string> = {
  certain: 'certain', possible: 'possible', unknown: 'incertain',
};
const formLabels: Partial<Record<HopDecisionMaterial['form'], string>> = {
  pelletT90: 'pellets T-90', pelletT45: 'pellets T-45', cryo: 'houblon cryogénique', cone: 'cônes', extract: 'extrait', unknown: 'forme non précisée',
};

const same = (left: unknown, right: unknown) => hopDecisionReference(left) === hopDecisionReference(right);
const isStage = (value: unknown): value is HopProcessStage => STAGES.includes(value as HopProcessStage);

function sourceName(source: HopV55DecisionReadingArchiveV2['source']): string {
  switch (source.kind) {
    case 'recipe': return 'Recette source';
    case 'batch': return 'Brassin source';
    case 'exploration': return 'Exploration sans recette ni brassin';
    case 'localRecipeCopy': return 'Copie locale de recette';
    case 'localFutureDraft': return 'Brouillon futur exact';
  }
}

function sourceIdentifiers(source: HopV55DecisionReadingArchiveV2['source']): Array<{ label: string; value: string }> {
  switch (source.kind) {
    case 'recipe': return [{ label: 'Recette', value: source.id }];
    case 'batch': return [{ label: 'Brassin', value: source.id }];
    case 'exploration': return [];
    case 'localRecipeCopy': return [
      { label: 'Espace de travail', value: source.workspaceId }, { label: 'Copie', value: source.copyId },
      { label: 'Recette', value: source.recipeId }, { label: 'Référence de recette', value: source.recipeReference },
    ];
    case 'localFutureDraft': return [
      { label: 'Espace de travail', value: source.workspaceId }, { label: 'Brouillon', value: source.draftId },
      { label: 'Révision', value: String(source.revision) }, { label: 'Référence de contenu', value: source.contentReference },
    ];
  }
}

/** UI guard only. The controller rechecks all source and freshness constraints before preparing. */
export function inspectHopV55QualifiedAdviceSource(input: Pick<HopV55QualifiedAdvicePreparationControlsProps,
  'archive' | 'prepared' | 'baseSituation' | 'sourceContext' | 'currentProgram'>): SourceResolution {
  const { archive, prepared, baseSituation, sourceContext, currentProgram } = input;
  if (archive.format !== 'hop-v55-decision-reading-v2' && archive.format !== 'hop-v55-decision-reading-v3'
    && archive.format !== 'hop-v55-decision-reading-v4') {
    return { status: 'blocked', reason: 'Une lecture structurée V2/V3/V4 exacte est nécessaire pour préparer cette étude.' };
  }
  const checkedArchive = readHopV55DecisionReadingArchive(archive);
  if (checkedArchive.status !== 'available' || checkedArchive.archive.contentReference !== archive.contentReference
    || checkedArchive.archive.format !== archive.format) {
    return { status: 'blocked', reason: 'L’archive exacte, ses annotations ou ses portées ne passent plus la validation du lecteur.' };
  }
  if (archive.reading.response?.actionKind !== 'exploreStrategies'
    || archive.reading.response.intent.originalQuestion !== archive.reading.intent.question) {
    return { status: 'blocked', reason: 'Cette lecture ne contient pas de réponse de stratégies liée à sa question exacte.' };
  }
  if (sourceContext === undefined || currentProgram === undefined) {
    return { status: 'blocked', reason: 'Le contexte source ou le programme exact n’a pas été fourni par la page.' };
  }
  const source = archive.source;
  const suppliedProgram = currentProgram;
  if (!same(baseSituation.program, suppliedProgram)) {
    return { status: 'blocked', reason: 'Le programme du contexte transmis diffère du programme source exact.' };
  }

  if (source.kind === 'exploration') {
    if (sourceContext !== null || suppliedProgram !== null || prepared.runtime.current !== undefined || baseSituation.program !== null) {
      return { status: 'blocked', reason: 'Une exploration sans source physique ne peut reprendre le programme d’une autre recette ou d’un autre brassin.' };
    }
    return { status: 'ready', sourceLabel: sourceName(source), kind: 'future' };
  }

  if (source.kind === 'batch') {
    if (sourceContext?.kind !== 'batch' || sourceContext.batchId !== source.id) {
      return { status: 'blocked', reason: 'Le journal exact du brassin source n’est pas fourni; aucun stade ne peut être supposé.' };
    }
    if (!isStage(sourceContext.stage)) {
      return { status: 'blocked', reason: 'Le stade du brassin est absent ou inconnu; une exploration future ne peut pas le remplacer.' };
    }
    if (suppliedProgram) {
      try {
        if (programFingerprint(suppliedProgram) !== sourceContext.programFingerprint) {
          return { status: 'blocked', reason: 'Le programme transmis ne correspond pas à l’empreinte du journal du brassin.' };
        }
      } catch {
        return { status: 'blocked', reason: 'Le programme transmis ne peut pas être vérifié pour ce brassin.' };
      }
    }
    if ((suppliedProgram && suppliedProgram.stage !== sourceContext.stage) || baseSituation.stage !== sourceContext.stage) {
      return { status: 'blocked', reason: 'Le stade du programme diffère du stade réel du brassin.' };
    }
    if (!same(prepared.runtime.current?.program ?? null, suppliedProgram)) {
      return { status: 'blocked', reason: 'Le programme préparé ne correspond pas au programme exact du brassin.' };
    }
    return { status: 'ready', sourceLabel: sourceName(source), kind: 'fixed', stage: sourceContext.stage, program: suppliedProgram };
  }

  if (source.kind === 'recipe') {
    if (sourceContext?.kind !== 'recipe' || sourceContext.recipeId !== source.id) {
      return { status: 'blocked', reason: 'La recette et sa référence exacte doivent rester liées à cette lecture.' };
    }
  } else if (source.kind === 'localRecipeCopy') {
    if (source.workspaceId !== archive.workspaceId || sourceContext?.kind !== 'recipe'
      || sourceContext.recipeId !== source.recipeId || sourceContext.recipeReference !== source.recipeReference) {
      return { status: 'blocked', reason: 'La copie de recette ne correspond pas à la référence exacte de cette lecture.' };
    }
  } else if (source.kind === 'localFutureDraft') {
    if (source.workspaceId !== archive.workspaceId || sourceContext !== null) {
      return { status: 'blocked', reason: 'Le brouillon futur doit être relu depuis son origine exacte, sans recette hôte.' };
    }
    if (!suppliedProgram) {
      return { status: 'blocked', reason: 'Le programme source exact du brouillon futur manque.' };
    }
    if (baseSituation.stage !== suppliedProgram.stage) {
      return { status: 'blocked', reason: 'Le stade diffère du programme source exact du brouillon futur.' };
    }
    if (prepared.runtime.current !== undefined) {
      return { status: 'blocked', reason: 'Le contexte préparé contient une recette hôte; le brouillon futur doit rester isolé.' };
    }
    return { status: 'ready', sourceLabel: sourceName(source), kind: 'fixed', stage: suppliedProgram.stage, program: suppliedProgram };
  }

  if (source.kind === 'recipe' || source.kind === 'localRecipeCopy') {
    if (!same(prepared.runtime.current?.program ?? null, suppliedProgram)) {
      return { status: 'blocked', reason: 'Le programme préparé ne correspond pas au programme exact de la recette.' };
    }
    if (suppliedProgram) {
      if (baseSituation.stage !== suppliedProgram.stage) {
        return { status: 'blocked', reason: 'Le stade du contexte ne correspond pas au programme exact.' };
      }
      return { status: 'ready', sourceLabel: sourceName(source), kind: 'fixed', stage: suppliedProgram.stage, program: suppliedProgram };
    }
    return { status: 'ready', sourceLabel: sourceName(source), kind: 'future' };
  }

  return { status: 'blocked', reason: 'La source de lecture n’est pas reconnue pour cette préparation.' };
}

function formatValue(assertion: HopAdviceAssertion): string {
  if (assertion.value === null) return 'valeur non fournie';
  if (typeof assertion.value === 'boolean') return assertion.value ? 'oui' : 'non';
  return `${assertion.value}${assertion.unit ? ` ${assertion.unit}` : ''}`;
}

function formatAddition(addition: HopDecisionProgram['additions'][number], materials: readonly HopDecisionMaterial[]): string {
  const material = materials.find(row => row.id === addition.materialId);
  const identity = material?.name ?? addition.materialId;
  const quantity = addition.grams === null ? 'masse non fournie' : `${addition.grams} g`;
  const timing = addition.use === 'boil' ? (addition.boilMinutes == null ? 'durée d’ébullition non précisée' : `${addition.boilMinutes} min d’ébullition`)
    : addition.use === 'whirlpool' || addition.use === 'fermentation' || addition.use === 'postFermentation'
      ? (addition.contactHours == null ? 'contact non précisé' : `${addition.contactHours} h de contact`)
      : 'premier moût';
  return `${identity} · ${quantity} · ${useLabels[addition.use]} · ${timing} · ${addition.status === 'performed' ? 'réalisé' : 'prévu'}`;
}

const semanticSenseLabel: Record<HopV55SemanticAnnotationV1['sense'], string> = {
  qualitativeTarget: 'Cible qualitative', directedChange: 'Changement choisi', guard: 'Garde', exclusion: 'Exclusion',
  reportedObservation: 'Constat rapporté', investigation: 'Enquête', nonDecision: 'Non-décision', mention: 'Mention',
};
const semanticDirectionLabel: Record<NonNullable<HopV55SemanticAnnotationV1['direction']>, string> = {
  increase: 'hausse', decrease: 'baisse', keep: 'garder', exclude: 'éviter', investigate: 'examiner',
};

function SemanticReadingEvidence({ reading, archive }: {
  reading: HopV55SemanticQuestionReadingV1;
  archive: HopV55DecisionReadingArchiveV4;
}) {
  const scopes = hopV55DecisionReadingScopesV1(archive);
  const latest = new Map<string, HopV55QuestionScopeLedgerEntryV1>();
  for (const entry of archive.scopeLedger?.entries ?? []) latest.set(entry.scopeId, entry);
  return <>
    <section aria-label="Annotations sémantiques V4 de la lecture">
      <h5>Annotations sémantiques conservées · V4 · {reading.annotations.length}</h5>
      {reading.annotations.length ? <ul>{reading.annotations.map(annotation => <li key={annotation.id}>
        <strong>{annotation.term}</strong><span> · {semanticSenseLabel[annotation.sense]} · {annotation.requirement === 'required' ? 'engagée' : 'facultative'}
          {annotation.direction ? ` · ${semanticDirectionLabel[annotation.direction]}` : ' · direction non décidée'} · {annotation.origin === 'parser' ? 'lecture initiale' : 'correction du brasseur'}</span>
        <blockquote>{annotation.source.text}</blockquote>
        {annotation.qualification ? <p>Qualification exacte · {annotation.qualification}</p> : null}
        {annotation.note ? <p>Note exacte · {annotation.note}</p> : null}
        <details><summary>Sémantique et références exactes</summary><pre>{JSON.stringify(annotation, null, 2)}</pre></details>
      </li>)}</ul> : <p>Aucune annotation sémantique n’est ajoutée à cette question.</p>}
      <details><summary>Projection et couverture scellées</summary><pre>{JSON.stringify({ intent: reading.intent, projectionCoverage: reading.projectionCoverage }, null, 2)}</pre></details>
    </section>
    {scopes ? <section aria-label="Portées V4 de la lecture">
      <h5>Portées et ledger conservés · V4</h5>
      <p>Référence du ledger · <code>{scopes.scopeLedger.reference}</code></p>
      <p>Transition · {scopes.transition.kind} · {scopes.transition.actor.label} · {scopes.transition.reason}</p>
      {scopes.scopeLedger.sourceScopes.length ? <ul>{scopes.scopeLedger.sourceScopes.map(scope => {
        const entry = latest.get(scope.id);
        return <li key={scope.id}><strong>{scope.kind === 'employmentTiming' ? 'Moment d’emploi' : 'Sélection de matière'}</strong>
          <blockquote>{scope.sourceSpan.text}</blockquote>
          <small>{entry?.status === 'retained' ? 'retenue' : entry?.status === 'excluded' ? 'écartée' : 'ouverte'} · {scope.origin}</small>
          <details><summary>Liens et fragments exacts</summary><pre>{JSON.stringify({ sourceScope: scope,
            status: entry?.status ?? 'open', activeScope: entry?.activeScope, decision: entry?.decision }, null, 2)}</pre></details>
        </li>;
      })}</ul> : <p>Aucune portée n’est scellée avec cette lecture.</p>}
    </section> : null}
  </>;
}

export function HopV55QualifiedAdvicePreparationControls({ archive, prepared, baseSituation, materials, sourceContext,
  currentProgram, readOnly = false, onPrepare }: HopV55QualifiedAdvicePreparationControlsProps) {
  const rootId = useId();
  const source = useMemo(() => inspectHopV55QualifiedAdviceSource({ archive, prepared, baseSituation, sourceContext, currentProgram }),
    [archive, prepared, baseSituation, sourceContext, currentProgram]);
  const materialProblem = useMemo(() => {
    const ids = materials.map(row => row.id);
    if (ids.some(id => !id.trim())) return 'Une fiche chargée n’a pas d’identifiant exact; le périmètre ne peut pas être préparé.';
    if (new Set(ids).size !== ids.length) return 'Plusieurs fiches chargées partagent le même identifiant; sélectionne un catalogue corrigé.';
    return undefined;
  }, [materials]);
  const entryIdentity = useMemo(() => hopDecisionReference({
    reading: archive.contentReference,
    source: archive.source,
    runtime: prepared.runtime.current?.inputReference ?? null,
    dataRevision: prepared.runtime.dataRevision ?? null,
    sourceContext,
    currentProgram,
    situation: baseSituation,
    materialChoices: materials.map(row => ({ id: row.id, name: row.name, form: row.form })),
  }), [archive.contentReference, archive.source, prepared.runtime.current?.inputReference, prepared.runtime.dataRevision,
    sourceContext, currentProgram, baseSituation, materials]);
  const identityRef = useRef(entryIdentity);
  identityRef.current = entryIdentity;
  const attemptRef = useRef(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [catalogueOpen, setCatalogueOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [futureStage, setFutureStage] = useState<HopProcessStage | ''>('');
  const [futureReason, setFutureReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [failed, setFailed] = useState<{ request: HopV55QualifiedAdvicePrepareRequest; identity: string }>();

  useEffect(() => {
    attemptRef.current += 1;
    setSelectedIds([]);
    setCatalogueOpen(false);
    setSearch('');
    setFutureStage('');
    setFutureReason('');
    setBusy(false);
    setError('');
    setNotice('');
    setFailed(undefined);
  }, [entryIdentity]);

  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedMaterials = useMemo(() => materials.filter(row => selected.has(row.id)), [materials, selected]);
  const searchNeedle = search.trim().toLocaleLowerCase('fr');
  const filteredMaterials = useMemo(() => !searchNeedle ? materials : materials.filter(row =>
    `${row.name} ${row.id} ${formLabels[row.form] ?? ''}`.toLocaleLowerCase('fr').includes(searchNeedle)), [materials, searchNeedle]);
  const stage = source.status === 'ready' && source.kind === 'fixed' ? source.stage : futureStage || undefined;
  const futureReady = source.status === 'ready' && source.kind === 'future' && !!futureStage && !!futureReason.trim();
  const selectedIdsValid = selectedIds.every(id => materials.some(row => row.id === id))
    && new Set(selectedIds).size === selectedIds.length;
  const canSubmit = !readOnly && !busy && source.status === 'ready' && !materialProblem && selectedIdsValid
    && (source.kind === 'fixed' || futureReady);

  const clearAttempt = () => { setFailed(undefined); setError(''); setNotice(''); };
  const buildRequest = (): HopV55QualifiedAdvicePrepareRequest | undefined => {
    if (!canSubmit || !stage || currentProgram === undefined || source.status !== 'ready') return undefined;
    const situation: HopAdviceSituation = {
      ...structuredClone(baseSituation),
      stage,
      program: source.kind === 'fixed' ? structuredClone(source.program) : null,
      materialIds: [...selectedIds].sort((left, right) => left.localeCompare(right)),
    };
    return {
      action: { kind: 'exploreStrategies', situation },
      ...(source.kind === 'future' ? { explicitFutureStage: { kind: 'futureExploration', stage, basis: futureReason.trim() } } : {}),
    };
  };

  const send = async (request: HopV55QualifiedAdvicePrepareRequest, identity: string) => {
    const attempt = ++attemptRef.current;
    setBusy(true); setError(''); setNotice('');
    try {
      await onPrepare(request);
      if (identityRef.current !== identity || attemptRef.current !== attempt) return;
      setFailed(undefined);
      setNotice('La demande a été transmise à l’application.');
    } catch (cause) {
      if (identityRef.current !== identity || attemptRef.current !== attempt) return;
      const message = cause instanceof Error && cause.message ? cause.message : 'La préparation n’a pas abouti.';
      setError(message);
      setFailed({ request, identity });
    } finally {
      if (identityRef.current === identity && attemptRef.current === attempt) setBusy(false);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const request = buildRequest();
    if (request) void send(request, entryIdentity);
  };

  const sourceLabel = source.status === 'ready' ? source.sourceLabel : sourceName(archive.source);
  const question = archive.reading.intent.question;

  return <section className="hop-v55 hv-qualified-advice-prepare" aria-labelledby={`${rootId}-title`}>
    <header className="hv-qualified-advice-prepare__header">
      <p className="hv-qualified-advice-prepare__eyebrow">Étude documentaire des stratégies</p>
      <h3 id={`${rootId}-title`}>Choisir le contexte à examiner</h3>
      <p className="hv-qualified-advice-prepare__source">{sourceLabel} · question conservée mot pour mot</p>
      <blockquote aria-label="Question originale de la lecture">{question}</blockquote>
      <p className="hv-qualified-advice-prepare__boundary">Cette demande prépare une étude documentaire. Elle ne modifie ni recette ni brassin et ne choisit aucune dose.</p>
    </header>

    {readOnly ? <p className="hv-qualified-advice-prepare__readonly" role="status">Cette lecture est en consultation seule; aucun nouveau conseil ne peut être demandé ici.</p> : null}
    {source.status === 'blocked' ? <p className="hv-qualified-advice-prepare__error" role="alert">{source.reason}</p> : null}
    {materialProblem ? <p className="hv-qualified-advice-prepare__error" role="alert">{materialProblem}</p> : null}

    <section className="hv-qualified-advice-prepare__stage" aria-label="Stade de l’étude">
      {source.status === 'ready' && source.kind === 'fixed' ? <>
        <p><strong>{archive.source.kind === 'batch' ? 'Stade réel du brassin' : 'Stade repris du contexte exact'}</strong><span>{stageLabels[source.stage]}</span></p>
        <small>{archive.source.kind === 'batch' && !source.program ? 'Stade lu dans le journal du brassin; aucun programme exact n’est fourni.'
          : source.stage === 'planning' ? 'Programme source fourni.' : `Étude située ${stageDescriptions[source.stage]}.`}</small>
      </> : source.status === 'ready' ? <>
        <label htmlFor={`${rootId}-stage`}>Stade envisagé pour cette étude</label>
        <select id={`${rootId}-stage`} aria-label="Stade envisagé pour cette étude" value={futureStage} disabled={readOnly || busy}
          autoComplete="off" onChange={event => { setFutureStage(event.target.value as HopProcessStage | ''); clearAttempt(); }}>
          <option value="">Choisir un stade</option>
          {STAGES.map(value => <option key={value} value={value}>{stageLabels[value]}</option>)}
        </select>
        <p>Le contexte n’apporte pas de programme exact. Ce stade décrit seulement le scénario futur à étudier; il ne remplace pas une mesure ni un fait de la recette.</p>
        <label htmlFor={`${rootId}-stage-reason`}>Pourquoi étudier ce stade futur ?</label>
        <Textarea id={`${rootId}-stage-reason`} rows={2} value={futureReason} disabled={readOnly || busy}
          aria-label="Motif du stade futur" autoComplete="off" autoCorrect="off" autoCapitalize="sentences" spellCheck={false}
          onChange={event => { setFutureReason(event.target.value); clearAttempt(); }} />
      </> : null}
    </section>

    {source.status === 'ready' ? <>
      <section className="hv-qualified-advice-prepare__scope" aria-labelledby={`${rootId}-scope-title`}>
        <div className="hv-qualified-advice-prepare__scope-head">
          <div><h4 id={`${rootId}-scope-title`}>Matières examinées</h4>
            <p>Le périmètre exact reste vide jusqu’à une sélection explicite.</p></div>
          <strong>{selectedIds.length === 0 ? 'Aucune matière' : `${selectedIds.length} sélectionnée${selectedIds.length === 1 ? '' : 's'}`}</strong>
        </div>
        {selectedMaterials.length ? <ul className="hv-qualified-advice-prepare__selected" aria-label="Matières choisies exactement">
          {selectedMaterials.map(material => <li key={material.id}><span>{material.name || 'Nom non renseigné'}</span>
            <small>{formLabels[material.form] ?? 'Forme non précisée'} · ID exact {material.id}</small>
            <button type="button" aria-label={`Retirer ${material.name || material.id} du périmètre`} disabled={readOnly || busy}
              onClick={() => { setSelectedIds(rows => rows.filter(id => id !== material.id)); clearAttempt(); }}>Retirer</button>
          </li>)}
        </ul> : <p className="hv-qualified-advice-prepare__empty">Aucune matière n’est incluse par défaut.</p>}
        <p className="hv-qualified-advice-prepare__scope-note">Les lignes du programme, les fiches chargées et les résultats de recherche restent hors périmètre tant qu’ils ne sont pas cochés ici.</p>
        <button type="button" className="hv-qualified-advice-prepare__discover" aria-expanded={catalogueOpen}
          onClick={() => { setCatalogueOpen(open => !open); clearAttempt(); }} disabled={readOnly || busy}>
          {catalogueOpen ? 'Masquer les fiches chargées' : `Explorer les fiches chargées (${materials.length})`}
        </button>
        {catalogueOpen ? <div className="hv-qualified-advice-prepare__catalogue">
          <label htmlFor={`${rootId}-catalogue-search`}>Rechercher une identité dans ce catalogue</label>
          <Input id={`${rootId}-catalogue-search`} type="search" value={search} disabled={readOnly || busy}
            aria-label="Rechercher dans les fiches chargées" autoComplete="off"
            onChange={event => { setSearch(event.currentTarget.value); clearAttempt(); }} />
          <p className="hv-qualified-advice-prepare__catalogue-note">La recherche affiche les fiches déjà chargées; elle ne les ajoute pas au périmètre.</p>
          {filteredMaterials.length ? <ul className="hv-qualified-advice-prepare__choices" aria-label="Fiches chargées à choisir">
            {filteredMaterials.map(material => <li key={material.id}>
              <label><input type="checkbox" aria-label={`Inclure ${material.name || 'Nom non renseigné'} · ID exact ${material.id}`}
                checked={selected.has(material.id)} disabled={readOnly || busy}
                onChange={event => { setSelectedIds(rows => event.target.checked
                  ? [...rows, material.id] : rows.filter(id => id !== material.id)); clearAttempt(); }} />
                <span><strong>{material.name || 'Nom non renseigné'}</strong><small>{formLabels[material.form] ?? 'Forme non précisée'}</small></span>
              </label>
              <details><summary>Identité exacte</summary><code>{material.id}</code></details>
            </li>)}
          </ul> : <p className="hv-qualified-advice-prepare__empty">Aucune fiche chargée ne correspond à cette recherche.</p>}
        </div> : null}
      </section>

      <details className="hv-qualified-advice-prepare__context">
        <summary>Critères, faits et exclusions repris · {baseSituation.criterionDimensions.length} critères · {baseSituation.assertions.length} faits · {baseSituation.exclusions.length} exclusions</summary>
        <div className="hv-qualified-advice-prepare__context-body">
          <section><h5>Origine exacte</h5><p>{sourceName(archive.source)}</p>
            <details><summary>Références de la lecture</summary>
              <span>Lecture</span><code>{archive.contentReference}</code>
              <span>Contexte d’origine</span><code>{archive.runtimeReference}</code>
              {sourceIdentifiers(archive.source).map(row => <React.Fragment key={`${row.label}-${row.value}`}>
                <span>{row.label}</span><code>{row.value}</code>
              </React.Fragment>)}
            </details>
          </section>
          {archive.format === 'hop-v55-decision-reading-v4'
            ? <SemanticReadingEvidence reading={archive.reading} archive={archive} /> : null}
          <section><h5>Critères de lecture</h5>
            {baseSituation.criterionDimensions.length ? <ul>{baseSituation.criterionDimensions.map((row, index) => <li key={`${row.criterionId}-${index}`}>
              <span>{dimensionLabels[row.dimension] ?? 'dimension non précisée'}{row.familyId ? ` · ${row.familyId}` : ''}</span>
              <details><summary>Identité du critère</summary><code>{row.criterionId}</code></details>
            </li>)}</ul> : <p>Aucune dimension déclarée.</p>}
          </section>
          <section><h5>Faits et contexte</h5>
            {baseSituation.assertions.length ? <ul>{baseSituation.assertions.map(assertion => <li key={assertion.id}>
              <span><strong>{assertion.statement}</strong><small>{assertionStateLabels[assertion.state]} · {formatValue(assertion)}</small></span>
              {assertion.source ? <details><summary>Source</summary><span>{assertion.source.title}{assertion.source.author ? ` · ${assertion.source.author}` : ''}</span>
                {assertion.source.locator ? <span>{assertion.source.locator}</span> : null}
                {assertion.source.reference ? <code>{assertion.source.reference}</code> : null}</details> : <small>Aucune source jointe.</small>}
              <details><summary>Identité du fait</summary><code>{assertion.id}</code>{assertion.dimension ? <span> · {dimensionLabels[assertion.dimension]}</span> : null}</details>
            </li>)}</ul> : <p>Aucun fait fourni.</p>}
          </section>
          <section><h5>Exclusions conservées</h5>
            {baseSituation.exclusions.length ? <ul>{baseSituation.exclusions.map((row, index) => <li key={`${row.materialId}-${index}`}>
              <span>{row.reason} · certitude {exclusionCertaintyLabels[row.certainty]}</span><details><summary>Matière concernée</summary><code>{row.materialId}</code></details>
            </li>)}</ul> : <p>Aucune exclusion déclarée.</p>}
          </section>
          {baseSituation.constraintChecks?.length ? <section><h5>Vérifications demandées</h5><ul>{baseSituation.constraintChecks.map((row, index) => <li key={`${row.criterionId}-${index}`}>
            <span>{row.kind === 'preservePerformed' ? 'Préserver des ajouts réalisés' : row.kind === 'excludeMaterials' ? 'Exclure des matières' : 'Vérifier un emploi au stade'}</span>
            <details><summary>Détails de la vérification</summary><code>{JSON.stringify(row)}</code></details>
          </li>)}</ul></section> : null}
          {source.kind === 'fixed' ? <section><h5>Programme repris · hors périmètre de matières</h5>
            {source.program ? <>
              <p>{source.program.volumeL === null ? 'Volume non fourni' : `${source.program.volumeL} L`}</p>
              {source.program.additions.length ? <ul>{source.program.additions.map(addition => <li key={addition.id}>{formatAddition(addition, materials)}
                <details><summary>Identité de la ligne</summary><code>{addition.id}</code><code>{addition.materialId}</code></details></li>)}</ul>
                : <p>Aucune ligne de houblon dans le programme fourni.</p>}
            </> : <p>Aucun programme exact fourni; seul le stade du journal est repris.</p>}
          </section> : null}
        </div>
      </details>

      <form className="hv-qualified-advice-prepare__submit" autoComplete="off" onSubmit={submit}>
        {error ? <p className="hv-qualified-advice-prepare__error" role="alert">{error}</p> : null}
        {notice ? <p className="hv-qualified-advice-prepare__notice" role="status">{notice}</p> : null}
        {failed?.identity === entryIdentity ? <>
          <p className="hv-qualified-advice-prepare__retry-note">La même demande sera renvoyée avec les mêmes critères, matières et stade.</p>
          <button type="button" className="hv-qualified-advice-prepare__primary" disabled={busy || readOnly}
            onClick={() => void send(failed.request, failed.identity)}>{busy ? 'Envoi…' : 'Réessayer la même demande'}</button>
        </> : <button type="submit" className="hv-qualified-advice-prepare__primary" disabled={!canSubmit}>
          {busy ? 'Envoi…' : 'Préparer l’étude qualifiée'}</button>}
        {!readOnly && source.status === 'ready' && source.kind === 'future' && (!futureStage || !futureReason.trim())
          ? <small>Choisis un stade et donne le motif de cette exploration future.</small> : null}
      </form>
    </> : null}
  </section>;
}
