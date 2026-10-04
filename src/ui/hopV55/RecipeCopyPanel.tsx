import React, { useEffect, useRef, useState } from 'react';
import type { BrewerContext } from '../../../functions/src/companionTypes';
import type { BrewingScenarioBranchRequest, BrewingScenarioBranchResult, BrewingScenarioResult } from '../../domain/brewingScenario';
import type { HopYeast } from '../../../functions/src/hopPredictionSchema';
import type { BrewingStyleGuide } from '../../../functions/src/brewingStyleSchema';
import type { FermentationStep, Recipe } from '../../types';
import type { HopV55Copy } from '../../services/hopV55/contracts';
import type { HopRecipeAlphaChoice, HopRecipeAlphaChoiceWitness } from '../../domain/hopDecision/recipePreview';
import {
  applyHopV55FullRecipeCopy,
  HOP_V55_FULL_RECIPE_COPY_PLAN_FORMAT,
  previewHopV55FullRecipeCopy,
  readHopV55FullRecipeCopyReceipt,
  type HopV55FullRecipeCopyPlan,
  type HopV55FullRecipeCopyPreview,
  type HopV55FullRecipeCopyReceipt,
  type HopV55FullRecipeCopyOriginAnnex,
} from '../../services/hopV55/fullRecipeCopy';
import {
  prepareHopV55FullRecipeCopyRecompute,
  type HopV55FullRecipeCopyRecomputePayload,
  type HopV55FullRecipeCopyRecomputeIdentity,
} from '../../services/hopV55/candidateScenario';
import { HopV55ExactInput } from './ExactInput';
import { Input } from '../Input';
import './recipe-copy-panel.css';

export interface HopV55RecipeCopyPanelProps {
  result: BrewingScenarioResult;
  branchId: string;
  context: BrewerContext;
  getContext(): Promise<BrewerContext>;
  onCopy(copy: HopV55Copy, receipt: HopV55FullRecipeCopyReceipt): Promise<void>;
  onRecompute?(candidate: Recipe, recompute: HopV55FullRecipeCopyRecomputePayload): Promise<void>;
  getRecomputeIdentity?(): HopV55FullRecipeCopyRecomputeIdentity;
  originAnnex?: HopV55FullRecipeCopyOriginAnnex;
  /** Exact choices restored from a locally prepared recompute payload. */
  initialPlan?: HopV55FullRecipeCopyPlan;
  initialAlphaChoices?: Record<string, HopRecipeAlphaChoice>;
}

type CopyOutcome = Awaited<ReturnType<typeof previewHopV55FullRecipeCopy>>;
type StableLocalCopy = { copy: HopV55Copy; receipt: HopV55FullRecipeCopyReceipt };
type RecomputeDraft = { plan: HopV55FullRecipeCopyPlan; alphaChoices: Record<string, HopRecipeAlphaChoice>; reasons: string[] };

const number = (value: number | null | undefined, maximumFractionDigits = 15) => value == null || !Number.isFinite(value)
  ? 'Inconnu' : value.toLocaleString('fr-CH', { maximumFractionDigits });
const yeastForms = [
  { value: 'sèche', label: 'Sèche' }, { value: 'liquide', label: 'Liquide' }, { value: 'levain', label: 'Levain maison' },
] as const;
const historicalStatus: Record<BrewingScenarioBranchResult['applicability'], string> = {
  available: 'Prévision applicable',
  conditional: 'Prévision sous conditions',
  unavailable: 'Prévision indisponible',
  hypotheticalOnly: 'Scénario hypothétique',
};
const targetFields = [
  { field: 'ogTarget', label: 'Densité initiale visée', unit: 'SG' },
  { field: 'fgTarget', label: 'Densité finale visée', unit: 'SG' },
  { field: 'abvTarget', label: 'Alcool visé', unit: '% vol.' },
  { field: 'ibuTarget', label: 'Amertume visée', unit: 'IBU' },
] as const;

function readYeast(context: BrewerContext, id?: string | null): HopYeast | undefined {
  if (!id) return undefined;
  return context.hopIndex?.knowledge.find((row): row is HopYeast => row.kind === 'yeast' && row.id === id);
}

function readStyleName(context: BrewerContext, branch?: BrewingScenarioBranchResult): string | undefined {
  const reference = branch?.beerContext?.style;
  if (!reference) return undefined;
  const guide = context.hopIndex?.knowledge.find((row): row is BrewingStyleGuide => row.kind === 'styleGuide'
    && row.id === reference.guideId);
  if (!guide) return undefined;
  const version = guide.version === reference.version ? guide : guide.history?.find(row => row.version === reference.version);
  return version?.styles.find(row => row.id === reference.styleId)?.name;
}

function sameValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function branchRequest(result: BrewingScenarioResult, id: string): BrewingScenarioBranchRequest | undefined {
  return result.requestSnapshot.branches.find(row => row.id === id);
}

function branchResult(result: BrewingScenarioResult, id: string): BrewingScenarioBranchResult | undefined {
  return result.branches.find(row => row.id === id);
}

function planNameFor(field: string): string {
  return ({
    yeast: 'Levure', volumeL: 'Volume', pitchTemperatureC: 'Température d’ensemencement',
    fermentation: 'Paliers', finalHopMasses: 'Masses finales',
  } as Record<string, string>)[field] ?? field;
}

function targetValue(branch: BrewingScenarioBranchResult, field: string): number | undefined {
  const matching = branch.beerContext?.facts.filter(fact => fact.field === field && fact.status === 'target') ?? [];
  return matching.length === 1 && typeof matching[0].value === 'number' ? matching[0].value : undefined;
}

function phaseRows(branch: BrewingScenarioBranchResult): Array<{ kind?: string; name?: string; tempC?: number; days?: number; note?: string }> {
  return branch.input.fermentation;
}

function mapPhases(branch: BrewingScenarioBranchResult): FermentationStep[] | undefined {
  const rows = phaseRows(branch);
  if (!rows.length || rows.some(row => !['primaire', 'reposDiacetyle', 'garde', 'refermentation', 'ajout'].includes(row.kind ?? '')
    || !row.name?.trim() || !Number.isFinite(row.tempC) || !Number.isFinite(row.days) || (row.days ?? -1) < 0)) return undefined;
  return rows.map(row => ({ kind: row.kind as FermentationStep['kind'], name: row.name!, tempC: row.tempC!, days: row.days!,
    ...(row.note !== undefined ? { note: row.note } : {}) }));
}

function alphaAdditionRows(branch: BrewingScenarioBranchResult, missingMaterialIds: string[]) {
  const missing = new Set(missingMaterialIds);
  return (branch.program?.additions ?? []).filter(row => missing.has(row.materialId));
}

function alphaDomainStatusLabel(status: HopRecipeAlphaChoiceWitness['domain']['status']): string {
  return status === 'comparable' ? 'Domaine de choix fourni' : status === 'unavailable'
    ? 'Aucune plage numérique disponible' : 'Référence alpha refusée';
}

function alphaScopeLabel(witness: HopRecipeAlphaChoiceWitness): string {
  return witness.domain.scope === 'lot' ? `Analyse de lot · ${witness.material.lotId ?? 'lot déclaré'}`
    : witness.domain.scope === 'variety' ? `Portée variétale · ${witness.material.varietyId ?? 'variété déclarée'} · ce n’est pas une analyse du lot`
      : witness.domain.scope === 'declaration' ? 'Paramètre déclaré · aucune analyse de lot créée'
        : 'Portée physique inconnue';
}

function alphaBasisLabel(basis: HopRecipeAlphaChoiceWitness['domain']['analyticalBasis']): string {
  return basis === 'asIs' ? 'Tel quel' : basis === 'dryMatter' ? 'Matière sèche' : 'Base non établie';
}

function alphaObservationLabel(observation: HopRecipeAlphaChoiceWitness['domain']['observations'][number]): string {
  const value = observation.range ? `${number(observation.range.min)}–${number(observation.range.max)}`
    : observation.kind === 'point' && Number.isFinite(observation.value) ? number(observation.value!)
      : observation.limit !== undefined ? `Limite ${number(observation.limit)}${observation.limitKind === 'loq' ? ' (LOQ)' : observation.limitKind === 'lod' ? ' (LOD)' : ''}`
        : 'Valeur inconnue';
  const unit = observation.unit === 'percentMass' ? '% masse' : observation.unit === 'unknown' ? 'unité inconnue' : observation.unit;
  const basis = observation.basis === 'asIs' ? 'tel quel' : observation.basis === 'dryMatter' ? 'matière sèche'
    : observation.basis === 'oil' ? 'huile' : observation.basis === 'beer' ? 'bière' : 'base inconnue';
  return `${value} ${unit} · ${basis}${observation.method ? ` · ${observation.method}` : ''}${observation.note ? ` · ${observation.note}` : ''}`;
}

function AlphaChoiceEvidence({ witness }: { witness: HopRecipeAlphaChoiceWitness }) {
  return <div className="hv-copy-alpha-evidence">
    <b>{alphaDomainStatusLabel(witness.domain.status)}</b>
    {witness.domain.status === 'comparable' && witness.domain.bounds
      ? <strong>Domaine utilisé par la validation · {number(witness.domain.bounds.min)}–{number(witness.domain.bounds.max)} % alpha</strong>
      : <span>{witness.domain.status === 'rejected' ? 'Le contrôle n’a fourni ni borne ni source utilisable.' : 'Aucune borne ne restreint le choix; un motif explicite reste requis.'}</span>}
    <p>{alphaScopeLabel(witness)} · {alphaBasisLabel(witness.domain.analyticalBasis)}</p>
    {witness.domain.scopeReason ? <p>{witness.domain.scopeReason}</p> : null}
    <p>{witness.domain.reason}</p>
    {witness.domain.sources.length ? <div className="hv-copy-alpha-sources"><b>Source(s) du domaine</b>
      {witness.domain.sources.map((source, index) => <article key={`${source.reference}-${index}`}>
        <span>{source.title} · {source.author}{source.year === null ? '' : ` · ${source.year}`}</span>
        {source.locator ? <small>Repère · {source.locator}</small> : null}
        <details><summary>Référence technique</summary><code>{source.reference}</code></details>
      </article>)}
    </div> : <p>Aucune source numérique n’est déclarée dans ce témoin.</p>}
    {witness.domain.observations.length ? <details className="hv-details">
      <summary>Observations numériques et bases ({witness.domain.observations.length})</summary>
      {witness.domain.observations.map((observation, index) => <article className="hv-copy-alpha-observation" key={`${observation.source.reference}-${index}`}>
        <b>{alphaObservationLabel(observation)}</b>
        <span>{observation.source.title} · {observation.source.author}{observation.source.year === null ? '' : ` · ${observation.source.year}`}</span>
        {observation.source.locator ? <small>Repère · {observation.source.locator}</small> : null}
      </article>)}
    </details> : null}
    <details className="hv-details"><summary>Identité exacte de la matière</summary>
      <p>{witness.material.name} · {witness.material.form === 'pelletT90' ? 'Pellets T-90' : witness.material.form === 'pelletT45' ? 'Pellets T-45'
        : witness.material.form === 'cryo' ? 'Houblon cryogénique' : witness.material.form === 'cone' ? 'Cônes' : witness.material.form === 'extract' ? 'Extrait' : 'Forme inconnue'}</p>
      <code>{witness.material.id}</code>
      {witness.material.lotId ? <p>Lot exact · <code>{witness.material.lotId}</code>{witness.material.lotReferenceOnly ? ' · référence seulement' : ''}</p> : null}
      {witness.material.varietyId ? <p>Variété · <code>{witness.material.varietyId}</code></p> : null}
    </details>
  </div>;
}

function stockLabel(status: string): string {
  if (status === 'available') return 'Présence signalée';
  if (status === 'insufficient') return 'Approvisionnement nécessaire';
  if (status === 'referenceOnly') return 'Référence documentaire, stock non établi';
  return 'Stock inconnu';
}

function j1ApplicabilityLabel(status: 'available' | 'conditional' | 'unavailable'): string {
  if (status === 'available') return 'Programme compatible avec les références chargées';
  if (status === 'conditional') return 'Programme à confirmer sous conditions';
  return 'Programme indisponible pour un brassage immédiat';
}

function planAssumptionLabel(assumption: { label: string; path: string; origin: string; status: string; value?: unknown; range?: { min: number; max: number }; unit?: string }) {
  const value = assumption.range ? `${number(assumption.range.min)}–${number(assumption.range.max)}`
    : assumption.value === undefined || assumption.value === null ? 'Valeur non fournie' : String(assumption.value);
  return `${assumption.label} · ${assumption.path} · ${value}${assumption.unit ? ` ${assumption.unit}` : ''} · ${assumption.origin}/${assumption.status}`;
}

function humanCopyMessage(message: string): string {
  return message.split('Recipe').join('recette').split('J1').join('programme proposé').split('J4').join('validation finale')
    .split('snapshot').join('instantané').split('yeastTemperature').join('la plage de fermentation')
    .split('pitchTempC').join('cible d’ensemencement').split('yeastId').join('culture').split('volumeL').join('volume');
}

function userScenarioName(branch: BrewingScenarioBranchResult): string {
  const label = branch.label.trim();
  const looksTechnical = /fixture|^(?:hop-v55|[a-z0-9]+)(?:[-_:][a-z0-9]+)+$/i.test(label);
  if (!looksTechnical) return label;
  const member = branch.culture?.state === 'single' ? branch.culture.members[0] : undefined;
  const resolved = member?.yeastId ? branch.dependencySnapshot.engineData.knowledge.find(row => row.kind === 'yeast' && row.id === member.yeastId) : undefined;
  const culture = member?.name ?? (resolved?.kind === 'yeast' ? resolved.name : undefined);
  return culture ? `Culture · ${culture}` : branch.culture?.state === 'mixed' ? 'Culture mixte' : 'Scénario de recette';
}

function hopUseLabel(use: string): string {
  return ({ firstWort: 'Premier moût', boil: 'Ébullition', whirlpool: 'Whirlpool',
    fermentation: 'Fermentation', postFermentation: 'Après fermentation' } as Record<string, string>)[use] ?? 'Emploi à préciser';
}

function phaseKindLabel(kind?: string): string {
  return ({ primaire: 'Primaire', reposDiacetyle: 'Repos diacétyle', garde: 'Garde',
    refermentation: 'Refermentation', ajout: 'Ajout' } as Record<string, string>)[kind ?? ''] ?? 'Phase à préciser';
}

function hopContactLabel(addition: NonNullable<BrewingScenarioBranchResult['program']>['additions'][number]): string {
  if (addition.use === 'boil' && addition.boilMinutes != null) return `${number(addition.boilMinutes)} min`;
  if (addition.contactHours != null && addition.temperatureC != null) return `${number(addition.contactHours)} h · ${number(addition.temperatureC)} °C`;
  if (addition.contactHours != null) return `${number(addition.contactHours)} h`;
  if (addition.temperatureC != null) return `${number(addition.temperatureC)} °C`;
  if (addition.dayOffset != null) return `jour ${number(addition.dayOffset)}`;
  return 'durée / température non déclarée';
}

function branchAdditionName(branch: BrewingScenarioBranchResult, additionId: string): string {
  const input = branch.input.additions.find(row => row.id === additionId);
  const programRows = branch.program?.additions ?? [];
  const position = programRows.findIndex(row => row.id === additionId);
  const name = input?.name ?? branch.dependencySnapshot.decisionMaterials.find(row =>
    row.id === programRows[position]?.materialId)?.name ?? 'Houblon à identifier';
  if (programRows.filter(row => (branch.input.additions.find(candidate => candidate.id === row.id)?.name
    ?? branch.dependencySnapshot.decisionMaterials.find(material => material.id === row.materialId)?.name) === name).length > 1) {
    return `${name} · ajout ${position + 1}`;
  }
  if (input?.name) return name;
  return name;
}

function recipeHopUseLabel(hop: Recipe['hops'][number]): string {
  return hop.stage === 'dryHop' ? hop.aromaTiming ? hopUseLabel(hop.aromaTiming) : 'Houblonnage à cru' : hopUseLabel(hop.stage);
}

function recipeHopContactLabel(hop: Recipe['hops'][number]): string {
  if (hop.stage === 'boil' && hop.timeMin != null) return `${number(hop.timeMin)} min`;
  if (hop.aromaContactHours != null) return `${number(hop.aromaContactHours)} h`;
  if (hop.stage === 'whirlpool' && hop.timeMin != null) return `${number(hop.timeMin)} min`;
  if (hop.aromaTemperatureC != null || hop.tempC != null) return `${number(hop.aromaTemperatureC ?? hop.tempC)} °C`;
  if (hop.dayOffset != null) return `jour ${number(hop.dayOffset)}`;
  return 'durée non déclarée';
}

export function HopV55RecipeCopyPanel({ result, branchId, context, getContext, onCopy, onRecompute, getRecomputeIdentity,
  originAnnex, initialPlan, initialAlphaChoices }: HopV55RecipeCopyPanelProps) {
  const source = context.recipe;
  const request = branchRequest(result, branchId);
  const branch = branchResult(result, branchId);
  const sourceStyle = result.baseline.beerContext?.style;
  const targetStyle = branch?.beerContext?.style;
  const resolvedStyleName = readStyleName(context, branch);
  const branchYeastId = branch?.input.yeastId ?? undefined;
  const resolvedYeast = readYeast(context, branchYeastId);
  const yeastChanged = !!branch && branch.input.yeastId !== result.baseline.input.yeastId;
  const pitchChanged = !!branch && branch.input.pitchTempC !== result.baseline.input.pitchTempC;
  const fermentationChanged = !!branch && !sameValue(branch.input.fermentation, result.baseline.input.fermentation);
  const styleChanged = !!targetStyle && (targetStyle.role !== sourceStyle?.role || targetStyle.guideId !== sourceStyle?.guideId
    || targetStyle.version !== sourceStyle?.version || targetStyle.styleId !== sourceStyle?.styleId);
  const volumeChanged = !!branch && branch.input.volumeL !== source?.volumeL;
  const programChanged = !!request?.programChanges?.length;
  const styleTarget = targetStyle?.role === 'target';
  const targetSource = result.requestSnapshot.target ?? {};

  const [recipeName, setRecipeName] = useState(() => initialPlan?.recipeName ?? '');
  const [adoptYeast, setAdoptYeast] = useState(() => initialPlan ? !!initialPlan.yeast : yeastChanged || pitchChanged);
  const [yeastName, setYeastName] = useState(() => initialPlan?.yeast?.name ?? resolvedYeast?.name ?? branch?.culture?.members[0]?.name ?? '');
  const [yeastQty, setYeastQty] = useState<number | undefined>(() => initialPlan?.yeast?.quantity.value);
  const [yeastUnit, setYeastUnit] = useState(() => initialPlan?.yeast?.quantity.unit ?? '');
  const [yeastForm, setYeastForm] = useState<string>(() => initialPlan?.yeast?.form ?? '');
  const [yeastStrain, setYeastStrain] = useState(() => initialPlan?.yeast?.strain ?? '');
  const [productId, setProductId] = useState(() => initialPlan?.yeast?.product?.id ?? '');
  const [productName, setProductName] = useState(() => initialPlan?.yeast?.product?.name ?? '');
  const [productManufacturer, setProductManufacturer] = useState(() => initialPlan?.yeast?.product?.manufacturer ?? '');
  const [adoptPitch, setAdoptPitch] = useState(() => initialPlan ? initialPlan.yeast?.pitchTemperatureC !== undefined : !!request?.inputOverrides?.pitchTempC || pitchChanged);
  const [adoptFermentation, setAdoptFermentation] = useState(() => initialPlan ? initialPlan.fermentation !== undefined : fermentationChanged);
  const [adoptStyle, setAdoptStyle] = useState(() => initialPlan ? initialPlan.style !== undefined : styleChanged && styleTarget);
  const [adoptVolume, setAdoptVolume] = useState(() => initialPlan ? initialPlan.volumeL !== undefined : volumeChanged);
  const [adoptHopProgram, setAdoptHopProgram] = useState(() => initialPlan ? initialPlan.adoptHopProgram === true : programChanged);
  const [declareFutureProcurement, setDeclareFutureProcurement] = useState(() => initialPlan?.futureProcurement !== undefined);
  const [futureProcurementReason, setFutureProcurementReason] = useState(() => initialPlan?.futureProcurement?.reason ?? '');
  const [adoptedTargets, setAdoptedTargets] = useState<Record<string, boolean>>(() => Object.fromEntries(
    Object.keys(initialPlan?.targets ?? {}).filter(key => key !== 'hopAromaTarget').map(key => [key, true])));
  const [adoptedAromaTargets, setAdoptedAromaTargets] = useState<Record<string, boolean>>(() => Object.fromEntries(
    Object.keys(initialPlan?.targets?.hopAromaTarget ?? {}).map(key => [key, true])));
  const [alphaChoices, setAlphaChoices] = useState<Record<string, HopRecipeAlphaChoice>>(() => structuredClone(initialAlphaChoices ?? {}));
  const [alphaReasons, setAlphaReasons] = useState<Record<string, string>>(() => Object.fromEntries(
    Object.entries(initialAlphaChoices ?? {}).map(([id, choice]) => [id, choice.reason])));
  const [alphaNeeded, setAlphaNeeded] = useState<string[]>([]);
  const [alphaChoiceWitnesses, setAlphaChoiceWitnesses] = useState<HopRecipeAlphaChoiceWitness[]>([]);
  const [preview, setPreview] = useState<HopV55FullRecipeCopyPreview>();
  const [recomputeCandidate, setRecomputeCandidate] = useState<Recipe>();
  const [recomputeDraft, setRecomputeDraft] = useState<RecomputeDraft>();
  const [restoredPlan, setRestoredPlan] = useState(initialPlan);
  const [restoredAlphaChoices, setRestoredAlphaChoices] = useState<Record<string, HopRecipeAlphaChoice>>(
    () => structuredClone(initialAlphaChoices ?? {}));
  const [restoredOriginAnnex, setRestoredOriginAnnex] = useState(originAnnex);
  const [copyOriginAnnex, setCopyOriginAnnex] = useState<HopV55FullRecipeCopyOriginAnnex | undefined>(originAnnex);
  const [pendingWrite, setPendingWrite] = useState<StableLocalCopy>();
  const [copyRecorded, setCopyRecorded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const copyIdRef = useRef<string | undefined>(undefined);
  const futureProcurementIdRef = useRef<string | undefined>(initialPlan?.futureProcurement?.id);

  useEffect(() => {
    const seedPlan = initialPlan ?? restoredPlan;
    const seedAlphaChoices = initialAlphaChoices ?? restoredAlphaChoices;
    setRecipeName(seedPlan?.recipeName ?? ''); setAdoptYeast(seedPlan ? !!seedPlan.yeast : yeastChanged || pitchChanged);
    setYeastName(seedPlan?.yeast?.name ?? resolvedYeast?.name ?? branch?.culture?.members[0]?.name ?? '');
    setYeastQty(seedPlan?.yeast?.quantity.value); setYeastUnit(seedPlan?.yeast?.quantity.unit ?? '');
    setYeastForm(seedPlan?.yeast?.form ?? ''); setYeastStrain(seedPlan?.yeast?.strain ?? '');
    setProductId(seedPlan?.yeast?.product?.id ?? ''); setProductName(seedPlan?.yeast?.product?.name ?? '');
    setProductManufacturer(seedPlan?.yeast?.product?.manufacturer ?? '');
    setAdoptPitch(seedPlan ? seedPlan.yeast?.pitchTemperatureC !== undefined : !!request?.inputOverrides?.pitchTempC || pitchChanged);
    setAdoptFermentation(seedPlan ? seedPlan.fermentation !== undefined : fermentationChanged);
    setAdoptStyle(seedPlan ? seedPlan.style !== undefined : styleChanged && styleTarget);
    setAdoptVolume(seedPlan ? seedPlan.volumeL !== undefined : volumeChanged);
    setAdoptHopProgram(seedPlan ? seedPlan.adoptHopProgram === true : programChanged);
    setDeclareFutureProcurement(seedPlan?.futureProcurement !== undefined);
    setFutureProcurementReason(seedPlan?.futureProcurement?.reason ?? '');
    futureProcurementIdRef.current = seedPlan?.futureProcurement?.id;
    setAdoptedTargets(Object.fromEntries(Object.keys(seedPlan?.targets ?? {}).filter(key => key !== 'hopAromaTarget').map(key => [key, true])));
    setAdoptedAromaTargets(Object.fromEntries(Object.keys(seedPlan?.targets?.hopAromaTarget ?? {}).map(key => [key, true])));
    setAlphaChoices(structuredClone(seedAlphaChoices));
    setAlphaReasons(Object.fromEntries(Object.entries(seedAlphaChoices).map(([id, choice]) => [id, choice.reason])));
    setAlphaNeeded([]); setAlphaChoiceWitnesses([]);
    setPreview(undefined); setRecomputeCandidate(undefined); setRecomputeDraft(undefined); setPendingWrite(undefined); setCopyRecorded(false);
    setCopyOriginAnnex(originAnnex ?? restoredOriginAnnex);
    setError(''); setNotice(''); copyIdRef.current = undefined;
  // A new branch gets new draft controls. A refreshed snapshot of this same branch preserves the user's entries.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId, result.reference, restoredPlan, restoredAlphaChoices, restoredOriginAnnex, originAnnex]);

  function clearPreview(keepAlphaWitness = false) {
    setPreview(undefined);
    setRecomputeCandidate(undefined);
    setRecomputeDraft(undefined);
    if (!keepAlphaWitness) setAlphaChoiceWitnesses([]);
    setCopyRecorded(false);
    copyIdRef.current = undefined;
    setError(''); setNotice('');
  }

  function update<T>(setter: React.Dispatch<React.SetStateAction<T>>, value: T) {
    setter(value);
    clearPreview();
  }

  const finalMassProgram = adoptHopProgram ? branch?.program : result.baseline.program;
  const finalMasses = finalMassProgram?.additions.map(row => ({ additionId: row.id, grams: row.grams }));
  const allMassesKnown = !!finalMasses && finalMasses.every(row => Number.isFinite(row.grams));
  const missingProductFields = [productId, productName, productManufacturer].some(value => value.trim())
    && ![productId, productName, productManufacturer].every(value => value.trim());
  const selectedStyleRef = targetStyle?.role === 'target' && resolvedStyleName ? {
    guideId: targetStyle.guideId, version: targetStyle.version, styleId: targetStyle.styleId,
  } : undefined;

  function buildPlan(): HopV55FullRecipeCopyPlan | string {
    if (!branch || !request) return 'Cette branche ne fait plus partie du résultat affiché.';
    if (adoptYeast) {
      if (!branchYeastId || !yeastName.trim()) return 'Le nom de la levure de la culture choisie doit être déclaré.';
      if (!Number.isFinite(yeastQty) || (yeastQty ?? 0) <= 0 || !yeastUnit.trim()) return 'Déclare une quantité positive et son unité pour la nouvelle YeastSpec.';
      if (missingProductFields) return 'Complète les trois champs du produit commercial ou laisse-les tous vides si le produit est inconnu.';
      if (adoptPitch && !Number.isFinite(branch.input.pitchTempC)) return 'La branche ne porte pas de température d’ensemencement numérique à adopter.';
    }
    if (adoptFermentation && !mapPhases(branch)) return 'Les phases exactes manquent de type, de nom, de température ou de durée dans la branche. Corrige la conduite puis recalcule-la.';
    if (adoptStyle && (!selectedStyleRef || !resolvedStyleName)) return 'Le style cible doit être résolu dans sa référence exacte avant la copie.';
    if (adoptVolume && (!Number.isFinite(branch.input.volumeL) || branch.input.volumeL < 1)) return 'Le volume du scénario ne forme pas un volume de recette exploitable en litres.';
    if ((adoptVolume || adoptHopProgram) && !allMassesKnown) return 'Une masse finale manque dans le programme. Choisis-la dans le scénario avant de prévisualiser la copie.';
    if (declareFutureProcurement && !futureProcurementReason.trim()) return 'Un motif est requis : indique pourquoi le programme sera approvisionné avant brassage.';
    if (alphaNeeded.length && alphaAdditionRows(branch, alphaNeeded).some(row => !Number.isFinite(alphaChoices[row.id]?.value)
      || !alphaChoices[row.id]?.reason.trim())) return 'Chaque alpha de travail doit avoir une valeur et un motif explicite.';

    const targets: Record<string, number> = {};
    for (const target of targetFields) if (adoptedTargets[target.field] && typeof targetValue(branch, target.field) === 'number') {
      targets[target.field] = targetValue(branch, target.field)!;
    }
    const aromaTargets = Object.fromEntries(Object.entries(targetSource).filter(([id]) => adoptedAromaTargets[id]));
    return {
      format: HOP_V55_FULL_RECIPE_COPY_PLAN_FORMAT,
      branchId,
      ...(recipeName.trim() ? { recipeName: recipeName.trim() } : {}),
      ...(adoptYeast ? { yeast: {
        hopIndexId: branchYeastId!, name: yeastName.trim(),
        ...(productId.trim() ? { product: { id: productId.trim(), name: productName.trim(), manufacturer: productManufacturer.trim() } } : {}),
        ...(yeastStrain.trim() ? { strain: yeastStrain.trim() } : {}),
        ...(yeastForm ? { form: yeastForm as 'sèche' | 'liquide' | 'levain' } : {}),
        quantity: { value: yeastQty!, unit: yeastUnit.trim() },
        ...(adoptPitch && branch.input.pitchTempC !== undefined ? { pitchTemperatureC: branch.input.pitchTempC } : {}),
      } } : {}),
      ...(adoptFermentation ? { fermentation: mapPhases(branch)! } : {}),
      ...(adoptStyle && selectedStyleRef ? { style: { name: resolvedStyleName!, ref: selectedStyleRef } } : {}),
      ...((adoptVolume || adoptHopProgram) && finalMasses ? { finalHopMasses: finalMasses } : {}),
      ...(adoptHopProgram ? { adoptHopProgram: true as const } : {}),
      ...(declareFutureProcurement && (adoptHopProgram || adoptVolume) ? { futureProcurement: {
        id: futureProcurementIdRef.current ??= `future-procurement-${crypto.randomUUID()}`,
        reason: futureProcurementReason.trim(),
      } } : {}),
      ...(adoptVolume ? { volumeL: branch.input.volumeL } : {}),
      ...(Object.keys(targets).length || Object.keys(aromaTargets).length ? { targets: {
        ...(targets.ogTarget !== undefined ? { ogTarget: targets.ogTarget } : {}),
        ...(targets.fgTarget !== undefined ? { fgTarget: targets.fgTarget } : {}),
        ...(targets.abvTarget !== undefined ? { abvTarget: targets.abvTarget } : {}),
        ...(targets.ibuTarget !== undefined ? { ibuTarget: targets.ibuTarget } : {}),
        ...(Object.keys(aromaTargets).length ? { hopAromaTarget: aromaTargets } : {}),
      } } : {}),
    };
  }

  async function handlePreview(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError(''); setNotice(''); setPreview(undefined); setRecomputeCandidate(undefined); setPendingWrite(undefined);
    try {
      const plan = buildPlan();
      if (typeof plan === 'string') { setError(plan); return; }
      const fresh = await getContext();
      const outcome = previewHopV55FullRecipeCopy({ result, branchId, context: fresh, plan, alphaChoices,
        ...(copyOriginAnnex ?? originAnnex ? { originAnnex: copyOriginAnnex ?? originAnnex } : {}) });
      handlePreviewOutcome(outcome, plan, alphaChoices);
    } catch (cause) {
      setError((cause as Error).message || 'La prévisualisation n’a pas abouti. Les choix saisis restent disponibles.');
    } finally { setBusy(false); }
  }

  function handlePreviewOutcome(outcome: CopyOutcome, plan: HopV55FullRecipeCopyPlan, selectedAlphaChoices: Record<string, HopRecipeAlphaChoice>) {
    if (outcome.status === 'ready') {
      setAlphaNeeded([]); setAlphaChoiceWitnesses(outcome.preview.hopPreview?.alphaChoiceWitnesses ?? []);
      setPreview(outcome.preview); setNotice('Aperçu de la nouvelle recette vérifié. Enregistrement et aptitude au brassage restent distincts.');
    } else if (outcome.status === 'needsAlphaSelection') {
      setPreview(undefined); setAlphaNeeded(outcome.materialIds);
      setAlphaChoiceWitnesses(outcome.alphaChoiceWitnesses ?? []);
      setNotice(outcome.reasons.map(humanCopyMessage).join(' '));
    } else if (outcome.status === 'needsSelection') {
      setPreview(undefined); setAlphaNeeded([]); setAlphaChoiceWitnesses([]);
      setError(`${outcome.reasons.map(humanCopyMessage).join(' ')} À compléter : ${outcome.fields.map(planNameFor).join(', ')}.`);
    } else if (outcome.status === 'needsRecompute') {
      setPreview(undefined); setAlphaNeeded([]); setAlphaChoiceWitnesses([]); setRecomputeCandidate(outcome.candidate);
      setRecomputeDraft({ plan, alphaChoices: selectedAlphaChoices, reasons: outcome.reasons });
      setError(outcome.reasons.map(humanCopyMessage).join(' '));
    } else {
      if (outcome.recompute) setAlphaChoiceWitnesses([]);
      setPreview(undefined); setError(humanCopyMessage(outcome.reason));
    }
  }

  async function savePending(value: StableLocalCopy) {
    setBusy(true); setError(''); setNotice('');
    try {
      await onCopy(value.copy, value.receipt);
      setPendingWrite(undefined);
      setCopyRecorded(true);
      setNotice('Copie locale remise au carnet. Enregistrement de la recette et brassage restent distincts.');
    } catch (cause) {
      setPendingWrite(value);
      setError(`La copie reste prête avec son ID stable. L’enregistrement local a échoué : ${(cause as Error).message || 'réessaie.'}`);
    } finally { setBusy(false); }
  }

  async function handleApply() {
    if (pendingWrite) { await savePending(pendingWrite); return; }
    if (!preview) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const fresh = await getContext();
      const applied = applyHopV55FullRecipeCopy({ preview, context: fresh, createdAt: new Date().toISOString(),
        createCopyId: () => {
          copyIdRef.current ??= `recipe-copy-${crypto.randomUUID()}`;
          return copyIdRef.current;
        } });
      if (applied.status === 'blocked') {
        setPreview(undefined); copyIdRef.current = undefined; setError(humanCopyMessage(applied.reason)); return;
      }
      if (applied.status === 'needsRecompute') {
        setPreview(undefined); copyIdRef.current = undefined; setRecomputeCandidate(applied.candidate);
        setRecomputeDraft({ plan: preview.plan, alphaChoices: preview.alphaChoices, reasons: applied.reasons });
        setError(applied.reasons.map(humanCopyMessage).join(' ')); return;
      }
      const receiptRead = readHopV55FullRecipeCopyReceipt(applied.receipt);
      if (receiptRead.status !== 'available') throw Error(`Le reçu de copie est invalide : ${receiptRead.reason}`);
      const stable = { copy: applied.copy, receipt: receiptRead.receipt };
      setPendingWrite(stable);
      await savePending(stable);
    } catch (cause) {
      setError((cause as Error).message || 'La copie n’a pas été appliquée. L’aperçu reste disponible.');
    } finally { setBusy(false); }
  }

  async function handleRecompute() {
    if (!recomputeCandidate || !recomputeDraft || !onRecompute) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const fresh = await getContext();
      const identity = getRecomputeIdentity?.() ?? { scenarioId: result.scenarioId, revision: result.revision + 1 };
      const prepared = prepareHopV55FullRecipeCopyRecompute({ context: fresh, result, branchId,
        candidate: recomputeCandidate, plan: recomputeDraft.plan, alphaChoices: recomputeDraft.alphaChoices,
        identity, reasons: recomputeDraft.reasons });
      if (prepared.status === 'blocked') { setError(humanCopyMessage(prepared.reason)); return; }
      setRestoredPlan(structuredClone(prepared.payload.plan));
      setRestoredAlphaChoices(structuredClone(prepared.payload.alphaChoices));
      setRestoredOriginAnnex(structuredClone(prepared.payload.supersedes));
      setCopyOriginAnnex(prepared.payload.supersedes);
      await onRecompute(structuredClone(recomputeCandidate), prepared.payload);
      setRecomputeCandidate(undefined); setRecomputeDraft(undefined);
      setNotice('Nouvelle prévision calculée sur la recette source courante. Vérifie ensuite le nouvel aperçu de copie.');
    } catch (cause) {
      setError(`La nouvelle prévision n’a pas démarré : ${humanCopyMessage((cause as Error).message)}`);
    } finally { setBusy(false); }
  }

  function toggleTarget(id: string, checked: boolean) {
    setAdoptedTargets(current => ({ ...current, [id]: checked })); clearPreview();
  }

  function resetFutureProcurement() {
    setDeclareFutureProcurement(false);
    setFutureProcurementReason('');
    futureProcurementIdRef.current = undefined;
  }

  if (!source || !request || !branch) return <section className="hop-v55 hv-full-copy" aria-labelledby="hv-copy-title">
    <h2 id="hv-copy-title">Préparer une copie complète</h2>
    <p role="status">La recette source ou le scénario sélectionné n’est plus disponible.</p>
  </section>;

  const mappedPhases = mapPhases(branch);
  const selectedAlphaRows = alphaAdditionRows(branch, alphaNeeded);
  const alphaWitnessByAddition = new Map(alphaChoiceWitnesses.map(witness => [witness.additionId, witness]));
  const historical = historicalStatus[branch.applicability];
  const allowCopyForm = !pendingWrite && !copyRecorded;

  return <section className="hop-v55 hv-full-copy" aria-labelledby="hv-copy-title">
    <div className="hv-copy-heading">
      <div><h2 id="hv-copy-title">Préparer une copie complète</h2>
        <p className="hv-copy-source">Depuis la recette <strong>{source.name}</strong> · {userScenarioName(branch)}</p></div>
      <span className={`hv-copy-history-state hv-copy-history-${branch.applicability}`}>{historical}</span>
    </div>
    <details className="hv-details hv-copy-reference"><summary>Références du scénario source</summary>
      <p>Scénario · <code>{result.scenarioId}</code> · révision {result.revision}</p>
      <p>Branche · <code>{branchId}</code> · référence <code>{branch.reference}</code></p>
      <p>Nom exact · {branch.label}</p>
    </details>
    <p className="hv-muted">Choisis les consignes de recette à reprendre. Les hypothèses de calcul et les résultats de simulation restent dans l’annexe.</p>

    <form autoComplete="off" onSubmit={handlePreview}>
      <fieldset disabled={!allowCopyForm || busy} className="hv-copy-fieldset">
        <label className="hv-field hv-copy-name"><span>Nom de la nouvelle recette · facultatif</span>
          <Input aria-label="Nom de la nouvelle recette" value={recipeName} placeholder={source.name}
            onChange={event => update(setRecipeName, event.target.value)} /></label>

        <section className="hv-copy-section" aria-labelledby="hv-copy-yeast-title">
          <label className="hv-checkbox"><input type="checkbox" checked={adoptYeast} onChange={event => update(setAdoptYeast, event.target.checked)} />
          <span id="hv-copy-yeast-title">Reprendre la culture et déclarer sa quantité</span></label>
          {branchYeastId ? <p className="hv-copy-identity">Culture simulée · {resolvedYeast?.name ?? branch.culture?.members[0]?.name ?? 'Nom non renseigné'}</p>
            : <p className="hv-copy-warning">Le scénario ne désigne pas une culture unique. La recette ne choisira pas une souche à sa place.</p>}
          {branchYeastId ? <details className="hv-details hv-copy-reference"><summary>Référence exacte de la culture</summary>
            <code>{branchYeastId}</code>{branch.culture?.explanation ? <p>{branch.culture.explanation}</p> : null}
          </details> : null}
          {adoptYeast ? <div className="hv-copy-grid">
            <label className="hv-field"><span>Nom de la culture dans la recette</span><Input aria-label="Nom explicite de la levure" value={yeastName}
              onChange={event => update(setYeastName, event.target.value)} placeholder="Nom connu ou culture maison" /></label>
            <HopV55ExactInput label="Quantité déclarée" value={yeastQty} onValue={value => update(setYeastQty, value)} min={0} required />
            <label className="hv-field"><span>Unité déclarée</span><Input aria-label="Unité de levure" value={yeastUnit}
              onChange={event => update(setYeastUnit, event.target.value)} placeholder="sachet, g, mL…" /></label>
            <label className="hv-field"><span>Forme · facultative si inconnue</span><select aria-label="Forme de la levure" value={yeastForm}
              onChange={event => update(setYeastForm, event.target.value)}><option value="">Inconnue / non déclarée</option>
              {yeastForms.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label className="hv-field"><span>Souche / identifiant de souche · facultatif</span><Input aria-label="Souche de levure" value={yeastStrain}
              onChange={event => update(setYeastStrain, event.target.value)} placeholder="Non renseignée" /></label>
            <p className="hv-copy-note">Produit commercial séparé de la souche. Laisse ces champs vides pour une culture maison ou un produit inconnu.</p>
            <label className="hv-field"><span>Nom du produit · facultatif</span><Input aria-label="Nom du produit commercial" value={productName}
              onChange={event => update(setProductName, event.target.value)} placeholder="Non identifié" /></label>
            <label className="hv-field"><span>Fabricant · facultatif</span><Input aria-label="Fabricant de la levure" value={productManufacturer}
              onChange={event => update(setProductManufacturer, event.target.value)} placeholder="Non renseigné" /></label>
            <details className="hv-details hv-copy-reference"><summary>Référence exacte du produit · facultative</summary>
              <label className="hv-field"><span>Identifiant de catalogue du produit</span><Input aria-label="ID du produit commercial" value={productId}
                onChange={event => update(setProductId, event.target.value)} placeholder="Non identifié" /></label>
            </details>
            {request.inputOverrides?.pitchTempC !== undefined || pitchChanged || branch.input.pitchTempC !== undefined ? <label className="hv-checkbox hv-copy-pitch">
              <input type="checkbox" checked={adoptPitch} onChange={event => { setAdoptPitch(event.target.checked); setAdoptYeast(true); clearPreview(); }} />
              <span>Reprendre la cible d’ensemencement explicite · {number(branch.input.pitchTempC)} °C</span></label> : null}
          </div> : null}
        </section>

        <section className="hv-copy-section" aria-labelledby="hv-copy-fermentation-title">
          <label className="hv-checkbox"><input type="checkbox" checked={adoptFermentation} onChange={event => update(setAdoptFermentation, event.target.checked)} />
            <span id="hv-copy-fermentation-title">Reprendre les phases de fermentation choisies</span></label>
          {phaseRows(branch).length ? <ol className="hv-copy-phases">{phaseRows(branch).map((phase, index) => <li key={`${index}-${phase.kind ?? 'phase'}`}>
            <strong>{phase.name || phaseKindLabel(phase.kind) || `Phase ${index + 1}`}</strong>
            <span>{phase.tempC === undefined ? 'Température inconnue' : `${number(phase.tempC)} °C`} · {phase.days === undefined ? 'Durée inconnue' : `${number(phase.days)} j`}</span>
            {phase.note ? <small>{phase.note}</small> : null}
          </li>)}</ol> : <p className="hv-copy-note">Aucune phase n’est déclarée dans la branche. Une phase ne sera pas inventée.</p>}
          {adoptFermentation && !mappedPhases ? <p className="hv-copy-warning" role="status">Une ou plusieurs phases n’ont pas le type, le nom, la température ou la durée nécessaires. Corrige la branche et demande une nouvelle prévision.</p> : null}
        </section>

        {styleTarget ? <section className="hv-copy-section" aria-labelledby="hv-copy-style-title">
          <label className="hv-checkbox"><input type="checkbox" checked={adoptStyle} disabled={!resolvedStyleName}
            onChange={event => update(setAdoptStyle, event.target.checked)} />
            <span id="hv-copy-style-title">Reprendre le style cible exact</span></label>
          <p className="hv-copy-identity">Style cible proposé · {resolvedStyleName ?? 'référence non résolue'}</p>
          <details className="hv-details hv-copy-reference"><summary>Référence de style exacte</summary>
            <code>{targetStyle!.guideId}/{targetStyle!.version}/{targetStyle!.styleId}</code> · rôle cible
          </details>
        </section> : null}

        {volumeChanged ? <section className="hv-copy-section" aria-labelledby="hv-copy-volume-title">
          <label className="hv-checkbox"><input type="checkbox" checked={adoptVolume} onChange={event => {
            const checked = event.target.checked;
            update(setAdoptVolume, checked);
            if (!checked && !adoptHopProgram) resetFutureProcurement();
          }} />
            <span id="hv-copy-volume-title">Reprendre le volume de recette et vérifier chaque masse finale</span></label>
          <p>Source · <strong>{number(source.volumeL)} L</strong> → branche · <strong>{number(branch.input.volumeL)} L</strong></p>
        </section> : null}

        {programChanged ? <section className="hv-copy-section" aria-labelledby="hv-copy-hops-title">
          <label className="hv-checkbox"><input type="checkbox" checked={adoptHopProgram} onChange={event => {
            const checked = event.target.checked; setAdoptHopProgram(checked);
            resetFutureProcurement();
            clearPreview();
          }} />
            <span id="hv-copy-hops-title">Reprendre le programme de houblon proposé et validé</span></label>
          {adoptHopProgram && !error && branch.programProposal?.applicability === 'unavailable' ? <p className="hv-copy-warning" role="status">
            Ce programme de houblon est indisponible pour un brassage immédiat. Une copie reste possible avec les houblons de la recette source; la proposition et ses conditions seront conservées séparément.
          </p> : null}
          {!adoptHopProgram ? <p className="hv-copy-warning">La nouvelle recette gardera les houblons de la recette source. La proposition et ses conditions resteront dans le reçu.</p> : null}
        </section> : null}
        {adoptHopProgram || adoptVolume ? <section className="hv-copy-section hv-copy-future-procurement" aria-labelledby="hv-copy-future-title">
          <label className="hv-checkbox"><input type="checkbox" checked={declareFutureProcurement} onChange={event => {
            const checked = event.target.checked;
            if (checked) futureProcurementIdRef.current ??= `future-procurement-${crypto.randomUUID()}`;
            else resetFutureProcurement();
            if (checked) setDeclareFutureProcurement(true);
            clearPreview();
          }} />
          <span id="hv-copy-future-title">Prévoir l’achat du houblon avant brassage · {adoptHopProgram ? 'programme proposé' : 'houblons de la recette source'}</span></label>
          {declareFutureProcurement ? <>
            <label className="hv-field"><span>Motif requis</span><Input aria-label="Motif de l’approvisionnement futur"
              value={futureProcurementReason} placeholder="Pourquoi cet achat restera à faire ?"
              onChange={event => update(setFutureProcurementReason, event.target.value)} /></label>
            <p className="hv-copy-note">La déclaration reste attachée au programme final; elle ne réserve ni n’achète de stock.</p>
          </> : null}
        </section> : null}
        {(adoptVolume || adoptHopProgram) ? <div className="hv-copy-masses" aria-label="Masses finales du programme sélectionné">
          <strong>Masses finales et emplois du {adoptHopProgram ? 'programme proposé' : 'programme source'}</strong>
          {(finalMassProgram?.additions ?? []).map((row, index) => {
            const label = branch.input.additions.find(input => input.id === row.id)?.name
              ?? branch.dependencySnapshot.decisionMaterials.find(material => material.id === row.materialId)?.name
              ?? `Ajout de houblon ${index + 1}`;
            return <div className="hv-copy-mass-row" key={row.id}>
              <span>{label} · {hopUseLabel(row.use)} · {hopContactLabel(row)}</span>
              <strong>{row.grams === null ? 'Masse inconnue' : `${number(row.grams)} g`}</strong>
            </div>;
          })}
          {finalMassProgram?.additions.length ? <details className="hv-details hv-copy-reference">
            <summary>Références des lignes du programme</summary>
            {finalMassProgram.additions.map(row => <p key={row.id}><code>{row.id}</code> · <code>{row.materialId}</code></p>)}
          </details> : null}
          {!finalMassProgram?.additions.length ? <p>Aucun ajout houblon à mettre à l’échelle ou à inventer.</p> : null}
          {finalMassProgram?.additions.some(row => row.grams === null) ? <p className="hv-copy-warning">Une masse doit être choisie dans le scénario avant la copie.</p> : null}
        </div> : null}

        {branch.programProposal?.stock.length ? <details className="hv-details hv-copy-stock">
          <summary>Besoin de houblon et état du stock</summary>
          {branch.programProposal.stock.map(row => <div className="hv-copy-stock-row" key={`${row.materialId}-${row.stockItemRef ?? ''}`}>
            <span>{row.materialId}{row.stockItemRef ? ` · ${row.stockItemRef}` : ''}</span>
            <span>Besoin {row.neededGrams == null ? 'inconnu' : `${number(row.neededGrams)} g`} · {row.availableGrams == null ? 'disponibilité inconnue' : `${number(row.availableGrams)} g signalés`} · {stockLabel(row.status)}</span>
          </div>)}
          <p className="hv-copy-note">Un brouillon futur et une disponibilité immédiate sont deux états différents.</p>
        </details> : null}

        {targetFields.some(target => targetValue(branch, target.field) !== undefined) || Object.keys(targetSource).length ? <section className="hv-copy-section" aria-labelledby="hv-copy-targets-title">
          <h3 id="hv-copy-targets-title">Cibles explicitement choisies</h3>
          {targetFields.map(target => {
            const value = targetValue(branch, target.field);
            return value === undefined ? null : <label className="hv-checkbox" key={target.field}>
              <input type="checkbox" checked={!!adoptedTargets[target.field]} onChange={event => toggleTarget(target.field, event.target.checked)} />
              <span>{target.label} · {number(value)} {target.unit}</span>
            </label>;
          })}
          {Object.entries(targetSource).map(([id, range]) => <div className="hv-copy-target" key={id}>
            <label className="hv-checkbox">
              <input type="checkbox" checked={!!adoptedAromaTargets[id]} onChange={event => { setAdoptedAromaTargets(values => ({ ...values, [id]: event.target.checked })); clearPreview(); }} />
              <span>Cible aromatique déclarée · {number(range.min)}–{number(range.max)}</span>
            </label>
            <details className="hv-details hv-copy-reference"><summary>Référence de cible</summary><code>{id}</code></details>
          </div>)}
          <p className="hv-copy-note">Les résultats calculés ne deviennent jamais des objectifs de recette.</p>
        </section> : null}

        {alphaNeeded.length ? <section className="hv-copy-section" aria-labelledby="hv-copy-alpha-title">
          <h3 id="hv-copy-alpha-title">Choix alpha de travail · sans analyse nouvelle</h3>
          <p className="hv-copy-note">Le domaine affiché vient du même contrôle que la validation; il est distinct d’une analyse de lot et ne préremplit aucun nominal. Une valeur refusée reste saisie jusqu’à ta correction.</p>
          {selectedAlphaRows.map(row => {
            const witness = alphaWitnessByAddition.get(row.id)
              ?? alphaChoiceWitnesses.find(candidate => candidate.material.id === row.materialId);
            const locked = witness?.domain.status === 'rejected';
            const title = branchAdditionName(branch, row.id);
            return <div className="hv-copy-alpha" key={row.id}>
              <b>{title} · matière cible</b>
              {witness ? <AlphaChoiceEvidence witness={witness} /> : <p className="hv-copy-alpha-evidence">
                Le témoin du domaine n’est pas transmis par cet aperçu; aucune borne ou source n’est affirmée ici. Reprévisualise depuis une référence qualifiée.
              </p>}
              {locked ? <div className="hv-copy-alpha-locked" role="status">
                <strong>Référence alpha refusée</strong>
                {alphaChoices[row.id] ? <p>Choix saisi conservé · {number(alphaChoices[row.id].value)} % · {alphaChoices[row.id].reason}</p> : null}
                <p>Un contrôle de saisie ne peut pas rendre cette référence exploitable; corrige la matière ou ses données dans le catalogue avant de reprendre.</p>
              </div> : <>
                <details className="hv-details hv-copy-reference"><summary>Référence de l’ajout</summary><code>{row.id}</code></details>
                <HopV55ExactInput label={`Alpha de travail · ${title}`} unit="%" min={0} max={100} required
                  value={alphaChoices[row.id]?.value} onValue={value => {
                    setAlphaChoices(current => {
                      const next = { ...current };
                      if (value === undefined) delete next[row.id];
                      else next[row.id] = { value, reason: alphaReasons[row.id] ?? current[row.id]?.reason ?? '' };
                      return next;
                    }); clearPreview(true);
                  }} />
                <label className="hv-field"><span>Motif de ce choix pour {title}</span><Input aria-label={`Motif alpha pour ${title}`}
                  value={alphaReasons[row.id] ?? alphaChoices[row.id]?.reason ?? ''} placeholder="Pourquoi ce nominal de travail ?"
                  onChange={event => {
                    const reason = event.target.value;
                    setAlphaReasons(current => ({ ...current, [row.id]: reason }));
                    setAlphaChoices(current => current[row.id] ? { ...current, [row.id]: { ...current[row.id], reason } } : current);
                    clearPreview(true);
                  }} /></label>
              </>}
            </div>;
          })}
        </section> : null}

      </fieldset>

      <div className="hv-actions hv-copy-actions">
        {!preview && !pendingWrite && !copyRecorded ? <button className="hv-primary" type="submit" disabled={busy}>
          {busy ? 'Prévisualisation…' : 'Prévisualiser la copie complète'}
        </button> : null}
      </div>
    </form>

    {error ? <p className="hv-error hv-copy-live" role="alert">{error}</p> : null}
    {notice ? <p className="hv-copy-live" role="status" aria-live="polite">{notice}</p> : null}

    {recomputeCandidate ? <section className="hv-copy-recompute" aria-labelledby="hv-copy-recompute-title">
      <h3 id="hv-copy-recompute-title">Nouvelle prévision requise</h3>
      <p>La recette candidate est conservée ci-dessous. Une nouvelle prévision explicite la vérifie sur la recette source courante; aucun réglage n’est modifié automatiquement.</p>
      <p><strong>{recomputeCandidate.name}</strong> · {number(recomputeCandidate.volumeL)} L · {recomputeCandidate.yeast.name}</p>
      {onRecompute ? <button type="button" onClick={() => void handleRecompute()} disabled={busy}>Prévoir cette candidate explicitement</button> : null}
    </section> : null}

    {preview ? <section className="hv-copy-preview" aria-labelledby="hv-copy-preview-title">
      <h3 id="hv-copy-preview-title">Nouvelle recette proposée</h3>
      <dl className="hv-copy-values">
        <div><dt>Nom</dt><dd>{preview.candidate.name}</dd></div>
        <div><dt>Style</dt><dd>{preview.candidate.style}{preview.candidate.styleRef ? '' : ' · sans référence'}</dd></div>
        <div><dt>Volume final</dt><dd>{number(preview.candidate.volumeL)} L</dd></div>
        <div><dt>Culture</dt><dd>{preview.candidate.yeast.name}{preview.candidate.yeast.qty === undefined ? '' : ` · ${number(preview.candidate.yeast.qty)} ${preview.candidate.yeast.unit ?? 'unité inconnue'}`}</dd></div>
        <div><dt>Produit commercial</dt><dd>{preview.receipt.plan.yeast?.product?.name ?? 'Inconnu ou non déclaré'}</dd></div>
        <div><dt>Fabricant</dt><dd>{preview.candidate.yeast.lab ?? 'Inconnu / non déclaré'}</dd></div>
        <div><dt>Souche distincte</dt><dd>{preview.candidate.yeast.strain ?? 'Inconnue / non déclarée'}</dd></div>
      </dl>
      {preview.hopPreview?.alphaChoiceWitnesses?.length ? <details className="hv-details hv-copy-alpha-final-witness">
        <summary>Domaine alpha et portée utilisés pour ce choix ({preview.hopPreview.alphaChoiceWitnesses.length})</summary>
        <p className="hv-copy-note">Le nominal est une hypothèse de modèle; ce témoin conserve sa source et sa portée sans devenir une analyse du lot.</p>
        {preview.hopPreview.alphaChoiceWitnesses.map(witness => <article className="hv-copy-alpha" key={witness.additionId}>
          <b>{branchAdditionName(branch, witness.additionId)}</b>
          {preview.alphaChoices[witness.additionId] ? <p>Nominal retenu · {number(preview.alphaChoices[witness.additionId].value)} % · {preview.alphaChoices[witness.additionId].reason}</p> : null}
          <AlphaChoiceEvidence witness={witness} />
        </article>)}
      </details> : null}
      {preview.candidate.styleRef || preview.candidate.yeast.hopIndexId ? <details className="hv-details hv-copy-reference">
        <summary>Références de catalogue exactes</summary>
        {preview.candidate.styleRef ? <p>Style · <code>{preview.candidate.styleRef.guideId}/{preview.candidate.styleRef.version}/{preview.candidate.styleRef.styleId}</code></p> : null}
        {preview.candidate.yeast.hopIndexId ? <p>Culture · <code>{preview.candidate.yeast.hopIndexId}</code></p> : null}
        {preview.receipt.plan.yeast?.product ? <p>Produit commercial · <code>{preview.receipt.plan.yeast.product.id}</code></p> : null}
      </details> : null}
      <ol className="hv-copy-phases">{preview.candidate.fermentation?.map((phase, index) => <li key={`${phase.kind}-${index}`}>
        <strong>{phase.name || phaseKindLabel(phase.kind)}</strong><span>{number(phase.tempC)} °C · {number(phase.days)} j</span>{phase.note ? <small>{phase.note}</small> : null}
      </li>)}</ol>
      <div className="hv-copy-hop-summary">
        <strong>{preview.candidate.hops.length} ajouts de houblon dans la recette</strong>
        {preview.candidate.hops.map((hop, index) => <div key={`${hop.name}-${index}`}>
          <span>{hop.name} · {recipeHopUseLabel(hop)} · {recipeHopContactLabel(hop)}</span>
          <strong>{hop.weightG == null ? 'Masse inconnue' : `${number(hop.weightG)} g`}</strong>
        </div>)}
      </div>
      <dl className="hv-copy-readiness">
        <div><dt>Copie locale</dt><dd>{preview.readiness.localCopy === 'ready' ? 'Prête' : 'Bloquée'}</dd></div>
        <div><dt>Enregistrement de la recette</dt><dd>{preview.readiness.save === 'readyToSave' ? 'Possible · pas encore confirmé' : 'À corriger avant enregistrement'}</dd></div>
        <div><dt>Brassage</dt><dd>{preview.readiness.brew === 'ready' ? 'Prêt' : preview.readiness.brew === 'incomplete' ? 'À compléter avant brassage' : 'Bloqué par une valeur invalide'}</dd></div>
        <div><dt>Statut de la branche d’origine</dt><dd>{historicalStatus[preview.receipt.scenarioApplicability]}</dd></div>
      </dl>
      <details className="hv-details hv-copy-reference"><summary>Références de la prévision de la recette proposée</summary>
        <p>Scope · recette finale après validation du programme et des choix alpha</p>
        <p>Snapshot · <code>{preview.candidateSnapshotReference}</code></p>
        <p>Branche · <code>{preview.candidateBranchReference}</code></p>
      </details>
      {preview.receipt.procurementAnnex ? <details className="hv-details hv-copy-stock">
        <summary>Proposition houblon d’origine conservée · {j1ApplicabilityLabel(preview.receipt.procurementAnnex.applicability)}</summary>
        {preview.receipt.procurementAnnex.stock.map(row => <div className="hv-copy-stock-row" key={`${row.materialId}-${row.stockItemRef ?? ''}`}>
          <span>{row.materialId}{row.stockItemRef ? ` · ${row.stockItemRef}` : ''}</span>
          <span>Besoin {row.neededGrams == null ? 'inconnu' : `${number(row.neededGrams)} g`} · {row.availableGrams == null ? 'disponibilité inconnue' : `${number(row.availableGrams)} g signalés`} · {stockLabel(row.status)}</span>
        </div>)}
        {preview.receipt.procurementAnnex.conditions.map((condition, index) => <p key={`${index}-${condition}`}>{condition}</p>)}
      </details> : null}
      {preview.receipt.candidateProgramAnnex ? <details className="hv-details hv-copy-stock">
        <summary>Programme de la recette proposée · {j1ApplicabilityLabel(preview.receipt.candidateProgramAnnex.applicability)}</summary>
        {preview.receipt.candidateProgramAnnex.stock.map(row => <div className="hv-copy-stock-row" key={`${row.materialId}-${row.stockItemRef ?? ''}`}>
          <span>{row.materialId}{row.stockItemRef ? ` · ${row.stockItemRef}` : ''}</span>
          <span>Besoin {row.neededGrams == null ? 'inconnu' : `${number(row.neededGrams)} g`} · {row.availableGrams == null ? 'disponibilité inconnue' : `${number(row.availableGrams)} g signalés`} · {stockLabel(row.status)}</span>
        </div>)}
        {preview.receipt.candidateProgramAnnex.conditions.map((condition, index) => <p key={`${index}-${condition}`}>{condition}</p>)}
      </details> : null}
      {preview.receipt.originAnnex ? <details className="hv-details hv-copy-annex">
        <summary>Scénario J5 antérieur conservé · {historicalStatus[preview.receipt.originAnnex.scenarioApplicability]}</summary>
        <p>Snapshot · <code>{preview.receipt.originAnnex.snapshotReference}</code></p>
        <p>Branche · <code>{preview.receipt.originAnnex.branchId}</code> · <code>{preview.receipt.originAnnex.branchReference}</code></p>
        <p>Hypothèse d’origine · {preview.receipt.originAnnex.requestBranch.label}</p>
      </details> : null}
      {preview.futureProcurement ? <div className="hv-copy-future-procurement hv-copy-future-receipt">
        <strong>Approvisionnement futur déclaré pour le programme</strong>
        <p>{preview.futureProcurement.reason}</p>
        <p className="hv-copy-note">Aucun achat, réservation ou changement de stock n’a eu lieu.</p>
      </div> : null}
      {preview.readiness.missing.length || preview.readiness.invalid.length ? <details className="hv-details">
        <summary>À compléter ou corriger · {preview.readiness.missing.length + preview.readiness.invalid.length}</summary>
        {[...preview.readiness.invalid, ...preview.readiness.missing].map((issue, index) => <p key={`${issue.field}-${index}`}>
          <strong>{issue.field}</strong> · {issue.message}
        </p>)}
      </details> : null}
      <details className="hv-details hv-copy-annex">
        <summary>Hypothèses conservées comme hypothèses · {preview.preservedBranch.assumptions.length + (preview.preservedBranch.modelOverrides?.length ?? 0) + (preview.preservedBranch.analogies?.length ?? 0) + (preview.preservedBranch.biologicalInputs?.length ?? 0)}</summary>
        <h4>Hypothèses exactes de la branche</h4>
        {preview.preservedBranch.assumptions.map((assumption, index) => <p key={`${assumption.id}-${index}`}>{planAssumptionLabel(assumption)}</p>)}
        {preview.preservedBranch.modelOverrides?.length ? <><h4>Paramètres de modèle</h4>{preview.preservedBranch.modelOverrides.map((row, index) => <p key={`${row.modelId}-${index}`}>{row.modelId} · {JSON.stringify(row.parameter)} · {row.assumptionId}</p>)}</> : null}
        {preview.preservedBranch.analogies?.length ? <><h4>Analogies</h4>{preview.preservedBranch.analogies.map((row, index) => <p key={`${row.assumptionId}-${index}`}>{JSON.stringify(row)}</p>)}</> : null}
        {preview.preservedBranch.biologicalInputs?.length ? <><h4>Conversion, extraction et rétention</h4>{preview.preservedBranch.biologicalInputs.map(row => <p key={row.id}>{row.id} · {row.kind} · {JSON.stringify(row)}</p>)}</> : null}
        <p className="hv-copy-note">Ces entrées, modèles, analogies et projections ne deviennent ni des faits de recette ni des opérations effectuées.</p>
      </details>
      {pendingWrite ? <div className="hv-copy-pending" role="status">
        <strong>Copie locale prête, reprise disponible.</strong>
        <p>La transmission locale a échoué ou reste à réessayer. Le même ID sera conservé.</p>
        <details className="hv-details hv-copy-reference"><summary>Référence de reprise</summary><code>{pendingWrite.copy.id}</code></details>
        <button className="hv-primary" type="button" onClick={() => void handleApply()} disabled={busy}>
          {busy ? 'Transmission…' : 'Réessayer l’enregistrement local'}
        </button>
      </div> : null}
      {preview && !pendingWrite && !copyRecorded ? <div className="hv-actions hv-copy-actions">
        <button className="hv-primary" type="button" onClick={() => void handleApply()} disabled={busy}>
          {busy ? 'Revalidation…' : 'Créer la copie complète locale'}
        </button>
      </div> : null}
      {copyRecorded ? <p className="hv-copy-success" role="status">Cette copie a été transmise au dossier sous son ID stable.</p> : null}
    </section> : null}
  </section>;
}
