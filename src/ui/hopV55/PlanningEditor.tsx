import React, { useMemo, useRef, useState } from 'react';
import type { BrewerContext } from '../../../functions/src/companionTypes';
import type { HopRecipeInput } from '../../../functions/src/hopRecipePrediction';
import type { BrewingScenarioBranchRequest, BrewingScenarioRequest } from '../../domain/brewingScenario';
import type { PreparedBrewingScenarioContext } from '../../domain/brewingScenarioContext';
import type { FermentPhaseKind } from '../../types';
import {
  applyHopV55PlanningEdits,
  getHopV55PlanningAxes,
  getHopV55PlanningStage,
  getHopV55PlanningStyles,
  getHopV55PlanningYeasts,
  type HopV55BeerTargetField,
  type HopV55PlanningEdits,
  type HopV55PlanningStyleOption,
  type HopV55PlanningStyleSelection,
  type HopV55PlanningStage,
} from '../../services/hopV55/scenarioPlanning';
import { HopV55ExactInput } from './ExactInput';
import { Input, Textarea } from '../Input';
import './planning-editor.css';

export interface HopV55PlanningStylePrefill {
  /** Catalogue row identity, kept only to track the hand-off. */
  id: string;
  guideId: string;
  version: string;
  /** Omit when a guide contains several styles; none is chosen automatically. */
  styleId?: string;
}

export interface HopV55PlanningEditorProps {
  prepared: PreparedBrewingScenarioContext;
  context?: BrewerContext;
  branch?: BrewingScenarioBranchRequest;
  stylePrefill?: HopV55PlanningStylePrefill;
  target?: BrewingScenarioRequest['target'];
  onCommit(branch: BrewingScenarioBranchRequest, target?: BrewingScenarioRequest['target']): void;
}

type EditMode = 'keep' | 'set' | 'reset';
type PhaseDraft = { key: string; kind: FermentPhaseKind | ''; name: string; tempC?: number; days?: number; note: string };

const beerTargets: Array<{ field: HopV55BeerTargetField; label: string; unit: string }> = [
  { field: 'ogTarget', label: 'Densité initiale visée', unit: 'SG' },
  { field: 'fgTarget', label: 'Densité finale visée', unit: 'SG' },
  { field: 'abvTarget', label: 'Alcool visé', unit: '% vol.' },
  { field: 'ibuTarget', label: 'Amertume visée', unit: 'IBU' },
];

const fermentationKinds: Array<{ value: FermentPhaseKind; label: string }> = [
  { value: 'primaire', label: 'Primaire' }, { value: 'reposDiacetyle', label: 'Repos diacétyle' },
  { value: 'garde', label: 'Garde' }, { value: 'refermentation', label: 'Refermentation' }, { value: 'ajout', label: 'Ajout' },
];

function stageLabel(stage: HopV55PlanningStage): string {
  return ({ planning: 'Avant brassage', hotSide: 'Jour de brassage', fermenting: 'Fermentation',
    conditioning: 'Garde et conditionnement', packaged: 'Conditionné', unknown: 'Stade à confirmer' })[stage];
}

function styleKey(style: Pick<HopV55PlanningStyleOption, 'guideId' | 'version' | 'styleId'>): string {
  return [style.guideId, style.version, style.styleId].map(encodeURIComponent).join('::');
}

function guideKey(guideId: string, version: string): string {
  return [guideId, version].map(encodeURIComponent).join('::');
}

function sourceLabel(source: { title: string; author: string; year: number | null; reference: string }): string {
  return [source.title, source.author, source.year ?? 'année inconnue', source.reference].filter(Boolean).join(' · ');
}

function counted(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function branchTargetValues(branch?: BrewingScenarioBranchRequest): Record<HopV55BeerTargetField, number | undefined> {
  const result: Record<HopV55BeerTargetField, number | undefined> = {
    ogTarget: undefined, fgTarget: undefined, abvTarget: undefined, ibuTarget: undefined,
  };
  for (const field of beerTargets) {
    const fact = branch?.beerContext?.facts.find(row => row.field === field.field && (row.status === 'target' || row.status === 'selected'));
    if (typeof fact?.value === 'number' && Number.isFinite(fact.value)) result[field.field] = fact.value;
  }
  return result;
}

function toPhaseDrafts(rows: NonNullable<PreparedBrewingScenarioContext['runtime']['current']>['input']['fermentation']): PhaseDraft[] {
  return rows.map((row, index) => ({ key: `phase-${index}`, kind: (row.kind ?? '') as FermentPhaseKind | '', name: row.name ?? '',
    tempC: row.tempC, days: row.days, note: row.note ?? '' }));
}

function makeBranchId(): string {
  const random = globalThis.crypto?.randomUUID?.();
  return `hop-v55-plan-${random ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
}

function prefillStyle(
  options: HopV55PlanningStyleOption[],
  prefill?: HopV55PlanningStylePrefill,
  branch?: BrewingScenarioBranchRequest,
): { guideId: string; key: string; role: 'target' | 'reference' | '' ; prefillInvalid: boolean; changed: boolean } {
  const current = branch?.beerContext?.style;
  if (prefill) {
    const guideOptions = options.filter(row => row.guideId === prefill.guideId && row.version === prefill.version);
    const selectedGuide = guideKey(prefill.guideId, prefill.version);
    if (!guideOptions.length) return { guideId: selectedGuide, key: '', role: '', prefillInvalid: true, changed: false };
    if (prefill.styleId) {
      const exact = guideOptions.find(row => row.styleId === prefill.styleId);
      return exact ? { guideId: selectedGuide, key: styleKey(exact), role: '', prefillInvalid: false, changed: true }
        : { guideId: selectedGuide, key: '', role: '', prefillInvalid: true, changed: false };
    }
    return guideOptions.length === 1
      ? { guideId: selectedGuide, key: styleKey(guideOptions[0]), role: '', prefillInvalid: false, changed: true }
      : { guideId: selectedGuide, key: '', role: '', prefillInvalid: false, changed: false };
  }
  if (current) {
    const exact = options.find(row => row.guideId === current.guideId && row.version === current.version && row.styleId === current.styleId);
    return { guideId: guideKey(current.guideId, current.version), key: exact ? styleKey(exact) : '', role: current.role, prefillInvalid: !exact, changed: false };
  }
  return { guideId: '', key: '', role: '', prefillInvalid: false, changed: false };
}

function exactStyleReference(option: HopV55PlanningStyleOption, role: 'target' | 'reference'): HopV55PlanningStyleSelection {
  return { name: option.name, reference: { ...option.reference, role } };
}

export function HopV55PlanningEditor({ prepared, context, branch, stylePrefill, target, onCommit }: HopV55PlanningEditorProps) {
  const [activeBranch, setActiveBranch] = useState(branch);
  const [activeTarget, setActiveTarget] = useState<BrewingScenarioRequest['target'] | undefined>(target);
  const stage = getHopV55PlanningStage(prepared, context);
  const input = prepared.runtime.current?.input;
  const program = prepared.runtime.current?.program ?? prepared.binding?.program;
  const isMixedCulture = prepared.runtime.current?.culture?.state === 'mixed';
  const isNolo = prepared.runtime.current?.input.aromaDomain === 'nolo';
  const styles = useMemo(() => getHopV55PlanningStyles(context), [context]);
  const axes = useMemo(() => getHopV55PlanningAxes(prepared), [prepared]);
  const yeasts = useMemo(() => getHopV55PlanningYeasts(prepared), [prepared]);
  const initialStyle = useMemo(() => prefillStyle(styles, stylePrefill, activeBranch), [styles, stylePrefill?.id, stylePrefill?.guideId, stylePrefill?.version, stylePrefill?.styleId, activeBranch?.id]);
  const [label, setLabel] = useState(() => activeBranch?.label ?? 'Mon plan futur');
  const [volumeL, setVolumeL] = useState<number | undefined>(() => activeBranch?.inputOverrides?.volumeL);
  const [volumeChanged, setVolumeChanged] = useState(false);
  const [yeastId, setYeastId] = useState(() => activeBranch?.inputOverrides?.yeastId === null ? '__unknown__' : activeBranch?.inputOverrides?.yeastId ?? '');
  const [yeastChanged, setYeastChanged] = useState(false);
  const [pitchTempC, setPitchTempC] = useState<number | undefined>(() => activeBranch?.inputOverrides?.pitchTempC);
  const [pitchTempChanged, setPitchTempChanged] = useState(false);
  const [phaseDrafts, setPhaseDrafts] = useState<PhaseDraft[]>(() => toPhaseDrafts(activeBranch?.inputOverrides?.fermentation ?? input?.fermentation ?? []));
  const [fermentationChanged, setFermentationChanged] = useState(false);
  const [fermentationMode, setFermentationMode] = useState<'set' | 'reset'>('set');
  const [styleGuideId, setStyleGuideId] = useState(initialStyle.guideId);
  const [selectedStyleKey, setSelectedStyleKey] = useState(initialStyle.key);
  const [styleRole, setStyleRole] = useState<'target' | 'reference' | ''>(initialStyle.role);
  const [styleChanged, setStyleChanged] = useState(initialStyle.changed);
  const [stylePrefillInvalid, setStylePrefillInvalid] = useState(initialStyle.prefillInvalid);
  const [beerModes, setBeerModes] = useState<Record<HopV55BeerTargetField, EditMode>>({
    ogTarget: 'keep', fgTarget: 'keep', abvTarget: 'keep', ibuTarget: 'keep',
  });
  const [beerValues, setBeerValues] = useState(() => branchTargetValues(activeBranch));
  const [axisModes, setAxisModes] = useState<Record<string, EditMode>>({});
  const [axisRanges, setAxisRanges] = useState<Record<string, { min?: number; max?: number }>>(() =>
    Object.fromEntries(axes.flatMap(axis => activeTarget?.[axis.id] ? [[axis.id, structuredClone(activeTarget[axis.id])]] : [])));
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const formRef = useRef<HTMLFormElement | null>(null);
  const generatedBranchId = useRef(makeBranchId());
  const currentBranchId = activeBranch?.id ?? generatedBranchId.current;
  const selectedStyle = styles.find(row => styleKey(row) === selectedStyleKey);
  const styleGuideGroups = useMemo(() => [...new Map(styles.map(row => [`${row.guideId}\u0000${row.version}`, row])).values()], [styles]);
  const currentStyleReference = prepared.runtime.current?.beerContext?.style;
  const currentStyle = currentStyleReference ? styles.find(row => row.guideId === currentStyleReference.guideId
    && row.version === currentStyleReference.version && row.styleId === currentStyleReference.styleId) : undefined;
  const unknownTargetEntries = Object.entries(activeTarget ?? {}).filter(([axisId]) => !axes.some(axis => axis.id === axisId));
  const stageAllowsFuturePlan = stage === 'planning' || stage === 'hotSide';
  const canSetVolume = stage === 'planning';
  const canSetBiology = stageAllowsFuturePlan && !isMixedCulture;
  const sourceTargets = prepared.runtime.current?.beerContext?.facts ?? [];
  const hasVolumeOverride = activeBranch?.inputOverrides?.volumeL !== undefined
    || activeBranch?.programOverrides?.volumeL !== undefined;
  const hasYeastOverride = !!activeBranch?.inputOverrides && Object.prototype.hasOwnProperty.call(activeBranch.inputOverrides, 'yeastId');
  const hasPitchTemperatureOverride = activeBranch?.inputOverrides?.pitchTempC !== undefined;
  const hasFermentationOverride = !!activeBranch?.inputOverrides && Object.prototype.hasOwnProperty.call(activeBranch.inputOverrides, 'fermentation');

  function updatePhase(key: string, change: Partial<PhaseDraft>) {
    setPhaseDrafts(rows => rows.map(row => row.key === key ? { ...row, ...change } : row));
    setFermentationMode('set');
    setFermentationChanged(true);
  }

  function selectedFermentation(): HopRecipeInput['fermentation'] {
    return phaseDrafts.map(row => ({
      ...(row.kind ? { kind: row.kind } : {}), ...(row.name.trim() ? { name: row.name.trim() } : {}),
      ...(row.tempC !== undefined ? { tempC: row.tempC } : {}), ...(row.days !== undefined ? { days: row.days } : {}),
      ...(row.note.trim() ? { note: row.note.trim() } : {}),
    }));
  }

  const invalidPhase = fermentationChanged && fermentationMode === 'set' && phaseDrafts.some(row => !row.kind || !row.name.trim()
    || row.tempC === undefined || row.days === undefined || row.days < 0);
  const invalidTarget = beerTargets.some(row => beerModes[row.field] === 'set' && beerValues[row.field] === undefined)
    || axes.some(axis => axisModes[axis.id] === 'set' && (axisRanges[axis.id]?.min === undefined || axisRanges[axis.id]?.max === undefined
      || axisRanges[axis.id]!.min! > axisRanges[axis.id]!.max!));

  function commit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setNotice('');
    if (formRef.current?.querySelector('[aria-invalid="true"]')) {
      setError('Corrige les nombres signalés avant d’enregistrer la branche.'); return;
    }
    if (invalidPhase) { setError('Complète ou retire chaque palier modifié : type, nom, température et durée restent explicites.'); return; }
    if (invalidTarget) { setError('Complète les deux bornes de chaque cible choisie, dans l’échelle affichée.'); return; }
    if (styleChanged && (stylePrefillInvalid || !selectedStyle || !styleRole)) {
      setError(stylePrefillInvalid ? 'Le guide de style choisi n’est plus chargé; aucun style voisin ne sera substitué.'
        : 'Choisis une référence de style résolue et précise si elle est une cible ou une comparaison.'); return;
    }

    const edits: HopV55PlanningEdits = {};
    if (volumeChanged) edits.volumeL = volumeL === undefined ? { action: 'reset' } : { action: 'set', value: volumeL };
    if (yeastChanged) edits.yeastId = yeastId === '' ? { action: 'reset' }
      : { action: 'set', value: yeastId === '__unknown__' ? null : yeastId };
    if (pitchTempChanged) edits.pitchTempC = pitchTempC === undefined ? { action: 'reset' } : { action: 'set', value: pitchTempC };
    if (fermentationChanged) edits.fermentation = fermentationMode === 'reset'
      ? { action: 'reset' } : { action: 'set', value: selectedFermentation() };
    if (styleChanged) edits.style = selectedStyle && styleRole
      ? { action: 'set', value: exactStyleReference(selectedStyle, styleRole) } : { action: 'reset' };
    const beerEdits: NonNullable<HopV55PlanningEdits['beerTargets']> = {};
    for (const targetField of beerTargets) {
      const mode = beerModes[targetField.field];
      if (mode === 'set' && beerValues[targetField.field] !== undefined) beerEdits[targetField.field] = { action: 'set', value: beerValues[targetField.field]! };
      else if (mode === 'reset') beerEdits[targetField.field] = { action: 'reset' };
    }
    if (Object.keys(beerEdits).length) edits.beerTargets = beerEdits;
    const axisEdits: NonNullable<HopV55PlanningEdits['axisTargets']> = {};
    for (const axis of axes) {
      const mode = axisModes[axis.id] ?? 'keep';
      if (mode === 'reset') axisEdits[axis.id] = { action: 'reset' };
      else if (mode === 'set') {
        const range = axisRanges[axis.id];
        if (range?.min !== undefined && range.max !== undefined) axisEdits[axis.id] = { action: 'set', value: { min: range.min, max: range.max } };
      }
    }
    if (Object.keys(axisEdits).length) edits.axisTargets = axisEdits;

    try {
      const result = applyHopV55PlanningEdits({ prepared, context, branch: activeBranch, branchId: currentBranchId, label, edits, target: activeTarget });
      onCommit(result.branch, result.target);
      const nextTarget = result.target ?? activeTarget;
      setActiveBranch(result.branch);
      setActiveTarget(nextTarget);
      setVolumeL(result.branch.inputOverrides?.volumeL);
      setVolumeChanged(false);
      setYeastId(result.branch.inputOverrides?.yeastId === null ? '__unknown__' : result.branch.inputOverrides?.yeastId ?? '');
      setYeastChanged(false);
      setPitchTempC(result.branch.inputOverrides?.pitchTempC);
      setPitchTempChanged(false);
      setPhaseDrafts(toPhaseDrafts(result.branch.inputOverrides?.fermentation ?? input?.fermentation ?? []));
      setFermentationChanged(false);
      setFermentationMode('set');
      const nextStyle = result.branch.beerContext?.style;
      const nextStyleOption = nextStyle ? styles.find(row => row.guideId === nextStyle.guideId && row.version === nextStyle.version && row.styleId === nextStyle.styleId) : undefined;
      setStyleGuideId(nextStyle ? guideKey(nextStyle.guideId, nextStyle.version) : '');
      setSelectedStyleKey(nextStyleOption ? styleKey(nextStyleOption) : '');
      setStyleRole(nextStyle?.role ?? '');
      setStyleChanged(false);
      setStylePrefillInvalid(!!nextStyle && !nextStyleOption);
      setBeerValues(branchTargetValues(result.branch));
      setBeerModes({ ogTarget: 'keep', fgTarget: 'keep', abvTarget: 'keep', ibuTarget: 'keep' });
      setAxisModes({});
      setAxisRanges(Object.fromEntries(axes.flatMap(axis => nextTarget?.[axis.id] ? [[axis.id, structuredClone(nextTarget[axis.id])]] : [])));
      setNotice('Branche de planification transmise. La recette source et le brassin restent inchangés.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'La branche n’a pas pu être vérifiée.');
    }
  }

  function formatNumber(value: number): string { return new Intl.NumberFormat('fr-CH', { maximumFractionDigits: 3 }).format(value); }

  return <section className="hv-planning" aria-labelledby="hv-planning-title" data-testid="hop-v55-planning-editor">
    <header className="hv-planning__heading">
      <div><p className="hv-planning__eyebrow">Houblons · plan futur</p><h2 id="hv-planning-title">Préparer une branche de scénario</h2>
        <p>Les choix restent des hypothèses de planification. Ils ne modifient ni la recette source ni le brassin.</p></div>
      <span className="hv-planning__stage">{stageLabel(stage)}</span>
    </header>

    <p className="hv-planning__scope" role="note">
      {stage === 'planning' ? 'Avant brassage : les réglages décrivent des consignes futures explicites.'
        : stage === 'hotSide' ? 'Jour de brassage : volume conservé. Souche, ensemencement et paliers restent des projections futures; les faits déjà consignés ne sont pas remplacés.'
          : stage === 'fermenting' ? 'Fermentation engagée : souche, ensemencement et paliers non séparés entre passé et futur restent inchangés. Les cibles et comparaisons restent disponibles.'
            : stage === 'conditioning' || stage === 'packaged' ? 'Le procédé est déjà avancé : aucune conduite passée n’est réécrite. Une comparaison de style ou de cibles reste possible.'
              : 'Le stade courant n’est pas établi; les réglages de conduite restent inchangés. Les comparaisons restent disponibles.'}
    </p>
    {isMixedCulture ? <p className="hv-planning__note">La culture source est composée; le contrat de branche à souche unique ne peut pas la réduire. Le reste de la comparaison reste ouvert.</p> : null}
    {isNolo ? <p className="hv-planning__note">Matrice NOLO : les limites de calcul restent visibles dans le résultat. Aucun effet sensoriel alcoolisé n’est ajouté par cet éditeur.</p> : null}
    {!input ? <p className="hv-planning__note">Aucune entrée de recette courante n’est liée. Cet éditeur ne fabrique pas de base d’entrée; style et cibles restent modifiables comme comparaison.</p> : null}
    {error ? <p className="hv-planning__error" role="alert">{error}</p> : null}
    {notice ? <p className="hv-planning__notice" role="status">{notice}</p> : null}

    <form ref={formRef} autoComplete="off" onSubmit={commit}>
      <label className="hv-planning__field hv-planning__name"><span>Nom de la branche</span>
        <Input aria-label="Nom de la branche de planification" value={label} onChange={event => setLabel(event.target.value)} required maxLength={120} />
      </label>

      <section className="hv-planning__group" aria-labelledby="hv-planning-process-title">
        <h3 id="hv-planning-process-title">Consignes de conduite</h3>
        <div className="hv-planning__fields">
          <div className="hv-planning__field">
            <fieldset className="hv-planning__lock" disabled={!canSetVolume || !input}>
              <legend className="hv-planning__sr">Volume de planification</legend>
              <HopV55ExactInput label="Volume final de cette branche" unit="L" min={1} value={volumeL}
                onValue={value => { setVolumeL(value); setVolumeChanged(true); }} />
            </fieldset>
            {input ? <small>Recette source · {formatNumber(input.volumeL)} L. Une modification garde les masses d’ajout; aucune mise à l’échelle n’est appliquée.</small>
              : <small>Sans entrée source, aucune valeur de volume n’est préremplie.</small>}
            {!canSetVolume ? <small>Le volume est verrouillé à ce stade. Une nouvelle taille de brassin demande une base de planification distincte.</small> : null}
            {!canSetVolume && hasVolumeOverride ? <button type="button" className="hv-planning__reset"
              onClick={() => { setVolumeL(undefined); setVolumeChanged(true); }}>Retirer l’override de volume</button> : null}
          </div>

          <label className="hv-planning__field"><span>Souche pour la projection de branche</span>
            <select aria-label="Souche de la branche" value={yeastId} disabled={!canSetBiology || !input}
              onChange={event => { setYeastId(event.target.value); setYeastChanged(true); }}>
              <option value="">Conserver la base actuelle</option><option value="__unknown__">Souche non résolue pour cette projection</option>
              {yeasts.map(yeast => <option key={yeast.id} value={yeast.id}>{yeast.name} · {yeast.form ?? 'forme inconnue'}</option>)}
            </select>
            {input ? <small>Souche source · {input.yeastId ? yeasts.find(row => row.id === input.yeastId)?.name ?? 'identité non chargée' : 'non résolue'}.</small> : null}
            <small>Le choix ne crée ni fiche technique, ni produit, ni starter. La copie Recipe qualifiera séparément identité et quantité.</small>
            {!canSetBiology && hasYeastOverride ? <button type="button" className="hv-planning__reset"
              onClick={() => { setYeastId(''); setYeastChanged(true); }}>Retirer l’hypothèse de souche</button> : null}
          </label>

          <div className="hv-planning__field">
            <fieldset className="hv-planning__lock" disabled={!canSetBiology || !input}>
              <legend className="hv-planning__sr">Température d’ensemencement de planification</legend>
              <HopV55ExactInput label="Température d’ensemencement" unit="°C" min={-273.15} value={pitchTempC}
                onValue={value => { setPitchTempC(value); setPitchTempChanged(true); }} />
            </fieldset>
            {input?.pitchTempC !== undefined ? <small>Consigne source · {formatNumber(input.pitchTempC)} °C.</small> : <small>Aucune consigne source n’est renseignée.</small>}
            {!canSetBiology && hasPitchTemperatureOverride ? <button type="button" className="hv-planning__reset"
              onClick={() => { setPitchTempC(undefined); setPitchTempChanged(true); }}>Retirer la consigne de branche</button> : null}
          </div>
        </div>

        <details className="hv-planning__details">
          <summary>Paliers de fermentation · {counted(phaseDrafts.length, 'palier')} affiché{phaseDrafts.length === 1 ? '' : 's'}</summary>
          {stageAllowsFuturePlan && input ? <>
            <p className="hv-planning__muted">Les paliers non touchés restent absents de l’override. Modifier un palier rend la liste entière explicite; chaque valeur doit être déclarée.</p>
            <ol className="hv-planning__phases">
              {phaseDrafts.map((phase, index) => <li key={phase.key}>
                <header><strong>Palier {index + 1}</strong><button type="button" className="hv-planning__remove"
                  onClick={() => { setPhaseDrafts(rows => rows.filter(row => row.key !== phase.key)); setFermentationChanged(true); }}>Retirer ce palier</button></header>
                <div className="hv-planning__fields">
                  <label className="hv-planning__field"><span>Type de palier</span><select aria-label={`Type du palier ${index + 1}`} value={phase.kind}
                    onChange={event => updatePhase(phase.key, { kind: event.target.value as FermentPhaseKind | '' })}>
                    <option value="">À préciser</option>{fermentationKinds.map(row => <option value={row.value} key={row.value}>{row.label}</option>)}
                  </select></label>
                  <label className="hv-planning__field"><span>Nom</span><Input aria-label={`Nom du palier ${index + 1}`} value={phase.name}
                    onChange={event => updatePhase(phase.key, { name: event.target.value })} /></label>
                  <div className="hv-planning__field"><HopV55ExactInput label={`Température du palier ${index + 1}`} unit="°C" min={-273.15} value={phase.tempC}
                    onValue={value => updatePhase(phase.key, { tempC: value })} /></div>
                  <div className="hv-planning__field"><HopV55ExactInput label={`Durée du palier ${index + 1}`} unit="j" min={0} value={phase.days}
                    onValue={value => updatePhase(phase.key, { days: value })} /></div>
                  <label className="hv-planning__field hv-planning__wide"><span>Note de conduite · facultative</span>
                    <Textarea aria-label={`Note du palier ${index + 1}`} rows={2} value={phase.note}
                      onChange={event => updatePhase(phase.key, { note: event.target.value })} /></label>
                </div>
              </li>)}
            </ol>
            <button type="button" onClick={() => {
              setPhaseDrafts(rows => [...rows, { key: `phase-${crypto.randomUUID()}`, kind: '', name: '', note: '' }]);
              setFermentationMode('set');
              setFermentationChanged(true);
            }}>Ajouter un palier</button>
            {hasFermentationOverride ? <button type="button" className="hv-planning__reset" onClick={() => {
              setFermentationMode('reset'); setFermentationChanged(true);
            }}>Revenir aux paliers de la source</button> : null}
            {invalidPhase ? <p className="hv-planning__error" role="alert">Complète ou retire chaque palier modifié; aucune durée n’est déduite.</p> : null}
          </> : <>
            <p className="hv-planning__muted">Le stade ou l’entrée ne permet pas de distinguer les paliers futurs des phases déjà engagées. Ils restent en lecture seule ici.</p>
            {hasFermentationOverride ? <button type="button" className="hv-planning__reset" onClick={() => {
              setFermentationChanged(true); setFermentationMode('reset');
            }}>Retirer l’override et revenir à la source</button> : null}
          </>}
        </details>
      </section>

      <section className="hv-planning__group" aria-labelledby="hv-planning-style-title">
        <h3 id="hv-planning-style-title">Style de branche</h3>
        {currentStyle ? <p className="hv-planning__muted">Style source · {currentStyle.name} · {currentStyle.guideName}, {currentStyle.edition}. Ce contexte source n’est pas adopté à nouveau.</p>
          : currentStyleReference ? <p className="hv-planning__muted">Un style source exact est conservé, mais son guide n’est pas chargé pour l’afficher.</p>
            : <p className="hv-planning__muted">Aucun style de recette n’est supposé; un style choisi ci-dessous garde le rôle que tu lui donnes.</p>}
        {!styleGuideGroups.length ? <p className="hv-planning__note">Aucun guide de style exact n’est chargé ici; les autres choix de branche restent disponibles.</p> : null}
        {stylePrefillInvalid ? <p className="hv-planning__error" role="alert">Le guide ou le style transmis n’est pas présent dans le référentiel reçu. Aucun remplacement automatique n’est proposé.</p> : null}
        <div className="hv-planning__fields">
          <label className="hv-planning__field"><span>Guide et édition</span><select aria-label="Guide de style" value={styleGuideId} disabled={!styleGuideGroups.length}
            onChange={event => { setStyleGuideId(event.target.value); setSelectedStyleKey(''); setStyleRole(''); setStyleChanged(true); setStylePrefillInvalid(false); }}>
            <option value="">{styleGuideGroups.length ? 'Choisir un guide chargé' : 'Aucun guide chargé'}</option>{styleGuideGroups.map(row => <option key={guideKey(row.guideId, row.version)} value={guideKey(row.guideId, row.version)}>{row.guideName} · {row.edition} · {row.version}</option>)}
          </select></label>
          <label className="hv-planning__field"><span>Style exact du guide</span><select aria-label="Style exact" value={selectedStyleKey} disabled={!styleGuideGroups.length}
            onChange={event => { setSelectedStyleKey(event.target.value); setStyleChanged(true); setStylePrefillInvalid(false); }}>
            <option value="">Aucune nouvelle sélection</option>{styles.filter(row => guideKey(row.guideId, row.version) === styleGuideId)
              .map(row => <option key={styleKey(row)} value={styleKey(row)}>{row.name} · {row.code} · {row.family}</option>)}
          </select></label>
          <label className="hv-planning__field"><span>Rôle du style</span><select aria-label="Rôle du style" value={styleRole} disabled={!selectedStyle}
            onChange={event => { setStyleRole(event.target.value as typeof styleRole); setStyleChanged(true); }}>
            <option value="">À choisir explicitement</option><option value="target">Cible de la branche</option><option value="reference">Référence de comparaison</option>
          </select></label>
        </div>
        {selectedStyle ? <details className="hv-planning__details">
          <summary>Sources du style choisi</summary>
          <p>{selectedStyle.name} · code {selectedStyle.code} · famille {selectedStyle.family} · {selectedStyle.guideName}, {selectedStyle.edition}, version {selectedStyle.version}.</p>
          <p>{sourceLabel(selectedStyle.source)}</p><p>Guide · {sourceLabel(selectedStyle.guideSource)}</p>
        </details> : null}
        <p className="hv-planning__muted">Une cible et une référence de comparaison sont deux rôles différents. Les plages de style ne deviennent pas automatiquement des objectifs Recipe.</p>
      </section>

      <section className="hv-planning__group" aria-labelledby="hv-planning-beer-targets-title">
        <h3 id="hv-planning-beer-targets-title">Cibles de bière</h3>
        <p className="hv-planning__muted">Une cible saisie reste une intention. Les sorties du modèle ne remplissent pas ces champs.</p>
        <div className="hv-planning__fields">
          {beerTargets.map(row => {
            const source = sourceTargets.find(fact => fact.field === row.field && fact.status === 'target');
            return <div className="hv-planning__target" key={row.field}>
              <label className="hv-planning__field"><span>{row.label}</span><select aria-label={`Action · ${row.label}`} value={beerModes[row.field]}
                onChange={event => setBeerModes(value => ({ ...value, [row.field]: event.target.value as EditMode }))}>
                <option value="keep">{beerValues[row.field] === undefined ? 'Aucune modification' : 'Conserver la cible de la branche'}</option>
                <option value="set">Définir une cible pour cette branche</option><option value="reset">Retirer la cible de cette branche</option>
              </select></label>
              {source && typeof source.value === 'number' ? <small>Recette source · {formatNumber(source.value)} {row.unit}. Cette cible reste séparée.</small> : null}
              {beerModes[row.field] === 'set' ? <HopV55ExactInput label={`${row.label} · valeur choisie`} unit={row.unit} value={beerValues[row.field]}
                onValue={value => setBeerValues(current => ({ ...current, [row.field]: value }))} /> : null}
              {beerModes[row.field] === 'reset' ? <small>La cible de la branche sera retirée; la valeur source reste inchangée.</small> : null}
            </div>;
          })}
        </div>
      </section>

      <details className="hv-planning__details hv-planning__axis-list">
        <summary>Cibles d’axes aromatiques · {counted(axes.length, 'axe')} chargés · {counted(axes.filter(axis => activeTarget?.[axis.id]).length, 'plage')} déjà choisie{axes.filter(axis => activeTarget?.[axis.id]).length === 1 ? '' : 's'}</summary>
        <p className="hv-planning__muted">Chaque plage reste dans l’échelle exacte de son axe. Aucun milieu ni score n’est déduit.</p>
        {axes.map(axis => {
          const currentTarget = activeTarget?.[axis.id];
          const mode = axisModes[axis.id] ?? 'keep';
          const values = axisRanges[axis.id] ?? currentTarget;
          return <details className="hv-planning__axis" key={axis.id}>
            <summary>{axis.name} · {currentTarget ? `cible ${formatNumber(currentTarget.min)}–${formatNumber(currentTarget.max)}` : 'sans cible'}</summary>
            <p>{axis.description}</p><p>Échelle chargée · {formatNumber(axis.scale.min)}–{formatNumber(axis.scale.max)} · version {axis.version}</p>
            <p className="hv-planning__source">{sourceLabel(axis.source)}</p>
            <label className="hv-planning__field"><span>Action sur la cible</span><select aria-label={`Action de cible · ${axis.name}`} value={mode}
              onChange={event => {
                const next = event.target.value as EditMode;
                setAxisModes(current => ({ ...current, [axis.id]: next }));
                if (next === 'set' && currentTarget && !axisRanges[axis.id]) setAxisRanges(current => ({ ...current, [axis.id]: { ...currentTarget } }));
              }}>
              <option value="keep">Conserver la cible actuelle</option><option value="set">Définir une plage explicite</option><option value="reset">Retirer la cible de cet axe</option>
            </select></label>
            {mode === 'set' ? <div className="hv-planning__fields">
              <div className="hv-planning__field"><HopV55ExactInput label={`Minimum · ${axis.name}`} min={axis.scale.min} max={axis.scale.max} value={values?.min}
                onValue={value => setAxisRanges(current => ({ ...current, [axis.id]: { ...current[axis.id], min: value } }))} /></div>
              <div className="hv-planning__field"><HopV55ExactInput label={`Maximum · ${axis.name}`} min={axis.scale.min} max={axis.scale.max} value={values?.max}
                onValue={value => setAxisRanges(current => ({ ...current, [axis.id]: { ...current[axis.id], max: value } }))} /></div>
            </div> : null}
            {mode === 'reset' && currentTarget ? <small>La plage sera retirée du scénario; aucun autre axe ne change.</small> : null}
          </details>;
        })}
        {unknownTargetEntries.length ? <details className="hv-planning__unknown-targets"><summary>{counted(unknownTargetEntries.length, 'cible')} conservée{unknownTargetEntries.length === 1 ? '' : 's'} sans axe actuellement chargé</summary>
          {unknownTargetEntries.map(([id, range]) => <p key={id}><code>{id}</code> · {formatNumber(range.min)}–{formatNumber(range.max)} · conservée telle quelle.</p>)}
        </details> : null}
      </details>

      <div className="hv-planning__actions"><button type="submit" className="hv-planning__primary">Transmettre cette branche</button>
        <span>La sauvegarde du scénario et toute copie Recipe sont gérées séparément.</span></div>
    </form>
  </section>;
}
