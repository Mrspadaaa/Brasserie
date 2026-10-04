import React, { useEffect, useId, useMemo, useState } from 'react';
import type { BrewerContext } from '../../../functions/src/companionTypes';
import type { HopAdviceOption, HopAdviceProgramScope, HopAdviceEvidenceSource, HopStrategyAdviceResult } from '../../domain/hopDecision/adviceSchema';
import type { HopDecisionResponse } from '../../domain/hopDecision/service';
import type { PreparedBrewingScenarioContext } from '../../domain/brewingScenarioContext';
import type { HopCommercialProduct, HopDecisionMaterial, HopDecisionProgram, HopUse } from '../../domain/hopDecision/types';
import type { HopV55QuestionReading } from '../../services/hopV55/decision';
import type { HopV55SemanticQuestionReadingV1 } from '../../services/hopV55/questionSemanticReading';
import type { HopV55DecisionReadingArchive } from '../../services/hopV55/decisionArchive';
import type { HopV55ProgramOperationV1 } from '../../services/hopV55/decisionProgramPreparation';
import { Input } from '../Input';
import { HopV55DecisionPreparation, HopV55SemanticDecisionPreparation, HopV55DecisionProgramPreparation,
  type HopV55SemanticCorrectionRequestV1, type HopV55DecisionCorrectionRequest,
  type HopV55DecisionProgramComparisonRequest, type HopV55DecisionProgramPreparationRequest,
  type HopV55DecisionProgramResumeRequestV1 } from './DecisionPreparation';
import './decision-response.css';

type DecisionReading = HopV55QuestionReading | HopV55SemanticQuestionReadingV1;
export type HopV55DecisionResponseReading = DecisionReading;
export type { HopV55SemanticCorrectionRequestV1 } from './DecisionPreparation';

export interface HopV55DecisionExploreRequest {
  option: HopAdviceOption;
  materialIds: string[];
  /** Exact labels from the criteria linked by this option. */
  terms: string[];
  /** Verbatim user wording; search navigation does not rewrite the intent. */
  query: string;
}

export interface HopV55DecisionResponseProps {
  /** V1–V3 and V4 readings stay in their exact shape; V4 is never reduced to criterion drafts. */
  reading: DecisionReading;
  prepared: PreparedBrewingScenarioContext;
  /** Exact selected programme, including a local copy/draft when active. */
  program?: HopDecisionProgram;
  programMaterials?: HopDecisionMaterial[];
  context?: BrewerContext;
  historical?: boolean;
  archive?: HopV55DecisionReadingArchive;
  onPrepare(option: HopAdviceOption): void;
  onPrepareDecision?(request: HopV55DecisionCorrectionRequest): void | Promise<void>;
  /** V4 semantic correction archive callback; V1–V3 keep their existing primitive correction path. */
  onPrepareSemanticCorrection?(request: HopV55SemanticCorrectionRequestV1): void | Promise<void>;
  semanticCorrectionSaving?: boolean;
  semanticCorrectionError?: string;
  onPrepareProgram?(request: HopV55DecisionProgramPreparationRequest): void | Promise<void>;
  onCompareProgramPreparation?(request: HopV55DecisionProgramComparisonRequest): void | Promise<void>;
  onResumeArchivedProgramPreparation?(request: HopV55DecisionProgramResumeRequestV1): void | Promise<void>;
  onExplore(request: HopV55DecisionExploreRequest): void;
  onReread?(): void;
}

interface AdviceGroup {
  key: string;
  materialIds: string[];
  options: HopAdviceOption[];
  leverGroups: Array<{ key: string; options: HopAdviceOption[] }>;
}

const responseStatusLabels: Record<string, string> = {
  answered: 'Réponse consultable', conditional: 'Sous conditions', noApplicableOption: 'Aucune voie applicable établie',
};
const effectStatusLabels: Record<string, string> = {
  documentedSupport: 'Soutien documenté', documentedTension: 'Tension documentée', conditional: 'Conditionnel',
  constraintSatisfied: 'Contrainte respectée', constraintViolated: 'Contrainte contredite',
  constraintUnverified: 'Contrainte non vérifiée', unknown: 'Inconnu', notApplicable: 'Hors périmètre',
  documentarySupport: 'Appui documentaire', documentaryTension: 'Tension documentaire', structuralChange: 'Changement de structure',
};
const relevanceLabels: Record<string, string> = {
  supportsCriteria: 'Appui lié à un critère', conditional: 'Sous conditions', mixed: 'Appuis et tensions à examiner',
  notAligned: 'Tension avec un critère', unknown: 'Pertinence inconnue',
};

const dimensionLabels: Record<string, string> = {
  aroma: 'Arôme', acidity: 'Acidité', alcohol: 'Alcool', bioInteraction: 'Interaction avec la levure',
  hopCreep: 'Hop creep', matrixTransfer: 'Transfert dans la bière', process: 'Procédé', stock: 'Stock',
  documentation: 'Documentation', other: 'Autre dimension',
};

const useLabels: Record<HopUse, string> = {
  firstWort: 'Premier moût', boil: 'Ébullition', whirlpool: 'Whirlpool',
  fermentation: 'Fermentation active', postFermentation: 'À froid après fermentation',
};

const sourceKindLabels = { recipe: 'Recette archivée', batch: 'Brassin archivé', exploration: 'Exploration archivée',
  localFutureDraft: 'Brouillon futur archivé', localRecipeCopy: 'Copie locale de recette archivée' } as const;
const programStageLabels: Record<string, string> = {
  planning: 'Avant brassage', hotSide: 'Jour de brassage', fermenting: 'Fermentation', conditioning: 'Garde / conditionnement', packaged: 'Conditionné',
};
const batchStatusLabels: Record<string, string> = {
  planifie: 'Planifié', fermentation: 'Fermentation', garde: 'Garde', conditionne: 'Conditionné', termine: 'Terminé', annule: 'Annulé',
};
const productFormLabels: Record<HopCommercialProduct['form'], string> = {
  pelletT90: 'Pellets T-90', pelletT45: 'Pellets T-45', cryo: 'Lupuline concentrée', extract: 'Extrait', cone: 'Cônes', unknown: 'Forme inconnue',
};

function archivedSourceQualifier(source?: HopV55DecisionReadingArchive['source']): string {
  if (!source) return 'de la lecture archivée';
  switch (source.kind) {
    case 'recipe': return 'de la recette archivée';
    case 'batch': return 'du brassin archivé';
    case 'localRecipeCopy': return 'de la copie locale de recette archivée';
    case 'localFutureDraft': return 'du brouillon futur archivé';
    case 'exploration': return 'de l’exploration archivée';
  }
}

function archivedAdditionLabel(source?: HopV55DecisionReadingArchive['source'], article = 'un'): string {
  const lead = article === 'l’' ? 'l’ajout prévu' : `${article} ajout prévu`;
  return `${lead} ${archivedSourceQualifier(source)}`;
}

const searchNormalize = (value: string) => value.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase('fr').trim();

function compareText(left: string, right: string): number { return left.localeCompare(right, 'fr', { sensitivity: 'base' }); }

function stableScopeKey(scope: HopAdviceProgramScope): unknown {
  if (scope.kind === 'none') return { kind: scope.kind };
  if (scope.kind === 'removePlanned') return { kind: scope.kind, additionIds: [...scope.additionIds].sort(compareText) };
  return { kind: scope.kind, materialIds: [...scope.materialIds].sort(compareText), uses: [...scope.uses].sort(compareText),
    additionIds: [...scope.additionIds].sort(compareText), allowAppend: scope.allowAppend };
}

/** Subgroups collapse only when the action and exact typed effect signatures match. */
function leverGroupingKey(option: HopAdviceOption): string {
  const criteria = option.criterionEffects.map(effect => ({ id: effect.criterionId, status: effect.status }))
    .sort((left, right) => compareText(left.id, right.id) || compareText(left.status, right.status));
  const dimensions = option.dimensionEffects.map(effect => ({ id: effect.dimension, status: effect.status, criterionIds: [...effect.criterionIds].sort(compareText) }))
    .sort((left, right) => compareText(left.id, right.id) || compareText(left.status, right.status));
  return JSON.stringify({ scope: stableScopeKey(option.programScope), relevance: option.relevance, criteria, dimensions });
}

interface AdviceOptionRank {
  violatedConstraints: number;
  documentedTensions: number;
  notAligned: number;
  sourceBackedSupport: number;
  satisfiedConstraints: number;
  unverifiedConstraints: number;
  unknownEffects: number;
}

/** A tuple of canonical states determines order; this deliberately creates no combined score. */
function adviceOptionRank(option: HopAdviceOption): AdviceOptionRank {
  const sourceBackedSupport = new Set(option.criterionEffects
    .filter(effect => effect.status === 'documentedSupport' && effect.evidenceIds.length > 0)
    .map(effect => effect.criterionId));
  for (const effect of option.dimensionEffects) {
    if (effect.status === 'documentarySupport' && effect.evidenceIds.length > 0) {
      effect.criterionIds.forEach(id => sourceBackedSupport.add(id));
    }
  }
  return {
    violatedConstraints: option.criterionEffects.filter(effect => effect.status === 'constraintViolated').length,
    documentedTensions: option.criterionEffects.filter(effect => effect.status === 'documentedTension').length
      + option.dimensionEffects.filter(effect => effect.status === 'documentaryTension').length,
    notAligned: option.relevance === 'notAligned' ? 1 : 0,
    sourceBackedSupport: sourceBackedSupport.size,
    satisfiedConstraints: option.criterionEffects.filter(effect => effect.status === 'constraintSatisfied').length,
    unverifiedConstraints: option.criterionEffects.filter(effect => effect.status === 'constraintUnverified').length,
    unknownEffects: option.criterionEffects.filter(effect => effect.status === 'unknown').length
      + option.dimensionEffects.filter(effect => effect.status === 'unknown').length,
  };
}

/** Lexicographic sorting keeps conflicts, source-backed support and unknowns distinct. */
function compareAdviceOptions(left: HopAdviceOption, right: HopAdviceOption): number {
  const leftRank = adviceOptionRank(left);
  const rightRank = adviceOptionRank(right);
  const ordered: Array<[number, number]> = [
    [leftRank.violatedConstraints, rightRank.violatedConstraints],
    [leftRank.documentedTensions, rightRank.documentedTensions],
    [leftRank.notAligned, rightRank.notAligned],
    [rightRank.sourceBackedSupport, leftRank.sourceBackedSupport],
    [rightRank.satisfiedConstraints, leftRank.satisfiedConstraints],
    [leftRank.unverifiedConstraints, rightRank.unverifiedConstraints],
    [leftRank.unknownEffects, rightRank.unknownEffects],
  ];
  for (const [leftValue, rightValue] of ordered) if (leftValue !== rightValue) return leftValue - rightValue;
  return 0;
}

function groupOptions(options: HopAdviceOption[]): AdviceGroup[] {
  const groups = new Map<string, AdviceGroup>();
  for (const option of [...options].sort(compareAdviceOptions)) {
    const materialIds = [...new Set(option.materialIds)].sort(compareText);
    const key = JSON.stringify(materialIds);
    const prior = groups.get(key);
    if (prior) prior.options.push(option);
    else groups.set(key, { key, materialIds, options: [option], leverGroups: [] });
  }
  return [...groups.values()].map(group => {
    const levers = new Map<string, HopAdviceOption[]>();
    for (const option of group.options) {
      const key = leverGroupingKey(option);
      const options = levers.get(key);
      if (options) options.push(option);
      else levers.set(key, [option]);
    }
    return { ...group, leverGroups: [...levers].map(([key, grouped]) => ({ key, options: grouped })) };
  });
}

function describeScope(option: HopAdviceOption, materials: ReadonlyMap<string, HopDecisionMaterial>, additions: ReadonlyMap<string, { materialId: string; use: HopUse; status: string }>): string {
  const scope = option.programScope;
  if (scope.kind === 'none') return option.dimensionEffects.some(row => row.dimension === 'matrixTransfer')
    ? 'Examiner un transfert direct' : 'Piste documentaire ou d’observation';
  if (scope.kind === 'removePlanned') {
    const names = scope.additionIds.map(id => {
      const addition = additions.get(id);
      return addition ? materials.get(addition.materialId)?.name ?? 'matière prévue non résolue' : 'ajout prévu non résolu';
    });
    return `Retirer seulement ${names.join(', ')}`;
  }
  const uses = scope.uses.length ? scope.uses.map(use => useLabels[use]).join(', ') : 'emploi à choisir';
  const names = scope.materialIds.map(id => materials.get(id)?.name ?? 'matière non résolue');
  if (scope.additionIds.length) return `Comparer ${names.join(', ') || 'la matière transmise'} sur un ajout prévu · ${uses}`;
  return `Étudier ${names.join(', ') || 'une matière transmise'} pour un ajout futur · ${uses}`;
}

function actionHeading(option: HopAdviceOption, materialIds: string[], materials: ReadonlyMap<string, HopDecisionMaterial>, additions: ReadonlyMap<string, { materialId: string; use: HopUse; status: string }>, historical = false, archive?: HopV55DecisionReadingArchive): string {
  if (historical && option.programScope.kind === 'removePlanned') return `Portée archivée · ${archivedAdditionLabel(archive?.source)}`;
  if (option.programScope.kind !== 'none') return describeScope(option, materials, additions);
  const dimensions = [...new Set(option.dimensionEffects.map(row => row.dimension))];
  if (dimensions.includes('bioInteraction')) return 'Examiner l’interaction biologique explicitement signalée';
  if (dimensions.includes('hopCreep')) return 'Examiner le hop creep comme sujet séparé';
  if (dimensions.includes('matrixTransfer')) return 'Examiner le transfert direct dans un échantillon ou essai futur';
  if (materialIds.length) return 'Comparer les éléments documentaires de cette matière';
  return describeScope(option, materials, additions);
}

function sourceLabel(source: HopAdviceEvidenceSource): string {
  const origin = source.source;
  return [origin.title, origin.author, origin.year ?? 'année inconnue', origin.kind, source.locator]
    .filter((part): part is string | number => part !== undefined && part !== '').join(' · ');
}

function responseSourceLabel(source: { title: string; author?: string; year?: number; kind?: string; reference?: string }): string {
  return [source.title, source.author, source.year ?? 'année inconnue', source.kind, source.reference]
    .filter((part): part is string | number => part !== undefined && part !== '').join(' · ');
}

function operationDraftTitle(operation: HopV55ProgramOperationV1): string {
  const quantity = (grams: number | null | undefined) => grams == null ? 'masse inconnue' : `${grams.toLocaleString('fr-CH')} g`;
  const scope = (value?: 'hotSide' | 'coldSide') => value === 'hotSide' ? ' · côté chaud' : value === 'coldSide' ? ' · côté froid' : '';
  if (operation.kind === 'remove') return `Retirer ${operation.quantity?.kind === 'entire' ? 'la ligne entière' : operation.quantity?.kind === 'partial' ? quantity(operation.quantity.grams) : 'une quantité à préciser'}${scope(operation.sourceScope)}`;
  if (operation.kind === 'add') return `Ajouter ${quantity(operation.grams)} · ${operation.use ? useLabels[operation.use] : 'emploi à choisir'}${scope(operation.targetScope)}`;
  if (operation.kind === 'setDose') return `Régler la masse · ${operation.quantity ? operation.quantity.kind === 'target'
    ? quantity(operation.quantity.grams) : `${operation.quantity.direction === 'increase' ? '+' : '−'}${quantity(operation.quantity.grams)}` : 'quantité à choisir'}${scope(operation.sourceScope)}`;
  if (operation.kind === 'move') return `Déplacer ${operation.quantity?.kind === 'entire' ? 'la ligne entière' : operation.quantity?.kind === 'partial' ? quantity(operation.quantity.grams) : 'une quantité à préciser'} vers ${operation.use ? useLabels[operation.use] : 'un emploi à choisir'}${scope(operation.sourceScope)}`;
  if (operation.kind === 'replace') return `Remplacer une ligne par ${operation.materialId ?? 'une matière à choisir'}${operation.dose?.kind === 'explicit'
    ? ` · ${quantity(operation.dose.grams)}` : operation.dose?.kind === 'basis' ? ` · convention ${operation.dose.basis}` : ' · dose ou convention à choisir'}${scope(operation.sourceScope)}`;
  return `Remplacer la matière indisponible ${operation.sourceMaterialId ?? 'à choisir'} · ${operation.reason ?? 'motif à préciser'}`;
}

function OperationDraftSummary({ operations }: { operations: HopV55ProgramOperationV1[] }) {
  if (!operations.length) return null;
  return <section className="hv-decision__operation-drafts" aria-label="Opérations proposées par lecture">
    <header><strong>Gestes proposés · non appliqués</strong><span>{operations.length} opération{operations.length === 1 ? '' : 's'}</span></header>
    <ol>{operations.map(operation => <li key={operation.id}>
      <strong>{operation.label}</strong><span>{operationDraftTitle(operation)}</span>
      {operation.sourceSpan && operation.sourceSpan.text !== operation.label ? <blockquote>Extrait exact · « {operation.sourceSpan.text} »</blockquote> : null}
      <details><summary>Identités et conditions techniques</summary>
        {'additionId' in operation && operation.additionId ? <p>Ligne source exacte · {operation.additionId}</p> : null}
        {'sourceMaterialId' in operation && operation.sourceMaterialId ? <p>Matière source exacte · {operation.sourceMaterialId}</p> : null}
        {'materialId' in operation && operation.materialId ? <p>Matière cible exacte · {operation.materialId}</p> : null}
        {'sourceUse' in operation && operation.sourceUse ? <p>Emploi source · {useLabels[operation.sourceUse]}</p> : null}
        {'conditions' in operation && operation.conditions ? <p>Conditions fournies · {[operation.conditions.boilMinutes !== undefined ? `${operation.conditions.boilMinutes ?? 'inconnu'} min d’ébullition` : '',
          operation.conditions.contactHours !== undefined ? `${operation.conditions.contactHours ?? 'inconnu'} h de contact` : '',
          operation.conditions.temperatureC !== undefined ? `${operation.conditions.temperatureC ?? 'inconnue'} °C` : '',
          operation.conditions.dayOffset !== undefined ? `jour ${operation.conditions.dayOffset ?? 'inconnu'}` : ''].filter(Boolean).join(' · ')}</p> : null}
      </details>
    </li>)}</ol>
    <p>Les doses, lignes et phases restent des propositions. Aucune recette ou simulation n’est modifiée par leur lecture.</p>
  </section>;
}

function exactEvidenceSources(option: HopAdviceOption, sources: Map<string, HopAdviceEvidenceSource>): HopAdviceEvidenceSource[] {
  const ids = new Set([...option.criterionEffects, ...option.dimensionEffects].flatMap(effect => effect.evidenceIds));
  return [...ids].map(id => sources.get(id)).filter((source): source is HopAdviceEvidenceSource => !!source);
}

function optionSearchText(option: HopAdviceOption, materialIds: string[], materials: ReadonlyMap<string, HopDecisionMaterial>, sources: Map<string, HopAdviceEvidenceSource>, criteria: Map<string, string>): string {
  const materialText = materialIds.map(id => {
    const material = materials.get(id);
    const varietyText = material?.variety ? [material.variety.name, ...material.variety.aliases,
      ...material.variety.descriptions.flatMap(description => [description.text, description.context, description.source.title])].join(' ') : '';
    return [material?.id, material?.name, varietyText, material?.lot?.name, material?.product?.name]
      .filter((part): part is string => typeof part === 'string').join(' ');
  }).join(' ');
  const evidenceText = exactEvidenceSources(option, sources).map(source => [sourceLabel(source), source.source.reference, source.established, source.domain, ...source.limits].join(' ')).join(' ');
  return searchNormalize([
    option.title, materialText, ...option.conditions, ...option.nonConclusions,
    ...option.criterionEffects.flatMap(effect => [criteria.get(effect.criterionId) ?? effect.criterionId, effect.status, effect.reason]),
    ...option.dimensionEffects.flatMap(effect => [effect.dimension, effect.status, effect.statement, effect.reason]),
    ...evidenceText,
  ].join(' '));
}

function canPrepareOption(option: HopAdviceOption, materials: ReadonlyMap<string, HopDecisionMaterial>, additions: ReadonlyMap<string, { materialId: string; use: HopUse; status: string }>): boolean {
  if (option.programScope.kind === 'none') return false;
  if (option.programScope.kind === 'removePlanned') {
    return option.programScope.additionIds.length > 0 && option.programScope.additionIds.every(id => additions.has(id));
  }
  return option.programScope.materialIds.length > 0
    && option.programScope.materialIds.every(id => materials.has(id))
    && option.programScope.additionIds.every(id => additions.has(id));
}

function criterionLabel(id: string, reading: DecisionReading): string {
  return reading.intent.criteria.find(criterion => criterion.id === id)?.label ?? `Critère non restitué · ${id}`;
}

function readableTitle(option: HopAdviceOption, materials: ReadonlyMap<string, HopDecisionMaterial>, additions: ReadonlyMap<string, { materialId: string; use: HopUse; status: string }>, historical: boolean, archive?: HopV55DecisionReadingArchive): string {
  let title = option.title;
  if (historical) {
    const archivedIdentities = option.programScope.kind === 'none' ? [] : option.programScope.additionIds;
    for (const id of archivedIdentities) {
      const position = title.indexOf(id);
      if (position < 0) continue;
      const before = title.slice(0, position);
      const precedingAddition = before.match(/(?:un\s+ajout prévu|l['’]ajout prévu)\s*$/iu);
      const replacementStart = precedingAddition ? position - precedingAddition[0].length : position;
      const article = precedingAddition && /^l['’]/iu.test(precedingAddition[0]) ? 'l’' : 'un';
      const after = title.slice(position + id.length).replace(/^\s+du brouillon\b/iu, '');
      title = `${title.slice(0, replacementStart)}${archivedAdditionLabel(archive?.source, article)}${after}`;
    }
    for (const id of option.materialIds) title = title.split(id).join(`une matière ${archivedSourceQualifier(archive?.source)}`);
    title = title.replace(/\s+du brouillon\b/giu, '');
    return title;
  }
  const replacements = new Map<string, string>();
  for (const [id, material] of materials) replacements.set(id, material.name);
  for (const [id, addition] of additions) {
    const material = materials.get(addition.materialId);
    replacements.set(id, material ? `${material.name} · ${useLabels[addition.use]} · ${addition.status === 'performed' ? 'effectué' : 'prévu'}` : 'ajout prévu non résolu');
  }
  for (const [id, label] of [...replacements.entries()].sort((left, right) => right[0].length - left[0].length)) {
    title = title.split(id).join(label);
  }
  return title;
}

function ContextSummary({ context, prepared, historical, archive }: {
  context?: BrewerContext; prepared: PreparedBrewingScenarioContext; historical: boolean; archive?: HopV55DecisionReadingArchive;
}) {
  if (historical) {
    if (!archive) return <p className="hv-decision__archive-context">Lecture archivée. Sa source et sa portée ne sont pas transmises à cette vue; le contexte courant n’est pas utilisé à leur place.</p>;
    const source = archive.source;
    const sourceLabel = source.kind === 'localFutureDraft'
      ? `Brouillon futur local · révision ${source.revision}` : sourceKindLabels[source.kind];
    return <>
      <p className="hv-decision__archive-context">Lecture archivée · {sourceLabel} · {new Date(archive.recordedAt).toLocaleString('fr-CH', { timeZone: 'Europe/Zurich' })} · références figées.</p>
      <details className="hv-decision__details"><summary>Références scellées de cette lecture</summary>
        <p>{archive.ownerKey} · workspace {archive.workspaceId} · lecture {archive.id}</p>
        <p>Horodatage exact · <time dateTime={archive.recordedAt}>{archive.recordedAt}</time></p>
        {archive.source.kind === 'localFutureDraft' ? <p>Brouillon source · workspace {archive.source.workspaceId} · ID {archive.source.draftId} · révision {archive.source.revision}</p> : null}
        {archive.source.kind === 'localRecipeCopy' ? <p>Copie locale source · workspace {archive.source.workspaceId} · copyId {archive.source.copyId} · identité proposée {archive.source.recipeId} · référence {archive.source.recipeReference}. Ce n’est pas un brassin ni une recette physique persistée.</p> : null}
        <p>Portée runtime · <code>{archive.runtimeReference}</code></p><p>Référence de contenu · <code>{archive.contentReference}</code></p>
      </details>
    </>;
  }
  const current = prepared.runtime.current;
  const source = context?.batch?.name ? `Brassin · ${context.batch.name}`
    : context?.recipe?.name ? `Recette · ${context.recipe.name}`
      : prepared.runtime.current ? 'Contexte de bière transmis' : 'Exploration sans recette ni brassin';
  const currentProgram = current?.program ?? undefined;
  const programText = currentProgram
    ? `Programme transmis · ${currentProgram.volumeL == null ? 'volume inconnu' : `${currentProgram.volumeL.toLocaleString('fr-CH')} L`} · ${currentProgram.additions.length} ajout${currentProgram.additions.length === 1 ? '' : 's'}`
    : 'Aucun programme transmis; aucune addition n’est présumée.';
  const style = context?.recipe ? context.recipe.style ? `Style déclaré · ${context.recipe.style}` : 'Style non renseigné' : 'Style non transmis à cette vue';
  const yeast = context?.recipe ? context.recipe.yeast?.name ? `Levure de la source · ${context.recipe.yeast.name}` : 'Souche non renseignée' : 'Souche non transmise à cette vue';
  const stage = currentProgram ? `Stade · ${programStageLabels[currentProgram.stage] ?? 'non qualifié'}`
    : context?.batch ? `Stade du brassin · ${batchStatusLabels[String(context.batch.status)] ?? 'non établi'}` : 'Stade opérationnel non établi';
  return <div className="hv-decision__context" aria-label="Contexte transmis au conseil">
    {[source, style, yeast, stage, programText].map(item => <span key={item}>{item}</span>)}
  </div>;
}

function OptionEvidenceDetails({ option, materials, evidenceSources, reading, historical }: {
  option: HopAdviceOption;
  materials: ReadonlyMap<string, HopDecisionMaterial>;
  evidenceSources: Map<string, HopAdviceEvidenceSource>;
  reading: DecisionReading;
  historical: boolean;
}) {
  const linkedSources = exactEvidenceSources(option, evidenceSources);
  const informationRequests = reading.response?.actionKind === 'exploreStrategies'
    ? (reading.response.result as HopStrategyAdviceResult).informationRequests.filter(row => option.informationRequestIds.includes(row.id)) : [];
  return <>
    {option.criterionEffects.length ? <section aria-label="Raisons par critère exact">
      <h5>Critères exacts et raisons</h5>
      {option.criterionEffects.map(effect => <div className="hv-decision__detail-effect" key={effect.criterionId}>
        <strong>{criterionLabel(effect.criterionId, reading)}</strong>
        <span className={`hv-decision__status hv-decision__status--${effect.status}`}>{effectStatusLabels[effect.status] ?? 'Statut documentaire inconnu'}</span>
        <p>{effect.reason}</p>
      </div>)}
    </section> : null}
    {option.dimensionEffects.length ? <section aria-label="Autres dimensions documentaires">
      <h5>Autres dimensions documentaires</h5>
      {option.dimensionEffects.map((effect, index) => <div className="hv-decision__detail-effect" key={`${effect.dimension}-${index}`}>
        <strong>{dimensionLabels[effect.dimension] ?? 'Dimension non qualifiée'} · {effectStatusLabels[effect.status] ?? 'Statut non qualifié'}</strong>
        <p>{effect.statement}</p><p className="hv-decision__reason">{effect.reason}</p>
        {effect.criterionIds.length ? <small>Critères concernés · {effect.criterionIds.map(id => criterionLabel(id, reading)).join(' · ')}</small> : null}
      </div>)}
    </section> : null}
    {option.conditions.length ? <section aria-label="Conditions à vérifier"><h5>Conditions à vérifier</h5><ul>
      {option.conditions.map((condition, index) => <li key={`${index}-${condition}`}>{condition}</li>)}
    </ul></section> : null}
    {option.exclusions.some(row => row.status !== 'retained') ? <section aria-label="Exclusions et incertitudes">
      <h5>Exclusions et incertitudes de matière</h5><ul>{option.exclusions.filter(row => row.status !== 'retained').map(row => <li key={`${row.materialId}-${row.status}`}>
        {materials.get(row.materialId)?.name ?? (historical ? 'Matière de la source archivée' : 'Matière non résolue')} · {row.status === 'excluded' ? 'exclusion déclarée' : row.status === 'possible' ? 'exclusion possible' : 'exclusion inconnue'} · {row.reason}
      </li>)}</ul>
    </section> : null}
    {linkedSources.length ? <section aria-label="Sources directement liées">
      <h5>Sources directement liées aux effets</h5><ul>{linkedSources.map(source => <li key={source.id}>
        {source.source.reference?.startsWith('http') ? <a href={source.source.reference} target="_blank" rel="noreferrer">{sourceLabel(source)}</a> : <span>{sourceLabel(source)}</span>}
        <p>{source.established}</p><small>{source.domain} · {source.readingLevel} · {source.limits.join(' ')}</small>
        {source.source.reference && !source.source.reference.startsWith('http') ? <code>{source.source.reference}</code> : null}
      </li>)}</ul>
    </section> : <p>Aucune source n’est directement liée aux effets de cette voie.</p>}
    {option.nonConclusions.length ? <section><h5>Ce qui n’est pas conclu</h5><ul>
      {option.nonConclusions.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}
    </ul></section> : null}
    {informationRequests.map(request => <section key={request.id}><h5>{request.question}</h5><p>{request.whyDecisionChanging}</p></section>)}
    {option.materialIds.length ? <p className="hv-decision__technical">Identités exactes · {option.materialIds.map(id => materials.get(id)?.name ?? (historical ? 'matière archivée' : 'matière non résolue')).join(', ')}.</p> : null}
    <p className="hv-decision__technical"><code>{option.id} · {option.reference}</code></p>
  </>;
}

function formatProductRange(range: { min: number; max: number }, unit: string): string {
  const format = (value: number) => value.toLocaleString('fr-CH', { maximumFractionDigits: 3 });
  return `${format(range.min)}–${format(range.max)} ${unit}`;
}

function formatProductValue(value: number, unit: string): string {
  return `${value.toLocaleString('fr-CH', { maximumFractionDigits: 3 })} ${unit}`;
}

function ProductSource({ product, replacement = false }: { product: HopCommercialProduct; replacement?: boolean }) {
  const source = replacement ? product.replacement?.source : product.source;
  if (!source) return null;
  const sourceName = [source.title, source.author, source.year ?? 'année inconnue'].filter(Boolean).join(' · ');
  return <div className="hv-decision__product-source">
    <strong>{replacement ? 'Source de la convention' : 'Source produit'} · </strong>
    {source.reference?.startsWith('http') ? <a href={source.reference} target="_blank" rel="noreferrer">{sourceName}</a> : sourceName}
    {source.locator ? <details><summary>Contexte et limites de la source</summary><p>{source.locator}</p></details> : null}
  </div>;
}

function CommercialProductDocuments({ products }: { products: HopCommercialProduct[] }) {
  return <section className="hv-decision__products" aria-label="Produits commerciaux documentés">
    <header><h3>Produits commerciaux documentés</h3>
      <p>Ces fiches décrivent des emplois et conventions publiés. Elles ne déclarent ni stock, ni variété associée, ni équivalence de goût.</p>
    </header>
    {products.length ? <div className="hv-decision__product-list">{products.map(product => <article className="hv-decision__product" key={product.id}>
      <div className="hv-decision__product-heading"><h4>{product.name}</h4><span>{product.manufacturer} · {productFormLabels[product.form]}</span></div>
      <p><strong>Emplois documentés · </strong>{product.supportedUses.map(use => useLabels[use]).join(' · ') || 'aucun emploi fourni'}</p>
      <ProductSource product={product} />
      {product.cautions[0] ? <p className="hv-decision__product-primary-condition"><strong>Condition principale · </strong>{product.cautions[0]}</p> : null}
      {product.replacement ? <section className="hv-decision__product-convention" aria-label={`Convention de remplacement ${product.name}`}>
        <strong>Convention de masse publiée</strong>
        <p>{formatProductRange(product.replacement.gramsPerGram, 'g/g')} · {productFormLabels[product.replacement.referenceForm]} · emplois : {product.replacement.uses.map(use => useLabels[use]).join(' · ') || 'non renseignés'}</p>
        {product.supportedUses.filter(use => !product.replacement!.uses.includes(use)).length ? <p className="hv-decision__product-limit"><strong>Emplois documentés sans ratio massique fourni · </strong>{product.supportedUses.filter(use => !product.replacement!.uses.includes(use)).map(use => useLabels[use]).join(' · ')}</p> : null}
        <p className="hv-decision__product-limit">Cette plage est spécifique à la convention et aux emplois listés; elle ne garantit pas la conservation de l’alpha, des huiles, de l’amertume ou du goût.</p>
        {product.replacement.maxEquivalentFraction !== undefined ? <p>Part maximale de la charge indiquée · {formatProductValue(product.replacement.maxEquivalentFraction * 100, '%')}</p> : null}
        {product.replacement.maxDoseGL !== undefined ? <p>Dose maximale indiquée · {formatProductValue(product.replacement.maxDoseGL, 'g/L')}</p> : null}
        {product.replacement.limitations.map((limitation, index) => <p className="hv-decision__product-limit" key={`${index}-${limitation}`}>{limitation}</p>)}
        <ProductSource product={product} replacement />
      </section> : <p>Aucune convention de remplacement massique n’est fournie pour cette fiche.</p>}
      {product.cautions.length > 1 ? <details className="hv-decision__product-cautions"><summary>Autres précautions · {product.cautions.length - 1}</summary><ul>{product.cautions.slice(1).map((caution, index) => <li key={`${index}-${caution}`}>{caution}</li>)}</ul></details> : null}
      <details className="hv-decision__product-id"><summary>Identité documentaire</summary><code>{product.id} · revue du {product.reviewedOn}</code></details>
    </article>)}</div> : <p>Aucun dossier produit n’a été attaché à cette lecture.</p>}
  </section>;
}

function AdviceOptionView({ option, relatedOptions, materialIds, materials, additions, evidenceSources, reading, historical, archive, preparationBlocked,
  explorationBlocked, preparationBlockReason, onPrepare, onExplore }: {
  option: HopAdviceOption;
  relatedOptions: HopAdviceOption[];
  materialIds: string[];
  materials: ReadonlyMap<string, HopDecisionMaterial>;
  additions: ReadonlyMap<string, { materialId: string; use: HopUse; status: string }>;
  evidenceSources: Map<string, HopAdviceEvidenceSource>;
  reading: DecisionReading;
  historical: boolean;
  archive?: HopV55DecisionReadingArchive;
  preparationBlocked: boolean;
  explorationBlocked: boolean;
  preparationBlockReason?: string;
  onPrepare(option: HopAdviceOption): void;
  onExplore(request: HopV55DecisionExploreRequest): void;
}) {
  const resolvedIds = materialIds.filter(id => materials.has(id));
  const unresolvedIds = materialIds.filter(id => !materials.has(id));
  const linkedSources = exactEvidenceSources(option, evidenceSources);
  const prepareAllowed = canPrepareOption(option, materials, additions);
  const linkedTerms = [...new Set(option.criterionEffects.map(effect => reading.intent.criteria.find(criterion => criterion.id === effect.criterionId)?.label)
    .filter((label): label is string => !!label))];
  const leadCriterion = option.criterionEffects.find(effect => effect.status === 'documentedSupport' && effect.evidenceIds.length > 0)
    ?? option.criterionEffects.find(effect => effect.status === 'constraintSatisfied')
    ?? option.criterionEffects.find(effect => effect.status === 'documentedTension' || effect.status === 'constraintViolated')
    ?? option.criterionEffects.find(effect => effect.status === 'constraintUnverified')
    ?? option.criterionEffects.find(effect => effect.status !== 'notApplicable');
  const leadDimension = leadCriterion ? undefined : option.dimensionEffects.find(effect => effect.status !== 'notApplicable');
  const scopeText = historical
    ? option.programScope.kind === 'removePlanned' ? `Programme visé · ${archivedAdditionLabel(archive?.source)}`
      : option.programScope.kind === 'none' ? 'Piste documentaire · aucun changement de programme'
        : `Portée historique · ${archivedSourceQualifier(archive?.source)}`
    : option.programScope.kind === 'none' ? 'Piste documentaire · aucun changement de programme'
      : describeScope(option, materials, additions);
  const firstCondition = option.conditions[0];
  const relatedCount = relatedOptions.length;
  const relatedLabel = relatedCount === 1 ? '1 autre référence de même portée' : `${relatedCount} autres références de même portée`;
  const hasDetailedContent = !!(option.criterionEffects.length || option.dimensionEffects.length || option.conditions.length
    || option.exclusions.length || option.nonConclusions.length || linkedSources.length || relatedCount || materialIds.length);
  return <section className="hv-decision__option" aria-label={actionHeading(option, materialIds, materials, additions, historical, archive)}>
    <div className="hv-decision__option-head">
      <h4>{readableTitle(option, materials, additions, historical, archive)}</h4>
      <span className={`hv-decision__status hv-decision__status--${option.relevance}`}>{relevanceLabels[option.relevance] ?? 'Pertinence non qualifiée'}</span>
    </div>
    <p className="hv-decision__scope"><strong>Portée · </strong>{scopeText}</p>
    {option.criterionEffects.length ? <div className="hv-decision__criterion-signals" aria-label="Statut de chaque critère exact">
      {option.criterionEffects.map(effect => <span className={`hv-decision__criterion-signal hv-decision__status--${effect.status}`} key={effect.criterionId}>
        <strong>{criterionLabel(effect.criterionId, reading)}</strong><span>{effectStatusLabels[effect.status] ?? 'Statut inconnu'}</span>
      </span>)}
    </div> : <p className="hv-decision__unknowns">Aucun effet typé n’est relié aux critères exacts.</p>}
    {leadCriterion ? <p className="hv-decision__lead-reason"><strong>{criterionLabel(leadCriterion.criterionId, reading)} · {effectStatusLabels[leadCriterion.status] ?? 'Statut inconnu'}</strong><span>{leadCriterion.reason}</span></p>
      : leadDimension ? <p className="hv-decision__lead-reason"><strong>{dimensionLabels[leadDimension.dimension]} · {effectStatusLabels[leadDimension.status] ?? 'Statut inconnu'}</strong><span>{leadDimension.statement} {leadDimension.reason}</span></p> : null}
    {firstCondition ? <p className="hv-decision__primary-condition"><strong>À vérifier · </strong>{firstCondition}{option.conditions.length > 1 ? ` · ${option.conditions.length - 1} autre${option.conditions.length === 2 ? '' : 's'} condition${option.conditions.length === 2 ? '' : 's'} dans les détails.` : ''}</p> : null}
    {linkedSources[0] ? <p className="hv-decision__primary-source"><strong>Source principale · </strong>{linkedSources[0].source.reference?.startsWith('http')
      ? <a href={linkedSources[0].source.reference} target="_blank" rel="noreferrer">{[linkedSources[0].source.title, linkedSources[0].source.author, linkedSources[0].source.year ?? 'année inconnue'].filter(Boolean).join(' · ')}</a>
      : [linkedSources[0].source.title, linkedSources[0].source.author, linkedSources[0].source.year ?? 'année inconnue'].filter(Boolean).join(' · ')}</p> : null}
    {unresolvedIds.length ? <p className="hv-decision__unknowns">Identité de matière non résolue dans ce contexte : {unresolvedIds.length}. Aucune matière de remplacement n’est supposée.</p> : null}
    <div className="hv-decision__actions">
      {!historical && prepareAllowed && !preparationBlocked ? <button type="button" className="hv-primary" onClick={() => onPrepare(option)}>Préparer cette voie dans l’éditeur</button> : null}
      {!historical && preparationBlocked ? <p className="hv-decision__unknowns">{preparationBlockReason ?? 'Recalcule la lecture corrigée avant de préparer cette voie.'}</p> : null}
      {!historical && !explorationBlocked && option.programScope.kind === 'none' && resolvedIds.length ? <button type="button" onClick={() => onExplore({ option, materialIds: resolvedIds,
        terms: linkedTerms.length ? linkedTerms : [reading.intent.question], query: reading.intent.question })}>
        Explorer {resolvedIds.length === 1 ? 'cette matière' : `${resolvedIds.length} matières identifiées`}
      </button> : null}
      {historical ? <p className="hv-decision__archive-context">Voie historique en lecture seule; relis la demande avec la source et le programme actifs pour préparer un nouveau geste.</p>
        : option.programScope.kind !== 'none' && !prepareAllowed ? <p className="hv-decision__unknowns">La portée ne se résout pas entièrement dans le programme et les matières transmis; aucun raccourci de préparation n’est proposé.</p> : null}
    </div>
    {hasDetailedContent ? <details className="hv-decision__details">
      <summary>Raisons, conditions et sources exactes{relatedCount ? ` · ${relatedLabel}` : ''}</summary>
      <OptionEvidenceDetails option={option} materials={materials} evidenceSources={evidenceSources} reading={reading} historical={historical} />
      {relatedOptions.map(related => <section className="hv-decision__related-option" key={related.id}>
        <h5>{readableTitle(related, materials, additions, historical, archive)}</h5>
        <p><strong>{relevanceLabels[related.relevance] ?? 'Pertinence non qualifiée'}</strong> · même portée et mêmes statuts typés</p>
        <OptionEvidenceDetails option={related} materials={materials} evidenceSources={evidenceSources} reading={reading} historical={historical} />
      </section>)}
    </details> : null}
  </section>;
}

export function HopV55DecisionResponse({ reading, prepared, program, programMaterials, context, historical = false, archive, onPrepare,
  onPrepareDecision, onPrepareSemanticCorrection, semanticCorrectionSaving, semanticCorrectionError,
  onPrepareProgram, onCompareProgramPreparation, onResumeArchivedProgramPreparation, onExplore, onReread }: HopV55DecisionResponseProps) {
  const archivedProgramPreparation = archive && 'programPreparation' in archive ? archive.programPreparation : undefined;
  const [query, setQuery] = useState('');
  const [visibleGroupCount, setVisibleGroupCount] = useState(6);
  const [criterionDraftDirty, setCriterionDraftDirty] = useState(false);
  const [semanticDraftDirty, setSemanticDraftDirty] = useState(false);
  const [programComposerOpen, setProgramComposerOpen] = useState(false);
  const [preparingOption, setPreparingOption] = useState<HopAdviceOption>();
  const searchId = useId();
  const semanticReading = 'annotations' in reading ? reading : undefined;
  const criterionDrafts = semanticReading ? [] : 'criterionDrafts' in reading ? reading.criterionDrafts ?? [] : [];
  const operationDrafts = reading.operationDrafts ?? [];
  const semanticArchiveReference = archive?.format === 'hop-v55-decision-reading-v4' ? archive.contentReference : undefined;
  const preparationDirty = criterionDraftDirty || semanticDraftDirty;
  useEffect(() => {
    setCriterionDraftDirty(false); setSemanticDraftDirty(false);
    setProgramComposerOpen(!!archivedProgramPreparation);
  }, [archive?.contentReference, archivedProgramPreparation]);
  const activeProgram = program ?? prepared.runtime.current?.program;
  const activeMaterials = programMaterials ?? prepared.runtime.materials;
  const resumeExpectedContext = activeProgram ? {
    program: activeProgram,
    materials: activeMaterials,
    runtimeReferences: {
      recipeReference: prepared.runtime.current?.recipeReference,
      inputReference: prepared.runtime.current?.inputReference,
      stockAvailabilityReference: prepared.runtime.current?.stockAvailabilityReference,
      dataRevision: prepared.runtime.dataRevision,
    },
  } : undefined;
  function prepareOption(option: HopAdviceOption) {
    if (historical) return;
    if (preparationDirty) return;
    if (onPrepareProgram) { setPreparingOption(option); setProgramComposerOpen(true); return; }
    onPrepare(option);
  }
  function openProgramComposer() {
    if (historical || preparationDirty || !onPrepareProgram || !activeProgram) return;
    setPreparingOption(undefined); setProgramComposerOpen(true);
  }
  const materials = useMemo(() => new Map((historical ? [] : prepared.runtime.materials).map(material => [material.id, material])), [historical, prepared.runtime.materials]);
  const actualAdditions = useMemo(() => new Map((historical ? [] : prepared.runtime.current?.program?.additions ?? []).map(addition => [addition.id,
    { materialId: addition.materialId, use: addition.use, status: addition.status }])), [historical, prepared.runtime.current?.program]);
  const response = reading.response;
  const advice = response?.actionKind === 'exploreStrategies' ? response as HopDecisionResponse<'exploreStrategies'> : undefined;
  const productResponse = response?.actionKind === 'understandProducts' ? response as HopDecisionResponse<'understandProducts'> : undefined;
  const adviceResult = advice?.result as HopStrategyAdviceResult | undefined;
  const sourceIndex = useMemo(() => new Map(adviceResult?.evidenceSources.map(source => [source.id, source]) ?? []), [adviceResult?.evidenceSources]);
  const allOptions = adviceResult?.options ?? [];
  const groups = useMemo(() => groupOptions(allOptions), [allOptions]);
  const hasSourceBackedCriterionSupport = allOptions.some(option => option.criterionEffects.some(effect =>
    effect.status === 'documentedSupport' && effect.evidenceIds.length > 0)
    || option.dimensionEffects.some(effect => effect.status === 'documentarySupport'
      && effect.evidenceIds.length > 0 && effect.criterionIds.length > 0));
  const criterionLabels = useMemo(() => new Map(reading.intent.criteria.map(criterion => [criterion.id, criterion.label])), [reading.intent.criteria]);
  const normalizedQuery = searchNormalize(query);
  const matchingGroups = groups.filter(group => !normalizedQuery || [
    group.materialIds.map(id => materials.get(id)?.name ?? id).join(' '),
    ...group.options.map(option => optionSearchText(option, group.materialIds, materials, sourceIndex, criterionLabels)),
  ].map(searchNormalize).some(text => text.includes(normalizedQuery)));
  const visibleGroups = normalizedQuery ? matchingGroups : matchingGroups.slice(0, visibleGroupCount);
  const currentScopeMaterials = useMemo(() => prepared.runtime.current?.program?.additions ?? [], [prepared.runtime.current?.program]);
  const coverage = adviceResult?.coverage;
  const coverageLabel = coverage?.status === 'completeWithinSuppliedScope' ? 'Couverture complète dans les données transmises'
    : coverage?.status === 'bounded' ? 'Périmètre explicitement borné' : coverage ? 'Couverture partielle; limites à consulter' : '';
  return <section className={`hv-decision-response ${historical ? 'hv-decision-response--historical' : ''}`} aria-label={historical ? 'Lecture archivée de la décision' : 'Réponse et voies de décision'}>
    {historical ? <div className="hv-decision__archive-banner"><strong>Lecture archivée · en lecture seule</strong>
      {archive ? <p>Portée exacte conservée. La réouverture ne relance pas le moteur.</p>
        : <p>Le contenu de la lecture est conservé. Sa référence de source exacte n’a pas été transmise à cette vue.</p>}
      {onReread ? <div className="hv-decision__reread">
        <button type="button" onClick={onReread}>Relire cette demande dans le contexte actif</button>
        <p>Une nouvelle lecture sera conservée; l’archive consultée reste inchangée.</p>
      </div> : null}
    </div> : null}
    <header className="hv-decision__header">
      <div><h2>Ta demande et les voies examinées</h2><p className="hv-decision__question">« {reading.intent.question} »</p></div>
      {response ? <span className={`hv-decision__status hv-decision__status--${response.status}`}>{responseStatusLabels[response.status] ?? 'Statut non qualifié'}</span> : <span className="hv-decision__status hv-decision__status--unknown">Lecture sans réponse typée</span>}
    </header>
    <ContextSummary context={context} prepared={prepared} historical={historical} archive={archive} />
    {semanticReading ? <HopV55SemanticDecisionPreparation key={`${semanticArchiveReference ?? 'unarchived'}:${semanticReading.intent.question}`}
      reading={semanticReading} question={semanticReading.intent.question} sourceReadingReference={semanticArchiveReference}
      historical={historical} saving={semanticCorrectionSaving} error={semanticCorrectionError}
      onSaveCorrection={onPrepareSemanticCorrection} onDraftChange={setSemanticDraftDirty} showQuestion={false} />
      : criterionDrafts.length ? <HopV55DecisionPreparation question={reading.intent.question} criterionDrafts={criterionDrafts}
        sourceReadingReference={archive?.contentReference} historical={historical} onPrepareDecision={onPrepareDecision}
        onDraftChange={setCriterionDraftDirty} /> : null}
    {!programComposerOpen ? <OperationDraftSummary operations={operationDrafts} /> : null}
    {!historical && onPrepareProgram && activeProgram ? <div className="hv-decision__program-composer-entry">
      <button type="button" disabled={preparationDirty} onClick={openProgramComposer}>Composer plusieurs opérations de programme</button>
      <span>{preparationDirty ? semanticDraftDirty ? 'Enregistre et recalcule la lecture sémantique avant de préparer.' : 'Corrige et recalcule les critères avant de préparer.' : operationDrafts.length
        ? `${operationDrafts.length} geste(s) repris des fragments; dose/phase restent à confirmer.`
        : 'Les opérations resteront proposées jusqu’à la comparaison explicite.'}</span>
    </div> : null}
    {programComposerOpen ? <HopV55DecisionProgramPreparation reading={reading} sourceReadingReference={archive?.contentReference}
      program={activeProgram} materials={activeMaterials} preparation={archivedProgramPreparation} preparationReference={archive?.contentReference}
      initialOption={preparingOption} operationDrafts={operationDrafts} historical={historical} error={preparationDirty
        ? semanticDraftDirty ? 'La lecture sémantique a changé; enregistre et recalcule avant de préparer.'
          : 'Les critères ont changé; la nouvelle lecture doit être recalculée avant la préparation.' : undefined}
      onPrepareProgram={onPrepareProgram} onCompareProgramPreparation={onCompareProgramPreparation}
      resumeExpectedContext={resumeExpectedContext} onResumeArchivedProgramPreparation={onResumeArchivedProgramPreparation}
      onCancel={() => { setProgramComposerOpen(false); setPreparingOption(undefined); }} /> : null}
    {!semanticReading && reading.interpretation ? <p className="hv-decision__interpretation">{reading.interpretation}</p> : null}
    {response ? <p className="hv-decision__answer">{response.answer}</p> : <p className="hv-decision__unknowns">Aucun conseil typé n’est conservé pour cette lecture.</p>}
    {adviceResult ? <>
      <div className="hv-decision__coverage">
        <strong>{coverageLabel}</strong>
        <span>{coverage?.consideredMaterialIds.length ?? 0} matières examinées dans le périmètre fourni · {allOptions.length} voies conservées</span>
        {coverage?.excludedMaterialIds.length ? <span>{coverage.excludedMaterialIds.length} exclusion{coverage.excludedMaterialIds.length === 1 ? '' : 's'} déclarée{coverage.excludedMaterialIds.length === 1 ? '' : 's'}</span> : null}
      </div>
      {!semanticReading && reading.intent.criteria.length ? <ul className="hv-decision__criteria" aria-label="Critères exacts de la demande">
        {reading.intent.criteria.map(criterion => <li key={criterion.id}><strong>{criterion.direction === 'increase' ? 'Rechercher' : criterion.direction === 'decrease' ? 'Réduire' : criterion.direction === 'keep' ? 'Préserver' : criterion.direction === 'exclude' ? 'Exclure' : 'Examiner'}</strong><span>{criterion.label}</span></li>)}
      </ul> : !semanticReading ? <p className="hv-decision__unknowns">Aucun critère structuré n’est conservé; la demande originale reste intacte.</p> : null}
      <p className="hv-decision__ranking-note">Ordre documentaire, sans score total : contraintes contredites, tensions et non-alignement, puis appuis sourcés et contraintes satisfaites; les effets non vérifiés et inconnus restent séparés.</p>
      {!hasSourceBackedCriterionSupport ? <p className="hv-decision__no-gain" role="status">Aucune voie ne relie un appui documentaire aux critères exacts avec les sources chargées. Les contraintes restent affichées à part, les inconnues ouvertes; l’absence de mention ne prouve pas l’absence d’un caractère.</p> : null}
      {reading.unresolved.length ? <details className="hv-decision__details hv-decision__open-unknowns" open>
        <summary>Points inconnus qui peuvent changer le choix</summary><ul>{reading.unresolved.map((item, index) => <li key={index}>{item}</li>)}</ul>
      </details> : null}
      <div className="hv-decision__search">
        <label htmlFor={searchId}>Rechercher dans toutes les matières, raisons et sources</label>
        <Input id={searchId} type="search" aria-label="Rechercher dans toutes les matières, raisons et sources" value={query} onChange={event => { setQuery(event.target.value); setVisibleGroupCount(6); }} />
        <p>{Math.min(visibleGroupCount, matchingGroups.length)} groupes visibles sur {matchingGroups.length} correspondants · {allOptions.length} voies retournées. Les critères d’une matière restent séparés.</p>
      </div>
      {visibleGroups.length ? <div className="hv-decision__groups" aria-label="Voies de décision documentées">
        {visibleGroups.map(group => {
          const resolved = group.materialIds.map(id => materials.get(id)).filter((material): material is HopDecisionMaterial => !!material);
          const unresolved = group.materialIds.filter(id => !materials.has(id));
          const heading = resolved.length === 1 ? resolved[0].name
            : resolved.length > 1 ? resolved.map(material => material.name).join(' · ')
              : group.options.length === 1 ? 'Voie liée au contexte transmis' : 'Voies liées au contexte transmis';
          return <article className="hv-decision__group" key={group.key}>
            <div className="hv-decision__group-heading"><h3>{heading}</h3>
              <span>{resolved.length > 1 ? `${resolved.length} matières · ` : ''}{group.leverGroups.length} voie{group.leverGroups.length === 1 ? '' : 's'} documentée{group.leverGroups.length === 1 ? '' : 's'}</span>
            </div>
            {unresolved.length ? <p className="hv-decision__unknowns">Identité non résolue : {unresolved.length}; aucune matière de remplacement n’est supposée.</p> : null}
            {group.leverGroups.map(lever => <div className="hv-decision__lever-group" key={lever.key}>
              {lever.options.length > 1 ? <div className="hv-decision__lever-heading"><strong>{actionHeading(lever.options[0], group.materialIds, materials, actualAdditions, historical, archive)}</strong>
                <span>{lever.options.length} références de même portée · raisons et conditions dans les détails</span></div> : null}
              {lever.options[0] ? <AdviceOptionView key={lever.options[0].id} option={lever.options[0]} relatedOptions={lever.options.slice(1)} materialIds={group.materialIds} materials={materials}
                additions={actualAdditions} evidenceSources={sourceIndex} reading={reading} historical={historical} archive={archive}
                preparationBlocked={preparationDirty || operationDrafts.length > 0} explorationBlocked={preparationDirty}
                preparationBlockReason={preparationDirty ? semanticDraftDirty ? 'Enregistre et recalcule la lecture sémantique avant de préparer cette voie.'
                  : 'Recalcule la lecture corrigée avant de préparer cette voie.'
                  : `La demande contient ${operationDrafts.length} opération${operationDrafts.length === 1 ? '' : 's'} explicite${operationDrafts.length === 1 ? '' : 's'}; reprends-les ensemble dans le composer ci-dessus.`}
                onPrepare={prepareOption} onExplore={onExplore} /> : null}
            </div>)}
            {group.materialIds.length ? <details className="hv-decision__details hv-decision__technical-details">
              <summary>Identités et portée techniques</summary>
              <ul>{group.materialIds.map(id => <li key={id}>{materials.get(id)?.name ?? 'Matière non résolue'} · ID exact {id}</li>)}</ul>
              {group.options.map(option => <p key={`${option.id}-reference`}><code>{option.id} · {option.reference}</code></p>)}
            </details> : null}
          </article>;
        })}
      </div> : <p className="hv-decision__empty">Aucune voie ne correspond à la recherche. Le conseil conservé n’est pas remplacé par une absence de résultat.</p>}
      {!normalizedQuery && visibleGroupCount < matchingGroups.length ? <button type="button" className="hv-decision__more" onClick={() => setVisibleGroupCount(count => count + 12)}>
        Afficher {Math.min(12, matchingGroups.length - visibleGroupCount)} groupes suivants
      </button> : null}
      {coverage?.limits.length || adviceResult.limitations.length || adviceResult.informationRequests.length ? <details className="hv-decision__details">
        <summary>Portée complète, demandes d’information et limites</summary>
        {adviceResult.informationRequests.map(request => <section key={request.id}><h3>{request.question}</h3><p>{request.whyDecisionChanging}</p></section>)}
        {[...(coverage?.limits ?? []), ...adviceResult.limitations].filter((item, index, rows) => rows.indexOf(item) === index).map((item, index) => <p key={index}>{item}</p>)}
      </details> : null}
    </> : <>
      {reading.branches.length ? <p className="hv-decision__unknowns">{reading.branches.length} scénario{reading.branches.length === 1 ? '' : 's'} préparé{reading.branches.length === 1 ? '' : 's'} · aucun scénario n’est appliqué depuis cette réponse.</p> : null}
      {response?.missingInformation.length ? <details className="hv-decision__details" open><summary>Informations manquantes</summary><ul>{response.missingInformation.map((item, index) => <li key={index}>{item}</li>)}</ul></details> : null}
      {productResponse ? <CommercialProductDocuments products={productResponse.result.products} /> : null}
      {response?.sources.length ? <details className="hv-decision__details"><summary>Sources attachées à cette réponse</summary><ul>{response.sources.map((source, index) => <li key={`${source.reference ?? source.title}-${index}`}>
        {source.reference?.startsWith('http') ? <a href={source.reference} target="_blank" rel="noreferrer">{responseSourceLabel(source)}</a> : <span>{responseSourceLabel(source)}</span>}
      </li>)}</ul></details> : null}
    </>}
    {currentScopeMaterials.length && !historical ? <details className="hv-decision__details hv-decision__program-facts">
      <summary>Programme réel transmis à la lecture</summary>
      <ul>{currentScopeMaterials.map(addition => <li key={addition.id}>{materials.get(addition.materialId)?.name ?? 'Matière du programme non résolue'} · {addition.grams == null ? 'Masse inconnue' : `${addition.grams.toLocaleString('fr-CH')} g physiques`} · {useLabels[addition.use]} · {addition.status === 'performed' ? 'Effectué' : 'Prévu'}</li>)}</ul>
      {prepared.runtime.current?.program?.volumeL == null ? <p>Volume du programme inconnu.</p> : <p>Volume exact · {prepared.runtime.current.program.volumeL.toLocaleString('fr-CH')} L</p>}
    </details> : null}
  </section>;
}
