import React, { useMemo, useState } from 'react';
import type { HopSource } from '../../../functions/src/hopIndexSchema';
import { compareHopPrograms } from '../../domain/hopDecision/programAnalysis';
import { programFingerprint } from '../../domain/hopDecision/programs';
import { hopAdviceContentReference } from '../../domain/hopDecision/adviceContentReference';
import { availableHopUses } from '../../domain/hopDecision/substitution';
import type {
  HopDecisionMaterial,
  HopDecisionProgram,
  HopNumericResult,
  HopReplacementBasis,
  HopUse,
} from '../../domain/hopDecision/types';
import {
  prepareHopV55DecisionProgram,
  type HopV55DecisionProgramPreparationV1,
  type HopV55ProgramNeedV1,
  type PrepareHopV55DecisionProgramInput,
} from '../../services/hopV55/decisionProgramPreparation';
import type { HopV55Intent } from '../../services/hopV55/contracts';
import { readHopV55DecisionReadingArchive } from '../../services/hopV55/decisionArchive';
import type { HopV55DecisionReadingArchiveV4 } from '../../services/hopV55/decisionArchive';
import { readHopV55ExplorationTrialOriginContextV1 } from '../../services/hopV55/explorationTrialPreparation';
import type { HopV55ExplorationTrialOriginContextV1 } from '../../services/hopV55/explorationTrialPreparation';
import { Input, Textarea } from '../Input';
import { formatDecimal } from '../numericInput';
import { HopV55ExactInput } from './ExactInput';
import {
  createHopV55ContextualComparisonSnapshot,
  createHopV55ExplorationProfile,
  HOP_V55_CONFRONTATION_DIRECTIONS,
  HOP_V55_EXPLORATION_TRIAL_FORMAT,
  HOP_V55_FORM_LABELS,
  HOP_V55_USE_OPTIONS,
  hopV55DirectionLabel,
  hopV55ExplorationProfileDraftErrors,
  hopV55ExplorationProfileHistory,
  readHopV55ExplorationProfile,
  hopV55MaterialLabel,
  hopV55TrialFreshness,
  hopV55TrialOperations,
  hopV55UseLabel,
  type HopV55ConfrontationCriterion,
  type HopV55ContextualComparisonSnapshotV1,
  type HopV55ConfrontationDirection,
  type HopV55ConfrontationOrigin,
  type HopV55CriterionReadingKind,
  type HopV55DocumentaryShift,
  type HopV55DocumentarySide,
  type HopV55DocumentarySideStatus,
  type HopV55DocumentarySubject,
  type HopV55ExplorationFamily,
  type HopV55ExplorationProfileDraft,
  type HopV55ExplorationProfileHistory,
  type HopV55ExplorationProfileStatus,
  type HopV55ExplorationProfileV1,
  type HopV55ExplorationTrialRequestV1,
  type HopV55TrialLineDraft,
} from './contextualExplorationModel';
import './contextual-exploration.css';

const ANALYTE_LABELS: Record<string, string> = {
  alpha: 'Acides alpha', beta: 'Acides bêta', totalOil: 'Huile totale', myrcene: 'Myrcène', linalool: 'Linalol',
  geraniol: 'Géraniol', citronellol: 'Citronellol', humulene: 'Humulène', caryophyllene: 'Caryophyllène',
  '4mmpFree': '4MMP libre', '4mmpCys': '4MMP liée à la cystéine', '4mmpGsh': '4MMP liée au glutathion',
  '3mhFree': '3MH libre', '3mhCys': '3MH liée à la cystéine', '3mhGsh': '3MH liée au glutathion',
  '3mhGluCys': '3MH liée au γ-glutamyl-cystéine', '3mhCysGly': '3MH liée à la cystéinylglycine',
  '3s4mpFree': '3S4MP libre', '3mhaFree': '3MHA libre', '2methylbutylIsobutyrate': '2-méthylbutyl isobutyrate',
  gammaNonalactone: 'γ-nonalactone', hsi: 'Indice HSI',
};

const SCOPE_LABELS: Record<string, string> = {
  lot: 'analyse du lot', variety: 'référence variétale', declaration: 'valeur saisie', unknown: 'portée inconnue',
};

const SIDE_LABELS: Record<HopV55DocumentarySideStatus, string> = {
  documented: 'mentionné',
  negated: 'mentionné par une négation',
  mixed: 'mentions affirmées et négatives',
  nonDocumented: 'non mentionné dans les textes chargés',
  noDescriptions: 'aucune description chargée · inconnu',
  unresolved: 'lecture non résolue · inconnu',
};

const SHIFT_LABELS: Record<HopV55DocumentaryShift, string> = {
  alternativeOnly: 'Mention ajoutée dans la description de l’alternative · aucune mesure sensorielle',
  sourceOnly: 'Mention présente dans la source initiale seulement · pas une perte mesurée',
  shared: 'Mention dans les deux descriptions · contexte de chaque citation conservé',
  neither: 'Aucune mention dans ces descriptions · inconnu, pas zéro',
  unknown: 'Une description manque · comparaison indéterminée',
};

const READING_LABELS: Record<HopV55CriterionReadingKind, string> = {
  documentedSupport: 'Mention dans la source alternative',
  documentedTension: 'Mention à examiner dans la source alternative',
  possibleLoss: 'Mention dans la source uniquement · pas une perte mesurée',
  shared: 'Mention dans les deux descriptions · niveau inconnu',
  notMentioned: 'Non mentionné · pas une garantie',
  unknown: 'Inconnu',
  informational: 'À examiner',
  notEvaluated: 'Non évalué',
};

const CONTEXT_LABELS: Record<string, string> = {
  rawHop: 'houblon brut', infusion: 'infusion', beer: 'bière', unspecified: 'contexte non précisé',
};

const SEMANTIC_SENSE_LABELS: Record<HopV55DecisionReadingArchiveV4['reading']['annotations'][number]['sense'], string> = {
  qualitativeTarget: 'cible qualitative', directedChange: 'changement choisi', guard: 'garde', exclusion: 'exclusion',
  reportedObservation: 'constat rapporté', investigation: 'enquête', nonDecision: 'non-décision', mention: 'mention',
};

const BASIS_LABELS: Record<HopReplacementBasis, string> = {
  sameMass: 'Même masse', alphaLoad: 'Charge d’acides alpha', totalOil: 'Huile totale', manufacturer: 'Convention fabricant',
};

const NEED_LABELS: Record<HopV55ProgramNeedV1['field'], string> = {
  operations: 'Opérations à préciser', source: 'Ligne source à choisir', target: 'Matière cible à choisir', quantity: 'Quantité à préciser',
  use: 'Emploi à choisir', conditions: 'Conditions à préciser', basis: 'Convention à choisir', coverage: 'Portée à choisir',
  candidateMaterials: 'Matières candidates à choisir', replacementPath: 'Voie à choisir', reason: 'Motif à préciser', freshness: 'Contexte à relire',
};

function number(value: number): string {
  return formatDecimal(value);
}

function numericText(value: HopNumericResult): string {
  if (value.status === 'unknown') return `Inconnu · ${value.reasons[0] ?? 'aucune valeur disponible'}`;
  if (value.status === 'conflict') return `Conflit · ${value.reasons[0] ?? 'références divergentes à départager'}`;
  if (value.status === 'range' && value.range) return `${number(value.range.min)}–${number(value.range.max)} ${value.unit} · plage rapportée, sans centre`;
  if (value.value !== null) return `${number(value.value)} ${value.unit} · valeur rapportée`;
  return `Inconnu · ${value.reasons[0] ?? 'aucune valeur affichable'}`;
}

function uniqueSources(sources: HopSource[]): HopSource[] {
  const seen = new Set<string>();
  return sources.filter((source) => {
    const key = JSON.stringify(source);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function SourceCitation({ source }: { source: HopSource }) {
  const isLink = /^https?:\/\//i.test(source.reference);
  const meta = [source.author, source.year === null ? '' : String(source.year)].filter(Boolean).join(' · ');
  return (
    <span className="hv-context__source">
      <span>{source.title}</span>
      {meta ? <span className="hv-context__muted"> — {meta}</span> : null}
      {isLink ? <a href={source.reference} target="_blank" rel="noreferrer" aria-label={`Consulter la source ${source.title}`}>Consulter</a> : null}
    </span>
  );
}

function originLabel(origin: HopV55ConfrontationOrigin): string {
  if (origin.kind === 'intent') return 'Question actuelle';
  return `${origin.status === 'target' ? 'Profil cible' : 'Profil hypothèse'} « ${origin.label} » · ${origin.persisted ? 'conservé' : 'brouillon non conservé'}`;
}

function Mentions({ side, label }: { side: HopV55DocumentarySide; label: string }) {
  if (!side.mentions.length) return <p className="hv-context__unknown">{label} · {side.reason ?? SIDE_LABELS[side.status]}</p>;
  return (
    <ul className="hv-context__mentions" aria-label={`Citations ${label.toLowerCase()}`}>
      {side.mentions.map((mention, index) => (
        <li key={`${mention.term}-${mention.source.reference}-${index}`}>
          <blockquote>« {mention.text} »</blockquote>
          <small>
            {label} · « {mention.term} » · {CONTEXT_LABELS[mention.context] ?? mention.context} ·{' '}
            {mention.qualification === 'negated' ? 'négation configurée' : mention.qualification === 'qualified' ? `qualifié : ${mention.qualifierTerm}` : 'occurrence textuelle'}
          </small>
          <SourceCitation source={mention.source} />
        </li>
      ))}
    </ul>
  );
}

function SideSummary({ label, side }: { label: string; side: HopV55DocumentarySide }) {
  return (
    <p className={`hv-context__side is-${side.status}`}>
      <b>{label}</b> · {SIDE_LABELS[side.status]}
      {side.contexts.length ? <span className="hv-context__muted"> · {side.contexts.map((context) => CONTEXT_LABELS[context] ?? context).join(', ')}</span> : null}
    </p>
  );
}

function MaterialPicker({ label, value, materials, programMaterialIds, otherId, onChange }: {
  label: string;
  value: string;
  materials: HopDecisionMaterial[];
  programMaterialIds: ReadonlySet<string>;
  otherId: string;
  onChange(id: string): void;
}) {
  const inProgram = materials.filter((material) => programMaterialIds.has(material.id));
  const others = materials.filter((material) => !programMaterialIds.has(material.id));
  const missing = value && !materials.some((material) => material.id === value);
  const option = (material: HopDecisionMaterial) => (
    <option key={material.id} value={material.id} disabled={material.id === otherId}>{hopV55MaterialLabel(material)}</option>
  );
  return (
    <label className="hv-context__field">
      <span>{label}</span>
      <select aria-label={`${label} de la comparaison`} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Choisir une identité exacte</option>
        {missing ? <option value={value}>Identité absente du contexte chargé · {value}</option> : null}
        {inProgram.length ? <optgroup label="Dans le programme de référence">{inProgram.map(option)}</optgroup> : null}
        <optgroup label="Catalogue chargé">{others.map(option)}</optgroup>
      </select>
    </label>
  );
}

export interface HopV55ContextualComparisonPanelProps {
  materials: HopDecisionMaterial[];
  families: HopV55ExplorationFamily[];
  subjectFor(material: HopDecisionMaterial): HopV55DocumentarySubject | undefined;
  programMaterialIds: ReadonlySet<string>;
  sourceId: string;
  alternativeId: string;
  onSourceChange(id: string): void;
  onAlternativeChange(id: string): void;
  criteria: HopV55ConfrontationCriterion[];
  /** Exact, already archived V4 source; displayed read-only and never reparsed. */
  readingArchive?: HopV55DecisionReadingArchiveV4;
  /** Comparison inputs and render result sealed together by the parent. */
  comparisonSnapshot?: HopV55ContextualComparisonSnapshotV1;
  trialAction?: { label: string; hint?: string; disabled?: boolean; onClick(): void };
  children?: React.ReactNode;
}

/** Documentary source → alternative comparison outside any recipe. */
export function HopV55ContextualComparisonPanel({
  materials, families, subjectFor, programMaterialIds, sourceId, alternativeId,
  onSourceChange, onAlternativeChange, criteria, readingArchive, comparisonSnapshot, trialAction, children,
}: HopV55ContextualComparisonPanelProps) {
  const source = materials.find((material) => material.id === sourceId);
  const alternative = materials.find((material) => material.id === alternativeId);
  const built = useMemo(() => {
    if (!source || !alternative) return undefined;
    try {
      const exact = comparisonSnapshot?.sourceId === source.id && comparisonSnapshot.alternativeId === alternative.id
        ? comparisonSnapshot
        : createHopV55ContextualComparisonSnapshot({
          source, alternative, sourceSubject: subjectFor(source), alternativeSubject: subjectFor(alternative), families, criteria,
          readingReference: readingArchive?.contentReference ?? null,
        });
      return { comparison: exact.comparison };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Comparaison impossible dans ce contexte.' };
    }
  }, [source, alternative, families, criteria, subjectFor, comparisonSnapshot, readingArchive?.contentReference]);
  const comparison = built?.comparison;
  const archivedRead = useMemo(() => readingArchive ? readHopV55DecisionReadingArchive(readingArchive) : undefined, [readingArchive]);
  const semanticArchive = archivedRead?.status === 'available' && archivedRead.archive.format === 'hop-v55-decision-reading-v4'
    ? archivedRead.archive : undefined;
  const movingFamilies = comparison?.families.filter((row) => row.shift === 'alternativeOnly' || row.shift === 'sourceOnly' || row.shift === 'shared') ?? [];
  const order: HopV55DocumentaryShift[] = ['alternativeOnly', 'sourceOnly', 'shared'];
  movingFamilies.sort((a, b) => order.indexOf(a.shift) - order.indexOf(b.shift));
  const silentFamilies = comparison?.families.filter((row) => row.shift === 'neither') ?? [];
  const unknownFamilies = comparison?.families.filter((row) => row.shift === 'unknown') ?? [];
  const analyticalSources = comparison
    ? uniqueSources(comparison.analytical.readable.flatMap((row) => [...row.left.sources, ...row.right.sources]))
    : [];

  return (
    <section className="hv-context" aria-labelledby="hv-context-title">
      <div className="hv-context__head">
        <p className="hop-v55-explorer__eyebrow">Confronter hors recette</p>
        <h3 id="hv-context-title">Source → alternative</h3>
        <p className="hv-context__lead">Compare deux identités exactes : faits analytiques, descriptions sourcées selon leur contexte et ton intention. Rien n’est appliqué ni choisi à ta place.</p>
      </div>
      {children}
      {semanticArchive ? (
        <section className="hv-context__block" aria-label="Question archivée et annotations sémantiques">
          <p className="hv-context__note">
            Lecture archivée exacte · {semanticArchive.reading.annotations.length} annotations · {semanticArchive.reading.projectionCoverage.notProjected.length} non transmises au moteur historique.
            Aucune relecture de la question n’est faite ici.
          </p>
          <details className="hv-context__details">
            <summary>Question et annotations V4 · source {semanticArchive.id}</summary>
            <p className="hv-context__muted">{semanticArchive.reading.intent.question}</p>
            <ul className="hv-context__readings" aria-label="Annotations exactes de la question archivée">
              {semanticArchive.reading.annotations.map((annotation) => (
                <li key={annotation.id} className="hv-context__reading">
                  <div className="hv-context__family-head">
                    <b>{annotation.term}</b>
                    <span className="hv-context__badge">{SEMANTIC_SENSE_LABELS[annotation.sense]}</span>
                  </div>
                  <p><b>Extrait source :</b> « {annotation.source.text} » · {annotation.origin === 'brasseur' ? 'correction du brasseur' : 'lecture initiale'}</p>
                  {annotation.qualification ? <p><b>Qualification exacte :</b> « {annotation.qualification} »</p> : null}
                  {annotation.qualifierSource ? <p><b>Fragment source du qualificatif :</b> « {annotation.qualifierSource.text} »</p> : null}
                  {annotation.note ? <p><b>Note de lecture :</b> {annotation.note}</p> : null}
                  {annotation.frameSource ? <p><b>Cadre exact :</b> « {annotation.frameSource.text} »</p> : null}
                  {annotation.primitiveConvention ? <p><b>Convention de projection primitive :</b> {annotation.primitiveConvention} · le sens archivé ci-dessus reste la référence.</p> : null}
                  {annotation.guard ? <p><b>Garde archivée :</b> {annotation.guard}</p> : null}
                  {annotation.inquiry ? <p><b>Enquête archivée :</b> {annotation.inquiry}</p> : null}
                  {annotation.mentionKind ? <p><b>Type de mention :</b> {annotation.mentionKind}</p> : null}
                  {annotation.subject ? <p><b>Sujet :</b> {annotation.subject.kind}{annotation.subject.source ? ` · « ${annotation.subject.source.text} »` : ''}</p> : null}
                  {annotation.instrumentSource ? <p><b>Moyen mentionné, non choisi :</b> « {annotation.instrumentSource.text} »</p> : null}
                  {annotation.partner ? <p><b>Contexte partenaire :</b> {annotation.partner.text}</p> : null}
                  {annotation.familyId ? <p><b>Famille archivée :</b> {annotation.familyId}</p> : null}
                  {annotation.dimension ? <p><b>Dimension archivée :</b> {annotation.dimension}</p> : null}
                  {annotation.reportedProblem ? <p><b>Écart rapporté :</b> {annotation.reportedProblem}</p> : null}
                  <p><b>Projection :</b> {annotation.requirement === 'required' ? 'engagée' : 'optionnelle'} · {annotation.direction ?? 'sans direction'} · lexique {annotation.lexicon.status}
                    {annotation.lexicon.status === 'proposedAlias' ? ` · alias proposé ${annotation.lexicon.canonicalTerm}` : ''}
                    {'key' in annotation.lexicon && annotation.lexicon.key ? ` · ${annotation.lexicon.key}` : ''}</p>
                  {annotation.relatedAnnotationIds.length ? <p className="hv-context__muted">Annotations liées : {annotation.relatedAnnotationIds.join(', ')}</p> : null}
                </li>
              ))}
            </ul>
            <p className="hv-context__muted">
              Couverture primitive : {semanticArchive.reading.projectionCoverage.included.length} annotation{semanticArchive.reading.projectionCoverage.included.length === 1 ? '' : 's'} projetée{semanticArchive.reading.projectionCoverage.included.length === 1 ? '' : 's'};
              {semanticArchive.reading.projectionCoverage.notProjected.length ? ' non projetées : ' : ' aucune omission déclarée.'}
              {semanticArchive.reading.projectionCoverage.notProjected.map((row) => `${row.annotationId} (${row.reason})`).join(' · ')}
            </p>
          </details>
        </section>
      ) : (
        <p className="hv-context__unknown" role="status">
          {readingArchive
            ? `Lecture archivée V4 refusée par son lecteur strict${archivedRead?.status === 'invalidRecord' ? ` : ${archivedRead.reason}` : ''}. La comparaison reste limitée aux critères de l’intention; aucune annotation n’est déduite.`
            : 'Couverture partielle : la comparaison utilise seulement les critères de l’intention transmise. Aucune lecture sémantique V4 archivée n’est jointe; les cibles qualitatives et constats de la question ne sont pas consultés.'}
        </p>
      )}
      <div className="hv-context__pickers">
        <MaterialPicker label="Source" value={sourceId} materials={materials} programMaterialIds={programMaterialIds}
          otherId={alternativeId} onChange={onSourceChange} />
        <button type="button" className="hv-context__swap" aria-label="Inverser la source et l’alternative"
          disabled={!sourceId && !alternativeId}
          onClick={() => { const nextSource = alternativeId; onAlternativeChange(sourceId); onSourceChange(nextSource); }}>⇄</button>
        <MaterialPicker label="Alternative" value={alternativeId} materials={materials} programMaterialIds={programMaterialIds}
          otherId={sourceId} onChange={onAlternativeChange} />
      </div>

      {!source || !alternative ? (
        <p className="hv-context__empty" role="status">
          {sourceId && !source || alternativeId && !alternative
            ? 'Une identité choisie n’est plus chargée dans ce contexte; choisis-la à nouveau. Aucune remplaçante n’est déduite.'
            : 'Choisis une source et une alternative. Une recherche, une famille ou l’ordre du catalogue ne sélectionnent aucune fiche.'}
        </p>
      ) : built?.error ? (
        <p className="hv-context__error" role="alert">{built.error}</p>
      ) : comparison ? (
        <div className="hv-context__result" aria-live="polite">
          <div className="hv-context__identities">
            {[{ role: 'Source', material: source }, { role: 'Alternative', material: alternative }].map(({ role, material }) => (
              <article key={role} className="hv-context__identity">
                <span className="hv-context__muted">{role}</span>
                <b>{material.name}</b>
                <span>{[HOP_V55_FORM_LABELS[material.form] ?? 'Forme inconnue', material.lot?.lotNumber ? `lot ${material.lot.lotNumber}` : ''].filter(Boolean).join(' · ')}</span>
                <details><summary>Identité exacte</summary><code>{material.id}</code></details>
              </article>
            ))}
          </div>
          {comparison.identityNotes.map((note) => <p key={note} className="hv-context__note">{note}</p>)}

          <section className="hv-context__block" aria-labelledby="hv-context-families-title">
            <h4 id="hv-context-families-title">Ce que disent les descriptions</h4>
            <p className="hv-context__muted">Lecture lexicale des familles chargées, négations comprises. Une mention n’est pas une intensité; le contexte (houblon brut, infusion, bière) garde sa portée.</p>
            {movingFamilies.length ? (
              <ul className="hv-context__families">
                {movingFamilies.map((row) => (
                  <li key={row.family.key} className={`hv-context__family is-${row.shift}`}>
                    <div className="hv-context__family-head"><b>{row.family.name}</b><span className="hv-context__badge">{SHIFT_LABELS[row.shift]}</span></div>
                    <SideSummary label="Source" side={row.source} />
                    <SideSummary label="Alternative" side={row.alternative} />
                    <details>
                      <summary>Citations et sources · {row.source.mentions.length + row.alternative.mentions.length}</summary>
                      <Mentions label="Source" side={row.source} />
                      <Mentions label="Alternative" side={row.alternative} />
                      <p className="hv-context__muted">Termes exacts : {row.family.terms.join(' · ')}</p>
                    </details>
                  </li>
                ))}
              </ul>
            ) : <p className="hv-context__unknown">Aucun écart documentaire lisible dans les familles chargées : les familles restantes sont sans mention ou inconnues.</p>}
            {silentFamilies.length || unknownFamilies.length ? (
              <details className="hv-context__details">
                <summary>{silentFamilies.length} famille{silentFamilies.length === 1 ? '' : 's'} sans mention · {unknownFamilies.length} inconnue{unknownFamilies.length === 1 ? '' : 's'}</summary>
                <ul className="hv-context__compact-list">
                  {[...silentFamilies, ...unknownFamilies].map((row) => (
                    <li key={row.family.key}><b>{row.family.name}</b> · {SHIFT_LABELS[row.shift]}</li>
                  ))}
                </ul>
              </details>
            ) : null}
          </section>

          <section className="hv-context__block" aria-labelledby="hv-context-analysis-title">
            <h4 id="hv-context-analysis-title">Faits analytiques</h4>
            {comparison.analytical.readable.length ? (
              <div className="hv-context__table" role="region" aria-label="Faits analytiques comparés" tabIndex={0}>
                <table>
                  <thead><tr><th>Analyse</th><th>Source</th><th>Alternative</th><th>Alternative − source</th></tr></thead>
                  <tbody>
                    {comparison.analytical.readable.map((row) => (
                      <tr key={row.analyte} className={row.left.status === 'conflict' || row.right.status === 'conflict' ? 'is-conflict' : undefined}>
                        <th scope="row">{ANALYTE_LABELS[row.analyte] ?? row.analyte}</th>
                        <td>{numericText(row.left)}<small>{SCOPE_LABELS[row.left.scope] ?? row.left.scope}</small></td>
                        <td>{numericText(row.right)}<small>{SCOPE_LABELS[row.right.scope] ?? row.right.scope}</small></td>
                        <td>{numericText(row.difference)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="hv-context__unknown">Aucune analyse lisible pour ces deux matières. Les champs inconnus ne sont pas traités comme zéro.</p>}
            {comparison.analytical.conflicts.length ? (
              <p className="hv-context__note" role="status">Références divergentes conservées sans moyenne : {comparison.analytical.conflicts.map((analyte) => ANALYTE_LABELS[analyte] ?? analyte).join(', ')}.</p>
            ) : null}
            {comparison.analytical.unknownBoth.length ? (
              <details className="hv-context__details">
                <summary>{comparison.analytical.unknownBoth.length} analyses inconnues des deux côtés</summary>
                <p className="hv-context__muted">{comparison.analytical.unknownBoth.map((analyte) => ANALYTE_LABELS[analyte] ?? analyte).join(' · ')}</p>
              </details>
            ) : null}
            {analyticalSources.length ? (
              <details className="hv-context__details"><summary>Sources analytiques · {analyticalSources.length}</summary>
                <div className="hv-context__sources">{analyticalSources.map((sourceRef, index) => <SourceCitation key={`${sourceRef.reference}-${index}`} source={sourceRef} />)}</div>
              </details>
            ) : null}
          </section>

          <section className="hv-context__block" aria-labelledby="hv-context-intent-title">
            <h4 id="hv-context-intent-title">Confrontation à l’intention</h4>
            {comparison.confrontation.length ? (
              <ul className="hv-context__readings">
                {comparison.confrontation.map((reading) => (
                  <li key={reading.criterion.id} className={`hv-context__reading is-${reading.kind}`}>
                    <span className="hv-context__muted">{originLabel(reading.criterion.origin)}</span>
                    <div className="hv-context__family-head">
                      <b>{hopV55DirectionLabel(reading.criterion.direction)} · {reading.criterion.label}</b>
                      <span className="hv-context__badge">{READING_LABELS[reading.kind]}</span>
                    </div>
                    <p>{reading.reason}</p>
                    {reading.source && reading.alternative ? (
                      <details>
                        <summary>{reading.family ? `Famille ${reading.family.name}` : `Terme exact « ${reading.criterion.freeTerm} »`} · citations</summary>
                        <Mentions label="Source" side={reading.source} />
                        <Mentions label="Alternative" side={reading.alternative} />
                      </details>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : <p className="hv-context__unknown">Aucun critère structuré : la question n’en porte pas et aucun profil n’est choisi comme lentille.</p>}
          </section>

          <details className="hv-context__guard">
            <summary>Ce que cette comparaison ne conclut pas</summary>
            <ul>
              {[...comparison.nonConclusions, ...comparison.material.limits].map((line) => <li key={line}>{line}</li>)}
              <li>Aucun guide de style n’est vérifié ici. Un style structuré se choisit dans la planification; un profil libre reste une cible ou une hypothèse locale.</li>
            </ul>
          </details>
          {trialAction ? (
            <div className="hv-context__trial-action">
              <button type="button" className="hv-context__primary" disabled={trialAction.disabled} onClick={trialAction.onClick}>{trialAction.label}</button>
              {trialAction.hint ? <p className="hv-context__muted">{trialAction.hint}</p> : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

/* ---------- Free profile ---------- */

interface CriterionDraftRow {
  key: string;
  direction: HopV55ConfrontationDirection | '';
  label: string;
  link: '' | 'family' | 'term';
  familyKey: string;
  freeTerm: string;
}

function emptyCriterionRow(key: string): CriterionDraftRow {
  return { key, direction: '', label: '', link: '', familyKey: '', freeTerm: '' };
}

function rowsFromProfile(profile: HopV55ExplorationProfileV1): CriterionDraftRow[] {
  return profile.criteria.map((criterion) => ({
    key: criterion.id,
    direction: criterion.direction,
    label: criterion.label,
    link: criterion.family ? 'family' : 'term',
    familyKey: criterion.family?.key ?? '',
    freeTerm: criterion.freeTerm ?? '',
  }));
}

export interface HopV55ExplorationProfilePanelProps {
  families: HopV55ExplorationFamily[];
  history: HopV55ExplorationProfileHistory;
  sessionProfile?: HopV55ExplorationProfileV1;
  activeKey: string;
  onActiveKeyChange(key: string): void;
  onSessionProfile(profile: HopV55ExplorationProfileV1): void;
  /** Page seam: appends the profile to the workspace; absent means no durable save exists here. */
  onDeclare?(profile: HopV55ExplorationProfileV1): void | Promise<void>;
  newId(): string;
  now(): string;
}

export const SESSION_PROFILE_KEY = 'session';

export function HopV55ExplorationProfilePanel({
  families, history, sessionProfile, activeKey, onActiveKeyChange, onSessionProfile, onDeclare, newId, now,
}: HopV55ExplorationProfilePanelProps) {
  const [open, setOpen] = useState(false);
  const [revising, setRevising] = useState<HopV55ExplorationProfileV1>();
  const [label, setLabel] = useState('');
  const [status, setStatus] = useState<HopV55ExplorationProfileStatus | ''>('');
  const [description, setDescription] = useState('');
  const [rows, setRows] = useState<CriterionDraftRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState('');
  const sessionPersisted = !!sessionProfile && history.history.some((profile) => profile.reference === sessionProfile.reference);
  const familyByKey = new Map(families.map((family) => [family.key, family]));

  const startForm = (profile?: HopV55ExplorationProfileV1) => {
    setRevising(profile);
    setLabel(profile?.label ?? '');
    setStatus(profile?.status ?? '');
    setDescription(profile?.description ?? '');
    setRows(profile ? rowsFromProfile(profile) : []);
    setErrors([]);
    setOpen(true);
  };

  const draft = (): HopV55ExplorationProfileDraft => ({
    label, status, description,
    criteria: rows.map((row) => {
      const family = row.link === 'family' ? familyByKey.get(row.familyKey) : undefined;
      return {
        ...(revising?.criteria.some((criterion) => criterion.id === row.key) ? { id: row.key } : {}),
        direction: row.direction as HopV55ConfrontationDirection,
        label: row.label,
        ...(family ? { family: { key: family.key, axisId: family.axisId, version: family.version, name: family.name, terms: [...family.terms] } } : {}),
        ...(row.link === 'term' ? { freeTerm: row.freeTerm } : {}),
      };
    }),
  });

  const submit = () => {
    const value = draft();
    const found = hopV55ExplorationProfileDraftErrors(value);
    if (found.length) { setErrors(found); return; }
    try {
      const profile = createHopV55ExplorationProfile(value, {
        recordedAt: now(), profileId: revising?.profileId ?? `exploration-profile:${newId()}`, previous: revising, newId,
      });
      onSessionProfile(profile);
      onActiveKeyChange(SESSION_PROFILE_KEY);
      setSaveError('');
      setOpen(false);
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Profil invalide.']);
    }
  };

  const declare = async () => {
    if (!sessionProfile || !onDeclare || busy) return;
    setBusy(true); setSaveError('');
    try { await onDeclare(structuredClone(sessionProfile)); }
    catch (error) { setSaveError(error instanceof Error ? error.message : 'Le profil n’a pas été conservé; il reste un brouillon de cette vue.'); }
    finally { setBusy(false); }
  };

  const updateRow = (key: string, patch: Partial<CriterionDraftRow>) => {
    setRows((current) => current.map((row) => row.key === key ? { ...row, ...patch } : row));
    setErrors([]);
  };

  return (
    <div className="hv-context__profile">
      <div className="hv-context__lens">
        <label className="hv-context__field">
          <span>Lentille de confrontation</span>
          <select aria-label="Lentille de confrontation" value={activeKey} onChange={(event) => onActiveKeyChange(event.target.value)}>
            <option value="">Question actuelle seulement</option>
            {sessionProfile && !sessionPersisted ? <option value={SESSION_PROFILE_KEY}>{sessionProfile.label} · brouillon non conservé</option> : null}
            {history.history.filter((profile) => profile.reference === activeKey && !history.latest.includes(profile)).map((profile) => (
              <option key={profile.reference} value={profile.reference}>{profile.label} · v{profile.version} · version antérieure gardée comme lentille</option>
            ))}
            {history.latest.map((profile) => (
              <option key={profile.reference} value={profile.reference}>
                {profile.label} · {profile.status === 'target' ? 'cible' : 'hypothèse'} · v{profile.version}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="hv-context__secondary" onClick={() => open ? setOpen(false) : startForm()}>
          {open ? 'Fermer le profil' : 'Déclarer un profil libre'}
        </button>
      </div>
      <p className="hv-context__muted">Un profil libre est une cible ou une hypothèse déclarée par toi : ni recette, ni fait du brassin, ni guide de style, même si son nom évoque un style.</p>

      {sessionProfile && !sessionPersisted ? (
        <div className="hv-context__session" role="status">
          <b>{sessionProfile.label}</b> · {sessionProfile.status === 'target' ? 'cible' : 'hypothèse'} · brouillon de cette vue, non conservé
          {onDeclare ? (
            <button type="button" className="hv-context__secondary" disabled={busy} onClick={() => void declare()}>
              {busy ? 'Conservation…' : 'Conserver ce profil dans l’espace'}
            </button>
          ) : <small>La conservation n’est pas raccordée ici : ce brouillon disparaît au rechargement.</small>}
          {saveError ? <small role="alert" className="hv-context__error">{saveError}</small> : null}
        </div>
      ) : null}

      {open ? (
        <form className="hv-context__profile-form" autoComplete="off" onSubmit={(event) => { event.preventDefault(); submit(); }}>
          <h4>{revising ? `Réviser « ${revising.label} » · nouvelle version` : 'Profil libre de bière'}</h4>
          <label className="hv-context__field"><span>Nom du profil</span>
            <Input aria-label="Nom du profil" value={label} onChange={(event) => { setLabel(event.target.value); setErrors([]); }} />
          </label>
          <fieldset className="hv-context__fieldset">
            <legend>Statut</legend>
            <label><input type="radio" name="hv-context-profile-status" checked={status === 'target'} onChange={() => { setStatus('target'); setErrors([]); }} /> Cible visée</label>
            <label><input type="radio" name="hv-context-profile-status" checked={status === 'hypothesis'} onChange={() => { setStatus('hypothesis'); setErrors([]); }} /> Hypothèse à tester</label>
          </fieldset>
          <label className="hv-context__field"><span>Description dans tes mots</span>
            <Textarea aria-label="Description dans tes mots" value={description} onChange={(event) => { setDescription(event.target.value); setErrors([]); }}
              placeholder="Conservée telle quelle; aucun chiffre ni style n’en est déduit." />
          </label>
          <ol className="hv-context__criteria-form">
            {rows.map((row, index) => (
              <li key={row.key}>
                <div className="hv-context__row-grid">
                  <label className="hv-context__field"><span>Relation du critère {index + 1}</span>
                    <select aria-label={`Relation du critère ${index + 1}`} value={row.direction}
                      onChange={(event) => updateRow(row.key, { direction: event.target.value as HopV55ConfrontationDirection | '' })}>
                      <option value="">Choisir</option>
                      {HOP_V55_CONFRONTATION_DIRECTIONS.map((direction) => <option key={direction.value} value={direction.value}>{direction.label}</option>)}
                    </select>
                  </label>
                  <label className="hv-context__field"><span>Formulation du critère {index + 1}</span>
                    <Input aria-label={`Formulation du critère ${index + 1}`} value={row.label} onChange={(event) => updateRow(row.key, { label: event.target.value })} />
                  </label>
                </div>
                <div className="hv-context__row-grid">
                  <label className="hv-context__field"><span>Lien documentaire du critère {index + 1}</span>
                    <select aria-label={`Lien documentaire du critère ${index + 1}`} value={row.link}
                      onChange={(event) => updateRow(row.key, { link: event.target.value as CriterionDraftRow['link'] })}>
                      <option value="">Choisir un lien</option>
                      <option value="family">Famille documentée chargée</option>
                      <option value="term">Terme exact à rechercher</option>
                    </select>
                  </label>
                  {row.link === 'family' ? (
                    <label className="hv-context__field"><span>Famille du critère {index + 1}</span>
                      <select aria-label={`Famille du critère ${index + 1}`} value={row.familyKey} onChange={(event) => updateRow(row.key, { familyKey: event.target.value })}>
                        <option value="">Choisir une famille</option>
                        {families.map((family) => <option key={family.key} value={family.key}>{family.name} · {family.axisId} v{family.version}</option>)}
                      </select>
                    </label>
                  ) : row.link === 'term' ? (
                    <label className="hv-context__field"><span>Terme exact du critère {index + 1}</span>
                      <Input aria-label={`Terme exact du critère ${index + 1}`} value={row.freeTerm} onChange={(event) => updateRow(row.key, { freeTerm: event.target.value })} />
                    </label>
                  ) : null}
                </div>
                <button type="button" className="hv-context__text-button" onClick={() => setRows((current) => current.filter((candidate) => candidate.key !== row.key))}>
                  Retirer le critère {index + 1}
                </button>
              </li>
            ))}
          </ol>
          <button type="button" className="hv-context__secondary" onClick={() => setRows((current) => [...current, emptyCriterionRow(`criterion:${newId()}`)])}>
            Ajouter un critère
          </button>
          {errors.length ? <ul className="hv-context__error" role="alert">{errors.map((error) => <li key={error}>{error}</li>)}</ul> : null}
          <div className="hv-context__actions">
            <button type="button" className="hv-context__text-button" onClick={() => setOpen(false)}>Annuler</button>
            <button type="submit" className="hv-context__primary">Utiliser ce profil comme lentille</button>
          </div>
        </form>
      ) : null}

      {history.latest.length || history.unreadable.length ? (
        <details className="hv-context__details">
          <summary>Profils conservés · {history.latest.length} · versions {history.history.length}</summary>
          <ul className="hv-context__compact-list">
            {history.latest.map((profile) => (
              <li key={profile.reference}>
                <b>{profile.label}</b> · {profile.status === 'target' ? 'cible' : 'hypothèse'} · v{profile.version} · {profile.criteria.length} critère{profile.criteria.length === 1 ? '' : 's'}
                <button type="button" className="hv-context__text-button" onClick={() => startForm(profile)}>Réviser</button>
              </li>
            ))}
            {history.unreadable.map((row, index) => (
              <li key={`unreadable-${index}`} className="hv-context__unknown">
                {row.status === 'unsupported' ? `Format ${row.format ?? 'inconnu'} conservé en lecture seule.` : row.reason}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

/** Read-only display of declared profiles next to a snapshot's real context. */
export function HopV55ExplorationProfileArchive({ profiles, branchProfile }: {
  profiles?: readonly unknown[];
  /** Exact profile version bound to this branch; never replaced by history.latest. */
  branchProfile?: { kind: 'persisted' | 'session'; profile: HopV55ExplorationProfileV1 } | null;
}) {
  const history = useMemo(() => hopV55ExplorationProfileHistory(profiles), [profiles]);
  const branchRead = useMemo(() => branchProfile ? readHopV55ExplorationProfile(branchProfile.profile) : undefined, [branchProfile]);
  if (!profiles?.length && !branchProfile) return null;
  return (
    <div className="hv-context-archive">
      {branchProfile ? (
        <div data-profile-reference={branchProfile.profile.reference}>
          <p>
          <b>Profil lié à cette branche</b> · version exacte {branchProfile.profile.version} · {branchProfile.kind === 'persisted' ? 'profil conservé' : 'profil de session'}
          {branchRead?.status === 'current' ? <> · {branchRead.profile.label} · {branchRead.profile.status === 'target' ? 'cible' : 'hypothèse'}</>
            : <small> · Le profil lié ne passe plus son contrôle de lecture; sa référence est conservée.</small>}
          </p>
          {branchRead?.status === 'current' && branchRead.profile.description ? <blockquote>« {branchRead.profile.description} »</blockquote> : null}
        </div>
      ) : null}
      {profiles?.length ? <p><b>Profils libres déclarés dans l’espace</b> · cible ou hypothèse locale; ni fait de cette prévision, ni guide de style.</p> : null}
      {profiles?.length ? <ul>
          {history.latest.map((profile) => (
            <li key={profile.reference}>
              <b>{profile.label}</b> · {profile.status === 'target' ? 'cible' : 'hypothèse'} · version {profile.version}
              {profile.description ? <blockquote>« {profile.description} »</blockquote> : null}
              {profile.criteria.length ? <small>{profile.criteria.map((criterion) => `${hopV55DirectionLabel(criterion.direction)} · ${criterion.label}`).join(' ; ')}</small> : null}
            </li>
          ))}
          {history.unreadable.map((row, index) => (
            <li key={`unreadable-${index}`}>{row.status === 'unsupported' ? `Format ${row.format ?? 'inconnu'} conservé en lecture seule; non converti.` : row.reason}</li>
          ))}
        </ul> : null}
    </div>
  );
}

/* ---------- Trial ---------- */

export interface HopV55ExplorationTrialPanelProps {
  program?: HopDecisionProgram;
  originContext?: HopV55ExplorationTrialOriginContextV1 | null;
  materials: HopDecisionMaterial[];
  intent: HopV55Intent;
  lines: HopV55TrialLineDraft[];
  onLinesChange(lines: HopV55TrialLineDraft[]): void;
  yeasts: Array<{ id: string; name: string }>;
  yeastId: string;
  onYeastChange(id: string): void;
  profileSnapshot?: { kind: 'persisted' | 'session'; profile: HopV55ExplorationProfileV1 } | null;
  comparisonSnapshot?: { sourceId: string; alternativeId: string; snapshot: HopV55ContextualComparisonSnapshotV1 } | null;
  onPrepareTrial(request: HopV55ExplorationTrialRequestV1): void | Promise<void>;
  newId(): string;
}

function OptionalNumber({ label, unit, value, min, onValue }: {
  label: string; unit: string; value: number | undefined; min: number; onValue(value: number | undefined): void;
}) {
  return (
    <HopV55ExactInput label={label} unit={unit} value={value} min={min}
      onValue={(next) => onValue(typeof next === 'number' && Number.isFinite(next) ? next : undefined)} />
  );
}

type ExistingLineDraft = Exclude<HopV55TrialLineDraft, { kind: 'add' }>;

export function HopV55ExplorationTrialPanel({
  program, originContext = null, materials, intent, lines, onLinesChange, yeasts, yeastId, onYeastChange,
  profileSnapshot = null, comparisonSnapshot = null, onPrepareTrial, newId,
}: HopV55ExplorationTrialPanelProps) {
  const [label, setLabel] = useState('Essai d’exploration');
  const [volumeL, setVolumeL] = useState<number | undefined>();
  const [prepared, setPrepared] = useState<{ result: HopV55DecisionProgramPreparationV1; inputReference: string; entry?: HopV55ExplorationTrialRequestV1 }>();
  const [localNeeds, setLocalNeeds] = useState<Array<{ key: string; reason: string }>>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const materialName = (id: string) => materials.find((material) => material.id === id)?.name ?? `Matière non chargée · ${id}`;
  const allowedUses = program ? new Set<HopUse>(availableHopUses(program.stage)) : new Set<HopUse>();
  const currentProgramReference = program ? programFingerprint(program) : null;
  const originContextRead = useMemo(() => originContext
    ? readHopV55ExplorationTrialOriginContextV1(originContext)
    : { status: 'invalid' as const, reason: 'Cadre d’origine non fourni par le parent.' }, [originContext]);
  const currentOriginContext = originContextRead.status === 'current'
    && originContextRead.originContext.programReference === currentProgramReference ? originContextRead.originContext : undefined;
  const currentInputReference = useMemo(() => {
    if (!currentProgramReference || !currentOriginContext) return '';
    try {
      return hopAdviceContentReference('hop-v55-exploration-trial-input-v1', {
        programReference: currentProgramReference,
        originContextReference: currentOriginContext.reference,
        lines,
        intent,
        label,
        volumeL: volumeL ?? null,
        yeastId: yeastId || null,
        profileSnapshotReference: profileSnapshot?.profile.reference ?? null,
        comparisonReference: comparisonSnapshot?.snapshot.reference ?? null,
      });
    } catch { return ''; }
  }, [currentProgramReference, currentOriginContext?.reference, lines, intent, label, volumeL, yeastId,
    profileSnapshot?.profile.reference, comparisonSnapshot?.snapshot.reference]);
  const inputChanged = !!prepared && prepared.inputReference !== currentInputReference;
  const linesFromOtherContext = lines.filter((line) => line.originProgramReference !== currentProgramReference
    || line.originContextReference !== currentOriginContext?.reference);
  const freshness = prepared ? hopV55TrialFreshness(prepared.result, program) : undefined;
  const programComparison = useMemo(() => {
    if (!program || !prepared?.result.proposal) return undefined;
    try { return compareHopPrograms(program, prepared.result.proposal.program, materials); } catch { return undefined; }
  }, [program, prepared, materials]);

  const additionLabel = (additionId: string | undefined) => {
    const addition = program?.additions.find((row) => row.id === additionId);
    if (!addition) return 'ligne à choisir';
    return `${materialName(addition.materialId)} · ${addition.grams === null ? 'masse inconnue' : `${number(addition.grams)} g`} · ${hopV55UseLabel(addition.use)}`;
  };

  const lineLabel = (line: HopV55TrialLineDraft): string => {
    if (line.kind === 'add') return `Ajouter ${materialName(line.materialId)} · ${hopV55UseLabel(line.use)}`;
    if (line.kind === 'replace') return `Remplacer ${additionLabel(line.sourceAdditionId)} par ${materialName(line.materialId)}`;
    if (line.kind === 'setDose') return `Ajuster ${additionLabel(line.sourceAdditionId)}`;
    return `Retirer ${additionLabel(line.sourceAdditionId)}`;
  };

  const update = (key: string, patch: Partial<HopV55TrialLineDraft>) => {
    setError(''); setNotice(''); setLocalNeeds([]);
    onLinesChange(lines.map((line) => line.key === key ? { ...line, ...patch } as HopV55TrialLineDraft : line));
  };

  const prepare = () => {
    setError(''); setNotice('');
    if (!program) return;
    if (!currentOriginContext || currentOriginContext.programReference !== currentProgramReference) {
      setPrepared(undefined);
      setError('Le cadre exact de la source doit être relu avant de préparer cet essai.');
      return;
    }
    if (!lines.length) { setError('Ajoute au moins une ligne d’essai.'); return; }
    if (volumeL !== undefined && !(volumeL > 0)) { setError('Le volume hypothétique doit être strictement positif, ou laissé vide.'); return; }
    if (!currentInputReference) { setError('Les références de cet essai ne peuvent pas être scellées; aucune préparation n’est transmise.'); return; }
    if (prepared?.inputReference === currentInputReference) return;
    if (linesFromOtherContext.length) {
      setPrepared(undefined);
      setLocalNeeds(linesFromOtherContext.map((line) => ({ key: line.key,
        reason: 'La source ou le contexte a changé depuis ce geste. Retire la ligne puis recrée-la sous le contexte exact courant; elle ne sera pas rattachée automatiquement.' })));
      return;
    }
    const { operations, localNeeds: needs } = hopV55TrialOperations(lines, lineLabel);
    setLocalNeeds(needs);
    if (needs.length) { setPrepared(undefined); return; }
    const preparationInput: PrepareHopV55DecisionProgramInput = {
      branch: { id: `exploration-trial-${newId()}`, label: label.trim() || 'Essai d’exploration' },
      program,
      materials,
      intent: { question: intent.question, interpretation: 'Essai composé explicitement dans l’exploration; aucune lecture automatique de la question.', criteria: [] },
      operations,
    };
    const result = prepareHopV55DecisionProgram(preparationInput);
    const operationsByLineKey = new Map(lines.map((line) => [`exploration-operation:${line.key}`, line]));
    const lineOrigins = operations.map((operation) => {
      const line = operationsByLineKey.get(operation.id);
      if (!line || !line.originProgramReference || !line.originContextReference) return undefined;
      return { operationId: operation.id, originProgramReference: line.originProgramReference,
        originContextReference: line.originContextReference };
    });
    if (lineOrigins.some((row) => !row)) {
      setPrepared(undefined);
      setError('Une ligne n’a pas gardé son cadre de source initial; supprime-la puis recrée-la sous le cadre exact courant.');
      return;
    }
    const entry = result.status === 'ready' && result.branch && currentProgramReference ? {
      format: HOP_V55_EXPLORATION_TRIAL_FORMAT,
      commandId: `exploration-command-${newId()}`,
      originProgramReference: currentProgramReference,
      originContext: structuredClone(currentOriginContext),
      lineOrigins: lineOrigins as Array<NonNullable<(typeof lineOrigins)[number]>>,
      programReference: result.programReference,
      preparationInput: structuredClone(preparationInput),
      preparation: structuredClone(result),
      branch: structuredClone(result.branch),
      overrides: { ...(volumeL !== undefined ? { volumeL } : {}), ...(yeastId ? { yeastId } : {}) },
      profileSnapshot: profileSnapshot ? structuredClone(profileSnapshot) : null,
      comparisonSnapshot: comparisonSnapshot ? structuredClone(comparisonSnapshot.snapshot) : null,
    } satisfies HopV55ExplorationTrialRequestV1 : undefined;
    setPrepared({ result, inputReference: currentInputReference, ...(entry ? { entry } : {}) });
  };

  const send = async () => {
    if (!prepared?.entry || prepared.result.status !== 'ready' || inputChanged || freshness !== 'fresh' || busy) return;
    setBusy(true); setError('');
    try {
      await onPrepareTrial(structuredClone(prepared.entry));
      setNotice('Essai transmis au parent pour la prévision J5. La comparaison et la copie suivent ses contrats; aucune recette n’est modifiée ici.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'L’essai n’a pas pu être transmis; la préparation reste visible.');
    } finally { setBusy(false); }
  };

  const sourceLineSelect = (line: ExistingLineDraft, index: number) => (
    <label className="hv-context__field"><span>Ligne du programme · essai {index + 1}</span>
      <select aria-label={`Ligne du programme · essai ${index + 1}`} value={line.sourceAdditionId ?? ''}
        onChange={(event) => update(line.key, { sourceAdditionId: event.target.value || undefined })}>
        <option value="">Choisir une ligne exacte</option>
        {program?.additions.map((addition) => (
          <option key={addition.id} value={addition.id} disabled={addition.status === 'performed'}>
            {additionLabel(addition.id)} · {addition.status === 'performed' ? 'effectuée, non modifiable' : 'prévue'}
          </option>
        ))}
      </select>
    </label>
  );

  if (!program) {
    return (
      <div className="hv-context__trial">
        <p className="hv-context__empty" role="status">Aucun programme de référence n’est transmis : un essai modifie un programme explicite. Déclare d’abord une référence; la comparaison documentaire reste disponible.</p>
      </div>
    );
  }

  return (
    <div className="hv-context__trial">
      <details className="hv-context__details">
        <summary>Programme de référence · {program.additions.length} ligne{program.additions.length === 1 ? '' : 's'} · {number(program.volumeL)} L</summary>
        <ul className="hv-context__compact-list">
          {program.additions.map((addition) => (
            <li key={addition.id}>{additionLabel(addition.id)} · {addition.status === 'performed' ? 'effectuée' : 'prévue'}</li>
          ))}
        </ul>
      </details>

      {lines.length === 0 ? (
        <p className="hv-context__empty">Aucune ligne d’essai. Ajoute une matière depuis le catalogue, prépare un remplacement depuis la comparaison ou ajuste une ligne existante.</p>
      ) : (
        <ol className="hop-v55-explorer__crucible-list" aria-label="Lignes de l’essai">
          {lines.map((line, index) => {
            const need = localNeeds.find((row) => row.key === line.key);
            return (
              <li key={line.key} data-trial-line={line.key}>
                <div className="hop-v55-explorer__crucible-row-head">
                  <div><b>{lineLabel(line)}</b><span>Essai {index + 1}</span></div>
                  <button type="button" className="hop-v55-explorer__remove" aria-label={`Retirer l’essai ${index + 1}`}
                    onClick={() => { setLocalNeeds([]); onLinesChange(lines.filter((row) => row.key !== line.key)); }}>Retirer</button>
                </div>
                {line.kind === 'add' ? (
                  <>
                    <div className="hop-v55-explorer__field">
                      <OptionalNumber label={`Masse de ${materialName(line.materialId)}`} unit="g" min={0} value={line.grams}
                        onValue={(grams) => update(line.key, { grams })} />
                    </div>
                    <label className="hv-context__field"><span>Emploi de {materialName(line.materialId)}</span>
                      <select aria-label={`Emploi de ${materialName(line.materialId)}`} value={line.use ?? ''}
                        onChange={(event) => update(line.key, { use: (event.target.value || undefined) as HopUse | undefined,
                          boilMinutes: undefined, contactHours: undefined, temperatureC: undefined, dayOffset: undefined })}>
                        <option value="">Choisir un emploi</option>
                        {HOP_V55_USE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value} disabled={!allowedUses.has(option.value)}>
                            {option.label}{allowedUses.has(option.value) ? '' : ' · passé à ce stade'}
                          </option>
                        ))}
                      </select>
                    </label>
                    {line.use === 'boil' ? (
                      <OptionalNumber label={`Minutes d’ébullition restantes · essai ${index + 1}`} unit="min" min={0} value={line.boilMinutes}
                        onValue={(boilMinutes) => update(line.key, { boilMinutes })} />
                    ) : null}
                    {line.use === 'whirlpool' || line.use === 'fermentation' || line.use === 'postFermentation' ? (
                      <div className="hop-v55-explorer__field-grid">
                        <OptionalNumber label={`Contact · essai ${index + 1}`} unit="h" min={0} value={line.contactHours}
                          onValue={(contactHours) => update(line.key, { contactHours })} />
                        <OptionalNumber label={`Température · essai ${index + 1}`} unit="°C" min={-273.15} value={line.temperatureC}
                          onValue={(temperatureC) => update(line.key, { temperatureC })} />
                      </div>
                    ) : null}
                    {line.use === 'fermentation' || line.use === 'postFermentation' ? (
                      <OptionalNumber label={`Jour d’ajout · essai ${index + 1}`} unit="jour" min={0} value={line.dayOffset}
                        onValue={(dayOffset) => update(line.key, { dayOffset })} />
                    ) : null}
                  </>
                ) : null}
                {line.kind === 'replace' ? (
                  <>
                    {sourceLineSelect(line, index)}
                    <label className="hv-context__field"><span>Dose de remplacement · essai {index + 1}</span>
                      <select aria-label={`Dose de remplacement · essai ${index + 1}`} value={line.dose}
                        onChange={(event) => update(line.key, { dose: event.target.value as '' | 'explicit' | 'basis' })}>
                        <option value="">Choisir une masse ou une convention</option>
                        <option value="explicit">Masse explicite</option>
                        <option value="basis">Convention de dose</option>
                      </select>
                    </label>
                    {line.dose === 'basis' ? (
                      <label className="hv-context__field"><span>Convention · essai {index + 1}</span>
                        <select aria-label={`Convention · essai ${index + 1}`} value={line.basis ?? ''}
                          onChange={(event) => update(line.key, { basis: (event.target.value || undefined) as HopReplacementBasis | undefined })}>
                          <option value="">Choisir une convention</option>
                          {Object.entries(BASIS_LABELS).map(([value, text]) => <option key={value} value={value}>{text}</option>)}
                        </select>
                      </label>
                    ) : null}
                    {line.dose ? (
                      <OptionalNumber label={line.dose === 'explicit' ? `Masse de ${materialName(line.materialId)}` : `Masse choisie dans la plage · essai ${index + 1}`}
                        unit="g" min={0} value={line.grams} onValue={(grams) => update(line.key, { grams })} />
                    ) : null}
                  </>
                ) : null}
                {line.kind === 'setDose' ? (
                  <>
                    {sourceLineSelect(line, index)}
                    <label className="hv-context__field"><span>Ajustement · essai {index + 1}</span>
                      <select aria-label={`Ajustement · essai ${index + 1}`} value={line.mode}
                        onChange={(event) => update(line.key, { mode: event.target.value as '' | 'target' | 'increase' | 'decrease' })}>
                        <option value="">Choisir</option>
                        <option value="target">Masse cible</option>
                        <option value="increase">Augmenter de</option>
                        <option value="decrease">Diminuer de</option>
                      </select>
                    </label>
                    {line.mode ? <OptionalNumber label={`Masse de l’ajustement · essai ${index + 1}`} unit="g" min={0} value={line.grams}
                      onValue={(grams) => update(line.key, { grams })} /> : null}
                  </>
                ) : null}
                {line.kind === 'remove' ? sourceLineSelect(line, index) : null}
                {need ? <p className="hv-context__need" role="status">{need.reason}</p> : null}
              </li>
            );
          })}
        </ol>
      )}

      <div className="hv-context__actions">
        <button type="button" className="hv-context__secondary" onClick={() => onLinesChange([...lines, {
          key: newId(), originProgramReference: currentProgramReference, originContextReference: currentOriginContext?.reference ?? null,
          kind: 'setDose', mode: '',
        }])} disabled={!currentOriginContext}>
          Ajuster une ligne existante
        </button>
        <button type="button" className="hv-context__secondary" onClick={() => onLinesChange([...lines, {
          key: newId(), originProgramReference: currentProgramReference, originContextReference: currentOriginContext?.reference ?? null,
          kind: 'remove',
        }])} disabled={!currentOriginContext}>
          Retirer une ligne existante
        </button>
      </div>

      <details className="hv-context__details">
        <summary>Hypothèses de contexte · facultatif</summary>
        <label className="hv-context__field"><span>Nom de l’essai</span>
          <Input aria-label="Nom de l’essai" value={label} onChange={(event) => setLabel(event.target.value)} />
        </label>
        <OptionalNumber label="Volume hypothétique" unit="L" min={0} value={volumeL} onValue={setVolumeL} />
        <p className="hv-context__muted">Vide : le volume du programme ({number(program.volumeL)} L) reste inchangé.</p>
        <label className="hv-context__field"><span>Souche hypothétique</span>
          <select aria-label="Souche hypothétique" value={yeastId} onChange={(event) => onYeastChange(event.target.value)}>
            <option value="">Aucune souche substituée</option>
            {yeastId && !yeasts.some((yeast) => yeast.id === yeastId) ? <option value={yeastId}>Souche liée · {yeastId} · fiche non chargée</option> : null}
            {yeasts.map((yeast) => <option key={yeast.id} value={yeast.id}>{yeast.name} · {yeast.id}</option>)}
          </select>
        </label>
      </details>

      <button type="button" className="hop-v55-explorer__compose" onClick={prepare}>Préparer l’essai</button>

      {prepared ? (
        <section className="hv-context__preparation" aria-label="Préparation de l’essai" aria-live="polite">
          <p className="hv-context__status">
            {prepared.result.status === 'ready' ? 'Essai prêt à simuler' : prepared.result.status === 'needsInput' ? 'Essai incomplet' : 'Essai bloqué'}
          </p>
          {inputChanged ? <p className="hv-context__need" role="status">La source, le runtime, la lecture, le programme, une ligne, le volume, la souche, le profil ou la comparaison a changé depuis la préparation. Prépare de nouveau avant de simuler.</p> : null}
          {linesFromOtherContext.length ? <p className="hv-context__error" role="alert">La source ou le contexte exact a changé depuis le premier geste. Cette ligne doit être recréée sous le contexte courant.</p> : null}
          {freshness === 'stale' ? <p className="hv-context__error" role="alert">Le programme de référence a changé depuis la préparation. Cette préparation reste lisible mais ne sera pas transmise; prépare de nouveau.</p> : null}
          {prepared.result.evaluations.map((evaluation) => (
            <div key={evaluation.operationId}>
              {evaluation.reasons.map((reason, index) => <p key={`${evaluation.operationId}-reason-${index}`} className="hv-context__error">{reason}</p>)}
              {evaluation.needs.map((row, index) => (
                <p key={`${evaluation.operationId}-need-${index}`} className="hv-context__need"><b>{NEED_LABELS[row.field] ?? 'À préciser'}</b> · {row.reason}</p>
              ))}
            </div>
          ))}
          {prepared.result.needs.filter((row) => !row.operationId).map((row, index) => (
            <p key={`global-need-${index}`} className="hv-context__need"><b>{NEED_LABELS[row.field] ?? 'À préciser'}</b> · {row.reason}</p>
          ))}
          {prepared.result.status === 'blocked' ? prepared.result.reasons.filter((reason) => !prepared.result.evaluations.some((evaluation) => evaluation.reasons.includes(reason)))
            .map((reason, index) => <p key={`blocked-${index}`} className="hv-context__error">{reason}</p>) : null}
          {prepared.result.status === 'ready' && prepared.result.proposal ? (
            <>
              <h4>Programme proposé · hypothèse</h4>
              <ul className="hv-context__compact-list">
                {prepared.result.proposal.program.additions.map((addition) => (
                  <li key={addition.id}>{materialName(addition.materialId)} · {addition.grams === null ? 'masse inconnue' : `${number(addition.grams)} g physiques`} · {hopV55UseLabel(addition.use)} · {addition.status === 'performed' ? 'effectué, conservé' : 'prévu'}</li>
                ))}
              </ul>
              {prepared.result.proposal.conditions.map((condition, index) => <p key={`condition-${index}`} className="hv-context__muted">{condition}</p>)}
              {programComparison ? (
                <div className="hv-context__table" role="region" aria-label="Charges introduites avant et après l’essai" tabIndex={0}>
                  <table>
                    <thead><tr><th>Charge</th><th>Avant</th><th>Après</th><th>Après − avant</th></tr></thead>
                    <tbody>
                      <tr><th scope="row">Acides alpha introduits</th><td>{numericText(programComparison.before.alphaGrams)}</td><td>{numericText(programComparison.after.alphaGrams)}</td><td>{numericText(programComparison.delta.alphaGrams)}</td></tr>
                      <tr><th scope="row">Huile introduite</th><td>{numericText(programComparison.before.oilMl)}</td><td>{numericText(programComparison.after.oilMl)}</td><td>{numericText(programComparison.delta.oilMl)}</td></tr>
                      <tr><th scope="row">IBU chauds estimés</th><td>{numericText(programComparison.before.hotIbu)}</td><td>{numericText(programComparison.after.hotIbu)}</td><td>{numericText(programComparison.delta.hotIbu)}</td></tr>
                    </tbody>
                  </table>
                </div>
              ) : null}
              <p className="hv-context__muted">Charges introduites et estimations analytiques : ni rétention, ni perception. La prévision J5 du parent compare ensuite les variantes.</p>
              <button type="button" className="hv-context__primary" disabled={busy || inputChanged || freshness !== 'fresh'} onClick={() => void send()}>
                {busy ? 'Transmission…' : 'Simuler et comparer cet essai'}
              </button>
            </>
          ) : null}
        </section>
      ) : null}
      {error ? <p className="hop-v55-explorer__error" role="alert">{error}</p> : null}
      {notice ? <p className="hv-context__notice" role="status">{notice}</p> : null}
      <p className="hop-v55-explorer__footnote">Préparer n’écrit ni recette, ni brassin, ni stock. Seul le parent lance la prévision puis propose la copie par ses contrats existants.</p>
    </div>
  );
}
