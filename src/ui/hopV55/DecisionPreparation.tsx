import React, { useEffect, useMemo, useRef, useState } from 'react';
import { listHopIntentEvidenceFamilies, type HopIntentEvidenceStatus } from '../../domain/hopDecision/intentEvidence';
import { compareHopMaterials, hopDecisionReference } from '../../domain/hopDecision/measurements';
import { programFingerprint } from '../../domain/hopDecision/programs';
import type { HopPlannerDoseBasis, HopReplacementPath } from '../../domain/hopDecision/planner';
import type { HopAdviceOption } from '../../domain/hopDecision/adviceSchema';
import type { HopDecisionMaterial, HopDecisionProgram, HopMaterialComparison, HopNumericResult, HopProgramAddition, HopReplacementBasis, HopUse } from '../../domain/hopDecision/types';
import type { HopV55QuestionReading } from '../../services/hopV55/decision';
import type { HopV55ArchivedDecisionProgramPreparationV1 } from '../../services/hopV55/decisionArchive';
import type { HopV55ProgramConditionsV1, HopV55ProgramNeedV1, HopV55ProgramOperationV1, HopV55ProgramScopeV1 } from '../../services/hopV55/decisionProgramPreparation';
import type { HopV55QuestionCriterionV1 } from '../../services/hopV55/decision';
import type { HopV55SemanticQuestionReadingV1 } from '../../services/hopV55/questionSemanticReading';
import { Input } from '../Input';
import { HopV55ExactInput } from './ExactInput';
import './decision-preparation.css';

export type HopV55DecisionCriterionDirection = Exclude<HopV55QuestionCriterionV1['direction'], null>;
export type HopV55QuestionCriterionDraft = HopV55QuestionCriterionV1;

export interface HopV55DecisionCorrectionRequest {
  sourceReadingReference: string;
  criterionDrafts: HopV55QuestionCriterionDraft[];
}

const directions: Array<{ value: HopV55DecisionCriterionDirection; label: string }> = [
  { value: 'increase', label: 'Rechercher' },
  { value: 'decrease', label: 'Réduire' },
  { value: 'keep', label: 'Préserver / garder' },
  { value: 'exclude', label: 'Éviter / exclure' },
  { value: 'investigate', label: 'Examiner sans cible' },
];

const directionLabel: Record<HopV55DecisionCriterionDirection, string> = {
  increase: 'Rechercher', decrease: 'Réduire', keep: 'Préserver', exclude: 'Éviter', investigate: 'Examiner',
};

function exactFragment(question: string, draft: HopV55QuestionCriterionDraft): string {
  const { start, end, text } = draft.source;
  return Number.isSafeInteger(start) && Number.isSafeInteger(end) && start >= 0 && end >= start
    && question.slice(start, end) === text ? question.slice(start, end) : text;
}

function sameDrafts(left: HopV55QuestionCriterionDraft[], right: HopV55QuestionCriterionDraft[]): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function draftSummary(drafts: HopV55QuestionCriterionDraft[]): string {
  const summaries = drafts.map(draft => draft.requirement === 'optional' || draft.direction === null
    ? `«${draft.term}» facultatif`
    : `${directionLabel[draft.direction]} «${draft.term}»${draft.qualification ? ` · ${draft.qualification}` : ''}`);
  return summaries.length ? summaries.join(' · ') : 'Aucun critère structuré';
}

export interface HopV55DecisionProgramPreparationRequest {
  sourceReadingReference: string;
  branchLabel: string;
  operations: HopV55ProgramOperationV1[];
}

export interface HopV55DecisionProgramComparisonRequest {
  preparationReference: string;
}

/** Exact active source observed by the user when requesting an archived preparation resume. */
export interface HopV55DecisionProgramResumeContextV1 {
  program: HopDecisionProgram;
  materials: HopDecisionMaterial[];
  runtimeReferences: {
    recipeReference?: string;
    inputReference?: string;
    stockAvailabilityReference?: string;
    dataRevision?: string;
  };
}

/** A resume is a new, explicitly checked preparation; it never edits the source archive. */
export interface HopV55DecisionProgramResumeRequestV1 {
  archiveReference: string;
  preparation: HopV55ArchivedDecisionProgramPreparationV1;
  expectedContext: HopV55DecisionProgramResumeContextV1;
}

export { SemanticDecisionReading as HopV55SemanticDecisionPreparation } from './SemanticDecisionReading';
export type { HopV55SemanticDecisionReadingProps as HopV55SemanticDecisionPreparationProps,
  HopV55SemanticCorrectionRequestV1 } from './SemanticDecisionReading';

const operationKindLabels: Record<HopV55ProgramOperationV1['kind'], string> = {
  add: 'Ajouter une ligne', remove: 'Retirer une ligne ou une masse', setDose: 'Régler une masse',
  move: 'Déplacer une ligne ou une portion', replace: 'Remplacer une matière', replaceUnavailable: 'Remplacer une matière indisponible',
};
const useRows: Array<{ value: HopUse; label: string }> = [
  { value: 'firstWort', label: 'Premier moût' }, { value: 'boil', label: 'Ébullition' },
  { value: 'whirlpool', label: 'Whirlpool' }, { value: 'fermentation', label: 'Fermentation active' },
  { value: 'postFermentation', label: 'À froid après fermentation' },
];
const formLabels: Record<HopDecisionMaterial['form'], string> = {
  pelletT90: 'Pellets T-90', pelletT45: 'Pellets T-45', cryo: 'Lupuline concentrée', cone: 'Cônes', extract: 'Extrait', unknown: 'Forme inconnue',
};
const replacementBasisLabels: Record<HopReplacementBasis, string> = {
  sameMass: 'Même masse', alphaLoad: 'Charge d’acides alpha', totalOil: 'Huile totale', manufacturer: 'Convention fabricant',
};
const replacementBasisLabel = (basis: HopPlannerDoseBasis) => basis === 'tinsethIbu'
  ? 'Convention IBU Tinseth déclarée' : replacementBasisLabels[basis];
const replacementBasisChoices = (use: HopUse): Array<{ value: HopPlannerDoseBasis; label: string }> => [
  ...Object.entries(replacementBasisLabels).map(([value, label]) => ({ value: value as HopReplacementBasis, label })),
  ...(use === 'boil' ? [{ value: 'tinsethIbu' as const, label: replacementBasisLabel('tinsethIbu') }] : []),
];
const pathStatusLabels: Record<HopReplacementPath['status'], string> = {
  ready: 'voie complète', chooseDose: 'masse à choisir dans les bornes', conditional: 'voie conditionnelle', unavailable: 'voie indisponible',
};
const pathApplicabilityLabels: Record<HopReplacementPath['applicability'], string> = {
  available: 'applicabilité documentée', conditional: 'applicabilité conditionnelle', unavailable: 'non applicable',
};
const intentEvidenceStatusLabels: Record<HopIntentEvidenceStatus, string> = {
  documentedSupport: 'Appui documentaire', documentedTension: 'Tension documentaire', documentedAgainst: 'Élément contraire',
  documentedOverlap: 'Recouvrement documentaire', candidateOnly: 'Documenté dans la cible seulement', partnerOnly: 'Documenté dans la source seulement',
  observationToPreserve: 'Observation à préserver', notDocumented: 'Non documenté', unknown: 'Inconnu', ambiguous: 'Ambigu', notApplicable: 'Non applicable',
};
const useLabel = (use?: HopUse) => useRows.find(row => row.value === use)?.label ?? 'emploi non choisi';
const nextStableId = (prefix: string) => `${prefix}:${globalThis.crypto.randomUUID()}`;

function emptyOperation(kind: HopV55ProgramOperationV1['kind']): HopV55ProgramOperationV1 {
  const id = nextStableId(`operation-${kind}`);
  const label = operationKindLabels[kind];
  if (kind === 'add') return { id, label, kind, additionId: nextStableId('scenario-hop'), grams: null };
  if (kind === 'remove') return { id, label, kind };
  if (kind === 'setDose') return { id, label, kind };
  if (kind === 'move') return { id, label, kind };
  if (kind === 'replace') return { id, label, kind };
  return { id, label, kind };
}

function seedOperations(option: HopAdviceOption | undefined, program?: HopDecisionProgram): HopV55ProgramOperationV1[] {
  if (!option || option.programScope.kind === 'none') return [];
  const scope = option.programScope;
  if (scope.kind === 'removePlanned') return scope.additionIds.map(additionId => {
    const operation = emptyOperation('remove');
    return { id: operation.id, label: `Retirer une quantité de ${program?.additions.find(row => row.id === additionId)?.id ?? 'la ligne prévue'}`,
      kind: 'remove' as const, additionId };
  });
  if (scope.additionIds.length) return scope.additionIds.map((additionId, index) => {
    const source = program?.additions.find(row => row.id === additionId);
    const materialId = scope.materialIds.length === 1 ? scope.materialIds[0] : undefined;
    const operation = emptyOperation('replace');
    return { id: operation.id, label: `Remplacer la matière prévue ${index + 1}`,
      kind: 'replace' as const, additionId, ...(source ? { sourceMaterialId: source.materialId, sourceUse: source.use } : {}), ...(materialId ? { materialId } : {}) };
  });
  return [{ id: nextStableId('operation-add'), label: option.title, kind: 'add', additionId: nextStableId('scenario-hop'),
    ...(scope.materialIds.length === 1 ? { materialId: scope.materialIds[0] } : {}) }];
}

function localizedNumber(value: number): string { return value.toLocaleString('fr-CH', { maximumFractionDigits: 3 }); }

function numericReading(value: HopNumericResult): string {
  if (value.status === 'unknown') return `Inconnu · ${value.reasons[0] ?? 'aucune valeur disponible'}`;
  if (value.status === 'conflict') return `Conflit · ${value.reasons[0] ?? 'références divergentes à départager'}`;
  if (value.status === 'range' && value.range) return `${localizedNumber(value.range.min)}–${localizedNumber(value.range.max)} ${value.unit} · plage rapportée`;
  if (value.value !== null) return `${localizedNumber(value.value)} ${value.unit} · valeur rapportée`;
  return `Inconnu · ${value.reasons[0] ?? 'aucune valeur affichable'}`;
}

const analyteLabels: Record<string, string> = {
  alpha: 'Acides alpha', beta: 'Acides bêta', totalOil: 'Huile totale', myrcene: 'Myrcène', linalool: 'Linalol',
  geraniol: 'Géraniol', citronellol: 'Citronellol', humulene: 'Humulène', caryophyllene: 'Caryophyllène',
  '4mmpFree': '4MMP libre', '4mmpCys': '4MMP liée à la cystéine', '4mmpGsh': '4MMP liée au glutathion',
  '3mhFree': '3MH libre', '3mhCys': '3MH liée à la cystéine', '3mhGsh': '3MH liée au glutathion',
  '3mhGluCys': '3MH liée au γ-glutamyl-cystéine', '3mhCysGly': '3MH liée à la cystéinylglycine',
  '3s4mpFree': '3S4MP libre', '3mhaFree': '3MHA libre', '2methylbutylIsobutyrate': '2-méthylbutyl isobutyrate',
  gammaNonalactone: 'γ-nonalactone', hsi: 'Indice HSI',
};

export function HopV55DecisionPreparation({ question, criterionDrafts, sourceReadingReference, historical = false, saving = false,
  error, onPrepareDecision, onDraftChange }: {
  question: string;
  criterionDrafts: HopV55QuestionCriterionDraft[];
  sourceReadingReference?: string;
  historical?: boolean;
  saving?: boolean;
  error?: string;
  onPrepareDecision?(request: HopV55DecisionCorrectionRequest): void | Promise<void>;
  onDraftChange?(dirty: boolean): void;
}) {
  const [drafts, setDrafts] = useState(() => structuredClone(criterionDrafts));
  const [open, setOpen] = useState(false);
  const [localError, setLocalError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const families = useMemo(() => listHopIntentEvidenceFamilies(), []);
  const familyNames = useMemo(() => new Map(families.map(family => [family.id, family.name])), [families]);
  const dirty = !sameDrafts(drafts, criterionDrafts);
  const complete = drafts.every(draft => draft.term.trim().length > 0
    && (draft.requirement === 'optional' ? draft.direction === null : draft.direction !== null));
  const sourceReady = !!sourceReadingReference?.trim();

  useEffect(() => {
    setDrafts(structuredClone(criterionDrafts)); setLocalError(''); setSubmitting(false);
  }, [question, sourceReadingReference, criterionDrafts]);
  useEffect(() => { onDraftChange?.(dirty); }, [dirty, onDraftChange]);

  function updateDraft(id: string, update: (draft: HopV55QuestionCriterionDraft) => HopV55QuestionCriterionDraft) {
    setDrafts(current => current.map(draft => draft.id === id ? update(draft) : draft));
    setLocalError('');
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setLocalError('');
    if (historical) { setLocalError('Cette lecture est archivée. Relis la demande dans le contexte actif avant de la corriger.'); return; }
    if (!sourceReady) { setLocalError('La référence de lecture manque; aucune correction ne sera enregistrée sans la lecture d’origine.'); return; }
    if (!complete) { setLocalError('Chaque critère doit avoir un terme exact et une relation, ou être marqué facultatif.'); return; }
    if (!dirty) { setLocalError('Aucune correction n’a été faite.'); return; }
    if (!onPrepareDecision) { setLocalError('La sauvegarde de la lecture corrigée n’est pas disponible dans ce contexte.'); return; }
    setSubmitting(true);
    try { await onPrepareDecision({ sourceReadingReference: sourceReadingReference!, criterionDrafts: structuredClone(drafts) }); }
    catch (caught) { setLocalError((caught as Error)?.message ?? 'La correction n’a pas pu être conservée.'); setSubmitting(false); }
  }

  if (!criterionDrafts.length) return null;
  return <section className="hv-decision-preparation" aria-label="Corriger la lecture proposée">
    <div className="hv-decision-preparation__summary">
      <strong>Lecture proposée · à vérifier</strong>
      <p>{draftSummary(criterionDrafts)}</p>
      {dirty ? <p className="hv-decision-preparation__stale" role="status">Les voies affichées plus bas correspondent encore à ces critères d’origine. Corrige et recalcule la lecture avant toute préparation.</p> : null}
    </div>
    <details open={open} onToggle={event => setOpen(event.currentTarget.open)} className="hv-decision-preparation__details">
      <summary>Vérifier ou corriger les critères · {criterionDrafts.length}</summary>
      <p className="hv-decision-preparation__original"><strong>Demande conservée · </strong>« {question} »</p>
      {historical ? <p className="hv-decision-preparation__readonly">Archive en lecture seule. La relecture active crée une nouvelle version.</p> : null}
      <form autoComplete="off" onSubmit={event => void submit(event)}>
        <div className="hv-decision-preparation__criteria">
          {drafts.map((draft, index) => {
            const fragment = exactFragment(question, draft);
            const family = draft.familyId ? families.find(row => row.id === draft.familyId) : undefined;
            return <fieldset className="hv-decision-preparation__criterion" key={draft.id}>
              <legend>Fragment {index + 1} · {draft.origin === 'brasseur' ? 'corrigé' : 'lecture automatique'}</legend>
              <blockquote><span>Extrait exact · </span><mark>{fragment || 'extrait absent'}</mark></blockquote>
              <div className="hv-decision-preparation__fields">
                <label><span>Terme exact</span><Input aria-label={`Terme exact du fragment ${index + 1}`} value={draft.term}
                  disabled={historical} onChange={event => updateDraft(draft.id, current => ({ ...current, term: event.target.value,
                    ...(event.target.value === current.term ? {} : { familyId: undefined, dimension: undefined, reportedProblem: undefined }) }))} /></label>
                <label><span>Relation attendue</span><select aria-label={`Relation du fragment ${index + 1}`} value={draft.requirement === 'optional' ? 'optional' : draft.direction ?? ''}
                  disabled={historical}
                  onChange={event => updateDraft(draft.id, current => event.target.value === 'optional'
                    ? { ...current, requirement: 'optional', direction: null }
                    : { ...current, requirement: 'required', direction: event.target.value as HopV55DecisionCriterionDirection })}>
                  <option value="">Choisir une relation</option>
                  {directions.map(row => <option key={row.value} value={row.value}>{row.label}</option>)}
                  <option value="optional">Facultatif · ni cible ni exclusion</option>
                </select></label>
                <label><span>Précision en mots · facultative</span><Input aria-label={`Précision du fragment ${index + 1}`} value={draft.qualification ?? ''}
                  disabled={historical} placeholder="ex. élevé, léger, sans cible chiffrée" onChange={event => updateDraft(draft.id, current => ({ ...current,
                    qualification: event.target.value || undefined }))} /></label>
                <label><span>Famille documentaire · association explicite</span><select aria-label={`Famille documentaire du fragment ${index + 1}`} value={draft.familyId ?? ''}
                  disabled={historical}
                  onChange={event => updateDraft(draft.id, current => ({ ...current, familyId: event.target.value || undefined }))}>
                  <option value="">Aucune association documentaire</option>
                  {families.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}
                </select></label>
              </div>
              {family ? <p className="hv-decision-preparation__family-note">Association lexicale choisie · {family.name}. Cette famille documentaire ne fixe ni une intensité ni un résultat en bière.</p> : null}
            </fieldset>;
          })}
        </div>
        <p className="hv-decision-preparation__note">Une précision descriptive reste du texte. Elle ne fournit aucune dose ni valeur d’IBU.</p>
        {localError || error ? <p role="alert" className="hv-decision-preparation__error">{localError || error}</p> : null}
        <button type="submit" className="hv-decision-preparation__submit" disabled={historical || saving || submitting || !dirty || !complete || !sourceReady || !onPrepareDecision}>
          {saving || submitting ? 'Enregistrement…' : 'Corriger et recalculer cette lecture'}
        </button>
        {dirty ? <p className="hv-decision-preparation__archive-note">La nouvelle lecture gardera ce fragment, les critères corrigés et sa référence distincte. L’archive actuelle ne changera pas.</p> : null}
      </form>
    </details>
  </section>;
}

function materialRole(material: HopDecisionMaterial): string {
  if (material.product) return `Produit · ${material.product.manufacturer}`;
  if (material.lot) return `Lot · ${material.lot.id}`;
  if (material.variety) return `Variété · ${material.variety.id}`;
  return 'Matière catalogue';
}

function materialLabel(material: HopDecisionMaterial): string {
  return `${material.name} · ${formLabels[material.form]} · ${materialRole(material)}`;
}

function materialVarietyIds(material: HopDecisionMaterial): string[] {
  return [...new Set([material.variety?.id, material.lot?.varietyId].filter((value): value is string => !!value))];
}

function programLineChoiceLabel(line: HopProgramAddition, materials: readonly HopDecisionMaterial[]): string {
  const material = materials.find(row => row.id === line.materialId);
  const mass = line.grams === null ? 'masse inconnue' : `${localizedNumber(line.grams)} g`;
  const status = line.status === 'performed' ? 'effectuée' : 'prévue';
  return `${line.id} · ${material?.name ?? 'matière non résolue'} · ${mass} · ${useLabel(line.use)} · ${status}`;
}

/** Structural catalogue-to-program relation only; names and aliases never link a line. */
function sourceProgramRelationLabel(material: HopDecisionMaterial, program: HopDecisionProgram | undefined,
  materials: readonly HopDecisionMaterial[]): string {
  if (!program) return 'Programme non transmis · lignes inconnues';
  const exactLines = program.additions.filter(line => line.materialId === material.id);
  if (exactLines.length) return `Identité exacte au programme · ${exactLines.map(line => programLineChoiceLabel(line, materials)).join(' ; ')}`;
  const varietyIds = materialVarietyIds(material);
  const varietySet = new Set(varietyIds);
  const linkedLines = varietySet.size ? program.additions.filter(line => {
    const lineMaterial = materials.find(row => row.id === line.materialId);
    return !!lineMaterial && materialVarietyIds(lineMaterial).some(id => varietySet.has(id));
  }) : [];
  if (linkedLines.length) return `Fiche sans ligne exacte · varietyId ${varietyIds.join(', ')} · lignes liées distinctes, non choisies: ${linkedLines.map(line => programLineChoiceLabel(line, materials)).join(' ; ')}`;
  return 'Fiche catalogue · aucune ligne exacte ou liaison variété présente dans le programme';
}

function sourceLabel(source: HopMaterialComparison['analytical'][number]['left']['sources'][number]): string {
  return [source.title, source.author, source.year ?? 'année inconnue'].filter(Boolean).join(' · ');
}

function ProgramMaterialPicker({ label, ariaLabel, materials, value, disabled, program, onChange }: {
  label: string; ariaLabel: string; materials: HopDecisionMaterial[]; value?: string; disabled?: boolean;
  /** Supplied only for the unavailable-source picker so source identity is separated from program-line identity. */
  program?: HopDecisionProgram; onChange(value: string): void;
}) {
  const [query, setQuery] = useState('');
  const normalize = (text: string) => text.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase('fr').trim();
  const normalizedQuery = normalize(query);
  const choiceLabel = (material: HopDecisionMaterial) => `${materialLabel(material)}${program
    ? ` · ${sourceProgramRelationLabel(material, program, materials)}` : ''}`;
  const matches = materials.filter(material => !normalizedQuery || normalize(`${choiceLabel(material)} ${material.id} ${material.form}`)
    .includes(normalizedQuery));
  const selected = value ? materials.find(material => material.id === value) : undefined;
  return <div className="hv-decision-preparation__material-picker">
    <label><span>Rechercher dans les matières exactes · {materials.length}</span>
      <Input type="search" aria-label={`Rechercher ${label.toLocaleLowerCase('fr')}`} value={query} disabled={disabled} onChange={event => setQuery(event.target.value)} />
    </label>
    <label><span>{label}</span><select aria-label={ariaLabel} value={value ?? ''} disabled={disabled} onChange={event => onChange(event.target.value)}>
      <option value="">Choisir une identité exacte</option>
      {selected && !matches.some(material => material.id === selected.id) ? <option value={selected.id}>{choiceLabel(selected)}</option> : null}
      {matches.map(material => <option key={material.id} value={material.id}>{choiceLabel(material)}</option>)}
    </select></label>
    <small>{matches.length} matière{matches.length === 1 ? '' : 's'} correspond{matches.length === 1 ? '' : 'ent'} · aucun alias n’est fusionné.</small>
    {selected ? <details><summary>Identité de la matière choisie</summary><code>{selected.id}</code>
      {program ? <p>{sourceProgramRelationLabel(selected, program, materials)}</p> : null}</details> : null}
  </div>;
}

function scopeMatchesUse(use: HopUse, scope?: HopV55ProgramScopeV1): boolean {
  if (!scope) return true;
  return scope === 'hotSide' ? use === 'firstWort' || use === 'boil' || use === 'whirlpool'
    : use === 'fermentation' || use === 'postFermentation';
}

function ProgramScopePicker({ label, operationId, value, disabled, onChange }: {
  label: string; operationId: string; value?: HopV55ProgramScopeV1; disabled?: boolean; onChange(value?: HopV55ProgramScopeV1): void;
}) {
  return <label className="hv-decision-preparation__field"><span>{label}</span>
    <select aria-label={`${label} de l’opération ${operationId}`} disabled={disabled} value={value ?? ''}
      onChange={event => onChange(event.target.value ? event.target.value as HopV55ProgramScopeV1 : undefined)}>
      <option value="">Aucun filtre de côté</option><option value="hotSide">Côté chaud</option><option value="coldSide">À froid / côté froid</option>
    </select>
    <small>Ce filtre ne choisit ni la ligne exacte, ni la phase du houblonnage à froid.</small>
  </label>;
}

function SourceLinePicker({ program, materials, value, scope, disabled, ariaLabel, onChange }: {
  program?: HopDecisionProgram; materials: HopDecisionMaterial[]; value?: string; scope?: HopV55ProgramScopeV1;
  disabled?: boolean; ariaLabel: string; onChange(line?: HopProgramAddition): void;
}) {
  const additions = program?.additions ?? [];
  return <label className="hv-decision-preparation__field"><span>Ligne source exacte · programme transmis</span>
    <select aria-label={ariaLabel} value={value ?? ''} disabled={disabled || !program} onChange={event => onChange(additions.find(row => row.id === event.target.value))}>
      <option value="">Choisir une ligne du programme</option>
      {additions.map(line => {
        const material = materials.find(row => row.id === line.materialId);
        const matchesScope = scopeMatchesUse(line.use, scope);
        const mass = line.grams === null ? 'masse inconnue' : `${localizedNumber(line.grams)} g`;
        return <option key={line.id} value={line.id} disabled={line.status === 'performed' || !matchesScope}>
          {material?.name ?? 'Matière non résolue'} · {mass} · {useLabel(line.use)} · {line.status === 'performed' ? 'effectué, non modifiable' : !matchesScope ? 'hors du côté filtré' : 'prévu'} · {line.id}
        </option>;
      })}
    </select>
    {program ? <small>{program.additions.filter(row => row.status === 'planned').length} lignes prévues peuvent être examinées; les lignes effectuées restent visibles mais ne sont pas modifiables.</small>
      : <small>Aucun programme exact n’est transmis. L’absence ne devient pas un programme vide.</small>}
  </label>;
}

function ProductSourceDocument({ source }: { source: HopMaterialComparison['descriptions'][number]['left'][number]['source'] }) {
  const name = sourceLabel(source);
  return source.reference?.startsWith('http') ? <a href={source.reference} target="_blank" rel="noreferrer">{name}</a> : <span>{name}</span>;
}

function ProgramMaterialComparison({ comparison, materials }: { comparison: HopMaterialComparison; materials: HopDecisionMaterial[] }) {
  const left = materials.find(row => row.id === comparison.leftId);
  const right = materials.find(row => row.id === comparison.rightId);
  const documentaryReadings = comparison.analytical.filter(row => row.left.status !== 'unknown' || row.right.status !== 'unknown' || row.difference.status !== 'unknown');
  const descriptions = comparison.descriptions.flatMap(group => [
    ...group.left.map(description => ({ context: group.context, side: 'Source' as const, description })),
    ...group.right.map(description => ({ context: group.context, side: 'Cible' as const, description })),
  ]);
  const firstDescriptions = (['Source', 'Cible'] as const).flatMap(side => {
    const row = descriptions.find(description => description.side === side);
    return row ? [row] : [];
  });
  const contextLabels = { rawHop: 'Houblon brut', infusion: 'Infusion', beer: 'Bière', unspecified: 'Contexte non précisé' } as const;
  return <section className="hv-decision-preparation__material-comparison" aria-label="Comparaison documentaire exacte avant convention">
    <h5>Source → cible · différences documentées</h5>
    <p><strong>{left?.name ?? comparison.leftId}</strong> vers <strong>{right?.name ?? comparison.rightId}</strong>. Cette comparaison porte sur les matières déclarées, pas sur une bière finie.</p>
    <p className="hv-decision-preparation__comparison-limit">{comparison.limits.join(' ')}</p>
    {documentaryReadings.length ? <div className="hv-decision-preparation__comparison-scroll" role="region" aria-label="Valeurs analytiques documentaires comparées" tabIndex={0}>
      <table><thead><tr><th>Mesure</th><th>Source</th><th>Cible</th><th>Cible − source</th></tr></thead><tbody>
        {documentaryReadings.map(row => <tr key={row.analyte}><th scope="row">{analyteLabels[row.analyte] ?? row.analyte}</th>
          <td>{numericReading(row.left)}</td><td>{numericReading(row.right)}</td><td>{numericReading(row.difference)}</td></tr>)}
      </tbody></table>
    </div> : <p>Aucune analyse comparative lisible dans ces deux matières. Les champs inconnus ne sont pas traités comme zéro.</p>}
    {firstDescriptions.length ? <div className="hv-decision-preparation__description-pair" aria-label="Premières descriptions sourcées comparées">
      {firstDescriptions.map(({ context, side, description }, index) => <article key={`${side}-${description.source.reference ?? description.source.title}-${index}`}>
        <strong>{side} · {contextLabels[context]}</strong><blockquote>« {description.text} »</blockquote><ProductSourceDocument source={description.source} />
      </article>)}
    </div> : <p>Aucune description liée aux identités exactes n’est fournie.</p>}
    {descriptions.length ? <details className="hv-decision-preparation__comparison-descriptions"><summary>Toutes les descriptions sourcées · {descriptions.length}</summary>
      <div className="hv-decision-preparation__description-pair">{descriptions.map(({ context, side, description }, index) => <article key={`${side}-${description.source.reference ?? description.source.title}-${index}`}>
        <strong>{side} · {contextLabels[context]}</strong><blockquote>« {description.text} »</blockquote><ProductSourceDocument source={description.source} />
      </article>)}</div>
    </details> : null}
  </section>;
}

function createEmptyOperation(kind: HopV55ProgramOperationV1['kind']): HopV55ProgramOperationV1 {
  const id = nextStableId(`operation-${kind}`);
  const label = operationKindLabels[kind];
  switch (kind) {
    case 'add': return { id, label, kind, additionId: nextStableId('scenario-hop'), grams: null };
    case 'remove': return { id, label, kind };
    case 'setDose': return { id, label, kind };
    case 'move': return { id, label, kind };
    case 'replace': return { id, label, kind };
    case 'replaceUnavailable': return { id, label, kind, candidateMaterialIds: [] };
  }
}

function sideLabel(scope?: HopV55ProgramScopeV1): string {
  return scope === 'hotSide' ? 'côté chaud' : scope === 'coldSide' ? 'à froid / côté froid' : 'côté non précisé';
}

function physicalMassLabel(value: number | null | undefined): string {
  return value == null ? 'masse inconnue' : `${localizedNumber(value)} g`;
}

function replacementPlanInputs(operation: HopV55ProgramOperationV1): unknown {
  if (operation.kind !== 'replaceUnavailable') return operation;
  const { selection: _selection, ...planInputs } = operation;
  return planInputs;
}

function replacementPathKindLabel(path: HopReplacementPath): string {
  return path.kind === 'singleMaterial' ? 'Une matière exacte' : 'Plusieurs matières exactes';
}

function replacementPathMissingUses(path: HopReplacementPath): HopUse[] {
  return [...new Set(path.assignments.filter(assignment => !assignment.basis
    || assignment.doseGrams.status === 'unknown' || assignment.doseGrams.status === 'conflict').map(assignment => assignment.use))];
}

function replacementPathSelectable(path: HopReplacementPath): boolean {
  return path.complete && path.applicability !== 'unavailable' && replacementPathMissingUses(path).length === 0;
}

function conditionSummary(conditions?: HopV55ProgramConditionsV1): string {
  if (!conditions) return 'conditions non fournies';
  const values = [
    conditions.boilMinutes == null ? '' : `${localizedNumber(conditions.boilMinutes)} min d’ébullition restantes`,
    conditions.contactHours == null ? '' : `${localizedNumber(conditions.contactHours)} h de contact`,
    conditions.temperatureC == null ? '' : `${localizedNumber(conditions.temperatureC)} °C`,
    conditions.dayOffset == null ? '' : `jour ${localizedNumber(conditions.dayOffset)}`,
  ].filter(Boolean);
  return values.length ? values.join(' · ') : 'conditions non fournies';
}

function archivedOperationSummary(operation: HopV55ProgramOperationV1, program: HopDecisionProgram,
  materialName: (id: string) => string): string {
  const additionId = 'additionId' in operation ? operation.additionId : undefined;
  const sourceAddition = additionId ? program.additions.find(row => row.id === additionId) : undefined;
  const sourceMaterialId = ('sourceMaterialId' in operation ? operation.sourceMaterialId : undefined) ?? sourceAddition?.materialId;
  const sourceUse = ('sourceUse' in operation ? operation.sourceUse : undefined) ?? sourceAddition?.use;
  const source = sourceMaterialId
    ? `${materialName(sourceMaterialId)} · ${useLabel(sourceUse)}`
    : additionId ? `ligne source ${additionId}` : 'ligne source à choisir';
  switch (operation.kind) {
    case 'add':
      return `Ajouter ${physicalMassLabel(operation.grams)} · ${operation.materialId ? materialName(operation.materialId) : 'matière cible à choisir'} · ${useLabel(operation.use)} · ${sideLabel(operation.targetScope)} · ${conditionSummary(operation.conditions)}`;
    case 'remove': {
      const quantity = operation.quantity?.kind === 'entire' ? 'la ligne entière'
        : operation.quantity?.kind === 'partial' ? `${physicalMassLabel(operation.quantity.grams)} de la ligne`
          : 'quantité à choisir';
      return `Retirer ${quantity} · ${source} · ${sideLabel(operation.sourceScope)}`;
    }
    case 'setDose': {
      const quantity = operation.quantity?.kind === 'target' ? `masse cible ${physicalMassLabel(operation.quantity.grams)}`
        : operation.quantity?.kind === 'delta' ? `${operation.quantity.direction === 'increase' ? 'augmenter' : 'diminuer'} de ${physicalMassLabel(operation.quantity.grams)}`
          : 'quantité à choisir';
      return `Régler ${source} · ${quantity} · ${sideLabel(operation.sourceScope)}`;
    }
    case 'move': {
      const quantity = operation.quantity?.kind === 'entire' ? 'ligne entière'
        : operation.quantity?.kind === 'partial' ? `portion ${physicalMassLabel(operation.quantity.grams)}` : 'quantité à choisir';
      return `Déplacer ${quantity} de ${source} vers ${useLabel(operation.use)} · ${sideLabel(operation.sourceScope)} · ${conditionSummary(operation.conditions)}`;
    }
    case 'replace': {
      const dose = operation.dose?.kind === 'explicit' ? `dose cible ${physicalMassLabel(operation.dose.grams)}`
        : operation.dose?.kind === 'basis' ? `convention ${replacementBasisLabels[operation.dose.basis]}` : 'dose ou convention à choisir';
      return `Remplacer ${source} par ${operation.materialId ? materialName(operation.materialId) : 'matière cible à choisir'} · ${dose} · ${sideLabel(operation.sourceScope)}`;
    }
    case 'replaceUnavailable': {
      const coverage = operation.coverage?.kind === 'allFuture' ? 'toutes les lignes futures'
        : operation.coverage?.kind === 'selectedLines' ? `lignes choisies (${operation.coverage.additionIds.join(', ') || 'à choisir'})` : 'portée à choisir';
      const conventions = Object.entries(operation.basisByUse ?? {}).map(([use, basis]) => `${useLabel(use as HopUse)} · ${replacementBasisLabel(basis)}`);
      return `Remplacer ${operation.sourceMaterialId ? materialName(operation.sourceMaterialId) : 'identité indisponible à choisir'} · ${coverage} · candidates ${operation.candidateMaterialIds?.length ?? 0} · ${conventions.length ? conventions.join(', ') : 'conventions à choisir par emploi'}`;
    }
  }
}

function archivedOperationFields(operation: HopV55ProgramOperationV1, program: HopDecisionProgram,
  materialName: (id: string) => string): Array<[string, string]> {
  const additionId = 'additionId' in operation ? operation.additionId : undefined;
  const addition = additionId ? program.additions.find(row => row.id === additionId) : undefined;
  const sourceMaterialId = ('sourceMaterialId' in operation ? operation.sourceMaterialId : undefined) ?? addition?.materialId;
  const sourceUse = ('sourceUse' in operation ? operation.sourceUse : undefined) ?? addition?.use;
  const rows: Array<[string, string]> = [['Identité de l’opération', operation.id]];
  if (operation.sourceSpan) rows.push(['Fragment source exact', operation.sourceSpan.text]);
  if (sourceMaterialId) rows.push(['Matière source · ID scellé', `${materialName(sourceMaterialId)} · ${sourceMaterialId}`]);
  else if (additionId) rows.push(['Ligne source · ID scellé', additionId]);
  if (sourceUse) rows.push(['Emploi source déclaré', useLabel(sourceUse)]);
  switch (operation.kind) {
    case 'add':
      rows.push(['Matière cible · ID scellé', operation.materialId ? `${materialName(operation.materialId)} · ${operation.materialId}` : 'non choisie']);
      rows.push(['Masse saisie', physicalMassLabel(operation.grams)]);
      rows.push(['Côté d’emploi', sideLabel(operation.targetScope)]);
      rows.push(['Emploi choisi', useLabel(operation.use)]);
      rows.push(['Conditions saisies', conditionSummary(operation.conditions)]);
      break;
    case 'remove':
      rows.push(['Quantité saisie', operation.quantity?.kind === 'entire' ? 'ligne entière'
        : operation.quantity?.kind === 'partial' ? `${physicalMassLabel(operation.quantity.grams)} de la ligne` : 'non choisie']);
      rows.push(['Côté source', sideLabel(operation.sourceScope)]);
      break;
    case 'setDose':
      rows.push(['Quantité saisie', operation.quantity?.kind === 'target' ? `cible ${physicalMassLabel(operation.quantity.grams)}`
        : operation.quantity?.kind === 'delta' ? `${operation.quantity.direction} ${physicalMassLabel(operation.quantity.grams)}` : 'non choisie']);
      rows.push(['Côté source', sideLabel(operation.sourceScope)]);
      break;
    case 'move':
      rows.push(['Quantité saisie', operation.quantity?.kind === 'entire' ? 'ligne entière'
        : operation.quantity?.kind === 'partial' ? physicalMassLabel(operation.quantity.grams) : 'non choisie']);
      rows.push(['Nouvel emploi', useLabel(operation.use)]);
      rows.push(['Portée du déplacement', sideLabel(operation.sourceScope)]);
      rows.push(['Conditions saisies', conditionSummary(operation.conditions)]);
      if (operation.newAdditionId) rows.push(['Nouvelle ligne · ID scellé', operation.newAdditionId]);
      break;
    case 'replace':
      rows.push(['Matière cible · ID scellé', operation.materialId ? `${materialName(operation.materialId)} · ${operation.materialId}` : 'non choisie']);
      rows.push(['Dose / convention saisie', operation.dose?.kind === 'explicit' ? physicalMassLabel(operation.dose.grams)
        : operation.dose?.kind === 'basis' ? `${replacementBasisLabels[operation.dose.basis]}${operation.dose.fraction == null ? '' : ` · fraction ${localizedNumber(operation.dose.fraction)}`}${operation.dose.chosenGrams == null ? '' : ` · ${localizedNumber(operation.dose.chosenGrams)} g`}`
          : 'non choisie']);
      rows.push(['Côté source', sideLabel(operation.sourceScope)]);
      break;
    case 'replaceUnavailable':
      rows.push(['Identité indisponible · ID scellé', operation.sourceMaterialId ? `${materialName(operation.sourceMaterialId)} · ${operation.sourceMaterialId}` : 'non choisie']);
      rows.push(['Portée', operation.coverage?.kind === 'allFuture' ? 'toutes les lignes futures'
        : operation.coverage?.kind === 'selectedLines' ? operation.coverage.additionIds.join(', ') || 'lignes non choisies' : 'non choisie']);
      rows.push(['Conventions par emploi', Object.entries(operation.basisByUse ?? {}).map(([use, basis]) =>
        `${useLabel(use as HopUse)} : ${replacementBasisLabel(basis)}`).join(' · ') || 'non choisies']);
      rows.push(['Candidates · IDs scellés', operation.candidateMaterialIds?.map(id => `${materialName(id)} · ${id}`).join(' ; ') || 'aucune']);
      if (operation.reason) rows.push(['Motif saisi', operation.reason]);
      break;
  }
  return rows;
}

function needFieldLabel(field: HopV55ProgramNeedV1['field']): string {
  if (field === 'source') return 'Ligne source à choisir';
  if (field === 'target') return 'Matière cible à choisir';
  if (field === 'quantity') return 'Quantité à préciser';
  if (field === 'use') return 'Emploi à choisir';
  if (field === 'conditions') return 'Conditions à préciser';
  if (field === 'basis') return 'Convention à choisir';
  if (field === 'coverage') return 'Portée à choisir';
  if (field === 'candidateMaterials') return 'Matières candidates à choisir';
  if (field === 'replacementPath') return 'Voie de remplacement à choisir';
  return 'À préciser';
}

function ArchivedProgramPreparation({ preparation, historical, reference, onCompare, onResume, resumeRequest, onResumeArchived }: {
  preparation: HopV55ArchivedDecisionProgramPreparationV1; historical: boolean;
  reference?: string; onCompare?(request: HopV55DecisionProgramComparisonRequest): void | Promise<void>; onResume?(): void;
  resumeRequest?: HopV55DecisionProgramResumeRequestV1;
  onResumeArchived?(request: HopV55DecisionProgramResumeRequestV1): void | Promise<void>;
}) {
  const [resumePending, setResumePending] = useState(false);
  const [resumeError, setResumeError] = useState('');
  const { input, result } = preparation;
  const materialName = (id: string) => input.materials.find(row => row.id === id)?.name ?? `Matière non résolue · ${id}`;
  const statusLabel = result.status === 'ready' ? 'Proposition prête à examiner' : result.status === 'needsInput' ? 'Préparation incomplète' : 'Préparation bloquée';
  const formatVersionLabel = result.version === 'hop-v55-program-preparation-v1' ? 'Format · V1' : 'Format · non reconnu';
  async function resumeArchivedPreparation() {
    if (!resumeRequest || !onResumeArchived || resumePending) return;
    setResumePending(true); setResumeError('');
    try { await onResumeArchived(resumeRequest); }
    catch (caught) { setResumeError((caught as Error)?.message ?? 'La reprise n’a pas pu être transmise pour vérification.'); }
    finally { setResumePending(false); }
  }
  return <section className="hv-decision-preparation__archive" aria-label="Préparation de programme archivée">
    <header><div className="hv-decision-preparation__archive-heading"><strong>Préparation de programme</strong><span>{statusLabel}</span></div>
      <span>{formatVersionLabel}</span></header>
    <details className="hv-decision-preparation__archived-identities hv-decision-preparation__archive-references">
      <summary>Références exactes</summary>
      <dl>
        <dt>Format exact</dt><dd><code>{result.version}</code></dd>
        {reference ? <><dt>Archive de la lecture</dt><dd><code>{reference}</code></dd></> : null}
        <dt>Programme évalué</dt><dd><code>{result.programReference}</code></dd>
      </dl>
    </details>
    <p>« {input.branch.label} » · {input.operations.length} opération{input.operations.length === 1 ? '' : 's'} · aucune recette n’est modifiée depuis cette archive.</p>
    {result.status !== 'ready' ? <p className="hv-decision-preparation__archive-incomplete" role="status">
      Aucune branche n’a été créée. Les choix ci-dessous restent à préciser avant toute comparaison.
    </p> : null}
    {input.operations.map((operation, operationIndex) => {
      const evaluation = result.evaluations.find(row => row.operationId === operation.id);
      return <article className="hv-decision-preparation__archived-operation" key={operation.id}>
        <strong>{operation.label}</strong><span>{operationKindLabels[operation.kind]} · {evaluation?.status === 'ready' ? 'prête' : evaluation?.status === 'blocked' ? 'bloquée' : 'à compléter'}</span>
        <p className="hv-decision-preparation__archived-input" aria-label={`Entrée exacte de l’opération ${operationIndex + 1}`}>
          <strong>Entrée exacte · </strong>{archivedOperationSummary(operation, input.program, materialName)}
        </p>
        {operation.sourceSpan ? <blockquote className="hv-decision-preparation__archived-source">
          Fragment de question conservé · « {operation.sourceSpan.text} »
        </blockquote> : null}
        <details className="hv-decision-preparation__archived-identities">
          <summary>Identités et valeurs scellées</summary>
          <dl>{archivedOperationFields(operation, input.program, materialName).map(([label, value], index) => <React.Fragment key={`${operation.id}-${index}`}>
            <dt>{label}</dt><dd>{value}</dd>
          </React.Fragment>)}</dl>
        </details>
        {evaluation?.comparison ? <ProgramMaterialComparison comparison={evaluation.comparison} materials={input.materials} /> : null}
        {evaluation?.reasons.map((reason, index) => <p role="status" key={`${operation.id}-reason-${index}`}>{reason}</p>)}
        {evaluation?.needs.map((need, index) => <div className="hv-decision-preparation__need" key={`${operation.id}-need-${index}`}>
          <strong>{needFieldLabel(need.field)}</strong>
          <p>{need.reason}</p>{need.choices?.length ? <ul>{need.choices.map(choice => <li key={choice.id}>{choice.label} · ID exact {choice.id}</li>)}</ul> : null}
        </div>)}
      </article>;
    })}
    {result.needs.filter(need => !need.operationId).map((need, index) => <div className="hv-decision-preparation__need" key={`global-need-${index}`}>
      <strong>{needFieldLabel(need.field)}</strong><p>{need.reason}</p>
      {need.choices?.length ? <ul>{need.choices.map(choice => <li key={choice.id}>{choice.label} · ID exact {choice.id}</li>)}</ul> : null}
    </div>)}
    {result.status !== 'ready' && !historical && onResume ? <button type="button" className="hv-decision-preparation__resume" onClick={onResume}>
      Reprendre les choix manquants
    </button> : null}
    {result.status !== 'ready' && historical && resumeRequest && onResumeArchived ? <>
      <p className="hv-decision-preparation__archive-note">La reprise transmet les opérations et choix scellés au contrôle du programme, des identités de ligne, des matières et des références actives. Si le contexte a changé, la nouvelle préparation détaillera les champs à vérifier sans effacer ces choix. Aucun J5 n’est lancé.</p>
      <button type="button" className="hv-decision-preparation__resume" disabled={resumePending}
        onClick={() => void resumeArchivedPreparation()}>
        {resumePending ? 'Vérification du contexte…' : 'Reprendre cette préparation dans le contexte actif'}
      </button>
      {resumeError ? <p role="alert" className="hv-decision-preparation__error">{resumeError}</p> : null}
    </> : result.status !== 'ready' && historical && onResumeArchived ? <p className="hv-decision-preparation__archive-note" role="status">
      Reprise indisponible : la référence de cette archive ou le programme actif exact manque. Aucune recette vide n’est supposée.
    </p> : null}
    {result.status === 'ready' && result.proposal ? <section className="hv-decision-preparation__proposal" aria-label="Programme proposé">
      <h4>Programme proposé · application distincte</h4>
      <p>Applicabilité · {result.proposal.applicability === 'available' ? 'disponibilité déclarée dans ce contexte' : result.proposal.applicability === 'conditional' ? 'sous conditions' : 'indisponible dans ce contexte'}</p>
      <ul>{result.proposal.program.additions.map(line => <li key={line.id}>{materialName(line.materialId)} · {line.grams === null ? 'masse inconnue' : `${localizedNumber(line.grams)} g physiques`} · {useLabel(line.use)} · {line.status === 'performed' ? 'effectué, conservé' : 'prévu'}</li>)}</ul>
      {result.proposal.stock.length ? <details><summary>Disponibilité évaluée par matière · {result.proposal.stock.length}</summary><ul>
        {result.proposal.stock.map((stock, index) => <li key={`${stock.materialId}-${index}`}>{materialName(stock.materialId)} · besoin {stock.neededGrams === null ? 'inconnu' : `${localizedNumber(stock.neededGrams)} g`} ·
          {stock.availableGrams === null ? ' disponibilité inconnue' : ` ${localizedNumber(stock.availableGrams)} g déclarés`} · {stock.status === 'available' ? 'suffisante dans ce contexte' : stock.status === 'insufficient' ? 'insuffisante dans ce contexte' : stock.status === 'referenceOnly' ? 'référence seule' : 'à vérifier'}</li>)}
      </ul></details> : null}
      {result.proposal.conditions.map((condition, index) => <p key={`proposal-condition-${index}`}>{condition}</p>)}
      <p className="hv-decision-preparation__note">Cette proposition reste une hypothèse; le programme source et les lignes effectuées ne sont pas réécrits.</p>
      {!historical && onCompare && reference ? <button type="button" className="hv-decision-preparation__compare" onClick={() => void onCompare({ preparationReference: reference })}>
        Comparer cette proposition à la référence
      </button> : null}
      {historical ? <p>Archive en lecture seule; aucune comparaison J5 n’est relancée depuis cette vue.</p> : null}
    </section> : null}
  </section>;
}

export function HopV55DecisionProgramPreparation({ reading, sourceReadingReference, program, materials, preparation, preparationReference,
  initialOption, operationDrafts = [], historical = false, saving = false, error, onPrepareProgram, onCompareProgramPreparation,
  resumeExpectedContext, onResumeArchivedProgramPreparation, onCancel }: {
  reading: HopV55QuestionReading | HopV55SemanticQuestionReadingV1;
  sourceReadingReference?: string;
  program?: HopDecisionProgram;
  materials: HopDecisionMaterial[];
  preparation?: HopV55ArchivedDecisionProgramPreparationV1;
  preparationReference?: string;
  initialOption?: HopAdviceOption;
  operationDrafts?: HopV55ProgramOperationV1[];
  historical?: boolean;
  saving?: boolean;
  error?: string;
  onPrepareProgram?(request: HopV55DecisionProgramPreparationRequest): void | Promise<void>;
  onCompareProgramPreparation?(request: HopV55DecisionProgramComparisonRequest): void | Promise<void>;
  resumeExpectedContext?: HopV55DecisionProgramResumeContextV1;
  onResumeArchivedProgramPreparation?(request: HopV55DecisionProgramResumeRequestV1): void | Promise<void>;
  onCancel?(): void;
}) {
  const formProgram = historical ? preparation?.input.program : program;
  const formMaterials = historical ? preparation?.input.materials ?? materials : materials;
  const initialOps = preparation?.input.operations ?? (operationDrafts.length ? operationDrafts : seedOperations(initialOption, formProgram));
  const [operations, setOperations] = useState<HopV55ProgramOperationV1[]>(() => structuredClone(initialOps));
  const [branchLabel, setBranchLabel] = useState(() => preparation?.input.branch.label ?? initialOption?.title ?? 'Proposition de programme');
  const [localError, setLocalError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [doseModes, setDoseModes] = useState<Record<string, 'explicit' | 'basis' | 'target' | 'delta' | ''>>({});
  const [doseDirections, setDoseDirections] = useState<Record<string, 'increase' | 'decrease' | ''>>({});
  const [availabilityCandidateDrafts, setAvailabilityCandidateDrafts] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const archivedOperationFingerprint = JSON.stringify(preparation?.input.operations ?? []);
  const [lastSourceKey, setLastSourceKey] = useState(`${sourceReadingReference ?? ''}|${archivedOperationFingerprint}|${initialOption?.id ?? ''}`);
  const sourceKey = `${sourceReadingReference ?? ''}|${archivedOperationFingerprint}|${JSON.stringify(operationDrafts)}|${initialOption?.id ?? ''}`;
  const operationsChanged = !!preparation && JSON.stringify(operations) !== JSON.stringify(preparation.input.operations);
  const labelChanged = !!preparation && branchLabel !== preparation.input.branch.label;
  const draftChanged = operationsChanged || labelChanged;
  const intent = reading.response?.intent;
  const resumeRequest = historical && preparation && preparationReference && resumeExpectedContext
    ? { archiveReference: preparationReference, preparation: structuredClone(preparation), expectedContext: structuredClone(resumeExpectedContext) }
    : undefined;

  useEffect(() => {
    if (sourceKey === lastSourceKey) return;
    setOperations(structuredClone(initialOps));
    setBranchLabel(preparation?.input.branch.label ?? initialOption?.title ?? 'Proposition de programme');
    setLocalError(''); setSubmitting(false); setDoseModes({}); setDoseDirections({}); setAvailabilityCandidateDrafts({});
    setLastSourceKey(sourceKey);
  }, [sourceKey, lastSourceKey, initialOps, preparation?.input.branch.label, initialOption?.title]);

  function updateOperation(id: string, update: (operation: HopV55ProgramOperationV1) => HopV55ProgramOperationV1) {
    setOperations(rows => rows.map(operation => operation.id === id ? update(operation) : operation));
    setLocalError('');
  }

  function changeKind(operation: HopV55ProgramOperationV1, kind: HopV55ProgramOperationV1['kind']) {
    const replacement = createEmptyOperation(kind);
    updateOperation(operation.id, current => ({ ...replacement, id: current.id, label: current.label,
      ...(current.sourceSpan ? { sourceSpan: structuredClone(current.sourceSpan) } : {}) } as HopV55ProgramOperationV1));
    setDoseModes(current => ({ ...current, [operation.id]: '' }));
    setDoseDirections(current => ({ ...current, [operation.id]: '' }));
  }

  function pickSource(operationId: string, line?: HopProgramAddition) {
    updateOperation(operationId, current => {
      if (current.kind === 'remove' || current.kind === 'setDose' || current.kind === 'move' || current.kind === 'replace') {
        return { ...current, ...(line ? { additionId: line.id, sourceMaterialId: line.materialId, sourceUse: line.use } : { additionId: undefined, sourceMaterialId: undefined, sourceUse: undefined }) };
      }
      return current;
    });
  }

  function setUse(operationId: string, use: HopUse | '') {
    updateOperation(operationId, current => {
      const conditions = current.kind === 'add' || current.kind === 'move' ? current.conditions : undefined;
      if (current.kind === 'add' || current.kind === 'move') return { ...current, use: use || undefined, conditions };
      return current;
    });
  }

  function setOperationConditions(operationId: string, field: keyof NonNullable<Extract<HopV55ProgramOperationV1, { kind: 'add' | 'move' }>['conditions']>, value: number | undefined) {
    updateOperation(operationId, current => {
      if (current.kind !== 'add' && current.kind !== 'move') return current;
      const conditions = { ...(current.conditions ?? {}) };
      if (value === undefined) delete conditions[field]; else conditions[field] = value;
      return { ...current, conditions };
    });
  }

  function chooseReplacementPath(operationId: string, pathId: string) {
    updateOperation(operationId, current => {
      if (current.kind !== 'replaceUnavailable') return current;
      if (!pathId) return { ...current, selection: undefined };
      const retainedDoses = current.selection?.pathId === pathId ? current.selection.dosesByAdditionId : undefined;
      return { ...current, selection: { pathId, ...(retainedDoses ? { dosesByAdditionId: { ...retainedDoses } } : {}) } };
    });
  }

  function chooseReplacementDose(operationId: string, pathId: string, additionId: string, grams: number | undefined) {
    updateOperation(operationId, current => {
      if (current.kind !== 'replaceUnavailable' || current.selection?.pathId !== pathId) return current;
      const dosesByAdditionId = { ...(current.selection.dosesByAdditionId ?? {}) };
      if (grams === undefined) delete dosesByAdditionId[additionId]; else dosesByAdditionId[additionId] = grams;
      return { ...current, selection: { pathId, ...(Object.keys(dosesByAdditionId).length ? { dosesByAdditionId } : {}) } };
    });
  }

  function resumeFirstNeed() {
    const form = formRef.current;
    if (!form) return;
    const need = preparation?.result.needs[0];
    const operation = need?.operationId
      ? [...form.querySelectorAll<HTMLElement>('[data-operation-id]')].find(row => row.dataset.operationId === need.operationId)
      : undefined;
    const root = operation ?? form;
    const selectors: Record<HopV55ProgramNeedV1['field'], string[]> = {
      source: ['select[aria-label^="Ligne source"]'],
      target: ['select[aria-label^="Identité cible"]'],
      quantity: ['input[aria-label*="Masse"]', 'select[aria-label^="Quantité"]', 'select[aria-label^="Type de quantité"]'],
      use: ['select[aria-label^="Emploi"]'],
      conditions: ['input[aria-label^="Temps"]', 'input[aria-label^="Contact"]', 'input[aria-label^="Température"]', 'input[aria-label^="Jour"]'],
      basis: ['select[aria-label^="Convention "]', 'select[aria-label^="Mode de dose"]', 'select[aria-label^="Convention de dose"]'],
      coverage: ['select[aria-label^="Portée de la substitution"]', 'select[aria-label^="Ligne concernée"]'],
      candidateMaterials: ['select[aria-label^="Ajouter une matière candidate"]'],
      replacementPath: ['select[aria-label^="Voie de remplacement"]', 'select[aria-label^="Portée"]'],
      reason: ['input[aria-label^="Motif d’indisponibilité"]'],
      operations: ['select[aria-label^="Type de l’opération"]', 'select[aria-label="Type du nouveau geste"]'],
      freshness: [],
    };
    const candidates = need ? selectors[need.field] : [];
    const missingReplacementBasis = need?.field === 'replacementPath'
      ? [...root.querySelectorAll<HTMLSelectElement>('select[aria-label^="Convention "]')]
        .find(node => !node.hasAttribute('disabled') && !node.value)
      : undefined;
    const target = missingReplacementBasis ?? candidates.map(selector => root.querySelector<HTMLElement>(selector)).find(node => node && !node.hasAttribute('disabled'))
      ?? root.querySelector<HTMLElement>('input:not([disabled]), select:not([disabled]), textarea:not([disabled])');
    (target ?? form).scrollIntoView({ block: 'center', inline: 'nearest' });
    target?.focus();
  }

  function chooseQuantityKind(operation: Extract<HopV55ProgramOperationV1, { kind: 'remove' | 'move' }>, kind: '' | 'entire' | 'partial') {
    updateOperation(operation.id, current => {
      if (current.kind !== 'remove' && current.kind !== 'move') return current;
      if (!kind) return { ...current, quantity: undefined, ...(current.kind === 'move' ? { newAdditionId: undefined } : {}) };
      if (kind === 'entire') return { ...current, quantity: { kind: 'entire' }, ...(current.kind === 'move' ? { newAdditionId: undefined } : {}) };
      return { ...current, quantity: { kind: 'partial', grams: null }, ...(current.kind === 'move' ? { newAdditionId: current.newAdditionId ?? nextStableId('scenario-hop') } : {}) };
    });
  }

  const materialsById = useMemo(() => new Map(formMaterials.map(material => [material.id, material])), [formMaterials]);
  const currentOperationsInArchive = preparation?.input.operations ?? [];

  function renderUseAndConditions(operation: Extract<HopV55ProgramOperationV1, { kind: 'add' | 'move' }>) {
    const condition = operation.conditions ?? {};
    const targetScope = operation.kind === 'add' ? operation.targetScope : undefined;
    const scopedUses = useRows.filter(row => scopeMatchesUse(row.value, targetScope));
    const currentUseOutsideScope = operation.use && !scopeMatchesUse(operation.use, targetScope);
    return <>
      <label className="hv-decision-preparation__field"><span>Nouvel emploi</span>
        <select aria-label={`Emploi de l’opération ${operation.id}`} disabled={historical} value={operation.use ?? ''}
          onChange={event => setUse(operation.id, event.target.value as HopUse | '')}>
          <option value="">À préciser</option>{currentUseOutsideScope ? <option value={operation.use} disabled>{useLabel(operation.use)} · ne correspond pas au filtre</option> : null}
          {scopedUses.map(row => <option key={row.value} value={row.value}>{row.label}</option>)}
        </select>
      </label>
      {operation.use === 'boil' ? <HopV55ExactInput label={`Temps d’ébullition de l’opération ${operation.id}`} unit="min" min={0}
        value={condition.boilMinutes ?? undefined} onValue={value => setOperationConditions(operation.id, 'boilMinutes', value)} /> : null}
      {operation.use === 'whirlpool' || operation.use === 'fermentation' || operation.use === 'postFermentation' ? <>
        <HopV55ExactInput label={`Temps de contact de l’opération ${operation.id}`} unit="h" min={0}
          value={condition.contactHours ?? undefined} onValue={value => setOperationConditions(operation.id, 'contactHours', value)} />
        <HopV55ExactInput label={`Température de l’opération ${operation.id}`} unit="°C" min={-273.15}
          value={condition.temperatureC ?? undefined} onValue={value => setOperationConditions(operation.id, 'temperatureC', value)} />
      </> : null}
      <HopV55ExactInput label={`Jour de l’opération ${operation.id}`} unit="jour" min={0} value={condition.dayOffset ?? undefined}
        onValue={value => setOperationConditions(operation.id, 'dayOffset', value)} />
      <p className="hv-decision-preparation__note">Un emploi à froid ne précise pas à lui seul fermentation active ou après fermentation. Contact et température restent inconnus tant qu’ils ne sont pas saisis.</p>
    </>;
  }

  function renderOperation(operation: HopV55ProgramOperationV1, index: number) {
    const operationId = operation.id;
    const selectedSourceLine = program?.additions.find(line => line.id === ('additionId' in operation ? operation.additionId : undefined));
    const sourceMaterialFilter = 'sourceMaterialId' in operation ? operation.sourceMaterialId : undefined;
    const sourceScopeFilter = 'sourceScope' in operation ? operation.sourceScope : undefined;
    const sourceUseFilter = 'sourceUse' in operation ? operation.sourceUse : undefined;
    const possibleSourceLines = program?.additions.filter(line => line.status === 'planned'
      && (!sourceMaterialFilter || line.materialId === sourceMaterialFilter)
      && (!sourceUseFilter || line.use === sourceUseFilter)
      && scopeMatchesUse(line.use, sourceScopeFilter)) ?? [];
    const sourceLine = selectedSourceLine?.status === 'planned' ? selectedSourceLine
      : !selectedSourceLine && possibleSourceLines.length === 1 ? possibleSourceLines[0] : undefined;
    const sourceMaterialId = sourceLine?.materialId ?? (operation.kind === 'replaceUnavailable' ? operation.sourceMaterialId : undefined);
    const targetMaterialId = 'materialId' in operation ? operation.materialId : undefined;
    let comparison: HopMaterialComparison | undefined;
    if (operation.kind === 'replace' && sourceMaterialId && targetMaterialId) {
      const source = materialsById.get(sourceMaterialId); const target = materialsById.get(targetMaterialId);
      if (source && target && source.id !== target.id) {
        try { comparison = compareHopMaterials(source, target); } catch { comparison = undefined; }
      }
    }
    const sourceScope = 'sourceScope' in operation ? operation.sourceScope : undefined;
    const sourceSelect = (ariaLabel: string) => <SourceLinePicker program={formProgram} materials={formMaterials}
      value={'additionId' in operation ? operation.additionId : undefined} scope={sourceScope} disabled={historical} ariaLabel={ariaLabel}
      onChange={line => pickSource(operationId, line)} />;
    const targetPicker = (label: string, value: string | undefined, onChange: (value: string) => void,
      ariaLabel = `Identité cible de l’opération ${operationId}`, programForSource?: HopDecisionProgram) => <ProgramMaterialPicker label={label}
      ariaLabel={ariaLabel} materials={formMaterials} value={value} disabled={historical} program={programForSource} onChange={onChange} />;
    const formMaterialName = (id: string) => materialsById.get(id)?.name ?? `Matière non résolue · ${id}`;
    const unavailableBasisGroups = new Map<HopUse, HopProgramAddition[]>();
    if (operation.kind === 'replaceUnavailable' && operation.sourceMaterialId) {
      const selectedLineIds = operation.coverage?.kind === 'selectedLines' ? new Set(operation.coverage.additionIds) : undefined;
      for (const line of program?.additions ?? []) {
        if (line.status !== 'planned' || line.materialId !== operation.sourceMaterialId
          || selectedLineIds && !selectedLineIds.has(line.id)) continue;
        unavailableBasisGroups.set(line.use, [...(unavailableBasisGroups.get(line.use) ?? []), line]);
      }
    }
    const unavailableRelatedLines: HopProgramAddition[] = [];
    if (operation.kind === 'replaceUnavailable' && operation.sourceMaterialId && !unavailableBasisGroups.size) {
      const selected = materialsById.get(operation.sourceMaterialId);
      const varieties = new Set(selected ? materialVarietyIds(selected) : []);
      const selectedLineIds = operation.coverage?.kind === 'selectedLines' ? new Set(operation.coverage.additionIds) : undefined;
      if (varieties.size) for (const line of program?.additions ?? []) {
        const linkedMaterial = materialsById.get(line.materialId);
        if (line.status === 'planned' && (!selectedLineIds || selectedLineIds.has(line.id))
          && line.materialId !== operation.sourceMaterialId && linkedMaterial
          && materialVarietyIds(linkedMaterial).some(id => varieties.has(id))) unavailableRelatedLines.push(line);
      }
    }
    const archivedOperation = preparation?.input.operations.find(row => row.id === operation.id);
    const archivedEvaluation = preparation?.result.evaluations.find(row => row.operationId === operation.id);
    const replacementInputsMatch = operation.kind === 'replaceUnavailable' && archivedOperation?.kind === 'replaceUnavailable'
      && hopDecisionReference(replacementPlanInputs(operation)) === hopDecisionReference(replacementPlanInputs(archivedOperation));
    const replacementContextFresh = !!preparationReference && !!formProgram && !!preparation
      && preparation.result.programReference === programFingerprint(formProgram)
      && hopDecisionReference(preparation.input.materials) === hopDecisionReference(formMaterials)
      && preparation.input.intent.question === reading.intent.question
      && preparation.input.intent.interpretation === reading.interpretation;
    const replacementEvaluation = replacementInputsMatch && replacementContextFresh ? archivedEvaluation : undefined;
    const replacementPlanner = replacementEvaluation?.planner;
    const replacementCoverageNeed = replacementEvaluation?.needs.find(need => need.field === 'coverage');
    const archivedPlannerIsStale = operation.kind === 'replaceUnavailable' && !!archivedEvaluation?.planner
      && (!replacementInputsMatch || !replacementContextFresh);
    const unavailableSavedBases = operation.kind === 'replaceUnavailable'
      ? Object.entries(operation.basisByUse ?? []).filter(([use]) => !unavailableBasisGroups.has(use as HopUse)) : [];
    const unavailableBasisEditor = operation.kind === 'replaceUnavailable' ? <section className="hv-decision-preparation__replacement-bases"
      aria-label="Conventions de remplacement par emploi">
      <strong>Convention à choisir pour chaque emploi ciblé</strong>
      {!operation.sourceMaterialId ? <p>Choisis l’identité exacte indisponible pour afficher les emplois présents dans le programme source. Aucune convention n’est présélectionnée.</p>
        : !unavailableBasisGroups.size ? unavailableRelatedLines.length ? <>
          <p>La fiche choisie n’est portée par aucune ligne exacte du programme. Ces lignes partagent un `varietyId` structuré; chacune garde son ID, sa masse et son emploi. Elles ne sont ni sélectionnées ni regroupées. Choisis l’identité exacte d’une ligne si elle correspond à la matière indisponible.</p>
          <section className="hv-decision-preparation__related-program-lines" aria-label="Lignes prévues liées par varietyId">
            <strong>Lignes distinctes liées · choix requis</strong>
            <ul>{unavailableRelatedLines.map(line => <li key={line.id}><code>{line.id}</code> · ID matière <code>{line.materialId}</code> ·
              {line.grams === null ? ' masse inconnue' : ` ${localizedNumber(line.grams)} g`} · {useLabel(line.use)}</li>)}</ul>
          </section>
        </> : <p>{operation.coverage?.kind === 'selectedLines'
          ? 'Aucune ligne prévue de cette identité exacte n’est ciblée; une fiche liée à la même variété reste une autre identité, non choisie.'
          : 'Aucune ligne prévue de cette identité exacte n’est présente dans le programme transmis; aucun emploi n’est déduit.'}</p>
          : <div className="hv-decision-preparation__replacement-basis-list">{[...unavailableBasisGroups].map(([use, lines]) => <label className="hv-decision-preparation__field"
            key={use}><span>Convention pour {useLabel(use)}</span>
            <small>Ligne{lines.length === 1 ? '' : 's'} ciblée{lines.length === 1 ? '' : 's'} · {lines.map(line => line.id).join(', ')} · {useLabel(use)}</small>
            <select aria-label={`Convention ${useLabel(use)} pour ${operationId}`} disabled={historical}
              value={operation.basisByUse?.[use] ?? ''} onChange={event => {
                const basis = event.target.value as HopPlannerDoseBasis | '';
                updateOperation(operation.id, current => {
                  if (current.kind !== 'replaceUnavailable') return current;
                  const basisByUse = { ...(current.basisByUse ?? {}) };
                  if (basis) basisByUse[use] = basis; else delete basisByUse[use];
                  return { ...current, basisByUse: Object.keys(basisByUse).length ? basisByUse : undefined };
                });
              }}>
              <option value="">À choisir explicitement</option>{replacementBasisChoices(use).map(row => <option key={row.value} value={row.value}>{row.label}</option>)}
            </select>
          </label>)}</div>}
      {unavailableSavedBases.length ? <details className="hv-decision-preparation__retained-bases">
        <summary>Conventions conservées pour d’autres emplois · {unavailableSavedBases.length}</summary>
        <ul>{unavailableSavedBases.map(([use, basis]) => <li key={use}>{useLabel(use as HopUse)} · {replacementBasisLabel(basis)}</li>)}</ul>
      </details> : null}
      <p className="hv-decision-preparation__note">Chaque choix reste lié aux emplois réels des lignes exactes affichées. Une inconnue reste à choisir; le nom de matière ne fournit aucune convention.</p>
    </section> : null;
    const selectedReplacementPath = operation.kind === 'replaceUnavailable' && replacementPlanner
      ? replacementPlanner.paths.find(path => path.pathId === operation.selection?.pathId) : undefined;
    const unavailablePathEditor = operation.kind === 'replaceUnavailable' ? archivedPlannerIsStale ? <p className="hv-decision-preparation__stale" role="status">
      Les identités, la portée, les conventions ou le contexte ont changé depuis ce plan. Réévalue les choix avant d’ouvrir une voie; aucun résultat ancien n’est repris.
    </p> : replacementCoverageNeed ? <section className="hv-decision-preparation__replacement-coverage" aria-label="Portée des lignes évaluées">
      <strong>La sélection partielle n’a pas été planifiée</strong>
      <p>{replacementCoverageNeed.reason}</p>
      {replacementCoverageNeed.choices?.length ? <ul>{replacementCoverageNeed.choices.map(choice => <li key={choice.id}>{choice.label} · ID exact {choice.id}</li>)}</ul> : null}
      <p>La portée reste celle choisie. « Toutes les lignes futures » est une décision distincte; le panneau ne l’étend pas automatiquement.</p>
    </section> : replacementPlanner ? <section className="hv-decision-preparation__replacement-plan" aria-label="Voies de remplacement calculées">
      <strong>Voies calculées par le planificateur</strong>
      <p>Chaque voie garde les identités et lignes retournées par le service. Choisis explicitement; aucun premier candidat n’est retenu par défaut.</p>
      {replacementPlanner.paths.some(path => replacementPathMissingUses(path).length) ? <p role="status">
        Des voies retournées gardent des emplois ou doses inconnus. Choisis leurs conventions exactes ci-dessus et réévalue avant de retenir une voie complète.
      </p> : null}
      {replacementPlanner.paths.length ? <label className="hv-decision-preparation__field"><span>Voie de remplacement</span>
        <select aria-label={`Voie de remplacement pour ${operationId}`} disabled={historical}
          value={replacementPlanner.paths.some(path => path.pathId === operation.selection?.pathId) ? operation.selection!.pathId : ''}
          onChange={event => chooseReplacementPath(operation.id, event.target.value)}>
          <option value="">Choisir une voie calculée</option>{replacementPlanner.paths.map(path => {
            const assignments = path.assignments.map(assignment => `${formMaterialName(assignment.candidateMaterialId)} · ${assignment.candidateMaterialId} · ${assignment.additionId} · ${useLabel(assignment.use)}`).join(' ; ');
            const missingUses = replacementPathMissingUses(path);
            return <option key={path.pathId} value={path.pathId} disabled={!replacementPathSelectable(path)}>
              {replacementPathKindLabel(path)} · {assignments || 'aucune ligne ciblée'} · {pathStatusLabels[path.status]}{missingUses.length ? ` · convention ou dose à choisir pour ${missingUses.map(useLabel).join(', ')}` : ''}
            </option>;
          })}
        </select>
      </label> : <p>Aucune voie n’est calculée pour ces choix. Les matières candidates ou les données documentaires restent à revoir.</p>}
      {selectedReplacementPath ? <article className="hv-decision-preparation__selected-path" aria-label="Détails de la voie choisie">
        <header><strong>{replacementPathKindLabel(selectedReplacementPath)}</strong>
          <span>{pathStatusLabels[selectedReplacementPath.status]} · {pathApplicabilityLabels[selectedReplacementPath.applicability]}</span></header>
        <ul>{selectedReplacementPath.assignments.map(assignment => <li key={assignment.additionId}>
          <strong>{assignment.additionId} · {useLabel(assignment.use)}</strong>
          <span>Source exacte · {formMaterialName(assignment.sourceMaterialId)} · {assignment.sourceMaterialId}</span>
          <span>Cible exacte · {formMaterialName(assignment.candidateMaterialId)} · {assignment.candidateMaterialId}</span>
          <span>Convention · {assignment.basis ? replacementBasisLabel(assignment.basis) : 'inconnue'}</span>
          <span>Dose retournée · {numericReading(assignment.doseGrams)}</span>
          {assignment.missing.length ? <small>Données à confirmer · {assignment.missing.join(' · ')}</small> : null}
          {assignment.status === 'choose' ? <HopV55ExactInput label={`Masse choisie pour ${assignment.additionId} · ${formMaterialName(assignment.candidateMaterialId)}`}
            unit="g" min={assignment.doseGrams.range?.min ?? 0} max={assignment.doseGrams.range?.max}
            value={operation.selection?.pathId === selectedReplacementPath.pathId
              ? operation.selection.dosesByAdditionId?.[assignment.additionId] : undefined}
            onValue={value => chooseReplacementDose(operation.id, selectedReplacementPath.pathId, assignment.additionId, value)} /> : null}
          {assignment.intent.length ? <section className="hv-decision-preparation__path-effects" aria-label={`Effets pour les critères exacts · ${assignment.additionId}`}>
            <strong>Effets par critère exact</strong>
            {assignment.intent.map((effect, effectIndex) => <article key={`${assignment.additionId}-${effect.criterion.id}-${effectIndex}`}>
              <strong>{effect.criterion.description} · {intentEvidenceStatusLabels[effect.status]}</strong>
              <p>{effect.consequence}</p>
              {effect.missingInformation.length ? <small>À vérifier · {effect.missingInformation.join(' · ')}</small> : null}
              {[...effect.candidateEvidence, ...effect.partnerEvidence].length ? <details className="hv-decision-preparation__path-evidence">
                <summary>Extraits et sources · {[...effect.candidateEvidence, ...effect.partnerEvidence].length}</summary>
                <ul>{[...effect.candidateEvidence, ...effect.partnerEvidence].map((evidence, index) => <li key={`${evidence.side}-${index}`}>
                  {evidence.term} · « {evidence.quote} » · {evidence.source.title} · {evidence.source.author}{evidence.source.year ? ` · ${evidence.source.year}` : ''}
                  {evidence.source.reference?.startsWith('http') ? <a href={evidence.source.reference} target="_blank" rel="noreferrer">Ouvrir la source</a>
                    : evidence.source.reference ? <code>{evidence.source.reference}</code> : null}
                  {evidence.source.locator ? <small>{evidence.source.locator}</small> : null}
                </li>)}</ul>
              </details> : null}
            </article>)}
          </section> : null}
        </li>)}</ul>
        {selectedReplacementPath.conditions.length ? <p><strong>Conditions de cette voie · </strong>{selectedReplacementPath.conditions.join(' · ')}</p> : null}
        {selectedReplacementPath.tradeoffs.length ? <p><strong>Compromis de cette voie · </strong>{selectedReplacementPath.tradeoffs.join(' · ')}</p> : null}
        <small>Changer de voie retire les masses saisies pour l’ancienne voie; doses non choisies et inconnues ne sont pas complétées.</small>
      </article> : null}
    </section> : archivedEvaluation?.needs.some(need => need.field === 'replacementPath') ? <p className="hv-decision-preparation__note">
      Le plan précédent n’est pas réutilisé tant que ses références exactes ne correspondent pas au programme et aux matières affichés.
    </p> : null : null;
    return <fieldset className="hv-decision-preparation__operation" data-operation-id={operation.id} key={operation.id}>
      <legend>Opération {index + 1} · {operationKindLabels[operation.kind]}</legend>
      <div className="hv-decision-preparation__fields">
        <label className="hv-decision-preparation__field"><span>Type d’opération</span>
          <select aria-label={`Type de l’opération ${index + 1}`} disabled={historical} value={operation.kind}
            onChange={event => changeKind(operation, event.target.value as HopV55ProgramOperationV1['kind'])}>
            {(Object.keys(operationKindLabels) as HopV55ProgramOperationV1['kind'][]).map(kind => <option key={kind} value={kind}>{operationKindLabels[kind]}</option>)}
          </select>
        </label>
        <label className="hv-decision-preparation__field"><span>Libellé de l’opération</span>
          <Input aria-label={`Libellé de l’opération ${index + 1}`} value={operation.label} disabled={historical}
            onChange={event => updateOperation(operationId, current => ({ ...current, label: event.target.value }))} />
        </label>
        {'sourceSpan' in operation && operation.sourceSpan ? <blockquote className="hv-decision-preparation__operation-source">Phrase conservée · <mark>{operation.sourceSpan.text}</mark></blockquote> : null}
        {operation.kind === 'add' ? <>
          <ProgramScopePicker label="Portée du côté d’emploi" operationId={operationId} value={operation.targetScope} disabled={historical}
            onChange={targetScope => updateOperation(operation.id, current => current.kind === 'add' ? { ...current, targetScope } : current)} />
          {targetPicker('Matière exacte à ajouter', operation.materialId, value => updateOperation(operation.id, current => current.kind === 'add' ? { ...current, materialId: value || undefined } : current))}
          <HopV55ExactInput label={`Masse à ajouter pour l’opération ${operationId}`} unit="g" min={0} value={operation.grams ?? undefined}
            onValue={value => updateOperation(operation.id, current => current.kind === 'add' ? { ...current, grams: value ?? null } : current)} />
          {renderUseAndConditions(operation)}
        </> : null}
        {operation.kind === 'remove' ? <>
          <ProgramScopePicker label="Portée de la source" operationId={operationId} value={operation.sourceScope} disabled={historical}
            onChange={sourceScope => updateOperation(operation.id, current => current.kind === 'remove' ? { ...current, sourceScope } : current)} />
          {sourceSelect(`Ligne source de l’opération ${operationId}`)}
          <label className="hv-decision-preparation__field"><span>Quantité à retirer</span>
            <select aria-label={`Quantité à retirer pour l’opération ${operationId}`} disabled={historical} value={operation.quantity?.kind ?? ''}
              onChange={event => chooseQuantityKind(operation, event.target.value as '' | 'entire' | 'partial')}>
              <option value="">À préciser</option><option value="entire">Retirer la ligne entière</option><option value="partial">Retirer une partie</option>
            </select>
          </label>
          {operation.quantity?.kind === 'partial' ? <HopV55ExactInput label={`Masse à retirer pour l’opération ${operationId}`} unit="g" min={0}
            value={operation.quantity.grams ?? undefined} onValue={value => updateOperation(operation.id, current => current.kind === 'remove'
              ? { ...current, quantity: { kind: 'partial', grams: value ?? null } } : current)} /> : null}
        </> : null}
        {operation.kind === 'setDose' ? <>
          <ProgramScopePicker label="Portée de la source" operationId={operationId} value={operation.sourceScope} disabled={historical}
            onChange={sourceScope => updateOperation(operation.id, current => current.kind === 'setDose' ? { ...current, sourceScope } : current)} />
          {sourceSelect(`Ligne source de l’opération ${operationId}`)}
          <label className="hv-decision-preparation__field"><span>Type de quantité</span>
            <select aria-label={`Type de quantité pour l’opération ${operationId}`} disabled={historical} value={doseModes[operation.id] ?? operation.quantity?.kind ?? ''}
              onChange={event => {
                const mode = event.target.value as '' | 'target' | 'delta'; setDoseModes(current => ({ ...current, [operation.id]: mode }));
                setDoseDirections(current => ({ ...current, [operation.id]: '' }));
                updateOperation(operation.id, current => current.kind === 'setDose' ? { ...current, quantity: mode === 'target' ? { kind: 'target', grams: null } : undefined } : current);
              }}>
              <option value="">À préciser</option><option value="target">Masse cible</option><option value="delta">Variation de masse</option>
            </select>
          </label>
          {(doseModes[operation.id] ?? operation.quantity?.kind) === 'delta' ? <label className="hv-decision-preparation__field"><span>Sens de la variation</span>
            <select aria-label={`Sens de la variation pour l’opération ${operationId}`} disabled={historical} value={doseDirections[operation.id] ?? (operation.quantity?.kind === 'delta' ? operation.quantity.direction : '')}
              onChange={event => { const direction = event.target.value as '' | 'increase' | 'decrease'; setDoseDirections(current => ({ ...current, [operation.id]: direction }));
                if (direction) updateOperation(operation.id, current => current.kind === 'setDose' ? { ...current, quantity: { kind: 'delta', grams: current.quantity?.grams ?? null, direction } } : current); }}>
              <option value="">À choisir</option><option value="increase">Augmenter</option><option value="decrease">Diminuer</option>
            </select>
          </label> : null}
          {(doseModes[operation.id] ?? operation.quantity?.kind) === 'target' || (doseModes[operation.id] ?? operation.quantity?.kind) === 'delta' ? <HopV55ExactInput label={`Masse ${operation.quantity?.kind === 'delta' ? 'de variation' : 'cible'} pour ${operationId}`} unit="g" min={0}
            value={operation.quantity?.grams ?? undefined} onValue={value => updateOperation(operation.id, current => {
              if (current.kind !== 'setDose' || !current.quantity) return current;
              return { ...current, quantity: { ...current.quantity, grams: value ?? null } } as HopV55ProgramOperationV1;
            })} /> : null}
        </> : null}
        {operation.kind === 'move' ? <>
          <ProgramScopePicker label="Portée de la source" operationId={operationId} value={operation.sourceScope} disabled={historical}
            onChange={sourceScope => updateOperation(operation.id, current => current.kind === 'move' ? { ...current, sourceScope } : current)} />
          {sourceSelect(`Ligne source de l’opération ${operationId}`)}
          <label className="hv-decision-preparation__field"><span>Portée du déplacement</span>
            <select aria-label={`Portée du déplacement pour l’opération ${operationId}`} disabled={historical} value={operation.quantity?.kind ?? ''}
              onChange={event => chooseQuantityKind(operation, event.target.value as '' | 'entire' | 'partial')}>
              <option value="">À préciser</option><option value="entire">Déplacer la ligne entière</option><option value="partial">Déplacer une portion</option>
            </select>
          </label>
          {operation.quantity?.kind === 'partial' ? <HopV55ExactInput label={`Masse à déplacer pour l’opération ${operationId}`} unit="g" min={0}
            value={operation.quantity.grams ?? undefined} onValue={value => updateOperation(operation.id, current => current.kind === 'move' && current.quantity?.kind === 'partial'
              ? { ...current, quantity: { kind: 'partial', grams: value ?? null } } : current)} /> : null}
          {operation.quantity?.kind === 'partial' ? <small>Nouvel ID stable de la ligne · {operation.newAdditionId ?? 'à générer'}</small> : null}
          {renderUseAndConditions(operation)}
        </> : null}
        {operation.kind === 'replace' ? <>
          <ProgramScopePicker label="Portée de la source" operationId={operationId} value={operation.sourceScope} disabled={historical}
            onChange={sourceScope => updateOperation(operation.id, current => current.kind === 'replace' ? { ...current, sourceScope } : current)} />
          {sourceSelect(`Ligne source de l’opération ${operationId}`)}
          {targetPicker('Matière exacte cible', operation.materialId, value => updateOperation(operation.id, current => current.kind === 'replace' ? { ...current, materialId: value || undefined } : current))}
          {comparison ? <ProgramMaterialComparison comparison={comparison} materials={formMaterials} /> : <p className="hv-decision-preparation__note">Choisis une ligne source et une matière cible exactes. Les matières ne sont jamais rapprochées par un nom approchant.</p>}
          <label className="hv-decision-preparation__field"><span>Dose cible ou convention</span>
            <select aria-label={`Mode de dose pour l’opération ${operationId}`} disabled={historical} value={doseModes[operation.id] ?? operation.dose?.kind ?? ''}
              onChange={event => { const mode = event.target.value as '' | 'explicit' | 'basis'; setDoseModes(current => ({ ...current, [operation.id]: mode }));
                updateOperation(operation.id, current => current.kind === 'replace' ? { ...current, dose: mode === 'explicit' ? { kind: 'explicit', grams: null } : undefined } : current); }}>
              <option value="">À préciser</option><option value="explicit">Saisir une dose cible</option><option value="basis">Choisir une convention documentée</option>
            </select>
          </label>
          {(doseModes[operation.id] ?? operation.dose?.kind) === 'explicit' ? <HopV55ExactInput label={`Masse cible pour ${operationId}`} unit="g" min={0}
            value={operation.dose?.kind === 'explicit' ? operation.dose.grams ?? undefined : undefined}
            onValue={value => updateOperation(operation.id, current => current.kind === 'replace' ? { ...current, dose: { kind: 'explicit', grams: value ?? null } } : current)} /> : null}
          {(doseModes[operation.id] ?? operation.dose?.kind) === 'basis' ? <label className="hv-decision-preparation__field"><span>Convention de dose</span>
            <select aria-label={`Convention de dose pour l’opération ${operationId}`} disabled={historical}
              value={operation.dose?.kind === 'basis' ? operation.dose.basis : ''}
              onChange={event => { const basis = event.target.value as HopReplacementBasis | ''; updateOperation(operation.id, current => current.kind === 'replace'
                ? { ...current, dose: basis ? { kind: 'basis', basis } : undefined } : current); }}>
              <option value="">À choisir explicitement</option>{Object.entries(replacementBasisLabels).map(([basis, label]) => <option key={basis} value={basis}>{label}</option>)}
            </select>
          </label> : null}
          {operation.dose?.kind === 'basis' ? <>
            <HopV55ExactInput label={`Fraction d’application pour ${operationId}`} min={0} max={1} value={operation.dose.fraction}
              onValue={value => updateOperation(operation.id, current => current.kind === 'replace' && current.dose?.kind === 'basis'
                ? { ...current, dose: { ...current.dose, ...(value === undefined ? { fraction: undefined } : { fraction: value }) } } : current)} />
            <HopV55ExactInput label={`Dose choisie dans la plage pour ${operationId}`} unit="g" min={0} value={operation.dose.chosenGrams}
              onValue={value => updateOperation(operation.id, current => current.kind === 'replace' && current.dose?.kind === 'basis'
                ? { ...current, dose: { ...current.dose, ...(value === undefined ? { chosenGrams: undefined } : { chosenGrams: value }) } } : current)} />
            <p className="hv-decision-preparation__note">Le domaine vérifiera si cette convention est documentée pour la paire et l’emploi. Aucune valeur de remplacement n’est présélectionnée.</p>
          </> : null}
        </> : null}
        {operation.kind === 'replaceUnavailable' ? <>
          {targetPicker('Identité exacte déclarée indisponible', operation.sourceMaterialId,
            value => updateOperation(operation.id, current => current.kind === 'replaceUnavailable' ? { ...current, sourceMaterialId: value || undefined } : current),
            `Source indisponible exacte pour ${operationId}`, formProgram)}
          <label className="hv-decision-preparation__field"><span>Portée concernée</span>
            <select aria-label={`Portée de la substitution ${operationId}`} disabled={historical} value={operation.coverage?.kind ?? ''}
              onChange={event => { const coverage = event.target.value as '' | 'allFuture' | 'selectedLines'; updateOperation(operation.id, current => current.kind === 'replaceUnavailable'
                ? { ...current, coverage: coverage === 'allFuture' ? { kind: 'allFuture' } : coverage === 'selectedLines' ? { kind: 'selectedLines', additionIds: [] } : undefined } : current); }}>
              <option value="">À choisir</option><option value="allFuture">Toutes les lignes futures</option><option value="selectedLines">Ligne(s) choisie(s)</option>
            </select>
          </label>
          {operation.coverage?.kind === 'selectedLines' ? <label className="hv-decision-preparation__field"><span>Ligne exacte concernée</span>
            <select aria-label={`Ligne concernée par la substitution ${operationId}`} disabled={historical} value={operation.coverage.additionIds[0] ?? ''}
              onChange={event => updateOperation(operation.id, current => current.kind === 'replaceUnavailable' && current.coverage?.kind === 'selectedLines'
                ? { ...current, coverage: { kind: 'selectedLines', additionIds: event.target.value ? [event.target.value] : [] } } : current)}>
              <option value="">Choisir une ligne prévue</option>{program?.additions.filter(row => row.status === 'planned'
                && row.materialId === operation.sourceMaterialId).map(line => <option key={line.id} value={line.id}>{line.id} · {materialsById.get(line.materialId)?.name ?? line.materialId} · {useLabel(line.use)}</option>)}
            </select>
          </label> : null}
          {unavailableBasisEditor}
          <label className="hv-decision-preparation__field"><span>Pourquoi cette identité est indisponible ?</span>
            <Input aria-label={`Motif d’indisponibilité ${operationId}`} value={operation.reason ?? ''} disabled={historical}
              onChange={event => updateOperation(operation.id, current => current.kind === 'replaceUnavailable' ? { ...current, reason: event.target.value || undefined } : current)} />
          </label>
          {targetPicker('Ajouter une matière candidate exacte à la liste', availabilityCandidateDrafts[operation.id],
            value => setAvailabilityCandidateDrafts(current => ({ ...current, [operation.id]: value })),
            `Matière candidate exacte à ajouter pour ${operationId}`)}
          <button type="button" disabled={historical || !availabilityCandidateDrafts[operation.id]} onClick={() => {
            const materialId = availabilityCandidateDrafts[operation.id];
            if (!materialId) return;
            updateOperation(operation.id, current => current.kind === 'replaceUnavailable'
              ? { ...current, candidateMaterialIds: [...new Set([...(current.candidateMaterialIds ?? []), materialId])] } : current);
            setAvailabilityCandidateDrafts(current => ({ ...current, [operation.id]: '' }));
          }}>Ajouter cette identité candidate</button>
          {operation.candidateMaterialIds?.length ? <ul className="hv-decision-preparation__candidate-list">{operation.candidateMaterialIds.map(id => <li key={id}>
            {materialsById.get(id)?.name ?? id} · ID exact {id}<button type="button" aria-label={`Retirer la candidate ${id}`} disabled={historical}
              onClick={() => updateOperation(operation.id, current => current.kind === 'replaceUnavailable' ? { ...current,
                candidateMaterialIds: (current.candidateMaterialIds ?? []).filter(candidate => candidate !== id) } : current)}>Retirer</button>
          </li>)}</ul> : <p className="hv-decision-preparation__note">Aucune candidate n’est présélectionnée.</p>}
          {unavailablePathEditor}
        </> : null}
      </div>
      <button type="button" className="hv-decision-preparation__remove" aria-label={`Retirer l’opération ${index + 1}`} disabled={historical}
        onClick={() => setOperations(rows => rows.filter(row => row.id !== operation.id))}>Retirer cette opération</button>
    </fieldset>;
  }

  async function saveDraft(event: React.FormEvent) {
    event.preventDefault(); setLocalError('');
    if (historical) { setLocalError('Cette archive est en lecture seule. Relis la demande dans le contexte actif pour préparer une nouvelle proposition.'); return; }
    if (!sourceReadingReference) { setLocalError('La référence de lecture corrigée manque; aucune opération ne sera détachée de sa lecture.'); return; }
    if (!formProgram) { setLocalError('Aucun programme exact n’est fourni. Déclare une référence avant de préparer des opérations.'); return; }
    if (!branchLabel.trim()) { setLocalError('Nomme la proposition de programme.'); return; }
    if (!onPrepareProgram) { setLocalError('La préparation et l’archivage des opérations ne sont pas disponibles dans ce contexte.'); return; }
    setSubmitting(true);
    try { await onPrepareProgram({ sourceReadingReference, branchLabel: branchLabel.trim(), operations: structuredClone(operations) }); }
    catch (caught) { setLocalError((caught as Error)?.message ?? 'La préparation n’a pas pu être conservée.'); setSubmitting(false); }
  }

  if (historical) return preparation ? <ArchivedProgramPreparation preparation={preparation}
    historical reference={preparationReference} onCompare={onCompareProgramPreparation} resumeRequest={resumeRequest}
    onResumeArchived={onResumeArchivedProgramPreparation} /> : null;
  return <section className="hv-decision-preparation__program" aria-label="Préparer plusieurs opérations de programme">
    <header><div><strong>Préparer les opérations ensemble</strong><p>Les lignes source, matières cibles, doses et emplois sont choisis séparément. Aucun changement n’est appliqué à la recette.</p></div>
      {onCancel ? <button type="button" onClick={onCancel}>Fermer</button> : null}</header>
    {operationDrafts.length ? <p className="hv-decision-preparation__note" role="status">{operationDrafts.length} opération{operationDrafts.length === 1 ? '' : 's'} proposée{operationDrafts.length === 1 ? '' : 's'} depuis les fragments explicites. Les champs inconnus restent à choisir.</p> : null}
    {!formProgram ? <p className="hv-decision-preparation__readonly">Aucun programme exact n’est fourni. L’absence ne vaut pas programme vide; déclare une référence avant de composer des opérations.</p> : <>
      <p className="hv-decision-preparation__program-source"><strong>Programme source · </strong>{formProgram.id} · v{formProgram.revision} · {formProgram.additions.length} ligne{formProgram.additions.length === 1 ? '' : 's'} · {formProgram.volumeL == null ? 'volume inconnu' : `${localizedNumber(formProgram.volumeL)} L`}</p>
      {preparationReference && preparation && !draftChanged ? <ArchivedProgramPreparation preparation={preparation}
        historical={false} reference={preparationReference} onCompare={onCompareProgramPreparation} onResume={resumeFirstNeed} /> : null}
      {preparationReference && preparation && draftChanged ? <>
        <p className="hv-decision-preparation__stale" role="status">La préparation archivée garde ses besoins et son aperçu; les changements présents ne sont pas encore vérifiés.</p>
        <details className="hv-decision-preparation__previous-archive"><summary>Préparation archivée précédente · {preparation.result.status === 'needsInput' ? 'incomplète' : preparation.result.status === 'blocked' ? 'bloquée' : 'prête'}</summary>
          <ArchivedProgramPreparation preparation={preparation} historical />
        </details>
      </> : null}
      {preparation && !preparationReference ? <ArchivedProgramPreparation preparation={preparation} historical /> : null}
      <form ref={formRef} autoComplete="off" onSubmit={event => void saveDraft(event)}>
        <label className="hv-decision-preparation__field"><span>Nom de la proposition</span>
          <Input aria-label="Nom de la proposition de programme" value={branchLabel} disabled={historical}
            onChange={event => setBranchLabel(event.target.value)} />
        </label>
        <div className="hv-decision-preparation__operations">
          {operations.map(renderOperation)}
        </div>
        <div className="hv-decision-preparation__add-operation">
          <label className="hv-decision-preparation__field"><span>Ajouter un geste</span>
            <select aria-label="Type du nouveau geste" disabled={historical} value="" onChange={event => {
              const kind = event.target.value as HopV55ProgramOperationV1['kind'];
              if (!kind) return; setOperations(rows => [...rows, createEmptyOperation(kind)]); setLocalError('');
            }}>
              <option value="">Choisir un geste</option>{(Object.keys(operationKindLabels) as HopV55ProgramOperationV1['kind'][]).map(kind => <option key={kind} value={kind}>{operationKindLabels[kind]}</option>)}
            </select>
          </label>
          <button type="button" disabled={historical} onClick={() => setOperations(rows => [...rows, createEmptyOperation('add')])}>Ajouter une opération « Ajouter »</button>
        </div>
        <p className="hv-decision-preparation__note">Un geste peut rester incomplet. Le moteur indiquera les champs exacts qui manquent; il ne choisit ni ligne, ni cible, ni dose, ni phase.</p>
        {error || localError ? <p role="alert" className="hv-decision-preparation__error">{localError || error}</p> : null}
        <button className="hv-decision-preparation__submit" type="submit" disabled={saving || submitting || !sourceReadingReference || !formProgram || !onPrepareProgram}>
          {saving || submitting ? 'Évaluation et archivage…' : 'Vérifier et conserver cette préparation'}
        </button>
      </form>
    </>}
  </section>;
}
