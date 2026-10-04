import React, { useRef, useState } from 'react';
import type { HopDecisionStudySnapshotV2, HopDecisionDossierV2, HopDecisionEventV2 } from '../../domain/hopDecision/dossier';
import type { HopAdviceStudyV3, HopAdviceDossierV3, HopAdviceEventV3 } from '../../domain/hopDecision/adviceDossier';
import type { HopCommercialProduct, HopDecisionMaterial, HopUse } from '../../domain/hopDecision/types';
import type { HopAdviceOption, HopAdviceSituation, HopStrategyAdviceResult } from '../../domain/hopDecision/adviceSchema';
import type { HopSource } from '../../../functions/src/hopIndexSchema';
import type { HopV55QualifiedStudyLinkV1, PersistHopV55QualifiedStudyResult } from '../../services/hopV55/qualifiedStudyWorkspace';
import { hopDecisionReference } from '../../domain/hopDecision/measurements';
import { Textarea } from '../Input';
import './qualified-study-panel.css';

export type HopV55QualifiedStudyEntry =
  | {
      kind: 'products';
      sourceReadingReference: string;
      studyReference: string;
      study: HopDecisionStudySnapshotV2<'understandProducts'>;
      status: 'prepared' | 'saved' | 'historical';
      readOnly: boolean;
      link?: HopV55QualifiedStudyLinkV1;
      dossier?: HopDecisionDossierV2;
      events?: readonly HopDecisionEventV2[];
      recoveryNotice?: string;
    }
  | {
      kind: 'advice';
      sourceReadingReference: string;
      studyReference: string;
      study: HopAdviceStudyV3;
      status: 'prepared' | 'saved' | 'historical';
      readOnly: boolean;
      link?: HopV55QualifiedStudyLinkV1;
      dossier?: HopAdviceDossierV3;
      events?: readonly HopAdviceEventV3[];
      recoveryNotice?: string;
    };

const useLabels: Record<HopUse, string> = {
  firstWort: 'première chauffe', boil: 'ébullition', whirlpool: 'whirlpool',
  fermentation: 'fermentation', postFermentation: 'après fermentation',
};

const formLabels: Record<HopCommercialProduct['form'], string> = {
  pelletT90: 'granulés T90', pelletT45: 'granulés T45', cryo: 'granulés cryogéniques',
  extract: 'extrait', cone: 'cônes', unknown: 'forme non précisée',
};

const levelLabels: Record<HopSource['kind'], string> = {
  coa: 'certificat d’analyse', manufacturer: 'source fabricant', research: 'recherche', review: 'revue',
  observation: 'observation', community: 'source communautaire', judgment: 'jugement éditorial',
};

const readingLevelLabels: Record<string, string> = {
  primaryFullText: 'texte intégral consulté', primaryAbstract: 'résumé consulté', primaryExcerpt: 'extrait consulté',
  secondary: 'source secondaire', dossierSummary: 'résumé du dossier', providedMaterialSource: 'source fournie avec la matière',
  curatedMapping: 'correspondance éditoriale',
};

const certaintyLabels: Record<HopAdviceSituation['exclusions'][number]['certainty'], string> = {
  certain: 'certaine', possible: 'possible', unknown: 'inconnue',
};

const assertionStateLabels: Record<string, string> = {
  reported: 'déclaré', measured: 'mesuré', planned: 'planifié', performed: 'effectué', unknown: 'non renseigné',
};

const assertionSubjectLabels: Record<string, string> = {
  alcohol: 'alcool', ABV: 'alcool (ABV)', pH: 'pH', 'titratable-acidity': 'acidité titrable',
  culture: 'culture', viability: 'viabilité', fermentation: 'fermentation',
};

export interface HopV55QualifiedStudySaveRequest {
  sourceReadingReference: string;
  studyReference: string;
  expectedStudyReference: string;
}

export interface HopV55QualifiedAdvicePreferenceRequest {
  expectedLinkReference: string;
  expectedDossierId: string;
  expectedDossierRevision: number;
  expectedStudyReference: string;
  expectedOptionId: string;
  expectedOptionReference: string;
  reason: string;
}

export interface HopV55QualifiedAdvicePreferenceUpdate {
  dossier: HopAdviceDossierV3;
  event: HopAdviceEventV3;
  events: readonly HopAdviceEventV3[];
  freshContext: { status: 'current' } | { status: 'historical'; reason: string };
}

export interface HopV55QualifiedStudyPanelProps {
  entry: HopV55QualifiedStudyEntry;
  onSaveProductStudy?(input: HopV55QualifiedStudySaveRequest & {
    kind: 'products'; study: HopDecisionStudySnapshotV2<'understandProducts'>;
  }): Promise<PersistHopV55QualifiedStudyResult>;
  onSaveAdviceStudy?(input: HopV55QualifiedStudySaveRequest & {
    kind: 'advice'; study: HopAdviceStudyV3;
  }): Promise<PersistHopV55QualifiedStudyResult>;
  onPreferAdvice?(input: HopV55QualifiedAdvicePreferenceRequest): Promise<HopV55QualifiedAdvicePreferenceUpdate>;
}

function sourceTitle(source: HopSource): string {
  return [source.title, source.author, source.year].filter(value => value !== undefined && value !== '').join(' · ')
    || levelLabels[source.kind] || 'Source documentaire';
}

function formatNumber(value: number) {
  return value.toLocaleString('fr-CH', { maximumFractionDigits: 3 });
}

function SourceReference({ source }: { source: HopSource }) {
  const title = sourceTitle(source);
  return <span className="hv-qualified-source">
    {source.reference?.startsWith('http') ? <a href={source.reference} target="_blank" rel="noreferrer">{title}</a> : <span>{title}</span>}
    {source.reference && !source.reference.startsWith('http') ? <code>{source.reference}</code> : null}
    {source.locator ? <span className="hv-qualified-source__locator">{source.locator}</span> : null}
  </span>;
}

function ProductSource({ label, source }: { label: string; source: HopSource }) {
  return <li><strong>{label} · </strong><SourceReference source={source} /></li>;
}

function ProductCard({ product }: { product: HopCommercialProduct }) {
  const replacement = product.replacement;
  return <article className="hv-qualified-product">
    <header>
      <div><h4>{product.name}</h4><p>{product.manufacturer} · {formLabels[product.form]}</p></div>
    </header>
    <p><strong>Emplois documentés · </strong>{product.supportedUses.map(use => useLabels[use]).join(' · ') || 'aucun emploi fourni'}</p>
    {product.cautions.length ? <ul className="hv-qualified-product__conditions">
      {product.cautions.map((caution, index) => <li key={`${product.id}-caution-${index}`}>{caution}</li>)}
    </ul> : <p>Aucune précaution supplémentaire fournie avec cette fiche.</p>}
    {replacement ? <details>
      <summary>Convention et limites de remplacement</summary>
      <p><strong>Rapport massique publié · </strong>{formatNumber(replacement.gramsPerGram.min)}–{formatNumber(replacement.gramsPerGram.max)} g/g, pour {formLabels[replacement.referenceForm]}.</p>
      <p><strong>Emplois couverts · </strong>{replacement.uses.map(use => useLabels[use]).join(' · ') || 'non précisés'}</p>
      <p><strong>Base de la convention · </strong>{replacement.basis === 'manufacturerMassRatio' ? 'rapport massique fabricant' : replacement.basis}</p>
      {replacement.maxEquivalentFraction !== undefined ? <p>Part équivalente maximale indiquée · {(replacement.maxEquivalentFraction * 100).toLocaleString('fr-CH', { maximumFractionDigits: 3 })} %</p> : null}
      {replacement.maxDoseGL !== undefined ? <p>Dose maximale indiquée · {replacement.maxDoseGL.toLocaleString('fr-CH', { maximumFractionDigits: 3 })} g/L</p> : null}
      <ul>{replacement.limitations.map((limitation, index) => <li key={`${product.id}-limit-${index}`}>{limitation}</li>)}</ul>
      <ul><ProductSource label="Source de la convention" source={replacement.source} /></ul>
    </details> : <p className="hv-qualified-muted">Aucun rapport massique de remplacement n’est fourni.</p>}
    <details className="hv-qualified-product__source">
      <summary>Source, date de revue et identité</summary>
      <ul><ProductSource label="Source de la fiche" source={product.source} /></ul>
      <p>Fiche revue le {product.reviewedOn} · identité documentaire <code>{product.id}</code></p>
    </details>
  </article>;
}

function ProductStudy({ study }: { study: HopDecisionStudySnapshotV2<'understandProducts'> }) {
  if (study.kind === 'resolutionRequired') return <section className="hv-qualified-result" aria-label="Résultat de l’étude produit">
    <div className="hv-qualified-answer">
      <p className="hv-qualified-eyebrow">Qualification non résolue</p>
      <p>La réponse produit n’a pas été calculée. Cette étude conserve les produits transmis et les raisons qui empêchent de les qualifier.</p>
    </div>
    {study.request.products?.length ? <div className="hv-qualified-product-list">
      <h3>Produits transmis · non qualifiés</h3>
      {study.request.products.map(product => <ProductCard key={product.id} product={product} />)}
    </div> : null}
    {study.blockingIssues.length ? <section><h3>Points à résoudre</h3>
      <ul>{study.blockingIssues.map((issue, index) => <li key={`${issue.code}-${index}`}>{issue.reason}</li>)}</ul>
    </section> : null}
    {study.skippedCandidates.length ? <details className="hv-qualified-limits">
      <summary>Fiches sans projection · {study.skippedCandidates.length}</summary>
      <ul>{study.skippedCandidates.map((candidate, index) => <li key={`${candidate.materialId}-${index}`}>
        {candidate.reasons.join(' ')} <code>{candidate.materialId} · {candidate.recordKeys.join(', ')}</code>
      </li>)}</ul>
    </details> : null}
    {study.reasons.length ? <details className="hv-qualified-limits"><summary>Motifs de qualification</summary>
      <ul>{study.reasons.map((reason, index) => <li key={index}>{reason}</li>)}</ul>
    </details> : null}
    <StudyContextDetails context={study.context} />
  </section>;

  const products = study.responseSnapshot.result.products;
  return <section className="hv-qualified-result" aria-label="Résultat de l’étude produit">
    <div className="hv-qualified-answer">
      <p className="hv-qualified-eyebrow">Réponse de l’étude</p>
      <p>{study.responseSnapshot.answer}</p>
      <span className={`hv-qualified-status hv-qualified-status--${study.responseSnapshot.status}`}>{responseStatusLabel(study.responseSnapshot.status)}</span>
    </div>
    <div className="hv-qualified-product-list">
      <p className="hv-qualified-study-note">Qualification produit dédiée · cette réponse constitue une étude distincte de la lecture d’origine.</p>
      <h3>Fiches et emplois examinés · {products.length}</h3>
      <p>Ces fiches documentent des usages et leurs limites. Leur examen ne vaut ni préférence, ni recommandation d’achat ou d’emploi.</p>
      {products.length ? products.map(product => <ProductCard key={product.id} product={product} />)
        : <p>Aucune fiche produit n’a été incluse dans cette qualification.</p>}
    </div>
    {study.responseSnapshot.sources.length ? <details className="hv-qualified-sources">
      <summary>Autres sources de la réponse · {study.responseSnapshot.sources.length}</summary>
      <ul>{study.responseSnapshot.sources.map((source, index) => <ProductSource key={`${source.reference}-${index}`} label={levelLabels[source.kind] ?? 'Source'} source={source} />)}</ul>
    </details> : null}
    <StudyContextDetails context={study.context} />
    {study.blockingIssues.length ? <details className="hv-qualified-limits">
      <summary>Résolutions et limites · {study.blockingIssues.length}</summary>
      <ul>{study.blockingIssues.map((issue, index) => <li key={`${issue.code}-${index}`}>{issue.reason}</li>)}</ul>
    </details> : null}
    {study.reasons.length || study.skippedCandidates.length || study.partialRecordKeys.length ? <details className="hv-qualified-limits">
      <summary>Portée qualifiée et fiches non résolues</summary>
      {study.reasons.map((reason, index) => <p key={`reason-${index}`}>{reason}</p>)}
      {study.skippedCandidates.length ? <ul>{study.skippedCandidates.map((candidate, index) => <li key={`${candidate.materialId}-${index}`}>
        <strong>{candidate.disposition === 'missing' ? 'Fiche absente' : candidate.disposition === 'ambiguous' ? 'Identité ambiguë'
          : candidate.disposition === 'collisionNeedsSelection' ? 'Choix de variante nécessaire' : 'Fiche non projetée'} · </strong>
        {candidate.reasons.join(' ')} <code>{candidate.materialId} · {candidate.recordKeys.join(', ')}</code>
      </li>)}</ul> : null}
      {study.partialRecordKeys.length ? <p>Repères de catalogue partiels · <code>{study.partialRecordKeys.join(', ')}</code></p> : null}
    </details> : null}
  </section>;
}

function responseStatusLabel(status: 'answered' | 'conditional' | 'noApplicableOption') {
  return status === 'answered' ? 'Réponse disponible' : status === 'conditional' ? 'Réponse conditionnelle' : 'Aucune option applicable dans le périmètre';
}

const criterionStatusLabels: Record<HopAdviceOption['criterionEffects'][number]['status'], string> = {
  documentedSupport: 'appui documentaire', documentedTension: 'tension documentaire', constraintSatisfied: 'contrainte respectée',
  constraintViolated: 'contrainte non respectée', constraintUnverified: 'contrainte non vérifiée', unknown: 'inconnu', notApplicable: 'sans objet',
};

const dimensionLabels: Record<HopAdviceOption['dimensionEffects'][number]['dimension'], string> = {
  aroma: 'arôme', acidity: 'acidité', alcohol: 'alcool', bioInteraction: 'interaction avec la culture', hopCreep: 'hop creep',
  matrixTransfer: 'transfert dans la bière', process: 'procédé', stock: 'stock', documentation: 'documentation', other: 'autre dimension',
};

const dimensionStatusLabels: Record<HopAdviceOption['dimensionEffects'][number]['status'], string> = {
  documentarySupport: 'appui documentaire', documentaryTension: 'tension documentaire', conditional: 'conditionnel',
  unknown: 'inconnu', structuralChange: 'changement de structure', notApplicable: 'sans objet',
};

function scopeStatusLabel(status: HopStrategyAdviceResult['status']) {
  return status === 'answered' ? 'réponse disponible dans ce périmètre' : status === 'conditional'
    ? 'réponse conditionnelle dans ce périmètre' : 'aucune voie applicable dans ce périmètre';
}

const strategyStatusLabel: Record<HopAdviceOption['relevance'], string> = {
  supportsCriteria: 'appui documentaire', conditional: 'conditionnelle', mixed: 'effets contrastés',
  unknown: 'effets à préciser', notAligned: 'peu alignée sur les critères',
};

function strategyScopeLabel(option: HopAdviceOption) {
  if (option.programScope.kind === 'none') return 'Piste d’observation ou d’investigation · aucune modification de programme définie';
  if (option.programScope.kind === 'removePlanned') return 'Piste liée au retrait de lignes planifiées';
  const uses = option.programScope.uses.map(use => useLabels[use]).join(' · ') || 'emplois non précisés';
  return `Piste liée à des matières et emplois précis · ${uses}`;
}

function materialLabel(materials: readonly HopDecisionMaterial[], id: string) {
  return materials.find(row => row.id === id)?.name ?? `Identité non résolue (${id})`;
}

function AdviceOptionCard({ option, materials, evidenceSources, criterionLabels, selected, onSelect, canSelect }: {
  option: HopAdviceOption;
  materials: readonly HopDecisionMaterial[];
  evidenceSources: HopStrategyAdviceResult['evidenceSources'];
  criterionLabels: ReadonlyMap<string, string>;
  selected: boolean;
  onSelect: () => void;
  canSelect: boolean;
}) {
  const linkedSourceIds = new Set([...option.criterionEffects, ...option.dimensionEffects].flatMap(effect => effect.evidenceIds));
  const linkedSources = evidenceSources.filter(source => linkedSourceIds.has(source.id));
  return <article className={`hv-qualified-option${selected ? ' is-selected' : ''}`}>
    <header><div><h4>{option.title}</h4><span className="hv-qualified-status">{strategyStatusLabel[option.relevance]}</span></div>
      {canSelect ? <button type="button" className="hv-qualified-button hv-qualified-button--quiet" aria-pressed={selected}
        onClick={onSelect}>{selected ? 'Voie choisie' : 'Choisir cette voie'}</button> : null}
    </header>
    <p className="hv-qualified-option__scope">{strategyScopeLabel(option)}</p>
    {option.materialIds.length ? <p><strong>Matières exactes concernées · </strong>{option.materialIds.map(id => materialLabel(materials, id)).join(' · ')}</p> : null}
    {option.criterionEffects.length ? <section><h5>Effets sur les critères</h5><ul>{option.criterionEffects.map(effect => <li key={effect.criterionId}>
      <strong>{criterionLabels.get(effect.criterionId) ?? 'Critère transmis'} · {criterionStatusLabels[effect.status]} · </strong>{effect.reason}
    </li>)}</ul></section> : null}
    {option.dimensionEffects.length ? <section><h5>Effets documentés et inconnues</h5><ul>{option.dimensionEffects.map((effect, index) => <li key={`${effect.dimension}-${index}`}>
      <strong>{dimensionLabels[effect.dimension]} · {dimensionStatusLabels[effect.status]} · </strong>{effect.statement} {effect.reason}
    </li>)}</ul></section> : null}
    {option.conditions.length ? <section><h5>Conditions à vérifier</h5><ul>{option.conditions.map((condition, index) => <li key={index}>{condition}</li>)}</ul></section> : null}
    {option.exclusions.some(row => row.status !== 'retained') ? <details><summary>Exclusions et matières non retenues</summary>
      <ul>{option.exclusions.filter(row => row.status !== 'retained').map(row => <li key={`${row.materialId}-${row.status}`}>
        {materialLabel(materials, row.materialId)} · {row.status === 'excluded' ? 'exclue' : row.status === 'possible' ? 'peut-être exclue' : 'statut inconnu'} · {row.reason}
      </li>)}</ul></details> : null}
    {option.nonConclusions.length ? <details><summary>Ce que cette piste ne permet pas de conclure</summary>
      <ul>{option.nonConclusions.map((item, index) => <li key={`${option.id}-nonconclusion-${index}`}>{item}</li>)}</ul></details> : null}
    {linkedSources.length ? <details><summary>Sources liées à cette piste · {linkedSources.length}</summary><ul>
      {linkedSources.map(source => <li key={source.id}><strong>{source.domain} · {readingLevelLabels[source.readingLevel] ?? source.readingLevel}</strong>
        <p>{source.established}</p><p>{source.limits.join(' ')}</p><p><strong>Référence · </strong><SourceReference source={source.source} /></p>
        {source.locator ? <p>Repère · {source.locator}</p> : null}<code>{source.id}</code>
      </li>)}
    </ul></details> : <p className="hv-qualified-muted">Aucune source n’est directement liée aux effets affichés.</p>}
    <details className="hv-qualified-technical"><summary>Identité de la piste et matières exactes</summary>
      <p><code>{option.id} · {option.reference}</code></p>
      {option.materialIds.length ? <p>Identités · <code>{option.materialIds.join(' · ')}</code></p> : <p>Aucune matière exacte liée à cette voie.</p>}
    </details>
  </article>;
}

function stageLabel(stage: HopAdviceSituation['stage']) {
  return ({ planning: 'planification', hotSide: 'côté chaud', fermenting: 'fermentation', conditioning: 'conditionnement', packaged: 'bière conditionnée' } as const)[stage];
}

function studyContextLabel(context: HopAdviceStudyV3['context'] | HopDecisionStudySnapshotV2<'understandProducts'>['context']) {
  if (!context) return 'Aucun lien de contexte à une recette ou à un brassin n’a été fourni.';
  if (context.kind === 'recipe') return `Recette liée · ${context.recipeId}`;
  return `Brassin lié · ${context.batchId} · étape ${context.stage} · révision du jour de brassage ${context.brewDayRevision}`;
}

function StudyContextDetails({ context }: { context: HopAdviceStudyV3['context'] | HopDecisionStudySnapshotV2<'understandProducts'>['context'] }) {
  return <details className="hv-qualified-technical"><summary>Contexte lié à l’étude</summary>
    <p>{studyContextLabel(context)}</p>
    {context?.kind === 'recipe' ? <p>Référence de recette · <code>{context.recipeReference}</code></p> : null}
    {context?.kind === 'batch' ? <p>Instantané recette · <code>{context.recipeSnapshotReference}</code></p> : null}
  </details>;
}

function identityForEntry(entry: HopV55QualifiedStudyEntry) {
  return `${entry.kind}:${entry.sourceReadingReference}:${entry.studyReference}:${entry.status}:${entry.readOnly ? 'ro' : 'rw'}:${entry.dossier?.dossierId ?? ''}:${entry.dossier?.revision ?? ''}`;
}

function assertSavedStudyResult(entry: HopV55QualifiedStudyEntry, result: PersistHopV55QualifiedStudyResult): HopV55QualifiedStudyEntry {
  const link = result.link;
  if (link.kind !== entry.kind || link.sourceReadingReference !== entry.sourceReadingReference
    || link.studyReference !== entry.studyReference || result.preparation.kind !== entry.kind
    || result.preparation.sourceReadingReference !== entry.sourceReadingReference
    || result.preparation.studyReference !== entry.studyReference
    || result.preparation.reference !== link.preparationReference || result.preparation.dossierId !== link.dossierId
    || result.preparation.eventId !== link.eventId || result.preparation.workspaceId !== link.workspaceId
    || result.preparation.ownerKey !== link.ownerKey || result.workspace.id !== link.workspaceId
    || result.workspace.ownerKey !== link.ownerKey
    || !result.workspace.qualifiedStudyPreparations?.some(row => 'reference' in row && row.reference === result.preparation.reference)
    || !result.workspace.qualifiedStudyLinks?.some(row => 'reference' in row && row.reference === link.reference)) {
    throw new Error('La confirmation ne correspond pas à cette lecture, cette étude et ce lien exacts.');
  }
  if (result.studySavedEvent.eventId !== link.eventId || result.studySavedEvent.dossierId !== link.dossierId
    || result.studySavedEvent.ownerKey !== link.ownerKey || result.studySavedEvent.kind !== 'studySaved') {
    throw new Error('L’événement de conservation ne correspond pas au dossier lié.');
  }
  const status = result.freshContext.status === 'historical' ? 'historical' : result.status === 'recoveredHistorical' ? 'historical' : 'saved';
  const readOnly = entry.readOnly || result.freshContext.status === 'historical';

  if (entry.kind === 'products') {
    if (link.formatVersion !== 2 || result.preparation.formatVersion !== 2
      || result.dossier.formatVersion !== 2 || !('study' in result.dossier) || result.dossier.study.actionKind !== 'understandProducts'
      || result.dossier.dossierId !== link.dossierId || result.dossier.ownerKey !== link.ownerKey
      || result.preparation.createCommand.kind !== 'products'
      || hopDecisionReference(result.preparation.createCommand.study) !== entry.studyReference
      || hopDecisionReference(result.dossier.study) !== entry.studyReference
      || result.studySavedEvent.eventFormatVersion !== 2 || result.studySavedEvent.payload.snapshotFormatVersion !== 2
      || !validEventChain(result.events, { ownerKey: link.ownerKey, dossierId: link.dossierId, revision: result.dossier.revision,
        formatVersion: 2, firstEventId: link.eventId, lastEventId: result.dossier.lastEventId })) {
      throw new Error('La confirmation ne contient pas l’étude produit V2 exacte attendue.');
    }
    return { ...entry, status, readOnly, link, dossier: result.dossier, events: result.events as HopDecisionEventV2[] };
  }
  if (link.formatVersion !== 3 || result.preparation.formatVersion !== 3
    || result.dossier.formatVersion !== 3 || !('study' in result.dossier) || result.dossier.study.kind !== 'advice'
    || result.dossier.dossierId !== link.dossierId || result.dossier.ownerKey !== link.ownerKey
    || result.preparation.createCommand.kind !== 'advice'
    || result.preparation.createCommand.study.reference !== entry.studyReference
    || result.dossier.study.reference !== entry.studyReference
    || result.studySavedEvent.eventFormatVersion !== 3 || result.studySavedEvent.payload.snapshotFormatVersion !== 3
    || !validEventChain(result.events, { ownerKey: link.ownerKey, dossierId: link.dossierId, revision: result.dossier.revision,
      formatVersion: 3, firstEventId: link.eventId, lastEventId: result.dossier.lastEventId })) {
    throw new Error('La confirmation ne contient pas l’étude de conseil V3 exacte attendue.');
  }
  return { ...entry, status, readOnly, link, dossier: result.dossier, events: result.events as HopAdviceEventV3[] };
}

function validEventChain(events: readonly unknown[], expected: {
  ownerKey: string; dossierId: string; revision: number; formatVersion: 2 | 3; firstEventId: string; lastEventId: string;
}) {
  if (events.length !== expected.revision) return false;
  const rows = events as ReadonlyArray<Record<string, unknown>>;
  return rows.every((event, index) => event.eventFormatVersion === expected.formatVersion
    && event.ownerKey === expected.ownerKey && event.dossierId === expected.dossierId
    && event.expectedRevision === index && event.resultingRevision === index + 1
    && (index !== 0 || event.eventId === expected.firstEventId && event.kind === 'studySaved'
      && !!event.payload && typeof event.payload === 'object'
      && (event.payload as Record<string, unknown>).snapshotFormatVersion === expected.formatVersion))
    && rows.at(-1)?.eventId === expected.lastEventId;
}

function hasPersistedStudy(entry: HopV55QualifiedStudyEntry): entry is Extract<HopV55QualifiedStudyEntry, { kind: 'advice' }> & { link: HopV55QualifiedStudyLinkV1; dossier: HopAdviceDossierV3; events: readonly HopAdviceEventV3[] } {
  return entry.kind === 'advice' && !!entry.link && entry.link.kind === 'advice'
    && entry.link.formatVersion === 3
    && entry.link.studyReference === entry.studyReference && entry.link.sourceReadingReference === entry.sourceReadingReference
    && !!entry.dossier && entry.dossier.formatVersion === 3 && entry.dossier.study.reference === entry.studyReference
    && entry.link.dossierId === entry.dossier.dossierId && entry.link.ownerKey === entry.dossier.ownerKey
    && !!entry.events && validEventChain(entry.events, { ownerKey: entry.dossier.ownerKey, dossierId: entry.dossier.dossierId,
      revision: entry.dossier.revision, formatVersion: 3, firstEventId: entry.link.eventId, lastEventId: entry.dossier.lastEventId });
}

function assertPreferenceResult(entry: Extract<HopV55QualifiedStudyEntry, { kind: 'advice' }>, request: HopV55QualifiedAdvicePreferenceRequest,
  update: HopV55QualifiedAdvicePreferenceUpdate): Extract<HopV55QualifiedStudyEntry, { kind: 'advice' }> {
  if (update.freshContext.status !== 'current') throw new Error(`Le contexte a changé; cette préférence n’a pas été conservée. ${update.freshContext.reason}`);
  const event = update.event;
  if (update.dossier.dossierId !== request.expectedDossierId || update.dossier.revision !== request.expectedDossierRevision + 1
    || update.dossier.study.reference !== request.expectedStudyReference || event.kind !== 'strategyPreferred'
    || update.dossier.state !== 'strategyPreferred' || event.eventFormatVersion !== 3
    || event.dossierId !== request.expectedDossierId || event.ownerKey !== update.dossier.ownerKey
    || event.expectedRevision !== request.expectedDossierRevision || event.resultingRevision !== request.expectedDossierRevision + 1
    || event.eventId !== update.dossier.lastEventId || event.payload.studyReference !== request.expectedStudyReference
    || event.payload.optionId !== request.expectedOptionId || event.payload.optionReference !== request.expectedOptionReference
    || !update.events.some(row => row.eventId === event.eventId && row.kind === 'strategyPreferred')
    || !validEventChain(update.events, { ownerKey: update.dossier.ownerKey, dossierId: update.dossier.dossierId,
      revision: update.dossier.revision, formatVersion: 3, firstEventId: entry.link?.eventId ?? '', lastEventId: update.dossier.lastEventId })
    || update.events[0]?.kind !== 'studySaved' || update.events[0].payload.snapshotFormatVersion !== 3
    || !entry.link || request.expectedLinkReference !== entry.link.reference
    || event.payload.reason !== request.reason
    || event.payload.interpretation !== (entry.study.requestSnapshot.intent.interpretation ?? '')
    || !event.payload.preferenceReference
    || !entry.study.responseSnapshot.result.options.some(option => option.id === request.expectedOptionId
      && option.reference === request.expectedOptionReference)) {
    throw new Error('La confirmation ne correspond pas à la voie, au conseil et à la révision attendus.');
  }
  return { ...entry, dossier: update.dossier, events: update.events, status: 'saved' };
}

function AdviceStudy({ entry, canSelect, onPrefer, onPreferenceSaved }: {
  entry: Extract<HopV55QualifiedStudyEntry, { kind: 'advice' }>;
  canSelect: boolean;
  onPrefer?(option: HopAdviceOption, reason: string): Promise<void>;
  onPreferenceSaved?(): void;
}) {
  const { study } = entry;
  const result = study.responseSnapshot.result;
  const materials = study.serviceInput.materials;
  const situation = study.requestSnapshot.action.situation;
  const criterionLabels = new Map((study.requestSnapshot.intent.criteria ?? []).map(criterion => [criterion.id, criterion.description]));
  const [selectedOptionId, setSelectedOptionId] = useState('');
  const [reason, setReason] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const scopeMaterials = (() => {
    const ids = situation.materialIds ?? [];
    return ids.map(id => materialLabel(materials, id));
  })();
  const selectedOption = result.options.find(row => row.id === selectedOptionId);
  const programVolume = !situation.program ? '' : situation.program.volumeL === null
    ? 'volume non renseigné' : `${formatNumber(situation.program.volumeL)} L`;

  const savePreference = async () => {
    if (!selectedOption || !onPrefer || !reason.trim()) return;
    setPending(true);
    setError('');
    try {
      await onPrefer(selectedOption, reason.trim());
      onPreferenceSaved?.();
      setReason('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'La préférence n’a pas été confirmée.');
    } finally {
      setPending(false);
    }
  };

  return <section className="hv-qualified-result" aria-label="Résultat du conseil qualifié">
    <div className="hv-qualified-answer">
      <p className="hv-qualified-eyebrow">Réponse du conseil</p>
      <p>{study.responseSnapshot.answer}</p>
      <span className={`hv-qualified-status hv-qualified-status--${study.responseSnapshot.status}`}>{scopeStatusLabel(result.status)}</span>
    </div>
    <div className="hv-qualified-advice-context">
      <p><strong>Étape fournie · </strong>{stageLabel(situation.stage)}</p>
      {situation.program ? <p><strong>Programme pris en compte · </strong>{situation.program.additions.length} ajouts · {programVolume}</p>
        : <p><strong>Programme · </strong>aucun programme fourni pour cette étude</p>}
      <details><summary>Périmètre exact et contexte</summary>
        <p><strong>Rattachement · </strong>{studyContextLabel(study.context)}</p>
        <p><strong>Matières ciblées · </strong>{situation.materialIds === undefined ? 'champ absent dans la demande' : scopeMaterials.length ? scopeMaterials.join(' · ') : 'aucune matière sélectionnée (périmètre explicite vide)'}</p>
        {situation.materialIds?.length ? <p><strong>Identifiants transmis · </strong><code>{situation.materialIds.join(' · ')}</code></p>
          : situation.materialIds ? <p><strong>Identifiants transmis · </strong><code>aucun</code></p> : null}
        <p><strong>Assertions transmises · </strong>{situation.assertions.length}</p>
        {situation.assertions.length ? <ul>{situation.assertions.map(assertion => <li key={assertion.id}>
          <strong>{assertionSubjectLabels[assertion.subject] ?? assertion.subject} · {assertionStateLabels[assertion.state] ?? assertion.state} · </strong>{assertion.statement}
          {assertion.value !== null ? <span> · valeur transmise : {String(assertion.value)}{assertion.unit ? ` ${assertion.unit}` : ''}</span> : null}
          {assertion.dimension ? <span> · domaine déclaré : {dimensionLabels[assertion.dimension]}</span> : null}
          {assertion.source ? <p><strong>Source de cette déclaration · </strong><SourceReference source={assertion.source} /></p> : null}
        </li>)}</ul> : null}
        <p><strong>Critères transmis · </strong>{study.requestSnapshot.intent.criteria?.map(criterion => criterion.description).join(' · ') || 'aucun critère structuré fourni'}</p>
        {situation.criterionDimensions.length ? <details><summary>Liens explicites entre critères et domaines</summary>
          <ul>{situation.criterionDimensions.map((row, index) => <li key={`${row.criterionId}-${index}`}>
            {criterionLabels.get(row.criterionId) ?? 'Critère non décrit'} · {dimensionLabels[row.dimension]}{row.familyId ? ` · famille déclarée ${row.familyId}` : ''}
          </li>)}</ul>
        </details> : null}
        {situation.program ? <details><summary>Ajouts du programme fourni</summary><ul>{situation.program.additions.map(addition => <li key={addition.id}>
          {materialLabel(materials, addition.materialId)} · {useLabels[addition.use]} · {addition.status === 'performed' ? 'effectué' : 'planifié'}
          {addition.grams === null || addition.grams === undefined ? ' · masse non renseignée' : ` · ${formatNumber(addition.grams)} g`}
        </li>)}</ul></details> : null}
        {result.coverage.consideredMaterialIds.length || result.coverage.omittedMaterials.length
          || result.coverage.conditionalMaterials.length || result.coverage.contextOnlyMaterialIds.length ? <details>
          <summary>Identités qualifiées et limites de couverture</summary>
          {result.coverage.consideredMaterialIds.length ? <p><strong>Identités utilisées · </strong>{result.coverage.consideredMaterialIds.map(id => materialLabel(materials, id)).join(' · ')} <code>{result.coverage.consideredMaterialIds.join(' · ')}</code></p> : null}
          {result.coverage.contextOnlyMaterialIds.length ? <p><strong>Contexte seulement · </strong>{result.coverage.contextOnlyMaterialIds.map(id => materialLabel(materials, id)).join(' · ')}</p> : null}
          {result.coverage.excludedMaterialIds.length ? <p><strong>Identités écartées · </strong>{result.coverage.excludedMaterialIds.map(id => materialLabel(materials, id)).join(' · ')}</p> : null}
          {result.coverage.omittedMaterials.length ? <ul>{result.coverage.omittedMaterials.map(row => <li key={row.materialId}>
            Identité non projetée · {materialLabel(materials, row.materialId)} · {row.reason}
          </li>)}</ul> : null}
          {result.coverage.conditionalMaterials.length ? <ul>{result.coverage.conditionalMaterials.map(row => <li key={row.materialId}>
            Projection conditionnelle · {materialLabel(materials, row.materialId)} · {row.reason}
          </li>)}</ul> : null}
        </details> : null}
        {situation.exclusions.length ? <ul>{situation.exclusions.map(item => <li key={item.materialId}>
          {materialLabel(materials, item.materialId)} · exclusion {certaintyLabels[item.certainty]} · {item.reason}
        </li>)}</ul> : null}
        {situation.constraintChecks?.length ? <section><h4>Contraintes de programme transmises</h4><ul>
          {situation.constraintChecks.map((check, index) => check.kind === 'preservePerformed'
            ? <li key={`check-${index}`}>Conserver les lignes effectuées · <code>{check.additionIds.join(' · ')}</code></li>
            : check.kind === 'excludeMaterials'
              ? <li key={`check-${index}`}>Écarter les matières indiquées · {check.materialIds.map(id => materialLabel(materials, id)).join(' · ')} <code>{check.materialIds.join(' · ')}</code></li>
              : <li key={`check-${index}`}>Vérifier l’emploi {useLabels[check.use]} de {materialLabel(materials, check.materialId)}</li>)}
        </ul></section> : null}
      </details>
    </div>
    {result.options.length ? <div className="hv-qualified-options">
      <p className="hv-qualified-study-note">Conseil qualifié pour cette question et cette situation · l’ordre des voies ne constitue pas un classement.</p>
      <h3>Voies et emplois qualifiés · {result.options.length}</h3>
      <p>Chaque voie présente ses effets, prérequis et sources. Choisir une voie ne fixe ni dose ni emploi au programme.</p>
      {result.options.map(option => <AdviceOptionCard key={option.id} option={option} materials={materials}
        evidenceSources={result.evidenceSources} criterionLabels={criterionLabels} selected={selectedOptionId === option.id}
        onSelect={() => { setSelectedOptionId(option.id); setError(''); }} canSelect={canSelect} />)}
    </div> : <p>Aucune voie n’a été qualifiée dans ce périmètre.</p>}
    {result.informationRequests.length ? <details className="hv-qualified-limits">
      <summary>Informations qui changeraient le choix · {result.informationRequests.length}</summary>
      <ul>{result.informationRequests.map(item => <li key={item.id}><strong>{item.question}</strong><p>{item.whyDecisionChanging}</p></li>)}</ul>
    </details> : null}
    <details className="hv-qualified-limits"><summary>Couverture et limites du conseil</summary>
      <p>{result.coverage.status === 'completeWithinSuppliedScope' ? 'Couverture complète dans le périmètre fourni'
        : result.coverage.status === 'bounded' ? 'Couverture bornée' : 'Couverture partielle'}.</p>
      {result.coverage.limits.map((limit, index) => <p key={`coverage-${index}`}>{limit}</p>)}
      {result.limitations.map((limit, index) => <p key={`limitation-${index}`}>{limit}</p>)}
    </details>
    {result.evidenceSources.length ? <details className="hv-qualified-sources">
      <summary>Sources de l’étude · {result.evidenceSources.length}</summary>
      <ul>{result.evidenceSources.map(source => <li key={source.id}><strong>{source.domain} · {readingLevelLabels[source.readingLevel] ?? source.readingLevel}</strong>
        <p>{source.established}</p><p>{source.limits.join(' ')}</p><p><strong>Référence · </strong><SourceReference source={source.source} /></p>
        {source.locator ? <p>Repère · {source.locator}</p> : null}<code>{source.id}</code>
      </li>)}</ul>
    </details> : null}
    {selectedOption ? <section className="hv-qualified-preference" aria-label="Préférer une voie">
      <h3>Enregistrer une préférence de stratégie</h3>
      <p>La préférence conserve une voie précise avec son interprétation et votre motif. Elle ne contient aucune dose et ne modifie aucun programme.</p>
      <p><strong>Voie choisie · </strong>{selectedOption.title}</p>
      {canSelect ? <label><span>Pourquoi cette voie vous intéresse-t-elle ?</span><Textarea value={reason} onChange={event => setReason(event.currentTarget.value)} rows={3}
        placeholder="Motif de votre choix" /></label>
        : <p>Cette étude se consulte en lecture seule; aucune préférence nouvelle ne peut être enregistrée.</p>}
      {canSelect ? <button type="button" className="hv-qualified-button" disabled={!reason.trim() || pending}
        onClick={() => { void savePreference(); }}>{pending ? 'Conservation…' : 'Conserver cette préférence'}</button> : null}
      {error ? <p role="alert" className="hv-qualified-error">{error}</p> : null}
    </section> : null}
    {!hasPersistedStudy(entry) && !entry.readOnly ? <p className="hv-qualified-muted">Conservez d’abord cette étude pour pouvoir enregistrer une préférence exacte.</p> : null}
  </section>;
}

function originalQuestion(entry: HopV55QualifiedStudyEntry) {
  return entry.kind === 'products' ? entry.study.request.intent.originalQuestion
    : entry.study.requestSnapshot.intent.originalQuestion;
}

function isPersistedProductStudy(entry: HopV55QualifiedStudyEntry): entry is Extract<HopV55QualifiedStudyEntry, { kind: 'products' }> & {
  link: HopV55QualifiedStudyLinkV1; dossier: HopDecisionDossierV2; events: readonly HopDecisionEventV2[];
} {
  return entry.kind === 'products' && !!entry.link && entry.link.kind === 'products'
    && entry.link.formatVersion === 2
    && entry.link.studyReference === entry.studyReference && entry.link.sourceReadingReference === entry.sourceReadingReference
    && !!entry.dossier && entry.dossier.formatVersion === 2 && entry.dossier.study.actionKind === 'understandProducts'
    && hopDecisionReference(entry.dossier.study) === entry.studyReference
    && entry.link.dossierId === entry.dossier.dossierId && entry.link.ownerKey === entry.dossier.ownerKey
    && !!entry.events && validEventChain(entry.events, { ownerKey: entry.dossier.ownerKey, dossierId: entry.dossier.dossierId,
      revision: entry.dossier.revision, formatVersion: 2, firstEventId: entry.link.eventId, lastEventId: entry.dossier.lastEventId });
}

function displayStatus(entry: HopV55QualifiedStudyEntry) {
  return entry.status === 'prepared' ? 'Étude préparée' : entry.status === 'saved' ? 'Étude conservée' : 'Étude archivée';
}

export function HopV55QualifiedStudyPanel({ entry, onSaveProductStudy, onSaveAdviceStudy, onPreferAdvice }: HopV55QualifiedStudyPanelProps) {
  const entryKey = identityForEntry(entry);
  const activeEntryKey = useRef(entryKey);
  activeEntryKey.current = entryKey;
  const [localEntry, setLocalEntry] = useState<{ key: string; entry: HopV55QualifiedStudyEntry } | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ key: string; kind: 'status' | 'error'; message: string } | null>(null);
  const pending = pendingKey === entryKey;
  const current = localEntry?.key === entryKey ? localEntry.entry : entry;
  const actionAllowed = !current.readOnly;
  const alreadyPersisted = current.kind === 'products' ? isPersistedProductStudy(current) : hasPersistedStudy(current);
  const saveAvailable = current.kind === 'products' ? !!onSaveProductStudy : !!onSaveAdviceStudy;

  const saveStudy = async () => {
    if (!actionAllowed || !saveAvailable || alreadyPersisted || pending) return;
    setPendingKey(entryKey);
    setFeedback(null);
    try {
      const request = { sourceReadingReference: current.sourceReadingReference,
        studyReference: current.studyReference, expectedStudyReference: current.studyReference };
      const result = current.kind === 'products'
        ? await onSaveProductStudy!({ ...request, kind: 'products', study: current.study })
        : await onSaveAdviceStudy!({ ...request, kind: 'advice', study: current.study });
      if (activeEntryKey.current !== entryKey) return;
      const confirmed = assertSavedStudyResult(current, result);
      setLocalEntry({ key: entryKey, entry: confirmed });
      setFeedback({ key: entryKey, kind: 'status', message: result.freshContext.status === 'historical'
        ? `Étude retrouvée et conservée dans son contexte historique. ${result.freshContext.reason}`
        : result.status === 'linked' ? 'Étude conservée et rattachée à cette lecture.'
          : 'Étude déjà conservée et relue depuis son dossier lié.' });
    } catch (cause) {
      if (activeEntryKey.current === entryKey) setFeedback({ key: entryKey, kind: 'error',
        message: cause instanceof Error ? cause.message : 'La conservation n’a pas été confirmée.' });
    } finally {
      setPendingKey(currentKey => currentKey === entryKey ? null : currentKey);
    }
  };

  const preferAdvice = async (option: HopAdviceOption, reason: string) => {
    if (current.kind !== 'advice' || !hasPersistedStudy(current) || !onPreferAdvice || current.readOnly) {
      throw new Error('Une étude de conseil conservée et modifiable est requise avant de préférer une voie.');
    }
    if (activeEntryKey.current !== entryKey) throw new Error('L’étude affichée a changé; rechargez ses voies avant de choisir.');
    const request: HopV55QualifiedAdvicePreferenceRequest = {
      expectedLinkReference: current.link.reference,
      expectedDossierId: current.dossier.dossierId,
      expectedDossierRevision: current.dossier.revision,
      expectedStudyReference: current.studyReference,
      expectedOptionId: option.id,
      expectedOptionReference: option.reference,
      reason,
    };
    setFeedback(null);
    const result = await onPreferAdvice(request);
    if (activeEntryKey.current !== entryKey) return;
    const updated = assertPreferenceResult(current, request, result);
    setLocalEntry({ key: entryKey, entry: updated });
    setFeedback({ key: entryKey, kind: 'status', message: 'Préférence de stratégie conservée. Elle ne fixe aucune dose et ne modifie pas le programme.' });
  };

  return <article className="hv-qualified-study" data-study-kind={current.kind} data-study-status={current.status}>
    <header className="hv-qualified-study__header">
      <div>
        <p className="hv-qualified-eyebrow">{entry.kind === 'products' ? 'Étude produit · V2' : 'Conseil de stratégie · V3'}</p>
        <h2>{entry.kind === 'products' ? 'Comprendre les produits examinés' : 'Comparer les voies pour cette question'}</h2>
        <p className="hv-qualified-question-label">Question originale</p>
        <blockquote>{originalQuestion(entry)}</blockquote>
      </div>
      <span className={`hv-qualified-state hv-qualified-state--${current.status}`}>
        {displayStatus(current)}
      </span>
      {current.readOnly ? <span className="hv-qualified-readonly">Lecture seule</span> : null}
    </header>
    {current.recoveryNotice ? <p className="hv-qualified-recovery">{current.recoveryNotice}</p> : null}
    {current.kind === 'products' ? <ProductStudy study={current.study} />
      : <AdviceStudy key={`${entryKey}:${current.dossier?.revision ?? 0}`} entry={current} canSelect={actionAllowed && alreadyPersisted && !!onPreferAdvice}
        onPrefer={preferAdvice} />}
    {current.kind === 'products' && current.dossier ? <details className="hv-qualified-technical"><summary>Historique de conservation</summary>
      <p>Dossier produit · <code>{current.dossier.dossierId}</code> · révision {current.dossier.revision} · {current.events?.length ?? 0} événements</p>
    </details> : null}
    {current.kind === 'advice' && current.dossier ? <details className="hv-qualified-technical"><summary>Historique de conservation</summary>
      <p>Dossier de conseil · <code>{current.dossier.dossierId}</code> · révision {current.dossier.revision} · {current.events?.length ?? 0} événements</p>
      {current.events?.some(event => event.kind === 'strategyPreferred') ? <details>
        <summary>Préférences de stratégie enregistrées · {current.events.filter((event): event is Extract<HopAdviceEventV3, { kind: 'strategyPreferred' }> => event.kind === 'strategyPreferred').length}</summary>
        <ul>{current.events.filter((event): event is Extract<HopAdviceEventV3, { kind: 'strategyPreferred' }> => event.kind === 'strategyPreferred').map(event => {
          const option = current.study.responseSnapshot.result.options.find(row => row.id === event.payload.optionId
            && row.reference === event.payload.optionReference);
          return <li key={event.eventId}>
            <strong>Voie préférée · </strong>{option?.title ?? 'Voie du résultat conservé'}
            <p><strong>Interprétation · </strong>{event.payload.interpretation || 'aucune interprétation complémentaire déclarée'}</p>
            <p><strong>Motif · </strong>{event.payload.reason}</p>
            <details><summary>Identité exacte de la voie</summary><code>{event.payload.optionId} · {event.payload.optionReference}</code></details>
          </li>;
        })}</ul>
      </details> : null}
    </details> : null}
    {!alreadyPersisted && saveAvailable && !current.readOnly ? <section className="hv-qualified-save">
      <p>{current.kind === 'products' ? 'Conservez l’étude produit et les fiches examinées dans leur dossier.'
        : 'Conservez d’abord le conseil qualifié; une préférence de voie restera un geste séparé.'}</p>
      <button type="button" className="hv-qualified-button" disabled={pending} onClick={() => { void saveStudy(); }}>
        {pending ? 'Conservation…' : current.kind === 'products' ? 'Conserver cette étude produit' : 'Conserver cette étude de conseil'}
      </button>
    </section> : null}
    {feedback?.key === entryKey ? <p role={feedback.kind === 'status' ? 'status' : 'alert'}
      className={feedback.kind === 'status' ? 'hv-qualified-success' : 'hv-qualified-error'}>{feedback.message}</p> : null}
    <details className="hv-qualified-technical"><summary>Détails de provenance</summary>
      <p>Lecture source · <code>{current.sourceReadingReference}</code></p>
      <p>Étude exacte · <code>{current.studyReference}</code></p>
      {current.link ? <p>Lien de dossier · <code>{current.link.reference}</code></p> : null}
    </details>
  </article>;
}

