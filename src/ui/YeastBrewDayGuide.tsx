import { Units } from '../services/units';
import React, { useMemo } from 'react';
import type { BrewDayState } from '../types';
import type { YeastPreparationExecution } from '../../functions/src/yeastSupplySchema';
import type { TrialRecipe } from '../domain/hopIndex/trials';
import { buildYeastBrewDay, type YeastBrewPhase } from '../domain/yeastBrewDay';
import { pitchingContext, yeastPreparationState } from '../domain/yeastPitching';
import type { PitchQuantityChoice } from '../domain/brewDay';
import { yeastReferences } from '../domain/yeastReferences';
import { StorageService } from '../services/storage';
import { useStorageValue } from '../hooks/useLiveData';
import { FermentationTemperatureChart } from './FermentationTemperatureChart';
import { YeastStrainDetails } from './YeastStrainDetails';
import { NumberInput } from './NumberInput';
import { BrewAide } from './BrewAide';
import './yeast-recipe.css';

const fmt = (n?: number, digits = 1) => Number.isFinite(n) ? n!.toLocaleString('fr-FR', { maximumFractionDigits: digits }) : '—';
const brewDateTime = (value: string | number) => {
  const at = typeof value === 'number' ? value : Date.parse(value);
  return Number.isFinite(at) ? new Date(at).toLocaleString('fr-CH') : 'Date à vérifier';
};
export function YeastBrewDayGuide({ recipe, state, phase, onMeasure, collapsible,
  pitchQuantityMode, pitchQuantityAmount, pitchQuantityUnit, preparationExecution, plannedBrewDate,
  onPitchQuantityModeChange, onPitchQuantityAmountChange, onPitchQuantityUnitChange }: {
  recipe: TrialRecipe; state: BrewDayState; phase: YeastBrewPhase; onMeasure?: (kind: 'temperature' | 'volume' | 'densite') => void;
  pitchQuantityMode?: PitchQuantityChoice['mode']; pitchQuantityAmount?: number; pitchQuantityUnit?: string;
  preparationExecution?: YeastPreparationExecution; plannedBrewDate?: string;
  onPitchQuantityModeChange?: (mode: PitchQuantityChoice['mode']) => void;
  onPitchQuantityAmountChange?: (amount: number | undefined) => void;
  onPitchQuantityUnitChange?: (unit: string) => void;
  /** Dans la conduite, l'aide passe sous les ingrédients et s'ouvre à la demande. */
  collapsible?: boolean;
}) {
  const saved = useStorageValue(StorageService.getHopKnowledge);
  const refs = useMemo(() => yeastReferences(saved), [saved]);
  const guide = useMemo(() => buildYeastBrewDay(recipe, state, phase, refs), [recipe, state, phase, refs]);
  if (!guide || !guide.instructions.length) return null;
  const currentPreparation = recipe.yeast.pitching?.preparation;
  const starterPlan = preparationExecution?.plan ?? currentPreparation;
  const preparationState = yeastPreparationState(recipe.yeast, plannedBrewDate);
  const planStillCurrent = !!currentPreparation && !!preparationExecution && currentPreparation.id === preparationExecution.plan.id && currentPreparation.revision === preparationExecution.plan.revision;
  const preparationStale = !!preparationExecution && (!planStillCurrent || preparationState === 'stale' || preparationState === 'cancelled' || preparationExecution.plan.context !== pitchingContext(recipe.yeast));
  const preparationExpired = !!starterPlan && Number.isFinite(Date.parse(starterPlan.targetPitchAt)) && Date.parse(starterPlan.targetPitchAt) <= Date.now();
  const hoursUntilPitch = starterPlan ? (Date.parse(starterPlan.targetPitchAt) - Date.now()) / 3600000 : NaN;
  const preparationTooLate = !preparationExecution && preparationState === 'too-late' && !preparationExpired;
  const preparationWindowShort = !preparationExecution && preparationState === 'due' && starterPlan &&
    hoursUntilPitch >= starterPlan.protocol.leadHours.min && hoursUntilPitch < starterPlan.protocol.leadHours.max;
  const starterProtocol = recipe.yeast.pitching?.product?.starter;
  const quantityEntry = phase === 'finish' && !!onPitchQuantityModeChange &&
    (state.pitchedAt == null || state.pitchQuantityConfirmation == null || state.pitchQuantityConfirmation === 'unmeasured');
  const canTransferStarter = preparationExecution?.status === 'started' || preparationExecution?.status === 'ready';
  const body = <>
    {guide.stale && <p className="yeast-notice" data-notice>L’objectif et les réglages actuels diffèrent. Suivre les consignes du brassin ci-dessous et vérifier l’écart.</p>}
    {guide.formWarning && <p className="yeast-notice" data-notice>{guide.formWarning}</p>}
    <dl className="yeast-brew-instructions">{guide.instructions.map(item => <div key={item.id} data-instruction={item.id}>
      <dt className={item.warning ? 'yeast-notice' : 'font-medium text-cave-50'} data-notice={item.warning || undefined}>{item.title}</dt><dd>{item.detail}</dd>
    </div>)}</dl>
    {phase === 'finish' && starterPlan && <section aria-label="Starter du brassin" className="rounded-control border border-cave-800 p-2 space-y-2">
      <h4 className="text-sm font-semibold text-cave-50">Starter · {starterPlan.protocol.label}</h4>
      {preparationStale && <p role="alert" data-notice className="yeast-notice">La préparation suit une copie ancienne du plan. Date, produit ou contexte modifié : relis cette copie et la notice avant de transférer.</p>}
      {preparationExpired && preparationExecution?.status !== 'transferred' && (preparationExecution
        ? <p role="alert" data-notice className="yeast-notice">L’échéance cible est passée. Vérifie les conditions de la notice ; l’application ne conclut ni à une culture viable ni à une préparation irréalisable.</p>
        : <p role="alert" data-notice className="yeast-notice">L’ensemencement cible est passé : ne démarre pas ce plan. Replanifie sa date avant de commencer.</p>)}
      {preparationTooLate && starterPlan && <p role="alert" data-notice className="yeast-notice">Il reste {fmt(hoursUntilPitch)} h avant l’ensemencement cible, sous le minimum publié de {fmt(starterPlan.protocol.leadHours.min)} h. Ne démarre pas ce plan à ce stade. Cette borne ne garantit pas la viabilité.</p>}
      {preparationWindowShort && starterPlan && <p role="status" data-notice className="yeast-notice">Il reste {fmt(hoursUntilPitch)} h, soit {fmt(starterPlan.protocol.leadHours.max - hoursUntilPitch)} h de moins que la borne haute publiée ({fmt(starterPlan.protocol.leadHours.max)} h). Le minimum publié ({fmt(starterPlan.protocol.leadHours.min)} h) est atteint, mais la fenêtre ne garantit pas l’achèvement ni la viabilité. La notice ne date pas séparément toutes les opérations annexes, notamment l’activation et le refroidissement.</p>}
      <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 yeast-small">
        <dt>État</dt><dd>{preparationExecution?.status === 'transferred' ? 'Culture transférée'
          : preparationExecution?.status === 'ready' ? 'Préparation prête, transfert à confirmer'
            : preparationExecution?.status === 'started' ? 'Préparation commencée'
              : preparationExecution?.status === 'cancelled' || starterPlan.status === 'cancelled' ? 'Plan annulé'
                : preparationExpired ? 'Échéance passée · plan à revalider'
                  : preparationState === 'stale' ? 'Plan à revalider'
                    : preparationState === 'too-late' ? 'Trop tard pour démarrer avec le minimum publié'
                      : preparationState === 'due' ? 'À commencer selon le plan'
                      : 'Préparation planifiée'}</dd>
        <dt>Produit</dt><dd>{starterPlan.protocol.label} · {starterPlan.productId}</dd>
        <dt>Inoculum prévu</dt><dd>{starterPlan.inoculum}</dd>
        <dt>Culture prévue</dt><dd>{fmt(starterPlan.volumeL)} L · SG cible {fmt(starterPlan.protocol.targetSg, 3)}</dd>
        <dt>Milieu</dt><dd>Extrait de malt · {starterPlan.protocol.method}</dd>
        <dt>Matériel</dt><dd>{starterPlan.equipment}</dd>
        <dt>Commencer</dt><dd>{brewDateTime(starterPlan.startAt)}</dd>
        <dt>Ensemencement cible</dt><dd>{brewDateTime(starterPlan.targetPitchAt)}</dd>
        {preparationExecution && <><dt>Inoculum prélevé</dt><dd>{preparationExecution.inoculumUsed ? `${fmt(preparationExecution.inoculumUsed.amount)} ${preparationExecution.inoculumUsed.unit} · ${preparationExecution.inoculumUsed.stockItemRef ?? 'article à associer'}` : 'Non consigné'}</dd>
          <dt>Stock inoculum</dt><dd>{preparationExecution.inoculumUsed?.inventoryAdjustedAt != null || preparationExecution.stockRegularization?.some(entry => entry.kind === 'inoculum') ? 'Comptage régularisé' : 'À régulariser'}</dd>
          <dt>Stock milieu</dt><dd>{preparationExecution.stockRegularization?.some(entry => entry.kind === 'medium') ? 'Comptage régularisé' : 'À régulariser'}</dd></>}
        {preparationExecution?.status === 'transferred' && <><dt>Volume transféré</dt><dd>{preparationExecution.cultureVolumeL != null ? `${fmt(preparationExecution.cultureVolumeL)} L relevés` : 'Non relevé'}</dd></>}
      </dl>
      <ol className="space-y-1 yeast-small">{starterPlan.steps.map(step => {
        const recorded = preparationExecution?.steps.find(done => done.id === step.id);
        return <li key={step.id}>{recorded ? '✓ ' : '· '}{step.label}<span className="block text-cave-400">{recorded ? `Consignée le ${brewDateTime(recorded.at)}` : `Prévue le ${brewDateTime(step.dueAt)}`}</span></li>;
      })}</ol>
      <p className="yeast-small">Cellules obtenues : inconnues sans mesure ou modèle de croissance applicable. Le starter ne garantit pas la couverture d’un déficit.</p>
      <p className="yeast-small">Le volume transféré ne décrit pas l’inoculum prélevé. L’inoculum et le milieu se régularisent dans le dossier du brassin.</p>
      <p className="yeast-small">{/^https:\/\//i.test(starterPlan.protocol.source.url) ? <a className="yeast-source" href={starterPlan.protocol.source.url} target="_blank" rel="noreferrer">Source · {starterPlan.protocol.source.title} · source relevée le {starterPlan.protocol.source.checkedAt}</a> : `Source · ${starterPlan.protocol.source.title}`}</p>
      {starterPlan.note && <p className="yeast-small">Note · {starterPlan.note}</p>}
    </section>}
    {phase === 'finish' && !starterPlan && starterProtocol && <p className="yeast-small">Méthode documentée : {starterProtocol.label}. Aucun plan de préparation n’est enregistré dans ce brassin ; aucune préparation de starter n’est proposée au jour J.</p>}
    {phase === 'finish' && <>
      {quantityEntry && <fieldset className="rounded-control border border-cave-800 p-2 space-y-2">
        <legend className="px-1 text-sm font-semibold text-cave-50">Quantité réellement ajoutée</legend>
        <p className="yeast-small">Dose prévue du brassin : {guide.quantity}. Elle ne devient réelle qu’après un choix explicite.</p>
        {!pitchQuantityMode && <p data-notice className="yeast-notice">Choisis une quantité mesurée, la dose prévue effectivement ajoutée, ou une confirmation sans mesure.</p>}
        <label className="flex min-h-touch items-start gap-2 text-sm text-cave-50">
          <input type="radio" name="yeast-pitch-quantity-mode" value="measured" checked={pitchQuantityMode === 'measured'} onChange={() => onPitchQuantityModeChange?.('measured')} />
          <span className="flex-1">Quantité mesurée</span>
        </label>
        {pitchQuantityMode === 'measured' && <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 items-end">
          <label className="block space-y-1 text-xs text-cave-400">Quantité réellement ajoutée
            <NumberInput aria-label="Quantité de levure réellement ajoutée" value={pitchQuantityAmount} onValue={value => onPitchQuantityAmountChange?.(value)} min={0} max={100000} emptyValue={undefined} placeholder="Mesure" />
          </label>
          <label className="block space-y-1 text-xs text-cave-400">Unité
            <select aria-label="Unité de la quantité réelle de levure" value={pitchQuantityUnit ?? ''} onChange={event => onPitchQuantityUnitChange?.(event.target.value)} className="min-h-touch rounded-control border border-cave-700 bg-cave-900 px-2 text-sm text-cave-50">
              <option value="">À choisir</option>{Array.from(new Set(['g', 'kg', 'mL', 'L', 'sachet', 'flacon', 'paquet', ...(recipe.yeast.unit ? [recipe.yeast.unit] : [])])).map(unit => <option key={unit} value={unit}>{unit}</option>)}
            </select>
          </label>
        </div>}
        {Number.isFinite(pitchQuantityAmount) && pitchQuantityAmount! <= 0 && pitchQuantityMode === 'measured' && <p role="alert" className="yeast-notice">Zéro signifie qu’aucune levure n’a été ajoutée. Corrige la quantité ou choisis une autre confirmation.</p>}
        {typeof recipe.yeast.qty === 'number' && recipe.yeast.qty > 0 && !!recipe.yeast.unit && <label className="flex min-h-touch items-start gap-2 text-sm text-cave-50">
          <input type="radio" name="yeast-pitch-quantity-mode" value="planned" checked={pitchQuantityMode === 'planned'} onChange={() => onPitchQuantityModeChange?.('planned')} />
          <span className="flex-1">Quantité prévue effectivement ajoutée · {fmt(recipe.yeast.qty, 20)} {recipe.yeast.unit}</span>
        </label>}
        <label className="flex min-h-touch items-start gap-2 text-sm text-cave-50">
          <input type="radio" name="yeast-pitch-quantity-mode" value="unmeasured" checked={pitchQuantityMode === 'unmeasured'} onChange={() => onPitchQuantityModeChange?.('unmeasured')} />
          <span className="flex-1">Ajout confirmé, quantité non mesurée</span>
        </label>
        {canTransferStarter && <>
          <label className="flex min-h-touch items-start gap-2 text-sm text-cave-50">
            <input type="radio" name="yeast-pitch-quantity-mode" value="starter-transferred" checked={pitchQuantityMode === 'starter-transferred'} onChange={() => onPitchQuantityModeChange?.('starter-transferred')} />
            <span className="flex-1">Culture du starter effectivement transférée</span>
          </label>
        {pitchQuantityMode === 'starter-transferred' && <label className="block space-y-1 text-xs text-cave-400">Volume réellement transféré · L, facultatif
            <NumberInput aria-label="Volume de starter réellement transféré" value={pitchQuantityAmount} onValue={value => onPitchQuantityAmountChange?.(value)} min={0} max={100000} emptyValue={undefined} placeholder="Non relevé" />
        </label>}
          {pitchQuantityMode === 'starter-transferred' && Number.isFinite(pitchQuantityAmount) && pitchQuantityAmount! <= 0 && <p role="alert" className="yeast-notice">Un volume nul signifie qu’aucune culture n’a été transférée. Corrige ou efface le relevé.</p>}
        </>}
        {pitchQuantityMode === 'unmeasured' && <p className="text-xs text-cave-400">L’ajout sera consigné sans quantité. La consommation de stock restera à régulariser ; la dose prévue ne sera pas déduite comme une mesure.</p>}
      </fieldset>}
      <dl className="yeast-brew-readings" aria-label="Relevés du moût refroidi">
        {(['temperature', 'densite', 'volume'] as const).map(kind => {
          const reading = guide.measured[kind === 'densite' ? 'gravity' : kind];
          const label = kind === 'temperature' ? 'Température' : kind === 'densite' ? 'Densité' : 'Volume en cuve';
          return <div key={kind}><dt>{label}</dt><dd>{reading ? `${fmt(reading.value, kind === 'densite' ? 3 : 1)} ${reading.unit}` : 'Non relevé'}</dd>{onMeasure && <button type="button" onClick={() => onMeasure(kind)} aria-label={`Relever ${label.toLocaleLowerCase('fr')}`}>Relever</button>}</div>;
        })}
      </dl>
      {guide.observedDoseG && <p className="text-[13px]">Repère fabricant pour {fmt(guide.measured.volume?.value)} L relevés : {fmt(guide.observedDoseG.range.min)}–{fmt(guide.observedDoseG.range.max)} g. Quantité prévue : {guide.quantity}.</p>}
    </>}
    <details><summary>Programme, ajouts à cru et sources</summary><div>
      <FermentationTemperatureChart compact steps={recipe.fermentation ?? []} pitchTempC={recipe.yeast.pitchTempC} />
      {guide.hops.additions.length > 0 && <table className="yeast-contacts"><caption>Ajouts prévus dans le brassin</caption><thead><tr><th>Houblon</th><th>Phase</th><th>Contact</th></tr></thead><tbody>{guide.hops.additions.map((h, i) => <tr key={i}><th scope="row">{h.name}<span className="block yeast-small">{h.dayOffset == null ? 'Jour à préciser' : `J+${fmt(h.dayOffset)}`} · {Units.format(h.weightG, 'g')}</span></th><td>{h.phase === 'active' ? 'Active' : h.phase === 'post' ? 'Après fermentation' : 'À préciser'}</td><td>{fmt(h.contactHours)} h · {fmt(h.temperatureC)} °C</td></tr>)}</tbody></table>}
      <p className="yeast-small">Consignes prévues. Les relevés et les ajouts réels restent dans le journal.</p>
      {guide.sources.map((s, i) => <p key={i} className="yeast-small">{/^https?:\/\//.test(s.reference) ? <a className="yeast-source" href={s.reference} target="_blank" rel="noreferrer">{s.author} · {s.title}</a> : `${s.author} · ${s.title}`}</p>)}
    </div></details>
    {(phase === 'preparation' || phase === 'finish' || phase === 'recipe') && <YeastStrainDetails information={guide.strainInformation} />}
  </>;
  if (collapsible) return <BrewAide title={`Levure · ${guide.name}`} summary={guide.goal ?? 'conduite prévue'}>{body}</BrewAide>;
  return <aside className="yeast-workbench yeast-brew-guide" aria-label="Conduite de levure du brassin">
    <div><h3 className="font-semibold text-cave-50">Levure · {guide.goal ?? 'conduite prévue'}</h3><p className="yeast-small">{guide.name} · recette du brassin</p></div>
    {body}
  </aside>;
}
